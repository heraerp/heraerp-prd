#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { guardAndNormalizeTx } = require('../lib/tx-guard')

function usage() {
  console.log('Usage: node mcp-server/src/cli/tx-create.js <header.json> <lines.json> [--compat]')
  process.exit(1)
}

;(async function main() {
  const args = process.argv.slice(2)
  if (args.length < 2) usage()
  const compat = args.includes('--compat')
  const [hArg, lArg] = args.filter((a) => !a.startsWith('--'))
  const headerPath = path.resolve(hArg)
  const linesPath = path.resolve(lArg)
  try {
    const header = JSON.parse(fs.readFileSync(headerPath, 'utf8'))
    const lines = JSON.parse(fs.readFileSync(linesPath, 'utf8'))
    const { header: H, lines: L, warnings } = await guardAndNormalizeTx({ header, lines, compat })
    if (warnings?.length) console.error('[WARN]', warnings.join('; '))
    // Placeholder for DB write
    // console.log('Would write to DB here...')
    console.log(JSON.stringify({ ok: true, header: H, lines: L }, null, 2))
    process.exit(0)
  } catch (e) {
    console.error('[TX_VALIDATE_ERROR]', e.message || e)
    process.exit(1)
  }
})()
