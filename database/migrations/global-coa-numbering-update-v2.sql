-- =========================================================================
-- HERA Global Chart of Accounts Numbering Structure Update v2
-- Works with actual HERA database structure (dynamic data fields)
-- Implements universal 5-6-7-8-9 expense classification across all organizations
-- Smart Code: HERA.GLOBAL.COA.NUMBERING.STANDARD.v2
-- =========================================================================

-- Step 1: Update account types in core_dynamic_data for 5xxx accounts (Cost of Sales)
UPDATE core_dynamic_data 
SET field_value_text = 'cost_of_sales',
    updated_at = NOW()
WHERE field_name = 'account_type'
  AND entity_id IN (
    SELECT id FROM core_entities 
    WHERE entity_type = 'gl_account' 
      AND entity_code LIKE '5%'
  );

-- Step 2: Update account types for 6xxx accounts (Direct Expenses)  
UPDATE core_dynamic_data 
SET field_value_text = 'direct_expenses',
    updated_at = NOW()
WHERE field_name = 'account_type'
  AND entity_id IN (
    SELECT id FROM core_entities 
    WHERE entity_type = 'gl_account' 
      AND entity_code LIKE '6%'
  );

-- Step 3: Update account types for 7xxx accounts (Indirect Expenses)
UPDATE core_dynamic_data 
SET field_value_text = 'indirect_expenses',
    updated_at = NOW()
WHERE field_name = 'account_type'
  AND entity_id IN (
    SELECT id FROM core_entities 
    WHERE entity_type = 'gl_account' 
      AND entity_code LIKE '7%'
  );

-- Step 4: Update account types for 8xxx accounts (Taxes & Extraordinary)
UPDATE core_dynamic_data 
SET field_value_text = 'taxes_extraordinary',
    updated_at = NOW()
WHERE field_name = 'account_type'
  AND entity_id IN (
    SELECT id FROM core_entities 
    WHERE entity_type = 'gl_account' 
      AND entity_code LIKE '8%'
  );

-- Step 5: Update account types for 9xxx accounts (Statistical)
UPDATE core_dynamic_data 
SET field_value_text = 'statistical',
    updated_at = NOW()
WHERE field_name = 'account_type'
  AND entity_id IN (
    SELECT id FROM core_entities 
    WHERE entity_type = 'gl_account' 
      AND entity_code LIKE '9%'
  );

-- Step 6: Add account types for GL accounts that don't have them yet
INSERT INTO core_dynamic_data (
  organization_id,
  entity_id,
  field_name,
  field_type,
  field_value_text,
  smart_code,
  field_order,
  is_searchable,
  is_required,
  validation_status
)
SELECT 
  ce.organization_id,
  ce.id,
  'account_type',
  'text',
  CASE 
    WHEN ce.entity_code LIKE '1%' THEN 'assets'
    WHEN ce.entity_code LIKE '2%' THEN 'liabilities'
    WHEN ce.entity_code LIKE '3%' THEN 'equity'
    WHEN ce.entity_code LIKE '4%' THEN 'revenue'
    WHEN ce.entity_code LIKE '5%' THEN 'cost_of_sales'
    WHEN ce.entity_code LIKE '6%' THEN 'direct_expenses'
    WHEN ce.entity_code LIKE '7%' THEN 'indirect_expenses'
    WHEN ce.entity_code LIKE '8%' THEN 'taxes_extraordinary'
    WHEN ce.entity_code LIKE '9%' THEN 'statistical'
    ELSE 'other'
  END,
  ce.smart_code || '.ACCOUNT_TYPE',
  1,
  true,
  true,
  'valid'
FROM core_entities ce
WHERE ce.entity_type = 'gl_account'
  AND ce.id NOT IN (
    SELECT entity_id FROM core_dynamic_data WHERE field_name = 'account_type'
  );

-- Step 7: Add normal_balance field for accounts that don't have it
INSERT INTO core_dynamic_data (
  organization_id,
  entity_id,
  field_name,
  field_type,
  field_value_text,
  smart_code,
  field_order,
  is_searchable,
  is_required,
  validation_status
)
SELECT 
  ce.organization_id,
  ce.id,
  'normal_balance',
  'text',
  CASE 
    WHEN ce.entity_code LIKE '1%' OR 
         ce.entity_code LIKE '5%' OR 
         ce.entity_code LIKE '6%' OR 
         ce.entity_code LIKE '7%' OR 
         ce.entity_code LIKE '8%' OR 
         ce.entity_code LIKE '9%' THEN 'debit'
    ELSE 'credit'
  END,
  ce.smart_code || '.NORMAL_BALANCE',
  2,
  true,
  true,
  'valid'
FROM core_entities ce
WHERE ce.entity_type = 'gl_account'
  AND ce.id NOT IN (
    SELECT entity_id FROM core_dynamic_data WHERE field_name = 'normal_balance'
  );

-- Step 8: Update smart codes to reflect new account types
UPDATE core_entities 
SET smart_code = REGEXP_REPLACE(
  smart_code, 
  '\.EXPENSES?\.', 
  CASE 
    WHEN entity_code LIKE '5%' THEN '.COST_OF_SALES.'
    WHEN entity_code LIKE '6%' THEN '.DIRECT_EXPENSES.'
    WHEN entity_code LIKE '7%' THEN '.INDIRECT_EXPENSES.'
    WHEN entity_code LIKE '8%' THEN '.TAXES_EXTRAORDINARY.'
    WHEN entity_code LIKE '9%' THEN '.STATISTICAL.'
    ELSE '.EXPENSES.'
  END
),
updated_at = NOW()
WHERE entity_type = 'gl_account'
  AND smart_code LIKE '%.EXPENSES%.%'
  AND (entity_code LIKE '5%' OR entity_code LIKE '6%' OR entity_code LIKE '7%' OR entity_code LIKE '8%' OR entity_code LIKE '9%');

-- Step 9: Remove any old expense accounts that don't follow the numbering structure
DELETE FROM core_dynamic_data 
WHERE entity_id IN (
  SELECT ce.id FROM core_entities ce
  LEFT JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id AND cdd.field_name = 'account_type'
  WHERE ce.entity_type = 'gl_account'
    AND cdd.field_value_text = 'expenses'
    AND NOT (ce.entity_code LIKE '5%' OR ce.entity_code LIKE '6%' OR ce.entity_code LIKE '7%' OR ce.entity_code LIKE '8%' OR ce.entity_code LIKE '9%')
);

DELETE FROM core_entities 
WHERE entity_type = 'gl_account'
  AND id NOT IN (SELECT entity_id FROM core_dynamic_data WHERE field_name = 'account_type')
  AND entity_code NOT LIKE '1%' 
  AND entity_code NOT LIKE '2%' 
  AND entity_code NOT LIKE '3%' 
  AND entity_code NOT LIKE '4%'
  AND entity_code NOT LIKE '5%'
  AND entity_code NOT LIKE '6%'
  AND entity_code NOT LIKE '7%'
  AND entity_code NOT LIKE '8%'
  AND entity_code NOT LIKE '9%';

-- Success: Global COA numbering structure updated!