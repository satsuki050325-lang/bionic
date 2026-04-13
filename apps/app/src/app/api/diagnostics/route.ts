import { NextResponse } from 'next/server'

export async function GET() {
  const engineUrl = process.env.NEXT_PUBLIC_ENGINE_URL ?? 'http://localhost:3001'
  const engineToken = process.env.BIONIC_ENGINE_TOKEN ?? ''

  try {
    const res = await fetch(`${engineUrl}/api/diagnostics`, {
      headers: engineToken ? { Authorization: `Bearer ${engineToken}` } : {},
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Engine returned ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Engine unreachable' },
      { status: 503 }
    )
  }
}
