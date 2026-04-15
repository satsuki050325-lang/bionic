/**
 * CRUD for heartbeat_targets (Engine-wide auth required — see index.ts).
 * Secret is returned plaintext ONLY on create and regenerate. It is never
 * returned on GET/PATCH/DELETE.
 */
import { Router } from 'express'
import type {
  CreateHeartbeatTargetInput,
  CreateHeartbeatTargetResult,
  HeartbeatSeverity,
  ListHeartbeatTargetsResult,
  UpdateHeartbeatTargetInput,
} from '@bionic/shared'
import { supabase } from '../lib/supabase.js'
import { getConfig } from '../config.js'
import {
  generateHeartbeatSecret,
  hashHeartbeatSecret,
} from '../heartbeat/secret.js'
import { mapHeartbeatRow } from '../heartbeat/repository.js'

export const heartbeatTargetsRouter = Router()

const SLUG_RE = /^[a-z0-9-]{3,64}$/
const SERVICE_ID_RE = /^[a-z0-9-]+$/
const ALLOWED_SEVERITY: HeartbeatSeverity[] = ['info', 'warning', 'critical']

function validateSeverity(v: unknown): HeartbeatSeverity | null {
  if (v === undefined) return 'warning'
  if (typeof v !== 'string') return null
  return (ALLOWED_SEVERITY as string[]).includes(v)
    ? (v as HeartbeatSeverity)
    : null
}

heartbeatTargetsRouter.get('/', async (req, res) => {
  const config = getConfig()
  const projectId = (req.query['projectId'] as string) ?? config.projectId
  const serviceId = req.query['serviceId'] as string | undefined

  let query = supabase
    .from('heartbeat_targets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (serviceId) query = query.eq('service_id', serviceId)

  const { data, error } = await query

  if (error) {
    console.error('[heartbeat-targets] list failed:', error)
    res.status(500).json({ error: 'failed to list heartbeat targets' })
    return
  }

  const result: ListHeartbeatTargetsResult = {
    targets: (data ?? []).map((row) =>
      mapHeartbeatRow(row as Record<string, unknown>)
    ),
  }
  res.status(200).json(result)
})

heartbeatTargetsRouter.post('/', async (req, res) => {
  const config = getConfig()
  const body = req.body as CreateHeartbeatTargetInput
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'invalid body' })
    return
  }

  const projectId = body.projectId ?? config.projectId
  const serviceId = body.serviceId?.trim()
  const slug = body.slug?.trim()?.toLowerCase()
  const interval = Number(body.expectedIntervalSeconds)
  const grace = body.graceSeconds !== undefined ? Number(body.graceSeconds) : 60
  const severity = validateSeverity(body.severity)

  if (!serviceId || !SERVICE_ID_RE.test(serviceId)) {
    res.status(400).json({ error: 'invalid serviceId' })
    return
  }
  if (!slug || !SLUG_RE.test(slug)) {
    res.status(400).json({
      error: 'slug must match /^[a-z0-9-]{3,64}$/',
    })
    return
  }
  if (!Number.isInteger(interval) || interval < 60 || interval > 86400) {
    res
      .status(400)
      .json({ error: 'expectedIntervalSeconds must be 60..86400 seconds' })
    return
  }
  if (!Number.isInteger(grace) || grace < 0 || grace > 3600) {
    res.status(400).json({ error: 'graceSeconds must be 0..3600' })
    return
  }
  if (severity === null) {
    res
      .status(400)
      .json({ error: 'severity must be one of info|warning|critical' })
    return
  }

  const plaintext = generateHeartbeatSecret()
  const secretHash = hashHeartbeatSecret(plaintext)

  const { data, error } = await supabase
    .from('heartbeat_targets')
    .insert({
      project_id: projectId,
      service_id: serviceId,
      slug,
      name: body.name ?? null,
      description: body.description ?? null,
      secret_hash: secretHash,
      secret_algo: 'hmac-sha256',
      expected_interval_seconds: interval,
      grace_seconds: grace,
      severity,
      enabled: true,
    })
    .select('*')
    .maybeSingle()

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'slug already exists in this project' })
      return
    }
    console.error('[heartbeat-targets] create failed:', error)
    res.status(500).json({ error: 'failed to create heartbeat target' })
    return
  }

  if (!data) {
    res.status(500).json({ error: 'insert returned no row' })
    return
  }

  const result: CreateHeartbeatTargetResult = {
    target: mapHeartbeatRow(data as Record<string, unknown>),
    secret: plaintext,
  }
  res.status(201).json(result)
})

heartbeatTargetsRouter.patch('/:id', async (req, res) => {
  const id = req.params['id']
  const body = (req.body as UpdateHeartbeatTargetInput) ?? {}

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.name !== undefined) {
    update['name'] = body.name === null ? null : String(body.name).slice(0, 200)
  }
  if (body.description !== undefined) {
    update['description'] =
      body.description === null ? null : String(body.description).slice(0, 2000)
  }
  if (body.expectedIntervalSeconds !== undefined) {
    const n = Number(body.expectedIntervalSeconds)
    if (!Number.isInteger(n) || n < 60 || n > 86400) {
      res
        .status(400)
        .json({ error: 'expectedIntervalSeconds must be 60..86400 seconds' })
      return
    }
    update['expected_interval_seconds'] = n
  }
  if (body.graceSeconds !== undefined) {
    const n = Number(body.graceSeconds)
    if (!Number.isInteger(n) || n < 0 || n > 3600) {
      res.status(400).json({ error: 'graceSeconds must be 0..3600' })
      return
    }
    update['grace_seconds'] = n
  }
  if (body.severity !== undefined) {
    const sev = validateSeverity(body.severity)
    if (sev === null) {
      res
        .status(400)
        .json({ error: 'severity must be one of info|warning|critical' })
      return
    }
    update['severity'] = sev
  }
  if (body.enabled !== undefined) update['enabled'] = !!body.enabled

  const { data, error } = await supabase
    .from('heartbeat_targets')
    .update(update)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[heartbeat-targets] update failed:', error)
    res.status(500).json({ error: 'failed to update heartbeat target' })
    return
  }
  if (!data) {
    res.status(404).json({ error: 'heartbeat target not found' })
    return
  }
  res.status(200).json({
    target: mapHeartbeatRow(data as Record<string, unknown>),
  })
})

heartbeatTargetsRouter.delete('/:id', async (req, res) => {
  const id = req.params['id']
  const { error } = await supabase
    .from('heartbeat_targets')
    .delete()
    .eq('id', id)
  if (error) {
    console.error('[heartbeat-targets] delete failed:', error)
    res.status(500).json({ error: 'failed to delete heartbeat target' })
    return
  }
  res.status(204).end()
})

heartbeatTargetsRouter.post('/:id/regenerate-secret', async (req, res) => {
  const id = req.params['id']
  const plaintext = generateHeartbeatSecret()
  const secretHash = hashHeartbeatSecret(plaintext)
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('heartbeat_targets')
    .update({
      secret_hash: secretHash,
      secret_algo: 'hmac-sha256',
      updated_at: now,
    })
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[heartbeat-targets] regenerate failed:', error)
    res.status(500).json({ error: 'failed to regenerate secret' })
    return
  }
  if (!data) {
    res.status(404).json({ error: 'heartbeat target not found' })
    return
  }
  res.status(200).json({
    target: mapHeartbeatRow(data as Record<string, unknown>),
    secret: plaintext,
  })
})
