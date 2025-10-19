# HERA Dynamic Data Function Report

## Executive Summary

**Status:** `hera_dynamic_data_batch_v1` **DOES NOT EXIST** ❌

**Alternative Solution:** Use `hera_entities_crud_v2` with `p_dynamic` parameter ✅

---

## Functions Discovered

### ✅ Available Functions

1. **`hera_dynamic_data_get_v1`** - Read dynamic data
2. **`hera_dynamic_data_set_v1`** - Set individual dynamic field
3. **`hera_dynamic_data_upsert_v1`** - Upsert individual dynamic field  
4. **`hera_dynamic_data_create_v1`** - Create individual dynamic field
5. **`hera_dynamic_data_update_v1`** - Update individual dynamic field
6. **`hera_dynamic_data_delete_v1`** - Delete individual dynamic field
7. **`hera_entity_upsert_v1`** - Entity upsert
8. **`hera_entities_crud_v2`** - Complete entity CRUD with batch dynamic data ⭐
9. **`hera_transactions_crud_v2`** - Complete transaction CRUD

### ❌ Non-Existent Functions

- `hera_dynamic_data_batch_v1` - **DOES NOT EXIST**
- `hera_dynamic_batch_v1` - Does not exist
- `hera_batch_dynamic_data_v1` - Does not exist
- `create_dynamic_data_batch` - Does not exist
- `upsert_dynamic_data_batch` - Does not exist

---

## Recommended Solution

### Use `hera_entities_crud_v2` for Batch Dynamic Data Operations

**Function Signature:**
```javascript
await supabase.rpc('hera_entities_crud_v2', {
  p_action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
  p_actor_user_id: string,      // Required - WHO is acting
  p_organization_id: string,    // Required - WHERE (tenant boundary)
  p_entity: {
    entity_id?: string,         // Required for READ/UPDATE/DELETE
    entity_type?: string,       // Required for CREATE
    entity_name?: string,       // Required for CREATE
    smart_code?: string         // Required for CREATE
  },
  p_dynamic: {                  // BATCH dynamic fields ⭐
    [field_name]: {
      field_type: 'text' | 'number' | 'boolean' | 'date' | 'json',
      field_value_text?: string,
      field_value_number?: number,
      field_value_boolean?: boolean,
      field_value_date?: string,
      field_value_json?: object,
      smart_code?: string       // HERA DNA pattern
    }
  },
  p_relationships: [],
  p_options: {}
})
```

### Production Example (Verified Working)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CREATE entity with BATCH dynamic fields
const result = await supabase.rpc('hera_entities_crud_v2', {
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
      field_value_number: 89.99,
      smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
    },
    category: {
      field_type: 'text',
      field_value_text: 'hair_treatment',
      smart_code: 'HERA.SALON.PRODUCT.FIELD.CATEGORY.V1'
    },
    brand: {
      field_type: 'text',
      field_value_text: 'Premium Salon Care',
      smart_code: 'HERA.SALON.PRODUCT.FIELD.BRAND.V1'
    }
  },
  p_relationships: [],
  p_options: {}
});

console.log('Created entity ID:', result.data?.items?.[0]?.id);
console.log('Price:', result.data?.items?.[0]?.dynamic?.price?.field_value_number);
```

---

## Function Signatures (Discovered via Testing)

### `hera_dynamic_data_get_v1`

**Signature:**
```javascript
await supabase.rpc('hera_dynamic_data_get_v1', {
  p_organization_id: string,    // Required
  p_entity_id?: string,         // Optional - filter by entity
  p_field_name?: string         // Optional - filter by field name
})
```

**Returns:**
```javascript
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
  success: true,
  metadata: {
    offset: number,
    page_size: number,
    total_count: number,
    returned_count: number
  }
}
```

### `hera_dynamic_data_set_v1`

**Signature (Discovered):**
```javascript
await supabase.rpc('hera_dynamic_data_set_v1', {
  p_organization_id: string,
  p_entity_id: string,
  p_field_name: string,
  p_field_type: 'text' | 'number' | 'boolean' | 'date' | 'json',
  p_field_value_text?: string,
  p_field_value_number?: number,
  p_field_value_boolean?: boolean,
  p_field_value_date?: string,
  p_field_value_json?: object,
  p_smart_code?: string
})
```

**Note:** This function has a database error (`column "metadata" does not exist`) which suggests it may be outdated or broken. Use `hera_entities_crud_v2` instead.

---

## Migration Guide: From Non-Existent `batch_v1` to `entities_crud_v2`

### Before (Non-Existent):
```javascript
// ❌ This function does not exist
await supabase.rpc('hera_dynamic_data_batch_v1', {
  p_organization_id: orgId,
  p_entity_id: entityId,
  p_fields: [
    { field_name: 'price', field_type: 'number', field_value_number: 99.99 }
  ]
})
```

### After (Working Solution):
```javascript
// ✅ Use hera_entities_crud_v2 with UPDATE action
await supabase.rpc('hera_entities_crud_v2', {
  p_action: 'UPDATE',
  p_actor_user_id: actorId,
  p_organization_id: orgId,
  p_entity: {
    entity_id: entityId
  },
  p_dynamic: {
    price: {
      field_type: 'number',
      field_value_number: 99.99,
      smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
    }
  },
  p_relationships: [],
  p_options: {}
})
```

---

## Testing Results

### Test 1: Function Existence Check
```
✅ hera_dynamic_data_get_v1 EXISTS
✅ hera_dynamic_data_set_v1 EXISTS (but has database error)
✅ hera_dynamic_data_upsert_v1 EXISTS
✅ hera_entities_crud_v2 EXISTS
❌ hera_dynamic_data_batch_v1 DOES NOT EXIST
```

### Test 2: `hera_dynamic_data_get_v1` - Verified Working
```javascript
// ✅ SUCCESS
const result = await supabase.rpc('hera_dynamic_data_get_v1', {
  p_organization_id: '00000000-0000-0000-0000-000000000000'
});

// Returns 14 dynamic data records with full metadata
```

### Test 3: `hera_dynamic_data_set_v1` - Database Error
```javascript
// ❌ FAILED - column "metadata" does not exist
const result = await supabase.rpc('hera_dynamic_data_set_v1', {
  p_organization_id: orgId,
  p_entity_id: entityId,
  p_field_name: 'test_field',
  p_field_type: 'text',
  p_field_value_text: 'test_value'
});
```

### Test 4: `hera_entities_crud_v2` - Verified Working
```javascript
// ✅ SUCCESS - Complete CRUD cycle with batch dynamic fields
// See /home/san/PRD/heraerp-prd/mcp-server/test-hera-entities-crud-v2-final.mjs
```

---

## Conclusion

**Key Findings:**

1. **`hera_dynamic_data_batch_v1` does NOT exist** in the database
2. **`hera_entities_crud_v2` is the production-ready solution** for batch dynamic data operations
3. `hera_dynamic_data_set_v1` exists but has database errors and should be avoided
4. `hera_dynamic_data_get_v1` works correctly for reading dynamic data

**Recommended Action:**

Update all references to `hera_dynamic_data_batch_v1` in CLAUDE.md and documentation to use `hera_entities_crud_v2` with the `p_dynamic` parameter for batch operations.

**Performance Benefits:**

- Single RPC call handles entity + multiple dynamic fields
- Atomic transaction ensures data consistency
- Actor stamping and organization isolation built-in
- Smart code validation automatic

---

## Files Referenced

- `/home/san/PRD/heraerp-prd/mcp-server/test-hera-entities-crud-v2-final.mjs` - Working example
- `/home/san/PRD/heraerp-prd/mcp-server/check-dynamic-batch-function.mjs` - Investigation script
- `/home/san/PRD/heraerp-prd/mcp-server/find-dynamic-functions.mjs` - Discovery script
- `/home/san/PRD/heraerp-prd/mcp-server/test-dynamic-set.mjs` - Signature testing

**Generated:** 2025-10-19  
**Tested Against:** Supabase Database (Production)
