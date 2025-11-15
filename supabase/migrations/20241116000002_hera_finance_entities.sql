-- ================================================================================
-- HERA Finance Entities v2.2 - Complete Finance Entity Architecture
-- Migration: All finance entity types for comprehensive financial management
-- Smart Code: HERA.PLATFORM.FINANCE.ENTITIES.v2.2
-- Author: HERA Finance Team
-- Created: 2024-11-16
-- ================================================================================

-- ================================================================================
-- GENERAL LEDGER ENTITIES
-- ================================================================================

-- GL_ACCOUNT: Chart of accounts with IFRS compliance
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
    'General Ledger chart of accounts with IFRS compliance and multi-currency support',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.GL_ACCOUNT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- JOURNAL_ENTRY: Individual journal entries for GL
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
    'General Ledger journal entries with automatic posting and approval workflow',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.JOURNAL_ENTRY.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- FINANCIAL_DIMENSION: Cost centers, profit centers, projects
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
    'Financial dimensions including cost centers, profit centers, projects, and segments',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.FINANCIAL_DIMENSION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- FISCAL_PERIOD: Accounting periods with IFRS compliance
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
    'FISCAL_PERIOD',
    'FISCAL_PERIOD_ENTITY_TYPE',
    'Fiscal Period Entity Type',
    'Fiscal periods and accounting calendar with period close controls',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.FISCAL_PERIOD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- ================================================================================
-- ACCOUNTS PAYABLE ENTITIES
-- ================================================================================

-- VENDOR: Supplier master data with vendor management
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
    'Vendor master data with payment terms, tax information, and spend analytics',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.VENDOR.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- AP_INVOICE: Vendor invoices with approval workflow
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
    'Accounts payable invoices with approval workflow and automatic posting',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.AP_INVOICE.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- AP_PAYMENT: Vendor payments and payment runs
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
    'Vendor payments with batch processing and bank file generation',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.AP_PAYMENT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- ================================================================================
-- ACCOUNTS RECEIVABLE ENTITIES
-- ================================================================================

-- CUSTOMER: Customer master data with credit management
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
    'Customer master data with credit limits, payment terms, and revenue analytics',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.CUSTOMER.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- AR_INVOICE: Customer invoices with IFRS 15 revenue recognition
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
    'Customer invoices with IFRS 15 revenue recognition and automatic posting',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.AR_INVOICE.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- AR_RECEIPT: Customer receipts and payment allocation
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
    'Customer receipts with automatic application and bank integration',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.AR_RECEIPT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- REVENUE_CONTRACT: IFRS 15 revenue contracts
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
    'IFRS 15 revenue contracts with performance obligations and revenue recognition',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.REVENUE_CONTRACT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- PERFORMANCE_OBLIGATION: IFRS 15 performance obligations
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
    'IFRS 15 performance obligations with timing and transaction price allocation',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.PERFORMANCE_OBLIGATION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- ================================================================================
-- BANK & CASH MANAGEMENT ENTITIES
-- ================================================================================

-- BANK_ACCOUNT: Bank and cash accounts
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
    'Bank and cash accounts with reconciliation and cash flow management',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.BANK_ACCOUNT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- BANK_STATEMENT: Bank statements for reconciliation
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
    'Bank statements with line items for automated reconciliation',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.BANK_STATEMENT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

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
    'Bank reconciliation sessions with AI-powered matching and exception handling',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.BANK_RECONCILIATION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- ================================================================================
-- FIXED ASSETS ENTITIES
-- ================================================================================

-- FIXED_ASSET: Fixed asset register with depreciation
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
    'Fixed asset register with depreciation, impairment, and disposal tracking',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.FIXED_ASSET.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- DEPRECIATION_SCHEDULE: Asset depreciation schedules
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
    'Asset depreciation schedules with multiple methods and book values',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.DEPRECIATION_SCHEDULE.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- LEASE_CONTRACT: IFRS 16 lease contracts
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
    'IFRS 16 lease contracts with right-of-use assets and lease liabilities',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.LEASE_CONTRACT.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- RIGHT_OF_USE_ASSET: IFRS 16 right-of-use assets
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
    'Right-of-Use Asset Entity Type',
    'IFRS 16 right-of-use assets with depreciation and impairment testing',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.RIGHT_OF_USE_ASSET.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

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
    'Tax codes with rates, jurisdictions, and compliance reporting',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.TAX_CODE.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- TAX_RETURN: Tax return preparation and filing
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
    'Tax return preparation, filing, and compliance tracking',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.TAX_RETURN.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- ================================================================================
-- BUDGETING & PLANNING ENTITIES
-- ================================================================================

-- BUDGET: Budget versions and scenarios
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
    'Budget versions with scenario modeling and variance analysis',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.BUDGET.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

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
    'Budget versions and revisions with approval workflow',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.BUDGET_VERSION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- ================================================================================
-- FINANCIAL CLOSE ENTITIES
-- ================================================================================

-- CLOSE_TASK: Period close tasks and checklist
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
    'Financial period close tasks with dependencies and tracking',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.CLOSE_TASK.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

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
    'Financial period close calendar with deadlines and milestones',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.CLOSE_CALENDAR.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- ================================================================================
-- MULTI-CURRENCY & TREASURY ENTITIES
-- ================================================================================

-- TREASURY_POSITION: Cash and liquidity positions
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
    'TREASURY_POSITION',
    'TREASURY_POSITION_ENTITY_TYPE',
    'Treasury Position Entity Type',
    'Cash and liquidity positions with forecasting and risk management',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.TREASURY_POSITION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- CASH_FORECAST: Cash flow forecasting
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
    'CASH_FORECAST',
    'CASH_FORECAST_ENTITY_TYPE',
    'Cash Forecast Entity Type',
    'Cash flow forecasting with scenario analysis and variance tracking',
    'HERA.PLATFORM.FINANCE.ENTITY_TYPE.CASH_FORECAST.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT ON CONSTRAINT core_entities_org_type_code_uidx DO NOTHING;

-- ================================================================================
-- PERFORMANCE OPTIMIZATIONS
-- ================================================================================

-- Ensure indexes exist for finance entity types
CREATE INDEX IF NOT EXISTS idx_finance_entities_type
ON core_entities (organization_id, entity_type, status)
WHERE entity_type IN (
    'GL_ACCOUNT', 'JOURNAL_ENTRY', 'FINANCIAL_DIMENSION', 'FISCAL_PERIOD',
    'VENDOR', 'AP_INVOICE', 'AP_PAYMENT',
    'CUSTOMER', 'AR_INVOICE', 'AR_RECEIPT', 'REVENUE_CONTRACT', 'PERFORMANCE_OBLIGATION',
    'BANK_ACCOUNT', 'BANK_STATEMENT', 'BANK_RECONCILIATION',
    'FIXED_ASSET', 'DEPRECIATION_SCHEDULE', 'LEASE_CONTRACT', 'RIGHT_OF_USE_ASSET',
    'TAX_CODE', 'TAX_RETURN',
    'BUDGET', 'BUDGET_VERSION',
    'CLOSE_TASK', 'CLOSE_CALENDAR',
    'TREASURY_POSITION', 'CASH_FORECAST'
);

CREATE INDEX IF NOT EXISTS idx_finance_entities_smart_code
ON core_entities (organization_id, smart_code)
WHERE smart_code LIKE 'HERA.%FINANCE%';

-- ================================================================================
-- FINANCE ENTITIES SUCCESS CONFIRMATION
-- ================================================================================

DO $validation$
DECLARE
    v_entity_count INTEGER;
    v_expected_count INTEGER := 27; -- Total finance entity types
BEGIN
    SELECT COUNT(*) INTO v_entity_count
    FROM core_entities
    WHERE entity_type IN (
        'GL_ACCOUNT', 'JOURNAL_ENTRY', 'FINANCIAL_DIMENSION', 'FISCAL_PERIOD',
        'VENDOR', 'AP_INVOICE', 'AP_PAYMENT',
        'CUSTOMER', 'AR_INVOICE', 'AR_RECEIPT', 'REVENUE_CONTRACT', 'PERFORMANCE_OBLIGATION',
        'BANK_ACCOUNT', 'BANK_STATEMENT', 'BANK_RECONCILIATION',
        'FIXED_ASSET', 'DEPRECIATION_SCHEDULE', 'LEASE_CONTRACT', 'RIGHT_OF_USE_ASSET',
        'TAX_CODE', 'TAX_RETURN',
        'BUDGET', 'BUDGET_VERSION',
        'CLOSE_TASK', 'CLOSE_CALENDAR',
        'TREASURY_POSITION', 'CASH_FORECAST'
    )
    AND organization_id = '00000000-0000-0000-0000-000000000000';

    IF v_entity_count < v_expected_count THEN
        RAISE EXCEPTION 'Finance entities setup incomplete. Expected % entity types, found %', v_expected_count, v_entity_count;
    END IF;

    RAISE NOTICE 'HERA Finance Entities v2.2 migration completed successfully';
    RAISE NOTICE '✅ General Ledger: GL_ACCOUNT, JOURNAL_ENTRY, FINANCIAL_DIMENSION, FISCAL_PERIOD';
    RAISE NOTICE '✅ Accounts Payable: VENDOR, AP_INVOICE, AP_PAYMENT';
    RAISE NOTICE '✅ Accounts Receivable: CUSTOMER, AR_INVOICE, AR_RECEIPT, REVENUE_CONTRACT, PERFORMANCE_OBLIGATION';
    RAISE NOTICE '✅ Bank & Cash: BANK_ACCOUNT, BANK_STATEMENT, BANK_RECONCILIATION';
    RAISE NOTICE '✅ Fixed Assets: FIXED_ASSET, DEPRECIATION_SCHEDULE, LEASE_CONTRACT, RIGHT_OF_USE_ASSET';
    RAISE NOTICE '✅ Tax & Compliance: TAX_CODE, TAX_RETURN';
    RAISE NOTICE '✅ Budgeting: BUDGET, BUDGET_VERSION';
    RAISE NOTICE '✅ Financial Close: CLOSE_TASK, CLOSE_CALENDAR';
    RAISE NOTICE '✅ Treasury: TREASURY_POSITION, CASH_FORECAST';
    RAISE NOTICE '📊 Total finance entity types: % (Complete suite)', v_entity_count;
END;
$validation$;
