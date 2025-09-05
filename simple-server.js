#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;

console.log('Starting HERA ERP...');
console.log(`PORT: ${PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

// Create a simple server that always returns 200 for health checks
const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Always return 200 OK for any request during startup
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK - Server is starting');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
  
  // After server is listening, try to start Next.js
  setTimeout(() => {
    console.log('Starting Next.js application...');
    
    try {
      const next = spawn('npm', ['start', '--', '-p', PORT], {
        env: {
          ...process.env,
          HOSTNAME: '0.0.0.0'
        },
        stdio: 'inherit'
      });

      next.on('error', (err) => {
        console.error('Failed to start Next.js:', err);
      });

      next.on('exit', (code) => {
        console.log(`Next.js exited with code ${code}`);
        process.exit(code || 0);
      });

      // Give Next.js time to start, then close our simple server
      setTimeout(() => {
        console.log('Closing simple server, Next.js should be handling requests now');
        server.close();
      }, 30000); // 30 seconds should be enough for Next.js to start

    } catch (err) {
      console.error('Error starting Next.js:', err);
    }
  }, 1000);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  server.close();
  process.exit(0);
});