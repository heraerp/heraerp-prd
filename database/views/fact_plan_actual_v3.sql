-- ============================================================================
-- HERA Finance DNA v3.3: Plan vs Actual Analysis Materialized View
-- 
-- Unified view combining budgets, forecasts, actuals, and variance analysis
-- for real-time financial performance monitoring and AI-driven insights.
-- 
-- Smart Code: HERA.PLAN.FACT.PLAN_ACTUAL.V3
-- ============================================================================

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS fact_plan_actual_v3;

-- Create the materialized view
CREATE MATERIALIZED VIEW fact_plan_actual_v3 AS
WITH plan_data AS (
  -- Extract all plan lines (budget and forecast)
  SELECT 
    ut.organization_id as org_id,
    ut.metadata->>'plan_entity_id' as plan_entity_id,
    (SELECT metadata->>'plan_type' FROM core_entities WHERE id = (ut.metadata->>'plan_entity_id')::uuid) as plan_type,
    (SELECT metadata->>'version' FROM core_entities WHERE id = (ut.metadata->>'plan_entity_id')::uuid) as plan_version,
    utl.metadata->>'period' as period,
    utl.line_entity_id as gl_account_id,
    utl.metadata->>'profit_center_id' as profit_center_id,
    utl.metadata->>'cost_center_id' as cost_center_id,
    utl.metadata->>'product_id' as product_id,
    utl.metadata->>'customer_id' as customer_id,
    utl.line_type,
    utl.line_amount as plan_amount,
    utl.metadata->>'driver_basis' as driver_basis,
    utl.metadata->>'data_quality' as data_quality,
    ut.created_at as plan_created_at,
    ut.status as plan_status
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
  WHERE ut.transaction_type = 'PLAN_GENERATION'
    AND ut.smart_code = 'HERA.PLAN.GENERATE.RUN.V3'
    AND utl.line_type IN ('PLAN_LINE_REVENUE', 'PLAN_LINE_COST', 'PLAN_LINE_REFRESHED')
    AND ut.status = 'COMPLETED'
),
actual_data AS (
  -- Get actual financial data from profitability facts
  SELECT 
    fp.org_id,
    fp.period,
    fp.gl_account_id,
    fp.profit_center_id,
    fp.cost_center_id,
    fp.product_id,
    fp.customer_id,
    CASE 
      WHEN fp.revenue_aed > 0 THEN fp.revenue_aed
      WHEN fp.total_cost_aed > 0 THEN fp.total_cost_aed
      ELSE 0
    END as actual_amount,
    CASE 
      WHEN fp.revenue_aed > 0 THEN 'PLAN_LINE_REVENUE'
      WHEN fp.total_cost_aed > 0 THEN 'PLAN_LINE_COST'
      ELSE 'UNKNOWN'
    END as actual_type,
    fp.gross_margin_aed,
    fp.gross_margin_pct,
    fp.quantity,
    fp.unit_cost_aed,
    fp.last_updated as actual_last_updated
  FROM fact_profitability_v2 fp
  WHERE fp.revenue_aed > 0 OR fp.total_cost_aed > 0
),
variance_data AS (
  -- Get variance analysis results
  SELECT 
    ut.organization_id as org_id,
    ut.metadata->>'plan_id' as plan_entity_id,
    ut.metadata->>'actual_period' as period,
    utl.metadata->>'gl_account_id' as gl_account_id,
    utl.metadata->>'profit_center_id' as profit_center_id,
    utl.metadata->>'cost_center_id' as cost_center_id,
    utl.metadata->>'product_id' as product_id,
    utl.metadata->>'customer_id' as customer_id,
    (utl.metadata->>'variance_amount')::decimal as variance_amount,
    (utl.metadata->>'variance_pct')::decimal as variance_pct,
    (utl.metadata->>'is_significant')::boolean as is_significant_variance,
    ut.created_at as variance_analysis_date
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON ut.id = utl.transaction_id
  WHERE ut.transaction_type = 'VARIANCE_ANALYSIS'
    AND ut.smart_code = 'HERA.PLAN.VARIANCE.RUN.V3'
    AND utl.line_type = 'VARIANCE_LINE'
    AND ut.status = 'COMPLETED'
),
dimension_enrichment AS (
  -- Add dimensional context
  SELECT 
    ce_gl.entity_name as gl_account_name,
    ce_gl.entity_code as gl_account_code,
    ce_gl.metadata->>'account_type' as account_type,
    ce_gl.metadata->>'ifrs_classification' as ifrs_classification,
    ce_pc.entity_name as profit_center_name,
    ce_cc.entity_name as cost_center_name,
    ce_prod.entity_name as product_name,
    ce_cust.entity_name as customer_name,
    pd.org_id,
    pd.plan_entity_id,
    pd.plan_type,
    pd.plan_version,
    pd.period,
    pd.gl_account_id,
    pd.profit_center_id,
    pd.cost_center_id,
    pd.product_id,
    pd.customer_id,
    pd.line_type,
    pd.plan_amount,
    pd.driver_basis,
    pd.data_quality,
    pd.plan_created_at,
    pd.plan_status
  FROM plan_data pd
  LEFT JOIN core_entities ce_gl ON ce_gl.id = pd.gl_account_id::uuid
  LEFT JOIN core_entities ce_pc ON ce_pc.id = pd.profit_center_id::uuid
  LEFT JOIN core_entities ce_cc ON ce_cc.id = pd.cost_center_id::uuid
  LEFT JOIN core_entities ce_prod ON ce_prod.id = pd.product_id::uuid
  LEFT JOIN core_entities ce_cust ON ce_cust.id = pd.customer_id::uuid
)
-- Final unified fact table
SELECT 
  -- Primary Keys & Identifiers
  de.org_id,
  de.plan_entity_id,
  de.period,
  de.gl_account_id,
  de.profit_center_id,
  de.cost_center_id,
  de.product_id,
  de.customer_id,
  
  -- Plan Attributes
  de.plan_type,
  de.plan_version,
  de.line_type,
  de.driver_basis,
  de.data_quality,
  de.plan_status,
  de.plan_created_at,
  
  -- Dimensional Information
  de.gl_account_name,
  de.gl_account_code,
  de.account_type,
  de.ifrs_classification,
  de.profit_center_name,
  de.cost_center_name,
  de.product_name,
  de.customer_name,
  
  -- Financial Amounts
  COALESCE(de.plan_amount, 0) as plan_amount,
  COALESCE(ad.actual_amount, 0) as actual_amount,
  COALESCE(vd.variance_amount, de.plan_amount - COALESCE(ad.actual_amount, 0)) as variance_amount,
  
  -- Variance Analysis
  COALESCE(vd.variance_pct, 
    CASE 
      WHEN de.plan_amount > 0 THEN 
        ROUND(((de.plan_amount - COALESCE(ad.actual_amount, 0)) / de.plan_amount) * 100, 2)
      ELSE 0
    END
  ) as variance_pct,
  
  COALESCE(vd.is_significant_variance, 
    ABS(COALESCE(vd.variance_pct, 
      CASE 
        WHEN de.plan_amount > 0 THEN ((de.plan_amount - COALESCE(ad.actual_amount, 0)) / de.plan_amount) * 100
        ELSE 0
      END
    )) > 5
  ) as is_significant_variance,
  
  -- Performance Ratios
  CASE 
    WHEN de.line_type = 'PLAN_LINE_REVENUE' AND de.plan_amount > 0 THEN
      ROUND((COALESCE(ad.actual_amount, 0) / de.plan_amount) * 100, 2)
    ELSE NULL
  END as revenue_achievement_pct,
  
  CASE 
    WHEN de.line_type = 'PLAN_LINE_COST' AND de.plan_amount > 0 THEN
      ROUND((COALESCE(ad.actual_amount, 0) / de.plan_amount) * 100, 2)
    ELSE NULL
  END as cost_efficiency_pct,
  
  -- Profitability Metrics
  ad.gross_margin_aed,
  ad.gross_margin_pct,
  ad.quantity,
  ad.unit_cost_aed,
  
  -- Data Quality & Freshness
  CASE 
    WHEN ad.actual_amount IS NULL THEN 'NO_ACTUAL'
    WHEN de.data_quality = 'HIGH' THEN 'HIGH'
    WHEN de.data_quality = 'MEDIUM' THEN 'MEDIUM'
    ELSE 'LOW'
  END as analysis_quality,
  
  ad.actual_last_updated,
  vd.variance_analysis_date,
  
  -- Categorization
  CASE 
    WHEN de.line_type = 'PLAN_LINE_REVENUE' THEN 'REVENUE'
    WHEN de.line_type = 'PLAN_LINE_COST' THEN 'COST'
    ELSE 'OTHER'
  END as financial_category,
  
  CASE 
    WHEN COALESCE(vd.variance_pct, 0) > 10 THEN 'FAVORABLE'
    WHEN COALESCE(vd.variance_pct, 0) < -10 THEN 'UNFAVORABLE' 
    ELSE 'ON_TRACK'
  END as variance_category,
  
  -- Time Attributes
  EXTRACT(year FROM de.period::date) as period_year,
  EXTRACT(month FROM de.period::date) as period_month,
  EXTRACT(quarter FROM de.period::date) as period_quarter,
  
  -- Update Timestamp
  now() as fact_last_updated

FROM dimension_enrichment de
LEFT JOIN actual_data ad ON 
  ad.org_id = de.org_id AND
  ad.period = de.period AND
  ad.gl_account_id = de.gl_account_id AND
  COALESCE(ad.profit_center_id, '') = COALESCE(de.profit_center_id, '') AND
  COALESCE(ad.cost_center_id, '') = COALESCE(de.cost_center_id, '') AND
  COALESCE(ad.product_id, '') = COALESCE(de.product_id, '') AND
  COALESCE(ad.customer_id, '') = COALESCE(de.customer_id, '') AND
  ad.actual_type = de.line_type
LEFT JOIN variance_data vd ON
  vd.org_id = de.org_id AND
  vd.plan_entity_id = de.plan_entity_id AND
  vd.period = de.period AND
  vd.gl_account_id = de.gl_account_id AND
  COALESCE(vd.profit_center_id, '') = COALESCE(de.profit_center_id, '') AND
  COALESCE(vd.cost_center_id, '') = COALESCE(de.cost_center_id, '') AND
  COALESCE(vd.product_id, '') = COALESCE(de.product_id, '') AND
  COALESCE(vd.customer_id, '') = COALESCE(de.customer_id, '')

-- Add indexes for performance
WHERE de.org_id IS NOT NULL 
  AND de.period IS NOT NULL 
  AND de.gl_account_id IS NOT NULL;

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- Primary organization and period index
CREATE INDEX idx_fact_plan_actual_v3_org_period 
ON fact_plan_actual_v3 (org_id, period);

-- Plan analysis index
CREATE INDEX idx_fact_plan_actual_v3_plan_analysis 
ON fact_plan_actual_v3 (org_id, plan_entity_id, plan_type, period);

-- Financial dimension index
CREATE INDEX idx_fact_plan_actual_v3_financial_dims 
ON fact_plan_actual_v3 (org_id, gl_account_id, profit_center_id, financial_category);

-- Variance analysis index
CREATE INDEX idx_fact_plan_actual_v3_variance 
ON fact_plan_actual_v3 (org_id, is_significant_variance, variance_category, period);

-- Time series analysis index
CREATE INDEX idx_fact_plan_actual_v3_time_series 
ON fact_plan_actual_v3 (org_id, period_year, period_month, gl_account_id);

-- Performance monitoring index
CREATE INDEX idx_fact_plan_actual_v3_performance 
ON fact_plan_actual_v3 (org_id, financial_category, revenue_achievement_pct, cost_efficiency_pct);

-- ============================================================================
-- Refresh Strategy
-- ============================================================================

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_fact_plan_actual_v3()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY fact_plan_actual_v3;
END;
$$;

-- Grant permissions
GRANT SELECT ON fact_plan_actual_v3 TO authenticated;
GRANT SELECT ON fact_plan_actual_v3 TO service_role;
GRANT EXECUTE ON FUNCTION refresh_fact_plan_actual_v3() TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON MATERIALIZED VIEW fact_plan_actual_v3 IS 'HERA Finance DNA v3.3: Unified fact table combining budgets, forecasts, actuals, and variance analysis for real-time financial performance monitoring. Provides complete plan vs actual analysis with dimensional context and AI-driven insights.';

COMMENT ON FUNCTION refresh_fact_plan_actual_v3() IS 'Refreshes the plan vs actual fact table with latest data from universal transactions and profitability facts.';