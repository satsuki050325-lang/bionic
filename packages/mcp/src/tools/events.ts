import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { fetchEngine, DEFAULT_PROJECT_ID } from '../lib/engineClient.js'
import { formatDate, formatEngineOffline } from '../lib/format.js'
import type { ListEventsResult } from '@bionic/shared'

export function registerEventsTool(server: McpServer): void {
  server.tool(
    'get_events',
    'Get recent events from Bionic Engine. Filter by type to see specific events like errors or health checks',
    {
      type: z.string().optional().describe('Filter by event type (e.g. service.error.reported, service.health.degraded)'),
      limit: z.number().min(1).max(50).default(20).describe('Number of events to return'),
    },
    async ({ type, limit }) => {
      try {
        const params = new URLSearchParams({
          projectId: DEFAULT_PROJECT_ID,
          limit: String(limit),
        })
        if (type) params.set('type', type)

        const result = await fetchEngine<ListEventsResult>(
          `/api/events?${params.toString()}`
        )

        if (result.events.length === 0) {
          return {
            content: [{ type: 'text' as const, text: 'No events found.' }],
          }
        }

        const lines = result.events.map((event) => {
          return [
            `[${event.type}] ${event.serviceId}`,
            `  Source: ${event.source}`,
            `  Occurred: ${formatDate(event.occurredAt)}`,
            `  ID: ${event.id}`,
          ].join('\n')
        })

        const text = `Found ${result.events.length} event(s):\n\n${lines.join('\n\n')}`
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
