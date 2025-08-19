# 📋 HERA Schema Migration Guide

**Quick reference for updating code to use correct column names**

## 🔄 Column Name Updates

### Universal Transactions Table

| ❌ OLD (Documentation) | ✅ NEW (Actual Schema) | Usage |
|------------------------|------------------------|-------|
| `transaction_number` | `transaction_code` | Unique transaction identifier |
| `source_entity_id` | `from_entity_id` | Entity initiating transaction |
| `target_entity_id` | `to_entity_id` | Entity receiving transaction |
| `reference_entity_id` | Use `from_entity_id` or `to_entity_id` | Context-dependent |

### Core Relationships Table

| ❌ OLD (Documentation) | ✅ NEW (Actual Schema) | Usage |
|------------------------|------------------------|-------|
| `parent_entity_id` | `from_entity_id` | Source entity in relationship |
| `child_entity_id` | `to_entity_id` | Target entity in relationship |

### Status Fields

| ❌ OLD (Anti-pattern) | ✅ NEW (Universal Pattern) | Implementation |
|----------------------|----------------------------|----------------|
| `status` column | Relationship to status entity | See status workflow below |
| `approval_status` | Relationship to approval entity | Use relationships |
| `workflow_state` | Relationship to state entity | Never add columns |

## 🔍 How to Verify Schema

```bash
# Check all table schemas
cd mcp-server
node check-schema.js

# Check specific table
node hera-cli.js show-schema universal_transactions
node hera-cli.js show-schema core_relationships
```

## 💻 Code Migration Examples

### Transaction Creation

```javascript
// ❌ OLD CODE
const transaction = {
  transaction_number: 'TXN-001',
  source_entity_id: customerId,
  target_entity_id: vendorId,
  reference_entity_id: orderId,
  status: 'pending'  // WRONG!
}

// ✅ NEW CODE
const transaction = {
  transaction_code: 'TXN-001',
  from_entity_id: customerId,
  to_entity_id: vendorId,
  // No status column!
  organization_id: orgId,
  transaction_type: 'purchase',
  total_amount: 1000.00
}

// Handle status via relationship
await createRelationship({
  from_entity_id: transaction.id,
  to_entity_id: pendingStatusEntityId,
  relationship_type: 'has_status'
})
```

### Relationship Creation

```javascript
// ❌ OLD CODE
const relationship = {
  parent_entity_id: categoryId,
  child_entity_id: productId,
  relationship_type: 'contains'
}

// ✅ NEW CODE
const relationship = {
  from_entity_id: categoryId,
  to_entity_id: productId,
  relationship_type: 'contains',
  organization_id: orgId
}
```

### Status Workflows

```javascript
// ❌ OLD CODE - NEVER DO THIS!
UPDATE core_entities SET status = 'active' WHERE id = ?
UPDATE universal_transactions SET status = 'completed' WHERE id = ?

// ✅ NEW CODE - Use Relationships
// 1. Create status entities (one-time setup)
const statuses = ['draft', 'pending', 'approved', 'rejected', 'completed']
for (const status of statuses) {
  await createEntity({
    entity_type: 'workflow_status',
    entity_name: `${status} Status`,
    entity_code: `STATUS-${status.toUpperCase()}`,
    organization_id: orgId
  })
}

// 2. Assign status via relationship
await createRelationship({
  from_entity_id: entityId,
  to_entity_id: statusEntityId,
  relationship_type: 'has_status',
  organization_id: orgId,
  metadata: {
    assigned_at: new Date(),
    assigned_by: userId
  }
})

// 3. Query with status
const query = `
  SELECT 
    e.*,
    s.entity_name as current_status,
    r.metadata->>'assigned_at' as status_date
  FROM core_entities e
  LEFT JOIN core_relationships r 
    ON e.id = r.from_entity_id 
    AND r.relationship_type = 'has_status'
  LEFT JOIN core_entities s 
    ON r.to_entity_id = s.id
  WHERE e.organization_id = $1
`
```

## 🔧 Universal API Client Updates

```javascript
// The Universal API client handles most of these automatically
import { universalApi } from '@/lib/universal-api'

// Transaction creation - uses correct columns
await universalApi.createTransaction({
  transaction_type: 'sale',
  total_amount: 1000.00
  // API handles column mapping
})

// Relationship creation - uses correct columns
await universalApi.createRelationship(
  entityId1,
  entityId2,
  'has_parent'
  // API uses from_entity_id/to_entity_id
)
```

## 📚 Status Pattern Deep Dive

### Why No Status Columns?

1. **Audit Trail**: Relationships track when/who changed status
2. **Multiple States**: Entity can have multiple status types
3. **History**: Complete status history preserved
4. **Flexibility**: Add new statuses without schema changes
5. **Universal**: Same pattern works for all entities

### Complete Status Example

```bash
# Learn the pattern interactively
node status-workflow-example.js

# This demonstrates:
# - Creating status entities
# - Assigning statuses
# - Changing statuses
# - Querying with status
# - Status history
```

## ⚡ Quick Migration Checklist

- [ ] Run `node check-schema.js` to see actual columns
- [ ] Update transaction code: `transaction_number` → `transaction_code`
- [ ] Update relationships: `parent/child` → `from/to`
- [ ] Remove ALL status columns - use relationships
- [ ] Add `organization_id` to all queries
- [ ] Test with CLI tools before deploying

## 🚨 Common Migration Errors

### Error: `column "transaction_number" does not exist`
```bash
# Fix: Use transaction_code
# Verify: node hera-cli.js show-schema universal_transactions
```

### Error: `column "parent_entity_id" does not exist`
```bash
# Fix: Use from_entity_id
# Verify: node hera-cli.js show-schema core_relationships
```

### Error: `column "status" does not exist`
```bash
# Fix: Use relationships pattern
# Learn: node status-workflow-example.js
```

## 🎯 Final Verification

After migration, verify your code works:

```bash
# Test entity creation
node hera-cli.js create-entity test "Migration Test"

# Test transaction creation
node hera-cli.js create-transaction test 100

# Test queries
node hera-query.js summary

# If all work, your migration is complete! 🎉
```

---

Remember: When in doubt, always check the actual schema with `node check-schema.js`!