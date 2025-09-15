/**
 * HERA Metrics Collection
 * Prometheus-compatible metrics for all HERA operations
 */

import { Registry, Counter, Histogram, Gauge, Summary } from 'prom-client'
import { getSupabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export class HeraMetrics {
  private static instance: HeraMetrics
  private registry: Registry

  // Guardrail metrics
  private guardrailBlocks: Counter<string>
  private guardrailAutofixes: Counter<string>
  private guardrailValidationDuration: Histogram<string>

  // UCR metrics
  private ucrDecisions: Counter<string>
  private ucrEvalDuration: Histogram<string>
  private ucrActiveRules: Gauge<string>

  // Report metrics
  private reportsGenerated: Counter<string>
  private reportDuration: Histogram<string>
  private reportErrors: Counter<string>

  // API metrics
  private apiRequests: Counter<string>
  private apiDuration: Histogram<string>
  private apiErrors: Counter<string>

  // Business metrics
  private activeOrganizations: Gauge<string>
  private transactionVolume: Counter<string>
  private entityCount: Gauge<string>

  // System metrics
  private dbConnectionsActive: Gauge<string>
  private dbQueryDuration: Histogram<string>
  private cacheHitRate: Gauge<string>

  constructor() {
    this.registry = new Registry()
    this.initializeMetrics()
  }

  static getInstance(): HeraMetrics {
    if (!this.instance) {
      this.instance = new HeraMetrics()
    }
    return this.instance
  }

  /**
   * Initialize all metrics
   */
  private initializeMetrics() {
    // Guardrail metrics
    this.guardrailBlocks = new Counter({
      name: 'hera_guardrail_blocks_total',
      help: 'Total number of guardrail blocks',
      labelNames: ['organization_id', 'table', 'reason'],
      registers: [this.registry]
    })

    this.guardrailAutofixes = new Counter({
      name: 'hera_guardrail_autofix_total',
      help: 'Total number of guardrail auto-fixes applied',
      labelNames: ['organization_id', 'table', 'fix_type'],
      registers: [this.registry]
    })

    this.guardrailValidationDuration = new Histogram({
      name: 'hera_guardrail_validation_duration_ms',
      help: 'Guardrail validation duration in milliseconds',
      labelNames: ['table', 'result'],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
      registers: [this.registry]
    })

    // UCR metrics
    this.ucrDecisions = new Counter({
      name: 'ucr_decisions_total',
      help: 'Total UCR rule decisions',
      labelNames: ['organization_id', 'rule_type', 'result'],
      registers: [this.registry]
    })

    this.ucrEvalDuration = new Histogram({
      name: 'ucr_eval_latency_ms',
      help: 'UCR rule evaluation latency in milliseconds',
      labelNames: ['rule_type', 'complexity'],
      buckets: [10, 25, 50, 80, 100, 150, 200, 500],
      registers: [this.registry]
    })

    this.ucrActiveRules = new Gauge({
      name: 'ucr_active_rules',
      help: 'Number of active UCR rules per organization',
      labelNames: ['organization_id', 'rule_family'],
      registers: [this.registry]
    })

    // Report metrics
    this.reportsGenerated = new Counter({
      name: 'reports_generated_total',
      help: 'Total reports generated',
      labelNames: ['organization_id', 'report_type', 'period'],
      registers: [this.registry]
    })

    this.reportDuration = new Histogram({
      name: 'report_latency_ms',
      help: 'Report generation latency in milliseconds',
      labelNames: ['report_type', 'data_size'],
      buckets: [100, 500, 1000, 2000, 5000, 10000, 30000, 60000],
      registers: [this.registry]
    })

    this.reportErrors = new Counter({
      name: 'report_errors_total',
      help: 'Total report generation errors',
      labelNames: ['report_type', 'error_type'],
      registers: [this.registry]
    })

    // API metrics
    this.apiRequests = new Counter({
      name: 'api_requests_total',
      help: 'Total API requests',
      labelNames: ['method', 'endpoint', 'status'],
      registers: [this.registry]
    })

    this.apiDuration = new Histogram({
      name: 'api_duration_ms',
      help: 'API request duration in milliseconds',
      labelNames: ['method', 'endpoint'],
      buckets: [50, 100, 250, 500, 1000, 2500, 5000, 10000],
      registers: [this.registry]
    })

    this.apiErrors = new Counter({
      name: 'api_errors_total',
      help: 'Total API errors',
      labelNames: ['method', 'endpoint', 'error_code'],
      registers: [this.registry]
    })

    // Business metrics
    this.activeOrganizations = new Gauge({
      name: 'active_organizations',
      help: 'Number of active organizations',
      labelNames: ['tier'],
      registers: [this.registry]
    })

    this.transactionVolume = new Counter({
      name: 'transaction_volume_total',
      help: 'Total transaction volume by type',
      labelNames: ['organization_id', 'transaction_type'],
      registers: [this.registry]
    })

    this.entityCount = new Gauge({
      name: 'entity_count',
      help: 'Total entities by type',
      labelNames: ['organization_id', 'entity_type'],
      registers: [this.registry]
    })

    // System metrics
    this.dbConnectionsActive = new Gauge({
      name: 'db_connections_active',
      help: 'Active database connections',
      registers: [this.registry]
    })

    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_ms',
      help: 'Database query duration in milliseconds',
      labelNames: ['operation', 'table'],
      buckets: [10, 25, 50, 100, 250, 500, 1000, 2500],
      registers: [this.registry]
    })

    this.cacheHitRate = new Gauge({
      name: 'cache_hit_rate',
      help: 'Cache hit rate percentage',
      labelNames: ['cache_type'],
      registers: [this.registry]
    })
  }

  /**
   * Record guardrail block
   */
  recordGuardrailBlock(organizationId: string, table: string, reason: string) {
    this.guardrailBlocks.inc({ organization_id: organizationId, table, reason })
  }

  /**
   * Record guardrail autofix
   */
  recordGuardrailAutofix(organizationId: string, table: string, fixType: string) {
    this.guardrailAutofixes.inc({ organization_id: organizationId, table, fix_type: fixType })
  }

  /**
   * Record guardrail validation timing
   */
  recordGuardrailValidation(table: string, result: 'allowed' | 'blocked', durationMs: number) {
    this.guardrailValidationDuration.observe({ table, result }, durationMs)
  }

  /**
   * Record UCR decision
   */
  recordUCRDecision(organizationId: string, ruleType: string, result: string) {
    this.ucrDecisions.inc({ organization_id: organizationId, rule_type: ruleType, result })
  }

  /**
   * Record UCR evaluation timing
   */
  recordUCREvaluation(ruleType: string, complexity: 'simple' | 'complex', durationMs: number) {
    this.ucrEvalDuration.observe({ rule_type: ruleType, complexity }, durationMs)
  }

  /**
   * Update active UCR rules count
   */
  updateActiveUCRRules(organizationId: string, ruleFamily: string, count: number) {
    this.ucrActiveRules.set({ organization_id: organizationId, rule_family: ruleFamily }, count)
  }

  /**
   * Record report generation
   */
  recordReportGeneration(organizationId: string, reportType: string, period: string) {
    this.reportsGenerated.inc({ organization_id: organizationId, report_type: reportType, period })
  }

  /**
   * Record report timing
   */
  recordReportDuration(
    reportType: string,
    dataSize: 'small' | 'medium' | 'large',
    durationMs: number
  ) {
    this.reportDuration.observe({ report_type: reportType, data_size: dataSize }, durationMs)
  }

  /**
   * Record report error
   */
  recordReportError(reportType: string, errorType: string) {
    this.reportErrors.inc({ report_type: reportType, error_type: errorType })
  }

  /**
   * Record API request
   */
  recordAPIRequest(method: string, endpoint: string, status: number) {
    this.apiRequests.inc({ method, endpoint, status: status.toString() })
  }

  /**
   * Record API timing
   */
  recordAPIDuration(method: string, endpoint: string, durationMs: number) {
    this.apiDuration.observe({ method, endpoint }, durationMs)
  }

  /**
   * Record API error
   */
  recordAPIError(method: string, endpoint: string, errorCode: string) {
    this.apiErrors.inc({ method, endpoint, error_code: errorCode })
  }

  /**
   * Update active organizations
   */
  updateActiveOrganizations(tier: string, count: number) {
    this.activeOrganizations.set({ tier }, count)
  }

  /**
   * Record transaction volume
   */
  recordTransactionVolume(organizationId: string, transactionType: string) {
    this.transactionVolume.inc({
      organization_id: organizationId,
      transaction_type: transactionType
    })
  }

  /**
   * Update entity count
   */
  updateEntityCount(organizationId: string, entityType: string, count: number) {
    this.entityCount.set({ organization_id: organizationId, entity_type: entityType }, count)
  }

  /**
   * Update database connections
   */
  updateDBConnections(count: number) {
    this.dbConnectionsActive.set(count)
  }

  /**
   * Record database query timing
   */
  recordDBQuery(operation: string, table: string, durationMs: number) {
    this.dbQueryDuration.observe({ operation, table }, durationMs)
  }

  /**
   * Update cache hit rate
   */
  updateCacheHitRate(cacheType: string, rate: number) {
    this.cacheHitRate.set({ cache_type: cacheType }, rate)
  }

  /**
   * Get all metrics as text
   */
  getMetrics(): string {
    return this.registry.metrics()
  }

  /**
   * Get all metrics as JSON
   */
  async getMetricsJSON() {
    return this.registry.getMetricsAsJSON()
  }

  /**
   * Persist key metrics to database
   */
  async persistMetrics(organizationId: string) {
    const supabase = getSupabase()
    const metrics = await this.getMetricsJSON()

    // Store as transaction for audit
    await supabase.from('universal_transactions').insert({
      id: uuidv4(),
      transaction_type: 'metrics_snapshot',
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      smart_code: 'HERA.OBSERVABILITY.METRICS.SNAPSHOT.v1',
      organization_id: organizationId,
      metadata: {
        metrics: metrics,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Create summary metrics
   */
  async createMetricsSummary(
    organizationId: string,
    period: 'hour' | 'day' | 'week'
  ): Promise<any> {
    const supabase = getSupabase()

    // Calculate time range
    const now = new Date()
    const startTime = new Date()

    switch (period) {
      case 'hour':
        startTime.setHours(now.getHours() - 1)
        break
      case 'day':
        startTime.setDate(now.getDate() - 1)
        break
      case 'week':
        startTime.setDate(now.getDate() - 7)
        break
    }

    // Query metrics snapshots
    const { data: snapshots } = await supabase
      .from('universal_transactions')
      .select('metadata')
      .eq('transaction_type', 'metrics_snapshot')
      .eq('organization_id', organizationId)
      .gte('transaction_date', startTime.toISOString())
      .order('transaction_date', { ascending: false })

    if (!snapshots || snapshots.length === 0) {
      return null
    }

    // Aggregate metrics
    const summary = {
      period,
      start_time: startTime.toISOString(),
      end_time: now.toISOString(),
      api_requests_total: 0,
      guardrail_blocks_total: 0,
      reports_generated_total: 0,
      average_api_latency_ms: 0,
      error_rate_percentage: 0
    }

    // Process snapshots to calculate summary
    // Implementation would aggregate the metric values

    return summary
  }
}

export const heraMetrics = HeraMetrics.getInstance()
