import { Router } from 'express'
import type { ListAlertsResult } from '@bionic/shared'

export const alertsRouter = Router()

alertsRouter.get('/', (_req, res) => {
  const result: ListAlertsResult = {
    alerts: [],
  }

  res.status(200).json(result)
})
