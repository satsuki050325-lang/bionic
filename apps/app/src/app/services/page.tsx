import Link from 'next/link'
import {
  getServices,
  getUptimeTargets,
  type ServiceWatchStatus,
  type UptimeTarget,
} from '@/lib/engine'
import { formatRelativeTime } from '@/lib/time'

const STATUS_BADGE: Record<
  ServiceWatchStatus,
  { label: string; className: string }
> = {
  alerting: {
    label: 'ALERTING',
    className:
      'text-status-critical border-status-critical/50 bg-status-critical/10',
  },
  receiving: {
    label: 'RECEIVING',
    className:
      'text-status-success border-status-success/50 bg-status-success/10',
  },
  quiet: {
    label: 'QUIET',
    className: 'text-text-muted border-border-subtle',
  },
  stale: {
    label: 'STALE',
    className:
      'text-status-warning border-status-warning/50 bg-status-warning/10',
  },
  demo: {
    label: 'DEMO',
    className: 'text-status-info border-status-info/50 bg-status-info/10',
  },
}

const SOURCE_LABELS: Record<string, string> = {
  sdk: 'SDK',
  vercel: 'Vercel',
  github: 'GitHub',
  stripe: 'Stripe',
  sentry: 'Sentry',
  manual: 'CLI',
}

const ALL_INTEGRATION_SOURCES = ['sdk', 'vercel', 'github', 'stripe', 'sentry'] as const

function summarizeUptime(targets: UptimeTarget[]): {
  label: string
  className: string
  detail: string
} | null {
  if (targets.length === 0) return null
  const hasDown = targets.some((t) => t.lastStatus === 'down')
  const allUp = targets.every((t) => t.lastStatus === 'up')
  const anyChecked = targets.some((t) => t.lastCheckedAt !== null)

  if (hasDown) {
    const down = targets.filter((t) => t.lastStatus === 'down').length
    return {
      label: 'UPTIME DOWN',
      className:
        'text-status-critical border-status-critical/50 bg-status-critical/10',
      detail: `${down}/${targets.length} target${targets.length > 1 ? 's' : ''} down`,
    }
  }
  if (allUp) {
    return {
      label: 'UPTIME UP',
      className:
        'text-status-success border-status-success/50 bg-status-success/10',
      detail: `${targets.length} target${targets.length > 1 ? 's' : ''} responding`,
    }
  }
  return {
    label: anyChecked ? 'UPTIME MIXED' : 'UPTIME PENDING',
    className: 'text-text-muted border-border-subtle',
    detail: `${targets.length} target${targets.length > 1 ? 's' : ''}`,
  }
}

export default async function ServicesPage() {
  const [data, uptimeData] = await Promise.all([
    getServices(),
    getUptimeTargets(),
  ])

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-accent font-heading text-4xl">&#9670;</div>
        <h1 className="font-heading text-2xl font-semibold">Engine Offline</h1>
        <p className="text-text-secondary font-mono text-sm">
          Run{' '}
          <span className="text-accent">
            pnpm --filter @bionic/engine dev
          </span>{' '}
          to start
        </p>
      </div>
    )
  }

  const services = data.services
  const realServices = services.filter((s) => !s.isDemo)
  const uptimeByService = new Map<string, UptimeTarget[]>()
  for (const t of uptimeData?.targets ?? []) {
    const existing = uptimeByService.get(t.serviceId) ?? []
    existing.push(t)
    uptimeByService.set(t.serviceId, existing)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary uppercase tracking-wide">
            Services
          </h1>
          <p className="font-mono text-xs text-text-muted mt-1">
            {realServices.length > 0
              ? `${realServices.length} service${realServices.length > 1 ? 's' : ''} under watch`
              : 'No services connected yet'}
          </p>
        </div>
        <Link
          href="/services/new"
          className="font-mono text-xs uppercase tracking-widest px-4 py-2 bg-accent text-text-inverse rounded hover:bg-accent-hover transition-colors"
        >
          + Add Service
        </Link>
      </div>

      {services.length === 0 && (
        <div className="text-center py-20">
          <div className="font-mono text-4xl text-accent mb-4">◈</div>
          <div className="font-mono text-sm text-text-muted uppercase tracking-widest mb-2">
            No services connected
          </div>
          <p className="font-body text-sm text-text-secondary mb-6">
            Bionic is running, but it is not watching any service yet.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/services/new"
              className="font-mono text-xs uppercase tracking-widest px-4 py-2 bg-accent text-text-inverse rounded hover:bg-accent-hover transition-colors"
            >
              Add your first service
            </Link>
            <Link
              href="/onboarding"
              className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-border-default text-text-secondary rounded hover:border-accent hover:text-accent transition-colors"
            >
              Run Demo
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {services.map((service) => {
          const badge = STATUS_BADGE[service.status] ?? STATUS_BADGE.quiet
          const uptimeSummary = summarizeUptime(
            uptimeByService.get(service.serviceId) ?? []
          )
          return (
            <div
              key={service.serviceId}
              className={`bg-bg-surface border rounded p-5 ${
                service.status === 'alerting'
                  ? 'border-status-critical/30 bg-status-critical/5'
                  : 'border-border-subtle'
              }`}
            >
              <div className="flex items-start justify-between mb-3 gap-4">
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                  <span className="font-heading text-base font-semibold text-text-primary">
                    {service.serviceId}
                  </span>
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded border uppercase tracking-wider ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  {service.isDemo && (
                    <span className="font-mono text-xs text-text-muted">
                      (demo data)
                    </span>
                  )}
                  {uptimeSummary && (
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded border uppercase tracking-wider ${uptimeSummary.className}`}
                      title={uptimeSummary.detail}
                    >
                      {uptimeSummary.label}
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-text-muted shrink-0">
                  {service.lastEventAt
                    ? `Last signal ${formatRelativeTime(service.lastEventAt)}`
                    : 'No signals yet'}
                </div>
              </div>

              <div className="flex items-center gap-6 mb-3 flex-wrap">
                {service.criticalAlerts > 0 && (
                  <div className="font-mono text-xs text-status-critical">
                    {service.criticalAlerts} critical alert
                    {service.criticalAlerts > 1 ? 's' : ''}
                  </div>
                )}
                {service.openAlerts > 0 && service.criticalAlerts === 0 && (
                  <div className="font-mono text-xs text-status-warning">
                    {service.openAlerts} open alert
                    {service.openAlerts > 1 ? 's' : ''}
                  </div>
                )}
                {service.eventCount24h > 0 && (
                  <div className="font-mono text-xs text-text-muted">
                    {service.eventCount24h} signal
                    {service.eventCount24h > 1 ? 's' : ''} in 24h
                  </div>
                )}
                {service.sources.length > 0 && (
                  <div className="flex gap-1">
                    {service.sources.map((src) => (
                      <span
                        key={src}
                        className="font-mono text-xs px-1.5 py-0.5 rounded border border-border-subtle text-text-muted"
                      >
                        {SOURCE_LABELS[src] ?? src}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="font-body text-xs text-text-secondary">
                  {service.nextStep}
                </p>
                <div className="flex gap-3 shrink-0">
                  {service.openAlerts > 0 && (
                    <Link
                      href="/alerts"
                      className="font-mono text-xs text-accent hover:underline"
                    >
                      View alerts →
                    </Link>
                  )}
                  {!service.isDemo && (
                    <Link
                      href={`/services/new?serviceId=${encodeURIComponent(service.serviceId)}`}
                      className="font-mono text-xs text-text-muted hover:text-text-secondary"
                    >
                      Setup guide
                    </Link>
                  )}
                  {service.isDemo && (
                    <span className="font-mono text-xs text-text-muted">
                      bionic demo --cleanup
                    </span>
                  )}
                </div>
              </div>

              {!service.isDemo &&
                (() => {
                  const missingSources = ALL_INTEGRATION_SOURCES.filter(
                    (s) => !service.sources.includes(s)
                  )
                  if (missingSources.length === 0) return null
                  return (
                    <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between gap-3 flex-wrap">
                      <div className="font-mono text-xs text-text-muted">
                        Not connected:
                        {missingSources.map((src) => (
                          <span
                            key={src}
                            className="ml-1.5 font-mono text-xs text-text-muted opacity-50"
                          >
                            {SOURCE_LABELS[src]}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/services/new?serviceId=${encodeURIComponent(service.serviceId)}`}
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        Add integration →
                      </Link>
                    </div>
                  )
                })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
