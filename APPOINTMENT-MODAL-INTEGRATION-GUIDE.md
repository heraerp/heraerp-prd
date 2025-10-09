# Appointment Modal Integration Guide ✨

## 🎯 Goal
Transform the appointments page into an enterprise-grade experience with:
- Click on appointment tile → Opens view/edit modal
- Simplified action buttons (remove redundancy)
- Luxe theme with soft animations
- Time slot selection from appointments/new page

---

## 📋 Implementation Steps

### 1. Import the AppointmentModal Component

Add to `/src/app/salon/appointments/page.tsx` imports:

```typescript
import { AppointmentModal } from '@/components/salon/appointments/AppointmentModal'
import { useHeraCustomers } from '@/hooks/useHeraCustomers'
import { useHeraServices } from '@/hooks/useHeraServicesV2'
import { useHeraStaff } from '@/hooks/useHeraStaff'
```

### 2. Add State for Modal Management

```typescript
// Add inside AppointmentsContent component after existing state:
const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
const [modalOpen, setModalOpen] = useState(false)
```

### 3. Load Required Data for Modal

```typescript
// Add after existing hooks:
const { customers } = useHeraCustomers({ organizationId: organizationId || '' })
const { services } = useHeraServices({ organizationId: organizationId || '' })
const { staff } = useHeraStaff({ organizationId: organizationId || '' })
```

### 4. Simplify Appointment Tile Buttons

**REMOVE** these buttons (lines ~1087-1190):
- Multiple status transition buttons
- Redundant cancel button (X icon)
- Individual postpone button
- Separate delete button

**KEEP ONLY**:
- Quick status badge (visual only, not button)
- Single action menu button (dropdown for cancel/postpone/delete)

**NEW APPROACH**:
```typescript
// Make entire card clickable
<div
  key={appointment.id}
  onClick={() => {
    setSelectedAppointment(appointment)
    setModalOpen(true)
  }}
  className="rounded-xl p-6 cursor-pointer transition-all duration-500 hover:scale-102"
  style={{
    background: 'linear-gradient(135deg, rgba(245,230,200,0.05) 0%, rgba(212,175,55,0.03) 100%)',
    border: `1px solid ${LUXE_COLORS.gold}20`,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transitionTimingFunction: LUXE_COLORS.spring
  }}
>
  {/* Appointment content */}
  <div className="space-y-3" onClick={e => e.stopPropagation()}>
    {/* Header with customer name and status badge */}
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-lg" style={{ color: LUXE_COLORS.champagne }}>
          {appointment.customer_name || 'Customer'}
        </h3>
        <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
          {appointment.stylist_name || 'Unassigned'}
        </p>
      </div>

      {/* Status badge only */}
      <Badge
        style={{
          background: `${STATUS_CONFIG[appointment.status as AppointmentStatus].color}15`,
          color: STATUS_CONFIG[appointment.status as AppointmentStatus].color,
          border: `1px solid ${STATUS_CONFIG[appointment.status as AppointmentStatus].color}30`
        }}
      >
        {STATUS_CONFIG[appointment.status as AppointmentStatus].label}
      </Badge>
    </div>

    {/* Time and price info */}
    <div className="flex items-center gap-4 text-sm" style={{ color: LUXE_COLORS.bronze }}>
      <span className="flex items-center gap-1">
        <Clock className="w-4 h-4" />
        {appointmentDate && format(appointmentDate, 'h:mm a')}
      </span>
      <span className="flex items-center gap-1">
        <DollarSign className="w-4 h-4" />
        {appointment.price?.toFixed(2) || '0.00'}
      </span>
    </div>

    {/* Quick action buttons - ONLY for draft/active appointments */}
    {appointment.status !== 'completed' && appointment.status !== 'cancelled' && appointment.status !== 'no_show' && (
      <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: `1px solid ${LUXE_COLORS.gold}10` }}>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setAppointmentToCancel(appointment)
            setCancelConfirmOpen(true)
          }}
          style={{
            background: 'rgba(140,120,83,0.15)',
            color: LUXE_COLORS.bronze,
            border: `1px solid ${LUXE_COLORS.bronze}30`
          }}
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>

        {appointment.status === 'draft' && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setAppointmentToDelete(appointment)
              setDeleteConfirmOpen(true)
            }}
            style={{
              background: 'rgba(232,180,184,0.15)',
              color: LUXE_COLORS.rose,
              border: `1px solid ${LUXE_COLORS.rose}30`
            }}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        )}
      </div>
    )}
  </div>
</div>
```

### 5. Add Modal to Page

Add before closing `</div>` of main container:

```typescript
{/* ✨ ENTERPRISE: Appointment View/Edit Modal */}
<AppointmentModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  appointment={selectedAppointment}
  customers={customers || []}
  stylists={staff || []}
  services={services || []}
  branches={branches}
  existingAppointments={appointments || []}
  onSave={async (data) => {
    if (!selectedAppointment) return

    const loadingId = showLoading('Saving changes...', 'Please wait')

    try {
      await updateAppointment({
        id: selectedAppointment.id,
        data
      })

      removeToast(loadingId)
      showSuccess('Appointment updated', 'Changes saved successfully')
      setModalOpen(false)
      setSelectedAppointment(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to update', error.message || 'Please try again')
    }
  }}
/>
```

### 6. Remove Postpone Dialog

The postpone functionality is now handled by the main modal's time selection, so you can remove:
- `postponeDialogOpen` state
- `appointmentToPostpone` state
- `postponeDate` and `postponeTime` state
- `handleConfirmPostponeAppointment` function
- The entire Postpone Dialog JSX (lines ~1345-1483)

---

## 🎨 Enhanced Tile Animation

Update the card hover effect:

```typescript
<div
  onMouseEnter={e => {
    e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
    e.currentTarget.style.boxShadow = '0 20px 40px rgba(212,175,55,0.2)'
    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}50`
  }}
  onMouseLeave={e => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)'
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
    e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}20`
  }}
>
```

---

## 📊 Before vs After Comparison

### Before:
```
┌─────────────────────────────────────┐
│ Customer Name                       │
│ Stylist Name                        │
│ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐ │
│ │B1││B2││B3││B4││B5││B6││B7││B8│ │  ← 8 buttons!
│ └──┘└──┘└──┘└──┘└──┘└──┘└──┘└──┘ │
└─────────────────────────────────────┘
```

### After:
```
┌─────────────────────────────────────┐
│ Customer Name          [Status]     │  ← Click anywhere
│ Stylist Name                        │     to view/edit
│ Time: 10:00 AM    Price: $125.00   │
│ ─────────────────────────────────── │
│ [Cancel]  [Delete (draft only)]    │  ← Only 1-2 buttons
└─────────────────────────────────────┘
```

---

## ✅ Benefits

1. **Cleaner UI**: 8 buttons → 1-2 buttons
2. **Better UX**: Click anywhere on card to view/edit
3. **Consistent Pattern**: Same as appointments/new page
4. **Enterprise Grade**: Professional modal with all features
5. **Performance**: Lazy-loaded services and conflict detection
6. **Mobile Friendly**: Reduced button clutter
7. **Intuitive**: Users expect to click cards to see details

---

## 🚀 Implementation Priority

1. ✅ Modal component created
2. 🔄 Simplify tile buttons (next)
3. 🔄 Add modal integration
4. 🔄 Remove postpone dialog
5. 🔄 Test all flows

---

## 🎯 Testing Checklist

- [ ] Click on appointment tile opens modal
- [ ] Modal shows correct appointment data
- [ ] Edit mode enables all fields
- [ ] Time slot selection works with conflicts
- [ ] Service add/remove updates price and duration
- [ ] Save button updates appointment
- [ ] Cancel button closes without saving
- [ ] Quick cancel button on tile works
- [ ] Delete button only shows for draft
- [ ] Completed appointments have no action buttons
- [ ] Animations are smooth
- [ ] Mobile responsive

---

**Status**: Ready for integration
**Priority**: P0 - User Experience Enhancement
**Impact**: Transforms appointments UX to enterprise standards
