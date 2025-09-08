# 🔐 HERA Transaction Enforcement System

**Smart Code**: `HERA.DOCS.ENFORCEMENT.GUIDE.v1`

## Overview

The HERA Transaction Enforcement System **guarantees** that every transaction uses proper Chart of Accounts (COA) and generates appropriate document numbers. This system operates at multiple levels to ensure absolute compliance.

## 🏛️ Sacred Enforcement Principles

### **1. Sacred Foundation: No Transactions Without COA**
```sql
-- Database-level enforcement
RAISE EXCEPTION 'Organization does not have Chart of Accounts'
```

### **2. Sacred Documentation: Every Transaction Has Numbers**
```typescript
// Auto-generated document numbers
{
  transaction_number: "TXN-1725789123456",    // System unique ID
  reference_number: "JE-2025-09-001",        // Business document number
  external_reference: "SALON-1725789123"     // Industry-specific reference
}
```

### **3. Sacred GL Integrity: Every Line Links to COA**
```sql
-- Trigger validates GL account exists
IF NOT EXISTS (SELECT 1 FROM core_entities WHERE entity_code = NEW.gl_account_code)
THEN RAISE EXCEPTION 'GL account not found in COA'
```

## 🚀 Implementation Levels

### **Level 1: Database Triggers (Absolute Enforcement)**

**Location**: `/database/functions/triggers/transaction-enforcement-trigger.sql`

**Capabilities**:
- ✅ Blocks transactions if COA doesn't exist
- ✅ Auto-generates document numbers if missing  
- ✅ Validates GL accounts in transaction lines
- ✅ Enforces smart code patterns
- ✅ Maintains audit trail

**Example Database Error**:
```sql
ERROR: HERA_ENFORCEMENT_ERROR: Organization does not have Chart of Accounts
```

### **Level 2: API Middleware (Business Logic Enforcement)**

**Location**: `/src/lib/coa-document-enforcement.ts`

**Capabilities**:
- ✅ Pre-validates COA completeness
- ✅ Generates industry-specific document numbers
- ✅ Auto-assigns GL accounts based on smart codes
- ✅ Validates transaction lines before database
- ✅ Returns detailed validation results

**Usage**:
```typescript
import { enforceTransactionStandards } from '@/lib/coa-document-enforcement'

const result = await enforceTransactionStandards(
  organizationId,
  'journal_entry',
  'salon',
  lineItems
)

if (!result.valid) {
  throw new Error(`Enforcement failed: ${result.errors.join(', ')}`)
}

// Use result.documentNumbers and result.enhancedLines
```

### **Level 3: API Endpoint (Validation Service)**

**Location**: `/src/app/api/v1/universal/enforce/route.ts`

**Endpoints**:
```bash
# Validate transaction before processing
POST /api/v1/universal/enforce
{
  "organizationId": "uuid",
  "transactionType": "journal_entry", 
  "businessType": "salon",
  "lineItems": [...],
  "validateOnly": true
}

# Check organization enforcement status
GET /api/v1/universal/enforce?organizationId=uuid&businessType=salon
```

## 📋 Document Number Formats

### **System Transaction Numbers**
| Format | Example | Purpose |
|--------|---------|---------|
| `TXN-{timestamp}` | `TXN-1725789123456` | Unique system identifier |
| `{PREFIX}-{uuid}` | `JE-a1b2c3d4` | Short UUID for manual reference |

### **Business Reference Numbers**
| Transaction Type | Format | Example |
|------------------|--------|---------|
| **Journal Entry** | `JE-YYYY-MM-NNN` | `JE-2025-09-001` |
| **Sales Invoice** | `INV-YYYYMMDD-NNN` | `INV-20250908-001` |
| **Purchase Order** | `PO-YYYY-NNNN` | `PO-2025-0001` |
| **Payment** | `PAY-YYYYMM-NNN` | `PAY-202509-001` |
| **Receipt** | `RCP-YYYYMM-NNN` | `RCP-202509-001` |

### **Industry-Specific References**
| Business Type | Format | Example |
|---------------|--------|---------|
| **Salon** | `SALON-{timestamp}` | `SALON-1725789123` |
| **Restaurant** | `REST-{timestamp}` | `REST-1725789123` |
| **Healthcare** | `MED-{timestamp}` | `MED-1725789123` |

## 🏗️ COA Validation Requirements

### **Universal Required Accounts**
Every organization MUST have these account categories:

| Category | Account Range | Required Accounts | Purpose |
|----------|---------------|-------------------|---------|
| **Cash & Bank** | `11xxxxx` | `1100000` | Cash and equivalents |
| **Payables** | `21xxxxx` | `2100000` | Accounts payable |
| **Revenue** | `41xxxxx` | `4110000` | Primary revenue |
| **Expenses** | `51xxxxx` | `5130000` | Operating expenses |

### **Business-Specific Required Accounts**

#### **Salon Industry**
| Account Code | Account Name | Purpose |
|--------------|--------------|---------|
| `4110000` | Service Revenue | Haircut/beauty services |
| `2400000` | VAT Payable | Sales tax on services |
| `5110000` | Commission Expense | Stylist commissions |

#### **Restaurant Industry**  
| Account Code | Account Name | Purpose |
|--------------|--------------|---------|
| `4110000` | Food Sales | Primary food revenue |
| `5210000` | Cost of Food Sales | Food costs |
| `2400000` | Sales Tax Payable | Sales tax |

#### **Healthcare Industry**
| Account Code | Account Name | Purpose |
|--------------|--------------|---------|
| `4210000` | Patient Service Revenue | Medical services |
| `1210000` | Patient Receivables | Outstanding patient bills |
| `2310000` | Insurance Payables | Insurance processing |

## ⚡ Automatic GL Account Assignment

### **Smart Code → GL Account Mapping**

```typescript
const smartCodeMappings = {
  'HERA.SALON.SALE': {
    'DEBIT': { account_code: '1100000', account_type: 'cash' },
    'CREDIT': { account_code: '4110000', account_type: 'service_revenue' }
  },
  'HERA.RESTAURANT.SALE': {
    'DEBIT': { account_code: '1100000', account_type: 'cash' },
    'CREDIT': { account_code: '4110000', account_type: 'food_sales' }
  },
  'HERA.EXPENSE': {
    'DEBIT': { account_code: '5130000', account_type: 'operating_expense' },
    'CREDIT': { account_code: '2100000', account_type: 'accounts_payable' }
  }
}
```

### **Account Type Auto-Detection**
| Account Code Pattern | Account Type | Auto-Assignment |
|---------------------|--------------|-----------------|
| `1xxxxxx` | Asset | Cash, receivables, inventory |
| `2xxxxxx` | Liability | Payables, accruals, taxes |
| `3xxxxxx` | Equity | Capital, retained earnings |
| `4xxxxxx` | Revenue | Sales, services, other income |
| `5xxxxxx` | Expense | Operating costs, COGS |

## 🔧 Usage in Application Code

### **Digital Accountant Integration**

```typescript
// In salon digital accountant
const result = await fetch('/api/v1/universal/enforce', {
  method: 'POST',
  body: JSON.stringify({
    organizationId: 'salon-uuid',
    transactionType: 'journal_entry',
    businessType: 'salon',
    lineItems: [{
      line_type: 'DEBIT',
      line_amount: 450,
      description: 'Cash received for services'
      // GL account auto-assigned based on transaction type
    }]
  })
})

// Use enforced document numbers and enhanced lines
const { document_numbers, enhanced_line_items } = result.data
```

### **Universal API Integration**

```typescript
import { universalApi } from '@/lib/universal-api'

// Enforcement happens automatically
const transaction = await universalApi.createTransaction({
  transaction_type: 'sale',
  smart_code: 'HERA.SALON.SALE.SERVICE.v1',
  total_amount: 450,
  organization_id: 'salon-uuid'
  // Document numbers and GL accounts enforced automatically
})
```

## 📊 Enforcement Status Monitoring

### **Check Organization Readiness**

```bash
# API call
GET /api/v1/universal/enforce?organizationId=salon-uuid

# Response
{
  "enforcement_status": {
    "coa_exists": true,
    "coa_complete": true,
    "missing_accounts": [],
    "ready_for_transactions": true,
    "document_numbering": "active"
  }
}
```

### **Database Function Check**

```sql
-- Check enforcement readiness
SELECT check_organization_enforcement_readiness('salon-uuid');

-- Result
{
  "coa_exists": true,
  "total_accounts": 47,
  "enforcement_ready": true,
  "missing_required_accounts": [],
  "last_checked": "2025-09-08T12:00:00Z"
}
```

## 🚨 Error Handling

### **Common Enforcement Errors**

| Error Code | Message | Resolution |
|------------|---------|------------|
| `HERA_ENFORCEMENT_ERROR` | Organization does not have Chart of Accounts | Run COA setup first |
| `HERA_ENFORCEMENT_ERROR` | Transaction number is required | Use enforceTransactionStandards() |
| `HERA_ENFORCEMENT_ERROR` | GL account not found in COA | Verify account exists or auto-assign |
| `HERA_ENFORCEMENT_ERROR` | Invalid smart_code pattern | Fix smart code format |

### **Error Recovery**

```typescript
try {
  const transaction = await createTransaction(data)
} catch (error) {
  if (error.message.includes('HERA_ENFORCEMENT_ERROR')) {
    // Handle enforcement errors
    if (error.message.includes('Chart of Accounts')) {
      await setupBusinessCOA(organizationId, businessType)
      // Retry transaction
    }
  }
}
```

## ✅ Implementation Checklist

### **For New Organizations**
- [ ] Create Chart of Accounts using Universal COA system
- [ ] Verify all required accounts exist
- [ ] Test enforcement API endpoint
- [ ] Configure document number sequences

### **For Existing Organizations** 
- [ ] Audit existing transactions for compliance
- [ ] Backfill missing document numbers
- [ ] Validate all GL account references
- [ ] Enable enforcement triggers

### **For Developers**
- [ ] Use enforceTransactionStandards() before all transaction creation
- [ ] Handle enforcement errors gracefully
- [ ] Test with organizations that have/don't have COA
- [ ] Monitor enforcement logs for issues

## 🎯 Benefits

### **Guaranteed Compliance**
- ✅ **100% COA Coverage**: No transactions without proper accounts
- ✅ **100% Documentation**: Every transaction has proper numbers
- ✅ **100% Auditability**: Complete trail from entry to GL posting

### **Business Intelligence**
- ✅ **Smart Code Integration**: Every transaction has business context
- ✅ **Industry Optimization**: Business-specific account assignments
- ✅ **Pattern Recognition**: AI-ready data structure

### **Operational Efficiency**
- ✅ **Zero Manual Setup**: Auto-generation and assignment
- ✅ **Error Prevention**: Database-level validation
- ✅ **Audit Readiness**: Built-in compliance and documentation

---

**This enforcement system makes HERA the ONLY ERP with guaranteed transaction compliance at the database level, ensuring perfect audit trails and business intelligence for every transaction.**