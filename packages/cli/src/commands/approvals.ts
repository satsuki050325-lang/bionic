import chalk from 'chalk'
import { fetchEngine } from '../lib/client.js'
import type { ListActionsResult } from '@bionic/shared'

export async function approvalsCommand(): Promise<void> {
  try {
    const result = await fetchEngine<ListActionsResult>(
      '/api/actions?status=pending_approval&limit=20'
    )

    console.log('')
    console.log(chalk.bold.hex('#E8611A')('PENDING APPROVALS'))
    console.log(chalk.gray('\u2500'.repeat(40)))

    if (result.actions.length === 0) {
      console.log(chalk.green('\u2713 No pending approvals'))
      console.log('')
      return
    }

    result.actions.forEach((action, i) => {
      console.log(`${chalk.gray(`[${i + 1}]`)} ${chalk.hex('#E8611A')(action.id.slice(0, 8))}`)
      console.log(`    Type    ${chalk.white(action.type)}`)
      console.log(`    Title   ${chalk.white(action.title)}`)
      if (action.reason) {
        console.log(`    Reason  ${chalk.gray(action.reason)}`)
      }
      console.log(`    Created ${chalk.gray(new Date(action.createdAt).toLocaleString('ja-JP'))}`)
      console.log('')
    })

    console.log(chalk.gray('Run: bionic approve <id> or bionic deny <id>'))
    console.log('')
  } catch {
    console.error(chalk.red('\u2717 Engine is offline'))
    process.exit(1)
  }
}
