/**
 * HERA Security Monitoring & Observability
 * 
 * Provides comprehensive monitoring, alerting, and observability
 * for the security framework.
 */

import { createClient } from '@supabase/supabase-js'

interface SecurityMetric {
  name: string
  value: number
  labels: Record<string, string>
  timestamp: Date
}

interface SecurityAlert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  organization_id?: string
  user_id?: string
  triggered_at: Date
  resolved_at?: Date
  metadata: Record<string, any>
}

interface MonitoringConfig {
  alertThresholds: {
    authFailuresPerMinute: number
    rlsBypassAttempts: number
    rateExceededPerHour: number
    crossOrgAttempts: number
    serviceRoleOrgDiversity: number
  }
  metricsRetention: {
    hourly: number // days
    daily: number // days  
    monthly: number // days
  }
}

class SecurityMonitoringService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  private config: MonitoringConfig = {
    alertThresholds: {
      authFailuresPerMinute: 10,
      rlsBypassAttempts: 1,
      rateExceededPerHour: 100,
      crossOrgAttempts: 1,
      serviceRoleOrgDiversity: 50
    },
    metricsRetention: {
      hourly: 7,
      daily: 90,
      monthly: 365
    }
  }

  /**
   * Record security metric
   */
  async recordMetric(metric: SecurityMetric): Promise<void> {
    try {
      await this.supabase.from('security_metrics').insert({
        name: metric.name,
        value: metric.value,
        labels: metric.labels,
        timestamp: metric.timestamp.toISOString()
      })
    } catch (error) {
      console.error('Failed to record security metric:', error)
    }
  }

  /**
   * Create security alert
   */
  async createAlert(alert: Omit<SecurityAlert, 'id' | 'triggered_at'>): Promise<string> {
    try {
      const { data } = await this.supabase
        .from('security_alerts')
        .insert({
          ...alert,
          triggered_at: new Date().toISOString()
        })
        .select('id')
        .single()

      // Send alert notification
      await this.sendAlertNotification(alert)

      return data.id
    } catch (error) {
      console.error('Failed to create security alert:', error)
      throw error
    }
  }

  /**
   * Get security dashboard data
   */
  async getDashboardData(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    const since = this.getTimeRangeDate(timeRange)

    // Auth failures per issuer
    const authFailures = await this.getAuthFailuresByIssuer(since)
    
    // Org switches per minute
    const orgSwitches = await this.getOrgSwitchesRate(since)
    
    // RLS policy denials
    const rlsDenials = await this.getRLSPolicyDenials(since)
    
    // Service role diversity
    const serviceRoleDiversity = await this.getServiceRoleDiversity(since)
    
    // Rate limit violations
    const rateLimitViolations = await this.getRateLimitViolations(since)
    
    // Active alerts
    const activeAlerts = await this.getActiveAlerts()
    
    // Top security events
    const topEvents = await this.getTopSecurityEvents(since)

    return {
      timeRange,
      authFailures,
      orgSwitches,
      rlsDenials,
      serviceRoleDiversity,
      rateLimitViolations,
      activeAlerts,
      topEvents,
      generatedAt: new Date().toISOString()
    }
  }

  /**
   * Get auth failures by issuer
   */
  private async getAuthFailuresByIssuer(since: Date) {
    const { data } = await this.supabase
      .from('hera_audit_log')
      .select('issuer, auth_mode, created_at')
      .eq('event_type', 'auth_failure')
      .gte('created_at', since.toISOString())

    const failures = data || []
    const byIssuer = failures.reduce((acc, failure) => {
      const key = failure.issuer || failure.auth_mode || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: failures.length,
      byIssuer,
      rate: failures.length / this.getHoursSince(since)
    }
  }

  /**
   * Get organization switches rate
   */
  private async getOrgSwitchesRate(since: Date) {
    const { data } = await this.supabase
      .from('hera_audit_log')
      .select('organization_id, user_id, timestamp')
      .eq('event_type', 'context_set')
      .gte('timestamp', since.toISOString())
      .order('timestamp')

    const switches = data || []
    const minuteBuckets = new Map<string, Set<string>>()

    switches.forEach(s => {
      const minute = new Date(s.timestamp).toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
      if (!minuteBuckets.has(minute)) {
        minuteBuckets.set(minute, new Set())
      }
      minuteBuckets.get(minute)!.add(`${s.user_id}:${s.organization_id}`)
    })

    const switchesPerMinute = Array.from(minuteBuckets.values()).map(set => set.size)
    
    return {
      total: switches.length,
      avgPerMinute: switchesPerMinute.reduce((a, b) => a + b, 0) / switchesPerMinute.length || 0,
      maxPerMinute: Math.max(...switchesPerMinute, 0),
      minuteBuckets: Array.from(minuteBuckets.entries()).map(([minute, orgSwitches]) => ({
        minute,
        count: orgSwitches.size
      }))
    }
  }

  /**
   * Get RLS policy denials
   */
  private async getRLSPolicyDenials(since: Date) {
    const { data } = await this.supabase
      .from('hera_audit_log')
      .select('organization_id, user_id, details, timestamp')
      .eq('event_type', 'rls_bypass_attempt')
      .gte('timestamp', since.toISOString())

    const denials = data || []
    
    return {
      total: denials.length,
      byOrganization: denials.reduce((acc, denial) => {
        acc[denial.organization_id] = (acc[denial.organization_id] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recentDenials: denials.slice(-10).map(d => ({
        timestamp: d.timestamp,
        organization_id: d.organization_id,
        user_id: d.user_id,
        details: d.details
      }))
    }
  }

  /**
   * Get service role organization diversity
   */
  private async getServiceRoleDiversity(since: Date) {
    const { data } = await this.supabase
      .from('hera_audit_log')
      .select('organization_id, timestamp')
      .eq('role', 'service')
      .gte('timestamp', since.toISOString())

    const events = data || []
    const uniqueOrgs = new Set(events.map(e => e.organization_id))
    
    // Group by hour to see diversity over time
    const hourlyDiversity = events.reduce((acc, event) => {
      const hour = new Date(event.timestamp).toISOString().slice(0, 13) // YYYY-MM-DDTHH
      if (!acc[hour]) acc[hour] = new Set()
      acc[hour].add(event.organization_id)
      return acc
    }, {} as Record<string, Set<string>>)

    return {
      totalOrgsAccessed: uniqueOrgs.size,
      totalEvents: events.length,
      avgOrgsPerHour: Object.values(hourlyDiversity).reduce((sum, set) => sum + set.size, 0) / Object.keys(hourlyDiversity).length || 0,
      hourlyBreakdown: Object.entries(hourlyDiversity).map(([hour, orgs]) => ({
        hour,
        uniqueOrgs: orgs.size,
        totalEvents: events.filter(e => e.timestamp.startsWith(hour)).length
      }))
    }
  }

  /**
   * Get rate limit violations
   */
  private async getRateLimitViolations(since: Date) {
    const { data } = await this.supabase
      .from('rate_limits')
      .select('organization_id, user_id, action, count, window_start')
      .gte('window_start', since.toISOString())

    const limits = data || []
    const violations = limits.filter(l => l.count > 100) // Adjust threshold as needed

    return {
      totalViolations: violations.length,
      byOrganization: violations.reduce((acc, v) => {
        acc[v.organization_id] = (acc[v.organization_id] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byAction: violations.reduce((acc, v) => {
        acc[v.action] = (acc[v.action] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      topViolators: violations
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(v => ({
          organization_id: v.organization_id,
          user_id: v.user_id,
          action: v.action,
          count: v.count,
          window_start: v.window_start
        }))
    }
  }

  /**
   * Get active alerts
   */
  private async getActiveAlerts() {
    const { data } = await this.supabase
      .from('security_alerts')
      .select('*')
      .is('resolved_at', null)
      .order('triggered_at', { ascending: false })

    return data || []
  }

  /**
   * Get top security events
   */
  private async getTopSecurityEvents(since: Date) {
    const { data } = await this.supabase
      .from('hera_audit_log')
      .select('event_type, organization_id, auth_mode, timestamp')
      .gte('timestamp', since.toISOString())

    const events = data || []
    const eventCounts = events.reduce((acc, event) => {
      const key = `${event.event_type}:${event.auth_mode}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, count]) => {
        const [event_type, auth_mode] = key.split(':')
        return { event_type, auth_mode, count }
      })
  }

  /**
   * Run security checks and create alerts
   */
  async runSecurityChecks(): Promise<void> {
    const now = new Date()
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
    const lastMinute = new Date(now.getTime() - 60 * 1000)

    try {
      // Check auth failure rate
      const authFailures = await this.getAuthFailuresByIssuer(lastMinute)
      if (authFailures.rate > this.config.alertThresholds.authFailuresPerMinute) {
        await this.createAlert({
          severity: 'high',
          title: 'High Authentication Failure Rate',
          description: `Authentication failures: ${authFailures.rate}/minute exceeds threshold of ${this.config.alertThresholds.authFailuresPerMinute}`,
          metadata: authFailures
        })
      }

      // Check RLS bypass attempts
      const rlsDenials = await this.getRLSPolicyDenials(lastHour)
      if (rlsDenials.total > this.config.alertThresholds.rlsBypassAttempts) {
        await this.createAlert({
          severity: 'critical',
          title: 'RLS Bypass Attempts Detected',
          description: `${rlsDenials.total} RLS bypass attempts detected in the last hour`,
          metadata: rlsDenials
        })
      }

      // Check cross-org attempts (red team alerts)
      const crossOrgAttempts = await this.supabase
        .from('hera_audit_log')
        .select('*')
        .eq('event_type', 'cross_org_attempt')
        .gte('timestamp', lastHour.toISOString())

      if (crossOrgAttempts.data && crossOrgAttempts.data.length > 0) {
        await this.createAlert({
          severity: 'critical',
          title: 'Cross-Organization Access Attempts',
          description: `${crossOrgAttempts.data.length} cross-org access attempts detected`,
          metadata: { attempts: crossOrgAttempts.data }
        })
      }

      // Check service role org diversity
      const serviceDiversity = await this.getServiceRoleDiversity(lastHour)
      if (serviceDiversity.totalOrgsAccessed > this.config.alertThresholds.serviceRoleOrgDiversity) {
        await this.createAlert({
          severity: 'medium',
          title: 'High Service Role Organization Diversity',
          description: `Service role accessed ${serviceDiversity.totalOrgsAccessed} organizations in the last hour`,
          metadata: serviceDiversity
        })
      }

    } catch (error) {
      console.error('Error running security checks:', error)
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: Omit<SecurityAlert, 'id' | 'triggered_at'>): Promise<void> {
    try {
      // Send to various notification channels
      const notifications = []

      // Slack/Discord webhook
      if (process.env.SECURITY_WEBHOOK_URL) {
        notifications.push(this.sendWebhookNotification(alert))
      }

      // Email notification for critical alerts
      if (alert.severity === 'critical' && process.env.SECURITY_EMAIL_RECIPIENTS) {
        notifications.push(this.sendEmailNotification(alert))
      }

      // PagerDuty for critical alerts
      if (alert.severity === 'critical' && process.env.PAGERDUTY_INTEGRATION_KEY) {
        notifications.push(this.sendPagerDutyAlert(alert))
      }

      await Promise.allSettled(notifications)
    } catch (error) {
      console.error('Failed to send alert notification:', error)
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Omit<SecurityAlert, 'id' | 'triggered_at'>): Promise<void> {
    const payload = {
      text: `🚨 HERA Security Alert: ${alert.title}`,
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        fields: [
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'Description', value: alert.description, short: false },
          { title: 'Organization', value: alert.organization_id || 'System-wide', short: true },
          { title: 'Time', value: new Date().toISOString(), short: true }
        ]
      }]
    }

    await fetch(process.env.SECURITY_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Omit<SecurityAlert, 'id' | 'triggered_at'>): Promise<void> {
    // Implement email sending (SendGrid, SES, etc.)
    console.log('Would send email for critical alert:', alert.title)
  }

  /**
   * Send PagerDuty alert
   */
  private async sendPagerDutyAlert(alert: Omit<SecurityAlert, 'id' | 'triggered_at'>): Promise<void> {
    // Implement PagerDuty integration
    console.log('Would send PagerDuty alert for:', alert.title)
  }

  /**
   * Get severity color for notifications
   */
  private getSeverityColor(severity: string): string {
    const colors = {
      low: '#36a64f',     // Green
      medium: '#ff9500',  // Orange  
      high: '#ff0000',    // Red
      critical: '#8b0000' // Dark red
    }
    return colors[severity] || '#808080'
  }

  /**
   * Helper methods
   */
  private getTimeRangeDate(range: string): Date {
    const now = new Date()
    switch (range) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000)
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
  }

  private getHoursSince(date: Date): number {
    return (Date.now() - date.getTime()) / (1000 * 60 * 60)
  }

  /**
   * Cleanup old metrics and alerts
   */
  async cleanupOldData(): Promise<void> {
    const { hourly, daily, monthly } = this.config.metricsRetention

    try {
      // Clean up hourly metrics
      await this.supabase
        .from('security_metrics')
        .delete()
        .lt('timestamp', new Date(Date.now() - hourly * 24 * 60 * 60 * 1000).toISOString())

      // Clean up resolved alerts
      await this.supabase
        .from('security_alerts')
        .delete()
        .not('resolved_at', 'is', null)
        .lt('resolved_at', new Date(Date.now() - daily * 24 * 60 * 60 * 1000).toISOString())

      console.log('Security data cleanup completed')
    } catch (error) {
      console.error('Failed to cleanup security data:', error)
    }
  }
}

// Singleton instance
export const securityMonitoring = new SecurityMonitoringService()

/**
 * API route for security dashboard
 */
export async function getSecurityDashboard(req: any) {
  const timeRange = req.query.timeRange || '24h'
  return securityMonitoring.getDashboardData(timeRange)
}

/**
 * Scheduled job to run security checks
 */
export async function runScheduledSecurityChecks() {
  await securityMonitoring.runSecurityChecks()
}

/**
 * Prometheus metrics endpoint
 */
export function getPrometheusMetrics() {
  // Return Prometheus-formatted metrics
  return `
# HELP hera_auth_failures_total Total authentication failures
# TYPE hera_auth_failures_total counter
hera_auth_failures_total{issuer="supabase"} 0

# HELP hera_rls_denials_total Total RLS policy denials
# TYPE hera_rls_denials_total counter
hera_rls_denials_total 0

# HELP hera_active_alerts Current number of active security alerts
# TYPE hera_active_alerts gauge
hera_active_alerts 0
`
}

export default securityMonitoring