import { Router, type Request, type Response } from 'express'
import Stripe from 'stripe'
import { getConfig } from '../../config.js'
import { evaluateStripeEvent } from '../../decisions/stripe.js'
import { supabase } from '../../lib/supabase.js'
import type { StripeWebhookEvent } from '../../sources/stripe.js'

const STRIPE_EVENT_TYPE_MAP: Record<string, string> = {
  'invoice.payment_failed': 'stripe.invoice.payment_failed',
  'payment_intent.payment_failed': 'stripe.payment_intent.payment_failed',
  'customer.subscription.deleted': 'stripe.subscription.deleted',
  'customer.subscription.updated': 'stripe.subscription.updated',
  'charge.dispute.created': 'stripe.dispute.created',
  'charge.refunded': 'stripe.refund.created',
}

export const stripeWebhookRouter = Router()

stripeWebhookRouter.post('/', (req: Request, res: Response): void => {
  void (async () => {
    const config = getConfig()

    if (!config.stripe.webhookSecret) {
      res.status(401).json({ error: 'Stripe webhook not configured' })
      return
    }

    const rawBody = req.body as Buffer
    if (!Buffer.isBuffer(rawBody)) {
      res.status(400).json({ error: 'Raw body not available' })
      return
    }

    const signature = req.headers['stripe-signature'] as string | undefined
    if (!signature) {
      res.status(401).json({ error: 'Missing stripe-signature header' })
      return
    }

    const stripe = new Stripe(config.stripe.webhookSecret)
    type StripeEvent = ReturnType<typeof stripe.webhooks.constructEvent>
    let event: StripeEvent
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        config.stripe.webhookSecret
      )
    } catch (err) {
      console.error('[webhooks/stripe] signature verification failed:', err)
      res.status(401).json({ error: 'Invalid signature' })
      return
    }

    const clientEventId = `stripe:${event.id}`
    const { data: existing } = await supabase
      .from('engine_events')
      .select('id')
      .eq('client_event_id', clientEventId)
      .maybeSingle()

    if (existing) {
      res.status(202).json({ processed: false, duplicate: true })
      return
    }

    const projectId = config.projectId
    const serviceId = config.stripe.serviceId
    const normalizedType = STRIPE_EVENT_TYPE_MAP[event.type] ?? `stripe.${event.type}`
    const obj = event.data.object as unknown as Record<string, unknown>

    const { error: insertError } = await supabase.from('engine_events').insert({
      project_id: projectId,
      service_id: serviceId,
      type: normalizedType,
      source: 'engine',
      client_event_id: clientEventId,
      payload: {
        stripeEventId: event.id,
        type: event.type,
        objectId: obj['id'],
        objectType: obj['object'],
      },
      occurred_at: new Date(event.created * 1000).toISOString(),
    })

    if (insertError) {
      if ((insertError as { code?: string }).code === '23505') {
        res.status(202).json({ processed: false, duplicate: true })
        return
      }
      console.error('[webhooks/stripe] failed to save event:', insertError)
      res.status(500).json({ error: 'failed to save event' })
      return
    }

    const stripeEvent: StripeWebhookEvent = {
      id: event.id,
      type: event.type,
      data: { object: obj },
      created: event.created,
    }

    void evaluateStripeEvent(stripeEvent, projectId)

    res.status(202).json({ processed: true, event: event.type })
  })()
})
