// ================================================================================
// HERA API CLIENT - PRODUCTION READY
// Smart Code: HERA.API.CLIENT.CORE.v1
// Minimal, typed API client with automatic token management and org resolution
// ================================================================================

// Cache for tenant organization resolution
const tenantOrgCache = new Map<string, { id: string; branding: any }>()

export interface ApiOptions {
  baseUrl: string
  token?: string
  timeout?: number
  organizationId?: string
  orgMode?: 'demo' | 'tenant'
  tenantSlug?: string
}

export class ApiClient {
  constructor(private opts: ApiOptions) {
    // Initialize organization context on creation
    if (typeof window !== 'undefined') {
      this.initializeOrgContext()
    }
  }

  private async initializeOrgContext() {
    // Get headers from middleware
    const orgMode = this.getHeaderValue('x-hera-org-mode') as 'demo' | 'tenant'
    const orgId = this.getHeaderValue('x-hera-org-id')
    const tenantSlug = this.getHeaderValue('x-hera-tenant-slug')

    // Set mode and resolve organization
    this.opts.orgMode = orgMode || 'demo'
    
    if (orgMode === 'demo' && orgId) {
      this.opts.organizationId = orgId
    } else if (orgMode === 'tenant' && tenantSlug) {
      this.opts.tenantSlug = tenantSlug
      await this.resolveTenantOrg(tenantSlug)
    } else {
      // Fallback to demo org
      this.opts.organizationId = process.env.NEXT_PUBLIC_DEMO_ORG_ID || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'
    }
  }

  private getHeaderValue(headerName: string): string | null {
    if (typeof window === 'undefined') return null
    // In client, we'll get these from session storage set by middleware
    return sessionStorage.getItem(headerName)
  }

  private async resolveTenantOrg(slug: string) {
    // Check cache first
    if (tenantOrgCache.has(slug)) {
      const cached = tenantOrgCache.get(slug)!
      this.opts.organizationId = cached.id
      return
    }

    // Resolve from API
    try {
      const response = await fetch(`/api/v1/organizations/by-subdomain/${slug}`)
      if (response.ok) {
        const org = await response.json()
        tenantOrgCache.set(slug, { id: org.id, branding: org.branding })
        this.opts.organizationId = org.id
      }
    } catch (error) {
      console.error('Failed to resolve tenant organization:', error)
      // Fallback to demo org
      this.opts.organizationId = process.env.NEXT_PUBLIC_DEMO_ORG_ID || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'
    }
  }

  private headers(extra: RequestInit = {}) {
    return {
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': this.opts.organizationId || '',
        'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
        'X-Hera-Org-Mode': this.opts.orgMode || 'demo',
        ...(this.opts.tenantSlug ? { 'X-Hera-Tenant-Slug': this.opts.tenantSlug } : {}),
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

  // Check if in demo mode
  isDemoMode(): boolean {
    return this.opts.orgMode === 'demo'
  }

  // Get current organization ID
  getOrganizationId(): string | undefined {
    return this.opts.organizationId
  }

  // Get tenant branding if available
  getTenantBranding(): any | undefined {
    if (this.opts.tenantSlug && tenantOrgCache.has(this.opts.tenantSlug)) {
      return tenantOrgCache.get(this.opts.tenantSlug)?.branding
    }
    return undefined
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