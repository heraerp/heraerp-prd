-- ============================================================================
-- HERA Entity Delete Function v1
-- ============================================================================
-- Comprehensive entity delete function with support for:
-- - Soft delete (default)
-- - Hard delete (with cascade option)
-- - Dependency checking
-- - Recovery of soft-deleted entities
-- - Audit trail
--
-- Smart Code: HERA.DB.FUNCTION.ENTITY.DELETE.V1
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_entity_delete_v1(
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

    -- Check if already deleted (for soft delete)
    IF NOT p_hard_delete AND v_entity.is_deleted = TRUE THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'ENTITY_ALREADY_DELETED',
            'message', 'Entity is already soft deleted',
            'metadata', jsonb_build_object(
                'entity_id', p_entity_id,
                'deleted_at', v_entity.updated_at
            )
        );
    END IF;

    -- Count dependencies
    -- Count relationships
    SELECT COUNT(*) INTO v_relationship_count
    FROM core_relationships
    WHERE (from_entity_id = p_entity_id OR to_entity_id = p_entity_id)
    AND organization_id = p_organization_id
    AND is_deleted = FALSE;

    -- Count dynamic data
    SELECT COUNT(*) INTO v_dynamic_count
    FROM core_dynamic_data
    WHERE entity_id = p_entity_id
    AND organization_id = p_organization_id
    AND is_deleted = FALSE;

    -- Count child entities
    SELECT COUNT(*) INTO v_child_count
    FROM core_entities
    WHERE parent_entity_id = p_entity_id
    AND organization_id = p_organization_id
    AND is_deleted = FALSE;

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

            -- Recursively delete child entities
            WITH RECURSIVE entity_tree AS (
                SELECT id FROM core_entities
                WHERE id = p_entity_id
                UNION ALL
                SELECT e.id FROM core_entities e
                INNER JOIN entity_tree et ON e.parent_entity_id = et.id
                WHERE e.organization_id = p_organization_id
            )
            DELETE FROM core_entities
            WHERE id IN (SELECT id FROM entity_tree)
            AND organization_id = p_organization_id;
            GET DIAGNOSTICS v_deleted_children = ROW_COUNT;
            v_deleted_children := v_deleted_children - 1; -- Exclude the main entity
        ELSE
            -- Delete only the entity (non-cascade hard delete)
            DELETE FROM core_entities
            WHERE id = p_entity_id
            AND organization_id = p_organization_id;
        END IF;

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
            -- Soft delete relationships
            UPDATE core_relationships
            SET is_deleted = TRUE,
                updated_at = NOW(),
                updated_by = p_actor_user_id
            WHERE (from_entity_id = p_entity_id OR to_entity_id = p_entity_id)
            AND organization_id = p_organization_id
            AND is_deleted = FALSE;
            GET DIAGNOSTICS v_deleted_relationships = ROW_COUNT;

            -- Soft delete dynamic data
            UPDATE core_dynamic_data
            SET is_deleted = TRUE,
                updated_at = NOW(),
                updated_by = p_actor_user_id
            WHERE entity_id = p_entity_id
            AND organization_id = p_organization_id
            AND is_deleted = FALSE;
            GET DIAGNOSTICS v_deleted_dynamic = ROW_COUNT;

            -- Recursively soft delete child entities
            WITH RECURSIVE entity_tree AS (
                SELECT id FROM core_entities
                WHERE id = p_entity_id
                UNION ALL
                SELECT e.id FROM core_entities e
                INNER JOIN entity_tree et ON e.parent_entity_id = et.id
                WHERE e.organization_id = p_organization_id
                AND e.is_deleted = FALSE
            )
            UPDATE core_entities
            SET is_deleted = TRUE,
                status = 'deleted',
                updated_at = NOW(),
                updated_by = p_actor_user_id
            WHERE id IN (SELECT id FROM entity_tree)
            AND organization_id = p_organization_id;
            GET DIAGNOSTICS v_deleted_children = ROW_COUNT;
            v_deleted_children := v_deleted_children - 1; -- Exclude the main entity
        ELSE
            -- Soft delete only the entity
            UPDATE core_entities
            SET is_deleted = TRUE,
                status = 'deleted',
                updated_at = NOW(),
                updated_by = p_actor_user_id
            WHERE id = p_entity_id
            AND organization_id = p_organization_id;
        END IF;

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
                'soft_deleted_dynamic_data', v_deleted_dynamic,
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
        RAISE;
END;
$$;

-- ============================================================================
-- HERA Entity Recover Function v1
-- ============================================================================
-- Recover soft-deleted entities
-- ============================================================================

CREATE OR REPLACE FUNCTION hera_entity_recover_v1(
    p_organization_id UUID,
    p_entity_id UUID,
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
    v_recovered_relationships INTEGER := 0;
    v_recovered_dynamic INTEGER := 0;
    v_recovered_children INTEGER := 0;
BEGIN
    -- Validate inputs
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_RECOVER: organization_id is required';
    END IF;

    IF p_entity_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_RECOVER: entity_id is required';
    END IF;

    -- Get entity details
    SELECT * INTO v_entity
    FROM core_entities
    WHERE id = p_entity_id
    AND organization_id = p_organization_id;

    IF v_entity IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_NOT_FOUND: Entity % not found', p_entity_id;
    END IF;

    -- Check if entity is deleted
    IF v_entity.is_deleted = FALSE THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'ENTITY_NOT_DELETED',
            'message', 'Entity is not deleted and cannot be recovered'
        );
    END IF;

    -- Recover entity
    UPDATE core_entities
    SET is_deleted = FALSE,
        status = 'active',
        updated_at = NOW(),
        updated_by = p_actor_user_id
    WHERE id = p_entity_id
    AND organization_id = p_organization_id;

    IF p_cascade THEN
        -- Recover relationships
        UPDATE core_relationships
        SET is_deleted = FALSE,
            updated_at = NOW(),
            updated_by = p_actor_user_id
        WHERE (from_entity_id = p_entity_id OR to_entity_id = p_entity_id)
        AND organization_id = p_organization_id
        AND is_deleted = TRUE;
        GET DIAGNOSTICS v_recovered_relationships = ROW_COUNT;

        -- Recover dynamic data
        UPDATE core_dynamic_data
        SET is_deleted = FALSE,
            updated_at = NOW(),
            updated_by = p_actor_user_id
        WHERE entity_id = p_entity_id
        AND organization_id = p_organization_id
        AND is_deleted = TRUE;
        GET DIAGNOSTICS v_recovered_dynamic = ROW_COUNT;

        -- Recursively recover child entities
        WITH RECURSIVE entity_tree AS (
            SELECT id FROM core_entities
            WHERE id = p_entity_id
            UNION ALL
            SELECT e.id FROM core_entities e
            INNER JOIN entity_tree et ON e.parent_entity_id = et.id
            WHERE e.organization_id = p_organization_id
            AND e.is_deleted = TRUE
        )
        UPDATE core_entities
        SET is_deleted = FALSE,
            status = 'active',
            updated_at = NOW(),
            updated_by = p_actor_user_id
        WHERE id IN (SELECT id FROM entity_tree)
        AND organization_id = p_organization_id
        AND id != p_entity_id;
        GET DIAGNOSTICS v_recovered_children = ROW_COUNT;
    END IF;

    -- Return result
    RETURN jsonb_build_object(
        'success', TRUE,
        'operation', 'recover',
        'recovered_entity', jsonb_build_object(
            'id', v_entity.id,
            'entity_type', v_entity.entity_type,
            'entity_name', v_entity.entity_name,
            'entity_code', v_entity.entity_code,
            'status', 'active'
        ),
        'metadata', jsonb_build_object(
            'cascade', p_cascade,
            'recovered_relationships', v_recovered_relationships,
            'recovered_dynamic_data', v_recovered_dynamic,
            'recovered_child_entities', v_recovered_children,
            'recovered_by', p_actor_user_id,
            'recovered_at', NOW()
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Log error and re-raise
        RAISE WARNING 'HERA_ENTITY_RECOVER_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION hera_entity_delete_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_delete_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_entity_recover_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_recover_v1 TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION hera_entity_delete_v1 IS 'HERA Universal Entity Delete Function v1 - Supports soft/hard delete with cascade options and dependency checking';
COMMENT ON FUNCTION hera_entity_recover_v1 IS 'HERA Universal Entity Recover Function v1 - Recover soft-deleted entities with optional cascade recovery';