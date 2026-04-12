export interface EnqueueJobParams {
  projectId: string
  type: string
  requestedBy: string
  payload?: Record<string, unknown>
  dedupeKey?: string
}

export interface JobExecutionResult {
  success: boolean
  reason?: string
}
