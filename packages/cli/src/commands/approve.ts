import chalk from 'chalk'
import { fetchEngine } from '../lib/client.js'

export async function approveCommand(actionId: string): Promise<void> {
  try {
    await fetchEngine(`/api/actions/${actionId}/approve`, { method: 'POST' })
    console.log(chalk.green(`\u2713 Approved: ${actionId}`))
  } catch (err) {
    console.error(chalk.red(`\u2717 Failed to approve: ${err instanceof Error ? err.message : String(err)}`))
    process.exit(1)
  }
}

export async function denyCommand(actionId: string): Promise<void> {
  try {
    await fetchEngine(`/api/actions/${actionId}/deny`, { method: 'POST' })
    console.log(chalk.yellow(`\u2713 Denied: ${actionId}`))
  } catch (err) {
    console.error(chalk.red(`\u2717 Failed to deny: ${err instanceof Error ? err.message : String(err)}`))
    process.exit(1)
  }
}
