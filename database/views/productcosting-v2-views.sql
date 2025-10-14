-- ============================================================================
-- HERA Product Costing v2: Performance-Optimized Views
-- 
-- Materialized views for fast product costing, BOM explosion, routing analysis,
-- WIP calculation, variance reporting, and production posting validation.
-- 
-- Smart Code: HERA.COST.PRODUCT.VIEWS.V2
-- ============================================================================

-- ==========================================================================
-- 1. Product Master View (Materialized for Performance)
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_product_master_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_product_master_v2 AS
SELECT 
  ce.id as product_id,
  ce.organization_id,
  ce.entity_name,
  ce.entity_code,
  ce.status,
  ce.smart_code,
  ce.metadata,
  ce.created_at,
  ce.updated_at,
  
  -- Dynamic data fields
  dd_product_code.field_value_text as product_code,
  dd_product_type.field_value_text as product_type,
  dd_uom.field_value_text as uom,
  dd_std_cost_version.field_value_text as std_cost_version,
  dd_std_cost_components.field_value_json as std_cost_components,
  dd_effective_from.field_value_date as effective_from,
  dd_effective_to.field_value_date as effective_to,
  dd_gl_mapping.field_value_json as gl_mapping,
  
  -- Calculated standard cost total
  CASE 
    WHEN dd_std_cost_components.field_value_json IS NOT NULL THEN
      COALESCE((dd_std_cost_components.field_value_json->>'material')::DECIMAL, 0) +
      COALESCE((dd_std_cost_components.field_value_json->>'labor')::DECIMAL, 0) +
      COALESCE((dd_std_cost_components.field_value_json->>'overhead')::DECIMAL, 0) +
      COALESCE((dd_std_cost_components.field_value_json->>'subcontract')::DECIMAL, 0) +
      COALESCE((dd_std_cost_components.field_value_json->>'freight')::DECIMAL, 0) +
      COALESCE((dd_std_cost_components.field_value_json->>'other')::DECIMAL, 0)
    ELSE 0.00
  END as total_std_cost,
  
  -- Individual cost components (for easier querying)
  COALESCE((dd_std_cost_components.field_value_json->>'material')::DECIMAL, 0) as std_cost_material,
  COALESCE((dd_std_cost_components.field_value_json->>'labor')::DECIMAL, 0) as std_cost_labor,
  COALESCE((dd_std_cost_components.field_value_json->>'overhead')::DECIMAL, 0) as std_cost_overhead,
  COALESCE((dd_std_cost_components.field_value_json->>'subcontract')::DECIMAL, 0) as std_cost_subcontract,
  COALESCE((dd_std_cost_components.field_value_json->>'freight')::DECIMAL, 0) as std_cost_freight,
  COALESCE((dd_std_cost_components.field_value_json->>'other')::DECIMAL, 0) as std_cost_other,
  
  -- Current validity status
  CASE 
    WHEN dd_effective_from.field_value_date IS NOT NULL AND CURRENT_DATE < dd_effective_from.field_value_date THEN 'FUTURE'
    WHEN dd_effective_to.field_value_date IS NOT NULL AND CURRENT_DATE > dd_effective_to.field_value_date THEN 'EXPIRED'
    WHEN ce.status = 'ACTIVE' THEN 'ACTIVE'
    ELSE 'INACTIVE'
  END as validity_status,
  
  -- GL account mappings (extracted from JSON)
  dd_gl_mapping.field_value_json->>'wip_account' as wip_account,
  dd_gl_mapping.field_value_json->>'fg_account' as fg_account,
  dd_gl_mapping.field_value_json->>'cogs_account' as cogs_account,
  dd_gl_mapping.field_value_json->>'material_variance_account' as material_variance_account,
  dd_gl_mapping.field_value_json->>'labor_variance_account' as labor_variance_account,
  dd_gl_mapping.field_value_json->>'overhead_variance_account' as overhead_variance_account

FROM core_entities ce

-- Join dynamic data fields
LEFT JOIN core_dynamic_data dd_product_code 
  ON dd_product_code.entity_id = ce.id AND dd_product_code.field_name = 'product_code'
LEFT JOIN core_dynamic_data dd_product_type 
  ON dd_product_type.entity_id = ce.id AND dd_product_type.field_name = 'product_type'
LEFT JOIN core_dynamic_data dd_uom 
  ON dd_uom.entity_id = ce.id AND dd_uom.field_name = 'uom'
LEFT JOIN core_dynamic_data dd_std_cost_version 
  ON dd_std_cost_version.entity_id = ce.id AND dd_std_cost_version.field_name = 'std_cost_version'
LEFT JOIN core_dynamic_data dd_std_cost_components 
  ON dd_std_cost_components.entity_id = ce.id AND dd_std_cost_components.field_name = 'std_cost_components'
LEFT JOIN core_dynamic_data dd_effective_from 
  ON dd_effective_from.entity_id = ce.id AND dd_effective_from.field_name = 'effective_from'
LEFT JOIN core_dynamic_data dd_effective_to 
  ON dd_effective_to.entity_id = ce.id AND dd_effective_to.field_name = 'effective_to'
LEFT JOIN core_dynamic_data dd_gl_mapping 
  ON dd_gl_mapping.entity_id = ce.id AND dd_gl_mapping.field_name = 'gl_mapping'

WHERE ce.entity_type = 'PRODUCT';

-- ==========================================================================
-- 2. BOM Explosion View (Complete Multi-Level BOM)
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_bom_explosion_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_bom_explosion_v2 AS
WITH RECURSIVE bom_explosion AS (
  -- Base case: Level 1 BOM (direct components)
  SELECT 
    bom_rel.from_entity_id as parent_product_id,
    parent_prod.product_code as parent_product_code,
    parent_prod.entity_name as parent_product_name,
    
    bom_rel.to_entity_id as component_id,
    comp_prod.product_code as component_code,
    comp_prod.entity_name as component_name,
    comp_prod.product_type as component_type,
    comp_prod.uom as component_uom,
    comp_prod.total_std_cost as component_unit_cost,
    
    -- BOM metadata
    (bom_rel.metadata->>'qty_per')::DECIMAL as qty_per,
    COALESCE((bom_rel.metadata->>'scrap_pct')::DECIMAL, 0) as scrap_pct,
    COALESCE((bom_rel.metadata->>'sequence')::INTEGER, 1) as sequence,
    
    -- Calculated quantities
    (bom_rel.metadata->>'qty_per')::DECIMAL as direct_qty_per,
    (bom_rel.metadata->>'qty_per')::DECIMAL * (1 + COALESCE((bom_rel.metadata->>'scrap_pct')::DECIMAL, 0)) as extended_qty_per,
    
    -- Cost calculations
    (bom_rel.metadata->>'qty_per')::DECIMAL * (1 + COALESCE((bom_rel.metadata->>'scrap_pct')::DECIMAL, 0)) * 
    COALESCE(comp_prod.total_std_cost, 0) as extended_cost,
    
    1 as bom_level,
    ARRAY[bom_rel.from_entity_id] as path,
    bom_rel.organization_id
    
  FROM core_relationships bom_rel
  JOIN vw_product_master_v2 parent_prod ON parent_prod.product_id = bom_rel.from_entity_id
  JOIN vw_product_master_v2 comp_prod ON comp_prod.product_id = bom_rel.to_entity_id
  
  WHERE bom_rel.relationship_type = 'PRODUCT_CONSUMES_PRODUCT'
    AND bom_rel.is_active = true
    AND parent_prod.status = 'ACTIVE'
    AND comp_prod.status = 'ACTIVE'
  
  UNION ALL
  
  -- Recursive case: Multi-level BOM (components of components)
  SELECT 
    be.parent_product_id,
    be.parent_product_code,
    be.parent_product_name,
    
    sub_bom.to_entity_id as component_id,
    sub_comp.product_code as component_code,
    sub_comp.entity_name as component_name,
    sub_comp.product_type as component_type,
    sub_comp.uom as component_uom,
    sub_comp.total_std_cost as component_unit_cost,
    
    -- BOM metadata for this level
    (sub_bom.metadata->>'qty_per')::DECIMAL as qty_per,
    COALESCE((sub_bom.metadata->>'scrap_pct')::DECIMAL, 0) as scrap_pct,
    COALESCE((sub_bom.metadata->>'sequence')::INTEGER, 1) as sequence,
    
    -- Accumulated quantities
    be.direct_qty_per * (sub_bom.metadata->>'qty_per')::DECIMAL as direct_qty_per,
    be.extended_qty_per * (sub_bom.metadata->>'qty_per')::DECIMAL * 
    (1 + COALESCE((sub_bom.metadata->>'scrap_pct')::DECIMAL, 0)) as extended_qty_per,
    
    -- Accumulated cost
    be.extended_qty_per * (sub_bom.metadata->>'qty_per')::DECIMAL * 
    (1 + COALESCE((sub_bom.metadata->>'scrap_pct')::DECIMAL, 0)) * 
    COALESCE(sub_comp.total_std_cost, 0) as extended_cost,
    
    be.bom_level + 1 as bom_level,
    be.path || sub_bom.from_entity_id as path,
    be.organization_id
    
  FROM bom_explosion be
  JOIN core_relationships sub_bom ON sub_bom.from_entity_id = be.component_id
  JOIN vw_product_master_v2 sub_comp ON sub_comp.product_id = sub_bom.to_entity_id
  
  WHERE sub_bom.relationship_type = 'PRODUCT_CONSUMES_PRODUCT'
    AND sub_bom.is_active = true
    AND sub_comp.status = 'ACTIVE'
    AND be.bom_level < 10  -- Prevent infinite recursion
    AND NOT (sub_bom.to_entity_id = ANY(be.path))  -- Prevent cycles
)
SELECT * FROM bom_explosion
ORDER BY parent_product_id, bom_level, sequence;

-- ==========================================================================
-- 3. Routing Summary View
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_routing_summary_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_routing_summary_v2 AS
SELECT 
  routing_rel.from_entity_id as product_id,
  prod.product_code,
  prod.entity_name as product_name,
  prod.product_type,
  
  routing_rel.to_entity_id as activity_id,
  act.entity_name as activity_name,
  dd_activity_code.field_value_text as activity_code,
  dd_rate_per_hour.field_value_number as rate_per_hour,
  dd_cost_component.field_value_text as cost_component,
  
  -- Routing metadata
  (routing_rel.metadata->>'std_hours')::DECIMAL as std_hours,
  routing_rel.metadata->>'work_center_id' as work_center_id,
  COALESCE((routing_rel.metadata->>'sequence')::INTEGER, 1) as sequence,
  
  -- Cost calculations
  (routing_rel.metadata->>'std_hours')::DECIMAL * 
  COALESCE(dd_rate_per_hour.field_value_number, 0) as extended_cost,
  
  -- Work center details (if available)
  wc.entity_name as work_center_name,
  dd_wc_code.field_value_text as work_center_code,
  dd_wc_capacity.field_value_number as work_center_capacity_hours,
  dd_wc_overhead_rate.field_value_number as work_center_overhead_rate,
  
  routing_rel.organization_id,
  routing_rel.metadata as routing_metadata

FROM core_relationships routing_rel
JOIN vw_product_master_v2 prod ON prod.product_id = routing_rel.from_entity_id

-- Join to activity entity
JOIN core_entities act ON act.id = routing_rel.to_entity_id
LEFT JOIN core_dynamic_data dd_activity_code 
  ON dd_activity_code.entity_id = act.id AND dd_activity_code.field_name = 'activity_code'
LEFT JOIN core_dynamic_data dd_rate_per_hour 
  ON dd_rate_per_hour.entity_id = act.id AND dd_rate_per_hour.field_name = 'rate_per_hour'
LEFT JOIN core_dynamic_data dd_cost_component 
  ON dd_cost_component.entity_id = act.id AND dd_cost_component.field_name = 'cost_component'

-- Left join to work center (if specified)
LEFT JOIN core_entities wc ON wc.id = (routing_rel.metadata->>'work_center_id')::UUID
LEFT JOIN core_dynamic_data dd_wc_code 
  ON dd_wc_code.entity_id = wc.id AND dd_wc_code.field_name = 'work_center_code'
LEFT JOIN core_dynamic_data dd_wc_capacity 
  ON dd_wc_capacity.entity_id = wc.id AND dd_wc_capacity.field_name = 'capacity_hours_per_day'
LEFT JOIN core_dynamic_data dd_wc_overhead_rate 
  ON dd_wc_overhead_rate.entity_id = wc.id AND dd_wc_overhead_rate.field_name = 'overhead_rate_per_hour'

WHERE routing_rel.relationship_type = 'PRODUCT_PROCESSED_BY_ACTIVITY'
  AND routing_rel.is_active = true
  AND prod.status = 'ACTIVE'
  AND act.status = 'ACTIVE'
  AND act.entity_type = 'ACTIVITY_TYPE'

ORDER BY product_id, sequence;

-- ==========================================================================
-- 4. Cost Accounts Mapping View
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_cost_accounts_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_cost_accounts_v2 AS
SELECT 
  pm.product_id,
  pm.organization_id,
  pm.product_code,
  pm.entity_name as product_name,
  pm.product_type,
  
  -- Standard GL mappings from product
  pm.wip_account as product_wip_account,
  pm.fg_account as product_fg_account,
  pm.cogs_account as product_cogs_account,
  pm.material_variance_account as product_material_variance_account,
  pm.labor_variance_account as product_labor_variance_account,
  pm.overhead_variance_account as product_overhead_variance_account,
  
  -- Default accounts based on product type (policy-driven)
  CASE pm.product_type
    WHEN 'FINISHED' THEN COALESCE(pm.fg_account, '1400000')  -- Finished Goods
    WHEN 'SEMI' THEN COALESCE(pm.wip_account, '1350000')     -- Work in Process
    WHEN 'RAW' THEN '1330000'                                -- Raw Materials
    WHEN 'SERVICE' THEN NULL                                 -- No inventory account
  END as default_inventory_account,
  
  CASE pm.product_type
    WHEN 'FINISHED' THEN COALESCE(pm.cogs_account, '5100000') -- Cost of Goods Sold
    WHEN 'SEMI' THEN COALESCE(pm.cogs_account, '5100000')     -- Cost of Goods Sold
    WHEN 'SERVICE' THEN COALESCE(pm.cogs_account, '5200000')  -- Cost of Services
    ELSE NULL
  END as default_cogs_account,
  
  -- Variance accounts with defaults
  COALESCE(pm.material_variance_account, '5310000') as material_variance_account,
  COALESCE(pm.labor_variance_account, '5320000') as labor_variance_account,
  COALESCE(pm.overhead_variance_account, '5330000') as overhead_variance_account,
  
  -- WIP account for production
  CASE 
    WHEN pm.product_type IN ('FINISHED', 'SEMI') THEN COALESCE(pm.wip_account, '1350000')
    ELSE NULL
  END as wip_account,
  
  -- Standard cost for valuation
  pm.total_std_cost,
  pm.std_cost_material,
  pm.std_cost_labor,
  pm.std_cost_overhead,
  
  -- Posting flags
  pm.product_type IN ('FINISHED', 'SEMI', 'RAW') as requires_inventory_posting,
  pm.product_type IN ('FINISHED', 'SEMI') as requires_wip_posting,
  pm.total_std_cost > 0 as has_standard_cost

FROM vw_product_master_v2 pm
WHERE pm.status = 'ACTIVE';

-- ==========================================================================
-- 5. Production Facts Summary (Materialized)
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS fact_production_costing_v2 CASCADE;

CREATE MATERIALIZED VIEW fact_production_costing_v2 AS
SELECT 
  pm.organization_id,
  pm.product_id,
  pm.product_code,
  pm.entity_name as product_name,
  pm.product_type,
  pm.total_std_cost,
  
  -- BOM summary
  COALESCE(bom_summary.component_count, 0) as bom_component_count,
  COALESCE(bom_summary.total_bom_cost, 0) as total_bom_cost,
  COALESCE(bom_summary.bom_levels, 0) as bom_levels,
  
  -- Routing summary
  COALESCE(routing_summary.activity_count, 0) as routing_activity_count,
  COALESCE(routing_summary.total_routing_hours, 0) as total_routing_hours,
  COALESCE(routing_summary.total_routing_cost, 0) as total_routing_cost,
  
  -- Cost rollup
  pm.std_cost_material + COALESCE(bom_summary.total_bom_cost, 0) as total_material_cost,
  pm.std_cost_labor + COALESCE(routing_summary.total_routing_cost, 0) as total_labor_cost,
  pm.std_cost_overhead as total_overhead_cost,
  
  -- Variance indicators (placeholders for actual variance data)
  0.00 as mtd_material_variance,
  0.00 as mtd_labor_variance,
  0.00 as mtd_overhead_variance,
  0.00 as ytd_material_variance,
  0.00 as ytd_labor_variance,
  0.00 as ytd_overhead_variance,
  
  -- Cost accuracy indicators
  CASE 
    WHEN pm.total_std_cost > 0 AND COALESCE(bom_summary.total_bom_cost, 0) + COALESCE(routing_summary.total_routing_cost, 0) > 0 THEN
      ABS(pm.total_std_cost - (COALESCE(bom_summary.total_bom_cost, 0) + COALESCE(routing_summary.total_routing_cost, 0))) / pm.total_std_cost
    ELSE 0
  END as cost_variance_percent,
  
  -- Flags
  pm.total_std_cost > 0 as has_standard_cost,
  COALESCE(bom_summary.component_count, 0) > 0 as has_bom,
  COALESCE(routing_summary.activity_count, 0) > 0 as has_routing

FROM vw_product_master_v2 pm

-- BOM cost rollup
LEFT JOIN (
  SELECT 
    parent_product_id,
    COUNT(DISTINCT component_id) as component_count,
    SUM(extended_cost) as total_bom_cost,
    MAX(bom_level) as bom_levels
  FROM vw_bom_explosion_v2
  WHERE bom_level = 1  -- Only direct components for cost rollup
  GROUP BY parent_product_id
) bom_summary ON bom_summary.parent_product_id = pm.product_id

-- Routing cost rollup
LEFT JOIN (
  SELECT 
    product_id,
    COUNT(*) as activity_count,
    SUM(std_hours) as total_routing_hours,
    SUM(extended_cost) as total_routing_cost
  FROM vw_routing_summary_v2
  GROUP BY product_id
) routing_summary ON routing_summary.product_id = pm.product_id

WHERE pm.status = 'ACTIVE';

-- ==========================================================================
-- 6. Indexes for Performance
-- ==========================================================================

-- Product Master View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_product_master_v2_id 
ON vw_product_master_v2 (product_id);

CREATE INDEX IF NOT EXISTS idx_vw_product_master_v2_org_code 
ON vw_product_master_v2 (organization_id, product_code);

CREATE INDEX IF NOT EXISTS idx_vw_product_master_v2_type 
ON vw_product_master_v2 (organization_id, product_type);

CREATE INDEX IF NOT EXISTS idx_vw_product_master_v2_validity 
ON vw_product_master_v2 (organization_id, validity_status);

CREATE INDEX IF NOT EXISTS idx_vw_product_master_v2_cost 
ON vw_product_master_v2 (organization_id, total_std_cost) 
WHERE total_std_cost > 0;

-- BOM Explosion View Indexes
CREATE INDEX IF NOT EXISTS idx_vw_bom_explosion_v2_parent 
ON vw_bom_explosion_v2 (organization_id, parent_product_id);

CREATE INDEX IF NOT EXISTS idx_vw_bom_explosion_v2_component 
ON vw_bom_explosion_v2 (organization_id, component_id);

CREATE INDEX IF NOT EXISTS idx_vw_bom_explosion_v2_level 
ON vw_bom_explosion_v2 (organization_id, parent_product_id, bom_level);

-- Routing Summary View Indexes
CREATE INDEX IF NOT EXISTS idx_vw_routing_summary_v2_product 
ON vw_routing_summary_v2 (organization_id, product_id);

CREATE INDEX IF NOT EXISTS idx_vw_routing_summary_v2_activity 
ON vw_routing_summary_v2 (organization_id, activity_id);

CREATE INDEX IF NOT EXISTS idx_vw_routing_summary_v2_wc 
ON vw_routing_summary_v2 (organization_id, work_center_id) 
WHERE work_center_id IS NOT NULL;

-- Cost Accounts View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_cost_accounts_v2_product 
ON vw_cost_accounts_v2 (product_id);

CREATE INDEX IF NOT EXISTS idx_vw_cost_accounts_v2_org_type 
ON vw_cost_accounts_v2 (organization_id, product_type);

-- Production Facts View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_fact_production_costing_v2_product 
ON fact_production_costing_v2 (product_id);

CREATE INDEX IF NOT EXISTS idx_fact_production_costing_v2_org 
ON fact_production_costing_v2 (organization_id);

CREATE INDEX IF NOT EXISTS idx_fact_production_costing_v2_type 
ON fact_production_costing_v2 (organization_id, product_type);

-- ==========================================================================
-- 7. Refresh Functions
-- ==========================================================================

-- Function to refresh all product costing materialized views
CREATE OR REPLACE FUNCTION refresh_productcosting_views_v2()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh views in dependency order
  REFRESH MATERIALIZED VIEW vw_product_master_v2;
  REFRESH MATERIALIZED VIEW vw_bom_explosion_v2;
  REFRESH MATERIALIZED VIEW vw_routing_summary_v2;
  REFRESH MATERIALIZED VIEW vw_cost_accounts_v2;
  REFRESH MATERIALIZED VIEW fact_production_costing_v2;
  
  -- Log refresh operation
  INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    smart_code,
    transaction_date,
    reference_number,
    total_amount,
    metadata
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, -- System organization
    'system_operation',
    'HERA.COST.PRODUCT.VIEWS.REFRESH.V2',
    CURRENT_TIMESTAMP,
    'PROD-VIEWS-REFRESH-' || extract(epoch from now())::text,
    0.00,
    jsonb_build_object(
      'operation_type', 'MATERIALIZED_VIEW_REFRESH',
      'views_refreshed', ARRAY[
        'vw_product_master_v2', 
        'vw_bom_explosion_v2', 
        'vw_routing_summary_v2',
        'vw_cost_accounts_v2',
        'fact_production_costing_v2'
      ]
    )
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_productcosting_views_v2() TO authenticated;

-- ==========================================================================
-- 8. Helper Functions for Common Queries
-- ==========================================================================

-- Function to get complete BOM cost for a product
CREATE OR REPLACE FUNCTION get_bom_cost_v2(p_product_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_cost DECIMAL := 0.00;
BEGIN
  SELECT COALESCE(SUM(extended_cost), 0) INTO v_total_cost
  FROM vw_bom_explosion_v2
  WHERE parent_product_id = p_product_id;
  
  RETURN v_total_cost;
END;
$$;

-- Function to get complete routing cost for a product
CREATE OR REPLACE FUNCTION get_routing_cost_v2(p_product_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_cost DECIMAL := 0.00;
BEGIN
  SELECT COALESCE(SUM(extended_cost), 0) INTO v_total_cost
  FROM vw_routing_summary_v2
  WHERE product_id = p_product_id;
  
  RETURN v_total_cost;
END;
$$;

-- Function to check if product is valid for costing on a given date
CREATE OR REPLACE FUNCTION is_product_valid_for_costing_v2(
  p_product_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_is_valid BOOLEAN := false;
BEGIN
  SELECT 
    (status = 'ACTIVE' AND
     validity_status = 'ACTIVE' AND
     (effective_from IS NULL OR p_date >= effective_from) AND
     (effective_to IS NULL OR p_date <= effective_to))
  INTO v_is_valid
  FROM vw_product_master_v2
  WHERE product_id = p_product_id;
  
  RETURN COALESCE(v_is_valid, false);
END;
$$;

-- Function to get all components for a product (single level)
CREATE OR REPLACE FUNCTION get_product_components_v2(p_product_id UUID)
RETURNS TABLE(
  component_id UUID, 
  component_code TEXT, 
  component_name TEXT, 
  qty_per DECIMAL, 
  extended_cost DECIMAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    be.component_id,
    be.component_code,
    be.component_name,
    be.qty_per,
    be.extended_cost
  FROM vw_bom_explosion_v2 be
  WHERE be.parent_product_id = p_product_id
    AND be.bom_level = 1
  ORDER BY be.sequence;
END;
$$;

-- Function to get product routing activities
CREATE OR REPLACE FUNCTION get_product_routing_v2(p_product_id UUID)
RETURNS TABLE(
  activity_id UUID,
  activity_code TEXT,
  activity_name TEXT,
  std_hours DECIMAL,
  rate_per_hour DECIMAL,
  extended_cost DECIMAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.activity_id,
    rs.activity_code,
    rs.activity_name,
    rs.std_hours,
    rs.rate_per_hour,
    rs.extended_cost
  FROM vw_routing_summary_v2 rs
  WHERE rs.product_id = p_product_id
  ORDER BY rs.sequence;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_bom_cost_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_routing_cost_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_product_valid_for_costing_v2(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_components_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_routing_v2(UUID) TO authenticated;

-- ==========================================================================
-- 10. Comments for Documentation
-- ==========================================================================

COMMENT ON MATERIALIZED VIEW vw_product_master_v2 IS 
'HERA Product Costing v2: Complete product master data with standard cost components, GL mappings, and validity status. Optimized for fast product lookup and costing calculations.';

COMMENT ON MATERIALIZED VIEW vw_bom_explosion_v2 IS 
'HERA Product Costing v2: Multi-level BOM explosion with cost rollup, quantity calculations, and cycle detection. Supports unlimited BOM levels with complete cost traceability.';

COMMENT ON MATERIALIZED VIEW vw_routing_summary_v2 IS 
'HERA Product Costing v2: Complete routing summary with activity costs, work center assignments, and standard hours. Optimized for production scheduling and cost calculation.';

COMMENT ON MATERIALIZED VIEW vw_cost_accounts_v2 IS 
'HERA Product Costing v2: GL account mappings for inventory, WIP, COGS, and variance accounts with policy-driven defaults. Essential for automated posting and cost accounting.';

COMMENT ON MATERIALIZED VIEW fact_production_costing_v2 IS 
'HERA Product Costing v2: Production costing fact table with BOM/routing summaries, cost rollups, and variance tracking. Optimized for reporting and analytics.';

COMMENT ON FUNCTION refresh_productcosting_views_v2() IS 
'HERA Product Costing v2: Refresh all product costing materialized views in correct dependency order with audit logging.';

COMMENT ON FUNCTION get_bom_cost_v2(UUID) IS 
'HERA Product Costing v2: Calculate total BOM cost for a product including all levels and scrap allowances.';

COMMENT ON FUNCTION get_routing_cost_v2(UUID) IS 
'HERA Product Costing v2: Calculate total routing cost for a product based on standard hours and activity rates.';

COMMENT ON FUNCTION is_product_valid_for_costing_v2(UUID, DATE) IS 
'HERA Product Costing v2: Check if a product is valid for costing operations on a specific date based on status and effective dates.';

COMMENT ON FUNCTION get_product_components_v2(UUID) IS 
'HERA Product Costing v2: Get direct components for a product with quantities and costs for BOM analysis.';

COMMENT ON FUNCTION get_product_routing_v2(UUID) IS 
'HERA Product Costing v2: Get routing activities for a product with standard hours and costs for production planning.';