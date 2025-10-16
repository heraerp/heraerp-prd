-- Deploy user authentication fixes
-- 1. Create resolve_user_identity_v1 and resolve_user_roles_in_org functions
-- 2. Fix user assignment functions with correct field names

-- Load the resolve user identity function
\i ../functions/organizations/resolve-user-identity-rpc.sql

-- Load the fixed user assignment functions  
\i ../functions/organizations/user-assignment-rpcs.sql

-- Create a simple user entity creation function that bypasses audit
CREATE OR REPLACE FUNCTION create_user_entity_simple(
    p_auth_user_id UUID,
    p_entity_name TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entity_id UUID;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Create user entity with minimal audit requirements
    INSERT INTO core_entities (
        id,
        organization_id,
        entity_type,
        entity_name,
        metadata,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_platform_org_id,
        'USER',
        COALESCE(p_entity_name, 'User ' || p_auth_user_id::TEXT),
        jsonb_build_object('auth_user_id', p_auth_user_id::TEXT),
        p_auth_user_id, -- Self-reference
        p_auth_user_id, -- Self-reference  
        NOW(),
        NOW()
    ) RETURNING id INTO v_entity_id;
    
    RETURN v_entity_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create user entity: %', SQLERRM;
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION create_user_entity_simple(UUID, TEXT) TO authenticated;

-- Simple function to assign user to organization
CREATE OR REPLACE FUNCTION assign_user_to_first_org(
    p_auth_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_entity_id UUID;
    v_org_id UUID;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_relationship_id UUID;
BEGIN
    -- 1. Find or create user entity
    SELECT id INTO v_user_entity_id
    FROM core_entities
    WHERE entity_type = 'USER'
    AND organization_id = v_platform_org_id
    AND metadata->>'auth_user_id' = p_auth_user_id::TEXT;
    
    IF v_user_entity_id IS NULL THEN
        v_user_entity_id := create_user_entity_simple(p_auth_user_id);
    END IF;
    
    -- 2. Find first active organization
    SELECT id INTO v_org_id
    FROM core_organizations
    WHERE status = 'active'
    ORDER BY created_at
    LIMIT 1;
    
    IF v_org_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No active organizations found'
        );
    END IF;
    
    -- 3. Check if relationship already exists
    SELECT id INTO v_relationship_id
    FROM core_relationships
    WHERE source_entity_id = v_user_entity_id
    AND target_entity_id = v_org_id
    AND relationship_type = 'USER_MEMBER_OF_ORG';
    
    IF v_relationship_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'User already assigned to organization',
            'user_entity_id', v_user_entity_id,
            'organization_id', v_org_id,
            'relationship_id', v_relationship_id
        );
    END IF;
    
    -- 4. Create relationship
    INSERT INTO core_relationships (
        id,
        organization_id,
        source_entity_id,
        target_entity_id,
        relationship_type,
        relationship_data,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_org_id,
        v_user_entity_id,
        v_org_id,
        'USER_MEMBER_OF_ORG',
        jsonb_build_object(
            'role', 'user',
            'permissions', '["read", "write"]'::jsonb,
            'assigned_at', NOW(),
            'status', 'active'
        ),
        p_auth_user_id,
        p_auth_user_id,
        NOW(),
        NOW()
    ) RETURNING id INTO v_relationship_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'User successfully assigned to organization',
        'user_entity_id', v_user_entity_id,
        'organization_id', v_org_id,
        'relationship_id', v_relationship_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION assign_user_to_first_org(UUID) TO authenticated;