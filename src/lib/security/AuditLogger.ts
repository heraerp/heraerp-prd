/**
 * HERA Universal Tile System - Audit Logger
 * Smart Code: HERA.SECURITY.AUDIT.LOGGER.v1
 * 
 * Comprehensive audit logging for security compliance and monitoring
 */

export interface AuditEvent {
  id: string
  timestamp: Date
  actorUserId: string
  organizationId: string
  sessionId?: string
  
  // Event classification
  eventType: 'access' | 'action' | 'data_access' | 'security' | 'authentication' | 'authorization'
  action: string
  resource: {
    type: 'tile' | 'workspace' | 'data' | 'permission' | 'session' | 'api'
    id?: string
    name?: string
  }
  
  // Security context
  result: 'success' | 'failure' | 'denied' | 'error'
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  // Request context
  ipAddress?: string
  userAgent?: string
  requestId?: string
  
  // Event details
  details?: Record<string, any>
  metadata?: Record<string, any>
  
  // Compliance tracking
  compliance: {
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted'
    retentionDays: number
    requiresReview: boolean
  }
}

export interface AuditMetrics {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  securityViolations: number
  accessDenials: number
  lastAuditTime: Date
}

/**
 * Audit Logger Class
 * Handles all audit logging with enterprise-grade features
 */
export class AuditLogger {
  private events: AuditEvent[] = []
  private maxEvents: number = 10000
  private batchSize: number = 100
  private pendingBatch: AuditEvent[] = []
  private flushInterval: number = 30000 // 30 seconds
  private flushTimer?: NodeJS.Timeout

  constructor(maxEvents: number = 10000) {
    this.maxEvents = maxEvents
    this.startBatchFlush()
  }

  /**
   * Log a security event
   */
  public logEvent(eventData: Partial<AuditEvent>): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      actorUserId: eventData.actorUserId || 'unknown',
      organizationId: eventData.organizationId || '00000000-0000-0000-0000-000000000000',
      sessionId: eventData.sessionId,
      
      eventType: eventData.eventType || 'action',
      action: eventData.action || 'unknown_action',
      resource: eventData.resource || { type: 'unknown' },
      
      result: eventData.result || 'success',
      severity: eventData.severity || 'low',
      
      ipAddress: eventData.ipAddress,
      userAgent: eventData.userAgent,
      requestId: eventData.requestId,
      
      details: eventData.details || {},
      metadata: eventData.metadata || {},
      
      compliance: eventData.compliance || {
        dataClassification: 'internal',
        retentionDays: 2555, // 7 years for financial data
        requiresReview: false
      }
    }

    // Add to memory store
    this.events.push(event)
    
    // Add to pending batch for external logging
    this.pendingBatch.push(event)

    // Trim memory if exceeds limit
    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents)
    }

    // Immediate flush for critical events
    if (event.severity === 'critical' || event.result === 'denied') {
      this.flushBatch()
    }

    // Console logging for development
    this.logToConsole(event)
  }

  /**
   * Log tile access events
   */
  public logTileAccess(
    actorUserId: string,
    organizationId: string,
    tileId: string,
    tileName: string,
    result: 'success' | 'denied',
    details?: Record<string, any>
  ): void {
    this.logEvent({
      actorUserId,
      organizationId,
      eventType: 'access',
      action: 'tile_access',
      resource: { type: 'tile', id: tileId, name: tileName },
      result,
      severity: result === 'denied' ? 'medium' : 'low',
      details: {
        tileId,
        tileName,
        accessTime: new Date().toISOString(),
        ...details
      },
      compliance: {
        dataClassification: 'confidential',
        retentionDays: 2555,
        requiresReview: result === 'denied'
      }
    })
  }

  /**
   * Log tile action events
   */
  public logTileAction(
    actorUserId: string,
    organizationId: string,
    tileId: string,
    actionId: string,
    actionParams?: any,
    result: 'success' | 'failure' | 'denied' = 'success'
  ): void {
    const severity = (() => {
      if (result === 'denied') return 'medium'
      if (['export', 'delete', 'edit'].includes(actionId)) return 'medium'
      return 'low'
    })()

    this.logEvent({
      actorUserId,
      organizationId,
      eventType: 'action',
      action: `tile_action_${actionId}`,
      resource: { type: 'tile', id: tileId },
      result,
      severity,
      details: {
        tileId,
        actionId,
        actionParams,
        executionTime: new Date().toISOString()
      },
      compliance: {
        dataClassification: ['export', 'edit', 'delete'].includes(actionId) ? 'restricted' : 'confidential',
        retentionDays: 2555,
        requiresReview: result === 'denied' || ['export', 'delete'].includes(actionId)
      }
    })
  }

  /**
   * Log data access events
   */
  public logDataAccess(
    actorUserId: string,
    organizationId: string,
    dataType: string,
    dataId?: string,
    result: 'success' | 'denied' = 'success',
    accessLevel: 'read' | 'write' | 'delete' = 'read'
  ): void {
    this.logEvent({
      actorUserId,
      organizationId,
      eventType: 'data_access',
      action: `data_${accessLevel}`,
      resource: { type: 'data', id: dataId, name: dataType },
      result,
      severity: result === 'denied' ? 'high' : accessLevel === 'delete' ? 'medium' : 'low',
      details: {
        dataType,
        dataId,
        accessLevel,
        accessTime: new Date().toISOString()
      },
      compliance: {
        dataClassification: 'restricted',
        retentionDays: 2555,
        requiresReview: result === 'denied' || accessLevel === 'delete'
      }
    })
  }

  /**
   * Log security violations
   */
  public logSecurityViolation(
    actorUserId: string,
    organizationId: string,
    violationType: string,
    description: string,
    details?: Record<string, any>
  ): void {
    this.logEvent({
      actorUserId,
      organizationId,
      eventType: 'security',
      action: `security_violation_${violationType}`,
      resource: { type: 'permission' },
      result: 'denied',
      severity: 'critical',
      details: {
        violationType,
        description,
        detectedAt: new Date().toISOString(),
        ...details
      },
      compliance: {
        dataClassification: 'restricted',
        retentionDays: 2555,
        requiresReview: true
      }
    })
  }

  /**
   * Log authentication events
   */
  public logAuthentication(
    actorUserId: string,
    organizationId: string,
    action: 'login' | 'logout' | 'session_extend' | 'session_expire',
    result: 'success' | 'failure',
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.logEvent({
      actorUserId,
      organizationId,
      eventType: 'authentication',
      action: `auth_${action}`,
      resource: { type: 'session' },
      result,
      severity: result === 'failure' ? 'medium' : 'low',
      ipAddress,
      userAgent,
      details: {
        authAction: action,
        authTime: new Date().toISOString()
      },
      compliance: {
        dataClassification: 'confidential',
        retentionDays: 2555,
        requiresReview: result === 'failure'
      }
    })
  }

  /**
   * Get audit metrics
   */
  public getMetrics(): AuditMetrics {
    const eventsByType: Record<string, number> = {}
    const eventsBySeverity: Record<string, number> = {}
    let securityViolations = 0
    let accessDenials = 0

    this.events.forEach(event => {
      // Count by type
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1
      
      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1
      
      // Count violations
      if (event.eventType === 'security') {
        securityViolations++
      }
      
      // Count access denials
      if (event.result === 'denied') {
        accessDenials++
      }
    })

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      securityViolations,
      accessDenials,
      lastAuditTime: new Date()
    }
  }

  /**
   * Get events by filter criteria
   */
  public getEvents(filters?: {
    actorUserId?: string
    organizationId?: string
    eventType?: string
    severity?: string
    result?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }): AuditEvent[] {
    let filteredEvents = [...this.events]

    if (filters) {
      if (filters.actorUserId) {
        filteredEvents = filteredEvents.filter(e => e.actorUserId === filters.actorUserId)
      }
      
      if (filters.organizationId) {
        filteredEvents = filteredEvents.filter(e => e.organizationId === filters.organizationId)
      }
      
      if (filters.eventType) {
        filteredEvents = filteredEvents.filter(e => e.eventType === filters.eventType)
      }
      
      if (filters.severity) {
        filteredEvents = filteredEvents.filter(e => e.severity === filters.severity)
      }
      
      if (filters.result) {
        filteredEvents = filteredEvents.filter(e => e.result === filters.result)
      }
      
      if (filters.startDate) {
        filteredEvents = filteredEvents.filter(e => e.timestamp >= filters.startDate!)
      }
      
      if (filters.endDate) {
        filteredEvents = filteredEvents.filter(e => e.timestamp <= filters.endDate!)
      }
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Apply limit
    if (filters?.limit) {
      filteredEvents = filteredEvents.slice(0, filters.limit)
    }

    return filteredEvents
  }

  /**
   * Export audit log for compliance
   */
  public exportAuditLog(organizationId: string, format: 'json' | 'csv' = 'json'): string {
    const orgEvents = this.getEvents({ organizationId })
    
    if (format === 'csv') {
      const headers = [
        'Timestamp', 'Actor User ID', 'Organization ID', 'Event Type', 'Action',
        'Resource Type', 'Resource ID', 'Result', 'Severity', 'IP Address'
      ]
      
      const rows = orgEvents.map(event => [
        event.timestamp.toISOString(),
        event.actorUserId,
        event.organizationId,
        event.eventType,
        event.action,
        event.resource.type,
        event.resource.id || '',
        event.result,
        event.severity,
        event.ipAddress || ''
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }
    
    return JSON.stringify(orgEvents, null, 2)
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Log to console for development
   */
  private logToConsole(event: AuditEvent): void {
    const prefix = this.getSeverityPrefix(event.severity)
    const message = `${prefix} Audit: ${event.action} by ${event.actorUserId} (${event.result})`
    
    switch (event.severity) {
      case 'critical':
        console.error(message, event)
        break
      case 'high':
        console.warn(message, event)
        break
      case 'medium':
        console.info(message, event)
        break
      default:
        console.log(message, event)
    }
  }

  /**
   * Get severity prefix for console logging
   */
  private getSeverityPrefix(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '📊'
      default: return '📝'
    }
  }

  /**
   * Start batch flush timer
   */
  private startBatchFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushBatch()
    }, this.flushInterval)
  }

  /**
   * Flush pending batch to external logging service
   */
  private flushBatch(): void {
    if (this.pendingBatch.length === 0) return

    // In production, this would send to external audit service
    console.log(`📤 Flushing ${this.pendingBatch.length} audit events to external service`)
    
    // Clear the batch
    this.pendingBatch = []
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flushBatch()
  }
}

/**
 * Global audit logger instance
 */
export const globalAuditLogger = new AuditLogger()

/**
 * React Hook for Audit Logging
 */
export function useAuditLogger() {
  return {
    logTileAccess: globalAuditLogger.logTileAccess.bind(globalAuditLogger),
    logTileAction: globalAuditLogger.logTileAction.bind(globalAuditLogger),
    logDataAccess: globalAuditLogger.logDataAccess.bind(globalAuditLogger),
    logSecurityViolation: globalAuditLogger.logSecurityViolation.bind(globalAuditLogger),
    logAuthentication: globalAuditLogger.logAuthentication.bind(globalAuditLogger),
    getMetrics: globalAuditLogger.getMetrics.bind(globalAuditLogger),
    getEvents: globalAuditLogger.getEvents.bind(globalAuditLogger),
    exportAuditLog: globalAuditLogger.exportAuditLog.bind(globalAuditLogger)
  }
}

export default AuditLogger