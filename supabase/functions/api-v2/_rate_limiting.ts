/**
 * HERA API v2 - Redis-backed Rate Limiting System
 * Smart Code: HERA.API.V2.RATE_LIMITING.REDIS.v1
 * 
 * Token bucket algorithm with Redis persistence
 * READ: 300/min, WRITE: 60/min, FINANCE: 30/min per organization
 */

// Redis client interface (reusing from idempotency)
interface RedisClient {
  get(key: string): Promise<string | null>
  setex(key: string, ttl: number, value: string): Promise<void>
  del(key: string): Promise<void>
  incr(key: string): Promise<number>
  expire(key: string, ttl: number): Promise<void>
}

// Simple Redis implementation for Deno environment
class UpstashRedisClient implements RedisClient {
  private baseUrl: string
  private token: string

  constructor(url: string, token: string) {
    this.baseUrl = url
    this.token = token
  }

  async get(key: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/get/${encodeURIComponent(key)}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      return data.result
    } catch {
      return null
    }
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/setex/${encodeURIComponent(key)}/${ttl}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(value)
      })
    } catch (error) {
      console.error('Redis SETEX failed:', error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/del/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      })
    } catch (error) {
      console.error('Redis DEL failed:', error)
    }
  }

  async incr(key: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/incr/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) return 1
      
      const data = await response.json()
      return data.result || 1
    } catch {
      return 1
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/expire/${encodeURIComponent(key)}/${ttl}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      })
    } catch (error) {
      console.error('Redis EXPIRE failed:', error)
    }
  }
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export interface RateLimitConfig {
  keyPrefix: string
  windowSeconds: number
  limits: {
    READ: number      // 300 requests per minute
    WRITE: number     // 60 requests per minute  
    FINANCE: number   // 30 requests per minute
  }
}

/**
 * Enterprise Rate Limiting Manager
 */
export class RateLimitManager {
  private redis: RedisClient | null = null
  private config: RateLimitConfig
  private fallbackMemory: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      keyPrefix: 'hera:api:v2:rate_limit',
      windowSeconds: 60, // 1-minute sliding window
      limits: {
        READ: 300,   // 300 reads per minute
        WRITE: 60,   // 60 writes per minute
        FINANCE: 30  // 30 finance operations per minute
      },
      ...config
    }

    // Initialize Redis if environment variables are available
    const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL')
    const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')
    
    if (redisUrl && redisToken) {
      this.redis = new UpstashRedisClient(redisUrl, redisToken)
    } else {
      console.warn('⚠️ Redis not configured - rate limiting will use in-memory fallback')
    }
  }

  /**
   * Classify operation type for rate limiting
   */
  classifyOperation(operation: string, endpoint: string): keyof RateLimitConfig['limits'] {
    const op = operation.toUpperCase()
    
    // Finance operations (highest security)
    if (endpoint.includes('/transactions') || 
        op === 'APPROVE' || 
        op === 'REVERSE' ||
        endpoint.includes('/finance') ||
        endpoint.includes('/accounting')) {
      return 'FINANCE'
    }
    
    // Write operations (medium security)
    if (['CREATE', 'UPDATE', 'DELETE', 'UPSERT', 'PATCH'].includes(op)) {
      return 'WRITE'
    }
    
    // Default to read operations (lowest restriction)
    return 'READ'
  }

  /**
   * Generate rate limit key
   */
  generateRateLimitKey(
    orgId: string,
    actorId: string,
    operationType: keyof RateLimitConfig['limits']
  ): string {
    // Rate limit per organization and operation type
    return `${this.config.keyPrefix}:${orgId}:${operationType}:${Math.floor(Date.now() / (this.config.windowSeconds * 1000))}`
  }

  /**
   * Check rate limit using token bucket algorithm
   */
  async checkRateLimit(
    orgId: string,
    actorId: string,
    operation: string,
    endpoint: string
  ): Promise<RateLimitResult> {
    const operationType = this.classifyOperation(operation, endpoint)
    const limit = this.config.limits[operationType]
    const rateLimitKey = this.generateRateLimitKey(orgId, actorId, operationType)
    
    const currentTime = Date.now()
    const windowStart = Math.floor(currentTime / (this.config.windowSeconds * 1000)) * this.config.windowSeconds * 1000
    const resetTime = windowStart + (this.config.windowSeconds * 1000)

    if (this.redis) {
      return this.checkRateLimitRedis(rateLimitKey, limit, resetTime, operationType)
    } else {
      return this.checkRateLimitMemory(rateLimitKey, limit, resetTime, currentTime)
    }
  }

  /**
   * Redis-based rate limiting
   */
  private async checkRateLimitRedis(
    key: string,
    limit: number,
    resetTime: number,
    operationType: string
  ): Promise<RateLimitResult> {
    try {
      // Increment counter for this window
      const currentCount = await this.redis!.incr(key)
      
      // Set expiration for the key (cleanup)
      if (currentCount === 1) {
        await this.redis!.expire(key, this.config.windowSeconds + 10) // +10s buffer
      }

      const remaining = Math.max(0, limit - currentCount)
      const allowed = currentCount <= limit

      if (!allowed) {
        console.log(`🛑 Rate limit exceeded: ${operationType} (${currentCount}/${limit}) for key: ${key}`)
      }

      return {
        allowed,
        limit,
        remaining,
        resetTime,
        retryAfter: allowed ? undefined : Math.ceil((resetTime - Date.now()) / 1000)
      }

    } catch (error) {
      console.error('❌ Redis rate limiting failed:', error)
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        limit,
        remaining: limit,
        resetTime
      }
    }
  }

  /**
   * Memory-based rate limiting fallback
   */
  private checkRateLimitMemory(
    key: string,
    limit: number,
    resetTime: number,
    currentTime: number
  ): RateLimitResult {
    const existing = this.fallbackMemory.get(key)
    
    // Clean up expired entries
    if (existing && currentTime >= existing.resetTime) {
      this.fallbackMemory.delete(key)
    }

    const current = this.fallbackMemory.get(key) || { count: 0, resetTime }
    current.count += 1
    current.resetTime = resetTime
    
    this.fallbackMemory.set(key, current)

    const remaining = Math.max(0, limit - current.count)
    const allowed = current.count <= limit

    return {
      allowed,
      limit,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil((resetTime - currentTime) / 1000)
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getCurrentStatus(
    orgId: string,
    actorId: string,
    operation: string,
    endpoint: string
  ): Promise<RateLimitResult> {
    const operationType = this.classifyOperation(operation, endpoint)
    const limit = this.config.limits[operationType]
    const rateLimitKey = this.generateRateLimitKey(orgId, actorId, operationType)
    
    const currentTime = Date.now()
    const windowStart = Math.floor(currentTime / (this.config.windowSeconds * 1000)) * this.config.windowSeconds * 1000
    const resetTime = windowStart + (this.config.windowSeconds * 1000)

    if (this.redis) {
      try {
        const currentCountStr = await this.redis.get(rateLimitKey)
        const currentCount = currentCountStr ? parseInt(currentCountStr) : 0
        const remaining = Math.max(0, limit - currentCount)
        
        return {
          allowed: currentCount < limit,
          limit,
          remaining,
          resetTime
        }
      } catch {
        // Fallback
      }
    }

    // Memory fallback
    const existing = this.fallbackMemory.get(rateLimitKey)
    const currentCount = existing && currentTime < existing.resetTime ? existing.count : 0
    const remaining = Math.max(0, limit - currentCount)

    return {
      allowed: currentCount < limit,
      limit,
      remaining,
      resetTime
    }
  }

  /**
   * Reset rate limit for organization (admin function)
   */
  async resetRateLimit(orgId: string, operationType?: keyof RateLimitConfig['limits']): Promise<void> {
    if (!this.redis) {
      // Clear memory cache
      for (const [key] of this.fallbackMemory) {
        if (key.includes(`:${orgId}:`)) {
          if (!operationType || key.includes(`:${operationType}:`)) {
            this.fallbackMemory.delete(key)
          }
        }
      }
      return
    }

    try {
      const operations = operationType ? [operationType] : ['READ', 'WRITE', 'FINANCE'] as const
      const currentWindow = Math.floor(Date.now() / (this.config.windowSeconds * 1000))
      
      for (const op of operations) {
        const key = `${this.config.keyPrefix}:${orgId}:${op}:${currentWindow}`
        await this.redis.del(key)
      }
      
      console.log(`🗑️ Rate limits reset for org: ${orgId}${operationType ? ` (${operationType})` : ''}`)
    } catch (error) {
      console.error('❌ Failed to reset rate limits:', error)
    }
  }

  /**
   * Get rate limiting statistics
   */
  getRateLimitStats(): {
    config: RateLimitConfig
    redisConnected: boolean
    memoryEntries: number
  } {
    return {
      config: this.config,
      redisConnected: this.redis !== null,
      memoryEntries: this.fallbackMemory.size
    }
  }

  /**
   * Clean up expired memory entries
   */
  cleanupMemoryCache(): number {
    const currentTime = Date.now()
    let cleaned = 0
    
    for (const [key, entry] of this.fallbackMemory) {
      if (currentTime >= entry.resetTime) {
        this.fallbackMemory.delete(key)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired rate limit entries from memory`)
    }
    
    return cleaned
  }

  /**
   * Test rate limiting system functionality
   */
  async testRateLimit(): Promise<{ success: boolean; results: any[] }> {
    const results = []
    let allSuccess = true

    try {
      // Test 1: Operation Classification
      const readOp = this.classifyOperation('READ', '/entities')
      const writeOp = this.classifyOperation('CREATE', '/entities')
      const financeOp = this.classifyOperation('APPROVE', '/transactions')
      
      const classificationSuccess = readOp === 'READ' && writeOp === 'WRITE' && financeOp === 'FINANCE'
      results.push({
        test: 'Operation Classification',
        success: classificationSuccess,
        details: classificationSuccess ? 
          `READ: ${readOp}, WRITE: ${writeOp}, FINANCE: ${financeOp}` : 
          'Classification failed'
      })
      allSuccess = allSuccess && classificationSuccess

      // Test 2: Rate Limit Check
      const testOrgId = 'test-org-123'
      const testActorId = 'test-actor-123'
      
      const rateLimitResult = await this.checkRateLimit(testOrgId, testActorId, 'READ', '/entities')
      
      const rateLimitSuccess = typeof rateLimitResult.allowed === 'boolean' && 
                              rateLimitResult.limit === this.config.limits.READ
      results.push({
        test: 'Rate Limit Check',
        success: rateLimitSuccess,
        details: rateLimitSuccess ? 
          `Allowed: ${rateLimitResult.allowed}, Remaining: ${rateLimitResult.remaining}/${rateLimitResult.limit}` : 
          'Rate limit check failed'
      })
      allSuccess = allSuccess && rateLimitSuccess

      // Test 3: Redis Connection
      const redisConnected = this.redis !== null
      results.push({
        test: 'Redis Connection',
        success: redisConnected,
        details: redisConnected ? 'Redis client initialized' : 'Using memory fallback'
      })

      // Test 4: Configuration Validation
      const config = this.getRateLimitStats()
      const configSuccess = config.config.limits.READ === 300 && 
                           config.config.limits.WRITE === 60 && 
                           config.config.limits.FINANCE === 30
      results.push({
        test: 'Configuration',
        success: configSuccess,
        details: configSuccess ? 
          `READ: ${config.config.limits.READ}, WRITE: ${config.config.limits.WRITE}, FINANCE: ${config.config.limits.FINANCE}` : 
          'Configuration invalid'
      })
      allSuccess = allSuccess && configSuccess

      // Test 5: Memory Cleanup
      const cleanedEntries = this.cleanupMemoryCache()
      results.push({
        test: 'Memory Cleanup',
        success: true,
        details: `Cleaned ${cleanedEntries} expired entries`
      })

    } catch (error) {
      results.push({
        test: 'System Test',
        success: false,
        details: `Error: ${(error as Error).message}`
      })
      allSuccess = false
    }

    return { success: allSuccess, results }
  }
}

/**
 * Singleton instance for Edge Function usage
 */
export const rateLimitManager = new RateLimitManager()

/**
 * Helper function for Edge Function integration
 */
export async function checkRateLimit(
  orgId: string,
  actorId: string,
  operation: string,
  endpoint: string
): Promise<{ allowed: boolean; headers: Record<string, string>; response?: Response }> {
  const result = await rateLimitManager.checkRateLimit(orgId, actorId, operation, endpoint)
  
  // Standard rate limit headers
  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'X-RateLimit-Window': rateLimitManager.getRateLimitStats().config.windowSeconds.toString()
  }

  if (!result.allowed) {
    // Rate limit exceeded
    return {
      allowed: false,
      headers,
      response: new Response(
        JSON.stringify({
          error: 'rate_limit_exceeded',
          message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          limit: result.limit,
          remaining: result.remaining,
          resetTime: result.resetTime
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': result.retryAfter?.toString() || '60',
            ...headers
          }
        }
      )
    }
  }

  return {
    allowed: true,
    headers
  }
}

/**
 * Helper function to get rate limit status without incrementing
 */
export async function getRateLimitStatus(
  orgId: string,
  actorId: string,
  operation: string,
  endpoint: string
): Promise<RateLimitResult> {
  return rateLimitManager.getCurrentStatus(orgId, actorId, operation, endpoint)
}