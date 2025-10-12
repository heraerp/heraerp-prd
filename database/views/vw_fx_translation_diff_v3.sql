-- ============================================================================
-- HERA Finance DNA v3.4: FX Translation Differences View
-- 
-- IFRS 21 compliant view for foreign exchange translation differences analysis
-- with cumulative translation adjustment (CTA) tracking and volatility analysis.
-- 
-- Smart Code: HERA.CONSOL.VIEW.FX_TRANSLATION_DIFF.V3
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS vw_fx_translation_diff_v3 CASCADE;

-- Create FX translation differences view
CREATE VIEW vw_fx_translation_diff_v3 AS
WITH fx_translation_base AS (
  SELECT 
    ut.organization_id as group_org_id,
    ut.metadata->>'group_id'::uuid as group_id,
    ut.metadata->>'period' as period,
    ut.metadata->>'member_entity_id'::uuid as member_entity_id,
    ut.metadata->>'local_currency' as local_currency,
    ut.metadata->>'base_currency' as base_currency,
    ut.metadata->>'translation_method' as translation_method,
    ut.currency as transaction_currency,
    ut.total_amount as total_translation_amount,
    ut.created_at as translation_date,
    -- Extract FX rates from metadata
    (ut.metadata->'fx_rates'->>'avg_rate')::decimal as avg_fx_rate,
    (ut.metadata->'fx_rates'->>'closing_rate')::decimal as closing_fx_rate,
    -- Extract translated amounts breakdown
    (ut.metadata->'amounts_translated'->>'balance_sheet_local')::decimal as balance_sheet_local,
    (ut.metadata->'amounts_translated'->>'balance_sheet_base')::decimal as balance_sheet_base,
    (ut.metadata->'amounts_translated'->>'income_statement_local')::decimal as income_statement_local,
    (ut.metadata->'amounts_translated'->>'income_statement_base')::decimal as income_statement_base,
    (ut.metadata->'amounts_translated'->>'equity_local')::decimal as equity_local,
    (ut.metadata->'amounts_translated'->>'equity_base')::decimal as equity_base,
    (ut.metadata->'amounts_translated'->>'translation_adjustment')::decimal as translation_adjustment,
    -- Transaction details
    ut.transaction_code,
    ut.status,
    ut.id as translation_transaction_id,
    ut.smart_code as translation_smart_code
  FROM universal_transactions ut
  WHERE ut.transaction_type = 'CONSOL_TRANSLATE'
    AND ut.status = 'COMPLETED'
    AND ut.metadata->>'group_id' IS NOT NULL
    AND ut.metadata->>'period' IS NOT NULL
    AND ut.metadata->>'member_entity_id' IS NOT NULL
),
fx_line_details AS (
  SELECT 
    ftb.group_id,
    ftb.period,
    ftb.member_entity_id,
    ftb.local_currency,
    ftb.base_currency,
    ftb.translation_method,
    ftb.avg_fx_rate,
    ftb.closing_fx_rate,
    ftb.translation_date,
    ftb.translation_transaction_id,
    -- Aggregate line-level translation details
    utl.line_type,
    utl.metadata->>'translation_type' as translation_type,
    utl.metadata->>'account_category' as account_category,
    utl.metadata->>'rate_type' as rate_type_used,
    (utl.metadata->>'fx_rate_used')::decimal as line_fx_rate_used,
    (utl.metadata->>'local_amount')::decimal as line_local_amount,
    (utl.metadata->>'base_amount')::decimal as line_base_amount,
    utl.line_amount as line_translation_diff,
    -- Line details
    utl.id as translation_line_id,
    utl.smart_code as line_smart_code
  FROM fx_translation_base ftb
  JOIN universal_transaction_lines utl ON utl.transaction_id = ftb.translation_transaction_id
  WHERE utl.line_type LIKE 'TRANSLATE_%'
),
member_entity_details AS (
  SELECT DISTINCT
    fld.member_entity_id,
    e.entity_name as member_name,
    e.entity_code as member_code,
    e.organization_id as member_org_id,
    -- Extract additional member entity metadata
    COALESCE(
      me_country.field_value_text,
      'UNKNOWN'
    ) as country_code,
    COALESCE(
      me_functional_currency.field_value_text,
      fld.local_currency
    ) as functional_currency,
    COALESCE(
      me_operation_nature.field_value_text,
      'OPERATING'
    ) as operation_nature
  FROM fx_line_details fld
  JOIN core_entities e ON e.id = fld.member_entity_id
  LEFT JOIN core_dynamic_data me_country ON 
    me_country.entity_id = fld.member_entity_id AND 
    me_country.field_name = 'country_code'
  LEFT JOIN core_dynamic_data me_functional_currency ON 
    me_functional_currency.entity_id = fld.member_entity_id AND 
    me_functional_currency.field_name = 'functional_currency'
  LEFT JOIN core_dynamic_data me_operation_nature ON 
    me_operation_nature.entity_id = fld.member_entity_id AND 
    me_operation_nature.field_name = 'operation_nature'
),
translation_summary AS (
  SELECT 
    fld.group_id,
    fld.period,
    fld.member_entity_id,
    fld.local_currency,
    fld.base_currency,
    fld.translation_method,
    fld.avg_fx_rate,
    fld.closing_fx_rate,
    fld.translation_date,
    fld.translation_transaction_id,
    -- Summarize by translation type
    SUM(
      CASE 
        WHEN fld.translation_type = 'BALANCE_SHEET' 
        THEN fld.line_translation_diff 
        ELSE 0 
      END
    ) as balance_sheet_translation_diff,
    SUM(
      CASE 
        WHEN fld.translation_type = 'INCOME_STATEMENT' 
        THEN fld.line_translation_diff 
        ELSE 0 
      END
    ) as income_statement_translation_diff,
    SUM(
      CASE 
        WHEN fld.translation_type = 'CUMULATIVE_TRANSLATION_ADJUSTMENT' 
        THEN fld.line_translation_diff 
        ELSE 0 
      END
    ) as cumulative_translation_adjustment,
    -- Summarize by account category
    SUM(
      CASE 
        WHEN fld.account_category = 'ASSETS' 
        THEN fld.line_translation_diff 
        ELSE 0 
      END
    ) as assets_translation_diff,
    SUM(
      CASE 
        WHEN fld.account_category = 'LIABILITIES' 
        THEN fld.line_translation_diff 
        ELSE 0 
      END
    ) as liabilities_translation_diff,
    SUM(
      CASE 
        WHEN fld.account_category = 'EQUITY' 
        THEN fld.line_translation_diff 
        ELSE 0 
      END
    ) as equity_translation_diff,
    SUM(
      CASE 
        WHEN fld.account_category IN ('REVENUE', 'EXPENSES') 
        THEN fld.line_translation_diff 
        ELSE 0 
      END
    ) as income_statement_accounts_diff,
    SUM(
      CASE 
        WHEN fld.account_category = 'OCI_CTA' 
        THEN fld.line_translation_diff 
        ELSE 0 
      END
    ) as oci_cta_amount,
    -- Total translation impact
    SUM(fld.line_translation_diff) as total_translation_difference,
    SUM(ABS(fld.line_translation_diff)) as total_absolute_translation_diff,
    -- Line counts for validation
    COUNT(*) as translation_lines_count,
    COUNT(DISTINCT fld.line_type) as translation_types_count
  FROM fx_line_details fld
  GROUP BY 
    fld.group_id, fld.period, fld.member_entity_id, fld.local_currency, 
    fld.base_currency, fld.translation_method, fld.avg_fx_rate, 
    fld.closing_fx_rate, fld.translation_date, fld.translation_transaction_id
),
fx_rate_analysis AS (
  SELECT 
    ts.*,
    -- Calculate FX rate movements
    LAG(ts.avg_fx_rate) OVER (
      PARTITION BY ts.group_id, ts.member_entity_id, ts.local_currency, ts.base_currency 
      ORDER BY ts.period
    ) as prior_period_avg_rate,
    LAG(ts.closing_fx_rate) OVER (
      PARTITION BY ts.group_id, ts.member_entity_id, ts.local_currency, ts.base_currency 
      ORDER BY ts.period
    ) as prior_period_closing_rate,
    LAG(ts.total_translation_difference) OVER (
      PARTITION BY ts.group_id, ts.member_entity_id, ts.local_currency, ts.base_currency 
      ORDER BY ts.period
    ) as prior_period_translation_diff,
    -- Calculate rate volatility
    CASE 
      WHEN LAG(ts.avg_fx_rate) OVER (
        PARTITION BY ts.group_id, ts.member_entity_id, ts.local_currency, ts.base_currency 
        ORDER BY ts.period
      ) != 0 
      THEN ROUND((
        (ts.avg_fx_rate - LAG(ts.avg_fx_rate) OVER (
          PARTITION BY ts.group_id, ts.member_entity_id, ts.local_currency, ts.base_currency 
          ORDER BY ts.period
        )) / ABS(LAG(ts.avg_fx_rate) OVER (
          PARTITION BY ts.group_id, ts.member_entity_id, ts.local_currency, ts.base_currency 
          ORDER BY ts.period
        )) * 100
      ), 4)
      ELSE NULL 
    END as avg_rate_change_pct,
    CASE 
      WHEN LAG(ts.closing_fx_rate) OVER (
        PARTITION BY ts.group_id, ts.member_entity_id, ts.local_currency, ts.base_currency 
        ORDER BY ts.period
      ) != 0 
      THEN ROUND((
        (ts.closing_fx_rate - LAG(ts.closing_fx_rate) OVER (
          PARTITION BY ts.group_id, ts.member_entity_id, ts.local_currency, ts.base_currency 
          ORDER BY ts.period
        )) / ABS(LAG(ts.closing_fx_rate) OVER (
          PARTITION BY ts.group_id, ts.member_entity_id, ts.local_currency, ts.base_currency 
          ORDER BY ts.period
        )) * 100
      ), 4)
      ELSE NULL 
    END as closing_rate_change_pct
  FROM translation_summary ts
),
cumulative_cta_analysis AS (
  SELECT 
    fra.*,
    -- Calculate cumulative CTA over time
    SUM(fra.cumulative_translation_adjustment) OVER (
      PARTITION BY fra.group_id, fra.member_entity_id, fra.local_currency, fra.base_currency 
      ORDER BY fra.period 
      ROWS UNBOUNDED PRECEDING
    ) as cumulative_cta_total,
    -- Rolling 12-month FX volatility
    STDDEV(fra.avg_rate_change_pct) OVER (
      PARTITION BY fra.group_id, fra.member_entity_id, fra.local_currency, fra.base_currency 
      ORDER BY fra.period 
      ROWS 11 PRECEDING
    ) as fx_volatility_12m,
    -- Rolling 12-month translation impact
    SUM(ABS(fra.total_translation_difference)) OVER (
      PARTITION BY fra.group_id, fra.member_entity_id, fra.local_currency, fra.base_currency 
      ORDER BY fra.period 
      ROWS 11 PRECEDING
    ) as translation_impact_12m
  FROM fx_rate_analysis fra
)
SELECT 
  -- Primary identifiers
  cca.group_id,
  cca.period,
  cca.member_entity_id,
  
  -- Entity details
  med.member_name,
  med.member_code,
  med.member_org_id,
  med.country_code,
  med.functional_currency,
  med.operation_nature,
  
  -- Currency details
  cca.local_currency,
  cca.base_currency,
  cca.local_currency || '/' || cca.base_currency as currency_pair,
  cca.translation_method,
  
  -- FX rates
  cca.avg_fx_rate,
  cca.closing_fx_rate,
  cca.prior_period_avg_rate,
  cca.prior_period_closing_rate,
  ABS(cca.avg_fx_rate - cca.closing_fx_rate) as period_fx_rate_spread,
  
  -- FX rate movements
  cca.avg_rate_change_pct,
  cca.closing_rate_change_pct,
  cca.fx_volatility_12m,
  
  -- Translation differences by category
  cca.balance_sheet_translation_diff,
  cca.income_statement_translation_diff,
  cca.cumulative_translation_adjustment,
  cca.assets_translation_diff,
  cca.liabilities_translation_diff,
  cca.equity_translation_diff,
  cca.income_statement_accounts_diff,
  cca.oci_cta_amount,
  
  -- Total translation impact
  cca.total_translation_difference,
  cca.total_absolute_translation_diff,
  cca.prior_period_translation_diff,
  cca.cumulative_cta_total,
  cca.translation_impact_12m,
  
  -- Translation difference analysis
  CASE 
    WHEN cca.total_translation_difference > 0 THEN 'FAVORABLE'
    WHEN cca.total_translation_difference < 0 THEN 'UNFAVORABLE'
    ELSE 'NEUTRAL'
  END as translation_impact_direction,
  
  CASE 
    WHEN ABS(cca.total_translation_difference) > cca.translation_impact_12m * 0.25 THEN 'HIGH'
    WHEN ABS(cca.total_translation_difference) > cca.translation_impact_12m * 0.10 THEN 'MEDIUM'
    ELSE 'LOW'
  END as translation_materiality,
  
  CASE 
    WHEN cca.fx_volatility_12m > 5.0 THEN 'HIGH_VOLATILITY'
    WHEN cca.fx_volatility_12m > 2.0 THEN 'MEDIUM_VOLATILITY'
    ELSE 'LOW_VOLATILITY'
  END as fx_risk_profile,
  
  -- Rate analysis
  CASE 
    WHEN cca.avg_fx_rate > cca.closing_fx_rate THEN 'WEAKENING'
    WHEN cca.avg_fx_rate < cca.closing_fx_rate THEN 'STRENGTHENING'
    ELSE 'STABLE'
  END as local_currency_trend,
  
  -- IFRS 21 compliance indicators
  CASE 
    WHEN cca.translation_method = 'CURRENT_RATE' AND cca.oci_cta_amount != 0 THEN 'IFRS_21_COMPLIANT'
    WHEN cca.translation_method IN ('TEMPORAL', 'NET_INVESTMENT') THEN 'IFRS_21_COMPLIANT'
    ELSE 'REVIEW_REQUIRED'
  END as ifrs_21_compliance_status,
  
  -- Data quality indicators
  cca.translation_lines_count,
  cca.translation_types_count,
  CASE 
    WHEN cca.translation_types_count >= 3 THEN 'COMPLETE' -- BS, IS, CTA
    WHEN cca.translation_types_count >= 2 THEN 'PARTIAL'
    ELSE 'INCOMPLETE'
  END as translation_completeness,
  
  -- Audit trail
  cca.translation_date,
  cca.translation_transaction_id,
  
  -- Derived period information
  substring(cca.period from 1 for 4)::integer as fiscal_year,
  substring(cca.period from 6 for 2)::integer as fiscal_month,
  to_date(cca.period || '-01', 'YYYY-MM-DD') as period_date,
  
  -- Record metadata
  CURRENT_TIMESTAMP as view_generated_at,
  'HERA.CONSOL.VIEW.FX_TRANSLATION_DIFF.V3' as smart_code

FROM cumulative_cta_analysis cca
LEFT JOIN member_entity_details med ON med.member_entity_id = cca.member_entity_id

ORDER BY 
  cca.group_id, 
  cca.period, 
  cca.total_absolute_translation_diff DESC,
  cca.local_currency,
  cca.member_entity_id;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary index for group-period-member queries
CREATE INDEX idx_fx_translation_diff_v3_primary 
ON vw_fx_translation_diff_v3 (group_id, period, member_entity_id);

-- Currency pair analysis index
CREATE INDEX idx_fx_translation_diff_v3_currency_pair 
ON vw_fx_translation_diff_v3 (group_id, period, currency_pair);

-- Translation impact materiality index
CREATE INDEX idx_fx_translation_diff_v3_materiality 
ON vw_fx_translation_diff_v3 (group_id, period, translation_materiality, total_absolute_translation_diff DESC);

-- FX risk analysis index
CREATE INDEX idx_fx_translation_diff_v3_risk 
ON vw_fx_translation_diff_v3 (group_id, period, fx_risk_profile, fx_volatility_12m DESC);

-- Cumulative CTA tracking index
CREATE INDEX idx_fx_translation_diff_v3_cta 
ON vw_fx_translation_diff_v3 (group_id, member_entity_id, period, cumulative_cta_total);

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT ON vw_fx_translation_diff_v3 TO authenticated;
GRANT SELECT ON vw_fx_translation_diff_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON VIEW vw_fx_translation_diff_v3 IS 'HERA Finance DNA v3.4: IFRS 21 compliant view for foreign exchange translation differences analysis. Provides cumulative translation adjustment (CTA) tracking, FX volatility analysis, translation impact assessment, and compliance verification with complete audit trail for multi-currency consolidation.';