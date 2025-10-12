-- Update the resolution function to handle smart codes properly
DROP FUNCTION IF EXISTS rpc_entities_resolve_and_upsert(uuid, text, text, text, text, jsonb);

CREATE OR REPLACE FUNCTION rpc_entities_resolve_and_upsert(
    p_org_id uuid,
    p_entity_type text,
    p_entity_name text,
    p_entity_code text DEFAULT NULL,
    p_smart_code text DEFAULT NULL,
    p_metadata jsonb DEFAULT NULL
)
RETURNS TABLE (
    entity_id uuid,
    is_new boolean,
    matched_by text,
    confidence_score numeric
) AS $$
DECLARE
    v_normalized_name text;
    v_existing_id uuid;
    v_new_id uuid;
    v_matched_by text;
    v_confidence numeric;
    v_entity_code text;
    v_smart_code text;
BEGIN
    -- Validate inputs
    IF p_org_id IS NULL OR p_entity_type IS NULL OR p_entity_name IS NULL THEN
        RAISE EXCEPTION 'org_id, entity_type, and entity_name are required';
    END IF;
    
    -- Normalize the entity name
    v_normalized_name := hera_normalize_text(p_entity_name);
    
    -- Generate entity_code if not provided
    v_entity_code := COALESCE(
        p_entity_code, 
        UPPER(p_entity_type) || '-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS')
    );
    
    -- Generate smart_code if not provided
    -- For now, return error if no smart code provided since it's required
    IF p_smart_code IS NULL THEN
        RAISE EXCEPTION 'smart_code is required. Use format: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{N}';
    END IF;
    v_smart_code := p_smart_code;
    
    -- Try exact match on entity_code first (highest confidence)
    IF p_entity_code IS NOT NULL THEN
        SELECT e.id INTO v_existing_id
        FROM core_entities e
        WHERE e.organization_id = p_org_id
          AND e.entity_type = p_entity_type
          AND e.entity_code = p_entity_code
          AND COALESCE(e.status, 'active') != 'deleted'
        LIMIT 1;
        
        IF v_existing_id IS NOT NULL THEN
            v_matched_by := 'entity_code';
            v_confidence := 1.0;
        END IF;
    END IF;
    
    -- Try normalized name match
    IF v_existing_id IS NULL THEN
        SELECT e.id INTO v_existing_id
        FROM core_entities e
        JOIN core_dynamic_data dd ON e.id = dd.entity_id
        WHERE e.organization_id = p_org_id
          AND e.entity_type = p_entity_type
          AND COALESCE(e.status, 'active') != 'deleted'
          AND dd.field_name = 'normalized_name'
          AND dd.field_value_text = v_normalized_name
        LIMIT 1;
        
        IF v_existing_id IS NOT NULL THEN
            v_matched_by := 'normalized_name';
            v_confidence := 0.95;
        END IF;
    END IF;
    
    -- Try fuzzy match as last resort
    IF v_existing_id IS NULL THEN
        SELECT e.id, similarity(e.entity_name, p_entity_name) INTO v_existing_id, v_confidence
        FROM core_entities e
        WHERE e.organization_id = p_org_id
          AND e.entity_type = p_entity_type
          AND COALESCE(e.status, 'active') != 'deleted'
          AND similarity(e.entity_name, p_entity_name) > 0.85
        ORDER BY similarity(e.entity_name, p_entity_name) DESC
        LIMIT 1;
        
        IF v_existing_id IS NOT NULL THEN
            v_matched_by := 'fuzzy_match';
        END IF;
    END IF;
    
    -- If no match found, create new entity
    IF v_existing_id IS NULL THEN
        INSERT INTO core_entities (
            organization_id,
            entity_type,
            entity_name,
            entity_code,
            smart_code,
            metadata
        ) VALUES (
            p_org_id,
            p_entity_type,
            p_entity_name,
            v_entity_code,
            v_smart_code,
            p_metadata
        )
        RETURNING id INTO v_new_id;
        
        -- Also create the normalized name entry
        INSERT INTO core_dynamic_data (
            entity_id,
            field_name,
            field_value_text,
            organization_id,
            smart_code
        ) VALUES (
            v_new_id,
            'normalized_name',
            v_normalized_name,
            p_org_id,
            'HERA.SYSTEM.NORMALIZATION.NAME.V1'
        ) ON CONFLICT (entity_id, field_name) DO NOTHING;
        
        RETURN QUERY
        SELECT v_new_id, true, 'created'::text, 1.0::numeric;
    ELSE
        -- Update existing entity metadata if provided
        IF p_metadata IS NOT NULL THEN
            UPDATE core_entities
            SET metadata = COALESCE(metadata, '{}'::jsonb) || p_metadata,
                updated_at = NOW()
            WHERE id = v_existing_id;
        END IF;
        
        RETURN QUERY
        SELECT v_existing_id, false, v_matched_by, v_confidence;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION rpc_entities_resolve_and_upsert(uuid, text, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_entities_resolve_and_upsert(uuid, text, text, text, text, jsonb) TO service_role;