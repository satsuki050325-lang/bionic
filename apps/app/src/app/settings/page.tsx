import { cookies } from 'next/headers'
import Link from 'next/link'
import { LanguageSwitcher } from './LanguageSwitcher'

type RowStatus = 'ok' | 'warn' | 'missing'

function SettingRow({
  label,
  value,
  status,
}: {
  label: string
  value: string
  status?: RowStatus
}) {
  const valueColor =
    status === 'ok'
      ? 'text-status-success'
      : status === 'warn'
        ? 'text-status-warning'
        : status === 'missing'
          ? 'text-text-muted'
          : 'text-text-primary'

  return (
    <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0 gap-4">
      <span className="font-mono text-xs text-text-secondary uppercase tracking-wide shrink-0">
        {label}
      </span>
      <span
        className={`font-mono text-xs text-right break-all ${valueColor}`}
      >
        {value}
      </span>
    </div>
  )
}

function SettingSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded p-5 mb-4">
      <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mb-4">
        {title}
      </div>
      {children}
    </div>
  )
}

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const locale = cookieStore.get('bionic-locale')?.value ?? 'en'

  const engineUrl = process.env.NEXT_PUBLIC_ENGINE_URL ?? 'http://localhost:3001'
  const projectId = process.env.BIONIC_PROJECT_ID ?? 'project_bionic'
  const engineTokenSet = !!process.env.BIONIC_ENGINE_TOKEN
  const supabaseUrlSet = !!process.env.SUPABASE_URL
  const supabaseKeySet = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const schedulerEnabled = process.env.BIONIC_SCHEDULER_ENABLED === 'true'
  const digestCron = process.env.BIONIC_DIGEST_CRON ?? '0 9 * * 1'
  const timezone = process.env.BIONIC_DIGEST_TIMEZONE ?? 'Asia/Tokyo'
  const discordMode = process.env.BIONIC_DISCORD_BOT_TOKEN
    ? 'bot'
    : process.env.DISCORD_WEBHOOK_URL
      ? 'webhook'
      : 'disabled'
  const anthropicKeySet = !!process.env.ANTHROPIC_API_KEY
  const vercelSet = !!process.env.VERCEL_WEBHOOK_SECRET
  const githubSet = !!process.env.GITHUB_WEBHOOK_SECRET
  const stripeSet = !!process.env.STRIPE_WEBHOOK_SECRET
  const sentrySet = !!process.env.SENTRY_WEBHOOK_SECRET

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary uppercase tracking-wide">
          Settings
        </h1>
        <p className="font-mono text-xs text-text-muted mt-1">
          Configuration · Read-only · Edit via .env.local
        </p>
      </div>

      <SettingSection title="Preferences">
        <div className="flex items-center justify-between py-2">
          <span className="font-mono text-xs text-text-secondary uppercase tracking-wide">
            Language
          </span>
          <LanguageSwitcher currentLocale={locale} />
        </div>
      </SettingSection>

      <SettingSection title="Project">
        <SettingRow label="Project ID" value={projectId} status="ok" />
        <SettingRow label="Engine URL" value={engineUrl} />
      </SettingSection>

      <SettingSection title="Engine">
        <SettingRow
          label="Engine Token"
          value={engineTokenSet ? '[configured]' : '[not set]'}
          status={engineTokenSet ? 'ok' : 'warn'}
        />
      </SettingSection>

      <SettingSection title="Supabase">
        <SettingRow
          label="Supabase URL"
          value={supabaseUrlSet ? '[configured]' : '[not set]'}
          status={supabaseUrlSet ? 'ok' : 'missing'}
        />
        <SettingRow
          label="Service Role Key"
          value={supabaseKeySet ? '[configured]' : '[not set]'}
          status={supabaseKeySet ? 'ok' : 'missing'}
        />
      </SettingSection>

      <SettingSection title="Scheduler">
        <SettingRow
          label="Enabled"
          value={schedulerEnabled ? 'true' : 'false'}
          status={schedulerEnabled ? 'ok' : 'warn'}
        />
        <SettingRow label="Digest Cron" value={digestCron} />
        <SettingRow label="Timezone" value={timezone} />
      </SettingSection>

      <SettingSection title="Discord">
        <SettingRow
          label="Mode"
          value={discordMode}
          status={discordMode !== 'disabled' ? 'ok' : 'warn'}
        />
      </SettingSection>

      <SettingSection title="Integrations">
        <SettingRow
          label="Vercel"
          value={vercelSet ? 'connected' : 'not configured'}
          status={vercelSet ? 'ok' : 'missing'}
        />
        <SettingRow
          label="GitHub"
          value={githubSet ? 'connected' : 'not configured'}
          status={githubSet ? 'ok' : 'missing'}
        />
        <SettingRow
          label="Stripe"
          value={stripeSet ? 'connected' : 'not configured'}
          status={stripeSet ? 'ok' : 'missing'}
        />
        <SettingRow
          label="Sentry"
          value={sentrySet ? 'connected' : 'not configured'}
          status={sentrySet ? 'ok' : 'missing'}
        />
      </SettingSection>

      <SettingSection title="Privacy & AI">
        <SettingRow
          label="Incident Brief (External AI)"
          value={anthropicKeySet ? 'enabled' : 'disabled (local only)'}
          status={anthropicKeySet ? 'warn' : 'ok'}
        />
        {anthropicKeySet && (
          <div className="mt-2 font-mono text-xs text-text-muted">
            Alert metadata (type, severity, service, count) is sent to
            Anthropic API. Titles and messages are redacted.
          </div>
        )}
      </SettingSection>

      <SettingSection title="Security">
        <SettingRow
          label="Engine Auth"
          value={engineTokenSet ? 'token required' : 'open (dev only)'}
          status={engineTokenSet ? 'ok' : 'warn'}
        />
      </SettingSection>

      <div className="mt-6 flex gap-3">
        <Link
          href="/diagnostics"
          className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-border-default text-text-secondary rounded hover:border-accent hover:text-accent transition-colors"
        >
          Open Diagnostics →
        </Link>
      </div>

      <div className="mt-4 font-mono text-xs text-text-muted">
        To change settings, edit .env.local and restart the engine.
      </div>
    </div>
  )
}
