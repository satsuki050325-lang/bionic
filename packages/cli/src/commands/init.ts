import { ask, askYesNo, askChoice, closeReadline } from '../lib/prompts.js'
import {
  findRepoRoot,
  generateToken,
  generateWebhookSecret,
  buildEnvContent,
  writeEnvFile,
  envFileExists,
  type EnvConfig,
} from '../lib/envFile.js'

export async function initCommand(options?: { force?: boolean }): Promise<void> {
  console.log('\n◈ Bionic Init\n')

  const repoRoot = findRepoRoot()
  if (!repoRoot) {
    console.error('✗ Could not find repo root (.env.example not found).')
    console.error('  Run bionic init from the project root.')
    process.exit(1)
  }
  console.log(`  Repo root: ${repoRoot}\n`)

  if (envFileExists(repoRoot) && !options?.force) {
    console.log('  ⚠ .env.local already exists.')
    const overwrite = await askYesNo('  Overwrite?', false)
    if (!overwrite) {
      console.log('\n  Aborted. Existing .env.local was not modified.')
      closeReadline()
      return
    }
    console.log()
  }

  console.log('── Supabase ─────────────────────────────')
  const supabaseUrl = await ask('  SUPABASE_URL')
  if (!supabaseUrl) {
    console.error('✗ SUPABASE_URL is required.')
    closeReadline()
    process.exit(1)
  }
  const supabaseServiceRoleKey = await ask('  SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseServiceRoleKey) {
    console.error('✗ SUPABASE_SERVICE_ROLE_KEY is required.')
    closeReadline()
    process.exit(1)
  }

  const engineToken = generateToken()
  console.log('\n── Engine ───────────────────────────────')
  console.log('  BIONIC_ENGINE_TOKEN: [auto-generated]')

  console.log('\n── Scheduler ────────────────────────────')
  const schedulerEnabled = await askYesNo(
    '  Enable weekly research digest scheduler?',
    true
  )

  console.log('\n── Discord ──────────────────────────────')
  console.log('  Options: webhook (recommended) / bot / skip')
  let discordMode = (await askChoice('  Configure Discord notifications?', [
    'webhook',
    'bot',
    'skip',
  ])) as 'webhook' | 'bot' | 'skip'

  let discordWebhookUrl: string | undefined
  let discordBotToken: string | undefined
  let discordChannelId: string | undefined
  let discordApproverIds: string | undefined

  if (discordMode === 'webhook') {
    const url = await ask('  DISCORD_WEBHOOK_URL')
    if (!url) {
      console.log('  ⚠ URL not provided. Discord will be skipped.')
      discordMode = 'skip'
    } else {
      discordWebhookUrl = url
    }
  } else if (discordMode === 'bot') {
    const token = await ask('  BIONIC_DISCORD_BOT_TOKEN')
    const channelId = await ask('  BIONIC_DISCORD_CHANNEL_ID')
    if (!token || !channelId) {
      console.log('  ⚠ Bot token or Channel ID not provided. Discord will be skipped.')
      discordMode = 'skip'
    } else {
      discordBotToken = token
      discordChannelId = channelId
      discordApproverIds = await ask(
        '  BIONIC_DISCORD_APPROVER_IDS (comma-separated user IDs, optional)'
      )
    }
  }

  console.log('\n── Vercel ───────────────────────────────')
  const vercelEnabled = await askYesNo(
    '  Configure Vercel Deploy→Watch→Alert?',
    false
  )

  let vercelWebhookSecret: string | undefined
  let vercelProjectMap: string | undefined

  if (vercelEnabled) {
    vercelWebhookSecret = generateWebhookSecret()
    console.log('  VERCEL_WEBHOOK_SECRET: [auto-generated]')
    vercelProjectMap = await ask(
      '  BIONIC_VERCEL_PROJECT_MAP (e.g. prj_xxx:my-service)'
    )
  }

  const config: EnvConfig = {
    supabaseUrl,
    supabaseServiceRoleKey,
    engineToken,
    schedulerEnabled,
    discordMode,
    discordWebhookUrl,
    discordBotToken,
    discordChannelId,
    discordApproverIds,
    vercelEnabled,
    vercelWebhookSecret,
    vercelProjectMap,
  }

  const content = buildEnvContent(config)
  writeEnvFile(repoRoot, content)

  console.log('\n── Summary ──────────────────────────────')
  console.log(`  SUPABASE_URL:              ${supabaseUrl}`)
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: [set]`)
  console.log(`  BIONIC_ENGINE_TOKEN:       [auto-generated]`)
  console.log(
    `  Scheduler:                 ${schedulerEnabled ? 'enabled' : 'disabled'}`
  )
  console.log(`  Discord:                   ${discordMode}`)
  if (discordMode !== 'skip') {
    console.log(`  Discord config:            [set]`)
  }
  console.log(`  Vercel:                    ${vercelEnabled ? 'enabled' : 'disabled'}`)
  if (vercelEnabled) {
    console.log(`  VERCEL_WEBHOOK_SECRET:     [auto-generated]`)
  }

  console.log('\n✓ .env.local created successfully.')
  console.log('\n  Next steps:')
  console.log('  1. Apply Supabase migrations (see supabase/migrations/README.md)')
  console.log('  2. Start Engine: pnpm --filter @bionic/engine dev')
  console.log('  3. Start App:    pnpm --filter @bionic/app dev')
  console.log()

  closeReadline()
}
