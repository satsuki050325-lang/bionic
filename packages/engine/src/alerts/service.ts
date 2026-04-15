import { supabase } from '../lib/supabase.js'
import { createAction, completeAction, failAction } from '../actions/logAction.js'

export interface ResolveAlertParams {
  alertId: string
  resolvedBy: string
  reason?: string
  projectId: string
}

export interface ResolveAlertResult {
  resolved: boolean
  alertId: string
  error?: string
}

export async function resolveAlert(
  params: ResolveAlertParams
): Promise<ResolveAlertResult> {
  const now = new Date().toISOString()

  const actionId = await createAction({
    projectId: params.projectId,
    alertId: params.alertId,
    type: 'resolve_alert',
    mode: 'automatic',
    title: `Alert resolved by ${params.resolvedBy}`,
    reason: params.reason,
    input: { resolvedBy: params.resolvedBy, reason: params.reason ?? null },
    requestedBy: params.resolvedBy,
  })

  const { data, error } = await supabase
    .from('engine_alerts')
    .update({
      status: 'resolved',
      resolved_at: now,
      resolved_by: params.resolvedBy,
      resolved_reason: params.reason ?? null,
      updated_at: now,
    })
    .eq('id', params.alertId)
    .eq('status', 'open')
    .select('id')

  if (error) {
    console.error('[alerts/service] resolveAlert failed:', error)
    if (actionId) {
      await failAction(actionId, { message: 'update failed', code: error.code })
    }
    return { resolved: false, alertId: params.alertId, error: error.message }
  }

  if (!data || data.length === 0) {
    if (actionId) {
      await failAction(actionId, { message: 'alert not found or already resolved' })
    }
    return {
      resolved: false,
      alertId: params.alertId,
      error: 'alert not found or already resolved',
    }
  }

  if (actionId) {
    await completeAction(actionId, {
      alertId: params.alertId,
      resolvedBy: params.resolvedBy,
    })
  }

  console.log(`[alerts/service] resolved: ${params.alertId} by ${params.resolvedBy}`)
  return { resolved: true, alertId: params.alertId }
}

/**
 * Auto-resolve open service_health alerts for a service.
 * Returns true when every matching alert was resolved (or there were none).
 * Returns false when the select errored or any resolveAlert call failed, so
 * callers can treat a partial failure as a retryable condition.
 */
export async function autoResolveHealthAlerts(
  projectId: string,
  serviceId: string,
  fingerprint?: string
): Promise<boolean> {
  let query = supabase
    .from('engine_alerts')
    .select('id')
    .eq('project_id', projectId)
    .eq('service_id', serviceId)
    .eq('type', 'service_health')
    .eq('status', 'open')

  if (fingerprint) {
    query = query.eq('fingerprint', fingerprint)
  }

  const { data: openAlerts, error } = await query

  if (error) {
    console.error('[alerts/service] autoResolveHealthAlerts select failed:', error)
    return false
  }

  if (!openAlerts || openAlerts.length === 0) return true

  let ok = true
  for (const alert of openAlerts) {
    const result = await resolveAlert({
      alertId: alert.id,
      resolvedBy: 'engine',
      reason: 'health_ok_event',
      projectId,
    })
    if (!result.resolved) ok = false
  }
  return ok
}
