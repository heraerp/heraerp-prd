-- Finance DNA v2 - Update Constraints Only
-- Smart Code: HERA.ACCOUNTING.CONSTRAINTS.UPDATE.ONLY.v2
-- Update constraints after data cleanup is complete

-- =============================================================================
-- CONSTRAINT UPDATES FOR FINANCE DNA V2 SUPPORT
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

SELECT 'Finance DNA v2 Constraints Updated Successfully' as status;