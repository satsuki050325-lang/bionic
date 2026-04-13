'use client'

import { useState } from 'react'

const DEMO_CMD = 'npx tsx packages/cli/src/index.ts demo'

export function RunDemoButton() {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(DEMO_CMD)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="font-mono text-sm uppercase tracking-widest px-6 py-3 border border-border-default text-text-secondary rounded hover:border-accent hover:text-accent transition-colors"
    >
      {copied ? 'Copied ✓' : 'Run Demo ↗'}
    </button>
  )
}
