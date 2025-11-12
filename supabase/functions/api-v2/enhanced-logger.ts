/**
 * Enhanced Logger for HERA Finance v2.2
 * Provides structured JSON logging with audit trails
 * Features: Actor tracing, GL validation logs, performance metrics
 * 
 * Week 3: Enhanced Observability Infrastructure
 */

interface LogContext {
  requestId: string
  actorId?: string
  organizationId?: string
  operation?: string
  entityType?: string
  smartCode?: string
  timestamp?: string
}

interface AuditEvent {
  eventType: 'entity_created' | 'entity_updated' | 'entity_deleted' | 'transaction_created' | 'gl_posting' | 'security_violation' | 'performance_warning'
  actorId: string
  organizationId: string
  entityId?: string
  transactionId?: string
  changes?: any[]
  metadata?: Record<string, any>
  severity: 'info' | 'warn' | 'error' | 'critical'
}

interface PerformanceMetric {
  operation: string
  duration: number
  requestId: string
  actorId?: string
  organizationId?: string
  cacheHit?: boolean
  dbQueries?: number
  status: 'success' | 'error' | 'timeout'
}

export class HERAEnhancedLogger {
  private context: LogContext

  constructor(context: LogContext) {
    this.context = {
      ...context,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Structured info logging with full context
   */
  info(message: string, data?: any) {
    const logEntry = {
      level: 'info',
      message,
      context: this.context,
      data,
      timestamp: new Date().toISOString()
    }
    console.log(JSON.stringify(logEntry))
  }

  /**
   * Warning logs with actor context
   */
  warn(message: string, data?: any) {
    const logEntry = {
      level: 'warn',
      message,
      context: this.context,
      data,
      timestamp: new Date().toISOString()
    }
    console.warn(JSON.stringify(logEntry))
  }

  /**
   * Error logs with full audit trail
   */
  error(message: string, error?: Error, data?: any) {
    const logEntry = {
      level: 'error',
      message,
      context: this.context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      data,
      timestamp: new Date().toISOString()
    }
    console.error(JSON.stringify(logEntry))
  }

  /**
   * Audit event logging for compliance
   */
  audit(event: AuditEvent) {
    const auditEntry = {
      level: 'audit',
      eventType: event.eventType,
      context: this.context,
      event: {
        ...event,
        timestamp: new Date().toISOString(),
        traceId: this.context.requestId
      }
    }
    console.log(JSON.stringify(auditEntry))

    // For critical events, also send to monitoring service
    if (event.severity === 'critical') {
      this.sendCriticalAlert(auditEntry)
    }
  }

  /**
   * Performance metrics logging
   */
  performance(metric: PerformanceMetric) {
    const perfEntry = {
      level: 'performance',
      context: this.context,
      metric: {
        ...metric,
        timestamp: new Date().toISOString()
      }
    }
    console.log(JSON.stringify(perfEntry))

    // Log performance warnings
    if (metric.duration > 1000) {
      this.warn(`Slow operation detected: ${metric.operation}`, {
        duration: metric.duration,
        status: metric.status
      })
    }
  }

  /**
   * GL Balance validation logging
   */
  glAudit(transactionId: string, validation: {
    currency: string
    debitTotal: number
    creditTotal: number
    isBalanced: boolean
    entries: any[]
  }) {
    const glAuditEntry = {
      level: 'gl_audit',
      transactionId,
      context: this.context,
      validation: {
        ...validation,
        timestamp: new Date().toISOString(),
        actorId: this.context.actorId,
        organizationId: this.context.organizationId
      }
    }
    
    console.log(JSON.stringify(glAuditEntry))

    // Audit unbalanced GL entries as security violations
    if (!validation.isBalanced) {
      this.audit({
        eventType: 'security_violation',
        actorId: this.context.actorId || 'system',
        organizationId: this.context.organizationId || 'unknown',
        transactionId,
        metadata: {
          violationType: 'unbalanced_gl_entry',
          debitTotal: validation.debitTotal,
          creditTotal: validation.creditTotal,
          variance: Math.abs(validation.debitTotal - validation.creditTotal)
        },
        severity: 'critical'
      })
    }
  }

  /**
   * Actor activity tracing
   */
  actorTrace(action: string, entityId?: string, metadata?: any) {
    const traceEntry = {
      level: 'actor_trace',
      action,
      entityId,
      context: this.context,
      metadata,
      timestamp: new Date().toISOString()
    }
    console.log(JSON.stringify(traceEntry))
  }

  /**
   * Rate limiting events
   */
  rateLimitEvent(actorId: string, orgId: string, limit: number, current: number) {
    const rateLimitEntry = {
      level: 'rate_limit',
      context: this.context,
      event: {
        actorId,
        organizationId: orgId,
        limit,
        current,
        exceeded: current > limit,
        timestamp: new Date().toISOString()
      }
    }
    console.log(JSON.stringify(rateLimitEntry))

    if (current > limit) {
      this.audit({
        eventType: 'security_violation',
        actorId,
        organizationId: orgId,
        metadata: {
          violationType: 'rate_limit_exceeded',
          limit,
          current,
          requestId: this.context.requestId
        },
        severity: 'warn'
      })
    }
  }

  /**
   * Cache performance logging
   */
  cacheEvent(operation: 'hit' | 'miss' | 'set' | 'invalidate', key: string, duration?: number) {
    const cacheEntry = {
      level: 'cache',
      context: this.context,
      event: {
        operation,
        key,
        duration,
        timestamp: new Date().toISOString()
      }
    }
    console.log(JSON.stringify(cacheEntry))
  }

  /**
   * Smart Code validation logging
   */
  smartCodeValidation(smartCode: string, isValid: boolean, pattern?: string) {
    const validationEntry = {
      level: 'smart_code_validation',
      context: this.context,
      validation: {
        smartCode,
        isValid,
        pattern,
        timestamp: new Date().toISOString()
      }
    }
    console.log(JSON.stringify(validationEntry))

    if (!isValid) {
      this.audit({
        eventType: 'security_violation',
        actorId: this.context.actorId || 'system',
        organizationId: this.context.organizationId || 'unknown',
        metadata: {
          violationType: 'invalid_smart_code',
          smartCode,
          pattern,
          requestId: this.context.requestId
        },
        severity: 'warn'
      })
    }
  }

  /**
   * Send critical alerts to monitoring service
   */
  private async sendCriticalAlert(auditEntry: any) {
    try {
      // In production, this would integrate with PagerDuty, Slack, etc.
      console.error('🚨 CRITICAL ALERT:', JSON.stringify(auditEntry, null, 2))
      
      // Example: Send to monitoring webhook
      // await fetch(process.env.MONITORING_WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(auditEntry)
      // })
    } catch (error) {
      console.error('Failed to send critical alert:', error)
    }
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: Partial<LogContext>): HERAEnhancedLogger {
    return new HERAEnhancedLogger({
      ...this.context,
      ...additionalContext
    })
  }
}

/**
 * Factory function for creating loggers with request context
 */
export function createHERALogger(req: Request): HERAEnhancedLogger {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
  const organizationId = req.headers.get('x-organization-id') || undefined
  
  return new HERAEnhancedLogger({
    requestId,
    organizationId,
    operation: req.method + ' ' + new URL(req.url).pathname
  })
}

/**
 * Express-style logging middleware adapter
 */
export function withHERALogging<T>(
  handler: (logger: HERAEnhancedLogger, ...args: any[]) => Promise<T>
) {
  return async (req: Request, ...args: any[]): Promise<T> => {
    const logger = createHERALogger(req)
    const startTime = Date.now()
    
    logger.info('Request started', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    })

    try {
      const result = await handler(logger, req, ...args)
      
      const duration = Date.now() - startTime
      logger.performance({
        operation: req.method + ' ' + new URL(req.url).pathname,
        duration,
        requestId: logger['context'].requestId,
        status: 'success'
      })

      logger.info('Request completed', { duration, status: 'success' })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error('Request failed', error as Error, { duration })
      
      logger.performance({
        operation: req.method + ' ' + new URL(req.url).pathname,
        duration,
        requestId: logger['context'].requestId,
        status: 'error'
      })

      throw error
    }
  }
}

/**
 * Example usage patterns for HERA Finance logging
 */
export const HERALoggingExamples = {
  // Entity creation with audit trail
  entityCreated: (logger: HERAEnhancedLogger, entityId: string, entityType: string) => {
    logger.audit({
      eventType: 'entity_created',
      actorId: logger['context'].actorId || 'system',
      organizationId: logger['context'].organizationId || 'unknown',
      entityId,
      metadata: { entityType },
      severity: 'info'
    })
  },

  // GL posting validation
  glPosting: (logger: HERAEnhancedLogger, transactionId: string, entries: any[]) => {
    const debitTotal = entries.filter(e => e.side === 'DR').reduce((sum, e) => sum + e.amount, 0)
    const creditTotal = entries.filter(e => e.side === 'CR').reduce((sum, e) => sum + e.amount, 0)
    const isBalanced = Math.abs(debitTotal - creditTotal) < 0.01

    logger.glAudit(transactionId, {
      currency: 'AED',
      debitTotal,
      creditTotal,
      isBalanced,
      entries
    })
  },

  // Performance monitoring
  slowQuery: (logger: HERAEnhancedLogger, query: string, duration: number) => {
    logger.performance({
      operation: 'database_query',
      duration,
      requestId: logger['context'].requestId,
      status: duration > 2000 ? 'timeout' : 'success'
    })

    if (duration > 2000) {
      logger.warn('Slow database query detected', { query, duration })
    }
  }
}