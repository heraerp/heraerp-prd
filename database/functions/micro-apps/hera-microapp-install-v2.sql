-- =====================================================
-- HERA Micro-Apps Installation Management v2
-- Smart Code: HERA.PLATFORM.MICRO_APPS.INSTALL.RPC.v2
-- =====================================================
-- 
-- Enterprise-grade micro-app installation with:
-- ✅ Actor stamping enforcement
-- ✅ Organization isolation 
-- ✅ Dependency resolution
-- ✅ Installation lifecycle management
-- ✅ Complete audit trail
-- 
-- Usage: Install, uninstall, upgrade micro-apps for organizations

CREATE OR REPLACE FUNCTION hera_microapp_install_v2(
    p_actor_user_id UUID,
    p_organization_id UUID,
    p_operation TEXT,
    p_app_code TEXT DEFAULT NULL,
    p_app_version TEXT DEFAULT NULL,
    p_installation_config JSONB DEFAULT '{}',
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
    v_installation_entity_id UUID;
    v_existing_install RECORD;
    v_app_definition JSONB;
    v_dependencies JSONB;
    v_dependency_check JSONB;
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_smart_code TEXT;
    v_count INTEGER;
    v_installation_status TEXT := 'installing';
BEGIN
    -- Input validation
    IF p_actor_user_id IS NULL THEN
        RAISE EXCEPTION 'Actor user ID is required (actor stamping enforcement)';
    END IF;

    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'Organization ID is required (organization isolation enforcement)';
    END IF;

    IF p_operation IS NULL OR p_operation = '' THEN
        RAISE EXCEPTION 'Operation is required';
    END IF;

    -- Validate operation
    IF p_operation NOT IN ('INSTALL', 'UNINSTALL', 'UPGRADE', 'STATUS', 'LIST') THEN
        RAISE EXCEPTION 'Invalid operation: %. Allowed: INSTALL, UNINSTALL, UPGRADE, STATUS, LIST', p_operation;
    END IF;

    -- Platform organization check (app catalog resides there)
    IF p_organization_id = v_platform_org_id THEN
        RAISE EXCEPTION 'Cannot install apps in platform organization - platform org is for catalog management';
    END IF;

    -- Actor membership validation (must be member of target organization)
    IF NOT EXISTS (
        SELECT 1 FROM core_relationships r
        WHERE r.from_entity_id = p_actor_user_id
        AND r.to_entity_id = p_organization_id
        AND r.relationship_type = 'USER_MEMBER_OF_ORG'
        AND r.status = 'active'
    ) THEN
        RAISE EXCEPTION 'Actor must be organization member for installation operations';
    END IF;

    CASE p_operation
        -- ====================
        -- INSTALL OPERATION
        -- ====================
        WHEN 'INSTALL' THEN
            -- Validate required fields
            IF p_app_code IS NULL OR p_app_version IS NULL THEN
                RAISE EXCEPTION 'App code and version are required for INSTALL operation';
            END IF;

            -- Check if app exists in catalog
            SELECT e.id, dd.field_value_json INTO v_app_entity_id, v_app_definition
            FROM core_entities e
            JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'app_definition'
            WHERE e.organization_id = v_platform_org_id
            AND e.entity_type = 'MICRO_APP_DEF'
            AND e.entity_code = p_app_code
            AND dd.field_value_json->>'version' = p_app_version;

            IF v_app_entity_id IS NULL THEN
                RAISE EXCEPTION 'Micro-app % version % not found in catalog', p_app_code, p_app_version;
            END IF;

            -- Check if already installed
            SELECT COUNT(*) INTO v_count
            FROM core_entities e
            JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'installation_config'
            WHERE e.organization_id = p_organization_id
            AND e.entity_type = 'MICRO_APP_INSTALL'
            AND e.entity_code = p_app_code
            AND dd.field_value_json->>'status' IN ('installed', 'installing');

            IF v_count > 0 THEN
                RAISE EXCEPTION 'Micro-app % is already installed or installing in this organization', p_app_code;
            END IF;

            -- Validate dependencies before installation
            SELECT hera_microapp_dependencies_v2(
                p_actor_user_id,
                p_organization_id,
                p_app_code,
                p_app_version,
                'VALIDATE'
            ) INTO v_dependency_check;

            IF NOT (v_dependency_check->>'success')::BOOLEAN THEN
                v_result := jsonb_build_object(
                    'success', false,
                    'error', 'DEPENDENCY_VALIDATION_FAILED',
                    'message', 'Dependency validation failed',
                    'dependency_errors', v_dependency_check->'validation_errors'
                );
                RETURN v_result;
            END IF;

            -- Generate Smart Code for installation
            v_smart_code := 'HERA.PLATFORM.MICRO_APP.INSTALL.' || 
                           UPPER(REPLACE(p_app_code, '-', '_')) || 
                           '.' || LOWER(p_app_version);

            -- Create installation entity
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
                'MICRO_APP_INSTALL',
                v_app_definition->>'display_name' || ' Installation',
                p_app_code,
                v_smart_code,
                p_organization_id,
                jsonb_build_object(
                    'micro_app_entity_id', v_app_entity_id,
                    'app_code', p_app_code,
                    'app_version', p_app_version,
                    'installation_metadata', jsonb_build_object(
                        'installed_at', NOW(),
                        'installed_by', p_actor_user_id,
                        'source', 'catalog'
                    )
                ),
                p_actor_user_id,
                p_actor_user_id,
                NOW(),
                NOW()
            ) RETURNING id INTO v_installation_entity_id;

            -- Store installation configuration
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
                v_installation_entity_id,
                'installation_config',
                'json',
                jsonb_build_object(
                    'status', 'installing',
                    'app_code', p_app_code,
                    'app_version', p_app_version,
                    'installation_started_at', NOW(),
                    'config', p_installation_config,
                    'dependencies_validated', v_dependency_check
                ),
                'HERA.PLATFORM.MICRO_APP.FIELD.INSTALLATION_CONFIG.v2',
                p_organization_id,
                p_actor_user_id,
                p_actor_user_id,
                NOW(),
                NOW()
            );

            -- Create relationship between organization and installed app
            INSERT INTO core_relationships (
                id,
                from_entity_id,
                to_entity_id,
                relationship_type,
                organization_id,
                relationship_data,
                created_by,
                updated_by,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                p_organization_id,
                v_installation_entity_id,
                'HAS_INSTALLED_APP',
                p_organization_id,
                jsonb_build_object(
                    'installation_type', 'micro_app',
                    'app_code', p_app_code,
                    'app_version', p_app_version,
                    'installed_at', NOW()
                ),
                p_actor_user_id,
                p_actor_user_id,
                NOW(),
                NOW()
            );

            -- Update installation status to 'installed' (simplified for this version)
            UPDATE core_dynamic_data
            SET field_value_json = jsonb_set(
                field_value_json,
                '{status}',
                '"installed"'
            ),
            updated_by = p_actor_user_id,
            updated_at = NOW()
            WHERE entity_id = v_installation_entity_id
            AND field_name = 'installation_config';

            v_result := jsonb_build_object(
                'success', true,
                'operation', 'INSTALL',
                'installation_entity_id', v_installation_entity_id,
                'app_code', p_app_code,
                'app_version', p_app_version,
                'status', 'installed',
                'message', 'Micro-app installed successfully'
            );

        -- ====================
        -- UNINSTALL OPERATION
        -- ====================
        WHEN 'UNINSTALL' THEN
            IF p_app_code IS NULL THEN
                RAISE EXCEPTION 'App code is required for UNINSTALL operation';
            END IF;

            -- Find existing installation
            SELECT 
                e.id,
                e.entity_name,
                e.smart_code,
                dd.field_value_json
            INTO v_existing_install
            FROM core_entities e
            JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'installation_config'
            WHERE e.organization_id = p_organization_id
            AND e.entity_type = 'MICRO_APP_INSTALL'
            AND e.entity_code = p_app_code
            AND dd.field_value_json->>'status' = 'installed';

            IF v_existing_install IS NULL THEN
                RAISE EXCEPTION 'Micro-app % is not installed in this organization', p_app_code;
            END IF;

            -- Update installation status to 'uninstalling'
            UPDATE core_dynamic_data
            SET field_value_json = jsonb_set(
                jsonb_set(
                    field_value_json,
                    '{status}',
                    '"uninstalling"'
                ),
                '{uninstall_started_at}',
                to_jsonb(NOW())
            ),
            updated_by = p_actor_user_id,
            updated_at = NOW()
            WHERE entity_id = v_existing_install.id
            AND field_name = 'installation_config';

            -- Remove installation relationships
            DELETE FROM core_relationships
            WHERE from_entity_id = p_organization_id
            AND to_entity_id = v_existing_install.id
            AND relationship_type = 'HAS_INSTALLED_APP';

            -- Remove installation dynamic data
            DELETE FROM core_dynamic_data
            WHERE entity_id = v_existing_install.id;

            -- Remove installation entity
            DELETE FROM core_entities
            WHERE id = v_existing_install.id;

            v_result := jsonb_build_object(
                'success', true,
                'operation', 'UNINSTALL',
                'app_code', p_app_code,
                'message', 'Micro-app uninstalled successfully'
            );

        -- ====================
        -- STATUS OPERATION
        -- ====================
        WHEN 'STATUS' THEN
            IF p_app_code IS NULL THEN
                RAISE EXCEPTION 'App code is required for STATUS operation';
            END IF;

            SELECT 
                e.id,
                e.entity_name,
                e.entity_code,
                e.smart_code,
                e.created_at,
                e.updated_at,
                dd.field_value_json as installation_config
            INTO v_existing_install
            FROM core_entities e
            JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'installation_config'
            WHERE e.organization_id = p_organization_id
            AND e.entity_type = 'MICRO_APP_INSTALL'
            AND e.entity_code = p_app_code;

            IF v_existing_install IS NULL THEN
                v_result := jsonb_build_object(
                    'success', true,
                    'operation', 'STATUS',
                    'app_code', p_app_code,
                    'status', 'not_installed',
                    'message', 'Micro-app is not installed'
                );
            ELSE
                v_result := jsonb_build_object(
                    'success', true,
                    'operation', 'STATUS',
                    'installation', jsonb_build_object(
                        'installation_id', v_existing_install.id,
                        'app_code', v_existing_install.entity_code,
                        'app_name', v_existing_install.entity_name,
                        'smart_code', v_existing_install.smart_code,
                        'status', v_existing_install.installation_config->>'status',
                        'app_version', v_existing_install.installation_config->>'app_version',
                        'installed_at', v_existing_install.created_at,
                        'updated_at', v_existing_install.updated_at,
                        'config', v_existing_install.installation_config->'config'
                    )
                );
            END IF;

        -- ====================
        -- LIST OPERATION
        -- ====================
        WHEN 'LIST' THEN
            WITH installed_apps AS (
                SELECT 
                    e.id,
                    e.entity_name,
                    e.entity_code,
                    e.smart_code,
                    e.created_at,
                    e.updated_at,
                    dd.field_value_json as installation_config
                FROM core_entities e
                JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'installation_config'
                WHERE e.organization_id = p_organization_id
                AND e.entity_type = 'MICRO_APP_INSTALL'
                AND (
                    p_filters IS NULL OR
                    (p_filters ? 'status' AND dd.field_value_json->>'status' = (p_filters->>'status'))
                )
                ORDER BY e.entity_name ASC
                LIMIT COALESCE((p_options->>'limit')::INTEGER, 50)
                OFFSET COALESCE((p_options->>'offset')::INTEGER, 0)
            )
            SELECT jsonb_agg(
                jsonb_build_object(
                    'installation_id', ia.id,
                    'app_code', ia.entity_code,
                    'app_name', ia.entity_name,
                    'smart_code', ia.smart_code,
                    'status', ia.installation_config->>'status',
                    'app_version', ia.installation_config->>'app_version',
                    'installed_at', ia.created_at,
                    'updated_at', ia.updated_at,
                    'config', ia.installation_config->'config'
                )
            ) INTO v_result
            FROM installed_apps ia;

            v_result := jsonb_build_object(
                'success', true,
                'operation', 'LIST',
                'organization_id', p_organization_id,
                'installations', COALESCE(v_result, '[]'::jsonb)
            );

        -- ====================
        -- UPGRADE OPERATION (Placeholder)
        -- ====================
        WHEN 'UPGRADE' THEN
            -- TODO: Implement upgrade logic in future version
            RAISE EXCEPTION 'UPGRADE operation not yet implemented. Use UNINSTALL followed by INSTALL for now.';

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
            'error', 'INSTALLATION_OPERATION_FAILED',
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
GRANT EXECUTE ON FUNCTION hera_microapp_install_v2 TO authenticated;

-- Add function comment
COMMENT ON FUNCTION hera_microapp_install_v2 IS 
'HERA Micro-Apps Installation Management v2 - Enterprise-grade installation CRUD operations with dependency resolution, actor stamping, and organization isolation. Handles INSTALL, UNINSTALL, UPGRADE, STATUS, and LIST operations.';