-- ============================================================================
-- HERA Finance DNA v3.3: Dynamic Planning & Forecasting Engine
-- 
-- Core RPC function for generating budgets and forecasts from AI insights
-- and driver-based planning policies. Transforms predictive insights into
-- rolling financial plans with complete audit trail.
-- 
-- Smart Code: HERA.PLAN.GENERATE.FUNCTION.V3
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_plan_generate_v3(
  p_organization_id UUID,
  p_actor_entity_id UUID DEFAULT NULL,
  p_plan_metadata JSONB DEFAULT '{}',
  p_plan_type TEXT DEFAULT 'FORECAST',  -- 'BUDGET' | 'FORECAST' | 'ROLLING_FORECAST'
  p_horizon_months INTEGER DEFAULT 12,
  p_driver_policy JSONB DEFAULT NULL,
  p_dry_run BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_run_id UUID;
  v_plan_entity_id UUID;
  v_start_time TIMESTAMP := clock_timestamp();
  v_processing_metrics JSONB := '{}';
  v_plan_lines_generated INTEGER := 0;
  v_drivers_applied INTEGER := 0;
  v_ai_insights_used INTEGER := 0;
  v_forecast_accuracy DECIMAL := 0.0;
  v_variance_guardrails JSONB := '{}';
  v_approval_required BOOLEAN := false;
  v_error_code TEXT := NULL;
  v_error_message TEXT := NULL;
  v_period_start TEXT;
  v_period_end TEXT;
  v_plan_version INTEGER := 1;
  v_driver_data JSONB := '{}';
  v_ai_features JSONB := '{}';
  v_policy_violations JSONB := '[]';
  rec RECORD;
BEGIN

  -- ============================================================================
  -- 1) Input Validation & Setup
  -- ============================================================================
  
  -- Calculate planning periods
  v_period_start := to_char(date_trunc('month', now()), 'YYYY-MM');
  v_period_end := to_char(date_trunc('month', now()) + interval '1 month' * (p_horizon_months - 1), 'YYYY-MM');
  
  -- Generate run ID
  v_run_id := gen_random_uuid();
  
  -- Determine plan version (increment if plan exists for period)
  SELECT COALESCE(MAX((metadata->>'version')::integer), 0) + 1
  INTO v_plan_version
  FROM core_entities
  WHERE organization_id = p_organization_id
    AND entity_type = 'PLAN_VERSION'
    AND metadata->>'plan_type' = p_plan_type
    AND metadata->>'period_start' = v_period_start;

  BEGIN
  
    -- ============================================================================
    -- 2) Create Plan Version Entity
    -- ============================================================================
    
    INSERT INTO core_entities (
      id,
      organization_id,
      entity_type,
      entity_name,
      entity_code,
      smart_code,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      p_organization_id,
      'PLAN_VERSION',
      p_plan_type || ' ' || v_period_start || ' v' || v_plan_version,
      'PLAN-' || UPPER(p_plan_type) || '-' || v_period_start || '-V' || v_plan_version,
      'HERA.PLAN.ENTITY.PLAN_VERSION.V3',
      jsonb_build_object(
        'plan_type', p_plan_type,
        'version', v_plan_version,
        'period_start', v_period_start,
        'period_end', v_period_end,
        'horizon_months', p_horizon_months,
        'status', 'DRAFT',
        'created_by', p_actor_entity_id,
        'driver_policy', COALESCE(p_driver_policy, '{}'),
        'ai_model_version', 'v3.3'
      ) || COALESCE(p_plan_metadata, '{}'),
      now(),
      now()
    ) RETURNING id INTO v_plan_entity_id;

    -- ============================================================================
    -- 3) Extract Planning Drivers from Historical Data
    -- ============================================================================
    
    -- Get revenue drivers from profitability facts
    WITH revenue_drivers AS (
      SELECT 
        profit_center_id,
        product_id,
        AVG(CASE WHEN revenue_aed > 0 THEN revenue_aed / NULLIF(quantity, 0) END) as avg_price_per_unit,
        AVG(quantity) as avg_volume,
        AVG(gross_margin_pct) as avg_margin_pct,
        COUNT(*) as data_points,
        MAX(period) as latest_period
      FROM fact_profitability_v2
      WHERE org_id = p_organization_id
        AND period >= to_char(now() - interval '12 months', 'YYYY-MM')
        AND revenue_aed > 0
      GROUP BY profit_center_id, product_id
      HAVING COUNT(*) >= 3  -- Need at least 3 months of data
    ),
    cost_drivers AS (
      SELECT 
        cost_center_id,
        AVG(total_cost_aed) as avg_monthly_cost,
        AVG(CASE WHEN revenue_aed > 0 THEN total_cost_aed / revenue_aed END) as cost_ratio,
        COUNT(*) as data_points
      FROM fact_profitability_v2
      WHERE org_id = p_organization_id
        AND period >= to_char(now() - interval '12 months', 'YYYY-MM')
        AND total_cost_aed > 0
      GROUP BY cost_center_id
      HAVING COUNT(*) >= 3
    )
    SELECT jsonb_build_object(
      'revenue_drivers', jsonb_agg(rd.*),
      'cost_drivers', jsonb_agg(cd.*)
    ) INTO v_driver_data
    FROM revenue_drivers rd
    FULL OUTER JOIN cost_drivers cd ON TRUE;

    v_drivers_applied := jsonb_array_length(COALESCE(v_driver_data->'revenue_drivers', '[]')) + 
                        jsonb_array_length(COALESCE(v_driver_data->'cost_drivers', '[]'));

    -- ============================================================================
    -- 4) Integrate AI Insights for Predictive Planning
    -- ============================================================================
    
    -- Get recent AI insights for planning context
    WITH recent_insights AS (
      SELECT 
        utl.metadata,
        utl.line_type,
        ut.metadata as run_metadata
      FROM universal_transaction_lines utl
      JOIN universal_transactions ut ON ut.id = utl.transaction_id
      WHERE ut.organization_id = p_organization_id
        AND ut.transaction_type = 'AI_INSIGHT_RUN'
        AND ut.smart_code = 'HERA.AI.INSIGHT.RUN.V3'
        AND ut.created_at >= now() - interval '30 days'
        AND utl.line_type IN ('AI_INSIGHT_PREDICTIVE', 'AI_INSIGHT_PRESCRIPTIVE')
        AND (utl.metadata->>'confidence_score')::decimal >= 0.7
    )
    SELECT jsonb_build_object(
      'insights_count', COUNT(*),
      'avg_confidence', AVG((metadata->>'confidence_score')::decimal),
      'insights_data', jsonb_agg(metadata)
    ) INTO v_ai_features
    FROM recent_insights;

    v_ai_insights_used := COALESCE((v_ai_features->>'insights_count')::integer, 0);

    -- ============================================================================
    -- 5) Generate Plan Lines for Each Period × Dimension
    -- ============================================================================
    
    -- Create plan lines for all GL accounts × dimensions × periods
    FOR rec IN 
      WITH plan_periods AS (
        SELECT generate_series(
          date_trunc('month', now()),
          date_trunc('month', now()) + interval '1 month' * (p_horizon_months - 1),
          '1 month'::interval
        )::date as period_date
      ),
      planning_dimensions AS (
        SELECT DISTINCT
          fp.gl_account_id,
          fp.profit_center_id,
          fp.cost_center_id,
          fp.product_id,
          fp.customer_id,
          AVG(fp.revenue_aed) as baseline_revenue,
          AVG(fp.total_cost_aed) as baseline_cost,
          AVG(fp.gross_margin_pct) as baseline_margin,
          COUNT(*) as historical_months
        FROM fact_profitability_v2 fp
        WHERE fp.org_id = p_organization_id
          AND fp.period >= to_char(now() - interval '6 months', 'YYYY-MM')
        GROUP BY gl_account_id, profit_center_id, cost_center_id, product_id, customer_id
        HAVING COUNT(*) >= 2  -- Need at least 2 months history
      )
      SELECT 
        pp.period_date,
        to_char(pp.period_date, 'YYYY-MM') as period_str,
        pd.*,
        -- Apply growth/adjustment factors from AI insights
        CASE 
          WHEN pd.baseline_revenue > 0 THEN 
            pd.baseline_revenue * (1 + COALESCE((v_ai_features->'growth_factor')::decimal, 0.05))
          ELSE 0
        END as forecasted_revenue,
        CASE 
          WHEN pd.baseline_cost > 0 THEN 
            pd.baseline_cost * (1 + COALESCE((v_ai_features->'cost_inflation')::decimal, 0.03))
          ELSE 0
        END as forecasted_cost
      FROM plan_periods pp
      CROSS JOIN planning_dimensions pd
    LOOP
      
      -- Insert revenue plan line
      IF rec.forecasted_revenue > 0 THEN
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
          v_run_id,
          v_plan_lines_generated + 1,
          'PLAN_LINE_REVENUE',
          rec.gl_account_id,
          1,
          rec.forecasted_revenue,
          rec.forecasted_revenue,
          'AED',
          'HERA.PLAN.BUDGET.LINE.V3',
          jsonb_build_object(
            'period', rec.period_str,
            'plan_type', p_plan_type,
            'gl_account_id', rec.gl_account_id,
            'profit_center_id', rec.profit_center_id,
            'cost_center_id', rec.cost_center_id,
            'product_id', rec.product_id,
            'customer_id', rec.customer_id,
            'baseline_amount', rec.baseline_revenue,
            'adjustment_factor', COALESCE((v_ai_features->'growth_factor')::decimal, 0.05),
            'data_quality', CASE WHEN rec.historical_months >= 6 THEN 'HIGH' ELSE 'MEDIUM' END,
            'driver_basis', 'HISTORICAL_TREND_AI_ADJUSTED'
          ),
          now(),
          now()
        );
        
        v_plan_lines_generated := v_plan_lines_generated + 1;
      END IF;

      -- Insert cost plan line  
      IF rec.forecasted_cost > 0 THEN
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
          v_run_id,
          v_plan_lines_generated + 1,
          'PLAN_LINE_COST',
          rec.gl_account_id,
          1,
          rec.forecasted_cost,
          rec.forecasted_cost,
          'AED',
          'HERA.PLAN.BUDGET.LINE.V3',
          jsonb_build_object(
            'period', rec.period_str,
            'plan_type', p_plan_type,
            'gl_account_id', rec.gl_account_id,
            'profit_center_id', rec.profit_center_id,
            'cost_center_id', rec.cost_center_id,
            'product_id', rec.product_id,
            'customer_id', rec.customer_id,
            'baseline_amount', rec.baseline_cost,
            'adjustment_factor', COALESCE((v_ai_features->'cost_inflation')::decimal, 0.03),
            'data_quality', CASE WHEN rec.historical_months >= 6 THEN 'HIGH' ELSE 'MEDIUM' END,
            'driver_basis', 'HISTORICAL_COST_AI_ADJUSTED'
          ),
          now(),
          now()
        );
        
        v_plan_lines_generated := v_plan_lines_generated + 1;
      END IF;
      
    END LOOP;

    -- ============================================================================
    -- 6) Apply Variance Guardrails & Policy Validation
    -- ============================================================================
    
    -- Check variance guardrails (revenue growth > 50% = warning)
    WITH variance_check AS (
      SELECT 
        COUNT(CASE WHEN (metadata->>'adjustment_factor')::decimal > 0.5 THEN 1 END) as high_variance_lines,
        AVG((metadata->>'adjustment_factor')::decimal) as avg_adjustment,
        MAX((metadata->>'adjustment_factor')::decimal) as max_adjustment
      FROM universal_transaction_lines 
      WHERE transaction_id = v_run_id
    )
    SELECT jsonb_build_object(
      'high_variance_lines', vc.high_variance_lines,
      'avg_adjustment_pct', ROUND(vc.avg_adjustment * 100, 2),
      'max_adjustment_pct', ROUND(vc.max_adjustment * 100, 2),
      'approval_required', CASE WHEN vc.max_adjustment > 0.25 THEN true ELSE false END
    ) INTO v_variance_guardrails
    FROM variance_check vc;

    v_approval_required := (v_variance_guardrails->>'approval_required')::boolean;

    -- ============================================================================
    -- 7) Calculate Forecast Accuracy (if historical data available)
    -- ============================================================================
    
    -- Compare previous forecast to actual results
    WITH forecast_accuracy AS (
      SELECT 
        AVG(ABS(
          COALESCE((utl.metadata->>'baseline_amount')::decimal, 0) - 
          COALESCE(fp.revenue_aed, 0)
        ) / NULLIF(COALESCE(fp.revenue_aed, 0), 0)) as mape
      FROM universal_transaction_lines utl
      JOIN universal_transactions ut ON ut.id = utl.transaction_id
      LEFT JOIN fact_profitability_v2 fp ON 
        fp.org_id = p_organization_id AND
        fp.period = utl.metadata->>'period' AND
        fp.gl_account_id = utl.line_entity_id
      WHERE ut.organization_id = p_organization_id
        AND ut.transaction_type = 'PLAN_GENERATION'
        AND utl.line_type = 'PLAN_LINE_REVENUE'
        AND ut.created_at >= now() - interval '6 months'
        AND fp.revenue_aed IS NOT NULL
    )
    SELECT COALESCE(fa.mape, 0.0) INTO v_forecast_accuracy FROM forecast_accuracy fa;

    -- ============================================================================
    -- 8) Create Audit Transaction Header
    -- ============================================================================
    
    v_processing_metrics := jsonb_build_object(
      'total_processing_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
      'plan_lines_generated', v_plan_lines_generated,
      'drivers_applied', v_drivers_applied,
      'ai_insights_used', v_ai_insights_used,
      'forecast_accuracy_mape', ROUND(v_forecast_accuracy, 4),
      'approval_required', v_approval_required,
      'plan_version', v_plan_version
    );

    -- Insert transaction header for audit trail
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
      v_run_id,
      p_organization_id,
      'PLAN_GENERATION',
      'PLAN-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(v_run_id::text, 1, 8),
      now(),
      (SELECT COALESCE(SUM(line_amount), 0) FROM universal_transaction_lines WHERE transaction_id = v_run_id),
      'AED',
      CASE WHEN p_dry_run THEN 'DRY_RUN' ELSE 'COMPLETED' END,
      'HERA.PLAN.GENERATE.RUN.V3',
      jsonb_build_object(
        'plan_type', p_plan_type,
        'plan_entity_id', v_plan_entity_id,
        'period_start', v_period_start,
        'period_end', v_period_end,
        'horizon_months', p_horizon_months,
        'processing_metrics', v_processing_metrics,
        'driver_data', v_driver_data,
        'ai_features', v_ai_features,
        'variance_guardrails', v_variance_guardrails,
        'policy_violations', v_policy_violations,
        'actor_entity_id', p_actor_entity_id,
        'dry_run', p_dry_run
      ),
      now(),
      now()
    );

    -- ============================================================================
    -- 9) Return Success Result
    -- ============================================================================
    
    RETURN jsonb_build_object(
      'success', true,
      'run_id', v_run_id,
      'plan_entity_id', v_plan_entity_id,
      'plan_type', p_plan_type,
      'plan_version', v_plan_version,
      'period_start', v_period_start,
      'period_end', v_period_end,
      'plan_lines_generated', v_plan_lines_generated,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time),
      'drivers_applied', v_drivers_applied,
      'ai_insights_used', v_ai_insights_used,
      'forecast_accuracy_mape', ROUND(v_forecast_accuracy, 4),
      'approval_required', v_approval_required,
      'variance_guardrails', v_variance_guardrails,
      'smart_code', 'HERA.PLAN.GENERATE.RUN.V3'
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
      v_run_id,
      p_organization_id,
      'PLAN_GENERATION',
      'PLAN-ERROR-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
      now(),
      'FAILED',
      'HERA.PLAN.GENERATE.ERROR.V3',
      jsonb_build_object(
        'error_code', v_error_code,
        'error_message', v_error_message,
        'plan_type', p_plan_type,
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
      'run_id', v_run_id,
      'processing_time_ms', EXTRACT(milliseconds FROM clock_timestamp() - v_start_time)
    );

  END;

END;
$$;

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- Index for plan line queries by period and dimensions
CREATE INDEX IF NOT EXISTS idx_utl_plan_lines_period_dims 
ON universal_transaction_lines (
  (metadata->>'period'),
  (metadata->>'gl_account_id'),
  (metadata->>'profit_center_id')
) 
WHERE line_type IN ('PLAN_LINE_REVENUE', 'PLAN_LINE_COST');

-- Index for plan generation audit queries
CREATE INDEX IF NOT EXISTS idx_ut_plan_generation 
ON universal_transactions (organization_id, transaction_type, created_at DESC)
WHERE transaction_type = 'PLAN_GENERATION';

-- ============================================================================
-- Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION hera_plan_generate_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_plan_generate_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON FUNCTION hera_plan_generate_v3 IS 'HERA Finance DNA v3.3: Generate dynamic budgets and forecasts from AI insights and driver-based planning policies. Transforms predictive insights into rolling financial plans with complete audit trail using the sacred six-table architecture.';