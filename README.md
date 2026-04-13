# Bionic

A local-first AI operations engine for solo developers and small teams.

Bionic observes your services, generates alerts, runs scheduled digests, and notifies you via Discord — all running locally with zero cloud dependencies.

---

## What Bionic does

- **Event → Alert**: Detects service health degradation and error spikes automatically
- **Scheduled Digest**: Sends weekly research digests to Discord
- **Deploy → Watch → Alert**: Monitors error rates after Vercel deployments
- **Audit Log**: Records every automated action with full transparency
- **MCP Server**: Query Bionic from Claude Desktop in natural language
- **Discord Bot**: Receives alert notifications with approve/deny buttons

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
git clone https://github.com/your-repo/bionic.git
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

AGPL-3.0 (planned)
