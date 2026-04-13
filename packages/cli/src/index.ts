#!/usr/bin/env node
import { program } from 'commander'
import { statusCommand } from './commands/status.js'
import { approvalsCommand } from './commands/approvals.js'
import { approveCommand, denyCommand } from './commands/approve.js'
import { initCommand } from './commands/init.js'
import { doctorCommand } from './commands/doctor.js'

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
