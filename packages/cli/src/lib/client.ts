const ENGINE_URL = process.env.BIONIC_ENGINE_URL ?? 'http://localhost:3001'
const ENGINE_TOKEN = process.env.BIONIC_ENGINE_TOKEN

export async function fetchEngine<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(ENGINE_TOKEN ? { Authorization: `Bearer ${ENGINE_TOKEN}` } : {}),
    ...options?.headers,
  }

  const res = await fetch(`${ENGINE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Engine API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}
