import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { fetchEngine, DEFAULT_PROJECT_ID } from '../lib/engineClient.js'
import { formatDate, formatEngineOffline } from '../lib/format.js'
import type { ListActionsResult } from '@bionic/shared'

export function registerActionsTool(server: McpServer): void {
  server.tool(
    'get_actions',
    'Get action audit log from Bionic Engine. Use status=pending_approval to see items awaiting approval',
    {
      status: z.string().optional().describe('Filter by status (pending_approval/succeeded/failed/skipped)'),
      type: z.string().optional().describe('Filter by action type'),
      limit: z.number().min(1).max(50).default(20).describe('Number of actions to return'),
    },
    async ({ status, type, limit }) => {
      try {
        const params = new URLSearchParams({
          projectId: DEFAULT_PROJECT_ID,
          limit: String(limit),
        })
        if (status) params.set('status', status)
        if (type) params.set('type', type)

        const result = await fetchEngine<ListActionsResult>(
          `/api/actions?${params.toString()}`
        )

        if (result.actions.length === 0) {
          return {
            content: [{ type: 'text' as const, text: 'No actions found.' }],
          }
        }

        const lines = result.actions.map((action) => {
          return [
            `[${action.status.toUpperCase()}] ${action.title}`,
            `  Type: ${action.type}`,
            `  Mode: ${action.mode}`,
            `  Created: ${formatDate(action.createdAt)}`,
            `  ID: ${action.id}`,
          ].join('\n')
        })

        const text = `Found ${result.actions.length} action(s):\n\n${lines.join('\n\n')}`
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
