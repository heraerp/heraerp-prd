-- ============================================================================
-- HERA Finance DNA v3.5: Policy Variance Analysis View
-- 
-- Comprehensive view for monitoring policy performance variance across all
-- business dimensions with threshold tracking and trend analysis.
-- 
-- Smart Code: HERA.AI.POLICY.VIEW.VARIANCE.V3
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS vw_policy_variance_v3 CASCADE;

-- Create policy variance analysis view
CREATE VIEW vw_policy_variance_v3 AS
WITH policy_applications AS (
  -- Get all policy applications with their targets
  SELECT 
    ut.id as apply_run_id,
    ut.organization_id,
    ut.created_at as applied_at,
    ut.metadata->>'suggestion_run_id'::uuid as suggestion_run_id,
    utl.metadata->>'target_policy' as target_policy,
    utl.metadata->>'policy_path' as policy_path,
    (utl.metadata->>'change_pct')::decimal as change_pct,
    (utl.metadata->>'confidence')::decimal as confidence,
    utl.metadata->>'explanation' as explanation
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
  WHERE ut.transaction_type = 'AI_POLICY_APPLY'
    AND ut.status = 'COMPLETED'
    AND utl.line_type = 'AI_POLICY_APPLIED'
),
allocation_variances AS (
  -- Calculate allocation variances by profit center and product
  SELECT 
    fp.organization_id,
    fp.period,
    fp.profit_center_code,
    fp.product_code,
    fp.region_code,
    'ALLOCATION_ASSESSMENT' as policy_category,
    'ALLOC_ASSESS_V2' as policy_id,
    ABS(fp.allocated_amount - fp.actual_amount) as variance_amount,
    CASE 
      WHEN fp.actual_amount != 0 
      THEN ABS(fp.allocated_amount - fp.actual_amount) / ABS(fp.actual_amount) * 100
      ELSE 0 
    END as variance_pct,
    fp.allocation_driver,
    fp.allocation_basis,
    fp.created_at
  FROM fact_profitability_v2 fp
  WHERE fp.allocated_amount IS NOT NULL 
    AND fp.actual_amount IS NOT NULL
),
forecast_variances AS (
  -- Calculate forecasting variances by category
  SELECT 
    ff.organization_id,
    ff.period,
    ff.forecast_category as profit_center_code,
    ff.forecast_type as product_code,
    'ALL' as region_code,
    'FORECASTING' as policy_category,
    'FORECAST_REFRESH_V3' as policy_id,
    ABS(ff.forecast_amount - ff.actual_amount) as variance_amount,
    CASE 
      WHEN ff.actual_amount != 0 
      THEN ABS(ff.forecast_amount - ff.actual_amount) / ABS(ff.actual_amount) * 100
      ELSE 0 
    END as variance_pct,
    ff.forecast_method as allocation_driver,
    ff.model_type as allocation_basis,
    ff.created_at
  FROM fact_forecast_v3 ff
  WHERE ff.forecast_amount IS NOT NULL 
    AND ff.actual_amount IS NOT NULL
),
guardrail_variances AS (
  -- Calculate guardrail violation patterns
  SELECT 
    ut.organization_id,
    DATE_TRUNC('month', ut.created_at)::text as period,
    COALESCE(ut.metadata->>'entity_type', 'SYSTEM') as profit_center_code,
    COALESCE(ut.metadata->>'guardrail_type', 'GENERAL') as product_code,
    'ALL' as region_code,
    'GUARDRAILS' as policy_category,
    'COA_DIM_REQUIREMENTS_V2' as policy_id,
    COALESCE((ut.metadata->>'variance_amount')::decimal, 1) as variance_amount,
    CASE 
      WHEN ut.metadata->>'threshold_amount' IS NOT NULL 
      THEN (COALESCE((ut.metadata->>'variance_amount')::decimal, 1) / 
            (ut.metadata->>'threshold_amount')::decimal * 100)
      ELSE 100 
    END as variance_pct,
    COALESCE(ut.metadata->>'guardrail_rule', 'UNKNOWN') as allocation_driver,
    COALESCE(ut.metadata->>'check_type', 'UNKNOWN') as allocation_basis,
    ut.created_at
  FROM universal_transactions ut
  WHERE ut.transaction_type LIKE '%GUARDRAIL%'
    AND ut.status IN ('VIOLATION', 'WARNING')
),
consolidation_variances AS (
  -- Calculate consolidation accuracy variances
  SELECT 
    fc.organization_id,
    fc.period,
    fc.member_entity_id::text as profit_center_code,
    fc.consolidation_method as product_code,
    fc.base_currency as region_code,
    'CONSOLIDATION' as policy_category,
    'CONSOLIDATION_V3' as policy_id,
    ABS(fc.total_variance_amount) as variance_amount,
    CASE 
      WHEN fc.total_consolidated_amount != 0 
      THEN ABS(fc.total_variance_amount) / ABS(fc.total_consolidated_amount) * 100
      ELSE 0 
    END as variance_pct,
    fc.translation_method as allocation_driver,
    'CONSOLIDATION' as allocation_basis,
    fc.created_at
  FROM fact_consolidated_v3 fc
  WHERE fc.total_variance_amount IS NOT NULL
),
unified_variances AS (
  -- Combine all variance sources
  SELECT * FROM allocation_variances
  UNION ALL
  SELECT * FROM forecast_variances
  UNION ALL
  SELECT * FROM guardrail_variances
  UNION ALL
  SELECT * FROM consolidation_variances
),
variance_with_thresholds AS (
  -- Add threshold analysis and policy application context
  SELECT 
    uv.*,
    -- Get variance thresholds from policy config
    CASE uv.policy_category
      WHEN 'ALLOCATION_ASSESSMENT' THEN 5.0  -- 5% threshold
      WHEN 'FORECASTING' THEN 10.0           -- 10% threshold  
      WHEN 'GUARDRAILS' THEN 2.0             -- 2% threshold
      WHEN 'CONSOLIDATION' THEN 1.0          -- 1% threshold
      ELSE 5.0
    END as variance_threshold_pct,
    
    -- Check if variance exceeds threshold
    CASE 
      WHEN uv.policy_category = 'ALLOCATION_ASSESSMENT' AND uv.variance_pct > 5.0 THEN TRUE
      WHEN uv.policy_category = 'FORECASTING' AND uv.variance_pct > 10.0 THEN TRUE
      WHEN uv.policy_category = 'GUARDRAILS' AND uv.variance_pct > 2.0 THEN TRUE
      WHEN uv.policy_category = 'CONSOLIDATION' AND uv.variance_pct > 1.0 THEN TRUE
      ELSE FALSE
    END as exceeds_threshold,
    
    -- Get most recent policy application for this policy
    pa.apply_run_id,
    pa.applied_at as policy_applied_at,
    pa.change_pct as policy_change_pct,
    pa.confidence as policy_confidence,
    pa.explanation as policy_explanation,
    
    -- Determine if variance is pre or post policy application
    CASE 
      WHEN pa.applied_at IS NULL THEN 'NO_POLICY_APPLIED'
      WHEN uv.created_at < pa.applied_at THEN 'PRE_POLICY'
      WHEN uv.created_at >= pa.applied_at THEN 'POST_POLICY'
      ELSE 'UNKNOWN'
    END as policy_application_phase
    
  FROM unified_variances uv
  LEFT JOIN LATERAL (
    SELECT DISTINCT ON (target_policy) *
    FROM policy_applications pa_inner
    WHERE pa_inner.organization_id = uv.organization_id
      AND pa_inner.target_policy = uv.policy_id
    ORDER BY target_policy, applied_at DESC
  ) pa ON TRUE
),
variance_trends AS (
  -- Calculate variance trends over time
  SELECT 
    vwt.*,
    -- Rolling 3-month variance average
    AVG(vwt.variance_pct) OVER (
      PARTITION BY vwt.organization_id, vwt.policy_id, vwt.profit_center_code, vwt.product_code
      ORDER BY vwt.period 
      ROWS 2 PRECEDING
    ) as variance_3m_avg,
    
    -- Prior period variance for comparison
    LAG(vwt.variance_pct) OVER (
      PARTITION BY vwt.organization_id, vwt.policy_id, vwt.profit_center_code, vwt.product_code
      ORDER BY vwt.period
    ) as prior_period_variance_pct,
    
    -- Variance trend direction
    CASE 
      WHEN LAG(vwt.variance_pct) OVER (
        PARTITION BY vwt.organization_id, vwt.policy_id, vwt.profit_center_code, vwt.product_code
        ORDER BY vwt.period
      ) IS NULL THEN 'NO_HISTORY'
      WHEN vwt.variance_pct > LAG(vwt.variance_pct) OVER (
        PARTITION BY vwt.organization_id, vwt.policy_id, vwt.profit_center_code, vwt.product_code
        ORDER BY vwt.period
      ) * 1.1 THEN 'WORSENING'
      WHEN vwt.variance_pct < LAG(vwt.variance_pct) OVER (
        PARTITION BY vwt.organization_id, vwt.policy_id, vwt.profit_center_code, vwt.product_code
        ORDER BY vwt.period
      ) * 0.9 THEN 'IMPROVING'
      ELSE 'STABLE'
    END as variance_trend
    
  FROM variance_with_thresholds vwt
),
variance_rankings AS (
  -- Rank variances for prioritization
  SELECT 
    vt.*,
    -- Rank by variance amount within organization and policy
    RANK() OVER (
      PARTITION BY vt.organization_id, vt.policy_id, vt.period 
      ORDER BY vt.variance_amount DESC
    ) as variance_amount_rank,
    
    -- Rank by variance percentage within organization and policy
    RANK() OVER (
      PARTITION BY vt.organization_id, vt.policy_id, vt.period 
      ORDER BY vt.variance_pct DESC
    ) as variance_pct_rank,
    
    -- Calculate variance severity score (0-100)
    LEAST(100, ROUND(
      (vt.variance_pct / vt.variance_threshold_pct * 50) + 
      (CASE WHEN vt.exceeds_threshold THEN 30 ELSE 0 END) +
      (CASE vt.variance_trend 
        WHEN 'WORSENING' THEN 20 
        WHEN 'IMPROVING' THEN -10 
        ELSE 0 
      END)
    )) as variance_severity_score
    
  FROM variance_trends vt
)
SELECT 
  -- Primary identifiers
  vr.organization_id,
  vr.period,
  vr.profit_center_code,
  vr.product_code,
  vr.region_code,
  
  -- Policy information
  vr.policy_category,
  vr.policy_id,
  vr.allocation_driver,
  vr.allocation_basis,
  
  -- Variance metrics
  vr.variance_amount,
  vr.variance_pct,
  vr.variance_threshold_pct,
  vr.exceeds_threshold,
  vr.variance_3m_avg,
  vr.prior_period_variance_pct,
  vr.variance_trend,
  
  -- Variance analysis
  vr.variance_amount_rank,
  vr.variance_pct_rank,
  vr.variance_severity_score,
  
  -- Variance classification
  CASE 
    WHEN vr.variance_severity_score >= 80 THEN 'CRITICAL'
    WHEN vr.variance_severity_score >= 60 THEN 'HIGH'
    WHEN vr.variance_severity_score >= 40 THEN 'MEDIUM'
    WHEN vr.variance_severity_score >= 20 THEN 'LOW'
    ELSE 'MINIMAL'
  END as variance_priority,
  
  CASE 
    WHEN vr.exceeds_threshold AND vr.variance_trend = 'WORSENING' THEN 'URGENT_ACTION_REQUIRED'
    WHEN vr.exceeds_threshold THEN 'THRESHOLD_EXCEEDED'
    WHEN vr.variance_trend = 'WORSENING' THEN 'TRENDING_NEGATIVE'
    WHEN vr.variance_trend = 'IMPROVING' THEN 'IMPROVING'
    ELSE 'WITHIN_BOUNDS'
  END as variance_status,
  
  -- Policy application context
  vr.policy_application_phase,
  vr.apply_run_id,
  vr.policy_applied_at,
  vr.policy_change_pct,
  vr.policy_confidence,
  vr.policy_explanation,
  
  -- Policy effectiveness indicators
  CASE 
    WHEN vr.policy_application_phase = 'POST_POLICY' AND vr.variance_trend = 'IMPROVING' THEN TRUE
    WHEN vr.policy_application_phase = 'POST_POLICY' AND vr.variance_pct < vr.prior_period_variance_pct THEN TRUE
    ELSE FALSE
  END as policy_effectiveness_positive,
  
  CASE 
    WHEN vr.policy_applied_at IS NOT NULL 
    THEN EXTRACT(DAY FROM (vr.created_at - vr.policy_applied_at))
    ELSE NULL 
  END as days_since_policy_applied,
  
  -- Derived period information
  substring(vr.period from 1 for 4)::integer as fiscal_year,
  substring(vr.period from 6 for 2)::integer as fiscal_month,
  to_date(vr.period || '-01', 'YYYY-MM-DD') as period_date,
  
  -- Audit information
  vr.created_at as variance_recorded_at,
  CURRENT_TIMESTAMP as view_generated_at,
  'HERA.AI.POLICY.VIEW.VARIANCE.V3' as smart_code

FROM variance_rankings vr

ORDER BY 
  vr.organization_id,
  vr.period DESC,
  vr.variance_severity_score DESC,
  vr.policy_category,
  vr.variance_amount DESC;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary index for organization-period-policy queries
CREATE INDEX idx_policy_variance_v3_primary 
ON vw_policy_variance_v3 (organization_id, period, policy_id);

-- Variance severity and priority index
CREATE INDEX idx_policy_variance_v3_severity 
ON vw_policy_variance_v3 (organization_id, variance_priority, variance_severity_score DESC);

-- Policy effectiveness tracking index
CREATE INDEX idx_policy_variance_v3_effectiveness 
ON vw_policy_variance_v3 (organization_id, policy_id, policy_application_phase, days_since_policy_applied);

-- Threshold violations index
CREATE INDEX idx_policy_variance_v3_violations 
ON vw_policy_variance_v3 (organization_id, period, exceeds_threshold, variance_status);

-- Trend analysis index
CREATE INDEX idx_policy_variance_v3_trends 
ON vw_policy_variance_v3 (organization_id, policy_id, period, variance_trend);

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT ON vw_policy_variance_v3 TO authenticated;
GRANT SELECT ON vw_policy_variance_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON VIEW vw_policy_variance_v3 IS 'HERA Finance DNA v3.5: Comprehensive policy variance analysis view that monitors performance across allocation, forecasting, guardrail, and consolidation policies. Provides threshold tracking, trend analysis, severity scoring, and policy effectiveness measurement with complete audit trail for autonomous policy optimization.';