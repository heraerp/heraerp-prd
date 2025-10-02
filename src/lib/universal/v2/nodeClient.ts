type Method = 'GET' | 'POST'
function headers() {
  const tok = process.env.HERA_SERVICE_JWT
  const devBypass = process.env.HERA_DEV_BYPASS_AUTH === '1'

  if (!tok && !devBypass) {
    throw new Error('HERA_SERVICE_JWT not set (or use HERA_DEV_BYPASS_AUTH=1 for dev)')
  }

  const baseHeaders = { 'Content-Type': 'application/json' }

  if (tok) {
    return { ...baseHeaders, Authorization: `Bearer ${tok}` }
  }

  // Use demo token for jewelry org in dev mode
  if (devBypass) {
    return { ...baseHeaders, Authorization: 'Bearer demo-token-jewelry-admin' }
  }

  return baseHeaders
}
export async function apiGetV2(path: string, params: Record<string, any> = {}) {
  const u = new URL(path, process.env.API_BASE_URL || 'http://localhost:3000')
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)))
  const res = await fetch(u, { method: 'GET', headers: headers() } as any)
  if (!res.ok) {
    console.error(`[fetchV2] Request failed: GET ${path} → ${res.status}`)
    throw new Error(await res.text())
  }
  return res.json()
}
export async function apiPostV2(path: string, body: any) {
  const u = new URL(path, process.env.API_BASE_URL || 'http://localhost:3000')
  const res = await fetch(u, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body)
  } as any)
  if (!res.ok) {
    console.error(`[fetchV2] Request failed: POST ${path} → ${res.status}`)
    throw new Error(await res.text())
  }
  return res.json()
}
