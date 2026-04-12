import cron from 'node-cron'
import { DateTime } from 'luxon'
import { enqueueResearchDigestJob, getWeeklyDigestKey } from '../jobs/researchDigest.js'
import { runJob } from '../jobs/runner.js'
import { supabase } from '../lib/supabase.js'
import { validateCronExpression } from './cron.js'
import { evaluateWatchingDeployments } from '../decisions/deploymentWatch.js'

const ALLOWED_TIMEZONES = new Set([
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Amsterdam',
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Pacific/Auckland',
])

function getConfig() {
  const cronExpression = process.env.BIONIC_DIGEST_CRON ?? '0 9 * * 1'
  const timezone = process.env.BIONIC_DIGEST_TIMEZONE ?? 'Asia/Tokyo'
  const projectId = process.env.BIONIC_PROJECT_ID ?? 'project_bionic'

  if (!validateCronExpression(cronExpression)) {
    console.error(
      `[scheduler] invalid BIONIC_DIGEST_CRON: "${cronExpression}". ` +
      `Must be "minute hour * * dayOfWeek" format. Using default.`
    )
    return {
      enabled: process.env.BIONIC_SCHEDULER_ENABLED === 'true',
      cronExpression: '0 9 * * 1',
      timezone: 'Asia/Tokyo',
      projectId: 'project_bionic',
    }
  }

  if (!ALLOWED_TIMEZONES.has(timezone)) {
    console.error(
      `[scheduler] invalid BIONIC_DIGEST_TIMEZONE: "${timezone}". ` +
      `Allowed: ${[...ALLOWED_TIMEZONES].join(', ')}. Using default.`
    )
    return {
      enabled: process.env.BIONIC_SCHEDULER_ENABLED === 'true',
      cronExpression,
      timezone: 'Asia/Tokyo',
      projectId: 'project_bionic',
    }
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
    console.error(
      `[scheduler] invalid BIONIC_PROJECT_ID: "${projectId}". ` +
      `Only alphanumeric, hyphen, underscore allowed. Using default.`
    )
    return {
      enabled: process.env.BIONIC_SCHEDULER_ENABLED === 'true',
      cronExpression,
      timezone,
      projectId: 'project_bionic',
    }
  }

  return {
    enabled: process.env.BIONIC_SCHEDULER_ENABLED === 'true',
    cronExpression,
    timezone,
    projectId,
  }
}

function getScheduledTimeThisWeek(
  cronExpression: string,
  timezone: string
): DateTime | null {
  const parts = cronExpression.trim().split(/\s+/)
  if (parts.length !== 5) return null

  const minute = parseInt(parts[0], 10)
  const hour = parseInt(parts[1], 10)
  const dowTarget = parseInt(parts[4], 10) // 0=日, 1=月, ..., 6=土

  const nowInTz = DateTime.now().setZone(timezone)

  // luxonはweekday 1=月, 7=日。cron式は0=日, 1=月
  const luxonDow = dowTarget === 0 ? 7 : dowTarget

  // 今週の指定曜日の日付を取得する
  const currentLuxonDow = nowInTz.weekday
  let diffDays = currentLuxonDow - luxonDow
  if (diffDays < 0) diffDays += 7

  const targetDate = nowInTz.minus({ days: diffDays }).startOf('day').set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  })

  return targetDate
}

async function triggerWeeklyDigest(overrideDedupeKey?: string): Promise<void> {
  const config = getConfig()
  const dedupeKey = overrideDedupeKey ?? getWeeklyDigestKey(new Date(), config.timezone)

  const result = await enqueueResearchDigestJob({
    projectId: config.projectId,
    requestedBy: 'scheduler',
    dedupeKey,
  })

  if (result.created && result.jobId) {
    void runJob(result.jobId, 'research_digest', config.projectId)
  }
}

async function catchUpMissedSchedules(): Promise<void> {
  const config = getConfig()
  const nowInTz = DateTime.now().setZone(config.timezone)

  const scheduledTime = getScheduledTimeThisWeek(
    config.cronExpression,
    config.timezone
  )

  if (!scheduledTime) {
    console.warn('[scheduler] could not parse cron expression for catch-up')
    return
  }

  if (nowInTz < scheduledTime) {
    console.log(
      `[scheduler] catch-up skipped: scheduled time not yet reached ` +
      `(${scheduledTime.toISO()} ${config.timezone})`
    )
    return
  }

  const dedupeKey = getWeeklyDigestKey(scheduledTime.toJSDate(), config.timezone)
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
    await triggerWeeklyDigest(dedupeKey)
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

  // catch-up: Engine起動時に今週分が未実行かつ予定時刻を過ぎている場合のみ実行する
  void catchUpMissedSchedules()

  // weekly digest cron
  cron.schedule(config.cronExpression, async () => {
    console.log('[scheduler] cron triggered: weekly digest')
    await triggerWeeklyDigest()
  }, {
    timezone: config.timezone,
  })

  cron.schedule('*/5 * * * *', async () => {
    console.log('[scheduler] deployment watch check')
    await evaluateWatchingDeployments()
  })

  console.log('[scheduler] started.')
}
