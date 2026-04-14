# Bionic

**A local-first ops cockpit for solo developers and small SaaS teams.**

Stop checking five dashboards every morning.
Bionic tells you what matters, why it matters, and what to do next.

Bionic connects GitHub, Vercel, Stripe, Sentry, and your own services,
then turns noisy signals into actionable alerts — running entirely on your machine.

---

## What Bionic does

- **Event → Alert**: Detects service health degradation and error spikes automatically
- **Scheduled Digest**: Sends weekly research digests to Discord
- **Deploy → Watch → Alert**: Monitors error rates after Vercel deployments
- **Audit Log**: Records every automated action with full transparency
- **MCP Server**: Query Bionic from Claude Desktop in natural language
- **Discord Bot**: Receives alert notifications with approve/deny buttons

---

## 10-minute Quickstart

The fastest way to go from zero to a live dashboard with simulated signals.

### 1. Clone and install

```bash
git clone https://github.com/satsuki050325-lang/bionic.git
cd bionic
pnpm install
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com), then apply migrations:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 3. Initialize configuration

```bash
npx tsx packages/cli/src/index.ts init
```

This creates `.env.local` with your configuration.

### 4. Diagnose your setup

```bash
npx tsx packages/cli/src/index.ts doctor
```

Fix any `FAIL` items before proceeding.

### 5. Start the Engine

```bash
pnpm --filter @bionic/engine dev
```

### 6. Try the demo

```bash
npx tsx packages/cli/src/index.ts demo
```

This simulates a production incident so you can see Bionic in action
without connecting a real service. Run `demo --cleanup` to remove the
simulated data afterward.

### 7. Open the Dashboard

```bash
pnpm --filter @bionic/app dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase account (free tier works)
- Discord server (for notifications)

---

## Minimum Setup

The fastest way to get Bionic running with basic alert and digest functionality.

### 1. Clone and install

```bash
git clone https://github.com/satsuki050325-lang/bionic.git
cd bionic
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with the minimum required values:

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Leave empty during development (token auth is disabled when not set)
BIONIC_ENGINE_TOKEN=

# Optional: Discord Webhook for digest notifications
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx
```

> **Note**: When `BIONIC_ENGINE_TOKEN` is set, all clients (App, CLI, MCP) must use the same token.
> For local development, leave it empty to disable authentication.

### 3. Apply database migrations

Run each file in `supabase/migrations/` in order via Supabase SQL Editor.
See `supabase/migrations/README.md` for details.

### 4. Start the Engine

```bash
pnpm --filter @bionic/engine dev
```

Engine runs at `http://localhost:3001`.

### 5. Start the App (optional)

```bash
pnpm --filter @bionic/app dev
```

App runs at `http://localhost:3000`.

---

## Full Setup (with Discord Bot)

Adds Discord Bot with alert notifications and approve/deny buttons.

### Additional environment variables

```bash
# Discord Bot
BIONIC_DISCORD_BOT_TOKEN=your-bot-token
BIONIC_DISCORD_CHANNEL_ID=your-channel-id
BIONIC_DISCORD_APPROVER_IDS=your-discord-user-id

# Scheduler (optional)
BIONIC_SCHEDULER_ENABLED=true
BIONIC_DIGEST_CRON=0 9 * * 1
BIONIC_DIGEST_TIMEZONE=Asia/Tokyo
```

### Create a Discord Bot

1. Go to https://discord.com/developers/applications
2. Create a new application named "Bionic"
3. Go to Bot → Reset Token → copy the token
4. Enable "Message Content Intent" and "Server Members Intent"
5. Go to OAuth2 → URL Generator → select `bot` scope
6. Add permissions: Send Messages, Read Messages, Embed Links
7. Open the generated URL and invite the bot to your server

---

## SDK Quickstart

Instrument your service to send observability events to Bionic Engine.

> **Note**: The SDK (`@bionic/sdk`) is currently part of the Bionic monorepo
> and not yet published to npm. Use the Direct API for now.

### Direct API (Recommended)

Send signals directly to the Bionic Engine without any SDK:

```bash
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BIONIC_ENGINE_TOKEN" \
  -d '{
    "event": {
      "id": "test-001",
      "projectId": "project_bionic",
      "serviceId": "my-service",
      "type": "service.health.reported",
      "source": "sdk",
      "occurredAt": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'",
      "payload": { "status": "ok" }
    }
  }'
```

Windows / PowerShell and framework snippets are generated on the
`/services/new` page in the app.

### SDK (Monorepo only)

If you are running Bionic from source, the SDK is available at
`packages/sdk`. npm publishing is planned for a future release.

```typescript
import { BionicClient } from '@bionic/sdk'

const bionic = new BionicClient({
  engineUrl: process.env.BIONIC_ENGINE_URL ?? 'http://localhost:3001',
  token: process.env.BIONIC_ENGINE_TOKEN, // optional in development
  projectId: 'project_bionic',
  serviceId: 'my-api',
})

// Report service health (fire-and-forget)
void bionic.health({ status: 'ok', latencyMs: 120 })
void bionic.health({ status: 'degraded', latencyMs: 3000, reason: 'high_latency' })

// Report errors (stack not sent by default)
void bionic.error({ code: 'DB_CONNECTION_FAILED', message: 'Cannot connect to database' })

// Report usage
void bionic.usage({ requestCount: 1, endpoint: '/api/checkout' })
```

### Next.js Route Handler Example

```typescript
// src/app/api/health/route.ts
import { bionic } from '@/lib/bionic'

export async function GET() {
  try {
    await checkDatabase()
    void bionic.health({ status: 'ok' })
    return Response.json({ status: 'ok' })
  } catch (err) {
    void bionic.error({ code: 'DB_ERROR', message: (err as Error).message })
    void bionic.health({ status: 'down', reason: 'database_unavailable' })
    return Response.json({ status: 'error' }, { status: 500 })
  }
}
```

### Express Middleware Example

```typescript
// middleware/bionic.ts
import { BionicClient } from '@bionic/sdk'

export const bionic = new BionicClient({
  engineUrl: process.env.BIONIC_ENGINE_URL!,
  token: process.env.BIONIC_ENGINE_TOKEN,
  projectId: 'project_bionic',
  serviceId: 'my-express-api',
})

export function bionicMiddleware(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode >= 500) {
      void bionic.error({
        code: 'SERVER_ERROR',
        message: `${req.method} ${req.path}`,
      })
    }
    void bionic.usage({ requestCount: 1, endpoint: req.path })
  })
  next()
}
```

> **Important**: The SDK is server-side only. Never use it in browser environments,
> as your Engine token would be exposed.

> **Note**: SDK failures are fail-open by default. A network error or offline Engine
> will not throw or disrupt your application — events are silently dropped after a
> 3-second timeout. Pass `throwOnError: true` to opt in to throwing.

---

## Vercel Webhook Setup (Deploy→Watch→Alert)

Monitors error rates after deployments and sends alerts.

### Requirements

- ngrok (for local development): `sudo apt install ngrok && ngrok config add-authtoken <token>`
- Vercel Pro plan (for webhook configuration)

### Setup

1. Start ngrok tunnel:
```bash
ngrok http 3001
```

2. Add to `.env.local`:
```bash
VERCEL_WEBHOOK_SECRET=your-webhook-secret
BIONIC_VERCEL_PROJECT_MAP=prj_xxx:your-service-id
```

3. Configure Vercel webhook:
   - Vercel → Settings → Webhooks → Add Webhook
   - URL: `https://your-ngrok-url/api/webhooks/vercel`
   - Events: `deployment.ready`

---

## GitHub Webhook Setup (CI Failure Detection)

Detects CI failures from GitHub Actions and creates alerts.

### Setup

1. Add to `.env.local`:
```bash
GITHUB_WEBHOOK_SECRET=your-webhook-secret
BIONIC_GITHUB_REPO_MAP=owner/repo:your-service-id
```

2. Configure GitHub Webhook:
   - Repository → Settings → Webhooks → Add webhook
   - Payload URL: `https://your-ngrok-url/api/webhooks/github`
   - Content type: `application/json`
   - Secret: same as `GITHUB_WEBHOOK_SECRET`
   - Events: Select "Workflow runs"

3. Restart Engine.

---

## Stripe Webhook Setup (Payment Monitoring)

Monitors payment failures, disputes, and subscription changes.

### Setup

1. Add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
BIONIC_STRIPE_SERVICE_ID=medini
```

2. Configure Stripe Webhook:
   - Stripe Dashboard → Developers → Webhooks → Add endpoint
   - Endpoint URL: `https://your-ngrok-url/api/webhooks/stripe`
   - Events: `invoice.payment_failed`, `charge.dispute.created`,
     `customer.subscription.deleted`, `customer.subscription.updated`,
     `payment_intent.payment_failed`, `charge.refunded`

3. Restart Engine.

---

## Sentry Webhook Setup (Error Monitoring)

Monitors Sentry issues: new issues and regressions become alerts.

### Setup

1. Add to `.env.local`:
```bash
SENTRY_WEBHOOK_SECRET=your-secret
BIONIC_SENTRY_SERVICE_ID=medini
```

2. Configure Sentry:
   - Sentry → Settings → Integrations → Webhooks (or Internal Integration)
   - Webhook URL: `https://your-ngrok-url/api/webhooks/sentry`
   - Resources / Events: `issue`

3. Restart Engine.

---

## Incident Brief (AI-powered, optional)

When `ANTHROPIC_API_KEY` is set, Bionic generates AI-powered incident summaries
on the Dashboard using Claude Haiku.

> **Privacy notice**: Alert metadata (type, severity, service name, count, timestamps)
> is sent to Anthropic API to generate summaries. Error messages, titles, and
> personally identifiable information are NOT sent.
>
> If you want to keep all data fully local, do not set `ANTHROPIC_API_KEY`.
> The Dashboard works without it — Incident Brief will show a static summary instead.

To enable:

```bash
ANTHROPIC_API_KEY=your-api-key
```

---

## MCP Setup (Claude Desktop)

Query Bionic from Claude Desktop in natural language.

### Build

```bash
pnpm --filter @bionic/mcp build
```

### Configure Claude Desktop

Add to `%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac):

```json
{
  "mcpServers": {
    "bionic-ops": {
      "command": "node",
      "args": ["C:\\path\\to\\bionic\\packages\\mcp\\dist\\index.js"],
      "env": {
        "BIONIC_ENGINE_URL": "http://localhost:3001",
        "BIONIC_ENGINE_TOKEN": "",
        "BIONIC_PROJECT_ID": "project_bionic"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

---

## Verification

Run all checks:

```bash
pnpm verify
```

This runs typecheck + engine tests + app build.

---

## Troubleshooting

### Engine won't start
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `.env.local`
- In production, `BIONIC_ENGINE_TOKEN` is required

### Discord Bot not sending notifications
- Verify `BIONIC_DISCORD_CHANNEL_ID` is set (required when Bot token is set)
- Check that the Bot has been added to your server with correct permissions
- For private channels, add the Bot as a member

### MCP server not appearing in Claude Desktop
- On Windows (MSIX install), use the `%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\` path
- Build the MCP package before registering: `pnpm --filter @bionic/mcp build`
- Restart Claude Desktop completely after config changes

### ngrok URL changed
- Free plan generates a new URL on each restart
- Update the Vercel webhook URL after restarting ngrok

---

## CLI Usage

### bionic init

Interactive setup that creates `.env.local` with your configuration.

```bash
npx tsx packages/cli/src/index.ts init
```

### bionic doctor

Diagnoses your Bionic setup and reports any configuration issues.

```bash
npx tsx packages/cli/src/index.ts doctor
```

### bionic demo

Simulates a production incident to explore Bionic without a real service.

```bash
npx tsx packages/cli/src/index.ts demo
npx tsx packages/cli/src/index.ts demo --cleanup  # remove demo data
```

### Engine status and approvals

```bash
# Engine status
npx tsx packages/cli/src/index.ts status

# List pending approvals
npx tsx packages/cli/src/index.ts approvals

# Approve an action
npx tsx packages/cli/src/index.ts approve <actionId>

# Deny an action
npx tsx packages/cli/src/index.ts deny <actionId>
```

> **Note**: If `BIONIC_ENGINE_TOKEN` is set in Engine, pass the same token to CLI:
>
> ```bash
> # Linux/Mac
> BIONIC_ENGINE_TOKEN=your-token npx tsx packages/cli/src/index.ts status
>
> # Windows PowerShell
> $env:BIONIC_ENGINE_TOKEN='your-token'; npx tsx packages/cli/src/index.ts status
> ```

---

## Project Structure

```
bionic/
  packages/
    engine/     # Core runner (Express + node-cron + discord.js)
    sdk/        # Thin client for service integration
    cli/        # Terminal interface
    mcp/        # Claude Desktop MCP server
    shared/     # Shared TypeScript types
  apps/
    app/        # Web dashboard (Next.js)
  supabase/
    migrations/ # Database schema
  docs/
    ROADMAP.md
    MCP.md
    TECHNICAL_DESIGN.md
    BIONIC_PRODUCT.md
```

---

## Development

```bash
# Install dependencies
pnpm install

# Start Engine (development)
pnpm --filter @bionic/engine dev

# Start App (development)
pnpm --filter @bionic/app dev

# Run all checks
pnpm verify

# Run engine tests
pnpm --filter @bionic/engine test
```

---

## License

AGPL-3.0. See [LICENSE](./LICENSE) for details.

For commercial use without AGPL obligations, contact us for a commercial license.
