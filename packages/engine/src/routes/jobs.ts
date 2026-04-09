import { Router } from 'express'
import type { RunJobInput, RunJobResult } from '@bionic/shared'
import { supabase } from '../lib/supabase.js'
import { notifyDigest } from '../actions/notify.js'

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

  if (input.type === 'research_digest') {
    void runResearchDigest(data.id, input.projectId ?? 'default')
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

async function runResearchDigest(jobId: string, projectId: string): Promise<void> {
  try {
    await supabase
      .from('engine_jobs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', jobId)

    const { data: items, error } = await supabase
      .from('research_items')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_digest_sent', false)
      .order('importance_score', { ascending: false })
      .limit(3)

    if (error) throw error

    const result = await notifyDigest({
      projectId,
      items: (items ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        url: row.url ?? null,
        source: row.source,
        importanceScore: row.importance_score,
      })),
    })

    if (result === 'sent' && items && items.length > 0) {
      await supabase
        .from('research_items')
        .update({ is_digest_sent: true })
        .in('id', items.map((i: { id: string }) => i.id))
    }

    if (result === 'misconfigured') {
      await supabase
        .from('engine_jobs')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', jobId)
      console.error('[digest] failed: DISCORD_WEBHOOK_URL is not set')
    } else {
      await supabase
        .from('engine_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', jobId)
      console.log(`[digest] completed: result=${result}`)
    }
  } catch (err) {
    console.error('[digest] failed:', err)
    await supabase
      .from('engine_jobs')
      .update({ status: 'failed' })
      .eq('id', jobId)
  }
}
