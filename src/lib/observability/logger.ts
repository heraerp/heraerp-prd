/**
 * HERA Structured Logger
 * JSON structured logging with context preservation
 */

import winston from 'winston'
import { v4 as uuidv4 } from 'uuid'

export interface LogContext {
  organization_id: string
  user_id?: string
  smart_code?: string
  transaction_id?: string
  trace_id?: string
  span_id?: string
  request_id?: string
  ai_confidence?: number
  latency_ms?: number
}

export class HeraLogger {
  private static instance: HeraLogger
  private logger: winston.Logger
  private contextStore: Map<string, LogContext> = new Map()

  constructor() {
    this.logger = this.createLogger()
  }

  static getInstance(): HeraLogger {
    if (!this.instance) {
      this.instance = new HeraLogger()
    }
    return this.instance
  }

  /**
   * Create Winston logger
   */
  private createLogger(): winston.Logger {
    const formats = [
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ]

    // Add colorization in development
    if (process.env.NODE_ENV === 'development') {
      formats.push(winston.format.colorize())
      formats.push(winston.format.simple())
    }

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(...formats),
      defaultMeta: {
        service: 'hera-enterprise',
        version: process.env.HERA_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        new winston.transports.Console({
          handleExceptions: true,
          handleRejections: true,
        }),
      ],
    })
  }

  /**
   * Set context for current request
   */
  setContext(requestId: string, context: LogContext) {
    this.contextStore.set(requestId, context)
  }

  /**
   * Clear context after request
   */
  clearContext(requestId: string) {
    this.contextStore.delete(requestId)
  }

  /**
   * Get current context
   */
  getContext(requestId: string): LogContext | undefined {
    return this.contextStore.get(requestId)
  }

  /**
   * Log with context
   */
  private logWithContext(
    level: string,
    message: string,
    meta?: Record<string, any>,
    requestId?: string
  ) {
    const context = requestId ? this.getContext(requestId) : {}
    const logId = uuidv4()

    const logData = {
      log_id: logId,
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
      ...meta,
      // Ensure sensitive data is not logged
      ...(meta?.password && { password: '[REDACTED]' }),
      ...(meta?.api_key && { api_key: '[REDACTED]' }),
      ...(meta?.token && { token: '[REDACTED]' }),
    }

    this.logger.log(level, message, logData)
  }

  /**
   * Log levels
   */
  debug(message: string, meta?: Record<string, any>, requestId?: string) {
    this.logWithContext('debug', message, meta, requestId)
  }

  info(message: string, meta?: Record<string, any>, requestId?: string) {
    this.logWithContext('info', message, meta, requestId)
  }

  warn(message: string, meta?: Record<string, any>, requestId?: string) {
    this.logWithContext('warn', message, meta, requestId)
  }

  error(message: string, error?: Error | any, meta?: Record<string, any>, requestId?: string) {
    const errorMeta = {
      ...meta,
      error_message: error?.message || String(error),
      error_stack: error?.stack,
      error_type: error?.constructor?.name || 'Error',
    }
    this.logWithContext('error', message, errorMeta, requestId)
  }

  /**
   * Specialized loggers
   */
  
  logGuardrailBlock(params: {
    requestId: string
    table: string
    reason: string
    payload: any
    fixes_available: number
  }) {
    this.info('Guardrail validation blocked', {
      component: 'guardrail',
      table: params.table,
      reason: params.reason,
      payload_size: JSON.stringify(params.payload).length,
      fixes_available: params.fixes_available,
      guardrail_id: uuidv4(),
    }, params.requestId)
  }

  logGuardrailAutofix(params: {
    requestId: string
    table: string
    fixes: any[]
    confidence: number
  }) {
    this.info('Guardrail auto-fix applied', {
      component: 'guardrail',
      table: params.table,
      fixes_count: params.fixes.length,
      fix_types: params.fixes.map(f => f.fix_type),
      confidence: params.confidence,
      autofix_id: uuidv4(),
    }, params.requestId)
  }

  logUCRDecision(params: {
    requestId: string
    ruleId: string
    decision: any
    evaluationTime: number
    conditionsEvaluated: number
  }) {
    this.info('UCR rule evaluated', {
      component: 'ucr',
      rule_id: params.ruleId,
      decision_type: params.decision.type,
      evaluation_time_ms: params.evaluationTime,
      conditions_evaluated: params.conditionsEvaluated,
      ucr_decision_id: uuidv4(),
    }, params.requestId)
  }

  logAPIRequest(params: {
    requestId: string
    method: string
    path: string
    statusCode: number
    duration: number
    organizationId?: string
  }) {
    const level = params.statusCode >= 500 ? 'error' 
      : params.statusCode >= 400 ? 'warn' 
      : 'info'

    this.logWithContext(level, 'API request completed', {
      component: 'api',
      http_method: params.method,
      http_path: params.path,
      http_status: params.statusCode,
      response_time_ms: params.duration,
      api_request_id: params.requestId,
    }, params.requestId)
  }

  logReportGeneration(params: {
    requestId: string
    reportType: string
    period: string
    duration: number
    dataRows: number
    success: boolean
    error?: string
  }) {
    const level = params.success ? 'info' : 'error'
    
    this.logWithContext(level, 'Report generation completed', {
      component: 'reporting',
      report_type: params.reportType,
      report_period: params.period,
      generation_time_ms: params.duration,
      data_rows: params.dataRows,
      success: params.success,
      error: params.error,
      report_id: uuidv4(),
    }, params.requestId)
  }

  logSecurityEvent(params: {
    requestId: string
    eventType: 'login' | 'logout' | 'permission_denied' | 'suspicious_activity'
    userId?: string
    details: any
  }) {
    this.warn('Security event', {
      component: 'security',
      security_event_type: params.eventType,
      user_id: params.userId,
      event_details: params.details,
      security_event_id: uuidv4(),
    }, params.requestId)
  }

  logDatabaseQuery(params: {
    requestId: string
    operation: string
    table: string
    duration: number
    rowsAffected?: number
    error?: string
  }) {
    const level = params.error ? 'error' : params.duration > 1000 ? 'warn' : 'debug'
    
    this.logWithContext(level, 'Database query executed', {
      component: 'database',
      db_operation: params.operation,
      db_table: params.table,
      db_duration_ms: params.duration,
      db_rows_affected: params.rowsAffected,
      db_error: params.error,
      query_id: uuidv4(),
    }, params.requestId)
  }

  /**
   * Audit logger for compliance
   */
  audit(params: {
    organizationId: string
    userId: string
    action: string
    resource: string
    changes?: any
    result: 'success' | 'failure'
    reason?: string
  }) {
    this.info('Audit event', {
      component: 'audit',
      audit_action: params.action,
      audit_resource: params.resource,
      audit_result: params.result,
      audit_changes: params.changes,
      audit_reason: params.reason,
      audit_id: uuidv4(),
      organization_id: params.organizationId,
      user_id: params.userId,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Performance logger
   */
  performance(params: {
    requestId: string
    operation: string
    duration: number
    metadata?: any
  }) {
    const level = params.duration > 5000 ? 'warn' : 'debug'
    
    this.logWithContext(level, 'Performance measurement', {
      component: 'performance',
      perf_operation: params.operation,
      perf_duration_ms: params.duration,
      perf_metadata: params.metadata,
      performance_id: uuidv4(),
    }, params.requestId)
  }

  /**
   * Create child logger with additional context
   */
  child(context: Partial<LogContext>): HeraLogger {
    const child = new HeraLogger()
    child.logger = this.logger.child(context)
    return child
  }
}

export const heraLogger = HeraLogger.getInstance()