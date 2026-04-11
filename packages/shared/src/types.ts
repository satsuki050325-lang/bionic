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

export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertStatus = 'open' | 'resolved'
export type EngineRuntimeStatus = 'idle' | 'running' | 'degraded'
export type JobType = 'research_digest'
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'needs_review' | 'cancelled'
export type EventSource = 'sdk' | 'app' | 'cli' | 'engine' | 'scheduler'

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
  accepted: true
  eventId: string
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
  type: 'service_health' | 'service_error' | 'research_digest' | 'job_failure'
  severity: AlertSeverity
  title: string
  message: string
  status: AlertStatus
  fingerprint: string
  count: number
  lastSeenAt: ISODateString
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
  job: Job
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
  startedAt: ISODateString | null
  completedAt: ISODateString | null
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

// ── BionicEngineService ────────────────────────────────────────────
export interface BionicEngineService {
  captureEvent(input: CaptureEventInput): Promise<CaptureEventResult>
  getStatus(): Promise<ServiceStatus>
  listAlerts(input?: ListAlertsInput): Promise<ListAlertsResult>
  runJob(input: RunJobInput): Promise<RunJobResult>
}
