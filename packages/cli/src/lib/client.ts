const ENGINE_URL = process.env.BIONIC_ENGINE_URL ?? 'http://localhost:3001'

export async function fetchEngine<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ENGINE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Engine API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}
