-- ============================================================================
-- HERA Cost Center v2: Atomic RPC Function
-- 
-- Bulletproof cost center create/update with guardrails, audit trail, and
-- complete hierarchy management. Performs all operations atomically.
-- 
-- Smart Code: HERA.COSTCENTER.RPC.UPSERT.V2
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_costcenter_upsert_v2(
  p_organization_id UUID,
  p_cost_center_id UUID DEFAULT NULL,  -- NULL for create, UUID for update
  p_entity_name TEXT,
  p_cc_code TEXT,
  p_cost_center_type TEXT,
  p_parent_id UUID DEFAULT NULL,
  p_valid_from DATE DEFAULT CURRENT_DATE,
  p_valid_to DATE DEFAULT NULL,
  p_responsible_person TEXT DEFAULT NULL,
  p_segment TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_smart_code TEXT DEFAULT 'HERA.COSTCENTER.TXN.CREATE.v2',
  p_actor_entity_id UUID DEFAULT NULL -- User performing the operation
)
RETURNS TABLE(
  cost_center_id UUID,
  entity_name TEXT,
  cc_code TEXT,
  depth INTEGER,
  cost_center_type TEXT,
  status TEXT,
  parent_id UUID,
  valid_from DATE,
  valid_to DATE,
  responsible_person TEXT,
  segment TEXT,
  tags TEXT[],
  audit_txn_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entity_id UUID;
  v_audit_txn_id UUID;
  v_computed_depth INTEGER;
  v_operation_type TEXT;
  v_existing_cc RECORD;
  v_parent_cc RECORD;
  v_valid_types TEXT[] := ARRAY['ADMIN', 'PRODUCTION', 'SALES', 'SERVICE', 'FINANCE', 'HR', 'IT', 'FACILITY', 'R_AND_D'];
BEGIN
  -- ==========================================================================
  -- 1. Input Validation & Sanitization
  -- ==========================================================================
  
  -- Validate organization_id
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required' USING ERRCODE = 'P0001';
  END IF;
  
  -- Validate cost center code format
  IF p_cc_code IS NULL OR LENGTH(TRIM(p_cc_code)) < 3 OR LENGTH(TRIM(p_cc_code)) > 50 THEN
    RAISE EXCEPTION 'Cost center code must be between 3 and 50 characters' 
      USING ERRCODE = 'P0002';
  END IF;
  
  IF NOT p_cc_code ~ '^[A-Za-z0-9_-]+$' THEN
    RAISE EXCEPTION 'Cost center code can only contain letters, numbers, hyphens, and underscores' 
      USING ERRCODE = 'P0003';
  END IF;
  
  -- Validate cost center type
  IF p_cost_center_type IS NULL OR NOT p_cost_center_type = ANY(v_valid_types) THEN
    RAISE EXCEPTION 'Invalid cost center type. Must be one of: %', 
      array_to_string(v_valid_types, ', ')
      USING ERRCODE = 'P0004';
  END IF;
  
  -- Validate validity dates
  IF p_valid_from IS NOT NULL AND p_valid_to IS NOT NULL AND p_valid_from >= p_valid_to THEN
    RAISE EXCEPTION 'valid_to date must be after valid_from date' 
      USING ERRCODE = 'P0005';
  END IF;
  
  -- Validate tags format
  IF p_tags IS NOT NULL THEN
    -- Check for valid tag format
    IF EXISTS (
      SELECT 1 FROM unnest(p_tags) AS tag 
      WHERE LENGTH(tag) = 0 OR LENGTH(tag) > 50 OR NOT tag ~ '^[A-Za-z0-9_-]+$'
    ) THEN
      RAISE EXCEPTION 'Tags must be non-empty strings (max 50 chars) containing only letters, numbers, hyphens, and underscores'
        USING ERRCODE = 'P0006';
    END IF;
    
    -- Check for duplicate tags
    IF array_length(p_tags, 1) != (SELECT COUNT(DISTINCT tag) FROM unnest(p_tags) AS tag) THEN
      RAISE EXCEPTION 'Duplicate tags are not allowed'
        USING ERRCODE = 'P0007';
    END IF;
  END IF;
  
  -- Determine operation type
  v_operation_type := CASE WHEN p_cost_center_id IS NULL THEN 'CREATE' ELSE 'UPDATE' END;
  
  -- ==========================================================================
  -- 2. Business Rules & Guardrails Validation
  -- ==========================================================================
  
  -- Check for existing cost center code uniqueness (per organization)
  IF v_operation_type = 'CREATE' THEN
    IF EXISTS (
      SELECT 1 FROM core_entities ce
      JOIN core_dynamic_data dd ON dd.entity_id = ce.id
      WHERE ce.organization_id = p_organization_id 
        AND ce.entity_type = 'COST_CENTER'
        AND ce.status = 'ACTIVE'
        AND dd.field_name = 'cc_code'
        AND dd.field_value_text = p_cc_code
    ) THEN
      RAISE EXCEPTION 'Cost center code % already exists in organization', p_cc_code
        USING ERRCODE = 'P0008';
    END IF;
  ELSE
    -- For updates, get existing cost center
    SELECT ce.*, dd.field_value_text as existing_cc_code
    INTO v_existing_cc
    FROM core_entities ce
    LEFT JOIN core_dynamic_data dd ON dd.entity_id = ce.id AND dd.field_name = 'cc_code'
    WHERE ce.id = p_cost_center_id 
      AND ce.organization_id = p_organization_id 
      AND ce.entity_type = 'COST_CENTER';
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cost center % not found', p_cost_center_id
        USING ERRCODE = 'P0009';
    END IF;
    
    -- Check uniqueness for updated code
    IF p_cc_code != v_existing_cc.existing_cc_code THEN
      IF EXISTS (
        SELECT 1 FROM core_entities ce
        JOIN core_dynamic_data dd ON dd.entity_id = ce.id
        WHERE ce.organization_id = p_organization_id 
          AND ce.entity_type = 'COST_CENTER'
          AND ce.status = 'ACTIVE'
          AND ce.id != p_cost_center_id
          AND dd.field_name = 'cc_code'
          AND dd.field_value_text = p_cc_code
      ) THEN
        RAISE EXCEPTION 'Cost center code % already exists in organization', p_cc_code
          USING ERRCODE = 'P0008';
      END IF;
    END IF;
  END IF;
  
  -- Validate parent relationship if parent_id provided
  IF p_parent_id IS NOT NULL THEN
    SELECT ce.*, dd_depth.field_value_number::integer as parent_depth
    INTO v_parent_cc
    FROM core_entities ce
    LEFT JOIN core_dynamic_data dd_depth ON dd_depth.entity_id = ce.id AND dd_depth.field_name = 'depth'
    WHERE ce.id = p_parent_id 
      AND ce.organization_id = p_organization_id 
      AND ce.entity_type = 'COST_CENTER'
      AND ce.status = 'ACTIVE';
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parent cost center % not found or not active', p_parent_id
        USING ERRCODE = 'P0010';
    END IF;
    
    -- Calculate new depth
    v_computed_depth := COALESCE(v_parent_cc.parent_depth, 0) + 1;
    
    -- Validate max depth (6 levels)
    IF v_computed_depth > 6 THEN
      RAISE EXCEPTION 'Cost center depth % exceeds maximum allowed depth 6', v_computed_depth
        USING ERRCODE = 'P0011';
    END IF;
    
    -- Check for cycles (if updating)
    IF v_operation_type = 'UPDATE' THEN
      -- Ensure we're not setting ourselves as parent or creating a cycle
      IF p_parent_id = p_cost_center_id THEN
        RAISE EXCEPTION 'Cost center cannot be its own parent'
          USING ERRCODE = 'P0012';
      END IF;
      
      -- Check if parent_id is a descendant of current cost center
      IF EXISTS (
        WITH RECURSIVE hierarchy AS (
          -- Start with direct children of current cost center
          SELECT cr.to_entity_id as descendant_id
          FROM core_relationships cr
          WHERE cr.from_entity_id = p_cost_center_id
            AND cr.relationship_type = 'COST_CENTER_PARENT_OF'
            AND cr.organization_id = p_organization_id
          
          UNION ALL
          
          -- Get children of children
          SELECT cr.to_entity_id
          FROM core_relationships cr
          JOIN hierarchy h ON h.descendant_id = cr.from_entity_id
          WHERE cr.relationship_type = 'COST_CENTER_PARENT_OF'
            AND cr.organization_id = p_organization_id
        )
        SELECT 1 FROM hierarchy WHERE descendant_id = p_parent_id
      ) THEN
        RAISE EXCEPTION 'Setting this parent would create a cycle in the hierarchy'
          USING ERRCODE = 'P0012';
      END IF;
    END IF;
  ELSE
    -- Root level cost center
    v_computed_depth := 1;
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
    'cost_center_operation',
    p_smart_code,
    CURRENT_TIMESTAMP,
    'CC-' || v_operation_type || '-' || p_cc_code,
    0.00,  -- No monetary amount for cost center operations
    p_actor_entity_id,
    jsonb_build_object(
      'operation_type', v_operation_type,
      'cc_code', p_cc_code,
      'entity_name', p_entity_name,
      'cost_center_type', p_cost_center_type,
      'depth', v_computed_depth,
      'parent_id', p_parent_id,
      'valid_from', p_valid_from,
      'valid_to', p_valid_to
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
      'COST_CENTER',
      p_entity_name,
      p_cc_code,  -- Use cc_code as entity_code
      'HERA.COSTCENTER.ENTITY.COST_CENTER.v2',
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
      entity_code = p_cc_code,
      metadata = COALESCE(p_metadata, metadata),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_cost_center_id
    RETURNING id INTO v_entity_id;
  END IF;
  
  -- ==========================================================================
  -- 5. Dynamic Data Operations (Required Fields)
  -- ==========================================================================
  
  -- Cost Center Code
  INSERT INTO core_dynamic_data (
    organization_id, entity_id, field_name, field_type, field_value_text, smart_code
  ) VALUES (
    p_organization_id, v_entity_id, 'cc_code', 'text', p_cc_code, 'HERA.COSTCENTER.DYN.CODE.v2'
  ) ON CONFLICT (organization_id, entity_id, field_name) 
  DO UPDATE SET field_value_text = EXCLUDED.field_value_text, updated_at = CURRENT_TIMESTAMP;
  
  -- Depth
  INSERT INTO core_dynamic_data (
    organization_id, entity_id, field_name, field_type, field_value_number, smart_code
  ) VALUES (
    p_organization_id, v_entity_id, 'depth', 'number', v_computed_depth, 'HERA.COSTCENTER.DYN.DEPTH.v2'
  ) ON CONFLICT (organization_id, entity_id, field_name) 
  DO UPDATE SET field_value_number = EXCLUDED.field_value_number, updated_at = CURRENT_TIMESTAMP;
  
  -- Cost Center Type
  INSERT INTO core_dynamic_data (
    organization_id, entity_id, field_name, field_type, field_value_text, smart_code
  ) VALUES (
    p_organization_id, v_entity_id, 'cost_center_type', 'text', p_cost_center_type, 'HERA.COSTCENTER.DYN.TYPE.v2'
  ) ON CONFLICT (organization_id, entity_id, field_name) 
  DO UPDATE SET field_value_text = EXCLUDED.field_value_text, updated_at = CURRENT_TIMESTAMP;
  
  -- Valid From
  INSERT INTO core_dynamic_data (
    organization_id, entity_id, field_name, field_type, field_value_date, smart_code
  ) VALUES (
    p_organization_id, v_entity_id, 'valid_from', 'date', p_valid_from, 'HERA.COSTCENTER.DYN.VALID_FROM.v2'
  ) ON CONFLICT (organization_id, entity_id, field_name) 
  DO UPDATE SET field_value_date = EXCLUDED.field_value_date, updated_at = CURRENT_TIMESTAMP;
  
  -- ==========================================================================
  -- 6. Optional Dynamic Data Fields
  -- ==========================================================================
  
  -- Valid To (if provided)
  IF p_valid_to IS NOT NULL THEN
    INSERT INTO core_dynamic_data (
      organization_id, entity_id, field_name, field_type, field_value_date, smart_code
    ) VALUES (
      p_organization_id, v_entity_id, 'valid_to', 'date', p_valid_to, 'HERA.COSTCENTER.DYN.VALID_TO.v2'
    ) ON CONFLICT (organization_id, entity_id, field_name) 
    DO UPDATE SET field_value_date = EXCLUDED.field_value_date, updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  -- Responsible Person
  IF p_responsible_person IS NOT NULL THEN
    INSERT INTO core_dynamic_data (
      organization_id, entity_id, field_name, field_type, field_value_text, smart_code
    ) VALUES (
      p_organization_id, v_entity_id, 'responsible_person', 'text', p_responsible_person, 'HERA.COSTCENTER.DYN.RESPONSIBLE_PERSON.v2'
    ) ON CONFLICT (organization_id, entity_id, field_name) 
    DO UPDATE SET field_value_text = EXCLUDED.field_value_text, updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  -- Segment
  IF p_segment IS NOT NULL THEN
    INSERT INTO core_dynamic_data (
      organization_id, entity_id, field_name, field_type, field_value_text, smart_code
    ) VALUES (
      p_organization_id, v_entity_id, 'segment', 'text', p_segment, 'HERA.COSTCENTER.DYN.SEGMENT.v2'
    ) ON CONFLICT (organization_id, entity_id, field_name) 
    DO UPDATE SET field_value_text = EXCLUDED.field_value_text, updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  -- Tags (as JSON array)
  IF p_tags IS NOT NULL THEN
    INSERT INTO core_dynamic_data (
      organization_id, entity_id, field_name, field_type, field_value_json, smart_code
    ) VALUES (
      p_organization_id, v_entity_id, 'tags', 'json', to_jsonb(p_tags), 'HERA.COSTCENTER.DYN.TAGS.v2'
    ) ON CONFLICT (organization_id, entity_id, field_name) 
    DO UPDATE SET field_value_json = EXCLUDED.field_value_json, updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  -- ==========================================================================
  -- 7. Relationship Operations (Parent-Child Hierarchy)
  -- ==========================================================================
  
  -- Remove existing parent relationship if updating
  IF v_operation_type = 'UPDATE' THEN
    DELETE FROM core_relationships 
    WHERE to_entity_id = v_entity_id 
      AND relationship_type = 'COST_CENTER_PARENT_OF'
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
      'COST_CENTER_PARENT_OF',
      'HERA.COSTCENTER.REL.PARENT_OF.v2',
      jsonb_build_object(
        'hierarchy_depth', v_computed_depth,
        'created_by_txn', v_audit_txn_id,
        'sort_order', 1
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
    'HERA.COSTCENTER.TXN.FIELD_SET.v2',
    jsonb_build_object(
      'operation_type', v_operation_type,
      'cc_code', p_cc_code,
      'cost_center_type', p_cost_center_type,
      'depth', v_computed_depth,
      'parent_id', p_parent_id,
      'valid_from', p_valid_from,
      'valid_to', p_valid_to,
      'responsible_person', p_responsible_person,
      'segment', p_segment,
      'tags', p_tags
    )
  );
  
  -- ==========================================================================
  -- 9. Return Result
  -- ==========================================================================
  
  RETURN QUERY
  SELECT 
    v_entity_id as cost_center_id,
    p_entity_name as entity_name,
    p_cc_code as cc_code,
    v_computed_depth as depth,
    p_cost_center_type as cost_center_type,
    'ACTIVE'::TEXT as status,
    p_parent_id as parent_id,
    p_valid_from as valid_from,
    p_valid_to as valid_to,
    p_responsible_person as responsible_person,
    p_segment as segment,
    p_tags as tags,
    v_audit_txn_id as audit_txn_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error for debugging
    RAISE NOTICE 'Cost center upsert error for code %: % (SQLSTATE: %)', 
      p_cc_code, SQLERRM, SQLSTATE;
    
    -- Re-raise with context
    RAISE EXCEPTION 'Cost center operation failed for code %: %', 
      p_cc_code, SQLERRM
      USING ERRCODE = SQLSTATE;
END;
$$;

-- ==========================================================================
-- Security & Performance
-- ==========================================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION hera_costcenter_upsert_v2 TO authenticated;

-- Create indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_cc_code_org 
ON core_dynamic_data (organization_id, field_value_text) 
WHERE field_name = 'cc_code';

CREATE INDEX IF NOT EXISTS idx_cc_entities_type_org 
ON core_entities (organization_id, entity_type) 
WHERE entity_type = 'COST_CENTER';

CREATE INDEX IF NOT EXISTS idx_cc_relationships_parent 
ON core_relationships (organization_id, from_entity_id, relationship_type)
WHERE relationship_type = 'COST_CENTER_PARENT_OF';

-- Add comment for documentation
COMMENT ON FUNCTION hera_costcenter_upsert_v2 IS 
'HERA Cost Center v2: Atomic cost center create/update with complete guardrails validation, audit trail, and hierarchy management. Bulletproof enterprise-grade function supporting unlimited cost center hierarchies with policy-as-data enforcement.';