import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { fetchEngine } from '../lib/engineClient.js'
import { formatDate, formatEngineOffline } from '../lib/format.js'
import type { ServiceStatus } from '@bionic/shared'

export function registerStatusTool(server: McpServer): void {
  server.tool(
    'get_status',
    'Get the current Bionic Engine status including health, queue, and alerts',
    {},
    async () => {
      try {
        const status = await fetchEngine<ServiceStatus>('/api/status')
        const text = [
          `Engine: ${status.engine.status.toUpperCase()}`,
          `Version: ${status.engine.version ?? '—'}`,
          `Started: ${formatDate(status.engine.startedAt)}`,
          '',
          'Queue:',
          `  Pending jobs: ${status.queue.pendingJobs}`,
          `  Running jobs: ${status.queue.runningJobs}`,
          `  Pending approvals: ${status.queue.pendingActions}`,
          '',
          'Alerts:',
          `  Open: ${status.alerts.open}`,
          `  Critical: ${status.alerts.critical}`,
          '',
          `Last event: ${formatDate(status.lastEventAt)}`,
        ].join('\n')

        return { content: [{ type: 'text' as const, text }] }
      } catch {
        return {
          content: [{ type: 'text' as const, text: formatEngineOffline() }],
        }
      }
    }
  )
}
