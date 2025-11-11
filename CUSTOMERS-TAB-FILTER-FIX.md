# Customers Page Active/All Tab Filter Fix

## Problem
In /salon/customers page, the Active and All tabs were not filtering correctly. Customers with `status='deleted'` were appearing in the "All" tab, which should only show 'active' and 'archived' customers.

## Root Cause
The `useHeraCustomers` hook was sending NO status filter when `includeArchived = true`, which caused the API to return ALL statuses including 'deleted':

```typescript
// ❌ OLD BEHAVIOR (line 108):
...(options?.includeArchived ? {} : { status: 'active' }),
```

This resulted in:
- **Active tab** (`includeArchived = false`): API filters to `status='active'` only ✅
- **All tab** (`includeArchived = true`): API returns ALL statuses including 'deleted' ❌

## Solution
Added client-side filtering in the `filteredCustomers` memo to properly handle both tabs, matching the pattern used in /salon/products page (lines 462-472).

### Code Changes

**File: `/src/hooks/useHeraCustomers.ts`**

**Change 1:** Added complete tab-based filtering logic at lines 141-154:

```typescript
// 🎯 TAB-BASED STATUS FILTERING: Exclude 'deleted' status from both Active and All tabs
// This matches the products page pattern (lines 462-472 in products/page.tsx)
filtered = filtered.filter(customer => {
  // Active tab: Show only status='active' (exclude 'archived' and 'deleted')
  if (!options?.includeArchived) {
    if (customer.status === 'archived' || customer.status === 'deleted') {
      return false
    }
  } else {
    // All tab: Show 'active' and 'archived' (exclude 'deleted' only)
    if (customer.status === 'deleted') {
      return false
    }
  }
  return true
})
```

**Change 2:** Added `options?.includeArchived` to useMemo dependency array at line 212:

```typescript
}, [
  customers,
  options?.includeArchived,  // ✅ Added to re-run filtering when tab changes
  options?.searchQuery,
  options?.loyaltyFilter,
  options?.filters?.branch_id,
  options?.filters?.vip_only
])
```

## Expected Behavior After Fix

### Active Tab (`includeArchived = false`)
- Shows only customers with `status='active'`
- Excludes customers with `status='archived'` or `status='deleted'`

### All Tab (`includeArchived = true`)
- Shows customers with `status='active'` and `status='archived'`
- Excludes customers with `status='deleted'`
- Displays archived count badge: "Showing X archived customers"

## Reference Implementation
This fix follows the exact pattern used in `/src/app/salon/products/page.tsx` (lines 462-472):

```typescript
// 🎯 NEW: Tab-based status filtering (exclude 'deleted' from both tabs)
if (!includeArchived) {
  // Active tab: Show only status='active'
  if (product.status === 'archived' || product.status === 'deleted') {
    return false
  }
} else {
  // All tab: Show 'active' and 'archived' (exclude 'deleted')
  if (product.status === 'deleted') {
    return false
  }
}
```

## Testing Steps
1. Navigate to /salon/customers page
2. Click "Active" tab - should show only active customers
3. Click "All" tab - should show active + archived customers (no deleted)
4. Archive a customer - it should disappear from Active tab but appear in All tab
5. Delete a customer - it should disappear from both tabs

## Files Modified
- `/src/hooks/useHeraCustomers.ts` - Added complete tab-based status filtering (lines 141-154) and updated useMemo dependencies (line 212)

## Status
✅ **FIXED** - Active/All tab filtering now matches products page behavior

---

# RELATED ISSUE: Settings Page Organization Data Not Loading

## Problem Statement
Organization data (name, legal_name, phone, email, address, trn) is not displaying in the settings page form fields when navigating to `/salon/settings`.

## Investigation Status
🔍 **DIAGNOSTIC PHASE** - Added comprehensive logging to understand data flow.

## Diagnostic Approach
Since `SecuredSalonContext` is used across multiple pages, we added zero-risk diagnostic logging instead of making structural changes:

1. ✅ Settings page useEffect (lines 110-137) - Shows what organization object page receives
2. ✅ SecuredSalonProvider after dynamic data transformation (lines 1241-1245) - Shows raw array and transformed object
3. ✅ SecuredSalonProvider before return (lines 1305-1318) - Shows final organization object structure

## Files Modified (Diagnostic Only)
- `/src/app/salon/settings/page.tsx` - Added logging in useEffect (lines 110-137)
- `/src/app/salon/SecuredSalonProvider.tsx` - Added logging in loadOrganizationDetails (lines 1241-1245, 1305-1318)

## Next Steps
1. Navigate to `/salon/settings`
2. Check browser console for diagnostic output
3. Analyze which scenario applies:
   - **Scenario 1:** Dynamic data array is empty (fields never saved)
   - **Scenario 2:** Field names don't match (mapping issue)
   - **Scenario 3:** Values extracted but not reaching form (timing/dependency issue)
   - **Scenario 4:** Data present but form not updating (React state issue)

## Diagnostic Guide
See `/SETTINGS-PAGE-DIAGNOSTIC-GUIDE.md` for complete testing instructions and interpretation guide.

## Safety Confirmation
✅ **Zero functional changes made** - Only diagnostic console.log statements added
✅ **Safe for other pages** - legal_name, phone, email, address, trn are ONLY used in settings page
✅ **No SecuredSalonContext structure changes** - Other pages unaffected
