-- =====================================================
-- HERA GL-Progressive Module Universal Schema
-- Generated from Progressive Prototype Analysis
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- GL ACCOUNTS SCHEMA
-- =====================================================

-- Sample GL accounts for complete Chart of Accounts
INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_category,
    entity_subcategory,
    status,
    effective_date,
    metadata,
    ai_classification,
    ai_confidence,
    created_at,
    updated_at
) VALUES 
-- Assets
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'gl_account',
    'Cash in Bank',
    '1100',
    'asset',
    'current_asset',
    'active',
    CURRENT_DATE,
    '{"account_type": "asset", "normal_balance": "debit", "is_control_account": true, "rollup_account": "1000"}',
    'cash_asset_account',
    0.99,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'gl_account',
    'Accounts Receivable',
    '1200',
    'asset',
    'current_asset',
    'active',
    CURRENT_DATE,
    '{"account_type": "asset", "normal_balance": "debit", "is_control_account": true, "rollup_account": "1000"}',
    'receivable_asset_account',
    0.98,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'gl_account',
    'Inventory',
    '1300',
    'asset',
    'current_asset',
    'active',
    CURRENT_DATE,
    '{"account_type": "asset", "normal_balance": "debit", "is_control_account": true, "rollup_account": "1000"}',
    'inventory_asset_account',
    0.97,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Liabilities
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'gl_account',
    'Accounts Payable',
    '2000',
    'liability',
    'current_liability',
    'active',
    CURRENT_DATE,
    '{"account_type": "liability", "normal_balance": "credit", "is_control_account": true, "rollup_account": "2000"}',
    'payable_liability_account',
    0.98,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Equity
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'gl_account',
    'Owner Equity',
    '3000',
    'equity',
    'owner_equity',
    'active',
    CURRENT_DATE,
    '{"account_type": "equity", "normal_balance": "credit", "is_control_account": true, "rollup_account": "3000"}',
    'equity_account',
    0.96,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Revenue
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'gl_account',
    'Sales Revenue',
    '4000',
    'revenue',
    'operating_revenue',
    'active',
    CURRENT_DATE,
    '{"account_type": "revenue", "normal_balance": "credit", "is_control_account": true, "rollup_account": "4000"}',
    'sales_revenue_account',
    0.99,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Expenses
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'gl_account',
    'Cost of Goods Sold',
    '5000',
    'expense',
    'cost_of_sales',
    'active',
    CURRENT_DATE,
    '{"account_type": "expense", "normal_balance": "debit", "is_control_account": true, "rollup_account": "5000"}',
    'cogs_expense_account',
    0.98,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'gl_account',
    'Operating Expenses',
    '6000',
    'expense',
    'operating_expense',
    'active',
    CURRENT_DATE,
    '{"account_type": "expense", "normal_balance": "debit", "is_control_account": true, "rollup_account": "6000"}',
    'operating_expense_account',
    0.97,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- =====================================================
-- GL ACCOUNT DYNAMIC DATA (Properties)
-- =====================================================

-- Get GL account IDs for dynamic data insertion
WITH gl_account_ids AS (
    SELECT id, entity_code 
    FROM core_entities 
    WHERE entity_type = 'gl_account' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)

-- Cash in Bank (1100) properties
INSERT INTO core_dynamic_data (
    id,
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_label,
    field_description,
    field_category,
    field_value,
    field_value_number,
    field_value_boolean,
    display_order,
    is_required,
    is_searchable,
    validation_rules,
    ai_confidence,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    ga.id,
    'normal_balance',
    'text',
    'Normal Balance',
    'Expected balance type for this account (debit or credit)',
    'account_properties',
    'debit',
    NULL,
    NULL,
    1,
    true,
    true,
    '{"enum": ["debit", "credit"]}',
    0.99,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM gl_account_ids ga WHERE ga.entity_code = '1100'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    ga.id,
    'current_balance',
    'number',
    'Current Balance',
    'Current account balance based on posted transactions',
    'financial_metrics',
    '25000.00',
    25000.00,
    NULL,
    2,
    false,
    true,
    '{"currency": "USD", "precision": 2}',
    0.95,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM gl_account_ids ga WHERE ga.entity_code = '1100'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    ga.id,
    'account_description',
    'text',
    'Account Description',
    'Detailed description of account usage and purpose',
    'account_properties',
    'Main operating bank account for daily cash transactions and receipts',
    NULL,
    NULL,
    3,
    false,
    true,
    '{"max_length": 500}',
    0.90,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM gl_account_ids ga WHERE ga.entity_code = '1100'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    ga.id,
    'is_control_account',
    'boolean',
    'Control Account',
    'Whether this account controls subsidiary ledgers',
    'account_properties',
    'true',
    NULL,
    true,
    4,
    false,
    false,
    '{}',
    0.85,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM gl_account_ids ga WHERE ga.entity_code = '1100';

-- Accounts Receivable (1200) properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, field_label, 
    field_category, field_value, field_value_number, field_value_boolean,
    display_order, is_required, is_searchable, ai_confidence, created_at, updated_at
)
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', ga.id, 
    'normal_balance', 'text', 'Normal Balance', 'account_properties', 'debit', NULL, NULL,
    1, true, true, 0.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM gl_account_ids ga WHERE ga.entity_code = '1200'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', ga.id,
    'current_balance', 'number', 'Current Balance', 'financial_metrics', '12500.00', 12500.00, NULL,
    2, false, true, 0.94, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM gl_account_ids ga WHERE ga.entity_code = '1200'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', ga.id,
    'account_description', 'text', 'Account Description', 'account_properties', 
    'Outstanding amounts owed by customers for goods and services sold on credit', NULL, NULL,
    3, false, true, 0.88, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM gl_account_ids ga WHERE ga.entity_code = '1200';

-- Sales Revenue (4000) properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, field_label, 
    field_category, field_value, field_value_number, field_value_boolean,
    display_order, is_required, is_searchable, ai_confidence, created_at, updated_at
)
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', ga.id, 
    'normal_balance', 'text', 'Normal Balance', 'account_properties', 'credit', NULL, NULL,
    1, true, true, 0.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM gl_account_ids ga WHERE ga.entity_code = '4000'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', ga.id,
    'current_balance', 'number', 'Current Balance', 'financial_metrics', '45000.00', 45000.00, NULL,
    2, false, true, 0.96, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM gl_account_ids ga WHERE ga.entity_code = '4000'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', ga.id,
    'account_description', 'text', 'Account Description', 'account_properties', 
    'Revenue generated from primary business operations and sales activities', NULL, NULL,
    3, false, true, 0.92, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM gl_account_ids ga WHERE ga.entity_code = '4000';

-- =====================================================
-- JOURNAL ENTRIES (Universal Transactions)
-- =====================================================

-- Sample journal entries demonstrating various transaction types
INSERT INTO universal_transactions (
    id,
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    reference_number,
    total_amount,
    currency,
    status,
    workflow_state,
    description,
    notes,
    metadata,
    ai_insights,
    ai_risk_score,
    ai_anomaly_score,
    created_by,
    created_at,
    updated_at
) VALUES
-- Sales Transaction
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'journal_entry',
    'JE-20241210-001',
    '2024-12-10'::date,
    'JE-20241210-001',
    1500.00,
    'USD',
    'posted',
    'completed',
    'Sales transaction - cash receipt from customer',
    'Manual journal entry for cash sales recorded by Digital Accountant',
    '{"auto_generated": false, "balanced": true, "entry_count": 2, "source": "manual_entry"}',
    '[
        {
            "type": "validation",
            "message": "Journal entry is balanced and ready for posting to GL",
            "confidence": 99,
            "priority": "low"
        },
        {
            "type": "pattern_recognition", 
            "message": "Typical cash sales pattern detected. Consider setting up recurring entry template.",
            "confidence": 87,
            "priority": "medium"
        }
    ]',
    5,
    2,
    'digital_accountant',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Expense Transaction
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'journal_entry',
    'JE-20241210-002',
    '2024-12-10'::date,
    'JE-20241210-002',
    800.00,
    'USD',
    'posted',
    'completed',
    'Office expenses payment',
    'Monthly office supplies and utilities expense payment',
    '{"auto_generated": false, "balanced": true, "entry_count": 2, "source": "expense_entry"}',
    '[
        {
            "type": "cash_flow",
            "message": "Regular expense pattern. Current cash flow impact: -$800",
            "confidence": 94,
            "priority": "low"
        },
        {
            "type": "budgeting",
            "message": "Office expenses at 85% of monthly budget. Consider budget monitoring.",
            "confidence": 82,
            "priority": "medium"
        }
    ]',
    8,
    1,
    'digital_accountant',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Adjusting Entry
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'journal_entry',
    'AJE-20241210-001',
    '2024-12-10'::date,
    'AJE-20241210-001',
    300.00,
    'USD',
    'posted',
    'completed',
    'Accrued revenue adjustment',
    'Month-end adjusting entry for accrued service revenue',
    '{"auto_generated": true, "balanced": true, "entry_count": 2, "source": "month_end_adjustment", "adjustment_type": "accrual"}',
    '[
        {
            "type": "compliance",
            "message": "Month-end accrual adjustment follows GAAP requirements",
            "confidence": 98,
            "priority": "low"
        }
    ]',
    3,
    1,
    'digital_accountant',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- =====================================================
-- JOURNAL ENTRY LINES (Universal Transaction Lines)
-- =====================================================

-- Sales Transaction Lines (JE-20241210-001)
WITH journal_id AS (
    SELECT id FROM universal_transactions 
    WHERE transaction_number = 'JE-20241210-001'
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)
INSERT INTO universal_transaction_lines (
    id,
    transaction_id,
    organization_id,
    line_description,
    line_order,
    quantity,
    unit_price,
    line_amount,
    gl_account_code,
    notes,
    metadata,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    j.id,
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Cash received from customer sales',
    1,
    1,
    1500.00,
    1500.00,
    '1100',
    'Debit: Cash in Bank',
    '{"entry_type": "debit", "account_name": "Cash in Bank", "account_type": "asset"}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM journal_id j

UNION ALL

SELECT 
    uuid_generate_v4(),
    j.id,
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Revenue from customer sales',
    2,
    1,
    1500.00,
    1500.00,
    '4000',
    'Credit: Sales Revenue',
    '{"entry_type": "credit", "account_name": "Sales Revenue", "account_type": "revenue"}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM journal_id j;

-- Expense Transaction Lines (JE-20241210-002)
WITH journal_id AS (
    SELECT id FROM universal_transactions 
    WHERE transaction_number = 'JE-20241210-002'
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)
INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_description, line_order, quantity,
    unit_price, line_amount, gl_account_code, notes, metadata, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), j.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Office supplies and utilities expense', 1, 1, 800.00, 800.00, '6000',
    'Debit: Operating Expenses', 
    '{"entry_type": "debit", "account_name": "Operating Expenses", "account_type": "expense"}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM journal_id j

UNION ALL

SELECT 
    uuid_generate_v4(), j.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Cash payment for office expenses', 2, 1, 800.00, 800.00, '1100',
    'Credit: Cash in Bank',
    '{"entry_type": "credit", "account_name": "Cash in Bank", "account_type": "asset"}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM journal_id j;

-- Adjusting Entry Lines (AJE-20241210-001)
WITH journal_id AS (
    SELECT id FROM universal_transactions 
    WHERE transaction_number = 'AJE-20241210-001'
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)
INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_description, line_order, quantity,
    unit_price, line_amount, gl_account_code, notes, metadata, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), j.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Accrued service revenue for December', 1, 1, 300.00, 300.00, '1200',
    'Debit: Accounts Receivable',
    '{"entry_type": "debit", "account_name": "Accounts Receivable", "account_type": "asset"}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM journal_id j

UNION ALL

SELECT 
    uuid_generate_v4(), j.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Service revenue earned but not yet billed', 2, 1, 300.00, 300.00, '4000',
    'Credit: Sales Revenue',
    '{"entry_type": "credit", "account_name": "Sales Revenue", "account_type": "revenue"}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM journal_id j;

-- =====================================================
-- GL ACCOUNT HIERARCHIES (Core Relationships)
-- =====================================================

-- Create account hierarchy relationships for rollup reporting
WITH account_pairs AS (
    SELECT 
        parent.id as parent_id,
        child.id as child_id,
        parent.entity_name as parent_name,
        child.entity_name as child_name
    FROM core_entities parent
    CROSS JOIN core_entities child
    WHERE parent.entity_type = 'gl_account' 
    AND child.entity_type = 'gl_account'
    AND parent.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
    AND child.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
    -- Define hierarchy: Assets (1000-1999), Liabilities (2000-2999), etc.
    AND ((parent.entity_code = '1000' AND child.entity_code LIKE '1%' AND child.entity_code != '1000')
         OR (parent.entity_code = '2000' AND child.entity_code LIKE '2%' AND child.entity_code != '2000')
         OR (parent.entity_code = '3000' AND child.entity_code LIKE '3%' AND child.entity_code != '3000')
         OR (parent.entity_code = '4000' AND child.entity_code LIKE '4%' AND child.entity_code != '4000')
         OR (parent.entity_code IN ('5000','6000') AND child.entity_code LIKE '[56]%' AND child.entity_code NOT IN ('5000','6000')))
)
INSERT INTO core_relationships (
    id,
    organization_id,
    source_entity_id,
    target_entity_id,
    relationship_type,
    relationship_label,
    relationship_strength,
    is_bidirectional,
    is_active,
    workflow_state,
    relationship_data,
    effective_date,
    ai_discovered,
    ai_confidence,
    created_at,
    updated_at
)
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    ap.parent_id,
    ap.child_id,
    'account_hierarchy',
    'GL Account Hierarchy: ' || ap.parent_name || ' -> ' || ap.child_name,
    0.95,
    false,
    true,
    'active',
    '{"hierarchy_type": "gl_rollup", "rollup_enabled": true, "consolidation": true, "report_level": 2}',
    CURRENT_DATE,
    false,
    0.99,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM account_pairs ap;

-- =====================================================
-- VALIDATION TRIGGERS AND FUNCTIONS
-- =====================================================

-- GL Account validation function
CREATE OR REPLACE FUNCTION validate_gl_account()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate GL account entity
    IF NEW.entity_type = 'gl_account' THEN
        -- Check GL account code format (4-6 digits)
        IF NEW.entity_code !~ '^[0-9]{4,6}$' THEN
            RAISE EXCEPTION 'GL Account code must be 4-6 digits. Got: %', NEW.entity_code;
        END IF;
        
        -- Ensure account code is unique per organization
        IF EXISTS (
            SELECT 1 FROM core_entities 
            WHERE organization_id = NEW.organization_id 
            AND entity_type = 'gl_account'
            AND entity_code = NEW.entity_code
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'GL Account code "%" already exists in organization', NEW.entity_code;
        END IF;
        
        -- Validate account category
        IF NEW.entity_category NOT IN ('asset', 'liability', 'equity', 'revenue', 'expense') THEN
            RAISE EXCEPTION 'Invalid account category. Must be: asset, liability, equity, revenue, or expense';
        END IF;
        
        -- Set default values
        NEW.status := COALESCE(NEW.status, 'active');
        NEW.effective_date := COALESCE(NEW.effective_date, CURRENT_DATE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create GL account validation trigger
DROP TRIGGER IF EXISTS validate_gl_account_trigger ON core_entities;
CREATE TRIGGER validate_gl_account_trigger
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    WHEN (NEW.entity_type = 'gl_account')
    EXECUTE FUNCTION validate_gl_account();

-- Journal Entry validation function
CREATE OR REPLACE FUNCTION validate_journal_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate journal entry transactions
    IF NEW.transaction_type = 'journal_entry' THEN
        -- Ensure journal entry has reference number
        IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
            RAISE EXCEPTION 'Journal entry must have a reference number';
        END IF;
        
        -- Check for duplicate reference numbers
        IF EXISTS (
            SELECT 1 FROM universal_transactions 
            WHERE organization_id = NEW.organization_id 
            AND transaction_type = 'journal_entry'
            AND reference_number = NEW.reference_number
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'Journal entry reference number "%" already exists', NEW.reference_number;
        END IF;
        
        -- Validate amount is positive
        IF NEW.total_amount <= 0 THEN
            RAISE EXCEPTION 'Journal entry total amount must be positive';
        END IF;
        
        -- Set default values
        NEW.currency := COALESCE(NEW.currency, 'USD');
        NEW.status := COALESCE(NEW.status, 'posted');
        NEW.workflow_state := COALESCE(NEW.workflow_state, 'completed');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create journal entry validation trigger
DROP TRIGGER IF EXISTS validate_journal_entry_trigger ON universal_transactions;
CREATE TRIGGER validate_journal_entry_trigger
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type = 'journal_entry')
    EXECUTE FUNCTION validate_journal_entry();

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- GL Account lookup optimization
CREATE INDEX IF NOT EXISTS idx_gl_accounts_by_org 
ON core_entities (organization_id, entity_type, entity_code, status) 
WHERE entity_type = 'gl_account';

-- Journal entry queries optimization
CREATE INDEX IF NOT EXISTS idx_journal_entries_by_org_date 
ON universal_transactions (organization_id, transaction_type, transaction_date, status)
WHERE transaction_type = 'journal_entry';

-- Journal entry by reference number
CREATE INDEX IF NOT EXISTS idx_journal_entries_by_ref 
ON universal_transactions (organization_id, reference_number, transaction_type)
WHERE transaction_type = 'journal_entry';

-- GL Account dynamic data lookup optimization
CREATE INDEX IF NOT EXISTS idx_gl_account_dynamic_data 
ON core_dynamic_data (organization_id, entity_id, field_name, field_type)
WHERE field_name IN ('normal_balance', 'current_balance', 'account_description', 'is_control_account');

-- Journal entry lines optimization
CREATE INDEX IF NOT EXISTS idx_journal_lines_by_gl_account 
ON universal_transaction_lines (organization_id, gl_account_code, created_at);

-- Account hierarchy relationships
CREATE INDEX IF NOT EXISTS idx_gl_account_hierarchy 
ON core_relationships (organization_id, relationship_type, source_entity_id, target_entity_id)
WHERE relationship_type = 'account_hierarchy';

-- =====================================================
-- SAMPLE DATA SUMMARY & VERIFICATION
-- =====================================================

-- Summary of created GL data
DO $$
DECLARE
    account_count integer;
    journal_count integer;
    line_count integer;
    hierarchy_count integer;
    dynamic_data_count integer;
    total_debits DECIMAL(15,2);
    total_credits DECIMAL(15,2);
BEGIN
    SELECT COUNT(*) INTO account_count 
    FROM core_entities 
    WHERE entity_type = 'gl_account' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO journal_count 
    FROM universal_transactions 
    WHERE transaction_type = 'journal_entry' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO line_count 
    FROM universal_transaction_lines utl
    JOIN universal_transactions ut ON utl.transaction_id = ut.id
    WHERE ut.transaction_type = 'journal_entry'
    AND utl.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO hierarchy_count 
    FROM core_relationships 
    WHERE relationship_type = 'account_hierarchy' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO dynamic_data_count 
    FROM core_dynamic_data cdd
    JOIN core_entities ce ON cdd.entity_id = ce.id
    WHERE ce.entity_type = 'gl_account'
    AND cdd.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    -- Calculate total debits and credits for validation
    SELECT 
        COALESCE(SUM(CASE WHEN utl.notes LIKE 'Debit:%' THEN utl.line_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN utl.notes LIKE 'Credit:%' THEN utl.line_amount ELSE 0 END), 0)
    INTO total_debits, total_credits
    FROM universal_transaction_lines utl
    JOIN universal_transactions ut ON utl.transaction_id = ut.id
    WHERE ut.transaction_type = 'journal_entry'
    AND utl.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'HERA GL-Progressive Module Schema Created Successfully';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'GL Accounts Created: %', account_count;
    RAISE NOTICE 'Journal Entries Created: %', journal_count;
    RAISE NOTICE 'Journal Entry Lines: %', line_count;
    RAISE NOTICE 'Account Hierarchy Relationships: %', hierarchy_count;
    RAISE NOTICE 'Dynamic Data Fields: %', dynamic_data_count;
    RAISE NOTICE '----------------------------------------------------';
    RAISE NOTICE 'Balance Validation:';
    RAISE NOTICE 'Total Debits: $%', total_debits;
    RAISE NOTICE 'Total Credits: $%', total_credits;
    RAISE NOTICE 'Balance Check: %', CASE WHEN ABS(total_debits - total_credits) < 0.01 THEN 'BALANCED ✓' ELSE 'OUT OF BALANCE ✗' END;
    RAISE NOTICE '====================================================';
END
$$;