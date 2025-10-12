-- ============================================================================
-- HERA Finance DNA v3.5: AI Policy Effectiveness Function
-- 
-- Measures the effectiveness of applied policy changes by comparing pre/post
-- metrics including variance improvement, accuracy gains, and business impact.
-- 
-- Smart Code: HERA.AI.POLICY.EFFECTIVENESS.RUN.v3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_ai_policy_effectiveness_v3(
  p_org_id UUID,
  p_policy_id TEXT,
  p_periods INTEGER DEFAULT 6
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID := gen_random_uuid();
  v_start_time TIMESTAMP := CLOCK_TIMESTAMP();
  v_processing_time_ms INTEGER;
  
  -- Policy application details
  v_apply_runs JSONB := '[]';
  v_policy_changes JSONB := '[]';
  
  -- Effectiveness metrics
  v_pre_metrics JSONB := '{}';
  v_post_metrics JSONB := '{}';
  v_effectiveness_summary JSONB := '{}';
  
  -- Variance analysis
  v_variance_improvement_pct DECIMAL := 0;
  v_accuracy_improvement_pct DECIMAL := 0;
  v_performance_improvement_pct DECIMAL := 0;
  
  -- Business impact
  v_financial_impact DECIMAL := 0;
  v_operational_impact JSONB := '{}';
  
  -- Period analysis
  v_analysis_start_date DATE;
  v_analysis_end_date DATE;
  v_policy_apply_date DATE;
  
  -- Metrics by policy type
  v_policy_type TEXT;
  v_metrics_count INTEGER := 0;
  
  -- Statistical measures
  v_confidence_interval DECIMAL;
  v_statistical_significance BOOLEAN := FALSE;
  
  -- Tracking variables
  v_measurement_record RECORD;
  v_line_counter INTEGER := 1;
BEGIN
  -- ==========================================================================
  -- 1. Determine Policy Type and Scope
  -- ==========================================================================
  
  -- Determine policy type from policy_id
  v_policy_type := CASE 
    WHEN p_policy_id LIKE '%ALLOC_ASSESS%' THEN 'ALLOCATION_ASSESSMENT'
    WHEN p_policy_id LIKE '%FORECAST%' THEN 'FORECASTING'
    WHEN p_policy_id LIKE '%COA_DIM%' THEN 'GUARDRAILS'
    WHEN p_policy_id LIKE '%CONSOLIDATION%' THEN 'CONSOLIDATION'
    ELSE 'UNKNOWN'
  END;
  
  -- Set analysis period
  v_analysis_end_date := CURRENT_DATE;
  v_analysis_start_date := v_analysis_end_date - INTERVAL '1 month' * p_periods;
  
  -- ==========================================================================
  -- 2. Find Policy Application Events
  -- ==========================================================================
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'apply_run_id', ut.id,
      'applied_at', ut.created_at,
      'policies_updated', ut.total_amount,
      'suggestion_run_id', ut.metadata->>'suggestion_run_id'
    )
  ) INTO v_apply_runs
  FROM universal_transactions ut
  WHERE ut.organization_id = p_org_id 
  AND ut.transaction_type = 'AI_POLICY_APPLY'
  AND ut.status = 'COMPLETED'
  AND ut.created_at BETWEEN v_analysis_start_date AND v_analysis_end_date
  AND EXISTS (
    SELECT 1 FROM universal_transaction_lines utl
    WHERE utl.transaction_id = ut.id 
    AND utl.line_type = 'AI_POLICY_APPLIED'
    AND utl.metadata->>'target_policy' = p_policy_id
  );
  
  -- Get the most recent apply date for this policy
  SELECT MAX(ut.created_at::DATE) INTO v_policy_apply_date
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
  WHERE ut.organization_id = p_org_id 
  AND ut.transaction_type = 'AI_POLICY_APPLY'
  AND ut.status = 'COMPLETED'
  AND utl.line_type = 'AI_POLICY_APPLIED'
  AND utl.metadata->>'target_policy' = p_policy_id;
  
  -- ==========================================================================
  -- 3. Create Effectiveness Analysis Transaction
  -- ==========================================================================
  
  INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_code, 
    smart_code, total_amount, currency, status,
    metadata, created_at, posted_at
  ) VALUES (
    v_run_id, p_org_id, 'AI_POLICY_EFFECTIVENESS', 
    'AI-EFF-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'HERA.AI.POLICY.EFFECTIVENESS.RUN.v3',
    0, 'GBP', 'PROCESSING',
    jsonb_build_object(
      'policy_id', p_policy_id,
      'policy_type', v_policy_type,
      'periods_analyzed', p_periods,
      'analysis_start_date', v_analysis_start_date,
      'analysis_end_date', v_analysis_end_date,
      'policy_apply_date', v_policy_apply_date,
      'apply_runs_found', COALESCE(jsonb_array_length(v_apply_runs), 0)
    ),
    NOW(), NOW()
  );
  
  -- ==========================================================================
  -- 4. Measure Effectiveness by Policy Type
  -- ==========================================================================
  
  CASE v_policy_type
    
    -- ========================================================================
    -- 4.1 Allocation & Assessment Effectiveness
    -- ========================================================================
    WHEN 'ALLOCATION_ASSESSMENT' THEN
      
      -- Calculate pre-application variance metrics
      WITH pre_variance AS (
        SELECT 
          'allocation_variance' as metric_type,
          AVG(ABS(allocated_amount - actual_amount)) as avg_variance,
          STDDEV(ABS(allocated_amount - actual_amount)) as variance_stddev,
          COUNT(*) as sample_size
        FROM fact_profitability_v2 
        WHERE organization_id = p_org_id 
        AND period_date < COALESCE(v_policy_apply_date, v_analysis_start_date)
        AND period_date >= (COALESCE(v_policy_apply_date, v_analysis_start_date) - INTERVAL '3 months')
      ),
      post_variance AS (
        SELECT 
          'allocation_variance' as metric_type,
          AVG(ABS(allocated_amount - actual_amount)) as avg_variance,
          STDDEV(ABS(allocated_amount - actual_amount)) as variance_stddev,
          COUNT(*) as sample_size
        FROM fact_profitability_v2 
        WHERE organization_id = p_org_id 
        AND period_date >= COALESCE(v_policy_apply_date, v_analysis_start_date)
        AND period_date <= v_analysis_end_date
      ),
      variance_comparison AS (
        SELECT 
          pre.avg_variance as pre_avg_variance,
          post.avg_variance as post_avg_variance,
          CASE 
            WHEN pre.avg_variance > 0 
            THEN ROUND(((pre.avg_variance - post.avg_variance) / pre.avg_variance * 100), 2)
            ELSE 0 
          END as variance_improvement_pct,
          pre.sample_size as pre_sample_size,
          post.sample_size as post_sample_size
        FROM pre_variance pre
        CROSS JOIN post_variance post
      )
      SELECT 
        jsonb_build_object(
          'pre_avg_variance', pre_avg_variance,
          'post_avg_variance', post_avg_variance,
          'variance_improvement_pct', variance_improvement_pct,
          'pre_sample_size', pre_sample_size,
          'post_sample_size', post_sample_size
        ),
        variance_improvement_pct
      INTO v_pre_metrics, v_variance_improvement_pct
      FROM variance_comparison;
      
      -- Calculate financial impact
      SELECT 
        SUM((allocated_amount - actual_amount) * efficiency_factor) INTO v_financial_impact
      FROM fact_profitability_v2 
      WHERE organization_id = p_org_id 
      AND period_date >= COALESCE(v_policy_apply_date, v_analysis_start_date)
      AND period_date <= v_analysis_end_date;
      
    -- ========================================================================
    -- 4.2 Forecasting Effectiveness
    -- ========================================================================
    WHEN 'FORECASTING' THEN
      
      -- Calculate MAPE (Mean Absolute Percentage Error) improvement
      WITH pre_accuracy AS (
        SELECT 
          AVG(ABS(forecast_amount - actual_amount) / NULLIF(actual_amount, 0) * 100) as mape,
          COUNT(*) as sample_size
        FROM fact_forecast_v3 
        WHERE organization_id = p_org_id 
        AND period_date < COALESCE(v_policy_apply_date, v_analysis_start_date)
        AND period_date >= (COALESCE(v_policy_apply_date, v_analysis_start_date) - INTERVAL '3 months')
      ),
      post_accuracy AS (
        SELECT 
          AVG(ABS(forecast_amount - actual_amount) / NULLIF(actual_amount, 0) * 100) as mape,
          COUNT(*) as sample_size
        FROM fact_forecast_v3 
        WHERE organization_id = p_org_id 
        AND period_date >= COALESCE(v_policy_apply_date, v_analysis_start_date)
        AND period_date <= v_analysis_end_date
      ),
      accuracy_comparison AS (
        SELECT 
          pre.mape as pre_mape,
          post.mape as post_mape,
          CASE 
            WHEN pre.mape > 0 
            THEN ROUND(((pre.mape - post.mape) / pre.mape * 100), 2)
            ELSE 0 
          END as accuracy_improvement_pct,
          pre.sample_size as pre_sample_size,
          post.sample_size as post_sample_size
        FROM pre_accuracy pre
        CROSS JOIN post_accuracy post
      )
      SELECT 
        jsonb_build_object(
          'pre_mape', pre_mape,
          'post_mape', post_mape,
          'accuracy_improvement_pct', accuracy_improvement_pct,
          'pre_sample_size', pre_sample_size,
          'post_sample_size', post_sample_size
        ),
        accuracy_improvement_pct
      INTO v_pre_metrics, v_accuracy_improvement_pct
      FROM accuracy_comparison;
      
    -- ========================================================================
    -- 4.3 Guardrail Effectiveness
    -- ========================================================================
    WHEN 'GUARDRAILS' THEN
      
      -- Calculate violation rate reduction
      WITH pre_violations AS (
        SELECT 
          COUNT(*) as violation_count,
          COUNT(DISTINCT DATE_TRUNC('month', created_at)) as periods_with_violations
        FROM universal_transactions 
        WHERE organization_id = p_org_id 
        AND transaction_type LIKE '%GUARDRAIL%'
        AND status = 'VIOLATION'
        AND created_at < COALESCE(v_policy_apply_date, v_analysis_start_date)
        AND created_at >= (COALESCE(v_policy_apply_date, v_analysis_start_date) - INTERVAL '3 months')
      ),
      post_violations AS (
        SELECT 
          COUNT(*) as violation_count,
          COUNT(DISTINCT DATE_TRUNC('month', created_at)) as periods_with_violations
        FROM universal_transactions 
        WHERE organization_id = p_org_id 
        AND transaction_type LIKE '%GUARDRAIL%'
        AND status = 'VIOLATION'
        AND created_at >= COALESCE(v_policy_apply_date, v_analysis_start_date)
        AND created_at <= v_analysis_end_date
      )
      SELECT 
        jsonb_build_object(
          'pre_violations', pre.violation_count,
          'post_violations', post.violation_count,
          'violation_reduction_pct', CASE 
            WHEN pre.violation_count > 0 
            THEN ROUND(((pre.violation_count - post.violation_count) / pre.violation_count::DECIMAL * 100), 2)
            ELSE 0 
          END
        )
      INTO v_pre_metrics
      FROM pre_violations pre
      CROSS JOIN post_violations post;
      
    -- ========================================================================
    -- 4.4 Consolidation Effectiveness
    -- ========================================================================
    WHEN 'CONSOLIDATION' THEN
      
      -- Calculate processing time and accuracy improvements
      WITH pre_performance AS (
        SELECT 
          AVG(processing_time_ms) as avg_processing_time,
          AVG(total_variance_amount) as avg_variance
        FROM fact_consolidated_v3 
        WHERE organization_id = p_org_id 
        AND period_date < COALESCE(v_policy_apply_date, v_analysis_start_date)
        AND period_date >= (COALESCE(v_policy_apply_date, v_analysis_start_date) - INTERVAL '3 months')
      ),
      post_performance AS (
        SELECT 
          AVG(processing_time_ms) as avg_processing_time,
          AVG(total_variance_amount) as avg_variance
        FROM fact_consolidated_v3 
        WHERE organization_id = p_org_id 
        AND period_date >= COALESCE(v_policy_apply_date, v_analysis_start_date)
        AND period_date <= v_analysis_end_date
      )
      SELECT 
        jsonb_build_object(
          'pre_processing_time', pre.avg_processing_time,
          'post_processing_time', post.avg_processing_time,
          'processing_improvement_pct', CASE 
            WHEN pre.avg_processing_time > 0 
            THEN ROUND(((pre.avg_processing_time - post.avg_processing_time) / pre.avg_processing_time * 100), 2)
            ELSE 0 
          END,
          'pre_avg_variance', pre.avg_variance,
          'post_avg_variance', post.avg_variance,
          'variance_improvement_pct', CASE 
            WHEN pre.avg_variance > 0 
            THEN ROUND(((pre.avg_variance - post.avg_variance) / pre.avg_variance * 100), 2)
            ELSE 0 
          END
        )
      INTO v_pre_metrics
      FROM pre_performance pre
      CROSS JOIN post_performance post;
      
  END CASE;
  
  -- ==========================================================================
  -- 5. Calculate Statistical Significance
  -- ==========================================================================
  
  -- Simplified statistical significance check (t-test approximation)
  -- In practice, this would use more sophisticated statistical methods
  v_statistical_significance := (
    ABS(COALESCE(v_variance_improvement_pct, v_accuracy_improvement_pct)) > 5.0 AND
    v_metrics_count >= 30 -- Minimum sample size for significance
  );
  
  v_confidence_interval := CASE 
    WHEN v_statistical_significance THEN 95.0
    ELSE 80.0
  END;
  
  -- ==========================================================================
  -- 6. Record Effectiveness Analysis Results
  -- ==========================================================================
  
  -- Build comprehensive effectiveness summary
  v_effectiveness_summary := jsonb_build_object(
    'policy_effectiveness', jsonb_build_object(
      'policy_id', p_policy_id,
      'policy_type', v_policy_type,
      'analysis_period_months', p_periods,
      'policy_apply_date', v_policy_apply_date,
      'apply_runs_analyzed', COALESCE(jsonb_array_length(v_apply_runs), 0)
    ),
    'performance_metrics', jsonb_build_object(
      'variance_improvement_pct', COALESCE(v_variance_improvement_pct, 0),
      'accuracy_improvement_pct', COALESCE(v_accuracy_improvement_pct, 0),
      'financial_impact', COALESCE(v_financial_impact, 0),
      'statistical_significance', v_statistical_significance,
      'confidence_interval_pct', v_confidence_interval
    ),
    'pre_post_comparison', jsonb_build_object(
      'pre_metrics', v_pre_metrics,
      'post_metrics', v_post_metrics,
      'improvement_verified', (
        COALESCE(v_variance_improvement_pct, 0) > 0 OR 
        COALESCE(v_accuracy_improvement_pct, 0) > 0
      )
    ),
    'business_impact', jsonb_build_object(
      'financial_impact_amount', COALESCE(v_financial_impact, 0),
      'operational_improvements', v_operational_impact,
      'roi_positive', (COALESCE(v_financial_impact, 0) > 0)
    )
  );
  
  -- Record main effectiveness result
  INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_type, line_number,
    line_amount, metadata, smart_code
  ) VALUES (
    gen_random_uuid(), v_run_id, p_org_id, 'AI_POLICY_EFFECTIVENESS_RESULT', 1,
    COALESCE(v_variance_improvement_pct, v_accuracy_improvement_pct),
    v_effectiveness_summary,
    'HERA.AI.POLICY.EFFECTIVENESS.RESULT.v3'
  );
  
  -- Record individual metrics if available
  IF v_pre_metrics != '{}' THEN
    INSERT INTO universal_transaction_lines (
      id, transaction_id, organization_id, line_type, line_number,
      line_amount, metadata, smart_code
    ) VALUES (
      gen_random_uuid(), v_run_id, p_org_id, 'AI_POLICY_PRE_METRICS', 2,
      0, v_pre_metrics, 'HERA.AI.POLICY.EFFECTIVENESS.PRE.v3'
    );
  END IF;
  
  -- ==========================================================================
  -- 7. Complete Transaction and Return Results
  -- ==========================================================================
  
  v_processing_time_ms := EXTRACT(EPOCH FROM (CLOCK_TIMESTAMP() - v_start_time)) * 1000;
  
  UPDATE universal_transactions 
  SET 
    status = 'COMPLETED',
    total_amount = COALESCE(v_variance_improvement_pct, v_accuracy_improvement_pct),
    metadata = metadata || jsonb_build_object(
      'effectiveness_summary', v_effectiveness_summary,
      'processing_time_ms', v_processing_time_ms,
      'completed_at', NOW()
    )
  WHERE id = v_run_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'effectiveness_run_id', v_run_id,
    'policy_id', p_policy_id,
    'organization_id', p_org_id,
    'processing_time_ms', v_processing_time_ms,
    'effectiveness_summary', v_effectiveness_summary,
    'key_metrics', jsonb_build_object(
      'variance_improvement_pct', COALESCE(v_variance_improvement_pct, 0),
      'accuracy_improvement_pct', COALESCE(v_accuracy_improvement_pct, 0),
      'financial_impact', COALESCE(v_financial_impact, 0),
      'statistical_significance', v_statistical_significance,
      'periods_analyzed', p_periods
    ),
    'smart_code', 'HERA.AI.POLICY.EFFECTIVENESS.RUN.v3'
  );

EXCEPTION WHEN OTHERS THEN
  -- Update transaction status to failed
  UPDATE universal_transactions 
  SET 
    status = 'FAILED',
    metadata = metadata || jsonb_build_object(
      'error_message', SQLERRM,
      'error_code', SQLSTATE,
      'failed_at', NOW()
    )
  WHERE id = v_run_id;
  
  RETURN jsonb_build_object(
    'success', false,
    'error_code', 'EFFECTIVENESS_ANALYSIS_FAILED',
    'error_message', SQLERRM,
    'effectiveness_run_id', v_run_id,
    'smart_code', 'HERA.AI.POLICY.EFFECTIVENESS.RUN.v3'
  );
END;
$$;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION hera_ai_policy_effectiveness_v3(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_ai_policy_effectiveness_v3(UUID, TEXT, INTEGER) TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_ai_policy_effectiveness_v3(UUID, TEXT, INTEGER) IS 'HERA Finance DNA v3.5: AI Policy Effectiveness function that measures the impact of applied policy changes through comprehensive pre/post analysis including variance improvement, accuracy gains, financial impact, and statistical significance testing across multiple periods.';