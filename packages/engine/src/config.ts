import { validateCronExpression } from './scheduler/cron.js'

function readString(env: NodeJS.ProcessEnv, name: string): string | null {
  const val = env[name]
  return val && val.trim() !== '' ? val.trim() : null
}

function readBoolean(
  env: NodeJS.ProcessEnv,
  name: string,
  defaultValue: boolean
): boolean {
  const val = env[name]
  if (!val) return defaultValue
  return val.toLowerCase() === 'true'
}

function readInt(
  env: NodeJS.ProcessEnv,
  name: string,
  defaultValue: number,
  options: { min: number; max: number }
): number {
  const val = env[name]
  if (!val) return defaultValue
  if (!/^\d+$/.test(val)) {
    console.warn(`[config] invalid ${name}: "${val}". Using default: ${defaultValue}`)
    return defaultValue
  }
  const parsed = parseInt(val, 10)
  if (parsed < options.min || parsed > options.max) {
    console.warn(
      `[config] ${name} out of range [${options.min}-${options.max}]: "${val}". Using default: ${defaultValue}`
    )
    return defaultValue
  }
  return parsed
}

function readCsv(env: NodeJS.ProcessEnv, name: string): string[] {
  const val = env[name]
  if (!val || val.trim() === '') return []
  return val.split(',').map((s) => s.trim()).filter(Boolean)
}

function readProjectId(
  env: NodeJS.ProcessEnv,
  name: string,
  defaultValue: string
): string {
  const val = env[name]
  if (!val) return defaultValue
  if (!/^[a-zA-Z0-9_-]+$/.test(val)) {
    console.warn(
      `[config] invalid ${name}: "${val}". Only alphanumeric, hyphen, underscore allowed. Using default: ${defaultValue}`
    )
    return defaultValue
  }
  return val
}

const ALLOWED_TIMEZONES = new Set([
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Singapore', 'Asia/Shanghai',
  'Asia/Kolkata', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'Europe/Amsterdam', 'UTC', 'America/New_York', 'America/Chicago',
  'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo',
  'Australia/Sydney', 'Pacific/Auckland',
])

function readTimezone(
  env: NodeJS.ProcessEnv,
  name: string,
  defaultValue: string
): string {
  const val = env[name]
  if (!val) return defaultValue
  if (!ALLOWED_TIMEZONES.has(val)) {
    console.warn(
      `[config] invalid ${name}: "${val}". Using default: ${defaultValue}`
    )
    return defaultValue
  }
  return val
}

function readCron(
  env: NodeJS.ProcessEnv,
  name: string,
  defaultValue: string
): string {
  const val = env[name]
  if (!val) return defaultValue
  if (!validateCronExpression(val)) {
    console.warn(
      `[config] invalid ${name}: "${val}". Must be "minute hour * * dayOfWeek". Using default: ${defaultValue}`
    )
    return defaultValue
  }
  return val
}

function readGitHubRepoMap(
  env: NodeJS.ProcessEnv,
  name: string
): Map<string, string> {
  const val = env[name]
  const map = new Map<string, string>()
  if (!val) return map
  for (const entry of val.split(',')) {
    const trimmed = entry.trim()
    const colonIdx = trimmed.lastIndexOf(':')
    if (colonIdx <= 0) continue
    const repo = trimmed.slice(0, colonIdx)
    const serviceId = trimmed.slice(colonIdx + 1)
    if (repo && serviceId) {
      map.set(repo, serviceId)
    }
  }
  return map
}

function readVercelProjectMap(
  env: NodeJS.ProcessEnv,
  name: string
): Map<string, string> {
  const val = env[name]
  const map = new Map<string, string>()
  if (!val) return map
  for (const entry of val.split(',')) {
    const [projectId, serviceId] = entry.trim().split(':')
    if (projectId && serviceId) {
      map.set(projectId, serviceId)
    }
  }
  return map
}

export interface EngineConfig {
  nodeEnv: string
  projectId: string

  engine: {
    port: number
    host: string
    token: string | null
    isProduction: boolean
  }

  supabase: {
    url: string | null
    serviceRoleKey: string | null
  }

  scheduler: {
    enabled: boolean
    digestCron: string
    digestTimezone: string
  }

  discord: {
    webhookUrl: string | null
    botToken: string | null
    channelId: string | null
    approverIds: string[]
    mode: 'bot' | 'webhook' | 'disabled'
  }

  notification: {
    quietHoursStart: number
    quietHoursEnd: number
    quietHoursTimezone: string
  }

  vercel: {
    webhookSecret: string | null
    projectMap: Map<string, string>
  }

  github: {
    webhookSecret: string | null
    repoMap: Map<string, string>
    enabled: boolean
  }

  stripe: {
    webhookSecret: string | null
    serviceId: string
    enabled: boolean
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): EngineConfig {
  const botToken = readString(env, 'BIONIC_DISCORD_BOT_TOKEN')
  const webhookUrl = readString(env, 'DISCORD_WEBHOOK_URL')
  const channelId = readString(env, 'BIONIC_DISCORD_CHANNEL_ID')

  let discordMode: 'bot' | 'webhook' | 'disabled'
  if (botToken && channelId) {
    discordMode = 'bot'
  } else if (botToken && !channelId) {
    console.warn(
      '[config] BIONIC_DISCORD_BOT_TOKEN is set but BIONIC_DISCORD_CHANNEL_ID is missing. ' +
      'Falling back to Webhook mode.'
    )
    discordMode = webhookUrl ? 'webhook' : 'disabled'
  } else if (webhookUrl) {
    discordMode = 'webhook'
  } else {
    discordMode = 'disabled'
  }

  return {
    nodeEnv: env['NODE_ENV'] ?? 'development',
    projectId: readProjectId(env, 'BIONIC_PROJECT_ID', 'project_bionic'),

    engine: {
      port: readInt(env, 'PORT', 3001, { min: 1, max: 65535 }),
      host: readString(env, 'BIONIC_ENGINE_HOST') ?? '127.0.0.1',
      token: readString(env, 'BIONIC_ENGINE_TOKEN'),
      isProduction: (env['NODE_ENV'] ?? 'development') === 'production',
    },

    supabase: {
      url: readString(env, 'SUPABASE_URL'),
      serviceRoleKey: readString(env, 'SUPABASE_SERVICE_ROLE_KEY'),
    },

    scheduler: {
      enabled: readBoolean(env, 'BIONIC_SCHEDULER_ENABLED', false),
      digestCron: readCron(env, 'BIONIC_DIGEST_CRON', '0 9 * * 1'),
      digestTimezone: readTimezone(env, 'BIONIC_DIGEST_TIMEZONE', 'Asia/Tokyo'),
    },

    discord: {
      webhookUrl,
      botToken,
      channelId,
      approverIds: readCsv(env, 'BIONIC_DISCORD_APPROVER_IDS'),
      mode: discordMode,
    },

    notification: {
      quietHoursStart: readInt(env, 'BIONIC_QUIET_HOURS_START', 23, { min: 0, max: 23 }),
      quietHoursEnd: readInt(env, 'BIONIC_QUIET_HOURS_END', 7, { min: 0, max: 23 }),
      quietHoursTimezone: readTimezone(env, 'BIONIC_QUIET_HOURS_TIMEZONE', 'Asia/Tokyo'),
    },

    vercel: {
      webhookSecret: readString(env, 'VERCEL_WEBHOOK_SECRET'),
      projectMap: readVercelProjectMap(env, 'BIONIC_VERCEL_PROJECT_MAP'),
    },

    github: {
      webhookSecret: readString(env, 'GITHUB_WEBHOOK_SECRET'),
      repoMap: readGitHubRepoMap(env, 'BIONIC_GITHUB_REPO_MAP'),
      enabled: !!readString(env, 'GITHUB_WEBHOOK_SECRET'),
    },

    stripe: {
      webhookSecret: readString(env, 'STRIPE_WEBHOOK_SECRET'),
      serviceId: readString(env, 'BIONIC_STRIPE_SERVICE_ID') ?? 'stripe',
      enabled: !!readString(env, 'STRIPE_WEBHOOK_SECRET'),
    },
  }
}

export function validateConfigForStartup(config: EngineConfig): void {
  const errors: string[] = []

  if (config.engine.isProduction) {
    if (!config.engine.token) {
      errors.push('BIONIC_ENGINE_TOKEN is required in production')
    }
    if (!config.supabase.url) {
      errors.push('SUPABASE_URL is required in production')
    }
    if (!config.supabase.serviceRoleKey) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required in production')
    }
  }

  if (errors.length > 0) {
    console.error('[config] startup validation failed:')
    errors.forEach((e) => console.error(`  - ${e}`))
    process.exit(1)
  }
}

export function redactConfig(config: EngineConfig): Record<string, unknown> {
  return {
    nodeEnv: config.nodeEnv,
    projectId: config.projectId,
    engine: {
      port: config.engine.port,
      host: config.engine.host,
      token: config.engine.token ? '[set]' : '[not set]',
      isProduction: config.engine.isProduction,
    },
    supabase: {
      url: config.supabase.url ? '[set]' : '[not set]',
      serviceRoleKey: config.supabase.serviceRoleKey ? '[set]' : '[not set]',
    },
    scheduler: config.scheduler,
    discord: {
      mode: config.discord.mode,
      webhookUrl: config.discord.webhookUrl ? '[set]' : '[not set]',
      botToken: config.discord.botToken ? '[set]' : '[not set]',
      channelId: config.discord.channelId,
      approverIds: config.discord.approverIds.length > 0 ? '[set]' : '[not set]',
    },
    notification: config.notification,
    vercel: {
      webhookSecret: config.vercel.webhookSecret ? '[set]' : '[not set]',
      projectMapSize: config.vercel.projectMap.size,
    },
    github: {
      webhookSecret: config.github.webhookSecret ? '[set]' : '[not set]',
      repoMapSize: config.github.repoMap.size,
      enabled: config.github.enabled,
    },
    stripe: {
      webhookSecret: config.stripe.webhookSecret ? '[set]' : '[not set]',
      serviceId: config.stripe.serviceId,
      enabled: config.stripe.enabled,
    },
  }
}

let _config: EngineConfig | null = null

export function getConfig(): EngineConfig {
  if (!_config) {
    _config = loadConfig()
  }
  return _config
}
