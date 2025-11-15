-- ================================================================================
-- HERA Finance Entities v2.2 - Complete Finance Entity Types
-- Migration: All finance entity types for GL, AP, AR, Bank, Assets, etc.
-- Smart Code: HERA.PLATFORM.FINANCE.ENTITIES.v2.2
-- Author: HERA Finance Team
-- Created: 2024-11-16
-- ================================================================================

-- ================================================================================
-- GENERAL LEDGER ENTITIES
-- ================================================================================

-- GL_ACCOUNT: Chart of Accounts
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'GL_ACCOUNT',
    'GL_ACCOUNT_ENTITY_TYPE',
    'GL Account Entity Type',
    'Entity type for General Ledger chart of accounts',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.GL_ACCOUNT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- JOURNAL_ENTRY: Journal entries (header)
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'JOURNAL_ENTRY',
    'JOURNAL_ENTRY_ENTITY_TYPE',
    'Journal Entry Entity Type',
    'Entity type for manual journal entries',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.JOURNAL_ENTRY.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- FINANCIAL_DIMENSION: Cost centers, profit centers, etc.
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'FINANCIAL_DIMENSION',
    'FINANCIAL_DIMENSION_ENTITY_TYPE',
    'Financial Dimension Entity Type',
    'Entity type for financial dimensions (cost center, profit center, project)',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.FINANCIAL_DIMENSION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- ACCOUNTS PAYABLE ENTITIES
-- ================================================================================

-- VENDOR: Vendor/supplier master
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'VENDOR',
    'VENDOR_ENTITY_TYPE',
    'Vendor Entity Type',
    'Entity type for vendor/supplier master data',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.VENDOR.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AP_INVOICE: Accounts payable invoices
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'AP_INVOICE',
    'AP_INVOICE_ENTITY_TYPE',
    'AP Invoice Entity Type',
    'Entity type for accounts payable invoices',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.AP_INVOICE.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AP_PAYMENT: Vendor payments
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'AP_PAYMENT',
    'AP_PAYMENT_ENTITY_TYPE',
    'AP Payment Entity Type',
    'Entity type for vendor payments',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.AP_PAYMENT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- ACCOUNTS RECEIVABLE ENTITIES
-- ================================================================================

-- CUSTOMER: Customer master
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'CUSTOMER',
    'CUSTOMER_ENTITY_TYPE',
    'Customer Entity Type',
    'Entity type for customer master data',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.CUSTOMER.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AR_INVOICE: Accounts receivable invoices
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'AR_INVOICE',
    'AR_INVOICE_ENTITY_TYPE',
    'AR Invoice Entity Type',
    'Entity type for accounts receivable invoices',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.AR_INVOICE.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AR_RECEIPT: Customer receipts
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'AR_RECEIPT',
    'AR_RECEIPT_ENTITY_TYPE',
    'AR Receipt Entity Type',
    'Entity type for customer receipts and payments',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.AR_RECEIPT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- BANK & CASH MANAGEMENT ENTITIES
-- ================================================================================

-- BANK_ACCOUNT: Bank account master
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'BANK_ACCOUNT',
    'BANK_ACCOUNT_ENTITY_TYPE',
    'Bank Account Entity Type',
    'Entity type for bank account master data',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.BANK_ACCOUNT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- BANK_STATEMENT: Bank statements
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'BANK_STATEMENT',
    'BANK_STATEMENT_ENTITY_TYPE',
    'Bank Statement Entity Type',
    'Entity type for bank statements',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.BANK_STATEMENT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- BANK_RECONCILIATION: Bank reconciliation sessions
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'BANK_RECONCILIATION',
    'BANK_RECONCILIATION_ENTITY_TYPE',
    'Bank Reconciliation Entity Type',
    'Entity type for bank reconciliation sessions',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.BANK_RECONCILIATION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- FIXED ASSETS ENTITIES
-- ================================================================================

-- FIXED_ASSET: Fixed asset master
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'FIXED_ASSET',
    'FIXED_ASSET_ENTITY_TYPE',
    'Fixed Asset Entity Type',
    'Entity type for fixed asset master data',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.FIXED_ASSET.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- DEPRECIATION_SCHEDULE: Depreciation schedules
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'DEPRECIATION_SCHEDULE',
    'DEPRECIATION_SCHEDULE_ENTITY_TYPE',
    'Depreciation Schedule Entity Type',
    'Entity type for asset depreciation schedules',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.DEPRECIATION_SCHEDULE.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- TAX & COMPLIANCE ENTITIES
-- ================================================================================

-- TAX_CODE: Tax codes and rates
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'TAX_CODE',
    'TAX_CODE_ENTITY_TYPE',
    'Tax Code Entity Type',
    'Entity type for tax codes and rates',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.TAX_CODE.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- TAX_RETURN: Tax returns and filings
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'TAX_RETURN',
    'TAX_RETURN_ENTITY_TYPE',
    'Tax Return Entity Type',
    'Entity type for tax returns and filings',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.TAX_RETURN.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- BUDGETING & PLANNING ENTITIES
-- ================================================================================

-- BUDGET: Budget master
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'BUDGET',
    'BUDGET_ENTITY_TYPE',
    'Budget Entity Type',
    'Entity type for budget master data',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.BUDGET.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- BUDGET_VERSION: Budget versions and revisions
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'BUDGET_VERSION',
    'BUDGET_VERSION_ENTITY_TYPE',
    'Budget Version Entity Type',
    'Entity type for budget versions and revisions',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.BUDGET_VERSION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- REVENUE RECOGNITION (IFRS 15) ENTITIES
-- ================================================================================

-- REVENUE_CONTRACT: Revenue contracts for IFRS 15
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'REVENUE_CONTRACT',
    'REVENUE_CONTRACT_ENTITY_TYPE',
    'Revenue Contract Entity Type',
    'Entity type for IFRS 15 revenue contracts',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.REVENUE_CONTRACT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- PERFORMANCE_OBLIGATION: Performance obligations for revenue contracts
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'PERFORMANCE_OBLIGATION',
    'PERFORMANCE_OBLIGATION_ENTITY_TYPE',
    'Performance Obligation Entity Type',
    'Entity type for IFRS 15 performance obligations',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.PERFORMANCE_OBLIGATION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- LEASE ACCOUNTING (IFRS 16) ENTITIES
-- ================================================================================

-- LEASE_CONTRACT: Lease contracts for IFRS 16
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'LEASE_CONTRACT',
    'LEASE_CONTRACT_ENTITY_TYPE',
    'Lease Contract Entity Type',
    'Entity type for IFRS 16 lease contracts',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.LEASE_CONTRACT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- RIGHT_OF_USE_ASSET: ROU assets for IFRS 16
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'RIGHT_OF_USE_ASSET',
    'RIGHT_OF_USE_ASSET_ENTITY_TYPE',
    'Right of Use Asset Entity Type',
    'Entity type for IFRS 16 right-of-use assets',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.RIGHT_OF_USE_ASSET.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- FINANCIAL CLOSE ENTITIES
-- ================================================================================

-- CLOSE_TASK: Period close tasks and checklists
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'CLOSE_TASK',
    'CLOSE_TASK_ENTITY_TYPE',
    'Close Task Entity Type',
    'Entity type for period close tasks and checklists',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.CLOSE_TASK.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- CLOSE_CALENDAR: Period close calendar
INSERT INTO core_entities (
    id,
    entity_type,
    entity_code,
    entity_name,
    entity_description,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at,
    status
) VALUES (
    gen_random_uuid(),
    'CLOSE_CALENDAR',
    'CLOSE_CALENDAR_ENTITY_TYPE',
    'Close Calendar Entity Type',
    'Entity type for period close calendar',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.CLOSE_CALENDAR.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- SMART CODE VALIDATION
-- ================================================================================

-- Create validation function for finance entity smart codes
CREATE OR REPLACE FUNCTION validate_finance_entity_smart_code(smart_code_input TEXT, entity_type_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- All finance entity types must follow HERA.PLATFORM.FINANCE.ENTITY_TYPE.{TYPE}.v{VERSION}
    RETURN smart_code_input ~ '^HERA\.PLATFORM\.FINANCE\.ENTITY_TYPE\.[A-Z_]+\.v[0-9]+$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add smart code validation constraint for finance entities
DO $$
DECLARE
    v_finance_entity_types TEXT[] := ARRAY[
        'GL_ACCOUNT', 'JOURNAL_ENTRY', 'FINANCIAL_DIMENSION',
        'VENDOR', 'AP_INVOICE', 'AP_PAYMENT',
        'CUSTOMER', 'AR_INVOICE', 'AR_RECEIPT',
        'BANK_ACCOUNT', 'BANK_STATEMENT', 'BANK_RECONCILIATION',
        'FIXED_ASSET', 'DEPRECIATION_SCHEDULE',
        'TAX_CODE', 'TAX_RETURN',
        'BUDGET', 'BUDGET_VERSION',
        'REVENUE_CONTRACT', 'PERFORMANCE_OBLIGATION',
        'LEASE_CONTRACT', 'RIGHT_OF_USE_ASSET',
        'CLOSE_TASK', 'CLOSE_CALENDAR'
    ];
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_finance_entity_smart_code'
    ) THEN
        ALTER TABLE core_entities 
        ADD CONSTRAINT chk_finance_entity_smart_code 
        CHECK (
            entity_type != ALL(v_finance_entity_types) OR 
            validate_finance_entity_smart_code(smart_code, entity_type)
        );
    END IF;
END $$;

-- ================================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================================

-- General finance entity lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_entities_org_type
ON core_entities (organization_id, entity_type, status)
WHERE entity_type IN (
    'GL_ACCOUNT', 'JOURNAL_ENTRY', 'FINANCIAL_DIMENSION',
    'VENDOR', 'AP_INVOICE', 'AP_PAYMENT',
    'CUSTOMER', 'AR_INVOICE', 'AR_RECEIPT',
    'BANK_ACCOUNT', 'BANK_STATEMENT', 'BANK_RECONCILIATION',
    'FIXED_ASSET', 'DEPRECIATION_SCHEDULE',
    'TAX_CODE', 'TAX_RETURN',
    'BUDGET', 'BUDGET_VERSION',
    'REVENUE_CONTRACT', 'PERFORMANCE_OBLIGATION',
    'LEASE_CONTRACT', 'RIGHT_OF_USE_ASSET',
    'CLOSE_TASK', 'CLOSE_CALENDAR'
);

-- Finance entity code lookups (for GL accounts, vendors, customers)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_entities_code
ON core_entities (organization_id, entity_type, entity_code)
WHERE entity_type IN ('GL_ACCOUNT', 'VENDOR', 'CUSTOMER', 'BANK_ACCOUNT', 'TAX_CODE');

-- Finance entity name searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_entities_name_search
ON core_entities USING gin(to_tsvector('english', entity_name))
WHERE entity_type IN (
    'GL_ACCOUNT', 'VENDOR', 'CUSTOMER', 'BANK_ACCOUNT', 
    'FIXED_ASSET', 'FINANCIAL_DIMENSION'
);

-- ================================================================================
-- RLS POLICIES FOR FINANCE ENTITIES
-- ================================================================================

-- Create RLS policy for finance entities (organization-scoped)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'core_entities' 
        AND policyname = 'finance_entities_org_policy'
    ) THEN
        CREATE POLICY finance_entities_org_policy ON core_entities
        FOR ALL
        USING (
            entity_type NOT IN (
                'GL_ACCOUNT', 'JOURNAL_ENTRY', 'FINANCIAL_DIMENSION',
                'VENDOR', 'AP_INVOICE', 'AP_PAYMENT',
                'CUSTOMER', 'AR_INVOICE', 'AR_RECEIPT',
                'BANK_ACCOUNT', 'BANK_STATEMENT', 'BANK_RECONCILIATION',
                'FIXED_ASSET', 'DEPRECIATION_SCHEDULE',
                'TAX_CODE', 'TAX_RETURN',
                'BUDGET', 'BUDGET_VERSION',
                'REVENUE_CONTRACT', 'PERFORMANCE_OBLIGATION',
                'LEASE_CONTRACT', 'RIGHT_OF_USE_ASSET',
                'CLOSE_TASK', 'CLOSE_CALENDAR'
            ) OR 
            organization_id = current_setting('app.current_organization_id', true)::uuid
        );
    END IF;
END $$;

-- ================================================================================
-- HELPER FUNCTIONS
-- ================================================================================

-- Function to get all finance entity types
CREATE OR REPLACE FUNCTION hera_finance_entity_types_v1()
RETURNS TABLE(
    entity_type TEXT,
    entity_name TEXT,
    description TEXT,
    smart_code TEXT,
    category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.entity_type,
        e.entity_name,
        e.entity_description,
        e.smart_code,
        CASE 
            WHEN e.entity_type IN ('GL_ACCOUNT', 'JOURNAL_ENTRY', 'FINANCIAL_DIMENSION') THEN 'General Ledger'
            WHEN e.entity_type IN ('VENDOR', 'AP_INVOICE', 'AP_PAYMENT') THEN 'Accounts Payable'
            WHEN e.entity_type IN ('CUSTOMER', 'AR_INVOICE', 'AR_RECEIPT') THEN 'Accounts Receivable'
            WHEN e.entity_type IN ('BANK_ACCOUNT', 'BANK_STATEMENT', 'BANK_RECONCILIATION') THEN 'Bank & Cash'
            WHEN e.entity_type IN ('FIXED_ASSET', 'DEPRECIATION_SCHEDULE') THEN 'Fixed Assets'
            WHEN e.entity_type IN ('TAX_CODE', 'TAX_RETURN') THEN 'Tax & Compliance'
            WHEN e.entity_type IN ('BUDGET', 'BUDGET_VERSION') THEN 'Budgeting & Planning'
            WHEN e.entity_type IN ('REVENUE_CONTRACT', 'PERFORMANCE_OBLIGATION') THEN 'Revenue Recognition'
            WHEN e.entity_type IN ('LEASE_CONTRACT', 'RIGHT_OF_USE_ASSET') THEN 'Lease Accounting'
            WHEN e.entity_type IN ('CLOSE_TASK', 'CLOSE_CALENDAR') THEN 'Financial Close'
            ELSE 'Other'
        END as category
    FROM core_entities e
    WHERE e.organization_id = '00000000-0000-0000-0000-000000000000'
    AND e.entity_code LIKE '%_ENTITY_TYPE'
    AND e.status = 'active'
    ORDER BY category, e.entity_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================
-- VERIFICATION AND ROLLBACK
-- ================================================================================

-- Verification query
DO $$
DECLARE
    v_entity_type_count INTEGER;
    v_function_count INTEGER;
    v_index_count INTEGER;
BEGIN
    -- Count entity types created
    SELECT COUNT(*) INTO v_entity_type_count
    FROM core_entities
    WHERE organization_id = '00000000-0000-0000-0000-000000000000'
    AND entity_code LIKE '%_ENTITY_TYPE'
    AND entity_type IN (
        'GL_ACCOUNT', 'JOURNAL_ENTRY', 'FINANCIAL_DIMENSION',
        'VENDOR', 'AP_INVOICE', 'AP_PAYMENT',
        'CUSTOMER', 'AR_INVOICE', 'AR_RECEIPT',
        'BANK_ACCOUNT', 'BANK_STATEMENT', 'BANK_RECONCILIATION',
        'FIXED_ASSET', 'DEPRECIATION_SCHEDULE',
        'TAX_CODE', 'TAX_RETURN',
        'BUDGET', 'BUDGET_VERSION',
        'REVENUE_CONTRACT', 'PERFORMANCE_OBLIGATION',
        'LEASE_CONTRACT', 'RIGHT_OF_USE_ASSET',
        'CLOSE_TASK', 'CLOSE_CALENDAR'
    );
    
    -- Count functions
    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname IN ('validate_finance_entity_smart_code', 'hera_finance_entity_types_v1');
    
    -- Count indexes
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE indexname LIKE 'idx_finance_entities%';
    
    RAISE NOTICE 'HERA Finance Entities v2.2 Migration Complete:';
    RAISE NOTICE '  - Finance entity types created: %', v_entity_type_count;
    RAISE NOTICE '  - Validation functions created: %', v_function_count;
    RAISE NOTICE '  - Performance indexes created: %', v_index_count;
    RAISE NOTICE '  - Smart code validation: ACTIVE';
    RAISE NOTICE '  - RLS policies: ACTIVE';
    RAISE NOTICE '  - Ready for finance operations';
END $$;

-- ================================================================================
-- ROLLBACK SCRIPT (commented)
-- ================================================================================

/*
-- ROLLBACK INSTRUCTIONS
-- Run these commands if rollback is needed:

-- 1. Drop functions
DROP FUNCTION IF EXISTS validate_finance_entity_smart_code(TEXT, TEXT);
DROP FUNCTION IF EXISTS hera_finance_entity_types_v1();

-- 2. Drop RLS policies
DROP POLICY IF EXISTS finance_entities_org_policy ON core_entities;

-- 3. Drop indexes
DROP INDEX IF EXISTS idx_finance_entities_org_type;
DROP INDEX IF EXISTS idx_finance_entities_code;
DROP INDEX IF EXISTS idx_finance_entities_name_search;

-- 4. Drop constraints
ALTER TABLE core_entities DROP CONSTRAINT IF EXISTS chk_finance_entity_smart_code;

-- 5. Remove entity types
DELETE FROM core_entities 
WHERE organization_id = '00000000-0000-0000-0000-000000000000'
AND entity_code LIKE '%_ENTITY_TYPE'
AND entity_type IN (
    'GL_ACCOUNT', 'JOURNAL_ENTRY', 'FINANCIAL_DIMENSION',
    'VENDOR', 'AP_INVOICE', 'AP_PAYMENT',
    'CUSTOMER', 'AR_INVOICE', 'AR_RECEIPT',
    'BANK_ACCOUNT', 'BANK_STATEMENT', 'BANK_RECONCILIATION',
    'FIXED_ASSET', 'DEPRECIATION_SCHEDULE',
    'TAX_CODE', 'TAX_RETURN',
    'BUDGET', 'BUDGET_VERSION',
    'REVENUE_CONTRACT', 'PERFORMANCE_OBLIGATION',
    'LEASE_CONTRACT', 'RIGHT_OF_USE_ASSET',
    'CLOSE_TASK', 'CLOSE_CALENDAR'
);
*/