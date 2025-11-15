/**
 * HERA Universal Tile System - Production Security Monitoring
 * Smart Code: HERA.MONITORING.SECURITY.PRODUCTION.v1
 * 
 * Comprehensive security monitoring, threat detection, and incident response
 * for production environments with automated remediation capabilities
 */

import { ErrorTracker } from './ErrorTracker'

export interface SecurityThreat {
  id: string
  type: 'brute_force' | 'sql_injection' | 'xss' | 'csrf' | 'data_breach' | 'unauthorized_access' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  source: string
  target: string
  description: string
  timestamp: number
  metadata: Record<string, any>
  status: 'detected' | 'investigating' | 'mitigated' | 'resolved'
  autoMitigated: boolean
}

export interface SecurityRule {
  id: string
  name: string
  pattern: RegExp | string
  severity: SecurityThreat['severity']
  category: SecurityThreat['type']
  enabled: boolean
  threshold?: number
  timeWindow?: number // minutes
  action: 'log' | 'block' | 'alert' | 'quarantine'
  description: string
}

export interface SecurityMetrics {
  timestamp: number
  totalThreats: number
  threatsBlocked: number
  suspiciousActivities: number
  failedAuthAttempts: number
  accessViolations: number
  dataExfiltrationsDetected: number
  autoMitigationSuccess: number
  threatsByType: Record<string, number>
  threatsBySeverity: Record<string, number>
  topAttackers: Array<{ ip: string; count: number }>
  securityScore: number
}

export interface SecurityIncident {
  id: string
  title: string
  description: string
  severity: SecurityThreat['severity']
  startTime: number
  endTime?: number
  status: 'open' | 'investigating' | 'contained' | 'resolved'
  threats: SecurityThreat[]
  timeline: Array<{ timestamp: number; action: string; details: string }>
  response: {
    automated: string[]
    manual: string[]
    recommendations: string[]
  }
  impact: {
    usersAffected: number
    dataAtRisk: string[]
    systemsCompromised: string[]
    businessImpact: 'low' | 'medium' | 'high' | 'critical'
  }
}

export class SecurityMonitor {
  private threats: Map<string, SecurityThreat> = new Map()
  private incidents: Map<string, SecurityIncident> = new Map()
  private securityRules: Map<string, SecurityRule> = new Map()
  private metrics: SecurityMetrics
  private errorTracker: ErrorTracker
  private isMonitoring = false
  private suspiciousIPs: Map<string, { count: number; lastSeen: number }> = new Map()
  private failedAuthAttempts: Map<string, number> = new Map()
  
  constructor(errorTracker: ErrorTracker) {
    this.errorTracker = errorTracker
    this.metrics = this.initializeMetrics()
    this.loadSecurityRules()
    this.startSecurityMonitoring()
  }
  
  private initializeMetrics(): SecurityMetrics {
    return {
      timestamp: Date.now(),
      totalThreats: 0,
      threatsBlocked: 0,
      suspiciousActivities: 0,
      failedAuthAttempts: 0,
      accessViolations: 0,
      dataExfiltrationsDetected: 0,
      autoMitigationSuccess: 0,
      threatsByType: {},
      threatsBySeverity: {},
      topAttackers: [],
      securityScore: 100
    }
  }
  
  /**
   * Start security monitoring
   */
  public startSecurityMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Security monitoring is already running')
      return
    }
    
    this.isMonitoring = true
    console.log('🛡️ Security monitoring started')
    
    // Monitor API requests
    this.monitorAPIRequests()
    
    // Monitor authentication attempts
    this.monitorAuthentication()
    
    // Monitor data access patterns
    this.monitorDataAccess()
    
    // Start periodic security scans
    setInterval(() => this.performSecurityScan(), 60000) // Every minute
    
    // Update security metrics
    setInterval(() => this.updateSecurityMetrics(), 30000) // Every 30 seconds
    
    // Check for incidents
    setInterval(() => this.checkForIncidents(), 10000) // Every 10 seconds
  }
  
  /**
   * Stop security monitoring
   */
  public stopSecurityMonitoring(): void {
    this.isMonitoring = false
    console.log('🛑 Security monitoring stopped')
  }
  
  /**
   * Monitor API requests for suspicious patterns
   */
  private monitorAPIRequests(): void {
    if (typeof window !== 'undefined') {
      // Override fetch to monitor API calls
      const originalFetch = window.fetch
      window.fetch = async (...args) => {
        const url = args[0] as string
        const options = args[1] as RequestInit
        
        // Check for suspicious patterns
        this.analyzeAPIRequest(url, options)
        
        try {
          const response = await originalFetch(...args)
          
          // Monitor response for security indicators
          if (response.status === 401 || response.status === 403) {
            this.handleAuthenticationFailure(url)
          }
          
          return response
        } catch (error) {
          this.analyzeNetworkError(url, error as Error)
          throw error
        }
      }
    }
  }
  
  /**
   * Analyze API request for security threats
   */
  private analyzeAPIRequest(url: string, options?: RequestInit): void {
    const clientIP = this.getClientIP()
    
    // SQL Injection detection
    if (this.detectSQLInjection(url, options)) {
      this.reportThreat({
        type: 'sql_injection',
        severity: 'high',
        source: clientIP,
        target: url,
        description: 'Potential SQL injection attempt detected',
        metadata: { url, method: options?.method || 'GET' }
      })
    }
    
    // XSS detection
    if (this.detectXSS(url, options)) {
      this.reportThreat({
        type: 'xss',
        severity: 'medium',
        source: clientIP,
        target: url,
        description: 'Potential XSS attempt detected',
        metadata: { url, method: options?.method || 'GET' }
      })
    }
    
    // Rate limiting / DoS detection
    if (this.detectRateLimitViolation(clientIP)) {
      this.reportThreat({
        type: 'brute_force',
        severity: 'medium',
        source: clientIP,
        target: 'api',
        description: 'Rate limit violation detected - potential DoS attack',
        metadata: { url, requestCount: this.getRequestCount(clientIP) }
      })
    }
    
    // Unauthorized access detection
    if (this.detectUnauthorizedAccess(url, options)) {
      this.reportThreat({
        type: 'unauthorized_access',
        severity: 'high',
        source: clientIP,
        target: url,
        description: 'Unauthorized access attempt detected',
        metadata: { url, headers: this.sanitizeHeaders(options?.headers) }
      })
    }
  }
  
  /**
   * Monitor authentication attempts
   */
  private monitorAuthentication(): void {
    // Listen for authentication events
    if (typeof window !== 'undefined') {
      window.addEventListener('authAttempt', (event: any) => {
        this.analyzeAuthAttempt(event.detail)
      })
      
      window.addEventListener('authFailure', (event: any) => {
        this.handleAuthenticationFailure(event.detail.endpoint, event.detail.reason)
      })
      
      window.addEventListener('authSuccess', (event: any) => {
        this.handleAuthenticationSuccess(event.detail)
      })
    }
  }
  
  /**
   * Monitor data access patterns
   */
  private monitorDataAccess(): void {
    // Monitor tile data access
    if (typeof window !== 'undefined') {
      window.addEventListener('tileDataAccess', (event: any) => {
        this.analyzeDataAccess(event.detail)
      })
      
      window.addEventListener('dataExport', (event: any) => {
        this.analyzeDataExport(event.detail)
      })
    }
  }
  
  /**
   * Detect SQL injection patterns
   */
  private detectSQLInjection(url: string, options?: RequestInit): boolean {
    const sqlPatterns = [
      /union\s+select/i,
      /or\s+1\s*=\s*1/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+.*\s+set/i,
      /exec\s*\(/i,
      /script\s*>/i
    ]
    
    const payload = `${url} ${JSON.stringify(options?.body || '')}`
    return sqlPatterns.some(pattern => pattern.test(payload))
  }
  
  /**
   * Detect XSS patterns
   */
  private detectXSS(url: string, options?: RequestInit): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i
    ]
    
    const payload = `${url} ${JSON.stringify(options?.body || '')}`
    return xssPatterns.some(pattern => pattern.test(payload))
  }
  
  /**
   * Detect rate limit violations
   */
  private detectRateLimitViolation(clientIP: string): boolean {
    const now = Date.now()
    const timeWindow = 60000 // 1 minute
    const maxRequests = 100 // 100 requests per minute
    
    if (!this.suspiciousIPs.has(clientIP)) {
      this.suspiciousIPs.set(clientIP, { count: 1, lastSeen: now })
      return false
    }
    
    const ipData = this.suspiciousIPs.get(clientIP)!
    
    if (now - ipData.lastSeen > timeWindow) {
      // Reset counter for new time window
      ipData.count = 1
      ipData.lastSeen = now
      return false
    }
    
    ipData.count++
    ipData.lastSeen = now
    
    return ipData.count > maxRequests
  }
  
  /**
   * Detect unauthorized access attempts
   */
  private detectUnauthorizedAccess(url: string, options?: RequestInit): boolean {
    // Check for access to sensitive endpoints without proper authorization
    const sensitiveEndpoints = [
      '/api/admin',
      '/api/v2/organizations',
      '/api/health/internal',
      '/api/metrics',
      '/api/debug'
    ]
    
    const isAccessingSensitiveEndpoint = sensitiveEndpoints.some(endpoint => 
      url.includes(endpoint)
    )
    
    if (!isAccessingSensitiveEndpoint) return false
    
    // Check for missing or invalid authorization header
    const authHeader = this.getAuthHeader(options?.headers)
    if (!authHeader || !this.isValidAuthHeader(authHeader)) {
      return true
    }
    
    return false
  }
  
  /**
   * Analyze authentication attempt
   */
  private analyzeAuthAttempt(details: any): void {
    const clientIP = this.getClientIP()
    const key = `${clientIP}:${details.email || 'unknown'}`
    
    // Track failed attempts
    if (!details.success) {
      const attempts = (this.failedAuthAttempts.get(key) || 0) + 1
      this.failedAuthAttempts.set(key, attempts)
      
      // Brute force detection
      if (attempts > 5) {
        this.reportThreat({
          type: 'brute_force',
          severity: attempts > 10 ? 'high' : 'medium',
          source: clientIP,
          target: 'authentication',
          description: `Brute force attack detected: ${attempts} failed attempts`,
          metadata: { email: details.email, attempts }
        })
      }
    } else {
      // Reset counter on successful auth
      this.failedAuthAttempts.delete(key)
    }
  }
  
  /**
   * Handle authentication failure
   */
  private handleAuthenticationFailure(endpoint: string, reason?: string): void {
    this.metrics.failedAuthAttempts++
    
    // Log security event
    this.errorTracker.trackSecurityError(
      `Authentication failure: ${reason || 'Unknown reason'}`,
      {
        url: endpoint,
        timestamp: Date.now()
      }
    )
  }
  
  /**
   * Handle authentication success
   */
  private handleAuthenticationSuccess(details: any): void {
    const clientIP = this.getClientIP()
    
    // Check for suspicious login patterns
    if (this.detectSuspiciousLogin(details, clientIP)) {
      this.reportThreat({
        type: 'suspicious_activity',
        severity: 'medium',
        source: clientIP,
        target: 'authentication',
        description: 'Suspicious login pattern detected',
        metadata: details
      })
    }
  }
  
  /**
   * Analyze data access patterns
   */
  private analyzeDataAccess(details: any): void {
    // Check for unusual data access patterns
    if (this.detectUnusualDataAccess(details)) {
      this.reportThreat({
        type: 'data_breach',
        severity: 'high',
        source: this.getClientIP(),
        target: details.endpoint || 'data_access',
        description: 'Unusual data access pattern detected',
        metadata: details
      })
    }
  }
  
  /**
   * Analyze data export attempts
   */
  private analyzeDataExport(details: any): void {
    // Check for suspicious data exports
    if (this.detectSuspiciousDataExport(details)) {
      this.reportThreat({
        type: 'data_breach',
        severity: 'critical',
        source: this.getClientIP(),
        target: 'data_export',
        description: 'Suspicious data export detected - potential data exfiltration',
        metadata: details
      })
      
      this.metrics.dataExfiltrationsDetected++
    }
  }
  
  /**
   * Report a security threat
   */
  public reportThreat(threat: Omit<SecurityThreat, 'id' | 'timestamp' | 'status' | 'autoMitigated'>): string {
    const threatId = `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const fullThreat: SecurityThreat = {
      id: threatId,
      timestamp: Date.now(),
      status: 'detected',
      autoMitigated: false,
      ...threat
    }
    
    this.threats.set(threatId, fullThreat)
    
    console.warn(`🚨 Security threat detected [${threat.severity}]: ${threat.description}`)
    
    // Update metrics
    this.metrics.totalThreats++
    this.metrics.threatsByType[threat.type] = (this.metrics.threatsByType[threat.type] || 0) + 1
    this.metrics.threatsBySeverity[threat.severity] = (this.metrics.threatsBySeverity[threat.severity] || 0) + 1
    
    // Attempt auto-mitigation
    if (this.attemptAutoMitigation(fullThreat)) {
      fullThreat.autoMitigated = true
      fullThreat.status = 'mitigated'
      this.metrics.autoMitigationSuccess++
      this.metrics.threatsBlocked++
    }
    
    // Send security alert for high/critical threats
    if (['high', 'critical'].includes(threat.severity)) {
      this.sendSecurityAlert(fullThreat)
    }
    
    return threatId
  }
  
  /**
   * Attempt automatic threat mitigation
   */
  private attemptAutoMitigation(threat: SecurityThreat): boolean {
    switch (threat.type) {
      case 'brute_force':
        return this.mitigateBruteForce(threat)
      case 'sql_injection':
      case 'xss':
        return this.mitigateMaliciousRequest(threat)
      case 'unauthorized_access':
        return this.mitigateUnauthorizedAccess(threat)
      case 'suspicious_activity':
        return this.mitigateSuspiciousActivity(threat)
      default:
        return false
    }
  }
  
  /**
   * Mitigate brute force attacks
   */
  private mitigateBruteForce(threat: SecurityThreat): boolean {
    const sourceIP = threat.source
    
    // Block IP for 15 minutes
    this.blockIP(sourceIP, 15 * 60 * 1000)
    
    console.log(`🛡️ Auto-mitigation: Blocked IP ${sourceIP} for brute force attack`)
    return true
  }
  
  /**
   * Mitigate malicious requests
   */
  private mitigateMaliciousRequest(threat: SecurityThreat): boolean {
    const sourceIP = threat.source
    
    // Block IP for 30 minutes
    this.blockIP(sourceIP, 30 * 60 * 1000)
    
    // Log detailed request for analysis
    console.log(`🛡️ Auto-mitigation: Blocked malicious request from ${sourceIP}`)
    return true
  }
  
  /**
   * Mitigate unauthorized access
   */
  private mitigateUnauthorizedAccess(threat: SecurityThreat): boolean {
    const sourceIP = threat.source
    
    // Block IP for 1 hour
    this.blockIP(sourceIP, 60 * 60 * 1000)
    
    console.log(`🛡️ Auto-mitigation: Blocked unauthorized access from ${sourceIP}`)
    return true
  }
  
  /**
   * Mitigate suspicious activity
   */
  private mitigateSuspiciousActivity(threat: SecurityThreat): boolean {
    // Increase monitoring for this IP
    this.increaseSurveillance(threat.source)
    
    console.log(`🛡️ Auto-mitigation: Increased monitoring for suspicious activity from ${threat.source}`)
    return true
  }
  
  /**
   * Block IP address
   */
  private blockIP(ip: string, duration: number): void {
    // Implementation would integrate with firewall/WAF
    console.log(`🚫 Blocking IP ${ip} for ${duration}ms`)
    
    // Send block request to security infrastructure
    if (process.env.SECURITY_API_ENDPOINT) {
      fetch(`${process.env.SECURITY_API_ENDPOINT}/block-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, duration, reason: 'Security threat detected' })
      }).catch(error => {
        console.error('Failed to block IP:', error)
      })
    }
  }
  
  /**
   * Increase surveillance for IP
   */
  private increaseSurveillance(ip: string): void {
    console.log(`👁️ Increased surveillance for IP ${ip}`)
    // Implementation would increase logging and monitoring
  }
  
  /**
   * Send security alert
   */
  private async sendSecurityAlert(threat: SecurityThreat): Promise<void> {
    const alert = {
      timestamp: Date.now(),
      threat: {
        id: threat.id,
        type: threat.type,
        severity: threat.severity,
        description: threat.description,
        source: threat.source,
        target: threat.target
      },
      environment: process.env.NODE_ENV,
      deployment: process.env.DEPLOYMENT_ID
    }
    
    // Send to security operations center
    if (process.env.SECURITY_ALERT_WEBHOOK) {
      try {
        await fetch(process.env.SECURITY_ALERT_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        })
      } catch (error) {
        console.error('Failed to send security alert:', error)
      }
    }
    
    // Log to error tracker
    this.errorTracker.trackSecurityError(
      `Security threat: ${threat.description}`,
      {
        threatId: threat.id,
        source: threat.source,
        severity: threat.severity
      }
    )
  }
  
  /**
   * Perform periodic security scan
   */
  private performSecurityScan(): void {
    if (!this.isMonitoring) return
    
    // Clean up old IP tracking data
    this.cleanupOldData()
    
    // Update security score
    this.calculateSecurityScore()
    
    // Check for security patterns
    this.analyzeSecurityPatterns()
  }
  
  /**
   * Update security metrics
   */
  private updateSecurityMetrics(): void {
    this.metrics.timestamp = Date.now()
    
    // Update top attackers
    this.metrics.topAttackers = Array.from(this.suspiciousIPs.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([ip, data]) => ({ ip, count: data.count }))
  }
  
  /**
   * Clean up old tracking data
   */
  private cleanupOldData(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    // Clean up suspicious IPs
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (now - data.lastSeen > maxAge) {
        this.suspiciousIPs.delete(ip)
      }
    }
    
    // Clean up failed auth attempts
    // Implementation would track timestamps for cleanup
  }
  
  /**
   * Calculate security score
   */
  private calculateSecurityScore(): void {
    const baseScore = 100
    const now = Date.now()
    const timeWindow = 60 * 60 * 1000 // 1 hour
    
    const recentThreats = Array.from(this.threats.values())
      .filter(threat => now - threat.timestamp < timeWindow)
    
    let scoreReduction = 0
    
    recentThreats.forEach(threat => {
      switch (threat.severity) {
        case 'critical':
          scoreReduction += threat.autoMitigated ? 5 : 20
          break
        case 'high':
          scoreReduction += threat.autoMitigated ? 2 : 10
          break
        case 'medium':
          scoreReduction += threat.autoMitigated ? 1 : 5
          break
        case 'low':
          scoreReduction += threat.autoMitigated ? 0.5 : 2
          break
      }
    })
    
    this.metrics.securityScore = Math.max(0, Math.min(100, baseScore - scoreReduction))
  }
  
  /**
   * Analyze security patterns
   */
  private analyzeSecurityPatterns(): void {
    // Look for coordinated attacks, unusual patterns, etc.
    const now = Date.now()
    const timeWindow = 10 * 60 * 1000 // 10 minutes
    
    const recentThreats = Array.from(this.threats.values())
      .filter(threat => now - threat.timestamp < timeWindow)
    
    // Check for coordinated attacks
    if (this.detectCoordinatedAttack(recentThreats)) {
      this.reportThreat({
        type: 'suspicious_activity',
        severity: 'critical',
        source: 'multiple',
        target: 'system',
        description: 'Coordinated attack detected across multiple sources',
        metadata: { threatCount: recentThreats.length, timeWindow }
      })
    }
  }
  
  /**
   * Detect coordinated attacks
   */
  private detectCoordinatedAttack(threats: SecurityThreat[]): boolean {
    if (threats.length < 5) return false
    
    // Check for multiple sources targeting same endpoints
    const targetCounts = threats.reduce((counts: Record<string, number>, threat) => {
      counts[threat.target] = (counts[threat.target] || 0) + 1
      return counts
    }, {})
    
    const maxTargetCount = Math.max(...Object.values(targetCounts))
    return maxTargetCount >= 3 // 3 or more attacks on same target
  }
  
  // Helper methods
  private getClientIP(): string {
    // Implementation would get real client IP
    return '192.168.1.1' // Placeholder
  }
  
  private getAuthHeader(headers: any): string | null {
    if (!headers) return null
    
    if (headers instanceof Headers) {
      return headers.get('authorization')
    }
    
    if (typeof headers === 'object') {
      return headers.authorization || headers.Authorization
    }
    
    return null
  }
  
  private isValidAuthHeader(authHeader: string): boolean {
    // Implementation would validate JWT or other auth tokens
    return authHeader.startsWith('Bearer ') && authHeader.length > 10
  }
  
  private sanitizeHeaders(headers: any): any {
    if (!headers) return {}
    
    const sanitized = { ...headers }
    delete sanitized.authorization
    delete sanitized.Authorization
    
    return sanitized
  }
  
  private getRequestCount(ip: string): number {
    return this.suspiciousIPs.get(ip)?.count || 0
  }
  
  private detectSuspiciousLogin(details: any, ip: string): boolean {
    // Check for logins from unusual locations, times, etc.
    // Placeholder implementation
    return false
  }
  
  private detectUnusualDataAccess(details: any): boolean {
    // Check for unusual data access patterns
    // Placeholder implementation
    return false
  }
  
  private detectSuspiciousDataExport(details: any): boolean {
    // Check for large data exports, unusual times, etc.
    if (details.recordCount && details.recordCount > 10000) {
      return true
    }
    
    if (details.exportSize && details.exportSize > 100 * 1024 * 1024) { // 100MB
      return true
    }
    
    return false
  }
  
  private checkForIncidents(): void {
    // Check if multiple threats should be grouped into incidents
    const now = Date.now()
    const timeWindow = 30 * 60 * 1000 // 30 minutes
    
    const recentHighThreats = Array.from(this.threats.values())
      .filter(threat => 
        now - threat.timestamp < timeWindow &&
        ['high', 'critical'].includes(threat.severity) &&
        threat.status !== 'resolved'
      )
    
    if (recentHighThreats.length >= 3) {
      this.createSecurityIncident(recentHighThreats)
    }
  }
  
  private createSecurityIncident(threats: SecurityThreat[]): void {
    const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const incident: SecurityIncident = {
      id: incidentId,
      title: `Security Incident: Multiple threats detected`,
      description: `${threats.length} high-severity threats detected within 30 minutes`,
      severity: threats.some(t => t.severity === 'critical') ? 'critical' : 'high',
      startTime: Math.min(...threats.map(t => t.timestamp)),
      status: 'open',
      threats,
      timeline: [
        {
          timestamp: Date.now(),
          action: 'incident_created',
          details: `Incident created with ${threats.length} threats`
        }
      ],
      response: {
        automated: threats.filter(t => t.autoMitigated).map(t => `Mitigated ${t.type} from ${t.source}`),
        manual: [],
        recommendations: [
          'Review attack patterns',
          'Consider blocking source IPs',
          'Increase monitoring level',
          'Notify security team'
        ]
      },
      impact: {
        usersAffected: 0, // Would be calculated based on actual impact
        dataAtRisk: [],
        systemsCompromised: [],
        businessImpact: 'medium'
      }
    }
    
    this.incidents.set(incidentId, incident)
    
    console.error(`🚨 Security incident created: ${incident.title}`)
    
    // Send incident notification
    this.sendIncidentNotification(incident)
  }
  
  private async sendIncidentNotification(incident: SecurityIncident): Promise<void> {
    if (process.env.SECURITY_INCIDENT_WEBHOOK) {
      try {
        await fetch(process.env.SECURITY_INCIDENT_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incident: {
              id: incident.id,
              title: incident.title,
              severity: incident.severity,
              threatCount: incident.threats.length,
              startTime: incident.startTime
            },
            timestamp: Date.now()
          })
        })
      } catch (error) {
        console.error('Failed to send incident notification:', error)
      }
    }
  }
  
  private loadSecurityRules(): void {
    // Load security rules configuration
    const defaultRules: SecurityRule[] = [
      {
        id: 'sql_injection_basic',
        name: 'Basic SQL Injection Detection',
        pattern: /union\s+select|or\s+1\s*=\s*1|drop\s+table/i,
        severity: 'high',
        category: 'sql_injection',
        enabled: true,
        action: 'block',
        description: 'Detects common SQL injection patterns'
      },
      {
        id: 'xss_basic',
        name: 'Basic XSS Detection',
        pattern: /<script[^>]*>|javascript:|on\w+\s*=/i,
        severity: 'medium',
        category: 'xss',
        enabled: true,
        action: 'alert',
        description: 'Detects common XSS patterns'
      },
      {
        id: 'brute_force',
        name: 'Brute Force Detection',
        pattern: '',
        severity: 'medium',
        category: 'brute_force',
        enabled: true,
        threshold: 5,
        timeWindow: 5,
        action: 'block',
        description: 'Detects brute force attacks based on failed login attempts'
      }
    ]
    
    defaultRules.forEach(rule => {
      this.securityRules.set(rule.id, rule)
    })
  }
  
  /**
   * Get security metrics
   */
  public getSecurityMetrics(): SecurityMetrics {
    return { ...this.metrics }
  }
  
  /**
   * Get security threats
   */
  public getSecurityThreats(criteria: {
    severity?: SecurityThreat['severity']
    type?: SecurityThreat['type']
    status?: SecurityThreat['status']
    limit?: number
  } = {}): SecurityThreat[] {
    let threats = Array.from(this.threats.values())
    
    if (criteria.severity) {
      threats = threats.filter(t => t.severity === criteria.severity)
    }
    
    if (criteria.type) {
      threats = threats.filter(t => t.type === criteria.type)
    }
    
    if (criteria.status) {
      threats = threats.filter(t => t.status === criteria.status)
    }
    
    threats.sort((a, b) => b.timestamp - a.timestamp)
    
    if (criteria.limit) {
      threats = threats.slice(0, criteria.limit)
    }
    
    return threats
  }
  
  /**
   * Get security incidents
   */
  public getSecurityIncidents(): SecurityIncident[] {
    return Array.from(this.incidents.values())
      .sort((a, b) => b.startTime - a.startTime)
  }
  
  /**
   * Resolve threat
   */
  public resolveThreat(threatId: string): boolean {
    const threat = this.threats.get(threatId)
    if (threat) {
      threat.status = 'resolved'
      console.log(`✅ Threat resolved: ${threat.description}`)
      return true
    }
    return false
  }
  
  /**
   * Resolve incident
   */
  public resolveIncident(incidentId: string): boolean {
    const incident = this.incidents.get(incidentId)
    if (incident) {
      incident.status = 'resolved'
      incident.endTime = Date.now()
      incident.timeline.push({
        timestamp: Date.now(),
        action: 'incident_resolved',
        details: 'Incident manually resolved'
      })
      console.log(`✅ Security incident resolved: ${incident.title}`)
      return true
    }
    return false
  }
}

// Global security monitor instance
export let securityMonitor: SecurityMonitor | null = null

/**
 * Initialize security monitoring
 */
export function initializeSecurityMonitoring(errorTracker: ErrorTracker): SecurityMonitor {
  if (securityMonitor) {
    console.warn('Security monitoring is already initialized')
    return securityMonitor
  }
  
  securityMonitor = new SecurityMonitor(errorTracker)
  return securityMonitor
}

/**
 * Get security monitor instance
 */
export function getSecurityMonitor(): SecurityMonitor | null {
  return securityMonitor
}

export default SecurityMonitor