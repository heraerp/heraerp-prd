#!/usr/bin/env node

/**
 * Railway Optimized Startup Script
 * Based on comprehensive healthcheck documentation
 * Addresses slow startup issues causing healthcheck failures
 */

const { spawn } = require('child_process')

console.log('🚀 HERA Railway Optimized Startup Starting...')
console.log('📊 Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT
})

// Pre-startup optimizations
console.log('⚡ Running pre-startup optimizations...')

// Remove disallowed V8 flags from NODE_OPTIONS
const env = { ...process.env }
if (env.NODE_OPTIONS) {
  console.log('🔍 Original NODE_OPTIONS:', env.NODE_OPTIONS)
  const banned = new Set(['--optimize-for-size', '--jitless', '--prof', '--logfile', '--prof-process'])
  env.NODE_OPTIONS = env.NODE_OPTIONS
    .split(/\s+/)
    .filter(tok => tok && !banned.has(tok))
    .join(' ')
  if (env.NODE_OPTIONS.trim() === '') delete env.NODE_OPTIONS
  console.log('🧼 Sanitized NODE_OPTIONS:', env.NODE_OPTIONS || '(unset)')
} else {
  // Set valid Node.js flags for optimized startup
  env.NODE_OPTIONS = [
    '--max-old-space-size=2048',
    '--max-semi-space-size=128'
  ].join(' ')
  console.log('✅ Set NODE_OPTIONS:', env.NODE_OPTIONS)
}

// Faster require resolution
env.NODE_PATH = './node_modules'

// Start Next.js with optimizations
const startCommand = 'next'
const args = [
  'start',
  '-H', '0.0.0.0',
  '-p', process.env.PORT || '8080'
]

console.log(`🔧 Starting: ${startCommand} ${args.join(' ')}`)

const child = spawn(startCommand, args, {
  stdio: 'inherit',
  env: {
    ...env,
    // Disable telemetry for faster startup
    NEXT_TELEMETRY_DISABLED: '1',
    // Optimize Next.js runtime
    NEXT_RUNTIME: 'nodejs',
    // Faster require resolution
    NODE_PRESERVE_SYMLINKS: '1'
  }
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 Received SIGTERM, shutting down gracefully...')
  child.kill('SIGTERM')
})

process.on('SIGINT', () => {
  console.log('📡 Received SIGINT, shutting down gracefully...')
  child.kill('SIGINT')
})

child.on('exit', (code) => {
  console.log(`🏁 Next.js exited with code ${code}`)
  process.exit(code)
})

child.on('error', (error) => {
  console.error('💥 Startup error:', error)
  process.exit(1)
})