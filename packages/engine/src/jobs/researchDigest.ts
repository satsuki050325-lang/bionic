import { supabase } from '../lib/supabase.js'
import { notifyDigest } from '../actions/notify.js'
import { createAction, completeAction, failAction, skipAction } from '../actions/logAction.js'
import { markJobRunning, markJobCompleted, markJobFailed, markJobNeedsReview } from './repository.js'
import { getDiscordClient } from '../discord/index.js'
import { sendDigestNotification } from '../discord/notifications.js'

export function getWeeklyDigestKey(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value

  const localDate = new Date(`${year}-${month}-${day}`)
  const startOfYear = new Date(localDate.getFullYear(), 0, 1)
  const weekNum = Math.ceil(
    ((localDate.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() +
      1) /
      7
  )
  return `research_digest:${year}-W${String(weekNum).padStart(2, '0')}`
}

export async function enqueueResearchDigestJob(params: {
  projectId: string
  requestedBy: string
  dedupeKey?: string
}): Promise<{ created: boolean; jobId?: string }> {
  const insertPayload: Record<string, unknown> = {
    project_id: params.projectId,
    type: 'research_digest',
    status: 'pending',
    requested_by: params.requestedBy,
    payload: {},
  }
  if (params.dedupeKey) {
    insertPayload.dedupe_key = params.dedupeKey
  }

  const { data, error } = await supabase
    .from('engine_jobs')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      console.log(`[scheduler] digest job already exists for ${params.dedupeKey ?? '(no dedupe)'}`)
      return { created: false }
    }
    console.error('[scheduler] failed to enqueue job:', error)
    return { created: false }
  }

  console.log(`[scheduler] digest job created: ${data.id} (${params.dedupeKey ?? 'no-dedupe'})`)
  return { created: true, jobId: data.id }
}

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
    await markJobRunning(jobId)

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

    const mappedItems = (items ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      url: row.url ?? null,
      source: row.source,
      importanceScore: row.importance_score,
    }))

    const discordClient = getDiscordClient()
    let notifyResult: 'sent' | 'skipped' | 'misconfigured' | 'failed'
    if (discordClient) {
      const botResult = await sendDigestNotification(
        discordClient,
        mappedItems.map((i) => ({
          title: i.title,
          summary: i.summary,
          importanceScore: i.importanceScore,
        })),
        projectId
      )
      notifyResult = botResult === 'failed' ? 'misconfigured' : botResult
    } else {
      notifyResult = await notifyDigest({ projectId, items: mappedItems })
    }

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
        await markJobNeedsReview(jobId, 'mark_digest_sent failed')
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
      await markJobFailed(jobId, 'DISCORD_WEBHOOK_URL is not set')
      console.error('[digest] failed: DISCORD_WEBHOOK_URL is not set')
    } else {
      await markJobCompleted(jobId)
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
    await markJobFailed(jobId, err instanceof Error ? err.message : 'unknown error')
  }
}
