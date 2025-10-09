#!/usr/bin/env node

/**
 * Railway Start Script for HERA ERP
 * 
 * This script provides robust startup for Railway deployments with:
 * - Environment validation
 * - Comprehensive error handling
 * - Startup diagnostics
 * - Health check preparation
 * - Port binding verification
 */

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')

console.log('🚂 Railway HERA ERP Startup Script v3.0')
console.log('========================================')

// Environment validation
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'production'
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0'

console.log(`📊 Environment: ${NODE_ENV}`)
console.log(`🌐 Hostname: ${HOSTNAME}`)
console.log(`🔌 Port: ${PORT}`)
console.log(`🏷️  Railway Deployment: ${process.env.RAILWAY_DEPLOYMENT_ID || 'unknown'}`)
console.log(`🏷️  Railway Environment: ${process.env.RAILWAY_ENVIRONMENT || 'unknown'}`)

// Check if standalone server exists
const standaloneServer = path.join(process.cwd(), '.next', 'standalone', 'server.js')
if (!fs.existsSync(standaloneServer)) {
  console.error('❌ Standalone server not found:', standaloneServer)
  
  // Check if we have a regular Next.js build
  const regularServer = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next')
  if (fs.existsSync(regularServer)) {
    console.log('⚠️  Falling back to regular Next.js start')
    // We'll use regular next start instead
  } else {
    console.error('❌ No Next.js server found at all')
    process.exit(1)
  }
} else {
  console.log('✅ Standalone server found')
}

// Check directory structure
const nextDir = path.join(process.cwd(), '.next')
if (fs.existsSync(nextDir)) {
  const contents = fs.readdirSync(nextDir)
  console.log('📁 .next directory contents:', contents.join(', '))
}

// Check memory
const memoryUsage = process.memoryUsage()
const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
console.log(`💾 Memory usage: ${memoryMB}MB`)

// Set environment variables for the Next.js server
process.env.HOSTNAME = HOSTNAME
process.env.PORT = PORT
process.env.NODE_ENV = NODE_ENV

// Determine server startup method
let serverCommand, serverArgs
if (fs.existsSync(standaloneServer)) {
  console.log('🚀 Starting Next.js standalone server...')
  serverCommand = 'node'
  serverArgs = [standaloneServer]
} else {
  console.log('🚀 Starting Next.js production server...')
  serverCommand = 'npx'
  serverArgs = ['next', 'start']
}

// Start the Next.js server with proper error handling
const serverProcess = spawn(serverCommand, serverArgs, {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: process.env
})

// Capture and log server output
serverProcess.stdout.on('data', (data) => {
  const message = data.toString().trim()
  if (message) {
    console.log(`[SERVER STDOUT] ${message}`)
  }
})

serverProcess.stderr.on('data', (data) => {
  const message = data.toString().trim()
  if (message) {
    console.log(`[SERVER STDERR] ${message}`)
  }
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

// Function to test server connectivity
function testServerHealth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOSTNAME === '0.0.0.0' ? 'localhost' : HOSTNAME,
      port: PORT,
      path: '/api/healthz',
      method: 'GET',
      timeout: 5000
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ status: res.statusCode, data })
        } else {
          reject(new Error(`Health check failed with status ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Health check request timeout'))
    })

    req.end()
  })
}

// Wait for server to start and then test health
console.log('⏳ Waiting for server to start...')

// Progressive health check attempts
const healthCheckAttempts = [10, 20, 30, 45, 60, 90] // seconds
let attemptIndex = 0

function attemptHealthCheck() {
  if (attemptIndex >= healthCheckAttempts.length) {
    console.error('❌ Server failed to respond to health checks after all attempts')
    return
  }

  const delay = healthCheckAttempts[attemptIndex] * 1000
  attemptIndex++

  setTimeout(async () => {
    try {
      const result = await testServerHealth()
      console.log(`✅ HERA ERP Health Check PASSED`)
      console.log(`🌐 Server responding at: http://${HOSTNAME}:${PORT}`)
      console.log(`🔍 Health endpoint: http://${HOSTNAME}:${PORT}/api/healthz`)
      console.log(`📊 Health response:`, JSON.parse(result.data))
    } catch (error) {
      console.log(`⚠️  Health check attempt ${attemptIndex} failed:`, error.message)
      
      if (attemptIndex < healthCheckAttempts.length) {
        console.log(`🔄 Will retry in ${healthCheckAttempts[attemptIndex]} seconds...`)
        attemptHealthCheck()
      } else {
        console.error('❌ All health check attempts exhausted')
      }
    }
  }, delay)
}

// Start health check attempts
attemptHealthCheck()

// Log immediate startup confirmation
console.log(`✅ HERA ERP startup script completed`)
console.log(`🌐 Expected server location: http://${HOSTNAME}:${PORT}`)
console.log(`🔍 Health check endpoint: http://${HOSTNAME}:${PORT}/api/healthz`)