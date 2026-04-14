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
  payloads: Record<string, unknown>[]
): ServiceSource[] {
  const sources = new Set<ServiceSource>()

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

  const { data: allEvents } = await supabase
    .from('engine_events')
    .select('service_id, type, source, payload, occurred_at')
    .eq('project_id', projectId)
    .order('occurred_at', { ascending: false })
    .limit(500)

  const { data: openAlerts } = await supabase
    .from('engine_alerts')
    .select('service_id, severity, type')
    .eq('project_id', projectId)
    .eq('status', 'open')

  if (!allEvents) {
    res.json({ services: [] } satisfies ListServicesResult)
    return
  }

  const serviceMap = new Map<
    string,
    {
      lastEventAt: string
      eventTypes: string[]
      eventSources: string[]
      payloads: Record<string, unknown>[]
      eventCount24h: number
    }
  >()

  for (const event of allEvents) {
    const sid = event.service_id as string
    if (!sid) continue
    if (!serviceMap.has(sid)) {
      serviceMap.set(sid, {
        lastEventAt: event.occurred_at as string,
        eventTypes: [],
        eventSources: [],
        payloads: [],
        eventCount24h: 0,
      })
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
    const lastEventMs = new Date(data.lastEventAt).getTime()
    const elapsedMs = now - lastEventMs

    const sources = inferSources(
      data.eventTypes,
      data.eventSources,
      alerts.types,
      data.payloads
    )

    let status: ServiceStatus
    if (isDemo) {
      status = 'demo'
    } else if (alerts.critical > 0) {
      status = 'alerting'
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
      lastEventAt: data.lastEventAt,
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
