import cron from 'node-cron'
import { DateTime } from 'luxon'
import { enqueueResearchDigestJob, getWeeklyDigestKey } from '../jobs/researchDigest.js'
import { runPendingJobs } from '../jobs/runner.js'
import { supabase } from '../lib/supabase.js'
import { evaluateWatchingDeployments } from '../decisions/deploymentWatch.js'
import { getConfig } from '../config.js'
import { runStaleApprovalCheck } from '../runners/approvals.js'
import { runCriticalAlertReminders } from '../runners/alertReminders.js'
import { runApprovedActions } from '../runners/approvedActions.js'
import { runDueUptimeChecks } from '../uptime/runner.js'
import {
  recordRunnerStart,
  recordRunnerSuccess,
  recordRunnerError,
} from '../runtime/diagnostics.js'

interface SchedulerConfig {
  enabled: boolean
  cronExpression: string
  timezone: string
  projectId: string
}

function resolveSchedulerConfig(): SchedulerConfig {
  const config = getConfig()
  return {
    enabled: config.scheduler.enabled,
    cronExpression: config.scheduler.digestCron,
    timezone: config.scheduler.digestTimezone,
    projectId: config.projectId,
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
  const dowTarget = parseInt(parts[4], 10)

  const nowInTz = DateTime.now().setZone(timezone)

  const luxonDow = dowTarget === 0 ? 7 : dowTarget

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
  const config = resolveSchedulerConfig()
  const dedupeKey = overrideDedupeKey ?? getWeeklyDigestKey(new Date(), config.timezone)

  const result = await enqueueResearchDigestJob({
    projectId: config.projectId,
    requestedBy: 'scheduler',
    dedupeKey,
  })

  if (result.created) {
    console.log(`[scheduler] digest job enqueued: ${result.jobId}. runPendingJobs will pick it up.`)
  }
}

async function catchUpMissedSchedules(): Promise<void> {
  const config = resolveSchedulerConfig()
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
  const config = resolveSchedulerConfig()

  if (!config.enabled) {
    console.log('[scheduler] disabled. set BIONIC_SCHEDULER_ENABLED=true to enable.')
    return
  }

  console.log(
    `[scheduler] starting. cron="${config.cronExpression}" timezone="${config.timezone}"`
  )

  void catchUpMissedSchedules()

  cron.schedule(config.cronExpression, async () => {
    console.log('[scheduler] cron triggered: weekly digest')
    await triggerWeeklyDigest()
  }, {
    timezone: config.timezone,
  })

  cron.schedule('*/5 * * * *', async () => {
    recordRunnerStart('deployment_watch')
    try {
      console.log('[scheduler] deployment watch check')
      await evaluateWatchingDeployments()
      recordRunnerSuccess('deployment_watch')
    } catch (err) {
      recordRunnerError('deployment_watch', err instanceof Error ? err.message : String(err))
    }
  })

  cron.schedule('*/5 * * * *', async () => {
    recordRunnerStart('job_runner')
    try {
      await runPendingJobs(5)
      recordRunnerSuccess('job_runner')
    } catch (err) {
      recordRunnerError('job_runner', err instanceof Error ? err.message : String(err))
    }
  })

  cron.schedule('*/5 * * * *', async () => {
    recordRunnerStart('approved_actions')
    try {
      await runApprovedActions()
      recordRunnerSuccess('approved_actions')
    } catch (err) {
      recordRunnerError('approved_actions', err instanceof Error ? err.message : String(err))
    }
  })

  cron.schedule('*/15 * * * *', async () => {
    recordRunnerStart('stale_approvals')
    try {
      await runStaleApprovalCheck()
      recordRunnerSuccess('stale_approvals')
    } catch (err) {
      recordRunnerError('stale_approvals', err instanceof Error ? err.message : String(err))
    }
  })

  cron.schedule('* * * * *', async () => {
    recordRunnerStart('uptime_runner')
    try {
      await runDueUptimeChecks()
      recordRunnerSuccess('uptime_runner')
    } catch (err) {
      recordRunnerError('uptime_runner', err instanceof Error ? err.message : String(err))
    }
  })

  cron.schedule('*/10 * * * *', async () => {
    recordRunnerStart('critical_alert_reminders')
    try {
      await runCriticalAlertReminders()
      recordRunnerSuccess('critical_alert_reminders')
    } catch (err) {
      recordRunnerError('critical_alert_reminders', err instanceof Error ? err.message : String(err))
    }
  })

  console.log('[scheduler] started.')
}
