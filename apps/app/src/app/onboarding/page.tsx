'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'

interface DiagnosticsData {
  engine: { status: string; version: string; uptimeSeconds: number }
  db: { ok: boolean; error: string | null }
  scheduler: { enabled: boolean; digestCron: string; digestTimezone: string }
  integrations: {
    discord: { mode: string; channelConfigured: boolean; approversConfigured: boolean }
    vercel: { webhookSecretConfigured: boolean; mappedProjects: number }
  }
  queue: {
    jobs: { pending: number; running: number; needsReview: number }
    actions: { pendingApproval: number }
  }
}

type CheckStatus = 'ready' | 'missing' | 'optional' | 'degraded' | 'loading'

interface SetupCheck {
  id: string
  label: string
  status: CheckStatus
  detail: string
  required: boolean
}

export default function OnboardingPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null)
  const [engineOnline, setEngineOnline] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchDiagnostics() {
      try {
        const res = await fetch('/api/diagnostics', { cache: 'no-store' })
        if (!res.ok) throw new Error('Engine returned error')
        const data = (await res.json()) as DiagnosticsData
        if (!cancelled) {
          setDiagnostics(data)
          setEngineOnline(true)
        }
      } catch {
        if (!cancelled) {
          setEngineOnline(false)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchDiagnostics()
    const interval = setInterval(fetchDiagnostics, 5000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const checks: SetupCheck[] =
    engineOnline && diagnostics
      ? [
          {
            id: 'engine',
            label: '01  ENGINE LINK',
            status: 'ready',
            detail: `v${diagnostics.engine.version} · uptime ${Math.floor(diagnostics.engine.uptimeSeconds / 60)}m`,
            required: true,
          },
          {
            id: 'db',
            label: '02  DATABASE SIGNAL',
            status: diagnostics.db.ok ? 'ready' : 'degraded',
            detail: diagnostics.db.ok
              ? 'Supabase connected'
              : (diagnostics.db.error ?? 'Connection failed'),
            required: true,
          },
          {
            id: 'scheduler',
            label: '03  SCHEDULER LOOP',
            status: diagnostics.scheduler.enabled ? 'ready' : 'optional',
            detail: diagnostics.scheduler.enabled
              ? `${diagnostics.scheduler.digestCron} ${diagnostics.scheduler.digestTimezone}`
              : 'Disabled — set BIONIC_SCHEDULER_ENABLED=true to enable',
            required: false,
          },
          {
            id: 'discord',
            label: '04  DISCORD CHANNEL',
            status:
              diagnostics.integrations.discord.mode !== 'disabled' ? 'ready' : 'optional',
            detail:
              diagnostics.integrations.discord.mode !== 'disabled'
                ? `Mode: ${diagnostics.integrations.discord.mode} · Channel: ${diagnostics.integrations.discord.channelConfigured ? 'configured' : 'missing'}`
                : 'Not configured — run bionic init to set up Discord',
            required: false,
          },
          {
            id: 'vercel',
            label: '05  DEPLOYMENT WATCH',
            status: diagnostics.integrations.vercel.webhookSecretConfigured
              ? 'ready'
              : 'optional',
            detail: diagnostics.integrations.vercel.webhookSecretConfigured
              ? `${diagnostics.integrations.vercel.mappedProjects} project(s) mapped`
              : 'Not configured — see README for Vercel webhook setup',
            required: false,
          },
        ]
      : [
          {
            id: 'engine',
            label: '01  ENGINE LINK',
            status: loading ? 'loading' : 'missing',
            detail: loading ? 'Connecting...' : 'Engine not responding',
            required: true,
          },
          {
            id: 'db',
            label: '02  DATABASE SIGNAL',
            status: 'loading',
            detail: 'Awaiting engine connection',
            required: true,
          },
          {
            id: 'scheduler',
            label: '03  SCHEDULER LOOP',
            status: 'loading',
            detail: 'Awaiting engine connection',
            required: false,
          },
          {
            id: 'discord',
            label: '04  DISCORD CHANNEL',
            status: 'loading',
            detail: 'Awaiting engine connection',
            required: false,
          },
          {
            id: 'vercel',
            label: '05  DEPLOYMENT WATCH',
            status: 'loading',
            detail: 'Awaiting engine connection',
            required: false,
          },
        ]

  const allRequired = checks
    .filter((c) => c.required)
    .every((c) => c.status === 'ready')
  const engineStatus =
    engineOnline === null
      ? '◇ CONNECTING'
      : engineOnline
        ? '◈ ONLINE'
        : '◇ AWAITING ENGINE'

  return (
    <div className="space-y-12 py-4">
      {/* Hero */}
      <div className="space-y-4">
        <div className="text-6xl text-accent font-heading">◈</div>
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-widest text-text-primary">
            Bionic Engine
          </h1>
          <p className="font-mono text-sm text-text-secondary mt-1">
            Bring the operator online.
          </p>
        </div>
        <div className="font-mono text-sm uppercase tracking-widest text-accent">
          {engineStatus}
        </div>
      </div>

      {/* Mission Checklist */}
      <div className="space-y-2">
        <div className="font-mono text-xs text-text-muted uppercase tracking-widest mb-4">
          System Check
        </div>
        {checks.map((check) => (
          <div
            key={check.id}
            className="flex items-start gap-4 py-3 border-b border-border-subtle"
          >
            <span className="font-mono text-xs text-text-muted uppercase tracking-widest w-40 shrink-0 pt-0.5">
              {check.label}
            </span>
            <div className="flex-1 space-y-1">
              <div>
                <StatusBadge status={check.status} />
              </div>
              <p className="font-mono text-xs text-text-secondary">{check.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Command Panel */}
      {!engineOnline && (
        <div className="border border-border-subtle rounded p-4 space-y-3">
          <div className="font-mono text-xs text-text-muted uppercase tracking-widest">
            Operator Console
          </div>
          <div className="space-y-2">
            {[
              { label: 'Setup environment', cmd: 'npx tsx packages/cli/src/index.ts init' },
              { label: 'Start Engine', cmd: 'pnpm --filter @bionic/engine dev' },
              { label: 'Start App', cmd: 'pnpm --filter @bionic/app dev' },
            ].map(({ label, cmd }) => (
              <div key={cmd} className="space-y-0.5">
                <div className="font-mono text-xs text-text-muted"># {label}</div>
                <code className="block font-mono text-xs text-accent bg-bg-surface px-3 py-2 rounded">
                  {cmd}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Good State */}
      {allRequired && (
        <div className="space-y-4">
          <div className="border-l-2 border-accent bg-accent/5 rounded p-4">
            <p className="font-mono text-sm text-accent uppercase tracking-wider">
              The engine is awake.
            </p>
            <p className="font-mono text-xs text-text-secondary mt-1">
              Bionic is ready to observe, decide, and record.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block font-mono text-sm uppercase tracking-widest px-6 py-3 bg-accent text-text-inverse rounded hover:bg-accent-hover transition-colors"
          >
            Enter Dashboard →
          </Link>
        </div>
      )}
    </div>
  )
}
