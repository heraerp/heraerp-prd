#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { validateTransactionBundle } = require('../mcp-server/src/validators/db-universal')

function usage() {
  console.error('Usage: node scripts/tx-validate-payloads.js <payload1.json> [payload2.json ...]')
  process.exit(1)
}

;(async function main() {
  const args = process.argv.slice(2)
  if (!args.length) usage()
  let failures = 0
  for (const p of args) {
    try {
      const filePath = path.resolve(p)
      const raw = fs.readFileSync(filePath, 'utf8')
      const json = JSON.parse(raw)
      const header = json.header || {}
      const lines = json.lines || []
      const { header: H, lines: L, warnings } = validateTransactionBundle(header, lines, { compat: true })
      const sum = L.reduce((a, l) => a + Number(l.line_amount), 0)
      const warnStr = warnings && warnings.length ? ` Warnings: ${warnings.join('; ')}` : ''
      console.log(`[OK] ${p} total=${H.total_amount} lines_sum=${sum}.${warnStr}`)
    } catch (e) {
      failures++
      console.error(`[FAIL] ${p}: ${e.message || e}`)
    }
  }
  if (failures) process.exit(1)
})()

