-- Finance DNA v2 - Final Data and Constraint Fix
-- Find and fix any remaining non-compliant data, then update constraints

-- =============================================================================
-- STEP 1: IDENTIFY REMAINING NON-COMPLIANT DATA
-- =============================================================================

-- Check what's still non-compliant in universal_transactions
SELECT 'Non-compliant universal_transactions:' as check_type, COUNT(*) as count
FROM universal_transactions 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Show examples of non-compliant smart codes
SELECT 'Sample non-compliant codes:' as type, smart_code, COUNT(*) as occurrences
FROM universal_transactions 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$')
GROUP BY smart_code
ORDER BY COUNT(*) DESC
LIMIT 10;

-- =============================================================================
-- STEP 2: CLEAN ANY REMAINING NON-COMPLIANT DATA
-- =============================================================================

-- Delete remaining non-compliant transaction lines
DELETE FROM universal_transaction_lines 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Delete remaining non-compliant transactions
DELETE FROM universal_transactions 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Delete remaining non-compliant dynamic data
DELETE FROM core_dynamic_data 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- Delete remaining non-compliant entities
DELETE FROM core_entities 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- =============================================================================
-- STEP 3: VERIFY DATA IS NOW CLEAN
-- =============================================================================

-- Verify no more non-compliant data exists
SELECT 'Final verification - universal_transactions:' as table_name, COUNT(*) as remaining_non_compliant
FROM universal_transactions 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

SELECT 'Final verification - core_entities:' as table_name, COUNT(*) as remaining_non_compliant
FROM core_entities 
WHERE smart_code IS NOT NULL 
AND NOT (smart_code ~ '^HERA\.[A-Z]+(\.[A-Z]+)*\.v[12]$')
AND NOT (smart_code ~ '^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$');

-- =============================================================================
-- STEP 4: NOW SAFELY UPDATE CONSTRAINTS
-- =============================================================================

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

-- =============================================================================
-- STEP 5: FINAL VERIFICATION
-- =============================================================================

SELECT 'SUCCESS: All constraints updated to support Finance DNA v2' as result;