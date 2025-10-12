-- ============================================================================
-- HERA Finance DNA v3: AI Insights Engine Validation Queries
-- 
-- Production monitoring queries for day-2 operations. Copy-paste ready
-- for DBAs, SREs, and operations teams. All org-scoped for safety.
-- 
-- Smart Code: HERA.AI.INSIGHT.VALIDATION.QUERIES.V3
-- ============================================================================

-- ============================================================================
-- 1) Latency SLA Monitoring (< 5,000 ms per org/period)
-- ============================================================================

-- Check recent insight generation performance
SELECT 
  organization_id,
  metadata->>'period' as period,
  metadata->>'intelligence_level' as level,
  COALESCE((metadata->'processing_metrics'->>'total_processing_ms')::integer, 0) as processing_ms,
  CASE 
    WHEN COALESCE((metadata->'processing_metrics'->>'total_processing_ms')::integer, 0) < 5000 THEN '✅ SLA_MET'
    WHEN COALESCE((metadata->'processing_metrics'->>'total_processing_ms')::integer, 0) < 10000 THEN '⚠️ SLA_WARNING'
    ELSE '❌ SLA_BREACH'
  END as sla_status,
  transaction_code as run_code,
  status,
  created_at,
  extract(epoch from (now() - created_at))*1000 as ms_since_created
FROM universal_transactions
WHERE transaction_type = 'AI_INSIGHT_RUN'
  AND smart_code = 'HERA.AI.INSIGHT.RUN.V3'
  AND organization_id = :org_id  -- Replace with actual UUID
ORDER BY created_at DESC 
LIMIT 10;

-- Performance trends over last 24 hours
SELECT 
  date_trunc('hour', created_at) as hour_bucket,
  COUNT(*) as total_runs,
  AVG(COALESCE((metadata->'processing_metrics'->>'total_processing_ms')::integer, 0)) as avg_processing_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY COALESCE((metadata->'processing_metrics'->>'total_processing_ms')::integer, 0)) as p95_processing_ms,
  COUNT(CASE WHEN COALESCE((metadata->'processing_metrics'->>'total_processing_ms')::integer, 0) > 5000 THEN 1 END) as sla_breaches
FROM universal_transactions
WHERE transaction_type = 'AI_INSIGHT_RUN'
  AND smart_code = 'HERA.AI.INSIGHT.RUN.V3'
  AND organization_id = :org_id
  AND created_at >= now() - interval '24 hours'
GROUP BY date_trunc('hour', created_at)
ORDER BY hour_bucket DESC;

-- ============================================================================
-- 2) Multi-Tenant Isolation Verification 
-- ============================================================================

-- Verify no cross-tenant data leakage (should return 0 for other orgs)
SELECT 
  'Cross-Tenant Check' as test_name,
  organization_id,
  COUNT(*) as insight_runs,
  CASE 
    WHEN organization_id = :org_id THEN '✅ EXPECTED'
    ELSE '❌ ISOLATION_BREACH'
  END as isolation_status
FROM universal_transactions
WHERE transaction_type = 'AI_INSIGHT_RUN'
  AND smart_code = 'HERA.AI.INSIGHT.RUN.V3'
  AND created_at >= now() - interval '7 days'
GROUP BY organization_id
ORDER BY COUNT(*) DESC;

-- Verify insight lines are properly scoped
SELECT 
  'Insight Lines Isolation' as test_name,
  ut.organization_id,
  COUNT(utl.id) as insight_lines,
  COUNT(DISTINCT ut.id) as unique_runs,
  CASE 
    WHEN ut.organization_id = :org_id THEN '✅ EXPECTED'
    ELSE '❌ LINE_ISOLATION_BREACH'
  END as isolation_status
FROM universal_transaction_lines utl
JOIN universal_transactions ut ON ut.id = utl.transaction_id
WHERE ut.transaction_type = 'AI_INSIGHT_RUN'
  AND utl.smart_code LIKE 'HERA.AI.INSIGHT.%'
  AND ut.created_at >= now() - interval '7 days'
GROUP BY ut.organization_id
ORDER BY COUNT(utl.id) DESC;

-- ============================================================================
-- 3) Content Sanity & Quality Checks
-- ============================================================================

-- Check insight confidence distribution
SELECT 
  utl.line_type as insight_type,
  COUNT(*) as total_insights,
  AVG((utl.metadata->>'confidence_score')::decimal) as avg_confidence,
  MIN((utl.metadata->>'confidence_score')::decimal) as min_confidence,
  MAX((utl.metadata->>'confidence_score')::decimal) as max_confidence,
  COUNT(CASE WHEN (utl.metadata->>'confidence_score')::decimal >= 0.8 THEN 1 END) as high_confidence_count,
  COUNT(CASE WHEN (utl.metadata->>'confidence_score')::decimal < 0.5 THEN 1 END) as low_confidence_count,
  ROUND(
    COUNT(CASE WHEN (utl.metadata->>'confidence_score')::decimal >= 0.8 THEN 1 END) * 100.0 / COUNT(*), 
    1
  ) as high_confidence_pct
FROM universal_transaction_lines utl
JOIN universal_transactions ut ON ut.id = utl.transaction_id
WHERE ut.organization_id = :org_id
  AND ut.transaction_type = 'AI_INSIGHT_RUN'
  AND utl.smart_code LIKE 'HERA.AI.INSIGHT.%'
  AND ut.created_at >= now() - interval '7 days'
GROUP BY utl.line_type
ORDER BY total_insights DESC;

-- Check for negative margin alerts (high severity indicators)
SELECT 
  ut.metadata->>'period' as period,
  utl.metadata->>'insight_category' as category,
  utl.metadata->>'insight_title' as title,
  (utl.metadata->>'confidence_score')::decimal as confidence,
  utl.metadata->>'data_points' as data_points,
  CASE 
    WHEN utl.metadata->>'insight_description' ILIKE '%negative%margin%' THEN 'HIGH'
    WHEN utl.metadata->>'insight_description' ILIKE '%variance%' THEN 'MEDIUM'
    ELSE 'LOW'
  END as severity,
  ut.created_at
FROM universal_transaction_lines utl
JOIN universal_transactions ut ON ut.id = utl.transaction_id
WHERE ut.organization_id = :org_id
  AND ut.transaction_type = 'AI_INSIGHT_RUN'
  AND utl.line_type = 'AI_INSIGHT_DESCRIPTIVE'
  AND ut.created_at >= now() - interval '7 days'
  AND (
    utl.metadata->>'insight_description' ILIKE '%negative%' OR
    utl.metadata->>'insight_description' ILIKE '%decrease%' OR
    utl.metadata->>'insight_description' ILIKE '%loss%'
  )
ORDER BY ut.created_at DESC, (utl.metadata->>'confidence_score')::decimal DESC;

-- ============================================================================
-- 4) System Health & Success Rate Monitoring
-- ============================================================================

-- 24-hour success rate (target: ≥ 99%)
SELECT 
  'Last 24 Hours' as period,
  COUNT(*) as total_runs,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as successful_runs,
  COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_runs,
  ROUND(
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as success_rate_pct,
  CASE 
    WHEN ROUND(COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(*), 2) >= 99.0 
    THEN '✅ SLA_MET'
    ELSE '❌ SLA_BREACH'
  END as sla_status
FROM universal_transactions
WHERE organization_id = :org_id
  AND transaction_type = 'AI_INSIGHT_RUN'
  AND smart_code = 'HERA.AI.INSIGHT.RUN.V3'
  AND created_at >= now() - interval '24 hours';

-- Recent failures analysis
SELECT 
  transaction_code as run_code,
  metadata->>'period' as period,
  metadata->>'error_code' as error_code,
  metadata->>'error' as error_message,
  status,
  created_at,
  updated_at
FROM universal_transactions
WHERE organization_id = :org_id
  AND transaction_type = 'AI_INSIGHT_RUN'
  AND status != 'COMPLETED'
  AND created_at >= now() - interval '7 days'
ORDER BY created_at DESC;

-- ============================================================================
-- 5) Data Foundation Quality Checks
-- ============================================================================

-- Verify profitability data foundation
SELECT 
  ut.metadata->>'period' as insight_period,
  (ut.metadata->'data_foundation'->>'fact_count')::integer as facts_analyzed,
  ut.metadata->'data_foundation'->>'data_completeness' as completeness,
  COUNT(utl.id) as insights_generated,
  CASE 
    WHEN (ut.metadata->'data_foundation'->>'fact_count')::integer > 100 THEN '✅ SUFFICIENT'
    WHEN (ut.metadata->'data_foundation'->>'fact_count')::integer > 10 THEN '⚠️ LIMITED'
    ELSE '❌ INSUFFICIENT'
  END as data_quality_status,
  ut.created_at
FROM universal_transactions ut
LEFT JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
WHERE ut.organization_id = :org_id
  AND ut.transaction_type = 'AI_INSIGHT_RUN'
  AND ut.created_at >= now() - interval '30 days'
GROUP BY ut.id, ut.metadata, ut.created_at
ORDER BY ut.created_at DESC;

-- Check for missing dimensional data
SELECT 
  'Dimensional Completeness' as check_name,
  COUNT(CASE WHEN profit_center_id IS NULL THEN 1 END) as missing_profit_center,
  COUNT(CASE WHEN cost_center_id IS NULL THEN 1 END) as missing_cost_center,
  COUNT(CASE WHEN product_id IS NULL THEN 1 END) as missing_product,
  COUNT(CASE WHEN customer_id IS NULL THEN 1 END) as missing_customer,
  COUNT(*) as total_facts,
  ROUND(
    COUNT(CASE WHEN profit_center_id IS NOT NULL 
                 AND cost_center_id IS NOT NULL 
                 AND product_id IS NOT NULL 
                 AND customer_id IS NOT NULL 
            THEN 1 END) * 100.0 / COUNT(*), 
    1
  ) as completeness_pct
FROM fact_profitability_v2
WHERE org_id = :org_id
  AND period = to_char(date_trunc('month', now()), 'YYYY-MM');

-- ============================================================================
-- 6) Intelligence Layer Progression Analysis
-- ============================================================================

-- Track intelligence level usage over time
SELECT 
  (metadata->>'intelligence_level')::integer as level,
  'Level ' || (metadata->>'intelligence_level')::integer || ' - ' ||
  CASE (metadata->>'intelligence_level')::integer
    WHEN 1 THEN 'Descriptive Only'
    WHEN 2 THEN 'Descriptive + Predictive'
    WHEN 3 THEN 'Descriptive + Predictive + Prescriptive'
    WHEN 4 THEN 'Full Intelligence (+ Autonomous)'
    ELSE 'Unknown'
  END as level_description,
  COUNT(*) as run_count,
  AVG((metadata->'intelligence_layers'->>'descriptive')::integer) as avg_descriptive,
  AVG((metadata->'intelligence_layers'->>'predictive')::integer) as avg_predictive,
  AVG((metadata->'intelligence_layers'->>'prescriptive')::integer) as avg_prescriptive,
  AVG((metadata->'intelligence_layers'->>'autonomous')::integer) as avg_autonomous,
  MAX(created_at) as latest_run
FROM universal_transactions
WHERE organization_id = :org_id
  AND transaction_type = 'AI_INSIGHT_RUN'
  AND created_at >= now() - interval '30 days'
GROUP BY (metadata->>'intelligence_level')::integer
ORDER BY (metadata->>'intelligence_level')::integer;

-- ============================================================================
-- 7) Quick Health Dashboard (Executive Summary)
-- ============================================================================

-- One-query dashboard for operations
SELECT 
  'AI Insights Health Dashboard' as title,
  to_char(now(), 'YYYY-MM-DD HH24:MI:SS UTC') as generated_at,
  (
    SELECT COUNT(*) FROM universal_transactions
    WHERE organization_id = :org_id
      AND transaction_type = 'AI_INSIGHT_RUN'
      AND DATE(created_at) = CURRENT_DATE
  ) as runs_today,
  (
    SELECT ROUND(AVG(COALESCE((metadata->'processing_metrics'->>'total_processing_ms')::integer, 0)))
    FROM universal_transactions
    WHERE organization_id = :org_id
      AND transaction_type = 'AI_INSIGHT_RUN'
      AND created_at >= now() - interval '24 hours'
  ) as avg_latency_ms_24h,
  (
    SELECT ROUND(
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(*), 1
    )
    FROM universal_transactions
    WHERE organization_id = :org_id
      AND transaction_type = 'AI_INSIGHT_RUN'
      AND created_at >= now() - interval '24 hours'
  ) as success_rate_pct_24h,
  (
    SELECT COUNT(*)
    FROM universal_transaction_lines utl
    JOIN universal_transactions ut ON ut.id = utl.transaction_id
    WHERE ut.organization_id = :org_id
      AND ut.transaction_type = 'AI_INSIGHT_RUN'
      AND utl.metadata->>'insight_description' ILIKE '%negative%'
      AND ut.created_at >= now() - interval '24 hours'
  ) as high_severity_alerts_24h,
  (
    SELECT COUNT(*)
    FROM universal_transactions
    WHERE organization_id = :org_id
      AND transaction_type = 'AI_POLICY_UPDATE'
      AND status = 'PENDING_APPROVAL'
  ) as policy_changes_pending,
  (
    SELECT MAX(created_at)
    FROM universal_transactions
    WHERE organization_id = :org_id
      AND transaction_type = 'AI_INSIGHT_RUN'
      AND status = 'COMPLETED'
  ) as last_successful_run;

-- ============================================================================
-- 8) Autonomous Safety Status Check
-- ============================================================================

-- Check autonomous insight generation and safety bounds
SELECT 
  'Autonomous Safety Check' as check_name,
  COUNT(*) as autonomous_insights_generated,
  COUNT(CASE WHEN utl.metadata->>'confidence_score'::decimal >= 0.9 THEN 1 END) as high_confidence_autonomous,
  COUNT(CASE WHEN utl.metadata->'recommendations' IS NOT NULL THEN 1 END) as actionable_recommendations,
  MAX(ut.created_at) as latest_autonomous_run
FROM universal_transaction_lines utl
JOIN universal_transactions ut ON ut.id = utl.transaction_id
WHERE ut.organization_id = :org_id
  AND ut.transaction_type = 'AI_INSIGHT_RUN'
  AND utl.line_type = 'AI_INSIGHT_AUTONOMOUS'
  AND ut.created_at >= now() - interval '7 days';

-- ============================================================================
-- Template for Organization-Specific Monitoring
-- ============================================================================

/*
-- Copy this block and replace :org_id with actual UUIDs for monitoring multiple orgs

-- Organization: [COMPANY_NAME]
\set org_id 'your-org-uuid-here'

-- Run health check
\i ops/ai-insights-v3/validation-queries.sql

-- Expected Results:
-- ✅ All latency < 5000ms
-- ✅ Success rate >= 99%
-- ✅ No isolation breaches
-- ✅ High confidence insights > 80%
-- ✅ Recent successful runs within 24h
*/

-- ============================================================================
-- End of Validation Queries
-- ============================================================================

/*
🧬 HERA AI Insights Engine v3 - Validation Queries Complete

Usage Instructions:
1. Replace :org_id with actual organization UUID
2. Run queries individually or as a batch
3. Monitor SLA breaches and take corrective action
4. Schedule these queries for automated monitoring
5. Set up alerts based on thresholds defined above

Key Metrics to Monitor:
- Processing latency (< 5000ms)
- Success rate (≥ 99%)
- Multi-tenant isolation (zero breaches)
- Confidence distribution (>80% high confidence)
- Data foundation quality (>100 facts/period)

Next: Review ops/ai-insights-v3/alerting-rules.yaml for alert configuration
*/