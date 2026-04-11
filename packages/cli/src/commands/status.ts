import chalk from 'chalk'
import { fetchEngine } from '../lib/client.js'
import type { ServiceStatus } from '@bionic/shared'

export async function statusCommand(): Promise<void> {
  try {
    const status = await fetchEngine<ServiceStatus>('/api/status')

    const engineColor = status.engine.status === 'running'
      ? chalk.green
      : status.engine.status === 'degraded'
      ? chalk.yellow
      : chalk.red

    console.log('')
    console.log(chalk.bold.hex('#E8611A')('BIONIC ENGINE'))
    console.log(chalk.gray('\u2500'.repeat(40)))
    console.log(`Status      ${engineColor(status.engine.status.toUpperCase())}`)
    console.log(`Version     ${chalk.white(status.engine.version ?? '\u2014')}`)
    console.log('')
    console.log(chalk.gray('Queue'))
    console.log(`  Pending Jobs      ${chalk.white(String(status.queue.pendingJobs))}`)
    console.log(`  Running Jobs      ${chalk.white(String(status.queue.runningJobs))}`)
    console.log(`  Pending Approvals ${status.queue.pendingActions > 0
      ? chalk.hex('#E8611A').bold(String(status.queue.pendingActions))
      : chalk.white(String(status.queue.pendingActions))
    }`)
    console.log('')
    console.log(chalk.gray('Alerts'))
    console.log(`  Open     ${chalk.white(String(status.alerts.open))}`)
    console.log(`  Critical ${status.alerts.critical > 0
      ? chalk.red.bold(String(status.alerts.critical))
      : chalk.white(String(status.alerts.critical))
    }`)
    console.log('')
  } catch {
    console.error(chalk.red('\u2717 Engine is offline. Start with: pnpm --filter @bionic/engine dev'))
    process.exit(1)
  }
}
