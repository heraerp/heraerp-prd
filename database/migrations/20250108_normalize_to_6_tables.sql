-- HERA 6-Table Normalization Migration
-- This migration normalizes HERA to the strict 6-table architecture
-- by migrating core_clients and gl_chart_of_accounts data to core_entities

-- Step 1: Migrate core_clients data to core_entities with entity_type='client'
INSERT INTO core_entities (
  id,
  organization_id,
  entity_type,
  entity_name,
  entity_code,
  smart_code,
  status,
  business_rules,
  metadata,
  ai_classification,
  ai_confidence,
  created_at,
  updated_at,
  created_by,
  updated_by
)
SELECT 
  id,
  '00000000-0000-0000-0000-000000000000'::uuid, -- System organization for top-level clients
  'client',
  client_name,
  client_code,
  COALESCE('HERA.CRM.CLIENT.ENT.' || UPPER(client_type) || '.V1', 'HERA.CRM.CLIENT.ENT.GENERAL.V1'),
  status,
  jsonb_build_object(
    'ledger_type', 'client_consolidation',
    'client_type', client_type,
    'consolidation_rules', jsonb_build_object(
      'parent_client_id', parent_client_id,
      'reporting_currency', reporting_currency,
      'fiscal_year_end', fiscal_year_end
    )
  ),
  jsonb_build_object(
    'headquarters_country', headquarters_country,
    'incorporation_country', incorporation_country,
    'stock_exchange', stock_exchange,
    'ticker_symbol', ticker_symbol,
    'legal_entity_identifier', legal_entity_identifier,
    'tax_identification_number', tax_identification_number,
    'regulatory_status', regulatory_status,
    'compliance_requirements', compliance_requirements,
    'primary_contact_email', primary_contact_email,
    'primary_contact_phone', primary_contact_phone,
    'website', website,
    'primary_address', primary_address,
    'base_timezone', base_timezone,
    'subscription_tier', subscription_tier,
    'client_settings', client_settings,
    'ai_insights', ai_insights,
    'ai_risk_profile', ai_risk_profile
  ),
  ai_classification,
  ai_confidence,
  created_at,
  updated_at,
  created_by,
  updated_by
FROM core_clients
WHERE NOT EXISTS (
  SELECT 1 FROM core_entities 
  WHERE core_entities.id = core_clients.id
);

-- Step 2: Create parent-child relationships for client hierarchies
INSERT INTO core_relationships (
  organization_id,
  from_entity_id,
  to_entity_id,
  relationship_type,
  smart_code,
  relationship_data,
  is_active,
  created_at
)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  parent_client_id,
  id,
  'parent_of',
  'HERA.CRM.REL.CLIENT.PARENT.V1',
  jsonb_build_object('hierarchy_type', 'corporate_structure'),
  true,
  now()
FROM core_clients
WHERE parent_client_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM core_relationships 
  WHERE from_entity_id = core_clients.parent_client_id 
  AND to_entity_id = core_clients.id
);

-- Step 3: Update organization references from client_id to parent relationships
-- This assumes organizations will use relationships to link to their parent client
UPDATE core_organizations o
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('legacy_client_id', client_id)
WHERE client_id IS NOT NULL;

-- Step 4: Migrate gl_chart_of_accounts to core_entities with entity_type='account'
INSERT INTO core_entities (
  organization_id,
  entity_type,
  entity_name,
  entity_code,
  smart_code,
  status,
  business_rules,
  metadata,
  created_at,
  updated_at
)
SELECT 
  organization_id,
  'account',
  account_name,
  account_code,
  COALESCE(
    'HERA.ACCOUNTING.COA.ACCOUNT.' || UPPER(account_type) || '.V1',
    'HERA.ACCOUNTING.COA.ACCOUNT.GL.UNCAT.V1'
  ),
  COALESCE(status, 'active'),
  jsonb_build_object(
    'ledger_type', 'GL',
    'account_classification', account_type,
    'accounting_rules', jsonb_build_object(
      'normal_balance', CASE 
        WHEN account_type IN ('assets', 'expenses', 'cost_of_sales') THEN 'debit'
        ELSE 'credit'
      END,
      'financial_statement_section', CASE 
        WHEN account_type IN ('assets', 'liabilities', 'equity') THEN 'balance_sheet'
        WHEN account_type IN ('revenue', 'cost_of_sales', 'expenses') THEN 'income_statement'
        ELSE 'other'
      END
    )
  ),
  jsonb_build_object(
    'account_type', account_type,
    'account_subtype', account_subtype,
    'parent_account_code', parent_account_code,
    'is_header_account', is_header_account,
    'is_active', is_active,
    'currency_code', currency_code,
    'description', description
  ),
  created_at,
  updated_at
FROM gl_chart_of_accounts
WHERE NOT EXISTS (
  SELECT 1 FROM core_entities 
  WHERE core_entities.organization_id = gl_chart_of_accounts.organization_id
  AND core_entities.entity_code = gl_chart_of_accounts.account_code
);

-- Step 5: Create account hierarchy relationships
INSERT INTO core_relationships (
  organization_id,
  from_entity_id,
  to_entity_id,
  relationship_type,
  smart_code,
  relationship_data,
  is_active,
  created_at
)
SELECT 
  g.organization_id,
  p.id, -- parent account entity
  c.id, -- child account entity
  'parent_account',
  'HERA.ACCOUNTING.REL.ACCOUNT.PARENT.V1',
  jsonb_build_object('hierarchy_type', 'account_structure'),
  true,
  now()
FROM gl_chart_of_accounts g
JOIN core_entities c ON c.organization_id = g.organization_id 
  AND c.entity_code = g.account_code 
  AND c.entity_type = 'account'
JOIN core_entities p ON p.organization_id = g.organization_id 
  AND p.entity_code = g.parent_account_code 
  AND p.entity_type = 'account'
WHERE g.parent_account_code IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM core_relationships 
  WHERE from_entity_id = p.id 
  AND to_entity_id = c.id
);

-- Step 6: Add guardrail to prevent regression
-- Note: This is a conceptual guardrail - implement in application code
COMMENT ON TABLE core_entities IS 'Universal entity table. Use entity_type=''client'' for clients, entity_type=''account'' with business_rules.ledger_type=''GL'' for GL accounts. Never create separate tables.';

-- Step 7: Drop the extra tables (ONLY AFTER CONFIRMING DATA MIGRATION)
-- IMPORTANT: Run these commands only after verifying all data has been migrated successfully

-- DROP TABLE IF EXISTS gl_chart_of_accounts CASCADE;
-- DROP TABLE IF EXISTS core_clients CASCADE;

-- Step 8: Remove client_id column from core_organizations (ONLY AFTER CONFIRMING RELATIONSHIPS)
-- ALTER TABLE core_organizations DROP COLUMN IF EXISTS client_id;