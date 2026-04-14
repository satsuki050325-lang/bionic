import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import {
  LayoutDashboard,
  Layers,
  TriangleAlert,
  ScrollText,
  Activity,
  Settings,
  type LucideIcon,
} from 'lucide-react'
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
  const navLabels = {
    en: {
      dashboard: 'Dashboard',
      services: 'Services',
      alerts: 'Alerts',
      actions: 'Actions',
      diagnostics: 'Diagnostics',
      settings: 'Settings',
    },
    ja: {
      dashboard: 'ダッシュボード',
      services: 'サービス',
      alerts: 'アラート',
      actions: '操作ログ',
      diagnostics: '診断',
      settings: '設定',
    },
    es: {
      dashboard: 'Panel',
      services: 'Servicios',
      alerts: 'Alertas',
      actions: 'Acciones',
      diagnostics: 'Diagnóstico',
      settings: 'Configuración',
    },
    zh: {
      dashboard: '仪表板',
      services: '服务',
      alerts: '告警',
      actions: '操作日志',
      diagnostics: '诊断',
      settings: '设置',
    },
  } as const

  type NavLocale = keyof typeof navLabels

  const cookieStore = await cookies()
  const rawLocale = cookieStore.get('bionic-locale')?.value ?? 'en'
  const locale: NavLocale = (
    rawLocale in navLabels ? rawLocale : 'en'
  ) as NavLocale
  const labels = navLabels[locale]

  const navItems: { href: string; label: string; icon: LucideIcon }[] = [
    { href: '/', label: labels.dashboard, icon: LayoutDashboard },
    { href: '/services', label: labels.services, icon: Layers },
    { href: '/alerts', label: labels.alerts, icon: TriangleAlert },
    { href: '/actions', label: labels.actions, icon: ScrollText },
    { href: '/diagnostics', label: labels.diagnostics, icon: Activity },
    { href: '/settings', label: labels.settings, icon: Settings },
  ]

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
            <div className="flex items-center gap-5">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 font-mono text-xs text-text-secondary hover:text-accent transition-colors"
                >
                  <item.icon
                    size={14}
                    strokeWidth={1.75}
                    className="text-text-muted"
                  />
                  {item.label}
                </a>
              ))}
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
