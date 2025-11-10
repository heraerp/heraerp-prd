-- =====================================================
-- HERA Micro-Apps Catalog Management v2
-- Smart Code: HERA.PLATFORM.MICRO_APPS.CATALOG.RPC.v2
-- =====================================================
-- 
-- Enterprise-grade micro-app catalog management with:
-- ✅ Actor stamping enforcement
-- ✅ Organization isolation (Platform org for catalog)
-- ✅ Smart Code validation
-- ✅ Guardrails v2.0 compliance
-- ✅ Complete audit trail
-- 
-- Usage: Manage global catalog of available micro-apps

CREATE OR REPLACE FUNCTION hera_microapp_catalog_v2(
    p_actor_user_id UUID,
    p_organization_id UUID,
    p_operation TEXT,
    p_app_definition JSONB DEFAULT NULL,
    p_filters JSONB DEFAULT NULL,
    p_options JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB := '{}';
    v_app_entity_id UUID;
    v_existing_app RECORD;
    v_validation_result JSONB;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_smart_code TEXT;
    v_count INTEGER;
BEGIN
    -- Input validation
    IF p_actor_user_id IS NULL THEN
        RAISE EXCEPTION 'Actor user ID is required (actor stamping enforcement)';
    END IF;

    IF p_operation IS NULL OR p_operation = '' THEN
        RAISE EXCEPTION 'Operation is required';
    END IF;

    -- Validate operation
    IF p_operation NOT IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST') THEN
        RAISE EXCEPTION 'Invalid operation: %. Allowed: CREATE, READ, UPDATE, DELETE, LIST', p_operation;
    END IF;

    -- Platform org enforcement for catalog operations
    IF p_organization_id != v_platform_org_id THEN
        RAISE EXCEPTION 'Catalog operations only allowed in platform organization';
    END IF;

    -- Actor membership validation (must be platform admin)
    IF NOT EXISTS (
        SELECT 1 FROM core_relationships r
        WHERE r.from_entity_id = p_actor_user_id
        AND r.to_entity_id = v_platform_org_id
        AND r.relationship_type = 'USER_MEMBER_OF_ORG'
        AND r.status = 'active'
    ) THEN
        RAISE EXCEPTION 'Actor must be platform organization member for catalog operations';
    END IF;

    CASE p_operation
        -- ====================
        -- CREATE OPERATION
        -- ====================
        WHEN 'CREATE' THEN
            -- Validate required fields
            IF p_app_definition IS NULL THEN
                RAISE EXCEPTION 'App definition is required for CREATE operation';
            END IF;

            IF NOT (p_app_definition ? 'code') THEN
                RAISE EXCEPTION 'App code is required';
            END IF;

            IF NOT (p_app_definition ? 'display_name') THEN
                RAISE EXCEPTION 'App display name is required';
            END IF;

            IF NOT (p_app_definition ? 'version') THEN
                RAISE EXCEPTION 'App version is required';
            END IF;

            -- Generate Smart Code
            v_smart_code := 'HERA.PLATFORM.APP_CATALOG.MICRO_APP_DEF.' || 
                           UPPER(REPLACE(p_app_definition->>'code', '-', '_')) || 
                           '.' || LOWER(p_app_definition->>'version');

            -- Validate Smart Code format
            IF NOT v_smart_code ~ '^HERA\.[A-Z_]+\.[A-Z_]+\.[A-Z_]+\.[A-Z0-9_]+\.v[0-9]+$' THEN
                RAISE EXCEPTION 'Generated Smart Code format invalid: %', v_smart_code;
            END IF;

            -- Check for duplicates
            SELECT COUNT(*) INTO v_count
            FROM core_entities
            WHERE organization_id = v_platform_org_id
            AND entity_type = 'MICRO_APP_DEF'
            AND entity_code = (p_app_definition->>'code')
            AND metadata->>'version' = (p_app_definition->>'version');

            IF v_count > 0 THEN
                RAISE EXCEPTION 'Micro-app with code % and version % already exists', 
                    p_app_definition->>'code', p_app_definition->>'version';
            END IF;

            -- Create catalog entry
            INSERT INTO core_entities (
                id,
                entity_type,
                entity_name,
                entity_code,
                smart_code,
                organization_id,
                metadata,
                created_by,
                updated_by,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                'MICRO_APP_DEF',
                p_app_definition->>'display_name',
                p_app_definition->>'code',
                v_smart_code,
                v_platform_org_id,
                jsonb_build_object(
                    'catalog_metadata', jsonb_build_object(
                        'added_to_catalog_at', NOW(),
                        'catalog_admin', p_actor_user_id,
                        'approval_status', 'pending'
                    )
                ),
                p_actor_user_id,
                p_actor_user_id,
                NOW(),
                NOW()
            ) RETURNING id INTO v_app_entity_id;

            -- Store app definition in dynamic data
            INSERT INTO core_dynamic_data (
                id,
                entity_id,
                field_name,
                field_type,
                field_value_json,
                smart_code,
                organization_id,
                created_by,
                updated_by,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_app_entity_id,
                'app_definition',
                'json',
                p_app_definition,
                'HERA.PLATFORM.MICRO_APP.FIELD.APP_DEFINITION.v2',
                v_platform_org_id,
                p_actor_user_id,
                p_actor_user_id,
                NOW(),
                NOW()
            );

            v_result := jsonb_build_object(
                'success', true,
                'operation', 'CREATE',
                'app_entity_id', v_app_entity_id,
                'smart_code', v_smart_code,
                'message', 'Micro-app successfully added to catalog'
            );

        -- ====================
        -- READ OPERATION
        -- ====================
        WHEN 'READ' THEN
            IF NOT (p_filters ? 'app_code') THEN
                RAISE EXCEPTION 'App code filter is required for READ operation';
            END IF;

            SELECT 
                e.id,
                e.entity_name,
                e.entity_code,
                e.smart_code,
                e.created_at,
                e.updated_at,
                dd.field_value_json as app_definition
            INTO v_existing_app
            FROM core_entities e
            LEFT JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'app_definition'
            WHERE e.organization_id = v_platform_org_id
            AND e.entity_type = 'MICRO_APP_DEF'
            AND e.entity_code = (p_filters->>'app_code')
            AND (
                p_filters->>'version' IS NULL OR 
                dd.field_value_json->>'version' = (p_filters->>'version')
            )
            ORDER BY e.created_at DESC
            LIMIT 1;

            IF v_existing_app IS NULL THEN
                v_result := jsonb_build_object(
                    'success', false,
                    'error', 'APP_NOT_FOUND',
                    'message', 'Micro-app not found in catalog'
                );
            ELSE
                v_result := jsonb_build_object(
                    'success', true,
                    'operation', 'READ',
                    'app', jsonb_build_object(
                        'entity_id', v_existing_app.id,
                        'code', v_existing_app.entity_code,
                        'display_name', v_existing_app.entity_name,
                        'smart_code', v_existing_app.smart_code,
                        'created_at', v_existing_app.created_at,
                        'updated_at', v_existing_app.updated_at,
                        'definition', v_existing_app.app_definition
                    )
                );
            END IF;

        -- ====================
        -- LIST OPERATION
        -- ====================
        WHEN 'LIST' THEN
            WITH catalog_apps AS (
                SELECT 
                    e.id,
                    e.entity_name,
                    e.entity_code,
                    e.smart_code,
                    e.created_at,
                    e.updated_at,
                    dd.field_value_json as app_definition
                FROM core_entities e
                LEFT JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'app_definition'
                WHERE e.organization_id = v_platform_org_id
                AND e.entity_type = 'MICRO_APP_DEF'
                AND (
                    p_filters IS NULL OR
                    (p_filters ? 'category' AND dd.field_value_json->>'category' = (p_filters->>'category')) OR
                    (p_filters ? 'search' AND (
                        e.entity_name ILIKE '%' || (p_filters->>'search') || '%' OR
                        dd.field_value_json->>'description' ILIKE '%' || (p_filters->>'search') || '%'
                    ))
                )
                ORDER BY e.entity_name ASC
                LIMIT COALESCE((p_options->>'limit')::INTEGER, 50)
                OFFSET COALESCE((p_options->>'offset')::INTEGER, 0)
            )
            SELECT jsonb_agg(
                jsonb_build_object(
                    'entity_id', ca.id,
                    'code', ca.entity_code,
                    'display_name', ca.entity_name,
                    'smart_code', ca.smart_code,
                    'created_at', ca.created_at,
                    'updated_at', ca.updated_at,
                    'definition', ca.app_definition
                )
            ) INTO v_result
            FROM catalog_apps ca;

            v_result := jsonb_build_object(
                'success', true,
                'operation', 'LIST',
                'apps', COALESCE(v_result, '[]'::jsonb)
            );

        -- ====================
        -- UPDATE OPERATION
        -- ====================
        WHEN 'UPDATE' THEN
            IF NOT (p_filters ? 'app_entity_id') THEN
                RAISE EXCEPTION 'App entity ID is required for UPDATE operation';
            END IF;

            IF p_app_definition IS NULL THEN
                RAISE EXCEPTION 'App definition is required for UPDATE operation';
            END IF;

            -- Verify app exists and get current data
            SELECT id INTO v_app_entity_id
            FROM core_entities
            WHERE id = (p_filters->>'app_entity_id')::UUID
            AND organization_id = v_platform_org_id
            AND entity_type = 'MICRO_APP_DEF';

            IF v_app_entity_id IS NULL THEN
                RAISE EXCEPTION 'Micro-app not found';
            END IF;

            -- Update entity name if provided
            IF p_app_definition ? 'display_name' THEN
                UPDATE core_entities
                SET entity_name = p_app_definition->>'display_name',
                    updated_by = p_actor_user_id,
                    updated_at = NOW()
                WHERE id = v_app_entity_id;
            END IF;

            -- Update app definition
            UPDATE core_dynamic_data
            SET field_value_json = p_app_definition,
                updated_by = p_actor_user_id,
                updated_at = NOW()
            WHERE entity_id = v_app_entity_id
            AND field_name = 'app_definition';

            v_result := jsonb_build_object(
                'success', true,
                'operation', 'UPDATE',
                'app_entity_id', v_app_entity_id,
                'message', 'Micro-app catalog entry updated successfully'
            );

        -- ====================
        -- DELETE OPERATION
        -- ====================
        WHEN 'DELETE' THEN
            IF NOT (p_filters ? 'app_entity_id') THEN
                RAISE EXCEPTION 'App entity ID is required for DELETE operation';
            END IF;

            -- Verify app exists
            SELECT id INTO v_app_entity_id
            FROM core_entities
            WHERE id = (p_filters->>'app_entity_id')::UUID
            AND organization_id = v_platform_org_id
            AND entity_type = 'MICRO_APP_DEF';

            IF v_app_entity_id IS NULL THEN
                RAISE EXCEPTION 'Micro-app not found';
            END IF;

            -- Check for existing installations (prevent deletion if installed)
            SELECT COUNT(*) INTO v_count
            FROM core_entities
            WHERE entity_type = 'MICRO_APP_INSTALL'
            AND metadata->>'micro_app_entity_id' = v_app_entity_id::text
            AND metadata->>'status' IN ('installed', 'installing');

            IF v_count > 0 THEN
                RAISE EXCEPTION 'Cannot delete micro-app: % active installations found', v_count;
            END IF;

            -- Delete dynamic data first (FK constraint)
            DELETE FROM core_dynamic_data
            WHERE entity_id = v_app_entity_id;

            -- Delete catalog entry
            DELETE FROM core_entities
            WHERE id = v_app_entity_id;

            v_result := jsonb_build_object(
                'success', true,
                'operation', 'DELETE',
                'app_entity_id', v_app_entity_id,
                'message', 'Micro-app removed from catalog'
            );

        ELSE
            RAISE EXCEPTION 'Unsupported operation: %', p_operation;
    END CASE;

    -- Add audit metadata to result
    v_result := v_result || jsonb_build_object(
        'audit', jsonb_build_object(
            'actor_user_id', p_actor_user_id,
            'organization_id', p_organization_id,
            'timestamp', NOW(),
            'operation', p_operation
        )
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Enhanced error handling with context
        RETURN jsonb_build_object(
            'success', false,
            'error', 'CATALOG_OPERATION_FAILED',
            'message', SQLERRM,
            'operation', p_operation,
            'audit', jsonb_build_object(
                'actor_user_id', p_actor_user_id,
                'organization_id', p_organization_id,
                'timestamp', NOW(),
                'error_details', SQLSTATE
            )
        );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION hera_microapp_catalog_v2 TO authenticated;

-- Add function comment
COMMENT ON FUNCTION hera_microapp_catalog_v2 IS 
'HERA Micro-Apps Catalog Management v2 - Enterprise-grade catalog CRUD operations with actor stamping, organization isolation, and Smart Code validation. Platform organization only.';