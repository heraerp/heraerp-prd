-- Universal Chart of Accounts Builder Function
-- Builds customized COA for organizations based on templates

CREATE OR REPLACE FUNCTION build_customized_coa(
    p_organization_id TEXT,
    p_country TEXT DEFAULT NULL,
    p_industry TEXT DEFAULT NULL,
    p_customizations JSONB DEFAULT '{}'::JSONB
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB := '{}';
    v_accounts_created INTEGER := 0;
    v_base_accounts INTEGER := 0;
    v_country_accounts INTEGER := 0;
    v_industry_accounts INTEGER := 0;
    v_custom_accounts INTEGER := 0;
    v_template_org_id TEXT;
    v_account_record RECORD;
    v_dynamic_record RECORD;
    v_new_entity_id UUID;
    v_existing_check INTEGER;
BEGIN
    -- Validate organization exists and user has access
    SELECT COUNT(*) INTO v_existing_check
    FROM core_organizations 
    WHERE id::TEXT = p_organization_id;
    
    IF v_existing_check = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Organization not found',
            'organization_id', p_organization_id
        );
    END IF;

    -- Clear any existing COA for this organization
    DELETE FROM core_dynamic_data 
    WHERE organization_id = p_organization_id 
    AND entity_id IN (
        SELECT id FROM core_entities 
        WHERE organization_id = p_organization_id 
        AND entity_type = 'gl_account'
    );
    
    DELETE FROM core_entities 
    WHERE organization_id = p_organization_id 
    AND entity_type = 'gl_account';

    -- Step 1: Copy Universal Base Template
    v_template_org_id := 'template_universal_base';
    
    FOR v_account_record IN 
        SELECT * FROM core_entities 
        WHERE organization_id = v_template_org_id 
        AND entity_type = 'gl_account'
        ORDER BY entity_code::INTEGER
    LOOP
        v_new_entity_id := gen_random_uuid();
        
        INSERT INTO core_entities (
            id,
            organization_id,
            entity_type,
            entity_name,
            entity_code,
            status,
            created_at,
            updated_at,
            created_by,
            updated_by
        ) VALUES (
            v_new_entity_id,
            p_organization_id,
            v_account_record.entity_type,
            v_account_record.entity_name,
            v_account_record.entity_code,
            v_account_record.status,
            NOW(),
            NOW(),
            auth.uid(),
            auth.uid()
        );
        
        -- Copy all dynamic data for this account
        FOR v_dynamic_record IN 
            SELECT * FROM core_dynamic_data 
            WHERE entity_id = v_account_record.id
        LOOP
            INSERT INTO core_dynamic_data (
                id,
                organization_id,
                entity_id,
                field_name,
                field_value,
                field_type,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                p_organization_id,
                v_new_entity_id,
                v_dynamic_record.field_name,
                v_dynamic_record.field_value,
                v_dynamic_record.field_type,
                NOW(),
                NOW()
            );
        END LOOP;
        
        v_base_accounts := v_base_accounts + 1;
    END LOOP;

    -- Step 2: Add Country-Specific Accounts (if specified)
    IF p_country IS NOT NULL THEN
        v_template_org_id := 'template_country_' || lower(p_country);
        
        FOR v_account_record IN 
            SELECT * FROM core_entities 
            WHERE organization_id = v_template_org_id 
            AND entity_type = 'gl_account'
            ORDER BY entity_code::INTEGER
        LOOP
            v_new_entity_id := gen_random_uuid();
            
            INSERT INTO core_entities (
                id,
                organization_id,
                entity_type,
                entity_name,
                entity_code,
                status,
                created_at,
                updated_at,
                created_by,
                updated_by
            ) VALUES (
                v_new_entity_id,
                p_organization_id,
                v_account_record.entity_type,
                v_account_record.entity_name,
                v_account_record.entity_code,
                v_account_record.status,
                NOW(),
                NOW(),
                auth.uid(),
                auth.uid()
            );
            
            -- Copy all dynamic data for this account
            FOR v_dynamic_record IN 
                SELECT * FROM core_dynamic_data 
                WHERE entity_id = v_account_record.id
            LOOP
                INSERT INTO core_dynamic_data (
                    id,
                    organization_id,
                    entity_id,
                    field_name,
                    field_value,
                    field_type,
                    created_at,
                    updated_at
                ) VALUES (
                    gen_random_uuid(),
                    p_organization_id,
                    v_new_entity_id,
                    v_dynamic_record.field_name,
                    v_dynamic_record.field_value,
                    v_dynamic_record.field_type,
                    NOW(),
                    NOW()
                );
            END LOOP;
            
            v_country_accounts := v_country_accounts + 1;
        END LOOP;
    END IF;

    -- Step 3: Add Industry-Specific Accounts (if specified)
    IF p_industry IS NOT NULL THEN
        v_template_org_id := 'template_industry_' || lower(p_industry);
        
        FOR v_account_record IN 
            SELECT * FROM core_entities 
            WHERE organization_id = v_template_org_id 
            AND entity_type = 'gl_account'
            ORDER BY entity_code::INTEGER
        LOOP
            v_new_entity_id := gen_random_uuid();
            
            INSERT INTO core_entities (
                id,
                organization_id,
                entity_type,
                entity_name,
                entity_code,
                status,
                created_at,
                updated_at,
                created_by,
                updated_by
            ) VALUES (
                v_new_entity_id,
                p_organization_id,
                v_account_record.entity_type,
                v_account_record.entity_name,
                v_account_record.entity_code,
                v_account_record.status,
                NOW(),
                NOW(),
                auth.uid(),
                auth.uid()
            );
            
            -- Copy all dynamic data for this account
            FOR v_dynamic_record IN 
                SELECT * FROM core_dynamic_data 
                WHERE entity_id = v_account_record.id
            LOOP
                INSERT INTO core_dynamic_data (
                    id,
                    organization_id,
                    entity_id,
                    field_name,
                    field_value,
                    field_type,
                    created_at,
                    updated_at
                ) VALUES (
                    gen_random_uuid(),
                    p_organization_id,
                    v_new_entity_id,
                    v_dynamic_record.field_name,
                    v_dynamic_record.field_value,
                    v_dynamic_record.field_type,
                    NOW(),
                    NOW()
                );
            END LOOP;
            
            v_industry_accounts := v_industry_accounts + 1;
        END LOOP;
    END IF;

    -- Step 4: Apply Custom Account Modifications
    IF jsonb_typeof(p_customizations) = 'object' AND p_customizations != '{}'::JSONB THEN
        -- Handle custom account additions
        IF p_customizations ? 'add_accounts' THEN
            FOR v_account_record IN 
                SELECT * FROM jsonb_to_recordset(p_customizations->'add_accounts') AS t(
                    account_code TEXT,
                    account_name TEXT,
                    account_type TEXT,
                    account_subtype TEXT
                )
            LOOP
                v_new_entity_id := gen_random_uuid();
                
                INSERT INTO core_entities (
                    id,
                    organization_id,
                    entity_type,
                    entity_name,
                    entity_code,
                    status,
                    created_at,
                    updated_at,
                    created_by,
                    updated_by
                ) VALUES (
                    v_new_entity_id,
                    p_organization_id,
                    'gl_account',
                    v_account_record.account_name,
                    v_account_record.account_code,
                    'active',
                    NOW(),
                    NOW(),
                    auth.uid(),
                    auth.uid()
                );
                
                -- Add account type
                INSERT INTO core_dynamic_data (
                    id,
                    organization_id,
                    entity_id,
                    field_name,
                    field_value,
                    field_type,
                    created_at,
                    updated_at
                ) VALUES (
                    gen_random_uuid(),
                    p_organization_id,
                    v_new_entity_id,
                    'account_type',
                    COALESCE(v_account_record.account_type, 'expenses'),
                    'text',
                    NOW(),
                    NOW()
                );
                
                -- Add template layer
                INSERT INTO core_dynamic_data (
                    id,
                    organization_id,
                    entity_id,
                    field_name,
                    field_value,
                    field_type,
                    created_at,
                    updated_at
                ) VALUES (
                    gen_random_uuid(),
                    p_organization_id,
                    v_new_entity_id,
                    'template_layer',
                    'custom',
                    'text',
                    NOW(),
                    NOW()
                );
                
                v_custom_accounts := v_custom_accounts + 1;
            END LOOP;
        END IF;

        -- Handle account name modifications
        IF p_customizations ? 'modify_accounts' THEN
            FOR v_account_record IN 
                SELECT * FROM jsonb_to_recordset(p_customizations->'modify_accounts') AS t(
                    account_code TEXT,
                    new_name TEXT
                )
            LOOP
                UPDATE core_entities 
                SET entity_name = v_account_record.new_name,
                    updated_at = NOW(),
                    updated_by = auth.uid()
                WHERE organization_id = p_organization_id 
                AND entity_code = v_account_record.account_code
                AND entity_type = 'gl_account';
            END LOOP;
        END IF;
    END IF;

    -- Calculate total accounts created
    v_accounts_created := v_base_accounts + v_country_accounts + v_industry_accounts + v_custom_accounts;

    -- Build result
    v_result := jsonb_build_object(
        'success', true,
        'organization_id', p_organization_id,
        'total_accounts_created', v_accounts_created,
        'breakdown', jsonb_build_object(
            'base_accounts', v_base_accounts,
            'country_accounts', v_country_accounts,
            'industry_accounts', v_industry_accounts,
            'custom_accounts', v_custom_accounts
        ),
        'templates_applied', jsonb_build_object(
            'universal_base', true,
            'country', COALESCE(p_country, 'none'),
            'industry', COALESCE(p_industry, 'none'),
            'customizations_applied', CASE WHEN p_customizations != '{}'::JSONB THEN true ELSE false END
        ),
        'created_at', NOW()
    );

    RETURN v_result::JSON;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback any partial changes
        DELETE FROM core_dynamic_data 
        WHERE organization_id = p_organization_id 
        AND entity_id IN (
            SELECT id FROM core_entities 
            WHERE organization_id = p_organization_id 
            AND entity_type = 'gl_account'
        );
        
        DELETE FROM core_entities 
        WHERE organization_id = p_organization_id 
        AND entity_type = 'gl_account';
        
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE,
            'organization_id', p_organization_id
        );
END;
$$;

-- Function to get available template options
CREATE OR REPLACE FUNCTION get_coa_template_options()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB := '{}';
    v_countries JSONB := '[]';
    v_industries JSONB := '[]';
    v_base_count INTEGER := 0;
BEGIN
    -- Get count of base accounts
    SELECT COUNT(*) INTO v_base_count
    FROM core_entities 
    WHERE organization_id = 'template_universal_base'
    AND entity_type = 'gl_account';

    -- Get available countries
    SELECT jsonb_agg(
        jsonb_build_object(
            'code', REPLACE(organization_id, 'template_country_', ''),
            'name', CASE 
                WHEN organization_id = 'template_country_india' THEN 'India'
                WHEN organization_id = 'template_country_usa' THEN 'United States'
                WHEN organization_id = 'template_country_uk' THEN 'United Kingdom'
                ELSE REPLACE(organization_id, 'template_country_', '')
            END,
            'account_count', COUNT(*)
        )
    ) INTO v_countries
    FROM core_entities 
    WHERE organization_id LIKE 'template_country_%'
    AND entity_type = 'gl_account'
    GROUP BY organization_id;

    -- Get available industries
    SELECT jsonb_agg(
        jsonb_build_object(
            'code', REPLACE(organization_id, 'template_industry_', ''),
            'name', CASE 
                WHEN organization_id = 'template_industry_restaurant' THEN 'Restaurant & Food Service'
                WHEN organization_id = 'template_industry_healthcare' THEN 'Healthcare & Medical'
                WHEN organization_id = 'template_industry_manufacturing' THEN 'Manufacturing'
                WHEN organization_id = 'template_industry_professional_services' THEN 'Professional Services'
                ELSE REPLACE(organization_id, 'template_industry_', '')
            END,
            'account_count', COUNT(*)
        )
    ) INTO v_industries
    FROM core_entities 
    WHERE organization_id LIKE 'template_industry_%'
    AND entity_type = 'gl_account'
    GROUP BY organization_id;

    v_result := jsonb_build_object(
        'universal_base', jsonb_build_object(
            'name', 'Universal Base Template',
            'description', 'GAAP/IFRS compliant foundation that works for any business',
            'account_count', v_base_count
        ),
        'countries', COALESCE(v_countries, '[]'::JSONB),
        'industries', COALESCE(v_industries, '[]'::JSONB),
        'customization_options', jsonb_build_object(
            'add_accounts', 'Add custom accounts for organization-specific needs',
            'modify_accounts', 'Rename existing accounts to match business terminology',
            'account_properties', 'Add custom properties and metadata to accounts'
        )
    );

    RETURN v_result::JSON;
END;
$$;

-- Function to get COA structure for an organization
CREATE OR REPLACE FUNCTION get_coa_structure(
    p_organization_id TEXT,
    p_include_metadata BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB := '{}';
    v_accounts JSONB := '[]';
    v_summary JSONB := '{}';
    v_org_check INTEGER;
BEGIN
    -- Validate organization access
    SELECT COUNT(*) INTO v_org_check
    FROM core_organizations 
    WHERE id::TEXT = p_organization_id;
    
    IF v_org_check = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Organization not found or access denied'
        );
    END IF;

    -- Build accounts array with metadata
    IF p_include_metadata THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', e.id,
                'account_code', e.entity_code,
                'account_name', e.entity_name,
                'status', e.status,
                'created_at', e.created_at,
                'metadata', (
                    SELECT jsonb_object_agg(dd.field_name, dd.field_value)
                    FROM core_dynamic_data dd
                    WHERE dd.entity_id = e.id
                )
            ) ORDER BY e.entity_code::INTEGER
        ) INTO v_accounts
        FROM core_entities e
        WHERE e.organization_id = p_organization_id
        AND e.entity_type = 'gl_account';
    ELSE
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', e.id,
                'account_code', e.entity_code,
                'account_name', e.entity_name,
                'status', e.status
            ) ORDER BY e.entity_code::INTEGER
        ) INTO v_accounts
        FROM core_entities e
        WHERE e.organization_id = p_organization_id
        AND e.entity_type = 'gl_account';
    END IF;

    -- Build summary by account type
    SELECT jsonb_object_agg(
        dd.field_value,
        COUNT(*)
    ) INTO v_summary
    FROM core_entities e
    JOIN core_dynamic_data dd ON dd.entity_id = e.id
    WHERE e.organization_id = p_organization_id
    AND e.entity_type = 'gl_account'
    AND dd.field_name = 'account_type'
    GROUP BY dd.field_value;

    v_result := jsonb_build_object(
        'success', true,
        'organization_id', p_organization_id,
        'total_accounts', jsonb_array_length(COALESCE(v_accounts, '[]'::JSONB)),
        'summary_by_type', COALESCE(v_summary, '{}'::JSONB),
        'accounts', COALESCE(v_accounts, '[]'::JSONB),
        'generated_at', NOW()
    );

    RETURN v_result::JSON;
END;
$$;

-- Function to add custom accounts to existing COA
CREATE OR REPLACE FUNCTION add_custom_accounts(
    p_organization_id TEXT,
    p_accounts JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB := '{}';
    v_accounts_added INTEGER := 0;
    v_account_record RECORD;
    v_new_entity_id UUID;
    v_org_check INTEGER;
    v_duplicate_check INTEGER;
BEGIN
    -- Validate organization access
    SELECT COUNT(*) INTO v_org_check
    FROM core_organizations 
    WHERE id::TEXT = p_organization_id;
    
    IF v_org_check = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Organization not found or access denied'
        );
    END IF;

    -- Process each account in the input array
    FOR v_account_record IN 
        SELECT * FROM jsonb_to_recordset(p_accounts) AS t(
            account_code TEXT,
            account_name TEXT,
            account_type TEXT,
            account_subtype TEXT,
            normal_balance TEXT
        )
    LOOP
        -- Check for duplicate account codes
        SELECT COUNT(*) INTO v_duplicate_check
        FROM core_entities 
        WHERE organization_id = p_organization_id
        AND entity_code = v_account_record.account_code
        AND entity_type = 'gl_account';
        
        IF v_duplicate_check > 0 THEN
            CONTINUE; -- Skip duplicate account codes
        END IF;
        
        v_new_entity_id := gen_random_uuid();
        
        -- Create the account entity
        INSERT INTO core_entities (
            id,
            organization_id,
            entity_type,
            entity_name,
            entity_code,
            status,
            created_at,
            updated_at,
            created_by,
            updated_by
        ) VALUES (
            v_new_entity_id,
            p_organization_id,
            'gl_account',
            v_account_record.account_name,
            v_account_record.account_code,
            'active',
            NOW(),
            NOW(),
            auth.uid(),
            auth.uid()
        );
        
        -- Add account type metadata
        INSERT INTO core_dynamic_data (
            id,
            organization_id,
            entity_id,
            field_name,
            field_value,
            field_type,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            p_organization_id,
            v_new_entity_id,
            'account_type',
            COALESCE(v_account_record.account_type, 'expenses'),
            'text',
            NOW(),
            NOW()
        );
        
        -- Add account subtype if provided
        IF v_account_record.account_subtype IS NOT NULL THEN
            INSERT INTO core_dynamic_data (
                id,
                organization_id,
                entity_id,
                field_name,
                field_value,
                field_type,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                p_organization_id,
                v_new_entity_id,
                'account_subtype',
                v_account_record.account_subtype,
                'text',
                NOW(),
                NOW()
            );
        END IF;
        
        -- Add normal balance if provided
        IF v_account_record.normal_balance IS NOT NULL THEN
            INSERT INTO core_dynamic_data (
                id,
                organization_id,
                entity_id,
                field_name,
                field_value,
                field_type,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                p_organization_id,
                v_new_entity_id,
                'normal_balance',
                v_account_record.normal_balance,
                'text',
                NOW(),
                NOW()
            );
        END IF;
        
        -- Mark as custom template layer
        INSERT INTO core_dynamic_data (
            id,
            organization_id,
            entity_id,
            field_name,
            field_value,
            field_type,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            p_organization_id,
            v_new_entity_id,
            'template_layer',
            'custom',
            'text',
            NOW(),
            NOW()
        );
        
        v_accounts_added := v_accounts_added + 1;
    END LOOP;

    v_result := jsonb_build_object(
        'success', true,
        'organization_id', p_organization_id,
        'accounts_added', v_accounts_added,
        'added_at', NOW()
    );

    RETURN v_result::JSON;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE,
            'organization_id', p_organization_id
        );
END;
$$;

COMMENT ON FUNCTION build_customized_coa IS 'Builds a customized Chart of Accounts by layering universal base, country-specific, industry-specific, and custom accounts';
COMMENT ON FUNCTION get_coa_template_options IS 'Returns available template options for building customized COA';
COMMENT ON FUNCTION get_coa_structure IS 'Retrieves the complete COA structure for an organization with optional metadata';
COMMENT ON FUNCTION add_custom_accounts IS 'Adds custom accounts to an existing Chart of Accounts';