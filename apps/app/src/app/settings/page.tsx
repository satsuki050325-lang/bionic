import { cookies } from 'next/headers'
import Link from 'next/link'
import { LanguageSwitcher } from './LanguageSwitcher'
import { getDiagnostics } from '@/lib/engine'

type RowStatus = 'ok' | 'warn' | 'missing'

const en = {
  title: 'Settings',
  subtitle: 'Configuration · Read-only · Edit via .env.local',
  preferences: 'Preferences',
  preferencesDesc: 'Display and interface preferences',
  language: 'Language',
  project: 'Project',
  projectDesc: 'Bionic project and engine connection',
  projectId: 'Project ID',
  engineUrl: 'Engine URL',
  engine: 'Engine',
  engineDesc: 'Engine authentication',
  engineToken: 'Engine Token',
  supabase: 'Supabase',
  supabaseDesc: 'Database connection',
  supabaseUrl: 'Supabase URL',
  serviceRoleKey: 'Service Role Key',
  scheduler: 'Scheduler',
  schedulerDesc: 'Automated job scheduling',
  schedulerEnabled: 'Enabled',
  digestCron: 'Digest Cron',
  timezone: 'Timezone',
  discord: 'Discord',
  discordDesc: 'Notification channel',
  mode: 'Mode',
  integrations: 'Integrations',
  integrationsDesc: 'Connected external services',
  privacyAi: 'Privacy & AI',
  privacyAiDesc: 'External AI and data handling',
  incidentBrief: 'Incident Brief (External AI)',
  incidentBriefEnabled: 'enabled',
  incidentBriefDisabled: 'disabled (local only)',
  incidentBriefNotice:
    'Alert metadata (type, severity, service, count) is sent to Anthropic API. Titles and messages are redacted.',
  security: 'Security',
  securityDesc: 'Authentication and access',
  engineAuth: 'Engine Auth',
  engineAuthTokenRequired: 'token required',
  engineAuthOpen: 'open (dev only)',
  advanced: 'Advanced',
  advancedDesc: 'Deployment watch and quiet hours',
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
  systemCheck: 'System Check →',
  editHint: 'To change settings, edit .env.local and restart the engine.',
  engineOffline:
    'Engine is offline. Start the engine to load configuration from .env.local.',
}

type Labels = typeof en

const ja: Labels = {
  ...en,
  title: '設定',
  subtitle: '設定の確認 · 読み取り専用 · 変更は .env.local で行う',
  preferences: '表示設定',
  preferencesDesc: '表示・インターフェイスの設定',
  language: '言語',
  project: 'プロジェクト',
  projectDesc: 'Bionic プロジェクトとエンジン接続',
  projectId: 'プロジェクト ID',
  engineUrl: 'エンジン URL',
  engine: 'エンジン',
  engineDesc: 'エンジン認証',
  engineToken: 'エンジントークン',
  supabase: 'Supabase',
  supabaseDesc: 'データベース接続',
  supabaseUrl: 'Supabase URL',
  serviceRoleKey: 'サービスロールキー',
  scheduler: 'スケジューラー',
  schedulerDesc: '自動ジョブのスケジュール',
  schedulerEnabled: '有効化',
  digestCron: 'ダイジェスト Cron',
  timezone: 'タイムゾーン',
  discord: 'Discord',
  discordDesc: '通知チャンネル',
  mode: 'モード',
  integrations: '連携サービス',
  integrationsDesc: '接続中の外部サービス',
  privacyAi: 'プライバシーと AI',
  privacyAiDesc: '外部 AI とデータの扱い',
  incidentBrief: 'インシデント要約 (外部 AI)',
  incidentBriefEnabled: '有効',
  incidentBriefDisabled: '無効（ローカルのみ）',
  incidentBriefNotice:
    'アラートのメタデータ（type / severity / service / count）は Anthropic API に送信されます。タイトルとメッセージは送信しません。',
  security: 'セキュリティ',
  securityDesc: '認証とアクセス',
  engineAuth: 'エンジン認証',
  engineAuthTokenRequired: 'トークン必須',
  engineAuthOpen: 'オープン（開発用）',
  advanced: '詳細設定',
  advancedDesc: 'デプロイ監視と Quiet Hours',
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
  openDiagnostics: '診断を開く →',
  systemCheck: 'セットアップ確認 →',
  editHint:
    '設定を変更するには .env.local を編集してエンジンを再起動してください。',
  engineOffline:
    'エンジンがオフラインです。エンジンを起動すると .env.local の設定を表示できます。',
}

const es: Labels = {
  ...en,
  title: 'Configuración',
  subtitle: 'Solo lectura · Editar en .env.local',
  preferences: 'Preferencias',
  preferencesDesc: 'Preferencias de interfaz y visualización',
  language: 'Idioma',
  project: 'Proyecto',
  projectDesc: 'Conexión del proyecto y motor Bionic',
  projectId: 'ID de proyecto',
  engineUrl: 'URL del motor',
  engine: 'Motor',
  engineDesc: 'Autenticación del motor',
  engineToken: 'Token del motor',
  supabase: 'Supabase',
  supabaseDesc: 'Conexión a la base de datos',
  scheduler: 'Planificador',
  schedulerDesc: 'Programación automática de tareas',
  schedulerEnabled: 'Activado',
  digestCron: 'Cron del resumen',
  timezone: 'Zona horaria',
  discord: 'Discord',
  discordDesc: 'Canal de notificaciones',
  mode: 'Modo',
  integrations: 'Integraciones',
  integrationsDesc: 'Servicios externos conectados',
  privacyAi: 'Privacidad e IA',
  privacyAiDesc: 'IA externa y manejo de datos',
  security: 'Seguridad',
  securityDesc: 'Autenticación y acceso',
  advanced: 'Avanzado',
  advancedDesc: 'Monitoreo de despliegue y horas silenciosas',
  configured: '[configurado]',
  notSet: '[no configurado]',
  connected: 'conectado',
  notConfigured: 'no configurado',
  openDiagnostics: 'Abrir diagnóstico →',
  systemCheck: 'Comprobación del sistema →',
  editHint:
    'Para cambiar la configuración, edita .env.local y reinicia el motor.',
  engineOffline:
    'El motor está desconectado. Inícialo para cargar la configuración desde .env.local.',
}

const zh: Labels = {
  ...en,
  title: '设置',
  subtitle: '只读 · 通过 .env.local 编辑',
  preferences: '偏好设置',
  preferencesDesc: '显示与界面偏好',
  language: '语言',
  project: '项目',
  projectDesc: 'Bionic 项目与引擎连接',
  projectId: '项目 ID',
  engineUrl: '引擎 URL',
  engine: '引擎',
  engineDesc: '引擎身份验证',
  engineToken: '引擎令牌',
  supabase: '数据库',
  supabaseDesc: '数据库连接',
  scheduler: '调度器',
  schedulerDesc: '自动任务调度',
  schedulerEnabled: '已启用',
  digestCron: '摘要 Cron',
  timezone: '时区',
  discord: 'Discord',
  discordDesc: '通知频道',
  mode: '模式',
  integrations: '集成',
  integrationsDesc: '已连接的外部服务',
  privacyAi: '隐私与 AI',
  privacyAiDesc: '外部 AI 与数据处理',
  security: '安全',
  securityDesc: '身份验证与访问',
  advanced: '高级设置',
  advancedDesc: '部署监控与静默时段',
  configured: '[已配置]',
  notSet: '[未设置]',
  connected: '已连接',
  notConfigured: '未配置',
  openDiagnostics: '打开诊断 →',
  systemCheck: '系统检查 →',
  editHint: '要更改设置，请编辑 .env.local 并重启引擎。',
  engineOffline: '引擎已离线。启动引擎以加载 .env.local 的配置。',
}

const t = { en, ja, es, zh } as const
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
    <div className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0 gap-4">
      <span className="font-mono text-xs text-text-muted uppercase tracking-wide shrink-0">
        {label}
      </span>
      <span
        className={`font-mono text-sm font-medium text-right break-all ${valueColor}`}
      >
        {value}
      </span>
    </div>
  )
}

function SettingSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded p-5 mb-4">
      <div className="mb-4">
        <div className="font-heading text-sm font-bold text-text-primary uppercase tracking-wide">
          {title}
        </div>
        {description && (
          <div className="font-mono text-xs text-text-muted mt-0.5">
            {description}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const rawLocale = cookieStore.get('bionic-locale')?.value ?? 'en'
  const locale: Locale = (rawLocale in t ? rawLocale : 'en') as Locale
  const labels = t[locale]

  const engineUrl =
    process.env.NEXT_PUBLIC_ENGINE_URL ?? 'http://localhost:3001'
  const diag = await getDiagnostics()
  const cfg = diag?.config ?? null

  const projectId = cfg?.projectId ?? 'project_bionic'
  const engineTokenSet = cfg?.engine.token === '[set]'
  const supabaseUrlSet = cfg?.supabase.url === '[set]'
  const supabaseKeySet = cfg?.supabase.serviceRoleKey === '[set]'
  const schedulerEnabled = cfg?.scheduler.enabled ?? false
  const digestCron = cfg?.scheduler.digestCron ?? '0 9 * * 1'
  const timezone = cfg?.scheduler.digestTimezone ?? 'Asia/Tokyo'
  const discordMode = cfg?.discord.mode ?? 'disabled'
  const anthropicKeySet = cfg?.anthropic.enabled ?? false
  const vercelSet = cfg?.vercel.webhookSecret === '[set]'
  const githubSet = cfg?.github.webhookSecret === '[set]'
  const stripeSet = cfg?.stripe.webhookSecret === '[set]'
  const sentrySet = cfg?.sentry.webhookSecret === '[set]'

  const deploymentWatchMinutes = String(cfg?.deploymentWatch.watchMinutes ?? 30)
  const deploymentThresholdErrorCount = String(
    cfg?.deploymentWatch.thresholdErrorCount ?? 5
  )
  const deploymentThresholdIncreasePercent = String(
    cfg?.deploymentWatch.thresholdIncreasePercent ?? 200
  )
  const formatHour = (h: number | undefined) =>
    typeof h === 'number'
      ? `${String(h).padStart(2, '0')}:00`
      : labels.notSetParens
  const quietHoursStart = formatHour(cfg?.notification.quietHoursStart)
  const quietHoursEnd = formatHour(cfg?.notification.quietHoursEnd)

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary uppercase tracking-wide">
          {labels.title}
        </h1>
        <p className="font-mono text-xs text-text-muted mt-1">
          {labels.subtitle}
        </p>
      </div>

      {!diag && (
        <div className="mb-4 rounded border border-status-warning/40 bg-status-warning/5 px-4 py-3 font-mono text-xs text-status-warning">
          {labels.engineOffline}
        </div>
      )}

      <SettingSection
        title={labels.preferences}
        description={labels.preferencesDesc}
      >
        <div className="flex items-center justify-between py-2">
          <span className="font-mono text-xs text-text-muted uppercase tracking-wide">
            {labels.language}
          </span>
          <LanguageSwitcher currentLocale={locale} />
        </div>
      </SettingSection>

      <SettingSection title={labels.project} description={labels.projectDesc}>
        <SettingRow label={labels.projectId} value={projectId} status="ok" />
        <SettingRow label={labels.engineUrl} value={engineUrl} />
      </SettingSection>

      <SettingSection title={labels.engine} description={labels.engineDesc}>
        <SettingRow
          label={labels.engineToken}
          value={engineTokenSet ? labels.configured : labels.notSet}
          status={engineTokenSet ? 'ok' : 'warn'}
        />
      </SettingSection>

      <SettingSection title={labels.supabase} description={labels.supabaseDesc}>
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

      <SettingSection
        title={labels.scheduler}
        description={labels.schedulerDesc}
      >
        <SettingRow
          label={labels.schedulerEnabled}
          value={schedulerEnabled ? labels.trueLabel : labels.falseLabel}
          status={schedulerEnabled ? 'ok' : 'warn'}
        />
        <SettingRow label={labels.digestCron} value={digestCron} />
        <SettingRow label={labels.timezone} value={timezone} />
      </SettingSection>

      <SettingSection title={labels.discord} description={labels.discordDesc}>
        <SettingRow
          label={labels.mode}
          value={discordMode}
          status={discordMode !== 'disabled' ? 'ok' : 'warn'}
        />
      </SettingSection>

      <SettingSection
        title={labels.integrations}
        description={labels.integrationsDesc}
      >
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

      <SettingSection
        title={labels.privacyAi}
        description={labels.privacyAiDesc}
      >
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

      <SettingSection title={labels.security} description={labels.securityDesc}>
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

      <SettingSection title={labels.advanced} description={labels.advancedDesc}>
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

      <div className="mt-6 flex gap-3 flex-wrap">
        <Link
          href="/diagnostics"
          className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-border-default text-text-secondary rounded hover:border-accent hover:text-accent transition-colors"
        >
          {labels.openDiagnostics}
        </Link>
        <Link
          href="/onboarding"
          className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-border-default text-text-secondary rounded hover:border-accent hover:text-accent transition-colors"
        >
          {labels.systemCheck}
        </Link>
      </div>

      <div className="mt-4 font-mono text-xs text-text-muted">
        {labels.editHint}
      </div>
    </div>
  )
}
