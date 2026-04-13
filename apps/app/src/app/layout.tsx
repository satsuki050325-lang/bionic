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

  return (
    <html lang={locale} className="dark">
      <body className="min-h-screen bg-bg-base text-text-primary">
        <nav className="border-b border-border-subtle bg-bg-surface">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-accent font-heading font-bold text-lg tracking-wider">
                BIONIC
              </span>
              <span className="text-text-muted font-mono text-xs">ENGINE</span>
            </div>
            <div className="flex items-center gap-6 font-mono text-sm">
              <a href="/" className="text-text-secondary hover:text-accent transition-colors">
                DASHBOARD
              </a>
              <a href="/onboarding" className="text-text-secondary hover:text-accent transition-colors">
                ONBOARDING
              </a>
              <a href="/alerts" className="text-text-secondary hover:text-accent transition-colors">
                ALERTS
              </a>
              <a href="/actions" className="text-text-secondary hover:text-accent transition-colors">
                ACTIONS
              </a>
              <a href="/research" className="text-text-secondary hover:text-accent transition-colors">
                RESEARCH
              </a>
              <a href="/diagnostics" className="text-text-secondary hover:text-accent transition-colors">
                DIAGNOSTICS
              </a>
              <a href="/settings" className="text-text-secondary hover:text-accent transition-colors">
                SETTINGS
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
