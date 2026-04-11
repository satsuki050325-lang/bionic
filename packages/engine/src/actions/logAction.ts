import { supabase } from '../lib/supabase.js'
import type { ActionType, ActionMode } from '@bionic/shared'

interface CreateActionParams {
  projectId: string
  serviceId?: string
  eventId?: string
  alertId?: string
  jobId?: string
  type: ActionType
  mode?: ActionMode
  title: string
  reason?: string
  input?: Record<string, unknown>
  requestedBy?: string
}

export async function createAction(params: CreateActionParams): Promise<string | null> {
  const { data, error } = await supabase
    .from('engine_actions')
    .insert({
      project_id: params.projectId,
      service_id: params.serviceId ?? null,
      event_id: params.eventId ?? null,
      alert_id: params.alertId ?? null,
      job_id: params.jobId ?? null,
      type: params.type,
      mode: params.mode ?? 'automatic',
      status: 'running',
      title: params.title,
      reason: params.reason ?? null,
      input: params.input ?? {},
      requested_by: params.requestedBy ?? 'engine',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[logAction] failed to create action:', error)
    return null
  }

  return data.id
}

export async function completeAction(
  actionId: string,
  result: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('engine_actions')
    .update({
      status: 'succeeded',
      result,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', actionId)

  if (error) {
    console.error('[logAction] failed to complete action:', error)
  }
}

export async function failAction(
  actionId: string,
  error: Record<string, unknown>
): Promise<void> {
  const { error: dbError } = await supabase
    .from('engine_actions')
    .update({
      status: 'failed',
      error,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', actionId)

  if (dbError) {
    console.error('[logAction] failed to fail action:', dbError)
  }
}

export async function skipAction(
  actionId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('engine_actions')
    .update({
      status: 'skipped',
      result: { reason },
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', actionId)

  if (error) {
    console.error('[logAction] failed to skip action:', error)
  }
}
