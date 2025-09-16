/**
 * Production Monitoring & Observability Service
 * Comprehensive metrics, logging, and alerting
 */

export interface MetricData {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp?: number
}

export interface LogData {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical'
  message: string
  context?: Record<string, any>
  timestamp?: number
  correlationId?: string
}

export interface AlertData {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  context?: Record<string, any>
  timestamp?: number
}

export class MonitoringService {
  private metrics = new Map<string, number>()
  private correlationId: string

  constructor() {
    this.correlationId = this.generateCorrelationId()
  }

  // ========================================================================
  // METRICS COLLECTION
  // ========================================================================

  /**
   * Record a counter metric
   */
  async incrementCounter(
    metricName: string,
    tags: Record<string, string> = {},
    value: number = 1
  ): Promise<void> {
    try {
      const key = this.buildMetricKey(metricName, tags)
      const current = this.metrics.get(key) || 0
      this.metrics.set(key, current + value)

      // Send to external monitoring system
      await this.sendMetric({
        name: metricName,
        value: current + value,
        tags,
        timestamp: Date.now()
      })

      // Log significant metrics
      if (value > 10 || metricName.includes('error')) {
        await this.log({
          level: value > 10 ? 'warn' : 'info',
          message: `Metric ${metricName} incremented to ${current + value}`,
          context: { tags, value }
        })
      }
    } catch (error) {
      console.error('Failed to increment counter:', error)
    }
  }

  /**
   * Record a gauge metric (current value)
   */
  async recordGauge(
    metricName: string,
    value: number,
    tags: Record<string, string> = {}
  ): Promise<void> {
    try {
      await this.sendMetric({
        name: metricName,
        value,
        tags,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Failed to record gauge:', error)
    }
  }

  /**
   * Record a histogram/timing metric
   */
  async recordTiming(
    metricName: string,
    durationMs: number,
    tags: Record<string, string> = {}
  ): Promise<void> {
    try {
      await this.sendMetric({
        name: `${metricName}_duration_ms`,
        value: durationMs,
        tags: { ...tags, metric_type: 'histogram' },
        timestamp: Date.now()
      })

      // Alert on slow operations
      if (durationMs > 5000) {
        await this.sendAlert('SLOW_OPERATION', {
          severity: 'medium',
          message: `Operation ${metricName} took ${durationMs}ms`,
          context: { durationMs, tags }
        })
      }
    } catch (error) {
      console.error('Failed to record timing:', error)
    }
  }

  // ========================================================================
  // BUSINESS METRICS (AI-specific)
  // ========================================================================

  /**
   * Record AI classification performance
   */
  async recordAIClassification(data: {
    organizationId: string
    smartCode: string
    confidence: number
    success: boolean
    durationMs?: number
  }): Promise<void> {
    const tags = {
      organization_id: data.organizationId,
      smart_code: data.smartCode,
      success: data.success.toString()
    }

    await Promise.all(
      [
        this.incrementCounter('ai_classifications_total', tags),
        this.recordGauge('ai_confidence_score', data.confidence, tags),
        data.durationMs ? this.recordTiming('ai_classification', data.durationMs, tags) : null
      ].filter(Boolean)
    )

    // Alert on low confidence or failures
    if (!data.success || data.confidence < 0.6) {
      await this.sendAlert('AI_CLASSIFICATION_ISSUE', {
        severity: data.success ? 'medium' : 'high',
        message: `AI classification ${data.success ? 'low confidence' : 'failed'}`,
        context: data
      })
    }
  }

  /**
   * Record transaction processing metrics
   */
  async recordSuccess(
    operation: string,
    data: {
      organizationId: string
      duration: number
      transactionId?: string
    }
  ): Promise<void> {
    const tags = {
      operation,
      organization_id: data.organizationId
    }

    await Promise.all([
      this.incrementCounter('operations_success_total', tags),
      this.recordTiming(operation, data.duration, tags)
    ])
  }

  /**
   * Record operation errors
   */
  async recordError(
    operation: string,
    data: {
      errorType: string
      organizationId: string
      duration: number
    }
  ): Promise<void> {
    const tags = {
      operation,
      error_type: data.errorType,
      organization_id: data.organizationId
    }

    await Promise.all([
      this.incrementCounter('operations_error_total', tags),
      this.recordTiming(`${operation}_error`, data.duration, tags)
    ])

    await this.log({
      level: 'error',
      message: `Operation ${operation} failed with ${data.errorType}`,
      context: data
    })
  }

  /**
   * Record AI service degradation
   */
  async recordAIServiceDegradation(reason: string): Promise<void> {
    await this.incrementCounter('ai_service_degradation', { reason })

    await this.sendAlert('AI_SERVICE_DEGRADED', {
      severity: 'high',
      message: `AI service degraded: ${reason}`,
      context: { reason, timestamp: Date.now() }
    })
  }

  // ========================================================================
  // LOGGING
  // ========================================================================

  /**
   * Structured logging
   */
  async log(data: LogData): Promise<void> {
    const logEntry = {
      ...data,
      timestamp: data.timestamp || Date.now(),
      correlationId: this.correlationId,
      service: 'hera-ai-finance'
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const level = data.level.toUpperCase()
      console.log(`[${level}] ${logEntry.message}`, logEntry.context || '')
    }

    // Send to external logging system (e.g., ELK, CloudWatch, etc.)
    try {
      await this.sendLog(logEntry)
    } catch (error) {
      console.error('Failed to send log:', error)
    }
  }

  // ========================================================================
  // ALERTING
  // ========================================================================

  /**
   * Send alert
   */
  async sendAlert(alertType: string, alert: Omit<AlertData, 'type' | 'timestamp'>): Promise<void> {
    const alertData: AlertData = {
      ...alert,
      type: alertType,
      timestamp: Date.now()
    }

    try {
      // Send to alerting system (PagerDuty, Slack, etc.)
      await this.sendAlertExternal(alertData)

      // Also log critical alerts
      await this.log({
        level: alertData.severity === 'critical' ? 'critical' : 'warn',
        message: `Alert: ${alertData.message}`,
        context: { alertType, severity: alertData.severity, ...alertData.context }
      })
    } catch (error) {
      console.error('Failed to send alert:', error)
    }
  }

  // ========================================================================
  // HEALTH CHECKS
  // ========================================================================

  /**
   * Perform health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, { status: string; latency?: number; error?: string }>
    timestamp: number
  }> {
    const checks: Record<string, { status: string; latency?: number; error?: string }> = {}
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    // Database health check
    try {
      const dbStart = Date.now()
      // TODO: Implement actual database ping
      // await this.databasePing()
      checks.database = { status: 'healthy', latency: Date.now() - dbStart }
    } catch (error) {
      checks.database = { status: 'unhealthy', error: (error as Error).message }
      overallStatus = 'unhealthy'
    }

    // Cache health check
    try {
      const cacheStart = Date.now()
      // TODO: Implement actual cache ping
      // await this.cachePing()
      checks.cache = { status: 'healthy', latency: Date.now() - cacheStart }
    } catch (error) {
      checks.cache = { status: 'degraded', error: (error as Error).message }
      if (overallStatus === 'healthy') overallStatus = 'degraded'
    }

    // AI service health check
    try {
      const aiStart = Date.now()
      // TODO: Implement actual AI service ping
      // await this.aiServicePing()
      checks.ai_service = { status: 'healthy', latency: Date.now() - aiStart }
    } catch (error) {
      checks.ai_service = { status: 'unhealthy', error: (error as Error).message }
      overallStatus = 'unhealthy'
    }

    return {
      status: overallStatus,
      checks,
      timestamp: Date.now()
    }
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private buildMetricKey(name: string, tags: Record<string, string>): string {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',')

    return `${name}{${tagString}}`
  }

  private generateCorrelationId(): string {
    return `hera_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async sendMetric(metric: MetricData): Promise<void> {
    // TODO: Implement actual metric sending to your monitoring system
    // Examples: DataDog, CloudWatch, Prometheus, etc.

    if (process.env.NODE_ENV === 'development') {
      console.debug(`Metric: ${metric.name} = ${metric.value}`, metric.tags)
    }

    // Example implementations:
    // await this.dataDogClient.increment(metric.name, metric.value, metric.tags)
    // await this.cloudWatchClient.putMetricData({...})
    // await this.prometheusGateway.pushAdd({...})
  }

  private async sendLog(log: any): Promise<void> {
    // TODO: Implement actual log sending to your logging system
    // Examples: ELK Stack, CloudWatch Logs, Splunk, etc.
    // Example implementations:
    // await this.elasticClient.index({ index: 'hera-logs', body: log })
    // await this.cloudWatchLogs.putLogEvents({...})
  }

  private async sendAlertExternal(alert: AlertData): Promise<void> {
    // TODO: Implement actual alert sending to your alerting system
    // Examples: PagerDuty, Slack, OpsGenie, etc.

    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`)
    }

    // Example implementations:
    // await this.pagerDutyClient.trigger({...})
    // await this.slackClient.postMessage({...})
  }
}

// ========================================================================
// MIDDLEWARE FOR EXPRESS/FASTIFY
// ========================================================================

/**
 * Express middleware for request monitoring
 */
export function createMonitoringMiddleware(monitoring: MonitoringService) {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now()

    res.on('finish', async () => {
      const duration = Date.now() - startTime
      const tags = {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode.toString()
      }

      await monitoring.recordTiming('http_request', duration, tags)

      if (res.statusCode >= 400) {
        await monitoring.incrementCounter('http_errors_total', tags)
      } else {
        await monitoring.incrementCounter('http_requests_total', tags)
      }
    })

    next()
  }
}

export default MonitoringService
