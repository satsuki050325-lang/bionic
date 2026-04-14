import type { EngineAction } from '@bionic/shared'
import { getActions } from '@/lib/engine'
import { formatRelativeTime } from '@/lib/time'
import { ActionStatusIcon, type ActionStatus } from '@/components/StatusIcon'
import { getActionOutcome } from '@/lib/actionUtils'

const BADGE_BASE =
  'font-mono text-xs px-2 py-0.5 rounded uppercase tracking-wider border whitespace-nowrap'

const STATUS_CLASS: Record<string, string> = {
  succeeded:
    'text-status-success border-status-success bg-status-success/20 font-semibold',
  failed:
    'text-status-critical border-status-critical bg-status-critical/20 font-semibold',
  skipped: 'text-text-secondary border-border-default bg-bg-elevated',
  pending_approval:
    'text-status-warning border-status-warning bg-status-warning/20 font-semibold',
  approved:
    'text-status-success border-status-success bg-status-success/20',
  denied: 'text-status-critical border-status-critical bg-status-critical/20',
  cancelled: 'text-text-muted border-border-subtle bg-bg-elevated',
  running: 'text-accent border-accent bg-accent/20 font-semibold',
  needs_review:
    'text-status-warning border-status-warning bg-status-warning/20',
  pending: 'text-text-secondary border-border-default bg-bg-elevated',
}

const ATTENTION_STATUSES = new Set(['failed', 'pending_approval', 'needs_review'])

function badgeClass(status: string): string {
  const cls = STATUS_CLASS[status] ?? STATUS_CLASS['pending']!
  return `${BADGE_BASE} ${cls}`
}

function ActionRow({
  action,
  faded,
}: {
  action: EngineAction
  faded?: boolean
}) {
  const outcome = getActionOutcome(action)
  return (
    <div
      className={`bg-bg-surface border border-border-subtle rounded p-3 flex items-start gap-3 ${
        faded ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 w-44 shrink-0 pt-0.5">
        <ActionStatusIcon status={action.status as ActionStatus} />
        <span className={badgeClass(action.status)}>
          {action.status.toUpperCase()}
        </span>
      </div>
      <div className="w-48 shrink-0 pt-0.5">
        <span className="badge-muted font-mono">{action.type}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-text-primary text-sm truncate">{action.title}</div>
        {outcome && (
          <div
            className={`font-mono text-xs mt-0.5 ${
              action.status === 'failed'
                ? 'text-status-critical'
                : 'text-text-muted'
            }`}
          >
            {action.status === 'skipped' ? 'Skipped: ' : 'Failed: '}
            {outcome}
          </div>
        )}
        {action.status === 'pending_approval' && (
          <div className="font-mono text-xs text-text-secondary mt-0.5">
            Approve via CLI:{' '}
            <code className="text-accent">
              bionic approve {action.id.slice(0, 8)}
            </code>
          </div>
        )}
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
      <span className="font-mono text-xs text-text-muted shrink-0 pt-0.5">
        {formatRelativeTime(action.createdAt)}
      </span>
    </div>
  )
}

export default async function ActionsPage() {
  const result = await getActions()

  if (!result) {
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

  const actions = result.actions
  const attentionActions = actions.filter((a) =>
    ATTENTION_STATUSES.has(a.status)
  )
  const historyActions = actions.filter(
    (a) => !ATTENTION_STATUSES.has(a.status)
  )
  const succeededCount = actions.filter((a) => a.status === 'succeeded').length
  const skippedCount = actions.filter((a) => a.status === 'skipped').length

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-heading text-2xl font-bold text-text-primary uppercase tracking-wide">
          Actions
        </h1>
        <p className="font-mono text-xs text-text-muted mt-1">Audit Log</p>
      </div>

      {actions.length > 0 && (
        <div className="flex items-center gap-4 mb-6 font-mono text-xs text-text-muted flex-wrap">
          {attentionActions.length > 0 && (
            <span className="text-status-warning">
              {attentionActions.length} need
              {attentionActions.length === 1 ? 's' : ''} attention
            </span>
          )}
          <span>{succeededCount} succeeded</span>
          <span>{skippedCount} skipped</span>
        </div>
      )}

      {actions.length === 0 && (
        <div className="bg-bg-surface border border-border-subtle rounded p-12 text-center">
          <p className="text-text-secondary font-mono text-sm">
            No actions recorded
          </p>
        </div>
      )}

      {attentionActions.length > 0 && (
        <div className="mb-6">
          <div className="font-mono text-xs text-status-warning uppercase tracking-widest mb-3">
            Needs Attention · {attentionActions.length}
          </div>
          <div className="space-y-2">
            {attentionActions.map((action) => (
              <ActionRow key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}

      {historyActions.length > 0 && (
        <div>
          <div className="font-mono text-xs text-text-muted uppercase tracking-widest mb-3">
            Recent History
          </div>
          <div className="space-y-2">
            {historyActions.map((action) => (
              <ActionRow key={action.id} action={action} faded />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
