/**
 * Universal API wrapper with Bearer token support
 * Replaces all cookie-dependent API calls
 */

import { createClient } from '@supabase/supabase-js'

// Single Supabase client instance
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { 
    auth: { 
      persistSession: true, 
      autoRefreshToken: true, 
      flowType: 'pkce' 
    } 
  }
)

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://heraerp.com'

/**
 * Cookieless API wrapper with automatic Bearer token injection
 */
export async function api(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  
  const headers = new Headers(init.headers || {})
  headers.set('Content-Type', 'application/json')
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE}${path}`, { 
    ...init, 
    headers,
    // Add CORS support for cookieless requests
    mode: 'cors',
    credentials: 'omit' // Don't send cookies
  })
  
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('🚨 API error', res.status, path, text)
    throw new Error(`API ${res.status} ${path} ${text}`)
  }
  
  return res.headers.get('content-type')?.includes('application/json')
    ? res.json()
    : res.text()
}

/**
 * Convenience methods for common operations
 */
export const apiClient = {
  get: (path: string, params?: Record<string, any>) => {
    const url = params ? `${path}?${new URLSearchParams(params)}` : path
    return api(url, { method: 'GET' })
  },
  
  post: (path: string, data?: any) => 
    api(path, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  put: (path: string, data?: any) => 
    api(path, { 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  delete: (path: string) => 
    api(path, { method: 'DELETE' })
}

/**
 * HERA-specific API methods with Bearer support
 */
export const heraApi = {
  // Health check
  health: () => api('/api/v2/debug/session'),
  
  // Entity operations
  entities: (params: { entity_type?: string; organization_id?: string; limit?: number }) =>
    apiClient.get('/api/v2/entities', params),
    
  createEntity: (data: any) => 
    apiClient.post('/api/v2/entities', data),
    
  // Dashboard data
  dashboardSummary: (orgId: string) =>
    apiClient.post('/api/v2/command', {
      cmd: 'dashboard.get_summary',
      orgId
    }),
    
  // Authentication
  resolveUser: () => 
    api('/api/v2/auth/resolve-membership'),
    
  // Test endpoints
  bearerTest: () => 
    api('/api/v2/bearer-test')
}

export default api