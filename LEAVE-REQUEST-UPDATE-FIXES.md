# Leave Request Update & Delete Fixes

## Issues Fixed

### 1. ✅ Leave Request Approval Not Updating Status
**Root Cause**: `hera_txn_crud_v1` RPC UPDATE requires `patch` wrapper for update fields

**Original Code** (`useUniversalTransactionV1.ts`):
```typescript
const updatePayload: any = {
  transaction_id,
  transaction_status: 'approved',  // ❌ Fields at root level
  metadata: { ... }
}
```

**Fixed Code**:
```typescript
const updatePayload = {
  transaction_id,
  patch: {                          // ✅ Wrapped in patch
    transaction_status: 'approved',
    metadata: { ... }
  }
}
```

**Files Modified**:
- `/src/hooks/useUniversalTransactionV1.ts` (lines 411-445)
  - Changed UPDATE payload structure to use `patch` wrapper
  - Now returns fresh data from RPC (confirmed by MCP test)
  - Added optimistic cache update for instant UI feedback

### 2. ✅ Draft → Submitted Status Not Updating
**Root Cause**: `updateRequest` mutation was not including `transaction_status` field

**Original Code** (`useHeraLeave.ts`):
```typescript
const result = await updateTransaction({
  transaction_id: requestId,
  source_entity_id: data.staff_id,
  target_entity_id: data.manager_id,
  total_amount: totalDays,
  metadata: updatedMetadata
  // ❌ Missing transaction_status
})
```

**Fixed Code**:
```typescript
const updatePayload: any = {
  transaction_id: requestId,
  source_entity_id: data.staff_id || existingRequest.staff_id,
  target_entity_id: data.manager_id || existingRequest.manager_id,
  total_amount: totalDays,
  metadata: updatedMetadata
}

// ✅ Include transaction_status if changing
if (data.status && data.status !== existingRequest.status) {
  updatePayload.transaction_status = data.status
}

const result = await updateTransaction(updatePayload)
```

**Files Modified**:
- `/src/hooks/useHeraLeave.ts` (lines 1027-1075)
  - Added conditional `transaction_status` update
  - Preserves existing status if not changing

### 3. ✅ Delete Request Enhanced Error Handling
**Root Cause**: Missing comprehensive error checking for orchestrator response pattern

**Original Code**:
```typescript
if (result.error) {
  throw new Error(result.error.message || 'Failed to delete request')
}
// ❌ No orchestrator/function level checks
```

**Fixed Code**:
```typescript
// ✅ Three-layer error checking
if (result.error) {
  console.error('❌ DELETE RPC client error:', result.error)
  throw new Error(result.error.message || 'Failed to delete request')
}

if (result.data && !result.data.success) {
  console.error('❌ DELETE orchestrator error:', result.data.error)
  throw new Error(result.data.error || 'DELETE operation failed')
}

if (result.data?.data && !result.data.data.success) {
  console.error('❌ DELETE function error:', result.data.data.error)
  throw new Error(result.data.data.error || 'DELETE function failed')
}
```

**Files Modified**:
- `/src/hooks/useHeraLeave.ts` (lines 1077-1129)
  - Added comprehensive logging
  - Added three-layer error checking (client → orchestrator → function)

## MCP Test Results

### Test Script: `mcp-server/test-txn-update-behavior.mjs`
**Purpose**: Verify `hera_txn_crud_v1` UPDATE returns fresh data

**Test Results** (✅ ALL PASS):
```
📊 UPDATE Response Structure:
   Outer action: UPDATE
   Outer success: true
   Inner action: READ
   Inner success: true

🔍 Returned Transaction Data:
   Status (CRITICAL): approved  ✅
   Metadata: { test_field: "updated_value" }  ✅
   Updated At: 2025-10-25T12:41:30.083385+00:00  ✅

📊 Direct READ Comparison:
   Status: approved  ✅ MATCH
   Metadata: { test_field: "updated_value" }  ✅ MATCH
   Updated At: 2025-10-25T12:41:30.083385+00:00  ✅ MATCH

🏁 FINAL VERDICT:
   ✅ UPDATE returns FRESH data - all values match
```

## Key Learnings

### 1. RPC Payload Structures
**`hera_txn_crud_v1` requires specific payload structures:**

- **CREATE**:
  ```typescript
  p_payload: {
    header: { ...fields },
    lines: [...]
  }
  ```

- **UPDATE**:
  ```typescript
  p_payload: {
    transaction_id: string,
    patch: { ...fields to update }  // ✅ MUST use patch wrapper
  }
  ```

- **READ/DELETE**:
  ```typescript
  p_payload: {
    transaction_id: string
  }
  ```

### 2. Response Validation Pattern
**Always check three levels for RPC orchestrator:**

```typescript
// Level 1: Supabase client error
if (error) throw new Error(error)

// Level 2: Orchestrator error
if (!data?.success) throw new Error(data?.error)

// Level 3: Function error
if (!data?.data?.success) throw new Error(data?.data?.error)
```

### 3. Cache Management
**With correct payload structure, optimistic updates work:**

```typescript
onSuccess: (updatedTransaction) => {
  // ✅ Can safely use returned data (now fresh!)
  queryClient.setQueryData(queryKey, (old) =>
    old.map(txn => txn.id === updatedTransaction.id ? updatedTransaction : txn)
  )

  // Background refetch
  queryClient.invalidateQueries({ queryKey: ['transactions-v1'] })
}
```

## Testing Checklist

- [ ] Leave approval updates status: draft → approved ✅
- [ ] Leave rejection updates status: draft → rejected ✅
- [ ] Draft edit and submit updates status: draft → submitted ✅
- [ ] Leave deletion removes from list ✅
- [ ] UI reflects changes immediately (optimistic update) ✅
- [ ] Page refetch shows fresh data ✅

## Related Files

- `/src/hooks/useUniversalTransactionV1.ts` - Transaction hook with correct UPDATE payload
- `/src/hooks/useHeraLeave.ts` - Leave management with status update fix
- `/mcp-server/test-txn-update-behavior.mjs` - MCP test verifying UPDATE behavior
- `/src/app/salon/leave/page.tsx` - Leave request page UI
- `/src/app/salon/leave/LeaveRequestsTab.tsx` - Leave requests tab component
- `/src/app/salon/leave/LeaveModal.tsx` - Leave request form modal

## Deployment Notes

1. **Zero Breaking Changes**: All fixes are backward compatible
2. **Immediate Effect**: UI will update instantly after deployment
3. **Database**: No schema changes required
4. **Testing**: Run MCP test to verify: `cd mcp-server && node test-txn-update-behavior.mjs`
