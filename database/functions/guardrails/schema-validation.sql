-- HERA Schema Validation Functions
-- =================================
-- Implements v2.2 schema compliance validation

-- Sacred Six table validation
CREATE OR REPLACE FUNCTION hera_validate_sacred_six_compliance()
RETURNS TABLE(
    table_name TEXT,
    compliance_status TEXT,
    missing_columns TEXT[],
    invalid_columns TEXT[],
    recommendations TEXT[]
) AS $$
DECLARE
    v_sacred_tables TEXT[] := ARRAY[
        'core_entities',
        'core_dynamic_data',
        'core_relationships', 
        'universal_transactions',
        'universal_transaction_lines',
        'core_organizations'
    ];
    v_required_audit_columns TEXT[] := ARRAY['created_by', 'updated_by', 'created_at', 'updated_at'];
    v_table TEXT;
    v_column TEXT;
    v_missing_cols TEXT[] := ARRAY[]::TEXT[];
    v_invalid_cols TEXT[] := ARRAY[]::TEXT[];
    v_recommendations TEXT[] := ARRAY[]::TEXT[];
    v_status TEXT;
BEGIN
    FOREACH v_table IN ARRAY v_sacred_tables LOOP
        v_missing_cols := ARRAY[]::TEXT[];
        v_invalid_cols := ARRAY[]::TEXT[];
        v_recommendations := ARRAY[]::TEXT[];
        
        -- Check if table exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = v_table
        ) THEN
            v_status := 'MISSING';
            v_recommendations := v_recommendations || ('Table ' || v_table || ' does not exist');
            
            RETURN QUERY SELECT 
                v_table,
                v_status,
                v_missing_cols,
                v_invalid_cols,
                v_recommendations;
            CONTINUE;
        END IF;
        
        -- Check required audit columns
        FOREACH v_column IN ARRAY v_required_audit_columns LOOP
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = v_table
                AND column_name = v_column
            ) THEN
                v_missing_cols := v_missing_cols || v_column;
            END IF;
        END LOOP;
        
        -- Check organization_id column (except for core_organizations)
        IF v_table != 'core_organizations' AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = v_table
            AND column_name = 'organization_id'
        ) THEN
            v_missing_cols := v_missing_cols || 'organization_id';
        END IF;
        
        -- Check for deprecated columns
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = v_table
            AND column_name = 'transaction_code'
        ) THEN
            v_invalid_cols := v_invalid_cols || 'transaction_code';
            v_recommendations := v_recommendations || 'Replace transaction_code with transaction_number';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = v_table
            AND column_name IN ('from_entity_id', 'to_entity_id')
        ) THEN
            v_invalid_cols := v_invalid_cols || ARRAY['from_entity_id', 'to_entity_id'];
            v_recommendations := v_recommendations || 'Replace from_entity_id/to_entity_id with source_entity_id/target_entity_id';
        END IF;
        
        -- Determine compliance status
        IF array_length(v_missing_cols, 1) > 0 OR array_length(v_invalid_cols, 1) > 0 THEN
            v_status := 'NON_COMPLIANT';
        ELSE
            v_status := 'COMPLIANT';
        END IF;
        
        -- Add general recommendations
        IF v_status = 'NON_COMPLIANT' THEN
            v_recommendations := v_recommendations || 'Run schema migration to fix compliance issues';
        END IF;
        
        RETURN QUERY SELECT 
            v_table,
            v_status,
            v_missing_cols,
            v_invalid_cols,
            v_recommendations;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Validate RLS policies exist
CREATE OR REPLACE FUNCTION hera_validate_rls_policies()
RETURNS TABLE(
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count INTEGER,
    has_org_filter_policy BOOLEAN,
    compliance_status TEXT
) AS $$
DECLARE
    v_sacred_tables TEXT[] := ARRAY[
        'core_entities',
        'core_dynamic_data',
        'core_relationships', 
        'universal_transactions',
        'universal_transaction_lines'
    ];
    v_table TEXT;
    v_rls_enabled BOOLEAN;
    v_policy_count INTEGER;
    v_has_org_policy BOOLEAN;
    v_status TEXT;
BEGIN
    FOREACH v_table IN ARRAY v_sacred_tables LOOP
        -- Check if RLS is enabled
        SELECT relrowsecurity INTO v_rls_enabled
        FROM pg_class
        WHERE relname = v_table;
        
        -- Count policies
        SELECT COUNT(*) INTO v_policy_count
        FROM pg_policies
        WHERE tablename = v_table;
        
        -- Check for organization filtering policy
        SELECT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = v_table
            AND (qual LIKE '%organization_id%' OR with_check LIKE '%organization_id%')
        ) INTO v_has_org_policy;
        
        -- Determine compliance
        IF v_rls_enabled AND v_policy_count > 0 AND v_has_org_policy THEN
            v_status := 'COMPLIANT';
        ELSE
            v_status := 'NON_COMPLIANT';
        END IF;
        
        RETURN QUERY SELECT 
            v_table,
            COALESCE(v_rls_enabled, false),
            COALESCE(v_policy_count, 0),
            COALESCE(v_has_org_policy, false),
            v_status;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Validate smart code patterns across tables
CREATE OR REPLACE FUNCTION hera_validate_smart_code_patterns(
    p_organization_id UUID DEFAULT NULL
)
RETURNS TABLE(
    table_name TEXT,
    total_rows BIGINT,
    rows_with_smart_code BIGINT,
    rows_with_valid_pattern BIGINT,
    compliance_percentage NUMERIC,
    sample_invalid_codes TEXT[]
) AS $$
DECLARE
    v_tables_with_smart_code TEXT[] := ARRAY[
        'core_entities',
        'universal_transactions'
    ];
    v_table TEXT;
    v_total BIGINT;
    v_with_code BIGINT;
    v_valid_pattern BIGINT;
    v_compliance NUMERIC;
    v_invalid_samples TEXT[];
    v_org_filter TEXT := '';
BEGIN
    -- Build organization filter if provided
    IF p_organization_id IS NOT NULL THEN
        v_org_filter := format(' WHERE organization_id = %L', p_organization_id);
    END IF;
    
    FOREACH v_table IN ARRAY v_tables_with_smart_code LOOP
        -- Get total rows
        EXECUTE format('SELECT COUNT(*) FROM %I%s', v_table, v_org_filter) INTO v_total;
        
        -- Get rows with smart_code
        EXECUTE format('SELECT COUNT(*) FROM %I%s AND smart_code IS NOT NULL', 
                      v_table, 
                      CASE WHEN v_org_filter = '' THEN ' WHERE' ELSE v_org_filter END) 
        INTO v_with_code;
        
        -- Get rows with valid pattern
        EXECUTE format('SELECT COUNT(*) FROM %I%s AND smart_code ~ %L', 
                      v_table, 
                      CASE WHEN v_org_filter = '' THEN ' WHERE' ELSE v_org_filter END,
                      '^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.V\d+$') 
        INTO v_valid_pattern;
        
        -- Calculate compliance percentage
        v_compliance := CASE 
            WHEN v_total = 0 THEN 100.0
            ELSE ROUND((v_valid_pattern::NUMERIC / v_total) * 100, 2)
        END;
        
        -- Get sample invalid codes
        EXECUTE format('
            SELECT ARRAY_AGG(smart_code) 
            FROM (
                SELECT smart_code FROM %I%s 
                AND (smart_code IS NULL OR smart_code !~ %L)
                LIMIT 5
            ) samples', 
            v_table, 
            CASE WHEN v_org_filter = '' THEN ' WHERE' ELSE v_org_filter END,
            '^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.V\d+$')
        INTO v_invalid_samples;
        
        RETURN QUERY SELECT 
            v_table,
            v_total,
            v_with_code,
            v_valid_pattern,
            v_compliance,
            COALESCE(v_invalid_samples, ARRAY[]::TEXT[]);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comprehensive schema validation report
CREATE OR REPLACE FUNCTION hera_generate_schema_validation_report(
    p_organization_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_report JSONB;
    v_sacred_six_compliance JSONB;
    v_rls_compliance JSONB;
    v_smart_code_compliance JSONB;
    v_overall_status TEXT;
    v_issues_count INTEGER := 0;
BEGIN
    -- Sacred Six compliance
    SELECT jsonb_agg(
        jsonb_build_object(
            'table_name', table_name,
            'status', compliance_status,
            'missing_columns', missing_columns,
            'invalid_columns', invalid_columns,
            'recommendations', recommendations
        )
    ) INTO v_sacred_six_compliance
    FROM hera_validate_sacred_six_compliance();
    
    -- RLS compliance
    SELECT jsonb_agg(
        jsonb_build_object(
            'table_name', table_name,
            'rls_enabled', rls_enabled,
            'policy_count', policy_count,
            'has_org_filter', has_org_filter_policy,
            'status', compliance_status
        )
    ) INTO v_rls_compliance
    FROM hera_validate_rls_policies();
    
    -- Smart code compliance
    SELECT jsonb_agg(
        jsonb_build_object(
            'table_name', table_name,
            'total_rows', total_rows,
            'compliance_percentage', compliance_percentage,
            'sample_invalid_codes', sample_invalid_codes
        )
    ) INTO v_smart_code_compliance
    FROM hera_validate_smart_code_patterns(p_organization_id);
    
    -- Count issues
    SELECT COUNT(*) INTO v_issues_count
    FROM (
        SELECT 1 FROM hera_validate_sacred_six_compliance() 
        WHERE compliance_status != 'COMPLIANT'
        UNION ALL
        SELECT 1 FROM hera_validate_rls_policies() 
        WHERE compliance_status != 'COMPLIANT'
    ) issues;
    
    -- Overall status
    v_overall_status := CASE 
        WHEN v_issues_count = 0 THEN 'FULLY_COMPLIANT'
        WHEN v_issues_count <= 3 THEN 'MOSTLY_COMPLIANT'
        ELSE 'NON_COMPLIANT'
    END;
    
    -- Build final report
    v_report := jsonb_build_object(
        'report_generated_at', NOW(),
        'organization_id', p_organization_id,
        'overall_status', v_overall_status,
        'total_issues', v_issues_count,
        'sacred_six_compliance', v_sacred_six_compliance,
        'rls_compliance', v_rls_compliance,
        'smart_code_compliance', v_smart_code_compliance,
        'recommendations', CASE 
            WHEN v_overall_status = 'FULLY_COMPLIANT' THEN 
                '["Schema is fully compliant with HERA v2.2"]'::jsonb
            ELSE 
                '["Run schema migration to fix compliance issues", "Enable missing RLS policies", "Fix smart code patterns"]'::jsonb
        END
    );
    
    RETURN v_report;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION hera_validate_sacred_six_compliance() TO authenticated;
GRANT EXECUTE ON FUNCTION hera_validate_rls_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION hera_validate_smart_code_patterns(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_generate_schema_validation_report(UUID) TO authenticated;

-- Add function documentation
COMMENT ON FUNCTION hera_validate_sacred_six_compliance() IS 'Validates Sacred Six table schema compliance';
COMMENT ON FUNCTION hera_validate_rls_policies() IS 'Validates RLS policy configuration for multi-tenancy';
COMMENT ON FUNCTION hera_validate_smart_code_patterns() IS 'Validates smart code pattern compliance across tables';
COMMENT ON FUNCTION hera_generate_schema_validation_report() IS 'Generates comprehensive schema validation report';