-- Missing Authentication RPC Functions for HERA
-- ===============================================
-- These functions are required by the authentication system
-- but were missing from the database

-- Function to resolve user identity and organization memberships
-- This is called by verifyAuth to get allowedOrgs array
CREATE OR REPLACE FUNCTION resolve_user_identity_v1()
RETURNS jsonb[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_result jsonb[];
BEGIN
    -- Get the current user ID from auth context
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN ARRAY[]::jsonb[];
    END IF;
    
    -- Get organization IDs from USER_MEMBER_OF_ORG relationships
    WITH user_orgs AS (
        SELECT DISTINCT r.to_entity_id as organization_id
        FROM core_relationships r
        WHERE r.from_entity_id = v_user_id
        AND r.relationship_type = 'USER_MEMBER_OF_ORG'
        AND r.is_active = true
    )
    SELECT ARRAY[jsonb_build_object(
        'user_id', v_user_id,
        'organization_ids', COALESCE(array_agg(organization_id), ARRAY[]::UUID[])
    )]
    INTO v_result
    FROM user_orgs;
    
    RETURN COALESCE(v_result, ARRAY[jsonb_build_object(
        'user_id', v_user_id,
        'organization_ids', ARRAY[]::UUID[]
    )]::jsonb[]);
END;
$$;

-- Function to resolve user roles within a specific organization
-- This is called by verifyAuth to get user roles
CREATE OR REPLACE FUNCTION resolve_user_roles_in_org(p_org UUID)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_roles text[];
BEGIN
    -- Get the current user ID from auth context
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL OR p_org IS NULL THEN
        RETURN ARRAY[]::text[];
    END IF;
    
    -- Get roles from the USER_MEMBER_OF_ORG relationship
    SELECT ARRAY[
        COALESCE(
            r.relationship_data->>'role',
            'user'
        )
    ]
    INTO v_roles
    FROM core_relationships r
    WHERE r.from_entity_id = v_user_id
    AND r.to_entity_id = p_org
    AND r.relationship_type = 'USER_MEMBER_OF_ORG'
    AND r.is_active = true
    LIMIT 1;
    
    RETURN COALESCE(v_roles, ARRAY['user']::text[]);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION resolve_user_identity_v1() TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_user_roles_in_org(UUID) TO authenticated;

-- Also grant to anon for demo purposes (if needed)
GRANT EXECUTE ON FUNCTION resolve_user_identity_v1() TO anon;
GRANT EXECUTE ON FUNCTION resolve_user_roles_in_org(UUID) TO anon;