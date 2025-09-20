#!/usr/bin/env node

/**
 * SALON CANARY MONITORING
 * 
 * Continuous monitoring script for the Hair Talkz POS cart canary
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const HAIR_TALKZ_ORG_ID = 'hair-talkz-salon-org-uuid'
const MONITORING_INTERVAL = 60000 // 1 minute

// SLO thresholds
const SLO_THRESHOLDS = {
  p95_latency_ms: 200,
  error_rate_percent: 0.1,
  correlation_coverage_percent: 95,
  timer_backlog_count: 0
}

/**
 * Calculate p95 latency from recent requests
 */
async function calculateP95Latency(organizationId: string, timeWindow: string = '1 hour') {
  const { data, error } = await supabase
    .from('universal_transactions')
    .select('metadata->execution_time_ms')
    .eq('organization_id', organizationId)
    .eq('smart_code', 'HERA.SALON.POS.CART.REPRICE.V1')
    .gte('created_at', `now() - interval '${timeWindow}'`)
    
  if (error || !data || data.length === 0) {
    return { p95: 0, count: 0 }
  }
  
  const latencies = data
    .map(d => d.metadata?.execution_time_ms)
    .filter(l => l !== undefined)
    .sort((a, b) => a - b)
    
  const p95Index = Math.floor(latencies.length * 0.95)
  
  return {
    p95: latencies[p95Index] || 0,
    count: latencies.length
  }
}

/**
 * Calculate error rate
 */
async function calculateErrorRate(organizationId: string, timeWindow: string = '1 hour') {
  // Total requests
  const { count: totalCount } = await supabase
    .from('universal_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('smart_code', 'HERA.SALON.POS.CART.REPRICE.V1')
    .gte('created_at', `now() - interval '${timeWindow}'`)
    
  // Failed requests
  const { count: errorCount } = await supabase
    .from('universal_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('smart_code', 'HERA.SALON.POS.CART.REPRICE.V1')
    .eq('metadata->success', false)
    .gte('created_at', `now() - interval '${timeWindow}'`)
    
  const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0
  
  return {
    errorRate,
    totalCount: totalCount || 0,
    errorCount: errorCount || 0
  }
}

/**
 * Check correlation ID coverage
 */
async function checkCorrelationCoverage(organizationId: string, timeWindow: string = '1 hour') {
  const { data, error } = await supabase
    .from('universal_transactions')
    .select('metadata->correlation_id')
    .eq('organization_id', organizationId)
    .like('smart_code', 'HERA.SALON.%')
    .gte('created_at', `now() - interval '${timeWindow}'`)
    
  if (error || !data || data.length === 0) {
    return { coverage: 100, total: 0 }
  }
  
  const withCorrelation = data.filter(d => d.metadata?.correlation_id).length
  const coverage = (withCorrelation / data.length) * 100
  
  return {
    coverage,
    total: data.length,
    withCorrelation
  }
}

/**
 * Check timer backlog
 */
async function checkTimerBacklog(organizationId: string) {
  const { count } = await supabase
    .from('universal_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('smart_code', 'HERA.UNIV.WF.TIMER.V1')
    .eq('metadata->timer_status', 'PENDING')
    .lte('metadata->fire_at', new Date().toISOString())
    
  return count || 0
}

/**
 * Check cross-org isolation
 */
async function checkCrossOrgIsolation(organizationId: string) {
  // Try to query other org's data (should return 0)
  const { count } = await supabase
    .from('universal_transactions')
    .select('*', { count: 'exact', head: true })
    .neq('organization_id', organizationId)
    .eq('smart_code', 'HERA.SALON.POS.CART.REPRICE.V1')
    .gte('created_at', `now() - interval '1 hour'`)
    
  return {
    isolated: count === 0,
    leakedCount: count || 0
  }
}

/**
 * Collect all metrics
 */
async function collectMetrics(organizationId: string) {
  console.log(`\n📊 Collecting metrics at ${new Date().toISOString()}`)
  
  const [latency, errorRate, correlation, timerBacklog, isolation] = await Promise.all([
    calculateP95Latency(organizationId),
    calculateErrorRate(organizationId),
    checkCorrelationCoverage(organizationId),
    checkTimerBacklog(organizationId),
    checkCrossOrgIsolation(organizationId)
  ])
  
  const metrics = {
    timestamp: new Date().toISOString(),
    p95_latency_ms: latency.p95,
    request_count: latency.count,
    error_rate_percent: errorRate.errorRate,
    error_count: errorRate.errorCount,
    correlation_coverage_percent: correlation.coverage,
    timer_backlog_count: timerBacklog,
    cross_org_isolated: isolation.isolated,
    cross_org_leaked_count: isolation.leakedCount
  }
  
  // Display metrics
  console.log('\nCurrent Metrics:')
  console.log(`├─ P95 Latency: ${metrics.p95_latency_ms}ms (target: ≤${SLO_THRESHOLDS.p95_latency_ms}ms) ${metrics.p95_latency_ms <= SLO_THRESHOLDS.p95_latency_ms ? '✅' : '❌'}`)
  console.log(`├─ Error Rate: ${metrics.error_rate_percent.toFixed(2)}% (target: <${SLO_THRESHOLDS.error_rate_percent}%) ${metrics.error_rate_percent < SLO_THRESHOLDS.error_rate_percent ? '✅' : '❌'}`)
  console.log(`├─ Correlation Coverage: ${metrics.correlation_coverage_percent.toFixed(1)}% (target: ≥${SLO_THRESHOLDS.correlation_coverage_percent}%) ${metrics.correlation_coverage_percent >= SLO_THRESHOLDS.correlation_coverage_percent ? '✅' : '❌'}`)
  console.log(`├─ Timer Backlog: ${metrics.timer_backlog_count} (target: ${SLO_THRESHOLDS.timer_backlog_count}) ${metrics.timer_backlog_count === SLO_THRESHOLDS.timer_backlog_count ? '✅' : '❌'}`)
  console.log(`└─ Cross-Org Isolation: ${metrics.cross_org_isolated ? '✅ SECURE' : `❌ LEAKED (${metrics.cross_org_leaked_count} records)`}`)
  
  console.log(`\nRequests processed in last hour: ${metrics.request_count}`)
  
  // Check if any SLO is violated
  const violations = []
  
  if (metrics.p95_latency_ms > SLO_THRESHOLDS.p95_latency_ms) {
    violations.push(`P95 latency (${metrics.p95_latency_ms}ms > ${SLO_THRESHOLDS.p95_latency_ms}ms)`)
  }
  
  if (metrics.error_rate_percent >= SLO_THRESHOLDS.error_rate_percent) {
    violations.push(`Error rate (${metrics.error_rate_percent}% >= ${SLO_THRESHOLDS.error_rate_percent}%)`)
  }
  
  if (metrics.correlation_coverage_percent < SLO_THRESHOLDS.correlation_coverage_percent) {
    violations.push(`Correlation coverage (${metrics.correlation_coverage_percent}% < ${SLO_THRESHOLDS.correlation_coverage_percent}%)`)
  }
  
  if (metrics.timer_backlog_count > SLO_THRESHOLDS.timer_backlog_count) {
    violations.push(`Timer backlog (${metrics.timer_backlog_count} > ${SLO_THRESHOLDS.timer_backlog_count})`)
  }
  
  if (!metrics.cross_org_isolated) {
    violations.push(`Cross-org isolation breach (${metrics.cross_org_leaked_count} leaked records)`)
  }
  
  // Store metrics snapshot
  await storeMetricsSnapshot(organizationId, metrics, violations)
  
  return { metrics, violations }
}

/**
 * Store metrics snapshot
 */
async function storeMetricsSnapshot(organizationId: string, metrics: any, violations: string[]) {
  const { error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'metrics',
      smart_code: 'HERA.METRICS.CANARY.MONITORING.V1',
      total_amount: 0,
      metadata: {
        ...metrics,
        violations,
        slo_status: violations.length === 0 ? 'PASS' : 'FAIL'
      }
    })
    
  if (error) {
    console.error('Failed to store metrics:', error)
  }
}

/**
 * Send alert if violations detected
 */
async function sendAlert(violations: string[]) {
  console.log('\n🚨 SLO VIOLATIONS DETECTED!')
  console.log('==========================')
  violations.forEach(v => console.log(`  - ${v}`))
  
  console.log('\n⚠️  RECOMMENDED ACTION:')
  console.log('Consider rolling back the canary if violations persist.')
  console.log('Run: npm run salon:canary:rollback')
  
  // In production, this would send to Slack/PagerDuty
  // await notificationService.send({
  //   channel: 'salon-canary-alerts',
  //   severity: 'warning',
  //   message: `SLO violations detected: ${violations.join(', ')}`
  // })
}

/**
 * Main monitoring loop
 */
async function startMonitoring() {
  console.log('🚀 SALON CANARY MONITORING - Hair Talkz POS Cart')
  console.log('==============================================')
  console.log(`Organization: ${HAIR_TALKZ_ORG_ID}`)
  console.log(`Check interval: ${MONITORING_INTERVAL / 1000} seconds`)
  console.log('\nPress Ctrl+C to stop monitoring\n')
  
  // Initial check
  const { violations } = await collectMetrics(HAIR_TALKZ_ORG_ID)
  
  if (violations.length > 0) {
    await sendAlert(violations)
  }
  
  // Set up continuous monitoring
  setInterval(async () => {
    const { violations } = await collectMetrics(HAIR_TALKZ_ORG_ID)
    
    if (violations.length > 0) {
      await sendAlert(violations)
    }
  }, MONITORING_INTERVAL)
}

/**
 * Generate 24-hour summary report
 */
export async function generate24HourReport(organizationId: string) {
  console.log('\n📈 24-HOUR CANARY SUMMARY REPORT')
  console.log('================================')
  
  // Get all metrics from last 24 hours
  const { data: snapshots } = await supabase
    .from('universal_transactions')
    .select('metadata, created_at')
    .eq('organization_id', organizationId)
    .eq('smart_code', 'HERA.METRICS.CANARY.MONITORING.V1')
    .gte('created_at', `now() - interval '24 hours'`)
    .order('created_at', { ascending: true })
    
  if (!snapshots || snapshots.length === 0) {
    console.log('No monitoring data available')
    return
  }
  
  // Calculate aggregates
  const latencies = snapshots.map(s => s.metadata.p95_latency_ms).filter(l => l > 0)
  const errorRates = snapshots.map(s => s.metadata.error_rate_percent)
  const violations = snapshots.filter(s => s.metadata.violations.length > 0)
  
  const summary = {
    monitoring_period: '24 hours',
    total_snapshots: snapshots.length,
    avg_p95_latency_ms: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    max_p95_latency_ms: Math.max(...latencies),
    avg_error_rate_percent: errorRates.reduce((a, b) => a + b, 0) / errorRates.length,
    max_error_rate_percent: Math.max(...errorRates),
    violation_count: violations.length,
    violation_percent: (violations.length / snapshots.length) * 100,
    total_requests: snapshots.reduce((sum, s) => sum + (s.metadata.request_count || 0), 0)
  }
  
  console.log('\nSummary Statistics:')
  console.log(`├─ Monitoring snapshots: ${summary.total_snapshots}`)
  console.log(`├─ Total requests processed: ${summary.total_requests}`)
  console.log(`├─ Avg P95 latency: ${summary.avg_p95_latency_ms.toFixed(2)}ms`)
  console.log(`├─ Max P95 latency: ${summary.max_p95_latency_ms}ms`)
  console.log(`├─ Avg error rate: ${summary.avg_error_rate_percent.toFixed(3)}%`)
  console.log(`├─ Max error rate: ${summary.max_error_rate_percent.toFixed(3)}%`)
  console.log(`└─ SLO violations: ${summary.violation_count} (${summary.violation_percent.toFixed(1)}% of time)`)
  
  // Decision recommendation
  console.log('\n🎯 RECOMMENDATION:')
  if (summary.violation_percent < 5 && summary.avg_error_rate_percent < 0.05) {
    console.log('✅ PROCEED - Canary is stable and meeting SLOs')
    console.log('   Ready to expand to additional organizations')
  } else if (summary.violation_percent < 10) {
    console.log('⚠️  INVESTIGATE - Some SLO violations detected')
    console.log('   Review logs and consider performance optimizations')
  } else {
    console.log('❌ ROLLBACK - Significant SLO violations')
    console.log('   Roll back and investigate root causes')
  }
  
  return summary
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nMonitoring stopped. Generating final report...')
  generate24HourReport(HAIR_TALKZ_ORG_ID).then(() => {
    process.exit(0)
  })
})

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startMonitoring().catch(console.error)
}