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

export type NotifyResult = 'sent' | 'skipped' | 'misconfigured'

export async function notifyDigest(input: NotifyDigestInput): Promise<NotifyResult> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('[notify] DISCORD_WEBHOOK_URL is not set')
    return 'misconfigured'
  }

  if (input.items.length === 0) {
    console.log('[notify] no items to digest')
    return 'skipped'
  }

  const targetItems = input.items.slice(0, 3)
  const skipped = input.items.length - targetItems.length

  const lines = targetItems.map((item) => {
    const url = item.url ? ` — ${item.url}` : ''
    return `**[${item.importanceScore}] ${item.title}**${url}\n${item.summary}`
  })

  const suffix = skipped > 0 ? `\n\n_他${skipped}件は省略されました。_` : ''

  let content = [
    `📋 **Bionic Research Digest** (${new Date().toLocaleDateString('ja-JP')})`,
    `${targetItems.length}件のリサーチが届いています。`,
    '',
    ...lines,
  ].join('\n') + suffix

  if (content.length > 2000) {
    content = content.slice(0, 1950) + '\n\n_（文字数超過のため省略されました）_'
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })

  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status} ${res.statusText}`)
  }

  return 'sent'
}
