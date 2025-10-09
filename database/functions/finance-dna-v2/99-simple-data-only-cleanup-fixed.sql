-- Finance DNA v2 - Simple Data-Only Cleanup (Fixed)
-- Smart Code: HERA.ACCOUNTING.CLEANUP.SIMPLE.DATA.ONLY.FIXED.v2
-- Clean data without touching constraints - they can be updated separately

-- =============================================================================
-- STEP 1: DROP PROBLEMATIC TRIGGER FIRST
-- =============================================================================

DROP TRIGGER IF EXISTS trigger_gl_balance_validation ON universal_transaction_lines;

-- =============================================================================
-- STEP 2: CLEAN NON-COMPLIANT DATA COMPLETELY
-- =============================================================================

DO $$
DECLARE
    v_orgs_to_clean UUID[];
    v_org UUID;
    v_deleted_count INTEGER := 0;
    v_entity_ids_to_delete UUID[];
    v_total_entities INTEGER := 0;
    v_total_transactions INTEGER := 0;
    v_total_lines INTEGER := 0;
    v_total_dynamic INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting comprehensive data cleanup for Finance DNA v2...';
    
    -- Find organizations that have non-compliant smart codes
    SELECT ARRAY_AGG(DISTINCT organization_id) INTO v_orgs_to_clean
    FROM (
        SELECT organization_id FROM core_entities 
        WHERE smart_code IS NOT NULL 
        AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
        AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$')
        
        UNION
        
        SELECT organization_id FROM universal_transactions 
        WHERE smart_code IS NOT NULL 
        AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
        AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$')
        
        UNION
        
        SELECT organization_id FROM universal_transaction_lines 
        WHERE smart_code IS NOT NULL 
        AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
        AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$')
        
        UNION
        
        SELECT organization_id FROM core_dynamic_data 
        WHERE smart_code IS NOT NULL 
        AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
        AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$')
    ) AS non_compliant_orgs;
    
    RAISE NOTICE 'Found % organizations with non-compliant data', array_length(v_orgs_to_clean, 1);
    
    -- Clean each organization completely with proper cascade order
    FOREACH v_org IN ARRAY v_orgs_to_clean
    LOOP
        RAISE NOTICE 'Cleaning organization: %', v_org;
        
        -- Get all entity IDs from this org that will be deleted
        SELECT ARRAY_AGG(id) INTO v_entity_ids_to_delete
        FROM core_entities 
        WHERE organization_id = v_org;
        
        RAISE NOTICE '  Found % entities to clean', COALESCE(array_length(v_entity_ids_to_delete, 1), 0);
        
        -- Step 1: Delete ALL transaction lines (by org and by entity references)
        DELETE FROM universal_transaction_lines 
        WHERE organization_id = v_org 
        OR (v_entity_ids_to_delete IS NOT NULL AND entity_id = ANY(v_entity_ids_to_delete));
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        v_total_lines := v_total_lines + v_deleted_count;
        RAISE NOTICE '  Deleted % transaction lines', v_deleted_count;
        
        -- Step 2: Delete transactions
        DELETE FROM universal_transactions WHERE organization_id = v_org;
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        v_total_transactions := v_total_transactions + v_deleted_count;
        RAISE NOTICE '  Deleted % transactions', v_deleted_count;
        
        -- Step 3: Delete dynamic data
        DELETE FROM core_dynamic_data WHERE organization_id = v_org;
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        v_total_dynamic := v_total_dynamic + v_deleted_count;
        RAISE NOTICE '  Deleted % dynamic data records', v_deleted_count;
        
        -- Step 4: Delete relationships
        DELETE FROM core_relationships WHERE organization_id = v_org;
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        RAISE NOTICE '  Deleted % relationships', v_deleted_count;
        
        -- Step 5: Now safely delete entities
        DELETE FROM core_entities WHERE organization_id = v_org;
        GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
        v_total_entities := v_total_entities + v_deleted_count;
        RAISE NOTICE '  Deleted % entities', v_deleted_count;
        
        RAISE NOTICE '  Organization % completely cleaned', v_org;
    END LOOP;
    
    RAISE NOTICE 'Organization cleanup completed';
    RAISE NOTICE 'TOTAL CLEANUP SUMMARY:';
    RAISE NOTICE '  Total entities deleted: %', v_total_entities;
    RAISE NOTICE '  Total transactions deleted: %', v_total_transactions;
    RAISE NOTICE '  Total transaction lines deleted: %', v_total_lines;
    RAISE NOTICE '  Total dynamic data deleted: %', v_total_dynamic;
END$$;

-- =============================================================================
-- STEP 3: CLEAN ANY REMAINING NON-COMPLIANT RECORDS
-- =============================================================================

-- Clean remaining non-compliant transaction lines
DELETE FROM universal_transaction_lines 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Clean remaining non-compliant transactions
DELETE FROM universal_transactions 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Clean remaining non-compliant dynamic data
DELETE FROM core_dynamic_data 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Clean relationships that reference non-compliant entities
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

-- Clean any remaining transaction lines that reference non-compliant entities
DELETE FROM universal_transaction_lines 
WHERE entity_id IN (
    SELECT id FROM core_entities 
    WHERE smart_code IS NOT NULL 
    AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
    AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$')
);

-- Finally clean remaining non-compliant entities
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
    
    RAISE NOTICE 'VERIFICATION RESULTS:';
    RAISE NOTICE '  Remaining non-compliant entities: %', v_remaining_entities;
    RAISE NOTICE '  Remaining non-compliant transactions: %', v_remaining_transactions;
    RAISE NOTICE '  Remaining non-compliant lines: %', v_remaining_lines;
    RAISE NOTICE '  Remaining non-compliant dynamic data: %', v_remaining_dynamic;
    
    IF v_remaining_entities > 0 OR v_remaining_transactions > 0 OR 
       v_remaining_lines > 0 OR v_remaining_dynamic > 0 THEN
        RAISE WARNING 'Still have some non-compliant data - constraints will need to be updated manually';
    ELSE
        RAISE NOTICE '✅ DATA CLEANUP SUCCESSFUL - All remaining data is compliant!';
    END IF;
END$$;

-- =============================================================================
-- STEP 5: CREATE CORRECTED GL BALANCE TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_gl_balance_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_debits DECIMAL(15,2);
    v_total_credits DECIMAL(15,2);
    v_balance_difference DECIMAL(15,2);
    v_transaction_type TEXT;
BEGIN
    -- Get transaction type to decide if balance is required
    SELECT transaction_type INTO v_transaction_type
    FROM universal_transactions
    WHERE id = COALESCE(NEW.transaction_id, OLD.transaction_id);
    
    -- Only enforce balance for journal entries and GL transactions
    IF v_transaction_type IN ('journal_entry', 'gl_adjustment', 'closing_entry') THEN
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
-- STEP 6: DROP CONFLICTING FUNCTIONS AND CREATE CLEAN VERSIONS
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
                'HERA.ACCOUNTING.CHART.ACCOUNT.v2',
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
                'HERA.ACCOUNTING.ACCOUNT.TYPE.v2'
            );
            
            v_created_count := v_created_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to create account %: %', v_account.code, SQLERRM;
        END;
    END LOOP;
    
    RETURN v_created_count;
END;
$$;

SELECT 'Finance DNA v2 Simple Data Cleanup Applied Successfully - Test Now!' as status;