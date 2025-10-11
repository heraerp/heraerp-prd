#!/usr/bin/env node

// Standalone health server that runs alongside Next.js
const http = require('http');

// Use the same port as Railway expects for health checks
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  console.log('[HEALTH-SERVER]', new Date().toISOString(), req.method, req.url);
  
  if (req.url.includes('/health') || req.url.includes('/api/health')) {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    
    const healthData = {
      ok: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      pid: process.pid,
      uptime: Math.round(process.uptime()) + 's',
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      server: 'standalone-health',
      port: PORT
    };
    
    res.end(JSON.stringify(healthData));
    console.log('[HEALTH-SERVER]', 'Responded with health data');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Health Server - Use /health or /api/health');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('[HEALTH-SERVER]', `Health server running on port ${PORT}`);
  console.log('[HEALTH-SERVER]', 'Available endpoints: /health, /api/health');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Health server closed');
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Health server closed');
  });
});