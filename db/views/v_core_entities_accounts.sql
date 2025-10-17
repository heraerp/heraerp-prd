-- HERA Finance DNA v2.2 - Account Entities View (Compatibility)
-- Provides filtered view of account entities for Finance DNA operations

CREATE OR REPLACE VIEW v_core_entities_accounts AS
SELECT 
  id,
  organization_id,
  entity_type,
  entity_name,
  entity_code,
  entity_category,
  entity_subcategory,
  description,
  tags,
  status,
  effective_date,
  expiry_date,
  metadata,
  ai_confidence,
  ai_classification,
  ai_tags,
  parent_entity_id,
  hierarchy_level,
  sort_order,
  created_at,
  updated_at,
  created_by,
  updated_by,
  version
FROM core_entities 
WHERE entity_type = 'account';

-- Add security policy for multi-tenant access
-- (Inherits RLS from core_entities automatically)

COMMENT ON VIEW v_core_entities_accounts IS 
'HERA Finance DNA v2.2: Compatibility view for account entities.
Filters core_entities to show only account-type entities for COA operations.
Inherits multi-tenant RLS policies from core_entities table.';

SELECT 'Account entities view created successfully' AS status;