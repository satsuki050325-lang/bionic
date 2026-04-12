export type NotificationKind =
  | 'alert_created'
  | 'alert_reminder'
  | 'approval_stale'
  | 'digest'

export type NotificationDecision =
  | { shouldNotify: true; reason: string; urgency: 'normal' | 'critical' }
  | { shouldNotify: false; reason: string; nextCheckAt?: string }

export interface NotificationPolicyInput {
  kind: NotificationKind
  severity?: 'info' | 'warning' | 'critical'
  status?: string
  createdAt?: string
  lastNotifiedAt?: string | null
  notificationCount?: number
  now: Date
}

function getQuietHoursConfig() {
  const parseHour = (value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue
    const parsed = parseInt(value, 10)
    if (isNaN(parsed) || parsed < 0 || parsed > 23) {
      console.warn(
        `[notification-policy] invalid hour value: "${value}". Using default: ${defaultValue}`
      )
      return defaultValue
    }
    return parsed
  }

  return {
    start: parseHour(process.env.BIONIC_QUIET_HOURS_START, 23),
    end: parseHour(process.env.BIONIC_QUIET_HOURS_END, 7),
    timezone: process.env.BIONIC_QUIET_HOURS_TIMEZONE ?? 'Asia/Tokyo',
  }
}

export function isQuietHours(now: Date, timezone?: string): boolean {
  const config = getQuietHoursConfig()
  const tz = timezone ?? config.timezone

  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: tz,
    hour: 'numeric',
    hour12: false,
  })
  const hour = parseInt(formatter.format(now), 10)

  if (config.start > config.end) {
    return hour >= config.start || hour < config.end
  }
  return hour >= config.start && hour < config.end
}

const CRITICAL_REMINDER_INTERVAL_MINUTES = 30
const STALE_APPROVAL_REMINDER_HOURS = 24

export function shouldNotify(input: NotificationPolicyInput): NotificationDecision {
  const { kind, severity, status, createdAt, lastNotifiedAt, now } = input
  const quiet = isQuietHours(now)

  if (kind === 'digest') {
    return { shouldNotify: true, reason: 'scheduled digest', urgency: 'normal' }
  }

  if (kind === 'alert_created') {
    const isCritical = severity === 'critical'

    if (quiet && !isCritical) {
      const nextCheckAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
      return {
        shouldNotify: false,
        reason: 'quiet hours: non-critical alert suppressed',
        nextCheckAt,
      }
    }

    if (!lastNotifiedAt) {
      return {
        shouldNotify: true,
        reason: 'new alert',
        urgency: isCritical ? 'critical' : 'normal',
      }
    }

    return { shouldNotify: false, reason: 'already notified' }
  }

  if (kind === 'alert_reminder') {
    if (severity !== 'critical' || status !== 'open') {
      return { shouldNotify: false, reason: 'reminder only for open critical alerts' }
    }

    if (!lastNotifiedAt) {
      return { shouldNotify: false, reason: 'no previous notification' }
    }

    const minutesSinceLast = (now.getTime() - new Date(lastNotifiedAt).getTime()) / 60000
    if (minutesSinceLast < CRITICAL_REMINDER_INTERVAL_MINUTES) {
      const nextCheckAt = new Date(
        new Date(lastNotifiedAt).getTime() + CRITICAL_REMINDER_INTERVAL_MINUTES * 60 * 1000
      ).toISOString()
      return {
        shouldNotify: false,
        reason: `too soon: ${Math.round(minutesSinceLast)}min since last notification`,
        nextCheckAt,
      }
    }

    return { shouldNotify: true, reason: 'critical alert reminder', urgency: 'critical' }
  }

  if (kind === 'approval_stale') {
    if (!createdAt) return { shouldNotify: false, reason: 'no createdAt' }

    const hoursSinceCreated = (now.getTime() - new Date(createdAt).getTime()) / 3600000
    if (hoursSinceCreated < STALE_APPROVAL_REMINDER_HOURS) {
      return { shouldNotify: false, reason: 'not yet stale' }
    }

    if (lastNotifiedAt) {
      const hoursSinceLast = (now.getTime() - new Date(lastNotifiedAt).getTime()) / 3600000
      if (hoursSinceLast < STALE_APPROVAL_REMINDER_HOURS) {
        return { shouldNotify: false, reason: 'already reminded recently' }
      }
    }

    return { shouldNotify: true, reason: 'approval stale reminder', urgency: 'normal' }
  }

  return { shouldNotify: false, reason: 'unknown kind' }
}
