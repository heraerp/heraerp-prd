/**
 * HERA Advanced Observability Dashboard
 * 
 * Production-grade monitoring for Enhanced Gateway and AI operations
 * - Real-time performance metrics
 * - Security violation tracking
 * - AI cost analytics
 * - System health monitoring
 * 
 * Smart Code: HERA.OBSERVABILITY.DASHBOARD.PRODUCTION.v1
 */

import { createClient } from '@supabase/supabase-js'

export interface HeraMetrics {
  // Gateway Performance
  gateway: {
    requests_per_second: number
    average_response_time: number
    error_rate: number
    uptime_percentage: number
    active_connections: number
  }
  
  // Security Metrics
  security: {
    authentication_attempts: number
    authentication_failures: number
    guardrail_violations: number
    actor_resolution_cache_hits: number
    suspicious_activities: number
  }
  
  // AI Digital Accountant
  ai: {
    total_queries: number
    average_cost_per_query: number
    total_cost: number
    response_time: number
    model_usage: Record<string, number>
  }
  
  // Database Performance
  database: {
    connection_pool_usage: number
    rpc_execution_time: number
    slow_queries: number
    deadlocks: number
  }
  
  // Business Metrics
  business: {
    active_organizations: number
    daily_transactions: number
    revenue_processed: number
    user_activity: number
  }
}

export interface HeraAlert {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  type: 'performance' | 'security' | 'error' | 'business'
  message: string
  timestamp: string
  metadata: Record<string, any>
  organization_id?: string
  actor_id?: string
}

export interface HeraDashboardConfig {
  supabaseUrl: string
  supabaseServiceKey: string
  refreshInterval: number
  alertThresholds: {
    response_time_ms: number
    error_rate_percent: number
    memory_usage_percent: number
    disk_usage_percent: number
  }
}

/**
 * HERA Observability Dashboard
 * 
 * Provides real-time monitoring of all HERA platform components
 * with intelligent alerting and performance analytics.
 */
export class HeraObservabilityDashboard {
  private supabase: any
  private config: HeraDashboardConfig
  private metricsCache: Map<string, any> = new Map()
  private alertHandlers: Array<(alert: HeraAlert) => void> = []

  constructor(config: HeraDashboardConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
    
    // Start metrics collection
    this.startMetricsCollection()
  }

  /**
   * REAL-TIME METRICS COLLECTION
   */

  /**
   * Collect all platform metrics
   */
  async collectMetrics(): Promise<HeraMetrics> {
    const [gateway, security, ai, database, business] = await Promise.all([
      this.collectGatewayMetrics(),
      this.collectSecurityMetrics(),
      this.collectAIMetrics(),
      this.collectDatabaseMetrics(),
      this.collectBusinessMetrics()
    ])

    const metrics: HeraMetrics = {
      gateway,
      security,
      ai,
      database,
      business
    }

    // Cache metrics
    this.metricsCache.set('latest', metrics)
    this.metricsCache.set(`snapshot_${Date.now()}`, metrics)

    // Check for alerts
    await this.checkAlerts(metrics)

    return metrics
  }

  /**
   * Collect Enhanced Gateway performance metrics
   */
  private async collectGatewayMetrics(): Promise<HeraMetrics['gateway']> {
    try {
      // Get recent gateway requests from logs
      const { data: requests } = await this.supabase
        .from('hera_request_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      if (!requests || requests.length === 0) {
        return {
          requests_per_second: 0,
          average_response_time: 0,
          error_rate: 0,
          uptime_percentage: 100,
          active_connections: 0
        }
      }

      const total_requests = requests.length
      const error_requests = requests.filter((r: any) => r.status >= 400).length
      const response_times = requests
        .filter((r: any) => r.duration_ms)
        .map((r: any) => r.duration_ms)

      return {
        requests_per_second: total_requests / 300, // 5 minutes
        average_response_time: response_times.length > 0 
          ? response_times.reduce((a, b) => a + b, 0) / response_times.length 
          : 0,
        error_rate: total_requests > 0 ? (error_requests / total_requests) * 100 : 0,
        uptime_percentage: this.calculateUptime(),
        active_connections: await this.getActiveConnections()
      }
    } catch (error) {
      console.error('Failed to collect gateway metrics:', error)
      return {
        requests_per_second: 0,
        average_response_time: 0,
        error_rate: 100,
        uptime_percentage: 0,
        active_connections: 0
      }
    }
  }

  /**
   * Collect security and authentication metrics
   */
  private async collectSecurityMetrics(): Promise<HeraMetrics['security']> {
    try {
      // Get recent security events
      const { data: events } = await this.supabase
        .from('hera_security_events')
        .select('*')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

      const auth_attempts = events?.filter(e => e.event_type === 'auth_attempt').length || 0
      const auth_failures = events?.filter(e => e.event_type === 'auth_failure').length || 0
      const guardrail_violations = events?.filter(e => e.event_type === 'guardrail_violation').length || 0
      const cache_hits = events?.filter(e => e.event_type === 'cache_hit').length || 0
      const suspicious = events?.filter(e => e.severity === 'critical').length || 0

      return {
        authentication_attempts: auth_attempts,
        authentication_failures: auth_failures,
        guardrail_violations: guardrail_violations,
        actor_resolution_cache_hits: cache_hits,
        suspicious_activities: suspicious
      }
    } catch (error) {
      console.error('Failed to collect security metrics:', error)
      return {
        authentication_attempts: 0,
        authentication_failures: 0,
        guardrail_violations: 0,
        actor_resolution_cache_hits: 0,
        suspicious_activities: 0
      }
    }
  }

  /**
   * Collect AI Digital Accountant metrics
   */
  private async collectAIMetrics(): Promise<HeraMetrics['ai']> {
    try {
      // Get AI usage from transactions
      const { data: aiUsage } = await this.supabase
        .from('universal_transactions')
        .select('total_amount, universal_transaction_lines(*)')
        .eq('transaction_type', 'ai_usage')
        .gte('transaction_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      let total_queries = 0
      let total_cost = 0
      let total_response_time = 0
      let model_usage: Record<string, number> = {}

      aiUsage?.forEach((transaction: any) => {
        total_cost += transaction.total_amount || 0
        
        transaction.universal_transaction_lines?.forEach((line: any) => {
          if (line.line_data) {
            total_queries++
            total_response_time += line.line_data.duration_ms || 0
            
            const model = line.line_data.model || 'unknown'
            model_usage[model] = (model_usage[model] || 0) + 1
          }
        })
      })

      return {
        total_queries,
        average_cost_per_query: total_queries > 0 ? total_cost / total_queries : 0,
        total_cost,
        response_time: total_queries > 0 ? total_response_time / total_queries : 0,
        model_usage
      }
    } catch (error) {
      console.error('Failed to collect AI metrics:', error)
      return {
        total_queries: 0,
        average_cost_per_query: 0,
        total_cost: 0,
        response_time: 0,
        model_usage: {}
      }
    }
  }

  /**
   * Collect database performance metrics
   */
  private async collectDatabaseMetrics(): Promise<HeraMetrics['database']> {
    try {
      // Get database statistics
      const { data: stats } = await this.supabase.rpc('get_database_stats')
      
      return {
        connection_pool_usage: stats?.connection_pool_usage || 0,
        rpc_execution_time: stats?.avg_rpc_time || 0,
        slow_queries: stats?.slow_query_count || 0,
        deadlocks: stats?.deadlock_count || 0
      }
    } catch (error) {
      return {
        connection_pool_usage: 0,
        rpc_execution_time: 0,
        slow_queries: 0,
        deadlocks: 0
      }
    }
  }

  /**
   * Collect business metrics
   */
  private async collectBusinessMetrics(): Promise<HeraMetrics['business']> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get active organizations
      const { count: activeOrgs } = await this.supabase
        .from('core_organizations')
        .select('id', { count: 'exact' })
        .is('deleted_at', null)

      // Get today's transactions
      const { data: transactions } = await this.supabase
        .from('universal_transactions')
        .select('total_amount')
        .eq('transaction_date', today)
        .neq('transaction_type', 'ai_usage')

      // Get active users today
      const { count: activeUsers } = await this.supabase
        .from('hera_request_logs')
        .select('actor_user_id', { count: 'exact' })
        .gte('created_at', today)

      const total_transactions = transactions?.length || 0
      const revenue_processed = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0

      return {
        active_organizations: activeOrgs || 0,
        daily_transactions: total_transactions,
        revenue_processed,
        user_activity: activeUsers || 0
      }
    } catch (error) {
      return {
        active_organizations: 0,
        daily_transactions: 0,
        revenue_processed: 0,
        user_activity: 0
      }
    }
  }

  /**
   * ALERTING SYSTEM
   */

  /**
   * Check metrics against thresholds and generate alerts
   */
  private async checkAlerts(metrics: HeraMetrics): Promise<void> {
    const alerts: HeraAlert[] = []

    // Gateway performance alerts
    if (metrics.gateway.average_response_time > this.config.alertThresholds.response_time_ms) {
      alerts.push({
        id: `gateway_response_time_${Date.now()}`,
        severity: 'high',
        type: 'performance',
        message: `Gateway response time is ${metrics.gateway.average_response_time}ms, above threshold of ${this.config.alertThresholds.response_time_ms}ms`,
        timestamp: new Date().toISOString(),
        metadata: { response_time: metrics.gateway.average_response_time }
      })
    }

    if (metrics.gateway.error_rate > this.config.alertThresholds.error_rate_percent) {
      alerts.push({
        id: `gateway_error_rate_${Date.now()}`,
        severity: 'critical',
        type: 'error',
        message: `Gateway error rate is ${metrics.gateway.error_rate}%, above threshold of ${this.config.alertThresholds.error_rate_percent}%`,
        timestamp: new Date().toISOString(),
        metadata: { error_rate: metrics.gateway.error_rate }
      })
    }

    // Security alerts
    if (metrics.security.guardrail_violations > 10) {
      alerts.push({
        id: `security_violations_${Date.now()}`,
        severity: 'high',
        type: 'security',
        message: `High number of guardrail violations: ${metrics.security.guardrail_violations} in the last hour`,
        timestamp: new Date().toISOString(),
        metadata: { violations: metrics.security.guardrail_violations }
      })
    }

    if (metrics.security.suspicious_activities > 0) {
      alerts.push({
        id: `security_suspicious_${Date.now()}`,
        severity: 'critical',
        type: 'security',
        message: `Suspicious security activities detected: ${metrics.security.suspicious_activities}`,
        timestamp: new Date().toISOString(),
        metadata: { suspicious_count: metrics.security.suspicious_activities }
      })
    }

    // AI cost alerts
    if (metrics.ai.total_cost > 100) { // $100 per day threshold
      alerts.push({
        id: `ai_cost_high_${Date.now()}`,
        severity: 'medium',
        type: 'business',
        message: `AI costs are high today: $${metrics.ai.total_cost.toFixed(2)}`,
        timestamp: new Date().toISOString(),
        metadata: { daily_cost: metrics.ai.total_cost }
      })
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert)
    }
  }

  /**
   * Process and route alerts
   */
  private async processAlert(alert: HeraAlert): Promise<void> {
    // Store alert
    await this.supabase.from('hera_alerts').insert([alert])

    // Notify alert handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert)
      } catch (error) {
        console.error('Alert handler error:', error)
      }
    })
  }

  /**
   * DASHBOARD API
   */

  /**
   * Register alert handler
   */
  onAlert(handler: (alert: HeraAlert) => void): void {
    this.alertHandlers.push(handler)
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): HeraMetrics | null {
    return this.metricsCache.get('latest') || null
  }

  /**
   * Get metrics history
   */
  async getMetricsHistory(hours: number = 24): Promise<HeraMetrics[]> {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    const history: HeraMetrics[] = []
    
    for (const [key, metrics] of this.metricsCache.entries()) {
      if (key.startsWith('snapshot_')) {
        const timestamp = parseInt(key.replace('snapshot_', ''))
        if (timestamp > cutoff) {
          history.push(metrics)
        }
      }
    }
    
    return history.sort((a, b) => 
      new Date(a.gateway.requests_per_second).getTime() - 
      new Date(b.gateway.requests_per_second).getTime()
    )
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(severity?: HeraAlert['severity']): Promise<HeraAlert[]> {
    let query = this.supabase
      .from('hera_alerts')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })

    if (severity) {
      query = query.eq('severity', severity)
    }

    const { data: alerts } = await query
    return alerts || []
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Calculate system uptime
   */
  private calculateUptime(): number {
    // Simplified uptime calculation
    // In production, this would check actual service availability
    return 99.9
  }

  /**
   * Get active database connections
   */
  private async getActiveConnections(): Promise<number> {
    try {
      const { data } = await this.supabase.rpc('get_active_connections')
      return data?.count || 0
    } catch {
      return 0
    }
  }

  /**
   * Start automatic metrics collection
   */
  private startMetricsCollection(): void {
    // Collect metrics immediately
    this.collectMetrics()

    // Set up recurring collection
    setInterval(() => {
      this.collectMetrics().catch(error => {
        console.error('Metrics collection error:', error)
      })
    }, this.config.refreshInterval)
  }

  /**
   * Generate health summary
   */
  async getHealthSummary(): Promise<{
    overall_status: 'healthy' | 'degraded' | 'critical'
    component_status: Record<string, 'healthy' | 'degraded' | 'critical'>
    active_alerts: number
    performance_score: number
  }> {
    const metrics = await this.collectMetrics()
    const activeAlerts = await this.getActiveAlerts()
    
    const component_status = {
      gateway: metrics.gateway.error_rate < 5 ? 'healthy' : 
               metrics.gateway.error_rate < 15 ? 'degraded' : 'critical',
      security: metrics.security.suspicious_activities === 0 ? 'healthy' : 'critical',
      ai: metrics.ai.response_time < 3000 ? 'healthy' : 
          metrics.ai.response_time < 5000 ? 'degraded' : 'critical',
      database: metrics.database.slow_queries < 10 ? 'healthy' : 
                metrics.database.slow_queries < 50 ? 'degraded' : 'critical'
    }

    const criticalCount = Object.values(component_status).filter(s => s === 'critical').length
    const degradedCount = Object.values(component_status).filter(s => s === 'degraded').length
    
    const overall_status = criticalCount > 0 ? 'critical' :
                          degradedCount > 0 ? 'degraded' : 'healthy'

    const performance_score = Math.max(0, 100 - 
      (metrics.gateway.error_rate * 2) - 
      (metrics.gateway.average_response_time / 10) - 
      (activeAlerts.filter(a => a.severity === 'critical').length * 20)
    )

    return {
      overall_status,
      component_status,
      active_alerts: activeAlerts.length,
      performance_score: Math.round(performance_score)
    }
  }
}