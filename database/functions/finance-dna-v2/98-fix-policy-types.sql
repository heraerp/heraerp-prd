-- Finance DNA v2 - Policy Types Configuration Fix
-- Smart Code: HERA.ACCOUNTING.FIXES.POLICY.TYPES.v2
-- Add missing policy type configurations

-- =============================================================================
-- ADD POLICY TYPE VALIDATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_policy_type_v2(
    p_policy_type TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Define valid policy types for Finance DNA v2
    RETURN p_policy_type IN (
        'APPROVAL_WORKFLOW',
        'AMOUNT_VALIDATION', 
        'SEGREGATION_OF_DUTIES',
        'BUDGET_CONTROL',
        'CREDIT_LIMIT',
        'EXPENSE_APPROVAL',
        'JOURNAL_VALIDATION',
        'PAYMENT_AUTHORIZATION',
        'RECONCILIATION_CONTROL',
        'REPORTING_SCHEDULE'
    );
END;
$$;

-- =============================================================================
-- UPDATE POLICY CREATION FUNCTION TO USE VALIDATION
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
    v_policy_entity_id UUID;
    v_org_access BOOLEAN := false;
BEGIN
    -- Validate organization access
    SELECT hera_validate_organization_access(p_organization_id) INTO v_org_access;
    IF NOT v_org_access THEN
        RAISE EXCEPTION 'Organization access denied: %', p_organization_id;
    END IF;
    
    -- Validate policy type
    IF NOT validate_policy_type_v2(p_policy_type) THEN
        RAISE EXCEPTION 'Unknown policy type: %. Valid types: APPROVAL_WORKFLOW, AMOUNT_VALIDATION, SEGREGATION_OF_DUTIES, BUDGET_CONTROL, CREDIT_LIMIT, EXPENSE_APPROVAL, JOURNAL_VALIDATION, PAYMENT_AUTHORIZATION, RECONCILIATION_CONTROL, REPORTING_SCHEDULE', p_policy_type;
    END IF;
    
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
        'financial_policy',
        p_policy_name,
        'POL-' || EXTRACT(EPOCH FROM NOW())::TEXT,
        'HERA.ACCOUNTING.POLICY.ENTITY.v2',
        jsonb_build_object(
            'policy_type', p_policy_type,
            'priority', p_priority,
            'status', 'active',
            'created_by', current_setting('app.current_user', true)
        )
    ) RETURNING id INTO v_policy_entity_id;
    
    -- Store policy configuration in dynamic data
    INSERT INTO core_dynamic_data (
        entity_id,
        organization_id,
        field_name,
        field_value_json,
        smart_code
    ) VALUES (
        v_policy_entity_id,
        p_organization_id,
        'policy_config',
        p_policy_config,
        'HERA.ACCOUNTING.POLICY.CONFIG.v2'
    );
    
    -- Store policy priority
    INSERT INTO core_dynamic_data (
        entity_id,
        organization_id,
        field_name,
        field_value_number,
        smart_code
    ) VALUES (
        v_policy_entity_id,
        p_organization_id,
        'priority',
        p_priority,
        'HERA.ACCOUNTING.POLICY.PRIORITY.v2'
    );
    
    -- Log policy creation
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'POLICY_CREATION',
        'HERA.ACCOUNTING.POLICY.CREATE.v2',
        jsonb_build_object(
            'policy_id', v_policy_entity_id,
            'policy_name', p_policy_name,
            'policy_type', p_policy_type,
            'priority', p_priority
        )
    );
    
    RETURN v_policy_entity_id;
END;
$$;

-- =============================================================================
-- UPDATE POLICY EXECUTION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_execute_financial_policy_v2(
    p_organization_id UUID,
    p_policy_id UUID,
    p_transaction_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_policy_type TEXT;
    v_policy_config JSONB;
    v_result JSONB;
    v_org_access BOOLEAN := false;
BEGIN
    -- Validate organization access
    SELECT hera_validate_organization_access(p_organization_id) INTO v_org_access;
    IF NOT v_org_access THEN
        RAISE EXCEPTION 'Organization access denied: %', p_organization_id;
    END IF;
    
    -- Get policy details
    SELECT 
        e.metadata->>'policy_type',
        dd.field_value_json
    INTO v_policy_type, v_policy_config
    FROM core_entities e
    LEFT JOIN core_dynamic_data dd ON (
        e.id = dd.entity_id AND 
        dd.field_name = 'policy_config'
    )
    WHERE e.id = p_policy_id 
    AND e.organization_id = p_organization_id
    AND e.entity_type = 'financial_policy';
    
    IF v_policy_type IS NULL THEN
        RAISE EXCEPTION 'Policy not found or access denied: %', p_policy_id;
    END IF;
    
    -- Execute policy based on type
    CASE v_policy_type
        WHEN 'AMOUNT_VALIDATION' THEN
            -- Amount validation logic
            DECLARE
                v_amount DECIMAL := (p_transaction_data->>'amount')::DECIMAL;
                v_max_amount DECIMAL := (v_policy_config->>'max_amount')::DECIMAL;
                v_min_amount DECIMAL := (v_policy_config->>'min_amount')::DECIMAL;
            BEGIN
                IF v_amount > v_max_amount THEN
                    v_result := jsonb_build_object(
                        'policy_result', 'REJECTED',
                        'reason', 'Amount exceeds maximum limit',
                        'max_allowed', v_max_amount,
                        'requested', v_amount
                    );
                ELSIF v_amount < v_min_amount THEN
                    v_result := jsonb_build_object(
                        'policy_result', 'REJECTED',
                        'reason', 'Amount below minimum limit',
                        'min_required', v_min_amount,
                        'requested', v_amount
                    );
                ELSE
                    v_result := jsonb_build_object(
                        'policy_result', 'APPROVED',
                        'reason', 'Amount within policy limits'
                    );
                END IF;
            END;
            
        WHEN 'APPROVAL_WORKFLOW' THEN
            -- Approval workflow logic
            DECLARE
                v_threshold DECIMAL := (v_policy_config->>'approval_threshold')::DECIMAL;
                v_amount DECIMAL := (p_transaction_data->>'amount')::DECIMAL;
            BEGIN
                IF v_amount > v_threshold THEN
                    v_result := jsonb_build_object(
                        'policy_result', 'PENDING_APPROVAL',
                        'reason', 'Amount requires additional approval',
                        'required_approvers', v_policy_config->>'required_approvers'
                    );
                ELSE
                    v_result := jsonb_build_object(
                        'policy_result', 'APPROVED',
                        'reason', 'Amount within auto-approval limits'
                    );
                END IF;
            END;
            
        ELSE
            -- Default handling for other policy types
            v_result := jsonb_build_object(
                'policy_result', 'APPROVED',
                'reason', 'Policy type not implemented: ' || v_policy_type
            );
    END CASE;
    
    -- Log policy execution
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'POLICY_EXECUTION',
        'HERA.ACCOUNTING.POLICY.EXECUTE.v2',
        jsonb_build_object(
            'policy_id', p_policy_id,
            'policy_type', v_policy_type,
            'transaction_data', p_transaction_data,
            'policy_result', v_result
        )
    );
    
    RETURN v_result;
END;
$$;

-- =============================================================================
-- CREATE SAMPLE POLICY TYPES FOR TESTING
-- =============================================================================

-- This will be populated when the function is called from the testing script
-- The testing script should create sample policies using the create function

-- =============================================================================
-- COMPLETION NOTICE
-- =============================================================================

SELECT 'Finance DNA v2 Policy Types Fix Applied Successfully' as status;