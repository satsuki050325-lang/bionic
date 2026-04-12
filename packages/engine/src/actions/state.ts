import { supabase } from '../lib/supabase.js'

export type ActionTransition =
  | { to: 'running' }
  | { to: 'succeeded'; result?: Record<string, unknown> }
  | { to: 'failed'; error: Record<string, unknown> }
  | { to: 'skipped'; reason: string }
  | { to: 'pending_approval' }
  | { to: 'approved'; actorId: string }
  | { to: 'denied'; actorId: string }
  | { to: 'cancelled'; reason: string }

export async function transitionActionStatus(
  actionId: string,
  transition: ActionTransition,
  options?: { from?: string[] }
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const now = new Date().toISOString()

  const updateData: Record<string, unknown> = {
    status: transition.to,
    updated_at: now,
  }

  if (transition.to === 'running') {
    updateData['started_at'] = now
  }
  if (
    transition.to === 'succeeded' ||
    transition.to === 'failed' ||
    transition.to === 'skipped' ||
    transition.to === 'cancelled' ||
    transition.to === 'denied'
  ) {
    updateData['completed_at'] = now
  }
  if (transition.to === 'succeeded' && 'result' in transition) {
    updateData['result'] = transition.result ?? {}
  }
  if (transition.to === 'failed' && 'error' in transition) {
    updateData['error'] = transition.error
  }
  if (
    (transition.to === 'skipped' || transition.to === 'cancelled') &&
    'reason' in transition
  ) {
    updateData['result'] = { reason: transition.reason }
  }
  if (transition.to === 'approved') {
    updateData['approved_by'] = transition.actorId
    updateData['approved_at'] = now
  }
  if (transition.to === 'denied') {
    updateData['denied_by'] = transition.actorId
    updateData['denied_at'] = now
  }

  let query = supabase
    .from('engine_actions')
    .update(updateData)
    .eq('id', actionId)

  if (options?.from && options.from.length > 0) {
    query = query.in('status', options.from)
  }

  const { data, error } = await query.select('id')

  if (error) {
    console.error('[actions/state] transition failed:', error)
    return { ok: false, reason: error.message }
  }

  if (!data || data.length === 0) {
    return { ok: false, reason: `action ${actionId} not found or status condition not met` }
  }

  return { ok: true }
}
