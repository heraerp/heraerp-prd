// Idempotency Handler for API v2 Gateway
// Prevents duplicate request processing using Redis-backed storage

import { HERARedisClient, getRedisClient } from './redis-client.ts'

interface IdempotencyConfig {
  ttl: number // TTL in seconds (default: 24 hours)
  keyGenerator?: (actorId: string, orgId: string, key: string) => string
  skipResponseBody?: boolean // Don't store response body for large responses
}

interface IdempotencyResult {
  isDuplicate: boolean
  existingResponse?: {
    status: number
    body: any
    headers?: Record<string, string>
    timestamp: string
  }
  key: string
}

interface StoredResponse {
  status: number
  body: any
  headers?: Record<string, string>
  timestamp: string
  actorId: string
  orgId: string
}

class HERAIdempotencyHandler {
  private redis: HERARedisClient | null
  private defaultConfig: IdempotencyConfig = {
    ttl: 86400, // 24 hours
    skipResponseBody: false
  }

  constructor() {
    this.redis = getRedisClient()
  }

  /**
   * Check for duplicate request
   */
  async checkDuplicate(
    idempotencyKey: string,
    actorId: string,
    orgId: string,
    config: Partial<IdempotencyConfig> = {}
  ): Promise<IdempotencyResult> {
    const finalConfig = { ...this.defaultConfig, ...config }
    const key = this.generateKey(actorId, orgId, idempotencyKey, finalConfig)

    // If Redis unavailable, treat as new request (fail safe)
    if (!this.redis) {
      console.warn('⚠️ Redis unavailable, idempotency check disabled')
      return {
        isDuplicate: false,
        key
      }
    }

    try {
      const result = await this.redis.checkIdempotency(
        idempotencyKey,
        actorId,
        orgId,
        finalConfig.ttl
      )

      if (result.isDuplicate && result.existingResponse) {
        console.log(`🔄 Duplicate request detected: ${idempotencyKey.slice(0, 16)}... for actor ${actorId.slice(0, 8)}`)
        return {
          isDuplicate: true,
          existingResponse: result.existingResponse as any,
          key
        }
      }

      console.log(`✅ New idempotent request: ${idempotencyKey.slice(0, 16)}... for actor ${actorId.slice(0, 8)}`)
      return {
        isDuplicate: false,
        key
      }

    } catch (error) {
      console.error('❌ Idempotency check failed:', error)
      // On error, treat as new request (fail safe)
      return {
        isDuplicate: false,
        key
      }
    }
  }

  /**
   * Store response for future idempotency checks
   */
  async storeResponse(
    idempotencyKey: string,
    actorId: string,
    orgId: string,
    response: {
      status: number
      body: any
      headers?: Record<string, string>
    },
    config: Partial<IdempotencyConfig> = {}
  ): Promise<boolean> {
    const finalConfig = { ...this.defaultConfig, ...config }

    if (!this.redis) {
      console.warn('⚠️ Redis unavailable, response not stored for idempotency')
      return false
    }

    try {
      const storedResponse: StoredResponse = {
        status: response.status,
        body: finalConfig.skipResponseBody ? null : response.body,
        headers: response.headers,
        timestamp: new Date().toISOString(),
        actorId,
        orgId
      }

      await this.redis.storeIdempotencyResponse(
        idempotencyKey,
        actorId,
        orgId,
        storedResponse,
        finalConfig.ttl
      )

      console.log(`✅ Response stored for idempotency: ${idempotencyKey.slice(0, 16)}...`)
      return true

    } catch (error) {
      console.error('❌ Failed to store response for idempotency:', error)
      return false
    }
  }

  /**
   * Generate idempotency key
   */
  private generateKey(
    actorId: string, 
    orgId: string, 
    idempotencyKey: string, 
    config: IdempotencyConfig
  ): string {
    if (config.keyGenerator) {
      return config.keyGenerator(actorId, orgId, idempotencyKey)
    }
    return `idempotency:${orgId}:${actorId}:${idempotencyKey}`
  }

  /**
   * Extract idempotency key from request
   */
  extractIdempotencyKey(request: Request): string | null {
    // Try multiple header formats
    const headers = [
      'X-Idempotency-Key',
      'Idempotency-Key', 
      'X-Request-ID',
      'Request-ID'
    ]

    for (const header of headers) {
      const value = request.headers.get(header)
      if (value) {
        return value
      }
    }

    return null
  }

  /**
   * Generate idempotency key from request content (fallback)
   */
  generateIdempotencyKey(
    method: string,
    url: string,
    body: any,
    actorId: string
  ): string {
    // Create deterministic key from request characteristics
    const content = JSON.stringify({
      method,
      path: new URL(url).pathname,
      body: body || {},
      actor: actorId
    })

    // Simple hash function for deterministic key generation
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }

    return `auto_${Math.abs(hash).toString(36)}`
  }

  /**
   * Create idempotency middleware
   */
  createMiddleware(config: Partial<IdempotencyConfig> = {}) {
    return async (
      request: Request,
      actorId: string,
      orgId: string,
      requestBody?: any
    ): Promise<{
      isDuplicate: boolean
      response?: Response
      idempotencyKey?: string
      storeResponse?: (response: { status: number; body: any; headers?: Record<string, string> }) => Promise<boolean>
    }> => {
      // Extract or generate idempotency key
      let idempotencyKey = this.extractIdempotencyKey(request)
      
      if (!idempotencyKey) {
        // Only auto-generate for mutation operations
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
          idempotencyKey = this.generateIdempotencyKey(
            request.method,
            request.url,
            requestBody,
            actorId
          )
          console.log(`🔧 Auto-generated idempotency key: ${idempotencyKey}`)
        } else {
          // GET and other safe methods don't need idempotency
          return {
            isDuplicate: false,
            storeResponse: async () => false
          }
        }
      }

      // Check for duplicate
      const result = await this.checkDuplicate(idempotencyKey, actorId, orgId, config)

      if (result.isDuplicate && result.existingResponse) {
        console.log(`🔄 Returning cached response for duplicate request`)
        
        const cachedResponse = result.existingResponse
        const response = new Response(
          JSON.stringify(cachedResponse.body),
          {
            status: cachedResponse.status,
            headers: {
              'Content-Type': 'application/json',
              'X-Idempotency-Replay': 'true',
              'X-Original-Timestamp': cachedResponse.timestamp,
              ...(cachedResponse.headers || {})
            }
          }
        )

        return {
          isDuplicate: true,
          response,
          idempotencyKey
        }
      }

      // Return store function for successful processing
      const storeResponse = async (response: { 
        status: number; 
        body: any; 
        headers?: Record<string, string> 
      }) => {
        return await this.storeResponse(idempotencyKey!, actorId, orgId, response, config)
      }

      return {
        isDuplicate: false,
        idempotencyKey,
        storeResponse
      }
    }
  }

  /**
   * Clean up expired idempotency keys (maintenance function)
   */
  async cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    if (!this.redis) return 0

    try {
      // This would require a more complex Redis cleanup script
      // For now, Redis TTL handles cleanup automatically
      console.log('✅ Idempotency cleanup relies on Redis TTL')
      return 0
    } catch (error) {
      console.error('❌ Idempotency cleanup failed:', error)
      return 0
    }
  }

  /**
   * Get idempotency statistics
   */
  async getStats(actorId: string, orgId: string): Promise<{
    totalKeys: number
    recentDuplicates: number
  } | null> {
    if (!this.redis) return null

    try {
      // Would require Redis SCAN operations for actual stats
      // For now, return placeholder
      return {
        totalKeys: 0,
        recentDuplicates: 0
      }
    } catch (error) {
      console.error('❌ Failed to get idempotency stats:', error)
      return null
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    redisStatus?: 'healthy' | 'unhealthy'
    error?: string
  }> {
    if (!this.redis) {
      return {
        status: 'degraded', // Degraded but functional (fail safe)
        redisStatus: 'unhealthy',
        error: 'Redis client not available'
      }
    }

    try {
      const redisHealth = await this.redis.healthCheck()
      
      if (redisHealth.status === 'healthy') {
        return {
          status: 'healthy',
          redisStatus: 'healthy'
        }
      } else {
        return {
          status: 'degraded',
          redisStatus: 'unhealthy',
          error: redisHealth.error
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        redisStatus: 'unhealthy',
        error: error.message
      }
    }
  }

  /**
   * Validate idempotency key format
   */
  validateIdempotencyKey(key: string): {
    valid: boolean
    reason?: string
  } {
    if (!key) {
      return { valid: false, reason: 'Key is empty' }
    }

    if (key.length < 8) {
      return { valid: false, reason: 'Key too short (minimum 8 characters)' }
    }

    if (key.length > 255) {
      return { valid: false, reason: 'Key too long (maximum 255 characters)' }
    }

    // Allow alphanumeric, dash, underscore
    const validPattern = /^[a-zA-Z0-9_-]+$/
    if (!validPattern.test(key)) {
      return { valid: false, reason: 'Key contains invalid characters (only a-z, A-Z, 0-9, -, _ allowed)' }
    }

    return { valid: true }
  }
}

// Singleton instance
let idempotencyHandler: HERAIdempotencyHandler | null = null

export function getIdempotencyHandler(): HERAIdempotencyHandler {
  if (!idempotencyHandler) {
    idempotencyHandler = new HERAIdempotencyHandler()
  }
  return idempotencyHandler
}

export { HERAIdempotencyHandler, type IdempotencyConfig, type IdempotencyResult }