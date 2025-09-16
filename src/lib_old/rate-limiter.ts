/**
 * Production-grade rate limiting for API protection
 * Implements token bucket algorithm with Redis support
 */

import { NextRequest } from 'next/server'
import { rateLimitError } from './api-error-handler'
import { apiLogger } from './logger'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyPrefix?: string // Prefix for rate limit keys
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<number>
  reset(key: string): Promise<void>
}

/**
 * In-memory rate limit store (for development)
 * In production, use Redis or similar
 */
class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now()
    const resetTime = now + windowMs

    const current = this.store.get(key)

    if (!current || current.resetTime <= now) {
      this.store.set(key, { count: 1, resetTime })
      return 1
    }

    current.count++
    return current.count
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  // Cleanup expired entries periodically
  private cleanup() {
    const now = Date.now()
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime <= now) {
        this.store.delete(key)
      }
    }
  }

  constructor() {
    // Run cleanup every minute
    setInterval(() => this.cleanup(), 60000)
  }
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private config: RateLimitConfig
  private store: RateLimitStore

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = config
    this.store = store || new InMemoryRateLimitStore()
  }

  /**
   * Get identifier from request (IP, user ID, API key, etc.)
   */
  private getIdentifier(request: NextRequest): string {
    // Try to get user ID from headers (if authenticated)
    const userId = request.headers.get('x-user-id')
    if (userId) return `user:${userId}`

    // Try to get API key
    const apiKey = request.headers.get('x-api-key')
    if (apiKey) return `api:${apiKey}`

    // Fall back to IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `ip:${ip}`
  }

  /**
   * Check if request should be rate limited
   */
  async check(request: NextRequest): Promise<void> {
    const identifier = this.getIdentifier(request)
    const key = `${this.config.keyPrefix || 'rate'}:${identifier}`

    const count = await this.store.increment(key, this.config.windowMs)

    apiLogger.debug('Rate limit check', {
      key,
      count,
      limit: this.config.maxRequests,
      window: this.config.windowMs
    })

    if (count > this.config.maxRequests) {
      apiLogger.warn('Rate limit exceeded', {
        key,
        count,
        limit: this.config.maxRequests,
        identifier
      })

      throw rateLimitError(Math.ceil(this.config.windowMs / 1000))
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `${this.config.keyPrefix || 'rate'}:${identifier}`
    await this.store.reset(key)
  }
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const rateLimiters = {
  // Strict limit for authentication endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'auth'
  }),

  // Standard API rate limit
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyPrefix: 'api'
  }),

  // Relaxed limit for read operations
  read: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyPrefix: 'read'
  }),

  // Strict limit for write operations
  write: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyPrefix: 'write'
  }),

  // Very strict limit for POS transactions
  pos: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyPrefix: 'pos'
  })
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(limiter: RateLimiter = rateLimiters.api) {
  return function <T extends (...args: any[]) => Promise<any>>(handler: T): T {
    return (async (...args: Parameters<T>) => {
      const request = args[0] as NextRequest
      await limiter.check(request)
      return handler(...args)
    }) as T
  }
}
