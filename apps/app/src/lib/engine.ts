import type {
  ServiceStatus,
  ListAlertsResult,
  ListResearchItemsResult,
  CreateResearchItemInput,
  CreateResearchItemResult,
  ListActionsResult,
} from '@bionic/shared'

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

export async function getResearchItems(projectId = 'project_bionic'): Promise<ListResearchItemsResult | null> {
  try {
    const res = await fetch(
      `${ENGINE_URL}/api/research?projectId=${projectId}`,
      { cache: 'no-store' }
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
      { cache: 'no-store' }
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
