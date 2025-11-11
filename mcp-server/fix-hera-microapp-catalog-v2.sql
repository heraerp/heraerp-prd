-- Fix for hera_microapp_catalog_v2
-- Issue: Using r.status which doesn't exist, should use r.is_active
-- Issue: Operation validation should accept READ instead of requiring GET

CREATE OR REPLACE FUNCTION public.hera_microapp_catalog_v2(
    p_actor_user_id   uuid,
    p_organization_id uuid,
    p_operation       text,           -- LIST, READ, CREATE, UPDATE, DELETE
    p_filters         jsonb DEFAULT NULL,
    p_app_definition  jsonb DEFAULT NULL,
    p_options         jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result              jsonb;
    v_app_record          record;
    v_catalog_entity_id   uuid;
    v_error_code          text;
    v_error_message       text;
    v_timestamp           timestamptz := NOW();
BEGIN
    -- ============================================================================
    -- GUARDRAIL: Only platform organization can manage catalog
    -- ============================================================================
    IF p_organization_id != '00000000-0000-0000-0000-000000000000' THEN
        RETURN jsonb_build_object(
            'success', false,
            'operation', p_operation,
            'error', 'CATALOG_OPERATION_FAILED',
            'message', 'Catalog operations only allowed in platform organization',
            'audit', jsonb_build_object(
                'timestamp', v_timestamp,
                'actor_user_id', p_actor_user_id,
                'organization_id', p_organization_id,
                'error_details', 'P0001'
            )
        );
    END IF;

    -- ============================================================================
    -- OPERATION: LIST - List all available apps or filter by criteria
    -- ============================================================================
    IF p_operation = 'LIST' THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', e.id,
                'app_code', e.entity_code,
                'app_name', e.entity_name,
                'app_version', dd_version.field_value_text,
                'description', e.entity_description,
                'category', dd_category.field_value_text,
                'capabilities', dd_capabilities.field_value_json,
                'pricing', dd_pricing.field_value_json,
                'is_active', r.is_active,  -- ✅ FIXED: was r.status
                'created_at', e.created_at,
                'updated_at', e.updated_at
            )
        )
        INTO v_result
        FROM core_entities e
        LEFT JOIN core_dynamic_data dd_version
          ON dd_version.entity_id = e.id
          AND dd_version.field_name = 'app_version'
        LEFT JOIN core_dynamic_data dd_category
          ON dd_category.entity_id = e.id
          AND dd_category.field_name = 'category'
        LEFT JOIN core_dynamic_data dd_capabilities
          ON dd_capabilities.entity_id = e.id
          AND dd_capabilities.field_name = 'capabilities'
        LEFT JOIN core_dynamic_data dd_pricing
          ON dd_pricing.entity_id = e.id
          AND dd_pricing.field_name = 'pricing'
        LEFT JOIN core_relationships r
          ON r.from_entity_id = e.id
          AND r.relationship_type = 'CATALOG_ENTRY'
        WHERE e.entity_type = 'MICROAPP'
          AND e.organization_id = p_organization_id
          AND (p_filters IS NULL OR
               (p_filters->>'category' IS NULL OR dd_category.field_value_text = p_filters->>'category') AND
               (p_filters->>'is_active' IS NULL OR r.is_active = (p_filters->>'is_active')::boolean));  -- ✅ FIXED: was r.status

        RETURN jsonb_build_object(
            'success', true,
            'operation', 'LIST',
            'data', COALESCE(v_result, '[]'::jsonb),
            'audit', jsonb_build_object(
                'timestamp', v_timestamp,
                'actor_user_id', p_actor_user_id,
                'organization_id', p_organization_id
            )
        );
    END IF;

    -- ============================================================================
    -- OPERATION: READ - Get specific app by code  (✅ FIXED: was GET)
    -- ============================================================================
    IF p_operation = 'READ' THEN
        IF p_filters IS NULL OR p_filters->>'app_code' IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'operation', 'READ',
                'error', 'VALIDATION_FAILED',
                'message', 'app_code required in filters for READ operation',
                'audit', jsonb_build_object(
                    'timestamp', v_timestamp,
                    'actor_user_id', p_actor_user_id,
                    'organization_id', p_organization_id
                )
            );
        END IF;

        SELECT jsonb_build_object(
            'id', e.id,
            'app_code', e.entity_code,
            'app_name', e.entity_name,
            'app_version', dd_version.field_value_text,
            'description', e.entity_description,
            'category', dd_category.field_value_text,
            'capabilities', dd_capabilities.field_value_json,
            'pricing', dd_pricing.field_value_json,
            'requirements', dd_requirements.field_value_json,
            'metadata', dd_metadata.field_value_json,
            'is_active', r.is_active,  -- ✅ FIXED: was r.status
            'created_at', e.created_at,
            'updated_at', e.updated_at
        )
        INTO v_result
        FROM core_entities e
        LEFT JOIN core_dynamic_data dd_version
          ON dd_version.entity_id = e.id AND dd_version.field_name = 'app_version'
        LEFT JOIN core_dynamic_data dd_category
          ON dd_category.entity_id = e.id AND dd_category.field_name = 'category'
        LEFT JOIN core_dynamic_data dd_capabilities
          ON dd_capabilities.entity_id = e.id AND dd_capabilities.field_name = 'capabilities'
        LEFT JOIN core_dynamic_data dd_pricing
          ON dd_pricing.entity_id = e.id AND dd_pricing.field_name = 'pricing'
        LEFT JOIN core_dynamic_data dd_requirements
          ON dd_requirements.entity_id = e.id AND dd_requirements.field_name = 'requirements'
        LEFT JOIN core_dynamic_data dd_metadata
          ON dd_metadata.entity_id = e.id AND dd_metadata.field_name = 'metadata'
        LEFT JOIN core_relationships r
          ON r.from_entity_id = e.id AND r.relationship_type = 'CATALOG_ENTRY'
        WHERE e.entity_type = 'MICROAPP'
          AND e.entity_code = p_filters->>'app_code'
          AND e.organization_id = p_organization_id;

        IF v_result IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'operation', 'READ',
                'error', 'NOT_FOUND',
                'message', format('App not found: %s', p_filters->>'app_code'),
                'audit', jsonb_build_object(
                    'timestamp', v_timestamp,
                    'actor_user_id', p_actor_user_id,
                    'organization_id', p_organization_id
                )
            );
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'operation', 'READ',
            'data', v_result,
            'audit', jsonb_build_object(
                'timestamp', v_timestamp,
                'actor_user_id', p_actor_user_id,
                'organization_id', p_organization_id
            )
        );
    END IF;

    -- ============================================================================
    -- OPERATION: CREATE - Register new app in catalog
    -- ============================================================================
    IF p_operation = 'CREATE' THEN
        IF p_app_definition IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'operation', 'CREATE',
                'error', 'VALIDATION_FAILED',
                'message', 'app_definition required for CREATE operation',
                'audit', jsonb_build_object(
                    'timestamp', v_timestamp,
                    'actor_user_id', p_actor_user_id,
                    'organization_id', p_organization_id
                )
            );
        END IF;

        -- Create MICROAPP entity
        INSERT INTO core_entities (
            entity_type,
            entity_code,
            entity_name,
            entity_description,
            organization_id,
            smart_code,
            created_by,
            updated_by
        )
        VALUES (
            'MICROAPP',
            p_app_definition->>'app_code',
            p_app_definition->>'app_name',
            p_app_definition->>'description',
            p_organization_id,
            'HERA.PLATFORM.MICROAPP.CATALOG.v1',
            p_actor_user_id,
            p_actor_user_id
        )
        RETURNING id INTO v_catalog_entity_id;

        -- Store dynamic fields
        IF p_app_definition->>'app_version' IS NOT NULL THEN
            INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_text, organization_id, smart_code, created_by, updated_by)
            VALUES (v_catalog_entity_id, 'app_version', 'text', p_app_definition->>'app_version', p_organization_id, 'HERA.PLATFORM.MICROAPP.VERSION.v1', p_actor_user_id, p_actor_user_id);
        END IF;

        IF p_app_definition->>'category' IS NOT NULL THEN
            INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_text, organization_id, smart_code, created_by, updated_by)
            VALUES (v_catalog_entity_id, 'category', 'text', p_app_definition->>'category', p_organization_id, 'HERA.PLATFORM.MICROAPP.CATEGORY.v1', p_actor_user_id, p_actor_user_id);
        END IF;

        IF p_app_definition->'capabilities' IS NOT NULL THEN
            INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, organization_id, smart_code, created_by, updated_by)
            VALUES (v_catalog_entity_id, 'capabilities', 'json', p_app_definition->'capabilities', p_organization_id, 'HERA.PLATFORM.MICROAPP.CAPABILITIES.v1', p_actor_user_id, p_actor_user_id);
        END IF;

        IF p_app_definition->'pricing' IS NOT NULL THEN
            INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, organization_id, smart_code, created_by, updated_by)
            VALUES (v_catalog_entity_id, 'pricing', 'json', p_app_definition->'pricing', p_organization_id, 'HERA.PLATFORM.MICROAPP.PRICING.v1', p_actor_user_id, p_actor_user_id);
        END IF;

        -- Create catalog entry relationship
        INSERT INTO core_relationships (
            from_entity_id,
            to_entity_id,
            relationship_type,
            organization_id,
            smart_code,
            is_active,  -- ✅ FIXED: using is_active instead of status
            created_by,
            updated_by
        )
        VALUES (
            v_catalog_entity_id,
            v_catalog_entity_id, -- Self-reference for catalog
            'CATALOG_ENTRY',
            p_organization_id,
            'HERA.PLATFORM.MICROAPP.CATALOG.ENTRY.v1',
            true,
            p_actor_user_id,
            p_actor_user_id
        );

        RETURN jsonb_build_object(
            'success', true,
            'operation', 'CREATE',
            'data', jsonb_build_object(
                'id', v_catalog_entity_id,
                'app_code', p_app_definition->>'app_code',
                'app_name', p_app_definition->>'app_name'
            ),
            'audit', jsonb_build_object(
                'timestamp', v_timestamp,
                'actor_user_id', p_actor_user_id,
                'organization_id', p_organization_id
            )
        );
    END IF;

    -- ============================================================================
    -- OPERATION: UPDATE - Update app definition
    -- ============================================================================
    IF p_operation = 'UPDATE' THEN
        IF p_app_definition IS NULL OR p_app_definition->>'app_code' IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'operation', 'UPDATE',
                'error', 'VALIDATION_FAILED',
                'message', 'app_definition with app_code required for UPDATE operation',
                'audit', jsonb_build_object(
                    'timestamp', v_timestamp,
                    'actor_user_id', p_actor_user_id,
                    'organization_id', p_organization_id
                )
            );
        END IF;

        -- Get entity ID
        SELECT id INTO v_catalog_entity_id
        FROM core_entities
        WHERE entity_type = 'MICROAPP'
          AND entity_code = p_app_definition->>'app_code'
          AND organization_id = p_organization_id;

        IF v_catalog_entity_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'operation', 'UPDATE',
                'error', 'NOT_FOUND',
                'message', format('App not found: %s', p_app_definition->>'app_code'),
                'audit', jsonb_build_object(
                    'timestamp', v_timestamp,
                    'actor_user_id', p_actor_user_id,
                    'organization_id', p_organization_id
                )
            );
        END IF;

        -- Update entity
        UPDATE core_entities
        SET
            entity_name = COALESCE(p_app_definition->>'app_name', entity_name),
            entity_description = COALESCE(p_app_definition->>'description', entity_description),
            updated_by = p_actor_user_id,
            updated_at = v_timestamp
        WHERE id = v_catalog_entity_id;

        -- Update dynamic fields (upsert pattern)
        IF p_app_definition->>'app_version' IS NOT NULL THEN
            INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_text, organization_id, smart_code, created_by, updated_by)
            VALUES (v_catalog_entity_id, 'app_version', 'text', p_app_definition->>'app_version', p_organization_id, 'HERA.PLATFORM.MICROAPP.VERSION.v1', p_actor_user_id, p_actor_user_id)
            ON CONFLICT (entity_id, field_name, organization_id) DO UPDATE
            SET field_value_text = EXCLUDED.field_value_text, updated_by = p_actor_user_id, updated_at = v_timestamp;
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'operation', 'UPDATE',
            'data', jsonb_build_object(
                'id', v_catalog_entity_id,
                'app_code', p_app_definition->>'app_code',
                'updated_at', v_timestamp
            ),
            'audit', jsonb_build_object(
                'timestamp', v_timestamp,
                'actor_user_id', p_actor_user_id,
                'organization_id', p_organization_id
            )
        );
    END IF;

    -- ============================================================================
    -- OPERATION: DELETE - Remove app from catalog
    -- ============================================================================
    IF p_operation = 'DELETE' THEN
        IF p_filters IS NULL OR p_filters->>'app_code' IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'operation', 'DELETE',
                'error', 'VALIDATION_FAILED',
                'message', 'app_code required in filters for DELETE operation',
                'audit', jsonb_build_object(
                    'timestamp', v_timestamp,
                    'actor_user_id', p_actor_user_id,
                    'organization_id', p_organization_id
                )
            );
        END IF;

        -- Get entity ID
        SELECT id INTO v_catalog_entity_id
        FROM core_entities
        WHERE entity_type = 'MICROAPP'
          AND entity_code = p_filters->>'app_code'
          AND organization_id = p_organization_id;

        IF v_catalog_entity_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'operation', 'DELETE',
                'error', 'NOT_FOUND',
                'message', format('App not found: %s', p_filters->>'app_code'),
                'audit', jsonb_build_object(
                    'timestamp', v_timestamp,
                    'actor_user_id', p_actor_user_id,
                    'organization_id', p_organization_id
                )
            );
        END IF;

        -- Soft delete: Deactivate catalog entry
        UPDATE core_relationships
        SET is_active = false,  -- ✅ FIXED: was setting status
            updated_by = p_actor_user_id,
            updated_at = v_timestamp
        WHERE from_entity_id = v_catalog_entity_id
          AND relationship_type = 'CATALOG_ENTRY';

        RETURN jsonb_build_object(
            'success', true,
            'operation', 'DELETE',
            'data', jsonb_build_object(
                'id', v_catalog_entity_id,
                'app_code', p_filters->>'app_code',
                'deleted_at', v_timestamp
            ),
            'audit', jsonb_build_object(
                'timestamp', v_timestamp,
                'actor_user_id', p_actor_user_id,
                'organization_id', p_organization_id
            )
        );
    END IF;

    -- ============================================================================
    -- INVALID OPERATION
    -- ============================================================================
    RETURN jsonb_build_object(
        'success', false,
        'operation', p_operation,
        'error', 'CATALOG_OPERATION_FAILED',
        'message', format('Invalid operation: %s. Allowed: CREATE, READ, UPDATE, DELETE, LIST', p_operation),
        'audit', jsonb_build_object(
            'timestamp', v_timestamp,
            'actor_user_id', p_actor_user_id,
            'organization_id', p_organization_id,
            'error_details', 'P0001'
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS
            v_error_code = RETURNED_SQLSTATE,
            v_error_message = MESSAGE_TEXT;

        RETURN jsonb_build_object(
            'success', false,
            'operation', p_operation,
            'error', 'CATALOG_OPERATION_FAILED',
            'message', v_error_message,
            'audit', jsonb_build_object(
                'timestamp', v_timestamp,
                'actor_user_id', p_actor_user_id,
                'organization_id', p_organization_id,
                'error_details', v_error_code
            )
        );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.hera_microapp_catalog_v2(uuid, uuid, text, jsonb, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hera_microapp_catalog_v2(uuid, uuid, text, jsonb, jsonb, jsonb) TO service_role;

COMMENT ON FUNCTION public.hera_microapp_catalog_v2 IS 'Microapp catalog management RPC - Fixed r.status -> r.is_active and GET -> READ';
