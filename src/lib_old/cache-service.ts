/**
 * Production-Ready Caching Service
 * High-performance caching with Redis fallback to memory
 */

import Redis from 'ioredis'

export interface CacheOptions {
  defaultTtl: number // Default TTL in seconds
  maxSize: number // Max items in memory cache
  redisUrl?: string // Redis connection URL
  keyPrefix?: string // Prefix for all cache keys
}

export interface CacheSetOptions {
  ttl?: number // Override default TTL
  tags?: string[] // Cache invalidation tags
}

export class CacheService {
  private redis: Redis | null = null
  private memoryCache = new Map<string, CacheItem>()
  private readonly options: Required<CacheOptions>

  constructor(options: CacheOptions) {
    this.options = {
      keyPrefix: 'hera:cache:',
      redisUrl: process.env.REDIS_URL,
      ...options
    }

    // Initialize Redis if URL provided
    if (this.options.redisUrl) {
      this.initializeRedis()
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.options.keyPrefix + key

    try {
      // Try Redis first
      if (this.redis) {
        const value = await this.redis.get(fullKey)
        if (value !== null) {
          const parsed = JSON.parse(value) as CacheItem<T>
          if (this.isExpired(parsed)) {
            await this.redis.del(fullKey)
            return null
          }
          return parsed.value
        }
      }

      // Fallback to memory cache
      const item = this.memoryCache.get(fullKey)
      if (item && !this.isExpired(item)) {
        return item.value as T
      }

      // Clean up expired item
      if (item) {
        this.memoryCache.delete(fullKey)
      }

      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheSetOptions = {}): Promise<void> {
    const fullKey = this.options.keyPrefix + key
    const ttl = options.ttl || this.options.defaultTtl
    const expiresAt = Date.now() + ttl * 1000

    const item: CacheItem<T> = {
      value,
      expiresAt,
      tags: options.tags || []
    }

    try {
      // Store in Redis
      if (this.redis) {
        await this.redis.setex(fullKey, ttl, JSON.stringify(item))
      }

      // Store in memory cache (with size limit)
      this.ensureCacheSize()
      this.memoryCache.set(fullKey, item)
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Delete specific cache key
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.options.keyPrefix + key

    try {
      if (this.redis) {
        await this.redis.del(fullKey)
      }
      this.memoryCache.delete(fullKey)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  /**
   * Increment counter (useful for rate limiting)
   */
  async increment(key: string, amount: number = 1, options: CacheSetOptions = {}): Promise<number> {
    const fullKey = this.options.keyPrefix + key

    try {
      if (this.redis) {
        const value = await this.redis.incrby(fullKey, amount)
        if (options.ttl) {
          await this.redis.expire(fullKey, options.ttl)
        }
        return value
      }

      // Memory fallback
      const current = (await this.get<number>(key)) || 0
      const newValue = current + amount
      await this.set(key, newValue, options)
      return newValue
    } catch (error) {
      console.error('Cache increment error:', error)
      return amount // Return increment amount as fallback
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      if (this.redis) {
        // Redis-based tag invalidation (requires Redis modules or custom implementation)
        // For simplicity, we'll iterate through keys
        const pattern = this.options.keyPrefix + '*'
        const keys = await this.redis.keys(pattern)

        for (const key of keys) {
          const value = await this.redis.get(key)
          if (value) {
            const item = JSON.parse(value) as CacheItem
            if (item.tags?.some(tag => tags.includes(tag))) {
              await this.redis.del(key)
            }
          }
        }
      }

      // Memory cache tag invalidation
      for (const [key, item] of this.memoryCache.entries()) {
        if (item.tags?.some(tag => tags.includes(tag))) {
          this.memoryCache.delete(key)
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.redis) {
        const pattern = this.options.keyPrefix + '*'
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      }
      this.memoryCache.clear()
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number
    redisConnected: boolean
    memoryItems: number
  } {
    return {
      memorySize: this.calculateMemorySize(),
      redisConnected: this.redis?.status === 'ready',
      memoryItems: this.memoryCache.size
    }
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private initializeRedis(): void {
    try {
      this.redis = new Redis(this.options.redisUrl!, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        // Connection pool settings
        family: 4,
        keepAlive: 30000,
        // Error handling
        showFriendlyErrorStack: process.env.NODE_ENV === 'development'
      })

      this.redis.on('error', error => {
        console.error('Redis connection error:', error)
      })

      this.redis.on('connect', () => {
        console.log('Redis connected successfully')
      })

      this.redis.on('ready', () => {
        console.log('Redis ready for operations')
      })
    } catch (error) {
      console.error('Failed to initialize Redis:', error)
      this.redis = null
    }
  }

  private isExpired<T>(item: CacheItem<T>): boolean {
    return Date.now() > item.expiresAt
  }

  private ensureCacheSize(): void {
    if (this.memoryCache.size >= this.options.maxSize) {
      // Remove oldest entries (simple LRU approximation)
      const keysToRemove = Math.floor(this.options.maxSize * 0.1) // Remove 10%
      let removed = 0

      for (const key of this.memoryCache.keys()) {
        if (removed >= keysToRemove) break
        this.memoryCache.delete(key)
        removed++
      }
    }
  }

  private calculateMemorySize(): number {
    let size = 0
    for (const [key, value] of this.memoryCache.entries()) {
      size += key.length + JSON.stringify(value).length
    }
    return size
  }
}

// ============================================================================
// CACHE INTERFACES
// ============================================================================

interface CacheItem<T = any> {
  value: T
  expiresAt: number
  tags?: string[]
}

// ============================================================================
// CACHE DECORATORS FOR METHODS
// ============================================================================

/**
 * Cache decorator for class methods
 */
export function Cacheable(keyGenerator: (...args: any[]) => string, options: CacheSetOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cache = (this as any).cache as CacheService
      if (!cache) {
        return method.apply(this, args)
      }

      const cacheKey = keyGenerator(...args)

      // Try to get from cache
      let result = await cache.get(cacheKey)

      if (result === null) {
        // Execute method and cache result
        result = await method.apply(this, args)
        await cache.set(cacheKey, result, options)
      }

      return result
    }
  }
}

export default CacheService
