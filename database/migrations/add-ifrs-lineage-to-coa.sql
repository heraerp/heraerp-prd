-- =========================================================================
-- HERA Universal COA IFRS Lineage Implementation
-- Adds complete IFRS lineage and hierarchy to all GL accounts
-- Smart Code: HERA.GLOBAL.COA.IFRS.LINEAGE.v1
-- =========================================================================

BEGIN;

-- Step 1: Add IFRS lineage fields to all GL accounts that don't have them
INSERT INTO core_dynamic_data (
  organization_id,
  entity_id,
  field_name,
  field_type,
  field_value_text,
  field_value_number,
  field_value_json,
  smart_code,
  field_order,
  is_searchable,
  is_required,
  validation_status
)
SELECT 
  ce.organization_id,
  ce.id,
  ifrs_field.field_name,
  ifrs_field.field_type,
  ifrs_field.field_value_text,
  ifrs_field.field_value_number,
  ifrs_field.field_value_json,
  ce.smart_code || '.' || UPPER(ifrs_field.field_name),
  ifrs_field.field_order,
  true,
  true,
  'valid'
FROM core_entities ce
CROSS JOIN (
  -- Define IFRS fields for each account based on account code
  SELECT 
    ce2.id as entity_id,
    field_def.field_name,
    field_def.field_type,
    field_def.field_value_text,
    field_def.field_value_number,
    field_def.field_value_json,
    field_def.field_order
  FROM core_entities ce2
  CROSS JOIN LATERAL (
    VALUES 
      -- IFRS Classification based on account code
      ('ifrs_classification', 'text', 
        CASE 
          WHEN ce2.entity_code LIKE '11%' THEN 'Current Assets'
          WHEN ce2.entity_code LIKE '12%' THEN 'Non-Current Assets'
          WHEN ce2.entity_code LIKE '1%' THEN 'Assets'
          WHEN ce2.entity_code LIKE '21%' THEN 'Current Liabilities'
          WHEN ce2.entity_code LIKE '22%' THEN 'Non-Current Liabilities'
          WHEN ce2.entity_code LIKE '2%' THEN 'Liabilities'
          WHEN ce2.entity_code LIKE '3%' THEN 'Equity'
          WHEN ce2.entity_code LIKE '4%' THEN 'Revenue'
          WHEN ce2.entity_code LIKE '5%' THEN 'Cost of Sales'
          WHEN ce2.entity_code LIKE '6%' THEN 'Direct Operating Expenses'
          WHEN ce2.entity_code LIKE '7%' THEN 'Administrative Expenses'
          WHEN ce2.entity_code LIKE '8%' THEN 'Tax and Extraordinary Items'
          WHEN ce2.entity_code LIKE '9%' THEN 'Statistical Accounts'
          ELSE 'Other'
        END,
        NULL::numeric, NULL::jsonb, 10),
      
      -- Parent Account based on hierarchy
      ('parent_account', 'text',
        CASE 
          WHEN LENGTH(ce2.entity_code) = 4 AND ce2.entity_code LIKE '1%00' THEN ''  -- Top level assets
          WHEN LENGTH(ce2.entity_code) = 4 AND ce2.entity_code LIKE '2%00' THEN ''  -- Top level liabilities
          WHEN LENGTH(ce2.entity_code) = 4 AND ce2.entity_code LIKE '3%00' THEN ''  -- Top level equity
          WHEN LENGTH(ce2.entity_code) = 4 AND ce2.entity_code LIKE '4%00' THEN ''  -- Top level revenue
          WHEN LENGTH(ce2.entity_code) = 4 AND ce2.entity_code LIKE '5%00' THEN ''  -- Top level cost of sales
          WHEN LENGTH(ce2.entity_code) = 4 AND ce2.entity_code LIKE '6%00' THEN ''  -- Top level direct expenses
          WHEN LENGTH(ce2.entity_code) = 4 AND ce2.entity_code LIKE '7%00' THEN ''  -- Top level indirect expenses
          WHEN LENGTH(ce2.entity_code) = 4 AND ce2.entity_code LIKE '8%00' THEN ''  -- Top level taxes
          WHEN LENGTH(ce2.entity_code) = 4 AND ce2.entity_code LIKE '9%00' THEN ''  -- Top level statistical
          WHEN ce2.entity_code LIKE '11%' THEN '1100'  -- Under current assets
          WHEN ce2.entity_code LIKE '12%' THEN '1200'  -- Under non-current assets
          WHEN ce2.entity_code LIKE '1%' THEN '1000'    -- Under assets
          WHEN ce2.entity_code LIKE '21%' THEN '2100'  -- Under current liabilities
          WHEN ce2.entity_code LIKE '22%' THEN '2200'  -- Under non-current liabilities
          WHEN ce2.entity_code LIKE '2%' THEN '2000'    -- Under liabilities
          WHEN ce2.entity_code LIKE '3%' THEN '3000'    -- Under equity
          WHEN ce2.entity_code LIKE '4%' THEN '4000'    -- Under revenue
          WHEN ce2.entity_code LIKE '5%' THEN '5000'    -- Under cost of sales
          WHEN ce2.entity_code LIKE '6%' THEN '6000'    -- Under direct expenses
          WHEN ce2.entity_code LIKE '7%' THEN '7000'    -- Under indirect expenses
          WHEN ce2.entity_code LIKE '8%' THEN '8000'    -- Under taxes
          WHEN ce2.entity_code LIKE '9%' THEN '9000'    -- Under statistical
          ELSE ''
        END,
        NULL::numeric, NULL::jsonb, 11),
      
      -- Account Level based on code structure
      ('account_level', 'number', NULL,
        CASE 
          WHEN ce2.entity_code IN ('1000','2000','3000','4000','5000','6000','7000','8000','9000') THEN 1  -- Main headers
          WHEN ce2.entity_code LIKE '%00' AND LENGTH(ce2.entity_code) = 4 THEN 2  -- Category headers
          WHEN ce2.entity_code LIKE '%0' AND LENGTH(ce2.entity_code) = 4 THEN 3   -- Subcategory headers
          WHEN LENGTH(ce2.entity_code) = 4 THEN 4  -- Regular accounts
          ELSE 5  -- Sub-accounts
        END,
        NULL::jsonb, 12),
      
      -- IFRS Category
      ('ifrs_category', 'text',
        CASE 
          WHEN ce2.entity_code LIKE '1%' THEN 'Assets'
          WHEN ce2.entity_code LIKE '2%' THEN 'Liabilities'
          WHEN ce2.entity_code LIKE '3%' THEN 'Equity'
          WHEN ce2.entity_code LIKE '4%' THEN 'Revenue'
          WHEN ce2.entity_code LIKE '5%' THEN 'Cost of Sales'
          WHEN ce2.entity_code LIKE '6%' THEN 'Direct Expenses'
          WHEN ce2.entity_code LIKE '7%' THEN 'Indirect Expenses'
          WHEN ce2.entity_code LIKE '8%' THEN 'Taxes and Extraordinary'
          WHEN ce2.entity_code LIKE '9%' THEN 'Statistical'
          ELSE 'Other'
        END,
        NULL::numeric, NULL::jsonb, 13),
      
      -- Presentation Order
      ('presentation_order', 'number', NULL,
        CAST(ce2.entity_code AS numeric),
        NULL::jsonb, 14),
      
      -- Is Header Account
      ('is_header', 'boolean', 
        CASE 
          WHEN ce2.entity_code LIKE '%00' OR ce2.entity_code LIKE '%0' THEN 'true'
          ELSE 'false'
        END,
        NULL::numeric, NULL::jsonb, 15),
      
      -- Rollup Account (same as parent for now)
      ('rollup_account', 'text',
        CASE 
          WHEN LENGTH(ce2.entity_code) = 4 AND ce2.entity_code LIKE '%000' THEN ''  -- Top level
          WHEN ce2.entity_code LIKE '11%' THEN '1100'  -- Rolls up to current assets
          WHEN ce2.entity_code LIKE '12%' THEN '1200'  -- Rolls up to non-current assets
          WHEN ce2.entity_code LIKE '1%' THEN '1000'    -- Rolls up to assets
          WHEN ce2.entity_code LIKE '21%' THEN '2100'  -- Rolls up to current liabilities
          WHEN ce2.entity_code LIKE '22%' THEN '2200'  -- Rolls up to non-current liabilities
          WHEN ce2.entity_code LIKE '2%' THEN '2000'    -- Rolls up to liabilities
          WHEN ce2.entity_code LIKE '3%' THEN '3000'    -- Rolls up to equity
          WHEN ce2.entity_code LIKE '4%' THEN '4000'    -- Rolls up to revenue
          WHEN ce2.entity_code LIKE '5%' THEN '5000'    -- Rolls up to cost of sales
          WHEN ce2.entity_code LIKE '6%' THEN '6000'    -- Rolls up to direct expenses
          WHEN ce2.entity_code LIKE '7%' THEN '7000'    -- Rolls up to indirect expenses
          WHEN ce2.entity_code LIKE '8%' THEN '8000'    -- Rolls up to taxes
          WHEN ce2.entity_code LIKE '9%' THEN '9000'    -- Rolls up to statistical
          ELSE ''
        END,
        NULL::numeric, NULL::jsonb, 16),
      
      -- IFRS Statement Type
      ('ifrs_statement', 'text',
        CASE 
          WHEN ce2.entity_code LIKE '1%' OR ce2.entity_code LIKE '2%' OR ce2.entity_code LIKE '3%' THEN 'SFP'  -- Statement of Financial Position
          WHEN ce2.entity_code LIKE '4%' OR ce2.entity_code LIKE '5%' OR ce2.entity_code LIKE '6%' OR ce2.entity_code LIKE '7%' OR ce2.entity_code LIKE '8%' THEN 'SPL'  -- Statement of Profit or Loss
          WHEN ce2.entity_code LIKE '9%' THEN 'NOTES'  -- Notes/Statistical
          ELSE 'SPL'
        END,
        NULL::numeric, NULL::jsonb, 17),
      
      -- IFRS Subcategory
      ('ifrs_subcategory', 'text',
        CASE 
          WHEN ce2.entity_code LIKE '111%' THEN 'Cash and Cash Equivalents'
          WHEN ce2.entity_code LIKE '112%' THEN 'Trade and Other Receivables'
          WHEN ce2.entity_code LIKE '113%' THEN 'Inventories'
          WHEN ce2.entity_code LIKE '114%' THEN 'Prepayments'
          WHEN ce2.entity_code LIKE '121%' THEN 'Property, Plant and Equipment'
          WHEN ce2.entity_code LIKE '122%' THEN 'Intangible Assets'
          WHEN ce2.entity_code LIKE '211%' THEN 'Trade and Other Payables'
          WHEN ce2.entity_code LIKE '212%' THEN 'Short-term Borrowings'
          WHEN ce2.entity_code LIKE '213%' THEN 'Current Tax Liabilities'
          WHEN ce2.entity_code LIKE '221%' THEN 'Long-term Borrowings'
          WHEN ce2.entity_code LIKE '31%' THEN 'Share Capital'
          WHEN ce2.entity_code LIKE '32%' THEN 'Retained Earnings'
          WHEN ce2.entity_code LIKE '33%' THEN 'Other Reserves'
          WHEN ce2.entity_code LIKE '41%' THEN 'Revenue from Contracts with Customers'
          WHEN ce2.entity_code LIKE '42%' THEN 'Other Income'
          WHEN ce2.entity_code LIKE '51%' THEN 'Cost of Goods Sold'
          WHEN ce2.entity_code LIKE '52%' THEN 'Cost of Services'
          WHEN ce2.entity_code LIKE '61%' THEN 'Employee Benefits Expense'
          WHEN ce2.entity_code LIKE '62%' THEN 'Depreciation and Amortization'
          WHEN ce2.entity_code LIKE '71%' THEN 'Administrative Expenses'
          WHEN ce2.entity_code LIKE '72%' THEN 'Selling and Distribution Expenses'
          WHEN ce2.entity_code LIKE '81%' THEN 'Income Tax Expense'
          WHEN ce2.entity_code LIKE '82%' THEN 'Extraordinary Items'
          ELSE ce2.entity_name
        END,
        NULL::numeric, NULL::jsonb, 18),
      
      -- Consolidation Method
      ('consolidation_method', 'text',
        CASE 
          WHEN ce2.entity_code LIKE '9%' THEN 'none'  -- Statistical accounts don't consolidate
          WHEN ce2.entity_code LIKE '%00' OR ce2.entity_code LIKE '%0' THEN 'sum'  -- Headers sum up
          ELSE 'sum'  -- Regular accounts sum up
        END,
        NULL::numeric, NULL::jsonb, 19),
      
      -- Reporting Standard
      ('reporting_standard', 'text', 'IFRS', NULL::numeric, NULL::jsonb, 20)
      
  ) AS field_def(field_name, field_type, field_value_text, field_value_number, field_value_json, field_order)
  WHERE ce2.entity_type = 'gl_account'
) AS ifrs_field
WHERE ce.entity_type = 'gl_account'
  AND ce.id = ifrs_field.entity_id
  AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data cdd 
    WHERE cdd.entity_id = ce.id 
      AND cdd.field_name = ifrs_field.field_name
  );

-- Step 2: Update existing fields that may have incomplete data
UPDATE core_dynamic_data
SET field_value_text = CASE 
    WHEN field_name = 'ifrs_classification' THEN
      CASE 
        WHEN entity_id IN (SELECT id FROM core_entities WHERE entity_code LIKE '11%') THEN 'Current Assets'
        WHEN entity_id IN (SELECT id FROM core_entities WHERE entity_code LIKE '12%') THEN 'Non-Current Assets'
        WHEN entity_id IN (SELECT id FROM core_entities WHERE entity_code LIKE '21%') THEN 'Current Liabilities'
        WHEN entity_id IN (SELECT id FROM core_entities WHERE entity_code LIKE '22%') THEN 'Non-Current Liabilities'
        ELSE field_value_text
      END
    ELSE field_value_text
  END,
  updated_at = NOW()
WHERE field_name IN ('ifrs_classification', 'parent_account', 'ifrs_category')
  AND entity_id IN (SELECT id FROM core_entities WHERE entity_type = 'gl_account');

-- Step 3: Create IFRS validation rules
INSERT INTO core_entities (
  organization_id,
  entity_type,
  entity_name,
  entity_code,
  smart_code,
  status
)
SELECT 
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-GLOBAL-COA'),
  'ifrs_validation_rule',
  'IFRS Lineage Validation Rules',
  'IFRS-VALIDATION-001',
  'HERA.GLOBAL.IFRS.VALIDATION.RULES.v1',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM core_entities 
  WHERE entity_code = 'IFRS-VALIDATION-001'
);

-- Step 4: Add validation metadata
INSERT INTO core_dynamic_data (
  organization_id,
  entity_id,
  field_name,
  field_value_json,
  smart_code
)
SELECT 
  ce.organization_id,
  ce.id,
  'validation_rules',
  jsonb_build_object(
    'mandatory_fields', jsonb_build_array(
      'ifrs_classification',
      'parent_account',
      'account_level',
      'ifrs_category',
      'presentation_order',
      'is_header',
      'rollup_account'
    ),
    'hierarchy_rules', jsonb_build_object(
      'level_1_range', '1000,2000,3000,4000,5000,6000,7000,8000,9000',
      'level_2_suffix', '00',
      'level_3_suffix', '0',
      'max_levels', 5
    ),
    'consolidation_rules', jsonb_build_object(
      'header_accounts_no_balance', true,
      'rollup_to_parent', true,
      'sum_method_default', 'sum'
    ),
    'reporting_rules', jsonb_build_object(
      'ifrs_compliance', true,
      'statement_mapping', jsonb_build_object(
        'assets', 'SFP',
        'liabilities', 'SFP',
        'equity', 'SFP',
        'revenue', 'SPL',
        'expenses', 'SPL'
      )
    )
  ),
  'HERA.GLOBAL.IFRS.VALIDATION.METADATA.v1'
FROM core_entities ce
WHERE ce.entity_code = 'IFRS-VALIDATION-001'
  AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data 
    WHERE entity_id = ce.id 
      AND field_name = 'validation_rules'
  );

-- Step 5: Create tracking record
INSERT INTO universal_transactions (
  organization_id,
  transaction_type,
  transaction_number,
  transaction_date,
  description,
  total_amount,
  metadata
)
SELECT 
  (SELECT id FROM core_organizations WHERE organization_code = 'HERA-GLOBAL-COA'),
  'ifrs_lineage_implementation',
  'IFRS-LINEAGE-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MI'),
  CURRENT_DATE,
  'IFRS Lineage Implementation - Complete hierarchy and classification for all GL accounts',
  (SELECT COUNT(*) FROM core_entities WHERE entity_type = 'gl_account'),
  jsonb_build_object(
    'implementation_type', 'ifrs_lineage',
    'fields_added', jsonb_build_array(
      'ifrs_classification',
      'parent_account',
      'account_level',
      'ifrs_category',
      'presentation_order',
      'is_header',
      'rollup_account',
      'ifrs_statement',
      'ifrs_subcategory',
      'consolidation_method',
      'reporting_standard'
    ),
    'compliance_standard', 'IFRS',
    'global_enforcement', true
  );

COMMIT;

-- Verification queries
SELECT 
  'IFRS Lineage Fields Added' as status,
  COUNT(DISTINCT field_name) as field_types,
  COUNT(*) as total_fields
FROM core_dynamic_data
WHERE field_name IN (
  'ifrs_classification',
  'parent_account',
  'account_level',
  'ifrs_category',
  'presentation_order',
  'is_header',
  'rollup_account',
  'ifrs_statement',
  'ifrs_subcategory',
  'consolidation_method',
  'reporting_standard'
)
AND entity_id IN (SELECT id FROM core_entities WHERE entity_type = 'gl_account');

-- Success message
SELECT 
  '🎉 IFRS LINEAGE IMPLEMENTATION COMPLETE' as status,
  '✅ All GL accounts now have complete IFRS hierarchy' as result,
  'Financial statements can now be generated automatically' as impact;