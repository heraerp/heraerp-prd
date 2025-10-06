// HERA API v2 Client Utilities
// Ensures all client requests use v2 endpoints with proper headers

/**
 * Get auth headers with Supabase token (browser only)
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  if (typeof window === 'undefined') return {}

  try {
    const { supabase } = await import('@/lib/supabase/client')
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.access_token) {
      return {
        Authorization: `Bearer ${session.access_token}`
      }
    }
  } catch (error) {
    console.warn('[fetchV2] Failed to get auth token:', error)
  }

  return {}
}

/**
 * Fetch wrapper that enforces v2 API usage
 * - Automatically prefixes URLs with /api/v2/
 * - Adds required x-hera-api-version header
 * - Automatically includes Supabase auth token
 * - Ensures apiVersion: 'v2' is in the body
 */
export async function fetchV2(input: string, init: RequestInit = {}): Promise<Response> {
  // Ensure URL uses v2 prefix
  let url = input
  if (input.startsWith('/api/') && !input.startsWith('/api/v2/')) {
    // Transform /api/foo to /api/v2/foo
    url = `/api/v2${input.substring(4)}`
    console.warn(`[fetchV2] Transformed legacy URL: ${input} → ${url}`)
  } else if (!input.startsWith('/api/v2/') && !input.startsWith('http')) {
    // Add /api/v2 prefix if missing
    url = `/api/v2/${input.replace(/^\//, '')}`
  }

  // Get auth headers
  const authHeaders = await getAuthHeaders()

  // Setup headers
  const headers = new Headers(init.headers ?? {})
  headers.set('x-hera-api-version', 'v2')

  // Add auth headers
  Object.entries(authHeaders).forEach(([key, value]) => {
    headers.set(key, value)
  })

  // Set content-type if body exists
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  // Ensure apiVersion in body for POST/PUT/PATCH
  let body = init.body
  if (body && ['POST', 'PUT', 'PATCH'].includes(init.method?.toUpperCase() || '')) {
    try {
      const parsed = typeof body === 'string' ? JSON.parse(body) : body
      if (parsed && typeof parsed === 'object' && !parsed.apiVersion) {
        body = JSON.stringify({ ...parsed, apiVersion: 'v2' })
      }
    } catch (e) {
      // If parsing fails, leave body as-is (might be FormData, etc)
    }
  }

  // Make the request
  // Use relative URLs in browser (automatically uses current origin)
  // Only use absolute URLs on server-side or when URL is already absolute
  const fullUrl = url.startsWith('http')
    ? url
    : typeof window !== 'undefined'
    ? url // Browser: use relative URL (same origin)
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${url}` // Server: need absolute URL

  console.log(`[fetchV2] Making request to: ${fullUrl}`)

  const response = await fetch(fullUrl, {
    ...init,
    headers,
    body
  })

  // Log non-2xx responses
  if (!response.ok) {
    console.error(`[fetchV2] Request failed: ${init.method || 'GET'} ${url} → ${response.status}`)
  }

  return response
}

/**
 * Type-safe v2 fetch with JSON parsing
 */
export async function fetchV2Json<T = any>(
  input: string,
  init: RequestInit = {}
): Promise<{ data?: T; error?: any; response: Response }> {
  try {
    const response = await fetchV2(input, init)

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`
      }))
      return { error, response }
    }

    const data = (await response.json()) as T
    return { data, response }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Network error',
        details: error
      },
      response: new Response(null, { status: 500 })
    }
  }
}

/**
 * Typed API client for common operations
 */
export const apiV2 = {
  /**
   * GET request
   */
  async get<T = any>(path: string, params?: Record<string, any>) {
    const url = params ? `${path}?${new URLSearchParams(params)}` : path
    return fetchV2Json<T>(url, { method: 'GET' })
  },

  /**
   * POST request
   */
  async post<T = any>(path: string, body: any) {
    return fetchV2Json<T>(path, {
      method: 'POST',
      body: JSON.stringify({ apiVersion: 'v2', ...body })
    })
  },

  /**
   * PUT request
   */
  async put<T = any>(path: string, body: any) {
    return fetchV2Json<T>(path, {
      method: 'PUT',
      body: JSON.stringify({ apiVersion: 'v2', ...body })
    })
  },

  /**
   * DELETE request
   */
  async delete<T = any>(path: string) {
    return fetchV2Json<T>(path, { method: 'DELETE' })
  },

  /**
   * PATCH request
   */
  async patch<T = any>(path: string, body: any) {
    return fetchV2Json<T>(path, {
      method: 'PATCH',
      body: JSON.stringify({ apiVersion: 'v2', ...body })
    })
  }
}

/**
 * React hook for v2 API calls
 * (Can be expanded with SWR/React Query integration)
 */
export function useApiV2() {
  return apiV2
}
