-- MISSING RPC FUNCTIONS FOR AUTHENTICATION
-- These functions are required for the auth system to work properly

-- =============================================================================
-- USER IDENTITY RESOLUTION FUNCTION
-- =============================================================================

/**
 * Resolve user identity and organization memberships
 * Returns array of organization IDs that the current user has access to
 */
CREATE OR REPLACE FUNCTION resolve_user_identity_v1()
RETURNS TABLE(organization_ids UUID[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id UUID;
    v_org_ids UUID[];
BEGIN
    -- Get current user ID from JWT
    BEGIN
        v_current_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_current_user_id := NULL;
    END;
    
    -- If no user ID, return empty
    IF v_current_user_id IS NULL THEN
        RETURN QUERY SELECT ARRAY[]::UUID[];
        RETURN;
    END IF;
    
    -- Find all organizations this user is a member of
    SELECT ARRAY_AGG(DISTINCT r.organization_id)
    INTO v_org_ids
    FROM core_relationships r
    WHERE r.from_entity_id = v_current_user_id
    AND r.relationship_type = 'USER_MEMBER_OF_ORG'
    AND r.is_active = true;
    
    -- Return the organization IDs
    RETURN QUERY SELECT COALESCE(v_org_ids, ARRAY[]::UUID[]);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION resolve_user_identity_v1() TO authenticated;

-- =============================================================================
-- USER ROLES RESOLUTION FUNCTION
-- =============================================================================

/**
 * Resolve user roles within a specific organization
 * Returns array of role names for the user in the given organization
 */
CREATE OR REPLACE FUNCTION resolve_user_roles_in_org(p_org UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id UUID;
    v_roles TEXT[];
BEGIN
    -- Get current user ID from JWT
    BEGIN
        v_current_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_current_user_id := NULL;
    END;
    
    -- If no user ID, return empty
    IF v_current_user_id IS NULL THEN
        RETURN ARRAY[]::TEXT[];
    END IF;
    
    -- Get roles from dynamic data
    SELECT ARRAY_AGG(DISTINCT dd.field_value_text)
    INTO v_roles
    FROM core_dynamic_data dd
    WHERE dd.entity_id = v_current_user_id
    AND dd.organization_id = p_org
    AND dd.field_name IN ('role', 'salon_role', 'user_role')
    AND dd.field_value_text IS NOT NULL;
    
    -- Return roles or default to 'user' if none found
    RETURN COALESCE(v_roles, ARRAY['user']::TEXT[]);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION resolve_user_roles_in_org(UUID) TO authenticated;

-- =============================================================================
-- ALTERNATIVE IDENTITY RESOLUTION (HERA PREFIX)
-- =============================================================================

/**
 * Alternative name for identity resolution (used by some parts of the system)
 */
CREATE OR REPLACE FUNCTION hera_resolve_user_identity_v1()
RETURNS TABLE(organization_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id UUID;
    v_org_id UUID;
BEGIN
    -- Get current user ID from JWT
    BEGIN
        v_current_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_current_user_id := NULL;
    END;
    
    -- If no user ID, return empty
    IF v_current_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Find the first organization this user is a member of
    SELECT r.organization_id
    INTO v_org_id
    FROM core_relationships r
    WHERE r.from_entity_id = v_current_user_id
    AND r.relationship_type = 'USER_MEMBER_OF_ORG'
    AND r.is_active = true
    LIMIT 1;
    
    -- Return the organization ID if found
    IF v_org_id IS NOT NULL THEN
        RETURN QUERY SELECT v_org_id;
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION hera_resolve_user_identity_v1() TO authenticated;

-- =============================================================================
-- TESTING AND VERIFICATION
-- =============================================================================

-- Test the functions
DO $$
DECLARE
    v_test_result RECORD;
BEGIN
    RAISE NOTICE 'Testing RPC functions...';
    
    -- Test resolve_user_identity_v1
    BEGIN
        SELECT * INTO v_test_result FROM resolve_user_identity_v1() LIMIT 1;
        RAISE NOTICE 'resolve_user_identity_v1: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'resolve_user_identity_v1: ERROR - %', SQLERRM;
    END;
    
    -- Test resolve_user_roles_in_org
    BEGIN
        SELECT resolve_user_roles_in_org('378f24fb-d496-4ff7-8afa-ea34895a0eb8'::UUID) INTO v_test_result;
        RAISE NOTICE 'resolve_user_roles_in_org: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'resolve_user_roles_in_org: ERROR - %', SQLERRM;
    END;
    
    -- Test hera_resolve_user_identity_v1
    BEGIN
        SELECT * INTO v_test_result FROM hera_resolve_user_identity_v1() LIMIT 1;
        RAISE NOTICE 'hera_resolve_user_identity_v1: SUCCESS';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'hera_resolve_user_identity_v1: ERROR - %', SQLERRM;
    END;
END;
$$;