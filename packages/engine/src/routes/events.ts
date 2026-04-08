import { Router } from 'express'
import type { CaptureEventInput, CaptureEventResult } from '@bionic/shared'

export const eventsRouter = Router()

eventsRouter.post('/', (req, res) => {
  const input = req.body as CaptureEventInput

  const e = input.event
  if (
    !e?.id ||
    !e?.projectId ||
    !e?.serviceId ||
    !e?.type ||
    !e?.occurredAt ||
    !e?.source ||
    e?.payload === undefined
  ) {
    res.status(400).json({ error: 'invalid event: missing required fields' })
    return
  }

  const result: CaptureEventResult = {
    accepted: true,
    eventId: input.event.id,
  }

  res.status(202).json(result)
})
