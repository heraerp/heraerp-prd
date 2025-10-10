-- STEP 1: Check current state (run this first)
SELECT 
    id, 
    entity_name, 
    entity_code,
    created_at
FROM core_entities 
WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
  AND entity_type = 'BRANCH'
ORDER BY created_at;