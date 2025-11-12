/**
 * Enterprise-Grade Prefetching Service
 * Smart Code: HERA.PERFORMANCE.PREFETCH.SERVICE.v1
 * 
 * Beats SAP performance with aggressive prefetching and intelligent caching
 */

interface PrefetchConfig {
  priority: 'high' | 'medium' | 'low'
  preload: boolean
  cache: boolean
  staleTime: number // milliseconds
}

interface CacheEntry {
  data: any
  timestamp: number
  staleTime: number
  route: string
}

class PrefetchService {
  private cache = new Map<string, CacheEntry>()
  private prefetchQueue: Array<{ url: string; config: PrefetchConfig }> = []
  private isProcessing = false
  private prefetchedRoutes = new Set<string>()

  // Critical navigation paths - prefetch immediately (universal routing - NO /apps)
  // NOTE: Only prefetch routes relevant to current app context
  private criticalRoutes: string[] = []

  // Secondary routes - prefetch on hover or interaction (universal routing - NO /apps)
  private secondaryRoutes: string[] = []

  constructor() {
    // Detect current app context from URL and only prefetch relevant routes
    this.initializePrefetching()
  }

  /**
   * Initialize aggressive prefetching for enterprise performance
   */
  private async initializePrefetching() {
    // Skip prefetch initialization during SSR
    if (typeof window === 'undefined') {
      return
    }

    // Detect app context from current URL and set appropriate routes
    this.detectAppContext()

    // Prefetch critical routes immediately (only if routes are configured)
    if (this.criticalRoutes.length > 0) {
      await this.prefetchCriticalRoutes()
    }

    // Set up intersection observer for hover prefetching
    this.setupHoverPrefetching()

    // Set up idle time prefetching
    this.setupIdlePrefetching()

    // Clean up stale cache entries every 5 minutes
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000)
  }

  /**
   * Detect current app context and set appropriate prefetch routes
   */
  private detectAppContext() {
    if (typeof window === 'undefined') return

    const pathname = window.location.pathname

    // Detect app from URL
    if (pathname.startsWith('/salon')) {
      // Salon app: Disable prefetching until API endpoints are available
      this.criticalRoutes = []
      this.secondaryRoutes = []
      console.log('🎨 PrefetchService: Salon app context detected - prefetching disabled (API endpoints pending)')
    } else if (pathname.startsWith('/retail')) {
      this.criticalRoutes = [
        '/api/v2/platform/navigation/retail',
        '/api/v2/platform/workspace/retail/pos/main',
        '/retail/pos/main',
        '/retail/inventory',
        '/retail/customers'
      ]
      this.secondaryRoutes = [
        '/retail/reports',
        '/retail/analytics'
      ]
      console.log('🛒 PrefetchService: Retail app context detected')
    } else if (pathname.startsWith('/restaurant')) {
      this.criticalRoutes = [
        '/restaurant/orders',
        '/restaurant/menu',
        '/restaurant/tables'
      ]
      console.log('🍽️ PrefetchService: Restaurant app context detected')
    } else {
      // No specific app context - disable aggressive prefetching
      console.log('⚠️ PrefetchService: No specific app context, prefetching disabled')
    }
  }

  /**
   * Prefetch critical routes immediately for instant navigation
   */
  async prefetchCriticalRoutes() {
    const prefetchPromises = this.criticalRoutes.map(route =>
      this.prefetchRoute(route, {
        priority: 'high',
        preload: true,
        cache: true,
        staleTime: 5 * 60 * 1000 // 5 minutes
      })
    )

    await Promise.allSettled(prefetchPromises)
    console.log(`🚀 Critical routes prefetched: ${this.criticalRoutes.length} routes for instant navigation`)
  }

  /**
   * Setup hover-based prefetching for secondary routes
   */
  private setupHoverPrefetching() {
    // Check if we're in the browser environment
    if (typeof document === 'undefined') return
    
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement
      const link = target.closest('a') || target.closest('[data-prefetch]')
      
      if (link) {
        const href = link.getAttribute('href') || link.getAttribute('data-prefetch')
        if (href && !this.prefetchedRoutes.has(href)) {
          this.prefetchRoute(href, {
            priority: 'medium',
            preload: false,
            cache: true,
            staleTime: 2 * 60 * 1000 // 2 minutes
          })
        }
      }
    })
  }

  /**
   * Setup idle time prefetching for non-critical routes
   */
  private setupIdlePrefetching() {
    // Check if we're in the browser environment
    if (typeof document === 'undefined') return
    
    let idleTimer: NodeJS.Timeout

    const resetIdleTimer = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        this.prefetchSecondaryRoutes()
      }, 2000) // 2 seconds of idle time
    }

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(name => {
      document.addEventListener(name, resetIdleTimer, { passive: true })
    })

    resetIdleTimer()
  }

  /**
   * Prefetch secondary routes during idle time
   */
  private async prefetchSecondaryRoutes() {
    const unprefetched = this.secondaryRoutes.filter(route => !this.prefetchedRoutes.has(route))
    
    for (const route of unprefetched) {
      await this.prefetchRoute(route, {
        priority: 'low',
        preload: false,
        cache: true,
        staleTime: 10 * 60 * 1000 // 10 minutes
      })
      
      // Small delay between requests to not overwhelm
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  /**
   * Intelligent route prefetching with caching
   */
  async prefetchRoute(route: string, config: PrefetchConfig): Promise<any> {
    // Check cache first
    const cached = this.getFromCache(route)
    if (cached && !this.isStale(cached)) {
      return cached.data
    }

    // Skip if already in queue or processing
    if (this.prefetchQueue.some(item => item.url === route) || this.prefetchedRoutes.has(route)) {
      return null
    }

    // Add to queue
    this.prefetchQueue.push({ url: route, config })
    this.prefetchedRoutes.add(route)

    // Process queue
    return this.processQueue()
  }

  /**
   * Process prefetch queue with priority ordering
   */
  private async processQueue() {
    if (this.isProcessing) return

    this.isProcessing = true

    // Sort by priority
    this.prefetchQueue.sort((a, b) => {
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 }
      return priorityOrder[a.config.priority] - priorityOrder[b.config.priority]
    })

    while (this.prefetchQueue.length > 0) {
      const { url, config } = this.prefetchQueue.shift()!

      try {
        const data = await this.fetchRoute(url, config)
        
        if (config.cache && data) {
          this.setCache(url, data, config.staleTime)
        }

        // Yield control to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 0))

      } catch (error) {
        console.warn(`Prefetch failed for ${url}:`, error)
      }
    }

    this.isProcessing = false
  }

  /**
   * Fetch route with appropriate strategy
   */
  private async fetchRoute(url: string, config: PrefetchConfig): Promise<any> {
    // Skip prefetch during SSR
    if (typeof window === 'undefined') {
      return null
    }
    
    const controller = new AbortController()
    
    // Timeout for low priority requests
    if (config.priority === 'low') {
      setTimeout(() => controller.abort(), 5000)
    }

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'X-Prefetch': 'true',
          'Cache-Control': 'public, max-age=300' // 5 minutes
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ Prefetched: ${url} (${config.priority} priority)`)
      
      return data

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`⏰ Prefetch timeout: ${url}`)
      }
      throw error
    }
  }

  /**
   * Get data from cache
   */
  getFromCache(route: string): CacheEntry | null {
    return this.cache.get(route) || null
  }

  /**
   * Set data in cache
   */
  private setCache(route: string, data: any, staleTime: number) {
    this.cache.set(route, {
      data,
      timestamp: Date.now(),
      staleTime,
      route
    })
  }

  /**
   * Check if cache entry is stale
   */
  private isStale(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.staleTime
  }

  /**
   * Clean up stale cache entries
   */
  private cleanupCache() {
    const now = Date.now()
    for (const [route, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.staleTime * 2) {
        this.cache.delete(route)
      }
    }
    
    console.log(`🧹 Cache cleanup: ${this.cache.size} entries remaining`)
  }

  /**
   * Get cached data or fetch fresh
   */
  async getCachedOrFetch(route: string): Promise<any> {
    const cached = this.getFromCache(route)
    
    if (cached && !this.isStale(cached)) {
      console.log(`⚡ Instant from cache: ${route}`)
      return cached.data
    }

    // Stale-while-revalidate: return stale data and fetch fresh
    if (cached) {
      console.log(`🔄 Stale-while-revalidate: ${route}`)
      this.prefetchRoute(route, {
        priority: 'high',
        preload: true,
        cache: true,
        staleTime: 5 * 60 * 1000
      })
      return cached.data
    }

    // No cache - fetch immediately
    return this.fetchRoute(route, {
      priority: 'high',
      preload: true,
      cache: true,
      staleTime: 5 * 60 * 1000
    })
  }

  /**
   * Preload specific routes with high priority
   */
  async preloadRoutes(routes: string[]) {
    const promises = routes.map(route => 
      this.prefetchRoute(route, {
        priority: 'high',
        preload: true,
        cache: true,
        staleTime: 5 * 60 * 1000
      })
    )

    await Promise.allSettled(promises)
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear()
    this.prefetchedRoutes.clear()
    console.log('🗑️ Cache cleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const entries = Array.from(this.cache.values())
    const now = Date.now()
    
    return {
      totalEntries: this.cache.size,
      staleEntries: entries.filter(entry => this.isStale(entry)).length,
      freshEntries: entries.filter(entry => !this.isStale(entry)).length,
      oldestEntry: Math.min(...entries.map(entry => now - entry.timestamp)),
      newestEntry: Math.max(...entries.map(entry => now - entry.timestamp)),
      totalSize: JSON.stringify(Array.from(this.cache.values())).length
    }
  }
}

// Singleton instance
export const prefetchService = new PrefetchService()

// React hook for easy integration
export function usePrefetch() {
  return {
    getCachedOrFetch: prefetchService.getCachedOrFetch.bind(prefetchService),
    preloadRoutes: prefetchService.preloadRoutes.bind(prefetchService),
    getCacheStats: prefetchService.getCacheStats.bind(prefetchService),
    clearCache: prefetchService.clearCache.bind(prefetchService)
  }
}