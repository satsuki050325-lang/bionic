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
