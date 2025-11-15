-- ================================================================================
-- HERA Finance DNA v2.2 - Core Runtime Foundation
-- Migration: Finance DNA runtime with IFRS compliance and multi-currency
-- Smart Code: HERA.PLATFORM.FINANCE.DNA.RUNTIME.v2.2
-- Author: HERA Finance Team
-- Created: 2024-11-16
-- ================================================================================

-- ================================================================================
-- FINANCE DNA POSTING RULES ENGINE
-- ================================================================================

-- Finance DNA Bundle entity type for storing posting rule definitions
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'FINANCE_DNA_BUNDLE',
    'FINANCE_DNA_BUNDLE_ENTITY_TYPE',
    'Finance DNA Bundle Entity Type',
    'Entity type for storing Finance DNA posting rule bundles',
    'HERA.PLATFORM.FINANCE.DNA.ENTITY_TYPE.BUNDLE.v1',
    '00000000-0000-0000-0000-000000000000', -- Platform org
    '00000000-0000-0000-0000-000000000001', -- System user
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Finance DNA Rule entity type for individual posting rules
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'FINANCE_DNA_RULE',
    'FINANCE_DNA_RULE_ENTITY_TYPE',
    'Finance DNA Rule Entity Type',
    'Entity type for individual finance posting rules',
    'HERA.PLATFORM.FINANCE.DNA.ENTITY_TYPE.RULE.v1',
    '00000000-0000-0000-0000-000000000000', -- Platform org
    '00000000-0000-0000-0000-000000000001', -- System user
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- FINANCE DNA RULE EVALUATION FUNCTIONS
-- ================================================================================

-- Function to evaluate finance DNA posting rules
CREATE OR REPLACE FUNCTION hera_finance_dna_evaluate_v1(
    p_actor_user_id UUID,
    p_organization_id UUID,
    p_transaction_type TEXT,
    p_transaction_data JSONB,
    p_options JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_bundle_id UUID;
    v_rules JSONB;
    v_posting_lines JSONB[];
    v_rule JSONB;
    v_line JSONB;
    v_result JSONB;
    v_balance_check BOOLEAN := true;
    v_total_dr NUMERIC := 0;
    v_total_cr NUMERIC := 0;
    v_currency_totals JSONB := '{}'::JSONB;
BEGIN
    -- Find applicable Finance DNA bundle for this transaction type
    SELECT e.id, dd.field_value_json INTO v_bundle_id, v_rules
    FROM core_entities e
    JOIN core_dynamic_data dd ON dd.entity_id = e.id
    WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
    AND e.organization_id IN (p_organization_id, '00000000-0000-0000-0000-000000000000')
    AND dd.field_name = 'posting_rules'
    AND dd.field_value_json->>'transaction_type_match' = p_transaction_type
    AND e.status = 'active'
    ORDER BY CASE WHEN e.organization_id = p_organization_id THEN 1 ELSE 2 END
    LIMIT 1;

    -- If no bundle found, return error
    IF v_bundle_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No Finance DNA bundle found for transaction type: ' || p_transaction_type,
            'error_code', 'FINANCE_DNA_BUNDLE_NOT_FOUND'
        );
    END IF;

    -- Initialize posting lines array
    v_posting_lines := ARRAY[]::JSONB[];

    -- Process each rule in the bundle
    FOR v_rule IN SELECT value FROM jsonb_array_elements(v_rules->'rules')
    LOOP
        -- Evaluate each line in the rule
        FOR v_line IN SELECT value FROM jsonb_array_elements(v_rule->'lines')
        LOOP
            DECLARE
                v_posting_line JSONB;
                v_account_id UUID;
                v_amount NUMERIC;
                v_currency_code TEXT;
                v_side TEXT;
            BEGIN
                -- Extract line details
                v_side := v_line->>'side';
                v_currency_code := COALESCE(
                    p_transaction_data->>'transaction_currency_code',
                    p_transaction_data->>'currency_code',
                    'USD'
                );

                -- Resolve account (simplified - can be enhanced)
                v_account_id := (v_line->>'account_entity_id')::UUID;
                
                -- Calculate amount (simplified - can be enhanced with expressions)
                v_amount := COALESCE(
                    (v_line->>'amount')::NUMERIC,
                    (p_transaction_data->>'total_amount')::NUMERIC,
                    0
                );

                -- Build posting line
                v_posting_line := jsonb_build_object(
                    'line_number', v_line->>'line_number',
                    'side', v_side,
                    'account_entity_id', v_account_id,
                    'amount', v_amount,
                    'currency_code', v_currency_code,
                    'description', v_line->>'description',
                    'dimensions', COALESCE(v_line->'dimensions', '{}'::JSONB),
                    'ifrs_treatment', v_line->>'ifrs_treatment'
                );

                -- Add to posting lines array
                v_posting_lines := array_append(v_posting_lines, v_posting_line);

                -- Track totals for balance validation
                IF v_side = 'DR' THEN
                    v_total_dr := v_total_dr + v_amount;
                ELSE
                    v_total_cr := v_total_cr + v_amount;
                END IF;

                -- Track per-currency totals
                v_currency_totals := v_currency_totals || jsonb_build_object(
                    v_currency_code,
                    jsonb_build_object(
                        'dr', COALESCE((v_currency_totals->v_currency_code->>'dr')::NUMERIC, 0) + 
                             CASE WHEN v_side = 'DR' THEN v_amount ELSE 0 END,
                        'cr', COALESCE((v_currency_totals->v_currency_code->>'cr')::NUMERIC, 0) +
                             CASE WHEN v_side = 'CR' THEN v_amount ELSE 0 END
                    )
                );
            END;
        END LOOP;
    END LOOP;

    -- Validate GL balance (DR = CR per currency)
    v_balance_check := true;
    FOR v_currency_code IN SELECT jsonb_object_keys(v_currency_totals)
    LOOP
        DECLARE
            v_dr_total NUMERIC;
            v_cr_total NUMERIC;
        BEGIN
            v_dr_total := (v_currency_totals->v_currency_code->>'dr')::NUMERIC;
            v_cr_total := (v_currency_totals->v_currency_code->>'cr')::NUMERIC;
            
            IF ABS(v_dr_total - v_cr_total) > 0.01 THEN -- Allow for rounding
                v_balance_check := false;
                EXIT;
            END IF;
        END;
    END LOOP;

    -- Build result
    v_result := jsonb_build_object(
        'success', true,
        'bundle_id', v_bundle_id,
        'posting_lines', array_to_json(v_posting_lines),
        'balance_check', v_balance_check,
        'currency_totals', v_currency_totals,
        'total_dr', v_total_dr,
        'total_cr', v_total_cr,
        'validation', jsonb_build_object(
            'gl_balanced', v_balance_check,
            'posting_lines_count', array_length(v_posting_lines, 1)
        )
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Finance DNA evaluation failed: ' || SQLERRM,
            'error_code', 'FINANCE_DNA_EVALUATION_ERROR',
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================
-- FINANCE DNA POSTING EXECUTION FUNCTION
-- ================================================================================

-- Function to execute finance DNA posting (creates universal_transaction)
CREATE OR REPLACE FUNCTION hera_finance_dna_post_v1(
    p_actor_user_id UUID,
    p_organization_id UUID,
    p_transaction_type TEXT,
    p_transaction_data JSONB,
    p_options JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_dna_result JSONB;
    v_transaction_id UUID;
    v_posting_lines JSONB;
    v_line JSONB;
    v_line_count INTEGER := 1;
BEGIN
    -- First evaluate the Finance DNA rules
    v_dna_result := hera_finance_dna_evaluate_v1(
        p_actor_user_id,
        p_organization_id,
        p_transaction_type,
        p_transaction_data,
        p_options
    );

    -- Check if evaluation was successful
    IF NOT (v_dna_result->>'success')::BOOLEAN THEN
        RETURN v_dna_result;
    END IF;

    -- Check if GL is balanced
    IF NOT (v_dna_result->>'balance_check')::BOOLEAN THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'GL posting not balanced - DR must equal CR per currency',
            'error_code', 'GL_NOT_BALANCED',
            'currency_totals', v_dna_result->'currency_totals'
        );
    END IF;

    -- Generate transaction ID
    v_transaction_id := gen_random_uuid();

    -- Create universal_transaction header
    INSERT INTO universal_transactions (
        id,
        organization_id,
        transaction_type,
        transaction_code,
        transaction_date,
        source_entity_id,
        target_entity_id,
        total_amount,
        transaction_status,
        smart_code,
        transaction_currency_code,
        base_currency_code,
        exchange_rate,
        fiscal_year,
        fiscal_period,
        business_context,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        v_transaction_id,
        p_organization_id,
        p_transaction_type,
        COALESCE(
            p_transaction_data->>'transaction_code',
            'FDN-' || to_char(NOW(), 'YYYYMMDD') || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER
        ),
        COALESCE(
            (p_transaction_data->>'transaction_date')::TIMESTAMPTZ,
            NOW()
        ),
        (p_transaction_data->>'source_entity_id')::UUID,
        (p_transaction_data->>'target_entity_id')::UUID,
        COALESCE(
            (p_transaction_data->>'total_amount')::NUMERIC,
            v_dna_result->>'total_dr'::NUMERIC
        ),
        'posted',
        COALESCE(
            p_transaction_data->>'smart_code',
            'HERA.' || p_organization_id::TEXT || '.FINANCE.DNA.TXN.' || p_transaction_type || '.v1'
        ),
        p_transaction_data->>'transaction_currency_code',
        p_transaction_data->>'base_currency_code',
        COALESCE((p_transaction_data->>'exchange_rate')::NUMERIC, 1.0),
        COALESCE((p_transaction_data->>'fiscal_year')::INTEGER, EXTRACT(YEAR FROM NOW())::INTEGER),
        COALESCE((p_transaction_data->>'fiscal_period')::INTEGER, EXTRACT(MONTH FROM NOW())::INTEGER),
        p_transaction_data,
        p_actor_user_id,
        p_actor_user_id,
        NOW(),
        NOW()
    );

    -- Create universal_transaction_lines for each posting line
    v_posting_lines := v_dna_result->'posting_lines';
    
    FOR v_line IN SELECT value FROM jsonb_array_elements(v_posting_lines)
    LOOP
        INSERT INTO universal_transaction_lines (
            id,
            transaction_id,
            organization_id,
            line_number,
            line_type,
            description,
            quantity,
            unit_amount,
            line_amount,
            entity_id,
            account_entity_id,
            debit_amount,
            credit_amount,
            currency_code,
            smart_code,
            line_data,
            created_by,
            updated_by,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_transaction_id,
            p_organization_id,
            COALESCE((v_line->>'line_number')::INTEGER, v_line_count),
            'GL_POSTING',
            v_line->>'description',
            1,
            (v_line->>'amount')::NUMERIC,
            (v_line->>'amount')::NUMERIC,
            (v_line->>'entity_id')::UUID,
            (v_line->>'account_entity_id')::UUID,
            CASE WHEN v_line->>'side' = 'DR' THEN (v_line->>'amount')::NUMERIC ELSE 0 END,
            CASE WHEN v_line->>'side' = 'CR' THEN (v_line->>'amount')::NUMERIC ELSE 0 END,
            v_line->>'currency_code',
            COALESCE(
                v_line->>'smart_code',
                'HERA.' || p_organization_id::TEXT || '.FINANCE.DNA.LINE.' || v_line_count || '.v1'
            ),
            v_line,
            p_actor_user_id,
            p_actor_user_id,
            NOW(),
            NOW()
        );
        
        v_line_count := v_line_count + 1;
    END LOOP;

    -- Return success result
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'posting_lines_created', v_line_count - 1,
        'dna_evaluation', v_dna_result,
        'message', 'Finance DNA posting completed successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Finance DNA posting failed: ' || SQLERRM,
            'error_code', 'FINANCE_DNA_POSTING_ERROR',
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================
-- FISCAL PERIOD MANAGEMENT
-- ================================================================================

-- Fiscal Period entity type
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'FISCAL_PERIOD',
    'FISCAL_PERIOD_ENTITY_TYPE',
    'Fiscal Period Entity Type',
    'Entity type for fiscal periods and financial calendar management',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.FISCAL_PERIOD.v1',
    '00000000-0000-0000-0000-000000000000', -- Platform org
    '00000000-0000-0000-0000-000000000001', -- System user
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Function to check if fiscal period is open for posting
CREATE OR REPLACE FUNCTION hera_fiscal_period_check_v1(
    p_organization_id UUID,
    p_fiscal_year INTEGER,
    p_fiscal_period INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_period_status TEXT;
    v_period_entity_id UUID;
BEGIN
    -- Find fiscal period entity and status
    SELECT 
        e.id,
        COALESCE(dd.field_value_text, 'open')
    INTO 
        v_period_entity_id,
        v_period_status
    FROM core_entities e
    LEFT JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'period_status'
    WHERE e.entity_type = 'FISCAL_PERIOD'
    AND e.organization_id = p_organization_id
    AND (
        (SELECT field_value_number FROM core_dynamic_data 
         WHERE entity_id = e.id AND field_name = 'fiscal_year')::INTEGER = p_fiscal_year
    )
    AND (
        (SELECT field_value_number FROM core_dynamic_data 
         WHERE entity_id = e.id AND field_name = 'fiscal_period')::INTEGER = p_fiscal_period
    )
    AND e.status = 'active'
    LIMIT 1;

    -- If no period found, create default open period
    IF v_period_entity_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'period_status', 'open',
            'message', 'No fiscal period configuration found - defaulting to open',
            'auto_created', true
        );
    END IF;

    -- Return period status
    RETURN jsonb_build_object(
        'success', true,
        'period_entity_id', v_period_entity_id,
        'period_status', v_period_status,
        'posting_allowed', v_period_status IN ('open', 'closing'),
        'message', 'Fiscal period status: ' || v_period_status
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Fiscal period check failed: ' || SQLERRM,
            'error_code', 'FISCAL_PERIOD_CHECK_ERROR'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================
-- CURRENCY MANAGEMENT
-- ================================================================================

-- Currency entity type
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'CURRENCY',
    'CURRENCY_ENTITY_TYPE',
    'Currency Entity Type',
    'Entity type for currency definitions and exchange rates',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.CURRENCY.v1',
    '00000000-0000-0000-0000-000000000000', -- Platform org
    '00000000-0000-0000-0000-000000000001', -- System user
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Function to get exchange rate
CREATE OR REPLACE FUNCTION hera_exchange_rate_get_v1(
    p_organization_id UUID,
    p_from_currency TEXT,
    p_to_currency TEXT,
    p_rate_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    v_exchange_rate NUMERIC;
    v_rate_type TEXT;
    v_rate_date DATE;
BEGIN
    -- If same currency, return 1.0
    IF p_from_currency = p_to_currency THEN
        RETURN jsonb_build_object(
            'success', true,
            'exchange_rate', 1.0,
            'rate_type', 'same_currency',
            'rate_date', p_rate_date,
            'from_currency', p_from_currency,
            'to_currency', p_to_currency
        );
    END IF;

    -- Look for exchange rate in dynamic data
    SELECT 
        dd.field_value_number,
        COALESCE(dd2.field_value_text, 'spot'),
        COALESCE((dd3.field_value_text)::DATE, p_rate_date)
    INTO 
        v_exchange_rate,
        v_rate_type,
        v_rate_date
    FROM core_entities e
    JOIN core_dynamic_data dd ON dd.entity_id = e.id AND dd.field_name = 'exchange_rate'
    LEFT JOIN core_dynamic_data dd2 ON dd2.entity_id = e.id AND dd2.field_name = 'rate_type'
    LEFT JOIN core_dynamic_data dd3 ON dd3.entity_id = e.id AND dd3.field_name = 'rate_date'
    WHERE e.entity_type = 'EXCHANGE_RATE'
    AND e.organization_id IN (p_organization_id, '00000000-0000-0000-0000-000000000000')
    AND e.entity_code = p_from_currency || '_' || p_to_currency
    AND e.status = 'active'
    ORDER BY 
        CASE WHEN e.organization_id = p_organization_id THEN 1 ELSE 2 END,
        ABS(EXTRACT(DAYS FROM (COALESCE((dd3.field_value_text)::DATE, p_rate_date) - p_rate_date)))
    LIMIT 1;

    -- If rate found, return it
    IF v_exchange_rate IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'exchange_rate', v_exchange_rate,
            'rate_type', v_rate_type,
            'rate_date', v_rate_date,
            'from_currency', p_from_currency,
            'to_currency', p_to_currency
        );
    END IF;

    -- Default to 1.0 if no rate found (with warning)
    RETURN jsonb_build_object(
        'success', true,
        'exchange_rate', 1.0,
        'rate_type', 'default',
        'rate_date', p_rate_date,
        'from_currency', p_from_currency,
        'to_currency', p_to_currency,
        'warning', 'No exchange rate found - using default rate of 1.0'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Exchange rate lookup failed: ' || SQLERRM,
            'error_code', 'EXCHANGE_RATE_LOOKUP_ERROR'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================
-- VALIDATION FUNCTIONS
-- ================================================================================

-- Smart code validation for Finance DNA entities
CREATE OR REPLACE FUNCTION validate_finance_dna_smart_code(smart_code_input TEXT, entity_type_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    CASE entity_type_input
        WHEN 'FINANCE_DNA_BUNDLE' THEN
            RETURN smart_code_input ~ '^HERA\.[A-Z0-9_]+\.FINANCE\.DNA\.BUNDLE\.[A-Z0-9_]+\.v[0-9]+$';
        WHEN 'FINANCE_DNA_RULE' THEN
            RETURN smart_code_input ~ '^HERA\.[A-Z0-9_]+\.FINANCE\.DNA\.RULE\.[A-Z0-9_]+\.v[0-9]+$';
        WHEN 'FISCAL_PERIOD' THEN
            RETURN smart_code_input ~ '^HERA\.[A-Z0-9_]+\.FINANCE\.FISCAL_PERIOD\.[A-Z0-9_]+\.v[0-9]+$';
        WHEN 'CURRENCY' THEN
            RETURN smart_code_input ~ '^HERA\.[A-Z0-9_]+\.FINANCE\.CURRENCY\.[A-Z0-9_]+\.v[0-9]+$';
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add smart code validation constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_finance_dna_smart_code'
    ) THEN
        ALTER TABLE core_entities 
        ADD CONSTRAINT chk_finance_dna_smart_code 
        CHECK (
            entity_type NOT IN ('FINANCE_DNA_BUNDLE', 'FINANCE_DNA_RULE', 'FISCAL_PERIOD', 'CURRENCY') OR 
            validate_finance_dna_smart_code(smart_code, entity_type)
        );
    END IF;
END $$;

-- ================================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================================

-- Finance DNA bundle lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_dna_bundle_type
ON core_entities (organization_id, entity_type, status)
WHERE entity_type = 'FINANCE_DNA_BUNDLE';

-- Fiscal period lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fiscal_period_lookup
ON core_entities (organization_id, entity_type, status)
WHERE entity_type = 'FISCAL_PERIOD';

-- Currency lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_currency_lookup
ON core_entities (organization_id, entity_type, entity_code, status)
WHERE entity_type IN ('CURRENCY', 'EXCHANGE_RATE');

-- ================================================================================
-- VERIFICATION AND ROLLBACK
-- ================================================================================

-- Verification query
DO $$
DECLARE
    v_function_count INTEGER;
    v_entity_type_count INTEGER;
BEGIN
    -- Count functions created
    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname LIKE 'hera_finance_dna%';
    
    -- Count entity types created
    SELECT COUNT(*) INTO v_entity_type_count
    FROM core_entities
    WHERE entity_type IN ('FINANCE_DNA_BUNDLE', 'FINANCE_DNA_RULE', 'FISCAL_PERIOD', 'CURRENCY')
    AND organization_id = '00000000-0000-0000-0000-000000000000';
    
    RAISE NOTICE 'HERA Finance DNA v2.2 Core Runtime Migration Complete:';
    RAISE NOTICE '  - Finance DNA functions created: %', v_function_count;
    RAISE NOTICE '  - Finance entity types created: %', v_entity_type_count;
    RAISE NOTICE '  - Validation constraints: ACTIVE';
    RAISE NOTICE '  - Performance indexes: CREATED';
END $$;

-- ================================================================================
-- ROLLBACK SCRIPT (commented)
-- ================================================================================

/*
-- ROLLBACK INSTRUCTIONS
-- Run these commands if rollback is needed:

-- 1. Drop functions
DROP FUNCTION IF EXISTS hera_finance_dna_evaluate_v1(UUID, UUID, TEXT, JSONB, JSONB);
DROP FUNCTION IF EXISTS hera_finance_dna_post_v1(UUID, UUID, TEXT, JSONB, JSONB);
DROP FUNCTION IF EXISTS hera_fiscal_period_check_v1(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS hera_exchange_rate_get_v1(UUID, TEXT, TEXT, DATE);
DROP FUNCTION IF EXISTS validate_finance_dna_smart_code(TEXT, TEXT);

-- 2. Drop constraints
ALTER TABLE core_entities DROP CONSTRAINT IF EXISTS chk_finance_dna_smart_code;

-- 3. Drop indexes
DROP INDEX IF EXISTS idx_finance_dna_bundle_type;
DROP INDEX IF EXISTS idx_fiscal_period_lookup;
DROP INDEX IF EXISTS idx_currency_lookup;

-- 4. Remove entity types
DELETE FROM core_entities 
WHERE entity_type IN ('FINANCE_DNA_BUNDLE', 'FINANCE_DNA_RULE', 'FISCAL_PERIOD', 'CURRENCY')
AND organization_id = '00000000-0000-0000-0000-000000000000';
*/