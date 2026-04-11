import { Router } from 'express'
import type { ListActionsResult } from '@bionic/shared'
import { supabase } from '../lib/supabase.js'

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
      startedAt: row.started_at ?? null,
      completedAt: row.completed_at ?? null,
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

  const { data: updated, error } = await supabase
    .from('engine_actions')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending_approval')
    .select('id')

  if (error) {
    res.status(500).json({ error: 'failed to approve action' })
    return
  }

  if (!updated || updated.length === 0) {
    res.status(409).json({ error: 'action is no longer pending approval' })
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

  const { data: updated, error } = await supabase
    .from('engine_actions')
    .update({
      status: 'denied',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending_approval')
    .select('id')

  if (error) {
    res.status(500).json({ error: 'failed to deny action' })
    return
  }

  if (!updated || updated.length === 0) {
    res.status(409).json({ error: 'action is no longer pending approval' })
    return
  }

  res.status(200).json({ denied: true, actionId: id })
})
