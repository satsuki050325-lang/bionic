import Link from 'next/link'
import { getStatus, getEvents } from '@/lib/engine'

function eventTypeColor(type: string): string {
  if (type === 'service.error.reported') return 'text-status-critical'
  if (type === 'service.health.degraded') return 'text-status-warning'
  if (type === 'service.health.reported') return 'text-status-success'
  return 'text-text-muted'
}

export default async function DashboardPage() {
  const [status, eventsResult] = await Promise.all([getStatus(), getEvents()])

  if (!status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-accent font-heading text-4xl">&#9670;</div>
        <h1 className="font-heading text-2xl font-semibold">Engine Offline</h1>
        <p className="text-text-secondary font-mono text-sm">
          Run <span className="text-accent">pnpm --filter @bionic/engine dev</span> to start
        </p>
        <Link
          href="/onboarding"
          className="font-mono text-sm text-accent hover:underline uppercase tracking-wider"
        >
          Open Onboarding →
        </Link>
      </div>
    )
  }

  const openAlerts = status.alerts.open
  const criticalAlerts = status.alerts.critical
  const pendingJobs = status.queue.pendingJobs
  const pendingApprovals = status.queue.pendingActions
  const runtimeStatus = status.engine.status

  const runtimeDotColor =
    runtimeStatus === 'running'
      ? 'bg-status-success'
      : runtimeStatus === 'degraded'
        ? 'bg-status-warning'
        : 'bg-status-critical'

  const runtimeTextColor =
    runtimeStatus === 'running'
      ? 'text-status-success'
      : runtimeStatus === 'degraded'
        ? 'text-status-warning'
        : 'text-status-critical'

  const events = eventsResult?.events ?? []
  const versionStr = status.engine.version ?? '\u2014'
  const startedStr = status.engine.startedAt
    ? new Date(status.engine.startedAt).toLocaleTimeString('en-US')
    : '\u2014'

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const nothingPending = openAlerts === 0 && pendingApprovals === 0 && pendingJobs === 0

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary uppercase tracking-wide">
            Dashboard
          </h1>
          <p className="font-mono text-xs text-text-muted mt-1">{todayStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full inline-block ${runtimeDotColor}`}></span>
          <span className={`font-mono text-xs uppercase tracking-widest ${runtimeTextColor}`}>
            {runtimeStatus}
          </span>
        </div>
      </div>

      {/* Operational Brief — only when alerts are open */}
      {openAlerts > 0 && (
        <div
          className={`border-l-2 rounded p-4 mb-6 ${
            criticalAlerts > 0
              ? 'border-status-critical bg-status-critical/5'
              : 'border-accent bg-accent/5'
          }`}
        >
          <div
            className={`font-mono text-xs uppercase tracking-widest mb-2 ${
              criticalAlerts > 0 ? 'text-status-critical' : 'text-accent'
            }`}
          >
            Operational Brief
          </div>
          <div className="font-heading text-lg font-semibold text-text-primary mb-1">
            {criticalAlerts > 0
              ? `${criticalAlerts} critical alert${criticalAlerts > 1 ? 's' : ''} require attention`
              : `${openAlerts} alert${openAlerts > 1 ? 's' : ''} open`}
          </div>
          <p className="font-body text-sm text-text-secondary mb-3">
            {criticalAlerts > 0
              ? 'Critical issues detected. Review and resolve before they impact users.'
              : 'Non-critical alerts are open. Monitor for escalation.'}
          </p>
          <Link
            href="/alerts"
            className={`font-mono text-xs uppercase tracking-widest hover:underline ${
              criticalAlerts > 0 ? 'text-status-critical' : 'text-accent'
            }`}
          >
            Review Alerts →
          </Link>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Open Alerts - 主役 (2x width on md+) */}
        <div
          className={`md:col-span-2 rounded p-5 border ${
            criticalAlerts > 0
              ? 'bg-status-critical/5 border-status-critical/50'
              : 'bg-bg-surface border-border-subtle'
          }`}
        >
          <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mb-2">
            Open Alerts
          </div>
          <div
            className={`font-heading text-5xl font-bold mb-1 ${
              criticalAlerts > 0 ? 'text-status-critical' : 'text-text-primary'
            }`}
          >
            {openAlerts}
          </div>
          {criticalAlerts > 0 && (
            <div className="font-mono text-xs text-status-critical">
              {criticalAlerts} critical
            </div>
          )}
        </div>

        {/* Pending Jobs */}
        <div className="bg-bg-surface border border-border-subtle rounded p-5">
          <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mb-2">
            Pending Jobs
          </div>
          <div
            className={`font-heading text-4xl font-bold ${
              pendingJobs > 0 ? 'text-accent' : 'text-text-primary'
            }`}
          >
            {pendingJobs}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-bg-surface border border-border-subtle rounded p-5">
          <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mb-2">
            Pending Approvals
          </div>
          <div
            className={`font-heading text-4xl font-bold ${
              pendingApprovals > 0 ? 'text-status-warning' : 'text-text-primary'
            }`}
          >
            {pendingApprovals}
          </div>
        </div>
      </div>

      {/* What Needs Attention */}
      <div className="bg-bg-surface border border-border-subtle rounded p-5 mb-4">
        <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mb-4">
          What Needs Attention
        </div>

        {criticalAlerts > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <div>
              <span className="font-mono text-xs bg-status-critical/10 text-status-critical border border-status-critical/30 px-2 py-0.5 rounded uppercase tracking-wider mr-2">
                Critical
              </span>
              <span className="font-body text-sm text-text-primary">
                {criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''}
              </span>
            </div>
            <Link
              href="/alerts"
              className="font-mono text-xs text-accent hover:underline"
            >
              Review →
            </Link>
          </div>
        )}

        {pendingApprovals > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <div>
              <span className="font-mono text-xs bg-status-warning/10 text-status-warning border border-status-warning/30 px-2 py-0.5 rounded uppercase tracking-wider mr-2">
                Approval
              </span>
              <span className="font-body text-sm text-text-primary">
                {pendingApprovals} action{pendingApprovals > 1 ? 's' : ''} waiting for approval
              </span>
            </div>
            <Link
              href="/actions"
              className="font-mono text-xs text-accent hover:underline"
            >
              Review →
            </Link>
          </div>
        )}

        {pendingJobs > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <div>
              <span className="font-mono text-xs bg-status-info/10 text-status-info border border-status-info/30 px-2 py-0.5 rounded uppercase tracking-wider mr-2">
                Jobs
              </span>
              <span className="font-body text-sm text-text-primary">
                {pendingJobs} job{pendingJobs > 1 ? 's' : ''} in queue
              </span>
            </div>
            <Link
              href="/diagnostics"
              className="font-mono text-xs text-accent hover:underline"
            >
              View →
            </Link>
          </div>
        )}

        {nothingPending && (
          <div className="text-center py-6">
            <div className="font-mono text-2xl text-accent mb-2">◈</div>
            <div className="font-mono text-xs text-text-muted uppercase tracking-widest">
              All systems nominal
            </div>
          </div>
        )}
      </div>

      {/* Engine Info → Diagnostics Link */}
      <div className="bg-bg-surface border border-border-subtle rounded p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mb-1">
              Engine
            </div>
            <div className="font-mono text-xs text-text-muted">
              v{versionStr} · Started {startedStr}
            </div>
          </div>
          <Link
            href="/diagnostics"
            className="font-mono text-xs text-accent hover:underline uppercase tracking-widest"
          >
            Diagnostics →
          </Link>
        </div>
      </div>

      {/* Recent Signal (secondary, machine-log style) */}
      <div className="bg-bg-surface border border-border-subtle rounded p-5">
        <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mb-4">
          Recent Signal
        </div>
        {events.length === 0 ? (
          <p className="text-text-muted font-mono text-sm">No events yet</p>
        ) : (
          <div className="space-y-1">
            {events.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 py-1 border-b border-border-subtle/50 last:border-b-0"
              >
                <span
                  className={`font-mono text-xs shrink-0 ${eventTypeColor(event.type)}`}
                >
                  {event.type}
                </span>
                <span className="text-text-secondary font-mono text-xs shrink-0">
                  {event.serviceId}
                </span>
                <span className="text-text-muted font-mono text-xs ml-auto shrink-0">
                  {new Date(event.createdAt).toLocaleTimeString('en-US')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
