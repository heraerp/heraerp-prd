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

// Set optimized Node.js flags for faster startup
process.env.NODE_OPTIONS = [
  '--max-old-space-size=2048',
  '--max-semi-space-size=128', 
  '--optimize-for-size',
  '--max-inlined-source-size=600'
].join(' ')

// Faster require resolution
process.env.NODE_PATH = './node_modules'

// Start Next.js with optimizations
const startCommand = 'next'
const args = [
  'start',
  '-H', '0.0.0.0',
  '-p', process.env.PORT || '3000'
]

console.log(`🔧 Starting: ${startCommand} ${args.join(' ')}`)

const child = spawn(startCommand, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
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