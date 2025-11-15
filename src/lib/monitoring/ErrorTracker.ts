/**
 * HERA Universal Tile System - Production Error Tracking
 * Smart Code: HERA.MONITORING.ERROR.TRACKING.PRODUCTION.v1
 * 
 * Comprehensive error tracking, categorization, and automated resolution
 * for production environments with intelligent alerting and recovery
 */

export interface ErrorContext {
  userId?: string
  organizationId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  timestamp: number
  deploymentId?: string
  environment?: string
  tileId?: string
  workspaceId?: string
  actionId?: string
}

export interface ErrorDetails {
  id: string
  message: string
  stack?: string
  type: 'javascript' | 'api' | 'network' | 'tile' | 'security' | 'performance' | 'business'
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  context: ErrorContext
  fingerprint: string
  count: number
  firstSeen: number
  lastSeen: number
  resolved: boolean
  tags: string[]
  metadata: Record<string, any>
}

export interface ErrorPattern {
  fingerprint: string
  pattern: string
  count: number
  examples: ErrorDetails[]
  suggestedFix?: string
  automated?: boolean
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'reload' | 'redirect' | 'notification'
  params?: Record<string, any>
  delay?: number
  maxRetries?: number
}

export class ErrorTracker {
  private errors: Map<string, ErrorDetails> = new Map()
  private errorPatterns: Map<string, ErrorPattern> = new Map()
  private errorQueue: ErrorDetails[] = []
  private isProcessing = false
  private retryAttempts: Map<string, number> = new Map()
  private config = {
    maxErrorsInMemory: 1000,
    batchSize: 10,
    flushInterval: 5000, // 5 seconds
    maxRetries: 3,
    enableAutoRecovery: true,
    enablePatternDetection: true
  }

  constructor() {
    this.initializeErrorHandling()
    this.startErrorProcessing()
    this.loadKnownPatterns()
  }

  /**
   * Initialize global error handling
   */
  private initializeErrorHandling(): void {
    // Global JavaScript error handler
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError({
          message: event.message,
          stack: event.error?.stack,
          type: 'javascript',
          severity: 'high',
          category: 'runtime',
          context: {
            url: window.location.href,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
          }
        })
      })

      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError({
          message: event.reason?.message || 'Unhandled Promise Rejection',
          stack: event.reason?.stack,
          type: 'javascript',
          severity: 'high',
          category: 'promise',
          context: {
            url: window.location.href,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
          }
        })
      })

      // Network error tracking for fetch
      const originalFetch = window.fetch
      window.fetch = async (...args) => {
        try {
          const response = await originalFetch(...args)
          
          if (!response.ok) {
            this.trackError({
              message: `HTTP ${response.status}: ${response.statusText}`,
              type: 'api',
              severity: response.status >= 500 ? 'high' : 'medium',
              category: 'http',
              context: {
                url: args[0] as string,
                timestamp: Date.now(),
                userAgent: navigator.userAgent
              },
              metadata: {
                status: response.status,
                statusText: response.statusText,
                method: (args[1] as RequestInit)?.method || 'GET'
              }
            })
          }
          
          return response
        } catch (error) {
          this.trackError({
            message: (error as Error).message,
            stack: (error as Error).stack,
            type: 'network',
            severity: 'high',
            category: 'connectivity',
            context: {
              url: args[0] as string,
              timestamp: Date.now(),
              userAgent: navigator.userAgent
            }
          })
          throw error
        }
      }
    }
  }

  /**
   * Track a new error
   */
  public trackError(errorData: {
    message: string
    stack?: string
    type: ErrorDetails['type']
    severity: ErrorDetails['severity']
    category: string
    context: Partial<ErrorContext>
    metadata?: Record<string, any>
  }): string {
    const fingerprint = this.generateFingerprint(errorData)
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const existingError = this.errors.get(fingerprint)
    
    if (existingError) {
      // Update existing error
      existingError.count += 1
      existingError.lastSeen = Date.now()
      existingError.metadata = { ...existingError.metadata, ...errorData.metadata }
      
      console.error(`🔄 Recurring error [${existingError.count}x]:`, errorData.message)
    } else {
      // Create new error
      const error: ErrorDetails = {
        id: errorId,
        message: errorData.message,
        stack: errorData.stack,
        type: errorData.type,
        severity: errorData.severity,
        category: errorData.category,
        context: {
          timestamp: Date.now(),
          ...errorData.context
        },
        fingerprint,
        count: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        resolved: false,
        tags: this.generateTags(errorData),
        metadata: errorData.metadata || {}
      }
      
      this.errors.set(fingerprint, error)
      this.errorQueue.push(error)
      
      console.error(`🚨 New error [${error.severity}]:`, errorData.message)
      
      // Pattern detection
      if (this.config.enablePatternDetection) {
        this.detectErrorPattern(error)
      }
      
      // Auto recovery
      if (this.config.enableAutoRecovery) {
        this.attemptAutoRecovery(error)
      }
    }
    
    // Immediate alerts for critical errors
    if (errorData.severity === 'critical') {
      this.sendCriticalAlert(this.errors.get(fingerprint)!)
    }
    
    return errorId
  }

  /**
   * Track tile-specific errors
   */
  public trackTileError(
    tileId: string,
    error: Error,
    context: Partial<ErrorContext> = {}
  ): string {
    return this.trackError({
      message: `Tile Error [${tileId}]: ${error.message}`,
      stack: error.stack,
      type: 'tile',
      severity: 'medium',
      category: 'tile_rendering',
      context: {
        ...context,
        tileId
      },
      metadata: {
        tileId,
        errorName: error.name
      }
    })
  }

  /**
   * Track API errors
   */
  public trackAPIError(
    endpoint: string,
    status: number,
    message: string,
    context: Partial<ErrorContext> = {}
  ): string {
    return this.trackError({
      message: `API Error [${endpoint}]: ${message}`,
      type: 'api',
      severity: status >= 500 ? 'high' : 'medium',
      category: 'api',
      context: {
        ...context,
        url: endpoint
      },
      metadata: {
        endpoint,
        status,
        statusText: message
      }
    })
  }

  /**
   * Track security errors
   */
  public trackSecurityError(
    message: string,
    context: Partial<ErrorContext> = {}
  ): string {
    return this.trackError({
      message: `Security Error: ${message}`,
      type: 'security',
      severity: 'critical',
      category: 'security',
      context,
      metadata: {
        securityEvent: true
      }
    })
  }

  /**
   * Track performance errors
   */
  public trackPerformanceError(
    metric: string,
    value: number,
    threshold: number,
    context: Partial<ErrorContext> = {}
  ): string {
    return this.trackError({
      message: `Performance Error: ${metric} (${value}) exceeds threshold (${threshold})`,
      type: 'performance',
      severity: value > threshold * 2 ? 'high' : 'medium',
      category: 'performance',
      context,
      metadata: {
        metric,
        value,
        threshold,
        ratio: value / threshold
      }
    })
  }

  /**
   * Generate error fingerprint
   */
  private generateFingerprint(errorData: any): string {
    const key = `${errorData.type}:${errorData.category}:${errorData.message.replace(/\d+/g, 'N')}`
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16)
  }

  /**
   * Generate error tags
   */
  private generateTags(errorData: any): string[] {
    const tags = [
      errorData.type,
      errorData.severity,
      errorData.category
    ]
    
    // Add contextual tags
    if (errorData.context?.tileId) {
      tags.push('tile')
    }
    
    if (errorData.context?.url?.includes('/api/')) {
      tags.push('api')
    }
    
    if (errorData.message.includes('permission') || errorData.message.includes('unauthorized')) {
      tags.push('auth')
    }
    
    return tags
  }

  /**
   * Detect error patterns
   */
  private detectErrorPattern(error: ErrorDetails): void {
    const pattern = this.errorPatterns.get(error.fingerprint)
    
    if (pattern) {
      pattern.count += 1
      pattern.examples.push(error)
      
      // Keep only recent examples
      if (pattern.examples.length > 10) {
        pattern.examples = pattern.examples.slice(-10)
      }
      
      // Check if pattern requires attention
      if (pattern.count > 10 && !pattern.automated) {
        console.warn(`🔍 Error pattern detected: ${pattern.pattern} (${pattern.count} occurrences)`)
        this.suggestAutomatedFix(pattern)
      }
    } else {
      this.errorPatterns.set(error.fingerprint, {
        fingerprint: error.fingerprint,
        pattern: this.extractPattern(error),
        count: 1,
        examples: [error]
      })
    }
  }

  /**
   * Extract error pattern
   */
  private extractPattern(error: ErrorDetails): string {
    let pattern = error.message
    
    // Replace specific values with placeholders
    pattern = pattern.replace(/\b\d+\b/g, 'N')
    pattern = pattern.replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, 'UUID')
    pattern = pattern.replace(/\bhttps?:\/\/[^\s]+/gi, 'URL')
    
    return pattern
  }

  /**
   * Suggest automated fix
   */
  private suggestAutomatedFix(pattern: ErrorPattern): void {
    const suggestions: Record<string, string> = {
      'Network Error': 'Implement retry logic with exponential backoff',
      'API Error': 'Add fallback mechanisms and circuit breaker pattern',
      'Tile Error': 'Add error boundaries and graceful degradation',
      'Permission Error': 'Implement proper permission checking',
      'Performance Error': 'Optimize critical path and add caching'
    }
    
    for (const [key, suggestion] of Object.entries(suggestions)) {
      if (pattern.pattern.includes(key)) {
        pattern.suggestedFix = suggestion
        console.log(`💡 Suggested fix for pattern "${pattern.pattern}": ${suggestion}`)
        break
      }
    }
  }

  /**
   * Attempt auto recovery
   */
  private attemptAutoRecovery(error: ErrorDetails): void {
    const recoveryActions = this.getRecoveryActions(error)
    
    for (const action of recoveryActions) {
      if (this.shouldAttemptRecovery(error, action)) {
        this.executeRecoveryAction(error, action)
        break
      }
    }
  }

  /**
   * Get recovery actions for error
   */
  private getRecoveryActions(error: ErrorDetails): RecoveryAction[] {
    const actions: RecoveryAction[] = []
    
    switch (error.type) {
      case 'network':
        actions.push({ type: 'retry', delay: 1000, maxRetries: 3 })
        break
      case 'api':
        if (error.metadata?.status >= 500) {
          actions.push({ type: 'retry', delay: 2000, maxRetries: 2 })
        } else if (error.metadata?.status === 401) {
          actions.push({ type: 'redirect', params: { url: '/auth/login' } })
        }
        break
      case 'tile':
        actions.push({ type: 'fallback', params: { showErrorState: true } })
        break
      case 'javascript':
        if (error.message.includes('memory')) {
          actions.push({ type: 'reload' })
        }
        break
    }
    
    return actions
  }

  /**
   * Check if recovery should be attempted
   */
  private shouldAttemptRecovery(error: ErrorDetails, action: RecoveryAction): boolean {
    const retryKey = `${error.fingerprint}:${action.type}`
    const attempts = this.retryAttempts.get(retryKey) || 0
    const maxRetries = action.maxRetries || this.config.maxRetries
    
    return attempts < maxRetries
  }

  /**
   * Execute recovery action
   */
  private executeRecoveryAction(error: ErrorDetails, action: RecoveryAction): void {
    const retryKey = `${error.fingerprint}:${action.type}`
    const attempts = (this.retryAttempts.get(retryKey) || 0) + 1
    this.retryAttempts.set(retryKey, attempts)
    
    console.log(`🔧 Attempting recovery [${attempts}/${action.maxRetries}]: ${action.type} for ${error.message}`)
    
    switch (action.type) {
      case 'retry':
        if (action.delay) {
          setTimeout(() => this.performRetry(error), action.delay)
        } else {
          this.performRetry(error)
        }
        break
      case 'fallback':
        this.performFallback(error, action.params)
        break
      case 'reload':
        this.performReload()
        break
      case 'redirect':
        this.performRedirect(action.params?.url)
        break
      case 'notification':
        this.showErrorNotification(error)
        break
    }
  }

  /**
   * Perform retry
   */
  private performRetry(error: ErrorDetails): void {
    // Implementation would depend on the specific error context
    console.log(`🔄 Retrying operation for error: ${error.message}`)
    
    if (error.context.tileId) {
      // Retry tile rendering
      const event = new CustomEvent('retryTile', { detail: { tileId: error.context.tileId } })
      window.dispatchEvent(event)
    }
  }

  /**
   * Perform fallback
   */
  private performFallback(error: ErrorDetails, params?: Record<string, any>): void {
    console.log(`🎭 Using fallback for error: ${error.message}`)
    
    if (error.context.tileId) {
      // Show fallback tile state
      const event = new CustomEvent('tileError', { 
        detail: { 
          tileId: error.context.tileId, 
          error: error.message,
          showFallback: true 
        } 
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * Perform reload
   */
  private performReload(): void {
    console.log('🔄 Reloading page due to critical error')
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  /**
   * Perform redirect
   */
  private performRedirect(url?: string): void {
    if (url && typeof window !== 'undefined') {
      console.log(`🔀 Redirecting to: ${url}`)
      window.location.href = url
    }
  }

  /**
   * Show error notification
   */
  private showErrorNotification(error: ErrorDetails): void {
    // Implementation would show user-friendly notification
    console.log(`📢 Showing error notification: ${error.message}`)
    
    const event = new CustomEvent('showErrorNotification', {
      detail: {
        message: this.getUserFriendlyMessage(error),
        severity: error.severity
      }
    })
    window.dispatchEvent(event)
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: ErrorDetails): string {
    const messages: Record<string, string> = {
      'network': 'Connection issue. Please check your internet connection.',
      'api': 'Service temporarily unavailable. Please try again.',
      'tile': 'Unable to load content. Please refresh the page.',
      'security': 'Access denied. Please log in again.',
      'performance': 'Loading slowly due to high traffic.',
      'javascript': 'Something went wrong. Please refresh the page.'
    }
    
    return messages[error.type] || 'An unexpected error occurred. Please try again.'
  }

  /**
   * Start error processing
   */
  private startErrorProcessing(): void {
    setInterval(() => {
      this.processErrorQueue()
    }, this.config.flushInterval)
  }

  /**
   * Process error queue
   */
  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return
    }
    
    this.isProcessing = true
    
    try {
      const batch = this.errorQueue.splice(0, this.config.batchSize)
      await this.sendErrorBatch(batch)
    } catch (error) {
      console.error('Failed to process error batch:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Send error batch to monitoring service
   */
  private async sendErrorBatch(errors: ErrorDetails[]): Promise<void> {
    if (process.env.ERROR_TRACKING_ENDPOINT) {
      try {
        await fetch(process.env.ERROR_TRACKING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            errors,
            timestamp: Date.now(),
            environment: process.env.NODE_ENV
          })
        })
      } catch (error) {
        console.error('Failed to send errors to tracking service:', error)
        // Re-queue errors for retry
        this.errorQueue.unshift(...errors)
      }
    }
  }

  /**
   * Send critical alert
   */
  private async sendCriticalAlert(error: ErrorDetails): Promise<void> {
    console.error('🚨 CRITICAL ERROR ALERT:', error)
    
    if (process.env.CRITICAL_ERROR_WEBHOOK) {
      try {
        await fetch(process.env.CRITICAL_ERROR_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert: 'critical_error',
            error: {
              message: error.message,
              type: error.type,
              category: error.category,
              fingerprint: error.fingerprint,
              context: error.context
            },
            timestamp: Date.now()
          })
        })
      } catch (alertError) {
        console.error('Failed to send critical alert:', alertError)
      }
    }
  }

  /**
   * Load known error patterns
   */
  private loadKnownPatterns(): void {
    // Load previously identified patterns from storage/API
    const knownPatterns = [
      {
        fingerprint: 'net_err_connection',
        pattern: 'Network connection failed',
        automated: true,
        suggestedFix: 'Implement retry with exponential backoff'
      },
      {
        fingerprint: 'api_timeout',
        pattern: 'API request timeout',
        automated: true,
        suggestedFix: 'Reduce timeout threshold and add fallback'
      }
    ]
    
    knownPatterns.forEach(pattern => {
      this.errorPatterns.set(pattern.fingerprint, {
        ...pattern,
        count: 0,
        examples: []
      })
    })
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics(): any {
    const errors = Array.from(this.errors.values())
    const now = Date.now()
    const last24h = errors.filter(e => now - e.lastSeen < 24 * 60 * 60 * 1000)
    
    return {
      total: errors.length,
      last24h: last24h.length,
      byType: this.groupBy(errors, 'type'),
      bySeverity: this.groupBy(errors, 'severity'),
      byCategory: this.groupBy(errors, 'category'),
      topErrors: errors
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(e => ({
          message: e.message,
          count: e.count,
          severity: e.severity,
          lastSeen: e.lastSeen
        })),
      patterns: Array.from(this.errorPatterns.values())
        .filter(p => p.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    }
  }

  /**
   * Resolve error
   */
  public resolveError(fingerprint: string): boolean {
    const error = this.errors.get(fingerprint)
    if (error) {
      error.resolved = true
      console.log(`✅ Error resolved: ${error.message}`)
      return true
    }
    return false
  }

  /**
   * Get errors by criteria
   */
  public getErrors(criteria: {
    type?: ErrorDetails['type']
    severity?: ErrorDetails['severity']
    resolved?: boolean
    limit?: number
  } = {}): ErrorDetails[] {
    let errors = Array.from(this.errors.values())
    
    if (criteria.type) {
      errors = errors.filter(e => e.type === criteria.type)
    }
    
    if (criteria.severity) {
      errors = errors.filter(e => e.severity === criteria.severity)
    }
    
    if (criteria.resolved !== undefined) {
      errors = errors.filter(e => e.resolved === criteria.resolved)
    }
    
    // Sort by last seen (most recent first)
    errors.sort((a, b) => b.lastSeen - a.lastSeen)
    
    if (criteria.limit) {
      errors = errors.slice(0, criteria.limit)
    }
    
    return errors
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((groups: Record<string, number>, item) => {
      const value = String(item[key])
      groups[value] = (groups[value] || 0) + 1
      return groups
    }, {})
  }
}

// Global error tracker instance
export let errorTracker: ErrorTracker | null = null

/**
 * Initialize error tracking
 */
export function initializeErrorTracking(): ErrorTracker {
  if (errorTracker) {
    console.warn('Error tracking is already initialized')
    return errorTracker
  }
  
  errorTracker = new ErrorTracker()
  return errorTracker
}

/**
 * Get error tracker instance
 */
export function getErrorTracker(): ErrorTracker | null {
  return errorTracker
}

export default ErrorTracker