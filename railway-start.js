#!/usr/bin/env node

// Simple startup script for Railway that handles health checks
const { spawn } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 3000;

console.log('🚀 Starting HERA ERP for Railway...');
console.log(`PORT: ${PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'production'}`);

// Create a simple health check server on the main port
// that proxies to Next.js when it's ready
let nextReady = false;
let nextServer = null;

const server = http.createServer((req, res) => {
  // Handle health checks immediately
  if (req.url === '/health' || req.url === '/api/health' || req.url === '/api/health-simple') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // If Next.js is ready, proxy the request
  if (nextReady && nextServer) {
    const proxyReq = http.request({
      hostname: 'localhost',
      port: 3001, // Next.js runs on 3001
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err);
      res.writeHead(502);
      res.end('Bad Gateway');
    });

    req.pipe(proxyReq);
  } else {
    // Next.js not ready yet
    res.writeHead(503);
    res.end('Service starting...');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Health check server listening on port ${PORT}`);
  
  // Start Next.js on port 3001
  console.log('Starting Next.js server...');
  nextServer = spawn('npm', ['start', '--', '-p', '3001'], {
    env: {
      ...process.env,
      PORT: '3001',
      HOSTNAME: '0.0.0.0'
    },
    stdio: 'pipe'
  });

  nextServer.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Next.js: ${output}`);
    
    // Check if Next.js is ready
    if (output.includes('Ready on') || output.includes('started server on')) {
      nextReady = true;
      console.log('✅ Next.js server is ready!');
    }
  });

  nextServer.stderr.on('data', (data) => {
    console.error(`Next.js Error: ${data}`);
  });

  nextServer.on('close', (code) => {
    console.log(`Next.js process exited with code ${code}`);
    process.exit(code || 0);
  });
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close();
  if (nextServer) {
    nextServer.kill('SIGTERM');
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close();
  if (nextServer) {
    nextServer.kill('SIGINT');
  }
});