-- ============================================
-- HERA V2 Entity Functions - Combined SQL
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================


-- ============================================
-- hera_entity_read_v2.sql
-- ============================================

-- ============================================================================
-- HERA Entity Read Function v2 - Fixed for actual schema
-- ============================================================================
-- Comprehensive entity read function with support for:
-- - Single entity by ID
-- - Multiple entities by filters
-- - Relationship counts
-- - Dynamic data inclusion
-- - Pagination support
--
-- Smart Code: HERA.DB.FUNCTION.ENTITY.READ.V2
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_entity_read_v2(
    p_organization_id UUID,
    p_entity_id UUID DEFAULT NULL,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_code TEXT DEFAULT NULL,
    p_smart_code TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'active',
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
            'smart_code', e.smart_code,
            'status', e.status,
            'metadata', e.metadata,
            'created_at', e.created_at,
            'updated_at', e.updated_at,
            'created_by', e.created_by,
            'updated_by', e.updated_by,
            'relationship_count', CASE
                WHEN p_include_relationships THEN (
                    SELECT COUNT(*)::INTEGER
                    FROM core_relationships r
                    WHERE (r.from_entity_id = e.id OR r.to_entity_id = e.id)
                    AND r.organization_id = p_organization_id
                    AND r.is_active = TRUE
                )
                ELSE NULL
            END,
            'dynamic_fields', CASE
                WHEN p_include_dynamic_data THEN (
                    SELECT jsonb_object_agg(
                        dd.field_name,
                        jsonb_build_object(
                            'value', COALESCE(
                                dd.field_value_text,
                                dd.field_value_number::text,
                                dd.field_value_boolean::text,
                                dd.field_value_date::text,
                                dd.field_value_json::text
                            ),
                            'type', dd.field_type,
                            'smart_code', dd.smart_code
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
        AND e.organization_id = p_organization_id
        AND (p_status = 'all' OR e.status = p_status);

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
            e.smart_code,
            e.status,
            e.metadata,
            e.created_at,
            e.updated_at,
            e.created_by,
            e.updated_by
        FROM core_entities e
        WHERE e.organization_id = p_organization_id
        AND (p_entity_type IS NULL OR e.entity_type = p_entity_type)
        AND (p_entity_code IS NULL OR e.entity_code = p_entity_code)
        AND (p_smart_code IS NULL OR e.smart_code = p_smart_code)
        AND (p_status IS NULL OR p_status = 'all' OR e.status = p_status)
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
                'smart_code', fe.smart_code,
                'status', fe.status,
                'metadata', fe.metadata,
                'created_at', fe.created_at,
                'updated_at', fe.updated_at,
                'created_by', fe.created_by,
                'updated_by', fe.updated_by,
                'relationship_count', CASE
                    WHEN p_include_relationships THEN (
                        SELECT COUNT(*)::INTEGER
                        FROM core_relationships r
                        WHERE (r.from_entity_id = fe.id OR r.to_entity_id = fe.id)
                        AND r.organization_id = p_organization_id
                        AND r.is_active = TRUE
                    )
                    ELSE NULL
                END,
                'dynamic_fields', CASE
                    WHEN p_include_dynamic_data THEN (
                        SELECT jsonb_object_agg(
                            dd.field_name,
                            jsonb_build_object(
                                'value', COALESCE(
                                    dd.field_value_text,
                                    dd.field_value_number::text,
                                    dd.field_value_boolean::text,
                                    dd.field_value_date::text,
                                    dd.field_value_json::text
                                ),
                                'type', dd.field_type,
                                'smart_code', dd.smart_code
                            )
                        )
                        FROM core_dynamic_data dd
                        WHERE dd.entity_id = fe.id
                        AND dd.organization_id = p_organization_id
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
    AND (p_entity_type IS NULL OR e.entity_type = p_entity_type)
    AND (p_entity_code IS NULL OR e.entity_code = p_entity_code)
    AND (p_smart_code IS NULL OR e.smart_code = p_smart_code)
    AND (p_status IS NULL OR p_status = 'all' OR e.status = p_status);

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
GRANT EXECUTE ON FUNCTION hera_entity_read_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_read_v2 TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION hera_entity_read_v2 IS 'HERA Universal Entity Read Function v2 - Fixed for actual schema columns';



-- ============================================
-- hera_entity_delete_v2.sql
-- ============================================

-- ============================================================================
-- HERA Entity Delete Function v2 - Fixed for actual schema
-- ============================================================================
-- Comprehensive entity delete function with support for:
-- - Soft delete (default) using status field
-- - Hard delete (with cascade option)
-- - Dependency checking
-- - Audit trail
--
-- Smart Code: HERA.DB.FUNCTION.ENTITY.DELETE.V2
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_entity_delete_v2(
    p_organization_id UUID,
    p_entity_id UUID,
    p_hard_delete BOOLEAN DEFAULT FALSE,
    p_cascade BOOLEAN DEFAULT FALSE,
    p_actor_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_entity RECORD;
    v_relationship_count INTEGER;
    v_dynamic_count INTEGER;
    v_child_count INTEGER;
    v_deleted_relationships INTEGER := 0;
    v_deleted_dynamic INTEGER := 0;
    v_deleted_children INTEGER := 0;
    v_result JSONB;
BEGIN
    -- Validate inputs
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_DELETE: organization_id is required';
    END IF;

    IF p_entity_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_DELETE: entity_id is required';
    END IF;

    -- Get entity details
    SELECT * INTO v_entity
    FROM core_entities
    WHERE id = p_entity_id
    AND organization_id = p_organization_id;

    IF v_entity IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_NOT_FOUND: Entity % not found in organization %',
            p_entity_id, p_organization_id;
    END IF;

    -- Check if already soft deleted
    IF NOT p_hard_delete AND v_entity.status = 'deleted' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'ENTITY_ALREADY_DELETED',
            'message', 'Entity is already deleted',
            'metadata', jsonb_build_object(
                'entity_id', p_entity_id,
                'status', v_entity.status
            )
        );
    END IF;

    -- Count dependencies
    -- Count relationships
    SELECT COUNT(*) INTO v_relationship_count
    FROM core_relationships
    WHERE (from_entity_id = p_entity_id OR to_entity_id = p_entity_id)
    AND organization_id = p_organization_id
    AND is_active = TRUE;

    -- Count dynamic data
    SELECT COUNT(*) INTO v_dynamic_count
    FROM core_dynamic_data
    WHERE entity_id = p_entity_id
    AND organization_id = p_organization_id;

    -- Count child entities (using parent_entity_id from metadata)
    SELECT COUNT(*) INTO v_child_count
    FROM core_entities
    WHERE metadata->>'parent_entity_id' = p_entity_id::text
    AND organization_id = p_organization_id
    AND status != 'deleted';

    -- Check dependencies if not cascading
    IF NOT p_cascade AND (v_relationship_count > 0 OR v_child_count > 0) THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'ENTITY_HAS_DEPENDENCIES',
            'message', 'Entity has dependencies. Use cascade=true to delete all dependencies.',
            'metadata', jsonb_build_object(
                'entity_id', p_entity_id,
                'relationship_count', v_relationship_count,
                'dynamic_data_count', v_dynamic_count,
                'child_entity_count', v_child_count
            )
        );
    END IF;

    -- Perform delete operation
    IF p_hard_delete THEN
        -- HARD DELETE
        IF p_cascade THEN
            -- Delete relationships
            DELETE FROM core_relationships
            WHERE (from_entity_id = p_entity_id OR to_entity_id = p_entity_id)
            AND organization_id = p_organization_id;
            GET DIAGNOSTICS v_deleted_relationships = ROW_COUNT;

            -- Delete dynamic data
            DELETE FROM core_dynamic_data
            WHERE entity_id = p_entity_id
            AND organization_id = p_organization_id;
            GET DIAGNOSTICS v_deleted_dynamic = ROW_COUNT;

            -- Delete child entities
            DELETE FROM core_entities
            WHERE metadata->>'parent_entity_id' = p_entity_id::text
            AND organization_id = p_organization_id;
            GET DIAGNOSTICS v_deleted_children = ROW_COUNT;
        END IF;
        
        -- Delete the main entity
        DELETE FROM core_entities
        WHERE id = p_entity_id
        AND organization_id = p_organization_id;

        -- Build result for hard delete
        v_result := jsonb_build_object(
            'success', TRUE,
            'operation', 'hard_delete',
            'deleted_entity', jsonb_build_object(
                'id', v_entity.id,
                'entity_type', v_entity.entity_type,
                'entity_name', v_entity.entity_name,
                'entity_code', v_entity.entity_code
            ),
            'metadata', jsonb_build_object(
                'cascade', p_cascade,
                'deleted_relationships', v_deleted_relationships,
                'deleted_dynamic_data', v_deleted_dynamic,
                'deleted_child_entities', v_deleted_children,
                'deleted_by', p_actor_user_id,
                'deleted_at', NOW()
            )
        );

    ELSE
        -- SOFT DELETE
        IF p_cascade THEN
            -- Soft delete relationships (deactivate)
            UPDATE core_relationships
            SET is_active = FALSE,
                updated_at = NOW(),
                updated_by = p_actor_user_id
            WHERE (from_entity_id = p_entity_id OR to_entity_id = p_entity_id)
            AND organization_id = p_organization_id
            AND is_active = TRUE;
            GET DIAGNOSTICS v_deleted_relationships = ROW_COUNT;

            -- We don't soft delete dynamic data - it follows the entity

            -- Soft delete child entities
            UPDATE core_entities
            SET status = 'deleted',
                updated_at = NOW(),
                updated_by = p_actor_user_id
            WHERE metadata->>'parent_entity_id' = p_entity_id::text
            AND organization_id = p_organization_id
            AND status != 'deleted';
            GET DIAGNOSTICS v_deleted_children = ROW_COUNT;
        END IF;
        
        -- Soft delete the main entity
        UPDATE core_entities
        SET status = 'archived', -- Use 'archived' for soft delete
            updated_at = NOW(),
            updated_by = p_actor_user_id
        WHERE id = p_entity_id
        AND organization_id = p_organization_id;

        -- Build result for soft delete
        v_result := jsonb_build_object(
            'success', TRUE,
            'operation', 'soft_delete',
            'deleted_entity', jsonb_build_object(
                'id', v_entity.id,
                'entity_type', v_entity.entity_type,
                'entity_name', v_entity.entity_name,
                'entity_code', v_entity.entity_code
            ),
            'metadata', jsonb_build_object(
                'cascade', p_cascade,
                'soft_deleted_relationships', v_deleted_relationships,
                'soft_deleted_child_entities', v_deleted_children,
                'deleted_by', p_actor_user_id,
                'deleted_at', NOW(),
                'recoverable', TRUE
            )
        );
    END IF;

    -- Return result
    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error and re-raise
        RAISE WARNING 'HERA_ENTITY_DELETE_ERROR: % - %', SQLERRM, SQLSTATE;
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM,
            'message', 'Failed to delete entity'
        );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION hera_entity_delete_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_delete_v2 TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION hera_entity_delete_v2 IS 'HERA Universal Entity Delete Function v2 - Fixed for actual schema, supports soft/hard delete with cascade options';



-- ============================================
-- End of combined SQL
-- ============================================
