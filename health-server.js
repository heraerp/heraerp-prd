const http = require('http');

const PORT = process.env.HEALTH_PORT || 3001;

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/api/health' || req.url === '/api/health-simple') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'health-check'
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server running on port ${PORT}`);
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