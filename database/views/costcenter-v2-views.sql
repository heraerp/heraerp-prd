-- ============================================================================
-- HERA Cost Center v2: Performance-Optimized Views
-- 
-- Materialized views for fast cost center tree traversal, reporting,
-- and dimensional lookup for posting validation.
-- 
-- Smart Code: HERA.COSTCENTER.VIEWS.V2
-- ============================================================================

-- ==========================================================================
-- 1. Cost Center Tree View (Materialized for Performance)
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_costcenter_tree_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_costcenter_tree_v2 AS
WITH RECURSIVE costcenter_hierarchy AS (
  -- Base case: Root cost centers (no parent)
  SELECT 
    ce.id as cost_center_id,
    ce.organization_id,
    ce.entity_name,
    ce.entity_code,
    ce.status,
    ce.smart_code,
    ce.metadata,
    ce.created_at,
    ce.updated_at,
    
    -- Dynamic data fields
    dd_cc_code.field_value_text as cc_code,
    dd_depth.field_value_number::integer as depth,
    dd_type.field_value_text as cost_center_type,
    dd_valid_from.field_value_date as valid_from,
    dd_valid_to.field_value_date as valid_to,
    dd_responsible.field_value_text as responsible_person,
    dd_segment.field_value_text as segment,
    dd_tags.field_value_json as tags_json,
    CASE 
      WHEN dd_tags.field_value_json IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(dd_tags.field_value_json))
      ELSE NULL::text[]
    END as tags,
    
    -- Hierarchy fields
    NULL::uuid as parent_id,
    NULL::text as parent_cc_code,
    dd_cc_code.field_value_text as path,
    0 as level,
    ARRAY[ce.id] as cost_center_path
    
  FROM core_entities ce
  
  -- Join dynamic data fields
  LEFT JOIN core_dynamic_data dd_cc_code 
    ON dd_cc_code.entity_id = ce.id AND dd_cc_code.field_name = 'cc_code'
  LEFT JOIN core_dynamic_data dd_depth 
    ON dd_depth.entity_id = ce.id AND dd_depth.field_name = 'depth'
  LEFT JOIN core_dynamic_data dd_type 
    ON dd_type.entity_id = ce.id AND dd_type.field_name = 'cost_center_type'
  LEFT JOIN core_dynamic_data dd_valid_from 
    ON dd_valid_from.entity_id = ce.id AND dd_valid_from.field_name = 'valid_from'
  LEFT JOIN core_dynamic_data dd_valid_to 
    ON dd_valid_to.entity_id = ce.id AND dd_valid_to.field_name = 'valid_to'
  LEFT JOIN core_dynamic_data dd_responsible 
    ON dd_responsible.entity_id = ce.id AND dd_responsible.field_name = 'responsible_person'
  LEFT JOIN core_dynamic_data dd_segment 
    ON dd_segment.entity_id = ce.id AND dd_segment.field_name = 'segment'
  LEFT JOIN core_dynamic_data dd_tags 
    ON dd_tags.entity_id = ce.id AND dd_tags.field_name = 'tags'
    
  WHERE 
    ce.entity_type = 'COST_CENTER'
    AND NOT EXISTS (
      SELECT 1 FROM core_relationships cr
      WHERE cr.to_entity_id = ce.id 
        AND cr.relationship_type = 'COST_CENTER_PARENT_OF'
        AND cr.organization_id = ce.organization_id
    )
    
  UNION ALL
  
  -- Recursive case: Child cost centers
  SELECT 
    ce.id as cost_center_id,
    ce.organization_id,
    ce.entity_name,
    ce.entity_code,
    ce.status,
    ce.smart_code,
    ce.metadata,
    ce.created_at,
    ce.updated_at,
    
    -- Dynamic data fields
    dd_cc_code.field_value_text as cc_code,
    dd_depth.field_value_number::integer as depth,
    dd_type.field_value_text as cost_center_type,
    dd_valid_from.field_value_date as valid_from,
    dd_valid_to.field_value_date as valid_to,
    dd_responsible.field_value_text as responsible_person,
    dd_segment.field_value_text as segment,
    dd_tags.field_value_json as tags_json,
    CASE 
      WHEN dd_tags.field_value_json IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(dd_tags.field_value_json))
      ELSE NULL::text[]
    END as tags,
    
    -- Hierarchy fields
    cr.from_entity_id as parent_id,
    parent.cc_code as parent_cc_code,
    parent.path || '.' || dd_cc_code.field_value_text as path,
    parent.level + 1 as level,
    parent.cost_center_path || ce.id as cost_center_path
    
  FROM core_entities ce
  JOIN core_relationships cr 
    ON cr.to_entity_id = ce.id 
    AND cr.relationship_type = 'COST_CENTER_PARENT_OF'
    AND cr.organization_id = ce.organization_id
  JOIN costcenter_hierarchy parent 
    ON parent.cost_center_id = cr.from_entity_id
    
  -- Join dynamic data fields
  LEFT JOIN core_dynamic_data dd_cc_code 
    ON dd_cc_code.entity_id = ce.id AND dd_cc_code.field_name = 'cc_code'
  LEFT JOIN core_dynamic_data dd_depth 
    ON dd_depth.entity_id = ce.id AND dd_depth.field_name = 'depth'
  LEFT JOIN core_dynamic_data dd_type 
    ON dd_type.entity_id = ce.id AND dd_type.field_name = 'cost_center_type'
  LEFT JOIN core_dynamic_data dd_valid_from 
    ON dd_valid_from.entity_id = ce.id AND dd_valid_from.field_name = 'valid_from'
  LEFT JOIN core_dynamic_data dd_valid_to 
    ON dd_valid_to.entity_id = ce.id AND dd_valid_to.field_name = 'valid_to'
  LEFT JOIN core_dynamic_data dd_responsible 
    ON dd_responsible.entity_id = ce.id AND dd_responsible.field_name = 'responsible_person'
  LEFT JOIN core_dynamic_data dd_segment 
    ON dd_segment.entity_id = ce.id AND dd_segment.field_name = 'segment'
  LEFT JOIN core_dynamic_data dd_tags 
    ON dd_tags.entity_id = ce.id AND dd_tags.field_name = 'tags'
    
  WHERE ce.entity_type = 'COST_CENTER'
)
SELECT * FROM costcenter_hierarchy;

-- ==========================================================================
-- 2. Cost Center Flat View (for Search and Reporting)
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_costcenter_flat_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_costcenter_flat_v2 AS
SELECT 
  ct.*,
  
  -- Current validity status
  CASE 
    WHEN ct.valid_from IS NOT NULL AND CURRENT_DATE < ct.valid_from THEN 'FUTURE'
    WHEN ct.valid_to IS NOT NULL AND CURRENT_DATE > ct.valid_to THEN 'EXPIRED'
    WHEN ct.status = 'ACTIVE' THEN 'ACTIVE'
    ELSE 'INACTIVE'
  END as validity_status,
  
  -- Type category grouping
  CASE 
    WHEN ct.cost_center_type IN ('ADMIN', 'FINANCE', 'HR') THEN 'OVERHEAD'
    WHEN ct.cost_center_type IN ('PRODUCTION', 'SERVICE') THEN 'DIRECT'
    WHEN ct.cost_center_type IN ('SALES', 'IT') THEN 'SUPPORT'
    ELSE 'OTHER'
  END as type_category,
  
  -- Children summary (for parent cost centers)
  COALESCE(child_summary.child_count, 0) as child_count,
  COALESCE(child_summary.active_child_count, 0) as active_child_count,
  
  -- Searchable text for full-text search
  LOWER(ct.entity_name || ' ' || ct.cc_code || ' ' || 
        COALESCE(ct.cost_center_type, '') || ' ' ||
        COALESCE(ct.responsible_person, '') || ' ' ||
        COALESCE(array_to_string(ct.tags, ' '), '')) as search_text

FROM vw_costcenter_tree_v2 ct
LEFT JOIN (
  SELECT 
    parent_id,
    COUNT(*) as child_count,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_child_count
  FROM vw_costcenter_tree_v2
  WHERE parent_id IS NOT NULL
  GROUP BY parent_id
) child_summary ON child_summary.parent_id = ct.cost_center_id;

-- ==========================================================================
-- 3. Cost Center to Profit Center Mapping View
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_cc_to_pc_map_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_cc_to_pc_map_v2 AS
SELECT 
  cc.cost_center_id,
  cc.cc_code,
  cc.entity_name as cc_name,
  cc.organization_id,
  
  -- Profit center mapping (if exists)
  pc_rel.to_entity_id as profit_center_id,
  pc.entity_name as pc_name,
  pc_dd.field_value_text as pc_code,
  
  -- Segment mapping (if exists)
  seg_rel.to_entity_id as segment_id,
  seg.entity_name as segment_name,
  
  -- Effective mapping metadata
  pc_rel.metadata as pc_mapping_metadata,
  seg_rel.metadata as segment_mapping_metadata

FROM vw_costcenter_tree_v2 cc

-- Left join to profit center relationship
LEFT JOIN core_relationships pc_rel 
  ON pc_rel.from_entity_id = cc.cost_center_id
  AND pc_rel.relationship_type = 'COST_CENTER_ASSIGNED_TO_PC'
  AND pc_rel.organization_id = cc.organization_id

-- Left join to profit center entity
LEFT JOIN core_entities pc 
  ON pc.id = pc_rel.to_entity_id
  AND pc.entity_type = 'PROFIT_CENTER'

-- Left join to profit center code
LEFT JOIN core_dynamic_data pc_dd 
  ON pc_dd.entity_id = pc.id 
  AND pc_dd.field_name = 'pc_code'

-- Left join to segment relationship
LEFT JOIN core_relationships seg_rel 
  ON seg_rel.from_entity_id = cc.cost_center_id
  AND seg_rel.relationship_type = 'COST_CENTER_ROLLS_UP_TO_SEGMENT'
  AND seg_rel.organization_id = cc.organization_id

-- Left join to segment entity
LEFT JOIN core_entities seg 
  ON seg.id = seg_rel.to_entity_id
  AND seg.entity_type = 'BUSINESS_SEGMENT'

WHERE cc.status = 'ACTIVE';

-- ==========================================================================
-- 4. Cost Center Posting Requirements View
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_costcenter_posting_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_costcenter_posting_v2 AS
SELECT 
  ct.cost_center_id,
  ct.organization_id,
  ct.cc_code,
  ct.entity_name,
  ct.cost_center_type,
  ct.status,
  ct.validity_status,
  
  -- Posting validation flags
  CASE 
    WHEN ct.status = 'ACTIVE' AND ct.validity_status = 'ACTIVE' THEN true
    ELSE false
  END as is_postable,
  
  -- Account ranges that require this cost center
  ARRAY['6xxx'] as required_for_ranges,
  
  -- Additional validation metadata
  jsonb_build_object(
    'valid_from', ct.valid_from,
    'valid_to', ct.valid_to,
    'responsible_person', ct.responsible_person,
    'segment', ct.segment,
    'type_category', CASE 
      WHEN ct.cost_center_type IN ('ADMIN', 'FINANCE', 'HR') THEN 'OVERHEAD'
      WHEN ct.cost_center_type IN ('PRODUCTION', 'SERVICE') THEN 'DIRECT'
      WHEN ct.cost_center_type IN ('SALES', 'IT') THEN 'SUPPORT'
      ELSE 'OTHER'
    END
  ) as posting_metadata

FROM vw_costcenter_flat_v2 ct
WHERE ct.status = 'ACTIVE';

-- ==========================================================================
-- 5. Indexes for Performance
-- ==========================================================================

-- Cost Center Tree View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_costcenter_tree_v2_id 
ON vw_costcenter_tree_v2 (cost_center_id);

CREATE INDEX IF NOT EXISTS idx_vw_costcenter_tree_v2_org_code 
ON vw_costcenter_tree_v2 (organization_id, cc_code);

CREATE INDEX IF NOT EXISTS idx_vw_costcenter_tree_v2_parent 
ON vw_costcenter_tree_v2 (organization_id, parent_id);

CREATE INDEX IF NOT EXISTS idx_vw_costcenter_tree_v2_type 
ON vw_costcenter_tree_v2 (organization_id, cost_center_type);

CREATE INDEX IF NOT EXISTS idx_vw_costcenter_tree_v2_status 
ON vw_costcenter_tree_v2 (organization_id, status);

-- Cost Center Flat View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_costcenter_flat_v2_id 
ON vw_costcenter_flat_v2 (cost_center_id);

CREATE INDEX IF NOT EXISTS idx_vw_costcenter_flat_v2_search 
ON vw_costcenter_flat_v2 USING gin(to_tsvector('english', search_text));

CREATE INDEX IF NOT EXISTS idx_vw_costcenter_flat_v2_validity 
ON vw_costcenter_flat_v2 (organization_id, validity_status);

CREATE INDEX IF NOT EXISTS idx_vw_costcenter_flat_v2_category 
ON vw_costcenter_flat_v2 (organization_id, type_category);

-- CC to PC Mapping View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_cc_pc_map_v2_cc_id 
ON vw_cc_to_pc_map_v2 (cost_center_id);

CREATE INDEX IF NOT EXISTS idx_vw_cc_pc_map_v2_org_pc 
ON vw_cc_to_pc_map_v2 (organization_id, profit_center_id);

-- Posting Requirements View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_costcenter_posting_v2_id 
ON vw_costcenter_posting_v2 (cost_center_id);

CREATE INDEX IF NOT EXISTS idx_vw_costcenter_posting_v2_postable 
ON vw_costcenter_posting_v2 (organization_id, is_postable) 
WHERE is_postable = true;

-- ==========================================================================
-- 6. Refresh Functions
-- ==========================================================================

-- Function to refresh all cost center materialized views
CREATE OR REPLACE FUNCTION refresh_costcenter_views_v2()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh views in dependency order
  REFRESH MATERIALIZED VIEW vw_costcenter_tree_v2;
  REFRESH MATERIALIZED VIEW vw_costcenter_flat_v2;
  REFRESH MATERIALIZED VIEW vw_cc_to_pc_map_v2;
  REFRESH MATERIALIZED VIEW vw_costcenter_posting_v2;
  
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
    'HERA.COSTCENTER.VIEWS.REFRESH.V2',
    CURRENT_TIMESTAMP,
    'CC-VIEWS-REFRESH-' || extract(epoch from now())::text,
    0.00,
    jsonb_build_object(
      'operation_type', 'MATERIALIZED_VIEW_REFRESH',
      'views_refreshed', ARRAY['vw_costcenter_tree_v2', 'vw_costcenter_flat_v2', 'vw_cc_to_pc_map_v2', 'vw_costcenter_posting_v2']
    )
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_costcenter_views_v2() TO authenticated;

-- ==========================================================================
-- 7. Helper Functions for Common Queries
-- ==========================================================================

-- Function to get cost center hierarchy path as text
CREATE OR REPLACE FUNCTION get_costcenter_path_v2(p_cost_center_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_path TEXT;
BEGIN
  SELECT path INTO v_path
  FROM vw_costcenter_tree_v2
  WHERE cost_center_id = p_cost_center_id;
  
  RETURN COALESCE(v_path, '');
END;
$$;

-- Function to check if cost center is valid for posting on a given date
CREATE OR REPLACE FUNCTION is_costcenter_valid_for_posting_v2(
  p_cost_center_id UUID,
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
  FROM vw_costcenter_tree_v2
  WHERE cost_center_id = p_cost_center_id;
  
  RETURN COALESCE(v_is_valid, false);
END;
$$;

-- Function to get all descendant cost centers
CREATE OR REPLACE FUNCTION get_costcenter_descendants_v2(p_cost_center_id UUID)
RETURNS TABLE(descendant_id UUID, descendant_code TEXT, descendant_name TEXT, descendant_level INTEGER)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE descendants AS (
    -- Direct children
    SELECT 
      ct.cost_center_id,
      ct.cc_code,
      ct.entity_name,
      ct.level
    FROM vw_costcenter_tree_v2 ct
    WHERE ct.parent_id = p_cost_center_id
    
    UNION ALL
    
    -- Children of children
    SELECT 
      ct.cost_center_id,
      ct.cc_code,
      ct.entity_name,
      ct.level
    FROM vw_costcenter_tree_v2 ct
    JOIN descendants d ON d.cost_center_id = ct.parent_id
  )
  SELECT 
    descendants.cost_center_id,
    descendants.cc_code,
    descendants.entity_name,
    descendants.level
  FROM descendants
  ORDER BY descendants.level, descendants.cc_code;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_costcenter_path_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_costcenter_valid_for_posting_v2(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_costcenter_descendants_v2(UUID) TO authenticated;

-- ==========================================================================
-- 8. Comments for Documentation
-- ==========================================================================

COMMENT ON MATERIALIZED VIEW vw_costcenter_tree_v2 IS 
'HERA Cost Center v2: Complete hierarchical cost center tree with all attributes and parent-child relationships. Optimized for fast tree traversal and cost center lookup.';

COMMENT ON MATERIALIZED VIEW vw_costcenter_flat_v2 IS 
'HERA Cost Center v2: Flat cost center view with search optimization, validity status, and summary statistics for reporting and UI display.';

COMMENT ON MATERIALIZED VIEW vw_cc_to_pc_map_v2 IS 
'HERA Cost Center v2: Cost center to profit center mappings for cross-dimensional reporting and organizational analysis.';

COMMENT ON MATERIALIZED VIEW vw_costcenter_posting_v2 IS 
'HERA Cost Center v2: Cost centers available for transaction posting with validation flags and metadata for posting rules enforcement.';

COMMENT ON FUNCTION refresh_costcenter_views_v2() IS 
'HERA Cost Center v2: Refresh all cost center materialized views in correct dependency order with audit logging.';

COMMENT ON FUNCTION get_costcenter_path_v2(UUID) IS 
'HERA Cost Center v2: Get the full hierarchical path for a cost center as a dot-separated string.';

COMMENT ON FUNCTION is_costcenter_valid_for_posting_v2(UUID, DATE) IS 
'HERA Cost Center v2: Check if a cost center is valid for posting transactions on a specific date.';

COMMENT ON FUNCTION get_costcenter_descendants_v2(UUID) IS 
'HERA Cost Center v2: Get all descendant cost centers in hierarchical order for rollup reporting.';