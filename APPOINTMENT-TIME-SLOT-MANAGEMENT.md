# Enterprise-Grade Time Slot Management System ⏰

## 🎯 Overview

HERA's appointment system implements intelligent, status-based time slot blocking that ensures stylists are only truly blocked when they have confirmed appointments, while allowing flexibility for draft appointments.

---

## 📋 Status-Based Blocking Logic

### ✅ Statuses That BLOCK Time Slots

These appointment statuses require the stylist's presence and block their availability:

| Status | Why It Blocks | When Applied |
|--------|---------------|--------------|
| **booked** | Confirmed appointment, customer committed | After customer confirms/books |
| **checked_in** | Customer has arrived at salon | When customer checks in |
| **in_progress** | Service is actively happening | Service has started |
| **payment_pending** | Service complete, waiting for payment | Service finished, payment due |

### ❌ Statuses That DON'T Block Time Slots

These statuses free up the stylist for other appointments:

| Status | Why It Doesn't Block | When Applied |
|--------|---------------------|--------------|
| **draft** | Tentative, not confirmed | Initial creation, before confirmation |
| **completed** | Service done, payment received | After successful completion |
| **cancelled** | Appointment cancelled | Customer or salon cancels |
| **no_show** | Customer didn't arrive | Customer failed to show up |

---

## 🔄 Status Transition Flow & Time Slot Impact

```
┌─────────────┐
│    DRAFT    │ ← Doesn't block time slots
│ (Tentative) │    (Allows double booking for drafts)
└──────┬──────┘
       │ Book/Confirm
       ↓
┌─────────────┐
│   BOOKED    │ ← ✅ STARTS BLOCKING (Stylist reserved)
│ (Confirmed) │
└──────┬──────┘
       │ Customer Arrives
       ↓
┌─────────────┐
│ CHECKED IN  │ ← ✅ CONTINUES BLOCKING
│ (Customer   │
│  Present)   │
└──────┬──────┘
       │ Service Starts
       ↓
┌─────────────┐
│IN PROGRESS  │ ← ✅ CONTINUES BLOCKING
│ (Service    │
│  Happening) │
└──────┬──────┘
       │ Service Completes
       ↓
┌─────────────┐
│  PAYMENT    │ ← ✅ CONTINUES BLOCKING
│  PENDING    │    (Still occupying chair)
└──────┬──────┘
       │ Payment Received
       ↓
┌─────────────┐
│  COMPLETED  │ ← ❌ STOPS BLOCKING (Time slot freed)
│   (Done)    │
└─────────────┘

       ┌────────────────┐
       │   CANCELLED    │ ← ❌ STOPS BLOCKING (Time slot freed)
       └────────────────┘

       ┌────────────────┐
       │    NO SHOW     │ ← ❌ STOPS BLOCKING (Time slot freed)
       └────────────────┘
```

---

## 🎯 Key Scenarios Handled

### Scenario 1: Draft Appointments (Flexible Booking)
**Situation**: Reception creates multiple draft appointments for a customer to choose from.

**Behavior**:
- ✅ Multiple drafts can exist for the same stylist at the same time
- ✅ Allows exploring options without blocking availability
- ✅ When customer confirms one, it becomes "booked" and others remain as drafts
- ✅ Salon can delete unneeded drafts later

**Example**:
```
10:00 AM - Draft appointment for Customer A (doesn't block)
10:00 AM - Draft appointment for Customer B (doesn't block)
10:00 AM - Available for new bookings ✓
```

### Scenario 2: Booked Appointment (Blocks Time)
**Situation**: Customer confirms their appointment.

**Behavior**:
- ❌ Time slot is now blocked for that stylist
- ❌ Cannot create new bookings for same stylist at that time
- ✅ Can still create draft appointments (for reference)
- ⚠️ Conflict warning shown: "Ramesh - Rocky (booked) - Customer Name"

**Example**:
```
10:00 AM - Booked appointment for Customer A (blocks time)
10:00 AM - CONFLICT! Cannot book another confirmed appointment
10:00 AM - Can still create draft appointments (tentative)
```

### Scenario 3: Cancellation (Frees Time)
**Situation**: Customer cancels their booked appointment.

**Behavior**:
- ✅ Status changes from "booked" → "cancelled"
- ✅ Time slot immediately becomes available
- ✅ Other customers can now book that time
- ✅ Cancelled appointment remains visible for history

**Example**:
```
Before Cancellation:
10:00 AM - Booked (Customer A) ← Time blocked

After Cancellation:
10:00 AM - Cancelled (Customer A) ← Time freed
10:00 AM - Available for new bookings ✓
```

### Scenario 4: Postponement (Old Time Freed, New Time Blocked)
**Situation**: Customer reschedules from 10:00 AM to 2:00 PM.

**Behavior**:
- ✅ Old time (10:00 AM) becomes available
- ✅ New time (2:00 PM) gets blocked
- ✅ Status remains "booked" (or whatever it was)
- ✅ History note added to appointment

**Example**:
```
Before Postponement:
10:00 AM - Booked (Customer A) ← Blocked
2:00 PM - Available ← Open

After Postponement:
10:00 AM - Available ← Freed!
2:00 PM - Booked (Customer A) ← Now blocked
```

### Scenario 5: No-Show (Frees Time)
**Situation**: Customer doesn't show up, marked as "no_show".

**Behavior**:
- ✅ Status changes to "no_show"
- ✅ Time slot becomes available again
- ✅ Salon can book walk-in customer
- ✅ No-show remains in records for tracking

---

## 🔧 Technical Implementation

### Conflict Detection Logic
```typescript
const BLOCKING_STATUSES = [
  'booked',           // Confirmed appointment
  'checked_in',       // Customer has arrived
  'in_progress',      // Service is happening
  'payment_pending'   // Service done, awaiting payment
]

// Only appointments with these statuses block time slots
// Draft, completed, cancelled, and no_show do NOT block
```

### Time Slot Availability Check
```typescript
// For each time slot:
1. Check if stylist is selected
2. Get all appointments for that stylist
3. Filter only BLOCKING_STATUSES appointments
4. Check for time overlaps
5. Mark slot as:
   - Available (green) - No conflicts
   - Blocked (red) - Conflict with blocking status
   - Shows: conflicting customer name + status
```

---

## 📊 Visual Indicators

### Time Slot Dropdown
```
┌──────────────────────────────────────┐
│ 10:00 AM          [Available]        │
│ 10:30 AM          [booked - Sarah]   │ ← Disabled, shows status
│ 11:00 AM          [Available]        │
│ 11:30 AM          [in_progress - Jo] │ ← Disabled, shows status
│ 12:00 PM          [Available]        │
└──────────────────────────────────────┘
```

### Status Badges
- **Booked**: Red badge - "booked"
- **Checked In**: Purple badge - "checked_in"
- **In Progress**: Orange badge - "in_progress"
- **Payment Pending**: Red badge - "payment_pending"

---

## ✨ Benefits of This System

### 1. **Flexibility for Drafts**
- Receptionists can explore multiple options
- No pressure to immediately commit time slots
- Customer can choose between multiple options

### 2. **Guaranteed Availability for Bookings**
- Once booked, stylist is truly reserved
- No double bookings for confirmed appointments
- Clear conflict warnings with details

### 3. **Automatic Time Slot Liberation**
- Cancellations immediately free up time
- Postponements automatically update availability
- No-shows free up slots for walk-ins

### 4. **Clear Communication**
- Visual indicators show why slots are blocked
- Customer names visible in conflict warnings
- Status badges show current appointment state

### 5. **Enterprise-Grade Reliability**
- Handles all edge cases
- Consistent behavior across all scenarios
- Complete audit trail maintained

---

## 🎯 Best Practices

### For Receptionists:
1. **Use Draft for Exploration**: Create drafts when customer is deciding
2. **Convert to Booked**: Change status to "booked" when customer confirms
3. **Cancel Properly**: Use cancel button (not delete) to maintain history
4. **Check Conflicts**: System shows why slots are unavailable

### For Managers:
1. **Monitor Drafts**: Review and clean up old drafts regularly
2. **Track No-Shows**: Use no-show status to identify patterns
3. **Optimize Scheduling**: See which stylists have high/low utilization
4. **Handle Cancellations**: Freed slots appear immediately for rebooking

### For Developers:
1. **Status Transitions**: Always use proper status workflow
2. **Conflict Checks**: System handles blocking automatically
3. **Time Updates**: Postponements automatically update availability
4. **Maintain History**: Never delete appointments, use status changes

---

## 🚀 Future Enhancements

- [ ] Waitlist management for fully booked slots
- [ ] Automatic SMS when slots open due to cancellations
- [ ] Stylist availability calendar view
- [ ] Bulk time slot blocking for breaks/lunch
- [ ] Multi-stylist service booking support
- [ ] Resource allocation (rooms, equipment)

---

**Status**: ✅ Production Ready
**Version**: 1.0.0 - Enterprise Grade
**Smart Codes**:
- `HERA.SALON.TXN.APPOINTMENT.CONFLICT.CHECK.V1`
- `HERA.SALON.TXN.APPOINTMENT.TIME.SLOT.BLOCK.V1`
- `HERA.SALON.TXN.APPOINTMENT.TIME.SLOT.FREE.V1`
