import { Router } from 'express'
import type { CaptureEventInput, CaptureEventResult, EventType, EventSource } from '@bionic/shared'
import { supabase } from '../lib/supabase.js'

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

eventsRouter.post('/', async (req, res) => {
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

  const { error } = await supabase.from('engine_events').insert({
    client_event_id: e.id,
    project_id: e.projectId,
    service_id: e.serviceId,
    type: e.type,
    occurred_at: e.occurredAt,
    source: e.source,
    payload: e.payload,
  })

  if (error) {
    console.error('Failed to insert event:', error)
    res.status(500).json({ error: 'failed to save event' })
    return
  }

  const result: CaptureEventResult = {
    accepted: true,
    eventId: input.event.id,
  }

  res.status(202).json(result)
})
