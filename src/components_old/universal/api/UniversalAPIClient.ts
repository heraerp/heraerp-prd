/**
 * Universal API Client
 *
 * Based on lessons learned from the restaurant system:
 * - Proper error handling and retry logic
 * - Caching and throttling
 * - Type safety and response validation
 * - Unified response format
 * - Auth token management
 */

// Types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  count?: number
  metadata?: Record<string, any>
}

export interface APIError {
  status: number
  message: string
  code?: string
  details?: any
}

export interface RetryConfig {
  maxRetries: number
  retryDelay: number
  retryMultiplier: number
  retryCondition?: (error: APIError) => boolean
}

export interface CacheConfig {
  enabled: boolean
  ttl: number // Time to live in milliseconds
  maxSize: number
}

export interface UniversalAPIConfig {
  baseUrl: string
  timeout?: number
  retries?: Partial<RetryConfig>
  cache?: Partial<CacheConfig>
  getAuthToken?: () => Promise<string | null>
  onError?: (error: APIError) => void
  onRetry?: (attempt: number, error: APIError) => void
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  expires: number
}

export class UniversalAPIClient {
  private config: UniversalAPIConfig
  private cache = new Map<string, CacheEntry<any>>()
  private pendingRequests = new Map<string, Promise<any>>()

  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    retryMultiplier: 2,
    retryCondition: error => error.status >= 500 || error.status === 429
  }

  private defaultCacheConfig: CacheConfig = {
    enabled: true,
    ttl: 30000, // 30 seconds
    maxSize: 100
  }

  constructor(config: UniversalAPIConfig) {
    this.config = {
      timeout: 10000,
      retries: {},
      cache: {},
      ...config
    }
  }

  /**
   * Generic GET request with caching
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: { cache?: boolean; ttl?: number }
  ): Promise<APIResponse<T>> {
    const url = this.buildUrl(endpoint, params)
    const cacheKey = `GET:${url}`

    // Check cache first
    if (options?.cache !== false && this.isCacheEnabled()) {
      const cached = this.getFromCache<T>(cacheKey)
      if (cached) {
        console.log('📦 Cache hit:', endpoint)
        return { success: true, data: cached }
      }
    }

    // Check for pending identical request
    if (this.pendingRequests.has(cacheKey)) {
      console.log('⏳ Reusing pending request:', endpoint)
      return await this.pendingRequests.get(cacheKey)!
    }

    const requestPromise = this.executeRequest<T>('GET', url)
    this.pendingRequests.set(cacheKey, requestPromise)

    try {
      const result = await requestPromise

      // Cache successful results
      if (result.success && result.data && this.isCacheEnabled()) {
        this.setCache(cacheKey, result.data, options?.ttl)
      }

      return result
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  /**
   * Generic POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: { skipRetry?: boolean }
  ): Promise<APIResponse<T>> {
    const url = this.buildUrl(endpoint)
    return this.executeRequest<T>('POST', url, data, options)
  }

  /**
   * Generic PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: { skipRetry?: boolean }
  ): Promise<APIResponse<T>> {
    const url = this.buildUrl(endpoint)
    return this.executeRequest<T>('PUT', url, data, options)
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    const url = this.buildUrl(endpoint, params)
    return this.executeRequest<T>('DELETE', url)
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequest<T>(
    method: string,
    url: string,
    data?: any,
    options?: { skipRetry?: boolean }
  ): Promise<APIResponse<T>> {
    const retryConfig = { ...this.defaultRetryConfig, ...this.config.retries }
    let lastError: APIError | null = null

    const maxAttempts = options?.skipRetry ? 1 : retryConfig.maxRetries + 1

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.makeRequest<T>(method, url, data)

        // Log successful request
        console.log(`✅ ${method} ${url} - Success (attempt ${attempt})`)
        return result
      } catch (error) {
        lastError = error as APIError

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (!retryConfig.retryCondition!(lastError) || attempt === maxAttempts) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = retryConfig.retryDelay * Math.pow(retryConfig.retryMultiplier, attempt - 1)

        console.warn(
          `⚠️ ${method} ${url} - Attempt ${attempt} failed, retrying in ${delay}ms`,
          lastError
        )

        // Call retry callback
        this.config.onRetry?.(attempt, lastError)

        // Wait before retry
        await this.sleep(delay)
      }
    }

    // All retries failed
    console.error(`❌ ${method} ${url} - All ${maxAttempts} attempts failed`, lastError)
    this.config.onError?.(lastError!)

    return {
      success: false,
      error: lastError?.message || 'Request failed',
      message: `Request failed after ${maxAttempts} attempts`
    }
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest<T>(method: string, url: string, data?: any): Promise<APIResponse<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add auth token if available
      if (this.config.getAuthToken) {
        const token = await this.config.getAuthToken()
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
      }

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw {
          status: response.status,
          message: responseData.message || responseData.error || `HTTP ${response.status}`,
          code: responseData.code,
          details: responseData.details
        } as APIError
      }

      // Ensure consistent response format
      return this.normalizeResponse<T>(responseData)
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          status: 408,
          message: 'Request timeout',
          code: 'TIMEOUT'
        } as APIError
      }

      if (typeof error === 'object' && error !== null && 'status' in error) {
        throw error // Already an APIError
      }

      throw {
        status: 0,
        message: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR'
      } as APIError
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Normalize API response to consistent format
   */
  private normalizeResponse<T>(data: any): APIResponse<T> {
    // If already in correct format
    if (typeof data === 'object' && 'success' in data) {
      return data
    }

    // Handle different response formats
    if (Array.isArray(data)) {
      return {
        success: true,
        data: data as T,
        count: data.length
      }
    }

    return {
      success: true,
      data: data as T
    }
  }

  /**
   * Build full URL with parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '')
    const cleanEndpoint = endpoint.replace(/^\//, '')
    let url = `${baseUrl}/${cleanEndpoint}`

    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const paramString = searchParams.toString()
      if (paramString) {
        url += `?${paramString}`
      }
    }

    return url
  }

  /**
   * Cache management
   */
  private isCacheEnabled(): boolean {
    return this.config.cache?.enabled !== false
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  private setCache<T>(key: string, data: T, customTtl?: number): void {
    const cacheConfig = { ...this.defaultCacheConfig, ...this.config.cache }

    // Clear old entries if cache is full
    if (this.cache.size >= cacheConfig.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }

    const ttl = customTtl || cacheConfig.ttl
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    }

    this.cache.set(key, entry)
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.expires - Date.now()
      }))
    }
  }

  /**
   * Utility: Sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Factory function to create API client
 */
export function createUniversalAPIClient(config: UniversalAPIConfig): UniversalAPIClient {
  return new UniversalAPIClient(config)
}

/**
 * Hook for React components (requires auth context)
 */
export function useUniversalAPI(baseUrl: string) {
  // This would be used with the auth provider
  return new UniversalAPIClient({
    baseUrl,
    getAuthToken: async () => {
      // Get token from auth context
      return null // Placeholder
    }
  })
}
