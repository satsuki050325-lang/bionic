import cron from 'node-cron'
import { enqueueResearchDigestJob, getWeeklyDigestKey } from '../jobs/researchDigest.js'
import { runResearchDigest } from '../routes/jobs.js'
import { supabase } from '../lib/supabase.js'

const DEFAULT_PROJECT_ID = 'project_bionic'

function getConfig() {
  return {
    enabled: process.env.BIONIC_SCHEDULER_ENABLED === 'true',
    cronExpression: process.env.BIONIC_DIGEST_CRON ?? '0 9 * * 1',
    timezone: process.env.BIONIC_DIGEST_TIMEZONE ?? 'Asia/Tokyo',
    projectId: process.env.BIONIC_PROJECT_ID ?? DEFAULT_PROJECT_ID,
  }
}

async function triggerWeeklyDigest(): Promise<void> {
  const config = getConfig()
  const dedupeKey = getWeeklyDigestKey(new Date(), config.timezone)

  const result = await enqueueResearchDigestJob({
    projectId: config.projectId,
    requestedBy: 'scheduler',
    dedupeKey,
  })

  if (result.created && result.jobId) {
    void runResearchDigest(result.jobId, config.projectId)
  }
}

async function catchUpMissedSchedules(): Promise<void> {
  const config = getConfig()
  const now = new Date()
  const dedupeKey = getWeeklyDigestKey(now, config.timezone)

  console.log(`[scheduler] checking for missed schedules: ${dedupeKey}`)

  const { data } = await supabase
    .from('engine_jobs')
    .select('id')
    .eq('project_id', config.projectId)
    .eq('type', 'research_digest')
    .eq('dedupe_key', dedupeKey)
    .maybeSingle()

  if (!data) {
    console.log(`[scheduler] missed schedule detected. running catch-up: ${dedupeKey}`)
    await triggerWeeklyDigest()
  } else {
    console.log(`[scheduler] no missed schedule: ${dedupeKey}`)
  }
}

export function startScheduler(): void {
  const config = getConfig()

  if (!config.enabled) {
    console.log('[scheduler] disabled. set BIONIC_SCHEDULER_ENABLED=true to enable.')
    return
  }

  console.log(
    `[scheduler] starting. cron="${config.cronExpression}" timezone="${config.timezone}"`
  )

  // catch-up: Engine起動時に今週分が未実行なら即時実行する
  void catchUpMissedSchedules()

  // weekly digest cron
  cron.schedule(config.cronExpression, async () => {
    console.log('[scheduler] cron triggered: weekly digest')
    await triggerWeeklyDigest()
  }, {
    timezone: config.timezone,
  })

  console.log('[scheduler] started.')
}
