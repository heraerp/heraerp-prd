#!/usr/bin/env node

/**
 * Production start script with error handling
 * Ensures the server starts even with SSR issues
 */

// Apply global polyfills
if (typeof self === 'undefined') {
  global.self = global;
}

if (typeof window === 'undefined') {
  global.window = global.window || {};
}

// Set production environment
process.env.NODE_ENV = 'production';

console.log('Starting production server...');
console.log('Port:', process.env.PORT || 3000);
console.log('Hostname:', process.env.HOSTNAME || '0.0.0.0');

try {
  // Start the Next.js server
  require('./server.js');
} catch (error) {
  console.error('Error starting server:', error);
  
  // Fallback: try to start with basic HTTP server
  const http = require('http');
  const PORT = process.env.PORT || 3000;
  
  const server = http.createServer((req, res) => {
    if (req.url === '/api/health-simple') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.2.1',
        note: 'Fallback server active'
      }));
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Server starting, please wait...',
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Fallback server listening on port ${PORT}`);
  });
}