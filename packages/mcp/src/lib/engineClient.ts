const ENGINE_URL = process.env.BIONIC_ENGINE_URL ?? 'http://localhost:3001'
const ENGINE_TOKEN = process.env.BIONIC_ENGINE_TOKEN

export const DEFAULT_PROJECT_ID =
  process.env.BIONIC_PROJECT_ID ?? 'project_bionic'

function engineHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (ENGINE_TOKEN) {
    headers['Authorization'] = `Bearer ${ENGINE_TOKEN}`
  }
  return headers
}

export async function fetchEngine<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${ENGINE_URL}${path}`, {
    ...options,
    headers: {
      ...engineHeaders(),
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    throw new Error(
      'Unauthorized: Set BIONIC_ENGINE_TOKEN in Claude Desktop config env.'
    )
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Engine API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}
