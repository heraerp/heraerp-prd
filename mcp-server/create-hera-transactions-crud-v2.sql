-- Create hera_transactions_crud_v2 - Complete CRUD function for transactions
-- This is the new architecture with proper actor stamping and organization isolation

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
  -- Validate required parameters
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='ACTOR_USER_ID_REQUIRED';
  END IF;
  
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='ORGANIZATION_ID_REQUIRED';
  END IF;
  
  -- Enforce actor requirement (using our deployed function)
  PERFORM enforce_actor_requirement(p_actor_user_id, p_organization_id, 'hera_transactions_crud_v2');
  
  -- Handle different actions
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION hera_transactions_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_transactions_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb) TO service_role;

-- Add documentation
COMMENT ON FUNCTION hera_transactions_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb) IS 
'HERA Transactions CRUD v2 - Complete transaction management with actor stamping and organization isolation.
Actions: CREATE, READ, UPDATE, DELETE
Compatible with hera_entities_crud_v2 parameter structure for consistency.';