import { Router } from 'express'
import type {
  CreateUptimeTargetInput,
  ListUptimeTargetsResult,
  UpdateUptimeTargetInput,
  UptimeInterval,
} from '@bionic/shared'
import { supabase } from '../lib/supabase.js'
import { getConfig } from '../config.js'
import { runUptimeCheck } from '../uptime/check.js'
import { mapUptimeRow } from '../uptime/runner.js'

export const uptimeTargetsRouter = Router()

const ALLOWED_INTERVALS: UptimeInterval[] = [30, 60, 300]
const SERVICE_ID_RE = /^[a-z0-9-]+$/

function parseInterval(value: unknown): UptimeInterval | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  if (!ALLOWED_INTERVALS.includes(n as UptimeInterval)) return null
  return n as UptimeInterval
}

function parseMethod(value: unknown): 'GET' | 'HEAD' | null {
  if (value === undefined) return 'GET'
  if (value === 'GET' || value === 'HEAD') return value
  return null
}

uptimeTargetsRouter.get('/', async (req, res) => {
  const config = getConfig()
  const projectId = (req.query['projectId'] as string) ?? config.projectId
  const serviceId = req.query['serviceId'] as string | undefined

  let query = supabase
    .from('uptime_targets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (serviceId) query = query.eq('service_id', serviceId)

  const { data, error } = await query

  if (error) {
    console.error('[uptime-targets] list failed:', error)
    res.status(500).json({ error: 'failed to list uptime targets' })
    return
  }

  const result: ListUptimeTargetsResult = {
    targets: (data ?? []).map((row) => mapUptimeRow(row as Record<string, unknown>)),
  }
  res.status(200).json(result)
})

uptimeTargetsRouter.post('/', async (req, res) => {
  const config = getConfig()
  const body = req.body as CreateUptimeTargetInput
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'invalid body' })
    return
  }

  const projectId = body.projectId ?? config.projectId
  const serviceId = body.serviceId?.trim()
  const url = body.url?.trim()
  const interval = parseInterval(body.intervalSeconds)
  const method = parseMethod(body.method)

  if (!serviceId || !SERVICE_ID_RE.test(serviceId)) {
    res.status(400).json({ error: 'invalid serviceId' })
    return
  }
  if (!url) {
    res.status(400).json({ error: 'missing url' })
    return
  }
  if (!interval) {
    res
      .status(400)
      .json({ error: 'intervalSeconds must be one of 30, 60, 300' })
    return
  }
  if (method === null) {
    res.status(400).json({ error: 'method must be GET or HEAD' })
    return
  }

  const timeoutMs = body.timeoutMs ?? 10000
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 30000) {
    res.status(400).json({ error: 'timeoutMs must be between 1000 and 30000' })
    return
  }

  const statusMin = body.expectedStatusMin ?? 200
  const statusMax = body.expectedStatusMax ?? 299
  if (
    !Number.isInteger(statusMin) ||
    !Number.isInteger(statusMax) ||
    statusMin < 100 ||
    statusMax > 599 ||
    statusMin > statusMax
  ) {
    res.status(400).json({ error: 'invalid expected status range' })
    return
  }

  const { data, error } = await supabase
    .from('uptime_targets')
    .insert({
      project_id: projectId,
      service_id: serviceId,
      url,
      method,
      interval_seconds: interval,
      timeout_ms: timeoutMs,
      expected_status_min: statusMin,
      expected_status_max: statusMax,
      enabled: true,
    })
    .select('*')
    .maybeSingle()

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'uptime target for this url already exists' })
      return
    }
    console.error('[uptime-targets] create failed:', error)
    res.status(500).json({ error: 'failed to create uptime target' })
    return
  }

  res
    .status(201)
    .json({ target: mapUptimeRow(data as Record<string, unknown>) })
})

uptimeTargetsRouter.patch('/:id', async (req, res) => {
  const id = req.params['id']
  const body = (req.body as UpdateUptimeTargetInput) ?? {}

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.url !== undefined) {
    if (typeof body.url !== 'string' || !body.url.trim()) {
      res.status(400).json({ error: 'invalid url' })
      return
    }
    update['url'] = body.url.trim()
  }
  if (body.intervalSeconds !== undefined) {
    const interval = parseInterval(body.intervalSeconds)
    if (!interval) {
      res
        .status(400)
        .json({ error: 'intervalSeconds must be one of 30, 60, 300' })
      return
    }
    update['interval_seconds'] = interval
  }
  if (body.method !== undefined) {
    const method = parseMethod(body.method)
    if (method === null) {
      res.status(400).json({ error: 'method must be GET or HEAD' })
      return
    }
    update['method'] = method
  }
  if (body.timeoutMs !== undefined) {
    if (
      !Number.isInteger(body.timeoutMs) ||
      body.timeoutMs < 1000 ||
      body.timeoutMs > 30000
    ) {
      res.status(400).json({ error: 'timeoutMs must be between 1000 and 30000' })
      return
    }
    update['timeout_ms'] = body.timeoutMs
  }
  if (body.expectedStatusMin !== undefined) update['expected_status_min'] = body.expectedStatusMin
  if (body.expectedStatusMax !== undefined) update['expected_status_max'] = body.expectedStatusMax
  if (body.enabled !== undefined) update['enabled'] = !!body.enabled

  const { data, error } = await supabase
    .from('uptime_targets')
    .update(update)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[uptime-targets] update failed:', error)
    res.status(500).json({ error: 'failed to update uptime target' })
    return
  }
  if (!data) {
    res.status(404).json({ error: 'uptime target not found' })
    return
  }
  res.status(200).json({ target: mapUptimeRow(data as Record<string, unknown>) })
})

uptimeTargetsRouter.delete('/:id', async (req, res) => {
  const id = req.params['id']
  const { error } = await supabase.from('uptime_targets').delete().eq('id', id)
  if (error) {
    console.error('[uptime-targets] delete failed:', error)
    res.status(500).json({ error: 'failed to delete uptime target' })
    return
  }
  res.status(204).end()
})

uptimeTargetsRouter.post('/:id/test', async (req, res) => {
  const id = req.params['id']

  const { data, error } = await supabase
    .from('uptime_targets')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[uptime-targets] test fetch failed:', error)
    res.status(500).json({ error: 'failed to fetch uptime target' })
    return
  }
  if (!data) {
    res.status(404).json({ error: 'uptime target not found' })
    return
  }

  const target = mapUptimeRow(data as Record<string, unknown>)
  const outcome = await runUptimeCheck({
    url: target.url,
    method: target.method,
    timeoutMs: target.timeoutMs,
    expectedStatusMin: target.expectedStatusMin,
    expectedStatusMax: target.expectedStatusMax,
  })

  res.status(200).json({ outcome })
})
