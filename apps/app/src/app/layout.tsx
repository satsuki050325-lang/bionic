import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bionic',
  description: 'Bionic Engine Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <nav style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', gap: '24px' }}>
          <a href="/">Dashboard</a>
          <a href="/alerts">Alerts</a>
          <a href="/research">Research</a>
        </nav>
        <main style={{ padding: '24px' }}>{children}</main>
      </body>
    </html>
  )
}
