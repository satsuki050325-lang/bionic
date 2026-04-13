import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { findRepoRoot } from '../lib/envFile.js'
import { loadEnvLocal } from '../lib/envLoader.js'

type CheckStatus = 'OK' | 'WARN' | 'FAIL' | 'SKIP'

interface CheckResult {
  status: CheckStatus
  label: string
  detail?: string
  fix?: string
}

interface Counters {
  ok: number
  warn: number
  fail: number
  skip: number
  firstFixHint: string | null
  firstWarnHint: string | null
}

function printCheck(result: CheckResult, counters: Counters): void {
  const statusStr = result.status.padEnd(4)
  console.log(`  ${statusStr}  ${result.label}`)
  if (result.detail) console.log(`        ${result.detail}`)
  if (result.fix) console.log(`        Fix: ${result.fix}`)

  if (result.status === 'OK') counters.ok++
  else if (result.status === 'WARN') {
    counters.warn++
    if (!counters.firstWarnHint && result.fix) counters.firstWarnHint = result.fix
  } else if (result.status === 'FAIL') {
    counters.fail++
    if (!counters.firstFixHint && result.fix) counters.firstFixHint = result.fix
  } else if (result.status === 'SKIP') counters.skip++
}

function printSection(title: string): void {
  console.log(`\n${title}`)
}

const REQUIRED_TABLES = [
  'engine_events',
  'engine_jobs',
  'engine_alerts',
  'engine_actions',
  'research_items',
  'deployments',
] as const

const REQUIRED_COLUMNS: Record<string, string[]> = {
  engine_jobs: ['updated_at', 'dedupe_key'],
  engine_alerts: ['fingerprint', 'last_notified_at', 'notification_count'],
  engine_actions: ['last_notified_at', 'notification_count', 'approved_by', 'denied_by'],
  deployments: ['watch_status'],
}

async function checkTableExists(
  supabase: SupabaseClient,
  tableName: string
): Promise<{ exists: boolean; error?: string }> {
  const { error } = await supabase.from(tableName).select('*', { count: 'exact', head: true }).limit(1)
  if (!error) return { exists: true }
  const msg = error.message || String(error)
  if (/does not exist|schema cache|not found|Could not find/i.test(msg)) {
    return { exists: false, error: msg }
  }
  return { exists: true, error: msg }
}

async function checkColumnsForTable(
  supabase: SupabaseClient,
  tableName: string,
  columns: string[]
): Promise<{ missing: string[]; error?: string }> {
  const { data, error } = await supabase
    .from('information_schema.columns' as never)
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
  if (error) {
    const missing: string[] = []
    for (const col of columns) {
      const res = await supabase.from(tableName).select(col).limit(0)
      if (res.error) {
        const msg = res.error.message || ''
        if (/does not exist|column|not found/i.test(msg)) missing.push(col)
      }
    }
    return { missing }
  }
  const found = new Set<string>(((data as Array<{ column_name: string }>) ?? []).map((r) => r.column_name))
  const missing = columns.filter((c) => !found.has(c))
  return { missing }
}

async function checkEnvironment(counters: Counters, repoRoot: string | null): Promise<void> {
  printSection('Environment')

  if (!repoRoot) {
    printCheck(
      {
        status: 'FAIL',
        label: 'Repo root',
        detail: '.env.example not found in any parent directory',
        fix: 'Run bionic doctor from inside the Bionic repo',
      },
      counters
    )
    return
  }
  printCheck({ status: 'OK', label: 'Repo root', detail: repoRoot }, counters)

  const fs = await import('fs')
  const path = await import('path')
  const envLocalPath = path.join(repoRoot, '.env.local')
  if (fs.existsSync(envLocalPath)) {
    printCheck({ status: 'OK', label: '.env.local present' }, counters)
  } else {
    printCheck(
      {
        status: 'WARN',
        label: '.env.local present',
        detail: 'Not found at ' + envLocalPath,
        fix: 'Run: bionic init',
      },
      counters
    )
  }

  const supabaseUrl = process.env.SUPABASE_URL
  printCheck(
    supabaseUrl
      ? { status: 'OK', label: 'SUPABASE_URL' }
      : {
          status: 'FAIL',
          label: 'SUPABASE_URL',
          detail: 'Not set',
          fix: 'Set SUPABASE_URL in .env.local',
        },
    counters
  )

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  printCheck(
    supabaseKey
      ? { status: 'OK', label: 'SUPABASE_SERVICE_ROLE_KEY' }
      : {
          status: 'FAIL',
          label: 'SUPABASE_SERVICE_ROLE_KEY',
          detail: 'Not set',
          fix: 'Set SUPABASE_SERVICE_ROLE_KEY in .env.local',
        },
    counters
  )

  const engineToken = process.env.BIONIC_ENGINE_TOKEN
  printCheck(
    engineToken
      ? { status: 'OK', label: 'BIONIC_ENGINE_TOKEN' }
      : {
          status: 'WARN',
          label: 'BIONIC_ENGINE_TOKEN',
          detail: 'Not set (required in production)',
          fix: 'Set BIONIC_ENGINE_TOKEN in .env.local',
        },
    counters
  )

  const projectId = process.env.BIONIC_PROJECT_ID
  printCheck(
    projectId
      ? { status: 'OK', label: 'BIONIC_PROJECT_ID', detail: projectId }
      : {
          status: 'WARN',
          label: 'BIONIC_PROJECT_ID',
          detail: 'Not set (default: project_bionic)',
        },
    counters
  )
}

async function checkDatabase(counters: Counters): Promise<void> {
  printSection('Database')

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    printCheck(
      {
        status: 'SKIP',
        label: 'Supabase connection',
        detail: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set',
      },
      counters
    )
    return
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const probe = await checkTableExists(supabase, 'engine_events')
  if (!probe.exists && probe.error && !/does not exist/i.test(probe.error)) {
    printCheck(
      {
        status: 'FAIL',
        label: 'Supabase connection',
        detail: probe.error,
        fix: 'Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY values',
      },
      counters
    )
    return
  }
  printCheck({ status: 'OK', label: 'Supabase connection' }, counters)

  for (const table of REQUIRED_TABLES) {
    const res = await checkTableExists(supabase, table)
    if (res.exists) {
      printCheck({ status: 'OK', label: `Table: ${table}` }, counters)
    } else {
      printCheck(
        {
          status: 'FAIL',
          label: `Table: ${table}`,
          detail: res.error ?? 'Table not found',
          fix: 'Apply Supabase migrations (see supabase/migrations/README.md)',
        },
        counters
      )
    }
  }

  for (const [table, cols] of Object.entries(REQUIRED_COLUMNS)) {
    const res = await checkColumnsForTable(supabase, table, cols)
    if (res.missing.length === 0) {
      printCheck({ status: 'OK', label: `Columns: ${table} (${cols.join(', ')})` }, counters)
    } else {
      printCheck(
        {
          status: 'FAIL',
          label: `Columns: ${table}`,
          detail: `Missing: ${res.missing.join(', ')}`,
          fix: 'Apply latest Supabase migrations',
        },
        counters
      )
    }
  }
}

async function checkEngine(counters: Counters, engineUrlOverride?: string): Promise<void> {
  printSection('Engine')

  const engineUrl =
    engineUrlOverride ?? process.env.NEXT_PUBLIC_ENGINE_URL ?? 'http://localhost:3001'
  const token = process.env.BIONIC_ENGINE_TOKEN

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res: Response
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
      res = await fetch(`${engineUrl}/api/status`, { headers, signal: controller.signal })
    } finally {
      clearTimeout(timeout)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    printCheck(
      {
        status: 'FAIL',
        label: `Engine reachability (${engineUrl})`,
        detail: `Engine is not reachable: ${msg}`,
        fix: 'Start the Engine: pnpm --filter @bionic/engine dev',
      },
      counters
    )
    return
  }

  if (res.status === 200) {
    printCheck({ status: 'OK', label: `Engine reachable (${engineUrl})` }, counters)
    return
  }
  if (res.status === 401) {
    printCheck(
      {
        status: 'FAIL',
        label: 'Engine authentication',
        detail: 'Engine token mismatch (401)',
        fix: 'Set BIONIC_ENGINE_TOKEN to match the Engine value',
      },
      counters
    )
    return
  }
  if (res.status === 503) {
    printCheck(
      {
        status: 'FAIL',
        label: 'Engine health',
        detail: 'Engine DB connection failed (503)',
        fix: 'Check Engine logs and Supabase connectivity',
      },
      counters
    )
    return
  }
  printCheck(
    {
      status: 'FAIL',
      label: 'Engine health',
      detail: `Unexpected status ${res.status}`,
      fix: 'Check Engine logs',
    },
    counters
  )
}

function discordMode(): 'bot' | 'webhook' | 'disabled' {
  const botToken = process.env.BIONIC_DISCORD_BOT_TOKEN
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  const channelId = process.env.BIONIC_DISCORD_CHANNEL_ID
  if (botToken && channelId) return 'bot'
  if (webhookUrl) return 'webhook'
  return 'disabled'
}

async function checkDiscord(counters: Counters): Promise<void> {
  printSection('Discord')

  const mode = discordMode()
  if (mode === 'disabled') {
    printCheck(
      { status: 'SKIP', label: 'Discord', detail: 'Discord not configured' },
      counters
    )
    return
  }

  if (mode === 'bot') {
    printCheck({ status: 'OK', label: 'Discord mode: bot' }, counters)
    printCheck({ status: 'OK', label: 'BIONIC_DISCORD_BOT_TOKEN' }, counters)
    printCheck({ status: 'OK', label: 'BIONIC_DISCORD_CHANNEL_ID' }, counters)
  } else {
    printCheck({ status: 'OK', label: 'Discord mode: webhook' }, counters)
    printCheck({ status: 'OK', label: 'DISCORD_WEBHOOK_URL' }, counters)
  }

  const approvers = process.env.BIONIC_DISCORD_APPROVER_IDS
  if (!approvers || approvers.trim() === '') {
    printCheck(
      {
        status: 'WARN',
        label: 'BIONIC_DISCORD_APPROVER_IDS',
        detail: 'Not set (approval commands from any user will be rejected)',
        fix: 'Set BIONIC_DISCORD_APPROVER_IDS to a comma-separated list of Discord user IDs',
      },
      counters
    )
  } else {
    printCheck({ status: 'OK', label: 'BIONIC_DISCORD_APPROVER_IDS' }, counters)
  }
}

async function checkIntegrations(counters: Counters): Promise<void> {
  printSection('Integrations')

  const integrations: Array<{
    name: string
    secretEnv: string
    pairEnv: string
    pairLabel: string
  }> = [
    {
      name: 'Vercel',
      secretEnv: 'VERCEL_WEBHOOK_SECRET',
      pairEnv: 'BIONIC_VERCEL_PROJECT_MAP',
      pairLabel: 'project map',
    },
    {
      name: 'GitHub',
      secretEnv: 'GITHUB_WEBHOOK_SECRET',
      pairEnv: 'BIONIC_GITHUB_REPO_MAP',
      pairLabel: 'repo map',
    },
    {
      name: 'Stripe',
      secretEnv: 'STRIPE_WEBHOOK_SECRET',
      pairEnv: 'BIONIC_STRIPE_SERVICE_ID',
      pairLabel: 'service id',
    },
    {
      name: 'Sentry',
      secretEnv: 'SENTRY_WEBHOOK_SECRET',
      pairEnv: 'BIONIC_SENTRY_SERVICE_ID',
      pairLabel: 'service id',
    },
  ]

  for (const it of integrations) {
    const secret = process.env[it.secretEnv]
    const pair = process.env[it.pairEnv]
    if (!secret && !pair) {
      printCheck(
        { status: 'SKIP', label: `${it.name}`, detail: 'Not configured' },
        counters
      )
    } else if (secret && !pair) {
      printCheck(
        {
          status: 'WARN',
          label: `${it.name}`,
          detail: `${it.secretEnv} is set but ${it.pairEnv} (${it.pairLabel}) is missing`,
          fix: `Set ${it.pairEnv}`,
        },
        counters
      )
    } else if (!secret && pair) {
      printCheck(
        {
          status: 'WARN',
          label: `${it.name}`,
          detail: `${it.pairEnv} is set but ${it.secretEnv} is missing`,
          fix: `Set ${it.secretEnv}`,
        },
        counters
      )
    } else {
      printCheck({ status: 'OK', label: `${it.name}` }, counters)
    }
  }
}

function printSummary(counters: Counters): number {
  printSection('Summary')
  console.log(
    `  ${counters.ok} OK, ${counters.warn} WARN, ${counters.fail} FAIL, ${counters.skip} SKIP`
  )

  let result: string
  let nextStep: string
  if (counters.fail > 0) {
    result = 'Bionic is not ready.'
    nextStep = counters.firstFixHint ?? 'Resolve the FAIL items above'
  } else if (counters.warn > 0) {
    result = 'Bionic has warnings.'
    nextStep = counters.firstWarnHint ?? 'Review the WARN items above'
  } else {
    result = 'Bionic is ready.'
    nextStep = 'Start Engine: pnpm --filter @bionic/engine dev'
  }
  console.log(`  Result: ${result}`)
  console.log(`  Next step: ${nextStep}`)
  console.log()

  return counters.fail > 0 ? 1 : 0
}

export async function doctorCommand(options?: { engineUrl?: string }): Promise<void> {
  console.log('\nBionic Doctor')

  const repoRoot = findRepoRoot()
  if (repoRoot) loadEnvLocal(repoRoot)

  const counters: Counters = {
    ok: 0,
    warn: 0,
    fail: 0,
    skip: 0,
    firstFixHint: null,
    firstWarnHint: null,
  }

  await checkEnvironment(counters, repoRoot)
  await checkDatabase(counters)
  await checkEngine(counters, options?.engineUrl)
  await checkDiscord(counters)
  await checkIntegrations(counters)

  const exitCode = printSummary(counters)
  process.exit(exitCode)
}
