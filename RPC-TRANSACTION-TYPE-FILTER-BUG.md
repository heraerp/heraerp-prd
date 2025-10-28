# RPC Transaction Type Filter Bug & Workaround

## 🐛 Problem Summary

**Issue**: UI shows "Total Requests: 23" when database only has 1 LEAVE transaction
**Root Cause**: `hera_txn_crud_v1` RPC function ignores `transaction_type` filter in QUERY action
**Impact**: All transaction types (SALE, GL_POSTING, LEAVE, etc.) are returned regardless of filter

---

## 🔍 Evidence

### Database Query Test Results

```bash
# TEST 1: Direct table query for LEAVE transactions
✅ Direct query found 1 LEAVE transaction

# TEST 2: RPC hera_txn_crud_v1 QUERY action with transaction_type: 'LEAVE' filter
❌ RPC returned 23 transactions of mixed types:
   - GL_POSTING: 8
   - SALE: 13
   - GL_ENTRY: 1
   - LEAVE: 1
   Total: 23 transactions (WRONG!)
```

### RPC Call Parameters

```javascript
await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: 'user-uuid',
  p_organization_id: 'org-uuid',
  p_payload: {
    transaction_type: 'LEAVE',  // ❌ THIS FILTER IS IGNORED
    include_lines: false,
    include_deleted: false,
    limit: 100,
    offset: 0
  }
})
```

**Expected**: 1 LEAVE transaction
**Actual**: 23 transactions of all types

---

## ✅ Workaround Implementation

### Client-Side Filtering in `useHeraLeave.ts`

Added explicit client-side filter to enforce `transaction_type: 'LEAVE'`:

```typescript
// Line 387-389 in src/hooks/useHeraLeave.ts
const activeTransactions = requestsData.items.filter((txn: any) =>
  !txn.deleted_at && txn.transaction_type === 'LEAVE'  // ✅ Filter for LEAVE only
)
```

### Before vs After

**Before Workaround**:
- RPC returns: 23 transactions (all types)
- UI shows: "Total Requests: 23" ❌

**After Workaround**:
- RPC returns: 23 transactions (all types)
- Client filters to: 1 LEAVE transaction
- UI shows: "Total Requests: 1" ✅

---

## 🏥 Permanent Fix Required

### Database RPC Function Issue

The RPC function `hera_txn_crud_v1` needs to be fixed to properly handle the `transaction_type` filter in QUERY operations.

**Location**: Supabase database function
**Action**: Update QUERY action to respect `p_payload.transaction_type` filter

### Expected RPC Behavior

```sql
-- When p_payload.transaction_type is provided
WHERE transaction_type = p_payload->>'transaction_type'
AND organization_id = p_organization_id
AND (p_payload->>'include_deleted' = 'true' OR deleted_at IS NULL)
```

---

## 📊 Impact Assessment

### Affected Components
- ✅ **Fixed**: `useHeraLeave` hook (client-side workaround implemented)
- ⚠️ **Potentially Affected**: Any other hooks using `useUniversalTransactionV1` with transaction_type filter

### Performance Impact
- **Workaround**: Fetches all transactions then filters client-side (inefficient but functional)
- **Proper Fix**: Would filter at database level (efficient and correct)

### Data Integrity
- ✅ No data integrity issues
- ✅ Filtered data is correct after client-side filtering
- ⚠️ Over-fetching data from database (performance concern only)

---

## 🧪 Testing

### Verification Steps

1. **Check Database State**:
   ```bash
   cd mcp-server && node check-txs.mjs
   ```
   Expected: Shows actual transaction counts by type

2. **Test RPC Filter**:
   ```bash
   node mcp-server/check-leave-transactions-only.mjs
   ```
   Expected: Shows RPC returning all transactions (confirming bug)

3. **Verify UI Display**:
   - Open Leave Management page
   - Check "Total Requests" KPI card
   - Should show: 1 (not 23) ✅

---

## 📝 Files Modified

### Workaround Implementation
- `/src/hooks/useHeraLeave.ts` (lines 384-397)
  - Added client-side filter for `transaction_type: 'LEAVE'`
  - Added diagnostic logging for filtered counts

### Diagnostic Scripts
- `/mcp-server/check-leave-transactions-only.mjs` (NEW)
  - Tests both direct query and RPC query
  - Confirms RPC filter bug
  - Shows transaction breakdown by type

### Documentation
- `/RPC-TRANSACTION-TYPE-FILTER-BUG.md` (THIS FILE)
  - Complete bug analysis
  - Workaround documentation
  - Fix recommendations

---

## 🚀 Deployment Status

**Status**: ✅ **Workaround Deployed**
**Branch**: `salon-inventory`
**Date**: 2025-01-27

**Next Steps**:
1. ✅ Client-side workaround implemented (immediate fix)
2. ⏳ Database RPC function fix required (proper solution)
3. ⏳ Remove client-side workaround after RPC fixed

---

## 📞 Related Issues

- **Original Report**: "Total Requests: 23" showing when database has 0-1 transactions
- **Initial Investigation**: Suspected React Query cache (cleared successfully)
- **Root Cause Discovery**: RPC function not filtering by transaction_type
- **Solution**: Client-side filtering workaround until RPC fixed

---

## ⚠️ Important Notes

1. **Cache Clearing Still Valid**: User should still clear browser cache as documented in `check-react-query-cache.md`
2. **RPC Bug Confirmation**: Verified with diagnostic script showing RPC returns all transaction types
3. **Workaround Performance**: Acceptable for current data volumes but should be fixed at RPC level
4. **Other Hooks**: Check if other components using `useUniversalTransactionV1` need similar workarounds

**End of Report**
