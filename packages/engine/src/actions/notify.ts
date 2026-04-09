export interface DigestItem {
  id: string
  title: string
  summary: string
  url: string | null
  source: string
  importanceScore: number
}

export interface NotifyDigestInput {
  items: DigestItem[]
  projectId: string
}

export async function notifyDigest(input: NotifyDigestInput): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('[notify] DISCORD_WEBHOOK_URL is not set')
    return
  }

  if (input.items.length === 0) {
    console.log('[notify] no items to digest')
    return
  }

  const lines = input.items.map((item) => {
    const url = item.url ? ` — ${item.url}` : ''
    return `**[${item.importanceScore}] ${item.title}**${url}\n${item.summary}`
  })

  const content = [
    `📋 **Bionic Research Digest** (${new Date().toLocaleDateString('ja-JP')})`,
    `${input.items.length}件のリサーチが届いています。`,
    '',
    ...lines,
  ].join('\n')

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })

  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status} ${res.statusText}`)
  }
}
