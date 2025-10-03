# Universal API v2 Migration Analysis - Salon Products

## Executive Summary

The Universal API v2 has been updated to use an **RPC-first architecture** that directly maps to HERA database functions through Supabase. The current salon products implementation (`useHeraProducts.ts`) is using an **outdated pattern** that references a non-existent `universalApi` object and incorrect parameter formats.

**Critical Issue Found:** `useHeraProducts.ts` line 60-64 references `universalApi.getEntities()` which does not exist in the imports.

## Pattern Comparison

### ✅ CORRECT PATTERN (Universal API v2 RPC-First)

**Example from `useHeraServices.ts` and `useHeraProductCategories.ts`:**

```typescript
import {
  getEntities,
  getDynamicData,
  setDynamicDataBatch,
  upsertEntity,
  deleteEntity,
  DynamicFieldInput
} from '@/lib/universal-api-v2-client'

// Fetch entities with RPC parameters
const result = await getEntities('', {
  p_organization_id: organizationId,      // ✅ p_ prefix
  p_entity_type: 'service',               // ✅ p_ prefix
  p_status: includeArchived ? undefined : 'active'  // ✅ p_ prefix
})

// Get dynamic data
const response = await getDynamicData('', {
  p_organization_id: organizationId,      // ✅ p_ prefix
  p_entity_id: entity.id                  // ✅ p_ prefix
})

// Create/update entity
await upsertEntity('', {
  p_organization_id: organizationId,      // ✅ p_ prefix
  p_entity_type: 'service',
  p_entity_name: serviceData.name,
  p_smart_code: 'HERA.SALON.SVC.ENT.STANDARD.V1',
  p_status: 'active'
})

// Batch set dynamic fields
await setDynamicDataBatch('', {
  p_organization_id: organizationId,
  p_entity_id: newService.id,
  p_smart_code: 'HERA.SALON.SVC.FIELD.DATA.V1',
  p_fields: dynamicFields  // Array of DynamicFieldInput
})
```

### ❌ INCORRECT PATTERN (Current useHeraProducts.ts)

**Line 60-64 in `useHeraProducts.ts`:**

```typescript
// ❌ WRONG: universalApi object doesn't exist
const result = await universalApi.getEntities({
  orgId: organizationId,           // ❌ Wrong: should be p_organization_id
  entityType: 'product',           // ❌ Wrong: should be p_entity_type
  status: includeArchived ? undefined : 'active'  // ❌ Missing p_ prefix
})

// ❌ WRONG: Missing import for universalApi
// The file only imports individual functions, not an object wrapper
```

## Detailed Issues in useHeraProducts.ts

### Issue 1: Undefined `universalApi` Reference
**Location:** Line 60
**Problem:** References `universalApi.getEntities()` but `universalApi` is not imported
**Fix Required:** Use direct function import `getEntities()`

### Issue 2: Incorrect Parameter Format
**Location:** Line 60-64
**Problem:** Uses camelCase parameters without `p_` prefix
**Current (Wrong):**
```typescript
{
  orgId: organizationId,
  entityType: 'product',
  status: includeArchived ? undefined : 'active'
}
```

**Should Be:**
```typescript
{
  p_organization_id: organizationId,
  p_entity_type: 'product',
  p_status: includeArchived ? undefined : 'active'
}
```

### Issue 3: Missing RPC-First Architecture
**Problem:** Not following the documented RPC-first architecture that directly maps to database functions
**Impact:** Code will fail at runtime because `universalApi` object doesn't exist

## Side-by-Side Comparison

### Fetching Entities

| Current (useHeraProducts.ts) ❌ | Correct (useHeraServices.ts) ✅ |
|--------------------------------|--------------------------------|
| `const result = await universalApi.getEntities({` | `const result = await getEntities('', {` |
| `  orgId: organizationId,` | `  p_organization_id: organizationId,` |
| `  entityType: 'product',` | `  p_entity_type: 'service',` |
| `  status: includeArchived ? undefined : 'active'` | `  p_status: includeArchived ? undefined : 'active'` |
| `})` | `})` |

### Creating Entities

| Current Pattern ❌ | Correct Pattern ✅ |
|-------------------|-------------------|
| Not implemented in useHeraProducts | `await upsertEntity('', {` |
| | `  p_organization_id: organizationId,` |
| | `  p_entity_type: 'service',` |
| | `  p_entity_name: data.name,` |
| | `  p_smart_code: 'HERA.SALON.SVC.ENT.STANDARD.V1',` |
| | `  p_status: 'active'` |
| | `})` |

### Setting Dynamic Fields

| Current Pattern ❌ | Correct Pattern ✅ |
|-------------------|-------------------|
| Not implemented in useHeraProducts | `await setDynamicDataBatch('', {` |
| | `  p_organization_id: organizationId,` |
| | `  p_entity_id: entityId,` |
| | `  p_smart_code: 'HERA.SALON.SVC.FIELD.DATA.V1',` |
| | `  p_fields: dynamicFields` |
| | `})` |

## Migration Requirements

### 1. Update useHeraProducts.ts Imports
**Current:**
```typescript
// Missing: No specific imports from universal-api-v2-client
```

**Required:**
```typescript
import {
  getEntities,
  getDynamicData,
  setDynamicDataBatch,
  upsertEntity,
  deleteEntity,
  DynamicFieldInput
} from '@/lib/universal-api-v2-client'
```

### 2. Fix Entity Fetching (Line 60-64)
**Current:**
```typescript
const result = await universalApi.getEntities({
  orgId: organizationId,
  entityType: 'product',
  status: includeArchived ? undefined : 'active'
})
```

**Required:**
```typescript
const result = await getEntities('', {
  p_organization_id: organizationId,
  p_entity_type: 'product',
  p_status: includeArchived ? undefined : 'active'
})
```

### 3. Implement Product CRUD Operations
Based on the correct pattern from `useHeraServices.ts`, the following operations need to be implemented:

#### Create Product
```typescript
const createProduct = async (productData: ProductFormValues) => {
  if (!organizationId) throw new Error('Organization ID required')

  // 1. Create entity
  await upsertEntity('', {
    p_organization_id: organizationId,
    p_entity_type: 'product',
    p_entity_name: productData.name,
    p_entity_code: productData.code || productData.name.toUpperCase().replace(/\s+/g, '_'),
    p_smart_code: 'HERA.SALON.PROD.ENT.STANDARD.V1',
    p_entity_description: productData.description || null,
    p_status: 'active'
  })

  // 2. Get the newly created product
  const allProducts = await getEntities('', {
    p_organization_id: organizationId,
    p_entity_type: 'product'
  })

  const newProduct = Array.isArray(allProducts)
    ? allProducts.find(p => p.entity_name === productData.name)
    : null

  if (!newProduct) throw new Error('Failed to create product')

  // 3. Save dynamic fields
  const dynamicFields: DynamicFieldInput[] = [
    { field_name: 'category', field_type: 'text', field_value: productData.category },
    { field_name: 'price', field_type: 'number', field_value_number: productData.price },
    { field_name: 'currency', field_type: 'text', field_value: productData.currency || 'AED' },
    { field_name: 'requires_inventory', field_type: 'boolean', field_value_boolean: productData.requires_inventory }
  ]

  if (dynamicFields.length > 0) {
    await setDynamicDataBatch('', {
      p_organization_id: organizationId,
      p_entity_id: newProduct.id,
      p_smart_code: 'HERA.SALON.PROD.FIELD.DATA.V1',
      p_fields: dynamicFields
    })
  }

  // 4. Invalidate cache
  queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === 'products' &&
      query.queryKey[1] === organizationId
  })
}
```

#### Update Product
```typescript
const updateProduct = async (productId: string, productData: ProductFormValues) => {
  if (!organizationId) throw new Error('Organization ID required')

  // 1. Update entity
  await upsertEntity('', {
    p_organization_id: organizationId,
    p_entity_id: productId,
    p_entity_type: 'product',
    p_entity_name: productData.name,
    p_entity_code: productData.code || productData.name.toUpperCase().replace(/\s+/g, '_'),
    p_smart_code: 'HERA.SALON.PROD.ENT.STANDARD.V1',
    p_entity_description: productData.description || null,
    p_status: productData.status || 'active'
  })

  // 2. Update dynamic fields
  const dynamicFields: DynamicFieldInput[] = [
    { field_name: 'category', field_type: 'text', field_value: productData.category },
    { field_name: 'price', field_type: 'number', field_value_number: productData.price },
    { field_name: 'currency', field_type: 'text', field_value: productData.currency || 'AED' },
    { field_name: 'requires_inventory', field_type: 'boolean', field_value_boolean: productData.requires_inventory }
  ]

  if (dynamicFields.length > 0) {
    await setDynamicDataBatch('', {
      p_organization_id: organizationId,
      p_entity_id: productId,
      p_smart_code: 'HERA.SALON.PROD.FIELD.DATA.V1',
      p_fields: dynamicFields
    })

    // Invalidate cache
    queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === 'products' &&
        query.queryKey[1] === organizationId
    })
  }
}
```

#### Delete Product
```typescript
const deleteProduct = async (productId: string) => {
  if (!organizationId) throw new Error('Organization ID required')

  await deleteEntity('', {
    p_organization_id: organizationId,
    p_entity_id: productId
  })

  queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === 'products' &&
      query.queryKey[1] === organizationId
  })
}
```

## RPC Parameter Reference

All Universal API v2 functions use parameters with `p_` prefix to match the underlying database function parameters:

| Function | Key Parameters |
|----------|----------------|
| `getEntities()` | `p_organization_id`, `p_entity_type`, `p_smart_code`, `p_parent_entity_id`, `p_status` |
| `upsertEntity()` | `p_organization_id`, `p_entity_type`, `p_entity_name`, `p_smart_code`, `p_entity_code`, `p_entity_description`, `p_parent_entity_id`, `p_entity_id`, `p_status` |
| `getDynamicData()` | `p_organization_id`, `p_entity_id` |
| `setDynamicDataBatch()` | `p_organization_id`, `p_entity_id`, `p_smart_code`, `p_fields` |
| `deleteEntity()` | `p_organization_id`, `p_entity_id` |

## DynamicFieldInput Type

```typescript
export type DynamicFieldInput =
  | { field_name: string; field_type: 'number'; field_value_number: number | null }
  | { field_name: string; field_type: 'text'; field_value: string | null }
  | { field_name: string; field_type: 'boolean'; field_value_boolean: boolean | null }
  | { field_name: string; field_type: 'json'; field_value_json: Json | null };
```

## Impact Assessment

### Files Affected
1. **`/src/hooks/useHeraProducts.ts`** - Primary fix required
2. **`/src/app/salon/products/page.tsx`** - Minimal changes (uses the hook)
3. **`/src/components/salon/products/ProductModal.tsx`** - No changes needed (passes data to parent)

### Breaking Changes
- `useHeraProducts` hook will fail at runtime due to undefined `universalApi`
- Any code calling the hook's methods will break if those methods use the old pattern

### Testing Required
1. Product listing and filtering
2. Product creation with dynamic fields
3. Product updates
4. Product deletion
5. Archive/unarchive functionality
6. Category filtering integration

## Comparison with Working Examples

### useHeraServices.ts ✅
- **Status:** Correct implementation
- **Pattern:** RPC-first with direct function calls
- **Lines of Reference:** See lines 36-40 (getEntities), 53-56 (getDynamicData), 129-133 (upsertEntity), 255-260 (setDynamicDataBatch)

### useHeraProductCategories.ts ✅
- **Status:** Correct implementation
- **Pattern:** RPC-first with direct function calls
- **Lines of Reference:** See lines 60-64 (getEntities), 81-84 (getDynamicData), 155-163 (upsertEntity), 188-193 (setDynamicDataBatch)

### useHeraProducts.ts ❌
- **Status:** BROKEN - needs complete refactor
- **Pattern:** References non-existent `universalApi` object wrapper
- **Lines of Reference:** Line 60-64 (broken getEntities call)

## Recommended Migration Path

### Phase 1: Fix Critical Bug (Immediate)
1. Add proper imports from `universal-api-v2-client`
2. Fix line 60-64 to use direct `getEntities()` call with `p_` prefix parameters
3. Update parameter format from `{ orgId, entityType }` to `{ p_organization_id, p_entity_type }`

### Phase 2: Implement CRUD Operations (High Priority)
1. Implement `createProduct()` following `useHeraServices.ts` pattern
2. Implement `updateProduct()` following `useHeraServices.ts` pattern
3. Implement `deleteProduct()` following `useHeraServices.ts` pattern
4. Implement `archiveProduct()` following `useHeraServices.ts` pattern

### Phase 3: Test & Validate (Before Production)
1. Test all CRUD operations with real organization data
2. Verify dynamic field storage and retrieval
3. Test category filtering integration
4. Validate archive/unarchive workflow
5. Check cache invalidation

## Smart Code Standards

### Product Entities
- **Entity Smart Code:** `HERA.SALON.PROD.ENT.STANDARD.V1`
- **Dynamic Data Smart Code:** `HERA.SALON.PROD.FIELD.DATA.V1`

### Service Entities (Reference)
- **Entity Smart Code:** `HERA.SALON.SVC.ENT.STANDARD.V1`
- **Dynamic Data Smart Code:** `HERA.SALON.SVC.FIELD.DATA.V1`

### Category Entities (Reference)
- **Entity Smart Code:** `HERA.SALON.PROD.CATEGORY.{NORMALIZED}.V1` (dynamic based on category name)
- **Dynamic Data Smart Code:** `HERA.SALON.PROD.CATEGORY.FIELD.V1`

## Documentation References

- **Universal API v2 Guide:** `/docs/UNIVERSAL-API-V2.md`
- **RPC Architecture:** `/docs/UNIVERSAL-API-V2-RPC.md`
- **Working Example:** `/src/hooks/useHeraServices.ts`
- **Working Example:** `/src/hooks/useHeraProductCategories.ts`
- **Broken Code:** `/src/hooks/useHeraProducts.ts` (Line 60-64)

## Summary

The Universal API v2 RPC-first architecture requires:

1. ✅ **Direct function imports** (not object wrappers)
2. ✅ **RPC parameter naming** with `p_` prefix
3. ✅ **Batch dynamic field operations** via `setDynamicDataBatch()`
4. ✅ **Proper response handling** (arrays, not objects)
5. ✅ **Smart code usage** for all entity and dynamic data operations

The current `useHeraProducts.ts` implementation violates all five principles and requires a complete refactor following the patterns established in `useHeraServices.ts` and `useHeraProductCategories.ts`.

---

**Next Steps:** Refactor `useHeraProducts.ts` to match the correct Universal API v2 RPC-first patterns.
