// Simple health page as additional fallback
export default function HealthPage() {
  return (
    <div style={{ fontFamily: 'monospace', padding: '20px' }}>
      <h1>HERA Health Check</h1>
      <p>Status: OK</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      <p>Path: /health</p>
      <pre>
        {JSON.stringify({
          ok: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          route: 'page'
        }, null, 2)}
      </pre>
    </div>
  )
}