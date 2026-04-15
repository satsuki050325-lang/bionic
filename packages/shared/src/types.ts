// ── 基本型 ────────────────────────────────────────────────────────
export type ISODateString = string

export type EventType =
  | 'service.health.reported'
  | 'service.health.degraded'
  | 'service.error.reported'
  | 'service.usage.reported'
  | 'research.item.detected'
  | 'job.started'
  | 'job.completed'
  | 'job.failed'
  | 'github.workflow.failed'
  | 'github.issue.opened'
  | 'github.pull_request.merged'
  | 'github.release.published'
  | 'stripe.invoice.payment_failed'
  | 'stripe.payment_intent.payment_failed'
  | 'stripe.subscription.deleted'
  | 'stripe.subscription.updated'
  | 'stripe.dispute.created'
  | 'stripe.refund.created'
  | 'sentry.issue'
  | 'sentry.metric_alert'

export type AlertType =
  | 'service_health'
  | 'service_error'
  | 'research_digest'
  | 'job_failure'
  | 'deployment_regression'
  | 'ci_failure'
  | 'payment_failure'
  | 'revenue_change'
  | 'sentry_issue'

export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertStatus = 'open' | 'resolved'
export type EngineRuntimeStatus = 'idle' | 'running' | 'degraded'
export type JobType = 'research_digest'
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'needs_review' | 'cancelled'
export type EventSource = 'sdk' | 'app' | 'cli' | 'engine' | 'scheduler' | 'mcp'

// ── EngineEvent ────────────────────────────────────────────────────
export interface EngineEvent {
  id: string
  projectId: string
  serviceId: string
  type: EventType
  occurredAt: ISODateString
  source: EventSource
  payload: Record<string, unknown>
}

export interface CaptureEventInput {
  event: EngineEvent
}

export interface CaptureEventResult {
  accepted: boolean
  eventId: string | null
  duplicate?: boolean
}

// ── ServiceStatus ──────────────────────────────────────────────────
export interface ServiceStatus {
  engine: {
    status: EngineRuntimeStatus
    startedAt: ISODateString | null
    version: string | null
  }
  queue: {
    pendingJobs: number
    runningJobs: number
    needsReviewJobs: number
    pendingActions: number
  }
  alerts: {
    open: number
    critical: number
  }
  lastEventAt: ISODateString | null
}

// ── Alert ──────────────────────────────────────────────────────────
export interface Alert {
  id: string
  projectId: string
  serviceId: string | null
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  status: AlertStatus
  fingerprint: string
  count: number
  lastSeenAt: ISODateString
  lastNotifiedAt: ISODateString | null
  notificationCount: number
  resolvedAt: ISODateString | null
  resolvedBy: string | null
  resolvedReason: string | null
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface ListAlertsInput {
  status?: AlertStatus
  severity?: AlertSeverity
  limit?: number
}

export interface ListAlertsResult {
  alerts: Alert[]
}

// ── Job ───────────────────────────────────────────────────────────
export interface Job {
  id: string
  type: JobType
  status: JobStatus
  requestedBy: EventSource
  createdAt: ISODateString
  startedAt: ISODateString | null
  completedAt: ISODateString | null
}

export interface RunJobInput {
  type: 'research_digest'
  requestedBy: EventSource
  projectId?: string
}

export interface RunJobResult {
  jobId: string | null
  status: 'started' | 'skipped'
  message: string
}

// ── ResearchItem ───────────────────────────────────────────────────
export interface ResearchItem {
  id: string
  projectId: string
  title: string
  summary: string
  url: string | null
  category: string | null
  importanceScore: number
  isDigestSent: boolean
  createdAt: string
}

export interface CreateResearchItemInput {
  projectId?: string
  title: string
  summary: string
  url?: string
  category?: string
  importanceScore: number
}

export interface CreateResearchItemResult {
  item: ResearchItem
}

export interface ListResearchItemsInput {
  projectId?: string
  category?: string
  isDigestSent?: boolean
  limit?: number
}

export interface ListResearchItemsResult {
  items: ResearchItem[]
}

// ── EventSummary ──────────────────────────────────────────────────
export interface EventSummary {
  id: string
  projectId: string
  serviceId: string
  type: EventType
  source: EventSource
  occurredAt: ISODateString
  createdAt: ISODateString
  clientEventId: string | null
}

export interface ListEventsResult {
  events: EventSummary[]
}

// ── ActionType / ActionMode / ActionStatus ─────────────────────────
export type ActionType =
  | 'notify_discord'
  | 'create_alert'
  | 'run_research_digest'
  | 'mark_digest_sent'
  | 'retry_job'
  | 'evaluate_deployment_watch'
  | 'resolve_alert'

export type DeploymentWatchStatus =
  | 'pending'
  | 'watching'
  | 'alerted'
  | 'completed'
  | 'failed'

export interface Deployment {
  id: string
  projectId: string
  serviceId: string
  provider: string
  providerProjectId: string
  providerDeploymentId: string
  deploymentUrl: string
  target: string | null
  gitCommitSha: string | null
  gitCommitMessage: string | null
  dashboardUrl: string | null
  status: string
  readyAt: ISODateString | null
  watchStartedAt: ISODateString | null
  watchUntil: ISODateString | null
  watchStatus: DeploymentWatchStatus
  baselineErrorCount: number
  currentErrorCount: number
  errorIncreasePercent: number | null
  alertId: string | null
  createdAt: ISODateString
  updatedAt: ISODateString
}

export type ActionMode = 'automatic' | 'approval_required' | 'manual'

export type ActionStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'skipped'
  | 'pending_approval'
  | 'approved'
  | 'denied'
  | 'cancelled'

export type ApprovalStatus =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'denied'

// ── EngineAction ───────────────────────────────────────────────────
export interface EngineAction {
  id: string
  projectId: string
  serviceId: string | null
  eventId: string | null
  alertId: string | null
  jobId: string | null
  type: ActionType
  mode: ActionMode
  status: ActionStatus
  title: string
  reason: string | null
  input: Record<string, unknown>
  result: Record<string, unknown>
  error: Record<string, unknown> | null
  requestedBy: string
  approvedBy: string | null
  approvedAt: ISODateString | null
  deniedBy: string | null
  deniedAt: ISODateString | null
  startedAt: ISODateString | null
  completedAt: ISODateString | null
  lastNotifiedAt: ISODateString | null
  notificationCount: number
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface ListActionsInput {
  projectId?: string
  status?: ActionStatus
  type?: ActionType
  mode?: ActionMode
  limit?: number
}

export interface ListActionsResult {
  actions: EngineAction[]
}

// ── UptimeTarget ───────────────────────────────────────────────────
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
  lastCheckedAt: ISODateString | null
  lastStatus: UptimeStatus | null
  lastLatencyMs: number | null
  lastStatusCode: number | null
  lastFailureReason: string | null
  consecutiveFailures: number
  degradedEventEmitted: boolean
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface ListUptimeTargetsResult {
  targets: UptimeTarget[]
}

export interface CreateUptimeTargetInput {
  projectId?: string
  serviceId: string
  url: string
  intervalSeconds: UptimeInterval
  method?: UptimeMethod
  timeoutMs?: number
  expectedStatusMin?: number
  expectedStatusMax?: number
}

export interface UpdateUptimeTargetInput {
  url?: string
  intervalSeconds?: UptimeInterval
  method?: UptimeMethod
  timeoutMs?: number
  expectedStatusMin?: number
  expectedStatusMax?: number
  enabled?: boolean
}

export interface UptimeCheckOutcome {
  ok: boolean
  statusCode: number | null
  latencyMs: number | null
  reason: string | null
}

// ── BionicEngineService ────────────────────────────────────────────
export interface BionicEngineService {
  captureEvent(input: CaptureEventInput): Promise<CaptureEventResult>
  getStatus(): Promise<ServiceStatus>
  listAlerts(input?: ListAlertsInput): Promise<ListAlertsResult>
  runJob(input: RunJobInput): Promise<RunJobResult>
}
