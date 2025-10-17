-- ENHANCED SECURITY VALIDATION - SYSTEM-AWARE
-- Properly handles system-level vs business-level operations
-- Allows platform org for legitimate system operations while blocking business operations

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
  v_is_platform_org boolean := false;
  v_is_system_operation boolean := false;
  v_is_system_actor boolean := false;
BEGIN
  -- Step 1: Validate required parameters
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
  
  -- Step 2: ENHANCED - Block NULL UUID attacks (never allowed)
  IF p_actor_user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION USING 
      ERRCODE='42501', 
      MESSAGE='INVALID_ACTOR_NULL_UUID',
      DETAIL='Actor cannot be null UUID (00000000-0000-0000-0000-000000000000)',
      HINT='Use a valid user entity UUID for actor identification';
  END IF;
  
  -- Step 3: Determine if this is platform organization
  v_is_platform_org := (p_organization_id = '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Step 4: Determine if this is a system-level operation
  v_is_system_operation := p_function_name IN (
    'hera_entities_crud_v2',           -- Entity management (USER creation, ORG creation)
    'hera_user_management_v2',         -- User account operations
    'hera_organization_setup_v2',      -- Organization setup
    'hera_platform_admin_v2',          -- Platform administration
    'hera_system_maintenance_v2',      -- System maintenance
    'hera_cross_tenant_reporting_v2',  -- Cross-tenant operations
    'hera_billing_system_v2',          -- Billing operations
    'hera_audit_system_v2',            -- Audit operations
    'system_migration_v2',             -- Data migration
    'platform_initialization',        -- Platform setup
    'enhanced_validation_test',        -- Testing functions
    'security_fix_test',               -- Security testing
    'diagnostic_test'                  -- Diagnostic operations
  );
  
  -- Step 5: Verify actor entity exists with type validation
  SELECT e.entity_type
  FROM core_entities e
  WHERE e.id = p_actor_user_id
    AND e.entity_type = 'USER'
    AND e.organization_id IN (
      '00000000-0000-0000-0000-000000000000'::uuid, -- Platform org
      p_organization_id                              -- Target org
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
  
  -- Step 6: Determine if actor is a system actor (created in platform org)
  SELECT EXISTS (
    SELECT 1 FROM core_entities e
    WHERE e.id = p_actor_user_id
      AND e.entity_type = 'USER'
      AND e.organization_id = '00000000-0000-0000-0000-000000000000'::uuid
  ) INTO v_is_system_actor;
  
  -- Step 7: Verify organization entity exists with type validation
  IF NOT v_is_platform_org THEN
    -- For non-platform orgs, verify organization exists
    SELECT e.entity_type
    FROM core_entities e
    WHERE e.id = p_organization_id
      AND e.entity_type IN ('ORG', 'ORGANIZATION')
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
  END IF;
  
  -- Step 8: ENHANCED PLATFORM ORGANIZATION LOGIC
  IF v_is_platform_org THEN
    -- Platform organization access rules
    IF v_is_system_operation THEN
      -- System operations in platform org are allowed for any valid USER
      -- This enables: user creation, org setup, platform admin, etc.
      RAISE DEBUG 'Platform org access ALLOWED: system operation % by actor %', p_function_name, p_actor_user_id;
    ELSE
      -- Business operations in platform org are BLOCKED
      -- This prevents: appointments, sales, inventory in platform org
      RAISE EXCEPTION USING 
        ERRCODE='42501', 
        MESSAGE='BUSINESS_OPERATIONS_NOT_ALLOWED_IN_PLATFORM_ORG',
        DETAIL=format('Function %s is a business operation and cannot be performed in platform organization', p_function_name),
        HINT='Business operations must be performed in tenant organizations, not platform';
    END IF;
  ELSE
    -- Step 9: For tenant organizations, check membership relationship
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
        DETAIL=format('Actor %s (USER) is not a member of organization %s (ORGANIZATION) - function: %s', 
                      p_actor_user_id, p_organization_id, p_function_name),
        HINT='User must have active MEMBER_OF or USER_MEMBER_OF_ORG relationship with the organization';
    END IF;
  END IF;
  
  -- Step 10: Log successful validation for audit trail
  RAISE DEBUG 'Enhanced actor validation passed: % (USER) in org % via % (system_op: %, platform_org: %)', 
              p_actor_user_id, p_organization_id, p_function_name, v_is_system_operation, v_is_platform_org;
  
  -- Validation passed - all enhanced security checks OK
  RETURN;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION enforce_actor_requirement(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION enforce_actor_requirement(uuid, uuid, text) TO service_role;

-- Add comprehensive documentation
COMMENT ON FUNCTION enforce_actor_requirement(uuid, uuid, text) IS 
'ENHANCED SYSTEM-AWARE SECURITY FUNCTION v2.3: 
Validates actor membership with proper system vs business operation handling.

PLATFORM ORGANIZATION RULES:
- System operations (user creation, org setup, platform admin) = ALLOWED
- Business operations (appointments, sales, inventory) = BLOCKED

TENANT ORGANIZATION RULES:  
- All operations ALLOWED if actor has valid membership
- All operations BLOCKED if actor lacks membership

SECURITY FEATURES:
- Blocks null UUIDs (00000000-0000-0000-0000-000000000000)
- Distinguishes system vs business operations
- Validates entity types (USER, ORGANIZATION)
- Checks active membership relationships
- Provides detailed error messages for debugging
- Comprehensive cross-organization access control

Part of HERA v2.3 authentication architecture - System-aware enhanced security.';

-- =============================================================================
-- COMPREHENSIVE TEST SUITE
-- =============================================================================

SELECT 'TESTING ENHANCED SYSTEM-AWARE SECURITY VALIDATION' as test_phase;

-- Test 1: Valid Michele in tenant org (should PASS)
DO $$
BEGIN
  BEGIN
    PERFORM enforce_actor_requirement(
      '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid,  -- Michele
      '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,  -- Hair Talkz
      'hera_transactions_crud_v2'                      -- Business operation
    );
    RAISE NOTICE '✅ Test 1 PASSED: Michele business operation in tenant org ALLOWED';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Test 1 FAILED: Michele business operation rejected: %', SQLERRM;
  END;
END;
$$;

-- Test 2: System operation in platform org (should PASS)
DO $$
BEGIN
  BEGIN
    PERFORM enforce_actor_requirement(
      '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid,  -- Michele
      '00000000-0000-0000-0000-000000000000'::uuid,  -- Platform org
      'hera_entities_crud_v2'                         -- System operation
    );
    RAISE NOTICE '✅ Test 2 PASSED: System operation in platform org ALLOWED';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Test 2 FAILED: System operation in platform org rejected: %', SQLERRM;
  END;
END;
$$;

-- Test 3: Business operation in platform org (should FAIL)
DO $$
BEGIN
  BEGIN
    PERFORM enforce_actor_requirement(
      '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid,  -- Michele
      '00000000-0000-0000-0000-000000000000'::uuid,  -- Platform org
      'hera_transactions_crud_v2'                     -- Business operation
    );
    RAISE NOTICE '❌ Test 3 FAILED: Business operation in platform org should be BLOCKED';
  EXCEPTION 
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%BUSINESS_OPERATIONS_NOT_ALLOWED_IN_PLATFORM_ORG%' THEN
        RAISE NOTICE '✅ Test 3 PASSED: Business operation in platform org correctly BLOCKED';
      ELSE
        RAISE NOTICE '❌ Test 3 FAILED: Wrong error for business in platform: %', SQLERRM;
      END IF;
  END;
END;
$$;

-- Test 4: NULL UUID actor (should FAIL)
DO $$
BEGIN
  BEGIN
    PERFORM enforce_actor_requirement(
      '00000000-0000-0000-0000-000000000000'::uuid,  -- NULL UUID
      '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,  -- Hair Talkz
      'hera_transactions_crud_v2'                     -- Any operation
    );
    RAISE NOTICE '❌ Test 4 FAILED: NULL UUID actor should be BLOCKED';
  EXCEPTION 
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%INVALID_ACTOR_NULL_UUID%' THEN
        RAISE NOTICE '✅ Test 4 PASSED: NULL UUID actor correctly BLOCKED';
      ELSE
        RAISE NOTICE '❌ Test 4 FAILED: Wrong error for NULL UUID: %', SQLERRM;
      END IF;
  END;
END;
$$;

-- Test 5: Fake actor (should FAIL)
DO $$
BEGIN
  BEGIN
    PERFORM enforce_actor_requirement(
      '99999999-9999-9999-9999-999999999999'::uuid,  -- Fake actor
      '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,  -- Hair Talkz
      'hera_transactions_crud_v2'                     -- Business operation
    );
    RAISE NOTICE '❌ Test 5 FAILED: Fake actor should be BLOCKED';
  EXCEPTION 
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%ACTOR_ENTITY_NOT_FOUND%' OR SQLERRM LIKE '%ACTOR_NOT_MEMBER%' THEN
        RAISE NOTICE '✅ Test 5 PASSED: Fake actor correctly BLOCKED';
      ELSE
        RAISE NOTICE '❌ Test 5 FAILED: Wrong error for fake actor: %', SQLERRM;
      END IF;
  END;
END;
$$;

-- Test 6: Cross-organization access (should FAIL)
DO $$
BEGIN
  BEGIN
    PERFORM enforce_actor_requirement(
      '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid,  -- Michele
      '11111111-1111-1111-1111-111111111111'::uuid,  -- Different org
      'hera_transactions_crud_v2'                     -- Business operation
    );
    RAISE NOTICE '❌ Test 6 FAILED: Cross-org access should be BLOCKED';
  EXCEPTION 
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%ACTOR_NOT_MEMBER%' OR SQLERRM LIKE '%ORGANIZATION_ENTITY_NOT_FOUND%' THEN
        RAISE NOTICE '✅ Test 6 PASSED: Cross-org access correctly BLOCKED';
      ELSE
        RAISE NOTICE '❌ Test 6 FAILED: Wrong error for cross-org: %', SQLERRM;
      END IF;
  END;
END;
$$;

SELECT 'ENHANCED SYSTEM-AWARE SECURITY DEPLOYMENT COMPLETE' as deployment_status;

-- =============================================================================
-- ENHANCED TRANSACTION CRUD WITH SYSTEM-AWARE SECURITY
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_transactions_crud_v2(
  p_action text,
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_transaction jsonb DEFAULT '{}'::jsonb,
  p_lines jsonb DEFAULT '[]'::jsonb,
  p_dynamic jsonb DEFAULT '{}'::jsonb,
  p_relationships jsonb DEFAULT '[]'::jsonb,
  p_options jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action text := upper(COALESCE(p_action, 'READ'));
  v_transaction_id uuid;
  v_result jsonb;
  v_header jsonb;
  v_processed_lines jsonb;
BEGIN
  -- ENHANCED: Comprehensive security validation with system-awareness
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='ACTOR_USER_ID_REQUIRED';
  END IF;
  
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='ORGANIZATION_ID_REQUIRED';
  END IF;
  
  -- ENHANCED: System-aware actor requirement enforcement
  PERFORM enforce_actor_requirement(p_actor_user_id, p_organization_id, 'hera_transactions_crud_v2');
  
  -- Handle different actions with full security validation passed
  IF v_action = 'CREATE' THEN
    -- Build header from p_transaction
    v_header := p_transaction || jsonb_build_object(
      'organization_id', p_organization_id,
      'transaction_status', COALESCE(p_transaction->>'transaction_status', 'pending'),
      'transaction_date', COALESCE(p_transaction->>'transaction_date', now()::text),
      'transaction_code', COALESCE(p_transaction->>'transaction_code', 'TXN-' || extract(epoch from now())::bigint)
    );
    
    -- Process lines array
    v_processed_lines := p_lines;
    
    -- Call the working hera_txn_create_v1 function
    SELECT hera_txn_create_v1(v_header, v_processed_lines, p_actor_user_id) INTO v_result;
    
    -- Return in CRUD format
    RETURN jsonb_build_object(
      'items', jsonb_build_array(v_result),
      'count', 1,
      'action', v_action,
      'success', true
    );
    
  ELSIF v_action = 'READ' THEN
    -- Extract transaction_id if provided
    v_transaction_id := NULLIF(p_transaction->>'transaction_id', '')::uuid;
    
    IF v_transaction_id IS NOT NULL THEN
      -- Read specific transaction
      SELECT jsonb_build_object(
        'id', t.id,
        'transaction_type', t.transaction_type,
        'transaction_code', t.transaction_code,
        'smart_code', t.smart_code,
        'source_entity_id', t.source_entity_id,
        'target_entity_id', t.target_entity_id,
        'total_amount', t.total_amount,
        'transaction_status', t.transaction_status,
        'transaction_date', t.transaction_date,
        'created_by', t.created_by,
        'created_at', t.created_at,
        'updated_by', t.updated_by,
        'updated_at', t.updated_at,
        'lines', (
          SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
              'id', l.id,
              'line_number', l.line_number,
              'line_type', l.line_type,
              'description', l.description,
              'quantity', l.quantity,
              'unit_amount', l.unit_amount,
              'line_amount', l.line_amount,
              'line_data', l.line_data
            ) ORDER BY l.line_number
          ), '[]'::jsonb)
          FROM universal_transaction_lines l
          WHERE l.transaction_id = t.id
            AND l.organization_id = p_organization_id
        )
      )
      FROM universal_transactions t
      WHERE t.id = v_transaction_id
        AND t.organization_id = p_organization_id
      INTO v_result;
      
      IF v_result IS NULL THEN
        RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='TRANSACTION_NOT_FOUND';
      END IF;
      
      RETURN jsonb_build_object(
        'items', jsonb_build_array(v_result),
        'count', 1,
        'action', v_action,
        'success', true
      );
    ELSE
      -- Read multiple transactions (paginated)
      SELECT jsonb_build_object(
        'items', COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'transaction_type', t.transaction_type,
            'transaction_code', t.transaction_code,
            'smart_code', t.smart_code,
            'source_entity_id', t.source_entity_id,
            'target_entity_id', t.target_entity_id,
            'total_amount', t.total_amount,
            'transaction_status', t.transaction_status,
            'transaction_date', t.transaction_date,
            'created_by', t.created_by,
            'created_at', t.created_at
          ) ORDER BY t.created_at DESC
        ), '[]'::jsonb),
        'count', count(*),
        'action', v_action,
        'success', true
      )
      FROM universal_transactions t
      WHERE t.organization_id = p_organization_id
      LIMIT COALESCE((p_options->>'limit')::int, 50)
      INTO v_result;
      
      RETURN v_result;
    END IF;
    
  ELSIF v_action = 'UPDATE' THEN
    v_transaction_id := NULLIF(p_transaction->>'transaction_id', '')::uuid;
    
    IF v_transaction_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='TRANSACTION_ID_REQUIRED_FOR_UPDATE';
    END IF;
    
    -- Update transaction fields
    UPDATE universal_transactions
    SET transaction_status = COALESCE(p_transaction->>'transaction_status', transaction_status),
        total_amount = COALESCE((p_transaction->>'total_amount')::numeric, total_amount),
        updated_by = p_actor_user_id,
        updated_at = now()
    WHERE id = v_transaction_id
      AND organization_id = p_organization_id;
    
    -- Return updated transaction
    RETURN hera_transactions_crud_v2('READ', p_actor_user_id, p_organization_id, 
                                   jsonb_build_object('transaction_id', v_transaction_id));
    
  ELSIF v_action = 'DELETE' THEN
    v_transaction_id := NULLIF(p_transaction->>'transaction_id', '')::uuid;
    
    IF v_transaction_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='TRANSACTION_ID_REQUIRED_FOR_DELETE';
    END IF;
    
    -- Soft delete by setting status to 'deleted'
    UPDATE universal_transactions
    SET transaction_status = 'deleted',
        updated_by = p_actor_user_id,
        updated_at = now()
    WHERE id = v_transaction_id
      AND organization_id = p_organization_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'action', v_action,
      'transaction_id', v_transaction_id,
      'message', 'Transaction deleted successfully'
    );
    
  ELSE
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE=format('UNKNOWN_ACTION_%s', v_action);
  END IF;
END;
$$;

-- Grant permissions for enhanced function
GRANT EXECUTE ON FUNCTION hera_transactions_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_transactions_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb) TO service_role;

-- Add comprehensive documentation
COMMENT ON FUNCTION hera_transactions_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb) IS 
'HERA Transactions CRUD v2.3 - SYSTEM-AWARE ENHANCED SECURITY
Complete transaction management with system-aware actor validation.

SECURITY FEATURES:
- System-aware platform organization handling
- Comprehensive actor validation 
- Organization isolation enforcement
- Invalid actor detection and blocking
- Cross-organization access prevention

BUSINESS OPERATIONS:
Actions: CREATE, READ, UPDATE, DELETE
Compatible with hera_entities_crud_v2 parameter structure.
Uses enhanced enforce_actor_requirement with system-awareness.

PLATFORM ORGANIZATION RULES:
- System operations (user management, org setup) = ALLOWED
- Business operations (transactions, sales) = BLOCKED';

SELECT 'ENHANCED SYSTEM-AWARE TRANSACTION CRUD v2.3 DEPLOYMENT COMPLETE' as final_status;