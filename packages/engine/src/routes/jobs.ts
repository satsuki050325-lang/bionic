import { Router } from 'express'
import type { RunJobInput, RunJobResult } from '@bionic/shared'
import { supabase } from '../lib/supabase.js'

export const jobsRouter = Router()

jobsRouter.post('/', async (req, res) => {
  const input = req.body as RunJobInput

  if (input.type !== 'research_digest') {
    res.status(400).json({ error: 'unsupported job type' })
    return
  }

  const VALID_SOURCES = ['sdk', 'app', 'cli', 'engine', 'scheduler'] as const

  if (!input.requestedBy || !VALID_SOURCES.includes(input.requestedBy as typeof VALID_SOURCES[number])) {
    res.status(400).json({ error: 'invalid requestedBy' })
    return
  }

  const { data, error } = await supabase
    .from('engine_jobs')
    .insert({
      project_id: input.projectId ?? 'default',
      type: input.type,
      status: 'pending',
      requested_by: input.requestedBy,
      payload: {},
    })
    .select()
    .single()

  if (error || !data) {
    console.error('Failed to insert job:', error)
    res.status(500).json({ error: 'failed to save job' })
    return
  }

  const result: RunJobResult = {
    job: {
      id: data.id,
      type: data.type,
      status: data.status,
      requestedBy: data.requested_by,
      createdAt: data.created_at,
      startedAt: data.started_at ?? null,
      completedAt: data.completed_at ?? null,
    },
  }

  res.status(202).json(result)
})
