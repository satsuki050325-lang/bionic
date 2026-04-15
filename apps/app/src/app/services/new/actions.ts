'use server'

type UptimeInterval = 30 | 60 | 300

function engineEnv() {
  const engineUrl =
    process.env.NEXT_PUBLIC_ENGINE_URL ?? 'http://localhost:3001'
  const token = process.env.BIONIC_ENGINE_TOKEN
  const projectId = process.env.BIONIC_PROJECT_ID ?? 'project_bionic'
  return { engineUrl, token, projectId }
}

function engineHeaders(token?: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function createUptimeTarget(input: {
  serviceId: string
  url: string
  intervalSeconds: UptimeInterval
}): Promise<
  | { ok: true; targetId: string }
  | { ok: false; error: string }
> {
  const { engineUrl, token, projectId } = engineEnv()
  const serviceId = input.serviceId.trim()
  if (!serviceId || !/^[a-z0-9-]+$/.test(serviceId)) {
    return { ok: false, error: 'invalid serviceId' }
  }
  if (!input.url?.trim()) {
    return { ok: false, error: 'missing url' }
  }
  if (![30, 60, 300].includes(input.intervalSeconds)) {
    return { ok: false, error: 'invalid interval' }
  }

  try {
    const res = await fetch(`${engineUrl}/api/uptime-targets`, {
      method: 'POST',
      headers: engineHeaders(token),
      body: JSON.stringify({
        projectId,
        serviceId,
        url: input.url.trim(),
        intervalSeconds: input.intervalSeconds,
      }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      return { ok: false, error: body.error ?? `Engine returned ${res.status}` }
    }
    const body = (await res.json()) as { target?: { id: string } }
    if (!body.target?.id) {
      return { ok: false, error: 'missing target id in response' }
    }
    return { ok: true, targetId: body.target.id }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}

export async function testUptimeTarget(
  targetId: string
): Promise<
  | {
      ok: true
      outcome: {
        ok: boolean
        statusCode: number | null
        latencyMs: number | null
        reason: string | null
      }
    }
  | { ok: false; error: string }
> {
  const { engineUrl, token } = engineEnv()
  try {
    const res = await fetch(
      `${engineUrl}/api/uptime-targets/${encodeURIComponent(targetId)}/test`,
      {
        method: 'POST',
        headers: engineHeaders(token),
      }
    )
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      return { ok: false, error: body.error ?? `Engine returned ${res.status}` }
    }
    const body = (await res.json()) as {
      outcome: {
        ok: boolean
        statusCode: number | null
        latencyMs: number | null
        reason: string | null
      }
    }
    return { ok: true, outcome: body.outcome }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown error',
    }
  }
}

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
