import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerStatusTool } from './tools/status.js'
import { registerAlertsTool } from './tools/alerts.js'
import { registerActionsTool } from './tools/actions.js'
import { registerEventsTool } from './tools/events.js'
import { registerResearchTool } from './tools/research.js'
import { registerJobsTool } from './tools/jobs.js'

const server = new McpServer({
  name: 'bionic-ops',
  version: '0.0.1',
  description: 'Bionic Engine operations MCP server',
})

registerStatusTool(server)
registerAlertsTool(server)
registerActionsTool(server)
registerEventsTool(server)
registerResearchTool(server)
registerJobsTool(server)

const transport = new StdioServerTransport()
await server.connect(transport)
