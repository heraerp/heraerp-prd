# Finance DNA v2 - Policy-as-Data Architecture

**Smart Code**: `HERA.ACCOUNTING.POLICY.AS.DATA.ARCHITECTURE.v2`

**Auto-Generated**: ✅  
**Last Updated**: 2025-01-10  
**Source**: Live FIN_RULE entity analysis

## 🧬 Policy-as-Data Principles

Finance DNA v2 implements **Policy-as-Data** - a revolutionary approach where all financial business rules are stored as entities and dynamic data rather than hardcoded in application logic.

### **Core Benefits**
- **Dynamic Configuration**: Change business rules without code deployment
- **Organization-Specific**: Each organization can have custom financial policies
- **Version Control**: Complete audit trail of policy changes
- **Sacred Six Compliance**: Uses existing universal architecture
- **Real-time Application**: Policies applied instantly upon data changes

## 🏛️ Policy Storage Architecture

### **FIN_RULE Entity Pattern**

All financial policies are stored as `entity_type = 'fin_rule'` in `core_entities`:

```sql
-- Policy entity creation
INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    metadata
) VALUES (
    p_organization_id,
    'fin_rule',
    'Automatic Sales Posting Policy',
    'FIN_RULE_AUTO_SALES_001',
    'HERA.ACCOUNTING.POLICY.RULE.ENTITY.v2',
    jsonb_build_object(
        'rule_category', 'posting_automation',
        'priority', 1,
        'status', 'active'
    )
) RETURNING id INTO v_policy_id;
```

### **Policy Configuration in Dynamic Data**

Policy configurations are stored in `core_dynamic_data` with structured JSON:

```sql
-- Posting rule configuration
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_json,
    smart_code
) VALUES (
    p_organization_id,
    v_policy_id,
    'posting_configuration',
    'json',
    '{
        "trigger_conditions": {
            "smart_code_pattern": "HERA.SALES.TXN.ORDER.v2",
            "minimum_amount": 0.01,
            "maximum_amount": 999999.99,
            "valid_currencies": ["USD", "EUR", "GBP"]
        },
        "posting_rules": [
            {
                "sequence": 1,
                "account_mapping": {
                    "account_type": "ASSET",
                    "account_code": "1100",
                    "account_name": "Cash",
                    "posting_side": "DEBIT"
                },
                "amount_calculation": {
                    "source": "transaction.total_amount",
                    "adjustments": []
                }
            },
            {
                "sequence": 2,
                "account_mapping": {
                    "account_type": "REVENUE",
                    "account_code": "4100", 
                    "account_name": "Sales Revenue",
                    "posting_side": "CREDIT"
                },
                "amount_calculation": {
                    "source": "transaction.subtotal_amount",
                    "adjustments": []
                }
            },
            {
                "sequence": 3,
                "account_mapping": {
                    "account_type": "LIABILITY",
                    "account_code": "2250",
                    "account_name": "Sales Tax Payable", 
                    "posting_side": "CREDIT"
                },
                "amount_calculation": {
                    "source": "transaction.tax_amount",
                    "adjustments": []
                }
            }
        ]
    }',
    'HERA.ACCOUNTING.POLICY.CONFIG.POSTING.v2'
);
```

## 📋 Policy Categories

### **1. Posting Automation Policies**

**Purpose**: Automatic GL posting based on business transaction smart codes

```sql
-- Posting policy structure
{
    "policy_type": "posting_automation",
    "trigger_conditions": {
        "smart_code_pattern": "HERA.{MODULE}.{FUNCTION}.{TYPE}.v2",
        "entity_type_filter": ["customer", "vendor"],
        "amount_threshold": {
            "minimum": 0.01,
            "maximum": 100000.00
        },
        "date_range": {
            "start_date": "2024-01-01",
            "end_date": null
        }
    },
    "posting_rules": [
        {
            "sequence": 1,
            "condition": "amount > 0",
            "account_mapping": {
                "determination_method": "fixed", // fixed, mapped, calculated
                "account_code": "1100",
                "posting_side": "DEBIT"
            },
            "amount_calculation": {
                "source": "transaction.total_amount",
                "formula": "source * 1.0",
                "adjustments": [
                    {
                        "type": "tax_adjustment",
                        "rate": 0.05
                    }
                ]
            }
        }
    ],
    "validation_rules": [
        {
            "type": "balance_validation",
            "rule": "sum(debits) = sum(credits)"
        },
        {
            "type": "fiscal_period_validation", 
            "rule": "transaction_date within open_period"
        }
    ]
}
```

### **2. Approval Workflow Policies**

**Purpose**: Multi-level approval requirements for financial transactions

```sql
-- Approval workflow configuration
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_json,
    smart_code
) VALUES (
    p_organization_id,
    v_approval_policy_id,
    'approval_workflow_config',
    'json',
    '{
        "policy_type": "approval_workflow",
        "trigger_conditions": {
            "transaction_types": ["JOURNAL_ENTRY", "PAYMENT", "ADJUSTMENT"],
            "amount_thresholds": [
                {
                    "threshold": 1000.00,
                    "required_approvers": 1,
                    "approver_roles": ["finance_manager"]
                },
                {
                    "threshold": 10000.00,
                    "required_approvers": 2,
                    "approver_roles": ["finance_manager", "finance_director"]
                },
                {
                    "threshold": 50000.00,
                    "required_approvers": 3,
                    "approver_roles": ["finance_manager", "finance_director", "ceo"]
                }
            ]
        },
        "workflow_steps": [
            {
                "step": 1,
                "name": "Manager Approval",
                "required_role": "finance_manager",
                "timeout_hours": 24,
                "escalation_role": "finance_director"
            },
            {
                "step": 2,
                "name": "Director Approval",
                "required_role": "finance_director", 
                "timeout_hours": 48,
                "escalation_role": "ceo"
            }
        ],
        "notification_settings": {
            "email_enabled": true,
            "sms_enabled": false,
            "reminder_intervals": [6, 12, 24]
        }
    }',
    'HERA.ACCOUNTING.POLICY.CONFIG.APPROVAL.v2'
);
```

### **3. Validation Rule Policies**

**Purpose**: Business rule validation for data integrity

```sql
-- Validation rule configuration
{
    "policy_type": "validation_rules",
    "scope": "transaction_validation",
    "rules": [
        {
            "rule_id": "fiscal_period_check",
            "rule_name": "Fiscal Period Validation",
            "rule_type": "period_validation",
            "conditions": {
                "transaction_date_within_open_period": true,
                "allow_prior_period_posting": false,
                "required_roles_for_override": ["finance_admin"]
            },
            "error_message": "Cannot post to closed fiscal period",
            "severity": "blocking"
        },
        {
            "rule_id": "gl_balance_check",
            "rule_name": "GL Balance Validation",
            "rule_type": "balance_validation",
            "conditions": {
                "debits_equal_credits": true,
                "tolerance_cents": 1,
                "currency_consistency": true
            },
            "error_message": "Transaction debits must equal credits",
            "severity": "blocking"
        },
        {
            "rule_id": "account_existence_check",
            "rule_name": "GL Account Validation",
            "rule_type": "entity_validation",
            "conditions": {
                "account_must_exist": true,
                "account_must_be_active": true,
                "posting_allowed": true
            },
            "error_message": "Invalid or inactive GL account",
            "severity": "blocking"
        }
    ]
}
```

### **4. Currency Conversion Policies**

**Purpose**: Multi-currency transaction handling and conversion

```sql
-- Currency policy configuration
{
    "policy_type": "currency_conversion",
    "base_currency": "USD",
    "supported_currencies": ["USD", "EUR", "GBP", "AUD", "CAD"],
    "exchange_rate_sources": [
        {
            "source": "central_bank",
            "priority": 1,
            "refresh_interval_hours": 24
        },
        {
            "source": "market_data",
            "priority": 2,  
            "refresh_interval_hours": 1
        }
    ],
    "conversion_rules": [
        {
            "trigger": "foreign_currency_transaction",
            "convert_to_base": true,
            "record_fx_gain_loss": true,
            "fx_gain_loss_account": "7500",
            "rounding_precision": 2
        }
    ],
    "revaluation_settings": {
        "frequency": "monthly",
        "revaluation_accounts": ["1200", "2100"],
        "unrealized_gain_account": "7510",
        "unrealized_loss_account": "7520"
    }
}
```

## 🔧 Policy Application Engine

### **Policy Resolution Function**

```sql
CREATE OR REPLACE FUNCTION hera_resolve_applicable_policies_v2(
    p_organization_id UUID,
    p_transaction_smart_code TEXT,
    p_transaction_data JSONB
) RETURNS TABLE(
    policy_id UUID,
    policy_name TEXT,
    policy_config JSONB,
    priority INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set organization context
    PERFORM set_config('app.current_org', p_organization_id::text, false);
    
    RETURN QUERY
    WITH applicable_policies AS (
        SELECT 
            ce.id as policy_id,
            ce.entity_name as policy_name,
            cdd.field_value_json as policy_config,
            (ce.metadata->>'priority')::INTEGER as priority
        FROM core_entities ce
        JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'fin_rule'
          AND cdd.field_name IN ('posting_configuration', 'approval_workflow_config', 'validation_rules')
          AND (
              -- Match smart code pattern
              p_transaction_smart_code ~ (cdd.field_value_json->'trigger_conditions'->>'smart_code_pattern')
              OR
              -- Match transaction type
              (p_transaction_data->>'transaction_type') = ANY(
                  SELECT jsonb_array_elements_text(cdd.field_value_json->'trigger_conditions'->'transaction_types')
              )
          )
          AND (ce.metadata->>'status') = 'active'
    )
    SELECT 
        ap.policy_id,
        ap.policy_name,
        ap.policy_config,
        COALESCE(ap.priority, 999)
    FROM applicable_policies ap
    ORDER BY COALESCE(ap.priority, 999), ap.policy_name;
END;
$$;
```

### **Policy Execution Engine**

```sql
CREATE OR REPLACE FUNCTION hera_execute_financial_policies_v2(
    p_organization_id UUID,
    p_transaction_id UUID,
    p_transaction_data JSONB
) RETURNS policy_execution_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_policy RECORD;
    v_result policy_execution_result;
    v_execution_log JSONB := '[]'::jsonb;
BEGIN
    -- Initialize result
    v_result.success := true;
    v_result.policies_applied := 0;
    v_result.errors := '[]'::jsonb;
    
    -- Execute each applicable policy
    FOR v_policy IN
        SELECT * FROM hera_resolve_applicable_policies_v2(
            p_organization_id,
            p_transaction_data->>'smart_code',
            p_transaction_data
        )
    LOOP
        BEGIN
            -- Execute based on policy type
            CASE v_policy.policy_config->>'policy_type'
                WHEN 'posting_automation' THEN
                    PERFORM hera_execute_posting_policy_v2(
                        p_organization_id,
                        p_transaction_id,
                        v_policy.policy_config
                    );
                    
                WHEN 'approval_workflow' THEN
                    PERFORM hera_execute_approval_policy_v2(
                        p_organization_id,
                        p_transaction_id,
                        v_policy.policy_config
                    );
                    
                WHEN 'validation_rules' THEN
                    PERFORM hera_execute_validation_policy_v2(
                        p_organization_id,
                        p_transaction_data,
                        v_policy.policy_config
                    );
                    
                WHEN 'currency_conversion' THEN
                    PERFORM hera_execute_currency_policy_v2(
                        p_organization_id,
                        p_transaction_id,
                        v_policy.policy_config
                    );
            END CASE;
            
            -- Log successful execution
            v_execution_log := v_execution_log || jsonb_build_object(
                'policy_id', v_policy.policy_id,
                'policy_name', v_policy.policy_name,
                'execution_status', 'success',
                'execution_time', NOW()
            );
            
            v_result.policies_applied := v_result.policies_applied + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log policy execution error
            v_execution_log := v_execution_log || jsonb_build_object(
                'policy_id', v_policy.policy_id,
                'policy_name', v_policy.policy_name,
                'execution_status', 'error',
                'error_message', SQLERRM,
                'execution_time', NOW()
            );
            
            v_result.errors := v_result.errors || jsonb_build_object(
                'policy_id', v_policy.policy_id,
                'error', SQLERRM
            );
            
            v_result.success := false;
        END;
    END LOOP;
    
    -- Log complete policy execution
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        from_entity_id,
        metadata
    ) VALUES (
        p_organization_id,
        'POLICY_EXECUTION',
        'HERA.ACCOUNTING.POLICY.EVENT.EXECUTED.v2',
        p_transaction_id,
        jsonb_build_object(
            'policies_applied', v_result.policies_applied,
            'execution_success', v_result.success,
            'execution_log', v_execution_log
        )
    );
    
    RETURN v_result;
END;
$$;
```

## 📊 Policy Management Functions

### **Policy Creation Function**

```sql
CREATE OR REPLACE FUNCTION hera_create_financial_policy_v2(
    p_organization_id UUID,
    p_policy_name TEXT,
    p_policy_type TEXT,
    p_policy_config JSONB,
    p_priority INTEGER DEFAULT 100
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_policy_id UUID;
    v_config_field_name TEXT;
BEGIN
    -- Validate organization access
    IF NOT hera_validate_organization_access(p_organization_id) THEN
        RAISE EXCEPTION 'Organization access denied: %', p_organization_id;
    END IF;
    
    -- Validate policy configuration
    PERFORM hera_validate_policy_config_v2(p_policy_type, p_policy_config);
    
    -- Create policy entity
    INSERT INTO core_entities (
        organization_id,
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        metadata
    ) VALUES (
        p_organization_id,
        'fin_rule',
        p_policy_name,
        format('FIN_RULE_%s_%s', 
            upper(replace(p_policy_type, '_', '')), 
            to_char(NOW(), 'YYYYMMDDHH24MISS')
        ),
        'HERA.ACCOUNTING.POLICY.RULE.ENTITY.v2',
        jsonb_build_object(
            'policy_type', p_policy_type,
            'priority', p_priority,
            'status', 'active',
            'created_by', current_setting('app.current_user', true)
        )
    ) RETURNING id INTO v_policy_id;
    
    -- Determine configuration field name
    v_config_field_name := CASE p_policy_type
        WHEN 'posting_automation' THEN 'posting_configuration'
        WHEN 'approval_workflow' THEN 'approval_workflow_config'
        WHEN 'validation_rules' THEN 'validation_rules_config'
        WHEN 'currency_conversion' THEN 'currency_conversion_config'
        ELSE 'policy_configuration'
    END;
    
    -- Store policy configuration
    INSERT INTO core_dynamic_data (
        organization_id,
        entity_id,
        field_name,
        field_type,
        field_value_json,
        smart_code
    ) VALUES (
        p_organization_id,
        v_policy_id,
        v_config_field_name,
        'json',
        p_policy_config,
        format('HERA.ACCOUNTING.POLICY.CONFIG.%s.v2', upper(p_policy_type))
    );
    
    -- Log policy creation
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        from_entity_id,
        metadata
    ) VALUES (
        p_organization_id,
        'POLICY_CREATE',
        'HERA.ACCOUNTING.AUDIT.POLICY.CREATE.v2',
        v_policy_id,
        jsonb_build_object(
            'policy_type', p_policy_type,
            'policy_name', p_policy_name,
            'created_by', current_setting('app.current_user', true)
        )
    );
    
    RETURN v_policy_id;
END;
$$;
```

### **Policy Testing Function**

```sql
CREATE OR REPLACE FUNCTION hera_test_policy_application_v2(
    p_organization_id UUID,
    p_policy_id UUID,
    p_test_transaction_data JSONB
) RETURNS policy_test_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result policy_test_result;
    v_policy_config JSONB;
    v_test_errors TEXT[] := '{}';
BEGIN
    -- Get policy configuration
    SELECT cdd.field_value_json
    INTO v_policy_config
    FROM core_entities ce
    JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id
    WHERE ce.organization_id = p_organization_id
      AND ce.id = p_policy_id
      AND ce.entity_type = 'fin_rule'
    LIMIT 1;
    
    IF v_policy_config IS NULL THEN
        v_result.test_passed := false;
        v_result.error_message := 'Policy not found';
        RETURN v_result;
    END IF;
    
    -- Test policy conditions
    BEGIN
        -- Test trigger conditions
        IF NOT hera_evaluate_policy_conditions_v2(
            v_policy_config->'trigger_conditions',
            p_test_transaction_data
        ) THEN
            v_test_errors := v_test_errors || 'Policy trigger conditions not met';
        END IF;
        
        -- Test posting rules if applicable
        IF v_policy_config->>'policy_type' = 'posting_automation' THEN
            PERFORM hera_validate_posting_rules_v2(
                v_policy_config->'posting_rules',
                p_test_transaction_data
            );
        END IF;
        
        -- Test validation rules if applicable
        IF v_policy_config->>'policy_type' = 'validation_rules' THEN
            PERFORM hera_test_validation_rules_v2(
                v_policy_config->'rules',
                p_test_transaction_data
            );
        END IF;
        
        v_result.test_passed := array_length(v_test_errors, 1) IS NULL;
        v_result.error_message := array_to_string(v_test_errors, '; ');
        
    EXCEPTION WHEN OTHERS THEN
        v_result.test_passed := false;
        v_result.error_message := SQLERRM;
    END;
    
    -- Log test execution
    INSERT INTO universal_transactions (
        organization_id,
        transaction_type,
        smart_code,
        from_entity_id,
        metadata
    ) VALUES (
        p_organization_id,
        'POLICY_TEST',
        'HERA.ACCOUNTING.POLICY.EVENT.TESTED.v2',
        p_policy_id,
        jsonb_build_object(
            'test_result', v_result.test_passed,
            'test_errors', v_test_errors,
            'test_data', p_test_transaction_data
        )
    );
    
    RETURN v_result;
END;
$$;
```

## 🔍 Policy Analytics

### **Policy Usage Analytics**

```sql
-- Policy application statistics
WITH policy_usage AS (
    SELECT 
        ce.entity_name as policy_name,
        ce.metadata->>'policy_type' as policy_type,
        COUNT(*) as applications_count,
        COUNT(*) FILTER (WHERE ut.metadata->>'execution_success' = 'true') as successful_applications,
        AVG(EXTRACT(MILLISECONDS FROM (ut.metadata->>'execution_time')::INTERVAL)) as avg_execution_time_ms
    FROM core_entities ce
    LEFT JOIN universal_transactions ut ON ce.id = ut.from_entity_id
        AND ut.smart_code = 'HERA.ACCOUNTING.POLICY.EVENT.EXECUTED.v2'
        AND ut.created_at >= NOW() - INTERVAL '30 days'
    WHERE ce.organization_id = p_organization_id
      AND ce.entity_type = 'fin_rule'
    GROUP BY ce.id, ce.entity_name, ce.metadata->>'policy_type'
)
SELECT 
    policy_name,
    policy_type,
    applications_count,
    successful_applications,
    ROUND((successful_applications::DECIMAL / NULLIF(applications_count, 0)) * 100, 2) as success_rate_percent,
    ROUND(avg_execution_time_ms, 2) as avg_execution_time_ms
FROM policy_usage
ORDER BY applications_count DESC;
```

### **Policy Health Monitoring**

```sql
CREATE OR REPLACE FUNCTION hera_policy_health_check_v2(
    p_organization_id UUID
) RETURNS TABLE(
    policy_id UUID,
    policy_name TEXT,
    policy_type TEXT,
    health_status TEXT,
    issues_found TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_policy RECORD;
    v_issues TEXT[];
    v_health_status TEXT;
BEGIN
    FOR v_policy IN
        SELECT 
            ce.id,
            ce.entity_name,
            ce.metadata->>'policy_type' as policy_type,
            cdd.field_value_json as config
        FROM core_entities ce
        JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'fin_rule'
    LOOP
        v_issues := '{}';
        
        -- Check policy configuration validity
        IF v_policy.config IS NULL THEN
            v_issues := v_issues || 'Missing policy configuration';
        END IF;
        
        -- Check for required fields based on policy type
        CASE v_policy.policy_type
            WHEN 'posting_automation' THEN
                IF v_policy.config->'posting_rules' IS NULL THEN
                    v_issues := v_issues || 'Missing posting rules';
                END IF;
                
            WHEN 'approval_workflow' THEN
                IF v_policy.config->'workflow_steps' IS NULL THEN
                    v_issues := v_issues || 'Missing workflow steps';
                END IF;
        END CASE;
        
        -- Determine health status
        v_health_status := CASE 
            WHEN array_length(v_issues, 1) IS NULL THEN 'HEALTHY'
            WHEN array_length(v_issues, 1) <= 2 THEN 'WARNING'
            ELSE 'CRITICAL'
        END;
        
        RETURN QUERY SELECT 
            v_policy.id,
            v_policy.entity_name,
            v_policy.policy_type,
            v_health_status,
            v_issues;
    END LOOP;
END;
$$;
```

---

## 🎯 Next Steps

- **[Guardrails](04-guardrails.md)** - Validation rules and enforcement mechanisms
- **[Reporting RPCs](05-reporting-rpcs.md)** - Financial reports with policy intelligence
- **[Migration](06-migration-runbook.md)** - Zero Tables migration with policy preservation

**Policy-as-Data in Finance DNA v2 enables dynamic financial rule management while maintaining perfect Sacred Six compliance and organization isolation.**