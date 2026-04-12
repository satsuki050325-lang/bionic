import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { fetchEngine, DEFAULT_PROJECT_ID } from '../lib/engineClient.js'
import { formatDate, formatEngineOffline } from '../lib/format.js'

interface ResearchResult {
  items: Array<{
    id: string
    title: string
    summary: string
    url: string | null
    source: string
    category: string | null
    importanceScore: number
    isDigestSent: boolean
    createdAt: string
  }>
}

export function registerResearchTool(server: McpServer): void {
  server.tool(
    'get_research_items',
    'Get saved research items from Bionic Engine',
    {
      limit: z.number().min(1).max(50).default(10).describe('Number of items to return'),
    },
    async ({ limit }) => {
      try {
        const params = new URLSearchParams({
          projectId: DEFAULT_PROJECT_ID,
          limit: String(limit),
        })

        const result = await fetchEngine<ResearchResult>(
          `/api/research?${params.toString()}`
        )

        if (!result.items || result.items.length === 0) {
          return {
            content: [{ type: 'text' as const, text: 'No research items found.' }],
          }
        }

        const lines = result.items.map((item) => {
          return [
            `[Score: ${item.importanceScore}] ${item.title}`,
            `  Summary: ${item.summary}`,
            item.url ? `  URL: ${item.url}` : null,
            `  Category: ${item.category ?? '—'}`,
            `  Digest sent: ${item.isDigestSent ? 'Yes' : 'No'}`,
            `  Created: ${formatDate(item.createdAt)}`,
          ].filter(Boolean).join('\n')
        })

        const text = `Found ${result.items.length} research item(s):\n\n${lines.join('\n\n')}`
        return { content: [{ type: 'text' as const, text }] }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          content: [{ type: 'text' as const, text: message.includes('offline') ? formatEngineOffline() : message }],
        }
      }
    }
  )
}
