# Appointment Status Update After Payment - Analysis & Fix

## Current Flow

### 1. Appointments Page → POS
**File**: `/src/app/salon/appointments/page.tsx`

**Lines 1445-1458**:
```typescript
const appointmentData = {
  id: appointment.id,
  customer_id: appointment.metadata?.customer_id,
  customer_name: appointment.entity_name,
  stylist_id: appointment.metadata?.stylist_id,
  stylist_name: appointment.metadata?.stylist_name,
  service_ids: appointment.metadata?.service_ids || [],
  service_names: appointment.metadata?.service_names || [],
  service_prices: appointment.metadata?.service_prices || [],
  branch_id: appointment.metadata?.branch_id,
  customer: {
    name: appointment.entity_name,
    phone: appointment.metadata?.customer_phone,
    email: appointment.metadata?.customer_email,
    new: appointment.metadata?.new_customer || false
  },
  metadata: appointment.metadata,
  _source: 'appointments',
  _timestamp: new Date().toISOString()
}

// Store appointment details in sessionStorage for POS page
sessionStorage.setItem('pos_appointment', JSON.stringify(appointmentData))

// Navigate to POS with appointment ID
router.push(`/salon/pos?appointment=${appointment.id}`)
```

**What it does**:
- ✅ Stores appointment data in sessionStorage
- ✅ Navigates to POS with appointment ID
- ✅ POS page loads the appointment data

### 2. POS Page Loads Appointment
**File**: `/src/app/salon/pos/page.tsx`

**Lines 129-180** (Appointment loading):
```typescript
const storedAppointment = sessionStorage.getItem('pos_appointment')
if (storedAppointment) {
  try {
    const appointmentData = JSON.parse(storedAppointment)

    // Add customer info
    if (appointmentData.customer_id && appointmentData.customer_name) {
      addCustomerToTicket({
        customer_id: appointmentData.customer_id,
        customer_name: appointmentData.customer_name
      })
    }

    // Add stylist as default
    if (appointmentData.stylist_id && appointmentData.stylist_name) {
      setDefaultStylistId(appointmentData.stylist_id)
      setDefaultStylistName(appointmentData.stylist_name)
    }

    // Set branch if available
    if (appointmentData.branch_id) {
      setSelectedBranchId(appointmentData.branch_id)
    }

    // Add services to cart
    addItemsFromAppointment({
      appointment_id: appointmentData.id, // ✅ Appointment ID is stored
      customer_id: appointmentData.customer_id || '',
      customer_name: appointmentData.customer_name || 'Walk-in',
      services
    })
  }
}
```

**What it does**:
- ✅ Loads appointment data from sessionStorage
- ✅ Populates POS cart with appointment details
- ✅ **Stores `appointment_id` in the ticket**

### 3. Payment Completion Handler
**File**: `/src/app/salon/pos/page.tsx`

**Lines 593-603** (CURRENT - Missing status update):
```typescript
const handlePaymentComplete = useCallback(
  (saleData: any) => {
    setCompletedSale(saleData)
    setIsPaymentOpen(false)
    setIsReceiptOpen(true)
    clearTicket()
    // Clear default stylist and customer for next bill
    setDefaultStylistId(undefined)
    setDefaultStylistName(undefined)
    setSelectedCustomer(null)
  },
  [clearTicket]
)
```

**What's missing**:
- ❌ **NO appointment status update!**
- The appointment remains in 'payment_pending' or whatever status it was in
- No indication that the appointment was completed

---

## The Problem

**Scenario**:
1. User sees appointment in "Scheduled" or "Payment Pending" status
2. User clicks "Process Payment" → Navigates to POS
3. User completes payment in POS
4. Receipt is shown
5. **BUG**: User goes back to appointments page → appointment STILL shows as "Scheduled" or "Payment Pending"

**Expected behavior**:
- After payment completion, appointment status should be updated to "completed"

---

## The Solution

### Available Tools

**Hook**: `useHeraAppointments`
**Location**: `/src/hooks/useHeraAppointments.ts`

**Function** (Lines 453-455):
```typescript
const updateAppointmentStatus = async ({
  id,
  status
}: {
  id: string;
  status: AppointmentStatus
}) => {
  return updateAppointment({ id, data: { status } })
}
```

**Appointment Statuses** (Lines 31-39):
```typescript
export type AppointmentStatus =
  | 'draft'           // Initial state - not confirmed
  | 'booked'          // Confirmed by customer
  | 'checked_in'      // Customer arrived
  | 'in_progress'     // Service started
  | 'payment_pending' // Service completed, awaiting payment
  | 'completed'       // ✅ Fully completed and paid
  | 'cancelled'       // Cancelled by customer or salon
  | 'no_show'         // Customer didn't show up
```

**Valid Transitions** (Lines 44-51):
```typescript
export const VALID_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  draft: ['booked', 'checked_in', 'in_progress', 'payment_pending', 'completed', 'cancelled'],
  booked: ['checked_in', 'in_progress', 'payment_pending', 'completed', 'cancelled', 'no_show'],
  checked_in: ['in_progress', 'payment_pending', 'completed', 'cancelled', 'no_show'],
  in_progress: ['payment_pending', 'completed', 'cancelled'],
  payment_pending: ['completed', 'cancelled'], // ✅ Can transition to completed
  completed: [], // Terminal state
  cancelled: [],
  no_show: []
}
```

---

## The Fix

### Step 1: Import the Hook
**File**: `/src/app/salon/pos/page.tsx`

**Add to imports** (around line 20):
```typescript
import { useHeraAppointments } from '@/hooks/useHeraAppointments'
```

### Step 2: Get updateAppointmentStatus Function
**Add inside POSContent component** (around line 48):
```typescript
function POSContent() {
  const { user, organization, selectedBranchId, availableBranches, setSelectedBranchId } =
    useSecuredSalonContext()
  const { toast } = useToast()

  // ✅ ADD THIS: Get appointment update function
  const { updateAppointmentStatus } = useHeraAppointments()

  // ... rest of the component
```

### Step 3: Update handlePaymentComplete
**Replace lines 593-603** with:
```typescript
const handlePaymentComplete = useCallback(
  async (saleData: any) => {
    setCompletedSale(saleData)
    setIsPaymentOpen(false)
    setIsReceiptOpen(true)

    // ✅ NEW: Update appointment status to completed if payment was for an appointment
    if (ticket.appointment_id) {
      try {
        console.log('[POSPage] 📝 Updating appointment status to completed:', ticket.appointment_id)

        await updateAppointmentStatus({
          id: ticket.appointment_id,
          status: 'completed'
        })

        console.log('[POSPage] ✅ Appointment status updated successfully')

        toast({
          title: '✅ Appointment Completed',
          description: 'Appointment status has been updated to completed.',
          duration: 2000
        })
      } catch (error) {
        console.error('[POSPage] ❌ Failed to update appointment status:', error)

        // Don't block the payment flow, just show a warning
        toast({
          title: '⚠️ Status Update Failed',
          description: 'Payment was successful but appointment status could not be updated.',
          variant: 'destructive',
          duration: 5000
        })
      }
    }

    clearTicket()
    // Clear default stylist and customer for next bill
    setDefaultStylistId(undefined)
    setDefaultStylistName(undefined)
    setSelectedCustomer(null)
  },
  [clearTicket, ticket.appointment_id, updateAppointmentStatus, toast]
)
```

---

## Complete Implementation

Here's the full code change needed:

```typescript
// File: /src/app/salon/pos/page.tsx

// 1. Add import at the top
import { useHeraAppointments } from '@/hooks/useHeraAppointments'

function POSContent() {
  // ... existing code ...

  // 2. Add hook
  const { updateAppointmentStatus } = useHeraAppointments()

  // ... existing code ...

  // 3. Update handlePaymentComplete
  const handlePaymentComplete = useCallback(
    async (saleData: any) => {
      setCompletedSale(saleData)
      setIsPaymentOpen(false)
      setIsReceiptOpen(true)

      // ✅ Update appointment status to completed if payment was for an appointment
      if (ticket.appointment_id) {
        try {
          console.log('[POSPage] 📝 Updating appointment status to completed:', ticket.appointment_id)

          await updateAppointmentStatus({
            id: ticket.appointment_id,
            status: 'completed'
          })

          console.log('[POSPage] ✅ Appointment status updated successfully')

          toast({
            title: '✅ Appointment Completed',
            description: 'Appointment status has been updated to completed.',
            duration: 2000
          })
        } catch (error) {
          console.error('[POSPage] ❌ Failed to update appointment status:', error)

          // Don't block the payment flow, just show a warning
          toast({
            title: '⚠️ Status Update Failed',
            description: 'Payment was successful but appointment status could not be updated.',
            variant: 'destructive',
            duration: 5000
          })
        }
      }

      clearTicket()
      // Clear default stylist and customer for next bill
      setDefaultStylistId(undefined)
      setDefaultStylistName(undefined)
      setSelectedCustomer(null)
    },
    [clearTicket, ticket.appointment_id, updateAppointmentStatus, toast]
  )

  // ... rest of component ...
}
```

---

## Testing the Fix

### Test Scenario:
1. **Go to /salon/appointments**
2. **Find an appointment** (any status: draft, booked, payment_pending, etc.)
3. **Click "Process Payment"** button
4. **Complete the payment** in POS
5. **Check receipt** - should show success
6. **Go back to /salon/appointments**
7. **Verify**: The appointment status should now show "Completed" ✅

### Edge Cases to Test:
1. **Walk-in customer** (no appointment_id):
   - Payment should work normally
   - No appointment status update should happen
   - No error should be shown

2. **Payment fails**:
   - Appointment status should NOT be updated
   - Remains in original status

3. **Status update fails** (e.g., invalid transition):
   - Payment should still complete successfully
   - User sees warning toast
   - Receipt is still shown

---

## Benefits of This Fix

1. ✅ **Complete Workflow**: Appointment lifecycle is properly closed
2. ✅ **Accurate Reporting**: Dashboard shows correct appointment statuses
3. ✅ **Better UX**: Users can see which appointments are paid/completed
4. ✅ **Non-Blocking**: Status update failure doesn't block payment
5. ✅ **Safe**: Only updates if appointment_id exists in ticket
6. ✅ **Validated**: Uses existing HERA status transition validation

---

## Alternative: Status Update in Backend (Future Enhancement)

Currently, the status update happens in the client (POS page).

**Future improvement**: Move status update to the backend (RPC function):
- Update `hera_txn_create_v1` or create a new RPC
- When transaction is created with `appointment_id` in metadata
- Automatically update appointment status to 'completed'
- More reliable (can't be skipped by client)
- Atomic operation (transaction + status update)

**Benefit**: Even if the client crashes or loses connection after payment, the appointment status would still be updated.

**Location for future enhancement**: `/mcp-server/hera-txn-create-v1.sql` or create new RPC function `hera_appointment_complete_v1.sql`

---

## Status

- ❌ **Current**: Appointment status NOT updated after payment
- ✅ **After Fix**: Appointment status automatically updated to 'completed'
- 🚀 **Ready to implement**: All code provided above

**Estimated effort**: 5 minutes to implement and test
