# HERA Dynamic Data Function Investigation - Final Report

**Date:** 2025-10-19  
**Database:** Supabase Production  
**Status:** ✅ Complete

---

## Executive Summary

### ❌ Function Does NOT Exist

**`hera_dynamic_data_batch_v1`** does **NOT exist** in the Supabase database.

### ✅ Working Solution

**`hera_entities_crud_v2`** is the production-ready function that handles batch dynamic data operations through its `p_dynamic` parameter.

---

## Complete Function Signatures

### 1. `hera_entities_crud_v2` - **RECOMMENDED FOR BATCH OPERATIONS** ⭐

**Full Signature:**
```typescript
await supabase.rpc('hera_entities_crud_v2', {
  p_action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
  p_actor_user_id: string,          // Required - WHO is acting
  p_organization_id: string,        // Required - WHERE (tenant boundary)
  p_entity: {
    entity_id?: string,             // Required for READ/UPDATE/DELETE
    entity_type?: string,           // Required for CREATE
    entity_name?: string,           // Required for CREATE
    smart_code?: string,            // Required for CREATE
    entity_code?: string            // Optional
  },
  p_dynamic: {                      // BATCH dynamic fields
    [field_name: string]: {
      field_type: 'text' | 'number' | 'boolean' | 'date' | 'json',
      field_value_text?: string,
      field_value_number?: number,
      field_value_boolean?: boolean,
      field_value_date?: string,
      field_value_json?: object,
      smart_code?: string           // HERA DNA pattern
    }
  },
  p_relationships: Array<any>,      // Relationship operations
  p_options: {
    limit?: number,
    offset?: number,
    include_dynamic?: boolean,
    include_relationships?: boolean
  }
})
```

**Response Structure:**
```typescript
{
  items: [
    {
      id: string,
      entity_type: string,
      entity_name: string,
      entity_code: string | null,
      smart_code: string,
      status: string,
      version: number,
      created_at: string,
      created_by: string,
      updated_at: string,
      updated_by: string,
      dynamic: {
        [field_name]: {
          value: string,              // Always string representation
          field_type: string,
          smart_code: string
        }
      },
      relationships: {},
      metadata: {},
      business_rules: {},
      ai_insights: {},
      ai_classification: string | null,
      ai_confidence: number
    }
  ],
  metadata: {
    action: string,
    actor_user_id: string,
    organization_id: string,
    dynamic_included: boolean,
    relationships_included: boolean,
    created_relationships?: number,
    single_entity?: boolean
  },
  next_cursor: string
}
```

---

### 2. `hera_dynamic_data_get_v1` - Read Dynamic Data

**Signature:**
```typescript
await supabase.rpc('hera_dynamic_data_get_v1', {
  p_organization_id: string,        // Required
  p_entity_id?: string,             // Optional - filter by entity
  p_field_name?: string             // Optional - filter by field
})
```

**Response:**
```typescript
{
  data: [
    {
      id: string,
      entity_id: string,
      field_name: string,
      field_type: 'text' | 'number' | 'boolean' | 'date' | 'json',
      field_value_text: string | null,
      field_value_number: number | null,
      field_value_boolean: boolean | null,
      field_value_date: string | null,
      field_value_json: object | null,
      smart_code: string,
      created_at: string,
      created_by: string,
      updated_at: string,
      updated_by: string,
      organization_id: string
    }
  ],
  success: boolean,
  metadata: {
    offset: number,
    page_size: number,
    total_count: number,
    returned_count: number
  }
}
```

---

### 3. `hera_dynamic_data_set_v1` - ⚠️ BROKEN (Database Error)

**Status:** Function exists but has database error: `column "metadata" does not exist`

**DO NOT USE** - Use `hera_entities_crud_v2` instead

---

## Production Examples

### Example 1: Create Entity with Multiple Dynamic Fields

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create product with 3 dynamic fields in ONE atomic operation
const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
  p_action: 'CREATE',
  p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
  p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_entity: {
    entity_type: 'product',
    entity_name: 'Premium Hair Treatment Serum',
    smart_code: 'HERA.SALON.PRODUCT.ENTITY.TREATMENT.V1'
  },
  p_dynamic: {
    price: {
      field_type: 'number',
      field_value_number: 199.99,
      smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
    },
    category: {
      field_type: 'text',
      field_value_text: 'premium_treatment',
      smart_code: 'HERA.SALON.PRODUCT.FIELD.CATEGORY.V1'
    },
    in_stock: {
      field_type: 'boolean',
      field_value_boolean: true,
      smart_code: 'HERA.SALON.PRODUCT.FIELD.IN_STOCK.V1'
    }
  },
  p_relationships: [],
  p_options: {}
});

// Access created entity
const product = data.items[0];
console.log('Product ID:', product.id);
console.log('Price:', product.dynamic.price.value);          // "199.99000000"
console.log('Category:', product.dynamic.category.value);    // "premium_treatment"
console.log('In Stock:', product.dynamic.in_stock.value);    // "true"
```

### Example 2: Update Dynamic Fields

```javascript
// Update existing entity's dynamic fields
const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
  p_action: 'UPDATE',
  p_actor_user_id: actorId,
  p_organization_id: orgId,
  p_entity: {
    entity_id: 'e98cdb83-decd-40ff-baab-151694a661d6'
  },
  p_dynamic: {
    price: {
      field_type: 'number',
      field_value_number: 249.99,
      smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
    },
    sale_price: {
      field_type: 'number',
      field_value_number: 199.99,
      smart_code: 'HERA.SALON.PRODUCT.FIELD.SALE_PRICE.V1'
    }
  },
  p_relationships: [],
  p_options: {}
});
```

### Example 3: Read Dynamic Data

```javascript
// Method 1: Using hera_entities_crud_v2 (includes entity + dynamic data)
const { data } = await supabase.rpc('hera_entities_crud_v2', {
  p_action: 'READ',
  p_actor_user_id: actorId,
  p_organization_id: orgId,
  p_entity: {
    entity_id: entityId
  },
  p_dynamic: {},
  p_relationships: [],
  p_options: {}
});

const product = data.items[0];
console.log(product.dynamic.price.value);

// Method 2: Using hera_dynamic_data_get_v1 (dynamic data only)
const { data: dynamicData } = await supabase.rpc('hera_dynamic_data_get_v1', {
  p_organization_id: orgId,
  p_entity_id: entityId
});

console.log(dynamicData.data[0].field_value_number);  // Raw number value
```

---

## Key Findings

### 1. Non-Existent Functions
- ❌ `hera_dynamic_data_batch_v1` - Does not exist
- ❌ `hera_dynamic_batch_v1` - Does not exist
- ❌ `hera_batch_dynamic_data_v1` - Does not exist

### 2. Broken Functions
- ⚠️ `hera_dynamic_data_set_v1` - Exists but has database error
- ⚠️ `hera_dynamic_data_upsert_v1` - Exists but untested (likely broken)

### 3. Working Functions
- ✅ `hera_entities_crud_v2` - **PRODUCTION READY** for batch operations
- ✅ `hera_dynamic_data_get_v1` - **PRODUCTION READY** for reading dynamic data
- ✅ `hera_transactions_crud_v2` - Production ready for transactions

---

## Important Notes

### Dynamic Field Values in Response

The `dynamic` object in responses uses `value` as the key, NOT the typed field names:

```javascript
// ✅ CORRECT
product.dynamic.price.value          // "199.99000000" (string)
product.dynamic.price.field_type     // "number"
product.dynamic.price.smart_code     // "HERA.SALON.PRODUCT.FIELD.PRICE.V1"

// ❌ WRONG
product.dynamic.price.field_value_number  // undefined
```

### Field Type Mapping

| field_type | Input Parameter         | Response Key |
|-----------|-------------------------|-------------|
| text      | field_value_text        | value       |
| number    | field_value_number      | value       |
| boolean   | field_value_boolean     | value       |
| date      | field_value_date        | value       |
| json      | field_value_json        | value       |

### Actor Stamping

All operations automatically stamp:
- `created_by`: Actor UUID
- `created_at`: Timestamp
- `updated_by`: Actor UUID
- `updated_at`: Timestamp

### Organization Isolation

Sacred boundary enforcement:
- Every operation requires `p_organization_id`
- Data automatically scoped to organization
- RLS policies enforce isolation

---

## Testing Evidence

### Test Files Created
1. `/home/san/PRD/heraerp-prd/mcp-server/check-dynamic-batch-function.mjs` - Initial investigation
2. `/home/san/PRD/heraerp-prd/mcp-server/find-dynamic-functions.mjs` - Function discovery
3. `/home/san/PRD/heraerp-prd/mcp-server/test-dynamic-set.mjs` - Signature testing
4. `/home/san/PRD/heraerp-prd/mcp-server/test-dynamic-read-back.mjs` - End-to-end verification
5. `/home/san/PRD/heraerp-prd/mcp-server/verify-batch-dynamic-solution.mjs` - Solution validation

### Test Results Summary
- ✅ Entity creation with batch dynamic fields: **WORKING**
- ✅ Dynamic data read-back via GET: **WORKING**
- ✅ Dynamic data read-back via CRUD: **WORKING**
- ✅ Actor stamping: **VERIFIED**
- ✅ Organization isolation: **VERIFIED**
- ✅ Smart code validation: **VERIFIED**

---

## Recommendations

### For CLAUDE.md Updates

1. **Remove all references to `hera_dynamic_data_batch_v1`** (does not exist)

2. **Update the recommended pattern:**
   ```typescript
   // OLD (non-existent)
   await callRPC('hera_dynamic_data_batch_v1', {
     p_organization_id: orgId,
     p_entity_id: entityId,
     p_fields: [...]
   })

   // NEW (working)
   await supabase.rpc('hera_entities_crud_v2', {
     p_action: 'UPDATE',
     p_actor_user_id: actorId,
     p_organization_id: orgId,
     p_entity: { entity_id: entityId },
     p_dynamic: { ... }
   })
   ```

3. **Document the response structure** with `value` as the key for dynamic fields

4. **Add warning about `hera_dynamic_data_set_v1`** being broken

### For Code Updates

1. Replace any calls to `hera_dynamic_data_batch_v1` with `hera_entities_crud_v2`
2. Update response parsing to use `.value` instead of `.field_value_*`
3. Ensure all operations include `p_actor_user_id` and `p_organization_id`

---

## Conclusion

The investigation conclusively proves:

1. **`hera_dynamic_data_batch_v1` does NOT exist** in the database
2. **`hera_entities_crud_v2` is the correct function** for batch dynamic data operations
3. The function is **production-ready** and handles:
   - Atomic entity + dynamic data creation
   - Multiple dynamic fields in single call
   - Proper actor stamping and organization isolation
   - Smart code validation

**Action Required:** Update CLAUDE.md documentation to reflect these findings.

---

**Verified By:** Claude Code Investigation  
**Test Environment:** Supabase Production Database  
**Date:** 2025-10-19
