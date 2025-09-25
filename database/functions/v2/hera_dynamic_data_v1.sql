-- ============================================================================
-- HERA Dynamic Data CRUD Functions v1
-- ============================================================================
-- Comprehensive dynamic data functions for managing entity custom fields:
-- - hera_dynamic_data_set_v1: Set/update dynamic field values
-- - hera_dynamic_data_get_v1: Read dynamic field values
-- - hera_dynamic_data_delete_v1: Delete dynamic fields
-- - hera_dynamic_data_batch_v1: Batch operations for performance
--
-- Smart Code: HERA.DB.FUNCTION.DYNAMIC.DATA.V1
-- ============================================================================

-- Drop functions if they exist (for idempotency)
DROP FUNCTION IF EXISTS hera_dynamic_data_set_v1;
DROP FUNCTION IF EXISTS hera_dynamic_data_get_v1;
DROP FUNCTION IF EXISTS hera_dynamic_data_delete_v1;
DROP FUNCTION IF EXISTS hera_dynamic_data_batch_v1;

-- ============================================================================
-- HERA Dynamic Data Set Function v1
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_dynamic_data_set_v1(
    p_organization_id UUID,
    p_entity_id UUID,
    p_field_name TEXT,
    p_field_type TEXT,
    p_field_value_text TEXT DEFAULT NULL,
    p_field_value_number DECIMAL DEFAULT NULL,
    p_field_value_boolean BOOLEAN DEFAULT NULL,
    p_field_value_date DATE DEFAULT NULL,
    p_field_value_datetime TIMESTAMPTZ DEFAULT NULL,
    p_field_value_json JSONB DEFAULT NULL,
    p_smart_code TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_actor_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_entity_exists BOOLEAN;
    v_existing_field RECORD;
    v_result_id UUID;
    v_operation TEXT;
BEGIN
    -- Validate required parameters
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_SET: organization_id is required';
    END IF;

    IF p_entity_id IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_SET: entity_id is required';
    END IF;

    IF p_field_name IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_SET: field_name is required';
    END IF;

    IF p_field_type IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_SET: field_type is required';
    END IF;

    -- Validate field_type
    IF p_field_type NOT IN ('text', 'number', 'boolean', 'date', 'datetime', 'json') THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_SET: Invalid field_type. Must be one of: text, number, boolean, date, datetime, json';
    END IF;

    -- Check if entity exists
    SELECT EXISTS(
        SELECT 1 FROM core_entities
        WHERE id = p_entity_id
        AND organization_id = p_organization_id
        AND is_deleted = FALSE
    ) INTO v_entity_exists;

    IF NOT v_entity_exists THEN
        RAISE EXCEPTION 'HERA_ENTITY_NOT_FOUND: Entity % not found', p_entity_id;
    END IF;

    -- Check if field already exists
    SELECT * INTO v_existing_field
    FROM core_dynamic_data
    WHERE organization_id = p_organization_id
    AND entity_id = p_entity_id
    AND field_name = p_field_name
    AND is_deleted = FALSE;

    IF v_existing_field.id IS NOT NULL THEN
        -- Update existing field
        UPDATE core_dynamic_data SET
            field_type = p_field_type,
            field_value_text = CASE WHEN p_field_type = 'text' THEN p_field_value_text ELSE NULL END,
            field_value_number = CASE WHEN p_field_type = 'number' THEN p_field_value_number ELSE NULL END,
            field_value_boolean = CASE WHEN p_field_type = 'boolean' THEN p_field_value_boolean ELSE NULL END,
            field_value_date = CASE WHEN p_field_type = 'date' THEN p_field_value_date ELSE NULL END,
            field_value_datetime = CASE WHEN p_field_type = 'datetime' THEN p_field_value_datetime ELSE NULL END,
            field_value_json = CASE WHEN p_field_type = 'json' THEN p_field_value_json ELSE NULL END,
            smart_code = COALESCE(p_smart_code, smart_code),
            metadata = COALESCE(p_metadata, metadata),
            updated_at = NOW(),
            updated_by = p_actor_user_id
        WHERE id = v_existing_field.id
        RETURNING id INTO v_result_id;
        
        v_operation := 'update';
    ELSE
        -- Insert new field
        INSERT INTO core_dynamic_data (
            organization_id,
            entity_id,
            field_name,
            field_type,
            field_value_text,
            field_value_number,
            field_value_boolean,
            field_value_date,
            field_value_datetime,
            field_value_json,
            smart_code,
            metadata,
            created_by,
            updated_by
        ) VALUES (
            p_organization_id,
            p_entity_id,
            p_field_name,
            p_field_type,
            CASE WHEN p_field_type = 'text' THEN p_field_value_text ELSE NULL END,
            CASE WHEN p_field_type = 'number' THEN p_field_value_number ELSE NULL END,
            CASE WHEN p_field_type = 'boolean' THEN p_field_value_boolean ELSE NULL END,
            CASE WHEN p_field_type = 'date' THEN p_field_value_date ELSE NULL END,
            CASE WHEN p_field_type = 'datetime' THEN p_field_value_datetime ELSE NULL END,
            CASE WHEN p_field_type = 'json' THEN p_field_value_json ELSE NULL END,
            p_smart_code,
            p_metadata,
            p_actor_user_id,
            p_actor_user_id
        )
        RETURNING id INTO v_result_id;
        
        v_operation := 'create';
    END IF;

    -- Return result
    RETURN jsonb_build_object(
        'success', TRUE,
        'operation', v_operation,
        'field_id', v_result_id,
        'entity_id', p_entity_id,
        'field_name', p_field_name,
        'field_type', p_field_type
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_DYNAMIC_DATA_SET_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;

-- ============================================================================
-- HERA Dynamic Data Get Function v1
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_dynamic_data_get_v1(
    p_organization_id UUID,
    p_entity_id UUID,
    p_field_name TEXT DEFAULT NULL,
    p_include_deleted BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
    v_fields JSONB;
BEGIN
    -- Validate required parameters
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_GET: organization_id is required';
    END IF;

    IF p_entity_id IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_GET: entity_id is required';
    END IF;

    -- Get specific field
    IF p_field_name IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', dd.id,
            'field_name', dd.field_name,
            'field_type', dd.field_type,
            'field_value_text', dd.field_value_text,
            'field_value_number', dd.field_value_number,
            'field_value_boolean', dd.field_value_boolean,
            'field_value_date', dd.field_value_date,
            'field_value_datetime', dd.field_value_datetime,
            'field_value_json', dd.field_value_json,
            'smart_code', dd.smart_code,
            'metadata', dd.metadata,
            'is_deleted', dd.is_deleted,
            'created_at', dd.created_at,
            'updated_at', dd.updated_at,
            'value', CASE
                WHEN dd.field_type = 'text' THEN to_jsonb(dd.field_value_text)
                WHEN dd.field_type = 'number' THEN to_jsonb(dd.field_value_number)
                WHEN dd.field_type = 'boolean' THEN to_jsonb(dd.field_value_boolean)
                WHEN dd.field_type = 'date' THEN to_jsonb(dd.field_value_date)
                WHEN dd.field_type = 'datetime' THEN to_jsonb(dd.field_value_datetime)
                WHEN dd.field_type = 'json' THEN dd.field_value_json
                ELSE NULL
            END
        ) INTO v_result
        FROM core_dynamic_data dd
        WHERE dd.organization_id = p_organization_id
        AND dd.entity_id = p_entity_id
        AND dd.field_name = p_field_name
        AND (p_include_deleted OR dd.is_deleted = FALSE);

        IF v_result IS NULL THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'error', 'FIELD_NOT_FOUND',
                'message', format('Field %s not found for entity %s', p_field_name, p_entity_id)
            );
        END IF;

        RETURN jsonb_build_object(
            'success', TRUE,
            'data', v_result
        );
    END IF;

    -- Get all fields for entity
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', dd.id,
            'field_name', dd.field_name,
            'field_type', dd.field_type,
            'field_value_text', dd.field_value_text,
            'field_value_number', dd.field_value_number,
            'field_value_boolean', dd.field_value_boolean,
            'field_value_date', dd.field_value_date,
            'field_value_datetime', dd.field_value_datetime,
            'field_value_json', dd.field_value_json,
            'smart_code', dd.smart_code,
            'metadata', dd.metadata,
            'is_deleted', dd.is_deleted,
            'created_at', dd.created_at,
            'updated_at', dd.updated_at,
            'value', CASE
                WHEN dd.field_type = 'text' THEN to_jsonb(dd.field_value_text)
                WHEN dd.field_type = 'number' THEN to_jsonb(dd.field_value_number)
                WHEN dd.field_type = 'boolean' THEN to_jsonb(dd.field_value_boolean)
                WHEN dd.field_type = 'date' THEN to_jsonb(dd.field_value_date)
                WHEN dd.field_type = 'datetime' THEN to_jsonb(dd.field_value_datetime)
                WHEN dd.field_type = 'json' THEN dd.field_value_json
                ELSE NULL
            END
        )
    ) INTO v_fields
    FROM core_dynamic_data dd
    WHERE dd.organization_id = p_organization_id
    AND dd.entity_id = p_entity_id
    AND (p_include_deleted OR dd.is_deleted = FALSE)
    ORDER BY dd.field_name;

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', COALESCE(v_fields, '[]'::jsonb),
        'metadata', jsonb_build_object(
            'entity_id', p_entity_id,
            'field_count', COALESCE(jsonb_array_length(v_fields), 0)
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_DYNAMIC_DATA_GET_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;

-- ============================================================================
-- HERA Dynamic Data Delete Function v1
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_dynamic_data_delete_v1(
    p_organization_id UUID,
    p_entity_id UUID,
    p_field_name TEXT DEFAULT NULL,
    p_hard_delete BOOLEAN DEFAULT FALSE,
    p_actor_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_operation TEXT;
BEGIN
    -- Validate required parameters
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_DELETE: organization_id is required';
    END IF;

    IF p_entity_id IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_DELETE: entity_id is required';
    END IF;

    -- Delete specific field or all fields
    IF p_hard_delete THEN
        -- Hard delete
        IF p_field_name IS NOT NULL THEN
            DELETE FROM core_dynamic_data
            WHERE organization_id = p_organization_id
            AND entity_id = p_entity_id
            AND field_name = p_field_name;
        ELSE
            DELETE FROM core_dynamic_data
            WHERE organization_id = p_organization_id
            AND entity_id = p_entity_id;
        END IF;
        
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        v_operation := 'hard_delete';
    ELSE
        -- Soft delete
        IF p_field_name IS NOT NULL THEN
            UPDATE core_dynamic_data
            SET is_deleted = TRUE,
                updated_at = NOW(),
                updated_by = p_actor_user_id
            WHERE organization_id = p_organization_id
            AND entity_id = p_entity_id
            AND field_name = p_field_name
            AND is_deleted = FALSE;
        ELSE
            UPDATE core_dynamic_data
            SET is_deleted = TRUE,
                updated_at = NOW(),
                updated_by = p_actor_user_id
            WHERE organization_id = p_organization_id
            AND entity_id = p_entity_id
            AND is_deleted = FALSE;
        END IF;
        
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        v_operation := 'soft_delete';
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'operation', v_operation,
        'entity_id', p_entity_id,
        'field_name', p_field_name,
        'deleted_count', v_deleted_count,
        'metadata', jsonb_build_object(
            'deleted_by', p_actor_user_id,
            'deleted_at', NOW()
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_DYNAMIC_DATA_DELETE_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;

-- ============================================================================
-- HERA Dynamic Data Batch Function v1
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_dynamic_data_batch_v1(
    p_organization_id UUID,
    p_entity_id UUID,
    p_fields JSONB,
    p_operation TEXT DEFAULT 'upsert', -- upsert, delete
    p_actor_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_field JSONB;
    v_results JSONB := '[]'::jsonb;
    v_result JSONB;
    v_success_count INTEGER := 0;
    v_error_count INTEGER := 0;
    v_field_name TEXT;
    v_field_type TEXT;
    v_field_value JSONB;
BEGIN
    -- Validate required parameters
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_BATCH: organization_id is required';
    END IF;

    IF p_entity_id IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_BATCH: entity_id is required';
    END IF;

    IF p_fields IS NULL OR jsonb_typeof(p_fields) != 'array' THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA_BATCH: fields must be a JSON array';
    END IF;

    -- Process each field
    FOR v_field IN SELECT * FROM jsonb_array_elements(p_fields)
    LOOP
        BEGIN
            v_field_name := v_field->>'field_name';
            v_field_type := v_field->>'field_type';
            v_field_value := v_field->'value';

            IF p_operation = 'delete' THEN
                -- Batch delete
                v_result := hera_dynamic_data_delete_v1(
                    p_organization_id,
                    p_entity_id,
                    v_field_name,
                    FALSE, -- soft delete by default
                    p_actor_user_id
                );
            ELSE
                -- Batch upsert
                IF v_field_type IS NULL THEN
                    -- Auto-detect field type
                    v_field_type := CASE
                        WHEN jsonb_typeof(v_field_value) = 'number' THEN 'number'
                        WHEN jsonb_typeof(v_field_value) = 'boolean' THEN 'boolean'
                        WHEN jsonb_typeof(v_field_value) = 'object' OR jsonb_typeof(v_field_value) = 'array' THEN 'json'
                        ELSE 'text'
                    END;
                END IF;

                v_result := hera_dynamic_data_set_v1(
                    p_organization_id,
                    p_entity_id,
                    v_field_name,
                    v_field_type,
                    CASE WHEN v_field_type = 'text' THEN v_field_value::text ELSE NULL END,
                    CASE WHEN v_field_type = 'number' THEN (v_field_value::text)::decimal ELSE NULL END,
                    CASE WHEN v_field_type = 'boolean' THEN (v_field_value::text)::boolean ELSE NULL END,
                    CASE WHEN v_field_type = 'date' THEN (v_field_value::text)::date ELSE NULL END,
                    CASE WHEN v_field_type = 'datetime' THEN (v_field_value::text)::timestamptz ELSE NULL END,
                    CASE WHEN v_field_type = 'json' THEN v_field_value ELSE NULL END,
                    v_field->>'smart_code',
                    v_field->'metadata',
                    p_actor_user_id
                );
            END IF;

            v_results := v_results || jsonb_build_object(
                'field_name', v_field_name,
                'success', v_result->>'success',
                'operation', v_result->>'operation'
            );

            IF (v_result->>'success')::boolean THEN
                v_success_count := v_success_count + 1;
            ELSE
                v_error_count := v_error_count + 1;
            END IF;

        EXCEPTION
            WHEN OTHERS THEN
                v_results := v_results || jsonb_build_object(
                    'field_name', v_field_name,
                    'success', FALSE,
                    'error', SQLERRM
                );
                v_error_count := v_error_count + 1;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'success', v_error_count = 0,
        'operation', 'batch_' || p_operation,
        'entity_id', p_entity_id,
        'results', v_results,
        'metadata', jsonb_build_object(
            'total_fields', jsonb_array_length(p_fields),
            'success_count', v_success_count,
            'error_count', v_error_count
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_DYNAMIC_DATA_BATCH_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION hera_dynamic_data_set_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_set_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_get_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_get_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_delete_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_delete_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_batch_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_batch_v1 TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION hera_dynamic_data_set_v1 IS 'HERA Universal Dynamic Data Set Function v1 - Create or update custom field values';
COMMENT ON FUNCTION hera_dynamic_data_get_v1 IS 'HERA Universal Dynamic Data Get Function v1 - Retrieve custom field values for entities';
COMMENT ON FUNCTION hera_dynamic_data_delete_v1 IS 'HERA Universal Dynamic Data Delete Function v1 - Delete custom fields with soft/hard delete options';
COMMENT ON FUNCTION hera_dynamic_data_batch_v1 IS 'HERA Universal Dynamic Data Batch Function v1 - Batch operations for multiple fields';