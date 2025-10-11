-- Check Entity Type Case Issues
-- Organization: 378f24fb-d496-4ff7-8afa-ea34895a0eb8

-- STEP 1: Check what entity_type values actually exist in the database
SELECT 
    entity_type,
    COUNT(*) as count,
    array_agg(entity_name) as entity_names
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
GROUP BY entity_type
ORDER BY entity_type;

-- STEP 2: Check specifically for branch-related entity types (any case)
SELECT 
    entity_type,
    entity_name,
    entity_code,
    created_at
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND entity_type ILIKE '%branch%'
ORDER BY entity_type, created_at;

-- STEP 3: Test both uppercase and lowercase
SELECT 
    'UPPERCASE BRANCH' as test_type,
    COUNT(*) as count
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND entity_type = 'BRANCH'

UNION ALL

SELECT 
    'lowercase branch' as test_type,
    COUNT(*) as count
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND entity_type = 'branch'

UNION ALL

SELECT 
    'Mixed Case Branch' as test_type,
    COUNT(*) as count
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND entity_type = 'Branch';

-- STEP 4: Check what we actually created
SELECT 
    id,
    entity_type,
    entity_name,
    entity_code,
    created_at
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND entity_name ILIKE '%regis%' OR entity_name ILIKE '%mercure%'
ORDER BY created_at;