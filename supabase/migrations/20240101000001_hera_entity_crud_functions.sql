-- ============================================================================
-- HERA Entity CRUD Functions Migration
-- ============================================================================
-- This migration creates the database functions for entity CRUD operations:
-- - hera_entity_upsert_v1: Create or update entities
-- - hera_entity_read_v1: Read entities with filtering and pagination
-- - hera_entity_delete_v1: Delete entities with soft/hard delete options
-- - hera_entity_recover_v1: Recover soft-deleted entities
-- ============================================================================

-- Drop functions if they exist (for idempotency)
DROP FUNCTION IF EXISTS hera_entity_upsert_v1;
DROP FUNCTION IF EXISTS hera_entity_read_v1;
DROP FUNCTION IF EXISTS hera_entity_delete_v1;
DROP FUNCTION IF EXISTS hera_entity_recover_v1;

-- ============================================================================
-- HERA Entity Upsert Function v1
-- ============================================================================
-- Based on the API call signature from entity-upsert/route.ts
CREATE OR REPLACE FUNCTION hera_entity_upsert_v1(
    p_organization_id UUID,        -- $1
    p_entity_type TEXT,            -- $2
    p_entity_name TEXT,            -- $3
    p_smart_code TEXT,             -- $4
    p_entity_id UUID,              -- $5
    p_entity_code TEXT,            -- $6
    p_entity_description TEXT,     -- $7
    p_parent_entity_id UUID,       -- $8
    p_status TEXT,                 -- $9
    p_tags TEXT[],                 -- $10
    p_smart_code_status TEXT,      -- $11
    p_business_rules JSONB,        -- $12
    p_metadata JSONB,              -- $13
    p_ai_confidence NUMERIC,       -- $14
    p_ai_classification TEXT,      -- $15
    p_ai_insights JSONB,          -- $16
    p_attributes JSONB,           -- $17
    p_actor_user_id UUID          -- $18
)
RETURNS TEXT  -- Returns entity_id as text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_entity_id UUID;
    v_existing_entity RECORD;
    v_operation TEXT;
BEGIN
    -- Validate required fields
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_UPSERT: organization_id is required';
    END IF;

    IF p_entity_id IS NULL AND (p_entity_type IS NULL OR p_entity_name IS NULL OR p_smart_code IS NULL) THEN
        RAISE EXCEPTION 'HERA_ENTITY_UPSERT: entity_type, entity_name, and smart_code are required for new entities';
    END IF;

    -- Check for existing entity
    IF p_entity_id IS NOT NULL THEN
        SELECT * INTO v_existing_entity
        FROM core_entities
        WHERE id = p_entity_id
        AND organization_id = p_organization_id;

        IF v_existing_entity.id IS NULL THEN
            RAISE EXCEPTION 'HERA_ENTITY_NOT_FOUND: Entity % not found in organization %', p_entity_id, p_organization_id;
        END IF;
    ELSIF p_entity_code IS NOT NULL THEN
        -- Check if entity with same code exists
        SELECT * INTO v_existing_entity
        FROM core_entities
        WHERE entity_code = p_entity_code
        AND organization_id = p_organization_id
        AND is_deleted = FALSE;
    END IF;

    -- Perform upsert
    IF v_existing_entity.id IS NOT NULL THEN
        -- Update existing entity
        UPDATE core_entities SET
            entity_type = COALESCE(p_entity_type, entity_type),
            entity_name = COALESCE(p_entity_name, entity_name),
            entity_code = COALESCE(p_entity_code, entity_code),
            entity_description = COALESCE(p_entity_description, entity_description),
            smart_code = COALESCE(p_smart_code, smart_code),
            status = COALESCE(p_status, status),
            tags = COALESCE(p_tags, tags),
            metadata = COALESCE(p_metadata, metadata),
            business_rules = COALESCE(p_business_rules, business_rules),
            attributes = COALESCE(p_attributes, attributes),
            ai_confidence = COALESCE(p_ai_confidence, ai_confidence),
            ai_classification = COALESCE(p_ai_classification, ai_classification),
            ai_insights = COALESCE(p_ai_insights, ai_insights),
            parent_entity_id = COALESCE(p_parent_entity_id, parent_entity_id),
            updated_at = NOW(),
            updated_by = p_actor_user_id
        WHERE id = v_existing_entity.id
        RETURNING id INTO v_entity_id;

        v_operation := 'update';
    ELSE
        -- Create new entity
        v_entity_id := COALESCE(p_entity_id, gen_random_uuid());

        INSERT INTO core_entities (
            id,
            organization_id,
            entity_type,
            entity_name,
            entity_code,
            entity_description,
            smart_code,
            status,
            tags,
            metadata,
            business_rules,
            attributes,
            ai_confidence,
            ai_classification,
            ai_insights,
            parent_entity_id,
            created_by,
            updated_by,
            is_deleted
        ) VALUES (
            v_entity_id,
            p_organization_id,
            p_entity_type,
            p_entity_name,
            p_entity_code,
            p_entity_description,
            p_smart_code,
            COALESCE(p_status, 'active'),
            p_tags,
            COALESCE(p_metadata, '{}'::jsonb),
            COALESCE(p_business_rules, '{}'::jsonb),
            COALESCE(p_attributes, '{}'::jsonb),
            COALESCE(p_ai_confidence, 0),
            p_ai_classification,
            COALESCE(p_ai_insights, '{}'::jsonb),
            p_parent_entity_id,
            p_actor_user_id,
            p_actor_user_id,
            FALSE
        );

        v_operation := 'create';
    END IF;

    -- Return entity_id as text (as expected by the API)
    RETURN v_entity_id::text;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_ENTITY_UPSERT_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;

-- ============================================================================
-- HERA Entity Read Function v1
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
BEGIN
    -- Validate organization_id
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_READ: organization_id is required';
    END IF;

    -- Single entity read
    IF p_entity_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', e.id,
            'entity_id', e.id,
            'organization_id', e.organization_id,
            'entity_type', e.entity_type,
            'entity_name', e.entity_name,
            'entity_code', e.entity_code,
            'entity_description', e.entity_description,
            'smart_code', e.smart_code,
            'status', e.status,
            'tags', e.tags,
            'metadata', e.metadata,
            'business_rules', e.business_rules,
            'attributes', e.attributes,
            'ai_confidence', e.ai_confidence,
            'ai_classification', e.ai_classification,
            'ai_insights', e.ai_insights,
            'parent_entity_id', e.parent_entity_id,
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
                    AND r.is_deleted = FALSE
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
                            'metadata', dd.metadata
                        )
                    )
                    FROM core_dynamic_data dd
                    WHERE dd.entity_id = e.id
                    AND dd.organization_id = p_organization_id
                    AND dd.is_deleted = FALSE
                )
                ELSE NULL
            END
        ) INTO v_result
        FROM core_entities e
        WHERE e.id = p_entity_id
        AND e.organization_id = p_organization_id
        AND e.is_deleted = FALSE;

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
    WITH filtered_entities AS (
        SELECT e.*
        FROM core_entities e
        WHERE e.organization_id = p_organization_id
        AND e.is_deleted = FALSE
        AND (p_entity_type IS NULL OR e.entity_type = p_entity_type)
        AND (p_entity_code IS NULL OR e.entity_code = p_entity_code)
        AND (p_smart_code IS NULL OR e.smart_code = p_smart_code)
        AND (p_status IS NULL OR e.status = p_status)
        ORDER BY e.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    )
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
            'status', fe.status,
            'tags', fe.tags,
            'metadata', fe.metadata,
            'business_rules', fe.business_rules,
            'attributes', fe.attributes,
            'ai_confidence', fe.ai_confidence,
            'ai_classification', fe.ai_classification,
            'ai_insights', fe.ai_insights,
            'parent_entity_id', fe.parent_entity_id,
            'created_at', fe.created_at,
            'updated_at', fe.updated_at
        )
    ) INTO v_entities
    FROM filtered_entities fe;

    -- Get total count
    SELECT COUNT(*)::INTEGER INTO v_total_count
    FROM core_entities e
    WHERE e.organization_id = p_organization_id
    AND e.is_deleted = FALSE
    AND (p_entity_type IS NULL OR e.entity_type = p_entity_type)
    AND (p_entity_code IS NULL OR e.entity_code = p_entity_code)
    AND (p_smart_code IS NULL OR e.smart_code = p_smart_code)
    AND (p_status IS NULL OR e.status = p_status);

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', COALESCE(v_entities, '[]'::jsonb),
        'metadata', jsonb_build_object(
            'operation', 'read_multiple',
            'total', v_total_count,
            'limit', p_limit,
            'offset', p_offset,
            'has_more', (v_total_count > p_offset + p_limit)
        )
    );
END;
$$;

-- ============================================================================
-- HERA Entity Delete Function v1
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
    v_deleted_count INTEGER := 0;
BEGIN
    -- Validate inputs
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_DELETE: organization_id is required';
    END IF;

    IF p_entity_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_DELETE: entity_id is required';
    END IF;

    -- Get entity
    SELECT * INTO v_entity
    FROM core_entities
    WHERE id = p_entity_id
    AND organization_id = p_organization_id;

    IF v_entity IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_NOT_FOUND: Entity % not found', p_entity_id;
    END IF;

    -- Check if already soft deleted
    IF NOT p_hard_delete AND v_entity.is_deleted = TRUE THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'ENTITY_ALREADY_DELETED',
            'message', 'Entity is already soft deleted'
        );
    END IF;

    -- Count dependencies
    SELECT COUNT(*) INTO v_relationship_count
    FROM core_relationships
    WHERE (from_entity_id = p_entity_id OR to_entity_id = p_entity_id)
    AND organization_id = p_organization_id
    AND is_deleted = FALSE;

    SELECT COUNT(*) INTO v_dynamic_count
    FROM core_dynamic_data
    WHERE entity_id = p_entity_id
    AND organization_id = p_organization_id
    AND is_deleted = FALSE;

    SELECT COUNT(*) INTO v_child_count
    FROM core_entities
    WHERE parent_entity_id = p_entity_id
    AND organization_id = p_organization_id
    AND is_deleted = FALSE;

    -- Check cascade requirement
    IF NOT p_cascade AND (v_relationship_count > 0 OR v_child_count > 0) THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'ENTITY_HAS_DEPENDENCIES',
            'message', 'Entity has dependencies. Use cascade=true to delete all.',
            'metadata', jsonb_build_object(
                'relationships', v_relationship_count,
                'dynamic_data', v_dynamic_count,
                'child_entities', v_child_count
            )
        );
    END IF;

    -- Perform delete
    IF p_hard_delete THEN
        IF p_cascade THEN
            -- Delete all dependencies
            DELETE FROM core_relationships
            WHERE (from_entity_id = p_entity_id OR to_entity_id = p_entity_id)
            AND organization_id = p_organization_id;

            DELETE FROM core_dynamic_data
            WHERE entity_id = p_entity_id
            AND organization_id = p_organization_id;

            -- Delete child entities recursively
            WITH RECURSIVE entity_tree AS (
                SELECT id FROM core_entities WHERE id = p_entity_id
                UNION ALL
                SELECT e.id FROM core_entities e
                INNER JOIN entity_tree et ON e.parent_entity_id = et.id
                WHERE e.organization_id = p_organization_id
            )
            DELETE FROM core_entities
            WHERE id IN (SELECT id FROM entity_tree)
            AND organization_id = p_organization_id;
        ELSE
            DELETE FROM core_entities
            WHERE id = p_entity_id
            AND organization_id = p_organization_id;
        END IF;
    ELSE
        -- Soft delete
        IF p_cascade THEN
            UPDATE core_relationships
            SET is_deleted = TRUE, updated_at = NOW(), updated_by = p_actor_user_id
            WHERE (from_entity_id = p_entity_id OR to_entity_id = p_entity_id)
            AND organization_id = p_organization_id;

            UPDATE core_dynamic_data
            SET is_deleted = TRUE, updated_at = NOW(), updated_by = p_actor_user_id
            WHERE entity_id = p_entity_id
            AND organization_id = p_organization_id;

            WITH RECURSIVE entity_tree AS (
                SELECT id FROM core_entities WHERE id = p_entity_id
                UNION ALL
                SELECT e.id FROM core_entities e
                INNER JOIN entity_tree et ON e.parent_entity_id = et.id
                WHERE e.organization_id = p_organization_id
            )
            UPDATE core_entities
            SET is_deleted = TRUE, status = 'deleted',
                updated_at = NOW(), updated_by = p_actor_user_id
            WHERE id IN (SELECT id FROM entity_tree)
            AND organization_id = p_organization_id;
        ELSE
            UPDATE core_entities
            SET is_deleted = TRUE, status = 'deleted',
                updated_at = NOW(), updated_by = p_actor_user_id
            WHERE id = p_entity_id
            AND organization_id = p_organization_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'operation', CASE WHEN p_hard_delete THEN 'hard_delete' ELSE 'soft_delete' END,
        'entity_id', p_entity_id,
        'cascade', p_cascade,
        'metadata', jsonb_build_object(
            'entity_type', v_entity.entity_type,
            'entity_name', v_entity.entity_name,
            'deleted_by', p_actor_user_id,
            'deleted_at', NOW()
        )
    );
END;
$$;

-- ============================================================================
-- HERA Entity Recover Function v1
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
BEGIN
    -- Validate
    IF p_organization_id IS NULL OR p_entity_id IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_RECOVER: organization_id and entity_id required';
    END IF;

    -- Get entity
    SELECT * INTO v_entity
    FROM core_entities
    WHERE id = p_entity_id
    AND organization_id = p_organization_id;

    IF v_entity IS NULL THEN
        RAISE EXCEPTION 'HERA_ENTITY_NOT_FOUND: Entity % not found', p_entity_id;
    END IF;

    IF v_entity.is_deleted = FALSE THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'ENTITY_NOT_DELETED',
            'message', 'Entity is not deleted'
        );
    END IF;

    -- Recover entity
    UPDATE core_entities
    SET is_deleted = FALSE, status = 'active',
        updated_at = NOW(), updated_by = p_actor_user_id
    WHERE id = p_entity_id
    AND organization_id = p_organization_id;

    IF p_cascade THEN
        -- Recover relationships
        UPDATE core_relationships
        SET is_deleted = FALSE, updated_at = NOW(), updated_by = p_actor_user_id
        WHERE (from_entity_id = p_entity_id OR to_entity_id = p_entity_id)
        AND organization_id = p_organization_id;

        -- Recover dynamic data
        UPDATE core_dynamic_data
        SET is_deleted = FALSE, updated_at = NOW(), updated_by = p_actor_user_id
        WHERE entity_id = p_entity_id
        AND organization_id = p_organization_id;

        -- Recover child entities
        WITH RECURSIVE entity_tree AS (
            SELECT id FROM core_entities WHERE id = p_entity_id
            UNION ALL
            SELECT e.id FROM core_entities e
            INNER JOIN entity_tree et ON e.parent_entity_id = et.id
            WHERE e.organization_id = p_organization_id
        )
        UPDATE core_entities
        SET is_deleted = FALSE, status = 'active',
            updated_at = NOW(), updated_by = p_actor_user_id
        WHERE id IN (SELECT id FROM entity_tree)
        AND organization_id = p_organization_id;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'operation', 'recover',
        'entity_id', p_entity_id,
        'cascade', p_cascade,
        'metadata', jsonb_build_object(
            'entity_type', v_entity.entity_type,
            'entity_name', v_entity.entity_name,
            'recovered_by', p_actor_user_id,
            'recovered_at', NOW()
        )
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION hera_entity_upsert_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_upsert_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_entity_read_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_read_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_entity_delete_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_delete_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_entity_recover_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_recover_v1 TO service_role;

-- Add comments
COMMENT ON FUNCTION hera_entity_upsert_v1 IS 'HERA Universal Entity Upsert Function v1 - Create or update entities with automatic duplicate detection';
COMMENT ON FUNCTION hera_entity_read_v1 IS 'HERA Universal Entity Read Function v1 - Retrieve entities with filtering, pagination and relationship/dynamic data inclusion';
COMMENT ON FUNCTION hera_entity_delete_v1 IS 'HERA Universal Entity Delete Function v1 - Soft/hard delete entities with cascade options';
COMMENT ON FUNCTION hera_entity_recover_v1 IS 'HERA Universal Entity Recover Function v1 - Recover soft-deleted entities with optional cascade recovery';