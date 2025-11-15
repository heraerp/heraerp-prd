-- ================================================================================
-- HERA Finance Posting Rules v2.2 - Complete Posting Rules Engine
-- Migration: Pre-built posting rule bundles for all finance operations
-- Smart Code: HERA.PLATFORM.FINANCE.POSTING_RULES.v2.2
-- Author: HERA Finance Team
-- Created: 2024-11-16
-- ================================================================================

-- ================================================================================
-- ACCOUNTS PAYABLE POSTING RULES
-- ================================================================================

-- AP Invoice Standard Posting Bundle
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
    'FINANCE_DNA_BUNDLE',
    'AP_INVOICE_STANDARD',
    'AP Invoice Standard Posting Rules',
    'Standard posting rules for accounts payable invoices with tax handling',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AP_INVOICE_STANDARD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AP Invoice posting rules configuration
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
    'posting_rules',
    'json',
    '{
        "transaction_type_match": "AP_INVOICE",
        "description": "Standard AP invoice posting to GL",
        "rules": [
            {
                "rule_id": "AP_INVOICE_STANDARD",
                "priority": 1,
                "lines": [
                    {
                        "line_number": 1,
                        "side": "DR",
                        "account_source": "invoice_line.expense_account_id",
                        "account_code_fallback": "5000",
                        "amount_expr": "invoice_line.net_amount",
                        "description": "Expense/Asset from AP Invoice",
                        "dimensions": {
                            "cost_center": "invoice_line.cost_center_id",
                            "project": "invoice_line.project_id",
                            "vendor": "invoice.vendor_id"
                        },
                        "ifrs_treatment": "EXPENSE"
                    },
                    {
                        "line_number": 2,
                        "side": "DR",
                        "account_source": "invoice_line.tax_code.input_tax_account_id",
                        "account_code_fallback": "1210",
                        "amount_expr": "invoice_line.tax_amount",
                        "description": "Input Tax Recoverable",
                        "dimensions": {
                            "tax_code": "invoice_line.tax_code_id"
                        },
                        "ifrs_treatment": "TAX_RECOVERABLE"
                    },
                    {
                        "line_number": 3,
                        "side": "CR",
                        "account_source": "vendor.ap_control_account_id",
                        "account_code_fallback": "2100",
                        "amount_expr": "invoice.total_amount",
                        "description": "Accounts Payable",
                        "dimensions": {
                            "vendor": "invoice.vendor_id"
                        },
                        "ifrs_treatment": "TRADE_PAYABLE"
                    }
                ]
            }
        ],
        "guardrails": {
            "balance_per_currency": true,
            "require_dimensions": ["cost_center"],
            "fiscal_period_open": true,
            "vendor_active": true
        }
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AP_INVOICE_STANDARD.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.entity_code = 'AP_INVOICE_STANDARD'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- AP Payment Posting Bundle
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
    'FINANCE_DNA_BUNDLE',
    'AP_PAYMENT_STANDARD',
    'AP Payment Standard Posting Rules',
    'Standard posting rules for vendor payments',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AP_PAYMENT_STANDARD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AP Payment posting rules configuration
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
    'posting_rules',
    'json',
    '{
        "transaction_type_match": "AP_PAYMENT",
        "description": "Standard AP payment posting to GL",
        "rules": [
            {
                "rule_id": "AP_PAYMENT_STANDARD",
                "priority": 1,
                "lines": [
                    {
                        "line_number": 1,
                        "side": "DR",
                        "account_source": "vendor.ap_control_account_id",
                        "account_code_fallback": "2100",
                        "amount_expr": "payment.amount",
                        "description": "Accounts Payable Relief",
                        "dimensions": {
                            "vendor": "payment.vendor_id"
                        },
                        "ifrs_treatment": "TRADE_PAYABLE_RELIEF"
                    },
                    {
                        "line_number": 2,
                        "side": "CR",
                        "account_source": "payment.bank_account_id",
                        "account_code_fallback": "1000",
                        "amount_expr": "payment.amount",
                        "description": "Cash/Bank Payment",
                        "dimensions": {
                            "bank_account": "payment.bank_account_id"
                        },
                        "ifrs_treatment": "CASH_OUTFLOW"
                    }
                ]
            }
        ],
        "guardrails": {
            "balance_per_currency": true,
            "fiscal_period_open": true,
            "bank_account_active": true,
            "sufficient_balance_check": false
        }
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AP_PAYMENT_STANDARD.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.entity_code = 'AP_PAYMENT_STANDARD'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- ACCOUNTS RECEIVABLE POSTING RULES
-- ================================================================================

-- AR Invoice Standard Posting Bundle
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
    'FINANCE_DNA_BUNDLE',
    'AR_INVOICE_STANDARD',
    'AR Invoice Standard Posting Rules',
    'Standard posting rules for accounts receivable invoices with revenue recognition',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AR_INVOICE_STANDARD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AR Invoice posting rules configuration
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
    'posting_rules',
    'json',
    '{
        "transaction_type_match": "AR_INVOICE",
        "description": "Standard AR invoice posting to GL with revenue recognition",
        "rules": [
            {
                "rule_id": "AR_INVOICE_STANDARD",
                "priority": 1,
                "lines": [
                    {
                        "line_number": 1,
                        "side": "DR",
                        "account_source": "customer.ar_control_account_id",
                        "account_code_fallback": "1200",
                        "amount_expr": "invoice.total_amount",
                        "description": "Accounts Receivable",
                        "dimensions": {
                            "customer": "invoice.customer_id"
                        },
                        "ifrs_treatment": "TRADE_RECEIVABLE"
                    },
                    {
                        "line_number": 2,
                        "side": "CR",
                        "account_source": "invoice_line.revenue_account_id",
                        "account_code_fallback": "4000",
                        "amount_expr": "invoice_line.net_amount",
                        "description": "Revenue Recognition",
                        "dimensions": {
                            "customer": "invoice.customer_id",
                            "product": "invoice_line.product_id",
                            "revenue_stream": "invoice_line.revenue_stream_id"
                        },
                        "ifrs_treatment": "REVENUE"
                    },
                    {
                        "line_number": 3,
                        "side": "CR",
                        "account_source": "invoice_line.tax_code.output_tax_account_id",
                        "account_code_fallback": "2110",
                        "amount_expr": "invoice_line.tax_amount",
                        "description": "Output Tax Payable",
                        "dimensions": {
                            "tax_code": "invoice_line.tax_code_id"
                        },
                        "ifrs_treatment": "TAX_PAYABLE"
                    }
                ]
            }
        ],
        "guardrails": {
            "balance_per_currency": true,
            "require_dimensions": ["customer"],
            "fiscal_period_open": true,
            "customer_active": true,
            "credit_limit_check": true
        }
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AR_INVOICE_STANDARD.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.entity_code = 'AR_INVOICE_STANDARD'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- AR Receipt Posting Bundle
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
    'FINANCE_DNA_BUNDLE',
    'AR_RECEIPT_STANDARD',
    'AR Receipt Standard Posting Rules',
    'Standard posting rules for customer receipts and payments',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AR_RECEIPT_STANDARD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AR Receipt posting rules configuration
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
    'posting_rules',
    'json',
    '{
        "transaction_type_match": "AR_RECEIPT",
        "description": "Standard AR receipt posting to GL",
        "rules": [
            {
                "rule_id": "AR_RECEIPT_STANDARD",
                "priority": 1,
                "lines": [
                    {
                        "line_number": 1,
                        "side": "DR",
                        "account_source": "receipt.bank_account_id",
                        "account_code_fallback": "1000",
                        "amount_expr": "receipt.amount",
                        "description": "Cash/Bank Receipt",
                        "dimensions": {
                            "bank_account": "receipt.bank_account_id"
                        },
                        "ifrs_treatment": "CASH_INFLOW"
                    },
                    {
                        "line_number": 2,
                        "side": "CR",
                        "account_source": "customer.ar_control_account_id",
                        "account_code_fallback": "1200",
                        "amount_expr": "receipt.amount",
                        "description": "Accounts Receivable Relief",
                        "dimensions": {
                            "customer": "receipt.customer_id"
                        },
                        "ifrs_treatment": "TRADE_RECEIVABLE_RELIEF"
                    }
                ]
            }
        ],
        "guardrails": {
            "balance_per_currency": true,
            "fiscal_period_open": true,
            "bank_account_active": true,
            "customer_active": true
        }
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AR_RECEIPT_STANDARD.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.entity_code = 'AR_RECEIPT_STANDARD'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- GENERAL LEDGER POSTING RULES
-- ================================================================================

-- Journal Entry Posting Bundle
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
    'FINANCE_DNA_BUNDLE',
    'JOURNAL_ENTRY_STANDARD',
    'Journal Entry Standard Posting Rules',
    'Standard posting rules for manual journal entries',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.JOURNAL_ENTRY_STANDARD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Journal Entry posting rules configuration
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
    'posting_rules',
    'json',
    '{
        "transaction_type_match": "JOURNAL_ENTRY",
        "description": "Manual journal entry posting (direct GL posting)",
        "rules": [
            {
                "rule_id": "JOURNAL_ENTRY_MANUAL",
                "priority": 1,
                "lines": [
                    {
                        "line_number": "dynamic",
                        "side": "journal_line.side",
                        "account_source": "journal_line.account_id",
                        "amount_expr": "journal_line.amount",
                        "description": "journal_line.description",
                        "dimensions": {
                            "cost_center": "journal_line.cost_center_id",
                            "project": "journal_line.project_id",
                            "department": "journal_line.department_id"
                        },
                        "ifrs_treatment": "MANUAL_ENTRY"
                    }
                ]
            }
        ],
        "guardrails": {
            "balance_per_currency": true,
            "require_approval": true,
            "fiscal_period_open": true,
            "valid_gl_accounts": true,
            "balance_tolerance": 0.01
        }
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.JOURNAL_ENTRY_STANDARD.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.entity_code = 'JOURNAL_ENTRY_STANDARD'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- FIXED ASSETS POSTING RULES
-- ================================================================================

-- Asset Acquisition Posting Bundle
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
    'FINANCE_DNA_BUNDLE',
    'ASSET_ACQUISITION',
    'Asset Acquisition Posting Rules',
    'Posting rules for fixed asset acquisitions',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.ASSET_ACQUISITION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Asset Acquisition posting rules
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
    'posting_rules',
    'json',
    '{
        "transaction_type_match": "ASSET_ACQUISITION",
        "description": "Fixed asset acquisition posting",
        "rules": [
            {
                "rule_id": "ASSET_ACQUISITION_STANDARD",
                "priority": 1,
                "lines": [
                    {
                        "line_number": 1,
                        "side": "DR",
                        "account_source": "asset.asset_account_id",
                        "account_code_fallback": "1500",
                        "amount_expr": "acquisition.cost",
                        "description": "Fixed Asset Acquisition",
                        "dimensions": {
                            "asset": "asset.id",
                            "asset_class": "asset.asset_class_id",
                            "location": "asset.location_id"
                        },
                        "ifrs_treatment": "PPE_ACQUISITION"
                    },
                    {
                        "line_number": 2,
                        "side": "CR",
                        "account_source": "acquisition.funding_account_id",
                        "account_code_fallback": "1000",
                        "amount_expr": "acquisition.cost",
                        "description": "Cash/Payables for Asset",
                        "ifrs_treatment": "CASH_OUTFLOW"
                    }
                ]
            }
        ],
        "guardrails": {
            "balance_per_currency": true,
            "fiscal_period_open": true,
            "asset_capitalization_threshold": true
        }
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.ASSET_ACQUISITION.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.entity_code = 'ASSET_ACQUISITION'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- Asset Depreciation Posting Bundle
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
    'FINANCE_DNA_BUNDLE',
    'ASSET_DEPRECIATION',
    'Asset Depreciation Posting Rules',
    'Monthly depreciation posting rules for fixed assets',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.ASSET_DEPRECIATION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Asset Depreciation posting rules
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
    'posting_rules',
    'json',
    '{
        "transaction_type_match": "ASSET_DEPRECIATION",
        "description": "Monthly fixed asset depreciation posting",
        "rules": [
            {
                "rule_id": "ASSET_DEPRECIATION_STANDARD",
                "priority": 1,
                "lines": [
                    {
                        "line_number": 1,
                        "side": "DR",
                        "account_source": "asset.depreciation_expense_account_id",
                        "account_code_fallback": "6200",
                        "amount_expr": "depreciation.monthly_amount",
                        "description": "Depreciation Expense",
                        "dimensions": {
                            "asset": "asset.id",
                            "asset_class": "asset.asset_class_id",
                            "cost_center": "asset.cost_center_id"
                        },
                        "ifrs_treatment": "DEPRECIATION_EXPENSE"
                    },
                    {
                        "line_number": 2,
                        "side": "CR",
                        "account_source": "asset.accumulated_depreciation_account_id",
                        "account_code_fallback": "1510",
                        "amount_expr": "depreciation.monthly_amount",
                        "description": "Accumulated Depreciation",
                        "dimensions": {
                            "asset": "asset.id",
                            "asset_class": "asset.asset_class_id"
                        },
                        "ifrs_treatment": "ACCUMULATED_DEPRECIATION"
                    }
                ]
            }
        ],
        "guardrails": {
            "balance_per_currency": true,
            "fiscal_period_open": true,
            "asset_in_service": true,
            "depreciation_schedule_valid": true
        }
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.ASSET_DEPRECIATION.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.entity_code = 'ASSET_DEPRECIATION'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- LEASE ACCOUNTING (IFRS 16) POSTING RULES
-- ================================================================================

-- Lease Initial Recognition Posting Bundle
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
    'FINANCE_DNA_BUNDLE',
    'LEASE_INITIAL_RECOGNITION',
    'Lease Initial Recognition IFRS 16',
    'IFRS 16 lease initial recognition posting rules',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.LEASE_INITIAL_RECOGNITION.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Lease Initial Recognition posting rules
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
    'posting_rules',
    'json',
    '{
        "transaction_type_match": "LEASE_INITIAL_RECOGNITION",
        "description": "IFRS 16 lease initial recognition",
        "rules": [
            {
                "rule_id": "LEASE_IFRS16_INITIAL",
                "priority": 1,
                "lines": [
                    {
                        "line_number": 1,
                        "side": "DR",
                        "account_source": "lease.rou_asset_account_id",
                        "account_code_fallback": "1600",
                        "amount_expr": "lease.initial_rou_asset_value",
                        "description": "Right of Use Asset",
                        "dimensions": {
                            "lease": "lease.id",
                            "asset_class": "lease.asset_class"
                        },
                        "ifrs_treatment": "ROU_ASSET"
                    },
                    {
                        "line_number": 2,
                        "side": "CR",
                        "account_source": "lease.lease_liability_account_id",
                        "account_code_fallback": "2300",
                        "amount_expr": "lease.initial_lease_liability",
                        "description": "Lease Liability",
                        "dimensions": {
                            "lease": "lease.id"
                        },
                        "ifrs_treatment": "LEASE_LIABILITY"
                    }
                ]
            }
        ],
        "guardrails": {
            "balance_per_currency": true,
            "fiscal_period_open": true,
            "ifrs16_compliance": true,
            "lease_term_valid": true
        }
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.LEASE_INITIAL_RECOGNITION.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.entity_code = 'LEASE_INITIAL_RECOGNITION'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- REVENUE RECOGNITION (IFRS 15) POSTING RULES
-- ================================================================================

-- Revenue Recognition Posting Bundle
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
    'FINANCE_DNA_BUNDLE',
    'REVENUE_RECOGNITION_IFRS15',
    'Revenue Recognition IFRS 15',
    'IFRS 15 revenue recognition posting rules',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.REVENUE_RECOGNITION_IFRS15.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Revenue Recognition posting rules
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
    'posting_rules',
    'json',
    '{
        "transaction_type_match": "REVENUE_RECOGNITION",
        "description": "IFRS 15 revenue recognition posting",
        "rules": [
            {
                "rule_id": "REVENUE_IFRS15_RECOGNITION",
                "priority": 1,
                "lines": [
                    {
                        "line_number": 1,
                        "side": "DR",
                        "account_source": "contract.contract_asset_account_id",
                        "account_code_fallback": "1250",
                        "amount_expr": "recognition.amount",
                        "description": "Contract Asset/Unbilled Revenue",
                        "dimensions": {
                            "contract": "contract.id",
                            "performance_obligation": "po.id"
                        },
                        "ifrs_treatment": "CONTRACT_ASSET"
                    },
                    {
                        "line_number": 2,
                        "side": "CR",
                        "account_source": "po.revenue_account_id",
                        "account_code_fallback": "4000",
                        "amount_expr": "recognition.amount",
                        "description": "Revenue Recognition",
                        "dimensions": {
                            "contract": "contract.id",
                            "performance_obligation": "po.id",
                            "customer": "contract.customer_id"
                        },
                        "ifrs_treatment": "REVENUE"
                    }
                ]
            }
        ],
        "guardrails": {
            "balance_per_currency": true,
            "fiscal_period_open": true,
            "ifrs15_compliance": true,
            "performance_obligation_valid": true,
            "revenue_schedule_valid": true
        }
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.REVENUE_RECOGNITION_IFRS15.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.entity_code = 'REVENUE_RECOGNITION_IFRS15'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- BANK & CASH POSTING RULES
-- ================================================================================

-- Bank Transfer Posting Bundle
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
    'FINANCE_DNA_BUNDLE',
    'BANK_TRANSFER',
    'Bank Transfer Posting Rules',
    'Posting rules for bank-to-bank transfers',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.BANK_TRANSFER.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Bank Transfer posting rules
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
    'posting_rules',
    'json',
    '{
        "transaction_type_match": "BANK_TRANSFER",
        "description": "Bank-to-bank transfer posting",
        "rules": [
            {
                "rule_id": "BANK_TRANSFER_STANDARD",
                "priority": 1,
                "lines": [
                    {
                        "line_number": 1,
                        "side": "DR",
                        "account_source": "transfer.to_bank_account_id",
                        "amount_expr": "transfer.amount",
                        "description": "Bank Transfer In",
                        "dimensions": {
                            "bank_account": "transfer.to_bank_account_id"
                        },
                        "ifrs_treatment": "CASH_TRANSFER_IN"
                    },
                    {
                        "line_number": 2,
                        "side": "CR",
                        "account_source": "transfer.from_bank_account_id", 
                        "amount_expr": "transfer.amount",
                        "description": "Bank Transfer Out",
                        "dimensions": {
                            "bank_account": "transfer.from_bank_account_id"
                        },
                        "ifrs_treatment": "CASH_TRANSFER_OUT"
                    }
                ]
            }
        ],
        "guardrails": {
            "balance_per_currency": true,
            "fiscal_period_open": true,
            "bank_accounts_active": true,
            "sufficient_balance": true
        }
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.BANK_TRANSFER.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.entity_code = 'BANK_TRANSFER'
AND e.organization_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- ================================================================================
-- HELPER FUNCTIONS FOR POSTING RULES
-- ================================================================================

-- Function to list all available posting rule bundles
CREATE OR REPLACE FUNCTION hera_finance_posting_bundles_v1()
RETURNS TABLE(
    bundle_code TEXT,
    bundle_name TEXT,
    transaction_type TEXT,
    description TEXT,
    ifrs_compliant BOOLEAN,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.entity_code,
        e.entity_name,
        (dd.field_value_json->>'transaction_type_match')::TEXT,
        e.entity_description,
        CASE 
            WHEN e.entity_code LIKE '%IFRS%' OR dd.field_value_json->'guardrails' ? 'ifrs15_compliance' 
                OR dd.field_value_json->'guardrails' ? 'ifrs16_compliance'
            THEN true 
            ELSE false 
        END as ifrs_compliant,
        e.status
    FROM core_entities e
    JOIN core_dynamic_data dd ON dd.entity_id = e.id
    WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
    AND e.organization_id = '00000000-0000-0000-0000-000000000000'
    AND dd.field_name = 'posting_rules'
    AND e.status = 'active'
    ORDER BY e.entity_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate posting rule bundle
CREATE OR REPLACE FUNCTION hera_finance_validate_posting_bundle_v1(
    p_bundle_code TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_bundle JSONB;
    v_validation_result JSONB;
    v_rule JSONB;
    v_line JSONB;
    v_total_lines INTEGER := 0;
    v_warnings TEXT[] := ARRAY[]::TEXT[];
    v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get posting bundle
    SELECT dd.field_value_json INTO v_bundle
    FROM core_entities e
    JOIN core_dynamic_data dd ON dd.entity_id = e.id
    WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
    AND e.entity_code = p_bundle_code
    AND e.organization_id = '00000000-0000-0000-0000-000000000000'
    AND dd.field_name = 'posting_rules'
    AND e.status = 'active';

    -- Check if bundle exists
    IF v_bundle IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Posting bundle not found: ' || p_bundle_code,
            'error_code', 'BUNDLE_NOT_FOUND'
        );
    END IF;

    -- Validate bundle structure
    FOR v_rule IN SELECT value FROM jsonb_array_elements(v_bundle->'rules')
    LOOP
        -- Validate each line in the rule
        FOR v_line IN SELECT value FROM jsonb_array_elements(v_rule->'lines')
        LOOP
            v_total_lines := v_total_lines + 1;
            
            -- Check required fields
            IF v_line->>'side' IS NULL THEN
                v_errors := array_append(v_errors, 'Line missing side (DR/CR)');
            END IF;
            
            IF v_line->>'amount_expr' IS NULL AND v_line->>'amount' IS NULL THEN
                v_errors := array_append(v_errors, 'Line missing amount expression');
            END IF;
            
            -- Check IFRS treatment
            IF v_line->>'ifrs_treatment' IS NULL THEN
                v_warnings := array_append(v_warnings, 'Line missing IFRS treatment classification');
            END IF;
        END LOOP;
    END LOOP;

    -- Build validation result
    v_validation_result := jsonb_build_object(
        'success', CASE WHEN array_length(v_errors, 1) IS NULL THEN true ELSE false END,
        'bundle_code', p_bundle_code,
        'total_lines', v_total_lines,
        'total_rules', jsonb_array_length(v_bundle->'rules'),
        'guardrails_count', CASE WHEN v_bundle->'guardrails' IS NOT NULL 
                                THEN jsonb_typeof(v_bundle->'guardrails') = 'object' 
                                ELSE false END,
        'warnings', array_to_json(v_warnings),
        'errors', array_to_json(v_errors),
        'bundle_structure', v_bundle
    );

    RETURN v_validation_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Posting bundle validation failed: ' || SQLERRM,
            'error_code', 'VALIDATION_ERROR'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================================

-- Index for posting bundle lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_dna_bundle_lookup
ON core_entities (entity_type, entity_code, organization_id, status)
WHERE entity_type = 'FINANCE_DNA_BUNDLE';

-- Index for posting rule dynamic data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_finance_posting_rules_data
ON core_dynamic_data (entity_id, field_name)
WHERE field_name = 'posting_rules';

-- ================================================================================
-- VERIFICATION AND ROLLBACK
-- ================================================================================

-- Verification query
DO $$
DECLARE
    v_bundle_count INTEGER;
    v_rule_count INTEGER;
    v_function_count INTEGER;
BEGIN
    -- Count posting bundles created
    SELECT COUNT(*) INTO v_bundle_count
    FROM core_entities
    WHERE entity_type = 'FINANCE_DNA_BUNDLE'
    AND organization_id = '00000000-0000-0000-0000-000000000000'
    AND status = 'active';
    
    -- Count posting rule configurations
    SELECT COUNT(*) INTO v_rule_count
    FROM core_dynamic_data dd
    JOIN core_entities e ON e.id = dd.entity_id
    WHERE e.entity_type = 'FINANCE_DNA_BUNDLE'
    AND dd.field_name = 'posting_rules'
    AND e.organization_id = '00000000-0000-0000-0000-000000000000';
    
    -- Count helper functions
    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname LIKE 'hera_finance_%posting%';
    
    RAISE NOTICE 'HERA Finance Posting Rules v2.2 Migration Complete:';
    RAISE NOTICE '  - Finance DNA bundles created: %', v_bundle_count;
    RAISE NOTICE '  - Posting rule configurations: %', v_rule_count;
    RAISE NOTICE '  - Helper functions created: %', v_function_count;
    RAISE NOTICE '  - Supported transaction types:';
    RAISE NOTICE '    • AP_INVOICE, AP_PAYMENT';
    RAISE NOTICE '    • AR_INVOICE, AR_RECEIPT'; 
    RAISE NOTICE '    • JOURNAL_ENTRY';
    RAISE NOTICE '    • ASSET_ACQUISITION, ASSET_DEPRECIATION';
    RAISE NOTICE '    • LEASE_INITIAL_RECOGNITION';
    RAISE NOTICE '    • REVENUE_RECOGNITION';
    RAISE NOTICE '    • BANK_TRANSFER';
    RAISE NOTICE '  - IFRS compliance: ENABLED';
    RAISE NOTICE '  - Multi-currency support: ENABLED';
    RAISE NOTICE '  - Ready for finance operations';
END $$;

-- ================================================================================
-- ROLLBACK SCRIPT (commented)
-- ================================================================================

/*
-- ROLLBACK INSTRUCTIONS
-- Run these commands if rollback is needed:

-- 1. Drop helper functions
DROP FUNCTION IF EXISTS hera_finance_posting_bundles_v1();
DROP FUNCTION IF EXISTS hera_finance_validate_posting_bundle_v1(TEXT);

-- 2. Drop indexes
DROP INDEX IF EXISTS idx_finance_dna_bundle_lookup;
DROP INDEX IF EXISTS idx_finance_posting_rules_data;

-- 3. Remove posting rule configurations
DELETE FROM core_dynamic_data 
WHERE entity_id IN (
    SELECT id FROM core_entities 
    WHERE entity_type = 'FINANCE_DNA_BUNDLE'
    AND organization_id = '00000000-0000-0000-0000-000000000000'
);

-- 4. Remove posting bundles
DELETE FROM core_entities 
WHERE entity_type = 'FINANCE_DNA_BUNDLE'
AND organization_id = '00000000-0000-0000-0000-000000000000';
*/