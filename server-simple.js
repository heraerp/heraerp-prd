const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

console.log('Starting server with configuration:', {
  dev,
  hostname,
  port,
  NODE_ENV: process.env.NODE_ENV
});

// Create the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // Handle health check endpoints directly
      if (pathname === '/api/health-simple' || pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        return;
      }

      // Let Next.js handle everything else
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`🚀 Server ready on http://${hostname}:${port}`);
      console.log('Health check endpoints available at:');
      console.log(`  - http://${hostname}:${port}/api/health`);
      console.log(`  - http://${hostname}:${port}/api/health-simple`);
    });
})
.catch((err) => {
  console.error('Failed to prepare Next.js app:', err);
  process.exit(1);
});