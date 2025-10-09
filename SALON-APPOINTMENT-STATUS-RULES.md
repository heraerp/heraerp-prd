# Salon Appointments - Enterprise Status Management ✅

## 🎯 Status Workflow

### Status Types
```typescript
type AppointmentStatus =
  | 'draft'           // Initial state - not confirmed
  | 'booked'          // Confirmed by customer
  | 'checked_in'      // Customer arrived
  | 'in_progress'     // Service started
  | 'payment_pending' // Service completed, awaiting payment
  | 'completed'       // Fully completed and paid (TERMINAL)
  | 'cancelled'       // Cancelled by customer or salon (TERMINAL)
  | 'no_show'         // Customer didn't show up (TERMINAL)
```

## 📋 Valid Status Transitions

### Draft → Booked, Cancelled
- **Use Case**: Initial appointment creation
- **Actions Available**: View/Edit, Cancel, Postpone, Delete

### Booked → Checked In, Cancelled, No Show
- **Use Case**: Confirmed appointments
- **Actions Available**: View/Edit, Cancel, Postpone

### Checked In → In Progress, Cancelled
- **Use Case**: Customer has arrived
- **Actions Available**: View/Edit, Cancel, Postpone

### In Progress → Payment Pending, Completed
- **Use Case**: Service is happening
- **Actions Available**: View/Edit, Cancel (emergency only)

### Payment Pending → Completed, Cancelled
- **Use Case**: Service done, waiting for payment
- **Actions Available**: View/Edit, Cancel (rare)

### Completed (Terminal State)
- **Use Case**: Fully completed transaction
- **Actions Available**: View/Edit only (no cancel, no postpone, no delete)

### Cancelled (Terminal State)
- **Use Case**: Appointment was cancelled
- **Actions Available**: View/Edit, Restore (to draft)

### No Show (Terminal State)
- **Use Case**: Customer didn't arrive
- **Actions Available**: View/Edit, Restore (to draft)

---

## 🔘 Button Visibility Matrix

| Status | View/Edit | Cancel | Postpone | Delete | Restore |
|--------|-----------|--------|----------|--------|---------|
| **draft** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **booked** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **checked_in** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **in_progress** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **payment_pending** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **completed** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **cancelled** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **no_show** | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 🛡️ Enterprise Business Rules

### 1. **Delete Button**
- ✅ **ONLY** available for `draft` appointments
- ❌ **NOT** available for any other status
- **Reason**: Prevents accidental data loss for confirmed appointments

### 2. **Cancel Button**
- ✅ Available for: `draft`, `booked`, `checked_in`, `in_progress`, `payment_pending`
- ❌ NOT available for: `completed`, `cancelled`, `no_show`
- **Features**:
  - Confirmation dialog with optional reason field
  - Reason saved to appointment notes with timestamp
  - Audit trail maintained

### 3. **Postpone Button**
- ✅ Available for: `draft`, `booked`, `checked_in`
- ❌ NOT available for: `in_progress`, `payment_pending`, `completed`, `cancelled`, `no_show`
- **Features**:
  - Date and time picker with validation
  - Minimum date: today
  - Real-time preview of new appointment time
  - Duration preserved automatically
  - History note added to appointment
  - Requires both date AND time before allowing reschedule

### 4. **Restore Button**
- ✅ Available for: `cancelled`, `no_show`
- ❌ NOT available for any other status
- **Behavior**:
  - Restores appointment to `draft` status
  - Bypasses status transition validation
  - Allows customer to rebook the appointment

### 5. **View/Edit Button**
- ✅ Available for ALL statuses
- **Purpose**: Always allow viewing appointment details and editing metadata

---

## 🔄 Special Operations

### Restore Operation
```typescript
// Bypasses validation, restores to draft
restoreAppointment(id: string) → status: 'draft'
```

**Why skip validation?**
- Cancelled/No Show are terminal states
- Cannot transition from terminal states normally
- Restore is a special administrative action
- Returns appointment to initial draft state for rebooking

### Cancel with Reason
```typescript
// Updates status to cancelled and saves reason
cancelAppointment({
  id: string,
  reason?: string  // Optional but recommended
})
```

**Implementation**:
1. Update transaction_status to 'cancelled'
2. If reason provided, append to appointment notes
3. Include timestamp of cancellation
4. Invalidate related queries

### Postpone with History
```typescript
// Updates date/time and records change
postponeAppointment({
  id: string,
  new_date: string,
  new_time: string
})
```

**Implementation**:
1. Calculate new start_time from date + time
2. Calculate new end_time (start_time + duration)
3. Add history note with original appointment time
4. Update transaction metadata
5. Invalidate related queries

---

## 🎨 UI Considerations

### Opacity
- Active appointments: **100%** opacity
- Cancelled/No Show: **60%** opacity (visual distinction)

### Button Colors
- **Cancel**: Bronze (#8C7853) - Warning color
- **Postpone**: Blue (#3B82F6) - Action color
- **Delete**: Rose (#E8B4B8) - Danger color
- **Restore**: Emerald (#0F6F5C) - Success color

### Loading States
- Show spinner with descriptive text
- Disable all buttons during mutation
- Toast notifications for success/error

---

## ✅ Validation Rules

### Status Transition Validation
```typescript
// Validates if transition is allowed
canTransitionTo(currentStatus, newStatus) → boolean
```

**Exception**: Restore operation bypasses validation

### Postpone Validation
- ✅ New date must be today or future
- ✅ Both date AND time required
- ✅ Duration preserved from original appointment
- ✅ Preview shown before confirmation

### Cancel Validation
- ✅ Confirmation dialog required
- ✅ Reason field optional but encouraged
- ✅ Terminal state (cannot undo without restore)

### Delete Validation
- ✅ Only draft appointments
- ✅ Confirmation dialog required
- ✅ Permanent deletion (force: true)
- ✅ Warning about irreversibility

---

## 📊 Smart Code Integration

All operations use proper HERA smart codes:

```typescript
// Create
'HERA.SALON.TXN.APPOINTMENT.CREATE.V1'

// Update (including status, postpone)
'HERA.SALON.TXN.APPOINTMENT.UPDATE.V1'

// Cancel (uses update with status change)
'HERA.SALON.TXN.APPOINTMENT.UPDATE.V1'

// Restore (uses update with skipValidation)
'HERA.SALON.TXN.APPOINTMENT.UPDATE.V1'
```

---

## 🔍 Testing Scenarios

### Scenario 1: Draft → Booked → Completed
1. Create draft appointment
2. Verify all buttons visible (cancel, postpone, delete)
3. Change status to booked
4. Verify delete button hidden
5. Change to completed
6. Verify only view/edit available

### Scenario 2: Cancel with Reason
1. Book an appointment
2. Click cancel button
3. Enter cancellation reason
4. Verify reason saved in notes
5. Verify status changed to cancelled
6. Verify restore button appears

### Scenario 3: Postpone
1. Create booked appointment
2. Click postpone button
3. Select new date and time
4. Verify preview shows correct datetime
5. Confirm postpone
6. Verify times updated
7. Verify history note added

### Scenario 4: Restore Cancelled
1. Cancel an appointment
2. Click restore button
3. Verify status changed to draft
4. Verify all draft buttons available
5. Verify original data preserved

---

## 🚀 Production Ready

All features are enterprise-grade:
- ✅ Proper status workflow enforcement
- ✅ Validation at both UI and backend levels
- ✅ Complete audit trail
- ✅ User-friendly error messages
- ✅ Responsive design
- ✅ Accessibility considerations
- ✅ Performance optimized (memoization)
- ✅ Clean, maintainable code

---

**Version**: 2025-01-10 (Enterprise v2)
**Status**: ✅ Production Ready
**Priority**: P0 - Core Business Logic
**Author**: HERA DNA System
