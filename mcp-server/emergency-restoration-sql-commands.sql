-- EMERGENCY MICHELE ACCESS RESTORATION
-- Execute these commands in Supabase SQL Editor

-- Step 1: Temporarily relax smart code constraints
ALTER TABLE core_relationships ALTER COLUMN smart_code DROP NOT NULL;
ALTER TABLE core_relationships DROP CONSTRAINT IF EXISTS core_relationships_smart_code_ck;

-- Step 2: Create Michele's USER_MEMBER_OF_ORG relationship
INSERT INTO core_relationships (
    organization_id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code,
    relationship_data
) VALUES (
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8', -- Hair Talkz organization
    '09b0b92a-d797-489e-bc03-5ca0a6272674', -- Michele's user ID
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8', -- Hair Talkz organization (same as org)
    'USER_MEMBER_OF_ORG',
    NULL, -- Temporarily null while constraints are relaxed
    '{"role": "owner", "permissions": ["salon:all"], "created_by": "emergency_restoration", "restoration_note": "Emergency restoration after Finance DNA v2 cleanup"}'::jsonb
);

-- Step 3: Create Michele's dynamic data for salon role and permissions
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_text,
    field_value_json,
    smart_code
) VALUES 
(
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8', -- Hair Talkz organization
    '09b0b92a-d797-489e-bc03-5ca0a6272674', -- Michele's user ID
    'salon_role',
    'text',
    'owner',
    NULL,
    NULL -- Temporarily null
),
(
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8', -- Hair Talkz organization
    '09b0b92a-d797-489e-bc03-5ca0a6272674', -- Michele's user ID
    'permissions',
    'json',
    NULL,
    '["salon:all", "admin:full", "finance:all"]'::jsonb,
    NULL -- Temporarily null
);

-- Step 4: Verify the relationship was created
SELECT 
    id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    organization_id,
    relationship_data
FROM core_relationships 
WHERE from_entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND relationship_type = 'USER_MEMBER_OF_ORG';

-- Step 5: Verify the dynamic data was created
SELECT 
    field_name,
    field_type,
    field_value_text,
    field_value_json
FROM core_dynamic_data 
WHERE entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

-- Step 6: Test the exact query used by the authentication resolver
SELECT to_entity_id, organization_id
FROM core_relationships
WHERE from_entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND relationship_type = 'USER_MEMBER_OF_ORG';

-- Success message
SELECT 'Emergency restoration complete! Michele should now be able to authenticate.' AS status;