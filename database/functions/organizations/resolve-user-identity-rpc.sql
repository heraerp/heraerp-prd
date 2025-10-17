-- HERA User Identity Resolution RPC Functions
-- ===============================================
-- Creates the missing resolve_user_identity_v1 function
-- that auth system is trying to call

-- Function to resolve user identity and organization memberships
-- Compatible with verifyAuth expectations
CREATE OR REPLACE FUNCTION resolve_user_identity_v1()
RETURNS TABLE(
    organization_ids UUID[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_auth_id UUID;
    v_user_entity_id UUID;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_org_ids UUID[];
BEGIN
    -- Get the current user's auth ID from JWT
    v_user_auth_id := auth.uid();
    
    IF v_user_auth_id IS NULL THEN
        RETURN QUERY SELECT ARRAY[]::UUID[];
        RETURN;
    END IF;

    -- Find the user entity in platform organization
    SELECT id INTO v_user_entity_id
    FROM core_entities
    WHERE entity_type = 'USER'
    AND organization_id = v_platform_org_id
    AND metadata->>'auth_user_id' = v_user_auth_id::TEXT;

    IF v_user_entity_id IS NULL THEN
        -- No user entity found, return empty array
        RETURN QUERY SELECT ARRAY[]::UUID[];
        RETURN;
    END IF;

    -- Get all organization IDs where user has USER_MEMBER_OF_ORG relationship
    SELECT ARRAY_AGG(target_entity_id) INTO v_org_ids
    FROM core_relationships
    WHERE source_entity_id = v_user_entity_id
    AND relationship_type = 'USER_MEMBER_OF_ORG';

    -- Return the organization IDs
    RETURN QUERY SELECT COALESCE(v_org_ids, ARRAY[]::UUID[]);
    
EXCEPTION
    WHEN OTHERS THEN
        -- On any error, return empty array to prevent access
        RETURN QUERY SELECT ARRAY[]::UUID[];
END;
$$;

-- Function to resolve user roles in a specific organization
CREATE OR REPLACE FUNCTION resolve_user_roles_in_org(p_org UUID)
RETURNS TABLE(role_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_auth_id UUID;
    v_user_entity_id UUID;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_relationship_metadata JSONB;
BEGIN
    -- Get the current user's auth ID from JWT
    v_user_auth_id := auth.uid();
    
    IF v_user_auth_id IS NULL THEN
        RETURN;
    END IF;

    -- Find the user entity in platform organization
    SELECT id INTO v_user_entity_id
    FROM core_entities
    WHERE entity_type = 'USER'
    AND organization_id = v_platform_org_id
    AND metadata->>'auth_user_id' = v_user_auth_id::TEXT;

    IF v_user_entity_id IS NULL THEN
        RETURN;
    END IF;

    -- Get the relationship metadata for this organization
    SELECT relationship_data INTO v_relationship_metadata
    FROM core_relationships
    WHERE source_entity_id = v_user_entity_id
    AND target_entity_id = p_org
    AND relationship_type = 'USER_MEMBER_OF_ORG';

    IF v_relationship_metadata IS NULL THEN
        RETURN;
    END IF;

    -- Return the role from metadata
    RETURN QUERY SELECT (v_relationship_metadata->>'role')::TEXT
    WHERE v_relationship_metadata->>'role' IS NOT NULL;

EXCEPTION
    WHEN OTHERS THEN
        -- On any error, return no roles
        RETURN;
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION resolve_user_identity_v1() TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_user_roles_in_org(UUID) TO authenticated;

-- Add function documentation
COMMENT ON FUNCTION resolve_user_identity_v1() IS 'Resolve user identity and return organization IDs where user has membership';
COMMENT ON FUNCTION resolve_user_roles_in_org(UUID) IS 'Get user roles within a specific organization';