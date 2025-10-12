-- ============================================================================
-- HERA COA v2: Performance-Optimized Views
-- 
-- Materialized views for fast COA tree traversal, IFRS presentation,
-- and dimensional account lookup.
-- 
-- Smart Code: HERA.FIN.COA.VIEWS.V2
-- ============================================================================

-- ==========================================================================
-- 1. COA Tree View (Materialized for Performance)
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_coa_tree_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_coa_tree_v2 AS
WITH RECURSIVE coa_hierarchy AS (
  -- Base case: Root accounts (no parent)
  SELECT 
    ce.id as account_id,
    ce.organization_id,
    ce.entity_name,
    ce.entity_code,
    ce.status,
    ce.smart_code,
    ce.metadata,
    ce.created_at,
    ce.updated_at,
    
    -- Dynamic data fields
    dd_account_number.field_value_text as account_number,
    dd_normal_balance.field_value_text as normal_balance,
    dd_depth.field_value_number::integer as depth,
    dd_is_postable.field_value_boolean as is_postable,
    dd_ifrs_tags.field_value_json as ifrs_tags_json,
    COALESCE(dd_ifrs_tags.field_value_json ->> 0, '{}')::text[] as ifrs_tags,
    dd_display_number.field_value_text as display_number,
    dd_presentation_group.field_value_text as presentation_group,
    dd_consolidation_group.field_value_text as consolidation_group,
    dd_effective_from.field_value_text::TIMESTAMPTZ as effective_from,
    dd_effective_to.field_value_text::TIMESTAMPTZ as effective_to,
    
    -- Hierarchy fields
    NULL::uuid as parent_id,
    NULL::text as parent_account_number,
    dd_account_number.field_value_text as path,
    0 as level,
    ARRAY[ce.id] as account_path
    
  FROM core_entities ce
  
  -- Join dynamic data fields
  LEFT JOIN core_dynamic_data dd_account_number 
    ON dd_account_number.entity_id = ce.id 
    AND dd_account_number.field_name = 'account_number'
  LEFT JOIN core_dynamic_data dd_normal_balance 
    ON dd_normal_balance.entity_id = ce.id 
    AND dd_normal_balance.field_name = 'normal_balance'
  LEFT JOIN core_dynamic_data dd_depth 
    ON dd_depth.entity_id = ce.id 
    AND dd_depth.field_name = 'depth'
  LEFT JOIN core_dynamic_data dd_is_postable 
    ON dd_is_postable.entity_id = ce.id 
    AND dd_is_postable.field_name = 'is_postable'
  LEFT JOIN core_dynamic_data dd_ifrs_tags 
    ON dd_ifrs_tags.entity_id = ce.id 
    AND dd_ifrs_tags.field_name = 'ifrs_tags'
  LEFT JOIN core_dynamic_data dd_display_number 
    ON dd_display_number.entity_id = ce.id 
    AND dd_display_number.field_name = 'display_number'
  LEFT JOIN core_dynamic_data dd_presentation_group 
    ON dd_presentation_group.entity_id = ce.id 
    AND dd_presentation_group.field_name = 'presentation_group'
  LEFT JOIN core_dynamic_data dd_consolidation_group 
    ON dd_consolidation_group.entity_id = ce.id 
    AND dd_consolidation_group.field_name = 'consolidation_group'
  LEFT JOIN core_dynamic_data dd_effective_from 
    ON dd_effective_from.entity_id = ce.id 
    AND dd_effective_from.field_name = 'effective_from'
  LEFT JOIN core_dynamic_data dd_effective_to 
    ON dd_effective_to.entity_id = ce.id 
    AND dd_effective_to.field_name = 'effective_to'
    
  WHERE 
    ce.entity_type = 'ACCOUNT'
    AND NOT EXISTS (
      SELECT 1 FROM core_relationships cr
      WHERE cr.to_entity_id = ce.id 
        AND cr.relationship_type = 'PARENT_OF'
        AND cr.organization_id = ce.organization_id
    )
    
  UNION ALL
  
  -- Recursive case: Child accounts
  SELECT 
    ce.id as account_id,
    ce.organization_id,
    ce.entity_name,
    ce.entity_code,
    ce.status,
    ce.smart_code,
    ce.metadata,
    ce.created_at,
    ce.updated_at,
    
    -- Dynamic data fields
    dd_account_number.field_value_text as account_number,
    dd_normal_balance.field_value_text as normal_balance,
    dd_depth.field_value_number::integer as depth,
    dd_is_postable.field_value_boolean as is_postable,
    dd_ifrs_tags.field_value_json as ifrs_tags_json,
    COALESCE(dd_ifrs_tags.field_value_json ->> 0, '{}')::text[] as ifrs_tags,
    dd_display_number.field_value_text as display_number,
    dd_presentation_group.field_value_text as presentation_group,
    dd_consolidation_group.field_value_text as consolidation_group,
    dd_effective_from.field_value_text::TIMESTAMPTZ as effective_from,
    dd_effective_to.field_value_text::TIMESTAMPTZ as effective_to,
    
    -- Hierarchy fields
    cr.from_entity_id as parent_id,
    parent.account_number as parent_account_number,
    parent.path || '.' || dd_account_number.field_value_text as path,
    parent.level + 1 as level,
    parent.account_path || ce.id as account_path
    
  FROM core_entities ce
  JOIN core_relationships cr 
    ON cr.to_entity_id = ce.id 
    AND cr.relationship_type = 'PARENT_OF'
    AND cr.organization_id = ce.organization_id
  JOIN coa_hierarchy parent 
    ON parent.account_id = cr.from_entity_id
    
  -- Join dynamic data fields
  LEFT JOIN core_dynamic_data dd_account_number 
    ON dd_account_number.entity_id = ce.id 
    AND dd_account_number.field_name = 'account_number'
  LEFT JOIN core_dynamic_data dd_normal_balance 
    ON dd_normal_balance.entity_id = ce.id 
    AND dd_normal_balance.field_name = 'normal_balance'
  LEFT JOIN core_dynamic_data dd_depth 
    ON dd_depth.entity_id = ce.id 
    AND dd_depth.field_name = 'depth'
  LEFT JOIN core_dynamic_data dd_is_postable 
    ON dd_is_postable.entity_id = ce.id 
    AND dd_is_postable.field_name = 'is_postable'
  LEFT JOIN core_dynamic_data dd_ifrs_tags 
    ON dd_ifrs_tags.entity_id = ce.id 
    AND dd_ifrs_tags.field_name = 'ifrs_tags'
  LEFT JOIN core_dynamic_data dd_display_number 
    ON dd_display_number.entity_id = ce.id 
    AND dd_display_number.field_name = 'display_number'
  LEFT JOIN core_dynamic_data dd_presentation_group 
    ON dd_presentation_group.entity_id = ce.id 
    AND dd_presentation_group.field_name = 'presentation_group'
  LEFT JOIN core_dynamic_data dd_consolidation_group 
    ON dd_consolidation_group.entity_id = ce.id 
    AND dd_consolidation_group.field_name = 'consolidation_group'
  LEFT JOIN core_dynamic_data dd_effective_from 
    ON dd_effective_from.entity_id = ce.id 
    AND dd_effective_from.field_name = 'effective_from'
  LEFT JOIN core_dynamic_data dd_effective_to 
    ON dd_effective_to.entity_id = ce.id 
    AND dd_effective_to.field_name = 'effective_to'
    
  WHERE ce.entity_type = 'ACCOUNT'
)
SELECT * FROM coa_hierarchy;

-- ==========================================================================
-- 2. IFRS Presentation View
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_coa_ifrs_presentation_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_coa_ifrs_presentation_v2 AS
SELECT 
  ct.*,
  
  -- IFRS Statement Classification
  CASE 
    WHEN ct.account_number LIKE '1%' THEN 'Statement of Financial Position'
    WHEN ct.account_number LIKE '2%' THEN 'Statement of Financial Position'
    WHEN ct.account_number LIKE '3%' THEN 'Statement of Financial Position'
    WHEN ct.account_number LIKE '4%' THEN 'Statement of Profit or Loss'
    WHEN ct.account_number LIKE '5%' THEN 'Statement of Profit or Loss'
    WHEN ct.account_number LIKE '6%' THEN 'Statement of Profit or Loss'
    WHEN ct.account_number LIKE '7%' THEN 'Statement of Profit or Loss'
    WHEN ct.account_number LIKE '8%' THEN 'Statement of Profit or Loss'
    ELSE 'Notes to Financial Statements'
  END as ifrs_statement,
  
  -- IFRS Section Classification
  CASE 
    WHEN ct.account_number LIKE '1%' THEN 'Assets'
    WHEN ct.account_number LIKE '2%' THEN 'Liabilities'
    WHEN ct.account_number LIKE '3%' THEN 'Equity'
    WHEN ct.account_number LIKE '4%' THEN 'Revenue'
    WHEN ct.account_number LIKE '5%' THEN 'Cost of Sales'
    WHEN ct.account_number LIKE '6%' THEN 'Operating Expenses'
    WHEN ct.account_number LIKE '7%' THEN 'Other Income and Expenses'
    WHEN ct.account_number LIKE '8%' THEN 'Finance Costs and Tax'
    ELSE 'Statistical'
  END as ifrs_section,
  
  -- Current vs Non-Current Classification
  CASE 
    WHEN ct.account_number LIKE '11%' OR ct.account_number LIKE '12%' OR ct.account_number LIKE '13%' OR ct.account_number LIKE '14%' THEN 'Current'
    WHEN ct.account_number LIKE '1%' THEN 'Non-Current'
    WHEN ct.account_number LIKE '21%' OR ct.account_number LIKE '22%' OR ct.account_number LIKE '23%' THEN 'Current'
    WHEN ct.account_number LIKE '2%' THEN 'Non-Current'
    ELSE NULL
  END as current_classification,
  
  -- Range for grouping
  LEFT(ct.account_number, 1) || 'xxx' as account_range,
  
  -- Presentation order
  CASE 
    WHEN ct.account_number LIKE '1%' THEN 1
    WHEN ct.account_number LIKE '2%' THEN 2
    WHEN ct.account_number LIKE '3%' THEN 3
    WHEN ct.account_number LIKE '4%' THEN 4
    WHEN ct.account_number LIKE '5%' THEN 5
    WHEN ct.account_number LIKE '6%' THEN 6
    WHEN ct.account_number LIKE '7%' THEN 7
    WHEN ct.account_number LIKE '8%' THEN 8
    ELSE 9
  END as presentation_order

FROM vw_coa_tree_v2 ct
WHERE ct.status = 'ACTIVE';

-- ==========================================================================
-- 3. Dimensional Account View (for Posting Requirements)
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_coa_dimensional_accounts_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_coa_dimensional_accounts_v2 AS
SELECT 
  ct.account_id,
  ct.organization_id,
  ct.account_number,
  ct.entity_name,
  ct.is_postable,
  ct.normal_balance,
  ct.account_range,
  
  -- Dimensional requirements based on range
  CASE 
    WHEN ct.account_number LIKE '4%' THEN 
      ARRAY['profit_center', 'product', 'region', 'channel']
    WHEN ct.account_number LIKE '5%' THEN 
      ARRAY['profit_center', 'product']
    WHEN ct.account_number LIKE '6%' THEN 
      ARRAY['cost_center']
    ELSE ARRAY[]::text[]
  END as required_dimensions,
  
  -- Optional dimensions
  CASE 
    WHEN ct.account_number LIKE '4%' THEN 
      ARRAY['customer', 'project']
    WHEN ct.account_number LIKE '5%' THEN 
      ARRAY['region', 'channel', 'project']
    WHEN ct.account_number LIKE '6%' THEN 
      ARRAY['profit_center', 'project', 'region']
    ELSE ARRAY[]::text[]
  END as optional_dimensions

FROM (
  SELECT 
    *,
    LEFT(account_number, 1) || 'xxx' as account_range
  FROM vw_coa_tree_v2
  WHERE status = 'ACTIVE' AND is_postable = true
) ct;

-- ==========================================================================
-- 4. COA Account Balances View (for Financial Reporting)
-- ==========================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_coa_balances_v2 CASCADE;

CREATE MATERIALIZED VIEW vw_coa_balances_v2 AS
SELECT 
  ct.account_id,
  ct.organization_id,
  ct.account_number,
  ct.entity_name,
  ct.normal_balance,
  ct.is_postable,
  ct.ifrs_statement,
  ct.ifrs_section,
  ct.current_classification,
  ct.presentation_order,
  
  -- Account balances (these would be calculated from actual transactions)
  -- For now, using placeholder values - in production, these would come from
  -- aggregated transaction data
  0.00 as current_balance,
  0.00 as ytd_balance,
  0.00 as prior_year_balance,
  
  -- Children summary (for parent accounts)
  COALESCE(child_summary.child_count, 0) as child_count,
  COALESCE(child_summary.child_balance, 0.00) as child_balance,
  
  -- Last transaction date
  NULL::timestamptz as last_transaction_date

FROM vw_coa_ifrs_presentation_v2 ct
LEFT JOIN (
  SELECT 
    parent_id,
    COUNT(*) as child_count,
    SUM(0.00) as child_balance  -- Placeholder
  FROM vw_coa_tree_v2
  WHERE parent_id IS NOT NULL AND status = 'ACTIVE'
  GROUP BY parent_id
) child_summary ON child_summary.parent_id = ct.account_id

WHERE ct.status = 'ACTIVE';

-- ==========================================================================
-- 5. Indexes for Performance
-- ==========================================================================

-- COA Tree View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_coa_tree_v2_account_id 
ON vw_coa_tree_v2 (account_id);

CREATE INDEX IF NOT EXISTS idx_vw_coa_tree_v2_org_number 
ON vw_coa_tree_v2 (organization_id, account_number);

CREATE INDEX IF NOT EXISTS idx_vw_coa_tree_v2_parent 
ON vw_coa_tree_v2 (organization_id, parent_id);

CREATE INDEX IF NOT EXISTS idx_vw_coa_tree_v2_postable 
ON vw_coa_tree_v2 (organization_id, is_postable) 
WHERE is_postable = true;

-- IFRS Presentation View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_coa_ifrs_v2_account_id 
ON vw_coa_ifrs_presentation_v2 (account_id);

CREATE INDEX IF NOT EXISTS idx_vw_coa_ifrs_v2_org_statement 
ON vw_coa_ifrs_presentation_v2 (organization_id, ifrs_statement);

CREATE INDEX IF NOT EXISTS idx_vw_coa_ifrs_v2_presentation_order 
ON vw_coa_ifrs_presentation_v2 (organization_id, presentation_order, account_number);

-- Dimensional Accounts View Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_coa_dim_v2_account_id 
ON vw_coa_dimensional_accounts_v2 (account_id);

CREATE INDEX IF NOT EXISTS idx_vw_coa_dim_v2_org_postable 
ON vw_coa_dimensional_accounts_v2 (organization_id, is_postable);

-- ==========================================================================
-- 6. Refresh Functions
-- ==========================================================================

-- Function to refresh all COA materialized views
CREATE OR REPLACE FUNCTION refresh_coa_views_v2()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh views in dependency order
  REFRESH MATERIALIZED VIEW vw_coa_tree_v2;
  REFRESH MATERIALIZED VIEW vw_coa_ifrs_presentation_v2;
  REFRESH MATERIALIZED VIEW vw_coa_dimensional_accounts_v2;
  REFRESH MATERIALIZED VIEW vw_coa_balances_v2;
  
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
    'HERA.FIN.COA.VIEWS.REFRESH.v2',
    CURRENT_TIMESTAMP,
    'COA-VIEWS-REFRESH-' || extract(epoch from now())::text,
    0.00,
    jsonb_build_object(
      'operation_type', 'MATERIALIZED_VIEW_REFRESH',
      'views_refreshed', ARRAY['vw_coa_tree_v2', 'vw_coa_ifrs_presentation_v2', 'vw_coa_dimensional_accounts_v2', 'vw_coa_balances_v2']
    )
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_coa_views_v2() TO authenticated;

-- ==========================================================================
-- 7. Comments for Documentation
-- ==========================================================================

COMMENT ON MATERIALIZED VIEW vw_coa_tree_v2 IS 
'HERA COA v2: Complete hierarchical COA tree with all account details and parent-child relationships. Optimized for fast tree traversal and account lookup.';

COMMENT ON MATERIALIZED VIEW vw_coa_ifrs_presentation_v2 IS 
'HERA COA v2: IFRS-compliant presentation view with automatic statement classification and presentation ordering for financial reporting.';

COMMENT ON MATERIALIZED VIEW vw_coa_dimensional_accounts_v2 IS 
'HERA COA v2: Postable accounts with dimensional requirements for transaction posting validation.';

COMMENT ON MATERIALIZED VIEW vw_coa_balances_v2 IS 
'HERA COA v2: Account balances view for financial reporting and trial balance generation.';

COMMENT ON FUNCTION refresh_coa_views_v2() IS 
'HERA COA v2: Refresh all COA materialized views in correct dependency order with audit logging.';