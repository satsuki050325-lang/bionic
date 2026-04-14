import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bionic',
  description: 'Bionic Engine Dashboard',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const locale = cookieStore.get('bionic-locale')?.value === 'ja' ? 'ja' : 'en'

  const navLabels = {
    en: {
      dashboard: 'Dashboard',
      services: 'Services',
      onboarding: 'Onboarding',
      alerts: 'Alerts',
      actions: 'Actions',
      research: 'Research',
      diagnostics: 'Diagnostics',
      settings: 'Settings',
    },
    ja: {
      dashboard: 'ダッシュボード',
      services: 'サービス',
      onboarding: 'セットアップ',
      alerts: 'アラート',
      actions: '操作ログ',
      research: 'リサーチ',
      diagnostics: '診断',
      settings: '設定',
    },
  } as const
  const labels = navLabels[locale]

  return (
    <html lang={locale} className="dark">
      <body className="min-h-screen bg-bg-base text-text-primary">
        <nav className="border-b border-border-subtle bg-bg-surface">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-accent font-mono text-lg leading-none">◈</span>
              <span className="font-heading font-bold text-accent tracking-widest uppercase">
                BIONIC
              </span>
              <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
                ENGINE
              </span>
            </a>
            <div className="flex items-center gap-6 font-mono text-sm">
              <a href="/" className="text-text-secondary hover:text-accent transition-colors">
                {labels.dashboard}
              </a>
              <a href="/services" className="text-text-secondary hover:text-accent transition-colors">
                {labels.services}
              </a>
              <a href="/onboarding" className="text-text-secondary hover:text-accent transition-colors">
                {labels.onboarding}
              </a>
              <a href="/alerts" className="text-text-secondary hover:text-accent transition-colors">
                {labels.alerts}
              </a>
              <a href="/actions" className="text-text-secondary hover:text-accent transition-colors">
                {labels.actions}
              </a>
              <a href="/research" className="text-text-secondary hover:text-accent transition-colors">
                {labels.research}
              </a>
              <a href="/diagnostics" className="text-text-secondary hover:text-accent transition-colors">
                {labels.diagnostics}
              </a>
              <a href="/settings" className="text-text-secondary hover:text-accent transition-colors">
                {labels.settings}
              </a>
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
