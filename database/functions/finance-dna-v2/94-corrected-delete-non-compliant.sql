-- Finance DNA v2 - Delete Non-Compliant Data (Corrected)
-- Smart Code: HERA.ACCOUNTING.CLEANUP.NON.COMPLIANT.CORRECTED.v2
-- Delete all old data that doesn't follow new smart code rules with corrected column references

-- =============================================================================
-- STEP 1: FIRST DROP THE PROBLEMATIC TRIGGER
-- =============================================================================

-- Drop the trigger that has incorrect column references
DROP TRIGGER IF EXISTS trigger_gl_balance_validation ON universal_transaction_lines;

-- =============================================================================
-- STEP 2: ANALYZE NON-COMPLIANT DATA BEFORE DELETION
-- =============================================================================

DO $$
DECLARE
    v_entities_to_delete INTEGER;
    v_transactions_to_delete INTEGER;
    v_lines_to_delete INTEGER;
    v_dynamic_to_delete INTEGER;
BEGIN
    -- Count non-compliant entities
    SELECT COUNT(*) INTO v_entities_to_delete
    FROM core_entities 
    WHERE smart_code IS NOT NULL 
    AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
    AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');
    
    -- Count non-compliant transactions
    SELECT COUNT(*) INTO v_transactions_to_delete
    FROM universal_transactions 
    WHERE smart_code IS NOT NULL 
    AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
    AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');
    
    -- Count non-compliant transaction lines
    SELECT COUNT(*) INTO v_lines_to_delete
    FROM universal_transaction_lines 
    WHERE smart_code IS NOT NULL 
    AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
    AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');
    
    -- Count non-compliant dynamic data
    SELECT COUNT(*) INTO v_dynamic_to_delete
    FROM core_dynamic_data 
    WHERE smart_code IS NOT NULL 
    AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
    AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');
    
    RAISE NOTICE 'Data to be deleted:';
    RAISE NOTICE '  Entities: %', v_entities_to_delete;
    RAISE NOTICE '  Transactions: %', v_transactions_to_delete;
    RAISE NOTICE '  Transaction Lines: %', v_lines_to_delete;
    RAISE NOTICE '  Dynamic Data: %', v_dynamic_to_delete;
    RAISE NOTICE '';
    RAISE NOTICE 'Proceeding with deletion of non-compliant data...';
END$$;

-- =============================================================================
-- STEP 3: DELETE NON-COMPLIANT DATA (CASCADE ORDER)
-- =============================================================================

-- Delete transaction lines first (they reference transactions)
DELETE FROM universal_transaction_lines 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Delete transactions that have non-compliant smart codes
DELETE FROM universal_transactions 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Delete dynamic data for non-compliant smart codes
DELETE FROM core_dynamic_data 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Delete relationships that might reference non-compliant entities
DELETE FROM core_relationships 
WHERE from_entity_id IN (
    SELECT id FROM core_entities 
    WHERE smart_code IS NOT NULL 
    AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
    AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$')
)
OR to_entity_id IN (
    SELECT id FROM core_entities 
    WHERE smart_code IS NOT NULL 
    AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
    AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$')
);

-- Delete entities with non-compliant smart codes (last to avoid FK issues)
DELETE FROM core_entities 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- =============================================================================
-- STEP 4: VERIFY ALL DATA IS NOW COMPLIANT
-- =============================================================================

DO $$
DECLARE
    v_remaining_entities INTEGER;
    v_remaining_transactions INTEGER;
    v_remaining_lines INTEGER;
    v_remaining_dynamic INTEGER;
BEGIN
    -- Check remaining non-compliant data
    SELECT COUNT(*) INTO v_remaining_entities
    FROM core_entities 
    WHERE smart_code IS NOT NULL 
    AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
    AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');
    
    SELECT COUNT(*) INTO v_remaining_transactions
    FROM universal_transactions 
    WHERE smart_code IS NOT NULL 
    AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
    AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');
    
    SELECT COUNT(*) INTO v_remaining_lines
    FROM universal_transaction_lines 
    WHERE smart_code IS NOT NULL 
    AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
    AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');
    
    SELECT COUNT(*) INTO v_remaining_dynamic
    FROM core_dynamic_data 
    WHERE smart_code IS NOT NULL 
    AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
    AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');
    
    IF v_remaining_entities > 0 OR v_remaining_transactions > 0 OR 
       v_remaining_lines > 0 OR v_remaining_dynamic > 0 THEN
        RAISE EXCEPTION 'Still have non-compliant data: entities=%, transactions=%, lines=%, dynamic=%', 
            v_remaining_entities, v_remaining_transactions, v_remaining_lines, v_remaining_dynamic;
    END IF;
    
    RAISE NOTICE 'Data cleanup successful - all remaining data is compliant';
END$$;

-- =============================================================================
-- STEP 5: NOW SAFELY UPDATE CONSTRAINTS
-- =============================================================================

-- Drop and recreate core_entities constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'core_entities_smart_code_ck' 
        AND table_name = 'core_entities'
    ) THEN
        ALTER TABLE core_entities DROP CONSTRAINT core_entities_smart_code_ck;
        RAISE NOTICE 'Dropped existing core_entities smart code constraint';
    END IF;
    
    ALTER TABLE core_entities ADD CONSTRAINT core_entities_smart_code_ck 
    CHECK (
        smart_code IS NULL OR 
        smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$' OR
        smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$'
    );
    RAISE NOTICE 'Added updated core_entities smart code constraint';
END$$;

-- Drop and recreate universal_transactions constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ut_smart_code_ck' 
        AND table_name = 'universal_transactions'
    ) THEN
        ALTER TABLE universal_transactions DROP CONSTRAINT ut_smart_code_ck;
        RAISE NOTICE 'Dropped existing universal_transactions smart code constraint';
    END IF;
    
    ALTER TABLE universal_transactions ADD CONSTRAINT ut_smart_code_ck 
    CHECK (
        smart_code IS NULL OR 
        smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$' OR
        smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$'
    );
    RAISE NOTICE 'Added updated universal_transactions smart code constraint';
END$$;

-- Drop and recreate universal_transaction_lines constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'utl_smart_code_ck' 
        AND table_name = 'universal_transaction_lines'
    ) THEN
        ALTER TABLE universal_transaction_lines DROP CONSTRAINT utl_smart_code_ck;
        RAISE NOTICE 'Dropped existing universal_transaction_lines smart code constraint';
    END IF;
    
    ALTER TABLE universal_transaction_lines ADD CONSTRAINT utl_smart_code_ck 
    CHECK (
        smart_code IS NULL OR 
        smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$' OR
        smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$'
    );
    RAISE NOTICE 'Added updated universal_transaction_lines smart code constraint';
END$$;

-- Drop and recreate core_dynamic_data constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'core_dynamic_data_smart_code_ck' 
        AND table_name = 'core_dynamic_data'
    ) THEN
        ALTER TABLE core_dynamic_data DROP CONSTRAINT core_dynamic_data_smart_code_ck;
        RAISE NOTICE 'Dropped existing core_dynamic_data smart code constraint';
    END IF;
    
    ALTER TABLE core_dynamic_data ADD CONSTRAINT core_dynamic_data_smart_code_ck 
    CHECK (
        smart_code IS NULL OR 
        smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$' OR
        smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$'
    );
    RAISE NOTICE 'Added updated core_dynamic_data smart code constraint';
END$$;

-- =============================================================================
-- STEP 6: CREATE CORRECTED GL BALANCE TRIGGER
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
    -- Calculate debit/credit totals for transaction using correct column names
    SELECT 
        COALESCE(SUM(CASE WHEN line_type = 'DEBIT' THEN line_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN line_type = 'CREDIT' THEN line_amount ELSE 0 END), 0)
    INTO v_total_debits, v_total_credits
    FROM universal_transaction_lines
    WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id);
    
    -- Check balance (allow for rounding differences up to $0.01)
    v_balance_difference := ABS(v_total_debits - v_total_credits);
    
    IF v_balance_difference > 0.01 THEN
        RAISE EXCEPTION 'GL transaction not balanced: Debits=% Credits=% Difference=%', 
            v_total_debits, v_total_credits, v_balance_difference;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply corrected trigger to transaction lines table
CREATE TRIGGER trigger_gl_balance_validation
    AFTER INSERT OR UPDATE OR DELETE ON universal_transaction_lines
    FOR EACH ROW
    EXECUTE FUNCTION validate_gl_balance_trigger();

-- =============================================================================
-- STEP 7: DROP CONFLICTING FUNCTIONS AND CREATE CLEAN VERSIONS
-- =============================================================================

-- Drop conflicting function versions
DROP FUNCTION IF EXISTS hera_generate_trial_balance_v2(uuid, date, boolean, text, boolean, text[], boolean);
DROP FUNCTION IF EXISTS hera_generate_profit_loss_v2(uuid, date, date, boolean, date, date, text);
DROP FUNCTION IF EXISTS hera_generate_balance_sheet_v2(uuid, date, boolean, date, text);

-- Create helper function for test data
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
-- STEP 8: LOG COMPLETION
-- =============================================================================

-- Log successful completion
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    smart_code,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'SYSTEM_UPDATE',
    'HERA.ACCOUNTING.CLEANUP.NON.COMPLIANT.CORRECTED.V2',
    jsonb_build_object(
        'cleanup_type', 'delete_non_compliant_data_corrected',
        'constraints_updated', ARRAY['core_entities', 'universal_transactions', 'universal_transaction_lines', 'core_dynamic_data'],
        'functions_cleaned', ARRAY['hera_generate_trial_balance_v2'],
        'trigger_fixed', 'validate_gl_balance_trigger',
        'helper_functions_created', ARRAY['create_test_gl_accounts_v2'],
        'cleanup_timestamp', NOW()
    )
);

SELECT 'Finance DNA v2 Non-Compliant Data Cleanup (Corrected) Applied Successfully' as status;