# HERA Entities CRUD v2 RPC Function - Test Results

**Test Date:** 2025-10-17
**Test User:** 09b0b92a-d797-489e-bc03-5ca0a6272674
**Test Organization:** 378f24fb-d496-4ff7-8afa-ea34895a0eb8

---

## 🔍 Executive Summary

Comprehensive testing of `hera_entities_crud_v2` RPC function revealed **critical bugs** and **missing functionality** that prevent it from being production-ready for relationship and transaction operations.

---

## ❌ CRITICAL BUG #1: Relationships Not Returned

### Issue Description
The RPC function **DOES NOT** return relationships even when explicitly requested with `include_relationships: true`.

### Test Evidence
- ✅ **Relationship exists in database** (verified via direct query)
- ❌ **RPC returns empty relationships field**: `relationships: {}`
- ❌ **Setting `include_relationships: true` has NO effect**

### Test Case
```javascript
// Request
{
  p_action: 'read',
  p_options: {
    where: { id: 'entity-uuid' },
    include_relationships: true  // ← Flag is ignored
  }
}

// Response
{
  items: [{
    id: 'entity-uuid',
    relationships: {}  // ← Always empty, even when relationships exist in DB
  }]
}
```

### Direct DB Verification
```javascript
// Direct query confirms relationship exists
SELECT * FROM core_relationships
WHERE from_entity_id = 'entity-uuid';

// Result: 1 relationship found ✅
{
  id: '3309deb3-1ce4-41d4-a68b-3a6331ec1cea',
  from_entity_id: 'e6e7eec8-b89c-4a30-a072-8b1f95420f9f',
  to_entity_id: '00ce52b0-a6c4-4f1c-b897-80c0f96e2257',
  relationship_type: 'TEST_RELATIONSHIP'
}
```

### Impact
🚨 **HIGH SEVERITY** - Applications cannot retrieve entity relationships, breaking:
- Status workflows (entities → status relationships)
- Entity hierarchies (parent-child relationships)
- Cross-entity references (customer → orders)
- Graph-based queries

---

## ❌ CRITICAL BUG #2: READ Operation Fails

### Issue Description
The READ action consistently fails with `READ_SELECTOR_REQUIRED` error.

### Test Evidence
```javascript
// Request
{
  p_action: 'read',
  p_entity: null,
  p_options: {
    where: { id: 'entity-uuid' }
  }
}

// Error Response
{
  code: '22023',
  message: 'READ_SELECTOR_REQUIRED'
}
```

### Impact
🚨 **CRITICAL** - Cannot read entities using the RPC function.

### Root Cause Analysis
The RPC function expects a different selector format than `p_options.where`. Possible correct formats:
1. `p_entity: { id: 'uuid' }` (rejected in our tests)
2. Different `p_options` structure
3. Undocumented selector parameter

---

## ❌ BUG #3: UPDATE Operation Fails

### Issue Description
UPDATE action fails with `ENTITY_ID_REQUIRED` error.

### Test Evidence
```javascript
// Request
{
  p_action: 'update',
  p_entity: {
    id: 'entity-uuid',
    entity_name: 'Updated Name'
  },
  p_options: {
    where: { id: 'entity-uuid' }
  }
}

// Error Response
{
  code: '22023',
  message: 'ENTITY_ID_REQUIRED'
}
```

### Impact
🚨 **HIGH SEVERITY** - Cannot update entities using the RPC function.

---

## ⚠️ LIMITATION: Transaction-Entity Relationships

### Issue Description
Cannot create relationships between transactions and entities because `universal_transactions` IDs are not valid `core_entities` IDs.

### Test Evidence
```javascript
// Attempt to link entity to transaction
INSERT INTO core_relationships (
  from_entity_id: 'entity-uuid',
  to_entity_id: 'transaction-uuid'  // ← Transaction ID
)

// Error Response
{
  code: '23503',
  message: 'insert or update on table "core_relationships" violates foreign key constraint "fk_cr_to_entity"',
  details: 'Key (to_entity_id)=(bc405a03-8932-43e4-82fd-6e74dcf76ebf) is not present in table "core_entities".'
}
```

### Schema Design Issue
- `core_relationships.from_entity_id` → FK to `core_entities.id` ✅
- `core_relationships.to_entity_id` → FK to `core_entities.id` ✅
- `universal_transactions.id` → **NOT in `core_entities`** ❌

### Implication
Transactions and entities exist in **separate silos** with no direct relationship capability.

### Workaround Options
1. Use `universal_transactions.source_entity_id` and `target_entity_id` fields
2. Create entity records that represent transactions
3. Use metadata/dynamic fields to reference transactions

---

## ✅ WORKING FEATURES

### 1. Entity Creation
```javascript
✅ CREATE action works correctly
✅ Returns created entity with all fields
✅ Supports dynamic fields via p_dynamic array
✅ Auto-generates smart_code if provided
```

### 2. Direct Table Access
```javascript
✅ Can query universal_transactions directly
✅ Can query universal_transaction_lines directly
✅ Can query core_entities directly
✅ Can query core_relationships directly
```

### 3. Transaction Creation
```javascript
✅ Can create transactions via direct insert
✅ Transaction fields available:
   - transaction_code (NOT transaction_number)
   - transaction_type
   - transaction_date
   - source_entity_id / target_entity_id
   - total_amount
   - transaction_status
```

### 4. Potential Transaction Creation via RPC
```javascript
✅ RPC accepts create_transaction in p_options
⚠️  Cannot verify if transaction was actually created (READ fails)
```

---

## 📋 Schema Corrections

### Universal Transactions Table
```typescript
// ❌ WRONG (from CLAUDE.md)
transaction_number: string

// ✅ CORRECT (actual schema)
transaction_code: string
```

### Core Relationships Table
```typescript
// ❌ WRONG (from CLAUDE.md)
source_entity_id: uuid
target_entity_id: uuid

// ✅ CORRECT (actual schema)
from_entity_id: uuid
to_entity_id: uuid
```

---

## 🔧 RPC Function Signature

```sql
hera_entities_crud_v2(
  p_action text,                 -- 'create', 'read', 'update', 'delete'
  p_actor_user_id uuid,          -- WHO is performing the action
  p_organization_id uuid,        -- Tenant boundary
  p_entity jsonb,                -- Entity data
  p_dynamic jsonb,               -- Dynamic fields array
  p_relationships jsonb,         -- Relationships array
  p_options jsonb                -- Operation options
)
```

---

## 🎯 Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Create Entity | ✅ PASS | Works correctly |
| Read Entity | ❌ FAIL | `READ_SELECTOR_REQUIRED` error |
| Update Entity | ❌ FAIL | `ENTITY_ID_REQUIRED` error |
| Delete Entity | ⚠️ UNTESTED | - |
| Include Relationships | ❌ FAIL | Always returns `{}` |
| Include Transactions | ❌ FAIL | No transaction data returned |
| Create + Transaction | ⚠️ UNKNOWN | Cannot verify (READ fails) |
| Transaction Table Access | ✅ PASS | Direct access works |
| Relationship Table Access | ✅ PASS | Direct access works |

---

## 🚨 Production Readiness Assessment

**Status: NOT PRODUCTION READY**

### Blocking Issues
1. ❌ Cannot read entities (READ fails)
2. ❌ Cannot update entities (UPDATE fails)
3. ❌ Cannot retrieve relationships (always returns empty)
4. ❌ Cannot link transactions to entities (FK constraint)

### Recommendations
1. **Fix READ operation** - Critical for any application
2. **Fix UPDATE operation** - Required for data management
3. **Fix relationship retrieval** - Required for status workflows
4. **Document correct selector format** - Developer experience
5. **Consider transaction-entity relationship strategy** - Architecture decision

### Alternative Approach
Until these bugs are fixed, use **direct table access** instead of the RPC function:

```javascript
// Instead of hera_entities_crud_v2
const { data } = await supabase
  .from('core_entities')
  .select(`
    *,
    relationships:core_relationships(*)
  `)
  .eq('id', entityId)
  .single()
```

---

## 📁 Test Files

- `test-entities-crud-v2-relationships.js` - Relationship retrieval tests
- `test-entities-crud-v2-transaction-access.js` - Transaction access tests
- `check-transaction-schema.js` - Schema verification utility

---

## 🔍 Next Steps

1. **Review RPC function source code** to identify bugs
2. **Fix relationship retrieval logic** in the RPC function
3. **Fix READ/UPDATE selector handling**
4. **Document correct usage patterns**
5. **Add comprehensive RPC function tests** to prevent regression
6. **Update CLAUDE.md** with correct field names

---

**Test Conducted By:** MCP Server Test Suite
**Test Files Location:** `/home/san/PRD/heraerp-prd/mcp-server/`
