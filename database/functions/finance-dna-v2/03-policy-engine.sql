-- Finance DNA v2 - Policy Engine Functions
-- Smart Code: HERA.ACCOUNTING.POLICY.ENGINE.FUNCTIONS.v2
-- Auto-Generated: From Finance DNA v2 Documentation
-- Last Updated: 2025-01-10

-- =============================================================================
-- POLICY CREATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_create_financial_policy_v2(
    p_organization_id UUID,
    p_policy_name TEXT,
    p_policy_type TEXT,
    p_policy_config JSONB,
    p_priority INTEGER DEFAULT 100
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_policy_id UUID;
    v_config_field_name TEXT;
BEGIN
    -- Validate organization access
    IF NOT hera_validate_organization_access(p_organization_id) THEN
        RAISE EXCEPTION 'Organization access denied: %', p_organization_id;
    END IF;
    
    -- Validate policy configuration
    PERFORM hera_validate_policy_config_v2(p_policy_type, p_policy_config);
    
    -- Create policy entity
    INSERT INTO core_entities (
        organization_id,
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'fin_rule',
        p_policy_name,
        format('FIN_RULE_%s_%s', 
            upper(replace(p_policy_type, '_', '')), 
            to_char(NOW(), 'YYYYMMDDHH24MISS')
        ),
        'HERA.ACCOUNTING.POLICY.RULE.ENTITY.v2',
        jsonb_build_object(
            'policy_type', p_policy_type,
            'priority', p_priority,
            'status', 'active',
            'created_by', current_setting('app.current_user', true)
        )
    ) RETURNING id INTO v_policy_id;
    
    -- Determine configuration field name
    v_config_field_name := CASE p_policy_type
        WHEN 'posting_automation' THEN 'posting_configuration'
        WHEN 'approval_workflow' THEN 'approval_workflow_config'
        WHEN 'validation_rules' THEN 'validation_rules_config'
        WHEN 'currency_conversion' THEN 'currency_conversion_config'
        ELSE 'policy_configuration'
    END;
    
    -- Store policy configuration
    INSERT INTO core_dynamic_data (
        organization_id,
        entity_id,
        field_name,
        field_type,
        field_value_json,
        smart_code
    ) VALUES (
        p_organization_id,
        v_policy_id,
        v_config_field_name,
        'json',
        p_policy_config,
        format('HERA.ACCOUNTING.POLICY.CONFIG.%s.v2', upper(p_policy_type))
    );
    
    -- Log policy creation
    PERFORM hera_audit_operation_v2(
        p_organization_id,
        'POLICY_CREATE',
        jsonb_build_object(
            'policy_id', v_policy_id,
            'policy_type', p_policy_type,
            'policy_name', p_policy_name,
            'created_by', current_setting('app.current_user', true)
        ),
        'HERA.ACCOUNTING.AUDIT.POLICY.CREATE.v2'
    );
    
    RETURN v_policy_id;
END;
$$;

-- =============================================================================
-- POLICY VALIDATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_validate_policy_config_v2(
    p_policy_type TEXT,
    p_policy_config JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validate policy configuration based on type
    CASE p_policy_type
        WHEN 'posting_automation' THEN
            -- Validate posting automation policy
            IF NOT (p_policy_config ? 'trigger_conditions' AND p_policy_config ? 'posting_rules') THEN
                RAISE EXCEPTION 'Posting automation policy must have trigger_conditions and posting_rules';
            END IF;
            
            -- Validate posting rules structure
            IF NOT jsonb_typeof(p_policy_config->'posting_rules') = 'array' THEN
                RAISE EXCEPTION 'posting_rules must be an array';
            END IF;
            
        WHEN 'approval_workflow' THEN
            -- Validate approval workflow policy
            IF NOT (p_policy_config ? 'workflow_steps' AND p_policy_config ? 'trigger_conditions') THEN
                RAISE EXCEPTION 'Approval workflow policy must have workflow_steps and trigger_conditions';
            END IF;
            
        WHEN 'validation_rules' THEN
            -- Validate validation rules policy
            IF NOT (p_policy_config ? 'rules') THEN
                RAISE EXCEPTION 'Validation rules policy must have rules array';
            END IF;
            
        WHEN 'currency_conversion' THEN
            -- Validate currency conversion policy
            IF NOT (p_policy_config ? 'base_currency' AND p_policy_config ? 'supported_currencies') THEN
                RAISE EXCEPTION 'Currency conversion policy must have base_currency and supported_currencies';
            END IF;
            
        ELSE
            RAISE EXCEPTION 'Unknown policy type: %', p_policy_type;
    END CASE;
    
    RETURN true;
END;
$$;

-- =============================================================================
-- POLICY RESOLUTION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_resolve_applicable_policies_v2(
    p_organization_id UUID,
    p_transaction_smart_code TEXT,
    p_transaction_data JSONB
) RETURNS TABLE(
    policy_id UUID,
    policy_name TEXT,
    policy_config JSONB,
    priority INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set organization context
    PERFORM set_config('app.current_org', p_organization_id::text, false);
    
    RETURN QUERY
    WITH applicable_policies AS (
        SELECT 
            ce.id as policy_id,
            ce.entity_name as policy_name,
            cdd.field_value_json as policy_config,
            (ce.metadata->>'priority')::INTEGER as priority
        FROM core_entities ce
        JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'fin_rule'
          AND cdd.field_name IN ('posting_configuration', 'approval_workflow_config', 'validation_rules')
          AND (
              -- Match smart code pattern
              p_transaction_smart_code ~ (cdd.field_value_json->'trigger_conditions'->>'smart_code_pattern')
              OR
              -- Match transaction type
              (p_transaction_data->>'transaction_type') = ANY(
                  SELECT jsonb_array_elements_text(cdd.field_value_json->'trigger_conditions'->'transaction_types')
              )
          )
          AND (ce.metadata->>'status') = 'active'
    )
    SELECT 
        ap.policy_id,
        ap.policy_name,
        ap.policy_config,
        COALESCE(ap.priority, 999)
    FROM applicable_policies ap
    ORDER BY COALESCE(ap.priority, 999), ap.policy_name;
END;
$$;

-- =============================================================================
-- POLICY EXECUTION ENGINE
-- =============================================================================

-- Drop existing type if it exists
DROP TYPE IF EXISTS policy_execution_result CASCADE;

CREATE TYPE policy_execution_result AS (
    success BOOLEAN,
    policies_applied INTEGER,
    errors JSONB
);

CREATE OR REPLACE FUNCTION hera_execute_financial_policies_v2(
    p_organization_id UUID,
    p_transaction_id UUID,
    p_transaction_data JSONB
) RETURNS policy_execution_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_policy RECORD;
    v_result policy_execution_result;
    v_execution_log JSONB := '[]'::jsonb;
BEGIN
    -- Initialize result
    v_result.success := true;
    v_result.policies_applied := 0;
    v_result.errors := '[]'::jsonb;
    
    -- Execute each applicable policy
    FOR v_policy IN
        SELECT * FROM hera_resolve_applicable_policies_v2(
            p_organization_id,
            p_transaction_data->>'smart_code',
            p_transaction_data
        )
    LOOP
        BEGIN
            -- Execute based on policy type
            CASE v_policy.policy_config->>'policy_type'
                WHEN 'posting_automation' THEN
                    PERFORM hera_execute_posting_policy_v2(
                        p_organization_id,
                        p_transaction_id,
                        v_policy.policy_config
                    );
                    
                WHEN 'approval_workflow' THEN
                    PERFORM hera_execute_approval_policy_v2(
                        p_organization_id,
                        p_transaction_id,
                        v_policy.policy_config
                    );
                    
                WHEN 'validation_rules' THEN
                    PERFORM hera_execute_validation_policy_v2(
                        p_organization_id,
                        p_transaction_data,
                        v_policy.policy_config
                    );
                    
                WHEN 'currency_conversion' THEN
                    PERFORM hera_execute_currency_policy_v2(
                        p_organization_id,
                        p_transaction_id,
                        v_policy.policy_config
                    );
            END CASE;
            
            -- Log successful execution
            v_execution_log := v_execution_log || jsonb_build_object(
                'policy_id', v_policy.policy_id,
                'policy_name', v_policy.policy_name,
                'execution_status', 'success',
                'execution_time', NOW()
            );
            
            v_result.policies_applied := v_result.policies_applied + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log policy execution error
            v_execution_log := v_execution_log || jsonb_build_object(
                'policy_id', v_policy.policy_id,
                'policy_name', v_policy.policy_name,
                'execution_status', 'error',
                'error_message', SQLERRM,
                'execution_time', NOW()
            );
            
            v_result.errors := v_result.errors || jsonb_build_object(
                'policy_id', v_policy.policy_id,
                'error', SQLERRM
            );
            
            v_result.success := false;
        END;
    END LOOP;
    
    -- Log complete policy execution
    PERFORM hera_audit_operation_v2(
        p_organization_id,
        'POLICY_EXECUTION',
        jsonb_build_object(
            'transaction_id', p_transaction_id,
            'policies_applied', v_result.policies_applied,
            'execution_success', v_result.success,
            'execution_log', v_execution_log
        ),
        'HERA.ACCOUNTING.POLICY.EVENT.EXECUTED.v2'
    );
    
    RETURN v_result;
END;
$$;

-- =============================================================================
-- POSTING POLICY EXECUTION
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_execute_posting_policy_v2(
    p_organization_id UUID,
    p_transaction_id UUID,
    p_policy_config JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_posting_rule JSONB;
    v_line_number INTEGER := 1;
    v_gl_account_id UUID;
    v_amount DECIMAL(15,2);
BEGIN
    -- Process each posting rule in sequence
    FOR v_posting_rule IN
        SELECT jsonb_array_elements(p_policy_config->'posting_rules')
    LOOP
        -- Determine GL account
        SELECT id INTO v_gl_account_id
        FROM core_entities
        WHERE organization_id = p_organization_id
          AND entity_type = 'gl_account'
          AND entity_code = v_posting_rule->'account_mapping'->>'account_code';
        
        IF v_gl_account_id IS NULL THEN
            RAISE EXCEPTION 'GL account not found: %', v_posting_rule->'account_mapping'->>'account_code';
        END IF;
        
        -- Calculate amount (simplified - would need more complex logic for real implementation)
        v_amount := (v_posting_rule->'amount_calculation'->>'source')::DECIMAL;
        
        -- Create GL line
        INSERT INTO universal_transaction_lines (
            organization_id,
            transaction_id,
            line_number,
            line_entity_id,
            line_type,
            debit_amount,
            credit_amount,
            smart_code
        ) VALUES (
            p_organization_id,
            p_transaction_id,
            v_line_number,
            v_gl_account_id,
            v_posting_rule->'account_mapping'->>'posting_side',
            CASE WHEN v_posting_rule->'account_mapping'->>'posting_side' = 'DEBIT' 
                 THEN v_amount ELSE 0.00 END,
            CASE WHEN v_posting_rule->'account_mapping'->>'posting_side' = 'CREDIT' 
                 THEN v_amount ELSE 0.00 END,
            CASE WHEN v_posting_rule->'account_mapping'->>'posting_side' = 'DEBIT'
                 THEN 'HERA.ACCOUNTING.GL.LINE.DEBIT.v2'
                 ELSE 'HERA.ACCOUNTING.GL.LINE.CREDIT.v2' END
        );
        
        v_line_number := v_line_number + 1;
    END LOOP;
    
    RETURN true;
END;
$$;

-- =============================================================================
-- POLICY TESTING FUNCTION
-- =============================================================================

-- Drop existing type if it exists
DROP TYPE IF EXISTS policy_test_result CASCADE;

CREATE TYPE policy_test_result AS (
    test_passed BOOLEAN,
    error_message TEXT
);

CREATE OR REPLACE FUNCTION hera_test_policy_application_v2(
    p_organization_id UUID,
    p_policy_id UUID,
    p_test_transaction_data JSONB
) RETURNS policy_test_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result policy_test_result;
    v_policy_config JSONB;
    v_test_errors TEXT[] := '{}';
BEGIN
    -- Get policy configuration
    SELECT cdd.field_value_json
    INTO v_policy_config
    FROM core_entities ce
    JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id
    WHERE ce.organization_id = p_organization_id
      AND ce.id = p_policy_id
      AND ce.entity_type = 'fin_rule'
    LIMIT 1;
    
    IF v_policy_config IS NULL THEN
        v_result.test_passed := false;
        v_result.error_message := 'Policy not found';
        RETURN v_result;
    END IF;
    
    -- Test policy conditions
    BEGIN
        -- Test trigger conditions (simplified validation)
        IF NOT (p_test_transaction_data ? 'smart_code') THEN
            v_test_errors := v_test_errors || 'Missing smart_code in test data';
        END IF;
        
        -- Test posting rules if applicable
        IF v_policy_config->>'policy_type' = 'posting_automation' THEN
            IF NOT (v_policy_config ? 'posting_rules') THEN
                v_test_errors := v_test_errors || 'Missing posting_rules in policy';
            END IF;
        END IF;
        
        v_result.test_passed := array_length(v_test_errors, 1) IS NULL;
        v_result.error_message := array_to_string(v_test_errors, '; ');
        
    EXCEPTION WHEN OTHERS THEN
        v_result.test_passed := false;
        v_result.error_message := SQLERRM;
    END;
    
    -- Log test execution
    PERFORM hera_audit_operation_v2(
        p_organization_id,
        'POLICY_TEST',
        jsonb_build_object(
            'policy_id', p_policy_id,
            'test_result', v_result.test_passed,
            'test_errors', v_test_errors,
            'test_data', p_test_transaction_data
        ),
        'HERA.ACCOUNTING.POLICY.EVENT.TESTED.v2'
    );
    
    RETURN v_result;
END;
$$;

-- =============================================================================
-- STUB FUNCTIONS (TO BE IMPLEMENTED)
-- =============================================================================

-- These are placeholder functions that would need full implementation
-- in a production system

CREATE OR REPLACE FUNCTION hera_execute_approval_policy_v2(
    p_organization_id UUID,
    p_transaction_id UUID,
    p_policy_config JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Stub implementation
    RAISE NOTICE 'Approval policy execution not yet implemented';
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION hera_execute_validation_policy_v2(
    p_organization_id UUID,
    p_transaction_data JSONB,
    p_policy_config JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Stub implementation
    RAISE NOTICE 'Validation policy execution not yet implemented';
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION hera_execute_currency_policy_v2(
    p_organization_id UUID,
    p_transaction_id UUID,
    p_policy_config JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Stub implementation
    RAISE NOTICE 'Currency policy execution not yet implemented';
    RETURN true;
END;
$$;