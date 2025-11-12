// Client-side caching for resolve-membership API calls
// Prevents multiple calls during page load and provides stale-while-revalidate

interface CachedMembershipResponse {
  data: any
  timestamp: number
  etag?: string
}

class MembershipCache {
  private cache = new Map<string, CachedMembershipResponse>()
  private inflightRequests = new Map<string, Promise<any>>()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes
  private readonly STALE_TTL = 15 * 60 * 1000 // 15 minutes for stale-while-revalidate

  /**
   * Get cached membership data with stale-while-revalidate pattern
   */
  async getMembership(
    token: string, 
    userId: string,
    forceRefresh = false
  ): Promise<any> {
    const cacheKey = this.getCacheKey(token, userId)
    const now = Date.now()
    
    // Check for in-flight request
    const inflightRequest = this.inflightRequests.get(cacheKey)
    if (inflightRequest && !forceRefresh) {
      console.log('🔄 Using in-flight membership request')
      return await inflightRequest
    }
    
    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && !forceRefresh) {
      const age = now - cached.timestamp
      
      // Fresh cache hit (< 5 minutes)
      if (age < this.TTL) {
        console.log(`⚡ Fresh cache hit for membership (${Math.round(age/1000)}s old)`)
        return cached.data
      }
      
      // Stale cache hit (5-15 minutes) - return stale, fetch fresh in background
      if (age < this.STALE_TTL) {
        console.log(`🔄 Stale cache hit for membership (${Math.round(age/1000)}s old), refreshing in background`)
        // Return stale data immediately
        this.refreshInBackground(token, userId, cacheKey)
        return cached.data
      }
      
      // Expired cache (> 15 minutes) - remove and fetch fresh
      console.log(`🗑️ Expired cache for membership (${Math.round(age/1000)}s old), fetching fresh`)
      this.cache.delete(cacheKey)
    }
    
    // Cache miss or expired - fetch fresh
    return await this.fetchFresh(token, userId, cacheKey)
  }

  /**
   * Fetch fresh membership data
   */
  private async fetchFresh(token: string, userId: string, cacheKey: string): Promise<any> {
    const fetchPromise = this.doFetch(token, userId)
    
    // Store in-flight request to prevent duplicates
    this.inflightRequests.set(cacheKey, fetchPromise)
    
    try {
      const data = await fetchPromise
      
      // Cache the response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })
      
      console.log('✅ Fresh membership data cached')
      return data
      
    } finally {
      // Clean up in-flight request
      this.inflightRequests.delete(cacheKey)
    }
  }

  /**
   * Background refresh for stale-while-revalidate
   */
  private async refreshInBackground(token: string, userId: string, cacheKey: string): Promise<void> {
    // Don't block on background refresh
    setTimeout(async () => {
      try {
        console.log('🔄 Background refresh starting')
        await this.fetchFresh(token, userId, cacheKey)
        console.log('✅ Background refresh completed')
      } catch (error) {
        console.warn('⚠️ Background refresh failed:', error)
        // Keep stale data on background refresh failure
      }
    }, 0)
  }

  /**
   * Actual fetch implementation
   * 🔴 CRITICAL FIX: Add timeout to prevent indefinite hanging
   */
  private async doFetch(token: string, userId: string): Promise<any> {
    console.log(`🌐 Fetching fresh membership for user ${userId.slice(0, 8)}...`)

    // 🔴 FIX: Add 10-second timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch('/api/v2/auth/resolve-membership', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache' // Ensure we get fresh data from server
        },
        signal: controller.signal // Add abort signal for timeout
        // Remove 'no-store' to allow browser cache coordination
      })

      clearTimeout(timeoutId) // Clear timeout on success

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorCode = errorData.error || `HTTP ${response.status}`
        throw new Error(`Membership resolution failed: ${errorCode}`)
      }

      const data = await response.json()
      console.log(`✅ Fresh membership fetched for user ${userId.slice(0, 8)}`)
      return data

    } catch (error: any) {
      clearTimeout(timeoutId) // Clear timeout on error

      if (error.name === 'AbortError') {
        console.error('⚠️ Membership API timeout after 10 seconds')
        throw new Error('Membership resolution timeout - please try again')
      }
      throw error
    }
  }

  /**
   * Generate cache key from token and user ID
   */
  private getCacheKey(token: string, userId: string): string {
    // Use first 16 chars of token + user ID for cache key
    return `${token.slice(0, 16)}:${userId}`
  }

  /**
   * Clear cache for a specific user
   */
  clearUser(token: string, userId: string): void {
    const cacheKey = this.getCacheKey(token, userId)
    this.cache.delete(cacheKey)
    this.inflightRequests.delete(cacheKey)
    console.log(`🗑️ Cleared membership cache for user ${userId.slice(0, 8)}`)
  }

  /**
   * Clear all cached data
   */
  clearAll(): void {
    this.cache.clear()
    this.inflightRequests.clear()
    console.log('🗑️ Cleared all membership cache')
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cacheSize: number
    inflightRequests: number
    entries: Array<{key: string, age: number}>
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key: key.slice(0, 20) + '...', // Truncate for privacy
      age: Math.round((now - value.timestamp) / 1000)
    }))

    return {
      cacheSize: this.cache.size,
      inflightRequests: this.inflightRequests.size,
      entries
    }
  }
}

// Singleton instance
export const membershipCache = new MembershipCache()

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).__membershipCache = membershipCache
}