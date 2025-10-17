-- CORRECTED hera_transactions_crud_v2 with ACTUAL schema field names
-- Based on actual YAML schema files in /docs/schema/

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
  v_line_record jsonb;
  v_line_count integer := 0;
  v_inserted_id uuid;
  v_line_id uuid;
BEGIN
  -- ENHANCED: System-aware security validation
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='ACTOR_USER_ID_REQUIRED';
  END IF;

  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='ORGANIZATION_ID_REQUIRED';
  END IF;

  -- ENHANCED: Block NULL UUID attacks
  IF p_actor_user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION USING
      ERRCODE='42501',
      MESSAGE='INVALID_ACTOR_NULL_UUID',
      DETAIL='Actor cannot be null UUID for security reasons';
  END IF;

  -- ENHANCED: Block platform organization for business operations
  IF p_organization_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION USING
      ERRCODE='42501',
      MESSAGE='BUSINESS_OPERATIONS_NOT_ALLOWED_IN_PLATFORM_ORG',
      DETAIL='Business transactions cannot be performed in platform organization';
  END IF;

  -- ENHANCED: Validate actor entity exists and is USER type
  IF NOT EXISTS (
    SELECT 1 FROM core_entities e
    WHERE e.id = p_actor_user_id
      AND e.entity_type = 'USER'
      AND e.organization_id IN (
        '00000000-0000-0000-0000-000000000000'::uuid,
        p_organization_id
      )
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE='42501',
      MESSAGE='ACTOR_ENTITY_NOT_FOUND',
      DETAIL=format('Actor %s is not a valid USER entity', p_actor_user_id);
  END IF;

  -- ENHANCED: Validate organization entity exists
  IF NOT EXISTS (
    SELECT 1 FROM core_entities e
    WHERE e.id = p_organization_id
      AND e.entity_type IN ('ORG', 'ORGANIZATION')
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE='42501',
      MESSAGE='ORGANIZATION_ENTITY_NOT_FOUND',
      DETAIL=format('Organization entity %s does not exist', p_organization_id);
  END IF;

  -- ENHANCED: Validate membership relationship using CORRECT field names
  IF NOT EXISTS (
    SELECT 1 FROM core_relationships r
    WHERE r.from_entity_id = p_actor_user_id  -- CORRECTED: from_entity_id not source_entity_id
      AND r.to_entity_id = p_organization_id  -- CORRECTED: to_entity_id not target_entity_id
      AND r.relationship_type IN ('MEMBER_OF', 'USER_MEMBER_OF_ORG')
      AND r.is_active = true
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE='42501',
      MESSAGE='ACTOR_NOT_MEMBER_OF_ORGANIZATION',
      DETAIL=format('Actor %s is not a member of organization %s', p_actor_user_id, p_organization_id);
  END IF;

  -- Security validation passed - proceed with action
  IF v_action = 'CREATE' THEN
    -- Build header from p_transaction with CORRECT field names
    v_header := p_transaction || jsonb_build_object(
      'organization_id', p_organization_id,
      'transaction_status', COALESCE(p_transaction->>'transaction_status', 'pending'),
      'transaction_date', COALESCE(p_transaction->>'transaction_date', now()::text),
      'transaction_code', COALESCE(p_transaction->>'transaction_code', 'TXN-' || extract(epoch from now())::bigint), -- CORRECTED: transaction_code not transaction_number
      'smart_code', COALESCE(p_transaction->>'smart_code', 'HERA.UNIVERSAL.TXN.DEFAULT.V1')
    );

    -- Insert transaction header using CORRECT field names
    INSERT INTO universal_transactions (
      organization_id,
      transaction_type,
      transaction_code,  -- CORRECTED: actual field name
      transaction_date,
      source_entity_id,  -- CORRECTED: actual field name in transactions table
      target_entity_id,  -- CORRECTED: actual field name in transactions table
      total_amount,
      transaction_status,
      smart_code,
      created_by,
      updated_by,
      created_at,
      updated_at
    ) VALUES (
      p_organization_id,
      v_header->>'transaction_type',
      v_header->>'transaction_code',
      COALESCE((v_header->>'transaction_date')::timestamp with time zone, now()),
      NULLIF(v_header->>'source_entity_id', '')::uuid,
      NULLIF(v_header->>'target_entity_id', '')::uuid,
      COALESCE((v_header->>'total_amount')::numeric, 0),
      v_header->>'transaction_status',
      v_header->>'smart_code',
      p_actor_user_id,
      p_actor_user_id,
      now(),
      now()
    ) RETURNING id INTO v_inserted_id;

    -- Insert transaction lines if provided
    IF p_lines IS NOT NULL AND jsonb_array_length(p_lines) > 0 THEN
      FOR v_line_count IN 0..jsonb_array_length(p_lines) - 1 LOOP
        v_line_record := p_lines->v_line_count;

        INSERT INTO universal_transaction_lines (
          transaction_id,
          organization_id,
          entity_id,  -- CORRECTED: actual field name not line_entity_id
          line_type,  -- REQUIRED: must include line_type
          description,
          line_number,  -- CORRECTED: actual field name from schema
          quantity,
          unit_amount,
          line_amount,
          smart_code,
          line_data,
          created_by,
          updated_by,
          created_at,
          updated_at
        ) VALUES (
          v_inserted_id,
          p_organization_id,
          NULLIF(v_line_record->>'entity_id', '')::uuid,
          COALESCE(v_line_record->>'line_type', 'DEFAULT'),  -- REQUIRED: provide line_type
          v_line_record->>'description',
          COALESCE((v_line_record->>'line_number')::integer, v_line_count + 1),
          COALESCE((v_line_record->>'quantity')::numeric, 1),
          COALESCE((v_line_record->>'unit_amount')::numeric, 0),
          COALESCE((v_line_record->>'line_amount')::numeric, 0),
          COALESCE(v_line_record->>'smart_code', 'HERA.UNIVERSAL.LINE.DEFAULT.V1'),
          COALESCE(v_line_record->'line_data', '{}'::jsonb),
          p_actor_user_id,
          p_actor_user_id,
          now(),
          now()
        );
      END LOOP;
    END IF;

    -- Return created transaction in CRUD format
    RETURN hera_transactions_crud_v2('READ', p_actor_user_id, p_organization_id,
                                   jsonb_build_object('transaction_id', v_inserted_id),
                                   '[]'::jsonb, '{}'::jsonb, '[]'::jsonb,
                                   jsonb_build_object('include_lines', true));

  ELSIF v_action = 'READ' THEN
    -- Extract transaction_id if provided
    v_transaction_id := NULLIF(p_transaction->>'transaction_id', '')::uuid;

    IF v_transaction_id IS NOT NULL THEN
      -- Read specific transaction using CORRECT field names
      SELECT jsonb_build_object(
        'id', t.id,
        'transaction_type', t.transaction_type,
        'transaction_code', t.transaction_code,  -- CORRECTED: actual field name
        'smart_code', t.smart_code,
        'source_entity_id', t.source_entity_id,  -- CORRECTED: actual field name
        'target_entity_id', t.target_entity_id,  -- CORRECTED: actual field name
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
              'line_number', l.line_number,  -- CORRECTED: actual field name
              'line_type', l.line_type,      -- REQUIRED: include line_type
              'description', l.description,
              'entity_id', l.entity_id,    -- CORRECTED: actual field name
              'quantity', l.quantity,
              'unit_amount', l.unit_amount,
              'line_amount', l.line_amount,
              'smart_code', l.smart_code,
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
            'transaction_code', t.transaction_code,  -- CORRECTED: actual field name
            'smart_code', t.smart_code,
            'source_entity_id', t.source_entity_id,  -- CORRECTED: actual field name
            'target_entity_id', t.target_entity_id,  -- CORRECTED: actual field name
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

    -- Update transaction fields using CORRECT field names
    UPDATE universal_transactions
    SET transaction_status = COALESCE(p_transaction->>'transaction_status', transaction_status),
        total_amount = COALESCE((p_transaction->>'total_amount')::numeric, total_amount),
        transaction_code = COALESCE(p_transaction->>'transaction_code', transaction_code),
        updated_by = p_actor_user_id,
        updated_at = now()
    WHERE id = v_transaction_id
      AND organization_id = p_organization_id;

    -- Return updated transaction
    RETURN hera_transactions_crud_v2('READ', p_actor_user_id, p_organization_id,
                                   jsonb_build_object('transaction_id', v_transaction_id),
                                   '[]'::jsonb, '{}'::jsonb, '[]'::jsonb,
                                   jsonb_build_object('include_lines', true));

  ELSIF v_action = 'DELETE' THEN
    v_transaction_id := NULLIF(p_transaction->>'transaction_id', '')::uuid;

    IF v_transaction_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='TRANSACTION_ID_REQUIRED_FOR_DELETE';
    END IF;

    -- Soft delete by setting status to 'deleted'
    UPDATE universal_transactions
    SET transaction_status = 'voided',  -- Use actual enum value from schema
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

-- Add comprehensive documentation
COMMENT ON FUNCTION hera_transactions_crud_v2(text, uuid, uuid, jsonb, jsonb, jsonb, jsonb, jsonb) IS
'HERA Transactions CRUD v2.3 - CORRECTED with actual schema field names
Complete transaction management with enhanced system-aware security.

SCHEMA CORRECTIONS APPLIED:
- core_relationships: from_entity_id/to_entity_id (not source_entity_id/target_entity_id)
- universal_transactions: transaction_code (not transaction_number)
- universal_transaction_lines: entity_id (not line_entity_id), line_number (actual field name)

ENHANCED SECURITY FEATURES:
- System-aware platform organization handling
- Comprehensive actor validation
- Organization isolation enforcement
- Invalid actor detection and blocking
- Cross-organization access prevention
- NULL UUID attack prevention

ACTIONS: CREATE, READ, UPDATE, DELETE
Compatible with hera_entities_crud_v2 parameter structure.';

SELECT 'CORRECTED hera_transactions_crud_v2 deployed with actual schema field names' as status;
