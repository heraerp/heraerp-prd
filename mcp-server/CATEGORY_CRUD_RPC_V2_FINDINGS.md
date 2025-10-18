# Category CRUD with hera_entities_crud_v2 - Test Findings

**Date:** 2025-10-16
**Test Case:** Product Category CRUD (/salon/products page)
**Status:** ⚠️ **BLOCKED - Smart Code Constraint Issue**

---

## 🎯 Executive Summary

The `hera_entities_crud_v2` RPC function has been tested against the production category management workflow used in `/salon/products`. The RPC **exists and is functional** for READ operations, but **CREATE is blocked** by a database constraint requiring `smart_code` on dynamic data fields.

### Key Findings

| Operation | Status | Notes |
|-----------|--------|-------|
| **CREATE** | 🔴 **BLOCKED** | smart_code NULL constraint violation on core_dynamic_data |
| **READ** | ✅ **WORKING** | Returns proper format but no data (empty database) |
| **UPDATE** | ⏭️ **SKIPPED** | Requires successful CREATE first |
| **DELETE** | ⏭️ **SKIPPED** | Requires successful CREATE first |

---

## 📊 Current vs New Pattern Comparison

### Current Pattern (Production)

**Stack:**
- `useHeraProductCategories` → `useUniversalEntity` → `/api/v2/*` endpoints

**CREATE Flow:**
```javascript
// 1. Create entity
POST /api/v2/entities
{
  p_organization_id: orgId,
  entity_type: 'product_category',
  entity_name: 'Hair Products',
  smart_code: 'HERA.SALON.CATEGORY.ENT.PRODUCT.V1',
  status: 'active'
}

// 2. Add dynamic fields (separate call)
POST /api/v2/dynamic-data/batch
{
  p_organization_id: orgId,
  p_entity_id: entity_id,
  p_fields: [
    {
      field_name: 'color',
      field_type: 'text',
      field_value_text: '#FF6B6B',
      smart_code: 'HERA.SALON.CATEGORY.DYN.COLOR.v1'
    },
    {
      field_name: 'display_order',
      field_type: 'number',
      field_value_number: 1,
      smart_code: 'HERA.SALON.CATEGORY.DYN.ORDER.v1'
    }
  ]
}
```

**Total:** 2 API calls

---

### New Pattern (hera_entities_crud_v2)

**Single RPC Call:**
```javascript
await supabase.rpc('hera_entities_crud_v2', {
  p_action: 'create',
  p_actor_user_id: userId,  // REQUIRED for audit trail
  p_dynamic: {
    color: '#FF6B6B',
    display_order: 1,
    icon: 'Tag',
    active: true
  },
  p_entity: {
    entity_type: 'product_category',
    entity_name: 'Hair Products',
    entity_description: 'Hair care products',
    smart_code: 'HERA.SALON.CATEGORY.ENT.PRODUCT.V1',
    status: 'active'
  },
  p_options: {},
  p_organization_id: orgId,
  p_relationships: []
});
```

**Total:** 1 RPC call (atomic transaction)

---

## 🐛 Issue Analysis

### Error Details

```
ERROR: null value in column "smart_code" of relation "core_dynamic_data"
violates not-null constraint

Code: 23502
Details: Failing row contains (
  ...,
  field_name: 'icon',
  field_type: 'text',
  smart_code: null,  ← PROBLEM
  ...
)
```

### Root Cause

The RPC function is creating dynamic data records but **not generating smart_codes** for each field. The `core_dynamic_data` table has a NOT NULL constraint on `smart_code`.

**Expected Behavior:**
- Entity: `HERA.SALON.CATEGORY.ENT.PRODUCT.V1`
- Field 'color': `HERA.SALON.CATEGORY.DYN.COLOR.V1`
- Field 'icon': `HERA.SALON.CATEGORY.DYN.ICON.V1`
- Field 'display_order': `HERA.SALON.CATEGORY.DYN.ORDER.V1`

**Actual Behavior:**
- RPC creates fields without smart_codes → NULL → constraint violation

### Why Current Pattern Works

The current pattern explicitly provides smart_codes for each dynamic field:

```javascript
// From useHeraProductCategories.ts:76-103
dynamic_fields: {
  display_order: {
    value: data.display_order,
    type: 'number',
    smart_code: 'HERA.SALON.CATEGORY.DYN.ORDER.v1'  // ✅ Explicit
  },
  color: {
    value: data.color,
    type: 'text',
    smart_code: 'HERA.SALON.CATEGORY.DYN.COLOR.v1'  // ✅ Explicit
  }
}
```

Then `/api/v2/dynamic-data/batch` uses these smart_codes directly.

---

## 🔧 Required Fix

### Option 1: Fix RPC Function (Recommended)

Modify `hera_entities_crud_v2` to auto-generate smart_codes for dynamic fields:

```sql
-- Inside RPC logic
FOR field IN p_dynamic
LOOP
  -- Auto-generate smart_code from entity's smart_code + field name
  -- Example: HERA.SALON.CATEGORY.ENT.PRODUCT.V1 → HERA.SALON.CATEGORY.DYN.COLOR.V1

  field_smart_code := regexp_replace(
    p_entity->>'smart_code',
    '\.ENT\.',
    '.DYN.'
  ) || '.' || UPPER(field.key) || '.V1';

  INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_value_text,
    field_type,
    smart_code,  -- ✅ Auto-generated
    organization_id
  ) VALUES (...);
END LOOP;
```

### Option 2: Client-Side Smart Code Generation

Clients must provide smart_codes in `p_dynamic`:

```javascript
p_dynamic: {
  color: {
    value: '#FF6B6B',
    smart_code: 'HERA.SALON.CATEGORY.DYN.COLOR.V1'  // ✅ Required
  },
  display_order: {
    value: 1,
    smart_code: 'HERA.SALON.CATEGORY.DYN.ORDER.V1'  // ✅ Required
  }
}
```

**Verdict:** Option 1 is better - keeps client code simple and ensures consistency.

---

## ✅ Successful Test Results

### READ Operation

```
✅ READ Success!
Response: {
  "items": null,
  "next_cursor": null
}
```

**Analysis:**
- RPC executes successfully
- Returns proper pagination structure
- Empty results because no categories exist yet (blocked by CREATE issue)
- Format is compatible with current pagination patterns

**Expected Response Format** (once CREATE works):
```json
{
  "items": [
    {
      "entity_id": "uuid",
      "entity_name": "Hair Products",
      "entity_type": "product_category",
      "smart_code": "HERA.SALON.CATEGORY.ENT.PRODUCT.V1",
      "status": "active",
      "organization_id": "org-uuid",
      "dynamic_fields": {
        "color": "#FF6B6B",
        "display_order": 1,
        "icon": "Tag",
        "active": true
      },
      "created_at": "2025-10-16T...",
      "updated_at": "2025-10-16T..."
    }
  ],
  "next_cursor": null
}
```

---

## 📈 Performance Benefits (Once Fixed)

### Current Pattern vs RPC V2

| Operation | Current | RPC V2 | Improvement |
|-----------|---------|---------|-------------|
| **CREATE** | 2 calls | 1 call | **50% reduction** |
| **READ** | 2 calls + merge | 1 call | **50% reduction + no client processing** |
| **UPDATE** | 1 call | 1 call | **Equal (but more consistent)** |
| **DELETE** | 1 call | 1 call | **Equal** |

### Additional Benefits

1. **Atomic Transactions**
   - Current: Entity and dynamic data in separate transactions (can fail partially)
   - RPC V2: Single transaction (all-or-nothing guarantee)

2. **Audit Trail**
   - Current: Optional actor tracking
   - RPC V2: Mandatory `p_actor_user_id` for all operations

3. **Server-Side Processing**
   - Current: Client merges dynamic data into entities
   - RPC V2: Server returns fully merged entities

4. **Relationship Management**
   - Current: Separate calls for relationships
   - RPC V2: Relationships in same atomic transaction

5. **Error Handling**
   - Current: Must handle multi-step failures
   - RPC V2: Single point of failure, simpler error handling

---

## 🛠️ Migration Path (After Fix)

### Step 1: Create RPC V2 Adapter Hook

```typescript
// /src/hooks/useHeraProductCategoriesV2.ts
import { useUniversalEntityV2 } from './useUniversalEntityV2'

export function useHeraProductCategoriesV2(options) {
  return useUniversalEntityV2({
    entity_type: 'product_category',
    organizationId: options?.organizationId,
    dynamicFields: [
      { name: 'color', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.COLOR.V1' },
      { name: 'display_order', type: 'number', smart_code: 'HERA.SALON.CATEGORY.DYN.ORDER.V1' },
      { name: 'icon', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.ICON.V1' },
      { name: 'active', type: 'boolean', smart_code: 'HERA.SALON.CATEGORY.DYN.ACTIVE.V1' }
    ],
    rpcFunction: 'hera_entities_crud_v2'
  })
}
```

### Step 2: Create Universal Entity V2 Hook

```typescript
// /src/hooks/useUniversalEntityV2.ts
export function useUniversalEntityV2(config) {
  const { user } = useHERAAuth()
  const actorUserId = user?.id || user?.entity_id

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return supabase.rpc('hera_entities_crud_v2', {
        p_action: 'create',
        p_actor_user_id: actorUserId,
        p_dynamic: extractDynamicFields(data, config.dynamicFields),
        p_entity: extractEntityData(data),
        p_options: {},
        p_organization_id: config.organizationId,
        p_relationships: extractRelationships(data)
      })
    }
  })

  // ... similar for read, update, delete
}
```

### Step 3: Gradual Rollout

1. **Phase 1:** Deploy fixed RPC to production
2. **Phase 2:** Test with feature flag in `/salon/products`
3. **Phase 3:** Migrate other entity types (staff, services, etc.)
4. **Phase 4:** Deprecate old API endpoints

---

## 🧪 Test Code Location

All test scripts available in `/mcp-server/`:

1. **`test-rpc-v2-with-actor.js`** - Basic RPC function tests
2. **`test-category-crud-v2.js`** - Full category CRUD workflow test
3. **`RPC_V2_ANALYSIS.md`** - Initial RPC analysis document
4. **`CATEGORY_CRUD_RPC_V2_FINDINGS.md`** - This document

---

## 📋 Action Items

### Immediate (Blocking)

- [ ] **Fix `hera_entities_crud_v2`** to auto-generate smart_codes for dynamic fields
- [ ] **Test CREATE operation** after fix
- [ ] **Test UPDATE operation** with actual data
- [ ] **Test DELETE operation** with actual data

### Short Term

- [ ] Create `useUniversalEntityV2` hook wrapper
- [ ] Update Category management to use RPC V2 (behind feature flag)
- [ ] Performance benchmark: Current vs RPC V2
- [ ] Document migration guide for other entity types

### Long Term

- [ ] Migrate all entity types to RPC V2
- [ ] Deprecate old API v2 endpoints
- [ ] Update CLAUDE.md with RPC V2 patterns
- [ ] Create TypeScript types for RPC V2 requests/responses

---

## 🎯 Conclusion

**hera_entities_crud_v2 is production-ready architecture** but requires a critical bug fix for dynamic field smart_code generation. Once fixed, it will provide:

- ✅ **50% reduction** in API calls for CREATE/READ operations
- ✅ **Atomic transactions** for data integrity
- ✅ **Built-in audit trails** via mandatory actor tracking
- ✅ **Simplified client code** with server-side data merging
- ✅ **Consistent interface** across all CRUD operations

**Recommendation:** Prioritize the smart_code fix, then proceed with gradual migration starting with categories as the test case.

---

## 📚 Related Documentation

- **/mcp-server/RPC_V2_ANALYSIS.md** - Initial RPC function analysis
- **/docs/schema/hera-sacred-six-schema.yaml** - Database schema reference
- **/src/hooks/useHeraProductCategories.ts** - Current implementation
- **/src/hooks/useUniversalEntity.ts** - Current universal entity hook
- **/CLAUDE.md** - HERA development guidelines
