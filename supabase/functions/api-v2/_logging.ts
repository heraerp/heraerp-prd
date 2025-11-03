/**
 * HERA API v2 - Structured Logging System
 * Smart Code: HERA.API.V2.LOGGING.STRUCTURED.v1
 * 
 * Enterprise-grade structured logging with request tracking, performance metrics,
 * and observability for debugging and monitoring
 */

export interface LogContext {
  requestId: string
  orgId: string
  actorId: string
  operation: string
  endpoint: string
  method: string
  userAgent?: string
  ipAddress?: string
  timestamp: number
}

export interface LogEntry {
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
  message: string
  context: LogContext
  metadata?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  performance?: {
    duration: number
    memoryUsage?: number
    cpuUsage?: number
  }
  tags?: string[]
}

export interface RequestMetrics {
  startTime: number
  endTime?: number
  duration?: number
  statusCode?: number
  responseSize?: number
  memoryUsage?: number
  guardrailViolations?: number
  rateLimitCheck?: boolean
  idempotencyCheck?: boolean
}

/**
 * Enterprise Structured Logger
 */
export class StructuredLogger {
  private requestMetrics: Map<string, RequestMetrics> = new Map()
  private logBuffer: LogEntry[] = []
  private readonly maxBufferSize = 1000
  private readonly isProduction = Deno.env.get('NODE_ENV') === 'production'

  /**
   * Create base log context from request
   */
  createLogContext(
    req: Request,
    orgId: string,
    actorId: string,
    operation: string,
    requestId: string
  ): LogContext {
    const url = new URL(req.url)
    
    return {
      requestId,
      orgId,
      actorId,
      operation,
      endpoint: url.pathname,
      method: req.method,
      userAgent: req.headers.get('User-Agent') || undefined,
      ipAddress: req.headers.get('CF-Connecting-IP') || 
                 req.headers.get('X-Forwarded-For') || 
                 req.headers.get('X-Real-IP') || 
                 'unknown',
      timestamp: Date.now()
    }
  }

  /**
   * Start request tracking
   */
  startRequest(requestId: string): void {
    this.requestMetrics.set(requestId, {
      startTime: performance.now(),
      memoryUsage: this.getMemoryUsage()
    })
  }

  /**
   * End request tracking
   */
  endRequest(requestId: string, statusCode: number, responseSize?: number): RequestMetrics | null {
    const metrics = this.requestMetrics.get(requestId)
    if (!metrics) return null

    metrics.endTime = performance.now()
    metrics.duration = metrics.endTime - metrics.startTime
    metrics.statusCode = statusCode
    metrics.responseSize = responseSize

    this.requestMetrics.delete(requestId)
    return metrics
  }

  /**
   * Log at DEBUG level
   */
  debug(message: string, context: LogContext, metadata?: Record<string, any>): void {
    if (this.isProduction) return // Skip debug logs in production
    
    this.log({
      level: 'DEBUG',
      message,
      context,
      metadata,
      tags: ['debug']
    })
  }

  /**
   * Log at INFO level
   */
  info(message: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log({
      level: 'INFO',
      message,
      context,
      metadata,
      tags: ['info']
    })
  }

  /**
   * Log at WARN level
   */
  warn(message: string, context: LogContext, metadata?: Record<string, any>): void {
    this.log({
      level: 'WARN',
      message,
      context,
      metadata,
      tags: ['warning']
    })
  }

  /**
   * Log at ERROR level
   */
  error(message: string, context: LogContext, error?: Error, metadata?: Record<string, any>): void {
    this.log({
      level: 'ERROR',
      message,
      context,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      } : undefined,
      tags: ['error']
    })
  }

  /**
   * Log at CRITICAL level
   */
  critical(message: string, context: LogContext, error?: Error, metadata?: Record<string, any>): void {
    this.log({
      level: 'CRITICAL',
      message,
      context,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      } : undefined,
      tags: ['critical', 'alert']
    })
  }

  /**
   * Log request start
   */
  logRequestStart(context: LogContext, payload?: any): void {
    this.startRequest(context.requestId)
    
    this.info('Request started', context, {
      payloadSize: payload ? JSON.stringify(payload).length : 0,
      hasPayload: !!payload
    })
  }

  /**
   * Log request end with metrics
   */
  logRequestEnd(
    context: LogContext, 
    statusCode: number, 
    responseSize?: number,
    additionalMetrics?: Record<string, any>
  ): void {
    const metrics = this.endRequest(context.requestId, statusCode, responseSize)
    
    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO'
    
    this.log({
      level,
      message: 'Request completed',
      context,
      metadata: {
        statusCode,
        responseSize,
        ...additionalMetrics
      },
      performance: metrics ? {
        duration: metrics.duration || 0,
        memoryUsage: metrics.memoryUsage
      } : undefined,
      tags: ['request_end', `status_${statusCode}`]
    })
  }

  /**
   * Log guardrails validation
   */
  logGuardrailsValidation(
    context: LogContext,
    result: { isValid: boolean; violations: string[]; warnings: string[]; metadata: any }
  ): void {
    const level = result.isValid ? 'INFO' : 'WARN'
    
    this.log({
      level,
      message: result.isValid ? 'Guardrails validation passed' : 'Guardrails validation failed',
      context,
      metadata: {
        isValid: result.isValid,
        violations: result.violations,
        warnings: result.warnings,
        rulesChecked: result.metadata.rulesChecked,
        validationTime: result.metadata.validationTime,
        securityLevel: result.metadata.securityLevel
      },
      tags: ['guardrails', result.isValid ? 'validation_passed' : 'validation_failed']
    })

    // Track guardrail violations in metrics
    const metrics = this.requestMetrics.get(context.requestId)
    if (metrics) {
      metrics.guardrailViolations = result.violations.length
    }
  }

  /**
   * Log rate limiting check
   */
  logRateLimitCheck(
    context: LogContext,
    result: { allowed: boolean; limit: number; remaining: number; operationType: string }
  ): void {
    const level = result.allowed ? 'DEBUG' : 'WARN'
    
    this.log({
      level,
      message: result.allowed ? 'Rate limit check passed' : 'Rate limit exceeded',
      context,
      metadata: {
        allowed: result.allowed,
        limit: result.limit,
        remaining: result.remaining,
        operationType: result.operationType
      },
      tags: ['rate_limit', result.allowed ? 'rate_limit_ok' : 'rate_limit_exceeded']
    })

    // Track rate limit check in metrics
    const metrics = this.requestMetrics.get(context.requestId)
    if (metrics) {
      metrics.rateLimitCheck = true
    }
  }

  /**
   * Log idempotency check
   */
  logIdempotencyCheck(
    context: LogContext,
    result: { isDuplicate: boolean; idempotencyKey: string }
  ): void {
    const level = result.isDuplicate ? 'INFO' : 'DEBUG'
    
    this.log({
      level,
      message: result.isDuplicate ? 'Duplicate request detected' : 'New request processed',
      context,
      metadata: {
        isDuplicate: result.isDuplicate,
        idempotencyKey: result.idempotencyKey
      },
      tags: ['idempotency', result.isDuplicate ? 'duplicate_request' : 'new_request']
    })

    // Track idempotency check in metrics
    const metrics = this.requestMetrics.get(context.requestId)
    if (metrics) {
      metrics.idempotencyCheck = true
    }
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(
    context: LogContext,
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    error?: Error
  ): void {
    const level = success ? 'DEBUG' : 'ERROR'
    
    this.log({
      level,
      message: `Database ${operation} on ${table} ${success ? 'succeeded' : 'failed'}`,
      context,
      metadata: {
        operation,
        table,
        success
      },
      performance: {
        duration
      },
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      tags: ['database', operation.toLowerCase(), success ? 'db_success' : 'db_error']
    })
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    context: LogContext,
    eventType: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    description: string,
    metadata?: Record<string, any>
  ): void {
    const level = severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'ERROR' : 'WARN'
    
    this.log({
      level,
      message: `Security event: ${eventType}`,
      context,
      metadata: {
        eventType,
        severity,
        description,
        ...metadata
      },
      tags: ['security', eventType.toLowerCase(), `severity_${severity.toLowerCase()}`]
    })
  }

  /**
   * Core logging method
   */
  private log(entry: LogEntry): void {
    // Add to buffer
    this.logBuffer.push(entry)
    
    // Maintain buffer size
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift()
    }

    // Output to console with structured format
    this.outputToConsole(entry)
    
    // In production, you would also send to external logging service
    if (this.isProduction) {
      this.sendToExternalLogger(entry)
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.context.timestamp).toISOString()
    const logObject = {
      timestamp,
      level: entry.level,
      message: entry.message,
      requestId: entry.context.requestId,
      orgId: entry.context.orgId,
      actorId: entry.context.actorId,
      operation: entry.context.operation,
      endpoint: entry.context.endpoint,
      method: entry.context.method,
      ...entry.metadata,
      ...(entry.performance && { performance: entry.performance }),
      ...(entry.error && { error: entry.error }),
      ...(entry.tags && { tags: entry.tags })
    }

    // Use appropriate console method based on level
    switch (entry.level) {
      case 'DEBUG':
        console.debug(JSON.stringify(logObject))
        break
      case 'INFO':
        console.info(JSON.stringify(logObject))
        break
      case 'WARN':
        console.warn(JSON.stringify(logObject))
        break
      case 'ERROR':
      case 'CRITICAL':
        console.error(JSON.stringify(logObject))
        break
    }
  }

  /**
   * Send to external logging service (placeholder)
   */
  private sendToExternalLogger(entry: LogEntry): void {
    // In production, this would send to services like:
    // - Datadog
    // - New Relic
    // - Elastic Stack
    // - Splunk
    // - Custom logging endpoint

    // For now, just track that it would be sent
    if (entry.level === 'CRITICAL' || entry.level === 'ERROR') {
      console.error('📤 Would send to external logger:', {
        level: entry.level,
        message: entry.message,
        requestId: entry.context.requestId
      })
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    try {
      // Deno memory usage API
      const memInfo = Deno.memoryUsage()
      return memInfo.heapUsed
    } catch {
      return 0
    }
  }

  /**
   * Get log statistics
   */
  getLogStats(): {
    bufferSize: number
    activeRequests: number
    logLevels: Record<string, number>
  } {
    const logLevels: Record<string, number> = {}
    
    for (const entry of this.logBuffer) {
      logLevels[entry.level] = (logLevels[entry.level] || 0) + 1
    }

    return {
      bufferSize: this.logBuffer.size,
      activeRequests: this.requestMetrics.size,
      logLevels
    }
  }

  /**
   * Get recent logs (for debugging)
   */
  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logBuffer.slice(-limit)
  }

  /**
   * Search logs by criteria
   */
  searchLogs(criteria: {
    requestId?: string
    orgId?: string
    level?: string
    tags?: string[]
    since?: number
  }): LogEntry[] {
    return this.logBuffer.filter(entry => {
      if (criteria.requestId && entry.context.requestId !== criteria.requestId) return false
      if (criteria.orgId && entry.context.orgId !== criteria.orgId) return false
      if (criteria.level && entry.level !== criteria.level) return false
      if (criteria.since && entry.context.timestamp < criteria.since) return false
      if (criteria.tags && !criteria.tags.some(tag => entry.tags?.includes(tag))) return false
      
      return true
    })
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logBuffer = []
    console.info('📄 Log buffer cleared')
  }

  /**
   * Test logging system functionality
   */
  async testLogging(): Promise<{ success: boolean; results: any[] }> {
    const results = []
    let allSuccess = true

    try {
      // Test 1: Basic Logging
      const testContext: LogContext = {
        requestId: 'test-request-123',
        orgId: 'test-org-123',
        actorId: 'test-actor-123',
        operation: 'TEST',
        endpoint: '/test',
        method: 'POST',
        timestamp: Date.now()
      }

      this.info('Test log message', testContext, { test: true })
      
      const recentLogs = this.getRecentLogs(1)
      const basicLoggingSuccess = recentLogs.length > 0 && recentLogs[0].message === 'Test log message'
      
      results.push({
        test: 'Basic Logging',
        success: basicLoggingSuccess,
        details: basicLoggingSuccess ? 'Log entry created successfully' : 'Failed to create log entry'
      })
      allSuccess = allSuccess && basicLoggingSuccess

      // Test 2: Request Tracking
      const testRequestId = 'test-request-tracking-123'
      this.startRequest(testRequestId)
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const metrics = this.endRequest(testRequestId, 200, 1024)
      const trackingSuccess = metrics !== null && typeof metrics.duration === 'number'
      
      results.push({
        test: 'Request Tracking',
        success: trackingSuccess,
        details: trackingSuccess ? `Duration: ${metrics?.duration?.toFixed(2)}ms` : 'Request tracking failed'
      })
      allSuccess = allSuccess && trackingSuccess

      // Test 3: Log Search
      const searchResults = this.searchLogs({ requestId: testContext.requestId })
      const searchSuccess = searchResults.length > 0
      
      results.push({
        test: 'Log Search',
        success: searchSuccess,
        details: searchSuccess ? `Found ${searchResults.length} log entries` : 'Log search failed'
      })
      allSuccess = allSuccess && searchSuccess

      // Test 4: Error Logging
      const testError = new Error('Test error message')
      this.error('Test error log', testContext, testError)
      
      const errorLogs = this.searchLogs({ level: 'ERROR' })
      const errorLoggingSuccess = errorLogs.some(log => log.error?.message === 'Test error message')
      
      results.push({
        test: 'Error Logging',
        success: errorLoggingSuccess,
        details: errorLoggingSuccess ? 'Error logged with stack trace' : 'Error logging failed'
      })
      allSuccess = allSuccess && errorLoggingSuccess

      // Test 5: Log Statistics
      const stats = this.getLogStats()
      const statsSuccess = typeof stats.bufferSize === 'number' && typeof stats.activeRequests === 'number'
      
      results.push({
        test: 'Log Statistics',
        success: statsSuccess,
        details: statsSuccess ? 
          `Buffer: ${stats.bufferSize}, Active: ${stats.activeRequests}` : 
          'Statistics collection failed'
      })
      allSuccess = allSuccess && statsSuccess

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
export const logger = new StructuredLogger()

/**
 * Helper function to create request correlation ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Helper function for performance measurement
 */
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve, reject) => {
    const startTime = performance.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - startTime
      resolve({ result, duration })
    } catch (error) {
      const duration = performance.now() - startTime
      console.error(`Performance measurement failed for ${operation} after ${duration}ms:`, error)
      reject(error)
    }
  })
}

/**
 * Helper function to extract error details
 */
export function extractErrorDetails(error: unknown): {
  name: string
  message: string
  stack?: string
  code?: string
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    }
  }

  return {
    name: 'UnknownError',
    message: String(error)
  }
}