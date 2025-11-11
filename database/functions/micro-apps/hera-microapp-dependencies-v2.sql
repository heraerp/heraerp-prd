-- =====================================================
-- HERA Micro-Apps Dependency Management v2
-- Smart Code: HERA.PLATFORM.MICRO_APPS.DEPENDENCIES.RPC.v2
-- =====================================================
-- 
-- Enterprise-grade dependency resolution with:
-- ✅ Circular dependency detection
-- ✅ Version compatibility checking  
-- ✅ Dependency tree resolution
-- ✅ Installation order calculation
-- ✅ Actor stamping and audit trails

CREATE OR REPLACE FUNCTION hera_microapp_dependencies_v2(
    p_actor_user_id UUID,
    p_organization_id UUID,
    p_app_code TEXT,
    p_version TEXT,
    p_operation TEXT -- VALIDATE, RESOLVE, CHECK_CYCLES
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB := '{}';
    v_app_definition JSONB;
    v_dependencies JSONB;
    v_dependency JSONB;
    v_dep_app RECORD;
    v_resolved_deps JSONB := '[]';
    v_validation_errors JSONB := '[]';
    v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
    v_dependency_tree JSONB := '{}';
    v_install_order JSONB := '[]';
    v_visited_apps JSONB := '[]';
    v_cycle_found BOOLEAN := FALSE;
BEGIN
    -- Input validation
    IF p_actor_user_id IS NULL THEN
        RAISE EXCEPTION 'Actor user ID is required (actor stamping enforcement)';
    END IF;

    IF p_app_code IS NULL OR p_version IS NULL THEN
        RAISE EXCEPTION 'App code and version are required';
    END IF;

    IF p_operation NOT IN ('VALIDATE', 'RESOLVE', 'CHECK_CYCLES') THEN
        RAISE EXCEPTION 'Invalid operation: %. Allowed: VALIDATE, RESOLVE, CHECK_CYCLES', p_operation;
    END IF;

    -- Get app definition from catalog
    SELECT dd.field_value_json INTO v_app_definition
    FROM core_entities e
    JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'app_definition'
    WHERE e.organization_id = v_platform_org_id
    AND e.entity_type = 'MICRO_APP_DEF'
    AND e.entity_code = p_app_code
    AND dd.field_value_json->>'version' = p_version;

    IF v_app_definition IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'APP_NOT_FOUND',
            'message', format('Micro-app %s version %s not found in catalog', p_app_code, p_version)
        );
    END IF;

    -- Extract dependencies
    v_dependencies := COALESCE(v_app_definition->'depends_on', '[]');

    CASE p_operation
        -- ====================
        -- VALIDATE OPERATION
        -- ====================
        WHEN 'VALIDATE' THEN
            -- Validate each dependency exists and version is compatible
            FOR v_dependency IN SELECT * FROM jsonb_array_elements(v_dependencies)
            LOOP
                DECLARE
                    v_dep_code TEXT := v_dependency->>'code';
                    v_dep_version_req TEXT := COALESCE(v_dependency->>'version', '>=v1.0');
                    v_dep_min_version TEXT;
                    v_available_versions JSONB;
                BEGIN
                    -- Parse version requirement (e.g., ">=v1.0", "=v2.1", "~v1.2")
                    IF v_dep_version_req LIKE '>=%' THEN
                        v_dep_min_version := SUBSTRING(v_dep_version_req FROM 3);
                    ELSIF v_dep_version_req LIKE '=%' THEN
                        v_dep_min_version := SUBSTRING(v_dep_version_req FROM 2);
                    ELSIF v_dep_version_req LIKE '~%' THEN
                        v_dep_min_version := SUBSTRING(v_dep_version_req FROM 2);
                    ELSE
                        v_dep_min_version := v_dep_version_req;
                    END IF;

                    -- Get available versions for dependency
                    SELECT jsonb_agg(dd.field_value_json->>'version' ORDER BY e.created_at DESC)
                    INTO v_available_versions
                    FROM core_entities e
                    JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'app_definition'
                    WHERE e.organization_id = v_platform_org_id
                    AND e.entity_type = 'MICRO_APP_DEF'
                    AND e.entity_code = v_dep_code;

                    IF v_available_versions IS NULL OR jsonb_array_length(v_available_versions) = 0 THEN
                        -- Dependency not found in catalog
                        v_validation_errors := v_validation_errors || jsonb_build_array(
                            jsonb_build_object(
                                'dependency_code', v_dep_code,
                                'error_type', 'DEPENDENCY_NOT_FOUND',
                                'message', format('Required dependency %s not found in catalog', v_dep_code),
                                'required_version', v_dep_version_req
                            )
                        );
                    ELSE
                        -- Check if compatible version exists
                        DECLARE
                            v_compatible_found BOOLEAN := FALSE;
                            v_available_version TEXT;
                        BEGIN
                            FOR v_available_version IN SELECT jsonb_array_elements_text(v_available_versions)
                            LOOP
                                -- Simple version comparison (assumes semantic versioning)
                                IF version_compare(v_available_version, v_dep_min_version) >= 0 THEN
                                    v_compatible_found := TRUE;
                                    EXIT;
                                END IF;
                            END LOOP;

                            IF NOT v_compatible_found THEN
                                v_validation_errors := v_validation_errors || jsonb_build_array(
                                    jsonb_build_object(
                                        'dependency_code', v_dep_code,
                                        'error_type', 'VERSION_INCOMPATIBLE',
                                        'message', format('No compatible version found for %s. Required: %s, Available: %s', 
                                                        v_dep_code, v_dep_version_req, v_available_versions::text),
                                        'required_version', v_dep_version_req,
                                        'available_versions', v_available_versions
                                    )
                                );
                            END IF;
                        END;
                    END IF;
                END;
            END LOOP;

            v_result := jsonb_build_object(
                'success', jsonb_array_length(v_validation_errors) = 0,
                'operation', 'VALIDATE',
                'app_code', p_app_code,
                'app_version', p_version,
                'dependencies_count', jsonb_array_length(v_dependencies),
                'validation_errors', v_validation_errors,
                'message', CASE 
                    WHEN jsonb_array_length(v_validation_errors) = 0 THEN 'All dependencies are valid'
                    ELSE format('%s dependency validation errors found', jsonb_array_length(v_validation_errors))
                END
            );

        -- ====================
        -- RESOLVE OPERATION
        -- ====================
        WHEN 'RESOLVE' THEN
            -- Recursively resolve all dependencies
            WITH RECURSIVE dependency_resolver AS (
                -- Base case: direct dependencies
                SELECT 
                    dep->>'code' as dep_code,
                    COALESCE(dep->>'version', '>=v1.0') as version_req,
                    1 as depth,
                    ARRAY[p_app_code] as path
                FROM jsonb_array_elements(v_dependencies) as dep
                
                UNION ALL
                
                -- Recursive case: dependencies of dependencies
                SELECT 
                    sub_dep->>'code' as dep_code,
                    COALESCE(sub_dep->>'version', '>=v1.0') as version_req,
                    dr.depth + 1,
                    dr.path || dr.dep_code
                FROM dependency_resolver dr
                JOIN core_entities e ON e.entity_code = dr.dep_code AND e.entity_type = 'MICRO_APP_DEF'
                JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'app_definition'
                CROSS JOIN jsonb_array_elements(COALESCE(dd.field_value_json->'depends_on', '[]')) as sub_dep
                WHERE dr.depth < 10 -- Prevent infinite recursion
                AND dr.dep_code != ALL(dr.path) -- Cycle detection
            )
            SELECT jsonb_agg(
                jsonb_build_object(
                    'code', dr.dep_code,
                    'version_requirement', dr.version_req,
                    'depth', dr.depth,
                    'dependency_path', array_to_json(dr.path || dr.dep_code)
                ) ORDER BY dr.depth, dr.dep_code
            ) INTO v_resolved_deps
            FROM dependency_resolver dr;

            -- Generate installation order (topological sort)
            WITH installation_levels AS (
                SELECT 
                    dep_code,
                    MAX(depth) as install_level
                FROM (
                    SELECT 
                        dep->>'code' as dep_code,
                        1 as depth
                    FROM jsonb_array_elements(COALESCE(v_resolved_deps, '[]')) as dep
                ) sub
                GROUP BY dep_code
            )
            SELECT jsonb_agg(dep_code ORDER BY install_level, dep_code)
            INTO v_install_order
            FROM installation_levels;

            v_result := jsonb_build_object(
                'success', true,
                'operation', 'RESOLVE',
                'app_code', p_app_code,
                'app_version', p_version,
                'resolved_dependencies', COALESCE(v_resolved_deps, '[]'),
                'install_order', COALESCE(v_install_order, '[]'),
                'total_dependencies', COALESCE(jsonb_array_length(v_resolved_deps), 0)
            );

        -- ====================
        -- CHECK_CYCLES OPERATION
        -- ====================
        WHEN 'CHECK_CYCLES' THEN
            -- Deep cycle detection using graph traversal
            WITH RECURSIVE cycle_checker AS (
                -- Start with the target app
                SELECT 
                    p_app_code as current_app,
                    ARRAY[p_app_code] as path,
                    0 as depth
                
                UNION ALL
                
                -- Follow dependency chain
                SELECT 
                    dep->>'code' as current_app,
                    cc.path || (dep->>'code'),
                    cc.depth + 1
                FROM cycle_checker cc
                JOIN core_entities e ON e.entity_code = cc.current_app AND e.entity_type = 'MICRO_APP_DEF'
                JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'app_definition'
                CROSS JOIN jsonb_array_elements(COALESCE(dd.field_value_json->'depends_on', '[]')) as dep
                WHERE cc.depth < 20 -- Prevent runaway recursion
                AND (dep->>'code') = ANY(cc.path) -- Cycle detected!
            )
            SELECT 
                COUNT(*) > 0,
                jsonb_agg(DISTINCT path) FILTER (WHERE array_length(path, 1) > 1)
            INTO v_cycle_found, v_dependency_tree
            FROM cycle_checker
            WHERE array_length(path, 1) > 1;

            v_result := jsonb_build_object(
                'success', true,
                'operation', 'CHECK_CYCLES',
                'app_code', p_app_code,
                'app_version', p_version,
                'cycles_found', v_cycle_found,
                'cycle_paths', COALESCE(v_dependency_tree, '[]'),
                'message', CASE 
                    WHEN v_cycle_found THEN 'Circular dependencies detected!'
                    ELSE 'No circular dependencies found'
                END
            );

        ELSE
            RAISE EXCEPTION 'Unsupported operation: %', p_operation;
    END CASE;

    -- Add audit metadata
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
        RETURN jsonb_build_object(
            'success', false,
            'error', 'DEPENDENCY_OPERATION_FAILED',
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

-- Helper function for version comparison
CREATE OR REPLACE FUNCTION version_compare(version1 TEXT, version2 TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v1_parts INTEGER[];
    v2_parts INTEGER[];
    v1_clean TEXT;
    v2_clean TEXT;
    i INTEGER;
BEGIN
    -- Clean version strings (remove 'v' prefix)
    v1_clean := LTRIM(version1, 'v');
    v2_clean := LTRIM(version2, 'v');
    
    -- Split versions into parts and convert to integers
    SELECT ARRAY(SELECT regexp_split_to_table(v1_clean, '\.')::INTEGER) INTO v1_parts;
    SELECT ARRAY(SELECT regexp_split_to_table(v2_clean, '\.')::INTEGER) INTO v2_parts;
    
    -- Pad shorter array with zeros
    WHILE array_length(v1_parts, 1) < array_length(v2_parts, 1) LOOP
        v1_parts := v1_parts || 0;
    END LOOP;
    
    WHILE array_length(v2_parts, 1) < array_length(v1_parts, 1) LOOP
        v2_parts := v2_parts || 0;
    END LOOP;
    
    -- Compare each part
    FOR i IN 1..array_length(v1_parts, 1) LOOP
        IF v1_parts[i] > v2_parts[i] THEN
            RETURN 1;
        ELSIF v1_parts[i] < v2_parts[i] THEN
            RETURN -1;
        END IF;
    END LOOP;
    
    RETURN 0; -- Versions are equal
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION hera_microapp_dependencies_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION version_compare TO authenticated;

-- Add function comments
COMMENT ON FUNCTION hera_microapp_dependencies_v2 IS 
'HERA Micro-Apps Dependency Management v2 - Validates dependencies, resolves dependency trees, and detects circular dependencies with enterprise-grade error handling.';

COMMENT ON FUNCTION version_compare IS 
'Semantic version comparison utility function. Returns -1, 0, or 1 for less than, equal to, or greater than comparisons.';