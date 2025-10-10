-- Fix Branch Filter Issue
-- Organization: Hair Talkz (378f24fb-d496-4ff7-8afa-ea34895a0eb8)

-- STEP 1: Clean up duplicate branches (keep the newer ones)
DELETE FROM core_entities 
WHERE id IN (
    '89fbc04c-9bbf-47bf-887b-ae8522828feb',  -- Older Park Regis duplicate
    'fabd671b-36ae-4b8c-b845-f0884b4f7214'   -- Older Mercure Gold duplicate
);

-- STEP 2: Verify we have the correct branches remaining
SELECT 
    id,
    entity_name,
    entity_code,
    metadata,
    created_at
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'
ORDER BY created_at;

-- STEP 3: Test the exact query that getOrganizationBranches uses
-- This is what the Universal API v2 should be calling
SELECT 
    id,
    entity_name,
    entity_code,
    entity_type,
    organization_id
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH';

-- STEP 4: Check if there are any RLS policies blocking the query
-- Test with explicit organization filtering
SELECT 
    COUNT(*) as branch_count,
    array_agg(entity_name) as branch_names
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH';

-- STEP 5: Check if the API user has proper permissions
-- This should match what the API sees
SET app.current_org = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
SELECT 
    id,
    entity_name as name,
    entity_code as code
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'
ORDER BY entity_name;