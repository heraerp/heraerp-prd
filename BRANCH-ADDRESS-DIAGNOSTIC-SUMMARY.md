# Branch Address Issue - Diagnostic Summary

## Issue Report
**Symptom**: Receipt shows correct branch NAME but WRONG address
**Example**: "Park Regis Kris Kin Hotel" with "Mercure Gold Hotel, Al Mina Road, Jumeirah" address

---

## Investigation Findings

### ✅ Database is Correct
Verified addresses in `core_dynamic_data`:
- **Park Regis** (`83f96b69-156f-4029-b636-638ad7b36c47`): " P Floor, Park Regis Kris Kin Hotel, Al Karama"
- **Mercure** (`db115f39-55c9-42cb-8d0f-99c7c10f9f1b`): "Mercure Gold Hotel, Al Mina Road, Jumeirah"

### ✅ Transaction Data is Correct (Mostly)
In `universal_transactions`:
- `target_entity_id` = STAFF ID (correct per architecture)
- `business_context.branch_id` = Correct branch ID
- `metadata.branch_id` = Correct branch ID

**However**: Some older transactions show `target_entity_id` pointing to staff, not branches.

### ✅ PaymentDialog Logic is Correct
`PaymentDialog.tsx` (lines 174-201):
1. Receives `branchId` prop from POS page
2. Calls `universalApi.getDynamicFields(branchId)`
3. Extracts `address` field correctly
4. Passes to Receipt via `saleData.branch_address`

### ✅ Receipt Logic is Correct
`Receipt.tsx` (lines 339, 346):
- Displays `saleData.branch_name` (correct)
- Displays `saleData.branch_address` (shows wrong address)

---

## Root Cause Hypothesis

The issue is likely in **how `selectedBranchId` is being set** in POS page.

### Flow When Loading from Appointment:

**POS Page** (`page.tsx` lines 176-180):
```typescript
if (appointmentData.branch_id) {
  console.log('[POSPage] 🏢 Setting branch:', appointmentData.branch_id)
  setSelectedBranchId(appointmentData.branch_id)
}
```

**Problem Scenarios:**

1. **Appointments don't have `branch_id`**
   Checked existing appointments in DB - they have NO `branch_id` in metadata.
   So `selectedBranchId` remains undefined until manually selected.

2. **State pollution from previous selection**
   If user previously selected Mercure branch, then loads Park Regis appointment without `branch_id`,
   the `selectedBranchId` state retains old Mercure ID.

3. **React state timing issue**
   When appointment loads, if `setSelectedBranchId(appointmentData.branch_id)` happens,
   but `PaymentDialog` opens before state propagates properly.

---

## Next Steps to Diagnose

### 1. Add Console Logging
Add this to `PaymentDialog.tsx` at line 201 (end of fetch

BranchDetails useEffect):

```typescript
console.log('[PaymentDialog] 🔍 Branch Details Fetch:', {
  branchId_prop: branchId,
  branchName_prop: branchName,
  fetched_address: branchDetails.address,
  org_id: organizationId
})
```

### 2. Test Scenario
1. Go to `/salon/pos`
2. Select **Mercure** branch manually
3. Add a service and customer
4. **Without clearing**, go to appointments/kanban
5. Load a **Park Regis** appointment
6. Process payment
7. Check console logs for what `branchId` is passed to PaymentDialog

### 3. Check Browser Console
When you see the wrong address, check console for:
```
[POSPage] 🏢 Setting branch: <id>
[PaymentDialog] 🔍 Branch Details Fetch: {...}
```

Compare the IDs to:
- Park Regis: `83f96b69-156f-4029-b636-638ad7b36c47`
- Mercure: `db115f39-55c9-42cb-8d0f-99c7c10f9f1b`

---

## Potential Fixes (After Confirmation)

### Option 1: Clear selectedBranchId when loading appointment
In `page.tsx`, modify appointment loading:
```typescript
// BEFORE loading appointment
setSelectedBranchId(undefined) // Clear previous selection

// THEN set from appointment data
if (appointmentData.branch_id) {
  setSelectedBranchId(appointmentData.branch_id)
}
```

### Option 2: Always require branch_id in appointments
Ensure appointments always have `branch_id` in metadata when created.

### Option 3: Use transaction metadata instead of prop
Modify PaymentDialog to read branch from transaction's `business_context.branch_id`
instead of relying on prop from POS page state.

---

## Key Architecture Points

✅ **CORRECT**: `target_entity_id` = Staff ID
✅ **CORRECT**: Branch ID stored in `business_context.branch_id` and `metadata.branch_id`
✅ **CORRECT**: PaymentDialog uses `branchId` prop to fetch address
❓ **TO INVESTIGATE**: How `branchId` prop gets set when loading from appointments

**DO NOT CHANGE**:
- Transaction RPC function (working correctly)
- `target_entity_id` to branch (should remain staff ID)
- PaymentDialog's address fetching logic

**INVESTIGATE**:
- POS page state management for `selectedBranchId`
- Appointment data structure (`branch_id` presence)
- State persistence between page navigations

---

## Console Commands to Run

```javascript
// In browser console on receipts page:
// Check what branch ID is in recent transactions
supabase
  .from('universal_transactions')
  .select('id, metadata, business_context')
  .eq('transaction_type', 'SALE')
  .order('created_at', { ascending: false })
  .limit(1)
  .then(({ data }) => {
    console.log('Branch from metadata:', data[0].metadata.branch_id)
    console.log('Branch from business_context:', data[0].business_context.branch_id)
  })
```

---

## Status

🔍 **Investigation Complete**
⏳ **Awaiting User Testing** - Need console logs from actual wrong-address scenario
🚫 **Do Not Change** - RPC, target_entity_id, or core architecture

**Next**: User should test and provide console logs showing what `branchId` is being passed.
