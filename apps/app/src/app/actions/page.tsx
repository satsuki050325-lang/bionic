import { getActions } from '@/lib/engine'
import { formatRelativeTime } from '@/lib/time'

function badgeClass(status: string): string {
  if (status === 'succeeded') return 'badge-success'
  if (status === 'failed') return 'badge-critical'
  if (status === 'running') return 'badge-info'
  if (status === 'pending_approval') return 'badge-warning'
  if (status === 'needs_review') return 'badge-warning'
  return 'badge-muted'
}

function isFaded(status: string): boolean {
  return status === 'succeeded' || status === 'skipped'
}

export default async function ActionsPage() {
  const result = await getActions()

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

  const pendingActions = result.actions.filter(
    (a) => a.status === 'pending_approval'
  )
  const otherActions = result.actions.filter(
    (a) => a.status !== 'pending_approval'
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text-primary uppercase tracking-wide">
          Actions
        </h1>
        <p className="font-mono text-xs text-text-muted mt-1">Audit Log</p>
      </div>

      {pendingActions.length > 0 && (
        <div className="border border-status-warning/50 bg-status-warning/5 rounded p-4 mb-6">
          <div className="font-mono text-xs text-status-warning uppercase tracking-widest mb-3">
            Awaiting Approval · {pendingActions.length}
          </div>
          <div className="divide-y divide-border-subtle">
            {pendingActions.map((action) => (
              <div
                key={action.id}
                className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="font-body text-sm text-text-primary">
                    {action.title}
                  </div>
                  <div className="font-mono text-xs text-text-muted mt-0.5">
                    {action.requestedBy} · {formatRelativeTime(action.createdAt)}
                    {action.alertId && (
                      <>
                        {' · alert '}
                        <span className="text-text-secondary">
                          {action.alertId.slice(0, 8)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="font-mono text-xs text-text-secondary shrink-0 text-right">
                  Approve via CLI:{' '}
                  <code className="text-accent">
                    bionic approve {action.id.slice(0, 8)}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.actions.length === 0 ? (
        <div className="bg-bg-surface border border-border-subtle rounded p-12 text-center">
          <p className="text-text-secondary font-mono text-sm">
            No actions recorded
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {otherActions.map((action) => (
            <div
              key={action.id}
              className={`bg-bg-surface border border-border-subtle rounded p-3 flex items-center gap-4 ${
                isFaded(action.status) ? 'opacity-60' : ''
              }`}
            >
              <span className={badgeClass(action.status)}>
                {action.status.toUpperCase()}
              </span>
              <span className="badge-muted font-mono">{action.type}</span>
              <div className="flex-1 min-w-0">
                <div className="text-text-primary text-sm truncate">
                  {action.title}
                </div>
                <div className="font-mono text-xs text-text-muted mt-0.5">
                  {action.requestedBy}
                  {action.alertId && (
                    <>
                      {' · alert '}
                      <span className="text-text-secondary">
                        {action.alertId.slice(0, 8)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className="font-mono text-xs text-text-muted shrink-0">
                {formatRelativeTime(action.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
