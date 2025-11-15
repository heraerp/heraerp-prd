-- HERA v2.2 v1 RPC Enhancement - Membership Validation
-- Smart Code: HERA.DB.MIGRATIONS.V22.RPC.HARDENING.v1
-- 
-- Enhances existing v1 RPCs with membership checks for defense-in-depth
-- Preserves existing functionality while adding HERA v2.2 compliance

-- =============================================================================
-- Enhanced Membership Validation Helper Function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_actor_membership(
  p_actor_user_id uuid,
  p_organization_id uuid
) RETURNS boolean AS $$
DECLARE
  v_is_member boolean := false;
BEGIN
  -- Check if actor is a member of the organization
  SELECT EXISTS (
    SELECT 1 
    FROM public.core_relationships cr
    WHERE cr.source_entity_id = p_actor_user_id
      AND cr.target_entity_id = p_organization_id
      AND cr.relationship_type = 'MEMBER_OF'
      AND cr.is_active = true
      AND (cr.expiration_date IS NULL OR cr.expiration_date > NOW())
  ) INTO v_is_member;
  
  RETURN v_is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.validate_actor_membership(uuid, uuid) TO authenticated;

-- =============================================================================
-- Enhance hera_entities_crud_v1 with Membership Validation
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
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'entity_id', v_entity_id,
        'message', 'Entity created successfully',
        'runtime_version', 'v1',
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
          'updated_at', ce.updated_at
        )
      ) INTO v_entity_data
      FROM public.core_entities ce
      WHERE ce.organization_id = p_organization_id
        AND (p_entity->>'entity_type' IS NULL OR ce.entity_type = p_entity->>'entity_type')
        AND (p_entity->>'entity_id' IS NULL OR ce.id = (p_entity->>'entity_id')::uuid)
      LIMIT COALESCE((p_options->>'limit')::int, 100);
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'data', COALESCE(v_entity_data, '[]'::jsonb),
        'runtime_version', 'v1',
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
        updated_by = p_actor_user_id
      WHERE id = v_entity_id 
        AND organization_id = p_organization_id;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Entity not found or access denied';
      END IF;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'entity_id', v_entity_id,
        'message', 'Entity updated successfully',
        'runtime_version', 'v1',
        'membership_validated', validate_actor_membership(p_actor_user_id, p_organization_id)
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
        updated_by = p_actor_user_id
      WHERE id = v_entity_id 
        AND organization_id = p_organization_id;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Entity not found or access denied';
      END IF;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'entity_id', v_entity_id,
        'message', 'Entity deleted successfully',
        'runtime_version', 'v1',
        'membership_validated', validate_actor_membership(p_actor_user_id, p_organization_id)
      );

    ELSE
      RAISE EXCEPTION 'Invalid action: %. Valid actions: CREATE, READ, UPDATE, DELETE', p_action;
  END CASE;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'action', p_action,
      'error', SQLERRM,
      'runtime_version', 'v1',
      'membership_validated', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.hera_entities_crud_v1(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb) TO authenticated;

-- =============================================================================
-- Enhance hera_txn_crud_v1 with Membership Validation
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
  v_transaction_id uuid;
  v_transaction_data jsonb;
  v_runtime_mode text;
  v_line jsonb;
  v_line_id uuid;
BEGIN
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
      -- Create transaction with enhanced validation
      INSERT INTO public.universal_transactions (
        organization_id,
        transaction_type,
        transaction_number,
        smart_code,
        source_entity_id,
        target_entity_id,
        total_amount,
        transaction_status,
        created_by,
        updated_by
      ) VALUES (
        p_organization_id,
        COALESCE(p_transaction->>'transaction_type', 'general'),
        COALESCE(p_transaction->>'transaction_number', 'TXN-' || extract(epoch from now())::bigint),
        p_transaction->>'smart_code',
        (p_transaction->>'source_entity_id')::uuid,
        (p_transaction->>'target_entity_id')::uuid,
        COALESCE((p_transaction->>'total_amount')::decimal, 0),
        COALESCE(p_transaction->>'transaction_status', 'draft'),
        p_actor_user_id,
        p_actor_user_id
      ) RETURNING id INTO v_transaction_id;
      
      -- Create transaction lines if provided
      IF jsonb_array_length(p_lines) > 0 THEN
        FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
        LOOP
          INSERT INTO public.universal_transaction_lines (
            organization_id,
            transaction_id,
            line_number,
            line_type,
            description,
            quantity,
            unit_amount,
            line_amount,
            entity_id,
            smart_code,
            line_data,
            created_by,
            updated_by
          ) VALUES (
            p_organization_id,
            v_transaction_id,
            COALESCE((v_line->>'line_number')::int, 1),
            COALESCE(v_line->>'line_type', 'GENERAL'),
            v_line->>'description',
            COALESCE((v_line->>'quantity')::decimal, 1),
            COALESCE((v_line->>'unit_amount')::decimal, 0),
            COALESCE((v_line->>'line_amount')::decimal, 0),
            (v_line->>'entity_id')::uuid,
            v_line->>'smart_code',
            COALESCE(v_line->'line_data', '{}'::jsonb),
            p_actor_user_id,
            p_actor_user_id
          );
        END LOOP;
      END IF;
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'transaction_id', v_transaction_id,
        'lines_created', jsonb_array_length(p_lines),
        'message', 'Transaction created successfully',
        'runtime_version', 'v1',
        'membership_validated', validate_actor_membership(p_actor_user_id, p_organization_id)
      );

    WHEN 'READ' THEN
      -- Read transactions with organization filtering
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ut.id,
          'transaction_type', ut.transaction_type,
          'transaction_number', ut.transaction_number,
          'smart_code', ut.smart_code,
          'total_amount', ut.total_amount,
          'transaction_status', ut.transaction_status,
          'created_at', ut.created_at,
          'updated_at', ut.updated_at
        )
      ) INTO v_transaction_data
      FROM public.universal_transactions ut
      WHERE ut.organization_id = p_organization_id
        AND (p_transaction->>'transaction_type' IS NULL OR ut.transaction_type = p_transaction->>'transaction_type')
        AND (p_transaction->>'transaction_id' IS NULL OR ut.id = (p_transaction->>'transaction_id')::uuid)
      LIMIT COALESCE((p_options->>'limit')::int, 100);
      
      v_result := jsonb_build_object(
        'success', true,
        'action', p_action,
        'data', COALESCE(v_transaction_data, '[]'::jsonb),
        'runtime_version', 'v1',
        'membership_validated', validate_actor_membership(p_actor_user_id, p_organization_id)
      );

    ELSE
      RAISE EXCEPTION 'Invalid action: %. Valid actions: CREATE, READ', p_action;
  END CASE;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'action', p_action,
      'error', SQLERRM,
      'runtime_version', 'v1',
      'membership_validated', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.hera_txn_crud_v1(text, uuid, uuid, jsonb, jsonb, jsonb) TO authenticated;

-- =============================================================================
-- Migration Summary
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '🎯 HERA v2.2 v1 RPC Enhancement Complete!';
  RAISE NOTICE '   ✅ Enhanced hera_entities_crud_v1 with membership validation';
  RAISE NOTICE '   ✅ Enhanced hera_txn_crud_v1 with membership validation';
  RAISE NOTICE '   ✅ Added validate_actor_membership helper function';
  RAISE NOTICE '   ✅ Preserved all existing functionality';
  RAISE NOTICE '';
  RAISE NOTICE '🛡️ Security Features:';
  RAISE NOTICE '   • Defense-in-depth membership validation';
  RAISE NOTICE '   • Actor stamping on all operations';
  RAISE NOTICE '   • Organization boundary enforcement';
  RAISE NOTICE '   • Runtime mode awareness (WARN/ENFORCE)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Deployment Status: Production Safe';
  RAISE NOTICE '   • Maintains v1 runtime compatibility';
  RAISE NOTICE '   • WARN mode for existing systems';
  RAISE NOTICE '   • Ready for v2 migration';
END $$;