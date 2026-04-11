import { Router } from 'express'
import type { RunJobInput, RunJobResult } from '@bionic/shared'
import { supabase } from '../lib/supabase.js'
import { notifyDigest } from '../actions/notify.js'
import { createAction, completeAction, failAction, skipAction } from '../actions/logAction.js'

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
      project_id: input.projectId ?? 'project_bionic',
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
    void runResearchDigest(data.id, input.projectId ?? 'project_bionic')
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

export async function runResearchDigest(jobId: string, projectId: string): Promise<void> {
  const actionId = await createAction({
    projectId,
    jobId,
    type: 'run_research_digest',
    title: 'Run weekly research digest',
    reason: 'Scheduled weekly digest job',
    requestedBy: 'engine',
  })

  let notifyActionId: string | null = null

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

    notifyActionId = await createAction({
      projectId,
      jobId,
      type: 'notify_discord',
      title: 'Send research digest to Discord',
      reason: 'Weekly research digest notification',
      requestedBy: 'engine',
    })

    const notifyResult = await notifyDigest({
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

    if (notifyResult === 'sent') {
      if (notifyActionId) {
        await completeAction(notifyActionId, { result: 'sent', itemCount: items?.length ?? 0 })
      }
    } else if (notifyResult === 'skipped') {
      if (notifyActionId) {
        await skipAction(notifyActionId, 'no items to digest')
      }
    } else {
      if (notifyActionId) {
        await failAction(notifyActionId, {
          reason: notifyResult === 'misconfigured'
            ? 'DISCORD_WEBHOOK_URL not configured'
            : 'notify failed',
        })
      }
    }

    if (notifyResult === 'sent' && items && items.length > 0) {
      const markActionId = await createAction({
        projectId,
        jobId,
        type: 'mark_digest_sent',
        title: 'Mark research items as digest sent',
        input: { itemIds: items.map((i: { id: string }) => i.id) },
        requestedBy: 'engine',
      })

      const { error: markError } = await supabase
        .from('research_items')
        .update({ is_digest_sent: true })
        .in('id', items.map((i: { id: string }) => i.id))

      if (markError) {
        console.error('[digest] failed to mark items as sent:', markError)
        if (markActionId) {
          await failAction(markActionId, { message: markError.message, code: markError.code })
        }
        // mark失敗: jobをneeds_reviewにして人間の確認を待つ
        await supabase
          .from('engine_jobs')
          .update({ status: 'needs_review' })
          .eq('id', jobId)
        if (actionId) {
          await completeAction(actionId, {
            result: notifyResult,
            itemCount: items.length,
            markDigestSent: 'failed',
          })
        }
        return
      }

      if (markActionId) {
        await completeAction(markActionId, {
          updatedCount: items.length,
          itemIds: items.map((i: { id: string }) => i.id),
        })
      }

      if (actionId) {
        await completeAction(actionId, { result: 'sent', itemCount: items.length })
      }
    } else if (notifyResult === 'skipped') {
      if (actionId) {
        await skipAction(actionId, 'no items to digest')
      }
    } else if (notifyResult === 'misconfigured') {
      if (actionId) {
        await failAction(actionId, { reason: 'DISCORD_WEBHOOK_URL is not set' })
      }
    } else {
      if (actionId) {
        await completeAction(actionId, { result: notifyResult, itemCount: 0 })
      }
    }

    if (notifyResult === 'misconfigured') {
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
      console.log(`[digest] completed: result=${notifyResult}`)
    }
  } catch (err) {
    console.error('[digest] failed:', err)
    if (notifyActionId) {
      await failAction(notifyActionId, {
        message: err instanceof Error ? err.message : 'unknown error',
        reason: 'notifyDigest threw an exception',
      })
    }
    if (actionId) {
      await failAction(actionId, { message: String(err) })
    }
    await supabase
      .from('engine_jobs')
      .update({ status: 'failed' })
      .eq('id', jobId)
  }
}
