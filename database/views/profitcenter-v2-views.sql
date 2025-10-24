-- ============================================================================
-- HERA Profit Center v2: Performance-Optimized Views
-- 
-- Materialized views for fast profit center tree traversal, IFRS 8 (CODM) reporting,
-- segment mapping, and dimensional lookup for posting validation.
-- 
-- Smart Code: HERA.PROFITCENTER.VIEWS.V2
-- ============================================================================

-- ==========================================================================
-- 1. Profit Center Tree View (Materialized for Performance)
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_profitcenter_tree_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_profitcenter_tree_v2 AS
WITH RECURSIVE profitcenter_hierarchy AS (
  -- Base case: Root profit centers (no parent)
  SELECT 
    ce.id as profit_center_id,
    ce.organization_id,
    ce.entity_name,
    ce.entity_code,
    ce.status,
    ce.smart_code,
    ce.metadata,
    ce.created_at,
    ce.updated_at,
    
    -- Dynamic data fields
    dd_pc_code.field_value_text as pc_code,
    dd_depth.field_value_number::integer as depth,
    dd_segment_code.field_value_text as segment_code,
    dd_valid_from.field_value_date as valid_from,
    dd_valid_to.field_value_date as valid_to,
    dd_manager.field_value_text as manager,
    dd_region_code.field_value_text as region_code,
    dd_tags.field_value_json as tags_json,
    CASE 
      WHEN dd_tags.field_value_json IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(dd_tags.field_value_json))
      ELSE NULL::text[]
    END as tags,
    dd_codm_inclusion.field_value_boolean as codm_inclusion,
    
    -- Hierarchy fields
    NULL::uuid as parent_id,
    NULL::text as parent_pc_code,
    dd_pc_code.field_value_text as path,
    0 as level,
    ARRAY[ce.id] as profit_center_path
    
  FROM core_entities ce
  
  -- Join dynamic data fields
  LEFT JOIN core_dynamic_data dd_pc_code 
    ON dd_pc_code.entity_id = ce.id AND dd_pc_code.field_name = 'pc_code'
  LEFT JOIN core_dynamic_data dd_depth 
    ON dd_depth.entity_id = ce.id AND dd_depth.field_name = 'depth'
  LEFT JOIN core_dynamic_data dd_segment_code 
    ON dd_segment_code.entity_id = ce.id AND dd_segment_code.field_name = 'segment_code'
  LEFT JOIN core_dynamic_data dd_valid_from 
    ON dd_valid_from.entity_id = ce.id AND dd_valid_from.field_name = 'valid_from'
  LEFT JOIN core_dynamic_data dd_valid_to 
    ON dd_valid_to.entity_id = ce.id AND dd_valid_to.field_name = 'valid_to'
  LEFT JOIN core_dynamic_data dd_manager 
    ON dd_manager.entity_id = ce.id AND dd_manager.field_name = 'manager'
  LEFT JOIN core_dynamic_data dd_region_code 
    ON dd_region_code.entity_id = ce.id AND dd_region_code.field_name = 'region_code'
  LEFT JOIN core_dynamic_data dd_tags 
    ON dd_tags.entity_id = ce.id AND dd_tags.field_name = 'tags'
  LEFT JOIN core_dynamic_data dd_codm_inclusion 
    ON dd_codm_inclusion.entity_id = ce.id AND dd_codm_inclusion.field_name = 'codm_inclusion'
    
  WHERE 
    ce.entity_type = 'PROFIT_CENTER'
    AND NOT EXISTS (
      SELECT 1 FROM core_relationships cr
      WHERE cr.to_entity_id = ce.id 
        AND cr.relationship_type = 'PROFIT_CENTER_PARENT_OF'
        AND cr.organization_id = ce.organization_id
    )
    
  UNION ALL
  
  -- Recursive case: Child profit centers
  SELECT 
    ce.id as profit_center_id,
    ce.organization_id,
    ce.entity_name,
    ce.entity_code,
    ce.status,
    ce.smart_code,
    ce.metadata,
    ce.created_at,
    ce.updated_at,
    
    -- Dynamic data fields
    dd_pc_code.field_value_text as pc_code,
    dd_depth.field_value_number::integer as depth,
    dd_segment_code.field_value_text as segment_code,
    dd_valid_from.field_value_date as valid_from,
    dd_valid_to.field_value_date as valid_to,
    dd_manager.field_value_text as manager,
    dd_region_code.field_value_text as region_code,
    dd_tags.field_value_json as tags_json,
    CASE 
      WHEN dd_tags.field_value_json IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(dd_tags.field_value_json))
      ELSE NULL::text[]
    END as tags,
    dd_codm_inclusion.field_value_boolean as codm_inclusion,
    
    -- Hierarchy fields
    cr.from_entity_id as parent_id,
    parent.pc_code as parent_pc_code,
    parent.path || '.' || dd_pc_code.field_value_text as path,
    parent.level + 1 as level,
    parent.profit_center_path || ce.id as profit_center_path
    
  FROM core_entities ce
  JOIN core_relationships cr 
    ON cr.to_entity_id = ce.id 
    AND cr.relationship_type = 'PROFIT_CENTER_PARENT_OF'
    AND cr.organization_id = ce.organization_id
  JOIN profitcenter_hierarchy parent 
    ON parent.profit_center_id = cr.from_entity_id
    
  -- Join dynamic data fields
  LEFT JOIN core_dynamic_data dd_pc_code 
    ON dd_pc_code.entity_id = ce.id AND dd_pc_code.field_name = 'pc_code'
  LEFT JOIN core_dynamic_data dd_depth 
    ON dd_depth.entity_id = ce.id AND dd_depth.field_name = 'depth'
  LEFT JOIN core_dynamic_data dd_segment_code 
    ON dd_segment_code.entity_id = ce.id AND dd_segment_code.field_name = 'segment_code'
  LEFT JOIN core_dynamic_data dd_valid_from 
    ON dd_valid_from.entity_id = ce.id AND dd_valid_from.field_name = 'valid_from'
  LEFT JOIN core_dynamic_data dd_valid_to 
    ON dd_valid_to.entity_id = ce.id AND dd_valid_to.field_name = 'valid_to'
  LEFT JOIN core_dynamic_data dd_manager 
    ON dd_manager.entity_id = ce.id AND dd_manager.field_name = 'manager'
  LEFT JOIN core_dynamic_data dd_region_code 
    ON dd_region_code.entity_id = ce.id AND dd_region_code.field_name = 'region_code'
  LEFT JOIN core_dynamic_data dd_tags 
    ON dd_tags.entity_id = ce.id AND dd_tags.field_name = 'tags'
  LEFT JOIN core_dynamic_data dd_codm_inclusion 
    ON dd_codm_inclusion.entity_id = ce.id AND dd_codm_inclusion.field_name = 'codm_inclusion'
    
  WHERE ce.entity_type = 'PROFIT_CENTER'
)
SELECT * FROM profitcenter_hierarchy;

-- ==========================================================================
-- 2. Profit Center Flat View (for Search and Reporting)
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_profitcenter_flat_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_profitcenter_flat_v2 AS
SELECT 
  pt.*,
  
  -- Current validity status
  CASE 
    WHEN pt.valid_from IS NOT NULL AND CURRENT_DATE < pt.valid_from THEN 'FUTURE'
    WHEN pt.valid_to IS NOT NULL AND CURRENT_DATE > pt.valid_to THEN 'EXPIRED'
    WHEN pt.status = 'ACTIVE' THEN 'ACTIVE'
    ELSE 'INACTIVE'
  END as validity_status,
  
  -- CODM reporting status
  CASE 
    WHEN pt.codm_inclusion = TRUE AND pt.segment_code IS NOT NULL THEN 'INCLUDED'
    WHEN pt.codm_inclusion = TRUE AND pt.segment_code IS NULL THEN 'INVALID'
    ELSE 'EXCLUDED'
  END as codm_status,
  
  -- Segment grouping
  CASE 
    WHEN pt.segment_code IS NOT NULL THEN pt.segment_code
    ELSE 'UNASSIGNED'
  END as segment_group,
  
  -- Children summary (for parent profit centers)
  COALESCE(child_summary.child_count, 0) as child_count,
  COALESCE(child_summary.active_child_count, 0) as active_child_count,
  COALESCE(child_summary.codm_child_count, 0) as codm_child_count,
  
  -- Searchable text for full-text search
  LOWER(pt.entity_name || ' ' || pt.pc_code || ' ' || 
        COALESCE(pt.segment_code, '') || ' ' ||
        COALESCE(pt.manager, '') || ' ' ||
        COALESCE(pt.region_code, '') || ' ' ||
        COALESCE(array_to_string(pt.tags, ' '), '')) as search_text

FROM vw_profitcenter_tree_v2 pt
LEFT JOIN (
  SELECT 
    parent_id,
    COUNT(*) as child_count,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_child_count,
    COUNT(*) FILTER (WHERE codm_inclusion = TRUE) as codm_child_count
  FROM vw_profitcenter_tree_v2
  WHERE parent_id IS NOT NULL
  GROUP BY parent_id
) child_summary ON child_summary.parent_id = pt.profit_center_id;

-- ==========================================================================
-- 3. Profit Center to Segment Mapping View
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_pc_segment_map_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_pc_segment_map_v2 AS
SELECT 
  pc.profit_center_id,
  pc.pc_code,
  pc.entity_name as pc_name,
  pc.organization_id,
  pc.codm_inclusion,
  
  -- Segment mapping (using field approach)
  pc.segment_code,
  
  -- Alternative: Segment mapping via relationships (if using entity approach)
  seg_rel.to_entity_id as segment_entity_id,
  seg.entity_name as segment_name,
  seg_dd.field_value_text as segment_entity_code,
  
  -- Region mapping (if exists)
  reg_rel.to_entity_id as region_id,
  reg.entity_name as region_name,
  pc.region_code,
  
  -- CODM validation flags
  CASE 
    WHEN pc.codm_inclusion = TRUE AND (pc.segment_code IS NOT NULL OR seg_rel.to_entity_id IS NOT NULL) 
    THEN TRUE 
    ELSE FALSE 
  END as is_codm_valid,
  
  -- Effective mapping metadata
  seg_rel.metadata as segment_mapping_metadata,
  reg_rel.metadata as region_mapping_metadata

FROM vw_profitcenter_tree_v2 pc

-- Left join to segment relationship (alternative approach)
LEFT JOIN core_relationships seg_rel 
  ON seg_rel.from_entity_id = pc.profit_center_id
  AND seg_rel.relationship_type = 'PROFIT_CENTER_BELONGS_TO_SEGMENT'
  AND seg_rel.organization_id = pc.organization_id

-- Left join to segment entity
LEFT JOIN core_entities seg 
  ON seg.id = seg_rel.to_entity_id
  AND seg.entity_type = 'BUSINESS_SEGMENT'

-- Left join to segment entity code
LEFT JOIN core_dynamic_data seg_dd 
  ON seg_dd.entity_id = seg.id 
  AND seg_dd.field_name = 'segment_code'

-- Left join to region relationship
LEFT JOIN core_relationships reg_rel 
  ON reg_rel.from_entity_id = pc.profit_center_id
  AND reg_rel.relationship_type = 'PROFIT_CENTER_HAS_REGION'
  AND reg_rel.organization_id = pc.organization_id

-- Left join to region entity
LEFT JOIN core_entities reg 
  ON reg.id = reg_rel.to_entity_id
  AND reg.entity_type = 'REGION'

WHERE pc.status = 'ACTIVE';

-- ==========================================================================
-- 4. Cost Center to Profit Center Alignment View
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_cc_pc_alignment_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_cc_pc_alignment_v2 AS
SELECT 
  cc_pc_rel.from_entity_id as cost_center_id,
  cc.entity_name as cc_name,
  cc_dd.field_value_text as cc_code,
  
  cc_pc_rel.to_entity_id as profit_center_id,
  pc.entity_name as pc_name,
  pc_dd.field_value_text as pc_code,
  pc_seg_dd.field_value_text as pc_segment_code,
  
  cc_pc_rel.organization_id,
  cc_pc_rel.metadata as alignment_metadata,
  
  -- Alignment validation
  CASE 
    WHEN cc.status = 'ACTIVE' AND pc.status = 'ACTIVE' THEN 'VALID'
    WHEN cc.status = 'ARCHIVED' OR pc.status = 'ARCHIVED' THEN 'INACTIVE'
    ELSE 'INVALID'
  END as alignment_status

FROM core_relationships cc_pc_rel

-- Join to cost center entity
JOIN core_entities cc 
  ON cc.id = cc_pc_rel.from_entity_id
  AND cc.entity_type = 'COST_CENTER'

-- Join to cost center code
LEFT JOIN core_dynamic_data cc_dd 
  ON cc_dd.entity_id = cc.id 
  AND cc_dd.field_name = 'cc_code'

-- Join to profit center entity
JOIN core_entities pc 
  ON pc.id = cc_pc_rel.to_entity_id
  AND pc.entity_type = 'PROFIT_CENTER'

-- Join to profit center code
LEFT JOIN core_dynamic_data pc_dd 
  ON pc_dd.entity_id = pc.id 
  AND pc_dd.field_name = 'pc_code'

-- Join to profit center segment code
LEFT JOIN core_dynamic_data pc_seg_dd 
  ON pc_seg_dd.entity_id = pc.id 
  AND pc_seg_dd.field_name = 'segment_code'

WHERE cc_pc_rel.relationship_type = 'COST_CENTER_ASSIGNED_TO_PROFIT_CENTER';

-- ==========================================================================
-- 5. Profit Center Posting Requirements View
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_profitcenter_posting_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_profitcenter_posting_v2 AS
SELECT 
  pf.profit_center_id,
  pf.organization_id,
  pf.pc_code,
  pf.entity_name,
  pf.segment_code,
  pf.status,
  pf.validity_status,
  pf.codm_inclusion,
  pf.codm_status,
  
  -- Posting validation flags
  CASE 
    WHEN pf.status = 'ACTIVE' AND pf.validity_status = 'ACTIVE' THEN true
    ELSE false
  END as is_postable,
  
  -- Account ranges that require this profit center
  ARRAY['4xxx', '5xxx'] as required_for_ranges,
  ARRAY['6xxx'] as optional_for_ranges,
  
  -- CODM reporting eligibility
  CASE 
    WHEN pf.codm_inclusion = TRUE AND pf.codm_status = 'INCLUDED' THEN true
    ELSE false
  END as is_codm_eligible,
  
  -- Additional validation metadata
  jsonb_build_object(
    'valid_from', pf.valid_from,
    'valid_to', pf.valid_to,
    'manager', pf.manager,
    'region_code', pf.region_code,
    'segment_group', pf.segment_group,
    'depth', pf.depth,
    'has_children', CASE WHEN pf.child_count > 0 THEN true ELSE false END
  ) as posting_metadata

FROM vw_profitcenter_flat_v2 pf
WHERE pf.status = 'ACTIVE';

-- ==========================================================================
-- 6. IFRS 8 (CODM) Reporting View
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_codm_profitability_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_codm_profitability_v2 AS
SELECT 
  pc.organization_id,
  pc.segment_code,
  pc.profit_center_id,
  pc.pc_code,
  pc.entity_name as pc_name,
  pc.manager,
  pc.region_code,
  
  -- CODM aggregation summary (placeholder for actual financial data)
  -- This would typically aggregate from actual transaction data
  0.00 as total_revenue,
  0.00 as total_expenses,
  0.00 as operating_profit,
  0.00 as segment_assets,
  0.00 as segment_liabilities,
  
  -- Metadata for reporting
  jsonb_build_object(
    'reporting_level', 'PROFIT_CENTER',
    'codm_inclusion_date', pc.valid_from,
    'tags', pc.tags,
    'depth', pc.depth
  ) as codm_metadata

FROM vw_profitcenter_flat_v2 pc
WHERE pc.codm_status = 'INCLUDED'
  AND pc.status = 'ACTIVE';

-- ==========================================================================
-- 7. Indexes for Performance
-- ==========================================================================

-- Profit Center Tree View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_profitcenter_tree_v2_id 
ON vw_profitcenter_tree_v2 (profit_center_id);

CREATE INDEX IF NOT EXISTS idx_vw_profitcenter_tree_v2_org_code 
ON vw_profitcenter_tree_v2 (organization_id, pc_code);

CREATE INDEX IF NOT EXISTS idx_vw_profitcenter_tree_v2_parent 
ON vw_profitcenter_tree_v2 (organization_id, parent_id);

CREATE INDEX IF NOT EXISTS idx_vw_profitcenter_tree_v2_segment 
ON vw_profitcenter_tree_v2 (organization_id, segment_code);

CREATE INDEX IF NOT EXISTS idx_vw_profitcenter_tree_v2_status 
ON vw_profitcenter_tree_v2 (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_vw_profitcenter_tree_v2_codm 
ON vw_profitcenter_tree_v2 (organization_id, codm_inclusion) 
WHERE codm_inclusion = true;

-- Profit Center Flat View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_profitcenter_flat_v2_id 
ON vw_profitcenter_flat_v2 (profit_center_id);

CREATE INDEX IF NOT EXISTS idx_vw_profitcenter_flat_v2_search 
ON vw_profitcenter_flat_v2 USING gin(to_tsvector('english', search_text));

CREATE INDEX IF NOT EXISTS idx_vw_profitcenter_flat_v2_validity 
ON vw_profitcenter_flat_v2 (organization_id, validity_status);

CREATE INDEX IF NOT EXISTS idx_vw_profitcenter_flat_v2_codm 
ON vw_profitcenter_flat_v2 (organization_id, codm_status);

CREATE INDEX IF NOT EXISTS idx_vw_profitcenter_flat_v2_segment 
ON vw_profitcenter_flat_v2 (organization_id, segment_group);

-- PC Segment Mapping View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_pc_segment_map_v2_pc_id 
ON vw_pc_segment_map_v2 (profit_center_id);

CREATE INDEX IF NOT EXISTS idx_vw_pc_segment_map_v2_org_segment 
ON vw_pc_segment_map_v2 (organization_id, segment_code);

CREATE INDEX IF NOT EXISTS idx_vw_pc_segment_map_v2_codm_valid 
ON vw_pc_segment_map_v2 (organization_id, is_codm_valid) 
WHERE is_codm_valid = true;

-- CC-PC Alignment View Indexes
CREATE INDEX IF NOT EXISTS idx_vw_cc_pc_alignment_v2_cc_id 
ON vw_cc_pc_alignment_v2 (cost_center_id);

CREATE INDEX IF NOT EXISTS idx_vw_cc_pc_alignment_v2_pc_id 
ON vw_cc_pc_alignment_v2 (profit_center_id);

CREATE INDEX IF NOT EXISTS idx_vw_cc_pc_alignment_v2_status 
ON vw_cc_pc_alignment_v2 (organization_id, alignment_status);

-- Posting Requirements View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_profitcenter_posting_v2_id 
ON vw_profitcenter_posting_v2 (profit_center_id);

CREATE INDEX IF NOT EXISTS idx_vw_profitcenter_posting_v2_postable 
ON vw_profitcenter_posting_v2 (organization_id, is_postable) 
WHERE is_postable = true;

CREATE INDEX IF NOT EXISTS idx_vw_profitcenter_posting_v2_codm_eligible 
ON vw_profitcenter_posting_v2 (organization_id, is_codm_eligible) 
WHERE is_codm_eligible = true;

-- CODM Profitability View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_codm_profitability_v2_pc_id 
ON vw_codm_profitability_v2 (profit_center_id);

CREATE INDEX IF NOT EXISTS idx_vw_codm_profitability_v2_segment 
ON vw_codm_profitability_v2 (organization_id, segment_code);

-- ==========================================================================
-- 8. Refresh Functions
-- ==========================================================================

-- Function to refresh all profit center materialized views
CREATE OR REPLACE FUNCTION refresh_profitcenter_views_v2()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh views in dependency order
  REFRESH MATERIALIZED VIEW vw_profitcenter_tree_v2;
  REFRESH MATERIALIZED VIEW vw_profitcenter_flat_v2;
  REFRESH MATERIALIZED VIEW vw_pc_segment_map_v2;
  REFRESH MATERIALIZED VIEW vw_cc_pc_alignment_v2;
  REFRESH MATERIALIZED VIEW vw_profitcenter_posting_v2;
  REFRESH MATERIALIZED VIEW vw_codm_profitability_v2;
  
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
    'HERA.PROFITCENTER.VIEWS.REFRESH.V2',
    CURRENT_TIMESTAMP,
    'PC-VIEWS-REFRESH-' || extract(epoch from now())::text,
    0.00,
    jsonb_build_object(
      'operation_type', 'MATERIALIZED_VIEW_REFRESH',
      'views_refreshed', ARRAY[
        'vw_profitcenter_tree_v2', 
        'vw_profitcenter_flat_v2', 
        'vw_pc_segment_map_v2',
        'vw_cc_pc_alignment_v2',
        'vw_profitcenter_posting_v2',
        'vw_codm_profitability_v2'
      ]
    )
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_profitcenter_views_v2() TO authenticated;

-- ==========================================================================
-- 9. Helper Functions for Common Queries
-- ==========================================================================

-- Function to get profit center hierarchy path as text
CREATE OR REPLACE FUNCTION get_profitcenter_path_v2(p_profit_center_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_path TEXT;
BEGIN
  SELECT path INTO v_path
  FROM vw_profitcenter_tree_v2
  WHERE profit_center_id = p_profit_center_id;
  
  RETURN COALESCE(v_path, '');
END;
$$;

-- Function to check if profit center is valid for posting on a given date
CREATE OR REPLACE FUNCTION is_profitcenter_valid_for_posting_v2(
  p_profit_center_id UUID,
  p_posting_date DATE DEFAULT CURRENT_DATE
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
     (valid_from IS NULL OR p_posting_date >= valid_from) AND
     (valid_to IS NULL OR p_posting_date <= valid_to))
  INTO v_is_valid
  FROM vw_profitcenter_tree_v2
  WHERE profit_center_id = p_profit_center_id;
  
  RETURN COALESCE(v_is_valid, false);
END;
$$;

-- Function to check if profit center is valid for CODM reporting
CREATE OR REPLACE FUNCTION is_profitcenter_codm_eligible_v2(p_profit_center_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_is_eligible BOOLEAN := false;
BEGIN
  SELECT is_codm_eligible INTO v_is_eligible
  FROM vw_profitcenter_posting_v2
  WHERE profit_center_id = p_profit_center_id;
  
  RETURN COALESCE(v_is_eligible, false);
END;
$$;

-- Function to get all descendant profit centers
CREATE OR REPLACE FUNCTION get_profitcenter_descendants_v2(p_profit_center_id UUID)
RETURNS TABLE(descendant_id UUID, descendant_code TEXT, descendant_name TEXT, descendant_level INTEGER)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE descendants AS (
    -- Direct children
    SELECT 
      pt.profit_center_id,
      pt.pc_code,
      pt.entity_name,
      pt.level
    FROM vw_profitcenter_tree_v2 pt
    WHERE pt.parent_id = p_profit_center_id
    
    UNION ALL
    
    -- Children of children
    SELECT 
      pt.profit_center_id,
      pt.pc_code,
      pt.entity_name,
      pt.level
    FROM vw_profitcenter_tree_v2 pt
    JOIN descendants d ON d.profit_center_id = pt.parent_id
  )
  SELECT 
    descendants.profit_center_id,
    descendants.pc_code,
    descendants.entity_name,
    descendants.level
  FROM descendants
  ORDER BY descendants.level, descendants.pc_code;
END;
$$;

-- Function to get CODM segment summary
CREATE OR REPLACE FUNCTION get_codm_segment_summary_v2(
  p_organization_id UUID,
  p_segment_code TEXT DEFAULT NULL
)
RETURNS TABLE(
  segment_code TEXT,
  profit_center_count INTEGER,
  total_revenue DECIMAL,
  total_expenses DECIMAL,
  operating_profit DECIMAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.segment_code,
    COUNT(*)::INTEGER as profit_center_count,
    SUM(cp.total_revenue) as total_revenue,
    SUM(cp.total_expenses) as total_expenses,
    SUM(cp.operating_profit) as operating_profit
  FROM vw_codm_profitability_v2 cp
  WHERE cp.organization_id = p_organization_id
    AND (p_segment_code IS NULL OR cp.segment_code = p_segment_code)
  GROUP BY cp.segment_code
  ORDER BY cp.segment_code;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_profitcenter_path_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_profitcenter_valid_for_posting_v2(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION is_profitcenter_codm_eligible_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profitcenter_descendants_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_codm_segment_summary_v2(UUID, TEXT) TO authenticated;

-- ==========================================================================
-- 10. Comments for Documentation
-- ==========================================================================

COMMENT ON MATERIALIZED VIEW vw_profitcenter_tree_v2 IS 
'HERA Profit Center v2: Complete hierarchical profit center tree with all attributes, IFRS 8 (CODM) support, and parent-child relationships. Optimized for fast tree traversal and profit center lookup.';

COMMENT ON MATERIALIZED VIEW vw_profitcenter_flat_v2 IS 
'HERA Profit Center v2: Flat profit center view with search optimization, validity status, CODM status, and summary statistics for reporting and UI display.';

COMMENT ON MATERIALIZED VIEW vw_pc_segment_map_v2 IS 
'HERA Profit Center v2: Profit center to segment mappings for IFRS 8 (CODM) reporting, cross-dimensional analysis, and segment accounting.';

COMMENT ON MATERIALIZED VIEW vw_cc_pc_alignment_v2 IS 
'HERA Profit Center v2: Cost center to profit center alignment for cross-dimensional reporting and organizational analysis.';

COMMENT ON MATERIALIZED VIEW vw_profitcenter_posting_v2 IS 
'HERA Profit Center v2: Profit centers available for transaction posting with validation flags and metadata for posting rules enforcement.';

COMMENT ON MATERIALIZED VIEW vw_codm_profitability_v2 IS 
'HERA Profit Center v2: IFRS 8 (CODM) profit center profitability summary for regulatory segment reporting and chief operating decision maker analysis.';

COMMENT ON FUNCTION refresh_profitcenter_views_v2() IS 
'HERA Profit Center v2: Refresh all profit center materialized views in correct dependency order with audit logging.';

COMMENT ON FUNCTION get_profitcenter_path_v2(UUID) IS 
'HERA Profit Center v2: Get the full hierarchical path for a profit center as a dot-separated string.';

COMMENT ON FUNCTION is_profitcenter_valid_for_posting_v2(UUID, DATE) IS 
'HERA Profit Center v2: Check if a profit center is valid for posting transactions on a specific date.';

COMMENT ON FUNCTION is_profitcenter_codm_eligible_v2(UUID) IS 
'HERA Profit Center v2: Check if a profit center is eligible for IFRS 8 (CODM) reporting based on inclusion flags and segment mapping.';

COMMENT ON FUNCTION get_profitcenter_descendants_v2(UUID) IS 
'HERA Profit Center v2: Get all descendant profit centers in hierarchical order for rollup reporting and segment analysis.';

COMMENT ON FUNCTION get_codm_segment_summary_v2(UUID, TEXT) IS 
'HERA Profit Center v2: Get IFRS 8 (CODM) segment summary with aggregated financial metrics for regulatory reporting.';