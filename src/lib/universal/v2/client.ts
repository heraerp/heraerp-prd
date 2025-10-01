/**
 * HERA Universal API v2 Client - Canonical Entrypoint
 * Re-exports existing v2 clients with runtime guards
 */

// Re-export the main v2 API client
export { 
  apiV2, 
  fetchV2, 
  fetchV2Json, 
  useApiV2 
} from '@/lib/client/fetchV2'

// Re-export typed v2 clients
export * from '@/lib/v2/client'

// Legacy naming compatibility (if needed)
// Convenience helpers to align with imperative usage in scripts/tests
export async function apiGetV2<T = any>(path: string, params?: Record<string, any>): Promise<T> {
  const { apiV2 } = await import('@/lib/client/fetchV2')
  const { data, error } = await apiV2.get<T>(path, params)
  if (error) throw error
  // Some handlers return plain arrays/objects without { data }
  return (data as any) ?? ({} as T)
}

export async function apiPostV2<T = any>(path: string, body: any): Promise<T> {
  const { apiV2 } = await import('@/lib/client/fetchV2')
  const { data, error } = await apiV2.post<T>(path, body)
  if (error) throw error
  return (data as any) ?? ({} as T)
}

/**
 * Runtime guard to prevent v1 API usage in v2 client context
 * Throws error if any code tries to use v1 paths through v2 client
 */
export function assertV2Path(path: string): void {
  if (path.startsWith('/api/v1/')) {
    throw new Error(`V1 API path blocked in v2 client: ${path}. Use /api/v2/ instead.`)
  }
  
  if (path.includes('universal/v1')) {
    throw new Error(`V1 universal client blocked: ${path}. Use v2 clients instead.`)
  }
}

/**
 * Enhanced v2 client with path validation
 */
export const guardedApiV2 = {
  async get<T = any>(path: string, params?: Record<string, any>) {
    assertV2Path(path)
    const { apiV2 } = await import('@/lib/client/fetchV2')
    return apiV2.get<T>(path, params)
  },

  async post<T = any>(path: string, body: any) {
    assertV2Path(path)
    const { apiV2 } = await import('@/lib/client/fetchV2')
    return apiV2.post<T>(path, body)
  },

  async put<T = any>(path: string, body: any) {
    assertV2Path(path)
    const { apiV2 } = await import('@/lib/client/fetchV2')
    return apiV2.put<T>(path, body)
  },

  async delete<T = any>(path: string) {
    assertV2Path(path)
    const { apiV2 } = await import('@/lib/client/fetchV2')
    return apiV2.delete<T>(path)
  },

  async patch<T = any>(path: string, body: any) {
    assertV2Path(path)
    const { apiV2 } = await import('@/lib/client/fetchV2')
    return apiV2.patch<T>(path, body)
  }
}

// Default export for convenience
export default guardedApiV2
