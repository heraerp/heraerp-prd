#!/usr/bin/env node

const { createServer } = require('http')
const { parse } = require('url')
const path = require('path')
const fs = require('fs')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT, 10) || 3000

console.log('🚂 Starting HERA Railway production server...')
console.log(`📍 Hostname: ${hostname}`)
console.log(`🔌 Port: ${port}`)
console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
console.log(`🏗️ Railway Service: ${process.env.RAILWAY_SERVICE_NAME}`)
console.log(`🚀 Railway Deployment: ${process.env.RAILWAY_DEPLOYMENT_ID}`)

// Try to load Next.js, fallback to simple server if it fails
let nextApp = null
let nextHandle = null

const standaloneServerPath = path.join(process.cwd(), '.next/standalone/server.js')

if (fs.existsSync(standaloneServerPath)) {
  try {
    console.log('🔄 Loading Next.js standalone server...')
    const next = require('next')
    nextApp = next({ dev: false, hostname, port })
    nextHandle = nextApp.getRequestHandler()
    console.log('✅ Next.js loaded successfully')
  } catch (error) {
    console.warn('⚠️ Failed to load Next.js:', error.message)
    console.log('🔄 Falling back to simple health server...')
  }
} else {
  console.warn('⚠️ Standalone server not found, using simple health server')
}

// Health check response
const healthResponse = {
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  version: process.env.npm_package_version || '1.2.2',
  nextjs: !!nextApp,
  railway: {
    service: process.env.RAILWAY_SERVICE_NAME,
    environment: process.env.RAILWAY_ENVIRONMENT_NAME,
    deployment: process.env.RAILWAY_DEPLOYMENT_ID
  }
}

// Create server
const server = createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url, true)
    
    // Handle health checks
    if (req.url === '/health' || req.url === '/healthz' || req.url === '/api/v2/healthz') {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      })
      res.end(JSON.stringify({
        ...healthResponse,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }))
      return
    }

    // If Next.js is available, use it
    if (nextApp && nextHandle) {
      await nextHandle(req, res, parsedUrl)
    } else {
      // Fallback for other routes
      if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>HERA ERP</title>
    <meta charset="utf-8">
    <style>
        body { font-family: system-ui; max-width: 800px; margin: 50px auto; padding: 20px; }
        .status { padding: 10px; background: #e8f5e8; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🏗️ HERA ERP</h1>
    <div class="status">
        <h2>✅ Service Status: Running</h2>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <p><strong>Railway Service:</strong> ${process.env.RAILWAY_SERVICE_NAME || 'N/A'}</p>
        <p><strong>Deployment:</strong> ${process.env.RAILWAY_DEPLOYMENT_ID || 'N/A'}</p>
        <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
        <p><strong>Next.js:</strong> ${nextApp ? 'Available' : 'Not available'}</p>
    </div>
    <p><a href="/api/v2/healthz">Health Check</a></p>
</body>
</html>
        `)
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ 
          error: 'Not found',
          nextjs: !!nextApp,
          message: nextApp ? 'Next.js available but route not found' : 'Simple server mode'
        }))
      }
    }
  } catch (err) {
    console.error('❌ Error occurred handling', req.url, err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      message: err.message 
    }))
  }
})

// Initialize and start server
async function startServer() {
  try {
    if (nextApp) {
      console.log('🔄 Preparing Next.js app...')
      await nextApp.prepare()
      console.log('✅ Next.js app prepared')
    }

    server.listen(port, hostname, () => {
      console.log(`✅ HERA Railway server ready on http://${hostname}:${port}`)
      console.log(`🏥 Health check: http://${hostname}:${port}/api/v2/healthz`)
      console.log(`🎯 Mode: ${nextApp ? 'Next.js' : 'Simple health server'}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Error handling
server.on('error', (err) => {
  console.error('❌ Server error:', err)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
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

// Start the server
startServer()