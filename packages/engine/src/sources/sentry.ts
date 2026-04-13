import * as crypto from 'crypto'
import { getConfig } from '../config.js'

export interface SentryWebhookEvent {
  action: string
  data: {
    issue?: {
      id: string
      title: string
      culprit: string | null
      shortId: string
      level: string
      count: string
      project: {
        slug: string
        name: string
      }
      permalink: string
      metadata?: {
        value?: string
        type?: string
      }
    }
    triggering_rules?: string[]
  }
  installation?: {
    uuid: string
  }
}

export function verifySentrySignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader) return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  const a = Buffer.from(signatureHeader)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function resolveSentryServiceId(): string {
  return getConfig().sentry.serviceId
}

export type SentryTriggerKind = 'new_issue' | 'regressed' | 'spike' | 'resolved'

export function getSentryTriggerKind(action: string): SentryTriggerKind | null {
  switch (action) {
    case 'created':
      return 'new_issue'
    case 'regressed':
      return 'regressed'
    case 'resolved':
      return 'resolved'
    default:
      return null
  }
}

export function classifySentrySeverity(
  triggerKind: SentryTriggerKind,
  level: string,
  environment?: string
): 'critical' | 'warning' | 'info' {
  if (triggerKind === 'regressed') {
    return environment === 'production' ? 'critical' : 'warning'
  }
  if (triggerKind === 'new_issue') {
    if (level === 'fatal' || level === 'error') return 'warning'
    return 'info'
  }
  if (triggerKind === 'spike') {
    return 'critical'
  }
  return 'info'
}

export function buildSentryFingerprint(
  projectId: string,
  serviceId: string,
  sentryProjectSlug: string,
  issueId: string,
  triggerKind: SentryTriggerKind
): string {
  return [
    'v2',
    projectId,
    serviceId,
    'sentry_issue',
    sentryProjectSlug,
    issueId,
    triggerKind,
  ].join(':')
}

export function buildSentryAlertTitle(
  triggerKind: SentryTriggerKind,
  issue: NonNullable<SentryWebhookEvent['data']['issue']>
): string {
  const prefix = {
    new_issue: 'New Sentry issue',
    regressed: 'Sentry issue regressed',
    spike: 'Sentry error spike',
    resolved: 'Sentry issue resolved',
  }[triggerKind]
  return `${prefix}: ${issue.title.slice(0, 100)}`
}

export function buildSentryAlertMessage(
  issue: NonNullable<SentryWebhookEvent['data']['issue']>
): string {
  const parts: string[] = [
    `Project: ${issue.project.slug}`,
    `Level: ${issue.level}`,
    `Count: ${issue.count}`,
  ]
  if (issue.culprit) parts.push(`Culprit: ${issue.culprit.slice(0, 120)}`)
  parts.push(`URL: ${issue.permalink}`)
  return parts.join(' | ')
}
