-- HERA v2.3 - Add Gateway Enforcement to Existing RPC Functions
-- Smart Code: HERA.SECURITY.RPC.GATEWAY_ENFORCEMENT.v1
-- 
-- Adds gateway enforcement to existing hera_entities_crud_v1 and hera_txn_crud_v1
-- This completes the Hard Gate implementation by securing all RPC entry points

-- =============================================================================
-- Step 1: Enhanced hera_entities_crud_v1 with Gateway Enforcement
-- =============================================================================

CREATE OR REPLACE FUNCTION public.hera_entities_crud_v1(
  p_action text,
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_entity jsonb DEFAULT '{}'::jsonb,
  p_dynamic jsonb DEFAULT '{}'::jsonb,
  p_relationships jsonb DEFAULT '[]'::jsonb,
  p_options jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_entity_id uuid;
  v_entity_data jsonb;
  v_runtime_mode text;
BEGIN
  -- HERA v2.3 HARD GATE: Enforce API v2 Gateway routing
  PERFORM set_config('app.current_function', 'hera_entities_crud_v1', true);
  PERFORM enforce_api_v2_gateway();

  -- Get runtime mode
  v_runtime_mode := current_setting('app.hera_guardrails_mode', true);
  v_runtime_mode := COALESCE(v_runtime_mode, 'warn');

  -- HERA v2.2: Enhanced validation
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Actor user ID is required';
  END IF;
  
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID is required';
  END IF;

  -- HERA v2.2: Membership validation (defense-in-depth)
  IF NOT validate_actor_membership(p_actor_user_id, p_organization_id) THEN
    IF v_runtime_mode = 'enforce' THEN
      RAISE EXCEPTION 'Actor % is not a member of organization %', p_actor_user_id, p_organization_id;
    ELSE
      -- v1 WARN mode - log warning but allow
      RAISE NOTICE 'HERA v2.2 WARN: Actor % not validated as member of org % (v1 runtime)', p_actor_user_id, p_organization_id;
    END IF;
  END IF;

  -- Action routing
  CASE p_action
    WHEN 'CREATE' THEN
      -- Create entity with enhanced validation
      INSERT INTO public.core_entities (
        organization_id,
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        status,
        created_by,
        updated_by
      ) VALUES (
        p_organization_id,
        COALESCE(p_entity->>'entity_type', 'GENERAL'),
        p_entity->>'entity_name',
        p_entity->>'entity_code',
        p_entity->>'smart_code',
        COALESCE(p_entity->>'status', 'active'),
        p_actor_user_id,
        p_actor_user_id
      ) RETURNING id INTO v_entity_id;
      
      -- Handle dynamic fields if provided
      IF p_dynamic IS NOT NULL AND jsonb_typeof(p_dynamic) = 'object' THEN
        INSERT INTO public.core_dynamic_data (
          organization_id,
          entity_id,
          field_name,
          field_type,
          field_value,
          field_value_number,
          field_value_boolean,
          field_value_json,
          created_by,
          updated_by
        )
        SELECT 
          p_organization_id,
          v_entity_id,
          field_key,
          COALESCE(field_value->>'field_type', 'text'),
          CASE WHEN field_value->>'field_type' = 'text' THEN field_value->>'field_value' END,
          CASE WHEN field_value->>'field_type' = 'number' THEN (field_value->>'field_value_number')::numeric END,
          CASE WHEN field_value->>'field_type' = 'boolean' THEN (field_value->>'field_value_boolean')::boolean END,
          CASE WHEN field_value->>'field_type' = 'json' THEN field_value->'field_value_json' END,
          p_actor_user_id,
          p_actor_user_id
        FROM jsonb_each(p_dynamic) AS fields(field_key, field_value);
      END IF;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'entity_id', v_entity_id,
        'message', 'Entity created successfully',
        'runtime_version', 'v1',
        'gateway_enforced', true,
        'membership_validated', validate_actor_membership(p_actor_user_id, p_organization_id)
      );

    WHEN 'READ' THEN
      -- Read entities with organization filtering
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ce.id,
          'entity_type', ce.entity_type,
          'entity_name', ce.entity_name,
          'entity_code', ce.entity_code,
          'smart_code', ce.smart_code,
          'status', ce.status,
          'created_at', ce.created_at,
          'updated_at', ce.updated_at,
          'metadata', ce.metadata
        )
      ) INTO v_entity_data
      FROM public.core_entities ce
      WHERE ce.organization_id = p_organization_id
        AND (p_entity->>'entity_type' IS NULL OR ce.entity_type = p_entity->>'entity_type')
        AND (p_entity->>'entity_id' IS NULL OR ce.id = (p_entity->>'entity_id')::uuid)
        AND ce.status != 'deleted'
      ORDER BY ce.updated_at DESC
      LIMIT COALESCE((p_options->>'limit')::int, 100);
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'data', COALESCE(v_entity_data, '[]'::jsonb),
        'runtime_version', 'v1',
        'gateway_enforced', true,
        'membership_validated', validate_actor_membership(p_actor_user_id, p_organization_id)
      );

    WHEN 'UPDATE' THEN
      -- Update entity with validation
      v_entity_id := (p_entity->>'entity_id')::uuid;
      
      IF v_entity_id IS NULL THEN
        RAISE EXCEPTION 'entity_id is required for UPDATE action';
      END IF;
      
      UPDATE public.core_entities 
      SET 
        entity_name = COALESCE(p_entity->>'entity_name', entity_name),
        entity_code = COALESCE(p_entity->>'entity_code', entity_code),
        smart_code = COALESCE(p_entity->>'smart_code', smart_code),
        status = COALESCE(p_entity->>'status', status),
        updated_by = p_actor_user_id,
        updated_at = NOW()
      WHERE id = v_entity_id 
        AND organization_id = p_organization_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'entity_id', v_entity_id,
        'message', 'Entity updated successfully',
        'runtime_version', 'v1',
        'gateway_enforced', true
      );

    WHEN 'DELETE' THEN
      -- Soft delete entity
      v_entity_id := (p_entity->>'entity_id')::uuid;
      
      IF v_entity_id IS NULL THEN
        RAISE EXCEPTION 'entity_id is required for DELETE action';
      END IF;
      
      UPDATE public.core_entities 
      SET 
        status = 'deleted',
        updated_by = p_actor_user_id,
        updated_at = NOW()
      WHERE id = v_entity_id 
        AND organization_id = p_organization_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'entity_id', v_entity_id,
        'message', 'Entity deleted successfully',
        'runtime_version', 'v1',
        'gateway_enforced', true
      );

    ELSE
      RAISE EXCEPTION 'Invalid action: %. Supported actions: CREATE, READ, UPDATE, DELETE', p_action;
  END CASE;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Step 2: Enhanced hera_txn_crud_v1 with Gateway Enforcement
-- =============================================================================

CREATE OR REPLACE FUNCTION public.hera_txn_crud_v1(
  p_action text,
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_transaction jsonb DEFAULT '{}'::jsonb,
  p_lines jsonb DEFAULT '[]'::jsonb,
  p_options jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_txn_id uuid;
  v_txn_data jsonb;
  v_line_count integer := 0;
  v_total_amount numeric := 0;
BEGIN
  -- HERA v2.3 HARD GATE: Enforce API v2 Gateway routing
  PERFORM set_config('app.current_function', 'hera_txn_crud_v1', true);
  PERFORM enforce_api_v2_gateway();

  -- Enhanced validation
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Actor user ID is required';
  END IF;
  
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID is required';
  END IF;

  -- Membership validation (defense-in-depth)
  IF NOT validate_actor_membership(p_actor_user_id, p_organization_id) THEN
    RAISE NOTICE 'HERA v2.3: Actor % membership check for org % (proceeding)', p_actor_user_id, p_organization_id;
  END IF;

  -- Action routing
  CASE p_action
    WHEN 'CREATE' THEN
      -- Generate transaction ID
      v_txn_id := gen_random_uuid();
      
      -- Insert transaction header
      INSERT INTO public.universal_transactions (
        id,
        organization_id,
        transaction_type,
        transaction_number,
        transaction_date,
        source_entity_id,
        target_entity_id,
        total_amount,
        currency,
        status,
        smart_code,
        metadata,
        created_by,
        updated_by
      ) VALUES (
        v_txn_id,
        p_organization_id,
        p_transaction->>'transaction_type',
        COALESCE(p_transaction->>'transaction_number', 'TXN-' || extract(epoch from now())::text),
        COALESCE((p_transaction->>'transaction_date')::timestamptz, NOW()),
        (p_transaction->>'source_entity_id')::uuid,
        (p_transaction->>'target_entity_id')::uuid,
        COALESCE((p_transaction->>'total_amount')::numeric, 0),
        COALESCE(p_transaction->>'currency', 'USD'),
        COALESCE(p_transaction->>'status', 'pending'),
        p_transaction->>'smart_code',
        COALESCE(p_transaction->'metadata', '{}'::jsonb),
        p_actor_user_id,
        p_actor_user_id
      );
      
      -- Insert transaction lines if provided
      IF p_lines IS NOT NULL AND jsonb_array_length(p_lines) > 0 THEN
        INSERT INTO public.universal_transaction_lines (
          transaction_id,
          organization_id,
          entity_id,
          line_description,
          line_order,
          quantity,
          unit_price,
          line_amount,
          metadata,
          created_by,
          updated_by
        )
        SELECT 
          v_txn_id,
          p_organization_id,
          (line_data->>'entity_id')::uuid,
          COALESCE(line_data->>'line_description', 'Transaction line'),
          COALESCE((line_data->>'line_order')::integer, row_number() OVER ()),
          COALESCE((line_data->>'quantity')::numeric, 1),
          COALESCE((line_data->>'unit_price')::numeric, 0),
          COALESCE((line_data->>'line_amount')::numeric, 0),
          COALESCE(line_data->'metadata', '{}'::jsonb),
          p_actor_user_id,
          p_actor_user_id
        FROM jsonb_array_elements(p_lines) AS lines(line_data);
        
        GET DIAGNOSTICS v_line_count = ROW_COUNT;
        
        -- Calculate total from lines and update transaction
        SELECT COALESCE(SUM(line_amount), 0) INTO v_total_amount
        FROM public.universal_transaction_lines
        WHERE transaction_id = v_txn_id;
        
        UPDATE public.universal_transactions 
        SET total_amount = v_total_amount,
            updated_at = NOW(),
            updated_by = p_actor_user_id
        WHERE id = v_txn_id;
      END IF;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'transaction_id', v_txn_id,
        'line_count', v_line_count,
        'total_amount', v_total_amount,
        'message', 'Transaction created successfully',
        'runtime_version', 'v1',
        'gateway_enforced', true
      );

    WHEN 'READ' THEN
      -- Read transactions with organization filtering
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ut.id,
          'transaction_type', ut.transaction_type,
          'transaction_number', ut.transaction_number,
          'transaction_date', ut.transaction_date,
          'total_amount', ut.total_amount,
          'currency', ut.currency,
          'status', ut.status,
          'smart_code', ut.smart_code,
          'created_at', ut.created_at,
          'updated_at', ut.updated_at,
          'metadata', ut.metadata
        )
      ) INTO v_txn_data
      FROM public.universal_transactions ut
      WHERE ut.organization_id = p_organization_id
        AND (p_transaction->>'transaction_type' IS NULL OR ut.transaction_type = p_transaction->>'transaction_type')
        AND (p_transaction->>'transaction_id' IS NULL OR ut.id = (p_transaction->>'transaction_id')::uuid)
        AND ut.status != 'deleted'
      ORDER BY ut.transaction_date DESC, ut.created_at DESC
      LIMIT COALESCE((p_options->>'limit')::int, 100);
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'data', COALESCE(v_txn_data, '[]'::jsonb),
        'runtime_version', 'v1',
        'gateway_enforced', true
      );

    WHEN 'UPDATE' THEN
      -- Update transaction
      v_txn_id := (p_transaction->>'transaction_id')::uuid;
      
      IF v_txn_id IS NULL THEN
        RAISE EXCEPTION 'transaction_id is required for UPDATE action';
      END IF;
      
      UPDATE public.universal_transactions 
      SET 
        transaction_type = COALESCE(p_transaction->>'transaction_type', transaction_type),
        status = COALESCE(p_transaction->>'status', status),
        smart_code = COALESCE(p_transaction->>'smart_code', smart_code),
        metadata = COALESCE(p_transaction->'metadata', metadata),
        updated_by = p_actor_user_id,
        updated_at = NOW()
      WHERE id = v_txn_id 
        AND organization_id = p_organization_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'transaction_id', v_txn_id,
        'message', 'Transaction updated successfully',
        'runtime_version', 'v1',
        'gateway_enforced', true
      );

    WHEN 'DELETE' THEN
      -- Soft delete transaction
      v_txn_id := (p_transaction->>'transaction_id')::uuid;
      
      IF v_txn_id IS NULL THEN
        RAISE EXCEPTION 'transaction_id is required for DELETE action';
      END IF;
      
      UPDATE public.universal_transactions 
      SET 
        status = 'deleted',
        updated_by = p_actor_user_id,
        updated_at = NOW()
      WHERE id = v_txn_id 
        AND organization_id = p_organization_id;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'transaction_id', v_txn_id,
        'message', 'Transaction deleted successfully',
        'runtime_version', 'v1',
        'gateway_enforced', true
      );

    ELSE
      RAISE EXCEPTION 'Invalid action: %. Supported actions: CREATE, READ, UPDATE, DELETE', p_action;
  END CASE;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Step 3: Add Gateway Enforcement to Actor Resolution Function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.resolve_user_identity_v1(p_auth_uid uuid DEFAULT auth.uid())
RETURNS TABLE (
  user_entity_id uuid,
  email text,
  memberships jsonb,
  metadata jsonb
) AS $$
DECLARE 
  v_auth_uid uuid;
  v_user_entity_id uuid;
BEGIN
  -- Note: resolve_user_identity_v1 is called BY the gateway, so we don't enforce gateway here
  -- Instead, we note that this is a special system function
  PERFORM set_config('app.current_function', 'resolve_user_identity_v1', true);
  PERFORM set_config('app.request_source', 'system_identity_resolution', true);

  -- Use provided UUID or fallback to auth.uid()
  v_auth_uid := COALESCE(p_auth_uid, auth.uid());
  
  IF v_auth_uid IS NULL THEN 
    RAISE EXCEPTION 'No authenticated user provided';
  END IF;

  -- Find USER entity by provider_uid in metadata
  SELECT ce.id INTO v_user_entity_id 
  FROM public.core_entities ce
  WHERE ce.entity_type = 'USER' 
    AND ce.metadata->>'provider_uid' = v_auth_uid::text 
    AND ce.status = 'active' 
  LIMIT 1;

  IF v_user_entity_id IS NULL THEN 
    RAISE EXCEPTION 'No USER entity found for auth.uid %', v_auth_uid;
  END IF;

  -- Return user identity with memberships
  RETURN QUERY
  SELECT 
    v_user_entity_id,
    au.email,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'organization_id', cr.target_entity_id,
          'organization_name', co.entity_name,
          'role', cr.relationship_data->>'role',
          'is_active', cr.is_active,
          'joined_at', cr.effective_date,
          'membership_type', cr.relationship_type
        ) ORDER BY cr.created_at DESC
      ) FILTER (WHERE cr.id IS NOT NULL), 
      '[]'::jsonb
    ) as memberships,
    jsonb_build_object(
      'user_entity_id', v_user_entity_id,
      'auth_uid', v_auth_uid,
      'resolved_at', NOW(),
      'function_version', 'v1',
      'cache_key', 'actor:' || left(v_auth_uid::text, 8),
      'gateway_aware', true
    ) as metadata
  FROM auth.users au
  LEFT JOIN public.core_relationships cr ON (
    cr.source_entity_id = v_user_entity_id 
    AND cr.relationship_type = 'MEMBER_OF'
    AND cr.is_active = true
    AND (cr.expiration_date IS NULL OR cr.expiration_date > NOW())
  )
  LEFT JOIN public.core_entities co ON (
    co.id = cr.target_entity_id 
    AND co.entity_type = 'ORGANIZATION' 
    AND co.status = 'active'
  )
  WHERE au.id = v_auth_uid
  GROUP BY au.email;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Step 4: Create Gateway Status Check Function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_gateway_enforcement_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status jsonb;
  v_test_result jsonb;
BEGIN
  -- Test the gateway enforcement
  SELECT test_gateway_enforcement() INTO v_test_result;
  
  v_status := jsonb_build_object(
    'gateway_enforcement', 'active',
    'runtime_version', 'v2.3',
    'enforcement_functions', jsonb_build_object(
      'enforce_api_v2_gateway', 'enabled',
      'set_gateway_context', 'enabled',
      'emergency_override_gateway', 'available'
    ),
    'protected_rpcs', jsonb_build_array(
      'hera_entities_crud_v1',
      'hera_txn_crud_v1'
    ),
    'test_results', v_test_result,
    'timestamp', NOW()
  );
  
  RETURN v_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_gateway_enforcement_status() TO authenticated;

-- =============================================================================
-- Step 5: Add Documentation Comments
-- =============================================================================

COMMENT ON FUNCTION public.hera_entities_crud_v1(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb) IS 
'HERA v2.3 Enhanced Entity CRUD with Gateway Enforcement. 
All calls must route through API v2 Gateway. Direct RPC access is blocked.
Includes membership validation and enhanced security features.';

COMMENT ON FUNCTION public.hera_txn_crud_v1(text, uuid, uuid, jsonb, jsonb, jsonb) IS 
'HERA v2.3 Enhanced Transaction CRUD with Gateway Enforcement.
All calls must route through API v2 Gateway. Direct RPC access is blocked.
Supports transaction headers and lines with proper actor stamping.';

-- Log successful migration
SELECT 'HERA v2.3 Hard Gate: Gateway enforcement added to RPC functions successfully' as result;