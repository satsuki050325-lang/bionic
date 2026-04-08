import { Router } from 'express'
import type { ServiceStatus } from '@bionic/shared'

export const statusRouter = Router()

statusRouter.get('/', (_req, res) => {
  const status: ServiceStatus = {
    engine: {
      status: 'running',
      startedAt: new Date().toISOString(),
      version: '0.1.0',
    },
    queue: {
      pendingJobs: 0,
      runningJobs: 0,
      needsReviewJobs: 0,
    },
    alerts: {
      open: 0,
      critical: 0,
    },
    lastEventAt: null,
  }

  res.status(200).json(status)
})
