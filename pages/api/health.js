// Simple Pages Router health endpoint as Railway recommends
export default function handler(_req, res) {
  console.log('[HEALTH]', new Date().toISOString(), 'Pages Router health check');
  res.status(200).json({ 
    ok: true,
    timestamp: new Date().toISOString(),
    router: 'pages'
  });
}