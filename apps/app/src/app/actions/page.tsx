import { getActions } from '@/lib/engine'

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Actions</h1>
        <span className="font-mono text-sm text-text-secondary">
          Audit Log
        </span>
      </div>

      {result.actions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-secondary font-mono text-sm">No actions recorded</p>
        </div>
      ) : (
        <div className="space-y-2">
          {result.actions.map((action) => (
            <div key={action.id} className="card flex items-center gap-4">
              <span className={
                action.status === 'succeeded' ? 'badge-success' :
                action.status === 'failed' ? 'badge-critical' :
                action.status === 'skipped' ? 'badge-muted' :
                action.status === 'running' ? 'badge-info' :
                action.status === 'pending_approval' ? 'badge-warning' :
                'badge-muted'
              }>
                {action.status.toUpperCase()}
              </span>
              <span className="badge-muted font-mono">{action.type}</span>
              <span className="text-text-primary text-sm flex-1">{action.title}</span>
              <span className="font-mono text-xs text-text-muted shrink-0">
                {new Date(action.createdAt).toLocaleTimeString('ja-JP')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
