import { Router } from 'express'
import type { ServiceStatus } from '@bionic/shared'
import { supabase } from '../lib/supabase.js'

export const statusRouter = Router()

const ENGINE_START_TIME = new Date().toISOString()

statusRouter.get('/', async (_req, res) => {
  const [jobsResult, alertsResult, lastEventResult, pendingActionsResult] = await Promise.all([
    supabase.from('engine_jobs').select('status'),
    supabase.from('engine_alerts').select('severity, status').eq('status', 'open'),
    supabase
      .from('engine_events')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('engine_actions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_approval'),
  ])

  if (jobsResult.error || alertsResult.error || lastEventResult.error || pendingActionsResult.error) {
    console.error('Failed to fetch status:', {
      jobsError: jobsResult.error,
      alertsError: alertsResult.error,
      lastEventError: lastEventResult.error,
      pendingActionsError: pendingActionsResult.error,
    })
    res.status(503).json({ error: 'service unavailable: failed to fetch status' })
    return
  }

  const jobs = jobsResult.data ?? []
  const alerts = alertsResult.data ?? []
  const lastEvent = lastEventResult.data?.[0] ?? null

  const status: ServiceStatus = {
    engine: {
      status: 'running',
      startedAt: ENGINE_START_TIME,
      version: '0.1.0',
    },
    queue: {
      pendingJobs: jobs.filter((j) => j.status === 'pending').length,
      runningJobs: jobs.filter((j) => j.status === 'running').length,
      needsReviewJobs: jobs.filter((j) => j.status === 'needs_review').length,
      pendingActions: pendingActionsResult.count ?? 0,
    },
    alerts: {
      open: alerts.length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
    },
    lastEventAt: lastEvent?.created_at ?? null,
  }

  res.status(200).json(status)
})
