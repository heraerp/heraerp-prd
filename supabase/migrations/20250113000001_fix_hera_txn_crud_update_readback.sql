-- ================================================================================
-- FIX: hera_txn_crud_v1 UPDATE action to read back updated transaction
-- ================================================================================
-- Problem: UPDATE action doesn't return the updated transaction data
-- Solution: After update, read back the transaction with lines
-- ================================================================================

CREATE OR REPLACE FUNCTION public.hera_txn_crud_v1(
  p_action text,
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action text := lower(trim(p_action));
  v_header jsonb;
  v_lines  jsonb;
  v_txn_id uuid;
  v_patch   jsonb;
  v_reason  text;
  v_reversal_date timestamptz;
  v_resp   jsonb;
  v_ok     boolean := false;
  v_guard  jsonb := '[]'::jsonb;
  v_sc_regex text := '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+';
  v_header_org uuid;
  v_header_sc  text;
BEGIN
  -- Extract common fields
  v_header := COALESCE(p_payload->'header', '{}'::jsonb);
  v_lines  := COALESCE(p_payload->'lines', '[]'::jsonb);
  v_patch   := COALESCE(p_payload->'patch', '{}'::jsonb);
  v_reason  := COALESCE((p_payload->>'reason')::text, NULL);
  v_reversal_date := COALESCE((p_payload->>'reversal_date')::timestamptz, now());
  v_txn_id := NULLIF(p_payload->>'transaction_id','')::uuid;

  -- Guardrail: org_id
  IF v_header ? 'organization_id' THEN
    v_header_org := (v_header->>'organization_id')::uuid;
    IF v_header_org IS NULL OR v_header_org <> p_organization_id THEN
      v_guard := v_guard || jsonb_build_object(
        'code','ORG-FILTER-REQUIRED',
        'msg','organization_id missing/mismatch on header'
      );
    END IF;
  ELSIF v_action IN ('create','emit') THEN
    v_guard := v_guard || jsonb_build_object(
      'code','ORG-FILTER-REQUIRED',
      'msg','header.organization_id is required for create/emit'
    );
  END IF;

  -- Guardrail: Smart Code
  IF v_action IN ('create','emit','update') THEN
    v_header_sc := v_header->>'smart_code';
    IF v_header_sc IS NULL OR v_header_sc !~ v_sc_regex THEN
      v_guard := v_guard || jsonb_build_object(
        'code','SMARTCODE-PRESENT',
        'msg','smart_code missing/invalid on header',
        'pattern', v_sc_regex
      );
    END IF;
  END IF;

  IF jsonb_array_length(v_guard) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'action', upper(v_action),
      'error', 'guardrail_violations',
      'violations', v_guard
    );
  END IF;

  -- Route by action
  IF v_action = 'create' THEN
    v_resp := hera_txn_create_v1(v_header, v_lines, p_actor_user_id);
    v_txn_id := NULLIF(v_resp->>'transaction_id','')::uuid;
    IF v_txn_id IS NOT NULL THEN
      PERFORM hera_txn_validate_v1(p_organization_id, v_txn_id);
    END IF;
    v_ok := true;

  ELSIF v_action = 'read' THEN
    IF v_txn_id IS NULL THEN RAISE EXCEPTION 'transaction_id required for read'; END IF;
    v_resp := hera_txn_read_v1(
      p_organization_id,
      v_txn_id,
      COALESCE((p_payload->>'include_lines')::boolean, true),
      COALESCE((p_payload->>'include_deleted')::boolean, false)
    );
    v_ok := true;

  ELSIF v_action = 'query' THEN
    v_resp := hera_txn_query_v1(p_organization_id, p_payload);
    v_ok := true;

  ELSIF v_action = 'update' THEN
    IF v_txn_id IS NULL THEN RAISE EXCEPTION 'transaction_id required for update'; END IF;

    -- ✅ FIX: Update transaction header
    v_resp := hera_txn_update_v1(p_organization_id, v_txn_id, v_patch, p_actor_user_id);

    -- Check if update was successful
    IF NOT COALESCE((v_resp->>'success')::boolean, false) THEN
      RETURN jsonb_build_object(
        'success', false,
        'action', 'UPDATE',
        'error', v_resp->>'error'
      );
    END IF;

    -- ✅ FIX: Update transaction lines if provided
    IF v_lines IS NOT NULL AND jsonb_array_length(v_lines) > 0 THEN
      -- Delete existing lines
      DELETE FROM universal_transaction_lines
      WHERE transaction_id = v_txn_id
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
        v_txn_id,
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

    -- ✅ FIX: Read back the updated transaction with lines
    v_resp := hera_txn_read_v1(
      p_organization_id,
      v_txn_id,
      true,  -- include_lines
      false  -- include_deleted
    );

    v_ok := true;

  ELSIF v_action = 'delete' THEN
    IF v_txn_id IS NULL THEN RAISE EXCEPTION 'transaction_id required for delete'; END IF;
    v_resp := hera_txn_delete_v1(p_organization_id, v_txn_id);
    v_ok := true;

  ELSIF v_action = 'emit' THEN
    v_resp := hera_txn_emit_v1(
      p_organization_id,
      v_header->>'transaction_type',
      v_header->>'smart_code',
      v_header->>'transaction_code',
      COALESCE((v_header->>'transaction_date')::timestamptz, now()),
      NULLIF(v_header->>'source_entity_id','')::uuid,
      NULLIF(v_header->>'target_entity_id','')::uuid,
      COALESCE((v_header->>'total_amount')::numeric, 0),
      COALESCE(v_header->>'transaction_status','pending'),
      v_header->>'reference_number',
      v_header->>'external_reference',
      COALESCE(v_header->'business_context','{}'::jsonb),
      COALESCE(v_header->'metadata','{}'::jsonb),
      p_actor_user_id
    );
    v_ok := true;

  ELSIF v_action = 'reverse' THEN
    IF v_txn_id IS NULL THEN RAISE EXCEPTION 'transaction_id required for reverse'; END IF;
    v_resp := hera_txn_reverse_v1(p_organization_id, v_txn_id, v_reversal_date, v_reason, p_actor_user_id);
    v_ok := true;

  ELSIF v_action = 'void' THEN
    IF v_txn_id IS NULL THEN RAISE EXCEPTION 'transaction_id required for void'; END IF;
    v_resp := hera_txn_void_v1(p_organization_id, v_txn_id, v_reason, p_actor_user_id);
    v_ok := true;

  ELSIF v_action = 'validate' THEN
    IF v_txn_id IS NULL THEN RAISE EXCEPTION 'transaction_id required for validate'; END IF;
    v_resp := hera_txn_validate_v1(p_organization_id, v_txn_id);
    v_ok := true;

  ELSE
    RAISE EXCEPTION 'Unknown action: %', v_action;
  END IF;

  RETURN jsonb_build_object(
    'success', v_ok,
    'action', upper(v_action),
    'transaction_id', v_txn_id,
    'data', v_resp
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'action', upper(v_action),
    'error', SQLERRM
  );
END;
$$;

-- Security: Grant execute to authenticated users and service role
REVOKE ALL ON FUNCTION public.hera_txn_crud_v1(text, uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hera_txn_crud_v1(text, uuid, uuid, jsonb) TO authenticated, service_role;

COMMENT ON FUNCTION public.hera_txn_crud_v1 IS 'HERA Transaction CRUD Orchestrator v1 - Fixed UPDATE to read back updated transaction with lines';
