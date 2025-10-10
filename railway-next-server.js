#!/usr/bin/env node

// Railway Next.js Server with Enhanced Healthcheck
// This server runs Next.js standalone with improved healthcheck handling

const path = require('path')
const { spawn } = require('child_process')

const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = process.env.PORT || 3000

console.log('🚂 Starting Railway Next.js Server...')
console.log(`📍 Hostname: ${hostname}`)
console.log(`🔌 Port: ${port}`)
console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
console.log(`🏗️ Railway Service: ${process.env.RAILWAY_SERVICE_NAME}`)
console.log(`🚀 Railway Deployment: ${process.env.RAILWAY_DEPLOYMENT_ID}`)

// Check if standalone server exists
const standaloneServerPath = path.join(process.cwd(), '.next/standalone/server.js')
const fs = require('fs')

if (!fs.existsSync(standaloneServerPath)) {
  console.error('❌ Standalone server not found at:', standaloneServerPath)
  console.log('🔄 Falling back to npm start...')
  
  // Use npm start as fallback
  const npmStart = spawn('npm', ['start'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      HOSTNAME: hostname,
      PORT: port
    }
  })
  
  npmStart.on('error', (err) => {
    console.error('❌ Failed to start npm:', err)
    process.exit(1)
  })
  
  npmStart.on('exit', (code) => {
    console.log(`📦 npm start exited with code ${code}`)
    process.exit(code)
  })
} else {
  console.log('✅ Found standalone server, starting...')
  
  // Start the standalone server
  const server = spawn('node', [standaloneServerPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      HOSTNAME: hostname,
      PORT: port
    }
  })
  
  server.on('error', (err) => {
    console.error('❌ Failed to start standalone server:', err)
    process.exit(1)
  })
  
  server.on('exit', (code) => {
    console.log(`🚀 Standalone server exited with code ${code}`)
    process.exit(code)
  })
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason)
  process.exit(1)
})