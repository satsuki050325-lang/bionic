'use server'

import { revalidatePath } from 'next/cache'

export async function resolveAlert(
  alertId: string
): Promise<{ ok: boolean; error?: string }> {
  const engineUrl = process.env.NEXT_PUBLIC_ENGINE_URL ?? 'http://localhost:3001'
  const token = process.env.BIONIC_ENGINE_TOKEN

  try {
    const res = await fetch(`${engineUrl}/api/alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        resolvedBy: 'app:local',
        reason: 'manual',
      }),
    })

    if (!res.ok) {
      return { ok: false, error: `Engine returned ${res.status}` }
    }

    revalidatePath('/alerts')
    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}
