#!/usr/bin/env node

/**
 * Railway Start Script for HERA ERP
 * 
 * This script provides robust startup for Railway deployments with:
 * - Environment validation
 * - Comprehensive error handling
 * - Startup diagnostics
 * - Health check preparation
 */

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

console.log('🚂 Railway HERA ERP Startup Script')
console.log('===================================')

// Environment validation
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'production'
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0'

console.log(`📊 Environment: ${NODE_ENV}`)
console.log(`🌐 Hostname: ${HOSTNAME}`)
console.log(`🔌 Port: ${PORT}`)

// Check if standalone server exists
const standaloneServer = path.join(process.cwd(), '.next', 'standalone', 'server.js')
if (!fs.existsSync(standaloneServer)) {
  console.error('❌ Standalone server not found:', standaloneServer)
  process.exit(1)
}

console.log('✅ Standalone server found')

// Check memory
const memoryUsage = process.memoryUsage()
const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
console.log(`💾 Memory usage: ${memoryMB}MB`)

// Set environment variables for the Next.js server
process.env.HOSTNAME = HOSTNAME
process.env.PORT = PORT
process.env.NODE_ENV = NODE_ENV

console.log('🚀 Starting Next.js standalone server...')

// Start the Next.js server with proper error handling
const serverProcess = spawn('node', [standaloneServer], {
  stdio: 'inherit',
  env: process.env
})

// Handle server startup errors
serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})

// Handle server exit
serverProcess.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code} and signal ${signal}`)
    process.exit(code || 1)
  }
  console.log('✅ Server exited gracefully')
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...')
  serverProcess.kill('SIGTERM')
})

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...')
  serverProcess.kill('SIGINT')
})

// Log successful startup
setTimeout(() => {
  console.log(`✅ HERA ERP started successfully`)
  console.log(`🌐 Available at: http://${HOSTNAME}:${PORT}`)
  console.log(`🔍 Health check: http://${HOSTNAME}:${PORT}/api/healthz`)
}, 2000)