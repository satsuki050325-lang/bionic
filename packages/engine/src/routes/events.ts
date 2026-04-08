import { Router } from 'express'
import type { CaptureEventInput, CaptureEventResult, EventType, EventSource } from '@bionic/shared'

const VALID_EVENT_TYPES: EventType[] = [
  'service.health.reported',
  'service.health.degraded',
  'service.error.reported',
  'service.usage.reported',
  'research.item.detected',
  'job.started',
  'job.completed',
  'job.failed',
]

const VALID_SOURCES: EventSource[] = ['sdk', 'app', 'cli', 'engine', 'scheduler']

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

  if (!VALID_EVENT_TYPES.includes(e.type)) {
    res.status(400).json({ error: 'invalid event: unknown type' })
    return
  }

  if (!VALID_SOURCES.includes(e.source)) {
    res.status(400).json({ error: 'invalid event: unknown source' })
    return
  }

  if (
    typeof e.payload !== 'object' ||
    e.payload === null ||
    Array.isArray(e.payload)
  ) {
    res.status(400).json({ error: 'invalid event: payload must be an object' })
    return
  }

  const result: CaptureEventResult = {
    accepted: true,
    eventId: input.event.id,
  }

  res.status(202).json(result)
})
