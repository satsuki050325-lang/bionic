import { cookies } from 'next/headers'
import Link from 'next/link'
import { LanguageSwitcher } from './LanguageSwitcher'

type RowStatus = 'ok' | 'warn' | 'missing'

const t = {
  en: {
    title: 'Settings',
    subtitle: 'Configuration · Read-only · Edit via .env.local',
    preferences: 'Preferences',
    language: 'Language',
    project: 'Project',
    projectId: 'Project ID',
    engineUrl: 'Engine URL',
    engine: 'Engine',
    engineToken: 'Engine Token',
    supabase: 'Supabase',
    supabaseUrl: 'Supabase URL',
    serviceRoleKey: 'Service Role Key',
    scheduler: 'Scheduler',
    schedulerEnabled: 'Enabled',
    digestCron: 'Digest Cron',
    timezone: 'Timezone',
    discord: 'Discord',
    mode: 'Mode',
    integrations: 'Integrations',
    privacyAi: 'Privacy & AI',
    incidentBrief: 'Incident Brief (External AI)',
    incidentBriefEnabled: 'enabled',
    incidentBriefDisabled: 'disabled (local only)',
    incidentBriefNotice:
      'Alert metadata (type, severity, service, count) is sent to Anthropic API. Titles and messages are redacted.',
    security: 'Security',
    engineAuth: 'Engine Auth',
    engineAuthTokenRequired: 'token required',
    engineAuthOpen: 'open (dev only)',
    advanced: 'Advanced',
    deploymentWatchWindow: 'Deployment Watch Window',
    errorCountThreshold: 'Error Count Threshold',
    errorIncreaseThreshold: 'Error Increase Threshold',
    quietHoursStart: 'Quiet Hours Start',
    quietHoursEnd: 'Quiet Hours End',
    minutesSuffix: 'minutes',
    notSetParens: '(not set)',
    configured: '[configured]',
    notSet: '[not set]',
    connected: 'connected',
    notConfigured: 'not configured',
    trueLabel: 'true',
    falseLabel: 'false',
    openDiagnostics: 'Open Diagnostics →',
    editHint:
      'To change settings, edit .env.local and restart the engine.',
  },
  ja: {
    title: '設定',
    subtitle: '設定の確認 · 読み取り専用 · 変更は .env.local で行う',
    preferences: '表示設定',
    language: '言語',
    project: 'プロジェクト',
    projectId: 'プロジェクト ID',
    engineUrl: 'エンジン URL',
    engine: 'エンジン',
    engineToken: 'エンジントークン',
    supabase: 'Supabase',
    supabaseUrl: 'Supabase URL',
    serviceRoleKey: 'サービスロールキー',
    scheduler: 'スケジューラー',
    schedulerEnabled: '有効化',
    digestCron: 'ダイジェスト Cron',
    timezone: 'タイムゾーン',
    discord: 'Discord',
    mode: 'モード',
    integrations: '連携サービス',
    privacyAi: 'プライバシーと AI',
    incidentBrief: 'インシデント要約 (外部 AI)',
    incidentBriefEnabled: '有効',
    incidentBriefDisabled: '無効（ローカルのみ）',
    incidentBriefNotice:
      'アラートのメタデータ（type / severity / service / count）は Anthropic API に送信されます。タイトルとメッセージは送信しません。',
    security: 'セキュリティ',
    engineAuth: 'エンジン認証',
    engineAuthTokenRequired: 'トークン必須',
    engineAuthOpen: 'オープン（開発用）',
    advanced: '詳細設定',
    deploymentWatchWindow: 'デプロイ監視ウィンドウ',
    errorCountThreshold: 'エラー件数しきい値',
    errorIncreaseThreshold: 'エラー増加率しきい値',
    quietHoursStart: 'Quiet Hours 開始',
    quietHoursEnd: 'Quiet Hours 終了',
    minutesSuffix: '分',
    notSetParens: '(未設定)',
    configured: '[設定済み]',
    notSet: '[未設定]',
    connected: '接続済み',
    notConfigured: '未設定',
    trueLabel: 'true',
    falseLabel: 'false',
    openDiagnostics: '診断を開く →',
    editHint:
      '設定を変更するには .env.local を編集してエンジンを再起動してください。',
  },
} as const

type Locale = keyof typeof t

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
      <span className={`font-mono text-xs text-right break-all ${valueColor}`}>
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
  const rawLocale = cookieStore.get('bionic-locale')?.value ?? 'en'
  const locale: Locale = rawLocale === 'ja' ? 'ja' : 'en'
  const labels = t[locale]

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

  const deploymentWatchMinutes =
    process.env.BIONIC_DEPLOYMENT_WATCH_MINUTES ?? '30'
  const deploymentThresholdErrorCount =
    process.env.BIONIC_DEPLOYMENT_THRESHOLD_ERROR_COUNT ?? '5'
  const deploymentThresholdIncreasePercent =
    process.env.BIONIC_DEPLOYMENT_THRESHOLD_INCREASE_PERCENT ?? '200'
  const quietHoursStart =
    process.env.BIONIC_QUIET_HOURS_START ?? labels.notSetParens
  const quietHoursEnd =
    process.env.BIONIC_QUIET_HOURS_END ?? labels.notSetParens

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary uppercase tracking-wide">
          {labels.title}
        </h1>
        <p className="font-mono text-xs text-text-muted mt-1">
          {labels.subtitle}
        </p>
      </div>

      <SettingSection title={labels.preferences}>
        <div className="flex items-center justify-between py-2">
          <span className="font-mono text-xs text-text-secondary uppercase tracking-wide">
            {labels.language}
          </span>
          <LanguageSwitcher currentLocale={locale} />
        </div>
      </SettingSection>

      <SettingSection title={labels.project}>
        <SettingRow label={labels.projectId} value={projectId} status="ok" />
        <SettingRow label={labels.engineUrl} value={engineUrl} />
      </SettingSection>

      <SettingSection title={labels.engine}>
        <SettingRow
          label={labels.engineToken}
          value={engineTokenSet ? labels.configured : labels.notSet}
          status={engineTokenSet ? 'ok' : 'warn'}
        />
      </SettingSection>

      <SettingSection title={labels.supabase}>
        <SettingRow
          label={labels.supabaseUrl}
          value={supabaseUrlSet ? labels.configured : labels.notSet}
          status={supabaseUrlSet ? 'ok' : 'missing'}
        />
        <SettingRow
          label={labels.serviceRoleKey}
          value={supabaseKeySet ? labels.configured : labels.notSet}
          status={supabaseKeySet ? 'ok' : 'missing'}
        />
      </SettingSection>

      <SettingSection title={labels.scheduler}>
        <SettingRow
          label={labels.schedulerEnabled}
          value={schedulerEnabled ? labels.trueLabel : labels.falseLabel}
          status={schedulerEnabled ? 'ok' : 'warn'}
        />
        <SettingRow label={labels.digestCron} value={digestCron} />
        <SettingRow label={labels.timezone} value={timezone} />
      </SettingSection>

      <SettingSection title={labels.discord}>
        <SettingRow
          label={labels.mode}
          value={discordMode}
          status={discordMode !== 'disabled' ? 'ok' : 'warn'}
        />
      </SettingSection>

      <SettingSection title={labels.integrations}>
        <SettingRow
          label="Vercel"
          value={vercelSet ? labels.connected : labels.notConfigured}
          status={vercelSet ? 'ok' : 'missing'}
        />
        <SettingRow
          label="GitHub"
          value={githubSet ? labels.connected : labels.notConfigured}
          status={githubSet ? 'ok' : 'missing'}
        />
        <SettingRow
          label="Stripe"
          value={stripeSet ? labels.connected : labels.notConfigured}
          status={stripeSet ? 'ok' : 'missing'}
        />
        <SettingRow
          label="Sentry"
          value={sentrySet ? labels.connected : labels.notConfigured}
          status={sentrySet ? 'ok' : 'missing'}
        />
      </SettingSection>

      <SettingSection title={labels.privacyAi}>
        <SettingRow
          label={labels.incidentBrief}
          value={
            anthropicKeySet
              ? labels.incidentBriefEnabled
              : labels.incidentBriefDisabled
          }
          status={anthropicKeySet ? 'warn' : 'ok'}
        />
        {anthropicKeySet && (
          <div className="mt-2 font-mono text-xs text-text-muted">
            {labels.incidentBriefNotice}
          </div>
        )}
      </SettingSection>

      <SettingSection title={labels.security}>
        <SettingRow
          label={labels.engineAuth}
          value={
            engineTokenSet
              ? labels.engineAuthTokenRequired
              : labels.engineAuthOpen
          }
          status={engineTokenSet ? 'ok' : 'warn'}
        />
      </SettingSection>

      <SettingSection title={labels.advanced}>
        <SettingRow
          label={labels.deploymentWatchWindow}
          value={`${deploymentWatchMinutes} ${labels.minutesSuffix}`}
        />
        <SettingRow
          label={labels.errorCountThreshold}
          value={deploymentThresholdErrorCount}
        />
        <SettingRow
          label={labels.errorIncreaseThreshold}
          value={`${deploymentThresholdIncreasePercent}%`}
        />
        <SettingRow
          label={labels.quietHoursStart}
          value={quietHoursStart}
          status={quietHoursStart === labels.notSetParens ? 'missing' : 'ok'}
        />
        <SettingRow
          label={labels.quietHoursEnd}
          value={quietHoursEnd}
          status={quietHoursEnd === labels.notSetParens ? 'missing' : 'ok'}
        />
      </SettingSection>

      <div className="mt-6 flex gap-3">
        <Link
          href="/diagnostics"
          className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-border-default text-text-secondary rounded hover:border-accent hover:text-accent transition-colors"
        >
          {labels.openDiagnostics}
        </Link>
      </div>

      <div className="mt-4 font-mono text-xs text-text-muted">
        {labels.editHint}
      </div>
    </div>
  )
}
