import { getConfig } from '../config.js'

export interface StripeWebhookEventData {
  object: Record<string, unknown>
}

export interface StripeWebhookEvent {
  id: string
  type: string
  data: StripeWebhookEventData
  created: number
}

export function resolveStripeServiceId(): string {
  return getConfig().stripe.serviceId
}

export function classifyStripeEventSeverity(
  eventType: string,
  data: StripeWebhookEventData
): 'critical' | 'warning' | 'info' {
  const obj = data.object

  switch (eventType) {
    case 'invoice.payment_failed':
    case 'charge.dispute.created':
    case 'payment_intent.payment_failed':
      return 'critical'
    case 'customer.subscription.deleted':
      return 'warning'
    case 'customer.subscription.updated': {
      const status = obj['status'] as string | undefined
      const cancelAtPeriodEnd = obj['cancel_at_period_end'] as boolean | undefined
      if (status === 'past_due' || cancelAtPeriodEnd) return 'warning'
      return 'info'
    }
    case 'charge.refunded':
      return 'warning'
    default:
      return 'info'
  }
}

export function buildStripeFingerprint(
  projectId: string,
  serviceId: string,
  alertType: string,
  eventType: string,
  data: StripeWebhookEventData
): string {
  const obj = data.object
  let stableKey = 'unknown'

  if (eventType === 'invoice.payment_failed') {
    const subscriptionId = obj['subscription'] as string | undefined
    const customerId = obj['customer'] as string | undefined
    stableKey = subscriptionId ?? customerId ?? 'unknown'
  } else if (eventType === 'payment_intent.payment_failed') {
    stableKey = (obj['id'] as string | undefined) ?? 'unknown'
  } else if (eventType === 'charge.dispute.created') {
    stableKey = (obj['charge'] as string | undefined) ?? 'unknown'
  } else if (
    eventType === 'customer.subscription.deleted' ||
    eventType === 'customer.subscription.updated'
  ) {
    const subscriptionId = obj['id'] as string | undefined
    const status = obj['status'] as string | undefined
    const cancelAtPeriodEnd = obj['cancel_at_period_end'] as boolean | undefined
    const changeKind = cancelAtPeriodEnd ? 'cancel_scheduled' : (status ?? 'updated')
    stableKey = `${subscriptionId ?? 'unknown'}:${changeKind}`
  } else if (eventType === 'charge.refunded') {
    stableKey = (obj['id'] as string | undefined) ?? 'unknown'
  }

  return ['v2', projectId, serviceId, alertType, stableKey].join(':')
}

export function buildStripeAlertTitle(
  eventType: string,
  data: StripeWebhookEventData
): string {
  const obj = data.object
  const id = (obj['id'] as string | undefined) ?? 'unknown'
  switch (eventType) {
    case 'invoice.payment_failed':
      return `Payment failed: invoice ${id}`
    case 'payment_intent.payment_failed':
      return `Payment intent failed: ${id}`
    case 'charge.dispute.created':
      return `Dispute created on charge ${(obj['charge'] as string | undefined) ?? 'unknown'}`
    case 'customer.subscription.deleted':
      return `Subscription cancelled: ${id}`
    case 'customer.subscription.updated':
      return `Subscription updated: ${id}`
    case 'charge.refunded':
      return `Charge refunded: ${id}`
    default:
      return `Stripe event: ${eventType}`
  }
}

export function buildStripeAlertMessage(
  eventType: string,
  data: StripeWebhookEventData
): string {
  const obj = data.object
  const amount = obj['amount'] as number | undefined
  const currency = obj['currency'] as string | undefined
  const status = obj['status'] as string | undefined
  const amountStr =
    amount && currency
      ? `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
      : ''

  switch (eventType) {
    case 'invoice.payment_failed':
      return `Invoice payment failed${amountStr ? `: ${amountStr}` : ''}. Status: ${status ?? 'unknown'}`
    case 'payment_intent.payment_failed':
      return `Payment intent failed${amountStr ? `: ${amountStr}` : ''}. Status: ${status ?? 'unknown'}`
    case 'charge.dispute.created':
      return `Chargeback dispute created${amountStr ? `: ${amountStr}` : ''}`
    case 'customer.subscription.deleted':
      return `Subscription ${(obj['id'] as string | undefined) ?? 'unknown'} was cancelled`
    case 'customer.subscription.updated': {
      const cancelAtPeriodEnd = obj['cancel_at_period_end'] as boolean | undefined
      return cancelAtPeriodEnd
        ? `Subscription scheduled to cancel at period end`
        : `Subscription updated. Status: ${status ?? 'unknown'}`
    }
    case 'charge.refunded':
      return `Charge refunded${amountStr ? `: ${amountStr}` : ''}`
    default:
      return `Stripe event received: ${eventType}`
  }
}

export function getAlertTypeForStripeEvent(
  eventType: string
): 'payment_failure' | 'revenue_change' | null {
  switch (eventType) {
    case 'invoice.payment_failed':
    case 'payment_intent.payment_failed':
    case 'charge.dispute.created':
      return 'payment_failure'
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated':
    case 'charge.refunded':
      return 'revenue_change'
    default:
      return null
  }
}
