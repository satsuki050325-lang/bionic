import { supabase } from '../lib/supabase.js'

export async function markJobRunning(jobId: string): Promise<void> {
  const { error } = await supabase
    .from('engine_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', jobId)
  if (error) console.error('[jobs/repository] markJobRunning failed:', error)
}

export async function markJobCompleted(jobId: string): Promise<void> {
  const { error } = await supabase
    .from('engine_jobs')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', jobId)
  if (error) console.error('[jobs/repository] markJobCompleted failed:', error)
}

export async function markJobFailed(jobId: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from('engine_jobs')
    .update({
      status: 'failed',
      resolution_reason: reason ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
  if (error) console.error('[jobs/repository] markJobFailed failed:', error)
}

export async function markJobNeedsReview(jobId: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from('engine_jobs')
    .update({
      status: 'needs_review',
      resolution_reason: reason ?? null,
    })
    .eq('id', jobId)
  if (error) console.error('[jobs/repository] markJobNeedsReview failed:', error)
}
