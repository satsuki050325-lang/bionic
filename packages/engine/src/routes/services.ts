import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { getConfig } from '../config.js'

export const servicesRouter = Router()

export type ServiceStatus = 'alerting' | 'receiving' | 'quiet' | 'stale' | 'demo'
export type ServiceSource =
  | 'sdk'
  | 'vercel'
  | 'github'
  | 'stripe'
  | 'sentry'
  | 'manual'
  | 'uptime'
  | 'heartbeat'

export interface ServiceSummary {
  serviceId: string
  projectId: string
  isDemo: boolean
  status: ServiceStatus
  lastEventAt: string | null
  eventCount24h: number
  openAlerts: number
  criticalAlerts: number
  sources: ServiceSource[]
  nextStep: string
}

export interface ListServicesResult {
  services: ServiceSummary[]
}

function inferSources(
  eventTypes: string[],
  eventSources: string[],
  alertTypes: string[],
  payloads: Record<string, unknown>[],
  hasUptimeTarget: boolean,
  hasHeartbeatTarget: boolean
): ServiceSource[] {
  const sources = new Set<ServiceSource>()

  if (hasUptimeTarget) sources.add('uptime')
  if (hasHeartbeatTarget) sources.add('heartbeat')

  if (
    eventSources.includes('sdk') ||
    eventTypes.some((t) => t.startsWith('service.'))
  ) {
    sources.add('sdk')
  }
  if (
    eventTypes.some((t) => t.startsWith('github.')) ||
    alertTypes.includes('ci_failure')
  ) {
    sources.add('github')
  }
  if (
    eventTypes.some((t) => t.startsWith('stripe.')) ||
    alertTypes.some((t) => ['payment_failure', 'revenue_change'].includes(t))
  ) {
    sources.add('stripe')
  }
  if (
    eventTypes.some((t) => t.startsWith('sentry.')) ||
    alertTypes.includes('sentry_issue')
  ) {
    sources.add('sentry')
  }
  if (
    alertTypes.includes('deployment_regression') ||
    payloads.some(
      (p) => p['provider'] === 'vercel' || typeof p['deploymentId'] === 'string'
    )
  ) {
    sources.add('vercel')
  }
  if (eventSources.some((s) => ['cli', 'app'].includes(s))) {
    sources.add('manual')
  }

  return Array.from(sources)
}

function inferNextStep(
  status: ServiceStatus,
  criticalAlerts: number,
  sources: ServiceSource[]
): string {
  if (status === 'demo')
    return 'This is demo data. Connect your real service to replace it.'
  if (status === 'alerting')
    return `Resolve ${criticalAlerts} critical alert${criticalAlerts > 1 ? 's' : ''} before they impact users.`
  if (status === 'stale')
    return 'No signals in 24h. Check if your service is still sending events.'
  if (sources.length === 0)
    return 'Send a test event to start monitoring.'
  if (!sources.includes('vercel') && !sources.includes('github')) {
    return 'Consider connecting Vercel or GitHub for deploy monitoring.'
  }
  return 'Service is healthy. Bionic is watching.'
}

servicesRouter.get('/', async (req, res) => {
  const config = getConfig()
  const projectId = (req.query['projectId'] as string) ?? config.projectId

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: allEvents, error: eventsError } = await supabase
    .from('engine_events')
    .select('service_id, type, source, payload, occurred_at')
    .eq('project_id', projectId)
    .order('occurred_at', { ascending: false })
    .limit(500)

  if (eventsError) {
    console.error('[services] failed to fetch events:', eventsError)
    res.status(503).json({ error: 'failed to fetch service data' })
    return
  }

  const { data: openAlerts, error: alertsError } = await supabase
    .from('engine_alerts')
    .select('service_id, severity, type')
    .eq('project_id', projectId)
    .eq('status', 'open')

  if (alertsError) {
    // Alerts are non-fatal — continue with empty list so events still surface.
    console.error('[services] failed to fetch alerts:', alertsError)
  }

  const { data: uptimeTargets, error: uptimeError } = await supabase
    .from('uptime_targets')
    .select('service_id, last_checked_at, last_status, enabled')
    .eq('project_id', projectId)

  if (uptimeError) {
    // Uptime is non-fatal — continue so event-based services still surface.
    console.error('[services] failed to fetch uptime targets:', uptimeError)
  }

  const { data: heartbeatTargets, error: heartbeatError } = await supabase
    .from('heartbeat_targets')
    .select(
      'service_id, last_ping_at, missed_event_emitted, enabled, expected_interval_seconds, grace_seconds, created_at'
    )
    .eq('project_id', projectId)

  if (heartbeatError) {
    console.error('[services] failed to fetch heartbeat targets:', heartbeatError)
  }

  const serviceMap = new Map<
    string,
    {
      lastEventAt: string | null
      eventTypes: string[]
      eventSources: string[]
      payloads: Record<string, unknown>[]
      eventCount24h: number
      hasUptimeTarget: boolean
      uptimeLastCheckedAt: string | null
      uptimeAnyDown: boolean
      hasHeartbeatTarget: boolean
      heartbeatLastPingAt: string | null
      heartbeatAnyMissing: boolean
    }
  >()

  const emptyEntry = () => ({
    lastEventAt: null as string | null,
    eventTypes: [] as string[],
    eventSources: [] as string[],
    payloads: [] as Record<string, unknown>[],
    eventCount24h: 0,
    hasUptimeTarget: false,
    uptimeLastCheckedAt: null as string | null,
    uptimeAnyDown: false,
    hasHeartbeatTarget: false,
    heartbeatLastPingAt: null as string | null,
    heartbeatAnyMissing: false,
  })

  for (const event of allEvents ?? []) {
    const sid = event.service_id as string
    if (!sid) continue
    if (!serviceMap.has(sid)) {
      const entry = emptyEntry()
      entry.lastEventAt = event.occurred_at as string
      serviceMap.set(sid, entry)
    }
    const entry = serviceMap.get(sid)!
    entry.eventTypes.push(event.type as string)
    entry.eventSources.push(event.source as string)
    if (event.payload)
      entry.payloads.push(event.payload as Record<string, unknown>)
    if (new Date(event.occurred_at as string) >= new Date(since24h)) {
      entry.eventCount24h++
    }
  }

  const alertMap = new Map<
    string,
    { open: number; critical: number; types: string[] }
  >()
  for (const alert of openAlerts ?? []) {
    const sid = alert.service_id as string | null
    if (!sid) continue
    if (!alertMap.has(sid))
      alertMap.set(sid, { open: 0, critical: 0, types: [] })
    const entry = alertMap.get(sid)!
    entry.open++
    if (alert.severity === 'critical') entry.critical++
    if (alert.type) entry.types.push(alert.type as string)

    // Surface services that have open alerts but no recent events
    // (e.g. event aged out of the 500-row window).
    if (!serviceMap.has(sid)) {
      serviceMap.set(sid, emptyEntry())
    }
  }

  // Fold uptime_targets in so a service card appears even when the only signal
  // is a registered probe (no SDK events, no alerts, never failed).
  for (const target of uptimeTargets ?? []) {
    const sid = target.service_id as string | null
    if (!sid) continue
    if (!serviceMap.has(sid)) {
      serviceMap.set(sid, emptyEntry())
    }
    const entry = serviceMap.get(sid)!
    entry.hasUptimeTarget = true
    const checkedAt = target.last_checked_at as string | null
    if (checkedAt) {
      if (
        !entry.uptimeLastCheckedAt ||
        new Date(checkedAt) > new Date(entry.uptimeLastCheckedAt)
      ) {
        entry.uptimeLastCheckedAt = checkedAt
      }
      if (new Date(checkedAt) >= new Date(since24h)) {
        entry.eventCount24h++
      }
    }
    if (target.last_status === 'down' && target.enabled) {
      entry.uptimeAnyDown = true
    }
  }

  // Fold heartbeat_targets: register the service + surface missing state so a
  // scheduled-job-only service shows up in the Services list.
  for (const target of heartbeatTargets ?? []) {
    const sid = target.service_id as string | null
    if (!sid) continue
    if (!serviceMap.has(sid)) {
      serviceMap.set(sid, emptyEntry())
    }
    const entry = serviceMap.get(sid)!
    entry.hasHeartbeatTarget = true
    const pingAt = target.last_ping_at as string | null
    if (pingAt) {
      if (
        !entry.heartbeatLastPingAt ||
        new Date(pingAt) > new Date(entry.heartbeatLastPingAt)
      ) {
        entry.heartbeatLastPingAt = pingAt
      }
      if (new Date(pingAt) >= new Date(since24h)) {
        entry.eventCount24h++
      }
    }
    if (target.missed_event_emitted === true && target.enabled) {
      entry.heartbeatAnyMissing = true
    }
  }

  const now = Date.now()
  const services: ServiceSummary[] = []

  for (const [serviceId, data] of serviceMap.entries()) {
    const isDemo = serviceId === 'demo-api' || serviceId.startsWith('demo-')
    const alerts = alertMap.get(serviceId) ?? {
      open: 0,
      critical: 0,
      types: [],
    }
    // Treat an uptime probe's last check as an additional positive signal:
    // a healthy service with no SDK events but a responding probe should look
    // "receiving", not "stale".
    const signalCandidates = [
      data.lastEventAt,
      data.uptimeLastCheckedAt,
      data.heartbeatLastPingAt,
    ].filter((v): v is string => v !== null)
    const effectiveLastSignalAt =
      signalCandidates.length > 0
        ? signalCandidates.reduce((a, b) =>
            new Date(a) > new Date(b) ? a : b
          )
        : null
    const elapsedMs =
      effectiveLastSignalAt !== null
        ? now - new Date(effectiveLastSignalAt).getTime()
        : Number.POSITIVE_INFINITY

    const sources = inferSources(
      data.eventTypes,
      data.eventSources,
      alerts.types,
      data.payloads,
      data.hasUptimeTarget,
      data.hasHeartbeatTarget
    )

    let status: ServiceStatus
    if (isDemo) {
      status = 'demo'
    } else if (alerts.critical > 0 || data.uptimeAnyDown || data.heartbeatAnyMissing) {
      status = 'alerting'
    } else if (effectiveLastSignalAt === null) {
      // Has probe target (uptime/heartbeat) but no signal yet → quiet.
      status =
        data.hasUptimeTarget || data.hasHeartbeatTarget ? 'quiet' : 'stale'
    } else if (elapsedMs < 24 * 60 * 60 * 1000) {
      status = data.eventCount24h >= 3 ? 'receiving' : 'quiet'
    } else {
      status = 'stale'
    }

    services.push({
      serviceId,
      projectId,
      isDemo,
      status,
      lastEventAt: effectiveLastSignalAt,
      eventCount24h: data.eventCount24h,
      openAlerts: alerts.open,
      criticalAlerts: alerts.critical,
      sources,
      nextStep: inferNextStep(status, alerts.critical, sources),
    })
  }

  const ORDER: Record<ServiceStatus, number> = {
    alerting: 0,
    receiving: 1,
    quiet: 2,
    stale: 3,
    demo: 4,
  }
  services.sort((a, b) => ORDER[a.status] - ORDER[b.status])

  res.json({ services } satisfies ListServicesResult)
})
