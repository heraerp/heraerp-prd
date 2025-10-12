-- ============================================================================
-- HERA Finance DNA v3.5: AI Policy Monitor Function
-- 
-- Continuously monitors policy accuracy, variance drift, and guardrail effectiveness
-- to identify optimization candidates without modifying existing policies.
-- 
-- Smart Code: HERA.AI.POLICY.MONITOR.RUN.v3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_ai_policy_monitor_v3(
  p_org_id UUID,
  p_period TEXT,
  p_actor_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID := gen_random_uuid();
  v_start_time TIMESTAMP := CLOCK_TIMESTAMP();
  v_monitoring_results JSONB := '{}';
  v_variance_candidates JSONB := '[]';
  v_allocation_drift JSONB := '[]';
  v_forecast_drift JSONB := '[]';
  v_guardrail_drift JSONB := '[]';
  v_consolidation_drift JSONB := '[]';
  v_total_candidates INTEGER := 0;
  v_processing_time_ms INTEGER;
  
  -- Policy bounds for this organization
  v_tuning_bounds JSONB;
  v_safety_config JSONB;
  
  -- Variance analysis
  v_current_variance DECIMAL;
  v_baseline_variance DECIMAL;
  v_variance_drift_pct DECIMAL;
  
  -- Counter variables
  v_alloc_candidates INTEGER := 0;
  v_forecast_candidates INTEGER := 0;
  v_guardrail_candidates INTEGER := 0;
  v_consol_candidates INTEGER := 0;
BEGIN
  -- ==========================================================================
  -- 1. Load Governance Policies
  -- ==========================================================================
  
  SELECT field_value_json INTO v_tuning_bounds
  FROM core_dynamic_data 
  WHERE entity_id = (
    SELECT id FROM core_entities 
    WHERE organization_id = p_org_id 
    AND entity_type = 'ai_policy_config'
    AND entity_name = 'AI_TUNING_BOUNDS_V3'
  )
  AND field_name = 'policy_config';
  
  SELECT field_value_json INTO v_safety_config
  FROM core_dynamic_data 
  WHERE entity_id = (
    SELECT id FROM core_entities 
    WHERE organization_id = p_org_id 
    AND entity_type = 'ai_policy_config'
    AND entity_name = 'AI_TUNING_SAFETY_V3'
  )
  AND field_name = 'policy_config';
  
  -- Set defaults if not found
  v_tuning_bounds := COALESCE(v_tuning_bounds, jsonb_build_object(
    'max_pct_change', 5,
    'cooldown_days', 7,
    'require_dual_approval', true,
    'allowed_targets', jsonb_build_array('ALLOC_ASSESS_V2', 'FORECAST_REFRESH_V3', 'COA_DIM_REQUIREMENTS_V2'),
    'blocked_fields', jsonb_build_array('ownership_pct', 'consol_method')
  ));
  
  v_safety_config := COALESCE(v_safety_config, jsonb_build_object(
    'must_simulate', true,
    'min_confidence', 0.9,
    'max_expected_variance_delta_pct', 2.0
  ));
  
  -- ==========================================================================
  -- 2. Create Monitoring Run Transaction
  -- ==========================================================================
  
  INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_code, 
    smart_code, total_amount, currency, status,
    metadata, created_at, posted_at
  ) VALUES (
    v_run_id, p_org_id, 'AI_POLICY_MONITOR', 
    'AI-MON-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'HERA.AI.POLICY.MONITOR.RUN.v3',
    0, 'GBP', 'PROCESSING',
    jsonb_build_object(
      'period', p_period,
      'actor_id', p_actor_id,
      'tuning_bounds', v_tuning_bounds,
      'safety_config', v_safety_config,
      'monitor_scope', jsonb_build_array(
        'ALLOCATION_ASSESSMENT', 'FORECASTING', 'GUARDRAILS', 'CONSOLIDATION'
      )
    ),
    NOW(), NOW()
  );
  
  -- ==========================================================================
  -- 3. Monitor Allocation & Assessment Policies (v3.2)
  -- ==========================================================================
  
  -- Check variance drift in allocation drivers
  WITH allocation_variance AS (
    SELECT 
      'RevenueShare' as driver_name,
      AVG(ABS(allocated_amount - actual_amount)) as current_variance,
      LAG(AVG(ABS(allocated_amount - actual_amount))) OVER (
        ORDER BY period
      ) as prior_variance
    FROM fact_profitability_v2 
    WHERE organization_id = p_org_id 
    AND period BETWEEN (p_period::DATE - INTERVAL '2 months')::TEXT AND p_period
    GROUP BY period
  ),
  drift_analysis AS (
    SELECT 
      driver_name,
      current_variance,
      prior_variance,
      CASE 
        WHEN prior_variance > 0 
        THEN ROUND(((current_variance - prior_variance) / prior_variance * 100), 2)
        ELSE 0 
      END as variance_drift_pct
    FROM allocation_variance
    WHERE current_variance IS NOT NULL AND prior_variance IS NOT NULL
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'driver_name', driver_name,
      'current_variance', current_variance,
      'prior_variance', prior_variance,
      'variance_drift_pct', variance_drift_pct,
      'severity', CASE 
        WHEN ABS(variance_drift_pct) > 10 THEN 'HIGH'
        WHEN ABS(variance_drift_pct) > 5 THEN 'MEDIUM'
        ELSE 'LOW'
      END,
      'candidate_change', CASE 
        WHEN variance_drift_pct > 10 THEN 'REWEIGHT_DRIVER'
        WHEN variance_drift_pct > 5 THEN 'ADJUST_BASIS'
        ELSE NULL
      END,
      'target_policy', 'ALLOC_ASSESS_V2'
    )
  ) INTO v_allocation_drift
  FROM drift_analysis 
  WHERE ABS(variance_drift_pct) > (v_tuning_bounds->>'max_pct_change')::DECIMAL / 2;
  
  GET DIAGNOSTICS v_alloc_candidates = ROW_COUNT;
  
  -- ==========================================================================
  -- 4. Monitor Forecasting Policies (v3.3)
  -- ==========================================================================
  
  -- Check forecast accuracy drift
  WITH forecast_accuracy AS (
    SELECT 
      'SalesRevenue' as forecast_category,
      AVG(ABS(forecast_amount - actual_amount) / NULLIF(actual_amount, 0) * 100) as mape_current,
      LAG(AVG(ABS(forecast_amount - actual_amount) / NULLIF(actual_amount, 0) * 100)) OVER (
        ORDER BY period
      ) as mape_prior
    FROM fact_forecast_v3 
    WHERE organization_id = p_org_id 
    AND period BETWEEN (p_period::DATE - INTERVAL '3 months')::TEXT AND p_period
    GROUP BY period
  ),
  forecast_drift_analysis AS (
    SELECT 
      forecast_category,
      mape_current,
      mape_prior,
      CASE 
        WHEN mape_prior > 0 
        THEN ROUND(((mape_current - mape_prior) / mape_prior * 100), 2)
        ELSE 0 
      END as accuracy_drift_pct
    FROM forecast_accuracy
    WHERE mape_current IS NOT NULL AND mape_prior IS NOT NULL
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'forecast_category', forecast_category,
      'mape_current', mape_current,
      'mape_prior', mape_prior,
      'accuracy_drift_pct', accuracy_drift_pct,
      'severity', CASE 
        WHEN ABS(accuracy_drift_pct) > 15 THEN 'HIGH'
        WHEN ABS(accuracy_drift_pct) > 8 THEN 'MEDIUM'
        ELSE 'LOW'
      END,
      'candidate_change', CASE 
        WHEN accuracy_drift_pct > 15 THEN 'ADJUST_SENSITIVITY_FACTORS'
        WHEN accuracy_drift_pct > 8 THEN 'MODIFY_DECAY_RATE'
        ELSE NULL
      END,
      'target_policy', 'FORECAST_REFRESH_V3'
    )
  ) INTO v_forecast_drift
  FROM forecast_drift_analysis 
  WHERE ABS(accuracy_drift_pct) > 5;
  
  GET DIAGNOSTICS v_forecast_candidates = ROW_COUNT;
  
  -- ==========================================================================
  -- 5. Monitor Guardrail Effectiveness
  -- ==========================================================================
  
  -- Check guardrail violation patterns
  WITH guardrail_violations AS (
    SELECT 
      guardrail_type,
      COUNT(*) as violation_count,
      AVG(variance_amount) as avg_variance,
      LAG(COUNT(*)) OVER (
        PARTITION BY guardrail_type 
        ORDER BY period
      ) as prior_violation_count
    FROM (
      SELECT 
        'BALANCE_CHECK' as guardrail_type,
        period,
        ABS(assets_total - (liabilities_total + equity_total)) as variance_amount
      FROM fact_consolidated_v3 
      WHERE organization_id = p_org_id 
      AND period BETWEEN (p_period::DATE - INTERVAL '2 months')::TEXT AND p_period
      AND ABS(assets_total - (liabilities_total + equity_total)) > 0.01
      
      UNION ALL
      
      SELECT 
        'COA_COMPLETENESS' as guardrail_type,
        period,
        missing_accounts_count as variance_amount
      FROM vw_coa_completeness_v2 
      WHERE organization_id = p_org_id 
      AND period BETWEEN (p_period::DATE - INTERVAL '2 months')::TEXT AND p_period
      AND missing_accounts_count > 0
    ) violations
    GROUP BY guardrail_type, period
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'guardrail_type', guardrail_type,
      'violation_count', violation_count,
      'prior_violation_count', prior_violation_count,
      'avg_variance', avg_variance,
      'trend', CASE 
        WHEN violation_count > COALESCE(prior_violation_count, 0) THEN 'INCREASING'
        WHEN violation_count < COALESCE(prior_violation_count, 0) THEN 'DECREASING'
        ELSE 'STABLE'
      END,
      'candidate_change', CASE 
        WHEN violation_count > COALESCE(prior_violation_count, 0) * 1.5 THEN 'ADJUST_THRESHOLDS'
        ELSE NULL
      END,
      'target_policy', 'COA_DIM_REQUIREMENTS_V2'
    )
  ) INTO v_guardrail_drift
  FROM guardrail_violations 
  WHERE violation_count > COALESCE(prior_violation_count, 0);
  
  GET DIAGNOSTICS v_guardrail_candidates = ROW_COUNT;
  
  -- ==========================================================================
  -- 6. Monitor Consolidation Efficiency (v3.4)
  -- ==========================================================================
  
  -- Check FX tolerance and reconciliation patterns
  WITH consolidation_performance AS (
    SELECT 
      'FX_TOLERANCE' as metric_type,
      AVG(total_variance_amount) as avg_variance,
      COUNT(CASE WHEN tolerance_exceeded THEN 1 END) as tolerance_exceeded_count,
      COUNT(*) as total_runs
    FROM fact_consolidated_v3 
    WHERE organization_id = p_org_id 
    AND period BETWEEN (p_period::DATE - INTERVAL '2 months')::TEXT AND p_period
    
    UNION ALL
    
    SELECT 
      'PROCESSING_TIME' as metric_type,
      AVG(processing_time_ms) as avg_variance,
      COUNT(CASE WHEN processing_time_ms > 10000 THEN 1 END) as tolerance_exceeded_count,
      COUNT(*) as total_runs
    FROM universal_transactions 
    WHERE organization_id = p_org_id 
    AND transaction_type LIKE 'CONSOL_%'
    AND created_at >= (p_period::DATE - INTERVAL '2 months')
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'metric_type', metric_type,
      'avg_variance', avg_variance,
      'tolerance_exceeded_count', tolerance_exceeded_count,
      'total_runs', total_runs,
      'exceeded_rate_pct', ROUND((tolerance_exceeded_count::DECIMAL / NULLIF(total_runs, 0)) * 100, 2),
      'candidate_change', CASE 
        WHEN tolerance_exceeded_count::DECIMAL / NULLIF(total_runs, 0) > 0.1 THEN 'ADJUST_TOLERANCE'
        ELSE NULL
      END,
      'target_policy', 'CONSOLIDATION_V3'
    )
  ) INTO v_consolidation_drift
  FROM consolidation_performance 
  WHERE tolerance_exceeded_count > 0;
  
  GET DIAGNOSTICS v_consol_candidates = ROW_COUNT;
  
  -- ==========================================================================
  -- 7. Record Monitoring Results
  -- ==========================================================================
  
  -- Calculate total candidates
  v_total_candidates := COALESCE(v_alloc_candidates, 0) + 
                       COALESCE(v_forecast_candidates, 0) + 
                       COALESCE(v_guardrail_candidates, 0) + 
                       COALESCE(v_consol_candidates, 0);
  
  -- Calculate processing time
  v_processing_time_ms := EXTRACT(EPOCH FROM (CLOCK_TIMESTAMP() - v_start_time)) * 1000;
  
  -- Build monitoring results
  v_monitoring_results := jsonb_build_object(
    'monitoring_summary', jsonb_build_object(
      'total_candidates', v_total_candidates,
      'allocation_candidates', COALESCE(v_alloc_candidates, 0),
      'forecast_candidates', COALESCE(v_forecast_candidates, 0),
      'guardrail_candidates', COALESCE(v_guardrail_candidates, 0),
      'consolidation_candidates', COALESCE(v_consol_candidates, 0),
      'processing_time_ms', v_processing_time_ms,
      'period_analyzed', p_period
    ),
    'drift_analysis', jsonb_build_object(
      'allocation_drift', COALESCE(v_allocation_drift, '[]'::JSONB),
      'forecast_drift', COALESCE(v_forecast_drift, '[]'::JSONB),
      'guardrail_drift', COALESCE(v_guardrail_drift, '[]'::JSONB),
      'consolidation_drift', COALESCE(v_consolidation_drift, '[]'::JSONB)
    ),
    'governance', jsonb_build_object(
      'tuning_bounds', v_tuning_bounds,
      'safety_config', v_safety_config
    )
  );
  
  -- Record monitoring lines for each candidate area
  IF v_alloc_candidates > 0 THEN
    INSERT INTO universal_transaction_lines (
      id, transaction_id, organization_id, line_type, line_number,
      line_amount, metadata, smart_code
    ) VALUES (
      gen_random_uuid(), v_run_id, p_org_id, 'MONITOR_ALLOCATION', 1,
      v_alloc_candidates, v_allocation_drift, 'HERA.AI.POLICY.MONITOR.LINE.v3'
    );
  END IF;
  
  IF v_forecast_candidates > 0 THEN
    INSERT INTO universal_transaction_lines (
      id, transaction_id, organization_id, line_type, line_number,
      line_amount, metadata, smart_code
    ) VALUES (
      gen_random_uuid(), v_run_id, p_org_id, 'MONITOR_FORECAST', 2,
      v_forecast_candidates, v_forecast_drift, 'HERA.AI.POLICY.MONITOR.LINE.v3'
    );
  END IF;
  
  IF v_guardrail_candidates > 0 THEN
    INSERT INTO universal_transaction_lines (
      id, transaction_id, organization_id, line_type, line_number,
      line_amount, metadata, smart_code
    ) VALUES (
      gen_random_uuid(), v_run_id, p_org_id, 'MONITOR_GUARDRAIL', 3,
      v_guardrail_candidates, v_guardrail_drift, 'HERA.AI.POLICY.MONITOR.LINE.v3'
    );
  END IF;
  
  IF v_consol_candidates > 0 THEN
    INSERT INTO universal_transaction_lines (
      id, transaction_id, organization_id, line_type, line_number,
      line_amount, metadata, smart_code
    ) VALUES (
      gen_random_uuid(), v_run_id, p_org_id, 'MONITOR_CONSOLIDATION', 4,
      v_consol_candidates, v_consolidation_drift, 'HERA.AI.POLICY.MONITOR.LINE.v3'
    );
  END IF;
  
  -- ==========================================================================
  -- 8. Update Transaction Status and Return Results
  -- ==========================================================================
  
  UPDATE universal_transactions 
  SET 
    status = 'COMPLETED',
    total_amount = v_total_candidates,
    metadata = metadata || jsonb_build_object(
      'monitoring_results', v_monitoring_results,
      'processing_time_ms', v_processing_time_ms,
      'completed_at', NOW()
    )
  WHERE id = v_run_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'monitoring_run_id', v_run_id,
    'period', p_period,
    'organization_id', p_org_id,
    'processing_time_ms', v_processing_time_ms,
    'monitoring_summary', v_monitoring_results->'monitoring_summary',
    'total_candidates', v_total_candidates,
    'smart_code', 'HERA.AI.POLICY.MONITOR.RUN.v3'
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
    'error_code', 'MONITORING_FAILED',
    'error_message', SQLERRM,
    'monitoring_run_id', v_run_id,
    'smart_code', 'HERA.AI.POLICY.MONITOR.RUN.v3'
  );
END;
$$;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION hera_ai_policy_monitor_v3(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_ai_policy_monitor_v3(UUID, TEXT, UUID) TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_ai_policy_monitor_v3(UUID, TEXT, UUID) IS 'HERA Finance DNA v3.5: AI Policy Monitor function that continuously monitors policy accuracy, variance drift, and guardrail effectiveness to identify optimization candidates. Returns recommendations for allocation drivers, forecasting parameters, guardrail thresholds, and consolidation settings while maintaining complete audit trail through universal transactions.';