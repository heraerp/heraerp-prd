-- ============================================================================
-- Fix dd.metadata References - CRITICAL FIX
-- ============================================================================
-- The core_dynamic_data table does NOT have a metadata column.
-- Previous "fix" migrations missed this issue.
--
-- This migration removes ALL references to dd.metadata from RPC functions.
-- ============================================================================

-- Drop and recreate hera_entity_read_v1 WITHOUT dd.metadata references
DROP FUNCTION IF EXISTS hera_entity_read_v1 CASCADE;

CREATE OR REPLACE FUNCTION hera_entity_read_v1(
    p_organization_id UUID,
    p_entity_id UUID DEFAULT NULL,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_code TEXT DEFAULT NULL,
    p_smart_code TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_include_relationships BOOLEAN DEFAULT FALSE,
    p_include_dynamic_data BOOLEAN DEFAULT FALSE,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
    v_entities JSONB;
    v_total_count INTEGER;
    v_entity_ids UUID[];
BEGIN
    -- Validate organization_id
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_READ: organization_id is required';
    END IF;

    -- If entity_id is provided, return single entity
    IF p_entity_id IS NOT NULL THEN
        -- Get single entity
        SELECT jsonb_build_object(
            'id', e.id,
            'entity_id', e.id,
            'organization_id', e.organization_id,
            'entity_type', e.entity_type,
            'entity_name', e.entity_name,
            'entity_code', e.entity_code,
            'entity_description', e.entity_description,
            'smart_code', e.smart_code,
            'smart_code_status', e.smart_code_status,
            'status', e.status,
            'tags', e.tags,
            'metadata', e.metadata,
            'business_rules', e.business_rules,
            'ai_confidence', e.ai_confidence,
            'ai_classification', e.ai_classification,
            'ai_insights', e.ai_insights,
            'parent_entity_id', e.parent_entity_id,
            'created_at', e.created_at,
            'updated_at', e.updated_at,
            'created_by', e.created_by,
            'updated_by', e.updated_by,
            'version', e.version,
            'relationship_count', CASE
                WHEN p_include_relationships THEN (
                    SELECT COUNT(*)::INTEGER
                    FROM core_relationships r
                    WHERE (r.from_entity_id = e.id OR r.to_entity_id = e.id)
                    AND r.organization_id = p_organization_id
                )
                ELSE NULL
            END,
            'dynamic_fields', CASE
                WHEN p_include_dynamic_data THEN (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', dd.id,
                            'field_name', dd.field_name,
                            'field_type', dd.field_type,
                            'field_value_text', dd.field_value_text,
                            'field_value_number', dd.field_value_number,
                            'field_value_boolean', dd.field_value_boolean,
                            'field_value_date', dd.field_value_date,
                            'field_value_json', dd.field_value_json,
                            'smart_code', dd.smart_code,
                            -- REMOVED: 'metadata', dd.metadata (column doesn't exist)
                            'created_at', dd.created_at,
                            'updated_at', dd.updated_at
                        )
                    )
                    FROM core_dynamic_data dd
                    WHERE dd.entity_id = e.id
                    AND dd.organization_id = p_organization_id
                )
                ELSE NULL
            END
        ) INTO v_result
        FROM core_entities e
        WHERE e.id = p_entity_id
        AND e.organization_id = p_organization_id;

        IF v_result IS NULL THEN
            RAISE EXCEPTION 'HERA_ENTITY_NOT_FOUND: Entity % not found in organization %',
                p_entity_id, p_organization_id;
        END IF;

        RETURN jsonb_build_object(
            'success', TRUE,
            'data', v_result,
            'metadata', jsonb_build_object(
                'total_count', 1,
                'returned_count', 1
            )
        );
    END IF;

    -- Multiple entity query
    WITH filtered_entities AS (
        SELECT e.*
        FROM core_entities e
        WHERE e.organization_id = p_organization_id
        AND (p_entity_type IS NULL OR e.entity_type = p_entity_type)
        AND (p_entity_code IS NULL OR e.entity_code = p_entity_code)
        AND (p_smart_code IS NULL OR e.smart_code = p_smart_code)
        AND (p_status IS NULL OR e.status = p_status)
        ORDER BY e.created_at DESC
        LIMIT p_limit OFFSET p_offset
    ),
    entity_data AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', fe.id,
                'entity_id', fe.id,
                'organization_id', fe.organization_id,
                'entity_type', fe.entity_type,
                'entity_name', fe.entity_name,
                'entity_code', fe.entity_code,
                'entity_description', fe.entity_description,
                'smart_code', fe.smart_code,
                'smart_code_status', fe.smart_code_status,
                'status', fe.status,
                'tags', fe.tags,
                'metadata', fe.metadata,
                'business_rules', fe.business_rules,
                'ai_confidence', fe.ai_confidence,
                'ai_classification', fe.ai_classification,
                'ai_insights', fe.ai_insights,
                'parent_entity_id', fe.parent_entity_id,
                'created_at', fe.created_at,
                'updated_at', fe.updated_at,
                'created_by', fe.created_by,
                'updated_by', fe.updated_by,
                'version', fe.version,
                'relationship_count', CASE
                    WHEN p_include_relationships THEN (
                        SELECT COUNT(*)::INTEGER
                        FROM core_relationships r
                        WHERE (r.from_entity_id = fe.id OR r.to_entity_id = fe.id)
                        AND r.organization_id = p_organization_id
                    )
                    ELSE NULL
                END,
                'dynamic_fields', CASE
                    WHEN p_include_dynamic_data THEN (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', dd.id,
                                'field_name', dd.field_name,
                                'field_type', dd.field_type,
                                'field_value_text', dd.field_value_text,
                                'field_value_number', dd.field_value_number,
                                'field_value_boolean', dd.field_value_boolean,
                                'field_value_date', dd.field_value_date,
                                'field_value_json', dd.field_value_json,
                                'smart_code', dd.smart_code,
                                -- REMOVED: 'metadata', dd.metadata (column doesn't exist)
                                'created_at', dd.created_at,
                                'updated_at', dd.updated_at
                            )
                        )
                        FROM core_dynamic_data dd
                        WHERE dd.entity_id = fe.id
                        AND dd.organization_id = p_organization_id
                    )
                    ELSE NULL
                END
            )
        ) AS entities,
        COUNT(*) AS total_count
        FROM filtered_entities fe
    )
    SELECT
        entities,
        total_count
    INTO
        v_entities,
        v_total_count
    FROM entity_data;

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', COALESCE(v_entities, '[]'::jsonb),
        'metadata', jsonb_build_object(
            'total_count', COALESCE(v_total_count, 0),
            'returned_count', COALESCE(jsonb_array_length(v_entities), 0),
            'page_size', p_limit,
            'offset', p_offset
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION hera_entity_read_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_read_v1 TO service_role;

-- Add descriptive comment
COMMENT ON FUNCTION hera_entity_read_v1 IS 'HERA Universal Entity Read Function v1 - Fixed to remove dd.metadata references (column does not exist in core_dynamic_data)';

-- ============================================================================
-- Also fix hera_dynamic_data_get_v1 if it exists
-- ============================================================================
DROP FUNCTION IF EXISTS hera_dynamic_data_get_v1 CASCADE;

CREATE OR REPLACE FUNCTION hera_dynamic_data_get_v1(
    p_organization_id UUID,
    p_entity_id UUID DEFAULT NULL,
    p_field_name TEXT DEFAULT NULL,
    p_field_type TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
    v_total_count INTEGER;
BEGIN
    -- Validate organization_id
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_DYNAMIC_DATA: organization_id is required';
    END IF;

    -- Get dynamic data with filters
    WITH filtered_data AS (
        SELECT dd.*
        FROM core_dynamic_data dd
        WHERE dd.organization_id = p_organization_id
        AND (p_entity_id IS NULL OR dd.entity_id = p_entity_id)
        AND (p_field_name IS NULL OR dd.field_name = p_field_name)
        AND (p_field_type IS NULL OR dd.field_type = p_field_type)
        ORDER BY dd.created_at DESC
        LIMIT p_limit OFFSET p_offset
    ),
    data_result AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', dd.id,
                'organization_id', dd.organization_id,
                'entity_id', dd.entity_id,
                'field_name', dd.field_name,
                'field_type', dd.field_type,
                'field_value_text', dd.field_value_text,
                'field_value_number', dd.field_value_number,
                'field_value_boolean', dd.field_value_boolean,
                'field_value_date', dd.field_value_date,
                'field_value_json', dd.field_value_json,
                'smart_code', dd.smart_code,
                -- REMOVED: 'metadata', dd.metadata (column doesn't exist)
                'created_at', dd.created_at,
                'updated_at', dd.updated_at,
                'created_by', dd.created_by,
                'updated_by', dd.updated_by
            )
        ) AS data,
        COUNT(*) AS total_count
        FROM filtered_data dd
    )
    SELECT
        data,
        total_count
    INTO
        v_result,
        v_total_count
    FROM data_result;

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', COALESCE(v_result, '[]'::jsonb),
        'metadata', jsonb_build_object(
            'total_count', COALESCE(v_total_count, 0),
            'returned_count', COALESCE(jsonb_array_length(v_result), 0),
            'page_size', p_limit,
            'offset', p_offset
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION hera_dynamic_data_get_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_get_v1 TO service_role;

-- Add descriptive comment
COMMENT ON FUNCTION hera_dynamic_data_get_v1 IS 'HERA Dynamic Data Get Function v1 - Fixed to remove dd.metadata references';

-- ============================================================================
-- Success confirmation
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Successfully fixed dd.metadata references in RPC functions';
    RAISE NOTICE 'Functions updated: hera_entity_read_v1, hera_dynamic_data_get_v1';
END $$;