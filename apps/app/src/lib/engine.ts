import type {
  ServiceStatus,
  ListAlertsResult,
  ListResearchItemsResult,
  CreateResearchItemInput,
  CreateResearchItemResult,
  ListActionsResult,
  ListEventsResult,
} from '@bionic/shared'

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? 'http://localhost:3001'
const ENGINE_TOKEN = process.env.BIONIC_ENGINE_TOKEN

function engineHeaders(): HeadersInit {
  const headers: HeadersInit = {}
  if (ENGINE_TOKEN) {
    headers['Authorization'] = `Bearer ${ENGINE_TOKEN}`
  }
  return headers
}

export async function getStatus(): Promise<ServiceStatus | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/api/status`, {
      cache: 'no-store',
      headers: engineHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getAlerts(): Promise<ListAlertsResult | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/api/alerts`, {
      cache: 'no-store',
      headers: engineHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getResearchItems(projectId = 'project_bionic'): Promise<ListResearchItemsResult | null> {
  try {
    const res = await fetch(
      `${ENGINE_URL}/api/research?projectId=${projectId}`,
      { cache: 'no-store', headers: engineHeaders() }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getEvents(projectId = 'project_bionic'): Promise<ListEventsResult | null> {
  try {
    const res = await fetch(
      `${ENGINE_URL}/api/events?projectId=${projectId}&limit=20`,
      { cache: 'no-store', headers: engineHeaders() }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getActions(projectId = 'project_bionic'): Promise<ListActionsResult | null> {
  try {
    const res = await fetch(
      `${ENGINE_URL}/api/actions?projectId=${projectId}&limit=20`,
      { cache: 'no-store', headers: engineHeaders() }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export interface DiagnosticsRunner {
  name: string
  lastRunAt: string | null
  lastSuccessAt: string | null
  lastError: string | null
}

export type RedactedFlag = '[set]' | '[not set]'

export interface RedactedEngineConfig {
  nodeEnv: string
  projectId: string
  engine: {
    port: number
    host: string
    token: RedactedFlag
    isProduction: boolean
  }
  supabase: {
    url: RedactedFlag
    serviceRoleKey: RedactedFlag
  }
  scheduler: {
    enabled: boolean
    digestCron: string
    digestTimezone: string
  }
  discord: {
    mode: 'bot' | 'webhook' | 'disabled'
    webhookUrl: RedactedFlag
    botToken: RedactedFlag
    channelId: string | null
    approverIds: RedactedFlag
  }
  notification: {
    quietHoursStart: number
    quietHoursEnd: number
    quietHoursTimezone: string
  }
  vercel: {
    webhookSecret: RedactedFlag
    projectMapSize: number
  }
  github: {
    webhookSecret: RedactedFlag
    repoMapSize: number
    enabled: boolean
  }
  stripe: {
    webhookSecret: RedactedFlag
    serviceId: string
    enabled: boolean
  }
  sentry: {
    webhookSecret: RedactedFlag
    serviceId: string
    enabled: boolean
  }
  deploymentWatch: {
    watchMinutes: number
    thresholdErrorCount: number
    thresholdIncreasePercent: number
  }
  anthropic: {
    apiKey: RedactedFlag
    enabled: boolean
  }
}

export interface Diagnostics {
  engine: {
    status: 'running' | 'degraded'
    version: string
    startedAt: string
    uptimeSeconds: number
  }
  config: RedactedEngineConfig
  db: { ok: boolean; checkedAt: string; error: string | null }
  scheduler: {
    enabled: boolean
    digestCron: string
    digestTimezone: string
    runners: DiagnosticsRunner[]
  }
  queue: {
    jobs: {
      pending: number
      running: number
      needsReview: number
      failedRecent: number
      oldestPendingCreatedAt: string | null
    }
    actions: {
      pendingApproval: number
      approved: number
      running: number
      failedRecent: number
      staleApproval24h: number
      autoCancelDue48h: number
    }
  }
  integrations: {
    discord: {
      mode: 'bot' | 'webhook' | 'disabled'
      channelConfigured: boolean
      approversConfigured: boolean
    }
    vercel: {
      webhookSecretConfigured: boolean
      mappedProjects: number
      watchingDeployments: number
      failedWatches: number
      latestDeploymentAt: string | null
    }
  }
  alerts: {
    openCritical: number
    criticalReminderDue: number
  }
  recent: {
    actions: Array<{ id: string; type: string; status: string; createdAt: string }>
    deployments: Array<{ id: string; serviceId: string; watchStatus: string; createdAt: string }>
  }
}

export async function getDiagnostics(): Promise<Diagnostics | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/api/diagnostics`, {
      cache: 'no-store',
      headers: engineHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export interface IncidentBrief {
  summary: string | null
  startHere: string | null
  affectedServices: string[]
  topIssueType: string | null
  generatedAt: string
  cached: boolean
  available: boolean
}

export interface EventMetricPoint {
  bucketStart: string
  errors: number
  healthDegraded: number
  total: number
}

export interface EventMetrics {
  points: EventMetricPoint[]
  window: string
  bucket: string
  projectId: string
}

export async function getEventMetrics(window = '24h'): Promise<EventMetrics | null> {
  try {
    const res = await fetch(
      `${ENGINE_URL}/api/metrics/events?window=${encodeURIComponent(window)}`,
      { cache: 'no-store', headers: engineHeaders() }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export type ServiceWatchStatus =
  | 'alerting'
  | 'receiving'
  | 'quiet'
  | 'stale'
  | 'demo'

export type ServiceSource =
  | 'sdk'
  | 'vercel'
  | 'github'
  | 'stripe'
  | 'sentry'
  | 'manual'
  | 'uptime'

export interface ServiceSummary {
  serviceId: string
  projectId: string
  isDemo: boolean
  status: ServiceWatchStatus
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

export type UptimeInterval = 30 | 60 | 300
export type UptimeMethod = 'GET' | 'HEAD'
export type UptimeStatus = 'up' | 'down'

export interface UptimeTarget {
  id: string
  projectId: string
  serviceId: string
  url: string
  method: UptimeMethod
  intervalSeconds: UptimeInterval
  timeoutMs: number
  expectedStatusMin: number
  expectedStatusMax: number
  enabled: boolean
  lastCheckedAt: string | null
  lastStatus: UptimeStatus | null
  lastLatencyMs: number | null
  lastStatusCode: number | null
  lastFailureReason: string | null
  consecutiveFailures: number
  degradedEventEmitted: boolean
  createdAt: string
  updatedAt: string
}

export interface ListUptimeTargetsResult {
  targets: UptimeTarget[]
}

export async function getUptimeTargets(): Promise<ListUptimeTargetsResult | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/api/uptime-targets`, {
      cache: 'no-store',
      headers: engineHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getServices(): Promise<ListServicesResult | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/api/services`, {
      cache: 'no-store',
      headers: engineHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getIncidentBrief(): Promise<IncidentBrief | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/api/incident-brief`, {
      cache: 'no-store',
      headers: engineHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function createResearchItem(
  input: CreateResearchItemInput
): Promise<CreateResearchItemResult | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...engineHeaders() },
      body: JSON.stringify(input),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
