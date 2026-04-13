# Show HN: Bionic – a local-first ops cockpit for solo developers

I built Bionic for people running multiple small SaaS products alone or with a tiny team.

It runs locally, receives events from your apps and webhooks from tools like GitHub, Vercel, Stripe, and Sentry, turns important signals into alerts, sends Discord notifications, and keeps an audit log of every automated action.

The goal is not to replace Datadog or PagerDuty. It is to give solo developers a calm "what needs my attention?" screen without another hosted account or expensive monitoring setup.

**What it includes:**
- Local Engine + Next.js dashboard
- SDK for app events (5 lines to instrument)
- Discord notifications with approval flows
- GitHub CI failure alerts
- Stripe payment failure alerts
- Sentry issue regression alerts
- Vercel deploy regression watch
- MCP server for Claude Desktop
- Optional AI incident brief (redacted metadata only, explicit opt-in)

**Try it without a real service:**

```bash
npx tsx packages/cli/src/index.ts demo
```

This simulates a production incident and shows you the dashboard, alerts, and Discord notifications in action.

**Why local-first:**
Your service names, error codes, and alert details stay on your machine by default.
The optional AI brief only sends alert type, severity, and counts — never error messages or titles.

I'd love feedback on:
- Setup friction (is `bionic doctor` enough?)
- Which integrations would be most useful
- Alert quality (too noisy? not enough signal?)

GitHub: https://github.com/satsuki050325-lang/bionic
