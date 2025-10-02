-- ============================================================================
-- HERA Entity Read Function v1 - FIXED VERSION
-- ============================================================================
-- Fixed to match actual core_entities table schema:
-- - Removed references to e.attributes (doesn't exist)
-- - Removed references to is_deleted (doesn't exist in core tables)
-- - Keep all other columns that do exist
-- ============================================================================

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
            -- 'attributes' column doesn't exist, removed
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
                    -- No is_deleted column in core_relationships
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
                            'field_value_datetime', dd.field_value_datetime,
                            'field_value_json', dd.field_value_json,
                            'smart_code', dd.smart_code,
                            -- 'metadata' column doesn't exist in core_dynamic_data, removed
                            'created_at', dd.created_at,
                            'updated_at', dd.updated_at
                        )
                    )
                    FROM core_dynamic_data dd
                    WHERE dd.entity_id = e.id
                    AND dd.organization_id = p_organization_id
                    -- No is_deleted column in core_dynamic_data
                )
                ELSE NULL
            END
        ) INTO v_result
        FROM core_entities e
        WHERE e.id = p_entity_id
        AND e.organization_id = p_organization_id;
        -- No is_deleted column to check

        IF v_result IS NULL THEN
            RAISE EXCEPTION 'HERA_ENTITY_NOT_FOUND: Entity % not found', p_entity_id;
        END IF;

        RETURN jsonb_build_object(
            'success', TRUE,
            'data', v_result,
            'metadata', jsonb_build_object(
                'operation', 'read_single',
                'entity_id', p_entity_id
            )
        );
    END IF;

    -- Multiple entities query
    -- Build the base query with filters
    WITH filtered_entities AS (
        SELECT
            e.id,
            e.organization_id,
            e.entity_type,
            e.entity_name,
            e.entity_code,
            e.entity_description,
            e.smart_code,
            e.smart_code_status,
            e.status,
            e.tags,
            e.metadata,
            e.business_rules,
            -- No attributes column
            e.ai_confidence,
            e.ai_classification,
            e.ai_insights,
            e.parent_entity_id,
            e.created_at,
            e.updated_at,
            e.created_by,
            e.updated_by,
            e.version
        FROM core_entities e
        WHERE e.organization_id = p_organization_id
        -- No is_deleted column to filter
        AND (p_entity_type IS NULL OR e.entity_type = p_entity_type)
        AND (p_entity_code IS NULL OR e.entity_code = p_entity_code)
        AND (p_smart_code IS NULL OR e.smart_code = p_smart_code)
        AND (p_status IS NULL OR e.status = p_status)
        ORDER BY e.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT
        jsonb_agg(
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
                -- No attributes column
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
                        -- No is_deleted column in core_relationships
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
                                'field_value_datetime', dd.field_value_datetime,
                                'field_value_json', dd.field_value_json,
                                'smart_code', dd.smart_code,
                                -- 'metadata' column doesn't exist in core_dynamic_data, removed
                                'created_at', dd.created_at,
                                'updated_at', dd.updated_at
                            )
                        )
                        FROM core_dynamic_data dd
                        WHERE dd.entity_id = fe.id
                        AND dd.organization_id = p_organization_id
                        -- No is_deleted column in core_dynamic_data
                    )
                    ELSE NULL
                END
            )
        ) INTO v_entities
    FROM filtered_entities fe;

    -- Get total count for pagination
    SELECT COUNT(*)::INTEGER INTO v_total_count
    FROM core_entities e
    WHERE e.organization_id = p_organization_id
    -- No is_deleted column to filter
    AND (p_entity_type IS NULL OR e.entity_type = p_entity_type)
    AND (p_entity_code IS NULL OR e.entity_code = p_entity_code)
    AND (p_smart_code IS NULL OR e.smart_code = p_smart_code)
    AND (p_status IS NULL OR e.status = p_status);

    -- Return result
    RETURN jsonb_build_object(
        'success', TRUE,
        'data', COALESCE(v_entities, '[]'::jsonb),
        'metadata', jsonb_build_object(
            'operation', 'read_multiple',
            'total', v_total_count,
            'limit', p_limit,
            'offset', p_offset,
            'has_more', (v_total_count > p_offset + p_limit),
            'filters_applied', jsonb_build_object(
                'entity_type', p_entity_type,
                'entity_code', p_entity_code,
                'smart_code', p_smart_code,
                'status', p_status
            ),
            'includes', jsonb_build_object(
                'relationships', p_include_relationships,
                'dynamic_data', p_include_dynamic_data
            )
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Log error and re-raise
        RAISE WARNING 'HERA_ENTITY_READ_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION hera_entity_read_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_read_v1 TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION hera_entity_read_v1 IS 'HERA Universal Entity Read Function v1 - Fixed for actual schema without attributes and is_deleted columns';