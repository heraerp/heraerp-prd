/**
 * HERA Context Collector
 * Collects user and system context for production monitoring
 * Smart Code: HERA.MONITORING.CONTEXT_COLLECTOR.v1
 */

'use client'

import type { NetworkRequest } from './production-monitor'

interface UserContext {
  user_agent: string
  viewport: string
  url: string
  path: string
  timestamp: string
  browser_info: {
    name: string
    version: string
    platform: string
    language: string
    cookies_enabled: boolean
    local_storage_available: boolean
    session_storage_available: boolean
  }
  device_info: {
    screen_resolution: string
    available_screen: string
    color_depth: number
    pixel_ratio: number
    touch_support: boolean
    orientation?: string
  }
  connection_info: {
    effective_type?: string
    downlink?: number
    rtt?: number
    save_data?: boolean
  }
  performance_info: {
    memory_usage?: number
    timing?: {
      navigation_start: number
      dom_content_loaded: number
      load_complete: number
    }
  }
}

interface SystemContext {
  timestamp: string
  hera_version: string
  environment: string
  session_info: {
    session_id: string
    organization_id: string
    user_role: string
    session_duration: number
  }
  feature_flags: Record<string, boolean>
  authentication_state: {
    is_authenticated: boolean
    token_expiry?: string
    last_activity?: string
  }
}

class ContextCollector {
  private networkRequests: NetworkRequest[] = []
  private maxNetworkRequests = 20
  private userActions: Array<{
    type: string
    element?: string
    timestamp: string
    coordinates?: { x: number; y: number }
  }> = []
  private maxUserActions = 30

  /**
   * Get comprehensive user context
   */
  getUserContext(): UserContext {
    return {
      user_agent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
      browser_info: this.getBrowserInfo(),
      device_info: this.getDeviceInfo(),
      connection_info: this.getConnectionInfo(),
      performance_info: this.getPerformanceInfo()
    }
  }

  /**
   * Get system context from HERA application
   */
  getSystemContext(): SystemContext {
    return {
      timestamp: new Date().toISOString(),
      hera_version: this.getHeraVersion(),
      environment: process.env.NODE_ENV || 'unknown',
      session_info: this.getSessionInfo(),
      feature_flags: this.getFeatureFlags(),
      authentication_state: this.getAuthenticationState()
    }
  }

  /**
   * Get browser information
   */
  private getBrowserInfo() {
    const ua = navigator.userAgent
    let browserName = 'Unknown'
    let browserVersion = 'Unknown'

    // Detect browser
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browserName = 'Chrome'
      const match = ua.match(/Chrome\/(\d+\.\d+)/)
      browserVersion = match ? match[1] : 'Unknown'
    } else if (ua.includes('Firefox')) {
      browserName = 'Firefox'
      const match = ua.match(/Firefox\/(\d+\.\d+)/)
      browserVersion = match ? match[1] : 'Unknown'
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browserName = 'Safari'
      const match = ua.match(/Version\/(\d+\.\d+)/)
      browserVersion = match ? match[1] : 'Unknown'
    } else if (ua.includes('Edg')) {
      browserName = 'Edge'
      const match = ua.match(/Edg\/(\d+\.\d+)/)
      browserVersion = match ? match[1] : 'Unknown'
    }

    return {
      name: browserName,
      version: browserVersion,
      platform: navigator.platform,
      language: navigator.language,
      cookies_enabled: navigator.cookieEnabled,
      local_storage_available: this.isStorageAvailable('localStorage'),
      session_storage_available: this.isStorageAvailable('sessionStorage')
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo() {
    const screen = window.screen
    
    return {
      screen_resolution: `${screen.width}x${screen.height}`,
      available_screen: `${screen.availWidth}x${screen.availHeight}`,
      color_depth: screen.colorDepth,
      pixel_ratio: window.devicePixelRatio || 1,
      touch_support: 'ontouchstart' in window,
      orientation: screen.orientation?.type
    }
  }

  /**
   * Get connection information
   */
  private getConnectionInfo() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (!connection) {
      return {}
    }

    return {
      effective_type: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      save_data: connection.saveData
    }
  }

  /**
   * Get performance information
   */
  private getPerformanceInfo() {
    const info: any = {}

    // Memory usage (Chrome only)
    if ('memory' in performance) {
      info.memory_usage = (performance as any).memory.usedJSHeapSize
    }

    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      info.timing = {
        navigation_start: navigation.navigationStart,
        dom_content_loaded: navigation.domContentLoadedEventEnd,
        load_complete: navigation.loadEventEnd
      }
    }

    return info
  }

  /**
   * Check if storage is available
   */
  private isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type]
      const x = '__storage_test__'
      storage.setItem(x, x)
      storage.removeItem(x)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Get HERA version from package.json or build info
   */
  private getHeraVersion(): string {
    try {
      // Try to get from window global (if injected during build)
      if ((window as any).__HERA_VERSION__) {
        return (window as any).__HERA_VERSION__
      }

      // Try to get from localStorage (if cached)
      const cached = localStorage.getItem('hera_version')
      if (cached) {
        return cached
      }

      // Default fallback
      return '1.2.2' // Current version from package.json
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * Get session information from localStorage/sessionStorage
   */
  private getSessionInfo() {
    try {
      const sessionId = sessionStorage.getItem('sessionId') || 
                       localStorage.getItem('sessionId') || 
                       `session_${Date.now()}`

      const organizationId = localStorage.getItem('organizationId') ||
                           sessionStorage.getItem('organizationId') ||
                           'unknown'

      const userRole = localStorage.getItem('salonRole') ||
                      sessionStorage.getItem('userRole') ||
                      'unknown'

      // Calculate session duration
      const sessionStart = localStorage.getItem('sessionStartTime')
      const sessionDuration = sessionStart ? 
        Date.now() - parseInt(sessionStart) : 0

      return {
        session_id: sessionId,
        organization_id: organizationId,
        user_role: userRole,
        session_duration: sessionDuration
      }
    } catch (error) {
      return {
        session_id: 'unknown',
        organization_id: 'unknown',
        user_role: 'unknown',
        session_duration: 0
      }
    }
  }

  /**
   * Get feature flags (if implemented in HERA)
   */
  private getFeatureFlags(): Record<string, boolean> {
    try {
      // Try to get from localStorage or global window
      const flags = localStorage.getItem('featureFlags')
      if (flags) {
        return JSON.parse(flags)
      }

      if ((window as any).__HERA_FEATURE_FLAGS__) {
        return (window as any).__HERA_FEATURE_FLAGS__
      }

      // Default feature flags for HERA
      return {
        production_monitoring: true,
        enhanced_logging: process.env.NODE_ENV === 'development',
        auto_error_reporting: process.env.NODE_ENV === 'production',
        performance_tracking: true
      }
    } catch (error) {
      return {}
    }
  }

  /**
   * Get authentication state
   */
  private getAuthenticationState() {
    try {
      // Check Supabase session
      const supabaseSession = localStorage.getItem('supabase.auth.token')
      let tokenExpiry: string | undefined
      
      if (supabaseSession) {
        const session = JSON.parse(supabaseSession)
        tokenExpiry = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined
      }

      const lastActivity = localStorage.getItem('lastActivity') ||
                          sessionStorage.getItem('lastActivity')

      return {
        is_authenticated: !!supabaseSession,
        token_expiry: tokenExpiry,
        last_activity: lastActivity
      }
    } catch (error) {
      return {
        is_authenticated: false
      }
    }
  }

  /**
   * Add network request to tracking
   */
  addNetworkRequest(request: NetworkRequest): void {
    this.networkRequests.push(request)
    
    // Keep only recent requests
    if (this.networkRequests.length > this.maxNetworkRequests) {
      this.networkRequests = this.networkRequests.slice(-this.maxNetworkRequests)
    }
  }

  /**
   * Get tracked network requests
   */
  getNetworkRequests(): NetworkRequest[] {
    return [...this.networkRequests]
  }

  /**
   * Track user actions for context
   */
  trackUserAction(type: string, element?: Element, event?: Event): void {
    try {
      const action: any = {
        type,
        timestamp: new Date().toISOString()
      }

      if (element) {
        action.element = this.getElementSelector(element)
      }

      if (event && 'clientX' in event && 'clientY' in event) {
        action.coordinates = {
          x: (event as MouseEvent).clientX,
          y: (event as MouseEvent).clientY
        }
      }

      this.userActions.push(action)

      // Keep only recent actions
      if (this.userActions.length > this.maxUserActions) {
        this.userActions = this.userActions.slice(-this.maxUserActions)
      }
    } catch (error) {
      // Fail silently
    }
  }

  /**
   * Get recent user actions
   */
  getUserActions(): typeof this.userActions {
    return [...this.userActions]
  }

  /**
   * Get element selector for tracking
   */
  private getElementSelector(element: Element): string {
    try {
      if (element.id) {
        return `#${element.id}`
      }

      if (element.className) {
        const classes = element.className.toString().split(' ').filter(c => c)
        if (classes.length > 0) {
          return `.${classes[0]}`
        }
      }

      return element.tagName.toLowerCase()
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * Initialize user action tracking
   */
  initUserActionTracking(): void {
    if (typeof window === 'undefined') return

    // Track clicks
    document.addEventListener('click', (event) => {
      this.trackUserAction('click', event.target as Element, event)
    }, { passive: true })

    // Track form submissions
    document.addEventListener('submit', (event) => {
      this.trackUserAction('submit', event.target as Element, event)
    }, { passive: true })

    // Track navigation
    window.addEventListener('popstate', () => {
      this.trackUserAction('navigation')
    })

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackUserAction(
        document.hidden ? 'page_hidden' : 'page_visible'
      )
    })
  }

  /**
   * Get comprehensive context for error reporting
   */
  getErrorContext(): {
    user: UserContext
    system: SystemContext
    network: NetworkRequest[]
    actions: typeof this.userActions
  } {
    return {
      user: this.getUserContext(),
      system: this.getSystemContext(),
      network: this.getNetworkRequests(),
      actions: this.getUserActions()
    }
  }

  /**
   * Clear collected context data
   */
  clearContext(): void {
    this.networkRequests = []
    this.userActions = []
  }

  /**
   * Configure context collection
   */
  configure(options: {
    maxNetworkRequests?: number
    maxUserActions?: number
  }): void {
    if (options.maxNetworkRequests !== undefined) {
      this.maxNetworkRequests = options.maxNetworkRequests
      
      if (this.networkRequests.length > this.maxNetworkRequests) {
        this.networkRequests = this.networkRequests.slice(-this.maxNetworkRequests)
      }
    }

    if (options.maxUserActions !== undefined) {
      this.maxUserActions = options.maxUserActions
      
      if (this.userActions.length > this.maxUserActions) {
        this.userActions = this.userActions.slice(-this.maxUserActions)
      }
    }
  }
}

// Global singleton instance
export const contextCollector = new ContextCollector()

export default contextCollector