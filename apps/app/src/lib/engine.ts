import type {
  ServiceStatus,
  ListAlertsResult,
  ListResearchItemsResult,
  CreateResearchItemInput,
  CreateResearchItemResult,
  ListActionsResult,
  ListEventsResult,
} from '@bionic/shared'

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? 'http://localhost:3001'
const ENGINE_TOKEN = process.env.BIONIC_ENGINE_TOKEN

function engineHeaders(): HeadersInit {
  const headers: HeadersInit = {}
  if (ENGINE_TOKEN) {
    headers['Authorization'] = `Bearer ${ENGINE_TOKEN}`
  }
  return headers
}

export async function getStatus(): Promise<ServiceStatus | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/api/status`, {
      cache: 'no-store',
      headers: engineHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getAlerts(): Promise<ListAlertsResult | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/api/alerts`, {
      cache: 'no-store',
      headers: engineHeaders(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getResearchItems(projectId = 'project_bionic'): Promise<ListResearchItemsResult | null> {
  try {
    const res = await fetch(
      `${ENGINE_URL}/api/research?projectId=${projectId}`,
      { cache: 'no-store', headers: engineHeaders() }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getEvents(projectId = 'project_bionic'): Promise<ListEventsResult | null> {
  try {
    const res = await fetch(
      `${ENGINE_URL}/api/events?projectId=${projectId}&limit=20`,
      { cache: 'no-store', headers: engineHeaders() }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getActions(projectId = 'project_bionic'): Promise<ListActionsResult | null> {
  try {
    const res = await fetch(
      `${ENGINE_URL}/api/actions?projectId=${projectId}&limit=20`,
      { cache: 'no-store', headers: engineHeaders() }
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function createResearchItem(
  input: CreateResearchItemInput
): Promise<CreateResearchItemResult | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...engineHeaders() },
      body: JSON.stringify(input),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
