import { getStatus } from '@/lib/engine'

export default async function DashboardPage() {
  const status = await getStatus()

  if (!status) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p>Engineが起動していません。<code>pnpm --filter @bionic/engine dev</code> で起動してください。</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <section>
        <h2>Engine</h2>
        <p>Status: {status.engine.status}</p>
        <p>Version: {status.engine.version}</p>
        <p>Started: {status.engine.startedAt}</p>
        <p>Last Event: {status.lastEventAt ?? 'なし'}</p>
      </section>
      <section>
        <h2>Queue</h2>
        <p>Pending: {status.queue.pendingJobs}</p>
        <p>Running: {status.queue.runningJobs}</p>
        <p>Needs Review: {status.queue.needsReviewJobs}</p>
        <p>Pending Actions: {status.queue.pendingActions}</p>
      </section>
      <section>
        <h2>Alerts</h2>
        <p>Open: {status.alerts.open}</p>
        <p>Critical: {status.alerts.critical}</p>
      </section>
    </div>
  )
}
