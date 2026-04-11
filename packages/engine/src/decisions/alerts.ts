import type { EngineEvent } from '@bionic/shared'
import { supabase } from '../lib/supabase.js'

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

  try {
    const { data: existing } = await supabase
      .from('engine_alerts')
      .select('id, count')
      .eq('fingerprint', fingerprint)
      .eq('status', 'open')
      .maybeSingle()

    if (existing) {
      await supabase
        .from('engine_alerts')
        .update({
          message,
          severity,
          last_seen_at: new Date().toISOString(),
          count: (existing.count ?? 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('engine_alerts').insert({
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
    }
  } catch (err) {
    console.error('[decision] failed to evaluate alert:', err)
  }
}
