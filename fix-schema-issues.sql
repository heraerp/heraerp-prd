-- 🔧 HERA Universal Schema Cleanup & Fix Script
-- Generated: 2025-08-04
-- Purpose: Fix all schema validation failures and improve data quality

-- ==================================================================
-- 1. FIX DUPLICATE ENTITY CODES (CRITICAL ISSUE)
-- ==================================================================

-- Identify duplicate entity codes with details
SELECT 
    entity_code,
    COUNT(*) as duplicate_count,
    STRING_AGG(entity_name, ', ') as duplicate_names,
    STRING_AGG(entity_id::text, ', ') as entity_ids
FROM core_entities 
WHERE entity_code IS NOT NULL 
  AND entity_code != ''
GROUP BY entity_code, organization_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Fix Strategy 1: Update duplicate single-letter codes with meaningful codes
UPDATE core_entities 
SET entity_code = 'DOSA_' || SUBSTRING(entity_id::text, 1, 8)
WHERE entity_code = 'D' 
  AND entity_name = 'Dosa'
  AND entity_id != (
    SELECT entity_id 
    FROM core_entities 
    WHERE entity_code = 'D' AND entity_name = 'Dosa' 
    ORDER BY created_at ASC 
    LIMIT 1
  );

-- Fix Strategy 2: Keep the oldest record, update others
UPDATE core_entities 
SET entity_code = entity_code || '_' || SUBSTRING(entity_id::text, 1, 6)
WHERE entity_code IN (
  SELECT entity_code 
  FROM core_entities 
  WHERE entity_code IS NOT NULL 
  GROUP BY entity_code, organization_id 
  HAVING COUNT(*) > 1
)
AND entity_id NOT IN (
  SELECT MIN(entity_id) 
  FROM core_entities 
  WHERE entity_code IS NOT NULL 
  GROUP BY entity_code, organization_id 
  HAVING COUNT(*) > 1
);

-- ==================================================================
-- 2. CLEAN UP ORPHANED DYNAMIC DATA
-- ==================================================================

-- Find orphaned dynamic data records
SELECT 
    dd.dynamic_data_id,
    dd.entity_id,
    dd.field_name,
    dd.field_value,
    'ORPHANED - Entity does not exist' as issue
FROM core_dynamic_data dd
LEFT JOIN core_entities e ON dd.entity_id = e.entity_id
WHERE e.entity_id IS NULL;

-- Remove orphaned dynamic data (BE CAREFUL - BACKUP FIRST)
-- DELETE FROM core_dynamic_data 
-- WHERE entity_id NOT IN (SELECT entity_id FROM core_entities);

-- Alternative: Flag orphaned records for review
UPDATE core_dynamic_data 
SET field_name = 'ORPHANED_' || field_name
WHERE entity_id NOT IN (SELECT entity_id FROM core_entities)
  AND field_name NOT LIKE 'ORPHANED_%';

-- ==================================================================
-- 3. FIX TRANSACTION LINE INTEGRITY
-- ==================================================================

-- Find orphaned transaction lines
SELECT 
    tl.line_id,
    tl.transaction_id,
    tl.line_type,
    tl.line_total,
    'ORPHANED - Transaction does not exist' as issue
FROM universal_transaction_lines tl
LEFT JOIN universal_transactions t ON tl.transaction_id = t.transaction_id
WHERE t.transaction_id IS NULL;

-- Remove orphaned transaction lines (BE CAREFUL - BACKUP FIRST)
-- DELETE FROM universal_transaction_lines 
-- WHERE transaction_id NOT IN (SELECT transaction_id FROM universal_transactions);

-- Alternative: Mark for investigation
UPDATE universal_transaction_lines 
SET line_type = 'ORPHANED_' || line_type
WHERE transaction_id NOT IN (SELECT transaction_id FROM universal_transactions)
  AND line_type NOT LIKE 'ORPHANED_%';

-- ==================================================================
-- 4. STANDARDIZE SMART CODES TO HERA.* FORMAT
-- ==================================================================

-- Find non-standard Smart Codes
SELECT 
    entity_id,
    entity_name,
    smart_code,
    entity_type,
    'Non-standard Smart Code format' as issue,
    'HERA.' || UPPER(entity_type) || '.ENT.STANDARD.v1' as suggested_code
FROM core_entities
WHERE smart_code IS NOT NULL 
  AND smart_code NOT LIKE 'HERA.%'
ORDER BY entity_type, entity_name;

-- Update non-standard Smart Codes to HERA format
UPDATE core_entities 
SET smart_code = 'HERA.' || 
                 CASE 
                   WHEN organization_id = '550e8400-e29b-41d4-a716-446655440000' THEN 'REST'
                   WHEN organization_id = '7aad4cfa-c207-4af6-9564-6da8e9299d42' THEN 'REST'
                   WHEN organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945' THEN 'SYS'
                   ELSE 'GEN'
                 END || '.ENT.' || UPPER(entity_type) || '.v1',
    smart_code_status = 'PROD'
WHERE smart_code IS NULL 
   OR smart_code = ''
   OR smart_code NOT LIKE 'HERA.%';

-- ==================================================================
-- 5. DATA QUALITY IMPROVEMENTS
-- ==================================================================

-- Add missing Smart Codes for entities without them
UPDATE core_entities 
SET smart_code = 'HERA.REST.ENT.' || UPPER(entity_type) || '.v1',
    smart_code_version = 'v1',
    smart_code_status = 'PROD'
WHERE smart_code IS NULL 
  AND organization_id IN ('550e8400-e29b-41d4-a716-446655440000', '7aad4cfa-c207-4af6-9564-6da8e9299d42');

-- Update system entities with proper Smart Codes
UPDATE core_entities 
SET smart_code = 'HERA.SYS.ENT.' || UPPER(entity_type) || '.v1',
    smart_code_version = 'v1',
    smart_code_status = 'PROD'
WHERE smart_code IS NULL 
  AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- ==================================================================
-- 6. ENTITY CODE STANDARDIZATION
-- ==================================================================

-- Standardize entity codes for better consistency
UPDATE core_entities 
SET entity_code = 
    CASE entity_type
        WHEN 'menu_item' THEN 'MENU_' || UPPER(SUBSTRING(REPLACE(entity_name, ' ', '_'), 1, 8))
        WHEN 'customer' THEN 'CUST_' || UPPER(SUBSTRING(REPLACE(entity_name, ' ', '_'), 1, 8))
        WHEN 'table' THEN 'TBL_' || LPAD(entity_code, 3, '0')
        WHEN 'gl_account' THEN LPAD(entity_code, 4, '0')
        ELSE entity_code
    END
WHERE entity_code IS NULL 
   OR LENGTH(entity_code) < 3
   OR entity_code IN ('D', 'M', 'P', '1', '2', '3', '4');

-- ==================================================================
-- 7. VALIDATION QUERIES - RUN AFTER FIXES
-- ==================================================================

-- Check for remaining duplicates
SELECT 'Duplicate Check' as validation_type, COUNT(*) as issues_found
FROM (
    SELECT entity_code, organization_id, COUNT(*) as cnt
    FROM core_entities 
    WHERE entity_code IS NOT NULL
    GROUP BY entity_code, organization_id
    HAVING COUNT(*) > 1
) duplicates;

-- Check for remaining orphaned dynamic data
SELECT 'Orphaned Dynamic Data' as validation_type, COUNT(*) as issues_found
FROM core_dynamic_data dd
LEFT JOIN core_entities e ON dd.entity_id = e.entity_id
WHERE e.entity_id IS NULL;

-- Check for remaining orphaned transaction lines
SELECT 'Orphaned Transaction Lines' as validation_type, COUNT(*) as issues_found
FROM universal_transaction_lines tl
LEFT JOIN universal_transactions t ON tl.transaction_id = t.transaction_id
WHERE t.transaction_id IS NULL;

-- Check Smart Code compliance
SELECT 'Non-HERA Smart Codes' as validation_type, COUNT(*) as issues_found
FROM core_entities
WHERE smart_code IS NOT NULL 
  AND smart_code NOT LIKE 'HERA.%';

-- ==================================================================
-- 8. DATA QUALITY SUMMARY REPORT
-- ==================================================================

-- Generate comprehensive data quality report
SELECT 
    'HERA Universal Schema Health Report' as report_title,
    CURRENT_TIMESTAMP as generated_at;

-- Table row counts
SELECT 
    'core_organizations' as table_name,
    COUNT(*) as row_count,
    COUNT(DISTINCT organization_id) as unique_orgs
FROM core_organizations
UNION ALL
SELECT 
    'core_entities' as table_name,
    COUNT(*) as row_count,
    COUNT(DISTINCT entity_type) as unique_types
FROM core_entities
UNION ALL
SELECT 
    'core_dynamic_data' as table_name,
    COUNT(*) as row_count,
    COUNT(DISTINCT field_name) as unique_fields
FROM core_dynamic_data
UNION ALL
SELECT 
    'universal_transactions' as table_name,
    COUNT(*) as row_count,
    COUNT(DISTINCT transaction_type) as unique_types
FROM universal_transactions;

-- Entity type distribution
SELECT 
    entity_type,
    COUNT(*) as count,
    COUNT(CASE WHEN smart_code LIKE 'HERA.%' THEN 1 END) as with_smart_codes,
    COUNT(CASE WHEN entity_code IS NOT NULL THEN 1 END) as with_entity_codes
FROM core_entities
GROUP BY entity_type
ORDER BY count DESC;

-- Smart Code compliance by organization
SELECT 
    o.organization_name,
    COUNT(e.entity_id) as total_entities,
    COUNT(CASE WHEN e.smart_code LIKE 'HERA.%' THEN 1 END) as compliant_smart_codes,
    ROUND(
        COUNT(CASE WHEN e.smart_code LIKE 'HERA.%' THEN 1 END) * 100.0 / COUNT(e.entity_id), 
        2
    ) as compliance_percentage
FROM core_organizations o
LEFT JOIN core_entities e ON o.organization_id = e.organization_id
GROUP BY o.organization_id, o.organization_name
ORDER BY compliance_percentage DESC;

-- ==================================================================
-- 9. PERFORMANCE OPTIMIZATION
-- ==================================================================

-- Create missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_core_entities_code_org 
ON core_entities(entity_code, organization_id) 
WHERE entity_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_core_entities_smart_code 
ON core_entities(smart_code) 
WHERE smart_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dynamic_data_field_name 
ON core_dynamic_data(field_name);

CREATE INDEX IF NOT EXISTS idx_transactions_type_date 
ON universal_transactions(transaction_type, transaction_date);

-- Update table statistics for query optimizer
ANALYZE core_entities;
ANALYZE core_dynamic_data;
ANALYZE universal_transactions;
ANALYZE universal_transaction_lines;

-- ==================================================================
-- END OF SCRIPT
-- ==================================================================

-- Instructions:
-- 1. BACKUP your database before running any DELETE statements
-- 2. Run validation queries first to understand the scope
-- 3. Execute fixes section by section, testing after each
-- 4. Re-run the Schema Health validation in the SQL Editor
-- 5. Monitor performance after index creation