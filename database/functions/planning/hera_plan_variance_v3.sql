-- ============================================================================
-- HERA Finance DNA v3.3: Plan vs Actual Variance Analysis
-- 
-- Real-time variance calculation comparing planned vs actual financial
-- performance with AI-driven variance explanations and recommendations.
-- 
-- Smart Code: HERA.PLAN.VARIANCE.FUNCTION.V3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_plan_variance_v3(
  p_organization_id UUID,
  p_plan_id UUID,
  p_actual_period TEXT,  -- e.g., '2025-02'
  p_variance_threshold_pct DECIMAL DEFAULT 5.0,
  p_include_ai_explanation BOOLEAN DEFAULT true,
  p_actor_entity_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_variance_run_id UUID;
  v_start_time TIMESTAMP := clock_timestamp();
  v_plan_lines_analyzed INTEGER := 0;
  v_significant_variances INTEGER := 0;
  v_total_plan_amount DECIMAL := 0;
  v_total_actual_amount DECIMAL := 0;
  v_total_variance_amount DECIMAL := 0;
  v_total_variance_pct DECIMAL := 0;
  v_variance_summary JSONB := '{}';
  v_ai_explanations JSONB := '[]';
  v_error_code TEXT := NULL;
  v_error_message TEXT := NULL;
  rec RECORD;
BEGIN

  -- ============================================================================
  -- 1) Input Validation & Setup
  -- ============================================================================
  
  v_variance_run_id := gen_random_uuid();
  
  -- Validate plan exists
  IF NOT EXISTS (
    SELECT 1 FROM core_entities 
    WHERE id = p_plan_id 
      AND organization_id = p_organization_id 
      AND entity_type = 'PLAN_VERSION'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'PLAN_NOT_FOUND',
      'error_message', 'Plan version not found for organization'
    );
  END IF;

  BEGIN

    -- ============================================================================
    -- 2) Calculate Variance for Each Plan Line vs Actual
    -- ============================================================================
    
    FOR rec IN
      WITH plan_lines AS (
        SELECT 
          utl.id as plan_line_id,
          utl.line_type,
          utl.line_entity_id as gl_account_id,
          utl.line_amount as plan_amount,
          utl.metadata->>'period' as period,
          utl.metadata->>'profit_center_id' as profit_center_id,
          utl.metadata->>'cost_center_id' as cost_center_id,
          utl.metadata->>'product_id' as product_id,
          utl.metadata->>'customer_id' as customer_id,
          utl.metadata->>'driver_basis' as driver_basis
        FROM universal_transaction_lines utl
        JOIN universal_transactions ut ON ut.id = utl.transaction_id
        WHERE ut.organization_id = p_organization_id
          AND ut.transaction_type = 'PLAN_GENERATION'
          AND utl.metadata->>'period' = p_actual_period
          AND ut.metadata->>'plan_entity_id' = p_plan_id::text
          AND utl.line_type IN ('PLAN_LINE_REVENUE', 'PLAN_LINE_COST')
      ),
      actual_data AS (
        SELECT 
          gl_account_id,
          profit_center_id,
          cost_center_id, 
          product_id,
          customer_id,
          CASE 
            WHEN revenue_aed > 0 THEN revenue_aed
            WHEN total_cost_aed > 0 THEN total_cost_aed
            ELSE 0
          END as actual_amount,
          CASE 
            WHEN revenue_aed > 0 THEN 'PLAN_LINE_REVENUE'
            WHEN total_cost_aed > 0 THEN 'PLAN_LINE_COST'
            ELSE 'UNKNOWN'
          END as actual_type
        FROM fact_profitability_v2
        WHERE org_id = p_organization_id
          AND period = p_actual_period
          AND (revenue_aed > 0 OR total_cost_aed > 0)
      )
      SELECT 
        pl.*,
        COALESCE(ad.actual_amount, 0) as actual_amount,
        CASE 
          WHEN COALESCE(ad.actual_amount, 0) = 0 THEN NULL
          ELSE pl.plan_amount - COALESCE(ad.actual_amount, 0)
        END as variance_amount,
        CASE 
          WHEN COALESCE(ad.actual_amount, 0) = 0 THEN NULL
          WHEN pl.plan_amount = 0 THEN NULL
          ELSE ROUND(((pl.plan_amount - COALESCE(ad.actual_amount, 0)) / pl.plan_amount) * 100, 2)
        END as variance_pct,
        CASE 
          WHEN ABS(COALESCE(
            ((pl.plan_amount - COALESCE(ad.actual_amount, 0)) / NULLIF(pl.plan_amount, 0)) * 100, 
            0
          )) > p_variance_threshold_pct THEN true
          ELSE false
        END as is_significant_variance
      FROM plan_lines pl
      LEFT JOIN actual_data ad ON 
        ad.gl_account_id = pl.gl_account_id AND
        ad.profit_center_id = pl.profit_center_id AND
        ad.cost_center_id = pl.cost_center_id AND
        ad.product_id = pl.product_id AND
        ad.customer_id = pl.customer_id AND
        ad.actual_type = pl.line_type
    LOOP
    
      v_plan_lines_analyzed := v_plan_lines_analyzed + 1;
      v_total_plan_amount := v_total_plan_amount + rec.plan_amount;
      v_total_actual_amount := v_total_actual_amount + COALESCE(rec.actual_amount, 0);
      
      IF rec.variance_amount IS NOT NULL THEN
        v_total_variance_amount := v_total_variance_amount + rec.variance_amount;
      END IF;
      
      IF rec.is_significant_variance THEN
        v_significant_variances := v_significant_variances + 1;
      END IF;

      -- Insert variance line for audit trail
      INSERT INTO universal_transaction_lines (
        id,
        transaction_id,
        line_number,
        line_type,
        line_entity_id,
        quantity,
        unit_price,
        line_amount,
        currency,
        smart_code,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_variance_run_id,
        v_plan_lines_analyzed,
        'VARIANCE_LINE',
        rec.gl_account_id,
        1,
        COALESCE(rec.variance_amount, 0),
        COALESCE(rec.variance_amount, 0),
        'AED',
        'HERA.PLAN.VARIANCE.LINE.V3',
        jsonb_build_object(
          'period', p_actual_period,
          'plan_line_id', rec.plan_line_id,
          'plan_line_type', rec.line_type,
          'gl_account_id', rec.gl_account_id,
          'profit_center_id', rec.profit_center_id,
          'cost_center_id', rec.cost_center_id,
          'product_id', rec.product_id,
          'customer_id', rec.customer_id,
          'plan_amount', rec.plan_amount,
          'actual_amount', COALESCE(rec.actual_amount, 0),
          'variance_amount', COALESCE(rec.variance_amount, 0),
          'variance_pct', COALESCE(rec.variance_pct, 0),
          'is_significant', rec.is_significant_variance,
          'driver_basis', rec.driver_basis,
          'variance_threshold_pct', p_variance_threshold_pct
        ),
        now(),
        now()
      );
      
    END LOOP;

    -- ============================================================================
    -- 3) Calculate Overall Variance Summary
    -- ============================================================================
    
    v_total_variance_pct := CASE 
      WHEN v_total_plan_amount > 0 THEN 
        ROUND((v_total_variance_amount / v_total_plan_amount) * 100, 2)
      ELSE 0
    END;

    v_variance_summary := jsonb_build_object(
      'total_plan_amount', v_total_plan_amount,
      'total_actual_amount', v_total_actual_amount,
      'total_variance_amount', v_total_variance_amount,
      'total_variance_pct', v_total_variance_pct,
      'plan_lines_analyzed', v_plan_lines_analyzed,
      'significant_variances', v_significant_variances,
      'variance_threshold_pct', p_variance_threshold_pct,
      'period', p_actual_period,
      'analysis_quality', CASE 
        WHEN v_plan_lines_analyzed > 50 THEN 'HIGH'
        WHEN v_plan_lines_analyzed > 10 THEN 'MEDIUM'
        ELSE 'LOW'
      END
    );

    -- ============================================================================
    -- 4) Generate AI Explanations for Significant Variances (if enabled)
    -- ============================================================================
    
    IF p_include_ai_explanation AND v_significant_variances > 0 THEN
      
      -- Get variance patterns for AI analysis
      WITH variance_patterns AS (
        SELECT 
          metadata->>'gl_account_id' as gl_account,
          metadata->>'profit_center_id' as profit_center,
          (metadata->>'variance_pct')::decimal as variance_pct,
          (metadata->>'variance_amount')::decimal as variance_amount,
          metadata->>'line_type' as line_type
        FROM universal_transaction_lines
        WHERE transaction_id = v_variance_run_id
          AND line_type = 'VARIANCE_LINE'
          AND ABS((metadata->>'variance_pct')::decimal) > p_variance_threshold_pct
        ORDER BY ABS((metadata->>'variance_amount')::decimal) DESC
        LIMIT 10
      )
      SELECT jsonb_agg(
        jsonb_build_object(
          'variance_pattern', 'SIGNIFICANT_DEVIATION',
          'gl_account', vp.gl_account,
          'profit_center', vp.profit_center,
          'variance_pct', vp.variance_pct,
          'variance_amount', vp.variance_amount,
          'line_type', vp.line_type,
          'explanation', CASE 
            WHEN vp.line_type = 'PLAN_LINE_REVENUE' AND vp.variance_pct > 0 THEN 
              'Revenue underperformance vs plan - investigate market conditions or execution issues'
            WHEN vp.line_type = 'PLAN_LINE_REVENUE' AND vp.variance_pct < 0 THEN 
              'Revenue outperformance vs plan - identify success factors for replication'
            WHEN vp.line_type = 'PLAN_LINE_COST' AND vp.variance_pct > 0 THEN 
              'Cost overrun vs plan - review cost control measures and supplier contracts'
            WHEN vp.line_type = 'PLAN_LINE_COST' AND vp.variance_pct < 0 THEN 
              'Cost savings vs plan - document efficiency gains and scale opportunities'
            ELSE 'Variance requires detailed analysis of underlying drivers'
          END,
          'priority', CASE 
            WHEN ABS(vp.variance_pct) > 25 THEN 'CRITICAL'
            WHEN ABS(vp.variance_pct) > 15 THEN 'HIGH'
            WHEN ABS(vp.variance_pct) > 5 THEN 'MEDIUM'
            ELSE 'LOW'
          END,
          'smart_code', 'HERA.PLAN.VARIANCE.AI.EXPLANATION.V3'
        )
      ) INTO v_ai_explanations
      FROM variance_patterns vp;
      
    END IF;

    -- ============================================================================
    -- 5) Create Variance Analysis Transaction Header
    -- ============================================================================
    
    INSERT INTO universal_transactions (
      id,
      organization_id,
      transaction_type,
      transaction_code,
      transaction_date,
      total_amount,
      currency,
      status,
      smart_code,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      v_variance_run_id,
      p_organization_id,
      'VARIANCE_ANALYSIS',
      'VAR-' || p_actual_period || '-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      now(),
      v_total_variance_amount,
      'AED',
      'COMPLETED',
      'HERA.PLAN.VARIANCE.RUN.V3',
      jsonb_build_object(
        'plan_id', p_plan_id,
        'actual_period', p_actual_period,
        'variance_summary', v_variance_summary,
        'ai_explanations', COALESCE(v_ai_explanations, '[]'),
        'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
        'actor_entity_id', p_actor_entity_id,
        'include_ai_explanation', p_include_ai_explanation
      ),
      now(),
      now()
    );

    -- ============================================================================
    -- 6) Return Variance Analysis Results
    -- ============================================================================
    
    RETURN jsonb_build_object(
      'success', true,
      'variance_run_id', v_variance_run_id,
      'plan_id', p_plan_id,
      'actual_period', p_actual_period,
      'variance_summary', v_variance_summary,
      'ai_explanations', COALESCE(v_ai_explanations, '[]'),
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
      'smart_code', 'HERA.PLAN.VARIANCE.RUN.V3'
    );

  EXCEPTION WHEN OTHERS THEN
    
    -- ============================================================================
    -- Error Handling
    -- ============================================================================
    
    GET STACKED DIAGNOSTICS 
      v_error_code = RETURNED_SQLSTATE,
      v_error_message = MESSAGE_TEXT;

    -- Log error in audit trail
    INSERT INTO universal_transactions (
      id,
      organization_id,
      transaction_type,
      transaction_code,
      transaction_date,
      status,
      smart_code,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      v_variance_run_id,
      p_organization_id,
      'VARIANCE_ANALYSIS',
      'VAR-ERROR-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      now(),
      'FAILED',
      'HERA.PLAN.VARIANCE.ERROR.V3',
      jsonb_build_object(
        'error_code', v_error_code,
        'error_message', v_error_message,
        'plan_id', p_plan_id,
        'actual_period', p_actual_period,
        'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
        'actor_entity_id', p_actor_entity_id
      ),
      now(),
      now()
    );

    RETURN jsonb_build_object(
      'success', false,
      'error_code', v_error_code,
      'error_message', v_error_message,
      'variance_run_id', v_variance_run_id,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)
    );

  END;

END;
$$;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION hera_plan_variance_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_plan_variance_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_plan_variance_v3 IS 'HERA Finance DNA v3.3: Calculate plan vs actual variance analysis with AI-driven explanations for significant deviations. Provides real-time financial performance analysis with complete audit trail.';