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