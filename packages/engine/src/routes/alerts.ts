import { Router } from 'express'
import type { ListAlertsResult } from '@bionic/shared'
import { supabase } from '../lib/supabase.js'

export const alertsRouter = Router()

alertsRouter.get('/', async (req, res) => {
  const { status, severity, limit } = req.query

  let query = supabase
    .from('engine_alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status as string)
  if (severity) query = query.eq('severity', severity as string)
  if (limit) query = query.limit(Number(limit))

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch alerts:', error)
    res.status(500).json({ error: 'failed to fetch alerts' })
    return
  }

  const result: ListAlertsResult = {
    alerts: (data ?? []).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      serviceId: row.service_id ?? null,
      type: row.type,
      severity: row.severity,
      title: row.title,
      message: row.message,
      status: row.status,
      fingerprint: row.fingerprint ?? '',
      count: row.count ?? 1,
      lastSeenAt: row.last_seen_at ?? row.created_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  }

  res.status(200).json(result)
})
