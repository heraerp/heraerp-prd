# HERA Anti-Drift Checklist

## Before Writing Any Code, Verify:

☐ **Six tables only, no schema changes**
  - core_organizations, core_entities, core_dynamic_data
  - core_relationships, universal_transactions, universal_transaction_lines
  - NO new tables, NO new columns, NO migrations

☐ **Types resolved from catalog; slugs lower_snake**
  - entity_type exists in catalog before creating entity
  - transaction_type exists in catalog before creating transaction
  - All codes use lowercase_snake_case (e.g., `customer_vip`, `sales_order`)

☐ **Lifecycles & rule packs respected**
  - Status via relationships (never status columns)
  - Smart codes drive business rules
  - Lifecycle transitions defined in catalog metadata

☐ **All writes include organization_id**
  - Every INSERT has organization_id
  - Every UPDATE/DELETE filtered by organization_id
  - Never cross-organization queries without explicit intent

☐ **Transactions: header + lines, balanced if financial**
  - Business activity = universal_transactions + universal_transaction_lines
  - Financial transactions: sum(debits) = sum(credits)
  - Line items reference valid header transaction_id

☐ **Emit audit JSON & tests**
  - All procedures log to audit trail
  - Test cases with input → expected output
  - Metadata includes relevant business context

## Quick Validation Commands

```sql
-- Check if entity type exists
SELECT * FROM core_entities 
WHERE organization_id = $1 
  AND entity_type = 'entity_type_catalog'
  AND entity_code = $2;

-- Verify transaction balances
SELECT transaction_id, 
       SUM(debit_amount) as debits,
       SUM(credit_amount) as credits
FROM universal_transaction_lines
WHERE transaction_id = $1
GROUP BY transaction_id
HAVING SUM(debit_amount) != SUM(credit_amount);

-- Check organization isolation
-- This should NEVER return data from other orgs
SELECT DISTINCT organization_id 
FROM universal_transactions 
WHERE id = $1;
```

## Smart Code Validation Pattern
```regex
^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v[0-9]+$
```

## Remember: TEVL Always
1. **Teach**: State these 6 checks
2. **Execute**: Write code following checks
3. **Verify**: Run through checklist again
4. **Log**: Save procedure + tests