export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })
}

export function formatEngineOffline(): string {
  return 'Engine is offline. Start with: pnpm --filter @bionic/engine dev'
}
