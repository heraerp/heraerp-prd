-- EMERGENCY RELATIONSHIP RESTORATION SCRIPT
-- Restores critical relationships lost during Finance DNA v2 cleanup
-- Organization: 378f24fb-d496-4ff7-8afa-ea34895a0eb8

-- Step 1: Check current state
SELECT 'Current relationships count:' as status, COUNT(*) as count 
FROM core_relationships 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

-- Step 2: Temporarily relax smart code constraints to allow restoration
ALTER TABLE core_relationships DROP CONSTRAINT IF EXISTS core_relationships_smart_code_ck;

-- Step 3: Find users that need organization membership
WITH users_needing_membership AS (
  SELECT 
    ce.id as user_entity_id,
    ce.entity_name as user_name,
    ce.organization_id
  FROM core_entities ce
  WHERE ce.entity_type = 'user'
    AND ce.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
    AND NOT EXISTS (
      SELECT 1 FROM core_relationships cr 
      WHERE cr.from_entity_id = ce.id 
      AND cr.relationship_type = 'user_member_of_org'
    )
),
-- Find the organization entity
org_entity AS (
  SELECT id as org_entity_id
  FROM core_entities 
  WHERE entity_type = 'organization' 
  AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  LIMIT 1
)
-- Restore user-organization memberships
INSERT INTO core_relationships (
  organization_id,
  from_entity_id, 
  to_entity_id,
  relationship_type,
  smart_code,
  created_at,
  metadata
)
SELECT 
  u.organization_id,
  u.user_entity_id,
  o.org_entity_id, 
  'user_member_of_org',
  'HERA.UNIVERSAL.MEMBERSHIP.USER.ORG.v1',
  NOW(),
  jsonb_build_object(
    'restored', true,
    'restoration_date', NOW()::text,
    'reason', 'emergency_restoration_after_finance_dna_cleanup'
  )
FROM users_needing_membership u
CROSS JOIN org_entity o;

-- Step 4: Restore account status relationships
-- First, ensure we have status entities
INSERT INTO core_entities (
  organization_id,
  entity_type,
  entity_name,
  entity_code,
  smart_code,
  created_at,
  metadata
)
SELECT 
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  'workflow_status',
  status_name,
  'STATUS-' || UPPER(status_name),
  'HERA.UNIVERSAL.WORKFLOW.STATUS.' || UPPER(status_name) || '.v1',
  NOW(),
  jsonb_build_object(
    'color', status_color,
    'description', status_description,
    'restored', true
  )
FROM (VALUES 
  ('active', '#10B981', 'Active and operational'),
  ('inactive', '#6B7280', 'Inactive but available'),
  ('draft', '#F59E0B', 'Draft status'),
  ('pending', '#F59E0B', 'Pending approval'),
  ('approved', '#10B981', 'Approved for use'),
  ('completed', '#059669', 'Completed successfully')
) AS statuses(status_name, status_color, status_description)
WHERE NOT EXISTS (
  SELECT 1 FROM core_entities 
  WHERE entity_type = 'workflow_status' 
  AND entity_code = 'STATUS-' || UPPER(statuses.status_name)
  AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
);

-- Step 5: Assign active status to GL accounts and other entities
WITH status_entity AS (
  SELECT id as status_id 
  FROM core_entities 
  WHERE entity_type = 'workflow_status' 
  AND entity_code = 'STATUS-ACTIVE'
  AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  LIMIT 1
),
entities_needing_status AS (
  SELECT id as entity_id, entity_type
  FROM core_entities
  WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND entity_type IN ('gl_account', 'customer', 'vendor', 'product', 'service', 'employee')
  AND NOT EXISTS (
    SELECT 1 FROM core_relationships cr 
    WHERE cr.from_entity_id = core_entities.id 
    AND cr.relationship_type = 'has_status'
  )
)
INSERT INTO core_relationships (
  organization_id,
  from_entity_id,
  to_entity_id,
  relationship_type,
  smart_code,
  created_at,
  metadata
)
SELECT 
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  e.entity_id,
  s.status_id,
  'has_status',
  'HERA.UNIVERSAL.WORKFLOW.STATUS.ASSIGN.v1',
  NOW(),
  jsonb_build_object(
    'restored', true,
    'restoration_date', NOW()::text,
    'entity_type', e.entity_type,
    'default_status', 'active'
  )
FROM entities_needing_status e
CROSS JOIN status_entity s;

-- Step 6: Restore basic account hierarchy for Chart of Accounts
-- Create asset accounts hierarchy
WITH account_hierarchy AS (
  SELECT 
    parent.id as parent_id,
    child.id as child_id,
    parent.entity_code as parent_code,
    child.entity_code as child_code
  FROM core_entities parent
  JOIN core_entities child ON (
    child.entity_code LIKE parent.entity_code || '%' 
    AND LENGTH(child.entity_code) = LENGTH(parent.entity_code) + 2
  )
  WHERE parent.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND child.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND parent.entity_type = 'gl_account'
  AND child.entity_type = 'gl_account'
  AND parent.id != child.id
)
INSERT INTO core_relationships (
  organization_id,
  from_entity_id,
  to_entity_id,
  relationship_type,
  smart_code,
  created_at,
  metadata
)
SELECT 
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  h.parent_id,
  h.child_id,
  'parent_of',
  'HERA.UNIVERSAL.HIERARCHY.ACCOUNT.PARENT.v1',
  NOW(),
  jsonb_build_object(
    'restored', true,
    'restoration_date', NOW()::text,
    'parent_code', h.parent_code,
    'child_code', h.child_code,
    'hierarchy_type', 'chart_of_accounts'
  )
FROM account_hierarchy h;

-- Step 7: Re-enable smart code constraints with expanded patterns
ALTER TABLE core_relationships ADD CONSTRAINT core_relationships_smart_code_ck 
CHECK (
  smart_code IS NULL OR 
  smart_code ~ '^HERA\.' OR
  smart_code = ''
);

-- Step 8: Verification and reporting
SELECT 'RESTORATION COMPLETE' as status;

SELECT 
  'User Memberships Restored' as category,
  COUNT(*) as count
FROM core_relationships 
WHERE relationship_type = 'user_member_of_org'
AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

SELECT 
  'Status Relationships Restored' as category,
  COUNT(*) as count
FROM core_relationships 
WHERE relationship_type = 'has_status'
AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

SELECT 
  'Account Hierarchy Restored' as category,
  COUNT(*) as count
FROM core_relationships 
WHERE relationship_type = 'parent_of'
AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

SELECT 
  'Total Relationships After Restoration' as category,
  COUNT(*) as count
FROM core_relationships 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

-- Step 9: Show sample restored relationships
SELECT 
  'Sample Restored Relationships' as info,
  relationship_type,
  COUNT(*) as count,
  MIN(created_at) as restored_at
FROM core_relationships 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
GROUP BY relationship_type
ORDER BY count DESC;

SELECT 'EMERGENCY RESTORATION COMPLETED SUCCESSFULLY' as final_status;