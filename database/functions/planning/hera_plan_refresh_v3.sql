-- ============================================================================
-- HERA Finance DNA v3.3: Rolling Forecast Refresh Engine
-- 
-- Updates rolling forecasts with latest actuals and AI-driven adjustments.
-- Maintains continuous 12-month forward view with policy-driven automation.
-- 
-- Smart Code: HERA.PLAN.REFRESH.FUNCTION.V3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_plan_refresh_v3(
  p_organization_id UUID,
  p_plan_id UUID,
  p_refresh_horizon_months INTEGER DEFAULT 12,
  p_auto_approve_threshold_pct DECIMAL DEFAULT 5.0,
  p_include_ai_adjustments BOOLEAN DEFAULT true,
  p_actor_entity_id UUID DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_refresh_run_id UUID;
  v_start_time TIMESTAMP := clock_timestamp();
  v_original_plan_type TEXT;
  v_current_period TEXT;
  v_refresh_start_period TEXT;
  v_refresh_end_period TEXT;
  v_lines_refreshed INTEGER := 0;
  v_significant_changes INTEGER := 0;
  v_approval_required BOOLEAN := false;
  v_ai_adjustments_applied INTEGER := 0;
  v_trend_analysis JSONB := '{}';
  v_refresh_summary JSONB := '{}';
  v_policy_checks JSONB := '{}';
  v_error_code TEXT := NULL;
  v_error_message TEXT := NULL;
  rec RECORD;
BEGIN

  -- ============================================================================
  -- 1) Input Validation & Setup
  -- ============================================================================
  
  v_refresh_run_id := gen_random_uuid();
  v_current_period := to_char(date_trunc('month', now()), 'YYYY-MM');
  v_refresh_start_period := to_char(date_trunc('month', now()) + interval '1 month', 'YYYY-MM');
  v_refresh_end_period := to_char(date_trunc('month', now()) + interval '1 month' * p_refresh_horizon_months, 'YYYY-MM');
  
  -- Get original plan details
  SELECT metadata->>'plan_type' INTO v_original_plan_type
  FROM core_entities 
  WHERE id = p_plan_id 
    AND organization_id = p_organization_id 
    AND entity_type = 'PLAN_VERSION';
    
  IF v_original_plan_type IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'PLAN_NOT_FOUND',
      'error_message', 'Plan version not found for refresh'
    );
  END IF;

  BEGIN

    -- ============================================================================
    -- 2) Analyze Recent Performance Trends
    -- ============================================================================
    
    -- Get performance trends from last 3 months for AI adjustments
    WITH recent_performance AS (
      SELECT 
        gl_account_id,
        profit_center_id,
        cost_center_id,
        product_id,
        customer_id,
        period,
        CASE 
          WHEN revenue_aed > 0 THEN revenue_aed
          WHEN total_cost_aed > 0 THEN total_cost_aed
          ELSE 0
        END as actual_amount,
        CASE 
          WHEN revenue_aed > 0 THEN 'REVENUE'
          WHEN total_cost_aed > 0 THEN 'COST'
          ELSE 'OTHER'
        END as amount_type
      FROM fact_profitability_v2
      WHERE org_id = p_organization_id
        AND period >= to_char(now() - interval '3 months', 'YYYY-MM')
        AND period < v_current_period
        AND (revenue_aed > 0 OR total_cost_aed > 0)
    ),
    trend_analysis AS (
      SELECT 
        gl_account_id,
        profit_center_id,
        amount_type,
        COUNT(*) as data_points,
        AVG(actual_amount) as avg_amount,
        STDDEV(actual_amount) as stddev_amount,
        -- Simple linear trend calculation
        CASE 
          WHEN COUNT(*) >= 3 THEN
            -- Approximate trend using first and last values
            (MAX(CASE WHEN period = (SELECT MAX(period) FROM recent_performance rp2 WHERE rp2.gl_account_id = rp.gl_account_id) THEN actual_amount END) -
             MIN(CASE WHEN period = (SELECT MIN(period) FROM recent_performance rp2 WHERE rp2.gl_account_id = rp.gl_account_id) THEN actual_amount END)) /
            NULLIF(MIN(CASE WHEN period = (SELECT MIN(period) FROM recent_performance rp2 WHERE rp2.gl_account_id = rp.gl_account_id) THEN actual_amount END), 0)
          ELSE 0
        END as trend_factor
      FROM recent_performance rp
      GROUP BY gl_account_id, profit_center_id, amount_type
      HAVING COUNT(*) >= 2
    )
    SELECT jsonb_build_object(
      'analysis_period', to_char(now() - interval '3 months', 'YYYY-MM') || ' to ' || v_current_period,
      'trends_identified', COUNT(*),
      'avg_trend_factor', AVG(ta.trend_factor),
      'strong_trends', COUNT(CASE WHEN ABS(ta.trend_factor) > 0.1 THEN 1 END),
      'trend_details', jsonb_agg(ta.*)
    ) INTO v_trend_analysis
    FROM trend_analysis ta;

    -- ============================================================================
    -- 3) Refresh Plan Lines with Updated Forecasts
    -- ============================================================================
    
    -- Process each existing plan line and create refreshed version
    FOR rec IN
      WITH existing_plan_lines AS (
        SELECT 
          utl.id as original_line_id,
          utl.line_type,
          utl.line_entity_id as gl_account_id,
          utl.line_amount as original_amount,
          utl.metadata->>'period' as period,
          utl.metadata->>'profit_center_id' as profit_center_id,
          utl.metadata->>'cost_center_id' as cost_center_id,
          utl.metadata->>'product_id' as product_id,
          utl.metadata->>'customer_id' as customer_id,
          utl.metadata->>'driver_basis' as driver_basis,
          utl.metadata
        FROM universal_transaction_lines utl
        JOIN universal_transactions ut ON ut.id = utl.transaction_id
        WHERE ut.organization_id = p_organization_id
          AND ut.transaction_type = 'PLAN_GENERATION'
          AND ut.metadata->>'plan_entity_id' = p_plan_id::text
          AND utl.metadata->>'period' >= v_refresh_start_period
          AND utl.line_type IN ('PLAN_LINE_REVENUE', 'PLAN_LINE_COST')
      ),
      -- Get latest actuals for trend calculation
      latest_actuals AS (
        SELECT 
          gl_account_id,
          profit_center_id,
          cost_center_id,
          product_id,
          customer_id,
          AVG(CASE WHEN revenue_aed > 0 THEN revenue_aed ELSE total_cost_aed END) as recent_avg,
          COUNT(*) as actual_months
        FROM fact_profitability_v2
        WHERE org_id = p_organization_id
          AND period >= to_char(now() - interval '3 months', 'YYYY-MM')
          AND period < v_current_period
          AND (revenue_aed > 0 OR total_cost_aed > 0)
        GROUP BY gl_account_id, profit_center_id, cost_center_id, product_id, customer_id
      ),
      -- Apply AI adjustments from trend analysis
      trend_adjustments AS (
        SELECT 
          epl.*,
          COALESCE(la.recent_avg, epl.original_amount) as baseline_amount,
          COALESCE(la.actual_months, 0) as data_quality_months,
          -- Apply trend factor if AI adjustments enabled
          CASE 
            WHEN p_include_ai_adjustments AND la.recent_avg IS NOT NULL THEN
              epl.original_amount * (1 + COALESCE(
                (SELECT trend_factor FROM jsonb_to_recordset(v_trend_analysis->'trend_details') 
                 AS x(gl_account_id TEXT, profit_center_id TEXT, amount_type TEXT, trend_factor DECIMAL)
                 WHERE x.gl_account_id = epl.gl_account_id::text 
                   AND x.profit_center_id = epl.profit_center_id
                   AND ((epl.line_type = 'PLAN_LINE_REVENUE' AND x.amount_type = 'REVENUE') 
                     OR (epl.line_type = 'PLAN_LINE_COST' AND x.amount_type = 'COST'))
                 LIMIT 1), 0) * 0.5  -- Apply 50% of trend factor for conservative adjustment
              )
            ELSE epl.original_amount
          END as adjusted_amount
        FROM existing_plan_lines epl
        LEFT JOIN latest_actuals la ON 
          la.gl_account_id = epl.gl_account_id AND
          la.profit_center_id = epl.profit_center_id AND
          la.cost_center_id = epl.cost_center_id AND
          la.product_id = epl.product_id AND
          la.customer_id = epl.customer_id
      )
      SELECT 
        ta.*,
        ta.adjusted_amount - ta.original_amount as change_amount,
        CASE 
          WHEN ta.original_amount > 0 THEN 
            ROUND(((ta.adjusted_amount - ta.original_amount) / ta.original_amount) * 100, 2)
          ELSE 0
        END as change_pct,
        CASE 
          WHEN ABS(CASE 
            WHEN ta.original_amount > 0 THEN ((ta.adjusted_amount - ta.original_amount) / ta.original_amount) * 100
            ELSE 0
          END) > p_auto_approve_threshold_pct THEN true
          ELSE false
        END as is_significant_change
      FROM trend_adjustments ta
    LOOP
    
      v_lines_refreshed := v_lines_refreshed + 1;
      
      IF rec.is_significant_change THEN
        v_significant_changes := v_significant_changes + 1;
      END IF;
      
      IF rec.adjusted_amount != rec.original_amount THEN
        v_ai_adjustments_applied := v_ai_adjustments_applied + 1;
      END IF;

      -- Insert refreshed plan line (only if not dry run)
      IF NOT p_dry_run THEN
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
          v_refresh_run_id,
          v_lines_refreshed,
          'PLAN_LINE_REFRESHED',
          rec.gl_account_id,
          1,
          rec.adjusted_amount,
          rec.adjusted_amount,
          'AED',
          'HERA.PLAN.REFRESH.LINE.V3',
          rec.metadata || jsonb_build_object(
            'original_line_id', rec.original_line_id,
            'original_amount', rec.original_amount,
            'adjusted_amount', rec.adjusted_amount,
            'change_amount', rec.change_amount,
            'change_pct', rec.change_pct,
            'is_significant_change', rec.is_significant_change,
            'baseline_amount', rec.baseline_amount,
            'data_quality_months', rec.data_quality_months,
            'refresh_period', v_refresh_start_period || ' to ' || v_refresh_end_period,
            'ai_adjustments_enabled', p_include_ai_adjustments,
            'trend_applied', CASE WHEN rec.adjusted_amount != rec.original_amount THEN true ELSE false END
          ),
          now(),
          now()
        );
      END IF;
      
    END LOOP;

    -- ============================================================================
    -- 4) Apply Policy Checks & Approval Logic
    -- ============================================================================
    
    -- Check if approval required based on significant changes
    v_approval_required := CASE 
      WHEN v_significant_changes > 0 THEN true
      WHEN (v_ai_adjustments_applied::decimal / NULLIF(v_lines_refreshed, 0)) > 0.3 THEN true  -- >30% lines changed
      ELSE false
    END;

    v_policy_checks := jsonb_build_object(
      'significant_changes', v_significant_changes,
      'ai_adjustments_applied', v_ai_adjustments_applied,
      'total_lines_refreshed', v_lines_refreshed,
      'adjustment_percentage', ROUND((v_ai_adjustments_applied::decimal / NULLIF(v_lines_refreshed, 0)) * 100, 1),
      'approval_required', v_approval_required,
      'auto_approve_threshold_pct', p_auto_approve_threshold_pct,
      'policy_compliance', CASE 
        WHEN v_approval_required THEN 'REQUIRES_APPROVAL'
        ELSE 'AUTO_APPROVED'
      END
    );

    -- ============================================================================
    -- 5) Update Plan Entity Status
    -- ============================================================================
    
    IF NOT p_dry_run THEN
      UPDATE core_entities 
      SET 
        metadata = metadata || jsonb_build_object(
          'last_refresh_date', now(),
          'refresh_run_id', v_refresh_run_id,
          'status', CASE WHEN v_approval_required THEN 'PENDING_APPROVAL' ELSE 'REFRESHED' END,
          'lines_refreshed', v_lines_refreshed,
          'significant_changes', v_significant_changes
        ),
        updated_at = now()
      WHERE id = p_plan_id;
    END IF;

    -- ============================================================================
    -- 6) Generate Refresh Summary
    -- ============================================================================
    
    v_refresh_summary := jsonb_build_object(
      'refresh_period_start', v_refresh_start_period,
      'refresh_period_end', v_refresh_end_period,
      'original_plan_type', v_original_plan_type,
      'lines_refreshed', v_lines_refreshed,
      'significant_changes', v_significant_changes,
      'ai_adjustments_applied', v_ai_adjustments_applied,
      'approval_required', v_approval_required,
      'trend_analysis', v_trend_analysis,
      'policy_checks', v_policy_checks,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
      'refresh_quality', CASE 
        WHEN v_lines_refreshed > 100 THEN 'HIGH'
        WHEN v_lines_refreshed > 20 THEN 'MEDIUM'
        ELSE 'LOW'
      END
    );

    -- ============================================================================
    -- 7) Create Refresh Transaction Header
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
      v_refresh_run_id,
      p_organization_id,
      'PLAN_REFRESH',
      'REFRESH-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(v_refresh_run_id::text, 1, 8),
      now(),
      (SELECT COALESCE(SUM(line_amount), 0) FROM universal_transaction_lines WHERE transaction_id = v_refresh_run_id),
      'AED',
      CASE 
        WHEN p_dry_run THEN 'DRY_RUN'
        WHEN v_approval_required THEN 'PENDING_APPROVAL'
        ELSE 'COMPLETED'
      END,
      'HERA.PLAN.REFRESH.RUN.V3',
      jsonb_build_object(
        'plan_id', p_plan_id,
        'original_plan_type', v_original_plan_type,
        'refresh_summary', v_refresh_summary,
        'actor_entity_id', p_actor_entity_id,
        'dry_run', p_dry_run,
        'include_ai_adjustments', p_include_ai_adjustments,
        'auto_approve_threshold_pct', p_auto_approve_threshold_pct
      ),
      now(),
      now()
    );

    -- ============================================================================
    -- 8) Return Refresh Results
    -- ============================================================================
    
    RETURN jsonb_build_object(
      'success', true,
      'refresh_run_id', v_refresh_run_id,
      'plan_id', p_plan_id,
      'refresh_summary', v_refresh_summary,
      'approval_required', v_approval_required,
      'dry_run', p_dry_run,
      'smart_code', 'HERA.PLAN.REFRESH.RUN.V3'
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
      v_refresh_run_id,
      p_organization_id,
      'PLAN_REFRESH',
      'REFRESH-ERROR-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      now(),
      'FAILED',
      'HERA.PLAN.REFRESH.ERROR.V3',
      jsonb_build_object(
        'error_code', v_error_code,
        'error_message', v_error_message,
        'plan_id', p_plan_id,
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
      'refresh_run_id', v_refresh_run_id,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)
    );

  END;

END;
$$;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION hera_plan_refresh_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_plan_refresh_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_plan_refresh_v3 IS 'HERA Finance DNA v3.3: Refresh rolling forecasts with latest actuals and AI-driven trend adjustments. Maintains continuous forward-looking financial plans with automated policy compliance and approval workflows.';