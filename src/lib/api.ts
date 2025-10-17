/**
 * Universal API wrapper with Bearer token support
 * Replaces all cookie-dependent API calls
 */

import { supabase } from '@/lib/supabase'

/**
 * Bearer fetch utility - always includes Bearer token for internal API calls
 */
export async function bearerFetch(path: string, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = new Headers(init.headers || {})
  
  // Always set Content-Type for API calls
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  
  // Add Bearer token if available
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  return fetch(path, { 
    ...init, 
    headers,
    credentials: 'omit' // Don't send cookies
  })
}

/**
 * API wrapper with automatic Bearer token injection
 */
export async function api(path: string, init: RequestInit = {}) {
  const res = await bearerFetch(path, init)
  
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
  health: () => api('/api/v2/auth/resolve-membership'),
  
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
    
}

export default api