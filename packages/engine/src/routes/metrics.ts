import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { getConfig } from '../config.js'

export const metricsRouter = Router()

const ALLOWED_WINDOWS = new Set(['6h', '24h'])
const ALLOWED_BUCKETS = new Set(['1h', '6h'])

metricsRouter.get('/events', async (req, res) => {
  const config = getConfig()
  const projectId = (req.query['projectId'] as string) ?? config.projectId
  const window = ALLOWED_WINDOWS.has(req.query['window'] as string)
    ? (req.query['window'] as string)
    : '24h'
  const bucket = ALLOWED_BUCKETS.has(req.query['bucket'] as string)
    ? (req.query['bucket'] as string)
    : '1h'

  const windowHours = window === '6h' ? 6 : 24
  const bucketHours = bucket === '6h' ? 6 : 1

  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

  const { data: events, error } = await supabase
    .from('engine_events')
    .select('type, occurred_at')
    .eq('project_id', projectId)
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: true })

  if (error) {
    console.error('[metrics] failed to fetch events:', error)
    res.status(500).json({ error: 'failed to fetch events' })
    return
  }

  const points: Array<{
    bucketStart: string
    errors: number
    healthDegraded: number
    total: number
  }> = []

  for (let i = 0; i < windowHours; i += bucketHours) {
    const bucketStart = new Date(Date.now() - (windowHours - i) * 60 * 60 * 1000)
    const bucketEnd = new Date(bucketStart.getTime() + bucketHours * 60 * 60 * 1000)

    const bucketEvents = (events ?? []).filter((e) => {
      const t = new Date(e.occurred_at).getTime()
      return t >= bucketStart.getTime() && t < bucketEnd.getTime()
    })

    points.push({
      bucketStart: bucketStart.toISOString(),
      errors: bucketEvents.filter((e) => e.type === 'service.error.reported').length,
      healthDegraded: bucketEvents.filter((e) => e.type === 'service.health.degraded').length,
      total: bucketEvents.length,
    })
  }

  res.json({ points, window, bucket, projectId })
})
