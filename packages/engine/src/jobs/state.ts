import { supabase } from '../lib/supabase.js'

export type JobTransition =
  | { to: 'running' }
  | { to: 'completed' }
  | { to: 'failed'; reason: string }
  | { to: 'needs_review'; reason: string }
  | { to: 'cancelled'; reason: string }
  | { to: 'pending' }

export async function transitionJobStatus(
  jobId: string,
  transition: JobTransition,
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
    transition.to === 'completed' ||
    transition.to === 'failed' ||
    transition.to === 'cancelled'
  ) {
    updateData['completed_at'] = now
  }
  if (
    (transition.to === 'failed' ||
      transition.to === 'needs_review' ||
      transition.to === 'cancelled') &&
    'reason' in transition
  ) {
    updateData['resolution_reason'] = transition.reason
  }

  let query = supabase
    .from('engine_jobs')
    .update(updateData)
    .eq('id', jobId)

  if (options?.from && options.from.length > 0) {
    query = query.in('status', options.from)
  }

  const { data, error } = await query.select('id')

  if (error) {
    console.error('[jobs/state] transition failed:', error)
    return { ok: false, reason: error.message }
  }

  if (!data || data.length === 0) {
    return { ok: false, reason: `job ${jobId} not found or status condition not met` }
  }

  return { ok: true }
}
