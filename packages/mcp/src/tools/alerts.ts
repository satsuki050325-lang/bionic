import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { fetchEngine, DEFAULT_PROJECT_ID } from '../lib/engineClient.js'
import { formatDate, formatEngineOffline } from '../lib/format.js'
import type { ListAlertsResult } from '@bionic/shared'

export function registerAlertsTool(server: McpServer): void {
  server.tool(
    'get_alerts',
    'Get alerts from Bionic Engine. Filter by status (open/resolved) and severity (critical/warning/info)',
    {
      status: z.enum(['open', 'resolved']).optional().describe('Filter by alert status'),
      severity: z.enum(['critical', 'warning', 'info']).optional().describe('Filter by severity'),
      limit: z.number().min(1).max(50).default(20).describe('Number of alerts to return'),
    },
    async ({ status, severity, limit }) => {
      try {
        const params = new URLSearchParams({
          projectId: DEFAULT_PROJECT_ID,
          limit: String(limit),
        })
        if (status) params.set('status', status)
        if (severity) params.set('severity', severity)

        const result = await fetchEngine<ListAlertsResult>(
          `/api/alerts?${params.toString()}`
        )

        if (result.alerts.length === 0) {
          return {
            content: [{ type: 'text' as const, text: 'No alerts found.' }],
          }
        }

        const lines = result.alerts.map((alert) => {
          const parts = [
            `[${alert.severity.toUpperCase()}] ${alert.title}`,
            `  Type: ${alert.type}`,
            `  Service: ${alert.serviceId ?? '—'}`,
            `  Message: ${alert.message}`,
            `  Count: ${alert.count ?? 1}`,
            `  Last seen: ${formatDate(alert.lastSeenAt)}`,
            `  ID: ${alert.id}`,
          ]
          return parts.join('\n')
        })

        const text = `Found ${result.alerts.length} alert(s):\n\n${lines.join('\n\n')}`
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
