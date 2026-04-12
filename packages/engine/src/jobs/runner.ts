import { supabase } from '../lib/supabase.js'
import { transitionJobStatus } from './state.js'
import { runResearchDigest } from './researchDigest.js'

export async function runJob(
  jobId: string,
  type: string,
  projectId: string
): Promise<void> {
  console.log(`[jobs/runner] running job: ${type} (${jobId})`)

  switch (type) {
    case 'research_digest':
      await runResearchDigest(jobId, projectId)
      break
    default:
      console.warn(`[jobs/runner] unknown job type: ${type}`)
  }
}

interface PendingJob {
  id: string
  type: string
  project_id: string
}

export async function claimPendingJob(): Promise<PendingJob | null> {
  const { data, error } = await supabase
    .from('engine_jobs')
    .select('id, type, project_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const result = await transitionJobStatus(data.id, { to: 'running' }, { from: ['pending'] })
  if (!result.ok) {
    return null
  }

  return data
}

export async function runPendingJobs(limit = 5): Promise<void> {
  for (let i = 0; i < limit; i++) {
    const job = await claimPendingJob()
    if (!job) break
    await runJob(job.id, job.type, job.project_id)
  }
}
