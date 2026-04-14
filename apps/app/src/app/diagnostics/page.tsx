import { getDiagnostics, type Diagnostics } from '@/lib/engine'
import { StatusBadge } from '@/components/StatusBadge'

export default async function DiagnosticsPage() {
  const diag = await getDiagnostics()

  if (!diag) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-accent font-heading text-4xl">&#9670;</div>
        <h1 className="font-heading text-2xl font-semibold">Diagnostics Unavailable</h1>
        <p className="text-text-secondary font-mono text-sm">
          Run <span className="text-accent">pnpm --filter @bionic/engine dev</span> to start
        </p>
      </div>
    )
  }

  const isRunning = diag.engine.status === 'running'
  const statusColor = isRunning ? 'text-status-success' : 'text-status-warning'
  const statusLabel = isRunning ? '◈ ONLINE' : '⚠ DEGRADED'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-wider">
          BIONIC DIAGNOSTICS
        </h1>
        <div className="text-right">
          <div className={`font-mono text-sm ${statusColor}`}>{statusLabel}</div>
          <div className="text-text-muted font-mono text-xs mt-1">
            UPTIME {formatUptime(diag.engine.uptimeSeconds)}
          </div>
        </div>
      </div>

      {/* 1. SYSTEM CORE */}
      <Block title="SYSTEM CORE">
        <Grid>
          <KV label="ENGINE" value={diag.engine.status.toUpperCase()} accent={!isRunning ? 'warning' : undefined} />
          <KV label="VERSION" value={diag.engine.version} />
          <KV label="STARTED" value={formatTime(diag.engine.startedAt)} />
          <KV
            label="DATABASE"
            value={diag.db.ok ? 'OK' : 'DOWN'}
            accent={diag.db.ok ? 'success' : 'danger'}
          />
        </Grid>
        {diag.db.error && (
          <div className="mt-3 font-mono text-xs text-status-danger">
            DB ERROR: {diag.db.error}
          </div>
        )}
      </Block>

      {/* 2. SCHEDULER */}
      <Block title="SCHEDULER">
        <Grid>
          <KV
            label="STATE"
            value={diag.scheduler.enabled ? 'ENABLED' : 'DISABLED'}
            accent={diag.scheduler.enabled ? 'success' : 'muted'}
          />
          <KV label="DIGEST CRON" value={diag.scheduler.digestCron} />
          <KV label="TIMEZONE" value={diag.scheduler.digestTimezone} />
        </Grid>
        <div className="mt-4 space-y-2">
          <div className="font-mono text-xs text-text-secondary uppercase tracking-wider">
            Runners
          </div>
          {diag.scheduler.runners.map((runner) => (
            <div
              key={runner.name}
              className="grid grid-cols-[200px_96px_1fr_auto] items-center gap-4 py-2 border-b border-border-subtle last:border-b-0"
            >
              <span className="font-mono text-xs text-text-secondary uppercase tracking-wide">
                {runner.name.replace(/_/g, ' ')}
              </span>
              {runner.lastError ? (
                <span className="badge-critical">FAILED</span>
              ) : runner.lastSuccessAt ? (
                <span className="badge-success">OK</span>
              ) : (
                <span className="badge-muted">IDLE</span>
              )}
              <span className="font-mono text-xs text-text-muted truncate">
                {runner.lastError ?? ''}
              </span>
              <span className="font-mono text-xs text-text-muted text-right">
                {runner.lastRunAt ? formatTime(runner.lastRunAt) : '—'}
              </span>
            </div>
          ))}
        </div>
      </Block>

      {/* 3. JOB QUEUE */}
      <Block title="JOB QUEUE">
        <Grid cols={5}>
          <KV size="lg" label="PENDING" value={String(diag.queue.jobs.pending)} accent={diag.queue.jobs.pending > 0 ? 'accent' : undefined} />
          <KV size="lg" label="RUNNING" value={String(diag.queue.jobs.running)} />
          <KV
            size="lg"
            label="NEEDS REVIEW"
            value={String(diag.queue.jobs.needsReview)}
            accent={diag.queue.jobs.needsReview > 0 ? 'warning' : undefined}
          />
          <KV
            size="lg"
            label="FAILED 24H"
            value={String(diag.queue.jobs.failedRecent)}
            accent={diag.queue.jobs.failedRecent > 0 ? 'danger' : undefined}
          />
          <KV
            label="OLDEST PENDING"
            value={
              diag.queue.jobs.oldestPendingCreatedAt
                ? formatTime(diag.queue.jobs.oldestPendingCreatedAt)
                : '—'
            }
          />
        </Grid>
      </Block>

      {/* 4. ACTIONS */}
      <Block title="ACTIONS">
        <Grid cols={6}>
          <KV
            size="lg"
            label="PENDING APPROVAL"
            value={String(diag.queue.actions.pendingApproval)}
            accent={diag.queue.actions.pendingApproval > 0 ? 'accent' : undefined}
          />
          <KV size="lg" label="APPROVED" value={String(diag.queue.actions.approved)} />
          <KV size="lg" label="RUNNING" value={String(diag.queue.actions.running)} />
          <KV
            size="lg"
            label="FAILED 24H"
            value={String(diag.queue.actions.failedRecent)}
            accent={diag.queue.actions.failedRecent > 0 ? 'danger' : undefined}
          />
          <KV
            size="lg"
            label="STALE 24H"
            value={String(diag.queue.actions.staleApproval24h)}
            accent={diag.queue.actions.staleApproval24h > 0 ? 'warning' : undefined}
          />
          <KV
            size="lg"
            label="AUTO-CANCEL 48H"
            value={String(diag.queue.actions.autoCancelDue48h)}
            accent={diag.queue.actions.autoCancelDue48h > 0 ? 'danger' : undefined}
          />
        </Grid>
        <div className="mt-4 flex items-center gap-4 font-mono text-xs text-text-secondary">
          <span>
            OPEN CRITICAL ALERTS:{' '}
            <span className={diag.alerts.openCritical > 0 ? 'text-status-danger' : 'text-text-primary'}>
              {diag.alerts.openCritical}
            </span>
          </span>
          <span>
            REMINDER DUE:{' '}
            <span className={diag.alerts.criticalReminderDue > 0 ? 'text-status-warning' : 'text-text-primary'}>
              {diag.alerts.criticalReminderDue}
            </span>
          </span>
        </div>
      </Block>

      {/* 5. INTEGRATIONS */}
      <Block title="INTEGRATIONS">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border-subtle rounded p-3 space-y-2">
            <div className="font-mono text-xs text-text-secondary uppercase tracking-wider">
              Discord
            </div>
            <Grid cols={3}>
              <KV label="MODE" value={diag.integrations.discord.mode.toUpperCase()} />
              <KV
                label="CHANNEL"
                value={diag.integrations.discord.channelConfigured ? 'SET' : 'MISSING'}
                accent={diag.integrations.discord.channelConfigured ? 'success' : 'warning'}
              />
              <KV
                label="APPROVERS"
                value={diag.integrations.discord.approversConfigured ? 'SET' : 'MISSING'}
                accent={diag.integrations.discord.approversConfigured ? 'success' : 'warning'}
              />
            </Grid>
          </div>
          <div className="border border-border-subtle rounded p-3 space-y-2">
            <div className="font-mono text-xs text-text-secondary uppercase tracking-wider">
              Vercel
            </div>
            <Grid cols={3}>
              <KV
                label="WEBHOOK"
                value={diag.integrations.vercel.webhookSecretConfigured ? 'SET' : 'MISSING'}
                accent={diag.integrations.vercel.webhookSecretConfigured ? 'success' : 'muted'}
              />
              <KV label="MAPPED" value={String(diag.integrations.vercel.mappedProjects)} />
              <KV
                label="WATCHING"
                value={String(diag.integrations.vercel.watchingDeployments)}
                accent={diag.integrations.vercel.watchingDeployments > 0 ? 'accent' : undefined}
              />
            </Grid>
            <div className="font-mono text-xs text-text-muted">
              FAILED WATCHES: {diag.integrations.vercel.failedWatches} · LATEST{' '}
              {diag.integrations.vercel.latestDeploymentAt
                ? formatTime(diag.integrations.vercel.latestDeploymentAt)
                : '—'}
            </div>
          </div>
        </div>
      </Block>

      {/* 6. RECENT */}
      <Block title="RECENT">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="font-mono text-xs text-text-secondary uppercase tracking-wider mb-2">
              Actions
            </div>
            {diag.recent.actions.length === 0 ? (
              <p className="text-text-muted font-mono text-sm">No recent actions</p>
            ) : (
              <div className="space-y-1">
                {diag.recent.actions.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 py-1 border-b border-border-subtle last:border-b-0"
                  >
                    <span className="badge-muted font-mono shrink-0">{a.type}</span>
                    <StatusBadge status={a.status} />
                    <span className="font-mono text-xs text-text-muted ml-auto shrink-0">
                      {formatTime(a.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="font-mono text-xs text-text-secondary uppercase tracking-wider mb-2">
              Deployments
            </div>
            {diag.recent.deployments.length === 0 ? (
              <p className="text-text-muted font-mono text-sm">No recent deployments</p>
            ) : (
              <div className="space-y-1">
                {diag.recent.deployments.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-2 py-1 border-b border-border-subtle last:border-b-0"
                  >
                    <span className="badge-muted font-mono shrink-0">{d.serviceId}</span>
                    <StatusBadge status={d.watchStatus} />
                    <span className="font-mono text-xs text-text-muted ml-auto shrink-0">
                      {formatTime(d.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Block>
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-3">
      <div className="font-mono text-xs text-text-muted uppercase tracking-widest mb-4">
        {title}
      </div>
      {children}
    </div>
  )
}

function Grid({ cols = 4, children }: { cols?: number; children: React.ReactNode }) {
  const colClass =
    cols === 3
      ? 'grid-cols-2 md:grid-cols-3'
      : cols === 5
      ? 'grid-cols-2 md:grid-cols-5'
      : cols === 6
      ? 'grid-cols-2 md:grid-cols-6'
      : 'grid-cols-2 md:grid-cols-4'
  return <div className={`grid ${colClass} gap-4`}>{children}</div>
}

type Accent = 'success' | 'warning' | 'danger' | 'accent' | 'muted'

type KVSize = 'sm' | 'lg'

function KV({
  label,
  value,
  accent,
  size = 'sm',
}: {
  label: string
  value: string
  accent?: Accent
  size?: KVSize
}) {
  const valueClass =
    accent === 'success'
      ? 'text-status-success'
      : accent === 'warning'
      ? 'text-status-warning'
      : accent === 'danger'
      ? 'text-status-danger'
      : accent === 'accent'
      ? 'text-accent'
      : accent === 'muted'
      ? 'text-text-muted'
      : 'text-text-primary'
  const sizeClass =
    size === 'lg'
      ? 'font-mono text-lg font-bold'
      : 'font-mono text-sm font-bold'
  return (
    <div>
      <div className="font-mono text-xs text-text-muted uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className={`${sizeClass} ${valueClass}`}>{value}</div>
    </div>
  )
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

