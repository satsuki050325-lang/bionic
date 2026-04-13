#!/usr/bin/env node
import { program } from 'commander'
import { statusCommand } from './commands/status.js'
import { approvalsCommand } from './commands/approvals.js'
import { approveCommand, denyCommand } from './commands/approve.js'
import { initCommand } from './commands/init.js'
import { doctorCommand } from './commands/doctor.js'
import { demoCommand } from './commands/demo.js'

program
  .name('bionic')
  .description('Bionic Engine CLI')
  .version('0.0.1')

program
  .command('init')
  .description('Create .env.local for Bionic')
  .option('--force', 'Overwrite existing .env.local without confirmation')
  .action((options: { force?: boolean }) => initCommand(options))

program
  .command('doctor')
  .description('Diagnose Bionic local setup')
  .option('--engine-url <url>', 'Override Bionic Engine URL')
  .action((options: { engineUrl?: string }) => doctorCommand(options))

program
  .command('demo')
  .description('Simulate a production incident to explore Bionic')
  .option('--fast', 'Send all events without delay')
  .option('--cleanup', 'Remove demo data from the database')
  .option('--service <id>', 'Service ID for demo events (default: demo-api)')
  .option('--engine-url <url>', 'Override Bionic Engine URL')
  .action(
    (options: {
      fast?: boolean
      cleanup?: boolean
      service?: string
      engineUrl?: string
    }) =>
      demoCommand({
        fast: options.fast,
        cleanup: options.cleanup,
        serviceId: options.service,
        engineUrl: options.engineUrl,
      })
  )

program
  .command('status')
  .description('Show engine status')
  .action(statusCommand)

program
  .command('approvals')
  .description('List pending approvals')
  .action(approvalsCommand)

program
  .command('approve <id>')
  .description('Approve a pending action')
  .action(approveCommand)

program
  .command('deny <id>')
  .description('Deny a pending action')
  .action(denyCommand)

program.parse()
