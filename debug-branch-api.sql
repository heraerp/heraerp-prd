-- Debug Branch API Issue
-- Test the exact query that the Universal API should be making

-- STEP 1: Clean up duplicate branches first (run this first)
DELETE FROM core_entities 
WHERE id IN (
    '89fbc04c-9bbf-47bf-887b-ae8522828feb',  -- Older Park Regis duplicate
    'fabd671b-36ae-4b8c-b845-f0884b4f7214'   -- Older Mercure Gold duplicate
);

-- STEP 2: Verify branches exist with correct structure
SELECT 
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    metadata,
    created_at
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'
ORDER BY created_at;

-- STEP 3: Test the exact query format the Universal API uses
-- This should match what universalApi.read('core_entities', {entity_type: 'BRANCH'}) does
SELECT *
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'
ORDER BY created_at DESC;

-- STEP 4: Test with different case variations
SELECT 
    COUNT(*) as count,
    array_agg(entity_type) as entity_types_found
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type ILIKE '%branch%';

-- STEP 5: Check if there are any RLS policies blocking the query
-- Test what a regular user would see
SELECT 
    COUNT(*) as total_entities,
    COUNT(CASE WHEN entity_type = 'BRANCH' THEN 1 END) as branch_count,
    array_agg(DISTINCT entity_type) as all_entity_types
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';