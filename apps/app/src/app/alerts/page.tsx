import { getAlerts } from '@/lib/engine'

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Alerts</h1>
        <span className="font-mono text-sm text-text-secondary">
          {result.alerts.length} open
        </span>
      </div>

      {result.alerts.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-status-success font-heading text-3xl mb-2">&#10003;</div>
          <p className="text-text-secondary font-mono text-sm">No open alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {result.alerts.map((alert) => (
            <div key={alert.id} className="card accent-bar space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className={
                    alert.severity === 'critical' ? 'badge-critical' :
                    alert.severity === 'warning' ? 'badge-warning' : 'badge-info'
                  }>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="badge-muted">{alert.type}</span>
                  {(alert.count ?? 1) > 1 && (
                    <span className="badge-muted">&times;{alert.count}</span>
                  )}
                </div>
                <span className="font-mono text-xs text-text-muted shrink-0">
                  {new Date(alert.createdAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <div className="font-heading font-semibold">{alert.title}</div>
              <div className="text-text-secondary text-sm">{alert.message}</div>
              {alert.fingerprint && (
                <div className="font-mono text-xs text-text-muted">{alert.fingerprint}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
