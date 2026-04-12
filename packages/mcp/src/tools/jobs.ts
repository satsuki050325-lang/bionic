import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { fetchEngine, DEFAULT_PROJECT_ID } from '../lib/engineClient.js'
import { formatEngineOffline } from '../lib/format.js'

export function registerJobsTool(server: McpServer): void {
  server.tool(
    'run_research_digest',
    'Trigger a research digest job to send the latest research items to Discord',
    {},
    async () => {
      try {
        await fetchEngine('/api/jobs', {
          method: 'POST',
          body: JSON.stringify({
            type: 'research_digest',
            projectId: DEFAULT_PROJECT_ID,
            requestedBy: 'mcp',
          }),
        })

        return {
          content: [
            {
              type: 'text' as const,
              text: 'Research digest job started. Check Discord for the digest shortly.',
            },
          ],
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          content: [{ type: 'text' as const, text: message.includes('offline') ? formatEngineOffline() : message }],
        }
      }
    }
  )
}
