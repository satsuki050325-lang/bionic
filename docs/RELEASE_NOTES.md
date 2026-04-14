# v0.1.0-alpha — local-first ops cockpit MVP

First public release of Bionic.

## What's included

- **Local Engine** — Express server with Supabase backend
- **Web Dashboard** — Next.js app (Dashboard / Services / Alerts / Actions / Diagnostics / Settings)
- **Service Integration** — Direct API (curl / HTTP) for sending signals
- **Webhooks** — Vercel / GitHub / Stripe / Sentry
- **Discord notifications** — Webhook and Bot with approve/deny buttons
- **MCP server** — Query Bionic from Claude Desktop in natural language
- **CLI** — `bionic init`, `doctor`, `demo`
- **Multi-language** — English / 日本語 / Español / 中文

## Getting started

See [README](../README.md) for the 10-minute Quickstart.

## Known limitations

- SDK (`@bionic/sdk`) is not yet published to npm (coming soon)
- Uptime ping monitoring is planned for v0.2.0
- Hosted version is planned (currently self-hosted only)
