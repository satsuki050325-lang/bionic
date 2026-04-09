import { getAlerts } from '@/lib/engine'

export default async function AlertsPage() {
  const result = await getAlerts()

  if (!result) {
    return (
      <div>
        <h1>Alerts</h1>
        <p>Engineが起動していません。<code>pnpm --filter @bionic/engine dev</code> で起動してください。</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Alerts</h1>
      {result.alerts.length === 0 ? (
        <p>アラートはありません。</p>
      ) : (
        <ul>
          {result.alerts.map((alert) => (
            <li key={alert.id}>
              <strong>[{alert.severity}]</strong> {alert.title} — {alert.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
