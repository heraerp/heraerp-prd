#!/usr/bin/env node
import { Command } from 'commander'
import { registerInit } from './commands/init'
import { registerSmartCode } from './commands/smart-code'
import { registerTx } from './commands/tx'

const program = new Command()
program
  .name('hera')
  .description('HERA CLI')
  .version('1.0.0')

registerInit(program)
registerSmartCode(program)
registerTx(program)

program.parseAsync().catch(err => {
  console.error(err)
  process.exit(1)
})

