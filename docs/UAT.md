# UAT (User Acceptance Testing) Guide

## Overview

This guide provides step-by-step instructions for testing the HERA Ledger Engine with global posting scenarios. All tests use the simulate endpoint first to verify journal generation before posting.

## Prerequisites

1. Database with 6-table schema
2. GL accounts created and marked as postable
3. Seeds ready to apply
4. API endpoint accessible

## Step 1: Load Accounts

Create the necessary GL accounts:

```sql
-- Revenue Account
INSERT INTO core_entities (entity_type, entity_code, entity_name, smart_code, business_rules, organization_id, status)
VALUES ('account', '4100', 'Sales Revenue', 'HERA.GL.ACCOUNT.REVENUE.SALES.v1', 
  '{"ledger_type":"GL","account_type":"revenue","normal_balance":"credit","is_postable":true}'::jsonb, 
  :org, 'active');

-- Tax Payable Account  
INSERT INTO core_entities (entity_type, entity_code, entity_name, smart_code, business_rules, organization_id, status)
VALUES ('account', '2200', 'Tax Payable', 'HERA.GL.ACCOUNT.TAX.OUTPUT.v1',
  '{"ledger_type":"GL","account_type":"liability","normal_balance":"credit","is_postable":true}'::jsonb,
  :org, 'active');

-- Tips Payable Account
INSERT INTO core_entities (entity_type, entity_code, entity_name, smart_code, business_rules, organization_id, status)
VALUES ('account', '2300', 'Tips Payable', 'HERA.GL.ACCOUNT.TIPS.v1',
  '{"ledger_type":"GL","account_type":"liability","normal_balance":"credit","is_postable":true}'::jsonb,
  :org, 'active');

-- Clearing Account
INSERT INTO core_entities (entity_type, entity_code, entity_name, smart_code, business_rules, organization_id, status)
VALUES ('account', '1100', 'Card Clearing', 'HERA.GL.ACCOUNT.CLEARING.v1',
  '{"ledger_type":"GL","account_type":"asset","normal_balance":"debit","is_postable":true}'::jsonb,
  :org, 'active');

-- Payment Fees Account
INSERT INTO core_entities (entity_type, entity_code, entity_name, smart_code, business_rules, organization_id, status)
VALUES ('account', '5500', 'Payment Processing Fees', 'HERA.GL.ACCOUNT.FEES.v1',
  '{"ledger_type":"GL","account_type":"expense","normal_balance":"debit","is_postable":true}'::jsonb,
  :org, 'active');
```

## Step 2: Create Posting Schema

Apply seed 10 with DSL JSON:

```json
{
  "ledgers": ["GL"],
  "accounts": {
    "revenue": "[UUID of account 4100]",
    "tax_output": "[UUID of account 2200]",
    "tips_payable": "[UUID of account 2300]",
    "clearing": "[UUID of account 1100]",
    "fees": "[UUID of account 5500]"
  },
  "tax": {
    "profile_ref": "[UUID from Step 3]",
    "inclusive_prices": true,
    "rounding": "line"
  },
  "splits": {
    "dimensions": ["org_unit", "staff_id"],
    "rules": [
      {
        "event_pattern": "HERA\\\\.POS\\\\..*",
        "split_by": "staff_id",
        "allocation_method": "proportional"
      }
    ]
  },
  "dimension_requirements": [
    {
      "account_pattern": "^4.*",
      "required_dimensions": ["org_unit", "staff_id"],
      "enforcement": "error"
    }
  ],
  "payments": {
    "capture_type": "immediate",
    "open_item": false
  }
}
```

## Step 3: Install Tax Profile

Apply seeds 01-03 to create and bind tax profile with 5% standard rate.

## Step 4: Test Scenarios

### Scenario 1: Sale + Tip + Tax (Inclusive)

**Request:**
```json
POST /ledger/simulate
{
  "organization_id": "your-org-id",
  "event_smart_code": "HERA.POS.SALE.V1",
  "total_amount": 105.00,
  "currency": "USD",
  "business_context": {
    "sale_amount": 100.00,
    "tip_amount": 5.00,
    "tax_inclusive": true,
    "org_unit": "BR-01",
    "staff_id": "EMP-001",
    "order_id": "ORD-2025-001"
  }
}
```

**Expected Response:**
- Debit: Clearing $105.00
- Credit: Revenue $95.24 (with dimensions)
- Credit: Tax $4.76
- Credit: Tips $5.00
- **Balance Check**: Total debits = Total credits = $105.00

### Scenario 2: Sale with Exclusive Tax

**Request:**
```json
POST /ledger/simulate
{
  "organization_id": "your-org-id",
  "event_smart_code": "HERA.POS.SALE.V1",
  "total_amount": 105.00,
  "currency": "EUR",
  "business_context": {
    "sale_amount": 100.00,
    "tax_amount": 5.00,
    "tax_inclusive": false,
    "org_unit": "BR-02",
    "staff_id": "EMP-002"
  }
}
```

**Expected Response:**
- Debit: Clearing €105.00
- Credit: Revenue €100.00 (with dimensions)
- Credit: Tax €5.00
- **Balance Check**: Total debits = Total credits = €105.00

### Scenario 3: Multi-Staff Split

**Request:**
```json
POST /ledger/simulate
{
  "organization_id": "your-org-id",
  "event_smart_code": "HERA.POS.SALE.V1",
  "total_amount": 200.00,
  "currency": "GBP",
  "business_context": {
    "org_unit": "BR-01",
    "items": [
      { "amount": 120.00, "staff_id": "EMP-001" },
      { "amount": 80.00, "staff_id": "EMP-002" }
    ]
  }
}
```

**Expected Response:**
- Debit: Clearing £200.00
- Credit: Revenue £114.29 (staff: EMP-001)
- Credit: Revenue £76.19 (staff: EMP-002)
- Credit: Tax £9.52
- **Balance Check**: Total = £200.00, Split 60%/40%

### Scenario 4: Refund

**Request:**
```json
POST /ledger/simulate
{
  "organization_id": "your-org-id",
  "event_smart_code": "HERA.POS.REFUND.V1",
  "total_amount": -52.50,
  "currency": "USD",
  "business_context": {
    "original_order_id": "ORD-2025-001",
    "refund_reason": "Customer complaint",
    "org_unit": "BR-01",
    "staff_id": "MGR-001"
  }
}
```

**Expected Response:**
- Credit: Clearing $52.50 (opposite of sale)
- Debit: Revenue $50.00 (opposite of sale)
- Debit: Tax $2.50 (opposite of sale)
- **Note**: Debits and credits are reversed for refunds

### Scenario 5: Idempotency Test

**Request 1:**
```json
POST /ledger/simulate
{
  "organization_id": "your-org-id",
  "event_smart_code": "HERA.POS.SALE.V1",
  "total_amount": 75.00,
  "currency": "USD",
  "external_reference": "IDEMPOTENT-TEST-001",
  "business_context": {
    "org_unit": "BR-01",
    "staff_id": "EMP-001"
  }
}
```

**Request 2 (same external_reference):**
Same request body

**Validation**: Both responses should be identical

## Step 5: Post Golden Scenario

After successful simulation, post one transaction:

```json
POST /ledger/post
{
  "organization_id": "your-org-id",
  "event_smart_code": "HERA.POS.SALE.V1",
  "total_amount": 105.00,
  "currency": "USD",
  "external_reference": "GOLDEN-001",
  "business_context": {
    "sale_amount": 100.00,
    "tip_amount": 5.00,
    "tax_inclusive": true,
    "org_unit": "BR-01",
    "staff_id": "EMP-001",
    "order_id": "ORD-GOLDEN-001"
  }
}
```

**Expected**: 
- Returns `transaction_id`
- Creates 1 row in `universal_transactions`
- Creates 4 rows in `universal_transaction_lines`

## Validation Checklist

- [ ] All scenarios produce balanced journals
- [ ] Dimensions appear on revenue lines
- [ ] Tax calculations match expected rates
- [ ] Refunds mirror sales with opposite signs
- [ ] Idempotency returns consistent results
- [ ] Posted transaction appears in database
- [ ] All amounts reconcile to original request

## Troubleshooting

### Missing Dimensions Error
```json
{
  "code": "E_DIM_MISSING",
  "message": "Required dimensions are missing",
  "details": {
    "missingByLine": [{"lineIndex": 1, "missing": ["org_unit", "staff_id"]}]
  }
}
```
**Fix**: Include required dimensions in business_context

### Unbalanced Journal Error
```json
{
  "code": "E_UNBALANCED",
  "message": "Journal entry is not balanced"
}
```
**Fix**: Verify tax calculations and rounding

### Schema Not Found Error
```json
{
  "code": "E_SCHEMA",
  "message": "No posting schema found for event"
}
```
**Fix**: Ensure posting schema is bound to event via seed 11