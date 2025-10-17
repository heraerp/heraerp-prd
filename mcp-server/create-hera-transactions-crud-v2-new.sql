-- Create hera_transactions_crud_v2 - NEW ARCHITECTURE
-- Uses the existing hera_transactions_aggregate_v2 and other v2 functions

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
  v_lines jsonb;
  v_payload jsonb;
BEGIN
  -- Validate required parameters
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='ACTOR_USER_ID_REQUIRED';
  END IF;
  
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='ORGANIZATION_ID_REQUIRED';
  END IF;
  
  -- Enforce actor requirement
  PERFORM enforce_actor_requirement(p_actor_user_id, p_organization_id, 'hera_transactions_crud_v2');
  
  -- Handle different actions using the new v2 architecture
  IF v_action = 'CREATE' THEN
    -- Build header with required fields
    v_header := p_transaction || jsonb_build_object(
      'organization_id', p_organization_id,
      'transaction_status', COALESCE(p_transaction->>'transaction_status', 'pending'),
      'transaction_date', COALESCE(p_transaction->>'transaction_date', now()::text),
      'transaction_code', COALESCE(p_transaction->>'transaction_code', 'TXN-' || extract(epoch from now())::bigint)
    );
    
    -- Use the existing hera_transactions_aggregate_v2 function
    SELECT hera_transactions_aggregate_v2(
      p_organization_id  := p_organization_id,
      p_actor_user_id    := p_actor_user_id,
      p_action           := 'MERGE',
      p_header           := v_header,
      p_lines            := p_lines,
      p_allocations      := '[]'::jsonb,
      p_attachments      := '[]'::jsonb,
      p_options          := p_options
    ) INTO v_result;
    
    RETURN v_result;
    
  ELSIF v_action = 'READ' THEN
    -- Extract parameters for read
    v_transaction_id := NULLIF(p_transaction->>'transaction_id', '')::uuid;
    
    -- Use the existing hera_transactions_read_v2 function
    SELECT hera_transactions_read_v2(
      p_organization_id      := p_organization_id,
      p_actor_user_id        := p_actor_user_id,
      p_transaction_id       := v_transaction_id,
      p_transaction_code     := NULLIF(p_transaction->>'transaction_code', ''),
      p_smart_code           := NULLIF(p_transaction->>'smart_code', ''),
      p_after_id             := NULLIF(p_options->>'after_id', '')::uuid,
      p_limit                := COALESCE((p_options->>'limit')::int, 50),
      p_include_lines        := COALESCE((p_options->>'include_lines')::boolean, true),
      p_include_audit_fields := COALESCE((p_options->>'include_audit_fields')::boolean, false)
    ) INTO v_result;
    
    RETURN v_result;
    
  ELSIF v_action = 'UPDATE' THEN
    -- Build header for update
    v_header := p_transaction || jsonb_build_object(
      'organization_id', p_organization_id
    );
    
    -- Use hera_transactions_aggregate_v2 for update (MERGE action)
    SELECT hera_transactions_aggregate_v2(
      p_organization_id  := p_organization_id,
      p_actor_user_id    := p_actor_user_id,
      p_action           := 'MERGE',
      p_header           := v_header,
      p_lines            := p_lines,
      p_allocations      := '[]'::jsonb,
      p_attachments      := '[]'::jsonb,
      p_options          := p_options
    ) INTO v_result;
    
    RETURN v_result;
    
  ELSIF v_action = 'DELETE' THEN
    v_transaction_id := NULLIF(p_transaction->>'transaction_id', '')::uuid;
    
    IF v_transaction_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='TRANSACTION_ID_REQUIRED_FOR_DELETE';
    END IF;
    
    -- Soft delete by updating status
    UPDATE universal_transactions
    SET transaction_status = 'deleted',
        updated_by = p_actor_user_id,
        updated_at = now()
    WHERE id = v_transaction_id
      AND organization_id = p_organization_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='TRANSACTION_NOT_FOUND';
    END IF;
    
    RETURN jsonb_build_object(
      'success', true,
      'action', v_action,
      'transaction_id', v_transaction_id,
      'message', 'Transaction deleted successfully'
    );
    
  ELSIF v_action = 'APPROVE' THEN
    v_transaction_id := NULLIF(p_transaction->>'transaction_id', '')::uuid;
    
    IF v_transaction_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='TRANSACTION_ID_REQUIRED_FOR_APPROVE';
    END IF;
    
    -- Update status to approved
    UPDATE universal_transactions
    SET transaction_status = 'approved',
        updated_by = p_actor_user_id,
        updated_at = now()
    WHERE id = v_transaction_id
      AND organization_id = p_organization_id
      AND transaction_status = 'pending';
    
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE='P0003', MESSAGE='ONLY_PENDING_CAN_BE_APPROVED';
    END IF;
    
    -- Return updated transaction
    RETURN hera_transactions_crud_v2('READ', p_actor_user_id, p_organization_id, 
                                   jsonb_build_object('transaction_id', v_transaction_id),
                                   '[]'::jsonb, '{}'::jsonb, '[]'::jsonb,
                                   jsonb_build_object('include_lines', true));
    
  ELSIF v_action = 'POST' THEN
    v_transaction_id := NULLIF(p_transaction->>'transaction_id', '')::uuid;
    
    IF v_transaction_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='TRANSACTION_ID_REQUIRED_FOR_POST';
    END IF;
    
    -- Use the existing hera_transaction_post_v2 function
    PERFORM hera_transaction_post_v2(
      p_organization_id, 
      p_actor_user_id, 
      v_transaction_id, 
      NULL, 
      COALESCE((p_options->>'validate_only')::boolean, false)
    );
    
    -- Return updated transaction
    RETURN hera_transactions_crud_v2('READ', p_actor_user_id, p_organization_id, 
                                   jsonb_build_object('transaction_id', v_transaction_id),
                                   '[]'::jsonb, '{}'::jsonb, '[]'::jsonb,
                                   jsonb_build_object('include_lines', true));
    
  ELSE
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE=format('UNKNOWN_ACTION_%s', v_action);
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION hera_transactions_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_transactions_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb) TO service_role;

-- Add documentation
COMMENT ON FUNCTION hera_transactions_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb) IS 
'HERA Transactions CRUD v2 - NEW ARCHITECTURE using existing v2 functions.
Uses hera_transactions_aggregate_v2, hera_transactions_read_v2, hera_transaction_post_v2.
Actions: CREATE, READ, UPDATE, DELETE, APPROVE, POST
Compatible with hera_entities_crud_v2 parameter structure.';