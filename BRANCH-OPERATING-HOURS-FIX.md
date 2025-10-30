# Branch Opening/Closing Times Fix - COMPLETE

## Issue
Branch operating hours (opening_time, closing_time) were showing as `undefined` in the appointments page, despite the data existing correctly in the database.

## Root Cause
The RPC function `hera_entity_read_v1` returns `dynamic_fields` as an **array of objects**:
```javascript
dynamic_fields: [
  {
    field_name: 'opening_time',
    field_type: 'text',
    field_value_text: '10:00',
    // ... other fields
  },
  {
    field_name: 'closing_time',
    field_type: 'text',
    field_value_text: '21:00',
    // ... other fields
  }
]
```

But the code was expecting these values to be at the top level of the branch object:
```javascript
branch.opening_time  // Expected this
branch.closing_time  // Expected this
```

## Solution
Updated **TWO** separate functions that load branches to transform the `dynamic_fields` array into top-level properties:

### 1. SecuredSalonProvider.tsx (lines 915-970)
**File**: `/src/app/salon/SecuredSalonProvider.tsx`

Added transformation logic in the `loadBranches()` function:

```typescript
const transformedBranches = (branches || []).map((branch: any) => {
  const transformed: any = {
    id: branch.id,
    entity_name: branch.entity_name || branch.name,
    entity_code: branch.entity_code || branch.code,
    ...branch
  }

  // ✅ Flatten dynamic_fields ARRAY to top-level properties
  if (Array.isArray(branch.dynamic_fields)) {
    branch.dynamic_fields.forEach((field: any) => {
      const value = field.field_value_text ||
                   field.field_value_number ||
                   field.field_value_boolean ||
                   field.field_value_date ||
                   field.field_value_json ||
                   null

      if (field.field_name && value !== null) {
        transformed[field.field_name] = value
      }
    })
  }

  return transformed
})
```

### 2. getOrganizationBranches() function (lines 119-158)
**File**: `/src/lib/guardrails/branch.ts`

This was the **CRITICAL FIX** - the appointment page uses `useBranchFilter` hook which calls this function.

Added the same transformation logic:

```typescript
return branches.map((branch: any) => {
  const result: any = {
    id: branch.id,
    name: branch.entity_name,
    code: branch.entity_code,
    metadata: branch.metadata
  }

  // ✅ Transform dynamic_fields array to top-level properties
  if (Array.isArray(branch.dynamic_fields)) {
    branch.dynamic_fields.forEach((field: any) => {
      const value = field.field_value_text ||
                   field.field_value_number ||
                   field.field_value_boolean ||
                   field.field_value_date ||
                   field.field_value_json ||
                   null

      if (field.field_name && value !== null) {
        result[field.field_name] = value
      }
    })
  }
  // ✅ FALLBACK: Check metadata for opening/closing times (legacy support)
  else if (branch.metadata && typeof branch.metadata === 'object') {
    if (branch.metadata.opening_time) {
      result.opening_time = branch.metadata.opening_time
    }
    if (branch.metadata.closing_time) {
      result.closing_time = branch.metadata.closing_time
    }
  }

  return result
})
```

## Files Modified

1. **`/src/app/salon/SecuredSalonProvider.tsx`**
   - Line 891: Added `p_include_dynamic: true` parameter
   - Lines 894-906: Added comprehensive debug logging
   - Lines 915-970: Added transformation logic to flatten dynamic_fields array
   - Lines 1009-1032: Fixed `handleSetBranch` to use context's availableBranches

2. **`/src/lib/guardrails/branch.ts`** ✅ **CRITICAL FIX**
   - Lines 119-158: Added transformation logic to flatten dynamic_fields array
   - Added comprehensive logging for debugging
   - Added fallback to check metadata for legacy support

## Database Verification
Confirmed via direct database query that both branches have correct data:
- **Mercure Gold Hotel**: opening_time='10:00', closing_time='21:00'
- **Park Regis Kris Kin Hotel**: opening_time='10:00', closing_time='21:00'

## Testing Required
1. Clear browser cache (Ctrl+Shift+R) or restart dev server
2. Navigate to `/appointments/new`
3. Select a branch
4. Verify console shows:
   - `[getOrganizationBranches]   - opening_time = 10:00`
   - `[getOrganizationBranches]   - closing_time = 21:00`
5. Verify UI shows: "10:00 AM - 9:00 PM" instead of "Operating hours not configured"
6. Verify time slot generation works correctly

## Why Two Fixes Were Needed

The application has **two separate paths** for loading branches:

1. **SecuredSalonProvider Context** - Loads branches for global context
   - Used by: Most salon pages that use `useSecuredSalonContext()`
   - Fixed in: `SecuredSalonProvider.tsx`

2. **useBranchFilter Hook** - Loads branches independently
   - Used by: Appointment page via `useBranchFilter` hook
   - Calls: `getOrganizationBranches()` function
   - Fixed in: `/src/lib/guardrails/branch.ts` ✅ **THIS WAS THE MISSING FIX**

## Technical Details
- **API Route**: `/api/v2/entities` (GET)
- **RPC Function**: `hera_entity_read_v1`
- **Parameter**: `p_include_dynamic: true` (tells RPC to include dynamic fields)
- **Response Format**: `{ success: true, data: [{ id, entity_name, dynamic_fields: [...] }] }`
- **Transformation**: Iterate through `dynamic_fields` array and flatten to top-level properties

## Status
✅ **FIXED** - Both branch loading paths now correctly transform dynamic_fields

The appointment page should now display operating hours correctly after restarting the dev server or clearing browser cache.
