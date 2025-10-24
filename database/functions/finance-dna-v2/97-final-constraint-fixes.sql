-- Finance DNA v2 - Final Constraint and Function Fixes
-- Smart Code: HERA.ACCOUNTING.FIXES.CONSTRAINTS.FINAL.v2
-- Fix smart code constraints and function conflicts

-- =============================================================================
-- STEP 1: DROP CONFLICTING FUNCTION VERSIONS
-- =============================================================================

-- Drop any extended versions that might conflict
DROP FUNCTION IF EXISTS hera_generate_trial_balance_v2(uuid, date, boolean, text, boolean, text[], boolean);
DROP FUNCTION IF EXISTS hera_generate_profit_loss_v2(uuid, date, date, boolean, date, date, text);
DROP FUNCTION IF EXISTS hera_generate_balance_sheet_v2(uuid, date, boolean, date, text);

-- =============================================================================
-- STEP 2: UPDATE SMART CODE CONSTRAINTS TO ACCEPT FINANCE DNA V2
-- =============================================================================

-- Check and update core_entities smart code constraint
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'core_entities_smart_code_ck' 
        AND table_name = 'core_entities'
    ) THEN
        ALTER TABLE core_entities DROP CONSTRAINT core_entities_smart_code_ck;
        RAISE NOTICE 'Dropped existing core_entities smart code constraint';
    END IF;
    
    -- Add new constraint that accepts both v1 and v2 formats
    ALTER TABLE core_entities ADD CONSTRAINT core_entities_smart_code_ck 
    CHECK (
        smart_code IS NULL OR 
        smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$' OR
        smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$'
    );
    RAISE NOTICE 'Added updated core_entities smart code constraint';
END$$;

-- Check and update universal_transactions smart code constraint
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ut_smart_code_ck' 
        AND table_name = 'universal_transactions'
    ) THEN
        ALTER TABLE universal_transactions DROP CONSTRAINT ut_smart_code_ck;
        RAISE NOTICE 'Dropped existing universal_transactions smart code constraint';
    END IF;
    
    -- Add new constraint that accepts both v1 and v2 formats
    ALTER TABLE universal_transactions ADD CONSTRAINT ut_smart_code_ck 
    CHECK (
        smart_code IS NULL OR 
        smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$' OR
        smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$'
    );
    RAISE NOTICE 'Added updated universal_transactions smart code constraint';
END$$;

-- Check and update universal_transaction_lines smart code constraint
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'utl_smart_code_ck' 
        AND table_name = 'universal_transaction_lines'
    ) THEN
        ALTER TABLE universal_transaction_lines DROP CONSTRAINT utl_smart_code_ck;
        RAISE NOTICE 'Dropped existing universal_transaction_lines smart code constraint';
    END IF;
    
    -- Add new constraint that accepts both v1 and v2 formats
    ALTER TABLE universal_transaction_lines ADD CONSTRAINT utl_smart_code_ck 
    CHECK (
        smart_code IS NULL OR 
        smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$' OR
        smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$'
    );
    RAISE NOTICE 'Added updated universal_transaction_lines smart code constraint';
END$$;

-- Check and update core_dynamic_data smart code constraint
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'core_dynamic_data_smart_code_ck' 
        AND table_name = 'core_dynamic_data'
    ) THEN
        ALTER TABLE core_dynamic_data DROP CONSTRAINT core_dynamic_data_smart_code_ck;
        RAISE NOTICE 'Dropped existing core_dynamic_data smart code constraint';
    END IF;
    
    -- Add new constraint that accepts both v1 and v2 formats
    ALTER TABLE core_dynamic_data ADD CONSTRAINT core_dynamic_data_smart_code_ck 
    CHECK (
        smart_code IS NULL OR 
        smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$' OR
        smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$'
    );
    RAISE NOTICE 'Added updated core_dynamic_data smart code constraint';
END$$;

-- =============================================================================
-- STEP 3: TEST SMART CODE VALIDATION
-- =============================================================================

-- Test Finance DNA v2 smart codes
DO $$
DECLARE
    test_codes TEXT[] := ARRAY[
        'HERA.ACCOUNTING.JOURNAL.ENTRY.V2',
        'HERA.ACCOUNTING.CHART.ACCOUNT.V2',
        'HERA.ACCOUNTING.AUDIT.OPERATION.V2',
        'HERA.ACCOUNTING.POLICY.ENTITY.V2'
    ];
    test_code TEXT;
    is_valid BOOLEAN;
BEGIN
    FOREACH test_code IN ARRAY test_codes
    LOOP
        SELECT validate_finance_dna_smart_code(test_code) INTO is_valid;
        IF is_valid THEN
            RAISE NOTICE 'Smart code valid: %', test_code;
        ELSE
            RAISE WARNING 'Smart code invalid: %', test_code;
        END IF;
    END LOOP;
END$$;

-- =============================================================================
-- STEP 4: CLEAN UP AND RECREATE CORE FUNCTIONS
-- =============================================================================

-- Ensure we have clean, simple function signatures
CREATE OR REPLACE FUNCTION hera_generate_trial_balance_v2(
    p_organization_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE,
    p_include_sub_accounts BOOLEAN DEFAULT true,
    p_currency_code TEXT DEFAULT 'USD'
) RETURNS TABLE(
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    debit_balance DECIMAL(15,2),
    credit_balance DECIMAL(15,2),
    net_balance DECIMAL(15,2),
    parent_account_code TEXT,
    account_level INTEGER,
    currency_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_access BOOLEAN := false;
BEGIN
    -- Validate organization access
    SELECT hera_validate_organization_access(p_organization_id) INTO v_org_access;
    IF NOT v_org_access THEN
        RAISE EXCEPTION 'Organization access denied: %', p_organization_id;
    END IF;
    
    RETURN QUERY
    WITH gl_accounts AS (
        SELECT 
            e.id as account_id,
            e.entity_code as account_code,
            e.entity_name as account_name,
            COALESCE(e.metadata->>'account_type', 'ASSET') as account_type,
            COALESCE(dd_parent.field_value_text, '') as parent_account_code,
            COALESCE(dd_level.field_value_number::INTEGER, 1) as account_level
        FROM core_entities e
        LEFT JOIN core_dynamic_data dd_parent ON (
            e.id = dd_parent.entity_id AND 
            dd_parent.field_name = 'parent_account_code' AND
            dd_parent.organization_id = p_organization_id
        )
        LEFT JOIN core_dynamic_data dd_level ON (
            e.id = dd_level.entity_id AND 
            dd_level.field_name = 'account_level' AND
            dd_level.organization_id = p_organization_id
        )
        WHERE e.organization_id = p_organization_id
        AND e.entity_type = 'gl_account'
    ),
    transaction_balances AS (
        SELECT 
            utl.entity_id as account_id,
            SUM(CASE 
                WHEN utl.line_type = 'DEBIT' THEN utl.line_amount 
                ELSE 0 
            END) as total_debits,
            SUM(CASE 
                WHEN utl.line_type = 'CREDIT' THEN utl.line_amount 
                ELSE 0 
            END) as total_credits
        FROM universal_transaction_lines utl
        INNER JOIN universal_transactions ut ON utl.transaction_id = ut.id
        WHERE ut.organization_id = p_organization_id
        AND ut.transaction_date <= p_as_of_date
        GROUP BY utl.entity_id
    )
    SELECT 
        gla.account_code,
        gla.account_name,
        gla.account_type,
        COALESCE(tb.total_debits, 0.00) as debit_balance,
        COALESCE(tb.total_credits, 0.00) as credit_balance,
        COALESCE(tb.total_debits, 0.00) - COALESCE(tb.total_credits, 0.00) as net_balance,
        gla.parent_account_code,
        gla.account_level,
        p_currency_code
    FROM gl_accounts gla
    LEFT JOIN transaction_balances tb ON gla.account_id = tb.account_id
    WHERE (p_include_sub_accounts OR gla.account_level = 1)
    ORDER BY gla.account_code;
END;
$$;

-- =============================================================================
-- STEP 5: CREATE TEST DATA WITH WORKING SMART CODES
-- =============================================================================

-- Function to create test GL accounts for testing
CREATE OR REPLACE FUNCTION create_test_gl_accounts_v2(
    p_organization_id UUID
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_created_count INTEGER := 0;
    v_account RECORD;
    v_entity_id UUID;
BEGIN
    -- Test accounts data
    FOR v_account IN 
        SELECT * FROM (VALUES
            ('1100', 'Cash', 'ASSET'),
            ('1200', 'Accounts Receivable', 'ASSET'),
            ('2100', 'Accounts Payable', 'LIABILITY'),
            ('3000', 'Owner Equity', 'EQUITY'),
            ('4100', 'Service Revenue', 'REVENUE'),
            ('5100', 'Operating Expenses', 'EXPENSE')
        ) AS accounts(code, name, type)
    LOOP
        BEGIN
            INSERT INTO core_entities (
                organization_id,
                entity_type,
                entity_name,
                entity_code,
                smart_code,
                metadata
            ) VALUES (
                p_organization_id,
                'gl_account',
                v_account.name,
                v_account.code,
                'HERA.ACCOUNTING.CHART.ACCOUNT.V2',
                jsonb_build_object('account_type', v_account.type)
            ) RETURNING id INTO v_entity_id;
            
            -- Add account type as dynamic data
            INSERT INTO core_dynamic_data (
                entity_id,
                organization_id,
                field_name,
                field_value_text,
                smart_code
            ) VALUES (
                v_entity_id,
                p_organization_id,
                'account_type',
                v_account.type,
                'HERA.ACCOUNTING.ACCOUNT.TYPE.V2'
            );
            
            v_created_count := v_created_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to create account %: %', v_account.code, SQLERRM;
        END;
    END LOOP;
    
    RETURN v_created_count;
END;
$$;

-- =============================================================================
-- COMPLETION LOGGING
-- =============================================================================

-- Log successful constraint fixes
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    smart_code,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'SYSTEM_UPDATE',
    'HERA.ACCOUNTING.FIXES.CONSTRAINTS.FINAL.V2',
    jsonb_build_object(
        'fix_type', 'smart_code_constraints_and_functions',
        'constraints_updated', ARRAY['core_entities', 'universal_transactions', 'universal_transaction_lines', 'core_dynamic_data'],
        'functions_cleaned', ARRAY['hera_generate_trial_balance_v2'],
        'helper_functions_created', ARRAY['create_test_gl_accounts_v2'],
        'fix_timestamp', NOW()
    )
);

SELECT 'Finance DNA v2 Final Constraint and Function Fixes Applied Successfully' as status;