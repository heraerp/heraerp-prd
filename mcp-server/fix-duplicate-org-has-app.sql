-- Fix: Remove duplicate ORG_HAS_APP relationships
-- Found 3 relationships to the same app (4041aee9-e638-4b79-a53b-c89e29ea3522)
-- We'll keep the oldest one and delete the duplicates

BEGIN;

-- Show what we're about to delete
SELECT 
  id,
  organization_id,
  to_entity_id,
  is_active,
  created_at,
  'WILL BE DELETED' as action
FROM core_relationships
WHERE relationship_type = 'ORG_HAS_APP'
  AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND to_entity_id = '4041aee9-e638-4b79-a53b-c89e29ea3522'
  AND id != (
    -- Keep the oldest relationship
    SELECT id
    FROM core_relationships
    WHERE relationship_type = 'ORG_HAS_APP'
      AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
      AND to_entity_id = '4041aee9-e638-4b79-a53b-c89e29ea3522'
    ORDER BY created_at ASC
    LIMIT 1
  );

-- Delete duplicates (keeping the oldest)
DELETE FROM core_relationships
WHERE relationship_type = 'ORG_HAS_APP'
  AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND to_entity_id = '4041aee9-e638-4b79-a53b-c89e29ea3522'
  AND id != (
    -- Keep the oldest relationship
    SELECT id
    FROM core_relationships
    WHERE relationship_type = 'ORG_HAS_APP'
      AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
      AND to_entity_id = '4041aee9-e638-4b79-a53b-c89e29ea3522'
    ORDER BY created_at ASC
    LIMIT 1
  );

-- Verify only one relationship remains
SELECT 
  id,
  organization_id,
  to_entity_id,
  is_active,
  created_at,
  'KEPT' as action
FROM core_relationships
WHERE relationship_type = 'ORG_HAS_APP'
  AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND to_entity_id = '4041aee9-e638-4b79-a53b-c89e29ea3522';

COMMIT;
