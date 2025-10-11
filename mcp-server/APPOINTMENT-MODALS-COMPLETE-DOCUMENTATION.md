# 📘 APPOINTMENT MODALS - COMPLETE DOCUMENTATION

## 🎯 TABLE OF CONTENTS
1. [Save Button Visibility Issue](#save-button-visibility-issue)
2. [Stylist Selection → Date/Time Loading Pattern](#stylist-selection-datetime-loading-pattern)
3. [Edit Modal vs New Page Comparison](#edit-modal-vs-new-page-comparison)
4. [Complete Implementation Guide](#complete-implementation-guide)

---

## 🔍 SAVE BUTTON VISIBILITY ISSUE

### **Problem Report**
User reported: "I couldn't still see the save button" in the appointment modals.

### **Root Cause**
The AppointmentModal has **two modes**:
1. **View Mode** (default when opening) - Shows "Edit Appointment" and "Close" buttons
2. **Edit Mode** (after clicking "Edit") - Shows "Save Changes" button

**The save button ONLY appears in Edit Mode!**

### **Code Analysis** (`AppointmentModal.tsx` Lines 1068-1140)

```typescript
{/* Footer Actions */}
<div className="p-6 pt-4 flex gap-3">
  {isEditing ? (
    // ✅ EDIT MODE: Save button visible
    <Button
      onClick={handleSave}
      disabled={
        isSaving ||
        !selectedCustomer ||
        !selectedDate ||
        !selectedTime ||
        selectedServices.length === 0
      }
      className="w-full transition-all duration-300 hover:shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
        color: LUXE_COLORS.black,
        border: 'none',
        fontWeight: '600',
        padding: '1.25rem',
        fontSize: '1rem',
        opacity: isSaving || !selectedCustomer || !selectedDate || !selectedTime || selectedServices.length === 0 ? 0.5 : 1,
        boxShadow: '0 8px 24px rgba(212,175,55,0.3)'
      }}
    >
      {isSaving ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="w-5 h-5 mr-2" />
          Save Changes  {/* ✅ SAVE BUTTON TEXT */}
        </>
      )}
    </Button>
  ) : (
    // ❌ VIEW MODE: No save button, only Edit and Close
    <div className="flex gap-3 w-full">
      <Button onClick={() => setIsEditing(true)} className="flex-1">
        <Edit2 className="w-4 h-4 mr-2" />
        Edit Appointment
      </Button>
      <Button onClick={() => onOpenChange(false)} className="flex-1">
        Close
      </Button>
    </div>
  )}
</div>
```

### **User Flow to See Save Button**

```
1. Click on appointment card
   ↓
2. Modal opens in VIEW MODE
   - Shows appointment details (read-only)
   - Shows "Edit Appointment" button (gold)
   - Shows "Close" button (transparent)
   ↓
3. Click "Edit Appointment" button
   ↓
4. Modal switches to EDIT MODE
   - All fields become editable
   - "Edit Appointment" button disappears
   - "Save Changes" button appears (gold) ✅
   ↓
5. Make changes and click "Save Changes"
   ↓
6. Modal saves and closes
```

### **Visual States**

#### **State 1: View Mode (Initial)**
```
┌─────────────────────────────────────────┐
│ 📅 Appointment Details                  │
│                                         │
│ Customer: John Doe                      │
│ Stylist: Jane Smith                     │
│ Date: Monday, Jan 10, 2025              │
│ Time: 2:00 PM - 3:30 PM                 │
│ Services: Hair Cut, Hair Color          │
│                                         │
│ ┌──────────────┐  ┌─────────────┐     │
│ │ ✏️ Edit      │  │   Close     │     │
│ │ Appointment  │  │             │     │
│ └──────────────┘  └─────────────┘     │
└─────────────────────────────────────────┘
```

#### **State 2: Edit Mode (After Clicking "Edit")**
```
┌─────────────────────────────────────────┐
│ 📅 Appointment Details                  │
│                                         │
│ Customer: [Dropdown▼]                   │
│ Stylist: [Dropdown▼]                    │
│ Date: [Date Picker]                     │
│ Time: [Time Slot Selector]              │
│ Services: [Checkboxes...]               │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │  💾 Save Changes                  │  │  ← ✅ SAVE BUTTON
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### **Why This Design?**
1. **Prevents Accidental Edits**: View mode shows read-only data first
2. **Clear Distinction**: User knows when they're editing
3. **Safety**: Requires explicit "Edit" click before changes possible
4. **Enterprise Standard**: Common pattern in professional applications

---

## 🎯 STYLIST SELECTION → DATE/TIME LOADING PATTERN

### **How It Works in `/appointments/new` Page**

The `/appointments/new` page implements a **conditional rendering pattern** where the time slot UI changes completely based on whether a stylist is selected.

### **Step-by-Step Flow**

```
┌─────────────────────────────────────────────────────┐
│ STEP 1: No Stylist Selected                        │
├─────────────────────────────────────────────────────┤
│ State: selectedStylist = null                       │
│ Result: Shows placeholder message                   │
│                                                     │
│ [Stylist Selection]                                 │
│   Select a stylist ▼  ← Empty                       │
│                                                     │
│ [Date & Time]                                       │
│  ┌─────────────────────────────────────────┐      │
│  │  ✂️  Select a Stylist First              │      │
│  │  Time slots will show available          │      │
│  │  appointments for the selected stylist   │      │
│  └─────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ STEP 2: Stylist Selected                           │
├─────────────────────────────────────────────────────┤
│ State: selectedStylist = { id: 'stylist-123' }     │
│ Triggers: generateTimeSlots() + checkConflicts()   │
│ Result: Shows availability summary + time slots    │
│                                                     │
│ [Stylist Selection]                                 │
│   Jane Smith ▼  ← Selected                          │
│                                                     │
│ [Date & Time]                                       │
│  Date: [2025-01-10]                                 │
│                                                     │
│  Time (18 available) 75% free                       │
│  ┌─────────────────────────────────────────┐      │
│  │  ✅ Available: 18 slots                 │      │
│  │  ❌ Booked: 6 slots                     │      │
│  │  ▓▓▓▓▓▓▓▓▓▓▓░░░░ 75% free              │      │
│  └─────────────────────────────────────────┘      │
│                                                     │
│  Time Slot Selector:                                │
│  ○ 9:00 AM                                          │
│  ○ 9:30 AM                                          │
│  ● 10:00 AM  ← Selected                             │
│  ⊘ 10:30 AM (Booked - John Doe)                    │
│  ○ 11:00 AM                                         │
│  ... more slots ...                                 │
└─────────────────────────────────────────────────────┘
```

### **Code Implementation** (`/appointments/new/page.tsx`)

#### **1. Time Slot Generation** (Lines 245-291)
```typescript
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const now = new Date()
  const selectedDateObj = new Date(selectedDate)
  const isToday = selectedDateObj.toDateString() === now.toDateString()

  // Working hours: 9:00 AM to 9:00 PM
  const startHour = 9
  const endHour = 21

  // ✨ SMART TODAY LOGIC: Start from current hour if today
  let currentHour = isToday ? Math.max(now.getHours(), startHour) : startHour
  let currentMinute = isToday ? (now.getMinutes() < 30 ? 30 : 0) : 0

  // If today and current minute is 30+, start from next hour
  if (isToday && now.getMinutes() >= 30 && currentMinute === 0) {
    currentHour += 1
  }

  // Generate 30-minute slots
  while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
    const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

    // Calculate end time (30 minutes later)
    let endMinute = currentMinute + 30
    let endHour = currentHour
    if (endMinute >= 60) {
      endMinute = 0
      endHour += 1
    }
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`

    slots.push({ start: startTime, end: endTime })

    // Move to next slot
    currentMinute += 30
    if (currentMinute >= 60) {
      currentMinute = 0
      currentHour += 1
    }
  }

  return slots
}
```

**Key Features**:
- **Operating Hours**: 9:00 AM - 9:00 PM (12 hours)
- **Slot Duration**: 30 minutes each
- **Total Slots Per Day**: 24 slots
- **Smart Today Logic**: Only shows future time slots if today
- **30-Min Buffer**: Adds buffer for booking today

#### **2. Conflict Detection** (Lines 322-369)
```typescript
const checkTimeSlotConflict = useCallback(
  (slotStart: string) => {
    // ✅ DEPENDENCY: Requires selectedStylist
    if (!selectedStylist || !appointments || appointments.length === 0) {
      return { hasConflict: false, conflictingAppointment: null }
    }

    // Parse slot start time
    const [hours, minutes] = slotStart.split(':').map(Number)
    const slotDateTime = new Date(selectedDate)
    slotDateTime.setHours(hours, minutes, 0, 0)

    // Calculate slot end time (30 minutes later)
    const slotEndTime = new Date(slotDateTime)
    slotEndTime.setMinutes(slotEndTime.getMinutes() + 30)

    // ✨ CRITICAL: Only these statuses block time slots
    const BLOCKING_STATUSES = [
      'booked',         // Confirmed appointment
      'checked_in',     // Customer has arrived
      'in_progress',    // Service is happening
      'payment_pending' // Service done, awaiting payment
    ]

    // Check for conflicts with existing appointments for THIS stylist
    const conflict = appointments.find(apt => {
      // Only check appointments for the selected stylist
      if (apt.stylist_id !== selectedStylist.id) return false

      // ✨ Draft appointments DON'T block (allows exploring options)
      if (!BLOCKING_STATUSES.includes(apt.status)) {
        console.log(`[Time Slot] Skipping ${apt.status} appointment - doesn't block time slots`)
        return false
      }

      // Parse appointment times
      const aptStart = new Date(apt.start_time)
      const aptEnd = new Date(apt.end_time)

      // Check for overlap
      const overlaps = slotDateTime < aptEnd && slotEndTime > aptStart

      if (overlaps) {
        console.log(`[Time Slot] BLOCKED by ${apt.status} appointment for ${apt.customer_name}`)
      }

      return overlaps
    })

    return {
      hasConflict: !!conflict,
      conflictingAppointment: conflict || null
    }
  },
  [selectedStylist, appointments, selectedDate]
)
```

**Key Features**:
- **Stylist-Specific**: Only checks conflicts for selected stylist
- **Status-Based Blocking**: Only certain statuses block slots
- **Draft Flexibility**: Draft appointments don't prevent booking
- **Overlap Detection**: Checks if time ranges conflict
- **Returns Conflict Details**: Provides customer name and status

#### **3. Conditional UI Rendering** (Lines 1167-1250)
```typescript
{/* Time Selection Field */}
<div>
  <Label>
    Time
    {selectedStylist && availableTimeSlots.length > 0 && (
      <span className="text-xs text-emerald-400 ml-2">
        ({availableTimeSlots.filter(s => !s.hasConflict).length} available)
      </span>
    )}
  </Label>

  {/* ❌ CASE 1: No Stylist Selected */}
  {!selectedStylist ? (
    <div className="p-6 rounded-lg text-center border-2 border-dashed">
      <Scissors className="w-6 h-6 text-gold mx-auto mb-2" />
      <p className="font-medium">Select a Stylist First</p>
      <p className="text-sm text-muted">
        Time slots will show available appointments for the selected stylist
      </p>
    </div>
  )

  {/* ❌ CASE 2: Stylist Selected but No Time Slots */}
  : availableTimeSlots.length === 0 ? (
    <div className="p-4 rounded-lg text-sm text-center">
      <Clock className="w-5 h-5 mx-auto mb-2" />
      <p className="font-medium">No available time slots</p>
      <p className="text-xs">Please select a future date</p>
    </div>
  )

  {/* ✅ CASE 3: Stylist Selected AND Time Slots Available */}
  : (
    <div className="space-y-3">
      {/* Availability Summary Box */}
      <div className="p-3 rounded-lg bg-emerald/10 border border-emerald/20">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-emerald-400 font-medium">
            <Check className="w-4 h-4 inline" /> Available
          </span>
          <span>{availableTimeSlots.filter(s => !s.hasConflict).length} slots</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-red-400 font-medium">
            <X className="w-4 h-4 inline" /> Booked
          </span>
          <span>{availableTimeSlots.filter(s => s.hasConflict).length} slots</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-2 rounded-full bg-muted/30">
          <div
            className="h-full"
            style={{
              width: `${(availableTimeSlots.filter(s => !s.hasConflict).length / availableTimeSlots.length) * 100}%`,
              background: 'linear-gradient(90deg, #10B981 0%, #0F6F5C 100%)'
            }}
          />
        </div>
      </div>

      {/* Time Slot Selector */}
      <RadioGroup value={selectedTime} onValueChange={setSelectedTime}>
        {availableTimeSlots.map(slot => {
          const [hours, minutes] = slot.start.split(':').map(Number)
          const period = hours >= 12 ? 'PM' : 'AM'
          const displayHours = hours % 12 || 12
          const displayTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`

          return (
            <div
              key={slot.start}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border-2 transition-all',
                slot.hasConflict && 'opacity-50 cursor-not-allowed',
                selectedTime === slot.start && !slot.hasConflict && 'border-gold bg-gold/10'
              )}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem
                  value={slot.start}
                  disabled={slot.hasConflict}
                  className="data-[state=checked]:border-gold"
                />
                <Label>{displayTime}</Label>
              </div>

              {/* Conflict Badge */}
              {slot.hasConflict && (
                <Badge variant="destructive" className="text-xs">
                  Booked - {slot.conflictingAppointment?.customer_name}
                </Badge>
              )}
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )}
</div>
```

### **Dependencies Flow Diagram**

```
┌──────────────────────────┐
│ User Selects Stylist     │
└───────────┬──────────────┘
            │
            ├──► selectedStylist state updates
            │
            ▼
┌──────────────────────────┐
│ useEffect/useMemo        │
│ Triggered                │
└───────────┬──────────────┘
            │
            ├──► generateTimeSlots()
            │    └──► Creates 24 time slots (9 AM - 9 PM)
            │         └──► Filters out past times if today
            │
            ├──► checkTimeSlotConflict(slot)
            │    └──► For each time slot:
            │         ├──► Checks if stylist has appointment
            │         ├──► Checks if status blocks slot
            │         ├──► Checks if time ranges overlap
            │         └──► Returns { hasConflict, conflictingAppointment }
            │
            ▼
┌──────────────────────────┐
│ availableTimeSlots       │
│ Array Updated            │
└───────────┬──────────────┘
            │
            ├──► Each slot has:
            │    - start: '09:00'
            │    - end: '09:30'
            │    - hasConflict: boolean
            │    - conflictingAppointment: Appointment | null
            │
            ▼
┌──────────────────────────┐
│ UI Re-renders            │
└───────────┬──────────────┘
            │
            ├──► Shows availability summary
            ├──► Shows progress bar (X% free)
            ├──► Shows time slot radio buttons
            └──► Disables conflicting slots
```

### **Memoization for Performance**

```typescript
// ⚡ Memoize time slots - only regenerate when date changes
const timeSlots = useMemo(() => generateTimeSlots(), [selectedDate])

// ⚡ Memoize conflict checking - only rerun when dependencies change
const availableTimeSlots = useMemo(() => {
  return timeSlots.map(slot => ({
    ...slot,
    ...checkTimeSlotConflict(slot.start)
  }))
}, [timeSlots, checkTimeSlotConflict])
```

**Benefits**:
- Prevents unnecessary recalculations
- Only updates when stylist, date, or appointments change
- Improves performance with many appointments

---

## 📊 EDIT MODAL VS NEW PAGE COMPARISON

| Feature | Edit Modal | New Page |
|---------|------------|----------|
| **Stylist Selection** | Shows message if no stylist | Shows large placeholder box |
| **Time Slot UI** | Dropdown selector | Radio button list |
| **Availability Summary** | Not shown | Shows box with counts + progress bar |
| **Conflict Display** | Badge in dropdown | Badge on radio item |
| **Save Button** | Only in edit mode | Always visible as "Book/Save" |
| **Customer Name** | Shows percentage free | Not shown |
| **Visual Style** | Compact, modal-friendly | Spacious, full-page |
| **Date Selection** | Standard input | Standard input (same) |

### **When to Use Each Pattern**

#### **Use Edit Modal Pattern When**:
- Limited space (modal, sidebar, drawer)
- Quick edits needed
- User already familiar with appointment
- Focus on speed and efficiency

#### **Use New Page Pattern When**:
- Creating new appointments
- User needs guidance
- Want to show availability prominently
- Have full page width available

---

## 🎯 COMPLETE IMPLEMENTATION GUIDE

### **Pattern 1: Conditional Rendering Based on Stylist**

```typescript
// ✅ RECOMMENDED PATTERN
{!selectedStylist ? (
  <EmptyStatePlaceholder
    icon={<Scissors />}
    title="Select a Stylist First"
    description="Time slots will show available appointments"
  />
) : availableTimeSlots.length === 0 ? (
  <EmptyStatePlaceholder
    icon={<Clock />}
    title="No available time slots"
    description="Please select a future date"
  />
) : (
  <TimeSlotSelector
    slots={availableTimeSlots}
    selectedTime={selectedTime}
    onSelectTime={setSelectedTime}
  />
)}
```

### **Pattern 2: Time Slot Generation with Today Logic**

```typescript
const generateTimeSlots = (selectedDate: string): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const now = new Date()
  const selectedDateObj = new Date(selectedDate)
  const isToday = selectedDateObj.toDateString() === now.toDateString()

  const startHour = 9  // Business hours start
  const endHour = 21   // Business hours end

  // Smart today logic: only show future slots
  let currentHour = isToday ? Math.max(now.getHours(), startHour) : startHour
  let currentMinute = isToday ? (now.getMinutes() < 30 ? 30 : 0) : 0

  if (isToday && now.getMinutes() >= 30 && currentMinute === 0) {
    currentHour += 1
  }

  // Generate 30-minute slots
  while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
    const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

    let endMinute = currentMinute + 30
    let endHour = currentHour
    if (endMinute >= 60) {
      endMinute = 0
      endHour += 1
    }
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`

    slots.push({ start: startTime, end: endTime })

    currentMinute += 30
    if (currentMinute >= 60) {
      currentMinute = 0
      currentHour += 1
    }
  }

  return slots
}
```

### **Pattern 3: Conflict Detection with Status Filtering**

```typescript
const checkTimeSlotConflict = (
  slotStart: string,
  selectedDate: string,
  selectedStylist: Stylist | null,
  existingAppointments: Appointment[]
): { hasConflict: boolean; conflictingAppointment: Appointment | null } => {
  if (!selectedStylist) {
    return { hasConflict: false, conflictingAppointment: null }
  }

  const [hours, minutes] = slotStart.split(':').map(Number)
  const slotDateTime = new Date(selectedDate)
  slotDateTime.setHours(hours, minutes, 0, 0)

  const slotEndTime = new Date(slotDateTime)
  slotEndTime.setMinutes(slotEndTime.getMinutes() + 30)

  // Only these statuses block time slots
  const BLOCKING_STATUSES = ['booked', 'checked_in', 'in_progress', 'payment_pending']

  const conflict = existingAppointments.find(apt => {
    if (apt.stylist_id !== selectedStylist.id) return false
    if (!BLOCKING_STATUSES.includes(apt.status)) return false

    const aptStart = new Date(apt.start_time)
    const aptEnd = new Date(apt.end_time)

    // Check overlap
    return slotDateTime < aptEnd && slotEndTime > aptStart
  })

  return {
    hasConflict: !!conflict,
    conflictingAppointment: conflict || null
  }
}
```

### **Pattern 4: Availability Summary Component**

```typescript
interface AvailabilitySummaryProps {
  totalSlots: number
  availableSlots: number
  bookedSlots: number
}

const AvailabilitySummary: React.FC<AvailabilitySummaryProps> = ({
  totalSlots,
  availableSlots,
  bookedSlots
}) => {
  const availabilityPercent = Math.round((availableSlots / totalSlots) * 100)

  return (
    <div className="p-3 rounded-lg bg-emerald/10 border border-emerald/20">
      {/* Available Count */}
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-emerald-400 font-medium flex items-center gap-1">
          <Check className="w-4 h-4" />
          Available
        </span>
        <span>{availableSlots} slots</span>
      </div>

      {/* Booked Count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-red-400 font-medium flex items-center gap-1">
          <X className="w-4 h-4" />
          Booked
        </span>
        <span>{bookedSlots} slots</span>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-2 rounded-full overflow-hidden bg-muted/30">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${availabilityPercent}%`,
            background: 'linear-gradient(90deg, #10B981 0%, #0F6F5C 100%)'
          }}
        />
      </div>

      {/* Percentage Label */}
      <div className="text-xs text-center mt-2 text-muted-foreground">
        {availabilityPercent}% available
      </div>
    </div>
  )
}
```

---

## 📝 QUICK REFERENCE CHEAT SHEET

### **Save Button Visibility**
```
Open Modal → VIEW MODE (no save button)
  ↓
Click "Edit" → EDIT MODE (save button appears ✅)
  ↓
Make Changes → Click "Save Changes"
  ↓
Modal Closes
```

### **Stylist Selection Flow**
```
No Stylist → Show Placeholder Message
  ↓
Select Stylist → Generate Time Slots
  ↓
Check Conflicts → Mark Blocked Slots
  ↓
Show UI → Availability Summary + Slot Selector
```

### **Blocking Statuses**
- ✅ `booked` - Blocks slots
- ✅ `checked_in` - Blocks slots
- ✅ `in_progress` - Blocks slots
- ✅ `payment_pending` - Blocks slots
- ❌ `draft` - Does NOT block (flexible scheduling)
- ❌ `cancelled` - Does NOT block
- ❌ `completed` - Does NOT block

### **Time Slot Rules**
- **Operating Hours**: 9:00 AM - 9:00 PM
- **Slot Duration**: 30 minutes
- **Total Slots**: 24 per day
- **Today Logic**: Only future slots + 30-min buffer
- **Per-Stylist**: Conflicts checked per stylist only

---

## ✅ IMPLEMENTATION CHECKLIST

### For Edit Modal
- [ ] Verify "Edit" button shows in view mode
- [ ] Verify "Save Changes" button shows in edit mode
- [ ] Verify save button is disabled when required fields missing
- [ ] Verify loading spinner shows during save
- [ ] Test stylist selection enables time slot dropdown
- [ ] Test conflict detection shows red "Booked" badges
- [ ] Verify modal closes after successful save

### For New Page
- [ ] Verify placeholder shows when no stylist selected
- [ ] Verify availability summary appears after stylist selection
- [ ] Verify progress bar shows correct percentage
- [ ] Test available/booked slot counts are accurate
- [ ] Test conflict badges show customer names
- [ ] Verify disabled state on booked slots
- [ ] Test today logic only shows future slots

---

**Status**: ✅ DOCUMENTATION COMPLETE
**Files**:
- AppointmentModal.tsx - Edit modal with view/edit modes
- /appointments/new/page.tsx - New appointment with stylist-driven UI

**Next Steps**:
1. Test edit modal - click "Edit" to see save button
2. Review stylist selection pattern in /new page
3. Consider unifying patterns if needed
