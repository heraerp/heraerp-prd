# 🎯 PHASE 1 — Finance DNA v2 Target Design

**🔐 SECURED DEVELOPMENT DOCUMENTATION**  
**Access Level: Core Development Team Only**

---

## 🧩 V2 Smart Code Registry Design

### **Enhanced Smart Code Pattern**

**v2 Pattern:** `^HERA\.ACCOUNTING\.[A-Z0-9]{2,10}(?:\.[A-Z0-9_]{2,15}){2,6}\.v2$`

**Key Improvements:**
- ✅ **Namespace Consistency**: All finance codes under `HERA.ACCOUNTING.*`
- ✅ **Version Enforcement**: Strict `.v2` suffix (lowercase v forbidden)
- ✅ **Module Clarity**: Clear module identification for routing
- ✅ **Future-Proof**: Expandable pattern for additional segments

### **Core v2 Smart Code Families**

#### **1. Transaction Events (TXN)**
```typescript
// General Ledger Transactions
'HERA.ACCOUNTING.GL.TXN.JOURNAL.v2'              // Manual journal entries
'HERA.ACCOUNTING.GL.TXN.AUTO_JOURNAL.v2'         // Auto-generated journals
'HERA.ACCOUNTING.GL.TXN.ADJUSTMENT.v2'           // Period adjustments
'HERA.ACCOUNTING.GL.TXN.REVERSAL.v2'             // Transaction reversals

// Accounts Receivable
'HERA.ACCOUNTING.AR.TXN.INVOICE.v2'              // Customer invoices
'HERA.ACCOUNTING.AR.TXN.PAYMENT.v2'              // Customer payments
'HERA.ACCOUNTING.AR.TXN.CREDIT_MEMO.v2'          // Credit memos
'HERA.ACCOUNTING.AR.TXN.WRITEOFF.v2'             // Bad debt write-offs

// Accounts Payable
'HERA.ACCOUNTING.AP.TXN.BILL.v2'                 // Vendor bills
'HERA.ACCOUNTING.AP.TXN.PAYMENT.v2'              // Vendor payments
'HERA.ACCOUNTING.AP.TXN.CREDIT.v2'               // Vendor credits
'HERA.ACCOUNTING.AP.TXN.PREPAYMENT.v2'           // Advance payments

// Fixed Assets
'HERA.ACCOUNTING.FA.TXN.ACQUISITION.v2'          // Asset purchases
'HERA.ACCOUNTING.FA.TXN.DEPRECIATION.v2'         // Depreciation posting
'HERA.ACCOUNTING.FA.TXN.DISPOSAL.v2'             // Asset disposals
'HERA.ACCOUNTING.FA.TXN.IMPAIRMENT.v2'           // Asset impairments

// Inventory & COGS
'HERA.ACCOUNTING.INV.TXN.PURCHASE.v2'            // Inventory purchases
'HERA.ACCOUNTING.INV.TXN.ISSUE.v2'               // Inventory issues (COGS)
'HERA.ACCOUNTING.INV.TXN.ADJUSTMENT.v2'          // Inventory adjustments
'HERA.ACCOUNTING.INV.TXN.REVALUATION.v2'         // Inventory revaluations

// Payroll & HR
'HERA.ACCOUNTING.HR.TXN.PAYROLL.v2'              // Payroll processing
'HERA.ACCOUNTING.HR.TXN.ACCRUAL.v2'              // Payroll accruals
'HERA.ACCOUNTING.HR.TXN.BENEFITS.v2'             // Employee benefits
'HERA.ACCOUNTING.HR.TXN.EXPENSE.v2'              // Employee expenses

// Banking & Cash
'HERA.ACCOUNTING.CASH.TXN.DEPOSIT.v2'            // Bank deposits
'HERA.ACCOUNTING.CASH.TXN.WITHDRAWAL.v2'         // Bank withdrawals
'HERA.ACCOUNTING.CASH.TXN.TRANSFER.v2'           // Inter-account transfers
'HERA.ACCOUNTING.CASH.TXN.RECONCILIATION.v2'     // Bank reconciliation
```

#### **2. Posting Rules (RULE)**
```typescript
// Auto-Posting Rules
'HERA.ACCOUNTING.GL.RULE.AUTO_POST.v2'           // Automatic posting logic
'HERA.ACCOUNTING.GL.RULE.DERIVATION.v2'          // Account derivation rules
'HERA.ACCOUNTING.GL.RULE.ALLOCATION.v2'          // Cost allocation rules
'HERA.ACCOUNTING.GL.RULE.VALIDATION.v2'          // Posting validation rules

// Module-Specific Rules
'HERA.ACCOUNTING.AR.RULE.REVENUE_RECOGNITION.v2' // Revenue recognition
'HERA.ACCOUNTING.AP.RULE.EXPENSE_MATCHING.v2'    // Expense matching
'HERA.ACCOUNTING.INV.RULE.COSTING.v2'            // Inventory costing
'HERA.ACCOUNTING.FA.RULE.DEPRECIATION.v2'        // Depreciation methods

// Multi-Currency Rules
'HERA.ACCOUNTING.FX.RULE.REVALUATION.v2'         // Currency revaluation
'HERA.ACCOUNTING.FX.RULE.TRANSLATION.v2'         // Currency translation
'HERA.ACCOUNTING.FX.RULE.HEDGING.v2'             // FX hedging accounting
```

#### **3. Report Classification (REPORT)**
```typescript
// Financial Statements
'HERA.ACCOUNTING.REPORT.KEY.TRIAL_BALANCE.v2'    // Trial balance reports
'HERA.ACCOUNTING.REPORT.KEY.BALANCE_SHEET.v2'    // Balance sheet reports
'HERA.ACCOUNTING.REPORT.KEY.INCOME_STATEMENT.v2' // P&L reports
'HERA.ACCOUNTING.REPORT.KEY.CASH_FLOW.v2'        // Cash flow reports
'HERA.ACCOUNTING.REPORT.KEY.EQUITY.v2'           // Statement of equity

// Management Reports
'HERA.ACCOUNTING.REPORT.KEY.AGING.v2'            // AR/AP aging reports
'HERA.ACCOUNTING.REPORT.KEY.BUDGET_VARIANCE.v2'  // Budget variance
'HERA.ACCOUNTING.REPORT.KEY.COST_CENTER.v2'      // Cost center analysis
'HERA.ACCOUNTING.REPORT.KEY.PROFITABILITY.v2'    // Profitability analysis

// Compliance Reports
'HERA.ACCOUNTING.REPORT.KEY.TAX_RETURN.v2'       // Tax reporting
'HERA.ACCOUNTING.REPORT.KEY.AUDIT_TRAIL.v2'      // Audit documentation
'HERA.ACCOUNTING.REPORT.KEY.REGULATORY.v2'       // Regulatory reports
```

#### **4. Fiscal Period Management (FISCAL)**
```typescript
// Period Operations
'HERA.ACCOUNTING.FISCAL.PERIOD.OPEN.v2'          // Period opening
'HERA.ACCOUNTING.FISCAL.PERIOD.CLOSE.v2'         // Period closing
'HERA.ACCOUNTING.FISCAL.PERIOD.REOPEN.v2'        // Period reopening
'HERA.ACCOUNTING.FISCAL.PERIOD.LOCK.v2'          // Period locking

// Year-End Operations
'HERA.ACCOUNTING.FISCAL.YEAREND.CLOSE.v2'        // Year-end close
'HERA.ACCOUNTING.FISCAL.YEAREND.CARRYFORWARD.v2' // Balance carry-forward
'HERA.ACCOUNTING.FISCAL.YEAREND.RETAINED.v2'     // Retained earnings
'HERA.ACCOUNTING.FISCAL.YEAREND.CONSOLIDATION.v2' // Consolidation

// Calendar Management
'HERA.ACCOUNTING.FISCAL.CALENDAR.SETUP.v2'       // Fiscal calendar setup
'HERA.ACCOUNTING.FISCAL.CALENDAR.PERIOD.v2'      // Period definition
'HERA.ACCOUNTING.FISCAL.CALENDAR.YEAR.v2'        // Fiscal year setup
```

#### **5. AI-Enhanced Operations (AI)**
```typescript
// AI Confidence & Scoring
'HERA.ACCOUNTING.AI.CONFIDENCE.SCORING.v2'       // AI confidence calculation
'HERA.ACCOUNTING.AI.CONFIDENCE.VALIDATION.v2'    // Confidence validation
'HERA.ACCOUNTING.AI.CONFIDENCE.LEARNING.v2'      // Machine learning updates

// AI Predictions & Recommendations
'HERA.ACCOUNTING.AI.PREDICT.ACCOUNT.v2'          // Account prediction
'HERA.ACCOUNTING.AI.PREDICT.POSTING.v2'          // Posting prediction
'HERA.ACCOUNTING.AI.RECOMMEND.ADJUSTMENT.v2'     // Adjustment recommendations
'HERA.ACCOUNTING.AI.RECOMMEND.OPTIMIZATION.v2'   // Process optimization

// AI Anomaly Detection
'HERA.ACCOUNTING.AI.ANOMALY.DETECTION.v2'        // Anomaly detection
'HERA.ACCOUNTING.AI.ANOMALY.CLASSIFICATION.v2'   // Anomaly classification
'HERA.ACCOUNTING.AI.ANOMALY.RESOLUTION.v2'       // Anomaly resolution
```

---

## 🛡️ Enhanced Guardrail Rules Design

### **New v2 Guardrail Rules**

#### **1. Fiscal Period Validation**
```json
{
  "rule_id": "TXN-PERIOD-VALID",
  "description": "Transaction must be posted to an open fiscal period",
  "severity": "ERROR",
  "validation_logic": {
    "check": "fiscal_period_status = 'OPEN'",
    "error_message": "Cannot post to closed fiscal period {period_code}. Period status: {status}",
    "auto_fix": false,
    "bypass_roles": ["system_admin", "fiscal_admin"]
  },
  "integration": {
    "database_function": "hera_fiscal_period_validate_v2",
    "cache_ttl": 300,
    "real_time": true
  }
}
```

#### **2. Chart of Accounts Mapping**
```json
{
  "rule_id": "COA-MAPPING-EXISTS",
  "description": "Every GL line must map to a valid account entity",
  "severity": "ERROR",
  "validation_logic": {
    "check": "account_entity_exists AND account_status = 'ACTIVE'",
    "error_message": "GL account {account_code} not found or inactive",
    "auto_fix": false,
    "suggest_alternatives": true
  },
  "integration": {
    "view_lookup": "v_gl_accounts_enhanced",
    "cache_ttl": 600,
    "preload_accounts": true
  }
}
```

#### **3. AI Confidence Verification**
```json
{
  "rule_id": "TXN-AI-VERIFY",
  "description": "Transactions with low AI confidence require manual approval",
  "severity": "WARNING",
  "validation_logic": {
    "check": "ai_confidence >= threshold OR manual_approval_received",
    "warning_message": "Low AI confidence ({confidence}). Manual review recommended.",
    "auto_approve_threshold": 0.8,
    "require_approval_threshold": 0.7,
    "reject_threshold": 0.3
  },
  "workflow": {
    "auto_approve": "ai_confidence >= 0.8",
    "require_manager": "ai_confidence >= 0.7 AND ai_confidence < 0.8",
    "require_owner": "ai_confidence >= 0.5 AND ai_confidence < 0.7",
    "auto_reject": "ai_confidence < 0.5"
  }
}
```

#### **4. Multi-Currency GL Balance**
```json
{
  "rule_id": "MULTI-CURRENCY-BALANCE",
  "description": "GL entries must balance within each currency",
  "severity": "ERROR",
  "validation_logic": {
    "check": "ABS(SUM(debit_amount - credit_amount)) < 0.01 PER currency",
    "error_message": "GL entries not balanced for {currency}: {difference}",
    "tolerance": 0.01,
    "rounding_precision": 2
  },
  "integration": {
    "database_function": "hera_gl_balance_validate_v2",
    "real_time": true,
    "pre_commit_check": true
  }
}
```

#### **5. Smart Code v2 Format**
```json
{
  "rule_id": "SMART-CODE-V2-FORMAT",
  "description": "v2 Smart Codes must follow enhanced pattern",
  "severity": "ERROR",
  "validation_logic": {
    "pattern": "^HERA\\.ACCOUNTING\\.[A-Z0-9]{2,10}(?:\\.[A-Z0-9_]{2,15}){2,6}\\.v2$",
    "error_message": "Smart Code {code} does not match v2 pattern",
    "examples": [
      "HERA.ACCOUNTING.GL.TXN.JOURNAL.v2",
      "HERA.ACCOUNTING.AR.RULE.REVENUE_RECOGNITION.v2"
    ]
  },
  "migration": {
    "v1_to_v2_mapping": true,
    "auto_upgrade_suggestions": true
  }
}
```

#### **6. Fiscal Close Protection**
```json
{
  "rule_id": "FISCAL-CLOSE-PROTECTION",
  "description": "Cannot modify transactions in closed fiscal periods",
  "severity": "ERROR",
  "validation_logic": {
    "check": "fiscal_period_status != 'CLOSED' OR operation = 'READ'",
    "error_message": "Cannot modify transactions in closed period {period_code}",
    "exceptions": ["system_admin", "audit_adjustment"],
    "audit_required": true
  },
  "integration": {
    "fiscal_calendar": "v_fiscal_periods",
    "audit_logging": true,
    "notification_required": true
  }
}
```

### **Enhanced Guardrail Configuration**

#### **CI Pipeline Integration**
```yaml
# guardrails-v2-ci-config.yml
guardrails:
  version: "v2"
  enforcement_level: "strict"
  
  pre_commit_checks:
    - "SMART-CODE-V2-FORMAT"
    - "MULTI-CURRENCY-BALANCE"
    - "COA-MAPPING-EXISTS"
    
  runtime_checks:
    - "TXN-PERIOD-VALID"
    - "TXN-AI-VERIFY"
    - "FISCAL-CLOSE-PROTECTION"
    
  performance_targets:
    max_validation_time: "50ms"
    cache_hit_ratio: "95%"
    
  fail_fast: true
  auto_fix_enabled: false
  notification_channels:
    - "slack://dev-team"
    - "email://finance-team"
```

#### **Database Integration Schema**
```sql
-- Enhanced guardrail configuration table
CREATE TABLE IF NOT EXISTS guardrail_rules_v2 (
    rule_id TEXT PRIMARY KEY,
    rule_version TEXT NOT NULL DEFAULT 'v2',
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('ERROR', 'WARNING', 'INFO')),
    validation_logic JSONB NOT NULL,
    integration_config JSONB,
    workflow_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    organization_overrides JSONB DEFAULT '{}'::jsonb
);

-- Performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_guardrail_rules_v2_active 
    ON guardrail_rules_v2 (is_active, rule_id);
CREATE INDEX IF NOT EXISTS idx_guardrail_rules_v2_severity 
    ON guardrail_rules_v2 (severity) WHERE is_active = true;
```

---

## 🔄 Enhanced Event Routing Design

### **Smart Code Version Router**
```typescript
interface SmartCodeRouter {
  route(smartCode: string): 'v1' | 'v2' | 'unsupported'
  validatePattern(smartCode: string, version: 'v1' | 'v2'): boolean
  suggestMigration(v1Code: string): string | null
  getCompatibilityMatrix(): Record<string, string[]>
}

class SmartCodeRouterV2 implements SmartCodeRouter {
  private readonly V1_PATTERN = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.[vV]1$/
  private readonly V2_PATTERN = /^HERA\.ACCOUNTING\.[A-Z0-9]{2,10}(?:\.[A-Z0-9_]{2,15}){2,6}\.v2$/
  
  route(smartCode: string): 'v1' | 'v2' | 'unsupported' {
    if (this.V2_PATTERN.test(smartCode)) return 'v2'
    if (this.V1_PATTERN.test(smartCode)) return 'v1'
    return 'unsupported'
  }
  
  // Migration mapping for backward compatibility
  private readonly MIGRATION_MAP = new Map([
    ['HERA.SALON.FINANCE.TXN.REVENUE.SERVICE.V1', 'HERA.ACCOUNTING.AR.TXN.INVOICE.v2'],
    ['HERA.SALON.FINANCE.TXN.EXPENSE.SALARY.V1', 'HERA.ACCOUNTING.HR.TXN.PAYROLL.v2'],
    ['HERA.SALON.FINANCE.JE.AUTO.POSTING.V1', 'HERA.ACCOUNTING.GL.TXN.AUTO_JOURNAL.v2']
  ])
}
```

### **Policy-as-Data Architecture**
```typescript
interface PostingRuleV2 {
  smart_code: string
  rule_version: 'v2'
  conditions: {
    ai_confidence_min: number
    fiscal_period_status: 'open' | 'closed' | 'any'
    amount_threshold?: number
    currency_restrictions?: string[]
    module_permissions?: string[]
  }
  posting_recipe: {
    debit_account_derivation: string
    credit_account_derivation: string
    allocation_rules?: AllocationRule[]
    fx_handling?: FXHandlingRule
  }
  approval_workflow: {
    auto_approve_conditions: string
    manager_approval_conditions: string
    owner_approval_conditions: string
    rejection_conditions: string
  }
  ai_enhancement: {
    enable_learning: boolean
    confidence_boost_factors: Record<string, number>
    anomaly_detection: boolean
  }
  fiscal_integration: {
    period_validation_required: boolean
    yearend_adjustments: boolean
    consolidation_eligible: boolean
  }
}
```

---

## 📊 Performance Architecture Design

### **Caching Strategy**
```typescript
interface CacheStrategy {
  // Account lookup cache (high frequency)
  account_cache: {
    ttl: 600,     // 10 minutes
    max_size: 10000,
    preload: true,
    invalidation: 'on_account_change'
  }
  
  // Fiscal period cache (moderate frequency)
  fiscal_period_cache: {
    ttl: 3600,    // 1 hour
    max_size: 100,
    preload: true,
    invalidation: 'on_period_change'
  }
  
  // Posting rules cache (low frequency)
  posting_rules_cache: {
    ttl: 86400,   // 24 hours
    max_size: 1000,
    preload: false,
    invalidation: 'on_rule_change'
  }
}
```

### **Database Connection Optimization**
```typescript
interface DatabaseOptimization {
  connection_pooling: {
    min_connections: 5,
    max_connections: 20,
    connection_timeout: 30000,
    idle_timeout: 600000
  }
  
  query_optimization: {
    prepared_statements: true,
    batch_operations: true,
    parallel_execution: true,
    max_parallel_queries: 4
  }
  
  index_strategy: {
    hot_path_indexes: true,
    composite_indexes: true,
    partial_indexes: true,
    index_monitoring: true
  }
}
```

---

## 🎯 Success Criteria

### **Technical Requirements**
- ✅ **Zero Breaking Changes**: All v1 functionality preserved
- ✅ **Performance Improvement**: 40%+ faster than v1
- ✅ **PostgreSQL Integration**: Full use of views and RPC functions
- ✅ **AI Enhancement**: Dynamic confidence scoring
- ✅ **Fiscal Integration**: Complete period management
- ✅ **Multi-Currency**: Advanced FX handling

### **Business Requirements**
- ✅ **90%+ Automation**: Reduced manual intervention
- ✅ **Real-time Validation**: Immediate error detection
- ✅ **Audit Compliance**: Complete trail with Smart Codes
- ✅ **Scalability**: Support for enterprise volumes
- ✅ **Flexibility**: Policy-as-data configuration

### **Operational Requirements**
- ✅ **Feature Flag Control**: Organization-level rollout
- ✅ **Rollback Capability**: Immediate recovery options
- ✅ **Monitoring Integration**: Complete observability
- ✅ **Documentation**: Auto-generated from code
- ✅ **Training**: Seamless transition for users

---

## 🚀 Phase 2 Preview

### **Next Steps:**
1. **Create Policy Seeds**: Implement posting rules in `core_dynamic_data`
2. **COA Derivation Maps**: Account mapping tables and functions
3. **Fiscal Policy Configuration**: Period management rules
4. **Seed Runner Scripts**: Idempotent deployment automation
5. **Testing Framework**: Comprehensive validation suite

---

**🔐 End of Target Design**  
**Document Classification:** Internal Development Team Only  
**Last Updated:** December 2024  
**Next Phase:** Policy-as-Data Seeds Implementation