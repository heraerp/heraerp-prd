/**
 * Production-grade logging utility
 * Provides structured logging with different log levels
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export interface LogContext {
  requestId?: string
  organizationId?: string
  userId?: string
  transactionId?: string
  [key: string]: any
}

export class Logger {
  private serviceName: string
  private logLevel: LogLevel

  constructor(serviceName: string, logLevel: LogLevel = LogLevel.INFO) {
    this.serviceName = serviceName
    this.logLevel = logLevel
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel)
    return levels.indexOf(level) >= levels.indexOf(this.logLevel)
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const baseLog = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...context
    }
    
    if (process.env.NODE_ENV === 'production') {
      // JSON format for production (easier to parse)
      return JSON.stringify(baseLog)
    } else {
      // Human-readable format for development
      const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
      return `[${timestamp}] [${level}] [${this.serviceName}] ${message}${contextStr}`
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext: LogContext = {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }
      console.error(this.formatMessage(LogLevel.ERROR, message, errorContext))
    }
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    }
    console.error(this.formatMessage(LogLevel.FATAL, message, errorContext))
    
    // In production, you might want to send this to an alerting service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service (e.g., Sentry, DataDog)
    }
  }

  // Performance logging
  startTimer(operation: string, context?: LogContext): () => void {
    const startTime = Date.now()
    this.debug(`Starting operation: ${operation}`, context)
    
    return () => {
      const duration = Date.now() - startTime
      this.info(`Completed operation: ${operation}`, {
        ...context,
        duration,
        durationUnit: 'ms'
      })
    }
  }

  // Metric logging
  metric(name: string, value: number, unit: string, context?: LogContext): void {
    this.info('Metric recorded', {
      ...context,
      metric: {
        name,
        value,
        unit
      }
    })
  }
}

// Create singleton instances for common services
export const apiLogger = new Logger('API', LogLevel.INFO)
export const dbLogger = new Logger('Database', LogLevel.INFO)
export const authLogger = new Logger('Auth', LogLevel.INFO)
export const posLogger = new Logger('POS', LogLevel.INFO)

// Set log level based on environment
if (process.env.NODE_ENV === 'development') {
  apiLogger['logLevel'] = LogLevel.DEBUG
  dbLogger['logLevel'] = LogLevel.DEBUG
  authLogger['logLevel'] = LogLevel.DEBUG
  posLogger['logLevel'] = LogLevel.DEBUG
}