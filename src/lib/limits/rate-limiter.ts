/**
 * HERA Rate Limiting and Idempotency Service
 * Per-organization and per-IP rate limiting with idempotency support
 */

import { getSupabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export interface RateLimitConfig {
  requests_per_minute: number
  requests_per_hour: number
  burst_size: number
  enable_idempotency: boolean
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  reset_at: Date
  retry_after?: number
}

export interface IdempotencyResult {
  exists: boolean
  response?: any
  status_code?: number
  created_at?: string
}

export class RateLimiter {
  private static instance: RateLimiter
  private defaultLimits: Map<string, RateLimitConfig> = new Map()

  constructor() {
    this.initializeDefaultLimits()
  }

  static getInstance(): RateLimiter {
    if (!this.instance) {
      this.instance = new RateLimiter()
    }
    return this.instance
  }

  /**
   * Initialize default rate limits
   */
  private initializeDefaultLimits() {
    // API endpoint groups
    this.defaultLimits.set('api:read', {
      requests_per_minute: 300,
      requests_per_hour: 10000,
      burst_size: 50,
      enable_idempotency: false
    })

    this.defaultLimits.set('api:write', {
      requests_per_minute: 100,
      requests_per_hour: 3000,
      burst_size: 20,
      enable_idempotency: true
    })

    this.defaultLimits.set('api:report', {
      requests_per_minute: 10,
      requests_per_hour: 100,
      burst_size: 5,
      enable_idempotency: true
    })

    this.defaultLimits.set('api:auth', {
      requests_per_minute: 20,
      requests_per_hour: 100,
      burst_size: 5,
      enable_idempotency: false
    })
  }

  /**
   * Check rate limit
   */
  async checkLimit(params: {
    organization_id: string
    ip_address: string
    endpoint: string
    api_group: string
  }): Promise<RateLimitResult> {
    const { organization_id, ip_address, endpoint, api_group } = params
    
    // Get limits for organization
    const limits = await this.getOrganizationLimits(organization_id, api_group)
    
    // Check both org and IP limits
    const [orgResult, ipResult] = await Promise.all([
      this.checkWindowLimit(
        `org:${organization_id}:${api_group}`,
        limits
      ),
      this.checkWindowLimit(
        `ip:${ip_address}:${api_group}`,
        limits
      )
    ])

    // Use more restrictive limit
    const result = orgResult.remaining < ipResult.remaining ? orgResult : ipResult

    // Log if rate limited
    if (!result.allowed) {
      await this.logRateLimitHit(organization_id, ip_address, endpoint, api_group)
    }

    return result
  }

  /**
   * Check sliding window rate limit
   */
  private async checkWindowLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const supabase = getSupabase()
    const now = new Date()
    const minuteAgo = new Date(now.getTime() - 60 * 1000)
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Count requests in windows
    const { data: recentRequests } = await supabase
      .from('universal_transactions')
      .select('id, transaction_date')
      .eq('transaction_type', 'rate_limit')
      .eq('metadata->>key', key)
      .gte('transaction_date', hourAgo.toISOString())
      .order('transaction_date', { ascending: false })

    const requests = recentRequests || []
    
    // Count requests in each window
    const minuteCount = requests.filter(
      r => new Date(r.transaction_date) >= minuteAgo
    ).length
    
    const hourCount = requests.length

    // Check burst (last few seconds)
    const burstWindow = new Date(now.getTime() - 10 * 1000) // 10 seconds
    const burstCount = requests.filter(
      r => new Date(r.transaction_date) >= burstWindow
    ).length

    // Determine if allowed
    let allowed = true
    let limitHit = 0
    let resetAt = new Date(now.getTime() + 60 * 1000)

    if (burstCount >= config.burst_size) {
      allowed = false
      limitHit = config.burst_size
      resetAt = new Date(now.getTime() + 10 * 1000)
    } else if (minuteCount >= config.requests_per_minute) {
      allowed = false
      limitHit = config.requests_per_minute
      resetAt = new Date(requests[requests.length - config.requests_per_minute].transaction_date)
      resetAt.setMinutes(resetAt.getMinutes() + 1)
    } else if (hourCount >= config.requests_per_hour) {
      allowed = false
      limitHit = config.requests_per_hour
      resetAt = new Date(requests[requests.length - config.requests_per_hour].transaction_date)
      resetAt.setHours(resetAt.getHours() + 1)
    }

    // Record this request if allowed
    if (allowed) {
      await supabase
        .from('universal_transactions')
        .insert({
          id: uuidv4(),
          transaction_type: 'rate_limit',
          transaction_date: now.toISOString(),
          total_amount: 0,
          smart_code: 'HERA.LIMITS.RATE.CHECK.v1',
          organization_id: 'SYSTEM',
          metadata: { key }
        })
    }

    return {
      allowed,
      limit: limitHit || config.requests_per_minute,
      remaining: allowed 
        ? Math.min(
            config.burst_size - burstCount,
            config.requests_per_minute - minuteCount,
            config.requests_per_hour - hourCount
          )
        : 0,
      reset_at: resetAt,
      retry_after: allowed ? undefined : Math.ceil((resetAt.getTime() - now.getTime()) / 1000)
    }
  }

  /**
   * Check idempotency key using external_reference
   */
  async checkIdempotency(
    key: string,
    organizationId: string
  ): Promise<IdempotencyResult> {
    const supabase = getSupabase()
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Look for existing idempotency transaction
    const { data: existing } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'idempotency_cache')
      .eq('external_reference', key) // Use the official column
      .eq('organization_id', organizationId)
      .gte('transaction_date', oneDayAgo)
      .order('transaction_date', { ascending: false })
      .limit(1)
      .single()

    if (existing && existing.metadata?.response) {
      // Check if expired
      const expiresAt = new Date(existing.metadata.expires_at)
      if (expiresAt > new Date()) {
        return {
          exists: true,
          response: existing.metadata.response,
          status_code: existing.metadata.status_code,
          created_at: existing.transaction_date
        }
      }
    }

    return { exists: false }
  }

  /**
   * Store idempotency result using external_reference
   */
  async storeIdempotency(params: {
    key: string
    organization_id: string
    request_hash: string
    response: any
    status_code: number
  }): Promise<void> {
    const supabase = getSupabase()
    const { key, organization_id, request_hash, response, status_code } = params

    // Store as idempotency transaction with external_reference
    await supabase
      .from('universal_transactions')
      .insert({
        id: uuidv4(),
        transaction_type: 'idempotency_cache',
        transaction_code: `IDEM-${Date.now()}`,
        external_reference: key, // Use the official column for idempotency
        smart_code: 'HERA.API.IDEMPOTENCY.CACHE.v1',
        organization_id,
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        metadata: {
          request_hash,
          response,
          status_code,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h TTL
        }
      })
  }

  /**
   * Hash request for idempotency
   */
  hashRequest(params: {
    method: string
    path: string
    body?: any
    organization_id: string
  }): string {
    const { method, path, body, organization_id } = params
    
    const content = JSON.stringify({
      method: method.toUpperCase(),
      path,
      body: body || {},
      organization_id
    })

    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
  }

  /**
   * Get organization-specific limits
   */
  private async getOrganizationLimits(
    organizationId: string,
    apiGroup: string
  ): Promise<RateLimitConfig> {
    const supabase = getSupabase()

    // Check for custom limits
    const { data: customLimits } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('field_name', `rate_limit_${apiGroup}`)
      .eq('organization_id', organizationId)
      .single()

    if (customLimits?.field_value_text) {
      try {
        return JSON.parse(customLimits.field_value_text)
      } catch (error) {
        console.error('Invalid custom rate limit config:', error)
      }
    }

    // Return defaults
    return this.defaultLimits.get(`api:${apiGroup}`) || {
      requests_per_minute: 60,
      requests_per_hour: 1000,
      burst_size: 10,
      enable_idempotency: false
    }
  }

  /**
   * Log rate limit hit
   */
  private async logRateLimitHit(
    organizationId: string,
    ipAddress: string,
    endpoint: string,
    apiGroup: string
  ): Promise<void> {
    const supabase = getSupabase()

    await supabase
      .from('universal_transactions')
      .insert({
        id: uuidv4(),
        transaction_type: 'rate_limit_exceeded',
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        smart_code: 'HERA.LIMITS.RATE.EXCEEDED.v1',
        organization_id: organizationId,
        metadata: {
          ip_address: ipAddress,
          endpoint,
          api_group: apiGroup,
          timestamp: new Date().toISOString()
        }
      })
  }

  /**
   * Clean up expired records
   */
  async cleanupExpired(): Promise<number> {
    const supabase = getSupabase()
    
    // Delete expired idempotency records
    const { data: expired } = await supabase
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'idempotency_record')
      .lt('metadata->>expires_at', new Date().toISOString())

    let cleaned = 0

    for (const record of expired || []) {
      await supabase
        .from('core_dynamic_data')
        .delete()
        .eq('entity_id', record.id)

      await supabase
        .from('core_entities')
        .delete()
        .eq('id', record.id)

      cleaned++
    }

    // Clean old rate limit records (older than 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    
    await supabase
      .from('universal_transactions')
      .delete()
      .eq('transaction_type', 'rate_limit')
      .lt('transaction_date', twoHoursAgo.toISOString())

    return cleaned
  }
}

export const rateLimiter = RateLimiter.getInstance()