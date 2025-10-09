#!/usr/bin/env node

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT, 10) || 3000

console.log('🚂 Starting Railway server...')
console.log(`📍 Hostname: ${hostname}`)
console.log(`🔌 Port: ${port}`)
console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
console.log(`🏗️ Railway Service: ${process.env.RAILWAY_SERVICE_NAME}`)
console.log(`🚀 Railway Deployment: ${process.env.RAILWAY_DEPLOYMENT_ID}`)

// Prepare the Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      // Handle healthcheck at root level too
      if (req.url === '/health' || req.url === '/healthz') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          railway: {
            service: process.env.RAILWAY_SERVICE_NAME,
            environment: process.env.RAILWAY_ENVIRONMENT_NAME,
            deployment: process.env.RAILWAY_DEPLOYMENT_ID
          }
        }))
        return
      }

      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error('❌ Server error:', err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`✅ Railway server ready on http://${hostname}:${port}`)
      console.log(`🏥 Health check available at http://${hostname}:${port}/api/v2/healthz`)
    })
})
.catch((err) => {
  console.error('❌ Failed to start server:', err)
  process.exit(1)
})

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