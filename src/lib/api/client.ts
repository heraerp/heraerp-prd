// ================================================================================
// HERA API CLIENT - PRODUCTION READY
// Smart Code: HERA.API.CLIENT.CORE.v1
// Minimal, typed API client with automatic token management
// ================================================================================

export interface ApiOptions {
  baseUrl: string
  token?: string
  timeout?: number
  organizationId?: string
}

export class ApiClient {
  constructor(private opts: ApiOptions) {}

  private headers(extra: RequestInit = {}) {
    return {
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': this.opts.organizationId || '',
        'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
        ...(this.opts.token ? { Authorization: `Bearer ${this.opts.token}` } : {}),
        ...(extra.headers || {}),
      },
      signal: AbortSignal.timeout(this.opts.timeout || 30000),
      ...extra,
    }
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = new URL(path, this.opts.baseUrl)
    
    // Auto-inject organization_id if not present
    if (this.opts.organizationId && !params?.organization_id) {
      params = { ...params, organization_id: this.opts.organizationId }
    }
    
    Object.entries(params || {}).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })

    const response = await fetch(url, this.headers())
    
    if (!response.ok) {
      throw await this.createError(response)
    }

    return (await response.json()) as T
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    // Auto-inject organization_id for requests
    if (typeof body === 'object' && body && !('organization_id' in body) && this.opts.organizationId) {
      body = { ...body, organization_id: this.opts.organizationId }
    }

    const response = await fetch(
      new URL(path, this.opts.baseUrl),
      this.headers({
        method: 'POST',
        body: JSON.stringify(body),
      })
    )

    if (!response.ok) {
      throw await this.createError(response)
    }

    return (await response.json()) as T
  }

  private async createError(response: Response): Promise<Error> {
    let message = `API ${response.status} ${response.statusText}`
    
    try {
      const errorBody = await response.text()
      if (errorBody) {
        const parsed = JSON.parse(errorBody)
        message = parsed.message || parsed.error || message
      }
    } catch {
      // Ignore parsing errors, use default message
    }

    const error = new Error(message)
    ;(error as any).status = response.status
    ;(error as any).statusText = response.statusText
    
    return error
  }

  // Convenience methods for common patterns
  async login<T>(email: string, password: string): Promise<T> {
    return this.post('/api/auth/login', { email, password })
  }

  async logout(): Promise<void> {
    await this.post('/api/auth/logout', {})
  }

  async getDashboardMetrics<T>(organizationId: string): Promise<T> {
    return this.get('/api/dashboard/metrics', { organization_id: organizationId })
  }

  // Method to update token for authenticated requests
  setToken(token: string) {
    this.opts.token = token
  }

  // Method to update organization context
  setOrganizationId(organizationId: string) {
    this.opts.organizationId = organizationId
  }
}

// Factory function for easy client creation
export function createApiClient(options: Partial<ApiOptions> = {}): ApiClient {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
  
  if (useMock) {
    // Dynamic import to avoid bundling mock client in production
    return import('./mockClient').then(module => 
      new module.MockApiClient({ baseUrl, ...options })
    ) as any
  }
  
  return new ApiClient({ baseUrl, ...options })
}