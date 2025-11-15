-- ================================================================================
-- HERA Finance Posting Rules Engine v2.2 - Complete Rule Bundles
-- Migration: Pre-built posting rules for all finance operations with IFRS compliance
-- Smart Code: HERA.PLATFORM.FINANCE.POSTING_RULES.v2.2
-- Author: HERA Finance Team
-- Created: 2024-11-16
-- ================================================================================

-- ================================================================================
-- ACCOUNTS PAYABLE POSTING RULES
-- ================================================================================

-- AP Invoice Standard Posting Rules Bundle
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
    'Standard posting rules for accounts payable invoices with expense and tax allocation',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AP_INVOICE_STANDARD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AP Invoice posting rule configuration
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
    'bundle_rules',
    'json',
    '{
        "transaction_type_match": "AP_INVOICE",
        "description": "Standard AP Invoice posting with expense and tax allocation",
        "currency_support": "multi",
        "rules": [
            {
                "rule_id": "AP_INVOICE_BASIC",
                "description": "Basic AP invoice posting: DR Expense, CR AP",
                "conditions": [
                    {
                        "field": "transaction.line_items",
                        "operator": "exists"
                    }
                ],
                "lines": [
                    {
                        "side": "DR",
                        "account_source": "line_item.expense_account_code",
                        "amount_source": "line_item.line_amount",
                        "description": "Expense - {{line_item.description}}",
                        "dimension_sources": {
                            "cost_center": "line_item.cost_center_code",
                            "project": "line_item.project_code"
                        }
                    },
                    {
                        "side": "DR",
                        "account_source": "line_item.tax_account_code",
                        "amount_source": "line_item.tax_amount",
                        "description": "Input VAT - {{line_item.description}}",
                        "conditions": [
                            {
                                "field": "line_item.tax_amount",
                                "operator": "greater_than",
                                "value": "0"
                            }
                        ]
                    },
                    {
                        "side": "CR",
                        "account_source": "vendor.ap_control_account_code",
                        "amount_source": "transaction.total_amount",
                        "description": "AP - {{vendor.name}}"
                    }
                ],
                "smart_code": "HERA.PLATFORM.FINANCE.DNA.RULE.AP_INVOICE_BASIC.v1"
            }
        ],
        "validation_rules": [
            {
                "rule_id": "AP_BALANCE_CHECK",
                "description": "Ensure DR = CR",
                "validation": "sum_dr_equals_sum_cr"
            },
            {
                "rule_id": "VENDOR_EXISTS",
                "description": "Vendor must exist",
                "validation": "entity_exists(vendor.id, VENDOR)"
            }
        ]
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AP_INVOICE_STANDARD.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'AP_INVOICE_STANDARD'
AND e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.organization_id = '00000000-0000-0000-0000-000000000000';

-- AP Payment Standard Posting Rules Bundle
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
    'Standard posting rules for accounts payable payments with bank integration',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AP_PAYMENT_STANDARD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AP Payment posting rule configuration
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
    'bundle_rules',
    'json',
    '{
        "transaction_type_match": "AP_PAYMENT",
        "description": "Standard AP Payment posting: DR AP, CR Bank",
        "currency_support": "multi",
        "rules": [
            {
                "rule_id": "AP_PAYMENT_BASIC",
                "description": "Basic AP payment posting",
                "lines": [
                    {
                        "side": "DR",
                        "account_source": "vendor.ap_control_account_code",
                        "amount_source": "transaction.payment_amount",
                        "description": "AP Payment - {{vendor.name}}"
                    },
                    {
                        "side": "CR",
                        "account_source": "bank_account.gl_account_code",
                        "amount_source": "transaction.payment_amount",
                        "description": "Bank Payment - {{bank_account.account_name}}"
                    }
                ],
                "smart_code": "HERA.PLATFORM.FINANCE.DNA.RULE.AP_PAYMENT_BASIC.v1"
            },
            {
                "rule_id": "AP_PAYMENT_DISCOUNT",
                "description": "AP payment with early payment discount",
                "conditions": [
                    {
                        "field": "transaction.discount_amount",
                        "operator": "greater_than",
                        "value": "0"
                    }
                ],
                "lines": [
                    {
                        "side": "DR",
                        "account_source": "vendor.ap_control_account_code",
                        "amount_source": "transaction.invoice_amount",
                        "description": "AP Payment - {{vendor.name}}"
                    },
                    {
                        "side": "CR",
                        "account_source": "bank_account.gl_account_code",
                        "amount_source": "transaction.payment_amount",
                        "description": "Bank Payment - {{bank_account.account_name}}"
                    },
                    {
                        "side": "CR",
                        "account_source": "config.discount_income_account",
                        "amount_source": "transaction.discount_amount",
                        "description": "Early Payment Discount"
                    }
                ],
                "smart_code": "HERA.PLATFORM.FINANCE.DNA.RULE.AP_PAYMENT_DISCOUNT.v1"
            }
        ]
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AP_PAYMENT_STANDARD.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'AP_PAYMENT_STANDARD'
AND e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.organization_id = '00000000-0000-0000-0000-000000000000';

-- ================================================================================
-- ACCOUNTS RECEIVABLE POSTING RULES
-- ================================================================================

-- AR Invoice Standard Posting Rules Bundle (IFRS 15 Compliant)
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
    'Standard posting rules for accounts receivable invoices with IFRS 15 revenue recognition',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AR_INVOICE_STANDARD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AR Invoice posting rule configuration
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
    'bundle_rules',
    'json',
    '{
        "transaction_type_match": "AR_INVOICE",
        "description": "Standard AR Invoice posting with IFRS 15 revenue recognition",
        "ifrs_compliance": "IFRS_15",
        "currency_support": "multi",
        "rules": [
            {
                "rule_id": "AR_INVOICE_IMMEDIATE_RECOGNITION",
                "description": "AR invoice with immediate revenue recognition",
                "conditions": [
                    {
                        "field": "performance_obligation.recognition_timing",
                        "operator": "equals",
                        "value": "point_in_time"
                    }
                ],
                "lines": [
                    {
                        "side": "DR",
                        "account_source": "customer.ar_control_account_code",
                        "amount_source": "transaction.total_amount",
                        "description": "AR - {{customer.name}}"
                    },
                    {
                        "side": "CR",
                        "account_source": "line_item.revenue_account_code",
                        "amount_source": "line_item.line_amount",
                        "description": "Revenue - {{line_item.description}}",
                        "dimension_sources": {
                            "revenue_stream": "line_item.revenue_stream_code",
                            "customer_segment": "customer.segment_code"
                        }
                    },
                    {
                        "side": "CR",
                        "account_source": "line_item.tax_payable_account_code",
                        "amount_source": "line_item.tax_amount",
                        "description": "Output VAT - {{line_item.description}}",
                        "conditions": [
                            {
                                "field": "line_item.tax_amount",
                                "operator": "greater_than",
                                "value": "0"
                            }
                        ]
                    }
                ],
                "smart_code": "HERA.PLATFORM.FINANCE.DNA.RULE.AR_INVOICE_IMMEDIATE.v1"
            },
            {
                "rule_id": "AR_INVOICE_DEFERRED_RECOGNITION",
                "description": "AR invoice with deferred revenue recognition (IFRS 15)",
                "conditions": [
                    {
                        "field": "performance_obligation.recognition_timing",
                        "operator": "equals",
                        "value": "over_time"
                    }
                ],
                "lines": [
                    {
                        "side": "DR",
                        "account_source": "customer.ar_control_account_code",
                        "amount_source": "transaction.total_amount",
                        "description": "AR - {{customer.name}}"
                    },
                    {
                        "side": "CR",
                        "account_source": "config.contract_liability_account",
                        "amount_source": "line_item.contract_liability_amount",
                        "description": "Contract Liability - {{line_item.description}}"
                    },
                    {
                        "side": "CR",
                        "account_source": "line_item.revenue_account_code",
                        "amount_source": "line_item.recognized_revenue_amount",
                        "description": "Revenue (Recognized) - {{line_item.description}}"
                    }
                ],
                "smart_code": "HERA.PLATFORM.FINANCE.DNA.RULE.AR_INVOICE_DEFERRED.v1"
            }
        ]
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AR_INVOICE_STANDARD.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'AR_INVOICE_STANDARD'
AND e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.organization_id = '00000000-0000-0000-0000-000000000000';

-- AR Receipt Standard Posting Rules Bundle
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
    'Standard posting rules for customer receipts with automatic application',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AR_RECEIPT_STANDARD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- AR Receipt posting rule configuration
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
    'bundle_rules',
    'json',
    '{
        "transaction_type_match": "AR_RECEIPT",
        "description": "Standard AR Receipt posting: DR Bank, CR AR",
        "currency_support": "multi",
        "rules": [
            {
                "rule_id": "AR_RECEIPT_BASIC",
                "description": "Basic AR receipt posting",
                "lines": [
                    {
                        "side": "DR",
                        "account_source": "bank_account.gl_account_code",
                        "amount_source": "transaction.receipt_amount",
                        "description": "Bank Receipt - {{customer.name}}"
                    },
                    {
                        "side": "CR",
                        "account_source": "customer.ar_control_account_code",
                        "amount_source": "transaction.receipt_amount",
                        "description": "AR Receipt - {{customer.name}}"
                    }
                ],
                "smart_code": "HERA.PLATFORM.FINANCE.DNA.RULE.AR_RECEIPT_BASIC.v1"
            }
        ]
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.AR_RECEIPT_STANDARD.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'AR_RECEIPT_STANDARD'
AND e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.organization_id = '00000000-0000-0000-0000-000000000000';

-- ================================================================================
-- GENERAL LEDGER POSTING RULES
-- ================================================================================

-- Journal Entry Standard Posting Rules Bundle
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
    'Standard posting rules for manual journal entries with validation',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.JOURNAL_ENTRY_STANDARD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Journal Entry posting rule configuration
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
    'bundle_rules',
    'json',
    '{
        "transaction_type_match": "JOURNAL_ENTRY",
        "description": "Standard Journal Entry posting with manual lines",
        "currency_support": "multi",
        "rules": [
            {
                "rule_id": "JOURNAL_ENTRY_MANUAL",
                "description": "Manual journal entry with user-defined lines",
                "lines": [
                    {
                        "side": "{{line_item.side}}",
                        "account_source": "line_item.account_code",
                        "amount_source": "line_item.amount",
                        "description": "{{line_item.description}}",
                        "dimension_sources": {
                            "cost_center": "line_item.cost_center_code",
                            "project": "line_item.project_code"
                        }
                    }
                ],
                "smart_code": "HERA.PLATFORM.FINANCE.DNA.RULE.JOURNAL_ENTRY_MANUAL.v1"
            }
        ],
        "validation_rules": [
            {
                "rule_id": "JE_BALANCE_CHECK",
                "description": "Manual journal entries must balance",
                "validation": "sum_dr_equals_sum_cr"
            },
            {
                "rule_id": "JE_MIN_LINES",
                "description": "Journal entry must have at least 2 lines",
                "validation": "line_count >= 2"
            }
        ]
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.JOURNAL_ENTRY_STANDARD.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'JOURNAL_ENTRY_STANDARD'
AND e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.organization_id = '00000000-0000-0000-0000-000000000000';

-- ================================================================================
-- BANK TRANSACTION POSTING RULES
-- ================================================================================

-- Bank Transfer Posting Rules Bundle
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
    'BANK_TRANSFER_STANDARD',
    'Bank Transfer Standard Posting Rules',
    'Standard posting rules for bank transfers and cash movements',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.BANK_TRANSFER_STANDARD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Bank Transfer posting rule configuration
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
    'bundle_rules',
    'json',
    '{
        "transaction_type_match": "BANK_TRANSFER",
        "description": "Standard Bank Transfer posting between accounts",
        "currency_support": "multi",
        "rules": [
            {
                "rule_id": "BANK_TRANSFER_SAME_CURRENCY",
                "description": "Bank transfer in same currency",
                "conditions": [
                    {
                        "field": "from_account.currency",
                        "operator": "equals",
                        "value": "to_account.currency"
                    }
                ],
                "lines": [
                    {
                        "side": "DR",
                        "account_source": "to_account.gl_account_code",
                        "amount_source": "transaction.transfer_amount",
                        "description": "Transfer In - {{to_account.account_name}}"
                    },
                    {
                        "side": "CR",
                        "account_source": "from_account.gl_account_code",
                        "amount_source": "transaction.transfer_amount",
                        "description": "Transfer Out - {{from_account.account_name}}"
                    }
                ],
                "smart_code": "HERA.PLATFORM.FINANCE.DNA.RULE.BANK_TRANSFER_SAME_CCY.v1"
            },
            {
                "rule_id": "BANK_TRANSFER_MULTI_CURRENCY",
                "description": "Bank transfer with FX conversion",
                "conditions": [
                    {
                        "field": "from_account.currency",
                        "operator": "not_equals",
                        "value": "to_account.currency"
                    }
                ],
                "lines": [
                    {
                        "side": "DR",
                        "account_source": "to_account.gl_account_code",
                        "amount_source": "calculate.target_amount",
                        "description": "Transfer In - {{to_account.account_name}} ({{to_account.currency}})"
                    },
                    {
                        "side": "CR",
                        "account_source": "from_account.gl_account_code",
                        "amount_source": "transaction.transfer_amount",
                        "description": "Transfer Out - {{from_account.account_name}} ({{from_account.currency}})"
                    },
                    {
                        "side": "DR",
                        "account_source": "config.fx_loss_account",
                        "amount_source": "calculate.fx_loss",
                        "description": "FX Loss on Transfer",
                        "conditions": [
                            {
                                "field": "calculate.fx_loss",
                                "operator": "greater_than",
                                "value": "0"
                            }
                        ]
                    },
                    {
                        "side": "CR",
                        "account_source": "config.fx_gain_account",
                        "amount_source": "calculate.fx_gain",
                        "description": "FX Gain on Transfer",
                        "conditions": [
                            {
                                "field": "calculate.fx_gain",
                                "operator": "greater_than",
                                "value": "0"
                            }
                        ]
                    }
                ],
                "smart_code": "HERA.PLATFORM.FINANCE.DNA.RULE.BANK_TRANSFER_FX.v1"
            }
        ]
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.BANK_TRANSFER_STANDARD.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'BANK_TRANSFER_STANDARD'
AND e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.organization_id = '00000000-0000-0000-0000-000000000000';

-- ================================================================================
-- FIXED ASSETS POSTING RULES
-- ================================================================================

-- Asset Acquisition Posting Rules Bundle
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
    'ASSET_ACQUISITION_STANDARD',
    'Asset Acquisition Standard Posting Rules',
    'Standard posting rules for fixed asset acquisitions',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.ASSET_ACQUISITION_STANDARD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Asset Acquisition posting rule configuration
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
    'bundle_rules',
    'json',
    '{
        "transaction_type_match": "ASSET_ACQUISITION",
        "description": "Standard Asset Acquisition posting",
        "rules": [
            {
                "rule_id": "ASSET_ACQUISITION_CASH",
                "description": "Asset acquisition with cash payment",
                "conditions": [
                    {
                        "field": "transaction.payment_method",
                        "operator": "equals",
                        "value": "cash"
                    }
                ],
                "lines": [
                    {
                        "side": "DR",
                        "account_source": "asset.asset_account_code",
                        "amount_source": "transaction.acquisition_cost",
                        "description": "Asset Acquisition - {{asset.asset_name}}",
                        "dimension_sources": {
                            "asset_category": "asset.category_code",
                            "location": "asset.location_code"
                        }
                    },
                    {
                        "side": "CR",
                        "account_source": "bank_account.gl_account_code",
                        "amount_source": "transaction.acquisition_cost",
                        "description": "Asset Payment - {{asset.asset_name}}"
                    }
                ],
                "smart_code": "HERA.PLATFORM.FINANCE.DNA.RULE.ASSET_ACQUISITION_CASH.v1"
            }
        ]
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.ASSET_ACQUISITION_STANDARD.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'ASSET_ACQUISITION_STANDARD'
AND e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.organization_id = '00000000-0000-0000-0000-000000000000';

-- Asset Depreciation Posting Rules Bundle
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
    'ASSET_DEPRECIATION_STANDARD',
    'Asset Depreciation Standard Posting Rules',
    'Standard posting rules for fixed asset depreciation',
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.ASSET_DEPRECIATION_STANDARD.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- Asset Depreciation posting rule configuration
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
    'bundle_rules',
    'json',
    '{
        "transaction_type_match": "ASSET_DEPRECIATION",
        "description": "Standard Asset Depreciation posting",
        "rules": [
            {
                "rule_id": "ASSET_DEPRECIATION_STANDARD",
                "description": "Standard depreciation posting",
                "lines": [
                    {
                        "side": "DR",
                        "account_source": "asset.depreciation_expense_account_code",
                        "amount_source": "transaction.depreciation_amount",
                        "description": "Depreciation Expense - {{asset.asset_name}}",
                        "dimension_sources": {
                            "cost_center": "asset.cost_center_code",
                            "asset_category": "asset.category_code"
                        }
                    },
                    {
                        "side": "CR",
                        "account_source": "asset.accumulated_depreciation_account_code",
                        "amount_source": "transaction.depreciation_amount",
                        "description": "Accumulated Depreciation - {{asset.asset_name}}"
                    }
                ],
                "smart_code": "HERA.PLATFORM.FINANCE.DNA.RULE.ASSET_DEPRECIATION_STANDARD.v1"
            }
        ]
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.ASSET_DEPRECIATION_STANDARD.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'ASSET_DEPRECIATION_STANDARD'
AND e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.organization_id = '00000000-0000-0000-0000-000000000000';

-- ================================================================================
-- IFRS 16 LEASE POSTING RULES
-- ================================================================================

-- Lease Initial Recognition Posting Rules Bundle (IFRS 16)
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
    'LEASE_INITIAL_RECOGNITION_IFRS16',
    'IFRS 16 Lease Initial Recognition Posting Rules',
    'IFRS 16 compliant posting rules for lease initial recognition',
    -- NOTE: IFRS16 moved into version segment (v16)
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.LEASE_INITIAL_RECOGNITION_IFRS.v16',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- IFRS 16 Lease Initial Recognition posting rule configuration
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
    'bundle_rules',
    'json',
    '{
        "transaction_type_match": "LEASE_INITIAL_RECOGNITION",
        "description": "IFRS 16 Lease Initial Recognition posting",
        "ifrs_compliance": "IFRS_16",
        "rules": [
            {
                "rule_id": "IFRS16_LEASE_INITIAL",
                "description": "IFRS 16 initial recognition of ROU asset and lease liability",
                "lines": [
                    {
                        "side": "DR",
                        "account_source": "lease.rou_asset_account_code",
                        "amount_source": "calculate.rou_asset_initial_value",
                        "description": "Right-of-Use Asset - {{lease.underlying_asset_description}}",
                        "dimension_sources": {
                            "cost_center": "lease.cost_center_code",
                            "asset_category": "lease.asset_category_code"
                        }
                    },
                    {
                        "side": "CR",
                        "account_source": "lease.lease_liability_account_code",
                        "amount_source": "calculate.lease_liability_present_value",
                        "description": "Lease Liability - {{lease.underlying_asset_description}}"
                    },
                    {
                        "side": "CR",
                        "account_source": "bank_account.gl_account_code",
                        "amount_source": "lease.initial_direct_costs",
                        "description": "Initial Direct Costs - {{lease.underlying_asset_description}}",
                        "conditions": [
                            {
                                "field": "lease.initial_direct_costs",
                                "operator": "greater_than",
                                "value": "0"
                            }
                        ]
                    }
                ],
                "smart_code": "HERA.PLATFORM.FINANCE.DNA.RULE.IFRS16_LEASE_INITIAL.v1"
            }
        ],
        "calculation_rules": {
            "rou_asset_initial_value": "lease_liability_present_value + initial_direct_costs + prepaid_lease_payments - lease_incentives",
            "lease_liability_present_value": "present_value(lease_payments, incremental_borrowing_rate)"
        }
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.LEASE_INITIAL_RECOGNITION_IFRS16.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'LEASE_INITIAL_RECOGNITION_IFRS16'
AND e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.organization_id = '00000000-0000-0000-0000-000000000000';

-- ================================================================================
-- REVENUE RECOGNITION POSTING RULES (IFRS 15)
-- ================================================================================

-- Revenue Recognition IFRS 15 Posting Rules Bundle
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
    'IFRS 15 Revenue Recognition Posting Rules',
    'IFRS 15 compliant posting rules for revenue recognition over time',
    -- NOTE: IFRS15 moved into version segment (v15)
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.REVENUE_RECOGNITION_IFRS.v15',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    'active'
) ON CONFLICT (entity_type, entity_code, organization_id) DO NOTHING;

-- IFRS 15 Revenue Recognition posting rule configuration
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
    'bundle_rules',
    'json',
    '{
        "transaction_type_match": "REVENUE_RECOGNITION",
        "description": "IFRS 15 Revenue Recognition posting",
        "ifrs_compliance": "IFRS_15",
        "rules": [
            {
                "rule_id": "IFRS15_REVENUE_RECOGNITION",
                "description": "IFRS 15 revenue recognition from contract liability",
                "lines": [
                    {
                        "side": "DR",
                        "account_source": "config.contract_liability_account",
                        "amount_source": "transaction.recognized_amount",
                        "description": "Revenue Recognition - {{performance_obligation.description}}"
                    },
                    {
                        "side": "CR",
                        "account_source": "performance_obligation.revenue_account_code",
                        "amount_source": "transaction.recognized_amount",
                        "description": "Revenue (Earned) - {{performance_obligation.description}}",
                        "dimension_sources": {
                            "revenue_stream": "performance_obligation.revenue_stream_code",
                            "customer_segment": "contract.customer_segment_code"
                        }
                    }
                ],
                "smart_code": "HERA.PLATFORM.FINANCE.DNA.RULE.IFRS15_REVENUE_RECOGNITION.v1"
            }
        ]
    }'::jsonb,
    'HERA.PLATFORM.FINANCE.DNA.BUNDLE.REVENUE_RECOGNITION_IFRS15.RULES.v1',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'REVENUE_RECOGNITION_IFRS15'
AND e.entity_type = 'FINANCE_DNA_BUNDLE'
AND e.organization_id = '00000000-0000-0000-0000-000000000000';

-- ================================================================================
-- PERFORMANCE OPTIMIZATIONS
-- ================================================================================

-- Ensure indexes exist for posting rule bundles
CREATE INDEX IF NOT EXISTS idx_finance_dna_bundles_lookup
ON core_entities (organization_id, entity_type, entity_code, status)
WHERE entity_type = 'FINANCE_DNA_BUNDLE';

CREATE INDEX IF NOT EXISTS idx_finance_dna_rules_lookup
ON core_dynamic_data (entity_id, field_name)
WHERE field_name = 'bundle_rules';

-- ================================================================================
-- POSTING RULES SUCCESS CONFIRMATION
-- ================================================================================

DO $validation$
DECLARE
    v_bundle_count INTEGER;
    v_expected_bundles INTEGER := 10; -- Total posting rule bundles
BEGIN
    SELECT COUNT(*) INTO v_bundle_count
    FROM core_entities
    WHERE entity_type = 'FINANCE_DNA_BUNDLE'
    AND entity_code IN (
        'AP_INVOICE_STANDARD', 'AP_PAYMENT_STANDARD',
        'AR_INVOICE_STANDARD', 'AR_RECEIPT_STANDARD',
        'JOURNAL_ENTRY_STANDARD',
        'BANK_TRANSFER_STANDARD',
        'ASSET_ACQUISITION_STANDARD', 'ASSET_DEPRECIATION_STANDARD',
        'LEASE_INITIAL_RECOGNITION_IFRS16',
        'REVENUE_RECOGNITION_IFRS15'
    )
    AND organization_id = '00000000-0000-0000-0000-000000000000';

    IF v_bundle_count < v_expected_bundles THEN
        RAISE EXCEPTION 'Finance posting rules setup incomplete. Expected % bundles, found %', v_expected_bundles, v_bundle_count;
    END IF;

    RAISE NOTICE 'HERA Finance Posting Rules v2.2 migration completed successfully';
    RAISE NOTICE '✅ Accounts Payable: AP_INVOICE_STANDARD, AP_PAYMENT_STANDARD';
    RAISE NOTICE '✅ Accounts Receivable: AR_INVOICE_STANDARD, AR_RECEIPT_STANDARD';
    RAISE NOTICE '✅ General Ledger: JOURNAL_ENTRY_STANDARD';
    RAISE NOTICE '✅ Bank & Cash: BANK_TRANSFER_STANDARD';
    RAISE NOTICE '✅ Fixed Assets: ASSET_ACQUISITION_STANDARD, ASSET_DEPRECIATION_STANDARD';
    RAISE NOTICE '✅ IFRS 16 Leases: LEASE_INITIAL_RECOGNITION_IFRS16';
    RAISE NOTICE '✅ IFRS 15 Revenue: REVENUE_RECOGNITION_IFRS15';
    RAISE NOTICE '📊 Total posting rule bundles: % (Complete finance operations)', v_bundle_count;
END;
$validation$;
