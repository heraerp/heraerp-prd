-- Fix user membership for correct organization
-- User: 3ced4979-4c09-4e1e-8667-6707cfe6ec77
-- Correct Org: 378f24fb-d496-4ff7-8afa-ea34895a0eb8

DO $$
DECLARE
    v_user_id UUID := '3ced4979-4c09-4e1e-8667-6707cfe6ec77';
    v_org_id UUID := '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
    v_existing_rel_id UUID;
BEGIN
    -- Step 1: Ensure user entity exists with correct org
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
        v_org_id,
        'USER',
        'michele',
        'USER-' || substring(v_user_id::text, 1, 8),
        'HERA.CORE.USER.ENT.STANDARD.V1',
        jsonb_build_object('email', 'michele@example.com', 'auth_user_id', v_user_id),
        v_user_id,
        v_user_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
        organization_id = v_org_id,
        updated_by = v_user_id,
        updated_at = NOW();

    -- Step 2: Remove any old USER_MEMBER_OF_ORG relationships
    DELETE FROM core_relationships 
    WHERE from_entity_id = v_user_id 
    AND relationship_type = 'USER_MEMBER_OF_ORG';

    -- Step 3: Remove any MEMBER_OF relationships to wrong orgs
    DELETE FROM core_relationships 
    WHERE from_entity_id = v_user_id 
    AND relationship_type = 'MEMBER_OF'
    AND to_entity_id != v_org_id;

    -- Step 4: Create or update MEMBER_OF relationship to correct org
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

    RAISE NOTICE 'User membership fixed successfully for user % in org %', v_user_id, v_org_id;
END $$;