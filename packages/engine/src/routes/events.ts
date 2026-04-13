import { Router } from 'express'
import type { CaptureEventInput, CaptureEventResult, EventType, EventSource } from '@bionic/shared'
import { supabase } from '../lib/supabase.js'
import { evaluateAlertForEvent } from '../decisions/alerts.js'

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

const VALID_SOURCES: EventSource[] = ['sdk', 'app', 'cli', 'engine', 'scheduler', 'mcp']

export const eventsRouter = Router()

eventsRouter.get('/', async (req, res) => {
  const { projectId, type, limit } = req.query

  const targetProjectId = (projectId as string) ?? 'project_bionic'
  const limitNum = Math.min(Number(limit ?? 20), 100)

  let query = supabase
    .from('engine_events')
    .select('*')
    .eq('project_id', targetProjectId)
    .order('created_at', { ascending: false })
    .limit(limitNum)

  if (type) query = query.eq('type', type as string)

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch events:', error)
    res.status(500).json({ error: 'failed to fetch events' })
    return
  }

  res.status(200).json({
    events: (data ?? []).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      serviceId: row.service_id,
      type: row.type,
      source: row.source,
      occurredAt: row.occurred_at,
      createdAt: row.created_at,
      clientEventId: row.client_event_id ?? null,
    })),
  })
})

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
    if ((error as { code?: string }).code === '23505') {
      console.log('[events] duplicate client_event_id, returning accepted')
      res.status(202).json({ accepted: true, eventId: null, duplicate: true })
      return
    }
    console.error('Failed to insert event:', error)
    res.status(500).json({ error: 'failed to save event' })
    return
  }

  void evaluateAlertForEvent(e)

  const result: CaptureEventResult = {
    accepted: true,
    eventId: input.event.id,
  }

  res.status(202).json(result)
})
