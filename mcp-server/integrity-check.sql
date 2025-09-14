-- Salon ERP Demo Integrity Checks

\echo '=== SALON ERP INTEGRITY CHECKS ==='
\echo ''

-- Check 1: Organization exists
\echo '1. Checking DEMO-SALON organization...'
SELECT COUNT(*) as orgs_count 
FROM core_organizations 
WHERE organization_code = 'DEMO-SALON';

-- Check 2: Entities with bad data
\echo ''
\echo '2. Checking for entities with missing org_id or invalid smart_code...'
SELECT COUNT(*) as bad_entities
FROM core_entities
WHERE organization_id IS NULL 
   OR smart_code IS NULL
   OR smart_code !~ '^HERA\.[A-Z0-9]{3,15}(\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$';

-- Check 3: Dynamic data without smart_code
\echo ''
\echo '3. Checking for dynamic data missing smart_code...'
SELECT COUNT(*) as bad_dynamic_data
FROM core_dynamic_data
WHERE smart_code IS NULL;

-- Check 4: Transactions without currency or invalid smart_code
\echo ''
\echo '4. Checking for transactions missing currency or invalid smart_code...'
SELECT COUNT(*) as bad_transactions
FROM universal_transactions
WHERE transaction_currency_code IS NULL
   OR smart_code IS NULL
   OR smart_code !~ '^HERA\.[A-Z0-9]{3,15}(\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$';

-- Check 5: Transaction lines missing required fields
\echo ''
\echo '5. Checking for transaction lines missing required fields...'
SELECT COUNT(*) as bad_lines
FROM universal_transaction_lines
WHERE organization_id IS NULL 
   OR transaction_id IS NULL 
   OR line_number IS NULL 
   OR line_type IS NULL 
   OR smart_code IS NULL;

-- Additional helpful queries
\echo ''
\echo '=== DEMO-SALON SPECIFIC STATS ==='
\echo ''

-- Count entities in DEMO-SALON
\echo '6. Entities in DEMO-SALON organization:'
SELECT COUNT(*) as demo_salon_entities
FROM core_entities
WHERE organization_id = (SELECT id FROM core_organizations WHERE organization_code = 'DEMO-SALON');

-- Count transactions in DEMO-SALON
\echo ''
\echo '7. Transactions in DEMO-SALON organization:'
SELECT COUNT(*) as demo_salon_transactions
FROM universal_transactions
WHERE organization_id = (SELECT id FROM core_organizations WHERE organization_code = 'DEMO-SALON');

-- Show smart codes that don't match pattern
\echo ''
\echo '8. Invalid smart codes (if any):'
SELECT DISTINCT smart_code, 'entity' as source
FROM core_entities
WHERE smart_code IS NOT NULL 
  AND smart_code !~ '^HERA\.[A-Z0-9]{3,15}(\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
UNION
SELECT DISTINCT smart_code, 'transaction' as source
FROM universal_transactions
WHERE smart_code IS NOT NULL 
  AND smart_code !~ '^HERA\.[A-Z0-9]{3,15}(\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
LIMIT 10;

\echo ''
\echo '=== EXPECTED RESULTS ==='
\echo 'All "bad_*" counts should be 0'
\echo 'DEMO-SALON org count should be 1'