-- ============================================================================
-- HERA Complete CRUD Functions Bundle
-- ============================================================================
-- This migration bundles all entity and dynamic data CRUD functions
-- Includes: Entity (upsert, read, delete, recover) + Dynamic Data (set, get, delete, batch)
-- ============================================================================

-- Drop existing functions for clean deployment
DROP FUNCTION IF EXISTS hera_entity_upsert_v1;
DROP FUNCTION IF EXISTS hera_entity_read_v1;
DROP FUNCTION IF EXISTS hera_entity_delete_v1;
DROP FUNCTION IF EXISTS hera_entity_recover_v1;
DROP FUNCTION IF EXISTS hera_dynamic_data_set_v1;
DROP FUNCTION IF EXISTS hera_dynamic_data_get_v1;
DROP FUNCTION IF EXISTS hera_dynamic_data_delete_v1;
DROP FUNCTION IF EXISTS hera_dynamic_data_batch_v1;

-- ============================================================================
-- PART 1: ENTITY CRUD FUNCTIONS
-- ============================================================================

-- ============================================================================
-- HERA Entity Upsert Function v1
-- ============================================================================
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
                            'metadata', dd.metadata,
                            'created_at', dd.created_at,
                            'updated_at', dd.updated_at
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
            e.status,
            e.tags,
            e.metadata,
            e.business_rules,
            e.attributes,
            e.ai_confidence,
            e.ai_classification,
            e.ai_insights,
            e.parent_entity_id,
            e.created_at,
            e.updated_at,
            e.created_by,
            e.updated_by
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
                'updated_at', fe.updated_at,
                'created_by', fe.created_by,
                'updated_by', fe.updated_by,
                'relationship_count', CASE
                    WHEN p_include_relationships THEN (
                        SELECT COUNT(*)::INTEGER
                        FROM core_relationships r
                        WHERE (r.from_entity_id = fe.id OR r.to_entity_id = fe.id)
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
                                'metadata', dd.metadata,
                                'created_at', dd.created_at,
                                'updated_at', dd.updated_at
                            )
                        )
                        FROM core_dynamic_data dd
                        WHERE dd.entity_id = fe.id
                        AND dd.organization_id = p_organization_id
                        AND dd.is_deleted = FALSE
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
    AND e.is_deleted = FALSE
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

-- ============================================================================
-- PART 2: DYNAMIC DATA CRUD FUNCTIONS
-- ============================================================================

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

-- ============================================================================
-- PART 3: PERMISSIONS
-- ============================================================================

-- Grant permissions for all functions
GRANT EXECUTE ON FUNCTION hera_entity_upsert_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_upsert_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_entity_read_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_read_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_entity_delete_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_delete_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_entity_recover_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_recover_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_set_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_set_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_get_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_get_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_delete_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_delete_v1 TO service_role;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_batch_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_batch_v1 TO service_role;

-- ============================================================================
-- PART 4: COMMENTS
-- ============================================================================

-- Add helpful comments
COMMENT ON FUNCTION hera_entity_upsert_v1 IS 'HERA Universal Entity Upsert Function v1 - Create or update entities with automatic duplicate detection';
COMMENT ON FUNCTION hera_entity_read_v1 IS 'HERA Universal Entity Read Function v1 - Retrieve entities with filtering, pagination and relationship/dynamic data inclusion';
COMMENT ON FUNCTION hera_entity_delete_v1 IS 'HERA Universal Entity Delete Function v1 - Soft/hard delete entities with cascade options';
COMMENT ON FUNCTION hera_entity_recover_v1 IS 'HERA Universal Entity Recover Function v1 - Recover soft-deleted entities with optional cascade recovery';
COMMENT ON FUNCTION hera_dynamic_data_set_v1 IS 'HERA Universal Dynamic Data Set Function v1 - Create or update custom field values';
COMMENT ON FUNCTION hera_dynamic_data_get_v1 IS 'HERA Universal Dynamic Data Get Function v1 - Retrieve custom field values for entities';
COMMENT ON FUNCTION hera_dynamic_data_delete_v1 IS 'HERA Universal Dynamic Data Delete Function v1 - Delete custom fields with soft/hard delete options';
COMMENT ON FUNCTION hera_dynamic_data_batch_v1 IS 'HERA Universal Dynamic Data Batch Function v1 - Batch operations for multiple fields';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================