-- Fix user login for production user
-- User ID from logs: 5c1b3698-0c38-4e3b-b1a2-cc84dcd1aa30

DO $$
DECLARE
    v_user_id UUID := '5c1b3698-0c38-4e3b-b1a2-cc84dcd1aa30';
    v_org_id UUID := '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; -- Use existing production org
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_user_email TEXT;
BEGIN
    
    -- Get user email from Supabase auth if available
    SELECT email INTO v_user_email 
    FROM auth.users 
    WHERE id = v_user_id;
    
    IF v_user_email IS NULL THEN
        v_user_email := 'user@heraerp.com';
    END IF;
    
    RAISE NOTICE 'Setting up user % with email % in org %', v_user_id, v_user_email, v_org_id;

    -- Step 1: Ensure user entity exists in tenant org (not platform)
    INSERT INTO core_entities (
        id,
        organization_id,
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        metadata,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_org_id, -- Store in tenant org, not platform
        'USER',
        split_part(v_user_email, '@', 1),
        'USER-' || substring(v_user_id::text, 1, 8),
        'HERA.SYSTEM.USER.ENTITY.PERSON.V1',
        jsonb_build_object('email', v_user_email, 'supabase_uid', v_user_id),
        v_user_id,
        v_user_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (id, organization_id) 
    DO UPDATE SET 
        entity_type = 'USER',
        metadata = jsonb_build_object('email', v_user_email, 'supabase_uid', v_user_id),
        updated_by = v_user_id,
        updated_at = NOW();

    -- Step 2: Ensure ORG entity exists
    INSERT INTO core_entities (
        id,
        organization_id,
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) SELECT 
        v_org_id,
        v_org_id,
        'ORG',
        co.organization_name,
        co.organization_code,
        'HERA.SYSTEM.ORG.ENTITY.ORGANIZATION.V1',
        v_user_id,
        v_user_id,
        NOW(),
        NOW()
    FROM core_organizations co
    WHERE co.id = v_org_id
    ON CONFLICT (id, organization_id)
    DO UPDATE SET
        updated_by = v_user_id,
        updated_at = NOW();

    -- Step 3: Remove any old relationships
    DELETE FROM core_relationships 
    WHERE from_entity_id = v_user_id 
    AND relationship_type IN ('USER_MEMBER_OF_ORG', 'MEMBER_OF');

    -- Step 4: Create MEMBER_OF relationship
    INSERT INTO core_relationships (
        organization_id,
        from_entity_id,
        to_entity_id,
        relationship_type,
        smart_code,
        relationship_data,
        is_active,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        v_org_id,
        v_user_id,
        v_org_id,
        'MEMBER_OF',
        'HERA.CORE.USER.REL.MEMBER_OF.V1',
        jsonb_build_object('role', 'OWNER', 'permissions', '["*"]'),
        true,
        v_user_id,
        v_user_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (organization_id, from_entity_id, to_entity_id, relationship_type)
    DO UPDATE SET
        relationship_data = jsonb_build_object('role', 'OWNER', 'permissions', '["*"]'),
        is_active = true,
        updated_by = v_user_id,
        updated_at = NOW();

    RAISE NOTICE 'User login setup completed successfully for user % in org %', v_user_id, v_org_id;
    RAISE NOTICE 'User should now be able to log in at https://www.heraerp.com';
END $$;