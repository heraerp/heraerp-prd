/**
 * HERA Production Monitor
 * Core error detection and monitoring system for production environments
 * Smart Code: HERA.MONITORING.PRODUCTION.CORE.v1
 */

'use client'

import { logCollector } from './log-collector'
import { contextCollector } from './context-collector'
import { reportGenerator } from './report-generator'
import { emailReporter } from './email-reporter'
import { getMonitoringConfig } from './config'

export interface ProductionError {
  id: string
  timestamp: string
  error: {
    message: string
    stack: string
    code?: string
    type: 'authentication' | 'api' | 'ui' | 'business_logic' | 'network' | 'performance'
    severity: 'critical' | 'high' | 'medium' | 'low'
  }
  user: {
    email?: string
    organization_id: string
    role: string
    session_id: string
  }
  context: {
    url: string
    user_agent: string
    viewport: string
    action_being_performed: string
    entity_type?: string
    transaction_type?: string
    page_path: string
    component_stack?: string[]
  }
  logs: ConsoleLog[]
  network: NetworkRequest[]
  performance: PerformanceMetrics
  screenshot?: string // Base64 encoded screenshot
}

export interface ConsoleLog {
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  args?: any[]
  source?: string
}

export interface NetworkRequest {
  timestamp: string
  url: string
  method: string
  status: number
  duration: number
  request_body?: any
  response_body?: any
  error?: string
}

export interface PerformanceMetrics {
  page_load_time: number
  time_to_interactive: number
  memory_usage: number
  error_time_since_load: number
}

export interface MonitoringConfig {
  enabled: boolean
  captureConsole: boolean
  captureNetwork: boolean
  capturePerformance: boolean
  captureScreenshots: boolean
  emailAlerts: boolean
  logLevel: 'error' | 'warn' | 'info' | 'debug'
  maxLogsToCapture: number
  reportCriticalImmediately: boolean
}

class HERAProductionMonitor {
  private isInitialized = false
  private errorBuffer: ProductionError[] = []
  private maxBufferSize = 100

  constructor() {
    // Configuration is now handled by the global config system
  }

  /**
   * Get current configuration (dynamically from config system)
   */
  private getConfig(organizationId?: string) {
    const monitoringConfig = getMonitoringConfig(organizationId)
    return {
      enabled: monitoringConfig.errorDetection.enabled,
      captureConsole: monitoringConfig.errorDetection.captureConsole,
      captureNetwork: monitoringConfig.errorDetection.captureNetwork,
      capturePerformance: monitoringConfig.errorDetection.capturePerformance,
      captureScreenshots: monitoringConfig.email.content.includeScreenshots,
      emailAlerts: monitoringConfig.email.enabled,
      maxLogsToCapture: monitoringConfig.errorDetection.maxLogs,
      reportCriticalImmediately: true, // Always report critical errors
      maxErrors: monitoringConfig.errorDetection.maxErrors
    }
  }

  /**
   * Initialize the production monitor
   */
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return

    // Get configuration (default config since we don't have org context yet)
    const config = this.getConfig()

    if (!config.enabled) {
      console.log('🔍 HERA Production Monitor: Disabled by configuration')
      return
    }

    console.log('🔍 HERA Production Monitor: Initializing...')

    // Set up global error handlers
    this.setupGlobalErrorHandlers()

    // Initialize collectors
    if (config.captureConsole) {
      logCollector.init(config.maxLogsToCapture)
    }

    if (config.captureNetwork) {
      this.setupNetworkMonitoring()
    }

    if (config.capturePerformance) {
      this.setupPerformanceMonitoring()
    }

    // Set up user action tracking
    contextCollector.initUserActionTracking()

    // Set up periodic buffer flush
    this.setupBufferFlush()

    // Update max buffer size from config
    this.maxBufferSize = config.maxErrors

    this.isInitialized = true
    console.log('✅ HERA Production Monitor: Ready')
  }

  /**
   * Manually capture an error with full context
   */
  async captureError(
    error: Error | string,
    context: Partial<ProductionError['context']> = {},
    additionalData: any = {}
  ): Promise<string> {
    // Get organization from context to use appropriate config
    const organizationId = context.organization_id || this.getOrganizationFromContext()
    const config = this.getConfig(organizationId)
    
    if (!config.enabled) return ''

    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // Build comprehensive error report
      const productionError: ProductionError = {
        id: errorId,
        timestamp: new Date().toISOString(),
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack || '' : '',
          code: (error as any)?.code,
          type: this.classifyErrorType(error),
          severity: this.classifyErrorSeverity(error, context)
        },
        user: await this.getUserContext(),
        context: {
          url: window.location.href,
          user_agent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          action_being_performed: context.action_being_performed || 'unknown',
          entity_type: context.entity_type,
          transaction_type: context.transaction_type,
          page_path: window.location.pathname,
          component_stack: context.component_stack,
          ...context
        },
        logs: logCollector.getLogs(),
        network: [], // Will be populated by network monitor
        performance: this.getPerformanceMetrics(),
        ...additionalData
      }

      // Capture screenshot if enabled and it's a critical error
      if (config.captureScreenshots && productionError.error.severity === 'critical') {
        productionError.screenshot = await this.captureScreenshot()
      }

      // Add to buffer
      this.addToBuffer(productionError)

      // Immediate reporting for critical errors
      if (config.reportCriticalImmediately && productionError.error.severity === 'critical') {
        await this.reportError(productionError)
      }

      console.log(`🚨 HERA Error Captured: ${errorId}`, {
        type: productionError.error.type,
        severity: productionError.error.severity,
        message: productionError.error.message
      })

      return errorId
    } catch (monitorError) {
      console.error('🔴 HERA Production Monitor Error:', monitorError)
      return ''
    }
  }

  /**
   * Get buffered errors for manual reporting
   */
  getBufferedErrors(): ProductionError[] {
    return [...this.errorBuffer]
  }

  /**
   * Clear error buffer
   */
  clearBuffer(): void {
    this.errorBuffer = []
  }

  /**
   * Generate and send a production report
   */
  async generateReport(includeAllErrors: boolean = false): Promise<string> {
    const errors = includeAllErrors ? this.getBufferedErrors() : this.getBufferedErrors().slice(-10)
    
    if (errors.length === 0) {
      throw new Error('No errors to report')
    }

    const report = await reportGenerator.generateReport(errors, {
      includeUserContext: true,
      includePerformanceMetrics: true,
      format: 'comprehensive'
    })

    return report
  }

  /**
   * Send email alert for critical errors
   */
  private async reportError(productionError: ProductionError): Promise<void> {
    const config = this.getConfig(productionError.user.organization_id)
    if (!config.emailAlerts) return

    try {
      await emailReporter.sendCriticalAlert(productionError)
    } catch (emailError) {
      console.error('📧 Failed to send email alert:', emailError)
    }
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // JavaScript runtime errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || event.message, {
        action_being_performed: 'javascript_runtime',
        component_stack: this.getComponentStack()
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        action_being_performed: 'unhandled_promise_rejection'
      })
    })

    // React error boundaries (if using React)
    if (typeof window !== 'undefined' && (window as any).React) {
      this.setupReactErrorBoundary()
    }
  }

  /**
   * Set up network monitoring
   */
  private setupNetworkMonitoring(): void {
    // Monitor fetch requests
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = Date.now()
      const url = args[0] as string
      const options = args[1] as RequestInit

      try {
        const response = await originalFetch(...args)
        const duration = Date.now() - startTime

        // Log failed requests
        if (!response.ok) {
          this.logNetworkRequest({
            timestamp: new Date().toISOString(),
            url,
            method: options?.method || 'GET',
            status: response.status,
            duration,
            error: `HTTP ${response.status}: ${response.statusText}`
          })
        }

        return response
      } catch (error) {
        const duration = Date.now() - startTime
        this.logNetworkRequest({
          timestamp: new Date().toISOString(),
          url,
          method: options?.method || 'GET',
          status: 0,
          duration,
          error: error instanceof Error ? error.message : String(error)
        })
        throw error
      }
    }
  }

  /**
   * Set up performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor page performance
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            // Log slow page loads
            if (entry.duration > 5000) { // 5 seconds
              this.captureError('Slow page load detected', {
                action_being_performed: 'page_load_performance'
              }, {
                performance: {
                  page_load_time: entry.duration,
                  time_to_interactive: (entry as any).loadEventEnd,
                  memory_usage: (performance as any).memory?.usedJSHeapSize || 0,
                  error_time_since_load: Date.now() - (entry as any).loadEventEnd
                }
              })
            }
          }
        })
      })

      observer.observe({ entryTypes: ['navigation', 'measure'] })
    }
  }

  /**
   * Set up periodic buffer flush
   */
  private setupBufferFlush(): void {
    // Flush buffer every 5 minutes in production
    setInterval(() => {
      if (this.errorBuffer.length > 0) {
        console.log(`🔄 HERA Monitor: ${this.errorBuffer.length} errors in buffer`)
      }
      
      // Auto-clear old errors (keep last 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      this.errorBuffer = this.errorBuffer.filter(
        error => new Date(error.timestamp).getTime() > oneDayAgo
      )
    }, 5 * 60 * 1000)
  }

  /**
   * Classify error type based on context
   */
  private classifyErrorType(error: Error | string): ProductionError['error']['type'] {
    const message = error instanceof Error ? error.message : String(error)
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('auth') || lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
      return 'authentication'
    }
    if (lowerMessage.includes('fetch') || lowerMessage.includes('network') || lowerMessage.includes('api')) {
      return 'api'
    }
    if (lowerMessage.includes('performance') || lowerMessage.includes('slow') || lowerMessage.includes('timeout')) {
      return 'performance'
    }
    if (lowerMessage.includes('render') || lowerMessage.includes('component') || lowerMessage.includes('ui')) {
      return 'ui'
    }
    
    return 'business_logic'
  }

  /**
   * Classify error severity
   */
  private classifyErrorSeverity(
    error: Error | string, 
    context: Partial<ProductionError['context']>
  ): ProductionError['error']['severity'] {
    const message = error instanceof Error ? error.message : String(error)
    const lowerMessage = message.toLowerCase()

    // Critical: Authentication errors, payment failures, data corruption
    if (
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('payment') ||
      lowerMessage.includes('corruption') ||
      lowerMessage.includes('security') ||
      context.transaction_type === 'payment'
    ) {
      return 'critical'
    }

    // High: API failures, business logic errors
    if (
      lowerMessage.includes('api') ||
      lowerMessage.includes('server') ||
      lowerMessage.includes('database') ||
      context.entity_type
    ) {
      return 'high'
    }

    // Medium: UI errors, validation errors
    if (
      lowerMessage.includes('validation') ||
      lowerMessage.includes('ui') ||
      lowerMessage.includes('component')
    ) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * Get user context from available sources
   */
  private async getUserContext(): Promise<ProductionError['user']> {
    try {
      // Try to get context from various sources
      const orgId = localStorage.getItem('organizationId') || 
                   sessionStorage.getItem('organizationId') ||
                   'unknown'
      
      const userRole = localStorage.getItem('salonRole') || 
                      sessionStorage.getItem('userRole') || 
                      'unknown'

      const sessionId = sessionStorage.getItem('sessionId') || 
                       `session_${Date.now()}`

      return {
        organization_id: orgId,
        role: userRole,
        session_id: sessionId
      }
    } catch (error) {
      return {
        organization_id: 'unknown',
        role: 'unknown', 
        session_id: 'unknown'
      }
    }
  }

  /**
   * Get performance metrics
   */
  private getPerformanceMetrics(): PerformanceMetrics {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const memory = (performance as any).memory

      return {
        page_load_time: navigation?.loadEventEnd - navigation?.navigationStart || 0,
        time_to_interactive: navigation?.domInteractive - navigation?.navigationStart || 0,
        memory_usage: memory?.usedJSHeapSize || 0,
        error_time_since_load: Date.now() - navigation?.loadEventEnd || 0
      }
    } catch (error) {
      return {
        page_load_time: 0,
        time_to_interactive: 0,
        memory_usage: 0,
        error_time_since_load: 0
      }
    }
  }

  /**
   * Get component stack trace
   */
  private getComponentStack(): string[] {
    try {
      const stack = new Error().stack || ''
      return stack
        .split('\n')
        .filter(line => line.includes('at '))
        .map(line => line.trim())
        .slice(0, 10)
    } catch (error) {
      return []
    }
  }

  /**
   * Set up React error boundary monitoring
   */
  private setupReactErrorBoundary(): void {
    // This would integrate with React error boundaries if available
    // Implementation depends on the React setup
  }

  /**
   * Capture screenshot (if enabled)
   */
  private async captureScreenshot(): Promise<string | undefined> {
    try {
      if (!('html2canvas' in window)) {
        // html2canvas would need to be loaded dynamically
        return undefined
      }

      const canvas = await (window as any).html2canvas(document.body, {
        height: window.innerHeight,
        width: window.innerWidth,
        useCORS: true
      })
      
      return canvas.toDataURL('image/png')
    } catch (error) {
      console.warn('📸 Screenshot capture failed:', error)
      return undefined
    }
  }

  /**
   * Log network request
   */
  private logNetworkRequest(request: NetworkRequest): void {
    // Add to current error context or store for next error
    contextCollector.addNetworkRequest(request)
  }

  /**
   * Add error to buffer
   */
  private addToBuffer(error: ProductionError): void {
    this.errorBuffer.push(error)
    
    // Keep buffer size manageable
    if (this.errorBuffer.length > this.maxBufferSize) {
      this.errorBuffer = this.errorBuffer.slice(-this.maxBufferSize)
    }
  }

  /**
   * Get organization ID from current context
   */
  private getOrganizationFromContext(): string {
    try {
      // Try to get from localStorage first
      const orgId = localStorage.getItem('organizationId')
      if (orgId) return orgId

      // Try to get from sessionStorage
      const sessionOrgId = sessionStorage.getItem('organizationId')
      if (sessionOrgId) return sessionOrgId

      // Default fallback
      return 'monitoring-org'
    } catch (error) {
      return 'monitoring-org'
    }
  }
}

// Global singleton instance
export const productionMonitor = new HERAProductionMonitor()

// Auto-initialize in browser environments
if (typeof window !== 'undefined') {
  // Initialize after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => productionMonitor.init())
  } else {
    productionMonitor.init()
  }
}

export default productionMonitor