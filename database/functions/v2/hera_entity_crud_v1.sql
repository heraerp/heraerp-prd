-- =====================================================
-- HERA V2 Entity CRUD Functions
-- Complete entity management with smart code validation
-- =====================================================

-- =====================================================
-- Entity Upsert Function (Create or Update)
-- =====================================================
CREATE OR REPLACE FUNCTION hera_entity_upsert_v1(
    p_org_id UUID,
    p_entity_type VARCHAR,
    p_entity_name VARCHAR,
    p_smart_code VARCHAR,
    p_entity_code VARCHAR DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entity_id UUID;
    v_existing_entity RECORD;
    v_is_update BOOLEAN := FALSE;
BEGIN
    -- Input validation
    IF p_org_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Organization ID is required'
        );
    END IF;

    IF p_entity_type IS NULL OR p_entity_name IS NULL OR p_smart_code IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Entity type, name, and smart code are required'
        );
    END IF;

    -- Validate smart code format (UPPERCASE with dots, ending with .V{number})
    IF p_smart_code !~ '^[A-Z][A-Z0-9_]*(\.[A-Z][A-Z0-9_]*){4,}\.V\d+$' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid smart code format. Must be UPPERCASE segments separated by dots, ending with .V{number}'
        );
    END IF;

    -- Check if updating existing entity
    IF p_entity_id IS NOT NULL THEN
        SELECT * INTO v_existing_entity
        FROM core_entities
        WHERE id = p_entity_id
          AND organization_id = p_org_id;

        IF FOUND THEN
            v_entity_id := p_entity_id;
            v_is_update := TRUE;
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Entity not found or access denied'
            );
        END IF;
    ELSE
        -- Check for existing entity by entity_code if provided
        IF p_entity_code IS NOT NULL THEN
            SELECT * INTO v_existing_entity
            FROM core_entities
            WHERE organization_id = p_org_id
              AND entity_type = p_entity_type
              AND entity_code = p_entity_code;

            IF FOUND THEN
                v_entity_id := v_existing_entity.id;
                v_is_update := TRUE;
            END IF;
        END IF;
    END IF;

    -- Perform upsert
    IF v_is_update THEN
        -- Update existing entity
        UPDATE core_entities
        SET
            entity_name = p_entity_name,
            smart_code = p_smart_code,
            entity_code = COALESCE(p_entity_code, entity_code),
            metadata = COALESCE(p_metadata, metadata),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_entity_id;
    ELSE
        -- Create new entity
        v_entity_id := gen_random_uuid();

        INSERT INTO core_entities (
            id,
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
            v_entity_id,
            p_org_id,
            p_entity_type,
            p_entity_name,
            p_entity_code,
            p_smart_code,
            'active',
            p_metadata,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;

    -- Return the entity data
    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'id', v_entity_id,
            'entity_type', p_entity_type,
            'entity_name', p_entity_name,
            'entity_code', p_entity_code,
            'smart_code', p_smart_code,
            'is_update', v_is_update,
            'organization_id', p_org_id
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- =====================================================
-- Entity Query Function
-- =====================================================
CREATE OR REPLACE FUNCTION hera_entity_query_v1(
    p_org_id UUID,
    p_filters JSONB DEFAULT '{}',
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0,
    p_include_deleted BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_query TEXT;
    v_result JSONB;
    v_total_count INTEGER;
BEGIN
    -- Input validation
    IF p_org_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Organization ID is required'
        );
    END IF;

    -- Build dynamic query
    v_query := 'SELECT jsonb_agg(entity_data) as data, COUNT(*) OVER() as total_count
                FROM (
                    SELECT
                        id,
                        organization_id,
                        entity_type,
                        entity_name,
                        entity_code,
                        smart_code,
                        status,
                        metadata,
                        created_at,
                        updated_at
                    FROM core_entities
                    WHERE organization_id = $1';

    -- Apply status filter unless including deleted
    IF NOT p_include_deleted THEN
        v_query := v_query || ' AND status != ''deleted''';
    END IF;

    -- Apply filters from JSON
    IF p_filters ? 'entity_type' THEN
        v_query := v_query || ' AND entity_type = ' || quote_literal(p_filters->>'entity_type');
    END IF;

    IF p_filters ? 'status' THEN
        v_query := v_query || ' AND status = ' || quote_literal(p_filters->>'status');
    END IF;

    IF p_filters ? 'entity_name_like' THEN
        v_query := v_query || ' AND entity_name ILIKE ' || quote_literal('%' || (p_filters->>'entity_name_like') || '%');
    END IF;

    IF p_filters ? 'entity_code' THEN
        v_query := v_query || ' AND entity_code = ' || quote_literal(p_filters->>'entity_code');
    END IF;

    IF p_filters ? 'smart_code_like' THEN
        v_query := v_query || ' AND smart_code LIKE ' || quote_literal((p_filters->>'smart_code_like') || '%');
    END IF;

    -- Add ordering
    v_query := v_query || ' ORDER BY created_at DESC';

    -- Add pagination
    v_query := v_query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;

    -- Close subquery
    v_query := v_query || ') as entity_data';

    -- Execute query
    EXECUTE v_query INTO v_result USING p_org_id;

    -- Get total count (without pagination)
    IF v_result->'data' IS NOT NULL AND jsonb_array_length(v_result->'data') > 0 THEN
        v_total_count := (v_result->'data'->0->>'total_count')::INTEGER;
    ELSE
        v_total_count := 0;
    END IF;

    -- Return results
    RETURN jsonb_build_object(
        'success', true,
        'data', COALESCE(v_result->'data', '[]'::jsonb),
        'total', v_total_count,
        'limit', p_limit,
        'offset', p_offset
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'data', '[]'::jsonb
        );
END;
$$;

-- =====================================================
-- Dynamic Data Upsert Function
-- =====================================================
CREATE OR REPLACE FUNCTION hera_dynamic_data_upsert_v1(
    p_org_id UUID,
    p_entity_id UUID,
    p_field_name VARCHAR,
    p_field_value JSONB,
    p_smart_code VARCHAR DEFAULT 'HERA.DYNAMIC.FIELD.STANDARD.V1'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_field_id UUID;
    v_field_type VARCHAR;
    v_existing_field RECORD;
    v_is_update BOOLEAN := FALSE;
BEGIN
    -- Input validation
    IF p_org_id IS NULL OR p_entity_id IS NULL OR p_field_name IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Organization ID, entity ID, and field name are required'
        );
    END IF;

    -- Validate smart code format
    IF p_smart_code !~ '^[A-Z][A-Z0-9_]*(\.[A-Z][A-Z0-9_]*){3,}\.V\d+$' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid smart code format'
        );
    END IF;

    -- Determine field type from value
    IF jsonb_typeof(p_field_value) = 'object' OR jsonb_typeof(p_field_value) = 'array' THEN
        v_field_type := 'json';
    ELSIF jsonb_typeof(p_field_value) = 'number' THEN
        v_field_type := 'number';
    ELSIF jsonb_typeof(p_field_value) = 'boolean' THEN
        v_field_type := 'boolean';
    ELSE
        v_field_type := 'text';
    END IF;

    -- Check for existing field
    SELECT * INTO v_existing_field
    FROM core_dynamic_data
    WHERE organization_id = p_org_id
      AND entity_id = p_entity_id
      AND field_name = p_field_name;

    IF FOUND THEN
        v_field_id := v_existing_field.id;
        v_is_update := TRUE;
    ELSE
        v_field_id := gen_random_uuid();
    END IF;

    -- Perform upsert
    IF v_is_update THEN
        -- Update existing field
        UPDATE core_dynamic_data
        SET
            field_type = v_field_type,
            field_value_json = CASE WHEN v_field_type = 'json' THEN p_field_value ELSE NULL END,
            field_value_number = CASE WHEN v_field_type = 'number' THEN (p_field_value::text)::numeric ELSE NULL END,
            field_value_boolean = CASE WHEN v_field_type = 'boolean' THEN (p_field_value::text)::boolean ELSE NULL END,
            field_value_text = CASE WHEN v_field_type = 'text' THEN p_field_value::text ELSE NULL END,
            smart_code = p_smart_code,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_field_id;
    ELSE
        -- Create new field
        INSERT INTO core_dynamic_data (
            id,
            organization_id,
            entity_id,
            field_name,
            field_type,
            field_value_json,
            field_value_number,
            field_value_boolean,
            field_value_text,
            smart_code,
            created_at,
            updated_at
        ) VALUES (
            v_field_id,
            p_org_id,
            p_entity_id,
            p_field_name,
            v_field_type,
            CASE WHEN v_field_type = 'json' THEN p_field_value ELSE NULL END,
            CASE WHEN v_field_type = 'number' THEN (p_field_value::text)::numeric ELSE NULL END,
            CASE WHEN v_field_type = 'boolean' THEN (p_field_value::text)::boolean ELSE NULL END,
            CASE WHEN v_field_type = 'text' THEN p_field_value::text ELSE NULL END,
            p_smart_code,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'id', v_field_id,
            'field_name', p_field_name,
            'field_type', v_field_type,
            'field_value', p_field_value,
            'is_update', v_is_update
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- =====================================================
-- Relationship Upsert Function
-- =====================================================
CREATE OR REPLACE FUNCTION hera_relationship_upsert_v1(
    p_org_id UUID,
    p_from_entity_id UUID,
    p_to_entity_id UUID,
    p_relationship_type VARCHAR,
    p_smart_code VARCHAR,
    p_relationship_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_relationship_id UUID;
    v_existing_rel RECORD;
    v_is_update BOOLEAN := FALSE;
BEGIN
    -- Input validation
    IF p_org_id IS NULL OR p_from_entity_id IS NULL OR p_to_entity_id IS NULL
       OR p_relationship_type IS NULL OR p_smart_code IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'All required parameters must be provided'
        );
    END IF;

    -- Check for existing relationship
    SELECT * INTO v_existing_rel
    FROM core_relationships
    WHERE organization_id = p_org_id
      AND from_entity_id = p_from_entity_id
      AND to_entity_id = p_to_entity_id
      AND relationship_type = p_relationship_type;

    IF FOUND THEN
        v_relationship_id := v_existing_rel.id;
        v_is_update := TRUE;
    ELSE
        v_relationship_id := gen_random_uuid();
    END IF;

    -- Perform upsert
    IF v_is_update THEN
        UPDATE core_relationships
        SET
            smart_code = p_smart_code,
            relationship_data = COALESCE(p_relationship_data, relationship_data),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_relationship_id;
    ELSE
        INSERT INTO core_relationships (
            id,
            organization_id,
            from_entity_id,
            to_entity_id,
            relationship_type,
            smart_code,
            relationship_data,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            v_relationship_id,
            p_org_id,
            p_from_entity_id,
            p_to_entity_id,
            p_relationship_type,
            p_smart_code,
            p_relationship_data,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'id', v_relationship_id,
            'is_update', v_is_update
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION hera_entity_upsert_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_query_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_upsert_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_relationship_upsert_v1 TO authenticated;