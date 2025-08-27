# Account Mapping Guide

## Overview

The posting schema DSL requires mapping account keys to actual GL account entity IDs in `core_entities`. This guide explains how to set up and map accounts correctly.

## Account Keys in DSL

The posting schema `accounts` object uses these standard keys:

```json
{
  "accounts": {
    "revenue": "uuid-of-revenue-account",
    "tax_output": "uuid-of-tax-payable-account", 
    "tips_payable": "uuid-of-tips-payable-account",
    "clearing": "uuid-of-clearing-account",
    "fees": "uuid-of-payment-fees-account",
    "discount": "uuid-of-discount-account",
    "rounding": "uuid-of-rounding-account"
  }
}
```

## Account Setup Checklist

### 1. Create Parent Accounts (Non-Postable)
```sql
-- Example: Revenue parent account
INSERT INTO core_entities (
    entity_type,
    entity_code,
    entity_name,
    smart_code,
    business_rules,
    organization_id,
    status
) VALUES (
    'account',
    '4000',
    'Revenue',
    'HERA.GL.ACCOUNT.REVENUE.v1',
    jsonb_build_object(
        'ledger_type', 'GL',
        'account_type', 'revenue',
        'normal_balance', 'credit',
        'is_postable', false,
        'hierarchy_level', 1
    ),
    :org,
    'active'
);
```

### 2. Create Postable Leaf Accounts
```sql
-- Example: Sales Revenue (postable)
INSERT INTO core_entities (
    entity_type,
    entity_code,
    entity_name,
    smart_code,
    business_rules,
    organization_id,
    status
) VALUES (
    'account',
    '4100',
    'Sales Revenue',
    'HERA.GL.ACCOUNT.REVENUE.SALES.v1',
    jsonb_build_object(
        'ledger_type', 'GL',
        'account_type', 'revenue',
        'normal_balance', 'credit',
        'is_postable', true,
        'hierarchy_level', 2,
        'parent_code', '4000'
    ),
    :org,
    'active'
) RETURNING id; -- Use this ID in accounts.revenue
```

## Normal Balance Reference

| Account Type | Normal Balance | Examples |
|--------------|----------------|----------|
| Asset | Debit | Cash, Inventory, Receivables |
| Liability | Credit | Payables, Tax Payable, Tips Payable |
| Revenue | Credit | Sales, Service Income |
| Expense | Debit | COGS, Salaries, Fees |
| Equity | Credit | Capital, Retained Earnings |

## Mapping Requirements

### Required Accounts

1. **revenue** - Where sales income is credited
   - Account code pattern: 4xxx
   - Normal balance: Credit
   - Must be postable

2. **tax_output** - Tax collected from customers
   - Account code pattern: 2xxx (liability)
   - Normal balance: Credit
   - Must be postable

3. **clearing** - Temporary holding for payments
   - Account code pattern: 1xxx (asset)
   - Normal balance: Debit
   - Must be postable

### Optional Accounts

4. **tips_payable** - Tips owed to staff
   - Account code pattern: 2xxx (liability)
   - Normal balance: Credit

5. **fees** - Payment processing fees
   - Account code pattern: 5xxx (expense)
   - Normal balance: Debit

6. **discount** - Sales discounts given
   - Account code pattern: 4xxx (contra-revenue)
   - Normal balance: Debit

7. **rounding** - Rounding differences
   - Account code pattern: 6xxx (expense)
   - Normal balance: Debit

## Example Query to Find Account IDs

```sql
-- Find all postable GL accounts
SELECT 
    id,
    entity_code,
    entity_name,
    business_rules->>'account_type' as account_type,
    business_rules->>'normal_balance' as normal_balance
FROM core_entities
WHERE entity_type = 'account'
AND business_rules->>'ledger_type' = 'GL'
AND business_rules->>'is_postable' = 'true'
AND organization_id = :org
ORDER BY entity_code;
```

## Validation

Before using accounts in posting schema:

1. ✅ Account exists in `core_entities`
2. ✅ `entity_type = 'account'`
3. ✅ `business_rules.is_postable = true`
4. ✅ `status = 'active'`
5. ✅ Correct `normal_balance` for account type
6. ✅ Proper `organization_id` set