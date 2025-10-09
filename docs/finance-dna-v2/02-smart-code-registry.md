# Finance DNA v2 - Smart Code Registry

**Smart Code**: `HERA.ACCOUNTING.SMART.CODE.REGISTRY.v2`

**Auto-Generated**: ✅  
**Last Updated**: 2025-01-10  
**Source**: Live database smart code analysis

## 🧬 Smart Code Families - .v2 Registry

Finance DNA v2 introduces enhanced smart code families with improved business intelligence, automatic GL posting, and policy-driven behaviors.

### **Smart Code Format**
```
HERA.{DOMAIN}.{MODULE}.{FUNCTION}.{TYPE}.{SUBTYPE}.v2
```

### **Version 2 Enhancements**
- **Enhanced GL Posting**: Automatic account determination
- **Policy Integration**: Dynamic rule application
- **Performance Optimization**: Sub-second response times
- **Audit Enhancement**: Complete activity tracking
- **Multi-Currency Support**: Automatic FX handling

## 📊 Core Accounting Smart Codes

### **GL Account Management**
```sql
-- GL account entity creation
'HERA.ACCOUNTING.GL.ACC.ENTITY.v2'
-- Usage: Creating chart of accounts entries
-- Auto-behaviors: Account validation, hierarchy setup

-- GL account balance inquiry  
'HERA.ACCOUNTING.GL.ACC.BALANCE.INQUIRY.v2'
-- Usage: Real-time balance calculations
-- Auto-behaviors: Multi-currency conversion, period filtering

-- GL account hierarchy management
'HERA.ACCOUNTING.GL.ACC.HIERARCHY.PARENT.v2'
'HERA.ACCOUNTING.GL.ACC.HIERARCHY.CHILD.v2'
-- Usage: Building chart of accounts structure
-- Auto-behaviors: Rollup calculations, validation
```

### **Transaction Processing**
```sql
-- Journal entry header
'HERA.ACCOUNTING.GL.TXN.JOURNAL.v2'
-- Usage: Manual and automated journal entries
-- Auto-behaviors: Balance validation, fiscal period check

-- Journal entry lines (debit/credit)
'HERA.ACCOUNTING.GL.LINE.DEBIT.v2'
'HERA.ACCOUNTING.GL.LINE.CREDIT.v2'
-- Usage: Individual GL posting lines
-- Auto-behaviors: Account validation, balance enforcement

-- Automated posting transactions
'HERA.ACCOUNTING.GL.TXN.AUTO.POST.v2'
-- Usage: Policy-driven automatic postings
-- Auto-behaviors: Rule application, account determination
```

### **Financial Reporting**
```sql
-- Trial balance generation
'HERA.ACCOUNTING.REPORT.TRIAL.BALANCE.v2'
-- Usage: Real-time trial balance reports
-- Auto-behaviors: Performance optimization, caching

-- Profit & Loss statement
'HERA.ACCOUNTING.REPORT.PROFIT.LOSS.v2'  
-- Usage: P&L report generation
-- Auto-behaviors: Period comparison, variance analysis

-- Balance sheet generation
'HERA.ACCOUNTING.REPORT.BALANCE.SHEET.v2'
-- Usage: Balance sheet reports
-- Auto-behaviors: Liquidity ratios, financial analysis
```

## 🏛️ Policy & Rule Management

### **Financial Policy Smart Codes**
```sql
-- Financial rule entity creation
'HERA.ACCOUNTING.POLICY.RULE.ENTITY.v2'
-- Usage: Creating financial business rules
-- Auto-behaviors: Validation, activation tracking

-- Policy configuration storage
'HERA.ACCOUNTING.POLICY.CONFIG.POSTING.v2'
'HERA.ACCOUNTING.POLICY.CONFIG.VALIDATION.v2'
'HERA.ACCOUNTING.POLICY.CONFIG.APPROVAL.v2'
-- Usage: Policy-as-data configurations
-- Auto-behaviors: JSON validation, version control

-- Policy application events
'HERA.ACCOUNTING.POLICY.EVENT.APPLIED.v2'
'HERA.ACCOUNTING.POLICY.EVENT.TRIGGERED.v2'
-- Usage: Tracking policy execution
-- Auto-behaviors: Audit trail, performance metrics
```

### **Rule Execution Smart Codes**
```sql
-- Posting rule execution
'HERA.ACCOUNTING.RULE.EXEC.POSTING.v2'
-- Usage: Automatic GL posting via rules
-- Auto-behaviors: Account mapping, validation

-- Validation rule execution  
'HERA.ACCOUNTING.RULE.EXEC.VALIDATION.v2'
-- Usage: Business rule validation
-- Auto-behaviors: Error handling, notification

-- Approval workflow execution
'HERA.ACCOUNTING.RULE.EXEC.APPROVAL.v2'
-- Usage: Multi-level approval workflows
-- Auto-behaviors: Role validation, escalation
```

## 📅 Fiscal Period Management

### **Fiscal Period Smart Codes**
```sql
-- Fiscal period entity creation
'HERA.ACCOUNTING.FISCAL.PERIOD.ENTITY.v2'
-- Usage: Creating accounting periods
-- Auto-behaviors: Date validation, sequence management

-- Period status management
'HERA.ACCOUNTING.FISCAL.PERIOD.STATUS.OPEN.v2'
'HERA.ACCOUNTING.FISCAL.PERIOD.STATUS.CLOSED.v2'
'HERA.ACCOUNTING.FISCAL.PERIOD.STATUS.LOCKED.v2'
-- Usage: Managing period lifecycle
-- Auto-behaviors: Posting validation, security enforcement

-- Period closing operations
'HERA.ACCOUNTING.FISCAL.PERIOD.CLOSE.OPERATION.v2'
-- Usage: Automated period closing
-- Auto-behaviors: Balance validation, audit trail

-- Enhanced validation with health scoring
'HERA.ACCOUNTING.FISCAL.PERIOD.VALIDATION.v2'
-- Usage: Real-time period validation (Phase 5)
-- Auto-behaviors: <10ms response, health scoring
```

## 🔄 Migration & Integration

### **Zero Tables Migration Smart Codes**
```sql
-- Migration candidate identification
'HERA.ACCOUNTING.MIGRATION.CANDIDATE.PREVIEW.v2'
-- Usage: CTE-only migration planning (Phase 7)
-- Auto-behaviors: Smart code mapping, volume estimation

-- Reverse + repost operations
'HERA.ACCOUNTING.MIGRATION.REVERSE.REPOST.v2'
-- Usage: Zero tables transaction transformation
-- Auto-behaviors: GL balance maintenance, audit trail

-- Reporting alias application
'HERA.ACCOUNTING.MIGRATION.ALIAS.REPORTING.v2'
-- Usage: Metadata-only compatibility layer
-- Auto-behaviors: Backwards compatibility, feature enablement
```

### **External System Integration**
```sql
-- Bank reconciliation integration
'HERA.ACCOUNTING.INTEGRATION.BANK.RECONCILE.v2'
-- Usage: Automated bank statement processing
-- Auto-behaviors: Transaction matching, variance detection

-- ERP data synchronization  
'HERA.ACCOUNTING.INTEGRATION.ERP.SYNC.v2'
-- Usage: External ERP system integration
-- Auto-behaviors: Data validation, conflict resolution
```

## 🔐 Security & Audit

### **Security Event Smart Codes**
```sql
-- RLS enforcement events
'HERA.ACCOUNTING.SECURITY.RLS.ENFORCEMENT.v2'
-- Usage: Row level security audit trail (Phase 8)
-- Auto-behaviors: Organization isolation, violation detection

-- Authentication events
'HERA.ACCOUNTING.SECURITY.AUTH.SUCCESS.v2'
'HERA.ACCOUNTING.SECURITY.AUTH.FAILURE.v2'
-- Usage: User authentication tracking
-- Auto-behaviors: Anomaly detection, alerting

-- Permission validation events
'HERA.ACCOUNTING.SECURITY.PERMISSION.CHECK.v2'
'HERA.ACCOUNTING.SECURITY.PERMISSION.DENIED.v2'
-- Usage: Role-based access control audit
-- Auto-behaviors: Permission caching, violation logging
```

### **Audit Trail Smart Codes**
```sql
-- Financial transaction audit
'HERA.ACCOUNTING.AUDIT.TRANSACTION.CREATE.v2'
'HERA.ACCOUNTING.AUDIT.TRANSACTION.MODIFY.v2'
'HERA.ACCOUNTING.AUDIT.TRANSACTION.DELETE.v2'
-- Usage: Complete transaction lifecycle audit
-- Auto-behaviors: Immutable logging, compliance reporting

-- Policy change audit
'HERA.ACCOUNTING.AUDIT.POLICY.CREATE.v2'
'HERA.ACCOUNTING.AUDIT.POLICY.MODIFY.v2'
-- Usage: Policy-as-data change tracking
-- Auto-behaviors: Version control, impact analysis
```

## 🚀 Performance & Optimization

### **Performance Monitoring Smart Codes**
```sql
-- RPC function performance tracking
'HERA.ACCOUNTING.PERFORMANCE.RPC.EXECUTION.v2'
-- Usage: Database function performance monitoring
-- Auto-behaviors: Response time tracking, optimization alerts

-- Cache operations
'HERA.ACCOUNTING.PERFORMANCE.CACHE.HIT.v2'
'HERA.ACCOUNTING.PERFORMANCE.CACHE.MISS.v2'
-- Usage: Intelligent caching strategy monitoring
-- Auto-behaviors: Hit rate optimization, invalidation logic

-- Query optimization tracking
'HERA.ACCOUNTING.PERFORMANCE.QUERY.OPTIMIZATION.v2'
-- Usage: SQL query performance analysis
-- Auto-behaviors: Execution plan analysis, index recommendations
```

## 🏭 Industry-Specific Extensions

### **Multi-Industry Smart Code Patterns**

#### **Restaurant Industry**
```sql
-- Sales transaction with GL posting
'HERA.ACCOUNTING.RESTAURANT.SALE.TXN.v2'
-- Auto-posting: DR Cash, CR Sales Revenue, CR Sales Tax

-- Inventory cost tracking
'HERA.ACCOUNTING.RESTAURANT.INVENTORY.COST.v2'
-- Auto-posting: DR Cost of Goods Sold, CR Inventory
```

#### **Healthcare Industry**
```sql
-- Patient service billing
'HERA.ACCOUNTING.HEALTHCARE.SERVICE.BILL.v2'
-- Auto-posting: DR Accounts Receivable, CR Service Revenue

-- Insurance claim processing
'HERA.ACCOUNTING.HEALTHCARE.INSURANCE.CLAIM.v2'
-- Auto-posting: DR Insurance Receivable, CR Patient Receivable
```

#### **Manufacturing Industry**
```sql
-- Production order completion
'HERA.ACCOUNTING.MANUFACTURING.PRODUCTION.COMPLETE.v2'
-- Auto-posting: DR Finished Goods, CR Work in Process

-- Material consumption
'HERA.ACCOUNTING.MANUFACTURING.MATERIAL.CONSUME.v2'
-- Auto-posting: DR Work in Process, CR Raw Materials
```

## 📋 Smart Code Validation Rules

### **Format Validation Regex**
```regex
^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$

Examples:
✅ HERA.ACCOUNTING.GL.TXN.JOURNAL.v2
✅ HERA.ACCOUNTING.POLICY.RULE.ENTITY.v2
✅ HERA.ACCOUNTING.REPORT.TRIAL.BALANCE.v2
❌ HERA.ACCOUNTING.GL.TXN.JOURNAL.v1 (wrong version)
❌ hera.accounting.gl.txn.journal.v2 (lowercase)
❌ HERA.ACCOUNTING.GL.v2 (too short)
```

### **Business Logic Validation**
```sql
-- Smart code family consistency validation
CREATE OR REPLACE FUNCTION validate_smart_code_family_v2(
    p_smart_code TEXT
) RETURNS validation_result
LANGUAGE plpgsql
AS $$
DECLARE
    v_result validation_result;
    v_code_parts TEXT[];
BEGIN
    -- Split smart code into components
    v_code_parts := string_to_array(p_smart_code, '.');
    
    -- Validate format
    IF array_length(v_code_parts, 1) < 5 THEN
        v_result.valid := false;
        v_result.error_message := 'Smart code too short';
        RETURN v_result;
    END IF;
    
    -- Validate version
    IF v_code_parts[array_length(v_code_parts, 1)] != 'v2' THEN
        v_result.valid := false;
        v_result.error_message := 'Must use v2 version';
        RETURN v_result;
    END IF;
    
    -- Validate domain
    IF v_code_parts[2] != 'ACCOUNTING' THEN
        v_result.valid := false;
        v_result.error_message := 'Must use ACCOUNTING domain';
        RETURN v_result;
    END IF;
    
    v_result.valid := true;
    RETURN v_result;
END;
$$;
```

## 📊 Smart Code Usage Analytics

### **Auto-Generated Usage Statistics**
```sql
-- Most frequently used smart codes (last 30 days)
WITH smart_code_usage AS (
    SELECT 
        smart_code,
        COUNT(*) as usage_count,
        COUNT(DISTINCT organization_id) as org_count
    FROM universal_transactions
    WHERE smart_code LIKE 'HERA.ACCOUNTING.%.v2'
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY smart_code
)
SELECT 
    smart_code,
    usage_count,
    org_count,
    ROUND((usage_count::DECIMAL / SUM(usage_count) OVER()) * 100, 2) as usage_percentage
FROM smart_code_usage
ORDER BY usage_count DESC
LIMIT 20;
```

### **Smart Code Coverage by Organization**
```sql
-- Organizations using Finance DNA v2 smart codes
SELECT 
    o.organization_name,
    COUNT(DISTINCT ut.smart_code) as unique_smart_codes,
    COUNT(*) as total_transactions,
    MAX(ut.created_at) as last_activity
FROM core_organizations o
JOIN universal_transactions ut ON o.id = ut.organization_id
WHERE ut.smart_code LIKE 'HERA.ACCOUNTING.%.v2'
GROUP BY o.id, o.organization_name
ORDER BY unique_smart_codes DESC;
```

## 🔧 Implementation Examples

### **Creating a Financial Rule with Smart Codes**
```sql
-- 1. Create the rule entity
INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code
) VALUES (
    p_organization_id,
    'fin_rule',
    'Automatic Sales Posting Rule',
    'FIN_RULE_AUTO_SALES',
    'HERA.ACCOUNTING.POLICY.RULE.ENTITY.v2'
) RETURNING id INTO v_rule_id;

-- 2. Add rule configuration
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_json,
    smart_code
) VALUES (
    p_organization_id,
    v_rule_id,
    'posting_configuration',
    'json',
    '{
        "trigger_smart_code": "HERA.SALES.TXN.ORDER.v2",
        "posting_rules": [
            {
                "account_type": "CASH",
                "account_code": "1100",
                "posting_type": "DEBIT",
                "amount_source": "transaction.total_amount"
            },
            {
                "account_type": "REVENUE", 
                "account_code": "4100",
                "posting_type": "CREDIT",
                "amount_source": "transaction.subtotal"
            },
            {
                "account_type": "LIABILITY",
                "account_code": "2250", 
                "posting_type": "CREDIT",
                "amount_source": "transaction.tax_amount"
            }
        ]
    }',
    'HERA.ACCOUNTING.POLICY.CONFIG.POSTING.v2'
);

-- 3. Log rule creation
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
    v_rule_id,
    jsonb_build_object(
        'rule_type', 'posting_rule',
        'created_by', p_user_id,
        'activation_status', 'active'
    )
);
```

### **Applying Smart Code-Driven GL Posting**
```sql
-- Automatic posting based on smart code
CREATE OR REPLACE FUNCTION hera_process_smart_code_posting_v2(
    p_organization_id UUID,
    p_transaction_smart_code TEXT,
    p_transaction_data JSONB
) RETURNS posting_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_posting_rule RECORD;
    v_result posting_result;
BEGIN
    -- Find applicable posting rules
    FOR v_posting_rule IN
        SELECT 
            ce.entity_name as rule_name,
            cdd.field_value_json as rule_config
        FROM core_entities ce
        JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id
        WHERE ce.organization_id = p_organization_id
          AND ce.entity_type = 'fin_rule'
          AND cdd.field_name = 'posting_configuration'
          AND cdd.field_value_json->>'trigger_smart_code' = p_transaction_smart_code
    LOOP
        -- Execute posting based on rule configuration
        PERFORM hera_execute_posting_rule_v2(
            p_organization_id,
            v_posting_rule.rule_config,
            p_transaction_data
        );
        
        -- Log rule execution
        INSERT INTO universal_transactions (
            organization_id,
            transaction_type,
            smart_code,
            metadata
        ) VALUES (
            p_organization_id,
            'RULE_EXECUTION',
            'HERA.ACCOUNTING.RULE.EXEC.POSTING.v2',
            jsonb_build_object(
                'rule_name', v_posting_rule.rule_name,
                'trigger_smart_code', p_transaction_smart_code,
                'execution_timestamp', NOW()
            )
        );
    END LOOP;
    
    RETURN v_result;
END;
$$;
```

---

## 🎯 Next Steps

- **[Policy-as-Data](03-policy-as-data.md)** - FIN_RULE entities and dynamic configurations
- **[Guardrails](04-guardrails.md)** - Smart code validation and enforcement
- **[Reporting RPCs](05-reporting-rpcs.md)** - Financial reports with smart code intelligence

**Smart codes in Finance DNA v2 provide automatic business intelligence, GL posting, and policy enforcement while maintaining perfect Sacred Six compliance.**