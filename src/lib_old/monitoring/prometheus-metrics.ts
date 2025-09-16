// ================================================================================
// HERA ERP PROMETHEUS METRICS COLLECTOR
// Comprehensive monitoring for customer behavior, business conversions, and system health
// ================================================================================

import { NextRequest } from 'next/server'

// Metrics Storage (in production, this would be Redis or external store)
interface MetricData {
  name: string
  value: number
  labels: Record<string, string>
  timestamp: number
  type: 'counter' | 'gauge' | 'histogram'
}

class PrometheusMetrics {
  private metrics: Map<string, MetricData[]> = new Map()
  private enabled: boolean

  constructor() {
    this.enabled = process.env.NODE_ENV === 'production'
  }

  /**
   * Record a counter metric (incrementing values)
   */
  counter(name: string, labels: Record<string, string> = {}, value: number = 1) {
    if (!this.enabled) return

    this.addMetric({
      name,
      value,
      labels,
      timestamp: Date.now(),
      type: 'counter'
    })
  }

  /**
   * Record a gauge metric (current state values)
   */
  gauge(name: string, labels: Record<string, string> = {}, value: number) {
    if (!this.enabled) return

    this.addMetric({
      name,
      value,
      labels,
      timestamp: Date.now(),
      type: 'gauge'
    })
  }

  /**
   * Record a histogram metric (timing/duration data)
   */
  histogram(name: string, labels: Record<string, string> = {}, value: number) {
    if (!this.enabled) return

    this.addMetric({
      name,
      value,
      labels,
      timestamp: Date.now(),
      type: 'histogram'
    })
  }

  /**
   * Add metric to storage
   */
  private addMetric(metric: MetricData) {
    const key = `${metric.name}_${metric.type}`
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }

    const metricList = this.metrics.get(key)!
    metricList.push(metric)

    // Keep only last 1000 entries per metric to prevent memory bloat
    if (metricList.length > 1000) {
      metricList.splice(0, metricList.length - 1000)
    }
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusFormat(): string {
    let output = ''

    for (const [key, metricList] of this.metrics.entries()) {
      if (metricList.length === 0) continue

      const latestMetric = metricList[metricList.length - 1]
      const metricName = latestMetric.name

      // Add help and type comments
      output += `# HELP ${metricName} HERA ERP ${metricName} metric\n`
      output += `# TYPE ${metricName} ${latestMetric.type}\n`

      // Aggregate metrics by labels for counters
      if (latestMetric.type === 'counter') {
        const aggregated = this.aggregateCounters(metricList)
        for (const [labelKey, value] of aggregated.entries()) {
          output += `${metricName}${labelKey} ${value}\n`
        }
      } else {
        // For gauges and histograms, use latest value
        const labelStr = this.formatLabels(latestMetric.labels)
        output += `${metricName}${labelStr} ${latestMetric.value}\n`
      }

      output += '\n'
    }

    return output
  }

  /**
   * Aggregate counter values by labels
   */
  private aggregateCounters(metricList: MetricData[]): Map<string, number> {
    const aggregated = new Map<string, number>()

    for (const metric of metricList) {
      const labelKey = this.formatLabels(metric.labels)
      const current = aggregated.get(labelKey) || 0
      aggregated.set(labelKey, current + metric.value)
    }

    return aggregated
  }

  /**
   * Format labels for Prometheus output
   */
  private formatLabels(labels: Record<string, string>): string {
    if (Object.keys(labels).length === 0) return ''

    const labelPairs = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',')

    return `{${labelPairs}}`
  }

  /**
   * Get metrics summary for dashboards
   */
  getSummary() {
    const summary: Record<string, any> = {}

    for (const [key, metricList] of this.metrics.entries()) {
      if (metricList.length === 0) continue

      const latestMetric = metricList[metricList.length - 1]
      summary[latestMetric.name] = {
        type: latestMetric.type,
        current_value: latestMetric.value,
        data_points: metricList.length,
        last_updated: new Date(latestMetric.timestamp).toISOString()
      }
    }

    return summary
  }

  /**
   * Clear old metrics (cleanup)
   */
  cleanup(olderThanHours: number = 24) {
    const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000

    for (const [key, metricList] of this.metrics.entries()) {
      const filtered = metricList.filter(metric => metric.timestamp > cutoff)
      this.metrics.set(key, filtered)
    }
  }
}

// ================================================================================
// HERA ERP SPECIFIC METRICS
// ================================================================================

class HERAMetrics extends PrometheusMetrics {
  /**
   * Track page views with detailed breakdown
   */
  trackPageView(req: NextRequest, page: string) {
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const referer = req.headers.get('referer') || 'direct'
    const country = req.geo?.country || 'unknown'
    const city = req.geo?.city || 'unknown'

    this.counter('hera_page_views_total', {
      page,
      country,
      city,
      referer_domain: this.extractDomain(referer),
      device_type: this.getDeviceType(userAgent)
    })
  }

  /**
   * Track business conversion funnel
   */
  trackBusinessConversion(step: string, businessType: string, success: boolean) {
    this.counter('hera_business_conversions_total', {
      step, // 'started', 'form_completed', 'payment_initiated', 'production_deployed'
      business_type: businessType,
      success: success.toString()
    })
  }

  /**
   * Track progressive to production conversions
   */
  trackProgressiveConversion(businessType: string, duration_seconds: number, success: boolean) {
    this.counter('hera_progressive_conversions_total', {
      business_type: businessType,
      success: success.toString()
    })

    this.histogram(
      'hera_conversion_duration_seconds',
      {
        business_type: businessType
      },
      duration_seconds
    )
  }

  /**
   * Track API usage and performance
   */
  trackAPICall(endpoint: string, method: string, status_code: number, duration_ms: number) {
    this.counter('hera_api_requests_total', {
      endpoint,
      method,
      status_code: status_code.toString()
    })

    this.histogram(
      'hera_api_duration_milliseconds',
      {
        endpoint,
        method
      },
      duration_ms
    )
  }

  /**
   * Track subdomain creation and usage
   */
  trackSubdomainActivity(subdomain: string, activity: string, business_type: string) {
    this.counter('hera_subdomain_activity_total', {
      activity, // 'created', 'first_login', 'transaction', 'active_session'
      business_type,
      subdomain_hash: this.hashSubdomain(subdomain)
    })
  }

  /**
   * Track customer behavior on progressive systems
   */
  trackProgressiveBehavior(action: string, business_type: string, session_duration: number) {
    this.counter('hera_progressive_actions_total', {
      action, // 'trial_started', 'feature_used', 'data_entered', 'conversion_attempted'
      business_type
    })

    this.gauge(
      'hera_progressive_session_duration_seconds',
      {
        business_type
      },
      session_duration
    )
  }

  /**
   * Track system health metrics
   */
  trackSystemHealth(
    component: string,
    status: 'healthy' | 'degraded' | 'down',
    response_time_ms?: number
  ) {
    this.gauge(
      'hera_system_health',
      {
        component,
        status
      },
      status === 'healthy' ? 1 : 0
    )

    if (response_time_ms !== undefined) {
      this.histogram(
        'hera_system_response_time_milliseconds',
        {
          component
        },
        response_time_ms
      )
    }
  }

  /**
   * Track business value metrics
   */
  trackBusinessValue(metric: string, value: number, business_type: string, currency?: string) {
    this.gauge(
      'hera_business_value',
      {
        metric, // 'revenue', 'transactions', 'active_users', 'retention_rate'
        business_type,
        currency: currency || 'USD'
      },
      value
    )
  }

  /**
   * Helper: Extract domain from referer
   */
  private extractDomain(url: string): string {
    if (url === 'direct') return 'direct'
    try {
      return new URL(url).hostname
    } catch {
      return 'unknown'
    }
  }

  /**
   * Helper: Detect device type from user agent
   */
  private getDeviceType(userAgent: string): string {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile'
    if (/Tablet|iPad/.test(userAgent)) return 'tablet'
    return 'desktop'
  }

  /**
   * Helper: Hash subdomain for privacy while maintaining uniqueness
   */
  private hashSubdomain(subdomain: string): string {
    // Simple hash for anonymization while maintaining cardinality
    let hash = 0
    for (let i = 0; i < subdomain.length; i++) {
      const char = subdomain.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

// Global instance
export const heraMetrics = new HERAMetrics()

// Export types for use in other files
export type { MetricData }
export { PrometheusMetrics }
