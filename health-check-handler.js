// Simple health check handler that runs alongside Next.js
const http = require('http');
const { exec } = require('child_process');

const HEALTH_PORT = 8080;
const MAIN_PORT = process.env.PORT || 3000;

// Start health check server
const healthServer = http.createServer((req, res) => {
  if (req.url === '/api/health-simple' || req.url === '/api/health' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

healthServer.listen(HEALTH_PORT, '0.0.0.0', () => {
  console.log(`Health check server running on port ${HEALTH_PORT}`);
});

// Start Next.js server
console.log('Starting Next.js server...');
const nextProcess = exec(`npm start -- -p ${MAIN_PORT}`, {
  env: { ...process.env, HOSTNAME: '0.0.0.0' }
});

nextProcess.stdout.on('data', (data) => {
  console.log(`Next.js: ${data}`);
});

nextProcess.stderr.on('data', (data) => {
  console.error(`Next.js Error: ${data}`);
});

nextProcess.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`);
  process.exit(code);
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  healthServer.close();
  nextProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  healthServer.close();
  nextProcess.kill('SIGINT');
});