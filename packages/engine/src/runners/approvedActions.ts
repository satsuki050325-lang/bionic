import { supabase } from '../lib/supabase.js'
import { transitionActionStatus } from '../actions/state.js'
import { enqueueResearchDigestJob } from '../jobs/researchDigest.js'
import { runJob } from '../jobs/runner.js'

export async function runApprovedActions(): Promise<void> {
  const { data: actions, error } = await supabase
    .from('engine_actions')
    .select('*')
    .eq('status', 'approved')
    .eq('type', 'retry_job')
    .order('approved_at', { ascending: true })
    .limit(10)

  if (error) {
    console.error('[runners/approvedActions] failed to fetch approved actions:', error)
    return
  }

  for (const row of actions ?? []) {
    const actionId = row['id'] as string
    const input = (row['input'] ?? {}) as Record<string, unknown>
    const retryType = input['retryType'] as string | undefined
    const originalJobId = input['jobId'] as string | undefined

    if (retryType !== 'research_digest') {
      console.warn(`[runners/approvedActions] unknown retryType: ${retryType}`)
      continue
    }

    const claimResult = await transitionActionStatus(
      actionId,
      { to: 'running' },
      { from: ['approved'] }
    )
    if (!claimResult.ok) continue

    try {
      const result = await enqueueResearchDigestJob({
        projectId: row['project_id'] as string,
        requestedBy: 'engine',
        dedupeKey: undefined,
      })

      if (!result.created || !result.jobId) {
        await transitionActionStatus(actionId, {
          to: 'failed',
          error: { reason: 'failed to enqueue retry job' },
        })
        continue
      }

      void runJob(result.jobId, 'research_digest', row['project_id'] as string)

      if (originalJobId) {
        await supabase
          .from('engine_jobs')
          .update({ resolution_reason: `retried as ${result.jobId}` })
          .eq('id', originalJobId)
      }

      await transitionActionStatus(actionId, {
        to: 'succeeded',
        result: { newJobId: result.jobId, originalJobId },
      })
    } catch (err) {
      console.error('[runners/approvedActions] error:', err)
      await transitionActionStatus(actionId, {
        to: 'failed',
        error: { message: err instanceof Error ? err.message : String(err) },
      })
    }
  }
}
