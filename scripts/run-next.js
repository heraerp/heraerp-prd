#!/usr/bin/env node

// Compatibility launcher for Railway startCommand
// Falls back to the same behavior Nixpacks uses: `next start -H 0.0.0.0 -p $PORT`

const { spawn } = require('node:child_process')
const fs = require('node:fs')

const port = process.env.PORT || '3000'
const host = process.env.HOST || '0.0.0.0'

function run(cmd, args) {
  const child = spawn(cmd, args, { stdio: 'inherit', env: process.env })
  child.on('exit', code => process.exit(code ?? 0))
  child.on('error', err => {
    console.error(`[run-next] Failed to start with ${cmd}:`, err)
    process.exit(1)
  })
}

// Try using local Next binary first; fall back to npx if missing
const localNext = './node_modules/.bin/next'
if (fs.existsSync(localNext)) {
  run(localNext, ['start', '-H', host, '-p', port])
} else {
  console.warn('[run-next] Local next binary not found, using npx')
  run('npx', ['next', 'start', '-H', host, '-p', port])
}
