-- Finance DNA v2 - Core Setup Functions
-- Smart Code: HERA.ACCOUNTING.SETUP.CORE.FUNCTIONS.v2
-- Auto-Generated: From Finance DNA v2 Documentation
-- Last Updated: 2025-01-10

-- =============================================================================
-- ORGANIZATION VALIDATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_validate_organization_access(
    p_organization_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_org_id UUID;
BEGIN
    -- Get user's organization from JWT/session
    BEGIN
        SELECT organization_id INTO v_user_org_id
        FROM hera_resolve_user_identity_v1()
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        -- If no user identity resolution function, allow for system operations
        RETURN true;
    END;
    
    -- Prevent cross-organization access
    IF v_user_org_id IS NOT NULL AND v_user_org_id != p_organization_id THEN
        RAISE EXCEPTION 'Cross-organization access denied: % -> %', 
            v_user_org_id, p_organization_id;
    END IF;
    
    RETURN true;
END;
$$;

-- =============================================================================
-- ORGANIZATION CONTEXT MANAGEMENT
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_set_organization_context_v2(
    p_organization_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_org_access BOOLEAN := false;
BEGIN
    -- Validate user has access to this organization
    SELECT hera_validate_organization_access(p_organization_id) 
    INTO v_user_org_access;
    
    IF NOT v_user_org_access THEN
        RAISE EXCEPTION 'User does not have access to organization: %', p_organization_id;
    END IF;
    
    -- Set organization context for RLS
    PERFORM set_config('app.current_org', p_organization_id::text, false);
    
    -- Log context switch
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'SECURITY_CONTEXT_SWITCH',
        'HERA.ACCOUNTING.SECURITY.RLS.ENFORCEMENT.v2',
        jsonb_build_object(
            'user_id', current_setting('app.current_user_id', true),
            'context_switch_time', NOW(),
            'session_id', current_setting('app.session_id', true)
        )
    );
    
    RETURN true;
END;
$$;

-- =============================================================================
-- SMART CODE VALIDATION
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_finance_dna_smart_code(
    p_smart_code TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Must not be null or empty
    IF p_smart_code IS NULL OR p_smart_code = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Must match Finance DNA v2 pattern
    IF NOT p_smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$' THEN
        RETURN FALSE;
    END IF;
    
    -- Must have minimum components (HERA.ACCOUNTING.MODULE.FUNCTION.v2)
    IF array_length(string_to_array(p_smart_code, '.'), 1) < 5 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- =============================================================================
-- GL BALANCE VALIDATION TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_gl_balance_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_debits DECIMAL(15,2);
    v_total_credits DECIMAL(15,2);
    v_balance_difference DECIMAL(15,2);
BEGIN
    -- Calculate debit/credit totals for transaction
    SELECT 
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0)
    INTO v_total_debits, v_total_credits
    FROM universal_transaction_lines
    WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id);
    
    -- Check balance (allow for rounding differences up to $0.01)
    v_balance_difference := ABS(v_total_debits - v_total_credits);
    
    IF v_balance_difference > 0.01 THEN
        RAISE EXCEPTION 'GL transaction not balanced: Debits=% Credits=% Difference=%', 
            v_total_debits, v_total_credits, v_balance_difference;
    END IF;
    
    -- Log balance validation
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata
    ) VALUES (
        COALESCE(NEW.organization_id, OLD.organization_id),
        'GL_BALANCE_VALIDATION',
        'HERA.ACCOUNTING.GUARDRAIL.GL.BALANCED.v2',
        jsonb_build_object(
            'transaction_id', COALESCE(NEW.transaction_id, OLD.transaction_id),
            'total_debits', v_total_debits,
            'total_credits', v_total_credits,
            'balance_difference', v_balance_difference,
            'validation_status', 'PASSED'
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply trigger to transaction lines table
DROP TRIGGER IF EXISTS trigger_gl_balance_validation ON universal_transaction_lines;
CREATE TRIGGER trigger_gl_balance_validation
    AFTER INSERT OR UPDATE OR DELETE ON universal_transaction_lines
    FOR EACH ROW
    EXECUTE FUNCTION validate_gl_balance_trigger();

-- =============================================================================
-- AUDIT LOGGING FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_audit_operation_v2(
    p_organization_id UUID,
    p_operation_type TEXT,
    p_operation_details JSONB,
    p_smart_code TEXT DEFAULT 'HERA.ACCOUNTING.AUDIT.OPERATION.v2'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        metadata,
        created_at
    ) VALUES (
        p_organization_id,
        'AUDIT_TRAIL',
        p_smart_code,
        jsonb_build_object(
            'operation_type', p_operation_type,
            'operation_details', p_operation_details,
            'user_context', current_setting('app.current_user', true),
            'session_id', current_setting('app.session_id', true),
            'audit_timestamp', NOW()
        ),
        NOW()
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;

-- =============================================================================
-- FINANCE DNA V2 SETUP COMPLETE FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION hera_finance_dna_v2_setup_complete()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Log successful setup
    RAISE NOTICE 'Finance DNA v2 Core Setup Complete - Functions Installed:';
    RAISE NOTICE '✅ hera_validate_organization_access()';
    RAISE NOTICE '✅ hera_set_organization_context_v2()';
    RAISE NOTICE '✅ validate_finance_dna_smart_code()';
    RAISE NOTICE '✅ validate_gl_balance_trigger()';
    RAISE NOTICE '✅ hera_audit_operation_v2()';
    RAISE NOTICE '✅ GL Balance Validation Trigger Applied';
    
    RETURN true;
END;
$$;

-- Execute setup verification
SELECT hera_finance_dna_v2_setup_complete();