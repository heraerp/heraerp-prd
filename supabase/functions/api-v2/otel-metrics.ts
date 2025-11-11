/**
 * OpenTelemetry Metrics Collection for HERA Finance v2.2
 * Provides comprehensive metrics for API v2 gateway performance
 * Features: Request metrics, actor analytics, performance tracking
 * 
 * Week 3: Enhanced Observability Infrastructure
 */

// Mock OpenTelemetry types for Deno environment
interface MetricOptions {
  name: string
  description: string
  unit?: string
  labels?: Record<string, string>
}

interface Counter {
  add(value: number, labels?: Record<string, string>): void
}

interface Histogram {
  record(value: number, labels?: Record<string, string>): void
}

interface Gauge {
  set(value: number, labels?: Record<string, string>): void
}

class MetricsRegistry {
  private metrics = new Map<string, any>()
  
  createCounter(options: MetricOptions): Counter {
    const counter = new MetricCounter(options.name)
    this.metrics.set(options.name, counter)
    return counter
  }
  
  createHistogram(options: MetricOptions): Histogram {
    const histogram = new MetricHistogram(options.name)
    this.metrics.set(options.name, histogram)
    return histogram
  }
  
  createGauge(options: MetricOptions): Gauge {
    const gauge = new MetricGauge(options.name)
    this.metrics.set(options.name, gauge)
    return gauge
  }
  
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [name, metric] of this.metrics) {
      result[name] = metric.export()
    }
    return result
  }
}

class MetricCounter {
  private value = 0
  private labels = new Map<string, number>()
  
  constructor(private name: string) {}
  
  add(value: number, labels?: Record<string, string>) {
    this.value += value
    
    if (labels) {
      const key = JSON.stringify(labels)
      this.labels.set(key, (this.labels.get(key) || 0) + value)
    }
    
    console.log(`📊 COUNTER ${this.name}: +${value}`, labels || {})
  }
  
  export() {
    return {
      type: 'counter',
      value: this.value,
      labels: Object.fromEntries(this.labels)
    }
  }
}

class MetricHistogram {
  private values: number[] = []
  private buckets = new Map<number, number>()
  private labelBuckets = new Map<string, number[]>()
  
  constructor(private name: string) {
    // Standard histogram buckets (ms)
    const standardBuckets = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
    for (const bucket of standardBuckets) {
      this.buckets.set(bucket, 0)
    }
  }
  
  record(value: number, labels?: Record<string, string>) {
    this.values.push(value)
    
    // Update buckets
    for (const [bucketMax, count] of this.buckets) {
      if (value <= bucketMax) {
        this.buckets.set(bucketMax, count + 1)
      }
    }
    
    if (labels) {
      const key = JSON.stringify(labels)
      const labelValues = this.labelBuckets.get(key) || []
      labelValues.push(value)
      this.labelBuckets.set(key, labelValues)
    }
    
    console.log(`📈 HISTOGRAM ${this.name}: ${value}ms`, labels || {})
  }
  
  export() {
    const sorted = this.values.sort((a, b) => a - b)
    const count = sorted.length
    
    return {
      type: 'histogram',
      count,
      sum: sorted.reduce((a, b) => a + b, 0),
      min: sorted[0] || 0,
      max: sorted[count - 1] || 0,
      avg: count > 0 ? sorted.reduce((a, b) => a + b, 0) / count : 0,
      p50: count > 0 ? sorted[Math.floor(count * 0.5)] : 0,
      p95: count > 0 ? sorted[Math.floor(count * 0.95)] : 0,
      p99: count > 0 ? sorted[Math.floor(count * 0.99)] : 0,
      buckets: Object.fromEntries(this.buckets),
      labels: Object.fromEntries(
        Array.from(this.labelBuckets.entries()).map(([key, values]) => [
          key,
          values.reduce((a, b) => a + b, 0) / values.length
        ])
      )
    }
  }
}

class MetricGauge {
  private value = 0
  private labels = new Map<string, number>()
  
  constructor(private name: string) {}
  
  set(value: number, labels?: Record<string, string>) {
    this.value = value
    
    if (labels) {
      const key = JSON.stringify(labels)
      this.labels.set(key, value)
    }
    
    console.log(`📏 GAUGE ${this.name}: ${value}`, labels || {})
  }
  
  export() {
    return {
      type: 'gauge',
      value: this.value,
      labels: Object.fromEntries(this.labels)
    }
  }
}

// Global metrics registry
const metricsRegistry = new MetricsRegistry()

// Core API metrics
export const apiMetrics = {
  // Request counting and status
  requestCount: metricsRegistry.createCounter({
    name: 'api_requests_total',
    description: 'Total number of API requests',
    unit: 'requests'
  }),
  
  requestDuration: metricsRegistry.createHistogram({
    name: 'api_request_duration_ms',
    description: 'API request duration in milliseconds',
    unit: 'ms'
  }),
  
  errorCount: metricsRegistry.createCounter({
    name: 'api_errors_total',
    description: 'Total number of API errors',
    unit: 'errors'
  }),
  
  // Actor and organization metrics
  actorResolutionDuration: metricsRegistry.createHistogram({
    name: 'actor_resolution_duration_ms',
    description: 'Actor identity resolution duration',
    unit: 'ms'
  }),
  
  uniqueActors: metricsRegistry.createGauge({
    name: 'unique_actors_current',
    description: 'Number of unique actors in current period',
    unit: 'actors'
  }),
  
  orgOperations: metricsRegistry.createCounter({
    name: 'org_operations_total',
    description: 'Operations per organization',
    unit: 'operations'
  }),
  
  // Cache metrics
  cacheHits: metricsRegistry.createCounter({
    name: 'cache_hits_total',
    description: 'Cache hit count',
    unit: 'hits'
  }),
  
  cacheMisses: metricsRegistry.createCounter({
    name: 'cache_misses_total',
    description: 'Cache miss count',
    unit: 'misses'
  }),
  
  cacheLatency: metricsRegistry.createHistogram({
    name: 'cache_operation_duration_ms',
    description: 'Cache operation latency',
    unit: 'ms'
  }),
  
  // Rate limiting metrics
  rateLimitHits: metricsRegistry.createCounter({
    name: 'rate_limit_hits_total',
    description: 'Rate limit violations',
    unit: 'violations'
  }),
  
  // Database metrics
  dbQueryDuration: metricsRegistry.createHistogram({
    name: 'db_query_duration_ms',
    description: 'Database query duration',
    unit: 'ms'
  }),
  
  dbQueryCount: metricsRegistry.createCounter({
    name: 'db_queries_total',
    description: 'Database query count',
    unit: 'queries'
  }),
  
  // Smart Code and GL metrics
  smartCodeValidations: metricsRegistry.createCounter({
    name: 'smart_code_validations_total',
    description: 'Smart Code validation attempts',
    unit: 'validations'
  }),
  
  glBalanceChecks: metricsRegistry.createCounter({
    name: 'gl_balance_checks_total',
    description: 'GL balance validation checks',
    unit: 'checks'
  }),
  
  glUnbalanced: metricsRegistry.createCounter({
    name: 'gl_unbalanced_total',
    description: 'Unbalanced GL entries detected',
    unit: 'violations'
  }),
  
  // Security metrics
  securityViolations: metricsRegistry.createCounter({
    name: 'security_violations_total',
    description: 'Security violations detected',
    unit: 'violations'
  }),
  
  authFailures: metricsRegistry.createCounter({
    name: 'auth_failures_total',
    description: 'Authentication failures',
    unit: 'failures'
  })
}

// Business logic metrics collection
export class HERAMetricsCollector {
  private activeRequests = new Set<string>()
  private uniqueActorsSet = new Set<string>()
  
  // Request lifecycle tracking
  startRequest(requestId: string, method: string, path: string, actorId?: string, orgId?: string) {
    this.activeRequests.add(requestId)
    
    apiMetrics.requestCount.add(1, {
      method,
      path: this.normalizePath(path),
      actor_id: actorId?.slice(0, 8) || 'anonymous',
      organization_id: orgId?.slice(0, 8) || 'unknown'
    })
    
    if (actorId) {
      this.uniqueActorsSet.add(actorId)
      apiMetrics.uniqueActors.set(this.uniqueActorsSet.size)
    }
    
    if (orgId) {
      apiMetrics.orgOperations.add(1, {
        organization_id: orgId.slice(0, 8)
      })
    }
  }
  
  endRequest(requestId: string, duration: number, status: number, error?: Error) {
    this.activeRequests.delete(requestId)
    
    apiMetrics.requestDuration.record(duration, {
      status_code: status.toString(),
      status_class: Math.floor(status / 100) + 'xx'
    })
    
    if (status >= 400) {
      apiMetrics.errorCount.add(1, {
        status_code: status.toString(),
        error_type: error?.name || 'unknown'
      })
    }
  }
  
  // Actor resolution metrics
  recordActorResolution(duration: number, cacheHit: boolean, actorId?: string) {
    apiMetrics.actorResolutionDuration.record(duration, {
      cache_hit: cacheHit.toString(),
      actor_type: actorId ? 'identified' : 'anonymous'
    })
  }
  
  // Cache metrics
  recordCacheEvent(operation: 'hit' | 'miss' | 'set' | 'invalidate', key: string, duration?: number) {
    const keyType = this.getCacheKeyType(key)
    
    if (operation === 'hit') {
      apiMetrics.cacheHits.add(1, { key_type: keyType })
    } else if (operation === 'miss') {
      apiMetrics.cacheMisses.add(1, { key_type: keyType })
    }
    
    if (duration !== undefined) {
      apiMetrics.cacheLatency.record(duration, {
        operation,
        key_type: keyType
      })
    }
  }
  
  // Rate limiting metrics
  recordRateLimit(actorId: string, orgId: string, violated: boolean) {
    if (violated) {
      apiMetrics.rateLimitHits.add(1, {
        actor_id: actorId.slice(0, 8),
        organization_id: orgId.slice(0, 8)
      })
    }
  }
  
  // Database metrics
  recordDbQuery(operation: string, duration: number, success: boolean) {
    apiMetrics.dbQueryDuration.record(duration, {
      operation: operation.toLowerCase(),
      success: success.toString()
    })
    
    apiMetrics.dbQueryCount.add(1, {
      operation: operation.toLowerCase(),
      success: success.toString()
    })
  }
  
  // Smart Code validation metrics
  recordSmartCodeValidation(smartCode: string, isValid: boolean) {
    const segments = smartCode.split('.')
    const module = segments.length > 1 ? segments[1] : 'unknown'
    const type = segments.length > 2 ? segments[2] : 'unknown'
    
    apiMetrics.smartCodeValidations.add(1, {
      module: module.toLowerCase(),
      type: type.toLowerCase(),
      valid: isValid.toString()
    })
  }
  
  // GL balance metrics
  recordGLValidation(currency: string, isBalanced: boolean, entryCount: number) {
    apiMetrics.glBalanceChecks.add(1, {
      currency,
      balanced: isBalanced.toString(),
      entry_count_bucket: this.getEntryCountBucket(entryCount)
    })
    
    if (!isBalanced) {
      apiMetrics.glUnbalanced.add(1, { currency })
    }
  }
  
  // Security metrics
  recordSecurityViolation(violationType: string, severity: string, actorId: string) {
    apiMetrics.securityViolations.add(1, {
      violation_type: violationType,
      severity,
      actor_id: actorId.slice(0, 8)
    })
  }
  
  recordAuthFailure(reason: string) {
    apiMetrics.authFailures.add(1, { reason })
  }
  
  // System health metrics
  getSystemHealth() {
    const metrics = metricsRegistry.getMetrics()
    return {
      timestamp: new Date().toISOString(),
      active_requests: this.activeRequests.size,
      unique_actors: this.uniqueActorsSet.size,
      metrics
    }
  }
  
  // Utility methods
  private normalizePath(path: string): string {
    // Normalize paths for consistent metrics
    return path
      .replace(/\/[a-f0-9-]{36}/g, '/:id')  // Replace UUIDs with :id
      .replace(/\/\d+/g, '/:number')        // Replace numbers with :number
      .replace(/\?.*/g, '')                 // Remove query parameters
  }
  
  private getCacheKeyType(key: string): string {
    if (key.includes('actor_identity')) return 'actor_identity'
    if (key.includes('rate_limit')) return 'rate_limit'
    if (key.includes('idempotency')) return 'idempotency'
    return 'other'
  }
  
  private getEntryCountBucket(count: number): string {
    if (count <= 2) return '1-2'
    if (count <= 5) return '3-5'
    if (count <= 10) return '6-10'
    if (count <= 20) return '11-20'
    return '20+'
  }
}

// Global metrics collector instance
export const heraMetrics = new HERAMetricsCollector()

// Express middleware style function for metrics collection
export function withMetricsCollection<T>(
  handler: (...args: any[]) => Promise<T>
) {
  return async (req: Request, ...args: any[]): Promise<T> => {
    const requestId = crypto.randomUUID()
    const startTime = Date.now()
    const url = new URL(req.url)
    
    // Extract actor/org from headers (if available)
    const actorId = req.headers.get('x-actor-id')
    const orgId = req.headers.get('x-organization-id')
    
    heraMetrics.startRequest(requestId, req.method, url.pathname, actorId || undefined, orgId || undefined)
    
    try {
      const result = await handler(req, ...args)
      
      const duration = Date.now() - startTime
      heraMetrics.endRequest(requestId, duration, 200)
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const statusCode = (error as any)?.status || 500
      heraMetrics.endRequest(requestId, duration, statusCode, error as Error)
      
      throw error
    }
  }
}

// Health check endpoint for metrics
export function getMetricsHealthCheck() {
  const health = heraMetrics.getSystemHealth()
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    metrics: {
      active_requests: health.active_requests,
      unique_actors: health.unique_actors,
      cache_hit_rate: calculateCacheHitRate(health.metrics),
      avg_response_time: calculateAverageResponseTime(health.metrics),
      error_rate: calculateErrorRate(health.metrics),
      security_violations: health.metrics.security_violations_total?.value || 0
    },
    detailed: health.metrics
  }
}

// Utility functions for health calculations
function calculateCacheHitRate(metrics: any): number {
  const hits = metrics.cache_hits_total?.value || 0
  const misses = metrics.cache_misses_total?.value || 0
  const total = hits + misses
  return total > 0 ? (hits / total) * 100 : 0
}

function calculateAverageResponseTime(metrics: any): number {
  const duration = metrics.api_request_duration_ms
  return duration?.avg || 0
}

function calculateErrorRate(metrics: any): number {
  const errors = metrics.api_errors_total?.value || 0
  const requests = metrics.api_requests_total?.value || 0
  return requests > 0 ? (errors / requests) * 100 : 0
}