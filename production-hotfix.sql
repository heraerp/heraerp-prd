-- PRODUCTION HOTFIX: Fix Michele's login immediately
-- This breaks the chicken-and-egg cycle by creating the necessary entities/relationships

BEGIN;

DO $$
DECLARE
    v_michele_user_id UUID := '3ced4979-4c09-4e1e-8667-6707cfe6ec77';  -- Michele (currently logged in)
    v_other_user_id UUID := '5c1b3698-0c38-4e3b-b1a2-cc84dcd1aa30';   -- Other user from earlier logs
    v_org_id UUID := '378f24fb-d496-4ff7-8afa-ea34895a0eb8';           -- Hairtalkz org
    v_actor_user_id UUID := '09b0b92a-d797-489e-bc03-5ca0a6272674';    -- Service actor
    v_org_name TEXT;
BEGIN
    -- Get org name
    SELECT organization_name INTO v_org_name FROM core_organizations WHERE id = v_org_id;
    
    RAISE NOTICE 'PRODUCTION HOTFIX: Setting up users for org: % (%)', v_org_name, v_org_id;

    -- Ensure ORG entity exists
    INSERT INTO core_entities (id, organization_id, entity_type, entity_name, smart_code, status, created_by, updated_by, created_at, updated_at)
    VALUES (v_org_id, v_org_id, 'ORG', v_org_name, 'HERA.SYSTEM.ORG.ENTITY.ORGANIZATION.V1', 'active', v_actor_user_id, v_actor_user_id, NOW(), NOW())
    ON CONFLICT (id, organization_id) DO UPDATE SET updated_by = v_actor_user_id, updated_at = NOW();

    -- Create Michele's USER entity
    INSERT INTO core_entities (id, organization_id, entity_type, entity_name, smart_code, status, metadata, created_by, updated_by, created_at, updated_at)
    VALUES (
        v_michele_user_id, v_org_id, 'USER', 'michele', 'HERA.SYSTEM.USER.ENTITY.PERSON.V1', 'active',
        jsonb_build_object('email', 'michele@hairtalkz.com', 'supabase_uid', v_michele_user_id::text),
        v_actor_user_id, v_actor_user_id, NOW(), NOW()
    )
    ON CONFLICT (id, organization_id) DO UPDATE SET 
        metadata = jsonb_build_object('email', 'michele@hairtalkz.com', 'supabase_uid', v_michele_user_id::text),
        updated_by = v_actor_user_id, updated_at = NOW();

    -- Create other user's entity
    INSERT INTO core_entities (id, organization_id, entity_type, entity_name, smart_code, status, metadata, created_by, updated_by, created_at, updated_at)
    VALUES (
        v_other_user_id, v_org_id, 'USER', 'user', 'HERA.SYSTEM.USER.ENTITY.PERSON.V1', 'active',
        jsonb_build_object('supabase_uid', v_other_user_id::text),
        v_actor_user_id, v_actor_user_id, NOW(), NOW()
    )
    ON CONFLICT (id, organization_id) DO UPDATE SET 
        metadata = jsonb_build_object('supabase_uid', v_other_user_id::text),
        updated_by = v_actor_user_id, updated_at = NOW();

    -- Clean up old relationships
    DELETE FROM core_relationships WHERE from_entity_id IN (v_michele_user_id, v_other_user_id) AND relationship_type = 'MEMBER_OF';

    -- Create Michele's MEMBER_OF relationship
    INSERT INTO core_relationships (organization_id, from_entity_id, to_entity_id, relationship_type, relationship_data, smart_code, is_active, created_by, updated_by, created_at, updated_at)
    VALUES (
        v_org_id, v_michele_user_id, v_org_id, 'MEMBER_OF',
        jsonb_build_object('role', 'OWNER', 'permissions', '["*"]'),
        'HERA.CORE.USER.REL.MEMBER_OF.V1', true,
        v_actor_user_id, v_actor_user_id, NOW(), NOW()
    );

    -- Create other user's MEMBER_OF relationship
    INSERT INTO core_relationships (organization_id, from_entity_id, to_entity_id, relationship_type, relationship_data, smart_code, is_active, created_by, updated_by, created_at, updated_at)
    VALUES (
        v_org_id, v_other_user_id, v_org_id, 'MEMBER_OF',
        jsonb_build_object('role', 'OWNER', 'permissions', '["*"]'),
        'HERA.CORE.USER.REL.MEMBER_OF.V1', true,
        v_actor_user_id, v_actor_user_id, NOW(), NOW()
    );

    RAISE NOTICE 'HOTFIX COMPLETE: Both users should now be able to log in';
    RAISE NOTICE 'Michele: %', v_michele_user_id;
    RAISE NOTICE 'Other user: %', v_other_user_id;
END $$;

COMMIT;

-- Quick verification
SELECT 'Users in org:' as info, count(*) as user_count FROM core_entities WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' AND entity_type = 'USER';
SELECT 'MEMBER_OF relationships:' as info, count(*) as rel_count FROM core_relationships WHERE organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' AND relationship_type = 'MEMBER_OF';