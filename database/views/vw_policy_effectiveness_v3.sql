-- ============================================================================
-- HERA Finance DNA v3.5: Policy Effectiveness Analysis View
-- 
-- Comprehensive view for measuring policy change effectiveness through
-- pre/post analysis with statistical validation and business impact metrics.
-- 
-- Smart Code: HERA.AI.POLICY.VIEW.EFFECTIVENESS.V3
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS vw_policy_effectiveness_v3 CASCADE;

-- Create policy effectiveness analysis view
CREATE VIEW vw_policy_effectiveness_v3 AS
WITH policy_effectiveness_runs AS (
  -- Get all effectiveness analysis runs
  SELECT 
    ut.id as effectiveness_run_id,
    ut.organization_id,
    ut.created_at as analysis_date,
    ut.metadata->>'policy_id' as policy_id,
    ut.metadata->>'policy_type' as policy_type,
    (ut.metadata->>'periods_analyzed')::integer as periods_analyzed,
    (ut.metadata->>'analysis_start_date')::date as analysis_start_date,
    (ut.metadata->>'analysis_end_date')::date as analysis_end_date,
    (ut.metadata->>'policy_apply_date')::date as policy_apply_date,
    (ut.metadata->>'apply_runs_found')::integer as apply_runs_found,
    ut.total_amount as primary_improvement_pct,
    ut.status as analysis_status
  FROM universal_transactions ut
  WHERE ut.transaction_type = 'AI_POLICY_EFFECTIVENESS'
    AND ut.status = 'COMPLETED'
),
effectiveness_results AS (
  -- Extract detailed effectiveness results from transaction lines
  SELECT 
    per.effectiveness_run_id,
    per.organization_id,
    per.policy_id,
    per.policy_type,
    per.analysis_date,
    per.periods_analyzed,
    per.analysis_start_date,
    per.analysis_end_date,
    per.policy_apply_date,
    per.apply_runs_found,
    per.primary_improvement_pct,
    
    -- Extract effectiveness metrics from result lines
    utl.metadata->'policy_effectiveness'->>'policy_id' as result_policy_id,
    (utl.metadata->'performance_metrics'->>'variance_improvement_pct')::decimal as variance_improvement_pct,
    (utl.metadata->'performance_metrics'->>'accuracy_improvement_pct')::decimal as accuracy_improvement_pct,
    (utl.metadata->'performance_metrics'->>'financial_impact')::decimal as financial_impact,
    (utl.metadata->'performance_metrics'->>'statistical_significance')::boolean as statistical_significance,
    (utl.metadata->'performance_metrics'->>'confidence_interval_pct')::decimal as confidence_interval_pct,
    
    -- Pre/post metrics
    utl.metadata->'pre_post_comparison'->'pre_metrics' as pre_metrics,
    utl.metadata->'pre_post_comparison'->'post_metrics' as post_metrics,
    (utl.metadata->'pre_post_comparison'->>'improvement_verified')::boolean as improvement_verified,
    
    -- Business impact metrics
    (utl.metadata->'business_impact'->>'financial_impact_amount')::decimal as financial_impact_amount,
    utl.metadata->'business_impact'->'operational_improvements' as operational_improvements,
    (utl.metadata->'business_impact'->>'roi_positive')::boolean as roi_positive,
    
    -- Line metadata
    utl.created_at as result_recorded_at,
    utl.smart_code as result_smart_code
    
  FROM policy_effectiveness_runs per
  JOIN universal_transaction_lines utl ON utl.transaction_id = per.effectiveness_run_id
  WHERE utl.line_type = 'AI_POLICY_EFFECTIVENESS_RESULT'
),
policy_applications AS (
  -- Get policy application history for context
  SELECT 
    ut.organization_id,
    utl.metadata->>'target_policy' as target_policy,
    COUNT(*) as total_applications,
    MIN(ut.created_at) as first_application_date,
    MAX(ut.created_at) as latest_application_date,
    AVG((utl.metadata->>'change_pct')::decimal) as avg_change_pct,
    AVG((utl.metadata->>'confidence')::decimal) as avg_confidence,
    COUNT(CASE WHEN ut.status = 'COMPLETED' THEN 1 END) as successful_applications,
    COUNT(CASE WHEN ut.status = 'FAILED' THEN 1 END) as failed_applications
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
  WHERE ut.transaction_type = 'AI_POLICY_APPLY'
    AND utl.line_type = 'AI_POLICY_APPLIED'
  GROUP BY ut.organization_id, utl.metadata->>'target_policy'
),
variance_baseline AS (
  -- Calculate baseline variance metrics for comparison
  SELECT 
    pv.organization_id,
    pv.policy_id,
    COUNT(*) as total_variance_observations,
    AVG(pv.variance_pct) as avg_variance_pct,
    STDDEV(pv.variance_pct) as variance_stddev,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pv.variance_pct) as median_variance_pct,
    COUNT(CASE WHEN pv.exceeds_threshold THEN 1 END) as threshold_violations,
    COUNT(CASE WHEN pv.variance_trend = 'IMPROVING' THEN 1 END) as improving_periods,
    COUNT(CASE WHEN pv.variance_trend = 'WORSENING' THEN 1 END) as worsening_periods,
    MAX(pv.period_date) as latest_variance_date
  FROM vw_policy_variance_v3 pv
  GROUP BY pv.organization_id, pv.policy_id
),
effectiveness_with_context AS (
  -- Combine effectiveness results with application history and variance baselines
  SELECT 
    er.*,
    
    -- Policy application context
    pa.total_applications,
    pa.first_application_date,
    pa.latest_application_date,
    pa.avg_change_pct as historical_avg_change_pct,
    pa.avg_confidence as historical_avg_confidence,
    pa.successful_applications,
    pa.failed_applications,
    ROUND((pa.successful_applications::decimal / NULLIF(pa.total_applications, 0)) * 100, 2) as success_rate_pct,
    
    -- Variance baseline context
    vb.total_variance_observations,
    vb.avg_variance_pct as baseline_avg_variance_pct,
    vb.variance_stddev as baseline_variance_stddev,
    vb.median_variance_pct as baseline_median_variance_pct,
    vb.threshold_violations as baseline_threshold_violations,
    vb.improving_periods as baseline_improving_periods,
    vb.worsening_periods as baseline_worsening_periods,
    vb.latest_variance_date,
    
    -- Calculate improvement ratios
    CASE 
      WHEN vb.avg_variance_pct > 0 AND er.variance_improvement_pct IS NOT NULL 
      THEN ROUND((er.variance_improvement_pct / vb.avg_variance_pct) * 100, 2)
      ELSE NULL 
    END as variance_improvement_ratio,
    
    -- Calculate time-based metrics
    CASE 
      WHEN er.policy_apply_date IS NOT NULL 
      THEN EXTRACT(DAY FROM (er.analysis_date - er.policy_apply_date))
      ELSE NULL 
    END as days_since_application,
    
    CASE 
      WHEN er.analysis_start_date IS NOT NULL AND er.analysis_end_date IS NOT NULL 
      THEN EXTRACT(DAY FROM (er.analysis_end_date - er.analysis_start_date))
      ELSE NULL 
    END as analysis_duration_days
    
  FROM effectiveness_results er
  LEFT JOIN policy_applications pa ON 
    pa.organization_id = er.organization_id AND 
    pa.target_policy = er.policy_id
  LEFT JOIN variance_baseline vb ON 
    vb.organization_id = er.organization_id AND 
    vb.policy_id = er.policy_id
),
effectiveness_rankings AS (
  -- Add ranking and classification
  SELECT 
    ewc.*,
    
    -- Rank effectiveness within organization
    RANK() OVER (
      PARTITION BY ewc.organization_id 
      ORDER BY 
        COALESCE(ewc.variance_improvement_pct, ewc.accuracy_improvement_pct, 0) DESC,
        ewc.statistical_significance DESC,
        ewc.financial_impact_amount DESC
    ) as effectiveness_rank,
    
    -- Rank by financial impact
    RANK() OVER (
      PARTITION BY ewc.organization_id 
      ORDER BY ewc.financial_impact_amount DESC NULLS LAST
    ) as financial_impact_rank,
    
    -- Calculate overall effectiveness score (0-100)
    LEAST(100, ROUND(
      COALESCE(ewc.variance_improvement_pct, ewc.accuracy_improvement_pct, 0) * 0.4 +
      (CASE WHEN ewc.statistical_significance THEN 25 ELSE 0 END) +
      (CASE WHEN ewc.improvement_verified THEN 20 ELSE 0 END) +
      (CASE WHEN ewc.roi_positive THEN 15 ELSE 0 END) +
      LEAST(40, COALESCE(ewc.success_rate_pct, 0) * 0.4)
    )) as effectiveness_score,
    
    -- Calculate ROI if financial impact available
    CASE 
      WHEN ewc.financial_impact_amount > 0 AND ewc.total_applications > 0 
      THEN ROUND(ewc.financial_impact_amount / (ewc.total_applications * 1000), 2) -- Assume $1000 cost per application
      ELSE NULL 
    END as estimated_roi
    
  FROM effectiveness_with_context ewc
)
SELECT 
  -- Primary identifiers
  er.effectiveness_run_id,
  er.organization_id,
  er.policy_id,
  er.policy_type,
  
  -- Analysis metadata
  er.analysis_date,
  er.periods_analyzed,
  er.analysis_start_date,
  er.analysis_end_date,
  er.policy_apply_date,
  er.apply_runs_found,
  er.days_since_application,
  er.analysis_duration_days,
  
  -- Core effectiveness metrics
  er.variance_improvement_pct,
  er.accuracy_improvement_pct,
  er.financial_impact,
  er.financial_impact_amount,
  er.statistical_significance,
  er.confidence_interval_pct,
  er.improvement_verified,
  er.roi_positive,
  
  -- Policy application history
  er.total_applications,
  er.first_application_date,
  er.latest_application_date,
  er.historical_avg_change_pct,
  er.historical_avg_confidence,
  er.successful_applications,
  er.failed_applications,
  er.success_rate_pct,
  
  -- Baseline comparison
  er.total_variance_observations,
  er.baseline_avg_variance_pct,
  er.baseline_variance_stddev,
  er.baseline_median_variance_pct,
  er.baseline_threshold_violations,
  er.baseline_improving_periods,
  er.baseline_worsening_periods,
  er.variance_improvement_ratio,
  
  -- Rankings and scores
  er.effectiveness_rank,
  er.financial_impact_rank,
  er.effectiveness_score,
  er.estimated_roi,
  
  -- Effectiveness classification
  CASE 
    WHEN er.effectiveness_score >= 80 THEN 'HIGHLY_EFFECTIVE'
    WHEN er.effectiveness_score >= 60 THEN 'EFFECTIVE'
    WHEN er.effectiveness_score >= 40 THEN 'MODERATELY_EFFECTIVE'
    WHEN er.effectiveness_score >= 20 THEN 'MINIMALLY_EFFECTIVE'
    ELSE 'INEFFECTIVE'
  END as effectiveness_rating,
  
  CASE 
    WHEN er.statistical_significance AND er.improvement_verified AND er.roi_positive THEN 'PROVEN_SUCCESS'
    WHEN er.statistical_significance AND er.improvement_verified THEN 'STATISTICALLY_VALIDATED'
    WHEN er.improvement_verified AND er.roi_positive THEN 'BUSINESS_VALIDATED'
    WHEN er.improvement_verified THEN 'OPERATIONALLY_VALIDATED'
    WHEN er.variance_improvement_pct > 0 OR er.accuracy_improvement_pct > 0 THEN 'POSITIVE_INDICATORS'
    ELSE 'INCONCLUSIVE'
  END as validation_status,
  
  -- Recommendation category
  CASE 
    WHEN er.effectiveness_score >= 70 AND er.success_rate_pct >= 80 THEN 'EXPAND_USAGE'
    WHEN er.effectiveness_score >= 50 AND er.statistical_significance THEN 'CONTINUE_MONITORING'
    WHEN er.effectiveness_score >= 30 THEN 'ADJUST_PARAMETERS'
    WHEN er.effectiveness_score < 30 AND er.total_applications >= 3 THEN 'CONSIDER_DISCONTINUATION'
    ELSE 'INSUFFICIENT_DATA'
  END as recommendation,
  
  -- Confidence in recommendation
  CASE 
    WHEN er.statistical_significance AND er.periods_analyzed >= 6 THEN 'HIGH'
    WHEN er.improvement_verified AND er.periods_analyzed >= 3 THEN 'MEDIUM'
    WHEN er.periods_analyzed >= 1 THEN 'LOW'
    ELSE 'VERY_LOW'
  END as recommendation_confidence,
  
  -- Operational metrics
  er.pre_metrics,
  er.post_metrics,
  er.operational_improvements,
  er.latest_variance_date,
  
  -- Derived time information
  EXTRACT(YEAR FROM er.analysis_date) as analysis_year,
  EXTRACT(MONTH FROM er.analysis_date) as analysis_month,
  DATE_TRUNC('quarter', er.analysis_date) as analysis_quarter,
  
  -- Audit information
  er.result_recorded_at,
  CURRENT_TIMESTAMP as view_generated_at,
  'HERA.AI.POLICY.VIEW.EFFECTIVENESS.V3' as smart_code

FROM effectiveness_rankings er

ORDER BY 
  er.organization_id,
  er.effectiveness_score DESC,
  er.analysis_date DESC,
  er.policy_type,
  er.policy_id;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary index for organization-policy queries
CREATE INDEX idx_policy_effectiveness_v3_primary 
ON vw_policy_effectiveness_v3 (organization_id, policy_id, analysis_date DESC);

-- Effectiveness rating and score index
CREATE INDEX idx_policy_effectiveness_v3_rating 
ON vw_policy_effectiveness_v3 (organization_id, effectiveness_rating, effectiveness_score DESC);

-- Statistical significance and validation index
CREATE INDEX idx_policy_effectiveness_v3_validation 
ON vw_policy_effectiveness_v3 (organization_id, statistical_significance, validation_status);

-- Financial impact tracking index
CREATE INDEX idx_policy_effectiveness_v3_financial 
ON vw_policy_effectiveness_v3 (organization_id, roi_positive, financial_impact_amount DESC);

-- Recommendation analysis index
CREATE INDEX idx_policy_effectiveness_v3_recommendations 
ON vw_policy_effectiveness_v3 (organization_id, recommendation, recommendation_confidence);

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT ON vw_policy_effectiveness_v3 TO authenticated;
GRANT SELECT ON vw_policy_effectiveness_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON VIEW vw_policy_effectiveness_v3 IS 'HERA Finance DNA v3.5: Comprehensive policy effectiveness analysis view that measures the impact of AI policy changes through statistical validation, business impact assessment, and operational improvement tracking. Provides effectiveness ratings, ROI analysis, and actionable recommendations for policy optimization strategies.';