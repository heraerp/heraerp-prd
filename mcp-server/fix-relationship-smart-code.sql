-- Fix Michele's relationship smart code to comply with Finance DNA v2 constraints
-- Execute this in Supabase SQL Editor

-- Update the smart code to v2 format that passes the constraint
UPDATE core_relationships 
SET smart_code = 'HERA.ACCOUNTING.USER.MEMBERSHIP.v2'
WHERE from_entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND relationship_type = 'USER_MEMBER_OF_ORG'
AND to_entity_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

-- Also update any dynamic data smart codes if needed
UPDATE core_dynamic_data 
SET smart_code = 'HERA.ACCOUNTING.USER.ROLE.v2'
WHERE entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
AND field_name = 'role';

UPDATE core_dynamic_data 
SET smart_code = 'HERA.ACCOUNTING.USER.PERMISSIONS.v2'
WHERE entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
AND field_name = 'permissions';

-- Update the role to 'owner' and permissions to include salon access
UPDATE core_dynamic_data 
SET field_value_text = 'owner'
WHERE entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
AND field_name = 'role';

UPDATE core_dynamic_data 
SET field_value_text = 'salon:all,admin:full,finance:all'
WHERE entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
AND field_name = 'permissions';

-- Remove the duplicate relationship with wrong to_entity_id
DELETE FROM core_relationships 
WHERE from_entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND relationship_type = 'USER_MEMBER_OF_ORG'
AND to_entity_id = '48089a0e-5199-4d82-b9ac-3a09b68a6864';

-- Verify the fix
SELECT 'Michele relationship updated successfully' AS status,
       r.id,
       r.smart_code,
       r.to_entity_id,
       r.organization_id
FROM core_relationships r
WHERE r.from_entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND r.relationship_type = 'USER_MEMBER_OF_ORG';

-- Also verify dynamic data
SELECT 'Michele dynamic data:' AS info,
       field_name,
       field_value_text,
       smart_code
FROM core_dynamic_data 
WHERE entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';