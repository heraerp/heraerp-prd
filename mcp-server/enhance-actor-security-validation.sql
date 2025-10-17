-- ENHANCED ACTOR SECURITY VALIDATION - Fix for 100% test success
-- Strengthen invalid actor detection and validation

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
  v_actor_type text;
  v_org_type text;
BEGIN
  -- ENHANCED: Validate required parameters with detailed error handling
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
  
  -- ENHANCED: Check for invalid/malicious UUIDs
  IF p_actor_user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION USING 
      ERRCODE='42501', 
      MESSAGE='INVALID_ACTOR_NULL_UUID',
      DETAIL='Actor cannot be null UUID (00000000-0000-0000-0000-000000000000)',
      HINT='Use a valid user entity UUID for actor identification';
  END IF;
  
  IF p_organization_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION USING 
      ERRCODE='42501', 
      MESSAGE='INVALID_ORGANIZATION_PLATFORM_UUID',
      DETAIL='Cannot perform business operations in platform organization',
      HINT='Use a valid tenant organization UUID';
  END IF;
  
  -- ENHANCED: Step 1 - Verify actor entity exists with type validation
  SELECT e.entity_type
  FROM core_entities e
  WHERE e.id = p_actor_user_id
    AND e.entity_type = 'USER'
    AND e.organization_id IN (
      -- Allow users from platform org or target org
      '00000000-0000-0000-0000-000000000000'::uuid, -- Platform org
      p_organization_id
    )
  INTO v_actor_type;
  
  IF v_actor_type IS NULL THEN
    -- Check if entity exists but wrong type
    SELECT e.entity_type
    FROM core_entities e
    WHERE e.id = p_actor_user_id
    INTO v_actor_type;
    
    IF v_actor_type IS NOT NULL THEN
      RAISE EXCEPTION USING 
        ERRCODE='42501', 
        MESSAGE='INVALID_ACTOR_ENTITY_TYPE',
        DETAIL=format('Actor %s exists but is type %s, not USER', p_actor_user_id, v_actor_type),
        HINT='Actor must be a USER entity type';
    ELSE
      RAISE EXCEPTION USING 
        ERRCODE='42501', 
        MESSAGE='ACTOR_ENTITY_NOT_FOUND',
        DETAIL=format('Actor entity %s does not exist in any accessible organization', p_actor_user_id),
        HINT='Actor must be a valid USER entity in platform or target organization';
    END IF;
  END IF;
  
  -- ENHANCED: Step 2 - Verify organization entity exists with type validation
  SELECT e.entity_type
  FROM core_entities e
  WHERE e.id = p_organization_id
    AND e.entity_type = 'ORGANIZATION'
  INTO v_org_type;
  
  IF v_org_type IS NULL THEN
    -- Check if entity exists but wrong type
    SELECT e.entity_type
    FROM core_entities e
    WHERE e.id = p_organization_id
    INTO v_org_type;
    
    IF v_org_type IS NOT NULL THEN
      RAISE EXCEPTION USING 
        ERRCODE='42501', 
        MESSAGE='INVALID_ORGANIZATION_ENTITY_TYPE',
        DETAIL=format('Organization %s exists but is type %s, not ORGANIZATION', p_organization_id, v_org_type),
        HINT='Organization must be an ORGANIZATION entity type';
    ELSE
      RAISE EXCEPTION USING 
        ERRCODE='42501', 
        MESSAGE='ORGANIZATION_ENTITY_NOT_FOUND',
        DETAIL=format('Organization entity %s does not exist', p_organization_id),
        HINT='Organization must be a valid ORGANIZATION entity';
    END IF;
  END IF;
  
  -- ENHANCED: Step 3 - Check membership relationship with detailed validation
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
  
  -- ENHANCED: If no membership found, provide detailed error
  IF NOT v_membership_exists THEN
    RAISE EXCEPTION USING 
      ERRCODE='42501', 
      MESSAGE='ACTOR_NOT_MEMBER_OF_ORGANIZATION',
      DETAIL=format('Actor %s (USER) is not a member of organization %s (ORGANIZATION) - function: %s', 
                    p_actor_user_id, p_organization_id, p_function_name),
      HINT='User must have active MEMBER_OF or USER_MEMBER_OF_ORG relationship with the organization';
  END IF;
  
  -- ENHANCED: Log successful validation for audit trail
  RAISE DEBUG 'Actor validation passed: % (USER) in org % (ORGANIZATION) via %', 
              p_actor_user_id, p_organization_id, p_function_name;
  
  -- Validation passed - all security checks OK
  RETURN;
END;
$$;

-- Update permissions
GRANT EXECUTE ON FUNCTION enforce_actor_requirement(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION enforce_actor_requirement(uuid, uuid, text) TO service_role;

-- Update documentation
COMMENT ON FUNCTION enforce_actor_requirement(uuid, uuid, text) IS 
'ENHANCED SECURITY FUNCTION: Validates actor membership with comprehensive error handling.
- Blocks null UUIDs and platform organization access
- Validates entity types (USER, ORGANIZATION)
- Checks active membership relationships
- Provides detailed error messages for debugging
Part of HERA v2.2 authentication architecture - Enhanced for 100% test success.';

-- Test the enhanced function with Michele's data
DO $$
BEGIN
  BEGIN
    PERFORM enforce_actor_requirement(
      '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid,
      '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
      'enhanced_validation_test'
    );
    RAISE NOTICE '✅ ENHANCED actor validation test PASSED for Michele';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '❌ ENHANCED actor validation test FAILED: %', SQLERRM;
      RAISE;
  END;
END;
$$;

-- Test invalid actor scenarios (should all fail)
DO $$
BEGIN
  -- Test 1: NULL UUID actor
  BEGIN
    PERFORM enforce_actor_requirement(
      '00000000-0000-0000-0000-000000000000'::uuid,
      '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
      'test_null_actor'
    );
    RAISE NOTICE '❌ NULL UUID test should have FAILED but PASSED';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '✅ NULL UUID actor test correctly FAILED: %', SQLERRM;
  END;
  
  -- Test 2: Platform org access
  BEGIN
    PERFORM enforce_actor_requirement(
      '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'test_platform_org'
    );
    RAISE NOTICE '❌ Platform org test should have FAILED but PASSED';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '✅ Platform org access test correctly FAILED: %', SQLERRM;
  END;
  
  -- Test 3: Non-existent actor
  BEGIN
    PERFORM enforce_actor_requirement(
      '99999999-9999-9999-9999-999999999999'::uuid,
      '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
      'test_fake_actor'
    );
    RAISE NOTICE '❌ Fake actor test should have FAILED but PASSED';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '✅ Fake actor test correctly FAILED: %', SQLERRM;
  END;
END;
$$;