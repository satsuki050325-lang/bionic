import { supabase } from '../lib/supabase.js'
import { createAction, completeAction, failAction } from '../actions/logAction.js'
import {
  type StripeWebhookEvent,
  resolveStripeServiceId,
  classifyStripeEventSeverity,
  buildStripeFingerprint,
  buildStripeAlertTitle,
  buildStripeAlertMessage,
  getAlertTypeForStripeEvent,
} from '../sources/stripe.js'

export async function evaluateStripeEvent(
  event: StripeWebhookEvent,
  projectId: string
): Promise<void> {
  const alertType = getAlertTypeForStripeEvent(event.type)
  if (!alertType) {
    console.log(`[decisions/stripe] no alert for event type: ${event.type}`)
    return
  }

  if (event.type === 'customer.subscription.updated') {
    const obj = event.data.object
    const status = obj['status'] as string | undefined
    const cancelAtPeriodEnd = obj['cancel_at_period_end'] as boolean | undefined
    if (status !== 'past_due' && !cancelAtPeriodEnd) {
      console.log(
        `[decisions/stripe] subscription updated but no action needed. status: ${status}`
      )
      return
    }
  }

  const serviceId = resolveStripeServiceId()
  const severity = classifyStripeEventSeverity(event.type, event.data)
  const fingerprint = buildStripeFingerprint(
    projectId,
    serviceId,
    alertType,
    event.type,
    event.data
  )
  const title = buildStripeAlertTitle(event.type, event.data)
  const message = buildStripeAlertMessage(event.type, event.data)
  const now = new Date().toISOString()

  const actionId = await createAction({
    projectId,
    serviceId,
    type: 'create_alert',
    mode: 'automatic',
    title: `Stripe alert evaluate: ${title}`,
    reason: `stripe event: ${event.type}`,
    input: {
      stripeEventId: event.id,
      eventType: event.type,
      alertType,
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
        `[decisions/stripe] updated existing ${alertType} alert: ${existing.id}`
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
        type: alertType,
        severity,
        status: 'open',
        title,
        message,
        fingerprint,
        count: 1,
        last_seen_at: now,
        last_event_id: event.id,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[decisions/stripe] failed to create alert:', error)
      if (actionId) {
        await failAction(actionId, { message: 'insert failed', code: error.code })
      }
      return
    }

    console.log(`[decisions/stripe] created ${alertType} alert: ${newAlert.id}`)
    if (actionId) {
      await completeAction(actionId, {
        operation: 'created',
        alertId: newAlert.id,
      })
    }
  } catch (err) {
    console.error('[decisions/stripe] unexpected error:', err)
    if (actionId) {
      await failAction(actionId, { message: String(err) })
    }
  }
}
