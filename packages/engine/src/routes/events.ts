import { Router } from 'express'
import type { CaptureEventInput, CaptureEventResult } from '@bionic/shared'

export const eventsRouter = Router()

eventsRouter.post('/', (req, res) => {
  const input = req.body as CaptureEventInput

  if (!input.event?.id || !input.event?.type) {
    res.status(400).json({ error: 'invalid event' })
    return
  }

  const result: CaptureEventResult = {
    accepted: true,
    eventId: input.event.id,
  }

  res.status(202).json(result)
})
