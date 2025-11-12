-- ========================================
-- HERA Transaction CRUD v1 - Orchestrator Update
-- ========================================
-- Purpose: Delegate QUERY action to hera_txn_query_v1 for better performance
-- Date: 2025-01-12
-- Version: 2.5.0
-- ========================================

-- Update hera_txn_crud_v1 orchestrator to delegate QUERY to hera_txn_query_v1
CREATE OR REPLACE FUNCTION public.hera_txn_crud_v1(
  p_action text,                         -- 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'QUERY' | 'VOID' | 'REVERSE'
  p_actor_user_id uuid,                  -- WHO is making the change (required for non-QUERY actions)
  p_organization_id uuid,                -- WHERE (tenant boundary - required)
  p_payload jsonb DEFAULT '{}'::jsonb    -- Action-specific payload
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_action_upper text;
  v_result jsonb;
  v_err_detail text;
  v_err_hint text;
  v_err_context text;
BEGIN
  -- Normalize action to uppercase
  v_action_upper := UPPER(TRIM(p_action));

  -- Validate required parameters
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'ORG_REQUIRED: p_organization_id cannot be null';
  END IF;

  -- ✅ CRITICAL IMPROVEMENT: Delegate QUERY to hera_txn_query_v1 (no actor required for read-only)
  IF v_action_upper = 'QUERY' THEN
    -- Extract filters from p_payload.filters
    v_result := hera_txn_query_v1(
      p_organization_id,
      COALESCE(p_payload->'filters', '{}'::jsonb)
    );

    -- Wrap response to match orchestrator format
    RETURN jsonb_build_object(
      'success', true,
      'action', 'QUERY',
      'transaction_id', null,
      'data', v_result
    );
  END IF;

  -- For all other actions, require actor_user_id
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'ACTOR_REQUIRED: p_actor_user_id cannot be null for action %', v_action_upper;
  END IF;

  -- ========================================
  -- CREATE Action
  -- ========================================
  IF v_action_upper = 'CREATE' THEN
    -- Validate payload structure
    IF (p_payload->>'header') IS NULL THEN
      RAISE EXCEPTION 'PARAM_REQUIRED: header is required for CREATE';
    END IF;

    -- Call hera_txn_create_v1
    v_result := hera_txn_create_v1(
      p_payload->'header',
      COALESCE(p_payload->'lines', '[]'::jsonb),
      p_actor_user_id
    );

    -- Read back the created transaction
    RETURN jsonb_build_object(
      'success', true,
      'action', 'CREATE',
      'transaction_id', v_result->>'transaction_id',
      'data', hera_txn_read_v1(p_organization_id, (v_result->>'transaction_id')::uuid)
    );
  END IF;

  -- ========================================
  -- READ Action
  -- ========================================
  IF v_action_upper = 'READ' THEN
    IF (p_payload->>'transaction_id') IS NULL THEN
      RAISE EXCEPTION 'PARAM_REQUIRED: transaction_id is required for READ';
    END IF;

    v_result := hera_txn_read_v1(
      p_organization_id,
      (p_payload->>'transaction_id')::uuid
    );

    RETURN jsonb_build_object(
      'success', true,
      'action', 'READ',
      'transaction_id', p_payload->>'transaction_id',
      'data', v_result
    );
  END IF;

  -- ========================================
  -- UPDATE Action
  -- ========================================
  IF v_action_upper = 'UPDATE' THEN
    IF (p_payload->>'transaction_id') IS NULL THEN
      RAISE EXCEPTION 'PARAM_REQUIRED: transaction_id is required for UPDATE';
    END IF;

    -- Extract transaction_id and patch from payload
    DECLARE
      v_transaction_id uuid := (p_payload->>'transaction_id')::uuid;
      v_patch jsonb := p_payload->'patch';
      v_lines jsonb := p_payload->'lines';
      v_update_result jsonb;
      v_read_result jsonb;
    BEGIN
      -- Call hera_txn_update_v1 to update the transaction header
      v_update_result := hera_txn_update_v1(
        p_organization_id,
        p_actor_user_id,
        v_transaction_id,
        v_patch
      );

      -- Check if update was successful
      IF NOT (v_update_result->>'success')::boolean THEN
        RETURN jsonb_build_object(
          'success', false,
          'action', 'UPDATE',
          'error', v_update_result->>'error'
        );
      END IF;

      -- Update transaction lines if provided
      IF v_lines IS NOT NULL AND jsonb_array_length(v_lines) > 0 THEN
        -- Delete existing lines
        DELETE FROM universal_transaction_lines
        WHERE transaction_id = v_transaction_id
          AND organization_id = p_organization_id;

        -- Insert new lines
        INSERT INTO universal_transaction_lines (
          organization_id,
          transaction_id,
          line_number,
          line_type,
          entity_id,
          description,
          quantity,
          unit_amount,
          line_amount,
          smart_code,
          created_by,
          updated_by
        )
        SELECT
          p_organization_id,
          v_transaction_id,
          (line->>'line_number')::int,
          line->>'line_type',
          NULLIF(line->>'entity_id', '')::uuid,
          line->>'description',
          COALESCE((line->>'quantity')::numeric, 1),
          COALESCE((line->>'unit_amount')::numeric, 0),
          COALESCE((line->>'line_amount')::numeric, 0),
          line->>'smart_code',
          p_actor_user_id,
          p_actor_user_id
        FROM jsonb_array_elements(v_lines) AS line;
      END IF;

      -- Read back the updated transaction with lines
      v_read_result := hera_txn_query_v1(
        p_organization_id,
        jsonb_build_object(
          'transaction_id', v_transaction_id,
          'include_lines', true
        )
      );

      -- Return the updated transaction
      RETURN jsonb_build_object(
        'success', true,
        'action', 'UPDATE',
        'transaction_id', v_transaction_id,
        'data', v_read_result
      );
    END;
  END IF;

  -- ========================================
  -- DELETE Action
  -- ========================================
  IF v_action_upper = 'DELETE' THEN
    IF (p_payload->>'transaction_id') IS NULL THEN
      RAISE EXCEPTION 'PARAM_REQUIRED: transaction_id is required for DELETE';
    END IF;

    -- TODO: Implement DELETE logic (only empty drafts)
    RAISE EXCEPTION 'DELETE action not yet implemented';
  END IF;

  -- ========================================
  -- VOID Action
  -- ========================================
  IF v_action_upper = 'VOID' THEN
    IF (p_payload->>'transaction_id') IS NULL THEN
      RAISE EXCEPTION 'PARAM_REQUIRED: transaction_id is required for VOID';
    END IF;

    -- TODO: Implement VOID logic (soft delete)
    RAISE EXCEPTION 'VOID action not yet implemented';
  END IF;

  -- ========================================
  -- REVERSE Action
  -- ========================================
  IF v_action_upper = 'REVERSE' THEN
    IF (p_payload->>'transaction_id') IS NULL THEN
      RAISE EXCEPTION 'PARAM_REQUIRED: transaction_id is required for REVERSE';
    END IF;

    v_result := hera_txn_reverse_v1(
      p_organization_id,
      (p_payload->>'transaction_id')::uuid,
      COALESCE(p_payload->>'reason', 'Transaction reversed'),
      COALESCE(p_payload->>'smart_code', 'HERA.GENERIC.TXN.REVERSAL.v1')
    );

    RETURN jsonb_build_object(
      'success', true,
      'action', 'REVERSE',
      'transaction_id', v_result->'data'->>'reversal_transaction_id',
      'data', v_result
    );
  END IF;

  -- Unknown action
  RAISE EXCEPTION 'INVALID_ACTION: % is not supported. Use CREATE, READ, UPDATE, DELETE, QUERY, VOID, or REVERSE', v_action_upper;

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS
    v_err_detail = PG_EXCEPTION_DETAIL,
    v_err_hint = PG_EXCEPTION_HINT,
    v_err_context = PG_EXCEPTION_CONTEXT;

  RETURN jsonb_build_object(
    'success', false,
    'action', v_action_upper,
    'transaction_id', null,
    'error', SQLSTATE || ': ' || SQLERRM,
    'error_detail', NULLIF(v_err_detail, ''),
    'error_hint', NULLIF(v_err_hint, ''),
    'error_context', v_err_context
  );
END;
$$;

-- Security: Grant execute to authenticated users and service role
REVOKE ALL ON FUNCTION public.hera_txn_crud_v1(text, uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hera_txn_crud_v1(text, uuid, uuid, jsonb) TO authenticated, service_role;

COMMENT ON FUNCTION public.hera_txn_crud_v1 IS 'HERA Transaction CRUD Orchestrator v1 - Delegates QUERY to hera_txn_query_v1 for optimized performance';

-- ========================================
-- VERIFICATION
-- ========================================
-- Test that QUERY delegation works:
-- SELECT hera_txn_crud_v1(
--   'QUERY',
--   NULL,  -- Actor not required for QUERY
--   'your-org-uuid'::uuid,
--   '{"filters": {"source_entity_id": "customer-uuid", "include_lines": true}}'::jsonb
-- );
