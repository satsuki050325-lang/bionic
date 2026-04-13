import * as crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from '../lib/envLoader.js'
import { findRepoRoot } from '../lib/envFile.js'

const DEMO_SERVICE_ID = 'demo-api'
const DEMO_INTERVAL_MS = 800

interface DemoOptions {
  fast?: boolean
  cleanup?: boolean
  serviceId?: string
  engineUrl?: string
}

type StepStatus = 'OK' | 'SEND' | 'DONE' | 'INFO' | 'FAIL'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function printStep(label: string, status: StepStatus): void {
  const statusStr = status.padEnd(4)
  console.log(`  ${statusStr}  ${label}`)
}

async function sendEvent(
  engineUrl: string,
  token: string | undefined,
  event: {
    id: string
    type: string
    serviceId: string
    projectId: string
    payload: Record<string, unknown>
  }
): Promise<boolean> {
  try {
    const res = await fetch(`${engineUrl}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        event: {
          id: event.id,
          type: event.type,
          serviceId: event.serviceId,
          projectId: event.projectId,
          source: 'cli',
          occurredAt: new Date().toISOString(),
          payload: event.payload,
        },
      }),
    })
    return res.ok || res.status === 202
  } catch {
    return false
  }
}

async function runCleanup(serviceId: string): Promise<void> {
  console.log('\n◈ Bionic Demo Cleanup\n')

  const supabaseUrl = process.env['SUPABASE_URL']
  const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

  if (!supabaseUrl || !supabaseKey) {
    console.log('  FAIL  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set')
    console.log('        Fix: run bionic init or set env variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const tables = ['engine_events', 'engine_alerts', 'engine_actions']

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('service_id', serviceId)

    if (error) {
      console.log(`  FAIL  ${table}: ${error.message}`)
    } else {
      console.log(`  OK    ${table} cleared`)
    }
  }

  console.log(`\n  Demo data for service '${serviceId}' has been removed.`)
}

export async function demoCommand(options: DemoOptions): Promise<void> {
  const repoRoot = findRepoRoot()
  if (repoRoot) loadEnvLocal(repoRoot)

  if (options.cleanup) {
    const serviceId = options.serviceId ?? DEMO_SERVICE_ID
    await runCleanup(serviceId)
    return
  }

  console.log('\n◈ Bionic Demo\n')
  console.log('  This will simulate a production incident for Bionic.')
  console.log('  Open the App in another window to watch events appear.\n')

  const engineUrl =
    options.engineUrl ??
    process.env['BIONIC_ENGINE_URL'] ??
    process.env['NEXT_PUBLIC_ENGINE_URL'] ??
    'http://localhost:3001'

  const token = process.env['BIONIC_ENGINE_TOKEN']
  const projectId = process.env['BIONIC_PROJECT_ID'] ?? 'project_bionic'
  const serviceId = options.serviceId ?? DEMO_SERVICE_ID
  const interval = options.fast ? 0 : DEMO_INTERVAL_MS
  const demoRunId = `demo_${crypto.randomBytes(4).toString('hex')}`

  try {
    const res = await fetch(`${engineUrl}/api/status`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error(`${res.status}`)
    printStep(`Engine connected: ${engineUrl}`, 'OK')
  } catch {
    printStep(`Engine not reachable at ${engineUrl}`, 'FAIL')
    console.log('        Fix: pnpm --filter @bionic/engine dev')
    process.exit(1)
  }

  console.log()

  const events: Array<{
    label: string
    type: string
    payload: Record<string, unknown>
  }> = [
    {
      label: 'Baseline health — service is running normally',
      type: 'service.health.reported',
      payload: {
        status: 'ok',
        latencyMs: 120,
        demo: true,
        demoRunId,
      },
    },
    {
      label: 'Latency spike detected — response time degraded',
      type: 'service.health.reported',
      payload: {
        status: 'degraded',
        reason: 'high_latency',
        latencyMs: 2800,
        demo: true,
        demoRunId,
      },
    },
    {
      label: 'Database connection failed — critical error',
      type: 'service.error.reported',
      payload: {
        code: 'DB_CONNECTION_FAILED',
        message: '[Demo] Checkout database connection failed',
        demo: true,
        demoRunId,
      },
    },
    {
      label: 'Payment processing failed — Stripe error',
      type: 'service.error.reported',
      payload: {
        code: 'PAYMENT_FAILED',
        message: '[Demo] Stripe payment failed during checkout',
        provider: 'stripe',
        demo: true,
        demoRunId,
      },
    },
    {
      label: 'Sentry regression — issue re-opened in production',
      type: 'service.error.reported',
      payload: {
        code: 'SENTRY_REGRESSION',
        message: '[Demo] Sentry issue regressed in production',
        provider: 'sentry',
        environment: 'production',
        demo: true,
        demoRunId,
      },
    },
    {
      label: 'Deploy regression — errors increased after deploy',
      type: 'service.error.reported',
      payload: {
        code: 'DEPLOY_REGRESSION',
        message: '[Demo] Error rate increased after deploy abc123',
        provider: 'vercel',
        deploymentId: 'demo-deploy-abc123',
        commitSha: 'abc123',
        demo: true,
        demoRunId,
      },
    },
    {
      label: 'Usage signal — API activity recorded',
      type: 'service.usage.reported',
      payload: {
        requestCount: 42,
        endpoint: '/api/checkout',
        demo: true,
        demoRunId,
      },
    },
  ]

  let sent = 0
  for (const event of events) {
    printStep(event.label, 'SEND')
    const ok = await sendEvent(engineUrl, token, {
      id: `${demoRunId}_${sent}`,
      type: event.type,
      serviceId,
      projectId,
      payload: event.payload,
    })
    if (!ok) {
      console.log(`        Warning: event may not have been accepted`)
    }
    sent++
    if (interval > 0) await sleep(interval)
  }

  console.log('\n  DONE  Demo scenario complete.\n')
  console.log('  Open the Bionic App to see the results:')
  console.log(`    Dashboard:   http://localhost:3000`)
  console.log(`    Alerts:      http://localhost:3000/alerts`)
  console.log(`    Actions:     http://localhost:3000/actions`)
  console.log(`    Diagnostics: http://localhost:3000/diagnostics`)
  console.log()
  console.log('  If Discord is configured, notifications should have arrived.')
  console.log()
  console.log(`  To clean up demo data:`)
  console.log(`    npx tsx packages/cli/src/index.ts demo --cleanup`)
  console.log()
}
