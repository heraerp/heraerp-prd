-- ============================================================================
-- HERA Profitability v2: Dimensional Views
-- 
-- Supporting dimensional views for profitability analysis with complete
-- master data attributes and CODM compliance indicators.
-- 
-- Smart Code: HERA.PROFITABILITY.DIMENSIONS.V2
-- ============================================================================

-- ============================================================================
-- vw_dim_account: Chart of Accounts Dimension
-- ============================================================================

CREATE OR REPLACE VIEW vw_dim_account AS
SELECT 
  acc.id as account_id,
  acc.organization_id as org_id,
  acc.entity_code as account_code,
  acc.entity_name as account_name,
  COALESCE(dd_acc_num.field_value_text, acc.entity_code) as account_number,
  COALESCE(dd_acc_group.field_value_text, 'OTHER') as account_group,
  COALESCE(dd_normal_bal.field_value_text, 'Dr') as normal_balance,
  COALESCE(dd_acc_type.field_value_text, 'OPERATING') as account_type,
  COALESCE((dd_rollup.field_value_json->>'parent_account_id')::UUID, NULL) as parent_account_id,
  COALESCE((dd_rollup.field_value_json->>'level')::INTEGER, 1) as account_level,
  COALESCE((dd_ifrs.field_value_json->>'classification'), 'UNCLASSIFIED') as ifrs_classification,
  COALESCE((dd_ifrs.field_value_json->>'statement'), 'OTHER') as financial_statement,
  acc.status as account_status,
  acc.created_at,
  acc.updated_at,
  
  -- Computed fields
  CASE 
    WHEN acc.entity_code LIKE '1%' THEN 'ASSETS'
    WHEN acc.entity_code LIKE '2%' THEN 'LIABILITIES'
    WHEN acc.entity_code LIKE '3%' THEN 'EQUITY'
    WHEN acc.entity_code LIKE '4%' THEN 'REVENUE'
    WHEN acc.entity_code LIKE '5%' THEN 'COGS'
    WHEN acc.entity_code LIKE '6%' THEN 'OPEX'
    WHEN acc.entity_code LIKE '7%' THEN 'OTHER_INCOME'
    WHEN acc.entity_code LIKE '8%' THEN 'OTHER_EXPENSE'
    WHEN acc.entity_code LIKE '9%' THEN 'STATISTICAL'
    ELSE 'OTHER'
  END as computed_category,
  
  -- Profitability relevance
  CASE 
    WHEN acc.entity_code LIKE '4%' OR acc.entity_code LIKE '5%' OR acc.entity_code LIKE '6%' 
    THEN true
    ELSE false
  END as is_profitability_relevant

FROM core_entities acc
LEFT JOIN core_dynamic_data dd_acc_num ON dd_acc_num.entity_id = acc.id 
  AND dd_acc_num.field_name = 'account_number'
LEFT JOIN core_dynamic_data dd_acc_group ON dd_acc_group.entity_id = acc.id 
  AND dd_acc_group.field_name = 'account_group'
LEFT JOIN core_dynamic_data dd_normal_bal ON dd_normal_bal.entity_id = acc.id 
  AND dd_normal_bal.field_name = 'normal_balance'
LEFT JOIN core_dynamic_data dd_acc_type ON dd_acc_type.entity_id = acc.id 
  AND dd_acc_type.field_name = 'account_type'
LEFT JOIN core_dynamic_data dd_rollup ON dd_rollup.entity_id = acc.id 
  AND dd_rollup.field_name = 'rollup_config'
LEFT JOIN core_dynamic_data dd_ifrs ON dd_ifrs.entity_id = acc.id 
  AND dd_ifrs.field_name = 'ifrs_mapping'

WHERE acc.entity_type = 'GL_ACCOUNT'
  AND acc.status = 'ACTIVE';

-- ============================================================================
-- vw_dim_profit_center: Profit Center Dimension
-- ============================================================================

CREATE OR REPLACE VIEW vw_dim_profit_center AS
SELECT 
  pc.id as profit_center_id,
  pc.organization_id as org_id,
  pc.entity_code as profit_center_code,
  pc.entity_name as profit_center_name,
  COALESCE(dd_segment.field_value_text, 'UNASSIGNED') as segment_code,
  COALESCE(dd_segment_name.field_value_text, 'Unassigned Segment') as segment_name,
  COALESCE((dd_codm.field_value_json->>'included')::BOOLEAN, false) as codm_included,
  COALESCE((dd_codm.field_value_json->>'segment_manager'), 'UNASSIGNED') as segment_manager,
  COALESCE((dd_codm.field_value_json->>'reporting_entity'), pc.entity_name) as reporting_entity,
  COALESCE(dd_region.field_value_text, 'GLOBAL') as region_code,
  COALESCE(dd_business_unit.field_value_text, 'CORPORATE') as business_unit,
  COALESCE((dd_hierarchy.field_value_json->>'parent_pc_id')::UUID, NULL) as parent_profit_center_id,
  COALESCE((dd_hierarchy.field_value_json->>'level')::INTEGER, 1) as hierarchy_level,
  pc.status as pc_status,
  pc.created_at,
  pc.updated_at,
  
  -- Computed CODM segment mapping
  CASE 
    WHEN COALESCE((dd_codm.field_value_json->>'included')::BOOLEAN, false) = true
    THEN COALESCE(dd_segment.field_value_text, 'UNASSIGNED')
    ELSE 'NON_CODM'
  END as codm_segment

FROM core_entities pc
LEFT JOIN core_dynamic_data dd_segment ON dd_segment.entity_id = pc.id 
  AND dd_segment.field_name = 'segment_code'
LEFT JOIN core_dynamic_data dd_segment_name ON dd_segment_name.entity_id = pc.id 
  AND dd_segment_name.field_name = 'segment_name'
LEFT JOIN core_dynamic_data dd_codm ON dd_codm.entity_id = pc.id 
  AND dd_codm.field_name = 'codm_config'
LEFT JOIN core_dynamic_data dd_region ON dd_region.entity_id = pc.id 
  AND dd_region.field_name = 'region'
LEFT JOIN core_dynamic_data dd_business_unit ON dd_business_unit.entity_id = pc.id 
  AND dd_business_unit.field_name = 'business_unit'
LEFT JOIN core_dynamic_data dd_hierarchy ON dd_hierarchy.entity_id = pc.id 
  AND dd_hierarchy.field_name = 'hierarchy_config'

WHERE pc.entity_type = 'PROFIT_CENTER'
  AND pc.status = 'ACTIVE';

-- ============================================================================
-- vw_dim_cost_center: Cost Center Dimension
-- ============================================================================

CREATE OR REPLACE VIEW vw_dim_cost_center AS
SELECT 
  cc.id as cost_center_id,
  cc.organization_id as org_id,
  cc.entity_code as cost_center_code,
  cc.entity_name as cost_center_name,
  COALESCE(dd_tags.field_value_json, '[]'::JSONB) as tags,
  COALESCE(dd_cc_type.field_value_text, 'OPERATING') as cost_center_type,
  COALESCE(dd_manager.field_value_text, 'UNASSIGNED') as manager_name,
  COALESCE((dd_manager_entity.field_value_json->>'entity_id')::UUID, NULL) as manager_entity_id,
  COALESCE((dd_headcount.field_value_number), 0) as headcount,
  COALESCE(dd_location.field_value_text, 'UNKNOWN') as location,
  COALESCE((dd_hierarchy.field_value_json->>'parent_cc_id')::UUID, NULL) as parent_cost_center_id,
  COALESCE((dd_hierarchy.field_value_json->>'level')::INTEGER, 1) as hierarchy_level,
  cc.status as cc_status,
  cc.created_at,
  cc.updated_at,
  
  -- Tag-based classifications
  CASE 
    WHEN dd_tags.field_value_json ? 'ADMIN' THEN true
    ELSE false
  END as is_admin_center,
  
  CASE 
    WHEN dd_tags.field_value_json ? 'SUPPORT' THEN true
    ELSE false
  END as is_support_center,
  
  CASE 
    WHEN dd_tags.field_value_json ? 'PRODUCTION' THEN true
    ELSE false
  END as is_production_center

FROM core_entities cc
LEFT JOIN core_dynamic_data dd_tags ON dd_tags.entity_id = cc.id 
  AND dd_tags.field_name = 'tags'
LEFT JOIN core_dynamic_data dd_cc_type ON dd_cc_type.entity_id = cc.id 
  AND dd_cc_type.field_name = 'cost_center_type'
LEFT JOIN core_dynamic_data dd_manager ON dd_manager.entity_id = cc.id 
  AND dd_manager.field_name = 'manager_name'
LEFT JOIN core_dynamic_data dd_manager_entity ON dd_manager_entity.entity_id = cc.id 
  AND dd_manager_entity.field_name = 'manager_entity'
LEFT JOIN core_dynamic_data dd_headcount ON dd_headcount.entity_id = cc.id 
  AND dd_headcount.field_name = 'headcount'
LEFT JOIN core_dynamic_data dd_location ON dd_location.entity_id = cc.id 
  AND dd_location.field_name = 'location'
LEFT JOIN core_dynamic_data dd_hierarchy ON dd_hierarchy.entity_id = cc.id 
  AND dd_hierarchy.field_name = 'hierarchy_config'

WHERE cc.entity_type = 'COST_CENTER'
  AND cc.status = 'ACTIVE';

-- ============================================================================
-- vw_dim_product: Product Dimension
-- ============================================================================

CREATE OR REPLACE VIEW vw_dim_product AS
SELECT 
  prod.id as product_id,
  prod.organization_id as org_id,
  prod.entity_code as product_code,
  prod.entity_name as product_name,
  COALESCE(dd_category.field_value_text, 'UNASSIGNED') as product_category,
  COALESCE(dd_line.field_value_text, 'GENERAL') as product_line,
  COALESCE(dd_brand.field_value_text, 'NO_BRAND') as brand,
  COALESCE((dd_std_cost.field_value_json->>'total')::DECIMAL, 0) as standard_cost_total,
  COALESCE((dd_std_cost.field_value_json->>'material')::DECIMAL, 0) as standard_cost_material,
  COALESCE((dd_std_cost.field_value_json->>'labor')::DECIMAL, 0) as standard_cost_labor,
  COALESCE((dd_std_cost.field_value_json->>'overhead')::DECIMAL, 0) as standard_cost_overhead,
  COALESCE(dd_uom.field_value_text, 'EACH') as unit_of_measure,
  COALESCE((dd_dimensions.field_value_json->>'length')::DECIMAL, 0) as length,
  COALESCE((dd_dimensions.field_value_json->>'width')::DECIMAL, 0) as width,
  COALESCE((dd_dimensions.field_value_json->>'height')::DECIMAL, 0) as height,
  COALESCE((dd_dimensions.field_value_json->>'weight')::DECIMAL, 0) as weight,
  COALESCE((dd_lifecycle.field_value_json->>'status'), 'ACTIVE') as lifecycle_status,
  COALESCE((dd_lifecycle.field_value_json->>'launch_date')::DATE, prod.created_at::DATE) as launch_date,
  prod.status as product_status,
  prod.created_at,
  prod.updated_at,
  
  -- Computed classifications
  CASE 
    WHEN COALESCE((dd_std_cost.field_value_json->>'total')::DECIMAL, 0) > 0 THEN true
    ELSE false
  END as has_standard_cost,
  
  CASE 
    WHEN dd_category.field_value_text IN ('FINISHED_GOOD', 'MERCHANDISE') THEN 'SELLABLE'
    WHEN dd_category.field_value_text IN ('RAW_MATERIAL', 'COMPONENT') THEN 'MATERIAL'
    WHEN dd_category.field_value_text = 'SERVICE' THEN 'SERVICE'
    ELSE 'OTHER'
  END as product_type

FROM core_entities prod
LEFT JOIN core_dynamic_data dd_category ON dd_category.entity_id = prod.id 
  AND dd_category.field_name = 'category'
LEFT JOIN core_dynamic_data dd_line ON dd_line.entity_id = prod.id 
  AND dd_line.field_name = 'product_line'
LEFT JOIN core_dynamic_data dd_brand ON dd_brand.entity_id = prod.id 
  AND dd_brand.field_name = 'brand'
LEFT JOIN core_dynamic_data dd_std_cost ON dd_std_cost.entity_id = prod.id 
  AND dd_std_cost.field_name = 'std_cost_components'
LEFT JOIN core_dynamic_data dd_uom ON dd_uom.entity_id = prod.id 
  AND dd_uom.field_name = 'unit_of_measure'
LEFT JOIN core_dynamic_data dd_dimensions ON dd_dimensions.entity_id = prod.id 
  AND dd_dimensions.field_name = 'physical_dimensions'
LEFT JOIN core_dynamic_data dd_lifecycle ON dd_lifecycle.entity_id = prod.id 
  AND dd_lifecycle.field_name = 'lifecycle'

WHERE prod.entity_type = 'PRODUCT'
  AND prod.status = 'ACTIVE';

-- ============================================================================
-- vw_dim_customer: Customer Dimension
-- ============================================================================

CREATE OR REPLACE VIEW vw_dim_customer AS
SELECT 
  cust.id as customer_id,
  cust.organization_id as org_id,
  cust.entity_code as customer_code,
  cust.entity_name as customer_name,
  COALESCE(dd_segment.field_value_text, 'UNASSIGNED') as customer_segment,
  COALESCE(dd_tier.field_value_text, 'STANDARD') as customer_tier,
  COALESCE(dd_industry.field_value_text, 'UNKNOWN') as industry,
  COALESCE((dd_credit.field_value_number), 0) as credit_limit,
  COALESCE(dd_payment_terms.field_value_text, 'NET30') as payment_terms,
  COALESCE(dd_region.field_value_text, 'DOMESTIC') as region,
  COALESCE(dd_sales_rep.field_value_text, 'UNASSIGNED') as sales_rep_name,
  COALESCE((dd_sales_rep_entity.field_value_json->>'entity_id')::UUID, NULL) as sales_rep_entity_id,
  COALESCE((dd_acquisition.field_value_json->>'date')::DATE, cust.created_at::DATE) as acquisition_date,
  COALESCE((dd_acquisition.field_value_json->>'channel'), 'DIRECT') as acquisition_channel,
  cust.status as customer_status,
  cust.created_at,
  cust.updated_at,
  
  -- Computed customer lifetime metrics
  CASE 
    WHEN COALESCE((dd_credit.field_value_number), 0) >= 100000 THEN 'ENTERPRISE'
    WHEN COALESCE((dd_credit.field_value_number), 0) >= 25000 THEN 'COMMERCIAL'
    WHEN COALESCE((dd_credit.field_value_number), 0) >= 5000 THEN 'SMB'
    ELSE 'RETAIL'
  END as computed_segment,
  
  EXTRACT(DAYS FROM (CURRENT_DATE - COALESCE((dd_acquisition.field_value_json->>'date')::DATE, cust.created_at::DATE))) as days_since_acquisition

FROM core_entities cust
LEFT JOIN core_dynamic_data dd_segment ON dd_segment.entity_id = cust.id 
  AND dd_segment.field_name = 'segment'
LEFT JOIN core_dynamic_data dd_tier ON dd_tier.entity_id = cust.id 
  AND dd_tier.field_name = 'tier'
LEFT JOIN core_dynamic_data dd_industry ON dd_industry.entity_id = cust.id 
  AND dd_industry.field_name = 'industry'
LEFT JOIN core_dynamic_data dd_credit ON dd_credit.entity_id = cust.id 
  AND dd_credit.field_name = 'credit_limit'
LEFT JOIN core_dynamic_data dd_payment_terms ON dd_payment_terms.entity_id = cust.id 
  AND dd_payment_terms.field_name = 'payment_terms'
LEFT JOIN core_dynamic_data dd_region ON dd_region.entity_id = cust.id 
  AND dd_region.field_name = 'region'
LEFT JOIN core_dynamic_data dd_sales_rep ON dd_sales_rep.entity_id = cust.id 
  AND dd_sales_rep.field_name = 'sales_rep_name'
LEFT JOIN core_dynamic_data dd_sales_rep_entity ON dd_sales_rep_entity.entity_id = cust.id 
  AND dd_sales_rep_entity.field_name = 'sales_rep_entity'
LEFT JOIN core_dynamic_data dd_acquisition ON dd_acquisition.entity_id = cust.id 
  AND dd_acquisition.field_name = 'acquisition_info'

WHERE cust.entity_type = 'CUSTOMER'
  AND cust.status = 'ACTIVE';

-- ============================================================================
-- vw_dim_time: Time Dimension
-- ============================================================================

CREATE OR REPLACE VIEW vw_dim_time AS
SELECT 
  date_series.date_value as calendar_date,
  TO_CHAR(date_series.date_value, 'YYYY-MM') as period,
  EXTRACT(YEAR FROM date_series.date_value) as calendar_year,
  EXTRACT(QUARTER FROM date_series.date_value) as calendar_quarter,
  EXTRACT(MONTH FROM date_series.date_value) as calendar_month,
  EXTRACT(WEEK FROM date_series.date_value) as calendar_week,
  EXTRACT(DOY FROM date_series.date_value) as day_of_year,
  EXTRACT(DOW FROM date_series.date_value) as day_of_week,
  TO_CHAR(date_series.date_value, 'Month') as month_name,
  TO_CHAR(date_series.date_value, 'Day') as day_name,
  
  -- Fiscal year calculations (assuming January start)
  CASE 
    WHEN EXTRACT(MONTH FROM date_series.date_value) >= 1 
    THEN EXTRACT(YEAR FROM date_series.date_value)
    ELSE EXTRACT(YEAR FROM date_series.date_value) - 1
  END as fiscal_year,
  
  CASE 
    WHEN EXTRACT(MONTH FROM date_series.date_value) BETWEEN 1 AND 3 THEN 1
    WHEN EXTRACT(MONTH FROM date_series.date_value) BETWEEN 4 AND 6 THEN 2
    WHEN EXTRACT(MONTH FROM date_series.date_value) BETWEEN 7 AND 9 THEN 3
    ELSE 4
  END as fiscal_quarter,
  
  -- Business day indicators
  CASE 
    WHEN EXTRACT(DOW FROM date_series.date_value) IN (0, 6) THEN false
    ELSE true
  END as is_business_day,
  
  -- Period-end flags
  CASE 
    WHEN date_series.date_value = (date_trunc('month', date_series.date_value) + interval '1 month - 1 day')::date 
    THEN true
    ELSE false
  END as is_month_end,
  
  CASE 
    WHEN date_series.date_value = (date_trunc('quarter', date_series.date_value) + interval '3 months - 1 day')::date 
    THEN true
    ELSE false
  END as is_quarter_end

FROM generate_series('2020-01-01'::date, CURRENT_DATE + interval '2 years', '1 day'::interval) AS date_series(date_value);

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT SELECT ON vw_dim_account TO authenticated;
GRANT SELECT ON vw_dim_profit_center TO authenticated;
GRANT SELECT ON vw_dim_cost_center TO authenticated;
GRANT SELECT ON vw_dim_product TO authenticated;
GRANT SELECT ON vw_dim_customer TO authenticated;
GRANT SELECT ON vw_dim_time TO authenticated;

-- ============================================================================
-- Add Comments
-- ============================================================================

COMMENT ON VIEW vw_dim_account IS 
'Chart of Accounts dimension with IFRS classification, hierarchy, and profitability relevance indicators.';

COMMENT ON VIEW vw_dim_profit_center IS 
'Profit Center dimension with CODM segment mapping, hierarchy, and business unit classification.';

COMMENT ON VIEW vw_dim_cost_center IS 
'Cost Center dimension with tag-based classification, headcount, and hierarchy information.';

COMMENT ON VIEW vw_dim_product IS 
'Product dimension with standard cost components, lifecycle status, and product classification.';

COMMENT ON VIEW vw_dim_customer IS 
'Customer dimension with segment classification, credit information, and acquisition metrics.';

COMMENT ON VIEW vw_dim_time IS 
'Time dimension with calendar and fiscal year support, business day indicators, and period-end flags.';

-- ============================================================================
-- Create Combined Dimensional Summary View
-- ============================================================================

CREATE OR REPLACE VIEW vw_profitability_dimensions_summary AS
SELECT 
  'ACCOUNT' as dimension_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_profitability_relevant THEN 1 END) as profitability_relevant,
  array_agg(DISTINCT account_group) as available_groups
FROM vw_dim_account

UNION ALL

SELECT 
  'PROFIT_CENTER' as dimension_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN codm_included THEN 1 END) as codm_relevant,
  array_agg(DISTINCT segment_code) as available_segments
FROM vw_dim_profit_center

UNION ALL

SELECT 
  'COST_CENTER' as dimension_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_admin_center THEN 1 END) as admin_centers,
  array_agg(DISTINCT cost_center_type) as available_types
FROM vw_dim_cost_center

UNION ALL

SELECT 
  'PRODUCT' as dimension_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN has_standard_cost THEN 1 END) as with_standard_cost,
  array_agg(DISTINCT product_category) as available_categories
FROM vw_dim_product

UNION ALL

SELECT 
  'CUSTOMER' as dimension_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN customer_tier = 'VIP' THEN 1 END) as vip_customers,
  array_agg(DISTINCT customer_segment) as available_segments
FROM vw_dim_customer;

GRANT SELECT ON vw_profitability_dimensions_summary TO authenticated;

COMMENT ON VIEW vw_profitability_dimensions_summary IS 
'Summary of all profitability dimensions with record counts and key attribute distributions.';