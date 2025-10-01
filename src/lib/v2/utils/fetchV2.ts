/**
 * V2 API Fetch Utility
 * Handles v2 API requests with proper headers and error handling
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function fetchV2(path: string, options: RequestInit = {}): Promise<Response> {
  // Ensure path starts with /api/v2/
  const apiPath = path.startsWith('/api/v2/') ? path : `/api/v2${path.startsWith('/') ? path : `/${path}`}`
  
  const url = `${BASE_URL}${apiPath}`
  
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('x-hera-api-version', 'v2')
  
  return fetch(url, {
    ...options,
    headers
  })
}