/**
 * Cookieless API wrapper using Bearer tokens
 * Replaces cookie-based authentication with JWT tokens
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for token management
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
      storageKey: 'hera-supabase-auth'
    }
  }
)

export { supabase }

/**
 * API wrapper that automatically includes Bearer tokens
 * Usage: api('/api/v2/entities', { method: 'POST', body: JSON.stringify(data) })
 */
export async function api(path: string, init: RequestInit = {}): Promise<Response> {
  // Get current session token
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  // Build headers with Bearer token
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {})
  }

  // Make request to production or current host
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://heraerp.com' 
    : ''

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers
  })
}

/**
 * Typed API helper for JSON responses
 */
export async function apiJson<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await api(path, init)
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error ${response.status}: ${error}`)
  }
  
  return response.json()
}

/**
 * Helper for common CRUD operations
 */
export const bearerApi = {
  get: <T = any>(path: string, params?: Record<string, any>) => {
    const url = params ? `${path}?${new URLSearchParams(params).toString()}` : path
    return apiJson<T>(url, { method: 'GET' })
  },
  
  post: <T = any>(path: string, data: any) =>
    apiJson<T>(path, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  put: <T = any>(path: string, data: any) =>
    apiJson<T>(path, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  
  delete: <T = any>(path: string) =>
    apiJson<T>(path, { method: 'DELETE' })
}

/**
 * Get current user context for debugging
 */
export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession()
  return {
    session: data.session,
    user: data.session?.user,
    token: data.session?.access_token
  }
}