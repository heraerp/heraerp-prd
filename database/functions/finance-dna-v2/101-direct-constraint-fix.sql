-- Finance DNA v2 - Direct Constraint Fix
-- Update constraints to accept Finance DNA v2 format (.v2)

-- Fix core_entities constraint
ALTER TABLE core_entities DROP CONSTRAINT IF EXISTS core_entities_smart_code_ck;
ALTER TABLE core_entities ADD CONSTRAINT core_entities_smart_code_ck 
CHECK (
    smart_code IS NULL OR 
    smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$' OR
    smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$'
);

-- Fix universal_transactions constraint  
ALTER TABLE universal_transactions DROP CONSTRAINT IF EXISTS ut_smart_code_ck;
ALTER TABLE universal_transactions ADD CONSTRAINT ut_smart_code_ck 
CHECK (
    smart_code IS NULL OR 
    smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$' OR
    smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$'
);

-- Fix universal_transaction_lines constraint
ALTER TABLE universal_transaction_lines DROP CONSTRAINT IF EXISTS utl_smart_code_ck;
ALTER TABLE universal_transaction_lines ADD CONSTRAINT utl_smart_code_ck 
CHECK (
    smart_code IS NULL OR 
    smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$' OR
    smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$'
);

-- Fix core_dynamic_data constraint
ALTER TABLE core_dynamic_data DROP CONSTRAINT IF EXISTS core_dynamic_data_smart_code_ck;
ALTER TABLE core_dynamic_data ADD CONSTRAINT core_dynamic_data_smart_code_ck 
CHECK (
    smart_code IS NULL OR 
    smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$' OR
    smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$'
);

SELECT 'Constraints updated to support Finance DNA v2' as result;