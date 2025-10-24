-- CRITICAL: Create enforce_actor_requirement function for hera_transactions_crud_v1
-- This function MUST exist for actor-based security enforcement

CREATE OR REPLACE FUNCTION enforce_actor_requirement(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_function_name text DEFAULT 'unknown_function'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership_exists boolean := false;
  v_actor_entity_exists boolean := false;
  v_org_entity_exists boolean := false;
BEGIN
  -- Validate required parameters (critical for actor stamping)
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING 
      ERRCODE='22023', 
      MESSAGE='ACTOR_USER_ID_REQUIRED',
      DETAIL=format('Function %s requires a valid actor_user_id for audit trail', p_function_name),
      HINT='All database operations require actor identification for security';
  END IF;
  
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING 
      ERRCODE='22023', 
      MESSAGE='ORGANIZATION_ID_REQUIRED',
      DETAIL=format('Function %s requires a valid organization_id for tenant isolation', p_function_name),
      HINT='All operations must be scoped to an organization';
  END IF;
  
  -- Step 1: Verify actor entity exists and is a USER type
  SELECT EXISTS (
    SELECT 1 
    FROM core_entities e
    WHERE e.id = p_actor_user_id
      AND e.entity_type = 'USER'
      AND e.organization_id IN (
        -- Allow users from platform org or target org
        '00000000-0000-0000-0000-000000000000'::uuid, -- Platform org
        p_organization_id
      )
  ) INTO v_actor_entity_exists;
  
  IF NOT v_actor_entity_exists THEN
    RAISE EXCEPTION USING 
      ERRCODE='42501', 
      MESSAGE='INVALID_ACTOR_ENTITY',
      DETAIL=format('Actor %s is not a valid USER entity', p_actor_user_id),
      HINT='Actor must be a USER entity in platform or target organization';
  END IF;
  
  -- Step 2: Verify organization entity exists
  SELECT EXISTS (
    SELECT 1 
    FROM core_entities e
    WHERE e.id = p_organization_id
      AND e.entity_type = 'ORGANIZATION'
  ) INTO v_org_entity_exists;
  
  IF NOT v_org_entity_exists THEN
    RAISE EXCEPTION USING 
      ERRCODE='42501', 
      MESSAGE='INVALID_ORGANIZATION_ENTITY',
      DETAIL=format('Organization %s is not a valid ORGANIZATION entity', p_organization_id),
      HINT='Organization must be a valid ORGANIZATION entity';
  END IF;
  
  -- Step 3: Check membership relationship
  -- Look for MEMBER_OF or USER_MEMBER_OF_ORG relationship
  SELECT EXISTS (
    SELECT 1 
    FROM core_relationships r
    WHERE r.source_entity_id = p_actor_user_id
      AND r.target_entity_id = p_organization_id
      AND r.relationship_type IN ('MEMBER_OF', 'USER_MEMBER_OF_ORG')
      AND r.is_active = true
      AND (
        -- Relationship can be stored in platform org or target org
        r.organization_id = '00000000-0000-0000-0000-000000000000'::uuid OR
        r.organization_id = p_organization_id
      )
  ) INTO v_membership_exists;
  
  -- If no membership found, raise exception
  IF NOT v_membership_exists THEN
    RAISE EXCEPTION USING 
      ERRCODE='42501', 
      MESSAGE='ACTOR_NOT_MEMBER_OF_ORGANIZATION',
      DETAIL=format('Actor %s is not a member of organization %s (function: %s)', 
                    p_actor_user_id, p_organization_id, p_function_name),
      HINT='User must have MEMBER_OF or USER_MEMBER_OF_ORG relationship with the organization';
  END IF;
  
  -- Log successful validation (optional, for debugging)
  -- RAISE NOTICE 'Actor validation passed: % in org % via %', p_actor_user_id, p_organization_id, p_function_name;
  
  -- Validation passed
  RETURN;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION enforce_actor_requirement(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION enforce_actor_requirement(uuid, uuid, text) TO service_role;

-- Add documentation
COMMENT ON FUNCTION enforce_actor_requirement(uuid, uuid, text) IS 
'CRITICAL SECURITY FUNCTION: Validates that an actor (user entity) has proper membership in the specified organization. 
Required by all CRUD functions for multi-tenant security and actor stamping compliance.
Part of HERA v2.2 authentication architecture.';

-- Test the function with Michele's data
DO $$
BEGIN
  BEGIN
    PERFORM enforce_actor_requirement(
      '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid,
      '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
      'test_deployment'
    );
    RAISE NOTICE '✅ Actor validation test PASSED for Michele';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Actor validation test FAILED: %', SQLERRM;
      RAISE;
  END;
END;
$$;