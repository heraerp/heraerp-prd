/**
 * HERA Log Collector
 * Captures and manages console logs for production monitoring
 * Smart Code: HERA.MONITORING.LOG_COLLECTOR.v1
 */

'use client'

import type { ConsoleLog } from './production-monitor'

class LogCollector {
  private logs: ConsoleLog[] = []
  private maxLogs = 50
  private originalConsole: {
    error: typeof console.error
    warn: typeof console.warn
    info: typeof console.info
    debug: typeof console.debug
  }
  private isInitialized = false

  constructor() {
    // Store original console methods
    this.originalConsole = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    }
  }

  /**
   * Initialize log collection
   */
  init(maxLogs = 50): void {
    if (this.isInitialized || typeof window === 'undefined') return

    this.maxLogs = maxLogs
    this.setupConsoleInterception()
    this.isInitialized = true
    
    console.log('📝 HERA Log Collector: Initialized')
  }

  /**
   * Set up console method interception
   */
  private setupConsoleInterception(): void {
    // Intercept console.error
    console.error = (...args: any[]) => {
      this.captureLog('error', args)
      this.originalConsole.error.apply(console, args)
    }

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      this.captureLog('warn', args)
      this.originalConsole.warn.apply(console, args)
    }

    // Intercept console.info (only in development for performance)
    if (process.env.NODE_ENV === 'development') {
      console.info = (...args: any[]) => {
        this.captureLog('info', args)
        this.originalConsole.info.apply(console, args)
      }
    }

    // Intercept console.debug (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.debug = (...args: any[]) => {
        this.captureLog('debug', args)
        this.originalConsole.debug.apply(console, args)
      }
    }
  }

  /**
   * Capture a log entry
   */
  private captureLog(level: ConsoleLog['level'], args: any[]): void {
    try {
      const logEntry: ConsoleLog = {
        timestamp: new Date().toISOString(),
        level,
        message: this.formatLogMessage(args),
        args: this.sanitizeArgs(args),
        source: this.getLogSource()
      }

      this.addLog(logEntry)
    } catch (error) {
      // Fail silently to avoid infinite loops
      this.originalConsole.error('Log collection error:', error)
    }
  }

  /**
   * Format log message from arguments
   */
  private formatLogMessage(args: any[]): string {
    try {
      return args
        .map(arg => {
          if (typeof arg === 'string') return arg
          if (typeof arg === 'object' && arg !== null) {
            return JSON.stringify(arg, null, 2)
          }
          return String(arg)
        })
        .join(' ')
    } catch (error) {
      return 'Unable to format log message'
    }
  }

  /**
   * Sanitize arguments to prevent circular references and large objects
   */
  private sanitizeArgs(args: any[]): any[] {
    const MAX_ARG_LENGTH = 1000
    const MAX_OBJECT_DEPTH = 3

    return args.map(arg => {
      try {
        if (typeof arg === 'string') {
          return arg.length > MAX_ARG_LENGTH 
            ? arg.substring(0, MAX_ARG_LENGTH) + '...[truncated]'
            : arg
        }
        
        if (typeof arg === 'object' && arg !== null) {
          return this.deepSanitize(arg, MAX_OBJECT_DEPTH)
        }
        
        return arg
      } catch (error) {
        return '[Unable to sanitize argument]'
      }
    })
  }

  /**
   * Deep sanitize objects to prevent circular references
   */
  private deepSanitize(obj: any, depth: number): any {
    if (depth <= 0) return '[Max depth reached]'
    if (obj === null) return null
    
    const seen = new WeakSet()
    
    const sanitize = (value: any, currentDepth: number): any => {
      if (currentDepth <= 0) return '[Max depth reached]'
      
      if (value === null || typeof value !== 'object') {
        return value
      }
      
      if (seen.has(value)) {
        return '[Circular reference]'
      }
      
      seen.add(value)
      
      if (Array.isArray(value)) {
        return value.slice(0, 10).map(item => sanitize(item, currentDepth - 1))
      }
      
      const sanitized: any = {}
      const entries = Object.entries(value).slice(0, 20) // Limit properties
      
      for (const [key, val] of entries) {
        sanitized[key] = sanitize(val, currentDepth - 1)
      }
      
      return sanitized
    }
    
    return sanitize(obj, depth)
  }

  /**
   * Get log source from stack trace
   */
  private getLogSource(): string {
    try {
      const stack = new Error().stack
      if (!stack) return 'unknown'
      
      const lines = stack.split('\n')
      
      // Skip the first few lines (this function, console methods)
      for (let i = 3; i < lines.length && i < 10; i++) {
        const line = lines[i]
        
        // Look for relevant source files (skip node_modules, browser internals)
        if (line.includes('/src/') || line.includes('\\src\\')) {
          const match = line.match(/\/src\/[^)]+/)
          if (match) {
            return match[0].replace('/src/', '')
          }
        }
      }
      
      return 'browser'
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * Add log to collection
   */
  private addLog(log: ConsoleLog): void {
    this.logs.push(log)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  /**
   * Get all collected logs
   */
  getLogs(): ConsoleLog[] {
    return [...this.logs]
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: ConsoleLog['level']): ConsoleLog[] {
    return this.logs.filter(log => log.level === level)
  }

  /**
   * Get recent logs (last N entries)
   */
  getRecentLogs(count = 20): ConsoleLog[] {
    return this.logs.slice(-count)
  }

  /**
   * Get logs since timestamp
   */
  getLogsSince(timestamp: Date): ConsoleLog[] {
    const since = timestamp.getTime()
    return this.logs.filter(log => new Date(log.timestamp).getTime() > since)
  }

  /**
   * Search logs by message content
   */
  searchLogs(query: string): ConsoleLog[] {
    const lowerQuery = query.toLowerCase()
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(lowerQuery) ||
      log.source.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Get log statistics
   */
  getStats(): {
    total: number
    byLevel: Record<ConsoleLog['level'], number>
    timeRange: { start?: string; end?: string }
  } {
    const byLevel: Record<ConsoleLog['level'], number> = {
      error: 0,
      warn: 0,
      info: 0,
      debug: 0
    }

    this.logs.forEach(log => {
      byLevel[log.level]++
    })

    const timeRange: { start?: string; end?: string } = {}
    if (this.logs.length > 0) {
      timeRange.start = this.logs[0].timestamp
      timeRange.end = this.logs[this.logs.length - 1].timestamp
    }

    return {
      total: this.logs.length,
      byLevel,
      timeRange
    }
  }

  /**
   * Export logs for external analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'message', 'source']
      const rows = this.logs.map(log => [
        log.timestamp,
        log.level,
        JSON.stringify(log.message),
        log.source
      ])
      
      return [headers, ...rows]
        .map(row => row.join(','))
        .join('\n')
    }
    
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Restore original console methods (for cleanup)
   */
  destroy(): void {
    if (!this.isInitialized) return

    console.error = this.originalConsole.error
    console.warn = this.originalConsole.warn
    console.info = this.originalConsole.info
    console.debug = this.originalConsole.debug
    
    this.isInitialized = false
    this.logs = []
    
    console.log('📝 HERA Log Collector: Destroyed')
  }

  /**
   * Configure log collection settings
   */
  configure(options: {
    maxLogs?: number
    captureInfo?: boolean
    captureDebug?: boolean
  }): void {
    if (options.maxLogs !== undefined) {
      this.maxLogs = options.maxLogs
      
      // Trim logs if new limit is smaller
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs)
      }
    }

    // Note: captureInfo and captureDebug would require re-initialization
    // This is a configuration interface for future enhancements
  }

  /**
   * Create a filtered copy of logs for specific time periods
   */
  getLogSnapshot(options: {
    since?: Date
    until?: Date
    levels?: ConsoleLog['level'][]
    sources?: string[]
    maxCount?: number
  } = {}): ConsoleLog[] {
    let filtered = [...this.logs]

    if (options.since) {
      const since = options.since.getTime()
      filtered = filtered.filter(log => new Date(log.timestamp).getTime() >= since)
    }

    if (options.until) {
      const until = options.until.getTime()
      filtered = filtered.filter(log => new Date(log.timestamp).getTime() <= until)
    }

    if (options.levels) {
      filtered = filtered.filter(log => options.levels!.includes(log.level))
    }

    if (options.sources) {
      filtered = filtered.filter(log => 
        options.sources!.some(source => log.source.includes(source))
      )
    }

    if (options.maxCount) {
      filtered = filtered.slice(-options.maxCount)
    }

    return filtered
  }
}

// Global singleton instance
export const logCollector = new LogCollector()

export default logCollector