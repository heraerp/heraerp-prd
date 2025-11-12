// Rate Limiter for API v2 Gateway
// Implements sliding window rate limiting with Redis backend

import { HERARedisClient, getRedisClient } from './redis-client.ts'

interface RateLimitRule {
  windowMs: number // Window size in milliseconds
  maxRequests: number // Max requests per window
  skipSuccessfulRequests?: boolean // Only count failed requests
  skipFailedRequests?: boolean // Only count successful requests
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
  used: number
  limit: number
}

class HERARateLimiter {
  private redis: HERARedisClient | null

  constructor() {
    this.redis = getRedisClient()
  }

  /**
   * Check rate limit for actor in organization
   */
  async checkLimit(
    actorId: string,
    orgId: string,
    rule: RateLimitRule = this.getDefaultRule(),
    endpoint?: string
  ): Promise<RateLimitResult> {
    // If Redis unavailable, allow request (fail open for availability)
    if (!this.redis) {
      console.warn('⚠️ Redis unavailable, rate limiting disabled')
      return {
        allowed: true,
        remaining: rule.maxRequests - 1,
        resetTime: Date.now() + rule.windowMs,
        used: 0,
        limit: rule.maxRequests
      }
    }

    const key = this.generateKey(actorId, orgId, endpoint)
    
    try {
      const result = await this.redis.checkRateLimit(actorId, orgId, {
        windowMs: rule.windowMs,
        maxRequests: rule.maxRequests,
        keyGenerator: () => key
      })

      const used = rule.maxRequests - result.remaining - (result.allowed ? 1 : 0)

      return {
        allowed: result.allowed,
        remaining: result.remaining,
        resetTime: result.resetTime,
        retryAfter: result.retryAfter,
        used,
        limit: rule.maxRequests
      }
    } catch (error) {
      console.error('❌ Rate limit check failed:', error)
      // On error, allow request (fail open)
      return {
        allowed: true,
        remaining: rule.maxRequests - 1,
        resetTime: Date.now() + rule.windowMs,
        used: 0,
        limit: rule.maxRequests
      }
    }
  }

  /**
   * Generate rate limit key
   */
  private generateKey(actorId: string, orgId: string, endpoint?: string): string {
    const baseKey = `rate_limit:${orgId}:${actorId}`
    return endpoint ? `${baseKey}:${endpoint}` : baseKey
  }

  /**
   * Default rate limit rule (100 requests per minute)
   */
  private getDefaultRule(): RateLimitRule {
    return {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100 // 100 requests per minute
    }
  }

  /**
   * Get rate limit rule based on endpoint and user role
   */
  getRuleForEndpoint(endpoint: string, userRole?: string): RateLimitRule {
    // Different limits for different endpoints and roles
    const rules: Record<string, RateLimitRule> = {
      // Authentication endpoints - more lenient
      'auth/resolve-membership': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 200 // Allow more auth requests
      },
      
      // Entity operations - standard limit
      'entities': {
        windowMs: 60 * 1000, // 1 minute  
        maxRequests: 100
      },

      // Transaction operations - higher limit for financial ops
      'transactions': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 150 // Higher limit for financial operations
      },

      // Health checks - very high limit
      'health': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 1000 // Allow frequent health checks
      },

      // Micro-apps - standard limit
      'micro-apps': {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100
      }
    }

    // Role-based multipliers
    const roleMultipliers: Record<string, number> = {
      'ORG_OWNER': 2.0, // Double limit for org owners
      'ORG_ADMIN': 1.5, // 50% more for admins
      'MANAGER': 1.2, // 20% more for managers
      'MEMBER': 1.0 // Standard limit
    }

    let rule = rules[endpoint] || this.getDefaultRule()
    
    // Apply role-based multiplier
    if (userRole && roleMultipliers[userRole]) {
      const multiplier = roleMultipliers[userRole]
      rule = {
        ...rule,
        maxRequests: Math.floor(rule.maxRequests * multiplier)
      }
    }

    return rule
  }

  /**
   * Create rate limit middleware function
   */
  createMiddleware(defaultRule?: RateLimitRule) {
    return async (
      request: Request,
      actorId: string,
      orgId: string,
      userRole?: string,
      endpoint?: string
    ): Promise<{
      allowed: boolean
      response?: Response
      headers: Record<string, string>
    }> => {
      const rule = endpoint 
        ? this.getRuleForEndpoint(endpoint, userRole)
        : (defaultRule || this.getDefaultRule())

      const result = await this.checkLimit(actorId, orgId, rule, endpoint)

      // Headers for rate limit information
      const headers: Record<string, string> = {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        'X-RateLimit-Used': result.used.toString()
      }

      if (!result.allowed) {
        headers['Retry-After'] = result.retryAfter?.toString() || '60'
        
        const errorResponse = new Response(
          JSON.stringify({
            error: 'rate_limit_exceeded',
            message: `Too many requests. Limit: ${result.limit} per ${Math.round(rule.windowMs / 1000)}s`,
            limit: result.limit,
            used: result.used,
            resetTime: new Date(result.resetTime).toISOString(),
            retryAfter: result.retryAfter
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...headers
            }
          }
        )

        return {
          allowed: false,
          response: errorResponse,
          headers
        }
      }

      return {
        allowed: true,
        headers
      }
    }
  }

  /**
   * Get rate limit statistics for monitoring
   */
  async getStats(actorId: string, orgId: string): Promise<{
    currentUsage: number
    limit: number
    resetTime: number
    remainingTime: number
  } | null> {
    if (!this.redis) return null

    try {
      const key = this.generateKey(actorId, orgId)
      const rule = this.getDefaultRule()
      
      const result = await this.redis.checkRateLimit(actorId, orgId, {
        windowMs: rule.windowMs,
        maxRequests: rule.maxRequests,
        keyGenerator: () => key
      })

      const currentUsage = rule.maxRequests - result.remaining
      const remainingTime = result.resetTime - Date.now()

      return {
        currentUsage,
        limit: rule.maxRequests,
        resetTime: result.resetTime,
        remainingTime: Math.max(0, remainingTime)
      }
    } catch (error) {
      console.error('❌ Failed to get rate limit stats:', error)
      return null
    }
  }

  /**
   * Reset rate limit for an actor (admin function)
   */
  async resetLimit(actorId: string, orgId: string, endpoint?: string): Promise<boolean> {
    if (!this.redis) return false

    try {
      const client = await (this.redis as any).getConnection()
      const key = this.generateKey(actorId, orgId, endpoint)
      
      await client.del(key)
      console.log(`✅ Rate limit reset for actor ${actorId.slice(0, 8)} in org ${orgId.slice(0, 8)}`)
      return true
    } catch (error) {
      console.error('❌ Failed to reset rate limit:', error)
      return false
    }
  }

  /**
   * Health check for rate limiter
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    redisStatus?: 'healthy' | 'unhealthy'
    error?: string
  }> {
    if (!this.redis) {
      return {
        status: 'degraded', // Degraded but functional (fail open)
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
}

// Singleton instance
let rateLimiter: HERARateLimiter | null = null

export function getRateLimiter(): HERARateLimiter {
  if (!rateLimiter) {
    rateLimiter = new HERARateLimiter()
  }
  return rateLimiter
}

export { HERARateLimiter, type RateLimitRule, type RateLimitResult }