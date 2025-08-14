-- 🔧 Quick Fix for Duplicate Entity Codes
-- Run these commands directly in Supabase SQL Editor

-- Step 1: Check current duplicate entity codes
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

-- Step 2: Fix Strategy - Update duplicates by appending unique suffix
-- This keeps the oldest record with original code, updates others
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

-- Step 3: Verify no more duplicates
SELECT 
  'Final Duplicate Check' as validation_type, 
  COUNT(*) as remaining_duplicates
FROM (
    SELECT entity_code, organization_id, COUNT(*) as cnt
    FROM core_entities 
    WHERE entity_code IS NOT NULL
    GROUP BY entity_code, organization_id
    HAVING COUNT(*) > 1
) duplicates;

-- Step 4: Fix Smart Codes to HERA format
UPDATE core_entities 
SET smart_code = 'HERA.' || 
                 CASE 
                   WHEN organization_id = '550e8400-e29b-41d4-a716-446655440000' THEN 'REST'
                   WHEN organization_id = '7aad4cfa-c207-4af6-9564-6da8e9299d42' THEN 'REST'
                   WHEN organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945' THEN 'SYS'
                   ELSE 'GEN'
                 END || '.ENT.' || UPPER(entity_type) || '.v1'
WHERE smart_code IS NULL 
   OR smart_code = ''
   OR smart_code NOT LIKE 'HERA.%';

-- Step 5: Final Smart Code compliance check
SELECT 
  'Smart Code Compliance' as validation_type,
  COUNT(*) as total_entities,
  COUNT(CASE WHEN smart_code LIKE 'HERA.%' THEN 1 END) as compliant_entities,
  ROUND(
    COUNT(CASE WHEN smart_code LIKE 'HERA.%' THEN 1 END) * 100.0 / COUNT(*), 
    1
  ) as compliance_percentage
FROM core_entities;

-- Step 6: Data quality summary by entity type
SELECT 
  entity_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN smart_code LIKE 'HERA.%' THEN 1 END) as compliant_smart_codes,
  COUNT(CASE WHEN entity_code IS NOT NULL AND entity_code != '' THEN 1 END) as with_entity_codes
FROM core_entities
GROUP BY entity_type
ORDER BY total_count DESC;