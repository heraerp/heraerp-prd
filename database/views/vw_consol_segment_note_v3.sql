-- ============================================================================
-- HERA Finance DNA v3.4: Consolidation Segment Reporting View
-- 
-- IFRS 8 compliant segment reporting view for consolidated financial statements
-- with operating segment identification and geographic segment analysis.
-- 
-- Smart Code: HERA.CONSOL.VIEW.SEGMENT_NOTE.V3
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS vw_consol_segment_note_v3 CASCADE;

-- Create segment reporting view
CREATE VIEW vw_consol_segment_note_v3 AS
WITH segment_base AS (
  SELECT 
    fc.group_org_id,
    fc.group_id,
    fc.period,
    fc.fiscal_year,
    fc.fiscal_month,
    fc.member_entity_id,
    fc.member_name,
    fc.member_code,
    fc.member_org_id,
    fc.base_currency,
    fc.total_consolidated_amount,
    fc.absolute_amount,
    fc.financial_statement_category,
    fc.account_category,
    fc.gl_account_code,
    fc.gl_account_name,
    fc.ownership_pct,
    fc.consolidation_method,
    fc.adjustment_status,
    fc.fx_translated,
    -- Extract segment information from member entity metadata
    COALESCE(
      me_segment.field_value_text,
      'CORPORATE' -- Default segment if not specified
    ) as operating_segment,
    COALESCE(
      me_geo.field_value_text,
      'DOMESTIC' -- Default geographic segment
    ) as geographic_segment,
    COALESCE(
      me_industry.field_value_text,
      'OTHER'
    ) as industry_segment,
    COALESCE(
      me_business_unit.field_value_text,
      fc.member_name
    ) as business_unit,
    -- Extract geographic information
    COALESCE(
      me_country.field_value_text,
      'UNKNOWN'
    ) as country_code,
    COALESCE(
      me_region.field_value_text,
      'UNKNOWN'
    ) as region_code
  FROM fact_consolidated_v3 fc
  LEFT JOIN core_dynamic_data me_segment ON 
    me_segment.entity_id = fc.member_entity_id AND 
    me_segment.field_name = 'operating_segment'
  LEFT JOIN core_dynamic_data me_geo ON 
    me_geo.entity_id = fc.member_entity_id AND 
    me_geo.field_name = 'geographic_segment'
  LEFT JOIN core_dynamic_data me_industry ON 
    me_industry.entity_id = fc.member_entity_id AND 
    me_industry.field_name = 'industry_segment'
  LEFT JOIN core_dynamic_data me_business_unit ON 
    me_business_unit.entity_id = fc.member_entity_id AND 
    me_business_unit.field_name = 'business_unit'
  LEFT JOIN core_dynamic_data me_country ON 
    me_country.entity_id = fc.member_entity_id AND 
    me_country.field_name = 'country_code'
  LEFT JOIN core_dynamic_data me_region ON 
    me_region.entity_id = fc.member_entity_id AND 
    me_region.field_name = 'region_code'
),
segment_totals AS (
  SELECT 
    sb.group_id,
    sb.period,
    sb.fiscal_year,
    sb.operating_segment,
    sb.geographic_segment,
    sb.industry_segment,
    sb.business_unit,
    sb.country_code,
    sb.region_code,
    sb.base_currency,
    -- Revenue aggregation (IFRS 8 requirement)
    SUM(
      CASE 
        WHEN sb.account_category = 'REVENUE' 
        THEN sb.total_consolidated_amount 
        ELSE 0 
      END
    ) as segment_revenue,
    -- Operating profit/loss calculation
    SUM(
      CASE 
        WHEN sb.account_category IN ('REVENUE') 
        THEN sb.total_consolidated_amount 
        WHEN sb.account_category IN ('EXPENSES')
        THEN sb.total_consolidated_amount
        ELSE 0 
      END
    ) as segment_operating_result,
    -- Total assets (reportable if material)
    SUM(
      CASE 
        WHEN sb.account_category = 'ASSETS' 
        THEN sb.total_consolidated_amount 
        ELSE 0 
      END
    ) as segment_assets,
    -- Total liabilities
    SUM(
      CASE 
        WHEN sb.account_category = 'LIABILITIES' 
        THEN sb.total_consolidated_amount 
        ELSE 0 
      END
    ) as segment_liabilities,
    -- Capital expenditures (additions to non-current assets)
    SUM(
      CASE 
        WHEN sb.gl_account_code LIKE '15%' -- Non-current assets
          OR sb.gl_account_code LIKE '16%' -- Property, plant, equipment
          OR sb.gl_account_code LIKE '17%' -- Intangible assets
        THEN ABS(sb.total_consolidated_amount)
        ELSE 0 
      END
    ) as segment_capex,
    -- Depreciation and amortization
    SUM(
      CASE 
        WHEN sb.gl_account_code LIKE '52%' -- Depreciation expense
          OR sb.gl_account_code LIKE '53%' -- Amortization expense
        THEN ABS(sb.total_consolidated_amount)
        ELSE 0 
      END
    ) as segment_depreciation_amortization,
    -- Member entity count in segment
    COUNT(DISTINCT sb.member_entity_id) as member_entities_count,
    -- FX impact
    COUNT(CASE WHEN sb.fx_translated THEN 1 END) as fx_translated_entities,
    -- Consolidation adjustments
    SUM(
      CASE 
        WHEN sb.adjustment_status = 'ADJUSTED' 
        THEN ABS(sb.total_consolidated_amount) 
        ELSE 0 
      END
    ) as total_adjustments_amount,
    -- Ownership concentration
    AVG(sb.ownership_pct) as avg_ownership_pct,
    MIN(sb.ownership_pct) as min_ownership_pct,
    MAX(sb.ownership_pct) as max_ownership_pct
  FROM segment_base sb
  GROUP BY 
    sb.group_id, sb.period, sb.fiscal_year, sb.operating_segment, 
    sb.geographic_segment, sb.industry_segment, sb.business_unit,
    sb.country_code, sb.region_code, sb.base_currency
),
group_totals AS (
  SELECT 
    st.group_id,
    st.period,
    st.fiscal_year,
    st.base_currency,
    SUM(st.segment_revenue) as total_group_revenue,
    SUM(st.segment_operating_result) as total_group_operating_result,
    SUM(st.segment_assets) as total_group_assets,
    SUM(st.segment_liabilities) as total_group_liabilities,
    SUM(st.segment_capex) as total_group_capex,
    SUM(st.segment_depreciation_amortization) as total_group_depreciation_amortization
  FROM segment_totals st
  GROUP BY st.group_id, st.period, st.fiscal_year, st.base_currency
),
materiality_analysis AS (
  SELECT 
    st.*,
    gt.total_group_revenue,
    gt.total_group_operating_result,
    gt.total_group_assets,
    -- Calculate materiality percentages (IFRS 8 10% threshold)
    CASE 
      WHEN gt.total_group_revenue != 0 
      THEN ROUND((ABS(st.segment_revenue) / ABS(gt.total_group_revenue) * 100), 2)
      ELSE 0 
    END as revenue_materiality_pct,
    CASE 
      WHEN gt.total_group_operating_result != 0 
      THEN ROUND((ABS(st.segment_operating_result) / ABS(gt.total_group_operating_result) * 100), 2)
      ELSE 0 
    END as operating_result_materiality_pct,
    CASE 
      WHEN gt.total_group_assets != 0 
      THEN ROUND((ABS(st.segment_assets) / ABS(gt.total_group_assets) * 100), 2)
      ELSE 0 
    END as assets_materiality_pct,
    -- IFRS 8 reportable segment determination
    CASE 
      WHEN (gt.total_group_revenue != 0 AND ABS(st.segment_revenue) / ABS(gt.total_group_revenue) >= 0.10)
        OR (gt.total_group_operating_result != 0 AND ABS(st.segment_operating_result) / ABS(gt.total_group_operating_result) >= 0.10)
        OR (gt.total_group_assets != 0 AND ABS(st.segment_assets) / ABS(gt.total_group_assets) >= 0.10)
      THEN true
      ELSE false
    END as is_reportable_segment
  FROM segment_totals st
  JOIN group_totals gt ON 
    gt.group_id = st.group_id AND 
    gt.period = st.period
)
SELECT 
  -- Primary identifiers
  ma.group_id,
  ma.period,
  ma.fiscal_year,
  
  -- Segment identification
  ma.operating_segment,
  ma.geographic_segment,
  ma.industry_segment,
  ma.business_unit,
  ma.country_code,
  ma.region_code,
  
  -- Financial metrics (IFRS 8 required disclosures)
  ma.segment_revenue,
  ma.segment_operating_result,
  ma.segment_assets,
  ma.segment_liabilities,
  ma.segment_capex,
  ma.segment_depreciation_amortization,
  
  -- Materiality analysis
  ma.revenue_materiality_pct,
  ma.operating_result_materiality_pct,
  ma.assets_materiality_pct,
  ma.is_reportable_segment,
  
  -- Segment characteristics
  ma.member_entities_count,
  ma.fx_translated_entities,
  ma.total_adjustments_amount,
  ma.avg_ownership_pct,
  ma.min_ownership_pct,
  ma.max_ownership_pct,
  
  -- Group totals for context
  ma.total_group_revenue,
  ma.total_group_operating_result,
  ma.total_group_assets,
  ma.base_currency,
  
  -- Calculated ratios for analysis
  CASE 
    WHEN ma.segment_revenue != 0 
    THEN ROUND((ma.segment_operating_result / ma.segment_revenue * 100), 2)
    ELSE NULL 
  END as operating_margin_pct,
  
  CASE 
    WHEN ma.segment_assets != 0 
    THEN ROUND((ma.segment_revenue / ma.segment_assets), 2)
    ELSE NULL 
  END as asset_turnover_ratio,
  
  CASE 
    WHEN ma.segment_assets != 0 
    THEN ROUND((ma.segment_operating_result / ma.segment_assets * 100), 2)
    ELSE NULL 
  END as return_on_segment_assets_pct,
  
  -- Segment risk indicators
  CASE 
    WHEN ma.fx_translated_entities > 0 
    THEN 'FX_EXPOSED'
    ELSE 'FX_NEUTRAL'
  END as fx_risk_profile,
  
  CASE 
    WHEN ma.min_ownership_pct < 100 
    THEN 'MINORITY_INTERESTS'
    ELSE 'WHOLLY_OWNED'
  END as ownership_structure,
  
  CASE 
    WHEN ma.total_adjustments_amount > ABS(ma.segment_revenue) * 0.05 
    THEN 'HIGH_ADJUSTMENTS'
    WHEN ma.total_adjustments_amount > 0 
    THEN 'SOME_ADJUSTMENTS'
    ELSE 'MINIMAL_ADJUSTMENTS'
  END as adjustment_complexity,
  
  -- Comparative metrics
  LAG(ma.segment_revenue) OVER (
    PARTITION BY ma.group_id, ma.operating_segment, ma.geographic_segment 
    ORDER BY ma.period
  ) as prior_period_revenue,
  
  LAG(ma.segment_operating_result) OVER (
    PARTITION BY ma.group_id, ma.operating_segment, ma.geographic_segment 
    ORDER BY ma.period
  ) as prior_period_operating_result,
  
  -- Growth calculations
  CASE 
    WHEN LAG(ma.segment_revenue) OVER (
      PARTITION BY ma.group_id, ma.operating_segment, ma.geographic_segment 
      ORDER BY ma.period
    ) != 0 
    THEN ROUND((
      (ma.segment_revenue - LAG(ma.segment_revenue) OVER (
        PARTITION BY ma.group_id, ma.operating_segment, ma.geographic_segment 
        ORDER BY ma.period
      )) / ABS(LAG(ma.segment_revenue) OVER (
        PARTITION BY ma.group_id, ma.operating_segment, ma.geographic_segment 
        ORDER BY ma.period
      )) * 100
    ), 2)
    ELSE NULL 
  END as revenue_growth_pct,
  
  -- Record metadata
  CURRENT_TIMESTAMP as view_generated_at,
  'HERA.CONSOL.VIEW.SEGMENT_NOTE.V3' as smart_code

FROM materiality_analysis ma
ORDER BY 
  ma.group_id, 
  ma.period, 
  ma.is_reportable_segment DESC, 
  ma.revenue_materiality_pct DESC,
  ma.operating_segment,
  ma.geographic_segment;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary index for group-period segment queries
CREATE INDEX idx_consol_segment_note_v3_primary 
ON vw_consol_segment_note_v3 (group_id, period, operating_segment, geographic_segment);

-- Reportable segments index for IFRS 8 compliance
CREATE INDEX idx_consol_segment_note_v3_reportable 
ON vw_consol_segment_note_v3 (group_id, period, is_reportable_segment);

-- Materiality index for threshold analysis
CREATE INDEX idx_consol_segment_note_v3_materiality 
ON vw_consol_segment_note_v3 (group_id, period, revenue_materiality_pct DESC);

-- Geographic analysis index
CREATE INDEX idx_consol_segment_note_v3_geographic 
ON vw_consol_segment_note_v3 (group_id, period, country_code, region_code);

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT ON vw_consol_segment_note_v3 TO authenticated;
GRANT SELECT ON vw_consol_segment_note_v3 TO service_role;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON VIEW vw_consol_segment_note_v3 IS 'HERA Finance DNA v3.4: IFRS 8 compliant segment reporting view for consolidated financial statements. Provides operating segment identification, geographic segment analysis, materiality testing, and reportable segment determination with complete audit trail and comparative analysis.';