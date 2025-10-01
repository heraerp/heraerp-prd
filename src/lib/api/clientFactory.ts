// ================================================================================
// HERA API CLIENT FACTORY
// Smart Code: HERA.API.CLIENT.FACTORY.V1
// Factory for creating API clients with sync support
// ================================================================================

import { ApiClient, ApiOptions } from './client'
import { MockApiClient } from './mockClient'

let cachedClient: ApiClient | MockApiClient | null = null

export function createApiClient(options: Partial<ApiOptions> = {}): ApiClient | MockApiClient {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

  if (cachedClient) {
    // If we're switching from mock to real, reset the client
    if (
      (useMock && cachedClient instanceof ApiClient) ||
      (!useMock && cachedClient instanceof MockApiClient)
    ) {
      cachedClient = null
    } else {
      return cachedClient
    }
  }

  if (useMock) {
    cachedClient = new MockApiClient({ baseUrl, ...options })
  } else {
    cachedClient = new ApiClient({ baseUrl, ...options })
  }

  return cachedClient
}

// For resetting during tests
export function resetApiClient() {
  cachedClient = null
}
