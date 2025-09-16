/**
 * URP Cache Manager
 * Smart Code: HERA.URP.CACHE.MANAGER.v1
 *
 * Organization-scoped caching for report data
 */

interface CacheEntry {
  key: string
  data: any
  timestamp: number
  ttl: number
  organizationId: string
  recipeName: string
  parameters: Record<string, any>
}

class URPCacheManager {
  private cache: Map<string, CacheEntry> = new Map()

  /**
   * Generate cache key from components
   */
  private generateKey(
    organizationId: string,
    recipeName: string,
    parameters: Record<string, any>
  ): string {
    const paramStr = JSON.stringify(parameters, Object.keys(parameters).sort())
    return `${organizationId}:${recipeName}:${paramStr}`
  }

  /**
   * Get cached data if available and not expired
   */
  async get(
    organizationId: string,
    recipeName: string,
    parameters: Record<string, any>
  ): Promise<any | null> {
    const key = this.generateKey(organizationId, recipeName, parameters)
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check if expired
    if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Store data in cache
   */
  async set(
    organizationId: string,
    recipeName: string,
    parameters: Record<string, any>,
    data: any,
    ttl: number = 300 // 5 minutes default
  ): Promise<void> {
    const key = this.generateKey(organizationId, recipeName, parameters)

    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      organizationId,
      recipeName,
      parameters
    })

    // Clean up expired entries periodically
    if (this.cache.size > 1000) {
      this.cleanup()
    }
  }

  /**
   * Clear cache for specific recipe or all recipes
   */
  async clear(organizationId: string, recipeName?: string): Promise<void> {
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (entry.organizationId === organizationId) {
        if (!recipeName || entry.recipeName === recipeName) {
          keysToDelete.push(key)
        }
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Clear all cache entries for an organization
   */
  async clearAll(organizationId: string): Promise<void> {
    await this.clear(organizationId)
  }

  /**
   * Get cache statistics
   */
  getStats(organizationId?: string): {
    totalEntries: number
    organizationEntries?: number
    sizeInBytes: number
    oldestEntry?: Date
    newestEntry?: Date
  } {
    let stats = {
      totalEntries: this.cache.size,
      sizeInBytes: 0,
      oldestEntry: undefined as Date | undefined,
      newestEntry: undefined as Date | undefined
    }

    let orgCount = 0
    let oldestTimestamp = Infinity
    let newestTimestamp = 0

    this.cache.forEach(entry => {
      // Rough size estimate
      stats.sizeInBytes += JSON.stringify(entry).length

      if (organizationId && entry.organizationId === organizationId) {
        orgCount++
      }

      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
      }

      if (entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp
      }
    })

    if (organizationId) {
      stats = { ...stats, organizationEntries: orgCount }
    }

    if (oldestTimestamp !== Infinity) {
      stats.oldestEntry = new Date(oldestTimestamp)
    }

    if (newestTimestamp !== 0) {
      stats.newestEntry = new Date(newestTimestamp)
    }

    return stats
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (entry.ttl > 0 && now - entry.timestamp > entry.ttl * 1000) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Export cache for persistence (if needed)
   */
  export(): CacheEntry[] {
    return Array.from(this.cache.values())
  }

  /**
   * Import cache from persistence
   */
  import(entries: CacheEntry[]): void {
    entries.forEach(entry => {
      this.cache.set(entry.key, entry)
    })

    // Clean up expired entries after import
    this.cleanup()
  }
}

// Export singleton instance
export const cacheManager = new URPCacheManager()
