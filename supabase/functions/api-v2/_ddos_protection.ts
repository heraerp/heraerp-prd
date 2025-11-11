/**
 * HERA API v2 - DDoS Protection System
 * Smart Code: HERA.API.V2.DDOS_PROTECTION.v1
 * 
 * Content-length caps, request validation, and attack prevention
 * 1MB general limit, 10MB for file uploads
 */

export interface DDoSProtectionConfig {
  maxPayloadSize: number          // 1MB default
  maxFileUploadSize: number       // 10MB for file uploads
  maxHeaderSize: number           // 16KB for headers
  maxUrlLength: number            // 2KB for URLs
  maxRequestsPerIP: number        // 1000 requests per hour per IP
  maxConcurrentConnections: number // 50 concurrent connections per IP
  suspiciousPatterns: RegExp[]    // SQL injection, XSS patterns
  allowedContentTypes: string[]   // Whitelist of content types
  blockedUserAgents: RegExp[]     // Known bot patterns
}

export interface DDoSCheckResult {
  allowed: boolean
  reason?: string
  details?: Record<string, any>
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  suggestions?: string[]
}

export interface IPTrackingInfo {
  requestCount: number
  lastRequestTime: number
  concurrentConnections: number
  suspiciousActivity: number
  blockedUntil?: number
  country?: string
  userAgent?: string
}

/**
 * Enterprise DDoS Protection Manager
 */
export class DDoSProtectionManager {
  private config: DDoSProtectionConfig
  private ipTracking: Map<string, IPTrackingInfo> = new Map()
  private readonly HOUR_MS = 60 * 60 * 1000
  private readonly DAY_MS = 24 * 60 * 60 * 1000

  constructor(config: Partial<DDoSProtectionConfig> = {}) {
    this.config = {
      maxPayloadSize: 1024 * 1024,        // 1MB
      maxFileUploadSize: 10 * 1024 * 1024, // 10MB
      maxHeaderSize: 16 * 1024,            // 16KB
      maxUrlLength: 2 * 1024,              // 2KB
      maxRequestsPerIP: 1000,              // Per hour
      maxConcurrentConnections: 50,
      suspiciousPatterns: [
        // SQL Injection patterns
        /(\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bcreate\b|\balter\b).*(\bfrom\b|\binto\b|\bwhere\b)/i,
        /'.*(\bor\b|\band\b).*'/i,
        /\b(exec|execute|sp_|xp_)\s*\(/i,
        
        // XSS patterns
        /<script[^>]*>.*?<\/script>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe[^>]*>/i,
        
        // Path traversal
        /\.\.[\/\\]/,
        /(\.\.%2f|\.\.%5c)/i,
        
        // Command injection
        /[;&|`$]/,
        /(curl|wget|nc|netcat|ping)/i
      ],
      allowedContentTypes: [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain',
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/zip'
      ],
      blockedUserAgents: [
        /bot|spider|crawler|scraper/i,
        /curl|wget|python-requests|go-http-client/i,
        /nikto|sqlmap|nmap|masscan/i,
        /burp|zap|w3af|skipfish/i
      ],
      ...config
    }
  }

  /**
   * Main DDoS protection check
   */
  async checkRequest(req: Request): Promise<DDoSCheckResult> {
    const ipAddress = this.extractIPAddress(req)
    const contentLength = this.getContentLength(req)
    const userAgent = req.headers.get('User-Agent') || ''
    const url = new URL(req.url)

    // Track IP
    this.trackIPRequest(ipAddress, userAgent)

    // Check 1: Content Length Limits
    const contentLengthCheck = this.checkContentLength(req, contentLength)
    if (!contentLengthCheck.allowed) {
      this.incrementSuspiciousActivity(ipAddress)
      return contentLengthCheck
    }

    // Check 2: URL Length
    const urlLengthCheck = this.checkUrlLength(url.href)
    if (!urlLengthCheck.allowed) {
      this.incrementSuspiciousActivity(ipAddress)
      return urlLengthCheck
    }

    // Check 3: Header Size
    const headerSizeCheck = this.checkHeaderSize(req)
    if (!headerSizeCheck.allowed) {
      this.incrementSuspiciousActivity(ipAddress)
      return headerSizeCheck
    }

    // Check 4: Rate Limiting per IP
    const rateLimitCheck = this.checkIPRateLimit(ipAddress)
    if (!rateLimitCheck.allowed) {
      return rateLimitCheck
    }

    // Check 5: Concurrent Connections
    const concurrentCheck = this.checkConcurrentConnections(ipAddress)
    if (!concurrentCheck.allowed) {
      return concurrentCheck
    }

    // Check 6: User Agent Validation
    const userAgentCheck = this.checkUserAgent(userAgent)
    if (!userAgentCheck.allowed) {
      this.incrementSuspiciousActivity(ipAddress)
      return userAgentCheck
    }

    // Check 7: Content Type Validation
    const contentTypeCheck = this.checkContentType(req)
    if (!contentTypeCheck.allowed) {
      this.incrementSuspiciousActivity(ipAddress)
      return contentTypeCheck
    }

    // Check 8: Payload Pattern Analysis
    if (req.method === 'POST' || req.method === 'PUT') {
      const payloadCheck = await this.checkPayloadPatterns(req)
      if (!payloadCheck.allowed) {
        this.incrementSuspiciousActivity(ipAddress)
        return payloadCheck
      }
    }

    // Check 9: IP Reputation
    const ipReputationCheck = this.checkIPReputation(ipAddress)
    if (!ipReputationCheck.allowed) {
      return ipReputationCheck
    }

    // All checks passed
    return {
      allowed: true,
      riskLevel: 'LOW',
      details: {
        ipAddress,
        userAgent: userAgent.substring(0, 100), // Truncate for logs
        contentLength,
        requestsInLastHour: this.getIPInfo(ipAddress).requestCount
      }
    }
  }

  /**
   * Check content length limits
   */
  private checkContentLength(req: Request, contentLength: number): DDoSCheckResult {
    const isFileUpload = req.headers.get('Content-Type')?.includes('multipart/form-data')
    const maxSize = isFileUpload ? this.config.maxFileUploadSize : this.config.maxPayloadSize
    
    if (contentLength > maxSize) {
      return {
        allowed: false,
        reason: 'payload_too_large',
        riskLevel: 'HIGH',
        details: {
          contentLength,
          maxAllowed: maxSize,
          isFileUpload
        },
        suggestions: [`Reduce payload size to under ${this.formatBytes(maxSize)}`]
      }
    }

    return {
      allowed: true,
      riskLevel: contentLength > maxSize * 0.8 ? 'MEDIUM' : 'LOW'
    }
  }

  /**
   * Check URL length
   */
  private checkUrlLength(url: string): DDoSCheckResult {
    if (url.length > this.config.maxUrlLength) {
      return {
        allowed: false,
        reason: 'url_too_long',
        riskLevel: 'MEDIUM',
        details: {
          urlLength: url.length,
          maxAllowed: this.config.maxUrlLength
        },
        suggestions: ['Use shorter URLs or move parameters to request body']
      }
    }

    return {
      allowed: true,
      riskLevel: 'LOW'
    }
  }

  /**
   * Check header size
   */
  private checkHeaderSize(req: Request): DDoSCheckResult {
    let totalHeaderSize = 0
    
    for (const [name, value] of req.headers) {
      totalHeaderSize += name.length + value.length + 4 // +4 for ": " and "\r\n"
    }

    if (totalHeaderSize > this.config.maxHeaderSize) {
      return {
        allowed: false,
        reason: 'headers_too_large',
        riskLevel: 'MEDIUM',
        details: {
          headerSize: totalHeaderSize,
          maxAllowed: this.config.maxHeaderSize
        },
        suggestions: ['Remove unnecessary headers or reduce header values']
      }
    }

    return {
      allowed: true,
      riskLevel: 'LOW'
    }
  }

  /**
   * Check IP rate limiting
   */
  private checkIPRateLimit(ipAddress: string): DDoSCheckResult {
    const ipInfo = this.getIPInfo(ipAddress)
    const now = Date.now()

    // Clean old requests (older than 1 hour)
    if (now - ipInfo.lastRequestTime > this.HOUR_MS) {
      ipInfo.requestCount = 1
      ipInfo.lastRequestTime = now
      return { allowed: true, riskLevel: 'LOW' }
    }

    if (ipInfo.requestCount > this.config.maxRequestsPerIP) {
      // Block IP for 1 hour
      ipInfo.blockedUntil = now + this.HOUR_MS
      
      return {
        allowed: false,
        reason: 'rate_limit_exceeded',
        riskLevel: 'HIGH',
        details: {
          requestCount: ipInfo.requestCount,
          maxAllowed: this.config.maxRequestsPerIP,
          blockedUntil: ipInfo.blockedUntil
        },
        suggestions: ['Wait 1 hour before making more requests']
      }
    }

    // Check if IP is currently blocked
    if (ipInfo.blockedUntil && now < ipInfo.blockedUntil) {
      return {
        allowed: false,
        reason: 'ip_temporarily_blocked',
        riskLevel: 'HIGH',
        details: {
          blockedUntil: ipInfo.blockedUntil,
          remainingTime: ipInfo.blockedUntil - now
        },
        suggestions: [`Wait ${Math.ceil((ipInfo.blockedUntil - now) / 60000)} minutes`]
      }
    }

    const riskLevel = ipInfo.requestCount > this.config.maxRequestsPerIP * 0.8 ? 'MEDIUM' : 'LOW'
    return { allowed: true, riskLevel }
  }

  /**
   * Check concurrent connections
   */
  private checkConcurrentConnections(ipAddress: string): DDoSCheckResult {
    const ipInfo = this.getIPInfo(ipAddress)
    
    if (ipInfo.concurrentConnections > this.config.maxConcurrentConnections) {
      return {
        allowed: false,
        reason: 'too_many_concurrent_connections',
        riskLevel: 'HIGH',
        details: {
          concurrentConnections: ipInfo.concurrentConnections,
          maxAllowed: this.config.maxConcurrentConnections
        },
        suggestions: ['Reduce concurrent requests or wait for existing requests to complete']
      }
    }

    const riskLevel = ipInfo.concurrentConnections > this.config.maxConcurrentConnections * 0.8 ? 'MEDIUM' : 'LOW'
    return { allowed: true, riskLevel }
  }

  /**
   * Check user agent
   */
  private checkUserAgent(userAgent: string): DDoSCheckResult {
    if (!userAgent || userAgent.length < 10) {
      return {
        allowed: false,
        reason: 'suspicious_user_agent',
        riskLevel: 'MEDIUM',
        details: { userAgent },
        suggestions: ['Use a standard browser or HTTP client']
      }
    }

    for (const pattern of this.config.blockedUserAgents) {
      if (pattern.test(userAgent)) {
        return {
          allowed: false,
          reason: 'blocked_user_agent',
          riskLevel: 'HIGH',
          details: { userAgent: userAgent.substring(0, 100) },
          suggestions: ['Use a legitimate browser or update your HTTP client']
        }
      }
    }

    return { allowed: true, riskLevel: 'LOW' }
  }

  /**
   * Check content type
   */
  private checkContentType(req: Request): DDoSCheckResult {
    const contentType = req.headers.get('Content-Type')
    
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!contentType) {
        return {
          allowed: false,
          reason: 'missing_content_type',
          riskLevel: 'MEDIUM',
          suggestions: ['Include Content-Type header in your request']
        }
      }

      const baseContentType = contentType.split(';')[0].trim().toLowerCase()
      if (!this.config.allowedContentTypes.includes(baseContentType)) {
        return {
          allowed: false,
          reason: 'unsupported_content_type',
          riskLevel: 'MEDIUM',
          details: { contentType: baseContentType },
          suggestions: [`Use one of: ${this.config.allowedContentTypes.join(', ')}`]
        }
      }
    }

    return { allowed: true, riskLevel: 'LOW' }
  }

  /**
   * Check payload for suspicious patterns
   */
  private async checkPayloadPatterns(req: Request): Promise<DDoSCheckResult> {
    try {
      const clonedRequest = req.clone()
      const text = await clonedRequest.text()
      
      for (const pattern of this.config.suspiciousPatterns) {
        if (pattern.test(text)) {
          return {
            allowed: false,
            reason: 'suspicious_payload_pattern',
            riskLevel: 'CRITICAL',
            details: { 
              patternMatched: pattern.source,
              payloadSize: text.length
            },
            suggestions: ['Remove potentially malicious content from your request']
          }
        }
      }

      return { allowed: true, riskLevel: 'LOW' }
    } catch (error) {
      // If we can't read the payload, allow it but mark as medium risk
      return { 
        allowed: true, 
        riskLevel: 'MEDIUM',
        details: { error: 'Could not analyze payload' }
      }
    }
  }

  /**
   * Check IP reputation
   */
  private checkIPReputation(ipAddress: string): DDoSCheckResult {
    const ipInfo = this.getIPInfo(ipAddress)
    
    // Block if too much suspicious activity
    if (ipInfo.suspiciousActivity > 10) {
      const blockDuration = Math.min(ipInfo.suspiciousActivity * 60000, this.DAY_MS) // Max 24 hours
      ipInfo.blockedUntil = Date.now() + blockDuration
      
      return {
        allowed: false,
        reason: 'ip_reputation_blocked',
        riskLevel: 'CRITICAL',
        details: {
          suspiciousActivity: ipInfo.suspiciousActivity,
          blockedUntil: ipInfo.blockedUntil
        },
        suggestions: ['Contact support if you believe this is an error']
      }
    }

    const riskLevel = ipInfo.suspiciousActivity > 5 ? 'HIGH' : 
                     ipInfo.suspiciousActivity > 2 ? 'MEDIUM' : 'LOW'
    
    return { allowed: true, riskLevel }
  }

  /**
   * Utility methods
   */
  private extractIPAddress(req: Request): string {
    // Try various headers for real IP (common in proxied environments)
    return req.headers.get('CF-Connecting-IP') ||
           req.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
           req.headers.get('X-Real-IP') ||
           req.headers.get('X-Client-IP') ||
           '127.0.0.1'
  }

  private getContentLength(req: Request): number {
    const contentLength = req.headers.get('Content-Length')
    return contentLength ? parseInt(contentLength, 10) : 0
  }

  private getIPInfo(ipAddress: string): IPTrackingInfo {
    let ipInfo = this.ipTracking.get(ipAddress)
    
    if (!ipInfo) {
      ipInfo = {
        requestCount: 0,
        lastRequestTime: Date.now(),
        concurrentConnections: 0,
        suspiciousActivity: 0
      }
      this.ipTracking.set(ipAddress, ipInfo)
    }
    
    return ipInfo
  }

  private trackIPRequest(ipAddress: string, userAgent: string): void {
    const ipInfo = this.getIPInfo(ipAddress)
    const now = Date.now()
    
    // Reset counter if more than 1 hour has passed
    if (now - ipInfo.lastRequestTime > this.HOUR_MS) {
      ipInfo.requestCount = 1
    } else {
      ipInfo.requestCount++
    }
    
    ipInfo.lastRequestTime = now
    ipInfo.userAgent = userAgent.substring(0, 200) // Store truncated user agent
    ipInfo.concurrentConnections++
    
    // Schedule connection cleanup
    setTimeout(() => {
      ipInfo.concurrentConnections = Math.max(0, ipInfo.concurrentConnections - 1)
    }, 5000) // Assume request completes within 5 seconds
  }

  private incrementSuspiciousActivity(ipAddress: string): void {
    const ipInfo = this.getIPInfo(ipAddress)
    ipInfo.suspiciousActivity++
    
    console.warn(`🚨 Suspicious activity from IP ${ipAddress}: ${ipInfo.suspiciousActivity} incidents`)
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Clean up old IP tracking data
   */
  cleanupIPTracking(): number {
    const now = Date.now()
    let cleaned = 0
    
    for (const [ip, info] of this.ipTracking.entries()) {
      // Remove entries older than 24 hours with no recent activity
      if (now - info.lastRequestTime > this.DAY_MS && 
          info.concurrentConnections === 0 &&
          (!info.blockedUntil || now > info.blockedUntil)) {
        this.ipTracking.delete(ip)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old IP tracking entries`)
    }
    
    return cleaned
  }

  /**
   * Get DDoS protection statistics
   */
  getDDoSStats(): {
    config: DDoSProtectionConfig
    trackedIPs: number
    blockedIPs: number
    totalRequests: number
    suspiciousActivities: number
  } {
    const now = Date.now()
    let blockedIPs = 0
    let totalRequests = 0
    let suspiciousActivities = 0
    
    for (const [, info] of this.ipTracking.entries()) {
      if (info.blockedUntil && now < info.blockedUntil) {
        blockedIPs++
      }
      totalRequests += info.requestCount
      suspiciousActivities += info.suspiciousActivity
    }

    return {
      config: this.config,
      trackedIPs: this.ipTracking.size,
      blockedIPs,
      totalRequests,
      suspiciousActivities
    }
  }

  /**
   * Manually block IP (admin function)
   */
  blockIP(ipAddress: string, durationMs: number = this.HOUR_MS): void {
    const ipInfo = this.getIPInfo(ipAddress)
    ipInfo.blockedUntil = Date.now() + durationMs
    ipInfo.suspiciousActivity += 5 // Increase suspicious activity score
    
    console.warn(`🚫 Manually blocked IP ${ipAddress} for ${durationMs / 60000} minutes`)
  }

  /**
   * Manually unblock IP (admin function)
   */
  unblockIP(ipAddress: string): void {
    const ipInfo = this.ipTracking.get(ipAddress)
    if (ipInfo) {
      delete ipInfo.blockedUntil
      ipInfo.suspiciousActivity = Math.max(0, ipInfo.suspiciousActivity - 3)
      console.info(`✅ Manually unblocked IP ${ipAddress}`)
    }
  }

  /**
   * Test DDoS protection system functionality
   */
  async testDDoSProtection(): Promise<{ success: boolean; results: any[] }> {
    const results = []
    let allSuccess = true

    try {
      // Test 1: Content Length Validation
      const largePayload = 'x'.repeat(2 * 1024 * 1024) // 2MB
      const mockLargeRequest = new Request('http://test.com', {
        method: 'POST',
        headers: { 'Content-Length': largePayload.length.toString() },
        body: largePayload
      })

      const contentLengthTest = await this.checkRequest(mockLargeRequest)
      const contentLengthSuccess = !contentLengthTest.allowed
      
      results.push({
        test: 'Content Length Validation',
        success: contentLengthSuccess,
        details: contentLengthSuccess ? 'Large payload correctly rejected' : 'Failed to reject large payload'
      })
      allSuccess = allSuccess && contentLengthSuccess

      // Test 2: Suspicious Pattern Detection
      const maliciousPayload = "'; DROP TABLE users; --"
      const mockMaliciousRequest = new Request('http://test.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: maliciousPayload })
      })

      const patternTest = await this.checkRequest(mockMaliciousRequest)
      const patternSuccess = !patternTest.allowed
      
      results.push({
        test: 'Suspicious Pattern Detection',
        success: patternSuccess,
        details: patternSuccess ? 'SQL injection pattern detected' : 'Failed to detect malicious pattern'
      })
      allSuccess = allSuccess && patternSuccess

      // Test 3: User Agent Validation
      const mockBotRequest = new Request('http://test.com', {
        headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' }
      })

      const userAgentTest = await this.checkRequest(mockBotRequest)
      const userAgentSuccess = !userAgentTest.allowed
      
      results.push({
        test: 'User Agent Validation',
        success: userAgentSuccess,
        details: userAgentSuccess ? 'Bot user agent correctly blocked' : 'Failed to block bot user agent'
      })
      allSuccess = allSuccess && userAgentSuccess

      // Test 4: Valid Request Acceptance
      const validRequest = new Request('http://test.com', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({ valid: 'data' })
      })

      const validTest = await this.checkRequest(validRequest)
      const validSuccess = validTest.allowed
      
      results.push({
        test: 'Valid Request Acceptance',
        success: validSuccess,
        details: validSuccess ? 'Valid request correctly allowed' : 'Failed to allow valid request'
      })
      allSuccess = allSuccess && validSuccess

      // Test 5: IP Tracking
      const testIP = '192.168.1.100'
      this.trackIPRequest(testIP, 'Test User Agent')
      
      const ipInfo = this.getIPInfo(testIP)
      const ipTrackingSuccess = ipInfo.requestCount > 0
      
      results.push({
        test: 'IP Tracking',
        success: ipTrackingSuccess,
        details: ipTrackingSuccess ? `IP tracked with ${ipInfo.requestCount} requests` : 'IP tracking failed'
      })
      allSuccess = allSuccess && ipTrackingSuccess

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
export const ddosProtection = new DDoSProtectionManager()

/**
 * Helper function for Edge Function integration
 */
export async function checkDDoSProtection(req: Request): Promise<{
  allowed: boolean
  response?: Response
  result: DDoSCheckResult
}> {
  const result = await ddosProtection.checkRequest(req)

  if (!result.allowed) {
    const statusCode = result.riskLevel === 'CRITICAL' ? 403 : 
                      result.riskLevel === 'HIGH' ? 429 : 400

    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'request_blocked',
          reason: result.reason,
          message: 'Request blocked by DDoS protection',
          riskLevel: result.riskLevel,
          details: result.details,
          suggestions: result.suggestions
        }),
        {
          status: statusCode,
          headers: {
            'Content-Type': 'application/json',
            'X-Risk-Level': result.riskLevel,
            'X-Block-Reason': result.reason || 'unknown'
          }
        }
      ),
      result
    }
  }

  return {
    allowed: true,
    result
  }
}