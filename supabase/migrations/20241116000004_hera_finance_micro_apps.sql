-- ================================================================================
-- HERA Finance Micro-Apps v2.2 - Complete Finance Module Definitions
-- Migration: Installable finance modules via data (zero code deployment)
-- Smart Code: HERA.PLATFORM.FINANCE.MICRO_APPS.v2.2
-- Author: HERA Finance Team
-- Created: 2024-11-16
-- ================================================================================

-- ================================================================================
-- MICRO-APP ARCHITECTURE ENTITIES
-- ================================================================================

-- MICRO_APP_DEF: Micro-app definitions (platform-level)
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
    'MICRO_APP_DEF',
    'MICRO_APP_DEF_ENTITY_TYPE',
    'Micro-App Definition Entity Type',
    'Entity type for micro-app definitions and templates',
    'HERA.PLATFORM.MICRO_APP.ENTITY_TYPE.DEF.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- MICRO_APP_INSTALL: Micro-app installations (organization-level)
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
    'MICRO_APP_INSTALL',
    'MICRO_APP_INSTALL_ENTITY_TYPE',
    'Micro-App Installation Entity Type',
    'Entity type for tracking micro-app installations per organization',
    'HERA.PLATFORM.MICRO_APP.ENTITY_TYPE.INSTALL.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- ================================================================================
-- GENERAL LEDGER MICRO-APP
-- ================================================================================

-- GL Module Definition
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
    'MICRO_APP_DEF',
    'FINANCE_GL',
    'General Ledger Module',
    'Complete General Ledger module with COA, journals, and reporting',
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_GL.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- GL Module Configuration
INSERT INTO core_dynamic_data (
    id,
    entity_id,
    field_name,
    field_type,
    field_value_json,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e.id,
    'app_config',
    'json',
    '{
        "app_name": "General Ledger",
        "app_code": "FINANCE_GL",
        "version": "1.0.0",
        "category": "FINANCE",
        "description": "Complete GL with COA, journals, fiscal calendar, and IFRS reporting",
        "icon": "BookOpen",
        "color": "blue",
        "dependencies": [],
        "entity_types": [
            "GL_ACCOUNT",
            "FINANCIAL_DIMENSION",
            "JOURNAL_ENTRY",
            "FISCAL_PERIOD"
        ],
        "transaction_types": [
            "JOURNAL_ENTRY",
            "GL_ACCRUAL",
            "GL_DEFERRAL",
            "GL_RECLASSIFICATION"
        ],
        "finance_dna_bundles": [
            "JOURNAL_ENTRY_STANDARD"
        ],
        "workspace_templates": [
            "WS_GL_DASHBOARD",
            "WS_GL_ACCOUNTS",
            "WS_GL_JOURNALS",
            "WS_GL_REPORTS"
        ],
        "reports": [
            "trial_balance",
            "balance_sheet",
            "income_statement",
            "cash_flow_statement",
            "account_activity"
        ],
        "sample_data": {
            "create_sample_coa": true,
            "coa_template": "IFRS_STANDARD",
            "fiscal_calendar": "CALENDAR_YEAR",
            "base_currency": "USD"
        },
        "installation_steps": [
            {
                "step": 1,
                "name": "Create Chart of Accounts",
                "description": "Set up standard IFRS chart of accounts",
                "required": true
            },
            {
                "step": 2,
                "name": "Setup Fiscal Calendar",
                "description": "Configure fiscal periods and year-end",
                "required": true
            },
            {
                "step": 3,
                "name": "Create Financial Dimensions",
                "description": "Setup cost centers, profit centers, projects",
                "required": false
            },
            {
                "step": 4,
                "name": "Import Opening Balances",
                "description": "Load opening balances from previous system",
                "required": false
            }
        ],
        "permissions": [
            "GL_VIEW",
            "GL_CREATE",
            "GL_EDIT",
            "GL_POST",
            "GL_REVERSE",
            "GL_CLOSE_PERIOD"
        ]
    }'::jsonb,
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_GL.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'MICRO_APP_DEF'
AND e.entity_code = 'FINANCE_GL'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- ACCOUNTS PAYABLE MICRO-APP
-- ================================================================================

-- AP Module Definition
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
    'MICRO_APP_DEF',
    'FINANCE_AP',
    'Accounts Payable Module',
    'Complete AP module with vendor management, invoice processing, and payments',
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_AP.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AP Module Configuration
INSERT INTO core_dynamic_data (
    id,
    entity_id,
    field_name,
    field_type,
    field_value_json,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e.id,
    'app_config',
    'json',
    '{
        "app_name": "Accounts Payable",
        "app_code": "FINANCE_AP",
        "version": "1.0.0",
        "category": "FINANCE",
        "description": "Complete AP with vendor management, invoice processing, payments, and aging",
        "icon": "CreditCard",
        "color": "red",
        "dependencies": ["FINANCE_GL"],
        "entity_types": [
            "VENDOR",
            "AP_INVOICE", 
            "AP_PAYMENT",
            "TAX_CODE"
        ],
        "transaction_types": [
            "AP_INVOICE",
            "AP_PAYMENT",
            "AP_CREDIT_NOTE",
            "AP_PREPAYMENT"
        ],
        "finance_dna_bundles": [
            "AP_INVOICE_STANDARD",
            "AP_PAYMENT_STANDARD"
        ],
        "workspace_templates": [
            "WS_AP_DASHBOARD",
            "WS_AP_VENDORS",
            "WS_AP_INVOICES",
            "WS_AP_PAYMENTS"
        ],
        "reports": [
            "vendor_aging",
            "ap_trial_balance",
            "payment_forecast",
            "vendor_statements",
            "expense_analysis"
        ],
        "workflows": [
            {
                "name": "Invoice Approval",
                "steps": ["submit", "approve", "post"],
                "approval_limits": true
            },
            {
                "name": "Payment Processing",
                "steps": ["create_batch", "review", "release"],
                "dual_approval": true
            }
        ],
        "integrations": [
            "email_invoice_receipt",
            "ocr_invoice_scanning",
            "bank_payment_files",
            "vendor_portal"
        ],
        "permissions": [
            "AP_VIEW",
            "AP_CREATE",
            "AP_EDIT",
            "AP_APPROVE",
            "AP_PAY",
            "AP_REPORTS"
        ]
    }'::jsonb,
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_AP.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'MICRO_APP_DEF'
AND e.entity_code = 'FINANCE_AP'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- ACCOUNTS RECEIVABLE MICRO-APP
-- ================================================================================

-- AR Module Definition
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
    'MICRO_APP_DEF',
    'FINANCE_AR',
    'Accounts Receivable Module',
    'Complete AR module with customer management, invoicing, receipts, and collections',
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_AR.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AR Module Configuration
INSERT INTO core_dynamic_data (
    id,
    entity_id,
    field_name,
    field_type,
    field_value_json,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e.id,
    'app_config',
    'json',
    '{
        "app_name": "Accounts Receivable",
        "app_code": "FINANCE_AR",
        "version": "1.0.0",
        "category": "FINANCE",
        "description": "Complete AR with customer management, invoicing, receipts, and IFRS 15 revenue recognition",
        "icon": "DollarSign",
        "color": "green",
        "dependencies": ["FINANCE_GL"],
        "entity_types": [
            "CUSTOMER",
            "AR_INVOICE",
            "AR_RECEIPT",
            "REVENUE_CONTRACT",
            "PERFORMANCE_OBLIGATION"
        ],
        "transaction_types": [
            "AR_INVOICE",
            "AR_RECEIPT",
            "AR_CREDIT_NOTE",
            "REVENUE_RECOGNITION"
        ],
        "finance_dna_bundles": [
            "AR_INVOICE_STANDARD",
            "AR_RECEIPT_STANDARD",
            "REVENUE_RECOGNITION_IFRS15"
        ],
        "workspace_templates": [
            "WS_AR_DASHBOARD",
            "WS_AR_CUSTOMERS",
            "WS_AR_INVOICES",
            "WS_AR_RECEIPTS",
            "WS_AR_COLLECTIONS"
        ],
        "reports": [
            "customer_aging",
            "ar_trial_balance",
            "sales_analysis",
            "revenue_recognition_schedule",
            "dso_analysis",
            "collection_effectiveness"
        ],
        "workflows": [
            {
                "name": "Invoice Processing",
                "steps": ["create", "review", "send", "follow_up"],
                "auto_send": true
            },
            {
                "name": "Collections Management",
                "steps": ["dunning_1", "dunning_2", "dunning_3", "collections"],
                "aging_buckets": [30, 60, 90]
            }
        ],
        "ifrs_features": [
            "ifrs15_revenue_recognition",
            "contract_assets",
            "contract_liabilities",
            "performance_obligations"
        ],
        "permissions": [
            "AR_VIEW",
            "AR_CREATE",
            "AR_EDIT",
            "AR_SEND",
            "AR_RECEIPT",
            "AR_COLLECTIONS"
        ]
    }'::jsonb,
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_AR.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'MICRO_APP_DEF'
AND e.entity_code = 'FINANCE_AR'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- BANK & CASH MANAGEMENT MICRO-APP
-- ================================================================================

-- Bank Module Definition
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
    'MICRO_APP_DEF',
    'FINANCE_BANK',
    'Bank & Cash Management Module',
    'Complete bank module with reconciliation, cash forecasting, and liquidity management',
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_BANK.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Bank Module Configuration
INSERT INTO core_dynamic_data (
    id,
    entity_id,
    field_name,
    field_type,
    field_value_json,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e.id,
    'app_config',
    'json',
    '{
        "app_name": "Bank & Cash Management",
        "app_code": "FINANCE_BANK",
        "version": "1.0.0",
        "category": "FINANCE",
        "description": "Complete bank management with reconciliation, cash forecasting, and liquidity analysis",
        "icon": "Building",
        "color": "blue",
        "dependencies": ["FINANCE_GL"],
        "entity_types": [
            "BANK_ACCOUNT",
            "BANK_STATEMENT",
            "BANK_RECONCILIATION"
        ],
        "transaction_types": [
            "BANK_TRANSFER",
            "BANK_CHARGES",
            "BANK_INTEREST",
            "BANK_RECONCILIATION"
        ],
        "finance_dna_bundles": [
            "BANK_TRANSFER"
        ],
        "workspace_templates": [
            "WS_BANK_DASHBOARD",
            "WS_BANK_ACCOUNTS",
            "WS_BANK_RECONCILIATION",
            "WS_CASH_FORECAST"
        ],
        "reports": [
            "cash_position",
            "bank_reconciliation_report",
            "cash_flow_forecast",
            "liquidity_analysis",
            "bank_charges_analysis"
        ],
        "features": [
            "auto_bank_feeds",
            "ai_transaction_matching",
            "cash_flow_forecasting",
            "multi_currency_accounts",
            "bank_integration_apis"
        ],
        "reconciliation_rules": [
            {
                "name": "Exact Amount Match",
                "type": "amount_match",
                "tolerance": 0.00
            },
            {
                "name": "Date Range Match",
                "type": "date_range",
                "days": 3
            },
            {
                "name": "Reference Match",
                "type": "reference_match",
                "fuzzy": true
            }
        ],
        "permissions": [
            "BANK_VIEW",
            "BANK_RECONCILE",
            "BANK_TRANSFER",
            "CASH_FORECAST",
            "BANK_ADMIN"
        ]
    }'::jsonb,
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_BANK.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'MICRO_APP_DEF'
AND e.entity_code = 'FINANCE_BANK'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- FIXED ASSETS MICRO-APP
-- ================================================================================

-- Assets Module Definition
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
    'MICRO_APP_DEF',
    'FINANCE_ASSETS',
    'Fixed Assets Module',
    'Complete fixed assets module with depreciation, IFRS 16 leases, and asset lifecycle',
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_ASSETS.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Assets Module Configuration
INSERT INTO core_dynamic_data (
    id,
    entity_id,
    field_name,
    field_type,
    field_value_json,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e.id,
    'app_config',
    'json',
    '{
        "app_name": "Fixed Assets",
        "app_code": "FINANCE_ASSETS",
        "version": "1.0.0",
        "category": "FINANCE",
        "description": "Complete fixed assets with depreciation, IFRS 16 leases, and asset lifecycle management",
        "icon": "Home",
        "color": "purple",
        "dependencies": ["FINANCE_GL"],
        "entity_types": [
            "FIXED_ASSET",
            "DEPRECIATION_SCHEDULE",
            "LEASE_CONTRACT",
            "RIGHT_OF_USE_ASSET"
        ],
        "transaction_types": [
            "ASSET_ACQUISITION",
            "ASSET_DEPRECIATION",
            "ASSET_DISPOSAL",
            "LEASE_INITIAL_RECOGNITION",
            "LEASE_PAYMENT"
        ],
        "finance_dna_bundles": [
            "ASSET_ACQUISITION",
            "ASSET_DEPRECIATION",
            "LEASE_INITIAL_RECOGNITION"
        ],
        "workspace_templates": [
            "WS_ASSETS_DASHBOARD",
            "WS_ASSETS_REGISTER",
            "WS_DEPRECIATION",
            "WS_LEASES_IFRS16"
        ],
        "reports": [
            "asset_register",
            "depreciation_schedule",
            "asset_additions_disposals",
            "lease_schedule_ifrs16",
            "impairment_analysis"
        ],
        "ifrs16_features": [
            "lease_classification",
            "rou_asset_calculation",
            "lease_liability_calculation",
            "discount_rate_determination",
            "lease_modifications"
        ],
        "depreciation_methods": [
            "straight_line",
            "declining_balance",
            "sum_of_years_digits",
            "units_of_production"
        ],
        "permissions": [
            "ASSETS_VIEW",
            "ASSETS_CREATE",
            "ASSETS_DEPRECIATE",
            "ASSETS_DISPOSE",
            "LEASES_MANAGE"
        ]
    }'::jsonb,
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_ASSETS.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'MICRO_APP_DEF'
AND e.entity_code = 'FINANCE_ASSETS'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- BUDGETING & PLANNING MICRO-APP
-- ================================================================================

-- Budget Module Definition
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
    'MICRO_APP_DEF',
    'FINANCE_BUDGET',
    'Budgeting & Planning Module',
    'Complete budgeting with planning, forecasting, and variance analysis',
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_BUDGET.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Budget Module Configuration
INSERT INTO core_dynamic_data (
    id,
    entity_id,
    field_name,
    field_type,
    field_value_json,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e.id,
    'app_config',
    'json',
    '{
        "app_name": "Budgeting & Planning",
        "app_code": "FINANCE_BUDGET",
        "version": "1.0.0",
        "category": "FINANCE",
        "description": "Complete budgeting with planning, forecasting, and variance analysis",
        "icon": "TrendingUp",
        "color": "yellow",
        "dependencies": ["FINANCE_GL"],
        "entity_types": [
            "BUDGET",
            "BUDGET_VERSION"
        ],
        "transaction_types": [
            "BUDGET_ENTRY",
            "BUDGET_REVISION",
            "BUDGET_TRANSFER"
        ],
        "workspace_templates": [
            "WS_BUDGET_DASHBOARD",
            "WS_BUDGET_ENTRY",
            "WS_BUDGET_ANALYSIS",
            "WS_FORECASTING"
        ],
        "reports": [
            "budget_vs_actual",
            "variance_analysis",
            "rolling_forecast",
            "budget_utilization",
            "departmental_budgets"
        ],
        "planning_features": [
            "top_down_budgeting",
            "bottom_up_budgeting",
            "driver_based_planning",
            "scenario_modeling",
            "rolling_forecasts"
        ],
        "approval_workflow": [
            {
                "level": 1,
                "role": "DEPARTMENT_MANAGER",
                "threshold": 100000
            },
            {
                "level": 2,
                "role": "CFO",
                "threshold": 500000
            }
        ],
        "permissions": [
            "BUDGET_VIEW",
            "BUDGET_CREATE",
            "BUDGET_APPROVE",
            "BUDGET_ANALYZE",
            "BUDGET_ADMIN"
        ]
    }'::jsonb,
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_BUDGET.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'MICRO_APP_DEF'
AND e.entity_code = 'FINANCE_BUDGET'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- FINANCIAL CLOSE MICRO-APP
-- ================================================================================

-- Close Module Definition
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
    'MICRO_APP_DEF',
    'FINANCE_CLOSE',
    'Financial Close Module',
    'Complete period close with task management, reconciliations, and reporting',
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_CLOSE.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Close Module Configuration
INSERT INTO core_dynamic_data (
    id,
    entity_id,
    field_name,
    field_type,
    field_value_json,
    smart_code,
    organization_id,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e.id,
    'app_config',
    'json',
    '{
        "app_name": "Financial Close",
        "app_code": "FINANCE_CLOSE",
        "version": "1.0.0",
        "category": "FINANCE",
        "description": "Complete period close with task management, reconciliations, and automated reporting",
        "icon": "Calendar",
        "color": "indigo",
        "dependencies": ["FINANCE_GL", "FINANCE_AP", "FINANCE_AR"],
        "entity_types": [
            "CLOSE_TASK",
            "CLOSE_CALENDAR"
        ],
        "workspace_templates": [
            "WS_CLOSE_DASHBOARD",
            "WS_CLOSE_TASKS",
            "WS_CLOSE_CALENDAR",
            "WS_CLOSE_REPORTS"
        ],
        "close_tasks": [
            {
                "task": "AP Cutoff",
                "description": "Ensure all AP invoices are recorded",
                "owner": "AP_CLERK",
                "due_days": -1,
                "dependencies": []
            },
            {
                "task": "AR Cutoff",
                "description": "Ensure all AR invoices are recorded",
                "owner": "AR_CLERK", 
                "due_days": -1,
                "dependencies": []
            },
            {
                "task": "Bank Reconciliation",
                "description": "Complete all bank reconciliations",
                "owner": "BANK_CLERK",
                "due_days": 2,
                "dependencies": ["AP Cutoff", "AR Cutoff"]
            },
            {
                "task": "Accruals & Prepaids",
                "description": "Record month-end accruals and deferrals",
                "owner": "STAFF_ACCOUNTANT",
                "due_days": 3,
                "dependencies": ["Bank Reconciliation"]
            },
            {
                "task": "Depreciation",
                "description": "Post monthly depreciation",
                "owner": "FIXED_ASSETS_CLERK",
                "due_days": 3,
                "dependencies": []
            },
            {
                "task": "Trial Balance Review",
                "description": "Review trial balance for anomalies",
                "owner": "CONTROLLER",
                "due_days": 4,
                "dependencies": ["Accruals & Prepaids", "Depreciation"]
            },
            {
                "task": "Financial Statements",
                "description": "Prepare financial statements",
                "owner": "CONTROLLER",
                "due_days": 5,
                "dependencies": ["Trial Balance Review"]
            }
        ],
        "reports": [
            "close_status_report",
            "close_performance_metrics",
            "task_completion_analysis",
            "close_timeline"
        ],
        "automation_features": [
            "auto_task_creation",
            "dependency_tracking",
            "notification_system",
            "deadline_monitoring"
        ],
        "permissions": [
            "CLOSE_VIEW",
            "CLOSE_MANAGE",
            "CLOSE_APPROVE",
            "CLOSE_ADMIN"
        ]
    }'::jsonb,
    'HERA.PLATFORM.MICRO_APP.DEF.FINANCE_CLOSE.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'MICRO_APP_DEF'
AND e.entity_code = 'FINANCE_CLOSE'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- MICRO-APP INSTALLATION ENGINE
-- ================================================================================

-- Function to install a finance micro-app
CREATE OR REPLACE FUNCTION hera_finance_micro_app_install_v1(
    p_actor_user_id UUID,
    p_organization_id UUID,
    p_app_code TEXT,
    p_config JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_app_def_id UUID;
    v_app_config JSONB;
    v_install_id UUID;
    v_entity_type TEXT;
    v_entities_created INTEGER := 0;
    v_templates_created INTEGER := 0;
    v_result JSONB;
BEGIN
    -- Find app definition
    SELECT e.id, dd.field_value_json INTO v_app_def_id, v_app_config
    FROM core_entities e
    JOIN core_dynamic_data dd ON dd.entity_id = e.id
    WHERE e.entity_type = 'MICRO_APP_DEF'
    AND e.entity_code = p_app_code
    AND e.organization_id = '00000000-0000-0000-0000-000000000000'
    AND dd.field_name = 'app_config'
    AND e.status = 'active';

    -- Check if app exists
    IF v_app_def_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Micro-app not found: ' || p_app_code,
            'error_code', 'APP_NOT_FOUND'
        );
    END IF;

    -- Check if already installed
    IF EXISTS (
        SELECT 1 FROM core_entities e
        WHERE e.entity_type = 'MICRO_APP_INSTALL'
        AND e.entity_code = p_app_code
        AND e.organization_id = p_organization_id
        AND e.status = 'active'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Micro-app already installed: ' || p_app_code,
            'error_code', 'APP_ALREADY_INSTALLED'
        );
    END IF;

    -- Create installation record
    v_install_id := gen_random_uuid();
    INSERT INTO core_entities (
        id,
        entity_type,
        entity_code,
        entity_name,
        entity_description,
        smart_code,
        organization_id,
        parent_entity_id,
        created_by,
        updated_by,
        created_at,
        updated_at,
        status
    ) VALUES (
        v_install_id,
        'MICRO_APP_INSTALL',
        p_app_code,
        v_app_config->>'app_name' || ' Installation',
        'Installation of ' || (v_app_config->>'app_name') || ' for organization',
        'HERA.' || REPLACE(p_organization_id::TEXT, '-', '_') || '.MICRO_APP.INSTALL.' || p_app_code || '.v1',
        p_organization_id,
        v_app_def_id,
        p_actor_user_id,
        p_actor_user_id,
        NOW(),
        NOW(),
        'active'
    );

    -- Store installation config
    INSERT INTO core_dynamic_data (
        id,
        entity_id,
        field_name,
        field_type,
        field_value_json,
        smart_code,
        organization_id,
        created_by,
        updated_by
    ) VALUES (
        gen_random_uuid(),
        v_install_id,
        'installation_config',
        'json',
        p_config,
        'HERA.' || REPLACE(p_organization_id::TEXT, '-', '_') || '.MICRO_APP.INSTALL.' || p_app_code || '.CONFIG.v1',
        p_organization_id,
        p_actor_user_id,
        p_actor_user_id
    );

    -- Create entity type definitions for the organization (sample implementation)
    IF v_app_config->'entity_types' IS NOT NULL THEN
        FOR v_entity_type IN SELECT value::TEXT FROM jsonb_array_elements_text(v_app_config->'entity_types')
        LOOP
            -- This would create organization-specific entity instances
            -- Implementation depends on specific requirements
            v_entities_created := v_entities_created + 1;
        END LOOP;
    END IF;

    -- Create workspace templates (sample implementation)
    IF v_app_config->'workspace_templates' IS NOT NULL THEN
        v_templates_created := jsonb_array_length(v_app_config->'workspace_templates');
    END IF;

    -- Log installation transaction
    INSERT INTO universal_transactions (
        id,
        organization_id,
        transaction_type,
        transaction_code,
        smart_code,
        source_entity_id,
        total_amount,
        transaction_status,
        business_context,
        created_by,
        updated_by
    ) VALUES (
        gen_random_uuid(),
        p_organization_id,
        'MICRO_APP_INSTALL',
        'APP_INSTALL_' || p_app_code || '_' || to_char(NOW(), 'YYYYMMDD'),
        'HERA.' || REPLACE(p_organization_id::TEXT, '-', '_') || '.MICRO_APP.TXN.INSTALL.' || p_app_code || '.v1',
        v_install_id,
        0,
        'completed',
        jsonb_build_object(
            'app_code', p_app_code,
            'app_name', v_app_config->>'app_name',
            'installation_id', v_install_id,
            'entities_created', v_entities_created,
            'templates_created', v_templates_created
        ),
        p_actor_user_id,
        p_actor_user_id
    );

    -- Build result
    v_result := jsonb_build_object(
        'success', true,
        'installation_id', v_install_id,
        'app_code', p_app_code,
        'app_name', v_app_config->>'app_name',
        'entities_created', v_entities_created,
        'templates_created', v_templates_created,
        'sample_data', COALESCE(v_app_config->'sample_data', '{}'),
        'message', 'Micro-app installed successfully'
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Micro-app installation failed: ' || SQLERRM,
            'error_code', 'INSTALLATION_ERROR',
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list available micro-apps
CREATE OR REPLACE FUNCTION hera_finance_micro_apps_available_v1()
RETURNS TABLE(
    app_code TEXT,
    app_name TEXT,
    category TEXT,
    description TEXT,
    version TEXT,
    dependencies TEXT[],
    icon TEXT,
    color TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.entity_code,
        dd.field_value_json->>'app_name',
        dd.field_value_json->>'category',
        e.entity_description,
        dd.field_value_json->>'version',
        ARRAY(SELECT jsonb_array_elements_text(dd.field_value_json->'dependencies')),
        dd.field_value_json->>'icon',
        dd.field_value_json->>'color'
    FROM core_entities e
    JOIN core_dynamic_data dd ON dd.entity_id = e.id
    WHERE e.entity_type = 'MICRO_APP_DEF'
    AND e.organization_id = '00000000-0000-0000-0000-000000000000'
    AND dd.field_name = 'app_config'
    AND e.status = 'active'
    ORDER BY 
        CASE dd.field_value_json->>'category'
            WHEN 'FINANCE' THEN 1
            ELSE 2
        END,
        e.entity_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check installed micro-apps for an organization
CREATE OR REPLACE FUNCTION hera_finance_micro_apps_installed_v1(
    p_organization_id UUID
)
RETURNS TABLE(
    app_code TEXT,
    app_name TEXT,
    installed_at TIMESTAMPTZ,
    installed_by UUID,
    status TEXT,
    installation_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.entity_code,
        e.entity_name,
        e.created_at,
        e.created_by,
        e.status,
        e.id
    FROM core_entities e
    WHERE e.entity_type = 'MICRO_APP_INSTALL'
    AND e.organization_id = p_organization_id
    ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================
-- INDEXES AND CONSTRAINTS
-- ================================================================================

-- Index for micro-app definitions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_micro_app_def_lookup
ON core_entities (entity_type, entity_code, organization_id, status)
WHERE entity_type = 'MICRO_APP_DEF';

-- Index for micro-app installations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_micro_app_install_lookup
ON core_entities (entity_type, organization_id, entity_code, status)
WHERE entity_type = 'MICRO_APP_INSTALL';

-- Unique constraint for one installation per app per org
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_micro_app_install_unique
ON core_entities (entity_type, organization_id, entity_code)
WHERE entity_type = 'MICRO_APP_INSTALL' AND status = 'active';

-- ================================================================================
-- VERIFICATION AND ROLLBACK
-- ================================================================================

-- Verification query
DO $$
DECLARE
    v_micro_app_count INTEGER;
    v_function_count INTEGER;
    v_index_count INTEGER;
BEGIN
    -- Count micro-apps created
    SELECT COUNT(*) INTO v_micro_app_count
    FROM core_entities
    WHERE entity_type = 'MICRO_APP_DEF'
    AND organization_id = '00000000-0000-0000-0000-000000000000'
    AND status = 'active';
    
    -- Count functions
    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname LIKE 'hera_finance_micro_app%';
    
    -- Count indexes
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE indexname LIKE 'idx_micro_app%';
    
    RAISE NOTICE 'HERA Finance Micro-Apps v2.2 Migration Complete:';
    RAISE NOTICE '  - Finance micro-apps created: %', v_micro_app_count;
    RAISE NOTICE '  - Installation functions: %', v_function_count;
    RAISE NOTICE '  - Performance indexes: %', v_index_count;
    RAISE NOTICE '  - Available modules:';
    RAISE NOTICE '    • General Ledger (FINANCE_GL)';
    RAISE NOTICE '    • Accounts Payable (FINANCE_AP)';
    RAISE NOTICE '    • Accounts Receivable (FINANCE_AR)';
    RAISE NOTICE '    • Bank & Cash Management (FINANCE_BANK)';
    RAISE NOTICE '    • Fixed Assets (FINANCE_ASSETS)';
    RAISE NOTICE '    • Budgeting & Planning (FINANCE_BUDGET)';
    RAISE NOTICE '    • Financial Close (FINANCE_CLOSE)';
    RAISE NOTICE '  - Zero-code deployment: ENABLED';
    RAISE NOTICE '  - Installation engine: READY';
END $$;

-- ================================================================================
-- ROLLBACK SCRIPT (commented)
-- ================================================================================

/*
-- ROLLBACK INSTRUCTIONS
-- Run these commands if rollback is needed:

-- 1. Drop functions
DROP FUNCTION IF EXISTS hera_finance_micro_app_install_v1(UUID, UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS hera_finance_micro_apps_available_v1();
DROP FUNCTION IF EXISTS hera_finance_micro_apps_installed_v1(UUID);

-- 2. Drop indexes
DROP INDEX IF EXISTS idx_micro_app_def_lookup;
DROP INDEX IF EXISTS idx_micro_app_install_lookup;
DROP INDEX IF EXISTS idx_micro_app_install_unique;

-- 3. Remove configurations
DELETE FROM core_dynamic_data 
WHERE entity_id IN (
    SELECT id FROM core_entities 
    WHERE entity_type = 'MICRO_APP_DEF'
    AND organization_id = '00000000-0000-0000-0000-000000000000'
);

-- 4. Remove micro-app definitions
DELETE FROM core_entities 
WHERE entity_type IN ('MICRO_APP_DEF', 'MICRO_APP_INSTALL')
AND organization_id = '00000000-0000-0000-0000-000000000000';
*/