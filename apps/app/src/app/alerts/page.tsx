import type { Alert } from '@bionic/shared'
import { getAlerts } from '@/lib/engine'
import { formatRelativeTime } from '@/lib/time'
import { ResolveButton } from './ResolveButton'

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

function formatAbsoluteShort(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function getNextStep(alert: Alert): string {
  if (alert.type === 'deployment_regression') {
    return 'Inspect the latest deployment and related service errors.'
  }
  if (alert.type === 'service_error') {
    const msg = (alert.message ?? '').toUpperCase()
    if (msg.includes('PAYMENT')) return 'Check payment flow and Stripe events.'
    if (msg.includes('AUTH'))
      return 'Check authentication logs and recent auth changes.'
    if (
      msg.includes('DB') ||
      msg.includes('DATABASE') ||
      msg.includes('CONNECTION')
    ) {
      return 'Check database connectivity and recent migrations.'
    }
    return 'Check recent service errors and related events.'
  }
  if (alert.type === 'service_health') {
    return 'Check service health, latency, and uptime signals.'
  }
  if (alert.type === 'ci_failure') {
    return 'Open the failed GitHub workflow and inspect the latest run.'
  }
  if (alert.type === 'payment_failure') {
    return 'Check Stripe payment failures and recent checkout changes.'
  }
  if (alert.type === 'sentry_issue') {
    return 'Open the Sentry issue and check recent deploys.'
  }
  return 'Review related events and resolve when handled.'
}

export default async function AlertsPage() {
  const result = await getAlerts()

  if (!result) {
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

  const alerts = result.alerts
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityDiff =
      (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
    if (severityDiff !== 0) return severityDiff
    return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  })
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary uppercase tracking-wide">
            Alerts
          </h1>
          <p className="font-mono text-xs text-text-muted mt-1">
            {criticalCount > 0
              ? `${criticalCount} critical · ${alerts.length} open`
              : `${alerts.length} open`}
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-16">
          <div className="font-mono text-4xl text-accent mb-4">◈</div>
          <div className="font-mono text-sm text-text-muted uppercase tracking-widest mb-2">
            All systems quiet
          </div>
          <p className="font-body text-sm text-text-secondary">
            No open alerts. Bionic is watching.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical'
            const isWarning = alert.severity === 'warning'

            const borderColor = isCritical
              ? 'border-l-status-critical'
              : isWarning
                ? 'border-l-status-warning'
                : 'border-l-status-info'
            const bgColor = isCritical
              ? 'bg-status-critical/5'
              : 'bg-bg-surface'

            const severityBadgeClass = isCritical
              ? 'badge-critical'
              : isWarning
                ? 'badge-warning'
                : 'badge-info'

            return (
              <div
                key={alert.id}
                className={`rounded border border-border-subtle border-l-2 ${borderColor} ${bgColor} p-4`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={severityBadgeClass}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="badge-muted">{alert.type}</span>
                    {alert.serviceId && (
                      <span className="font-mono text-xs text-text-secondary">
                        {alert.serviceId}
                      </span>
                    )}
                  </div>
                  <ResolveButton alertId={alert.id} />
                </div>

                <div
                  className={`font-heading text-text-primary mb-1 ${
                    isCritical ? 'font-semibold' : ''
                  }`}
                >
                  {alert.title}
                </div>
                <div className="text-text-secondary font-body text-sm mb-3">
                  {alert.message}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-text-secondary">
                    Last seen {formatRelativeTime(alert.lastSeenAt)}
                  </span>
                  {(alert.count ?? 1) > 1 && (
                    <span className="font-mono text-xs text-text-secondary">
                      · ×{alert.count}
                    </span>
                  )}
                  <span className="font-mono text-xs text-text-muted ml-auto">
                    First seen {formatAbsoluteShort(alert.createdAt)}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-border-subtle">
                  <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mb-1">
                    Next Step
                  </div>
                  <p className="font-body text-xs text-text-secondary">
                    {getNextStep(alert)}
                  </p>
                </div>

                <details className="mt-3">
                  <summary className="font-mono text-xs text-text-muted cursor-pointer hover:text-text-secondary">
                    Technical details
                  </summary>
                  <div className="mt-2 font-mono text-xs text-text-muted break-all">
                    {alert.fingerprint ?? 'n/a'}
                  </div>
                </details>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
