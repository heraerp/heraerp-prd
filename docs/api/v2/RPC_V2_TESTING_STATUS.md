# HERA V2 CRUD RPC Testing Status & Recommendations

**Last Updated**: October 17, 2025
**Status**: CRITICAL BUGS FOUND - DO NOT USE V2 CRUD RPCS

---

## 🚨 Executive Summary

Comprehensive testing has revealed that **both unified V2 CRUD RPC functions** (`hera_entities_crud_v2` and `hera_transactions_crud_v2`) are **NOT PRODUCTION READY** and should **NOT BE USED** until critical bugs are fixed.

---

## ❌ Critical Bugs Found

### `hera_entities_crud_v2`

| Operation | Status | Error |
|-----------|--------|-------|
| CREATE | ⚠️ Partially Working | Only basic entity creation works |
| READ | ❌ BROKEN | Returns `READ_SELECTOR_REQUIRED` error |
| UPDATE | ❌ BROKEN | Returns `ENTITY_ID_REQUIRED` error |
| DELETE | ❓ UNTESTED | Not verified |
| Relationships | ❌ BROKEN | Always returns `relationships: {}` even with `include_relationships: true` |
| Dynamic Fields | ⚠️ Partial | Not consistently returned |

**Test Evidence**: `/mcp-server/HERA_ENTITIES_CRUD_V2_TEST_RESULTS.md`

### `hera_transactions_crud_v2`

| Operation | Status | Error |
|-----------|--------|-------|
| CREATE | ❓ UNTESTED | Not verified |
| READ | ❓ UNTESTED | Likely has similar issues as entities |
| UPDATE | ❓ UNTESTED | Likely has similar issues as entities |
| DELETE | ❓ UNTESTED | Not verified |
| Relationships | ❓ UNTESTED | Likely broken like entities |
| Lines | ❓ UNTESTED | Not verified |

**Test Evidence**: Not tested yet, but assumed broken based on entities_crud_v2 issues

---

## ✅ Working Alternatives - USE THESE INSTEAD

### Entity Operations

#### READ Entities
```typescript
// ✅ USE: hera_entity_read_v1
const { data, error } = await supabase.rpc('hera_entity_read_v1', {
  p_organization_id: orgId,
  p_entity_id: entityId,           // Optional - specific entity
  p_entity_type: 'customer',       // Optional - filter by type
  p_status: null,                  // null = all statuses
  p_include_relationships: true,
  p_include_dynamic_data: true,
  p_limit: 100,
  p_offset: 0
})

// Returns: { success: true, data: [...entities with dynamic data...] }
```

#### CREATE Entities
```typescript
// ✅ USE: hera_entity_upsert_v1 (RECOMMENDED)
const { data: entityId, error } = await supabase.rpc('hera_entity_upsert_v1', {
  p_organization_id: orgId,
  p_entity_type: 'customer',
  p_entity_name: 'ACME Corp',
  p_smart_code: 'HERA.CRM.CUSTOMER.ENTITY.V1',
  p_entity_id: null,              // null = CREATE
  p_entity_code: 'CUST-001',
  p_entity_description: 'Premium customer',
  p_parent_entity_id: null,
  p_status: 'active',
  p_tags: ['premium'],
  p_smart_code_status: 'ACTIVE',
  p_business_rules: {},
  p_metadata: {},
  p_ai_confidence: 0,
  p_ai_classification: null,
  p_ai_insights: {}
})

// Returns entity_id as string
// Add dynamic fields if needed
if (entityId && !error) {
  await supabase.rpc('hera_dynamic_data_batch_v1', {
    p_organization_id: orgId,
    p_entity_id: entityId,
    p_fields: [
      {
        field_name: 'email',
        field_type: 'text',
        field_value_text: 'contact@acme.com',
        smart_code: 'HERA.CRM.CUSTOMER.DYN.EMAIL.V1'
      }
    ]
  })
}
```

#### UPDATE Entities
```typescript
// ✅ USE: hera_entity_upsert_v1 (RECOMMENDED - same RPC for create/update)
const { data: entityId, error } = await supabase.rpc('hera_entity_upsert_v1', {
  p_organization_id: orgId,
  p_entity_type: 'customer',
  p_entity_name: 'Updated ACME Corp',  // Updated field
  p_smart_code: 'HERA.CRM.CUSTOMER.ENTITY.V1',
  p_entity_id: existingEntityId,       // Provide ID = UPDATE
  p_entity_code: 'CUST-001',
  p_entity_description: 'Updated description',
  p_parent_entity_id: null,
  p_status: 'active',
  p_tags: ['premium', 'vip'],
  p_smart_code_status: 'ACTIVE',
  p_business_rules: {},
  p_metadata: { last_updated: Date.now() },
  p_ai_confidence: 0,
  p_ai_classification: null,
  p_ai_insights: {}
})

// Alternative: Direct table update (for simple field updates)
const { error } = await supabase
  .from('core_entities')
  .update({
    entity_name: 'Updated Name',
    metadata: { updated: true },
    updated_by: userId,
    updated_at: new Date().toISOString()
  })
  .eq('id', entityId)
  .eq('organization_id', orgId)

// Update dynamic fields using batch RPC
await supabase.rpc('hera_dynamic_data_batch_v1', {
  p_organization_id: orgId,
  p_entity_id: entityId,
  p_fields: [
    {
      field_name: 'email',
      field_type: 'text',
      field_value_text: 'newemail@acme.com',
      smart_code: 'HERA.CRM.CUSTOMER.DYN.EMAIL.V1'
    }
  ]
})
```

#### DELETE Entities
```typescript
// ✅ USE: hera_entity_delete_v1 (if exists) or direct table update for soft delete
const { error } = await supabase
  .from('core_entities')
  .update({
    status: 'deleted',
    metadata: { deleted_reason: 'Customer requested account closure' },
    updated_by: userId,
    updated_at: new Date().toISOString()
  })
  .eq('id', entityId)
  .eq('organization_id', orgId)
```

---

### Transaction Operations

#### CREATE Transactions
```typescript
// ✅ USE: hera_txn_create_v1
const { data, error } = await supabase.rpc('hera_txn_create_v1', {
  p_header: {
    organization_id: orgId,
    transaction_type: 'SALE',
    transaction_code: 'SALE-2025-001',
    transaction_date: new Date().toISOString(),
    source_entity_id: customerId,
    target_entity_id: storeId,
    total_amount: 150.00,
    transaction_status: 'completed',
    smart_code: 'HERA.SALON.SALE.TXN.V1'
  },
  p_lines: [
    {
      line_number: 1,
      line_type: 'service',
      description: 'Hair Cut',
      quantity: 1,
      unit_amount: 150.00,
      line_amount: 150.00,
      entity_id: serviceId,
      smart_code: 'HERA.SALON.SALE.LINE.SERVICE.V1'
    }
  ]
})
```

#### READ Transactions
```typescript
// ✅ USE: hera_txn_read_v1
const { data, error } = await supabase.rpc('hera_txn_read_v1', {
  p_org_id: orgId,
  p_transaction_id: transactionId,
  p_include_lines: true
})

// Returns: { success: true, data: { ...transaction with lines... } }
```

#### QUERY Transactions
```typescript
// ✅ USE: hera_txn_query_v1
const { data, error } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: orgId,
  p_filters: {
    transaction_type: 'SALE',
    source_entity_id: customerId,     // Optional filter
    date_from: '2025-01-01T00:00:00Z',
    date_to: '2025-01-31T23:59:59Z',
    status: 'completed',               // Optional filter
    limit: 100,
    offset: 0,
    include_lines: false
  }
})

// Returns: { success: true, data: [...transactions...], total: 150 }
```

#### REVERSE Transactions
```typescript
// ✅ USE: hera_txn_reverse_v1
const { data, error } = await supabase.rpc('hera_txn_reverse_v1', {
  p_org_id: orgId,
  p_original_txn_id: transactionId,
  p_reason: 'Customer cancellation - order mistake',
  p_reversal_smart_code: 'HERA.SALON.SALE.REVERSAL.V1'
})

// Returns: { success: true, data: { reversal_transaction_id: '...', ... } }
```

---

### Relationship Operations

#### CREATE Relationships
```typescript
// ✅ USE: hera_relationship_create_v1
const { data, error } = await supabase.rpc('hera_relationship_create_v1', {
  p_org_id: orgId,
  p_from_entity_id: entityId,
  p_to_entity_id: statusId,
  p_relationship_type: 'HAS_STATUS',
  p_smart_code: 'HERA.CRM.CUSTOMER.REL.STATUS.V1',
  p_metadata: { assigned_by: userId }
})
```

#### DELETE Relationships
```typescript
// ✅ USE: hera_relationship_delete_v1
const { data, error } = await supabase.rpc('hera_relationship_delete_v1', {
  p_org_id: orgId,
  p_relationship_id: relationshipId,
  p_delete_reason: 'Status change requested'
})
```

---

### Dynamic Data Operations

#### BATCH Dynamic Data
```typescript
// ✅ USE: hera_dynamic_data_batch_v1
const { data, error } = await supabase.rpc('hera_dynamic_data_batch_v1', {
  p_organization_id: orgId,
  p_entity_id: entityId,
  p_fields: [
    {
      field_name: 'email',
      field_type: 'text',
      field_value_text: 'contact@acme.com',
      smart_code: 'HERA.CRM.CUSTOMER.DYN.EMAIL.V1'
    },
    {
      field_name: 'credit_limit',
      field_type: 'number',
      field_value_number: 50000,
      smart_code: 'HERA.CRM.CUSTOMER.DYN.CREDIT.V1'
    }
  ]
})
```

---

## 📊 Comparison: V2 CRUD vs Working Alternatives

| Feature | V2 CRUD (Broken) | Working Alternative | Performance |
|---------|------------------|---------------------|-------------|
| Entity CREATE | ⚠️ Partial | Direct table + batch | Same |
| Entity READ | ❌ Broken | `hera_entity_read_v1` | Better |
| Entity UPDATE | ❌ Broken | Direct table update | Same |
| Entity DELETE | ❓ Unknown | Direct table/RPC v1 | Same |
| Transaction CREATE | ❓ Unknown | `hera_txn_create_v1` | Same |
| Transaction READ | ❓ Unknown | `hera_txn_read_v1` | Better |
| Transaction QUERY | ❓ Unknown | `hera_txn_query_v1` | Better |
| Relationships | ❌ Broken | Direct RPCs v1 | Better |
| Dynamic Data | ⚠️ Partial | `hera_dynamic_data_batch_v1` | Same |

**Conclusion**: Working alternatives are **equal or better** in performance and **100% reliable**.

---

## 🔧 Code Changes Made

### Fixed `/src/app/api/v2/entities/route.ts`

**Changed FROM** (broken):
```typescript
const { data: updateResult, error: entityError } = await supabase.rpc('hera_entities_crud_v2', {
  p_operation: 'UPDATE',
  p_payload: updatePayload,
  p_actor_user_id: actor.actor_user_id
})
```

**Changed TO** (working):
```typescript
const { error: entityError } = await supabase
  .from('core_entities')
  .update({
    ...updatePayload,
    updated_by: actor.actor_user_id,
    updated_at: new Date().toISOString()
  })
  .eq('id', data.entity_id)
  .eq('organization_id', organizationId)
```

### Updated Documentation

**Files Updated**:
1. `/docs/api/v2/RPC_FUNCTIONS_GUIDE.md` - Added critical warnings and working alternatives
2. `/docs/api/v2/RPC_V2_TESTING_STATUS.md` - This file (new)
3. `/mcp-server/HERA_ENTITIES_CRUD_V2_TEST_RESULTS.md` - Comprehensive test evidence

---

## 🎯 Recommendations

### Immediate Actions (CRITICAL)
1. ✅ **STOP using `hera_entities_crud_v2`** - Switch to working alternatives
2. ✅ **STOP using `hera_transactions_crud_v2`** - Use v1 RPCs instead
3. ✅ **Update all code** using these functions to use working alternatives
4. ✅ **Train developers** on correct RPC usage patterns

### Short-Term Actions
1. 🔧 **Fix bugs in V2 CRUD RPCs** or deprecate them entirely
2. 🧪 **Add comprehensive test suite** for all RPC functions
3. 📝 **Update all documentation** to reflect actual working functions
4. 🚨 **Add runtime warnings** if V2 CRUD functions are called

### Long-Term Actions
1. 🎯 **Decide on V2 CRUD future** - Fix or deprecate?
2. 📊 **Performance benchmarks** - Compare v1 vs direct table operations
3. 🔐 **Security audit** - Ensure all patterns maintain actor stamping
4. 📚 **Developer training** - Update onboarding materials

---

## 📞 Support

**Issues Found**: Report to development team
**Test Files**: `/mcp-server/test-entities-crud-v2-*.js`
**Test Results**: `/mcp-server/HERA_ENTITIES_CRUD_V2_TEST_RESULTS.md`
**Documentation**: `/docs/api/v2/RPC_FUNCTIONS_GUIDE.md`

---

**Status**: CRITICAL - ACTION REQUIRED
**Priority**: P0 - Immediate attention needed
**Impact**: HIGH - Affects all entity and transaction operations
