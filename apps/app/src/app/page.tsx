import { getStatus } from '@/lib/engine'

export default async function DashboardPage() {
  const status = await getStatus()

  if (!status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-accent font-heading text-4xl">&#9670;</div>
        <h1 className="font-heading text-2xl font-semibold">Engine Offline</h1>
        <p className="text-text-secondary font-mono text-sm">
          Run <span className="text-accent">pnpm --filter @bionic/engine dev</span> to start
        </p>
      </div>
    )
  }

  const statusColor = status.engine.status === 'running'
    ? 'text-status-success'
    : status.engine.status === 'degraded'
    ? 'text-status-warning'
    : 'text-status-danger'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <span className={`font-mono text-sm ${statusColor}`}>
          ● {status.engine.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-text-secondary font-mono text-xs mb-2">PENDING JOBS</div>
          <div className="font-heading text-2xl font-semibold">
            {status.queue.pendingJobs}
          </div>
        </div>

        <div className={`card ${status.queue.pendingActions > 0 ? 'border-accent/50' : ''}`}>
          <div className="text-text-secondary font-mono text-xs mb-2">PENDING APPROVALS</div>
          <div className={`font-heading text-2xl font-semibold ${status.queue.pendingActions > 0 ? 'text-accent' : ''}`}>
            {status.queue.pendingActions}
          </div>
        </div>

        <div className={`card ${status.alerts.critical > 0 ? 'border-status-danger/50' : ''}`}>
          <div className="text-text-secondary font-mono text-xs mb-2">OPEN ALERTS</div>
          <div className={`font-heading text-2xl font-semibold ${status.alerts.critical > 0 ? 'text-status-danger' : ''}`}>
            {status.alerts.open}
            {status.alerts.critical > 0 && (
              <span className="text-sm text-status-danger ml-2">
                ({status.alerts.critical} critical)
              </span>
            )}
          </div>
        </div>

        <div className="card">
          <div className="text-text-secondary font-mono text-xs mb-2">LAST EVENT</div>
          <div className="font-mono text-sm text-text-secondary">
            {status.lastEventAt
              ? new Date(status.lastEventAt).toLocaleTimeString('ja-JP')
              : '\u2014'}
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="font-heading font-semibold text-sm text-text-secondary uppercase tracking-wider">
          Engine
        </div>
        <div className="grid grid-cols-2 gap-4 font-mono text-sm">
          <div>
            <span className="text-text-muted">VERSION</span>
            <span className="ml-4 text-text-primary">{status.engine.version ?? '\u2014'}</span>
          </div>
          <div>
            <span className="text-text-muted">STARTED</span>
            <span className="ml-4 text-text-primary">
              {status.engine.startedAt
                ? new Date(status.engine.startedAt).toLocaleTimeString('ja-JP')
                : '\u2014'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
