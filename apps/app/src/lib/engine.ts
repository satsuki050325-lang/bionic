import type { ServiceStatus, ListAlertsResult } from '@bionic/shared'

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? 'http://localhost:3001'

export async function getStatus(): Promise<ServiceStatus | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/api/status`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getAlerts(): Promise<ListAlertsResult | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/api/alerts`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
