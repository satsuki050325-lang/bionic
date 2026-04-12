import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { getConfig, redactConfig } from '../config.js'
import { getRunnerStates } from '../runtime/diagnostics.js'

export const diagnosticsRouter = Router()

const ENGINE_VERSION = '0.1.0'
const startedAt = new Date().toISOString()

diagnosticsRouter.get('/', async (_req, res) => {
  const config = getConfig()
  const now = new Date()
  const uptimeSeconds = Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000)

  let dbOk = false
  let dbError: string | null = null
  try {
    const { error } = await supabase
      .from('engine_jobs')
      .select('id', { count: 'exact', head: true })
    dbOk = !error
    dbError = error?.message ?? null
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'unknown error'
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const [
    { count: pendingJobs },
    { count: runningJobs },
    { count: needsReviewJobs },
    { count: failedRecentJobs },
    { data: oldestPending },
  ] = await Promise.all([
    supabase.from('engine_jobs').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('engine_jobs').select('*', { count: 'exact', head: true }).eq('status', 'running'),
    supabase.from('engine_jobs').select('*', { count: 'exact', head: true }).eq('status', 'needs_review'),
    supabase.from('engine_jobs').select('*', { count: 'exact', head: true })
      .eq('status', 'failed').gte('created_at', twentyFourHoursAgo),
    supabase.from('engine_jobs').select('created_at')
      .eq('status', 'pending').order('created_at', { ascending: true }).limit(1),
  ])

  const [
    { count: pendingApproval },
    { count: approvedActions },
    { count: runningActions },
    { count: failedRecentActions },
    { count: staleApproval24h },
    { count: autoCancelDue48h },
  ] = await Promise.all([
    supabase.from('engine_actions').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
    supabase.from('engine_actions').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('engine_actions').select('*', { count: 'exact', head: true }).eq('status', 'running'),
    supabase.from('engine_actions').select('*', { count: 'exact', head: true })
      .eq('status', 'failed').gte('created_at', twentyFourHoursAgo),
    supabase.from('engine_actions').select('*', { count: 'exact', head: true })
      .eq('status', 'pending_approval').lte('created_at', twentyFourHoursAgo),
    supabase.from('engine_actions').select('*', { count: 'exact', head: true })
      .eq('status', 'pending_approval').lte('created_at', fortyEightHoursAgo),
  ])

  const { count: openCritical } = await supabase
    .from('engine_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
    .eq('severity', 'critical')

  const { count: criticalReminderDue } = await supabase
    .from('engine_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
    .eq('severity', 'critical')
    .or(`last_notified_at.is.null,last_notified_at.lte.${thirtyMinutesAgo}`)

  const { count: watchingDeployments } = await supabase
    .from('deployments')
    .select('*', { count: 'exact', head: true })
    .eq('watch_status', 'watching')

  const { count: failedWatches } = await supabase
    .from('deployments')
    .select('*', { count: 'exact', head: true })
    .eq('watch_status', 'failed')

  const { data: latestDeployment } = await supabase
    .from('deployments')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)

  const { data: recentActions } = await supabase
    .from('engine_actions')
    .select('id, type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentDeployments } = await supabase
    .from('deployments')
    .select('id, project_id, watch_status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const runnerStates = getRunnerStates()

  const diagnostics = {
    engine: {
      status: dbOk ? 'running' : 'degraded',
      version: ENGINE_VERSION,
      startedAt,
      uptimeSeconds,
    },
    config: redactConfig(config),
    db: {
      ok: dbOk,
      checkedAt: now.toISOString(),
      error: dbError,
    },
    scheduler: {
      enabled: config.scheduler.enabled,
      digestCron: config.scheduler.digestCron,
      digestTimezone: config.scheduler.digestTimezone,
      runners: Object.entries(runnerStates).map(([name, state]) => ({
        name,
        ...state,
      })),
    },
    queue: {
      jobs: {
        pending: pendingJobs ?? 0,
        running: runningJobs ?? 0,
        needsReview: needsReviewJobs ?? 0,
        failedRecent: failedRecentJobs ?? 0,
        oldestPendingCreatedAt: oldestPending?.[0]?.created_at ?? null,
      },
      actions: {
        pendingApproval: pendingApproval ?? 0,
        approved: approvedActions ?? 0,
        running: runningActions ?? 0,
        failedRecent: failedRecentActions ?? 0,
        staleApproval24h: staleApproval24h ?? 0,
        autoCancelDue48h: autoCancelDue48h ?? 0,
      },
    },
    integrations: {
      discord: {
        mode: config.discord.mode,
        channelConfigured: !!config.discord.channelId,
        approversConfigured: config.discord.approverIds.length > 0,
      },
      vercel: {
        webhookSecretConfigured: !!config.vercel.webhookSecret,
        mappedProjects: config.vercel.projectMap.size,
        watchingDeployments: watchingDeployments ?? 0,
        failedWatches: failedWatches ?? 0,
        latestDeploymentAt: latestDeployment?.[0]?.created_at ?? null,
      },
    },
    alerts: {
      openCritical: openCritical ?? 0,
      criticalReminderDue: criticalReminderDue ?? 0,
    },
    recent: {
      actions: (recentActions ?? []).map((a) => ({
        id: a.id,
        type: a.type,
        status: a.status,
        createdAt: a.created_at,
      })),
      deployments: (recentDeployments ?? []).map((d) => ({
        id: d.id,
        serviceId: d.project_id,
        watchStatus: d.watch_status,
        createdAt: d.created_at,
      })),
    },
  }

  res.json(diagnostics)
})
