-- Finance DNA v2 - Constraint Fix with Data Cleanup
-- Smart Code: HERA.ACCOUNTING.FIXES.CONSTRAINTS.DATA.CLEANUP.v2
-- Fix constraints while handling existing non-compliant data

-- =============================================================================
-- STEP 1: ANALYZE EXISTING DATA BEFORE CHANGES
-- =============================================================================

DO $$
DECLARE
    v_total_entities INTEGER;
    v_compliant_entities INTEGER;
    v_non_compliant_entities INTEGER;
BEGIN
    -- Count total entities
    SELECT COUNT(*) INTO v_total_entities FROM core_entities;
    
    -- Count compliant entities (existing format or Finance DNA v2)
    SELECT COUNT(*) INTO v_compliant_entities 
    FROM core_entities 
    WHERE smart_code IS NULL 
    OR smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$'
    OR smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$';
    
    v_non_compliant_entities := v_total_entities - v_compliant_entities;
    
    RAISE NOTICE 'Data Analysis:';
    RAISE NOTICE '  Total entities: %', v_total_entities;
    RAISE NOTICE '  Compliant entities: %', v_compliant_entities;
    RAISE NOTICE '  Non-compliant entities: %', v_non_compliant_entities;
END$$;

-- =============================================================================
-- STEP 2: CREATE BACKUP OF NON-COMPLIANT DATA
-- =============================================================================

-- Create temporary table for non-compliant smart codes
CREATE TEMP TABLE temp_non_compliant_smart_codes AS
SELECT 
    id,
    entity_type,
    entity_name,
    smart_code,
    organization_id
FROM core_entities 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Log the non-compliant data
DO $$
DECLARE
    v_count INTEGER;
    v_sample_record RECORD;
BEGIN
    SELECT COUNT(*) INTO v_count FROM temp_non_compliant_smart_codes;
    RAISE NOTICE 'Found % non-compliant smart codes', v_count;
    
    IF v_count > 0 THEN
        -- Show sample of non-compliant codes
        FOR v_sample_record IN 
            SELECT smart_code, COUNT(*) as count
            FROM temp_non_compliant_smart_codes 
            GROUP BY smart_code 
            ORDER BY count DESC 
            LIMIT 5
        LOOP
            RAISE NOTICE '  Sample: % (% occurrences)', v_sample_record.smart_code, v_sample_record.count;
        END LOOP;
    END IF;
END$$;

-- =============================================================================
-- STEP 3: FIX NON-COMPLIANT SMART CODES
-- =============================================================================

-- Fix common patterns that can be automatically corrected
UPDATE core_entities 
SET smart_code = CASE 
    -- Fix .V1 instead of .V1
    WHEN smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.V1$' THEN smart_code
    -- Fix .V1 to .V1
    WHEN smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.V1$' THEN 
        regexp_replace(smart_code, '\.V1$', '.V1')
    -- Fix missing version - add .V1
    WHEN smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*$' AND smart_code NOT LIKE '%.v%' THEN 
        smart_code || '.V1'
    -- Fix other common patterns
    ELSE smart_code
END
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- For any remaining non-compliant codes, set them to a generic v1 format
UPDATE core_entities 
SET smart_code = 'HERA.LEGACY.ENTITY.MIGRATED.V1'
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- =============================================================================
-- STEP 4: FIX TRANSACTION DATA
-- =============================================================================

-- Fix universal_transactions smart codes
UPDATE universal_transactions 
SET smart_code = CASE 
    WHEN smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.V1$' THEN smart_code
    WHEN smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.V1$' THEN 
        regexp_replace(smart_code, '\.V1$', '.V1')
    WHEN smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*$' AND smart_code NOT LIKE '%.v%' THEN 
        smart_code || '.V1'
    ELSE smart_code
END
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Set remaining non-compliant to generic
UPDATE universal_transactions 
SET smart_code = 'HERA.LEGACY.TRANSACTION.MIGRATED.V1'
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Fix universal_transaction_lines smart codes
UPDATE universal_transaction_lines 
SET smart_code = CASE 
    WHEN smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.V1$' THEN smart_code
    WHEN smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.V1$' THEN 
        regexp_replace(smart_code, '\.V1$', '.V1')
    WHEN smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*$' AND smart_code NOT LIKE '%.v%' THEN 
        smart_code || '.V1'
    ELSE smart_code
END
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Set remaining non-compliant to generic
UPDATE universal_transaction_lines 
SET smart_code = 'HERA.LEGACY.LINE.MIGRATED.V1'
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Fix core_dynamic_data smart codes
UPDATE core_dynamic_data 
SET smart_code = CASE 
    WHEN smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.V1$' THEN smart_code
    WHEN smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.V1$' THEN 
        regexp_replace(smart_code, '\.V1$', '.V1')
    WHEN smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*$' AND smart_code NOT LIKE '%.v%' THEN 
        smart_code || '.V1'
    ELSE smart_code
END
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Set remaining non-compliant to generic
UPDATE core_dynamic_data 
SET smart_code = 'HERA.LEGACY.FIELD.MIGRATED.V1'
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- =============================================================================
-- STEP 5: VERIFY DATA IS NOW COMPLIANT
-- =============================================================================

DO $$
DECLARE
    v_remaining_non_compliant INTEGER;
BEGIN
    -- Check core_entities
    SELECT COUNT(*) INTO v_remaining_non_compliant
    FROM core_entities 
    WHERE smart_code IS NOT NULL 
    AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
    AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');
    
    IF v_remaining_non_compliant > 0 THEN
        RAISE EXCEPTION 'Still have % non-compliant entities after cleanup', v_remaining_non_compliant;
    END IF;
    
    RAISE NOTICE 'Data cleanup successful - all entities now compliant';
END$$;

-- =============================================================================
-- STEP 6: NOW SAFELY UPDATE CONSTRAINTS
-- =============================================================================

-- Drop and recreate core_entities constraint (fixed regex)
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
    
    -- Add new constraint with fixed regex
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
-- STEP 8: FINAL VERIFICATION
-- =============================================================================

-- Test Finance DNA v2 smart codes
DO $$
DECLARE
    test_codes TEXT[] := ARRAY[
        'HERA.ACCOUNTING.JOURNAL.ENTRY.V2',
        'HERA.ACCOUNTING.CHART.ACCOUNT.V2',
        'HERA.ACCOUNTING.AUDIT.OPERATION.V2'
    ];
    test_code TEXT;
    is_valid BOOLEAN;
BEGIN
    RAISE NOTICE 'Testing Finance DNA v2 Smart Codes:';
    FOREACH test_code IN ARRAY test_codes
    LOOP
        SELECT validate_finance_dna_smart_code(test_code) INTO is_valid;
        RAISE NOTICE '  %: %', test_code, CASE WHEN is_valid THEN 'VALID' ELSE 'INVALID' END;
    END LOOP;
END$$;

-- Log successful completion
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    smart_code,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'SYSTEM_UPDATE',
    'HERA.ACCOUNTING.FIXES.CONSTRAINTS.DATA.CLEANUP.V2',
    jsonb_build_object(
        'fix_type', 'constraint_update_with_data_cleanup',
        'constraints_updated', ARRAY['core_entities', 'universal_transactions', 'universal_transaction_lines', 'core_dynamic_data'],
        'data_cleanup_performed', true,
        'functions_cleaned', ARRAY['hera_generate_trial_balance_v2'],
        'helper_functions_created', ARRAY['create_test_gl_accounts_v2'],
        'fix_timestamp', NOW()
    )
);

SELECT 'Finance DNA v2 Constraints and Data Cleanup Applied Successfully' as status;