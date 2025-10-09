-- 🚨 FINAL MICHELE SESSION RESET
-- This will force a complete authentication refresh
-- EXECUTE IN SUPABASE SQL EDITOR

-- =====================================================
-- STEP 1: Verify Current State
-- =====================================================

-- Check Michele's current user metadata in auth.users
SELECT 'Current user metadata:' AS info, 
       id, 
       email, 
       user_metadata,
       created_at,
       updated_at
FROM auth.users 
WHERE id = '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid;

-- Check Michele's organization relationships
SELECT 'Organization relationships:' AS info,
       id,
       organization_id,
       to_entity_id,
       relationship_type,
       is_active,
       created_at
FROM core_relationships 
WHERE from_entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND relationship_type = 'USER_MEMBER_OF_ORG';

-- =====================================================
-- STEP 2: Force User Metadata Update to Hair Talkz
-- =====================================================

-- Update user metadata to point to Hair Talkz organization
UPDATE auth.users 
SET user_metadata = jsonb_build_object(
    'organization_id', '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    'organization_name', 'Hair Talkz Salon',
    'role', 'owner',
    'permissions', ARRAY['admin:full', 'salon:all', 'finance:all'],
    'updated_at', now()::text,
    'corrected_from_wrong_org', 'c0771739-ddb6-47fb-ae82-d34febedf098',
    'correction_reason', 'Fixed organization mismatch - Michele should access Hair Talkz'
),
updated_at = now()
WHERE id = '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid;

-- =====================================================
-- STEP 3: Clean Up Wrong Organization Relationships
-- =====================================================

-- Remove any relationships to wrong organizations
DELETE FROM core_relationships 
WHERE from_entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND relationship_type = 'USER_MEMBER_OF_ORG'
AND organization_id != '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

-- Ensure Hair Talkz relationship exists and is active
INSERT INTO core_relationships (
    organization_id,
    from_entity_id,
    to_entity_id,
    relationship_type,
    smart_code,
    is_active,
    relationship_data
) VALUES (
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    '09b0b92a-d797-489e-bc03-5ca0a6272674',
    '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    'USER_MEMBER_OF_ORG',
    'HERA.ACCOUNTING.USER.MEMBERSHIP.v2',
    true,
    '{"role": "owner", "permissions": ["admin:full", "salon:all"], "primary_organization": true}'::jsonb
) ON CONFLICT (organization_id, from_entity_id, to_entity_id, relationship_type) 
DO UPDATE SET 
    is_active = true,
    relationship_data = EXCLUDED.relationship_data,
    smart_code = EXCLUDED.smart_code;

-- =====================================================
-- STEP 4: Force Session Refresh by Updating User
-- =====================================================

-- Force a session refresh by updating user updated_at
UPDATE auth.users 
SET updated_at = now(),
    email_confirmed_at = now(),
    last_sign_in_at = now()
WHERE id = '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid;

-- =====================================================
-- STEP 5: Update Dynamic Data in Hair Talkz Organization
-- =====================================================

-- Ensure Michele has complete dynamic data in Hair Talkz
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_text,
    field_value_json,
    smart_code
) VALUES 
('378f24fb-d496-4ff7-8afa-ea34895a0eb8', '09b0b92a-d797-489e-bc03-5ca0a6272674', 'role', 'text', 'owner', NULL, 'HERA.ACCOUNTING.USER.ROLE.v2'),
('378f24fb-d496-4ff7-8afa-ea34895a0eb8', '09b0b92a-d797-489e-bc03-5ca0a6272674', 'salon_role', 'text', 'owner', NULL, 'HERA.ACCOUNTING.USER.SALON_ROLE.v2'),
('378f24fb-d496-4ff7-8afa-ea34895a0eb8', '09b0b92a-d797-489e-bc03-5ca0a6272674', 'permissions', 'json', NULL, '["admin:full", "salon:all", "finance:all"]'::jsonb, 'HERA.ACCOUNTING.USER.PERMISSIONS.v2'),
('378f24fb-d496-4ff7-8afa-ea34895a0eb8', '09b0b92a-d797-489e-bc03-5ca0a6272674', 'full_name', 'text', 'Michele Rossi', NULL, 'HERA.ACCOUNTING.USER.PROFILE.v2'),
('378f24fb-d496-4ff7-8afa-ea34895a0eb8', '09b0b92a-d797-489e-bc03-5ca0a6272674', 'business_title', 'text', 'Owner & Lead Stylist', NULL, 'HERA.ACCOUNTING.USER.TITLE.v2')
ON CONFLICT (organization_id, entity_id, field_name) 
DO UPDATE SET 
    field_value_text = EXCLUDED.field_value_text,
    field_value_json = EXCLUDED.field_value_json,
    smart_code = EXCLUDED.smart_code,
    updated_at = now();

-- Remove any dynamic data from wrong organizations
DELETE FROM core_dynamic_data 
WHERE entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND organization_id != '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

-- =====================================================
-- STEP 6: Verification
-- =====================================================

-- Verify the fixes
SELECT 'VERIFICATION - User metadata updated:' AS status,
       user_metadata->'organization_id' as org_id,
       user_metadata->'role' as role,
       updated_at
FROM auth.users 
WHERE id = '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid;

SELECT 'VERIFICATION - Active relationships:' AS status,
       organization_id,
       relationship_type,
       is_active
FROM core_relationships 
WHERE from_entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND relationship_type = 'USER_MEMBER_OF_ORG'
AND is_active = true;

SELECT 'VERIFICATION - Dynamic data count:' AS status,
       COUNT(*) as field_count
FROM core_dynamic_data 
WHERE entity_id = '09b0b92a-d797-489e-bc03-5ca0a6272674'
AND organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

-- =====================================================
-- FINAL SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 MICHELE SESSION RESET COMPLETE!' AS status,
       'Michele must now: 1) Sign out completely, 2) Clear browser cache, 3) Sign back in' AS instructions;