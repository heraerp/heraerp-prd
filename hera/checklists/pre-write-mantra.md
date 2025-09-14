# HERA Pre-Write Mantra

## Repeat Before Writing Any Code:

```
✓ Six tables only, no schema changes
✓ Types resolved from catalog; slugs lower_snake  
✓ Lifecycles & rule packs respected
✓ All writes include organization_id
✓ Transactions: header + lines, balanced if financial
✓ Emit audit JSON & tests
```

## Expanded Checks:

### ✓ Six tables only, no schema changes
```sql
-- ONLY these tables exist:
core_organizations       -- WHO
core_entities           -- WHAT  
core_dynamic_data       -- HOW
core_relationships      -- WHY
universal_transactions  -- WHEN (header)
universal_transaction_lines -- DETAILS
```

### ✓ Types resolved from catalog; slugs lower_snake
```typescript
// WRONG
entity_type: "Customer VIP"      // ❌
entity_code: "CUST-001"         // ❌

// CORRECT  
entity_type: "customer"         // ✓
entity_code: "customer_001"     // ✓
```

### ✓ Lifecycles & rule packs respected
```sql
-- WRONG
UPDATE core_entities SET status = 'active' -- ❌

-- CORRECT
INSERT INTO core_relationships (
  from_entity_id, to_entity_id, 
  relationship_type, organization_id
) VALUES ($1, $2, 'has_status', $3) -- ✓
```

### ✓ All writes include organization_id
```sql
-- EVERY write operation:
INSERT INTO table (..., organization_id) VALUES (..., $org_id)
UPDATE table SET ... WHERE organization_id = $org_id AND ...
DELETE FROM table WHERE organization_id = $org_id AND ...
```

### ✓ Transactions: header + lines, balanced if financial
```sql
-- Pattern for every business transaction:
INSERT INTO universal_transactions (...) RETURNING id; -- Header
INSERT INTO universal_transaction_lines (transaction_id, ...); -- Lines

-- Financial must balance:
SELECT SUM(debit_amount) = SUM(credit_amount) -- Must be true
```

### ✓ Emit audit JSON & tests
```typescript
// Every procedure must:
metadata: {
  procedure: 'HERA.SALES.ORDER.CREATE.v1',
  timestamp: new Date(),
  user_id: currentUser,
  inputs: sanitizedInputs,
  outputs: { transaction_id, line_count }
}

// With test cases:
{
  input: { ... },
  expected: { 
    header: { ... },
    lines: [ ... ]
  }
}
```