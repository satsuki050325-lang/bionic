import { supabase } from '../lib/supabase.js'
import { createAction, completeAction, failAction } from '../actions/logAction.js'
import {
  type SentryWebhookEvent,
  resolveSentryServiceId,
  getSentryTriggerKind,
  classifySentrySeverity,
  buildSentryFingerprint,
  buildSentryAlertTitle,
  buildSentryAlertMessage,
} from '../sources/sentry.js'

export async function evaluateSentryEvent(
  event: SentryWebhookEvent,
  projectId: string,
  webhookId: string
): Promise<void> {
  const issue = event.data.issue
  if (!issue) {
    console.log('[decisions/sentry] no issue in payload, skipping')
    return
  }

  const triggerKind = getSentryTriggerKind(event.action)
  if (!triggerKind || triggerKind === 'resolved') {
    console.log(
      `[decisions/sentry] action '${event.action}' is not alert-worthy, skipping`
    )
    return
  }

  const serviceId = resolveSentryServiceId()
  const severity = classifySentrySeverity(triggerKind, issue.level)
  const fingerprint = buildSentryFingerprint(
    projectId,
    serviceId,
    issue.project.slug,
    issue.id,
    triggerKind
  )
  const title = buildSentryAlertTitle(triggerKind, issue)
  const message = buildSentryAlertMessage(issue)
  const now = new Date().toISOString()

  const actionId = await createAction({
    projectId,
    serviceId,
    type: 'create_alert',
    mode: 'automatic',
    title: `Sentry alert evaluate: ${title}`,
    reason: `sentry action: ${event.action}`,
    input: {
      sentryIssueId: issue.id,
      sentryProjectSlug: issue.project.slug,
      triggerKind,
      level: issue.level,
      webhookId,
    },
    requestedBy: 'engine',
  })

  try {
    const { data: existing } = await supabase
      .from('engine_alerts')
      .select('id, count')
      .eq('fingerprint', fingerprint)
      .eq('status', 'open')
      .maybeSingle()

    if (existing) {
      await supabase
        .from('engine_alerts')
        .update({
          count: (existing.count ?? 1) + 1,
          last_seen_at: now,
          message,
          updated_at: now,
        })
        .eq('id', existing.id)
      console.log(
        `[decisions/sentry] updated existing sentry_issue alert: ${existing.id}`
      )
      if (actionId) {
        await completeAction(actionId, {
          operation: 'updated',
          alertId: existing.id,
          newCount: (existing.count ?? 1) + 1,
        })
      }
      return
    }

    const { data: newAlert, error } = await supabase
      .from('engine_alerts')
      .insert({
        project_id: projectId,
        service_id: serviceId,
        type: 'sentry_issue',
        severity,
        status: 'open',
        title,
        message,
        fingerprint,
        count: 1,
        last_seen_at: now,
        last_event_id: webhookId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[decisions/sentry] failed to create alert:', error)
      if (actionId) {
        await failAction(actionId, { message: 'insert failed', code: error.code })
      }
      return
    }

    console.log(`[decisions/sentry] created sentry_issue alert: ${newAlert.id}`)
    if (actionId) {
      await completeAction(actionId, {
        operation: 'created',
        alertId: newAlert.id,
      })
    }
  } catch (err) {
    console.error('[decisions/sentry] unexpected error:', err)
    if (actionId) {
      await failAction(actionId, { message: String(err) })
    }
  }
}
