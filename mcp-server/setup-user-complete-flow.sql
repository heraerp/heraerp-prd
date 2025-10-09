-- HERA USER SETUP - COMPLETE FLOW
-- Creates full user entity structure and organization membership
-- User ID: 09b0b92a-d797-489e-bc03-5ca0a6272674
-- Target Org: 378f24fb-d496-4ff7-8afa-ea34895a0eb8

-- Step 1: Verify platform organization exists (00000000-0000-0000-0000-000000000000)
SELECT 'Step 1: Platform Organization Check' as step;

INSERT INTO core_organizations (
    id,
    organization_name,
    organization_code,
    organization_subdomain,
    smart_code,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'HERA Platform',
    'PLATFORM',
    'platform',
    'HERA.PLATFORM.ORGANIZATION.SYSTEM.v1',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Create USER entity in platform organization (00000000-0000-0000-0000-000000000000)
SELECT 'Step 2: Creating USER Entity in Platform Organization' as step;

INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    created_at,
    updated_at
) VALUES (
    '09b0b92a-d797-489e-bc03-5ca0a6272674', -- Same as Supabase auth.users.id
    '00000000-0000-0000-0000-000000000000', -- Platform organization
    'user',
    'Platform User',
    'USER-' || SUBSTRING('09b0b92a-d797-489e-bc03-5ca0a6272674', 1, 8),
    'HERA.PLATFORM.USER.ENTITY.v1',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    entity_name = EXCLUDED.entity_name,
    entity_code = EXCLUDED.entity_code,
    smart_code = EXCLUDED.smart_code,
    updated_at = NOW();

-- Step 3: Add dynamic data for the user entity
SELECT 'Step 3: Adding User Dynamic Data' as step;

-- Email from Supabase auth (you'll need to get this from auth.users table)
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_text,
    smart_code,
    created_at
) VALUES 
(
    '00000000-0000-0000-0000-000000000000',
    '09b0b92a-d797-489e-bc03-5ca0a6272674',
    'auth_provider',
    'text',
    'supabase',
    'HERA.PLATFORM.USER.AUTH.PROVIDER.v1',
    NOW()
),
(
    '00000000-0000-0000-0000-000000000000',
    '09b0b92a-d797-489e-bc03-5ca0a6272674',
    'user_type',
    'text',
    'standard',
    'HERA.PLATFORM.USER.TYPE.v1',
    NOW()
),
(
    '00000000-0000-0000-0000-000000000000',
    '09b0b92a-d797-489e-bc03-5ca0a6272674',
    'status',
    'text',
    'active',
    'HERA.PLATFORM.USER.STATUS.v1',
    NOW()
)
ON CONFLICT (organization_id, entity_id, field_name) DO UPDATE SET
    field_value_text = EXCLUDED.field_value_text,
    smart_code = EXCLUDED.smart_code,
    created_at = NOW();

-- Step 4: Create USER_MEMBER_OF_ORG relationship to target organization
SELECT 'Step 4: Creating Organization Membership Relationship' as step;

-- Find the target organization entity
WITH target_org AS (
    SELECT id as org_entity_id
    FROM core_entities 
    WHERE entity_type = 'organization' 
    AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
    LIMIT 1
)
INSERT INTO core_relationships (
    organization_id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code,
    created_at
)
SELECT 
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8', -- Target organization
    '09b0b92a-d797-489e-bc03-5ca0a6272674', -- User entity
    target_org.org_entity_id, -- Target organization entity
    'USER_MEMBER_OF_ORG',
    'HERA.UNIVERSAL.MEMBERSHIP.USER.ORG.v1',
    NOW()
FROM target_org
ON CONFLICT (organization_id, from_entity_id, to_entity_id, relationship_type) DO NOTHING;

-- Step 5: Assign user role in target organization (optional - default to user role)
SELECT 'Step 5: Adding User Role Dynamic Data' as step;

INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_text,
    smart_code,
    created_at
) VALUES (
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8', -- Target organization
    '09b0b92a-d797-489e-bc03-5ca0a6272674', -- User entity
    'role',
    'text',
    'user', -- Default role (can be: owner, admin, manager, user)
    'HERA.UNIVERSAL.USER.ROLE.v1',
    NOW()
)
ON CONFLICT (organization_id, entity_id, field_name) DO UPDATE SET
    field_value_text = EXCLUDED.field_value_text,
    created_at = NOW();

-- Step 6: Add user permissions (optional)
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_text,
    smart_code,
    created_at
) VALUES (
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    '09b0b92a-d797-489e-bc03-5ca0a6272674',
    'permissions',
    'text',
    'entities:read,transactions:read,dashboard:read', -- Basic permissions
    'HERA.UNIVERSAL.USER.PERMISSIONS.v1',
    NOW()
)
ON CONFLICT (organization_id, entity_id, field_name) DO UPDATE SET
    field_value_text = EXCLUDED.field_value_text,
    created_at = NOW();

-- Step 7: Verification queries
SELECT 'Step 7: Verification' as step;

-- Verify user entity exists
SELECT 
    'User Entity Check' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status,
    COUNT(*) as count
FROM core_entities 
WHERE id = '09b0b92a-d797-489e-bc03-5ca0a6272674';

-- Verify USER_MEMBER_OF_ORG relationship exists
SELECT 
    'Membership Relationship Check' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status,
    COUNT(*) as count
FROM core_relationships 
WHERE from_entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND relationship_type = 'USER_MEMBER_OF_ORG'
AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

-- Verify dynamic data exists
SELECT 
    'User Dynamic Data Check' as check_type,
    COUNT(*) as field_count,
    STRING_AGG(field_name, ', ') as fields
FROM core_dynamic_data 
WHERE entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674';

-- Show complete user setup
SELECT 'Complete User Setup Summary' as summary;

SELECT 
    e.id as user_id,
    e.entity_name,
    e.organization_id as platform_org,
    r.organization_id as member_of_org,
    r.relationship_type,
    dd.field_name,
    dd.field_value_text
FROM core_entities e
LEFT JOIN core_relationships r ON e.id = r.from_entity_id 
    AND r.relationship_type = 'USER_MEMBER_OF_ORG'
LEFT JOIN core_dynamic_data dd ON e.id = dd.entity_id
WHERE e.id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
ORDER BY dd.field_name;

SELECT 'USER SETUP COMPLETE - Ready for authentication' as final_status;