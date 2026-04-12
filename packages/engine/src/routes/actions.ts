import { Router } from 'express'
import type { ListActionsResult } from '@bionic/shared'
import { supabase } from '../lib/supabase.js'
import { approveAction, denyAction } from '../actions/service.js'

export const actionsRouter = Router()

actionsRouter.get('/', async (req, res) => {
  const { projectId, status, type, mode, limit } = req.query

  const targetProjectId = (projectId as string) ?? 'project_bionic'
  const limitNum = Math.min(Number(limit ?? 50), 100)

  let query = supabase
    .from('engine_actions')
    .select('*')
    .eq('project_id', targetProjectId)
    .order('created_at', { ascending: false })
    .limit(limitNum)

  if (status) query = query.eq('status', status as string)
  if (type) query = query.eq('type', type as string)
  if (mode) query = query.eq('mode', mode as string)

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch actions:', error)
    res.status(500).json({ error: 'failed to fetch actions' })
    return
  }

  const result: ListActionsResult = {
    actions: (data ?? []).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      serviceId: row.service_id ?? null,
      eventId: row.event_id ?? null,
      alertId: row.alert_id ?? null,
      jobId: row.job_id ?? null,
      type: row.type,
      mode: row.mode,
      status: row.status,
      title: row.title,
      reason: row.reason ?? null,
      input: row.input ?? {},
      result: row.result ?? {},
      error: row.error ?? null,
      requestedBy: row.requested_by,
      approvedBy: row.approved_by ?? null,
      approvedAt: row.approved_at ?? null,
      deniedBy: row.denied_by ?? null,
      deniedAt: row.denied_at ?? null,
      startedAt: row.started_at ?? null,
      completedAt: row.completed_at ?? null,
      lastNotifiedAt: row.last_notified_at ?? null,
      notificationCount: row.notification_count ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  }

  res.status(200).json(result)
})

actionsRouter.post('/:id/approve', async (req, res) => {
  const { id } = req.params

  const { data: existing, error: selectError } = await supabase
    .from('engine_actions')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (selectError) {
    res.status(500).json({ error: 'failed to fetch action' })
    return
  }

  if (!existing) {
    res.status(404).json({ error: 'action not found' })
    return
  }

  if (existing.status !== 'pending_approval') {
    res.status(409).json({
      error: `action is not pending approval (current status: ${existing.status})`,
    })
    return
  }

  const actorId = (req.headers['x-actor-id'] as string | undefined) ?? 'cli'
  const result = await approveAction({ actionId: id, actorId })

  if (!result.success) {
    res.status(409).json({ error: result.error ?? 'failed to approve action' })
    return
  }

  res.status(200).json({ approved: true, actionId: id })
})

actionsRouter.post('/:id/deny', async (req, res) => {
  const { id } = req.params

  const { data: existing, error: selectError } = await supabase
    .from('engine_actions')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (selectError) {
    res.status(500).json({ error: 'failed to fetch action' })
    return
  }

  if (!existing) {
    res.status(404).json({ error: 'action not found' })
    return
  }

  if (existing.status !== 'pending_approval') {
    res.status(409).json({
      error: `action is not pending approval (current status: ${existing.status})`,
    })
    return
  }

  const actorId = (req.headers['x-actor-id'] as string | undefined) ?? 'cli'
  const result = await denyAction({ actionId: id, actorId })

  if (!result.success) {
    res.status(409).json({ error: result.error ?? 'failed to deny action' })
    return
  }

  res.status(200).json({ denied: true, actionId: id })
})
