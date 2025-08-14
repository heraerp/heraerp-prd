/**
 * Production Audit Logger
 * Comprehensive audit trail for compliance and security
 */

export interface AuditEvent {
  eventType: string
  userId?: string
  organizationId: string
  resourceId?: string
  resourceType?: string
  action: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  correlationId?: string
  timestamp: number
}

export class AuditLogger {
  private buffer: AuditEvent[] = []
  private bufferSize = 100
  private flushInterval = 5000 // 5 seconds

  constructor() {
    // Periodically flush buffer
    setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  /**
   * Log transaction creation
   */
  async logTransactionCreation(data: {
    organizationId: string
    operationId: string
    transactionType: string
    amount: number
    priority: string
    userId?: string
    ipAddress?: string
  }): Promise<void> {
    await this.log({
      eventType: 'TRANSACTION_CREATED',
      organizationId: data.organizationId,
      userId: data.userId,
      action: 'create',
      resourceType: 'transaction',
      details: {
        operationId: data.operationId,
        transactionType: data.transactionType,
        amount: data.amount,
        priority: data.priority
      },
      ipAddress: data.ipAddress,
      timestamp: Date.now()
    })
  }

  /**
   * Log AI classification events
   */
  async logAIClassification(data: {
    organizationId: string
    smartCode: string
    confidence: number
    success: boolean
    userId?: string
  }): Promise<void> {
    await this.log({
      eventType: 'AI_CLASSIFICATION',
      organizationId: data.organizationId,
      userId: data.userId,
      action: 'classify',
      resourceType: 'ai_model',
      details: {
        smartCode: data.smartCode,
        confidence: data.confidence,
        success: data.success
      },
      timestamp: Date.now()
    })
  }

  /**
   * Log error events
   */
  async logError(data: {
    error: string
    stack?: string
    context: Record<string, any>
    severity: string
    timestamp: number
  }): Promise<void> {
    await this.log({
      eventType: 'ERROR_OCCURRED',
      organizationId: data.context.organizationId || 'unknown',
      action: 'error',
      details: {
        error: data.error,
        stack: data.stack,
        context: data.context,
        severity: data.severity
      },
      timestamp: data.timestamp
    })
  }

  /**
   * Log AI-specific errors
   */
  async logAIError(data: {
    error: string
    context: {
      smartCode: string
      organizationId: string
      metadataSize: number
    }
    timestamp: number
  }): Promise<void> {
    await this.log({
      eventType: 'AI_ERROR',
      organizationId: data.context.organizationId,
      action: 'ai_classification_failed',
      resourceType: 'ai_model',
      details: {
        error: data.error,
        smartCode: data.context.smartCode,
        metadataSize: data.context.metadataSize
      },
      timestamp: data.timestamp
    })
  }

  /**
   * Log security events
   */
  async logSecurityEvent(data: {
    eventType: 'AUTHENTICATION_FAILED' | 'AUTHORIZATION_DENIED' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY'
    organizationId: string
    userId?: string
    ipAddress?: string
    userAgent?: string
    details?: Record<string, any>
  }): Promise<void> {
    await this.log({
      eventType: data.eventType,
      organizationId: data.organizationId,
      userId: data.userId,
      action: 'security_violation',
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: Date.now()
    })
  }

  /**
   * Log data access events
   */
  async logDataAccess(data: {
    organizationId: string
    userId?: string
    resourceType: string
    resourceId: string
    action: 'read' | 'write' | 'delete'
    sensitiveData?: boolean
    ipAddress?: string
  }): Promise<void> {
    await this.log({
      eventType: 'DATA_ACCESS',
      organizationId: data.organizationId,
      userId: data.userId,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      action: data.action,
      details: {
        sensitiveData: data.sensitiveData || false
      },
      ipAddress: data.ipAddress,
      timestamp: Date.now()
    })
  }

  /**
   * Log configuration changes
   */
  async logConfigurationChange(data: {
    organizationId: string
    userId: string
    configType: string
    oldValue?: any
    newValue: any
    ipAddress?: string
  }): Promise<void> {
    await this.log({
      eventType: 'CONFIGURATION_CHANGED',
      organizationId: data.organizationId,
      userId: data.userId,
      action: 'update',
      resourceType: 'configuration',
      details: {
        configType: data.configType,
        oldValue: data.oldValue,
        newValue: data.newValue
      },
      ipAddress: data.ipAddress,
      timestamp: Date.now()
    })
  }

  /**
   * Core audit logging method
   */
  private async log(event: AuditEvent): Promise<void> {
    try {
      // Add to buffer
      this.buffer.push(event)
      
      // Flush if buffer is full
      if (this.buffer.length >= this.bufferSize) {
        await this.flush()
      }
      
      // Immediate flush for critical events
      if (this.isCriticalEvent(event)) {
        await this.flush()
      }
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }

  /**
   * Flush audit buffer to persistent storage
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const events = [...this.buffer]
    this.buffer = []

    try {
      // Send to audit storage system
      await this.sendToAuditStorage(events)
      
      // Also send critical events to SIEM
      const criticalEvents = events.filter(e => this.isCriticalEvent(e))
      if (criticalEvents.length > 0) {
        await this.sendToSIEM(criticalEvents)
      }
    } catch (error) {
      console.error('Failed to flush audit events:', error)
      
      // Re-add events to buffer for retry (with limit to prevent memory issues)
      if (this.buffer.length < this.bufferSize) {
        this.buffer.unshift(...events.slice(0, this.bufferSize - this.buffer.length))
      }
    }
  }

  /**
   * Send events to audit storage (database, file, etc.)
   */
  private async sendToAuditStorage(events: AuditEvent[]): Promise<void> {
    // TODO: Implement actual audit storage
    // This could be:
    // - Database table for audit logs
    // - Secure file storage
    // - External audit service
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 Audit: ${events.length} events logged`)
      events.forEach(event => {
        console.log(`  ${event.eventType}: ${event.action} by ${event.userId || 'system'} on ${event.organizationId}`)
      })
    }
    
    // Example database implementation:
    // await this.database.insert('audit_logs', events)
    
    // Example file implementation:
    // await this.fileLogger.writeEvents(events)
  }

  /**
   * Send critical events to SIEM system
   */
  private async sendToSIEM(events: AuditEvent[]): Promise<void> {
    // TODO: Implement SIEM integration
    // Examples: Splunk, QRadar, Sentinel, etc.
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 SIEM Alert: ${events.length} critical audit events`)
    }
    
    // Example SIEM implementations:
    // await this.splunkClient.sendEvents(events)
    // await this.sentinelClient.postLogs(events)
  }

  /**
   * Check if event is critical for security/compliance
   */
  private isCriticalEvent(event: AuditEvent): boolean {
    const criticalEventTypes = [
      'ERROR_OCCURRED',
      'AI_ERROR', 
      'AUTHENTICATION_FAILED',
      'AUTHORIZATION_DENIED',
      'SUSPICIOUS_ACTIVITY',
      'CONFIGURATION_CHANGED'
    ]
    
    const criticalActions = [
      'delete',
      'security_violation',
      'error'
    ]
    
    return criticalEventTypes.includes(event.eventType) ||
           criticalActions.includes(event.action) ||
           (event.details?.severity === 'critical')
  }

  /**
   * Query audit logs (for compliance reporting)
   */
  async queryAuditLogs(criteria: {
    organizationId: string
    startDate: Date
    endDate: Date
    eventTypes?: string[]
    userId?: string
    resourceType?: string
    limit?: number
  }): Promise<AuditEvent[]> {
    // TODO: Implement audit log querying
    // This would typically query your audit storage system
    
    console.log('Querying audit logs with criteria:', criteria)
    return [] // Placeholder
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEvents: number
    eventsByType: Record<string, number>
    securityEvents: number
    dataAccessEvents: number
    errorEvents: number
    complianceScore: number
  }> {
    // TODO: Implement compliance reporting
    // This would analyze audit logs for compliance metrics
    
    return {
      totalEvents: 0,
      eventsByType: {},
      securityEvents: 0,
      dataAccessEvents: 0,
      errorEvents: 0,
      complianceScore: 100 // Placeholder
    }
  }

  /**
   * Get audit statistics
   */
  getStats(): {
    bufferSize: number
    totalEventsLogged: number
    lastFlushTime: number
  } {
    return {
      bufferSize: this.buffer.length,
      totalEventsLogged: 0, // TODO: Track this
      lastFlushTime: Date.now() // TODO: Track actual last flush
    }
  }
}

export default AuditLogger