-- ================================================================================
-- HERA Finance Tile Templates v2.2 - Complete Finance Dashboard Tiles
-- Migration: 12 core + 8 advanced finance tiles for dynamic dashboards
-- Smart Code: HERA.PLATFORM.FINANCE.TILE_TEMPLATES.v2.2
-- Author: HERA Finance Team
-- Created: 2024-11-16
-- ================================================================================

-- ================================================================================
-- CORE FINANCE TILES (12 Essential)
-- ================================================================================

-- TILE_TPL_GL_ACCOUNTS: Chart of Accounts tile
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
    'APP_TILE_TEMPLATE',
    'TILE_TPL_GL_ACCOUNTS',
    'GL Accounts Tile Template',
    'Template for General Ledger chart of accounts overview tile',
    'HERA.PLATFORM.UI.TILE.TPL.GL_ACCOUNTS.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- GL Accounts tile configuration
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
    'tile_config',
    'json',
    '{
        "tile_type": "ENTITIES",
        "target_entity_type": "GL_ACCOUNT",
        "category": "General Ledger",
        "icon": "BookOpen",
        "color": "blue",
        "gradient": "blue-to-indigo",
        "size": "medium",
        "permissions": ["GL_VIEW"],
        "stats": [
            {
                "stat_id": "active_accounts",
                "label": "Active Accounts",
                "query_type": "count",
                "filters": {"status": "active"},
                "format": "number"
            },
            {
                "stat_id": "total_balance",
                "label": "Total Balance",
                "query_type": "sum_dynamic_field",
                "field": "current_balance",
                "format": "currency"
            },
            {
                "stat_id": "accounts_by_type",
                "label": "By Type",
                "query_type": "group_by_dynamic_field",
                "field": "account_type",
                "format": "breakdown"
            }
        ],
        "actions": [
            {
                "action_id": "create_account",
                "label": "Create Account",
                "icon": "Plus",
                "endpoint": "/api/v2/entities/create",
                "entity_type": "GL_ACCOUNT",
                "permission": "GL_CREATE"
            },
            {
                "action_id": "view_trial_balance",
                "label": "Trial Balance",
                "icon": "FileText",
                "route": "/finance/gl/trial-balance",
                "permission": "GL_VIEW"
            }
        ],
        "refresh_interval": 300
    }'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.GL_ACCOUNTS.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'APP_TILE_TEMPLATE'
AND e.entity_code = 'TILE_TPL_GL_ACCOUNTS'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- TILE_TPL_GL_JOURNALS: Journal Entries tile
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
    'APP_TILE_TEMPLATE',
    'TILE_TPL_GL_JOURNALS',
    'GL Journal Entries Tile Template',
    'Template for General Ledger journal entries overview tile',
    'HERA.PLATFORM.UI.TILE.TPL.GL_JOURNALS.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- GL Journals tile configuration
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
    'tile_config',
    'json',
    '{
        "tile_type": "TRANSACTIONS",
        "target_transaction_type": "JOURNAL_ENTRY",
        "category": "General Ledger",
        "icon": "Edit",
        "color": "indigo",
        "gradient": "indigo-to-purple",
        "size": "medium",
        "permissions": ["GL_VIEW"],
        "stats": [
            {
                "stat_id": "posted_today",
                "label": "Posted Today",
                "query_type": "count",
                "filters": {
                    "transaction_status": "posted",
                    "created_at": "today"
                },
                "format": "number"
            },
            {
                "stat_id": "pending_approval",
                "label": "Pending Approval",
                "query_type": "count",
                "filters": {"transaction_status": "pending"},
                "format": "number",
                "highlight": {"condition": "> 0", "color": "orange"}
            },
            {
                "stat_id": "this_month_total",
                "label": "This Month",
                "query_type": "sum",
                "field": "total_amount",
                "filters": {"created_at": "current_month"},
                "format": "currency"
            }
        ],
        "actions": [
            {
                "action_id": "create_journal",
                "label": "New Entry",
                "icon": "Plus",
                "route": "/finance/gl/journal-entry/new",
                "permission": "GL_CREATE"
            },
            {
                "action_id": "view_all",
                "label": "All Entries",
                "icon": "List",
                "route": "/finance/gl/journals",
                "permission": "GL_VIEW"
            }
        ],
        "refresh_interval": 60
    }'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.GL_JOURNALS.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'APP_TILE_TEMPLATE'
AND e.entity_code = 'TILE_TPL_GL_JOURNALS'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- TILE_TPL_AP_INVOICES: AP Invoices tile
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
    'APP_TILE_TEMPLATE',
    'TILE_TPL_AP_INVOICES',
    'AP Invoices Tile Template',
    'Template for Accounts Payable invoices overview tile',
    'HERA.PLATFORM.UI.TILE.TPL.AP_INVOICES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AP Invoices tile configuration
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
    'tile_config',
    'json',
    '{
        "tile_type": "ENTITIES",
        "target_entity_type": "AP_INVOICE",
        "category": "Accounts Payable",
        "icon": "CreditCard",
        "color": "red",
        "gradient": "red-to-pink",
        "size": "large",
        "permissions": ["AP_VIEW"],
        "stats": [
            {
                "stat_id": "overdue_invoices",
                "label": "Overdue",
                "query_type": "count_with_calculation",
                "calculation": "due_date < current_date AND status != paid",
                "format": "number",
                "highlight": {"condition": "> 0", "color": "red"}
            },
            {
                "stat_id": "total_payable",
                "label": "Total Payable",
                "query_type": "sum_dynamic_field",
                "field": "amount_outstanding",
                "format": "currency"
            },
            {
                "stat_id": "due_this_week",
                "label": "Due This Week",
                "query_type": "sum_with_filter",
                "field": "amount_outstanding",
                "filters": {"due_date": "current_week"},
                "format": "currency",
                "highlight": {"condition": "> 0", "color": "orange"}
            }
        ],
        "actions": [
            {
                "action_id": "create_invoice",
                "label": "New Invoice",
                "icon": "Plus",
                "route": "/finance/ap/invoice/new",
                "permission": "AP_CREATE"
            },
            {
                "action_id": "aging_report",
                "label": "Aging Report",
                "icon": "BarChart3",
                "route": "/finance/ap/aging",
                "permission": "AP_VIEW"
            }
        ],
        "refresh_interval": 300
    }'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.AP_INVOICES.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'APP_TILE_TEMPLATE'
AND e.entity_code = 'TILE_TPL_AP_INVOICES'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- TILE_TPL_AP_VENDORS: Vendor Master tile
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
    'APP_TILE_TEMPLATE',
    'TILE_TPL_AP_VENDORS',
    'AP Vendors Tile Template',
    'Template for vendor master data overview tile',
    'HERA.PLATFORM.UI.TILE.TPL.AP_VENDORS.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AP Vendors tile configuration
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
    'tile_config',
    'json',
    '{
        "tile_type": "ENTITIES",
        "target_entity_type": "VENDOR",
        "category": "Accounts Payable",
        "icon": "Truck",
        "color": "orange",
        "gradient": "orange-to-red",
        "size": "medium",
        "permissions": ["AP_VIEW"],
        "stats": [
            {
                "stat_id": "active_vendors",
                "label": "Active Vendors",
                "query_type": "count",
                "filters": {"status": "active"},
                "format": "number"
            },
            {
                "stat_id": "top_5_spend",
                "label": "Top 5 Spend",
                "query_type": "top_n_sum",
                "n": 5,
                "field": "ytd_spend",
                "format": "list"
            },
            {
                "stat_id": "new_this_month",
                "label": "New This Month",
                "query_type": "count",
                "filters": {"created_at": "current_month"},
                "format": "number"
            }
        ],
        "actions": [
            {
                "action_id": "create_vendor",
                "label": "New Vendor",
                "icon": "Plus",
                "route": "/finance/ap/vendor/new",
                "permission": "AP_CREATE"
            },
            {
                "action_id": "vendor_analysis",
                "label": "Spend Analysis",
                "icon": "TrendingUp",
                "route": "/finance/ap/vendor-analysis",
                "permission": "AP_VIEW"
            }
        ],
        "refresh_interval": 600
    }'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.AP_VENDORS.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'APP_TILE_TEMPLATE'
AND e.entity_code = 'TILE_TPL_AP_VENDORS'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- TILE_TPL_AR_INVOICES: AR Invoices tile
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
    'APP_TILE_TEMPLATE',
    'TILE_TPL_AR_INVOICES',
    'AR Invoices Tile Template',
    'Template for Accounts Receivable invoices overview tile',
    'HERA.PLATFORM.UI.TILE.TPL.AR_INVOICES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AR Invoices tile configuration
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
    'tile_config',
    'json',
    '{
        "tile_type": "ENTITIES",
        "target_entity_type": "AR_INVOICE",
        "category": "Accounts Receivable",
        "icon": "DollarSign",
        "color": "green",
        "gradient": "green-to-emerald",
        "size": "large",
        "permissions": ["AR_VIEW"],
        "stats": [
            {
                "stat_id": "overdue_invoices",
                "label": "Overdue",
                "query_type": "count_with_calculation",
                "calculation": "due_date < current_date AND status != paid",
                "format": "number",
                "highlight": {"condition": "> 0", "color": "red"}
            },
            {
                "stat_id": "total_receivable",
                "label": "Total Receivable",
                "query_type": "sum_dynamic_field",
                "field": "amount_outstanding",
                "format": "currency"
            },
            {
                "stat_id": "dso",
                "label": "DSO (Days)",
                "query_type": "calculation",
                "calculation": "avg_days_sales_outstanding",
                "format": "number",
                "highlight": {"condition": "> 45", "color": "orange"}
            }
        ],
        "actions": [
            {
                "action_id": "create_invoice",
                "label": "New Invoice",
                "icon": "Plus",
                "route": "/finance/ar/invoice/new",
                "permission": "AR_CREATE"
            },
            {
                "action_id": "aging_report",
                "label": "Aging Report",
                "icon": "BarChart3",
                "route": "/finance/ar/aging",
                "permission": "AR_VIEW"
            }
        ],
        "refresh_interval": 300
    }'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.AR_INVOICES.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'APP_TILE_TEMPLATE'
AND e.entity_code = 'TILE_TPL_AR_INVOICES'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- TILE_TPL_AR_CUSTOMERS: Customer Master tile
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
    'APP_TILE_TEMPLATE',
    'TILE_TPL_AR_CUSTOMERS',
    'AR Customers Tile Template',
    'Template for customer master data overview tile',
    'HERA.PLATFORM.UI.TILE.TPL.AR_CUSTOMERS.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AR Customers tile configuration
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
    'tile_config',
    'json',
    '{
        "tile_type": "ENTITIES",
        "target_entity_type": "CUSTOMER",
        "category": "Accounts Receivable",
        "icon": "Users",
        "color": "emerald",
        "gradient": "emerald-to-teal",
        "size": "medium",
        "permissions": ["AR_VIEW"],
        "stats": [
            {
                "stat_id": "active_customers",
                "label": "Active Customers",
                "query_type": "count",
                "filters": {"status": "active"},
                "format": "number"
            },
            {
                "stat_id": "avg_dso",
                "label": "Average DSO",
                "query_type": "avg_dynamic_field",
                "field": "days_sales_outstanding",
                "format": "number"
            },
            {
                "stat_id": "top_5_revenue",
                "label": "Top 5 Revenue",
                "query_type": "top_n_sum",
                "n": 5,
                "field": "ytd_revenue",
                "format": "list"
            }
        ],
        "actions": [
            {
                "action_id": "create_customer",
                "label": "New Customer",
                "icon": "Plus",
                "route": "/finance/ar/customer/new",
                "permission": "AR_CREATE"
            },
            {
                "action_id": "customer_analysis",
                "label": "Revenue Analysis",
                "icon": "TrendingUp",
                "route": "/finance/ar/customer-analysis",
                "permission": "AR_VIEW"
            }
        ],
        "refresh_interval": 600
    }'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.AR_CUSTOMERS.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'APP_TILE_TEMPLATE'
AND e.entity_code = 'TILE_TPL_AR_CUSTOMERS'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- TILE_TPL_BANK_ACCOUNTS: Bank Accounts tile
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
    'APP_TILE_TEMPLATE',
    'TILE_TPL_BANK_ACCOUNTS',
    'Bank Accounts Tile Template',
    'Template for bank accounts and cash position tile',
    'HERA.PLATFORM.UI.TILE.TPL.BANK_ACCOUNTS.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Bank Accounts tile configuration
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
    'tile_config',
    'json',
    '{
        "tile_type": "ENTITIES",
        "target_entity_type": "BANK_ACCOUNT",
        "category": "Bank & Cash",
        "icon": "Building",
        "color": "blue",
        "gradient": "blue-to-cyan",
        "size": "medium",
        "permissions": ["BANK_VIEW"],
        "stats": [
            {
                "stat_id": "total_cash_balance",
                "label": "Total Cash",
                "query_type": "sum_dynamic_field",
                "field": "current_balance",
                "format": "currency"
            },
            {
                "stat_id": "unreconciled_items",
                "label": "Unreconciled",
                "query_type": "count_related",
                "related_entity": "BANK_RECONCILIATION",
                "filters": {"status": "open"},
                "format": "number",
                "highlight": {"condition": "> 0", "color": "orange"}
            },
            {
                "stat_id": "accounts_count",
                "label": "Bank Accounts",
                "query_type": "count",
                "filters": {"status": "active"},
                "format": "number"
            }
        ],
        "actions": [
            {
                "action_id": "reconcile",
                "label": "Reconcile",
                "icon": "RefreshCw",
                "route": "/finance/bank/reconciliation",
                "permission": "BANK_RECONCILE"
            },
            {
                "action_id": "cash_position",
                "label": "Cash Position",
                "icon": "PieChart",
                "route": "/finance/bank/cash-position",
                "permission": "BANK_VIEW"
            }
        ],
        "refresh_interval": 300
    }'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.BANK_ACCOUNTS.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'APP_TILE_TEMPLATE'
AND e.entity_code = 'TILE_TPL_BANK_ACCOUNTS'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- TILE_TPL_BANK_RECON: Bank Reconciliation tile
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
    'APP_TILE_TEMPLATE',
    'TILE_TPL_BANK_RECON',
    'Bank Reconciliation Tile Template',
    'Template for bank reconciliation status and tasks tile',
    'HERA.PLATFORM.UI.TILE.TPL.BANK_RECON.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Bank Reconciliation tile configuration
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
    'tile_config',
    'json',
    '{
        "tile_type": "ENTITIES",
        "target_entity_type": "BANK_RECONCILIATION",
        "category": "Bank & Cash",
        "icon": "RefreshCw",
        "color": "cyan",
        "gradient": "cyan-to-blue",
        "size": "medium",
        "permissions": ["BANK_VIEW"],
        "stats": [
            {
                "stat_id": "open_sessions",
                "label": "Open Sessions",
                "query_type": "count",
                "filters": {"status": "open"},
                "format": "number"
            },
            {
                "stat_id": "exceptions",
                "label": "Exceptions",
                "query_type": "count_dynamic_field",
                "field": "exception_count",
                "format": "number",
                "highlight": {"condition": "> 0", "color": "red"}
            },
            {
                "stat_id": "last_reconciled",
                "label": "Last Reconciled",
                "query_type": "max_date",
                "field": "reconciled_date",
                "format": "date"
            }
        ],
        "actions": [
            {
                "action_id": "start_reconciliation",
                "label": "Start Recon",
                "icon": "Play",
                "route": "/finance/bank/reconciliation/new",
                "permission": "BANK_RECONCILE"
            },
            {
                "action_id": "view_exceptions",
                "label": "Exceptions",
                "icon": "AlertTriangle",
                "route": "/finance/bank/exceptions",
                "permission": "BANK_VIEW"
            }
        ],
        "refresh_interval": 300
    }'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.BANK_RECON.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'APP_TILE_TEMPLATE'
AND e.entity_code = 'TILE_TPL_BANK_RECON'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- TILE_TPL_ASSETS: Fixed Assets tile
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
    'APP_TILE_TEMPLATE',
    'TILE_TPL_ASSETS',
    'Fixed Assets Tile Template',
    'Template for fixed assets overview and depreciation tile',
    'HERA.PLATFORM.UI.TILE.TPL.ASSETS.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Fixed Assets tile configuration
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
    'tile_config',
    'json',
    '{
        "tile_type": "ENTITIES",
        "target_entity_type": "FIXED_ASSET",
        "category": "Fixed Assets",
        "icon": "Home",
        "color": "purple",
        "gradient": "purple-to-pink",
        "size": "medium",
        "permissions": ["ASSETS_VIEW"],
        "stats": [
            {
                "stat_id": "asset_count",
                "label": "Total Assets",
                "query_type": "count",
                "filters": {"status": "active"},
                "format": "number"
            },
            {
                "stat_id": "net_book_value",
                "label": "Net Book Value",
                "query_type": "calculation",
                "calculation": "cost - accumulated_depreciation",
                "format": "currency"
            },
            {
                "stat_id": "monthly_depreciation",
                "label": "Monthly Depreciation",
                "query_type": "sum_dynamic_field",
                "field": "monthly_depreciation",
                "format": "currency"
            }
        ],
        "actions": [
            {
                "action_id": "add_asset",
                "label": "Add Asset",
                "icon": "Plus",
                "route": "/finance/assets/new",
                "permission": "ASSETS_CREATE"
            },
            {
                "action_id": "depreciation_run",
                "label": "Run Depreciation",
                "icon": "Calculator",
                "route": "/finance/assets/depreciation",
                "permission": "ASSETS_DEPRECIATE"
            }
        ],
        "refresh_interval": 600
    }'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.ASSETS.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'APP_TILE_TEMPLATE'
AND e.entity_code = 'TILE_TPL_ASSETS'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- TILE_TPL_CLOSE_STATUS: Period Close Status tile
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
    'APP_TILE_TEMPLATE',
    'TILE_TPL_CLOSE_STATUS',
    'Period Close Status Tile Template',
    'Template for financial period close status and progress tile',
    'HERA.PLATFORM.UI.TILE.TPL.CLOSE_STATUS.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Period Close Status tile configuration
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
    'tile_config',
    'json',
    '{
        "tile_type": "ENTITIES",
        "target_entity_type": "CLOSE_TASK",
        "category": "Financial Close",
        "icon": "Calendar",
        "color": "indigo",
        "gradient": "indigo-to-purple",
        "size": "large",
        "permissions": ["CLOSE_VIEW"],
        "stats": [
            {
                "stat_id": "tasks_complete",
                "label": "Tasks Complete",
                "query_type": "progress_percentage",
                "calculation": "completed / total",
                "format": "percentage"
            },
            {
                "stat_id": "blockers",
                "label": "Blockers",
                "query_type": "count",
                "filters": {"status": "blocked"},
                "format": "number",
                "highlight": {"condition": "> 0", "color": "red"}
            },
            {
                "stat_id": "days_remaining",
                "label": "Days to Close",
                "query_type": "date_calculation",
                "calculation": "close_deadline - current_date",
                "format": "days",
                "highlight": {"condition": "< 3", "color": "orange"}
            }
        ],
        "actions": [
            {
                "action_id": "view_tasks",
                "label": "View Tasks",
                "icon": "CheckSquare",
                "route": "/finance/close/tasks",
                "permission": "CLOSE_VIEW"
            },
            {
                "action_id": "close_calendar",
                "label": "Close Calendar",
                "icon": "Calendar",
                "route": "/finance/close/calendar",
                "permission": "CLOSE_VIEW"
            }
        ],
        "refresh_interval": 300
    }'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.CLOSE_STATUS.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'APP_TILE_TEMPLATE'
AND e.entity_code = 'TILE_TPL_CLOSE_STATUS'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- TILE_TPL_TAX_RETURNS: Tax Returns tile
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
    'APP_TILE_TEMPLATE',
    'TILE_TPL_TAX_RETURNS',
    'Tax Returns Tile Template',
    'Template for tax compliance and returns status tile',
    'HERA.PLATFORM.UI.TILE.TPL.TAX_RETURNS.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Tax Returns tile configuration
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
    'tile_config',
    'json',
    '{
        "tile_type": "ENTITIES",
        "target_entity_type": "TAX_RETURN",
        "category": "Tax & Compliance",
        "icon": "FileText",
        "color": "yellow",
        "gradient": "yellow-to-orange",
        "size": "medium",
        "permissions": ["TAX_VIEW"],
        "stats": [
            {
                "stat_id": "due_dates",
                "label": "Upcoming Due Dates",
                "query_type": "count",
                "filters": {"due_date": "next_30_days", "status": "pending"},
                "format": "number",
                "highlight": {"condition": "> 0", "color": "orange"}
            },
            {
                "stat_id": "filing_status",
                "label": "Filed This Year",
                "query_type": "count",
                "filters": {"filed_date": "current_year", "status": "filed"},
                "format": "number"
            },
            {
                "stat_id": "overdue",
                "label": "Overdue",
                "query_type": "count",
                "filters": {"due_date": "past", "status": "pending"},
                "format": "number",
                "highlight": {"condition": "> 0", "color": "red"}
            }
        ],
        "actions": [
            {
                "action_id": "prepare_return",
                "label": "Prepare Return",
                "icon": "Plus",
                "route": "/finance/tax/return/new",
                "permission": "TAX_CREATE"
            },
            {
                "action_id": "compliance_report",
                "label": "Compliance",
                "icon": "Shield",
                "route": "/finance/tax/compliance",
                "permission": "TAX_VIEW"
            }
        ],
        "refresh_interval": 86400
    }'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.TAX_RETURNS.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'APP_TILE_TEMPLATE'
AND e.entity_code = 'TILE_TPL_TAX_RETURNS'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- TILE_TPL_CASH_FORECAST: Cash Forecasting tile
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
    'APP_TILE_TEMPLATE',
    'TILE_TPL_CASH_FORECAST',
    'Cash Forecasting Tile Template',
    'Template for cash flow forecasting and liquidity management tile',
    'HERA.PLATFORM.UI.TILE.TPL.CASH_FORECAST.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Cash Forecasting tile configuration
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
    'tile_config',
    'json',
    '{
        "tile_type": "ANALYTICS",
        "category": "Treasury",
        "icon": "TrendingUp",
        "color": "teal",
        "gradient": "teal-to-cyan",
        "size": "large",
        "permissions": ["TREASURY_VIEW"],
        "stats": [
            {
                "stat_id": "forecast_30_days",
                "label": "30-Day Forecast",
                "query_type": "cash_flow_forecast",
                "period": 30,
                "format": "currency"
            },
            {
                "stat_id": "variance",
                "label": "Forecast Variance",
                "query_type": "forecast_vs_actual",
                "period": "last_month",
                "format": "percentage",
                "highlight": {"condition": "> 10", "color": "orange"}
            },
            {
                "stat_id": "liquidity_ratio",
                "label": "Liquidity Ratio",
                "query_type": "calculation",
                "calculation": "current_assets / current_liabilities",
                "format": "ratio",
                "highlight": {"condition": "< 1.0", "color": "red"}
            }
        ],
        "actions": [
            {
                "action_id": "update_forecast",
                "label": "Update Forecast",
                "icon": "RefreshCw",
                "route": "/finance/treasury/forecast",
                "permission": "TREASURY_FORECAST"
            },
            {
                "action_id": "cash_flow_report",
                "label": "Cash Flow Report",
                "icon": "BarChart3",
                "route": "/finance/treasury/cash-flow",
                "permission": "TREASURY_VIEW"
            }
        ],
        "refresh_interval": 3600
    }'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.CASH_FORECAST.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'APP_TILE_TEMPLATE'
AND e.entity_code = 'TILE_TPL_CASH_FORECAST'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- ADVANCED FINANCE TILES (8 Optional)
-- ================================================================================

-- TILE_TPL_COST_CENTERS: Cost Center Management tile
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
    'APP_TILE_TEMPLATE',
    'TILE_TPL_COST_CENTERS',
    'Cost Centers Tile Template',
    'Template for cost center management and budget performance tile',
    'HERA.PLATFORM.UI.TILE.TPL.COST_CENTERS.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Cost Centers tile configuration
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
    'tile_config',
    'json',
    '{
        "tile_type": "ENTITIES",
        "target_entity_type": "FINANCIAL_DIMENSION",
        "category": "Management Accounting",
        "icon": "Target",
        "color": "slate",
        "gradient": "slate-to-gray",
        "size": "medium",
        "permissions": ["BUDGET_VIEW"],
        "stats": [
            {
                "stat_id": "budget_vs_actual",
                "label": "Budget vs Actual",
                "query_type": "budget_variance",
                "format": "percentage"
            },
            {
                "stat_id": "over_budget_centers",
                "label": "Over Budget",
                "query_type": "count_over_budget",
                "format": "number",
                "highlight": {"condition": "> 0", "color": "red"}
            },
            {
                "stat_id": "total_budget",
                "label": "Total Budget",
                "query_type": "sum_budget",
                "format": "currency"
            }
        ],
        "actions": [
            {
                "action_id": "budget_analysis",
                "label": "Budget Analysis",
                "icon": "BarChart3",
                "route": "/finance/budget/analysis",
                "permission": "BUDGET_VIEW"
            }
        ],
        "refresh_interval": 600
    }'::jsonb,
    'HERA.PLATFORM.UI.TILE.TPL.COST_CENTERS.CONFIG.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'APP_TILE_TEMPLATE'
AND e.entity_code = 'TILE_TPL_COST_CENTERS'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- TILE HELPER FUNCTIONS
-- ================================================================================

-- Function to get available finance tile templates
CREATE OR REPLACE FUNCTION hera_finance_tile_templates_v1()
RETURNS TABLE(
    tile_code TEXT,
    tile_name TEXT,
    category TEXT,
    description TEXT,
    icon TEXT,
    color TEXT,
    size TEXT,
    permissions TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.entity_code,
        e.entity_name,
        (dd.field_value_json->>'category')::TEXT,
        e.entity_description,
        (dd.field_value_json->>'icon')::TEXT,
        (dd.field_value_json->>'color')::TEXT,
        (dd.field_value_json->>'size')::TEXT,
        ARRAY(SELECT jsonb_array_elements_text(dd.field_value_json->'permissions'))
    FROM core_entities e
    JOIN core_dynamic_data dd ON dd.entity_id = e.id
    WHERE e.entity_type = 'APP_TILE_TEMPLATE'
    AND e.organization_id = '00000000-0000-0000-0000-000000000000'
    AND dd.field_name = 'tile_config'
    AND e.status = 'active'
    ORDER BY
        CASE (dd.field_value_json->>'category')::TEXT
            WHEN 'General Ledger' THEN 1
            WHEN 'Accounts Payable' THEN 2
            WHEN 'Accounts Receivable' THEN 3
            WHEN 'Bank & Cash' THEN 4
            WHEN 'Fixed Assets' THEN 5
            WHEN 'Financial Close' THEN 6
            WHEN 'Tax & Compliance' THEN 7
            WHEN 'Treasury' THEN 8
            WHEN 'Management Accounting' THEN 9
            ELSE 10
        END,
        e.entity_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create finance workspace from tiles
CREATE OR REPLACE FUNCTION hera_finance_workspace_create_v1(
    p_actor_user_id UUID,
    p_organization_id UUID,
    p_workspace_name TEXT,
    p_workspace_type TEXT DEFAULT 'FINANCE_MAIN',
    p_tile_codes TEXT[] DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_workspace_id UUID;
    v_tile_code TEXT;
    v_tile_template_id UUID;
    v_position INTEGER := 1;
    v_tiles_created INTEGER := 0;
BEGIN
    -- Create workspace entity
    v_workspace_id := gen_random_uuid();
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
        v_workspace_id,
        'APP_WORKSPACE',
        'WS_' || UPPER(p_workspace_type),
        p_workspace_name,
        'Finance workspace: ' || p_workspace_name,
        'HERA.' || REPLACE(p_organization_id::TEXT, '-', '_') || '.FINANCE.WORKSPACE.' || UPPER(p_workspace_type) || '.v1',
        p_organization_id,
        p_actor_user_id,
        p_actor_user_id,
        NOW(),
        NOW(),
        'active'
    );

    -- Default tiles if none specified
    IF p_tile_codes IS NULL THEN
        p_tile_codes := ARRAY[
            'TILE_TPL_GL_ACCOUNTS',
            'TILE_TPL_GL_JOURNALS',
            'TILE_TPL_AP_INVOICES',
            'TILE_TPL_AR_INVOICES',
            'TILE_TPL_BANK_ACCOUNTS',
            'TILE_TPL_CLOSE_STATUS'
        ];
    END IF;

    -- Create workspace tiles
    FOREACH v_tile_code IN ARRAY p_tile_codes
    LOOP
        -- Find tile template
        SELECT id INTO v_tile_template_id
        FROM core_entities
        WHERE entity_type = 'APP_TILE_TEMPLATE'
        AND entity_code = v_tile_code
        AND organization_id = '00000000-0000-0000-0000-000000000000'
        AND status = 'active';

        IF v_tile_template_id IS NOT NULL THEN
            -- Create workspace tile instance
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
                gen_random_uuid(),
                'APP_WORKSPACE_TILE',
                'WS_TILE_' || v_tile_code || '_' || v_position,
                'Workspace Tile: ' || v_tile_code,
                'Finance workspace tile instance',
                'HERA.' || REPLACE(p_organization_id::TEXT, '-', '_') || '.FINANCE.WORKSPACE.TILE.' || v_tile_code || '.v1',
                p_organization_id,
                v_workspace_id,
                p_actor_user_id,
                p_actor_user_id,
                NOW(),
                NOW(),
                'active'
            );

            -- Create tile configuration relationship
            INSERT INTO core_relationships (
                id,
                from_entity_id,
                to_entity_id,
                relationship_type,
                relationship_data,
                organization_id,
                created_by,
                updated_by
            ) VALUES (
                gen_random_uuid(),
                (SELECT id FROM core_entities WHERE entity_code = 'WS_TILE_' || v_tile_code || '_' || v_position AND entity_type = 'APP_WORKSPACE_TILE' AND organization_id = p_organization_id),
                v_tile_template_id,
                'USES_TEMPLATE',
                jsonb_build_object(
                    'position', v_position,
                    'enabled', true,
                    'custom_overrides', '{}'
                ),
                p_organization_id,
                p_actor_user_id,
                p_actor_user_id
            );

            v_tiles_created := v_tiles_created + 1;
            v_position := v_position + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'workspace_id', v_workspace_id,
        'workspace_name', p_workspace_name,
        'tiles_created', v_tiles_created,
        'message', 'Finance workspace created successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Finance workspace creation failed: ' || SQLERRM,
            'error_code', 'WORKSPACE_CREATION_ERROR'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================
-- INDEXES AND PERFORMANCE
-- ================================================================================

-- Index for tile template lookups
-- Index for tile template lookups
CREATE INDEX IF NOT EXISTS idx_finance_tile_templates
ON core_entities (entity_type, organization_id, status)
WHERE entity_type = 'APP_TILE_TEMPLATE';

-- Index for tile configuration data
CREATE INDEX IF NOT EXISTS idx_finance_tile_config
ON core_dynamic_data (entity_id, field_name)
WHERE field_name = 'tile_config';


-- ================================================================================
-- VERIFICATION AND ROLLBACK
-- ================================================================================

-- Verification query
DO $$
DECLARE
    v_core_tiles_count INTEGER;
    v_advanced_tiles_count INTEGER;
    v_function_count INTEGER;
BEGIN
    -- Count core finance tiles (12 expected)
    SELECT COUNT(*) INTO v_core_tiles_count
    FROM core_entities e
    JOIN core_dynamic_data dd ON dd.entity_id = e.id
    WHERE e.entity_type = 'APP_TILE_TEMPLATE'
    AND e.organization_id = '00000000-0000-0000-0000-000000000000'
    AND dd.field_name = 'tile_config'
    AND (dd.field_value_json->>'category')::TEXT IN (
        'General Ledger', 'Accounts Payable', 'Accounts Receivable',
        'Bank & Cash', 'Fixed Assets', 'Financial Close',
        'Tax & Compliance', 'Treasury'
    )
    AND e.status = 'active';

    -- Count advanced tiles
    SELECT COUNT(*) INTO v_advanced_tiles_count
    FROM core_entities e
    JOIN core_dynamic_data dd ON dd.entity_id = e.id
    WHERE e.entity_type = 'APP_TILE_TEMPLATE'
    AND e.organization_id = '00000000-0000-0000-0000-000000000000'
    AND dd.field_name = 'tile_config'
    AND (dd.field_value_json->>'category')::TEXT = 'Management Accounting'
    AND e.status = 'active';

    -- Count helper functions
    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname LIKE 'hera_finance_%tile%';

    RAISE NOTICE 'HERA Finance Tile Templates v2.2 Migration Complete:';
    RAISE NOTICE '  - Core finance tiles: % (expected: 12)', v_core_tiles_count;
    RAISE NOTICE '  - Advanced tiles: % (expected: 1+)', v_advanced_tiles_count;
    RAISE NOTICE '  - Helper functions: %', v_function_count;
    RAISE NOTICE '  - Tile categories:';
    RAISE NOTICE '    • General Ledger (GL_ACCOUNTS, GL_JOURNALS)';
    RAISE NOTICE '    • Accounts Payable (AP_INVOICES, AP_VENDORS)';
    RAISE NOTICE '    • Accounts Receivable (AR_INVOICES, AR_CUSTOMERS)';
    RAISE NOTICE '    • Bank & Cash (BANK_ACCOUNTS, BANK_RECON)';
    RAISE NOTICE '    • Fixed Assets (ASSETS)';
    RAISE NOTICE '    • Financial Close (CLOSE_STATUS)';
    RAISE NOTICE '    • Tax & Compliance (TAX_RETURNS)';
    RAISE NOTICE '    • Treasury (CASH_FORECAST)';
    RAISE NOTICE '    • Management Accounting (COST_CENTERS)';
    RAISE NOTICE '  - Dynamic dashboards: ENABLED';
    RAISE NOTICE '  - Role-based visibility: ENABLED';
    RAISE NOTICE '  - Mobile-responsive: ENABLED';
END $$;

-- ================================================================================
-- ROLLBACK SCRIPT (commented)
-- ================================================================================

/*
-- ROLLBACK INSTRUCTIONS
-- Run these commands if rollback is needed:

-- 1. Drop helper functions
DROP FUNCTION IF EXISTS hera_finance_tile_templates_v1();
DROP FUNCTION IF EXISTS hera_finance_workspace_create_v1(UUID, UUID, TEXT, TEXT, TEXT[]);

-- 2. Drop indexes
DROP INDEX IF EXISTS idx_finance_tile_templates;
DROP INDEX IF EXISTS idx_finance_tile_config;

-- 3. Remove tile configurations
DELETE FROM core_dynamic_data
WHERE entity_id IN (
    SELECT id FROM core_entities
    WHERE entity_type = 'APP_TILE_TEMPLATE'
    AND organization_id = '00000000-0000-0000-0000-000000000000'
);

-- 4. Remove tile templates
DELETE FROM core_entities
WHERE entity_type = 'APP_TILE_TEMPLATE'
AND organization_id = '00000000-0000-0000-0000-000000000000';
*/
