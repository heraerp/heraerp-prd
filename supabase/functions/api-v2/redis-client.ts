// Redis Client Wrapper for Upstash Redis
// Provides connection pooling, error handling, and HERA-specific caching patterns

import { connect, RedisCommands } from 'https://deno.land/x/redis@v0.32.1/mod.ts'

interface CacheConfig {
  ttl: number // TTL in seconds
  prefix: string // Cache key prefix
  compression?: boolean // Enable compression for large values
}

interface RateLimitConfig {
  windowMs: number // Window size in milliseconds
  maxRequests: number // Max requests per window
  keyGenerator: (actorId: string, orgId: string) => string
}

class HERARedisClient {
  private client: RedisCommands | null = null
  private connecting = false
  private connectionPromise: Promise<RedisCommands> | null = null

  constructor(
    private url: string,
    private token: string
  ) {}

  /**
   * Get Redis connection (lazy initialization with connection pooling)
   */
  private async getConnection(): Promise<RedisCommands> {
    if (this.client) return this.client

    // Prevent multiple concurrent connections
    if (this.connecting && this.connectionPromise) {
      return await this.connectionPromise
    }

    this.connecting = true
    this.connectionPromise = this.connect()
    
    try {
      this.client = await this.connectionPromise
      console.log('✅ Redis connection established')
      return this.client
    } catch (error) {
      this.connecting = false
      this.connectionPromise = null
      throw error
    } finally {
      this.connecting = false
    }
  }

  /**
   * Establish Redis connection
   */
  private async connect(): Promise<RedisCommands> {
    try {
      // Parse Upstash Redis URL format: redis://:password@host:port
      const urlObj = new URL(this.url)
      const host = urlObj.hostname
      const port = parseInt(urlObj.port) || 6379
      const password = this.token || urlObj.password

      console.log(`🔌 Connecting to Redis at ${host}:${port}...`)

      const client = await connect({
        hostname: host,
        port: port,
        password: password,
        // Connection settings for Deno
        tls: this.url.startsWith('rediss://'),
        // Connection pool settings
        maxRetryCount: 3,
        retryDelayMs: 100
      })

      // Test connection
      await client.ping()
      console.log('✅ Redis connection verified with PING')

      return client
    } catch (error) {
      console.error('❌ Redis connection failed:', error)
      throw new Error(`Redis connection failed: ${error.message}`)
    }
  }

  /**
   * Actor Identity Caching (resolve_user_identity_v1 results)
   */
  async cacheActorIdentity(
    authUid: string, 
    identity: any, 
    config: CacheConfig = { ttl: 300, prefix: 'actor_identity' }
  ): Promise<void> {
    try {
      const client = await this.getConnection()
      const key = `${config.prefix}:${authUid}`
      const value = JSON.stringify(identity)
      
      await client.setex(key, config.ttl, value)
      console.log(`✅ Cached actor identity for ${authUid.slice(0, 8)} (TTL: ${config.ttl}s)`)
    } catch (error) {
      console.warn('⚠️ Failed to cache actor identity:', error.message)
      // Don't throw - caching failure shouldn't break the request
    }
  }

  /**
   * Get cached actor identity
   */
  async getActorIdentity(authUid: string, prefix = 'actor_identity'): Promise<any | null> {
    try {
      const client = await this.getConnection()
      const key = `${prefix}:${authUid}`
      const cached = await client.get(key)
      
      if (cached) {
        console.log(`⚡ Actor identity cache hit for ${authUid.slice(0, 8)}`)
        return JSON.parse(cached)
      }
      
      console.log(`❌ Actor identity cache miss for ${authUid.slice(0, 8)}`)
      return null
    } catch (error) {
      console.warn('⚠️ Failed to get cached actor identity:', error.message)
      return null // Cache miss on error
    }
  }

  /**
   * Rate Limiting with Sliding Window
   */
  async checkRateLimit(
    actorId: string, 
    orgId: string, 
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    try {
      const client = await this.getConnection()
      const key = config.keyGenerator(actorId, orgId)
      const now = Date.now()
      const windowStart = now - config.windowMs

      // Use Redis Lua script for atomic sliding window rate limiting
      const luaScript = `
        local key = KEYS[1]
        local window_start = tonumber(ARGV[1])
        local current_time = tonumber(ARGV[2])
        local max_requests = tonumber(ARGV[3])
        local window_ms = tonumber(ARGV[4])

        -- Remove expired entries
        redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

        -- Count current requests in window
        local current_count = redis.call('ZCARD', key)

        if current_count < max_requests then
          -- Add current request
          redis.call('ZADD', key, current_time, current_time)
          -- Set expiration for cleanup
          redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
          
          return {1, max_requests - current_count - 1, current_time + window_ms}
        else
          -- Rate limit exceeded
          local oldest_request = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
          local reset_time = 0
          if oldest_request[2] then
            reset_time = oldest_request[2] + window_ms
          end
          
          return {0, 0, reset_time}
        end
      `

      const result = await client.eval(
        luaScript,
        [key],
        [windowStart.toString(), now.toString(), config.maxRequests.toString(), config.windowMs.toString()]
      ) as number[]

      const allowed = result[0] === 1
      const remaining = result[1]
      const resetTime = result[2]

      if (!allowed) {
        const retryAfter = Math.ceil((resetTime - now) / 1000)
        console.log(`🚫 Rate limit exceeded for actor ${actorId.slice(0, 8)} in org ${orgId.slice(0, 8)}`)
        return { allowed, remaining, resetTime, retryAfter }
      }

      console.log(`✅ Rate limit check passed: ${remaining} remaining for ${actorId.slice(0, 8)}`)
      return { allowed, remaining, resetTime }

    } catch (error) {
      console.warn('⚠️ Rate limit check failed:', error.message)
      // On Redis error, allow request (fail open for availability)
      return { 
        allowed: true, 
        remaining: config.maxRequests - 1, 
        resetTime: Date.now() + config.windowMs 
      }
    }
  }

  /**
   * Idempotency Check
   */
  async checkIdempotency(
    idempotencyKey: string, 
    actorId: string, 
    orgId: string,
    ttl = 86400 // 24 hours default
  ): Promise<{
    isDuplicate: boolean
    existingResponse?: any
    stored: boolean
  }> {
    try {
      const client = await this.getConnection()
      const key = `idempotency:${orgId}:${actorId}:${idempotencyKey}`
      
      const existing = await client.get(key)
      if (existing) {
        console.log(`🔄 Duplicate request detected: ${idempotencyKey.slice(0, 16)}...`)
        return {
          isDuplicate: true,
          existingResponse: JSON.parse(existing),
          stored: false
        }
      }

      console.log(`✅ New request: ${idempotencyKey.slice(0, 16)}...`)
      return { isDuplicate: false, stored: false }

    } catch (error) {
      console.warn('⚠️ Idempotency check failed:', error.message)
      // On Redis error, allow request (fail open)
      return { isDuplicate: false, stored: false }
    }
  }

  /**
   * Store idempotency response
   */
  async storeIdempotencyResponse(
    idempotencyKey: string,
    actorId: string,
    orgId: string,
    response: any,
    ttl = 86400
  ): Promise<void> {
    try {
      const client = await this.getConnection()
      const key = `idempotency:${orgId}:${actorId}:${idempotencyKey}`
      const value = JSON.stringify(response)
      
      await client.setex(key, ttl, value)
      console.log(`✅ Stored idempotency response: ${idempotencyKey.slice(0, 16)}...`)
    } catch (error) {
      console.warn('⚠️ Failed to store idempotency response:', error.message)
      // Don't throw - storage failure shouldn't break the response
    }
  }

  /**
   * General purpose caching
   */
  async cache(
    key: string, 
    value: any, 
    ttl: number,
    prefix = 'hera_cache'
  ): Promise<void> {
    try {
      const client = await this.getConnection()
      const fullKey = `${prefix}:${key}`
      const serialized = JSON.stringify(value)
      
      await client.setex(fullKey, ttl, serialized)
      console.log(`✅ Cached ${key} (TTL: ${ttl}s)`)
    } catch (error) {
      console.warn(`⚠️ Failed to cache ${key}:`, error.message)
    }
  }

  /**
   * Get cached value
   */
  async get(key: string, prefix = 'hera_cache'): Promise<any | null> {
    try {
      const client = await this.getConnection()
      const fullKey = `${prefix}:${key}`
      const cached = await client.get(fullKey)
      
      if (cached) {
        console.log(`⚡ Cache hit: ${key}`)
        return JSON.parse(cached)
      }
      
      console.log(`❌ Cache miss: ${key}`)
      return null
    } catch (error) {
      console.warn(`⚠️ Failed to get cached ${key}:`, error.message)
      return null
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    latency?: number
    error?: string
  }> {
    try {
      const start = Date.now()
      const client = await this.getConnection()
      
      await client.ping()
      const latency = Date.now() - start
      
      console.log(`✅ Redis health check passed (${latency}ms)`)
      return { status: 'healthy', latency }
    } catch (error) {
      console.error('❌ Redis health check failed:', error)
      return { status: 'unhealthy', error: error.message }
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit()
        console.log('✅ Redis connection closed')
      } catch (error) {
        console.warn('⚠️ Error closing Redis connection:', error.message)
      }
      this.client = null
    }
  }
}

// Factory function for creating Redis client
export function createRedisClient(): HERARedisClient | null {
  const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL')
  const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')

  if (!redisUrl || !redisToken) {
    console.warn('⚠️ Redis environment variables not set, caching disabled')
    return null
  }

  return new HERARedisClient(redisUrl, redisToken)
}

// Singleton instance for reuse
let globalRedisClient: HERARedisClient | null = null

export function getRedisClient(): HERARedisClient | null {
  if (!globalRedisClient) {
    globalRedisClient = createRedisClient()
  }
  return globalRedisClient
}

export { HERARedisClient }