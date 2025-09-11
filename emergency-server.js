const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));
app.use('/_next/static', express.static('.next/static'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'emergency' });
});

// Catch all - serve index
app.get('*', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>HERA ERP</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
    .loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
  </style>
</head>
<body>
  <div class="loading">
    <h1>HERA ERP Loading...</h1>
  </div>
  <script>
    // Emergency redirect to working page
    if (window.location.pathname === '/') {
      window.location.href = '/auth/login';
    }
  </script>
</body>
</html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Emergency server running on port ${PORT}`);
});
