import type { EngineEvent } from '@bionic/shared'
import { supabase } from '../lib/supabase.js'
import { createAction, completeAction, failAction, skipAction } from '../actions/logAction.js'

const CRITICAL_CODES = new Set([
  'DB_CONNECTION_FAILED',
  'DB_ERROR',
  'PAYMENT_FAILED',
  'AUTH_ERROR',
  'SERVER_ERROR',
  'INTERNAL_ERROR',
])

function buildFingerprint(
  projectId: string,
  serviceId: string,
  alertType: string,
  problemKey: string
): string {
  const normalized = problemKey
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80)
    .toUpperCase()
  return `${projectId}:${serviceId}:${alertType}:${normalized}`
}

function getSeverityForError(code?: string): 'critical' | 'warning' {
  if (code && CRITICAL_CODES.has(code.toUpperCase())) return 'critical'
  return 'warning'
}

export async function evaluateAlertForEvent(event: EngineEvent): Promise<void> {
  if (
    event.type !== 'service.health.degraded' &&
    event.type !== 'service.error.reported'
  ) {
    return
  }

  let alertType: 'service_health' | 'service_error'
  let severity: 'critical' | 'warning'
  let title: string
  let message: string
  let fingerprint: string

  const payload = event.payload as Record<string, unknown>

  if (event.type === 'service.health.degraded') {
    const status = (payload.status as string) ?? 'degraded'
    const latencyMs = payload.latencyMs as number | undefined

    alertType = 'service_health'
    severity = status === 'down' ? 'critical' : 'warning'
    title = `${event.serviceId} health degraded`
    message = latencyMs
      ? `${event.serviceId} is ${status}. latencyMs=${latencyMs}`
      : `${event.serviceId} is ${status}.`
    fingerprint = buildFingerprint(
      event.projectId,
      event.serviceId,
      'service_health',
      status
    )
  } else {
    const code = payload.code as string | undefined
    const msg = (payload.message as string) ?? 'unknown error'

    alertType = 'service_error'
    severity = getSeverityForError(code)
    title = `${event.serviceId} error reported`
    message = code ? `[${code}] ${msg}` : msg
    fingerprint = buildFingerprint(
      event.projectId,
      event.serviceId,
      'service_error',
      code ?? msg
    )
  }

  const actionId = await createAction({
    projectId: event.projectId,
    serviceId: event.serviceId,
    eventId: event.id,
    type: 'create_alert',
    title: `Evaluate alert for ${event.type}`,
    input: { eventType: event.type, fingerprint },
    requestedBy: 'engine',
  })

  try {
    // Step 1: selectでopen alertを確認する
    const { data: existing, error: selectError } = await supabase
      .from('engine_alerts')
      .select('id, count')
      .eq('fingerprint', fingerprint)
      .eq('status', 'open')
      .maybeSingle()

    if (selectError) {
      console.error('[decision] failed to select alert:', selectError)
      if (actionId) {
        await failAction(actionId, { message: 'select failed', code: selectError.code })
      }
      return
    }

    if (existing) {
      // Step 2a: 存在する場合はupdateする
      const { error: updateError } = await supabase
        .from('engine_alerts')
        .update({
          message,
          severity,
          last_seen_at: new Date().toISOString(),
          count: (existing.count ?? 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('[decision] failed to update alert:', updateError)
        if (actionId) {
          await failAction(actionId, { message: 'update failed', code: updateError.code })
        }
      } else if (actionId) {
        await completeAction(actionId, {
          operation: 'updated',
          alertId: existing.id,
          newCount: (existing.count ?? 1) + 1,
        })
      }
    } else {
      // Step 2b: 存在しない場合はinsertする
      const { data: inserted, error: insertError } = await supabase
        .from('engine_alerts')
        .insert({
          project_id: event.projectId,
          service_id: event.serviceId,
          type: alertType,
          severity,
          title,
          message,
          status: 'open',
          fingerprint,
          count: 1,
          last_seen_at: new Date().toISOString(),
        })
        .select('id')
        .maybeSingle()

      if (insertError) {
        if (insertError.code === '23505') {
          console.warn('[decision] alert already created by concurrent process, skipping:', fingerprint)
          if (actionId) {
            await skipAction(actionId, 'race condition: duplicate insert skipped')
          }
        } else {
          console.error('[decision] failed to insert alert:', insertError)
          if (actionId) {
            await failAction(actionId, { message: 'insert failed', code: insertError.code })
          }
        }
      } else if (actionId) {
        await completeAction(actionId, {
          operation: 'created',
          alertId: inserted?.id ?? null,
        })
      }
    }
  } catch (err) {
    console.error('[decision] failed to evaluate alert:', err)
    if (actionId) {
      await failAction(actionId, { message: String(err) })
    }
  }
}
