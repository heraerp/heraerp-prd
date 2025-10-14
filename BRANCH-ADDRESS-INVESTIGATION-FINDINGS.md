# Branch Address Investigation - Detailed Findings

## Issue Summary
Receipt shows **correct branch NAME** but **WRONG address**:
- **Example**: "Park Regis Kris Kin Hotel" (correct) with "Mercure Gold Hotel, Al Mina Road, Jumeirah" address (wrong)

---

## Investigation Complete ✅

### 1. Database Verification
✅ **Database addresses are CORRECT** (verified via `simulate-payment-dialog-lookup.js`):
- **Park Regis** (`83f96b69-156f-4029-b636-638ad7b36c47`): " P Floor, Park Regis Kris Kin Hotel, Al Karama"
- **Mercure** (`db115f39-55c9-42cb-8d0f-99c7c10f9f1b`): "Mercure Gold Hotel, Al Mina Road, Jumeirah"

### 2. Transaction Structure Verification
✅ **Transaction architecture is CORRECT** (verified via `check-sale-transactions.js`):
```typescript
{
  target_entity_id: "STAFF_ID",  // Pavan, Aman, Ramesh, etc.
  business_context: {
    branch_id: "BRANCH_ID"  // 83f96b69... (Park Regis) or db115f39... (Mercure)
  },
  metadata: {
    branch_id: "BRANCH_ID"  // Same as business_context
  }
}
```

**Example from most recent transaction** (eb4679b5-1cef-4028-99df-693425233d6d):
- `target_entity_id`: b5fc250f-f9e3-4a4f-a69c-af44e44caf39 (Pavan - STAFF) ✅
- `business_context.branch_id`: 83f96b69-156f-4029-b636-638ad7b36c47 (Park Regis) ✅
- `metadata.branch_id`: 83f96b69-156f-4029-b636-638ad7b36c47 (Park Regis) ✅

---

## Complete Code Flow Analysis

### Flow 1: POS Page State Management
**File**: `/src/app/salon/pos/page.tsx`

1. **Branch Selection** (lines 439-442):
   ```typescript
   const handleBranchChange = useCallback((branchId: string) => {
     console.log('[POSPage] ✅ Branch changed from catalog:', branchId)
     setSelectedBranchId(branchId)
   }, [setSelectedBranchId])
   ```

2. **Appointment Loading** (lines 176-180):
   ```typescript
   // Set branch if available
   if (appointmentData.branch_id) {
     console.log('[POSPage] 🏢 Setting branch:', appointmentData.branch_id)
     setSelectedBranchId(appointmentData.branch_id)
   }
   ```
   ⚠️ **CRITICAL**: Only sets branch if appointment HAS `branch_id`. If not present, `selectedBranchId` is NOT updated!

3. **PaymentDialog Invocation** (lines 764-774):
   ```typescript
   <PaymentDialog
     open={isPaymentOpen}
     onClose={() => setIsPaymentOpen(false)}
     ticket={ticket}
     totals={totals}
     organizationId={effectiveOrgId!}
     organizationName={organization?.name}
     branchId={selectedBranchId}  // ← Passes current state value
     branchName={availableBranches?.find(b => b.id === selectedBranchId)?.entity_name}
     onComplete={handlePaymentComplete}
   />
   ```

### Flow 2: PaymentDialog Address Fetching
**File**: `/src/components/salon/pos/PaymentDialog.tsx`

1. **Branch Address Fetch** (lines 174-209):
   ```typescript
   useEffect(() => {
     const fetchBranchDetails = async () => {
       if (!branchId || !organizationId) return

       try {
         const { universalApi } = await import('@/lib/universal-api-v2')

         universalApi.setOrganizationId(organizationId)
         const result = await universalApi.getDynamicFields(branchId)  // ← Uses branchId prop

         if (result.success && result.data && Array.isArray(result.data)) {
           const addressField = result.data.find((f: any) => f.field_name === 'address')

           console.log('[PaymentDialog] 🏠 Branch Address Fetch Result:', {
             branchId_received: branchId,
             branchName_received: branchName,
             fetched_address: addressField?.field_value_text || 'No address',
             fetched_phone: phoneField?.field_value_text || 'No phone',
             total_fields_found: result.data.length
           })

           setBranchDetails({
             address: addressField?.field_value_text || undefined,
             phone: phoneField?.field_value_text || undefined
           })
         }
       } catch (err) {
         console.error('[PaymentDialog] Error fetching branch details:', err)
       }
     }

     fetchBranchDetails()
   }, [branchId, organizationId])  // ← Re-runs when branchId prop changes
   ```

2. **Transaction Creation** (line 127):
   ```typescript
   const checkoutData = {
     customer_id: ticket.customer_id,
     appointment_id: ticket.appointment_id,
     branch_id: branchId,  // ← Uses same branchId prop
     items: ...
   }
   ```

3. **Sale Data for Receipt** (lines 192-211):
   ```typescript
   const saleData = {
     transaction_id: result.transaction_id,
     transaction_code: result.transaction_code,
     timestamp: new Date().toISOString(),
     customer_name: ticket.customer_name,
     branch_id: branchId,  // ← From prop
     branch_name: branchName || 'Main Branch',  // ← From prop
     ...(branchDetails.address && { branch_address: branchDetails.address }),  // ← From fetch
     ...(branchDetails.phone && { branch_phone: branchDetails.phone }),
     ...
   }
   ```

### Flow 3: Transaction Storage
**File**: `/src/hooks/usePosCheckout.ts`

**Lines 320-350**:
```typescript
const result = await createTransaction({
  transaction_type: 'SALE',
  smart_code: 'HERA.SALON.TXN.SALE.CREATE.V1',
  transaction_date: new Date().toISOString(),
  source_entity_id: customer_id || null,
  target_entity_id: primaryStaffId,  // ✅ Staff ID (correct)
  total_amount,
  status: 'completed',
  metadata: {
    subtotal,
    discount_total,
    tip_total,
    tax_amount,
    tax_rate,
    payment_methods: payments.map(p => p.method),
    notes,
    pos_session: Date.now().toString(),
    appointment_id,
    branch_id,  // ✅ Store branch ID for location tracking
    customer_entity_id: customer_id,
    staff_entity_id: primaryStaffId,
    ...
  },
  lines
})
```

---

## Hypothesis: State Pollution Bug

### Scenario That Causes Wrong Address

1. **User selects Mercure branch manually**
   - `selectedBranchId` = `db115f39-55c9-42cb-8d0f-99c7c10f9f1b` (Mercure)

2. **User processes some transactions**
   - Works correctly with Mercure

3. **User loads Park Regis appointment from Kanban board**
   - Appointment metadata does NOT contain `branch_id`
   - `page.tsx` lines 176-180: Since `appointmentData.branch_id` is undefined, `setSelectedBranchId()` is NOT called
   - **`selectedBranchId` state STILL has Mercure ID!**

4. **User manually selects Park Regis from catalog**
   - `handleBranchChange` is called
   - `selectedBranchId` = `83f96b69-156f-4029-b636-638ad7b36c47` (Park Regis)
   - Console log: `[POSPage] ✅ Branch changed from catalog: 83f96b69...`

5. **User opens PaymentDialog**
   - PaymentDialog receives `branchId` = Park Regis ID ✅
   - Fetches Park Regis address ✅
   - Creates transaction with Park Regis branch_id ✅

### But Wait - If Everything Is Correct, Why Wrong Address?

**Possible Issues**:

1. **Timing/Race Condition**:
   - Address fetch in PaymentDialog is async (useEffect)
   - Maybe receipt is generated BEFORE fetch completes?
   - But there's no loading state check...

2. **Receipt Reading Cached Data**:
   - Maybe Receipt component has stale address from previous sale?
   - Need to check Receipt component for state management

3. **React State Stale Closure**:
   - Maybe `branchDetails` state in PaymentDialog doesn't update properly?
   - But useEffect has `[branchId, organizationId]` deps, should re-run...

4. **Multiple Branch Changes Rapidly**:
   - User changes branch multiple times quickly
   - React batches state updates
   - Last update might not propagate to all components

---

## Diagnostic Logging Added

**File**: `PaymentDialog.tsx` lines 189-195

```typescript
console.log('[PaymentDialog] 🏠 Branch Address Fetch Result:', {
  branchId_received: branchId,
  branchName_received: branchName,
  fetched_address: addressField?.field_value_text || 'No address',
  fetched_phone: phoneField?.field_value_text || 'No phone',
  total_fields_found: result.data.length
})
```

This will show EXACTLY:
- What branch ID PaymentDialog received as prop
- What branch name it received
- What address was fetched from database
- When this happened

---

## Next Steps - AWAITING USER TEST

### What User Should Do:
1. **Reproduce the bug exactly as it happened**:
   - Start fresh or clear current cart
   - Select Mercure branch (or any branch)
   - Add some items, maybe process a payment
   - Go to appointments/kanban
   - Load a Park Regis appointment
   - Process payment
   - **Check console logs BEFORE and DURING payment**

2. **Look for these console logs**:
   ```
   [POSPage] ✅ Branch changed from catalog: <id>
   [PaymentDialog] 🏠 Branch Address Fetch Result: {...}
   ```

3. **Provide screenshot or copy of console output**

### What We'll Learn:
- Exact branchId received by PaymentDialog
- Exact address fetched from database
- Whether they match or mismatch
- Timing of when fetch happens vs when receipt is generated

---

## Additional Issue Found: Total Amount Doubling 🚨

**From Transaction Script**:
```
💰 Transaction: eb4679b5-1cef-4028-99df-693425233d6d
   Customer-facing total: AED 472.50
   Stored total_amount: AED 945.00
   🚨 DOUBLED! Payment lines likely included in total
```

This suggests the RPC function (`hera_txn_create_v1`) is STILL including payment line amounts in `total_amount` field, even though we removed commission line creation.

**Root cause**: The RPC function's `total_amount` calculation is summing ALL lines including payment lines.

**Current workaround**: Display logic in `SaleDetailsDialog.tsx` and `useHeraSales.ts` calculates total from metadata/lines instead of using `total_amount` field.

**Permanent fix needed**: Update RPC function to calculate `total_amount` correctly (exclude payment and commission lines).

---

## Files Modified in This Session

### 1. `PaymentDialog.tsx` (lines 189-195)
**Change**: Added diagnostic logging
**Reason**: Trace exact branch ID and address being fetched
**Status**: ✅ Added, awaiting user test

### 2. Diagnostic Scripts Created
- `simulate-payment-dialog-lookup.js` - Verified database addresses
- `check-sale-transactions.js` - Verified transaction structure
- `check-lowercase-appointments.js` - Check appointment metadata

---

## Architecture Confirmed ✅

**DO NOT CHANGE**:
- ✅ `source_entity_id` = Customer ID
- ✅ `target_entity_id` = Staff ID (NOT branch)
- ✅ `business_context.branch_id` = Branch ID
- ✅ `metadata.branch_id` = Branch ID
- ✅ PaymentDialog uses `branchId` prop from POS page state
- ✅ PaymentDialog fetches address using `universalApi.getDynamicFields(branchId)`
- ✅ Transaction created with same `branchId`

**INVESTIGATE FURTHER**:
- ❓ State management in POS page when loading appointments
- ❓ Timing of address fetch vs receipt generation
- ❓ Receipt component for stale state
- ❓ React state closure issues

---

## Status: 🔍 Investigation Phase

**Completed**:
- ✅ Database verification
- ✅ Transaction structure verification
- ✅ Code flow analysis
- ✅ Diagnostic logging added

**Awaiting**:
- ⏳ User test with new diagnostic logging
- ⏳ Console output showing actual vs expected values

**Do Not Proceed Until**:
- User confirms the bug still occurs
- User provides console logs showing what address is fetched

---

## Important Notes

1. **No Code Changes Without User Approval** ✅
   - User explicitly said: "dont change. first check what is happening. check with me before changing anything"
   - Only diagnostic logging added (non-functional change)

2. **Architecture is Correct** ✅
   - `target_entity_id` = Staff (not branch) is correct per user
   - Branch stored in metadata is correct per HERA architecture

3. **Database is Clean** ✅
   - No data corruption
   - No concatenated addresses
   - No duplicate "Hotel" references

4. **Hypothesis Needs Confirmation** ⚠️
   - State pollution theory makes sense
   - But need actual console logs to confirm
   - Could be timing issue, caching, or something else
