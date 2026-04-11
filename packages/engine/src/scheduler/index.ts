import cron from 'node-cron'
import { enqueueResearchDigestJob, getWeeklyDigestKey } from '../jobs/researchDigest.js'
import { runResearchDigest } from '../routes/jobs.js'
import { supabase } from '../lib/supabase.js'

const ALLOWED_TIMEZONES = new Set([
  'Asia/Tokyo',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Singapore',
  'Asia/Seoul',
  'Australia/Sydney',
])

function validateCronExpression(expr: string): boolean {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return false

  const [minute, hour, dom, month, dow] = parts

  const minuteNum = parseInt(minute, 10)
  const hourNum = parseInt(hour, 10)
  const dowNum = parseInt(dow, 10)

  if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) return false
  if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) return false
  if (dom !== '*') return false
  if (month !== '*') return false
  if (isNaN(dowNum) || dowNum < 0 || dowNum > 6) return false

  return true
}

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
): Date | null {
  const parts = cronExpression.trim().split(/\s+/)
  if (parts.length !== 5) return null

  const minute = parseInt(parts[0], 10)
  const hour = parseInt(parts[1], 10)
  const dayOfWeek = parseInt(parts[4], 10)

  if (isNaN(minute) || isNaN(hour) || isNaN(dayOfWeek)) return null
  if (minute < 0 || minute > 59) return null
  if (hour < 0 || hour > 23) return null
  if (dayOfWeek < 0 || dayOfWeek > 6) return null

  // timezone基準で今日の日付と曜日を取得する
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
  const fmtParts = formatter.formatToParts(now)
  const year = fmtParts.find((p) => p.type === 'year')?.value
  const month = fmtParts.find((p) => p.type === 'month')?.value
  const day = fmtParts.find((p) => p.type === 'day')?.value

  if (!year || !month || !day) return null

  const todayLocal = new Date(`${year}-${month}-${day}T00:00:00`)
  const todayDow = todayLocal.getDay()

  // 今週の該当曜日（過去方向に計算）
  let diffDays = todayDow - dayOfWeek
  if (diffDays < 0) diffDays += 7

  const targetDate = new Date(todayLocal)
  targetDate.setDate(todayLocal.getDate() - diffDays)

  // timezone基準でhour:minuteの予定時刻文字列を作成する
  const scheduledStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`

  return new Date(scheduledStr)
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

  const scheduledTime = getScheduledTimeThisWeek(
    config.cronExpression,
    config.timezone
  )

  if (!scheduledTime) {
    console.warn('[scheduler] could not parse cron expression for catch-up')
    return
  }

  if (now < scheduledTime) {
    console.log(
      `[scheduler] catch-up skipped: scheduled time not yet reached (${scheduledTime.toISOString()})`
    )
    return
  }

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

  // catch-up: Engine起動時に今週分が未実行かつ予定時刻を過ぎている場合のみ実行する
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
