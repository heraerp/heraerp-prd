#!/usr/bin/env node

const http = require('http')

const port = parseInt(process.env.PORT, 10) || 3000
const hostname = process.env.HOSTNAME || '0.0.0.0'

console.log('🏥 Starting simple health server...')
console.log(`📍 Hostname: ${hostname}`)
console.log(`🔌 Port: ${port}`)

const server = http.createServer((req, res) => {
  const url = req.url

  if (url === '/health' || url === '/healthz' || url === '/api/v2/healthz') {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    })
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.2.2',
      railway: {
        service: process.env.RAILWAY_SERVICE_NAME,
        environment: process.env.RAILWAY_ENVIRONMENT_NAME,
        deployment: process.env.RAILWAY_DEPLOYMENT_ID
      }
    }))
  } else if (url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>HERA ERP - Starting...</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>HERA ERP</h1>
    <p>Service is starting up...</p>
    <p>Health check: <a href="/api/v2/healthz">/api/v2/healthz</a></p>
    <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
    <p>Railway Service: ${process.env.RAILWAY_SERVICE_NAME || 'N/A'}</p>
</body>
</html>
    `)
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  }
})

server.listen(port, hostname, () => {
  console.log(`✅ Simple health server ready on http://${hostname}:${port}`)
  console.log(`🏥 Health check available at: http://${hostname}:${port}/api/v2/healthz`)
})

server.on('error', (err) => {
  console.error('❌ Server error:', err)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})