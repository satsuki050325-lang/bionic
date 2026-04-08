// ── EngineEvent ────────────────────────────────────────────────────
export type EventSuffix =
  | 'detected'
  | 'requested'
  | 'started'
  | 'completed'
  | 'failed'
  | 'granted'
  | 'denied'

export interface EngineEvent {
  id: string
  project_id: string
  service_id: string
  type: string
  payload: Record<string, unknown>
  created_at: string
}

// ── JobStatus ──────────────────────────────────────────────────────
export type JobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'needs_review'
  | 'cancelled'

export type ResolutionReason =
  | 'user_cancelled'
  | 'superseded'
  | 'manual_resolution'
  | 'timeout'
  | 'dependency_error'

export interface EngineJob {
  id: string
  project_id: string
  type: string
  status: JobStatus
  resolution_reason?: ResolutionReason
  payload: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ── DecisionResult ─────────────────────────────────────────────────
export type DecisionType = 'auto_execute' | 'needs_review' | 'ignore'

export interface DecisionResult {
  type: DecisionType
  reason: string
  job_id?: string
}

// ── EngineAction ───────────────────────────────────────────────────
export type ActionType = 'notify' | 'restart' | 'cache_clear' | 'backup'

export interface EngineAction {
  id: string
  job_id: string
  type: ActionType
  payload: Record<string, unknown>
  executed_at?: string
}

// ── ServiceStatus ──────────────────────────────────────────────────
export type ServiceHealth = 'ok' | 'degraded' | 'down'

export interface ServiceStatus {
  service_id: string
  health: ServiceHealth
  latency_ms?: number
  checked_at: string
}

// ── Alert ──────────────────────────────────────────────────────────
export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface Alert {
  id: string
  project_id: string
  service_id: string
  severity: AlertSeverity
  message: string
  resolved: boolean
  created_at: string
}

// ── BionicEngineService ────────────────────────────────────────────
export type JobType = string

export interface BionicEngineService {
  captureEvent(event: EngineEvent): Promise<void>
  getStatus(): Promise<ServiceStatus>
  listAlerts(): Promise<Alert[]>
  runJob(type: JobType): Promise<EngineJob>
  retryAction(id: string): Promise<void>
  approveAction(id: string): Promise<void>
}
