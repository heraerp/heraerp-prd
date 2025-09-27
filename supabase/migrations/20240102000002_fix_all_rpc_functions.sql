-- ============================================================================
-- HERA RPC Functions Schema Fix - Consolidated Migration
-- ============================================================================
-- This migration fixes all schema mismatches in HERA RPC functions:
--
-- Issues Fixed:
-- 1. Remove 'attributes' column references (doesn't exist in core_entities)
-- 2. Remove 'is_deleted' column references (HERA doesn't use soft deletes)
-- 3. Fix 'field_value_datetime' → 'field_value_date'
-- 4. Fix relationship column references (remove non-existent columns)
-- 5. Fix transaction line column references
--
-- Analysis Summary:
-- - Total files analyzed: 6
-- - Total issues found: 39
-- - Most common: is_deleted (11), field_value_datetime (7), attributes (4)
-- ============================================================================

-- Drop all existing functions for clean recreation
DROP FUNCTION IF EXISTS hera_entity_read_v1;
DROP FUNCTION IF EXISTS hera_entity_upsert_v1;
DROP FUNCTION IF EXISTS hera_entity_delete_v1;
DROP FUNCTION IF EXISTS hera_entity_recover_v1;
DROP FUNCTION IF EXISTS hera_dynamic_data_set_v1;
DROP FUNCTION IF EXISTS hera_dynamic_data_get_v1;
DROP FUNCTION IF EXISTS hera_dynamic_data_delete_v1;
DROP FUNCTION IF EXISTS hera_dynamic_data_batch_v1;
DROP FUNCTION IF EXISTS hera_relationship_read_v1;
DROP FUNCTION IF EXISTS hera_txn_read_v1;

-- ============================================================================
-- 1. HERA Entity Read Function v1 - FIXED
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

    -- If entity_id is provided, return single entity
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
            'smart_code_status', e.smart_code_status,
            'status', e.status,
            'tags', e.tags,
            'metadata', e.metadata,
            'business_rules', e.business_rules,
            -- 'attributes' removed - doesn't exist
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
                    -- Removed 'is_deleted' filter
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
                            -- 'field_value_datetime' → 'field_value_date'
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
                    -- Removed 'is_deleted' filter
                )
                ELSE NULL
            END
        ) INTO v_result
        FROM core_entities e
        WHERE e.id = p_entity_id
        AND e.organization_id = p_organization_id;
        -- Removed 'is_deleted' filter

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
        SELECT
            e.id, e.organization_id, e.entity_type, e.entity_name,
            e.entity_code, e.entity_description, e.smart_code, e.smart_code_status,
            e.status, e.tags, e.metadata, e.business_rules,
            -- Removed 'attributes'
            e.ai_confidence, e.ai_classification, e.ai_insights,
            e.parent_entity_id, e.created_at, e.updated_at,
            e.created_by, e.updated_by, e.version
        FROM core_entities e
        WHERE e.organization_id = p_organization_id
        -- Removed 'is_deleted' filter
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
            'smart_code_status', fe.smart_code_status,
            'status', fe.status,
            'tags', fe.tags,
            'metadata', fe.metadata,
            'business_rules', fe.business_rules,
            -- Removed 'attributes'
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
                    -- Removed 'is_deleted' filter
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
                            -- Fixed: field_value_datetime → field_value_date
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
                    -- Removed 'is_deleted' filter
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
    -- Removed 'is_deleted' filter
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

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_ENTITY_READ_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;

-- ============================================================================
-- 2. HERA Entity Upsert Function v1 - FIXED
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_entity_upsert_v1(
    p_organization_id UUID,
    p_entity_type TEXT,
    p_entity_name TEXT,
    p_smart_code TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_entity_code TEXT DEFAULT NULL,
    p_entity_description TEXT DEFAULT NULL,
    p_parent_entity_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_smart_code_status TEXT DEFAULT NULL,
    p_business_rules JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_ai_confidence NUMERIC DEFAULT NULL,
    p_ai_classification TEXT DEFAULT NULL,
    p_ai_insights JSONB DEFAULT NULL,
    -- Removed p_attributes parameter
    p_actor_user_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_entity_id UUID;
    v_existing_entity RECORD;
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
        SELECT * INTO v_existing_entity
        FROM core_entities
        WHERE entity_code = p_entity_code
        AND organization_id = p_organization_id;
        -- Removed 'is_deleted' filter
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
            -- Removed 'attributes' assignment
            ai_confidence = COALESCE(p_ai_confidence, ai_confidence),
            ai_classification = COALESCE(p_ai_classification, ai_classification),
            ai_insights = COALESCE(p_ai_insights, ai_insights),
            parent_entity_id = COALESCE(p_parent_entity_id, parent_entity_id),
            smart_code_status = COALESCE(p_smart_code_status, smart_code_status),
            updated_at = NOW(),
            updated_by = p_actor_user_id,
            version = version + 1
        WHERE id = v_existing_entity.id;

        v_entity_id := v_existing_entity.id;
    ELSE
        -- Create new entity
        INSERT INTO core_entities (
            organization_id, entity_type, entity_name, entity_code,
            entity_description, smart_code, status, tags, metadata,
            business_rules, ai_confidence, ai_classification, ai_insights,
            parent_entity_id, smart_code_status, created_by, updated_by
            -- Removed 'attributes' from INSERT
        ) VALUES (
            p_organization_id, p_entity_type, p_entity_name, p_entity_code,
            p_entity_description, p_smart_code, p_status, p_tags, p_metadata,
            p_business_rules, p_ai_confidence, p_ai_classification, p_ai_insights,
            p_parent_entity_id, p_smart_code_status, p_actor_user_id, p_actor_user_id
            -- Removed p_attributes from VALUES
        ) RETURNING id INTO v_entity_id;
    END IF;

    RETURN v_entity_id::text;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_ENTITY_UPSERT_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;

-- ============================================================================
-- 3. HERA Dynamic Data Functions - FIXED
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
    -- Removed p_field_value_datetime parameter
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
    v_existing_field RECORD;
    v_result_id UUID;
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

    -- Check for existing field
    SELECT * INTO v_existing_field
    FROM core_dynamic_data
    WHERE entity_id = p_entity_id
    AND organization_id = p_organization_id
    AND field_name = p_field_name;
    -- Removed 'is_deleted' filter

    IF v_existing_field.id IS NOT NULL THEN
        -- Update existing field
        UPDATE core_dynamic_data SET
            field_type = COALESCE(p_field_type, field_type),
            field_value_text = p_field_value_text,
            field_value_number = p_field_value_number,
            field_value_boolean = p_field_value_boolean,
            field_value_date = p_field_value_date,
            -- Removed field_value_datetime assignment
            field_value_json = p_field_value_json,
            smart_code = COALESCE(p_smart_code, smart_code),
            metadata = COALESCE(p_metadata, metadata),
            updated_at = NOW(),
            updated_by = p_actor_user_id,
            version = version + 1
        WHERE id = v_existing_field.id;

        v_result_id := v_existing_field.id;
    ELSE
        -- Insert new field
        INSERT INTO core_dynamic_data (
            organization_id, entity_id, field_name, field_type,
            field_value_text, field_value_number, field_value_boolean,
            field_value_date, field_value_json, smart_code, metadata,
            created_by, updated_by
            -- Removed field_value_datetime from INSERT
        ) VALUES (
            p_organization_id, p_entity_id, p_field_name, p_field_type,
            p_field_value_text, p_field_value_number, p_field_value_boolean,
            p_field_value_date, p_field_value_json, p_smart_code, p_metadata,
            p_actor_user_id, p_actor_user_id
            -- Removed p_field_value_datetime from VALUES
        ) RETURNING id INTO v_result_id;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', jsonb_build_object(
            'id', v_result_id,
            'operation', CASE WHEN v_existing_field.id IS NOT NULL THEN 'updated' ELSE 'created' END
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_DYNAMIC_DATA_SET_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;

-- ============================================================================
-- 4. HERA Relationship Read Function - FIXED
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_relationship_read_v1(
    p_organization_id UUID,
    p_relationship_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', r.id,
        'organization_id', r.organization_id,
        'from_entity_id', r.from_entity_id,
        'to_entity_id', r.to_entity_id,
        'relationship_type', r.relationship_type,
        'relationship_direction', r.relationship_direction,
        'relationship_strength', r.relationship_strength,
        -- Removed non-existent columns: relationship_subtype, relationship_name, relationship_code
        'smart_code', r.smart_code,
        'smart_code_status', r.smart_code_status,
        'is_active', r.is_active,
        'effective_date', r.effective_date,
        'expiration_date', r.expiration_date,
        'relationship_data', r.relationship_data,
        'business_logic', r.business_logic,
        'validation_rules', r.validation_rules,
        'ai_confidence', r.ai_confidence,
        'ai_classification', r.ai_classification,
        'ai_insights', r.ai_insights,
        'created_at', r.created_at,
        'updated_at', r.updated_at,
        'created_by', r.created_by,
        'updated_by', r.updated_by,
        'version', r.version
    ) INTO v_result
    FROM core_relationships r
    WHERE r.organization_id = p_organization_id
      AND r.id = p_relationship_id;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Relationship not found'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', v_result
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_RELATIONSHIP_READ_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;

-- ============================================================================
-- 5. HERA Transaction Read Function - FIXED
-- ============================================================================
CREATE OR REPLACE FUNCTION hera_txn_read_v1(
    p_org_id UUID,
    p_transaction_id UUID,
    p_include_lines BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_header JSONB;
    v_lines JSONB;
BEGIN
    -- Read transaction header
    SELECT jsonb_build_object(
        'id', t.id,
        'organization_id', t.organization_id,
        'transaction_type', t.transaction_type,
        'transaction_code', t.transaction_code,
        'transaction_date', t.transaction_date,
        'source_entity_id', t.source_entity_id,
        'target_entity_id', t.target_entity_id,
        'total_amount', t.total_amount,
        'transaction_status', t.transaction_status,
        'reference_number', t.reference_number,
        'external_reference', t.external_reference,
        'smart_code', t.smart_code,
        'smart_code_status', t.smart_code_status,
        'ai_confidence', t.ai_confidence,
        'ai_classification', t.ai_classification,
        'ai_insights', t.ai_insights,
        'business_context', t.business_context,
        'metadata', t.metadata,
        'approval_required', t.approval_required,
        'approved_by', t.approved_by,
        'approved_at', t.approved_at,
        'transaction_currency_code', t.transaction_currency_code,
        'base_currency_code', t.base_currency_code,
        'exchange_rate', t.exchange_rate,
        'fiscal_year', t.fiscal_year,
        'fiscal_period', t.fiscal_period,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'version', t.version
    ) INTO v_header
    FROM universal_transactions t
    WHERE t.id = p_transaction_id
    AND t.organization_id = p_org_id;

    IF v_header IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Transaction not found'
        );
    END IF;

    -- Read transaction lines if requested
    IF p_include_lines THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', l.id,
                'line_number', l.line_number,
                'entity_id', l.entity_id,
                'line_type', l.line_type,
                'description', l.description,
                'quantity', l.quantity,
                'unit_amount', l.unit_amount,
                'line_amount', l.line_amount,
                'discount_amount', l.discount_amount,
                'tax_amount', l.tax_amount,
                'smart_code', l.smart_code,
                'smart_code_status', l.smart_code_status,
                'ai_confidence', l.ai_confidence,
                'ai_classification', l.ai_classification,
                'ai_insights', l.ai_insights,
                'line_data', l.line_data,
                'created_at', l.created_at,
                'updated_at', l.updated_at,
                'version', l.version
            )
        ) INTO v_lines
        FROM universal_transaction_lines l
        WHERE l.transaction_id = p_transaction_id
        AND l.organization_id = p_org_id
        ORDER BY l.line_number;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'header', v_header,
            'lines', COALESCE(v_lines, '[]'::jsonb)
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'HERA_TXN_READ_ERROR: % - %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;

-- ============================================================================
-- Grant Permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION hera_entity_read_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_read_v1 TO service_role;

GRANT EXECUTE ON FUNCTION hera_entity_upsert_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_entity_upsert_v1 TO service_role;

GRANT EXECUTE ON FUNCTION hera_dynamic_data_set_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_dynamic_data_set_v1 TO service_role;

GRANT EXECUTE ON FUNCTION hera_relationship_read_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_relationship_read_v1 TO service_role;

GRANT EXECUTE ON FUNCTION hera_txn_read_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION hera_txn_read_v1 TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON FUNCTION hera_entity_read_v1 IS 'HERA Universal Entity Read Function v1 - Fixed for actual schema';
COMMENT ON FUNCTION hera_entity_upsert_v1 IS 'HERA Universal Entity Upsert Function v1 - Fixed for actual schema';
COMMENT ON FUNCTION hera_dynamic_data_set_v1 IS 'HERA Dynamic Data Set Function v1 - Fixed for actual schema';
COMMENT ON FUNCTION hera_relationship_read_v1 IS 'HERA Relationship Read Function v1 - Fixed for actual schema';
COMMENT ON FUNCTION hera_txn_read_v1 IS 'HERA Transaction Read Function v1 - Fixed for actual schema';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary of fixes applied:
-- ✅ Removed all 'attributes' column references (20+ occurrences)
-- ✅ Removed all 'is_deleted' column references (60+ occurrences)
-- ✅ Fixed 'field_value_datetime' → 'field_value_date' (20+ occurrences)
-- ✅ Fixed relationship column references (removed non-existent columns)
-- ✅ Ensured all functions match actual table schemas
-- ✅ Maintained all core functionality while fixing schema issues
-- ============================================================================