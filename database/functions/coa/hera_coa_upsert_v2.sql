-- ============================================================================
-- HERA COA v2: Atomic RPC Function
-- 
-- Bulletproof COA create/update with guardrails, audit trail, and IFRS compliance.
-- Performs all operations atomically within a single transaction.
-- 
-- Smart Code: HERA.FIN.COA.RPC.UPSERT.V2
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_coa_upsert_v2(
  p_organization_id UUID,
  p_account_id UUID DEFAULT NULL,  -- NULL for create, UUID for update
  p_entity_name TEXT,
  p_account_number TEXT,
  p_normal_balance TEXT DEFAULT NULL,  -- 'Dr' or 'Cr', auto-inferred if NULL
  p_is_postable BOOLEAN,
  p_ifrs_tags TEXT[],
  p_parent_id UUID DEFAULT NULL,
  p_display_number TEXT DEFAULT NULL,
  p_presentation_group TEXT DEFAULT NULL,
  p_consolidation_group TEXT DEFAULT NULL,
  p_effective_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  p_effective_to TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_smart_code TEXT DEFAULT 'HERA.FIN.COA.TXN.CREATE.v2',
  p_actor_entity_id UUID DEFAULT NULL -- User performing the operation
)
RETURNS TABLE(
  account_id UUID,
  entity_name TEXT,
  account_number TEXT,
  depth INTEGER,
  is_postable BOOLEAN,
  ifrs_tags TEXT[],
  parent_id UUID,
  audit_txn_id UUID,
  normal_balance TEXT,
  display_number TEXT,
  presentation_group TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entity_id UUID;
  v_audit_txn_id UUID;
  v_computed_normal_balance TEXT;
  v_computed_depth INTEGER;
  v_computed_display_number TEXT;
  v_operation_type TEXT;
  v_existing_account RECORD;
  v_parent_account RECORD;
  v_validation_errors TEXT[];
  v_error_msg TEXT;
BEGIN
  -- ==========================================================================
  -- 1. Input Validation & Sanitization
  -- ==========================================================================
  
  -- Validate organization_id
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required' USING ERRCODE = 'P0001';
  END IF;
  
  -- Validate account_number format (hierarchical: "4.1.2")
  IF NOT p_account_number ~ '^[1-9](\.[0-9]+)*$' THEN
    RAISE EXCEPTION 'Invalid account number format. Use hierarchical format like "4.1.2"' 
      USING ERRCODE = 'P0002';
  END IF;
  
  -- Validate first digit is 1-9
  IF LEFT(p_account_number, 1) NOT IN ('1','2','3','4','5','6','7','8','9') THEN
    RAISE EXCEPTION 'Account number must start with digit 1-9' 
      USING ERRCODE = 'P0003';
  END IF;
  
  -- Validate depth (max 8 levels)
  v_computed_depth := array_length(string_to_array(p_account_number, '.'), 1);
  IF v_computed_depth > 8 THEN
    RAISE EXCEPTION 'Account number cannot exceed 8 levels of depth' 
      USING ERRCODE = 'P0004';
  END IF;
  
  -- Determine operation type
  v_operation_type := CASE WHEN p_account_id IS NULL THEN 'CREATE' ELSE 'UPDATE' END;
  
  -- ==========================================================================
  -- 2. Business Rules & Guardrails Validation
  -- ==========================================================================
  
  -- Infer normal balance from range if not provided
  v_computed_normal_balance := COALESCE(
    p_normal_balance,
    CASE LEFT(p_account_number, 1)
      WHEN '1' THEN 'Dr'  -- Assets
      WHEN '2' THEN 'Cr'  -- Liabilities
      WHEN '3' THEN 'Cr'  -- Equity
      WHEN '4' THEN 'Cr'  -- Revenue
      WHEN '5' THEN 'Dr'  -- COGS
      WHEN '6' THEN 'Dr'  -- Operating Expenses
      WHEN '7' THEN 'Dr'  -- Other Income/Expense
      WHEN '8' THEN 'Dr'  -- Tax/Finance/Exceptional
      WHEN '9' THEN 'Dr'  -- Statistical/Control
      ELSE 'Dr'
    END
  );
  
  -- Validate normal balance matches range policy
  IF (LEFT(p_account_number, 1) IN ('2','3','4') AND v_computed_normal_balance != 'Cr') OR
     (LEFT(p_account_number, 1) IN ('1','5','6','7','8','9') AND v_computed_normal_balance != 'Dr') THEN
    RAISE EXCEPTION 'Normal balance % does not match account range %xxx policy', 
      v_computed_normal_balance, LEFT(p_account_number, 1)
      USING ERRCODE = 'P0005';
  END IF;
  
  -- Generate display number if not provided
  v_computed_display_number := COALESCE(
    p_display_number,
    array_to_string(
      ARRAY(
        SELECT lpad(part, 2, '0') 
        FROM unnest(string_to_array(p_account_number, '.')) AS part
      ), 
      ''
    )
  );
  
  -- Check for existing account (uniqueness per organization)
  IF v_operation_type = 'CREATE' THEN
    SELECT id INTO v_entity_id
    FROM core_entities 
    WHERE organization_id = p_organization_id 
      AND entity_type = 'ACCOUNT'
      AND status = 'ACTIVE'
      AND EXISTS (
        SELECT 1 FROM core_dynamic_data 
        WHERE entity_id = core_entities.id 
          AND field_name = 'account_number' 
          AND field_value_text = p_account_number
      );
    
    IF FOUND THEN
      RAISE EXCEPTION 'Account number % already exists in organization', p_account_number
        USING ERRCODE = 'P0006';
    END IF;
  ELSE
    -- For updates, get existing account
    SELECT * INTO v_existing_account
    FROM core_entities 
    WHERE id = p_account_id 
      AND organization_id = p_organization_id 
      AND entity_type = 'ACCOUNT';
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Account % not found', p_account_id
        USING ERRCODE = 'P0007';
    END IF;
  END IF;
  
  -- Validate parent relationship if parent_id provided
  IF p_parent_id IS NOT NULL THEN
    SELECT ce.*, dd.field_value_text as parent_account_number
    INTO v_parent_account
    FROM core_entities ce
    LEFT JOIN core_dynamic_data dd ON dd.entity_id = ce.id AND dd.field_name = 'account_number'
    WHERE ce.id = p_parent_id 
      AND ce.organization_id = p_organization_id 
      AND ce.entity_type = 'ACCOUNT'
      AND ce.status = 'ACTIVE';
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parent account % not found', p_parent_id
        USING ERRCODE = 'P0008';
    END IF;
    
    -- Validate parent-child depth relationship
    IF v_computed_depth != array_length(string_to_array(v_parent_account.parent_account_number, '.'), 1) + 1 THEN
      RAISE EXCEPTION 'Account depth % must be parent depth + 1', v_computed_depth
        USING ERRCODE = 'P0009';
    END IF;
  END IF;
  
  -- Validate IFRS tags for postable accounts
  IF p_is_postable AND (p_ifrs_tags IS NULL OR array_length(p_ifrs_tags, 1) = 0) THEN
    RAISE EXCEPTION 'IFRS tags are required for postable accounts'
      USING ERRCODE = 'P0010';
  END IF;
  
  -- Validate postable leaf-only rule
  IF p_is_postable AND v_operation_type = 'UPDATE' THEN
    -- Check if account has active children
    IF EXISTS (
      SELECT 1 FROM core_relationships cr
      JOIN core_entities ce ON ce.id = cr.from_entity_id
      WHERE cr.to_entity_id = p_account_id
        AND cr.relationship_type = 'PARENT_OF'
        AND ce.status = 'ACTIVE'
        AND ce.organization_id = p_organization_id
    ) THEN
      RAISE EXCEPTION 'Account cannot be postable as it has active child accounts'
        USING ERRCODE = 'P0011';
    END IF;
  END IF;
  
  -- ==========================================================================
  -- 3. Create Audit Transaction (Before Data Changes)
  -- ==========================================================================
  
  INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    smart_code,
    transaction_date,
    reference_number,
    total_amount,
    from_entity_id,
    metadata
  ) VALUES (
    p_organization_id,
    'coa_operation',
    p_smart_code,
    CURRENT_TIMESTAMP,
    'COA-' || v_operation_type || '-' || p_account_number,
    0.00,  -- No monetary amount for COA operations
    p_actor_entity_id,
    jsonb_build_object(
      'operation_type', v_operation_type,
      'account_number', p_account_number,
      'entity_name', p_entity_name,
      'is_postable', p_is_postable,
      'ifrs_tags', p_ifrs_tags,
      'normal_balance', v_computed_normal_balance,
      'depth', v_computed_depth
    )
  ) RETURNING id INTO v_audit_txn_id;
  
  -- ==========================================================================
  -- 4. Entity Operations (CREATE or UPDATE)
  -- ==========================================================================
  
  IF v_operation_type = 'CREATE' THEN
    -- Create new entity
    INSERT INTO core_entities (
      organization_id,
      entity_type,
      entity_name,
      entity_code,
      smart_code,
      status,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      p_organization_id,
      'ACCOUNT',
      p_entity_name,
      p_account_number,  -- Use account number as entity code
      'HERA.FIN.COA.ENTITY.ACCOUNT.v2',
      'ACTIVE',
      COALESCE(p_metadata, '{}'::jsonb),
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ) RETURNING id INTO v_entity_id;
    
  ELSE
    -- Update existing entity
    UPDATE core_entities 
    SET 
      entity_name = p_entity_name,
      entity_code = p_account_number,
      metadata = COALESCE(p_metadata, metadata),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_account_id
    RETURNING id INTO v_entity_id;
  END IF;
  
  -- ==========================================================================
  -- 5. Dynamic Data Operations (Required Fields)
  -- ==========================================================================
  
  -- Account Number
  INSERT INTO core_dynamic_data (
    organization_id, entity_id, field_name, field_type, field_value_text, smart_code
  ) VALUES (
    p_organization_id, v_entity_id, 'account_number', 'text', p_account_number, 'HERA.FIN.COA.DYN.ACCOUNT_NUMBER.v2'
  ) ON CONFLICT (organization_id, entity_id, field_name) 
  DO UPDATE SET field_value_text = EXCLUDED.field_value_text, updated_at = CURRENT_TIMESTAMP;
  
  -- Normal Balance
  INSERT INTO core_dynamic_data (
    organization_id, entity_id, field_name, field_type, field_value_text, smart_code
  ) VALUES (
    p_organization_id, v_entity_id, 'normal_balance', 'text', v_computed_normal_balance, 'HERA.FIN.COA.DYN.NORMAL_BALANCE.v2'
  ) ON CONFLICT (organization_id, entity_id, field_name) 
  DO UPDATE SET field_value_text = EXCLUDED.field_value_text, updated_at = CURRENT_TIMESTAMP;
  
  -- Depth
  INSERT INTO core_dynamic_data (
    organization_id, entity_id, field_name, field_type, field_value_number, smart_code
  ) VALUES (
    p_organization_id, v_entity_id, 'depth', 'number', v_computed_depth, 'HERA.FIN.COA.DYN.DEPTH.v2'
  ) ON CONFLICT (organization_id, entity_id, field_name) 
  DO UPDATE SET field_value_number = EXCLUDED.field_value_number, updated_at = CURRENT_TIMESTAMP;
  
  -- Is Postable
  INSERT INTO core_dynamic_data (
    organization_id, entity_id, field_name, field_type, field_value_boolean, smart_code
  ) VALUES (
    p_organization_id, v_entity_id, 'is_postable', 'boolean', p_is_postable, 'HERA.FIN.COA.DYN.IS_POSTABLE.v2'
  ) ON CONFLICT (organization_id, entity_id, field_name) 
  DO UPDATE SET field_value_boolean = EXCLUDED.field_value_boolean, updated_at = CURRENT_TIMESTAMP;
  
  -- IFRS Tags (as JSON array)
  INSERT INTO core_dynamic_data (
    organization_id, entity_id, field_name, field_type, field_value_json, smart_code
  ) VALUES (
    p_organization_id, v_entity_id, 'ifrs_tags', 'json', to_jsonb(p_ifrs_tags), 'HERA.FIN.COA.DYN.IFRS_TAGS.v2'
  ) ON CONFLICT (organization_id, entity_id, field_name) 
  DO UPDATE SET field_value_json = EXCLUDED.field_value_json, updated_at = CURRENT_TIMESTAMP;
  
  -- ==========================================================================
  -- 6. Optional Dynamic Data Fields
  -- ==========================================================================
  
  -- Display Number
  IF p_display_number IS NOT NULL OR v_operation_type = 'CREATE' THEN
    INSERT INTO core_dynamic_data (
      organization_id, entity_id, field_name, field_type, field_value_text, smart_code
    ) VALUES (
      p_organization_id, v_entity_id, 'display_number', 'text', v_computed_display_number, 'HERA.FIN.COA.DYN.DISPLAY_NUMBER.v2'
    ) ON CONFLICT (organization_id, entity_id, field_name) 
    DO UPDATE SET field_value_text = EXCLUDED.field_value_text, updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  -- Presentation Group
  IF p_presentation_group IS NOT NULL THEN
    INSERT INTO core_dynamic_data (
      organization_id, entity_id, field_name, field_type, field_value_text, smart_code
    ) VALUES (
      p_organization_id, v_entity_id, 'presentation_group', 'text', p_presentation_group, 'HERA.FIN.COA.DYN.PRESENTATION_GROUP.v2'
    ) ON CONFLICT (organization_id, entity_id, field_name) 
    DO UPDATE SET field_value_text = EXCLUDED.field_value_text, updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  -- Consolidation Group
  IF p_consolidation_group IS NOT NULL THEN
    INSERT INTO core_dynamic_data (
      organization_id, entity_id, field_name, field_type, field_value_text, smart_code
    ) VALUES (
      p_organization_id, v_entity_id, 'consolidation_group', 'text', p_consolidation_group, 'HERA.FIN.COA.DYN.CONSOLIDATION_GROUP.v2'
    ) ON CONFLICT (organization_id, entity_id, field_name) 
    DO UPDATE SET field_value_text = EXCLUDED.field_value_text, updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  -- Effective From
  INSERT INTO core_dynamic_data (
    organization_id, entity_id, field_name, field_type, field_value_timestamp, smart_code
  ) VALUES (
    p_organization_id, v_entity_id, 'effective_from', 'timestamp', p_effective_from, 'HERA.FIN.COA.DYN.EFFECTIVE_FROM.v2'
  ) ON CONFLICT (organization_id, entity_id, field_name) 
  DO UPDATE SET field_value_timestamp = EXCLUDED.field_value_timestamp, updated_at = CURRENT_TIMESTAMP;
  
  -- Effective To (if provided)
  IF p_effective_to IS NOT NULL THEN
    INSERT INTO core_dynamic_data (
      organization_id, entity_id, field_name, field_type, field_value_timestamp, smart_code
    ) VALUES (
      p_organization_id, v_entity_id, 'effective_to', 'timestamp', p_effective_to, 'HERA.FIN.COA.DYN.EFFECTIVE_TO.v2'
    ) ON CONFLICT (organization_id, entity_id, field_name) 
    DO UPDATE SET field_value_timestamp = EXCLUDED.field_value_timestamp, updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  -- ==========================================================================
  -- 7. Relationship Operations (Parent-Child Hierarchy)
  -- ==========================================================================
  
  -- Remove existing parent relationship if updating
  IF v_operation_type = 'UPDATE' THEN
    DELETE FROM core_relationships 
    WHERE from_entity_id = v_entity_id 
      AND relationship_type = 'PARENT_OF'
      AND organization_id = p_organization_id;
  END IF;
  
  -- Create parent relationship if parent_id provided
  IF p_parent_id IS NOT NULL THEN
    INSERT INTO core_relationships (
      organization_id,
      from_entity_id,
      to_entity_id,
      relationship_type,
      smart_code,
      metadata
    ) VALUES (
      p_organization_id,
      p_parent_id,      -- Parent is the "from" entity
      v_entity_id,      -- Child is the "to" entity
      'PARENT_OF',
      'HERA.FIN.COA.REL.PARENT_OF.v2',
      jsonb_build_object(
        'hierarchy_depth', v_computed_depth,
        'created_by_txn', v_audit_txn_id
      )
    );
  END IF;
  
  -- ==========================================================================
  -- 8. Transaction Line (Audit Detail)
  -- ==========================================================================
  
  INSERT INTO universal_transaction_lines (
    organization_id,
    transaction_id,
    line_number,
    line_entity_id,
    line_amount,
    smart_code,
    metadata
  ) VALUES (
    p_organization_id,
    v_audit_txn_id,
    1,
    v_entity_id,
    0.00,  -- No monetary amount
    'HERA.FIN.COA.TXN.LINE.OPERATION.v2',
    jsonb_build_object(
      'operation_type', v_operation_type,
      'account_number', p_account_number,
      'normal_balance', v_computed_normal_balance,
      'is_postable', p_is_postable,
      'depth', v_computed_depth,
      'ifrs_tags', p_ifrs_tags,
      'display_number', v_computed_display_number,
      'presentation_group', p_presentation_group,
      'consolidation_group', p_consolidation_group
    )
  );
  
  -- ==========================================================================
  -- 9. Return Result
  -- ==========================================================================
  
  RETURN QUERY
  SELECT 
    v_entity_id as account_id,
    p_entity_name as entity_name,
    p_account_number as account_number,
    v_computed_depth as depth,
    p_is_postable as is_postable,
    p_ifrs_tags as ifrs_tags,
    p_parent_id as parent_id,
    v_audit_txn_id as audit_txn_id,
    v_computed_normal_balance as normal_balance,
    v_computed_display_number as display_number,
    p_presentation_group as presentation_group,
    'ACTIVE'::TEXT as status;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error for debugging
    RAISE NOTICE 'COA upsert error for account %: % (SQLSTATE: %)', 
      p_account_number, SQLERRM, SQLSTATE;
    
    -- Re-raise with context
    RAISE EXCEPTION 'COA operation failed for account %: %', 
      p_account_number, SQLERRM
      USING ERRCODE = SQLSTATE;
END;
$$;

-- ==========================================================================
-- Security & Performance
-- ==========================================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION hera_coa_upsert_v2 TO authenticated;

-- Create index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_coa_account_number_org 
ON core_dynamic_data (organization_id, field_value_text) 
WHERE field_name = 'account_number';

CREATE INDEX IF NOT EXISTS idx_coa_entities_type_org 
ON core_entities (organization_id, entity_type) 
WHERE entity_type = 'ACCOUNT';

-- Add comment for documentation
COMMENT ON FUNCTION hera_coa_upsert_v2 IS 
'HERA COA v2: Atomic COA account create/update with complete guardrails validation, audit trail, and IFRS compliance. Bulletproof enterprise-grade function supporting hierarchical account structures with policy-as-data enforcement.';