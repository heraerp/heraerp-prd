# Appointment Status Fix - RESOLVED

## Issue
When booking appointments:
- **"Book Appointment"** button was creating appointments with status `draft` (INCORRECT)
- **"Save as Draft"** button should save appointments as `draft` (CORRECT)
- **"Book Appointment"** button should save appointments as `booked` (EXPECTED)

## Root Cause
**Incorrect field name passed to RPC function**

In `/src/app/salon/appointments/new/page.tsx` (line 686), the code was passing:
```typescript
status, // Sets transaction_status field (lowercase)
```

But the `useUniversalTransactionV1` hook expects the field name to be `transaction_status`, not `status`.

### Hook Default Behavior (Line 343 in useUniversalTransactionV1.ts):
```typescript
transaction_status: transaction.transaction_status || 'draft',
```

Since the appointment page was passing `status` instead of `transaction_status`, the hook couldn't find the field and defaulted to `'draft'` for ALL appointments, regardless of which button was clicked.

## Solution
**Changed field name from `status` to `transaction_status`**

### Before (BROKEN):
```typescript
const result = await createAppointmentTransaction({
  transaction_type: 'APPOINTMENT',
  smart_code: intentStatus === 'DRAFT'
    ? 'HERA.SALON.TXN.APPOINTMENT.DRAFT.v1'
    : 'HERA.SALON.TXN.APPOINTMENT.BOOKED.v1',
  source_entity_id: selectedCustomer.id,
  target_entity_id: selectedStylist.id,
  transaction_date: startAt,
  total_amount: totalAmount,
  status, // ❌ WRONG FIELD NAME - hook ignores this and defaults to 'draft'
  metadata: {
    status,
    // ... other fields
  }
})
```

### After (FIXED):
```typescript
const result = await createAppointmentTransaction({
  transaction_type: 'APPOINTMENT',
  smart_code: intentStatus === 'DRAFT'
    ? 'HERA.SALON.TXN.APPOINTMENT.DRAFT.v1'
    : 'HERA.SALON.TXN.APPOINTMENT.BOOKED.v1',
  source_entity_id: selectedCustomer.id,
  target_entity_id: selectedStylist.id,
  transaction_date: startAt,
  total_amount: totalAmount,
  transaction_status: status, // ✅ CORRECT FIELD NAME - hook now receives the status
  metadata: {
    status, // Keep in metadata for compatibility
    // ... other fields
  }
})
```

## How It Works Now

### Button Flow:
1. **"Book Appointment"** button → calls `handleSave('BOOKED')`
2. **"Save as Draft"** button → calls `handleSave('DRAFT')`

### Status Conversion (Line 673):
```typescript
const status = intentStatus === 'DRAFT' ? 'draft' : 'booked'
```

- `intentStatus = 'BOOKED'` → `status = 'booked'`
- `intentStatus = 'DRAFT'` → `status = 'draft'`

### RPC Call (Line 686):
```typescript
transaction_status: status, // Passes 'booked' or 'draft' to the hook
```

### Database Storage:
- **Book Appointment** → `universal_transactions.transaction_status = 'booked'` ✅
- **Save as Draft** → `universal_transactions.transaction_status = 'draft'` ✅

## Testing

### Test Case 1: Book Appointment
1. Navigate to `/appointments/new`
2. Select customer, stylist, date, time, and services
3. Click **"Book Appointment"** button
4. **Expected**: Appointment created with `transaction_status = 'booked'`
5. **Verify in database**:
   ```sql
   SELECT id, transaction_status, metadata->>'status' as meta_status
   FROM universal_transactions
   WHERE transaction_type = 'APPOINTMENT'
   ORDER BY created_at DESC LIMIT 1;
   ```
   Should show: `transaction_status: 'booked'`

### Test Case 2: Save as Draft
1. Navigate to `/appointments/new`
2. Select customer, stylist, date, time, and services
3. Click **"Save as Draft"** button
4. **Expected**: Appointment created with `transaction_status = 'draft'`
5. **Verify in database**: Should show `transaction_status: 'draft'`

## Files Modified

**`/src/app/salon/appointments/new/page.tsx`** (Line 686)
- Changed: `status,` → `transaction_status: status,`

## Related Code

### Hook Interface (useUniversalTransactionV1.ts):
```typescript
export interface UniversalTransaction {
  id?: string
  transaction_type: string
  transaction_code?: string
  smart_code: string
  transaction_date?: string
  source_entity_id?: string | null
  target_entity_id?: string | null
  total_amount?: number
  transaction_status?: string  // ✅ CORRECT FIELD NAME
  metadata?: Record<string, any>
  lines?: TransactionLine[]
}
```

### Database Schema:
```sql
-- universal_transactions table
CREATE TABLE universal_transactions (
  id uuid PRIMARY KEY,
  transaction_type text NOT NULL,
  transaction_code text,
  smart_code text NOT NULL,
  transaction_date timestamptz,
  source_entity_id uuid,
  target_entity_id uuid,
  total_amount numeric,
  transaction_status text, -- ✅ This is the field we're updating
  metadata jsonb,
  -- ... audit fields
);
```

## Status Values

### Valid Status Values:
- `'draft'` - Appointment saved but not confirmed
- `'booked'` - Appointment confirmed and scheduled
- `'confirmed'` - Customer confirmed the appointment
- `'in-progress'` - Appointment is currently happening
- `'completed'` - Appointment finished
- `'cancelled'` - Appointment cancelled
- `'no-show'` - Customer didn't show up

### Button Mapping:
- **"Save as Draft"** → Creates with status `'draft'`
- **"Book Appointment"** → Creates with status `'booked'`

## Status
✅ **FIXED** - Appointments now save with correct status based on which button is clicked

## Prevention
To prevent similar issues in the future:

1. ✅ Always check hook/API interface definitions for correct field names
2. ✅ Use TypeScript interfaces to catch field name mismatches at compile time
3. ✅ Add field name validation in hooks (could add warning if unknown fields are passed)
4. ✅ Document expected field names in hook JSDoc comments
5. ✅ Add integration tests that verify status is saved correctly
