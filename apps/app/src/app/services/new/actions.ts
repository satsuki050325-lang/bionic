'use server'

export async function sendTestServiceEvent(
  serviceId: string
): Promise<{ ok: boolean; error?: string }> {
  const engineUrl =
    process.env.NEXT_PUBLIC_ENGINE_URL ?? 'http://localhost:3001'
  const token = process.env.BIONIC_ENGINE_TOKEN
  const projectId = process.env.BIONIC_PROJECT_ID ?? 'project_bionic'

  const trimmed = serviceId.trim()
  if (!trimmed || !/^[a-z0-9-]+$/.test(trimmed)) {
    return { ok: false, error: 'invalid serviceId' }
  }

  try {
    const res = await fetch(`${engineUrl}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        event: {
          id: `test_${trimmed}_${Date.now()}`,
          projectId,
          serviceId: trimmed,
          type: 'service.health.reported',
          source: 'app',
          occurredAt: new Date().toISOString(),
          payload: {
            status: 'ok',
            source: 'add_service_test',
          },
        },
      }),
    })

    if (!res.ok && res.status !== 202) {
      return { ok: false, error: `Engine returned ${res.status}` }
    }

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}
