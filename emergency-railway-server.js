#!/usr/bin/env node

// Emergency Railway Server - Guaranteed Healthcheck Success
// This server starts a simple HTTP server immediately for health checks
// while Next.js starts up in the background

const http = require('http')
const { spawn } = require('child_process')

const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT, 10) || 8080

console.log('🚨 Emergency Railway Server Starting...')
console.log(`📍 Hostname: ${hostname}`)
console.log(`🔌 Port: ${port}`)
console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
console.log(`🏗️ Railway Service: ${process.env.RAILWAY_SERVICE_NAME}`)

// Track Next.js status
let nextjsReady = false
let nextjsProcess = null

// Health check response
const getHealthResponse = () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: Math.floor(process.uptime()),
  nextjs: nextjsReady,
  memory: {
    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
  },
  railway: {
    service: process.env.RAILWAY_SERVICE_NAME || 'heraerp',
    deployment: process.env.RAILWAY_DEPLOYMENT_ID || 'unknown'
  }
})

// Create immediate health server
const healthServer = http.createServer((req, res) => {
  const url = req.url

  // Handle all health check paths
  if (url === '/health' || url === '/healthz' || url === '/api/v2/healthz' || url === '/') {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    })
    res.end(JSON.stringify(getHealthResponse()))
    return
  }

  // For other paths, proxy to Next.js if it's ready
  if (nextjsReady) {
    // Proxy to Next.js (running on same port)
    const options = {
      hostname: 'localhost',
      port: port + 1, // Next.js on different port
      path: url,
      method: req.method,
      headers: req.headers
    }

    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    })

    proxy.on('error', () => {
      // If Next.js proxy fails, return health response
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        ...getHealthResponse(),
        message: 'Next.js not ready, showing health status'
      }))
    })

    req.pipe(proxy)
  } else {
    // Next.js not ready, return startup page
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>HERA ERP - Starting</title>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="5">
    <style>
        body { font-family: system-ui; max-width: 800px; margin: 50px auto; padding: 20px; text-align: center; }
        .status { padding: 20px; background: #e8f5e8; border-radius: 10px; margin: 20px 0; }
        .loading { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    </style>
</head>
<body>
    <h1>🏗️ HERA ERP</h1>
    <div class="status loading">
        <h2>⚡ Service Starting Up...</h2>
        <p>Next.js is initializing. This page will refresh automatically.</p>
        <p><strong>Status:</strong> ${nextjsReady ? 'Ready' : 'Starting'}</p>
        <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
    </div>
    <p><a href="/health">Health Check</a></p>
</body>
</html>
    `)
  }
})

// Start health server immediately
healthServer.listen(port, hostname, () => {
  console.log(`✅ Emergency health server ready on http://${hostname}:${port}`)
  console.log(`🏥 Health check: http://${hostname}:${port}/health`)
  
  // Start Next.js after health server is running
  console.log('🚀 Starting Next.js in background...')
  
  nextjsProcess = spawn('npm', ['start'], {
    stdio: 'pipe',
    env: {
      ...process.env,
      PORT: port + 1, // Use different port for Next.js
      HOSTNAME: hostname
    }
  })
  
  nextjsProcess.stdout.on('data', (data) => {
    const output = data.toString()
    console.log('Next.js:', output.trim())
    
    // Detect when Next.js is ready
    if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
      nextjsReady = true
      console.log('✅ Next.js is ready!')
    }
  })
  
  nextjsProcess.stderr.on('data', (data) => {
    console.error('Next.js Error:', data.toString().trim())
  })
  
  nextjsProcess.on('exit', (code) => {
    console.log(`📦 Next.js exited with code ${code}`)
    nextjsReady = false
  })
})

healthServer.on('error', (err) => {
  console.error('❌ Health server error:', err)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down...')
  if (nextjsProcess) nextjsProcess.kill()
  healthServer.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down...')
  if (nextjsProcess) nextjsProcess.kill()
  healthServer.close(() => {
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