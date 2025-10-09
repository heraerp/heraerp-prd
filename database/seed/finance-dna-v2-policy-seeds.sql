-- ============================================================================
-- Finance DNA v2 Policy-as-Data Seeds
-- ============================================================================
-- Idempotent seed script for v2 posting rules, COA derivation maps,
-- and fiscal policy configuration stored in core_dynamic_data
--
-- Smart Code: HERA.ACCOUNTING.SEED.POLICY.DATA.v2
-- Version: 2.0
-- Dependencies: Sacred Six tables must exist

-- ============================================================================
-- Enhanced Posting Rules v2
-- ============================================================================

-- Create v2 posting rules in core_dynamic_data
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value,
    field_type,
    smart_code,
    metadata
) VALUES
-- GL Auto-Posting Rules
(
    '00000000-0000-0000-0000-000000000000'::uuid, -- System org
    (SELECT id FROM core_entities WHERE entity_type = 'SYSTEM' AND entity_name = 'FINANCE_DNA_V2' LIMIT 1),
    'posting_rule_gl_auto_journal',
    '{
        "smart_code": "HERA.ACCOUNTING.GL.TXN.AUTO_JOURNAL.v2",
        "rule_version": "v2",
        "conditions": {
            "ai_confidence_min": 0.8,
            "fiscal_period_status": "open",
            "amount_threshold": 10000,
            "multi_currency_support": true
        },
        "posting_recipe": {
            "validation_rules": [
                "fiscal_period_open",
                "account_mapping_exists", 
                "multi_currency_balanced"
            ],
            "debit_account_derivation": "request.debit_account_code",
            "credit_account_derivation": "request.credit_account_code",
            "auto_allocation": false
        },
        "approval_workflow": {
            "auto_approve_if": "ai_confidence >= 0.9 AND amount <= 1000",
            "require_manager_if": "ai_confidence >= 0.7 AND amount <= 10000",
            "require_owner_if": "amount > 10000 OR ai_confidence < 0.7",
            "auto_reject_if": "ai_confidence < 0.3"
        },
        "ai_enhancement": {
            "enable_learning": true,
            "confidence_boost_factors": {
                "recurring_transaction": 0.1,
                "validated_pattern": 0.15,
                "user_approved": 0.05
            },
            "anomaly_detection": true
        }
    }'::text,
    'json',
    'HERA.ACCOUNTING.SEED.POLICY.POSTING_RULE.v2',
    '{"policy_type": "posting_rule", "module": "GL", "version": "v2"}'::jsonb
)
ON CONFLICT (organization_id, entity_id, field_name) 
DO UPDATE SET 
    field_value = EXCLUDED.field_value,
    smart_code = EXCLUDED.smart_code,
    metadata = EXCLUDED.metadata,
    updated_at = CURRENT_TIMESTAMP;

-- AR Invoice Posting Rule
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value,
    field_type,
    smart_code,
    metadata
) VALUES
(
    '00000000-0000-0000-0000-000000000000'::uuid,
    (SELECT id FROM core_entities WHERE entity_type = 'SYSTEM' AND entity_name = 'FINANCE_DNA_V2' LIMIT 1),
    'posting_rule_ar_invoice',
    '{
        "smart_code": "HERA.ACCOUNTING.AR.TXN.INVOICE.v2",
        "rule_version": "v2",
        "conditions": {
            "ai_confidence_min": 0.8,
            "fiscal_period_status": "open",
            "customer_credit_check": true,
            "revenue_recognition_required": true
        },
        "posting_recipe": {
            "debit_account_derivation": "customer.ar_control_account",
            "credit_accounts": [
                {
                    "derivation": "product.revenue_account",
                    "amount_field": "line_amount_net"
                },
                {
                    "derivation": "tax.output_tax_account", 
                    "amount_field": "tax_amount"
                }
            ],
            "allocation_rules": [
                {
                    "type": "revenue_recognition",
                    "schedule": "immediate",
                    "conditions": "service_type = ''immediate''"
                }
            ]
        },
        "approval_workflow": {
            "auto_approve_if": "ai_confidence >= 0.8 AND customer.credit_status = ''approved''",
            "require_manager_if": "amount > customer.credit_limit",
            "require_owner_if": "customer.credit_status = ''blocked''",
            "auto_reject_if": "customer.status = ''inactive''"
        }
    }'::text,
    'json',
    'HERA.ACCOUNTING.SEED.POLICY.POSTING_RULE.v2',
    '{"policy_type": "posting_rule", "module": "AR", "version": "v2"}'::jsonb
)
ON CONFLICT (organization_id, entity_id, field_name) 
DO UPDATE SET 
    field_value = EXCLUDED.field_value,
    updated_at = CURRENT_TIMESTAMP;

-- AP Bill Posting Rule
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value,
    field_type,
    smart_code,
    metadata
) VALUES
(
    '00000000-0000-0000-0000-000000000000'::uuid,
    (SELECT id FROM core_entities WHERE entity_type = 'SYSTEM' AND entity_name = 'FINANCE_DNA_V2' LIMIT 1),
    'posting_rule_ap_bill',
    '{
        "smart_code": "HERA.ACCOUNTING.AP.TXN.BILL.v2",
        "rule_version": "v2",
        "conditions": {
            "ai_confidence_min": 0.7,
            "fiscal_period_status": "open",
            "vendor_verification_required": true,
            "three_way_matching": false
        },
        "posting_recipe": {
            "debit_accounts": [
                {
                    "derivation": "expense.category.account",
                    "amount_field": "line_amount_net"
                },
                {
                    "derivation": "tax.input_tax_account",
                    "amount_field": "tax_amount"
                }
            ],
            "credit_account_derivation": "vendor.ap_control_account",
            "allocation_rules": [
                {
                    "type": "cost_center",
                    "dimension": "department",
                    "method": "proportional"
                }
            ]
        },
        "approval_workflow": {
            "auto_approve_if": "ai_confidence >= 0.8 AND amount <= vendor.approval_limit",
            "require_manager_if": "amount > 5000",
            "require_owner_if": "amount > vendor.credit_limit"
        }
    }'::text,
    'json',
    'HERA.ACCOUNTING.SEED.POLICY.POSTING_RULE.v2',
    '{"policy_type": "posting_rule", "module": "AP", "version": "v2"}'::jsonb
)
ON CONFLICT (organization_id, entity_id, field_name) 
DO UPDATE SET 
    field_value = EXCLUDED.field_value,
    updated_at = CURRENT_TIMESTAMP;

-- Payroll Posting Rule
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value,
    field_type,
    smart_code,
    metadata
) VALUES
(
    '00000000-0000-0000-0000-000000000000'::uuid,
    (SELECT id FROM core_entities WHERE entity_type = 'SYSTEM' AND entity_name = 'FINANCE_DNA_V2' LIMIT 1),
    'posting_rule_hr_payroll',
    '{
        "smart_code": "HERA.ACCOUNTING.HR.TXN.PAYROLL.v2",
        "rule_version": "v2",
        "conditions": {
            "ai_confidence_min": 0.9,
            "fiscal_period_status": "open",
            "payroll_approval_required": true,
            "regulatory_compliance_check": true
        },
        "posting_recipe": {
            "debit_accounts": [
                {
                    "derivation": "employee.cost_center.expense_account",
                    "amount_field": "gross_pay"
                }
            ],
            "credit_accounts": [
                {
                    "derivation": "payroll.net_pay_account",
                    "amount_field": "net_pay"
                },
                {
                    "derivation": "tax.withholding_account",
                    "amount_field": "tax_withheld"
                },
                {
                    "derivation": "benefits.deduction_account",
                    "amount_field": "benefits_deducted"
                }
            ],
            "allocation_rules": [
                {
                    "type": "cost_center",
                    "dimension": "department",
                    "method": "employee_assignment"
                }
            ]
        },
        "approval_workflow": {
            "auto_approve_if": "payroll.status = ''approved'' AND ai_confidence >= 0.95",
            "require_manager_if": "payroll.status = ''pending''",
            "require_owner_if": "payroll.variance > 0.1",
            "auto_reject_if": "payroll.status = ''rejected''"
        }
    }'::text,
    'json',
    'HERA.ACCOUNTING.SEED.POLICY.POSTING_RULE.v2',
    '{"policy_type": "posting_rule", "module": "HR", "version": "v2"}'::jsonb
)
ON CONFLICT (organization_id, entity_id, field_name) 
DO UPDATE SET 
    field_value = EXCLUDED.field_value,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- COA Derivation Maps v2
-- ============================================================================

-- Payment Method Account Mapping
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value,
    field_type,
    smart_code,
    metadata
) VALUES
(
    '00000000-0000-0000-0000-000000000000'::uuid,
    (SELECT id FROM core_entities WHERE entity_type = 'SYSTEM' AND entity_name = 'FINANCE_DNA_V2' LIMIT 1),
    'coa_derivation_payment_methods',
    '{
        "cash": {
            "account_code": "1100000",
            "account_name": "Cash in Hand",
            "currency_accounts": {
                "USD": "1100001",
                "EUR": "1100002", 
                "GBP": "1100003",
                "AED": "1100004"
            }
        },
        "card": {
            "account_code": "1110000",
            "account_name": "Card Payment Clearing",
            "processor_accounts": {
                "stripe": "1110001",
                "square": "1110002",
                "paypal": "1110003"
            }
        },
        "bank_transfer": {
            "account_code": "1120000",
            "account_name": "Bank Transfer Clearing",
            "bank_accounts": {
                "primary_checking": "1120001",
                "secondary_checking": "1120002",
                "savings": "1120003"
            }
        },
        "digital_wallet": {
            "account_code": "1130000",
            "account_name": "Digital Wallet",
            "wallet_accounts": {
                "apple_pay": "1130001",
                "google_pay": "1130002",
                "samsung_pay": "1130003"
            }
        }
    }'::text,
    'json',
    'HERA.ACCOUNTING.SEED.COA.DERIVATION.v2',
    '{"derivation_type": "payment_method", "version": "v2"}'::jsonb
)
ON CONFLICT (organization_id, entity_id, field_name) 
DO UPDATE SET 
    field_value = EXCLUDED.field_value,
    updated_at = CURRENT_TIMESTAMP;

-- Revenue Type Account Mapping
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value,
    field_type,
    smart_code,
    metadata
) VALUES
(
    '00000000-0000-0000-0000-000000000000'::uuid,
    (SELECT id FROM core_entities WHERE entity_type = 'SYSTEM' AND entity_name = 'FINANCE_DNA_V2' LIMIT 1),
    'coa_derivation_revenue_types',
    '{
        "service_revenue": {
            "base_account": "4100000",
            "account_name": "Service Revenue",
            "industry_accounts": {
                "salon": "4110000",
                "restaurant": "4120000",
                "healthcare": "4130000",
                "retail": "4140000"
            }
        },
        "product_sales": {
            "base_account": "4200000",
            "account_name": "Product Sales",
            "industry_accounts": {
                "salon": "4210000",
                "restaurant": "4220000",
                "healthcare": "4230000", 
                "retail": "4240000"
            }
        },
        "subscription_revenue": {
            "base_account": "4300000",
            "account_name": "Subscription Revenue",
            "recognition_method": "deferred"
        },
        "commission_revenue": {
            "base_account": "4400000",
            "account_name": "Commission Revenue"
        },
        "other_revenue": {
            "base_account": "4900000",
            "account_name": "Other Revenue"
        }
    }'::text,
    'json',
    'HERA.ACCOUNTING.SEED.COA.DERIVATION.v2',
    '{"derivation_type": "revenue_type", "version": "v2"}'::jsonb
)
ON CONFLICT (organization_id, entity_id, field_name) 
DO UPDATE SET 
    field_value = EXCLUDED.field_value,
    updated_at = CURRENT_TIMESTAMP;

-- Expense Type Account Mapping
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value,
    field_type,
    smart_code,
    metadata
) VALUES
(
    '00000000-0000-0000-0000-000000000000'::uuid,
    (SELECT id FROM core_entities WHERE entity_type = 'SYSTEM' AND entity_name = 'FINANCE_DNA_V2' LIMIT 1),
    'coa_derivation_expense_types',
    '{
        "payroll_expense": {
            "base_account": "6100000",
            "account_name": "Payroll Expense",
            "sub_accounts": {
                "salaries": "6110000",
                "commissions": "6120000",
                "benefits": "6130000",
                "payroll_taxes": "6140000"
            }
        },
        "rent_expense": {
            "base_account": "6200000",
            "account_name": "Rent Expense",
            "sub_accounts": {
                "office_rent": "6210000",
                "equipment_rent": "6220000",
                "vehicle_rent": "6230000"
            }
        },
        "utilities_expense": {
            "base_account": "6300000",
            "account_name": "Utilities",
            "sub_accounts": {
                "electricity": "6310000",
                "water": "6320000",
                "internet": "6330000",
                "phone": "6340000"
            }
        },
        "supplies_expense": {
            "base_account": "6400000",
            "account_name": "Supplies",
            "industry_accounts": {
                "salon": "6410000",
                "restaurant": "6420000",
                "healthcare": "6430000",
                "office": "6440000"
            }
        },
        "marketing_expense": {
            "base_account": "6500000",
            "account_name": "Marketing & Advertising",
            "sub_accounts": {
                "digital_marketing": "6510000",
                "print_advertising": "6520000",
                "events": "6530000"
            }
        }
    }'::text,
    'json',
    'HERA.ACCOUNTING.SEED.COA.DERIVATION.v2',
    '{"derivation_type": "expense_type", "version": "v2"}'::jsonb
)
ON CONFLICT (organization_id, entity_id, field_name) 
DO UPDATE SET 
    field_value = EXCLUDED.field_value,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- Fiscal Policy Configuration v2
-- ============================================================================

-- Fiscal Year Configuration
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value,
    field_type,
    smart_code,
    metadata
) VALUES
(
    '00000000-0000-0000-0000-000000000000'::uuid,
    (SELECT id FROM core_entities WHERE entity_type = 'SYSTEM' AND entity_name = 'FINANCE_DNA_V2' LIMIT 1),
    'fiscal_policy_year_configuration',
    '{
        "fiscal_year_start": "01-01",
        "fiscal_year_end": "12-31",
        "period_type": "monthly",
        "periods_per_year": 12,
        "auto_close_periods": true,
        "auto_close_delay_days": 5,
        "year_end_close_required": true,
        "consolidation_required": false,
        "supported_calendars": [
            "gregorian",
            "fiscal_quarters",
            "custom_periods"
        ],
        "period_naming_convention": "YYYY-MM",
        "closing_procedures": {
            "depreciation_required": true,
            "accruals_required": true,
            "deferrals_required": true,
            "inventory_adjustment": true,
            "retained_earnings_transfer": true
        }
    }'::text,
    'json',
    'HERA.ACCOUNTING.SEED.FISCAL.POLICY.v2',
    '{"policy_type": "fiscal_configuration", "version": "v2"}'::jsonb
)
ON CONFLICT (organization_id, entity_id, field_name) 
DO UPDATE SET 
    field_value = EXCLUDED.field_value,
    updated_at = CURRENT_TIMESTAMP;

-- Period Close Rules
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value,
    field_type,
    smart_code,
    metadata
) VALUES
(
    '00000000-0000-0000-0000-000000000000'::uuid,
    (SELECT id FROM core_entities WHERE entity_type = 'SYSTEM' AND entity_name = 'FINANCE_DNA_V2' LIMIT 1),
    'fiscal_policy_period_close',
    '{
        "close_validation_rules": [
            "all_transactions_posted",
            "bank_reconciliation_complete",
            "gl_balanced_per_currency",
            "no_pending_approvals",
            "depreciation_calculated",
            "accruals_posted"
        ],
        "auto_close_conditions": {
            "min_days_after_period_end": 5,
            "max_days_after_period_end": 15,
            "require_manager_approval": true,
            "require_owner_approval_for_yearend": true
        },
        "reopen_rules": {
            "allowed_roles": ["finance_manager", "owner"],
            "max_reopen_days": 30,
            "audit_trail_required": true,
            "notification_required": true
        },
        "locked_period_exceptions": {
            "audit_adjustments": true,
            "tax_adjustments": true,
            "prior_period_corrections": true
        }
    }'::text,
    'json',
    'HERA.ACCOUNTING.SEED.FISCAL.POLICY.v2',
    '{"policy_type": "period_close_rules", "version": "v2"}'::jsonb
)
ON CONFLICT (organization_id, entity_id, field_name) 
DO UPDATE SET 
    field_value = EXCLUDED.field_value,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- AI Configuration v2
-- ============================================================================

-- AI Confidence Configuration
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value,
    field_type,
    smart_code,
    metadata
) VALUES
(
    '00000000-0000-0000-0000-000000000000'::uuid,
    (SELECT id FROM core_entities WHERE entity_type = 'SYSTEM' AND entity_name = 'FINANCE_DNA_V2' LIMIT 1),
    'ai_confidence_configuration',
    '{
        "thresholds": {
            "auto_approve": 0.8,
            "require_approval": 0.7,
            "reject": 0.3,
            "learning_threshold": 0.6
        },
        "confidence_factors": {
            "recurring_transaction": 0.1,
            "validated_pattern": 0.15,
            "user_approved_previously": 0.05,
            "industry_standard": 0.08,
            "amount_within_normal_range": 0.05
        },
        "learning_settings": {
            "enable_cross_org_learning": false,
            "enable_industry_patterns": true,
            "enable_user_feedback_learning": true,
            "model_update_frequency": "weekly",
            "confidence_decay_rate": 0.01
        },
        "anomaly_detection": {
            "enabled": true,
            "sensitivity": "medium",
            "alert_threshold": 0.9,
            "notification_channels": ["email", "system"]
        }
    }'::text,
    'json',
    'HERA.ACCOUNTING.SEED.AI.CONFIG.v2',
    '{"policy_type": "ai_configuration", "version": "v2"}'::jsonb
)
ON CONFLICT (organization_id, entity_id, field_name) 
DO UPDATE SET 
    field_value = EXCLUDED.field_value,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- Multi-Currency Configuration v2
-- ============================================================================

-- Currency Configuration
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value,
    field_type,
    smart_code,
    metadata
) VALUES
(
    '00000000-0000-0000-0000-000000000000'::uuid,
    (SELECT id FROM core_entities WHERE entity_type = 'SYSTEM' AND entity_name = 'FINANCE_DNA_V2' LIMIT 1),
    'multi_currency_configuration',
    '{
        "base_currency": "USD",
        "supported_currencies": [
            "USD", "EUR", "GBP", "AED", "SAR", "JPY", "CAD", "AUD"
        ],
        "fx_rate_sources": [
            {
                "provider": "xe.com",
                "priority": 1,
                "update_frequency": "hourly"
            },
            {
                "provider": "openexchangerates.org",
                "priority": 2,
                "update_frequency": "daily"
            }
        ],
        "revaluation_settings": {
            "auto_revaluation": true,
            "revaluation_frequency": "monthly",
            "revaluation_accounts": {
                "unrealized_gain": "4950000",
                "unrealized_loss": "6950000"
            }
        },
        "translation_rules": {
            "method": "temporal",
            "balance_sheet_rate": "closing",
            "income_statement_rate": "average",
            "equity_rate": "historical"
        }
    }'::text,
    'json',
    'HERA.ACCOUNTING.SEED.CURRENCY.CONFIG.v2',
    '{"policy_type": "multi_currency", "version": "v2"}'::jsonb
)
ON CONFLICT (organization_id, entity_id, field_name) 
DO UPDATE SET 
    field_value = EXCLUDED.field_value,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- Create System Entity if it doesn't exist
-- ============================================================================

INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    metadata
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000'::uuid,
    'SYSTEM',
    'FINANCE_DNA_V2',
    'SYSTEM-FINANCE-DNA-V2',
    'HERA.ACCOUNTING.SYSTEM.ENTITY.v2',
    '{"system_type": "finance_dna", "version": "v2", "purpose": "policy_data_container"}'::jsonb
)
ON CONFLICT (organization_id, entity_type, entity_name) 
DO NOTHING;

-- ============================================================================
-- Validation Query
-- ============================================================================

-- Query to validate seed data was inserted correctly
/*
SELECT 
    field_name,
    smart_code,
    field_type,
    CASE 
        WHEN LENGTH(field_value) > 100 THEN LEFT(field_value, 100) || '...'
        ELSE field_value 
    END as field_value_preview,
    metadata->>'policy_type' as policy_type,
    created_at
FROM core_dynamic_data 
WHERE smart_code LIKE 'HERA.ACCOUNTING.SEED.%.v2'
ORDER BY field_name;
*/

-- ============================================================================
-- Seed Completion Log
-- ============================================================================

INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value,
    field_type,
    smart_code,
    metadata
) VALUES
(
    '00000000-0000-0000-0000-000000000000'::uuid,
    (SELECT id FROM core_entities WHERE entity_type = 'SYSTEM' AND entity_name = 'FINANCE_DNA_V2' LIMIT 1),
    'seed_completion_log',
    json_build_object(
        'version', 'v2',
        'seeded_at', CURRENT_TIMESTAMP,
        'seed_components', ARRAY[
            'posting_rules_v2',
            'coa_derivation_maps',
            'fiscal_policy_configuration',
            'ai_confidence_configuration',
            'multi_currency_configuration'
        ],
        'total_policies', 9,
        'status', 'completed'
    )::text,
    'json',
    'HERA.ACCOUNTING.SEED.COMPLETION.LOG.v2',
    '{"seed_type": "completion_log", "version": "v2"}'::jsonb
)
ON CONFLICT (organization_id, entity_id, field_name) 
DO UPDATE SET 
    field_value = EXCLUDED.field_value,
    updated_at = CURRENT_TIMESTAMP;

-- Success message
\echo 'Finance DNA v2 Policy Seeds Completed Successfully!'
\echo 'Seeded Components:'
\echo '  ✓ Enhanced Posting Rules v2 (4 rules)'
\echo '  ✓ COA Derivation Maps (3 maps)'
\echo '  ✓ Fiscal Policy Configuration (2 policies)'
\echo '  ✓ AI Confidence Configuration (1 config)'
\echo '  ✓ Multi-Currency Configuration (1 config)'
\echo ''
\echo 'Total: 9 policy components seeded in core_dynamic_data'
\echo 'Next Step: Run Phase 3 - Engine & API Routing Implementation'