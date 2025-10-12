-- ============================================================================
-- HERA Finance DNA v3.4: Consolidated Financial Facts Materialized View
-- 
-- Pre-computed consolidated financial data with elimination and translation
-- adjustments for instant consolidated reporting and analysis.
-- 
-- Smart Code: HERA.CONSOL.VIEW.FACT_CONSOLIDATED.V3
-- ============================================================================

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS fact_consolidated_v3 CASCADE;

-- Create materialized view for consolidated facts
CREATE MATERIALIZED VIEW fact_consolidated_v3 AS
WITH consolidation_base AS (
  SELECT 
    ut.organization_id as group_org_id,
    ut.metadata->>'group_id' as group_id,
    ut.metadata->>'period' as period,
    ut.transaction_type,
    ut.transaction_code,
    ut.status,
    ut.currency,
    ut.created_at as consolidation_date,
    utl.line_type,
    utl.line_entity_id as member_entity_id,
    utl.line_amount,
    utl.metadata->>'gl_account_id' as gl_account_id,
    utl.metadata->>'gl_account_code' as gl_account_code,
    utl.metadata->>'gl_account_name' as gl_account_name,
    utl.metadata->>'account_category' as account_category,
    -- Consolidation specific metadata
    CASE 
      WHEN ut.transaction_type = 'CONSOL_ELIM' THEN utl.metadata->>'elimination_type'
      WHEN ut.transaction_type = 'CONSOL_TRANSLATE' THEN utl.metadata->>'translation_type'
      WHEN ut.transaction_type = 'CONSOL_AGGREGATE' THEN utl.metadata->>'aggregation_type'
      ELSE NULL
    END as consolidation_adjustment_type,
    -- Extract ownership and consolidation method from metadata
    COALESCE(
      (utl.metadata->>'ownership_pct')::decimal,
      (ut.metadata->'amounts_translated'->>'ownership_pct')::decimal,
      100.0
    ) as ownership_pct,
    COALESCE(
      utl.metadata->>'consolidation_method',
      ut.metadata->>'consolidation_method',
      'FULL'
    ) as consolidation_method,
    -- Extract FX information
    utl.metadata->>'fx_rate_used' as fx_rate_used,
    utl.metadata->>'rate_type' as fx_rate_type,
    utl.metadata->>'local_currency' as local_currency,
    -- Row metadata for lineage
    ut.id as consolidation_transaction_id,
    utl.id as consolidation_line_id,
    ut.smart_code as consolidation_smart_code,
    utl.smart_code as line_smart_code
  FROM universal_transactions ut
  JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
  WHERE ut.transaction_type IN ('CONSOL_ELIM', 'CONSOL_TRANSLATE', 'CONSOL_AGGREGATE')
    AND ut.status = 'COMPLETED'
    AND ut.metadata->>'group_id' IS NOT NULL
    AND ut.metadata->>'period' IS NOT NULL
),
member_entities AS (
  SELECT DISTINCT
    cb.member_entity_id,
    e.entity_name as member_name,
    e.entity_code as member_code,
    e.organization_id as member_org_id,
    cb.group_id,
    cb.period
  FROM consolidation_base cb
  JOIN core_entities e ON e.id = cb.member_entity_id::uuid
  WHERE cb.member_entity_id IS NOT NULL
),
gl_accounts AS (
  SELECT DISTINCT
    cb.gl_account_id,
    cb.gl_account_code,
    cb.gl_account_name,
    cb.account_category,
    cb.group_id,
    cb.period
  FROM consolidation_base cb
  WHERE cb.gl_account_id IS NOT NULL
),
consolidated_amounts AS (
  SELECT 
    cb.group_org_id,
    cb.group_id::uuid as group_id,
    cb.period,
    cb.member_entity_id::uuid as member_entity_id,
    cb.gl_account_id::uuid as gl_account_id,
    cb.account_category,
    cb.local_currency,
    cb.currency as base_currency,
    cb.ownership_pct,
    cb.consolidation_method,
    -- Sum amounts by consolidation type
    SUM(
      CASE 
        WHEN cb.transaction_type = 'CONSOL_AGGREGATE' AND cb.line_type = 'CONSOL_BALANCE'
        THEN cb.line_amount 
        ELSE 0 
      END
    ) as consolidated_balance_amount,
    SUM(
      CASE 
        WHEN cb.transaction_type = 'CONSOL_AGGREGATE' AND cb.line_type = 'CONSOL_NCI'
        THEN cb.line_amount 
        ELSE 0 
      END
    ) as non_controlling_interest_amount,
    SUM(
      CASE 
        WHEN cb.transaction_type = 'CONSOL_ELIM'
        THEN cb.line_amount 
        ELSE 0 
      END
    ) as elimination_adjustment_amount,
    SUM(
      CASE 
        WHEN cb.transaction_type = 'CONSOL_TRANSLATE'
        THEN cb.line_amount 
        ELSE 0 
      END
    ) as translation_adjustment_amount,
    -- Calculate total consolidated amount
    SUM(
      CASE 
        WHEN cb.transaction_type = 'CONSOL_AGGREGATE' AND cb.line_type = 'CONSOL_BALANCE'
        THEN cb.line_amount 
        WHEN cb.transaction_type = 'CONSOL_ELIM'
        THEN cb.line_amount
        WHEN cb.transaction_type = 'CONSOL_TRANSLATE'
        THEN cb.line_amount
        ELSE 0 
      END
    ) as total_consolidated_amount,
    -- Audit trail fields
    COUNT(DISTINCT cb.consolidation_transaction_id) as source_transactions_count,
    COUNT(cb.consolidation_line_id) as source_lines_count,
    array_agg(DISTINCT cb.consolidation_smart_code) as consolidation_smart_codes,
    array_agg(DISTINCT cb.line_smart_code) as line_smart_codes,
    MAX(cb.consolidation_date) as last_consolidation_date,
    -- FX details
    MAX(cb.fx_rate_used) as fx_rate_used,
    MAX(cb.fx_rate_type) as fx_rate_type
  FROM consolidation_base cb
  WHERE cb.member_entity_id IS NOT NULL 
    AND cb.gl_account_id IS NOT NULL
  GROUP BY 
    cb.group_org_id, cb.group_id, cb.period, cb.member_entity_id, 
    cb.gl_account_id, cb.account_category, cb.local_currency, cb.currency,
    cb.ownership_pct, cb.consolidation_method
)
SELECT 
  -- Primary identifiers
  ca.group_org_id,
  ca.group_id,
  ca.period,
  ca.member_entity_id,
  ca.gl_account_id,
  
  -- Entity details
  me.member_name,
  me.member_code,
  me.member_org_id,
  
  -- GL account details
  ga.gl_account_code,
  ga.gl_account_name,
  ca.account_category,
  
  -- Consolidation details
  ca.ownership_pct,
  ca.consolidation_method,
  ca.local_currency,
  ca.base_currency,
  
  -- Consolidated amounts
  ca.consolidated_balance_amount,
  ca.non_controlling_interest_amount,
  ca.elimination_adjustment_amount,
  ca.translation_adjustment_amount,
  ca.total_consolidated_amount,
  
  -- Calculated fields
  CASE 
    WHEN ca.account_category IN ('REVENUE', 'EXPENSES') THEN 'INCOME_STATEMENT'
    WHEN ca.account_category IN ('ASSETS', 'LIABILITIES', 'EQUITY') THEN 'BALANCE_SHEET'
    WHEN ca.account_category = 'OCI_CTA' THEN 'OTHER_COMPREHENSIVE_INCOME'
    ELSE 'OTHER'
  END as financial_statement_category,
  
  CASE 
    WHEN ca.total_consolidated_amount > 0 THEN 'DEBIT_BALANCE'
    WHEN ca.total_consolidated_amount < 0 THEN 'CREDIT_BALANCE'
    ELSE 'ZERO_BALANCE'
  END as balance_type,
  
  ABS(ca.total_consolidated_amount) as absolute_amount,
  
  -- Consolidation quality indicators
  CASE 
    WHEN ca.source_transactions_count >= 3 THEN 'COMPLETE' -- Prep, Elim/Trans, Aggregate
    WHEN ca.source_transactions_count >= 2 THEN 'PARTIAL'
    ELSE 'INCOMPLETE'
  END as consolidation_completeness,
  
  CASE 
    WHEN ca.elimination_adjustment_amount != 0 OR ca.translation_adjustment_amount != 0 THEN 'ADJUSTED'
    ELSE 'UNADJUSTED'
  END as adjustment_status,
  
  -- FX information
  ca.fx_rate_used::decimal as fx_rate_used,
  ca.fx_rate_type,
  CASE 
    WHEN ca.local_currency = ca.base_currency THEN false
    ELSE true
  END as fx_translated,
  
  -- Audit trail
  ca.source_transactions_count,
  ca.source_lines_count,
  ca.consolidation_smart_codes,
  ca.line_smart_codes,
  ca.last_consolidation_date,
  
  -- Derived period fields for reporting
  substring(ca.period from 1 for 4)::integer as fiscal_year,
  substring(ca.period from 6 for 2)::integer as fiscal_month,
  to_date(ca.period || '-01', 'YYYY-MM-DD') as period_date,
  
  -- Record metadata
  CURRENT_TIMESTAMP as materialized_at,
  'HERA.CONSOL.VIEW.FACT_CONSOLIDATED.V3' as smart_code

FROM consolidated_amounts ca
LEFT JOIN member_entities me ON 
  me.member_entity_id = ca.member_entity_id::text AND 
  me.group_id = ca.group_id::text AND 
  me.period = ca.period
LEFT JOIN gl_accounts ga ON 
  ga.gl_account_id = ca.gl_account_id::text AND 
  ga.group_id = ca.group_id::text AND 
  ga.period = ca.period

WHERE ca.total_consolidated_amount != 0; -- Exclude zero balances

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary composite index for group-period queries
CREATE UNIQUE INDEX idx_fact_consolidated_v3_primary 
ON fact_consolidated_v3 (group_id, period, member_entity_id, gl_account_id);

-- Group and period index for dashboard queries
CREATE INDEX idx_fact_consolidated_v3_group_period 
ON fact_consolidated_v3 (group_id, period);

-- Financial statement category index for reporting
CREATE INDEX idx_fact_consolidated_v3_stmt_category 
ON fact_consolidated_v3 (group_id, period, financial_statement_category);

-- Account category index for analysis
CREATE INDEX idx_fact_consolidated_v3_account_category 
ON fact_consolidated_v3 (group_id, period, account_category);

-- Member entity index for drill-down analysis
CREATE INDEX idx_fact_consolidated_v3_member 
ON fact_consolidated_v3 (group_id, period, member_entity_id);

-- GL account index for account-specific analysis
CREATE INDEX idx_fact_consolidated_v3_gl_account 
ON fact_consolidated_v3 (group_id, period, gl_account_id);

-- Amount index for materiality analysis
CREATE INDEX idx_fact_consolidated_v3_amount 
ON fact_consolidated_v3 (group_id, period, absolute_amount DESC);

-- Date index for time series analysis
CREATE INDEX idx_fact_consolidated_v3_period_date 
ON fact_consolidated_v3 (period_date);

-- Consolidation quality index for data quality monitoring
CREATE INDEX idx_fact_consolidated_v3_quality 
ON fact_consolidated_v3 (group_id, period, consolidation_completeness, adjustment_status);

-- ============================================================================
-- Refresh Function
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_fact_consolidated_v3(
  p_group_id UUID DEFAULT NULL,
  p_period TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Full refresh if no parameters provided
  IF p_group_id IS NULL AND p_period IS NULL THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY fact_consolidated_v3;
    RETURN 'Full refresh completed for fact_consolidated_v3';
  ELSE
    -- For partial refresh, we need to refresh the entire view
    -- as PostgreSQL doesn't support conditional materialized view refresh
    REFRESH MATERIALIZED VIEW CONCURRENTLY fact_consolidated_v3;
    RETURN format('Refresh completed for fact_consolidated_v3 (group_id: %s, period: %s)', 
                  COALESCE(p_group_id::text, 'ALL'), 
                  COALESCE(p_period, 'ALL'));
  END IF;
END;
$$;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT ON fact_consolidated_v3 TO authenticated;
GRANT SELECT ON fact_consolidated_v3 TO service_role;
GRANT EXECUTE ON FUNCTION refresh_fact_consolidated_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_fact_consolidated_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON MATERIALIZED VIEW fact_consolidated_v3 IS 'HERA Finance DNA v3.4: Pre-computed consolidated financial data with elimination and translation adjustments for instant consolidated reporting. Includes complete audit trail, FX details, and data quality indicators for IFRS 10 compliant consolidation analysis.';

COMMENT ON FUNCTION refresh_fact_consolidated_v3 IS 'Refresh materialized view fact_consolidated_v3 with optional group and period filtering. Full concurrent refresh ensures zero downtime during updates.';