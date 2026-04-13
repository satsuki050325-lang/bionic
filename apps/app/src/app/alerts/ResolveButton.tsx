'use client'

import { useState, useTransition } from 'react'
import { resolveAlert } from './actions'

export function ResolveButton({ alertId }: { alertId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleResolve() {
    setError(null)
    startTransition(async () => {
      const res = await resolveAlert(alertId)
      if (!res.ok) setError(res.error ?? 'failed')
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleResolve}
        disabled={pending}
        className="font-mono text-xs uppercase tracking-wider text-text-secondary hover:text-status-success border border-border-subtle hover:border-status-success/50 px-3 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Resolving...' : 'Resolve'}
      </button>
      {error && (
        <span className="font-mono text-xs text-status-critical">{error}</span>
      )}
    </div>
  )
}
