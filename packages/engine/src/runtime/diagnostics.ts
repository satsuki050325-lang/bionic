export interface RunnerState {
  lastRunAt: string | null
  lastSuccessAt: string | null
  lastError: string | null
}

const runnerState: Record<string, RunnerState> = {
  job_runner: { lastRunAt: null, lastSuccessAt: null, lastError: null },
  deployment_watch: { lastRunAt: null, lastSuccessAt: null, lastError: null },
  approved_actions: { lastRunAt: null, lastSuccessAt: null, lastError: null },
  stale_approvals: { lastRunAt: null, lastSuccessAt: null, lastError: null },
  critical_alert_reminders: { lastRunAt: null, lastSuccessAt: null, lastError: null },
  uptime_runner: { lastRunAt: null, lastSuccessAt: null, lastError: null },
  heartbeat_missing_runner: { lastRunAt: null, lastSuccessAt: null, lastError: null },
}

export function recordRunnerStart(name: string): void {
  if (runnerState[name]) {
    runnerState[name].lastRunAt = new Date().toISOString()
  }
}

export function recordRunnerSuccess(name: string): void {
  if (runnerState[name]) {
    runnerState[name].lastSuccessAt = new Date().toISOString()
    runnerState[name].lastError = null
  }
}

export function recordRunnerError(name: string, error: string): void {
  if (runnerState[name]) {
    runnerState[name].lastError = error
  }
}

export function getRunnerStates(): Record<string, RunnerState> {
  return { ...runnerState }
}
