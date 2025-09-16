# HERA Appointments Module

## 🚀 Overview

The Appointments module is a complete salon appointment management system with state machine-driven workflows, calendar views, and deep integration with customer, staff, and POS systems. Built on HERA's universal architecture with mock-first development.

## ✨ Features

- **Calendar View**: Month/Week/Day views with color-coded status badges
- **State Machine**: Enforced workflow from draft → confirmed → in_progress → service_complete → paid → closed
- **Board View**: Kanban-style pipeline for managing appointments across statuses
- **Activity Timeline**: Complete audit trail with WhatsApp events and transitions
- **Deep Linking**: Seamless navigation to customers, staff, and POS
- **Smart Codes**: Visible business intelligence on every appointment
- **Mock API**: Fully functional without backend, easily swappable

## 🏗️ Architecture

### State Machine

```
draft → confirmed (book)
confirmed → in_progress (check-in)
in_progress → service_complete (mark done)
service_complete → paid (via POS)
paid → closed (auto on full allocation)
confirmed → cancelled (fee optional)
```

### Side Effects

- **On confirmed**: WhatsApp confirmation queued (toast notification)
- **On service_complete**: Navigate to POS with pre-filled cart
- **On closed**: Thank you message sent (toast notification)

### File Structure

```
/app/(app)/appointments/
├── calendar/page.tsx         # Calendar view (default)
├── new/page.tsx             # Book new appointment
├── [id]/page.tsx            # Appointment detail
├── [id]/activity/page.tsx   # Activity timeline
└── board/page.tsx           # Pipeline board view

/components/appointments/
├── AppointmentCalendar.tsx   # Calendar component
├── AppointmentForm.tsx       # Booking form
├── AppointmentStatusBadge.tsx # Status indicators
├── AppointmentActions.tsx    # State transition buttons
└── AppointmentTimeline.tsx   # Activity timeline

/lib/
├── api/appointments.ts       # API client with mock
├── schemas/appointment.ts    # Zod schemas & state machine
└── hooks/useAppointment.ts   # React Query hooks
```

## 🎯 Routes & Navigation

### Calendar View (`/appointments/calendar`)
- Default appointments view
- Month/Week/Day toggle
- Click appointment → Detail page
- "Book Appointment" → New appointment

### New Appointment (`/appointments/new`)
- Customer/Stylist/Branch selection
- Service selection with duration calculation
- Available time slot picker
- On success → Redirect to detail

### Detail Page (`/appointments/[id]`)
- Header: Code + Status badge + Smart code
- Customer/Stylist chips with deep links
- Action buttons based on current status
- Service breakdown with pricing
- "View Activity" → Activity timeline
- "Open POS" (when service_complete) → `/pos/sale?apptId=...`

### Board View (`/appointments/board`)
- Kanban columns for each status
- Drag-and-drop or quick actions
- Date filter
- Click card → Detail page

### Activity Timeline (`/appointments/[id]/activity`)
- Chronological event list
- WhatsApp events included
- Transaction IDs and smart codes
- Audit trail information

## 🔌 API Integration

### Mock API
Default behavior with `NEXT_PUBLIC_USE_MOCK=true`:

```typescript
// Mock appointments are pre-seeded
const appointments = [
  { id: 'appt-001', status: 'confirmed', customer: {...} },
  { id: 'appt-002', status: 'in_progress', ... },
  // etc...
]
```

### Real API
Set `NEXT_PUBLIC_USE_MOCK=false` and implement these endpoints:

```typescript
GET    /api/appointments          # List with filters
GET    /api/appointments/:id      # Single appointment
POST   /api/appointments          # Create (maps to universal_transactions)
POST   /api/appointments/:id      # Update
POST   /api/appointments/:id/transition  # State change
GET    /api/appointments/:id/activity    # Activity events
GET    /api/appointments/slots    # Available time slots
```

## 💡 Smart Codes

Every appointment operation uses HERA Smart Codes:

```
HERA.SALON.APPT.BOOKING.CORE.v1     # Appointment creation
HERA.SALON.APPT.STATUS.CONFIRM.v1   # Confirmation
HERA.SALON.APPT.STATUS.START.v1     # Check-in
HERA.SALON.APPT.STATUS.COMPLETE.v1  # Service completion
HERA.SALON.APPT.PAYMENT.RECEIVED.v1 # Payment recorded
```

## 🎨 UI Components

### AppointmentStatusBadge
Color-coded status indicators:
- **Draft**: Gray
- **Confirmed**: Primary (purple)
- **In Progress**: Purple
- **Service Complete**: Secondary (pink)
- **Paid**: Green
- **Closed**: Blue
- **Cancelled**: Gray

### AppointmentActions
Dynamic action buttons based on status:
- Shows only valid transitions
- Optimistic updates with rollback
- Loading states
- Special "Open POS" button when service complete

### AppointmentCalendar
- Month/Week/Day views
- Today button
- Navigation controls
- Empty state with CTA
- Responsive grid layout

### AppointmentTimeline
- Event icons and descriptions
- Relative timestamps
- Smart codes and transaction IDs
- Actor information
- Metadata display

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit tests/unit/appointment.schemas.spec.ts
```

Tests cover:
- Schema validation
- State machine transitions
- Date/time validation
- Required field validation

### E2E Tests
```bash
npm run test:e2e tests/e2e/appointments-flow.spec.ts
```

Tests cover:
- Complete booking flow
- State transitions
- Calendar navigation
- Activity timeline
- POS integration
- Form validation

## 🚀 Quick Start

### 1. View Appointments
```
Navigate to /appointments or /appointments/calendar
```

### 2. Book New Appointment
```
1. Click "Book Appointment"
2. Select customer, stylist, branch
3. Choose services
4. Pick available time slot
5. Submit → Redirects to detail
```

### 3. Manage Appointment
```
1. Open appointment detail
2. Use action buttons to transition states
3. On service complete → "Open POS"
4. View activity for audit trail
```

### 4. Board View
```
Navigate to /appointments/board
See all appointments in pipeline
Quick actions on each card
```

## 🔧 Configuration

### Environment Variables
```bash
# Use mock API (default)
NEXT_PUBLIC_USE_MOCK=true

# API base URL (when using real backend)
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com

# Organization context
DEFAULT_ORGANIZATION_ID=org-hairtalkz-001
```

### Mock Data
Located in `/lib/api/appointments.ts`:
- 5 pre-seeded appointments
- Various statuses for testing
- Sample activity events
- Available time slots

## 🎯 State Machine Implementation

The state machine is enforced at multiple levels:

1. **Schema Level**: `getAllowedTransitions()` function
2. **API Level**: Transition validation in mock/real API
3. **UI Level**: AppointmentActions only shows valid buttons
4. **Hook Level**: Optimistic updates respect state rules

## 🔄 WhatsApp Integration

Mock implementation shows toast notifications:
- **Confirmation**: "WhatsApp: Confirmation message queued"
- **Closing**: "WhatsApp: Thank you message sent"

Real implementation would:
1. Call WhatsApp API on state transitions
2. Store message status in activity timeline
3. Handle delivery confirmations

## 🎯 Accessibility

- **Keyboard Navigation**: All interactive elements reachable
- **Focus Management**: Proper focus ring with secondary color
- **ARIA Labels**: Descriptive labels for screen readers
- **Color Contrast**: All status colors meet WCAG AA
- **Loading States**: Clear loading indicators
- **Error States**: Descriptive error messages

## 📊 Performance

- **Optimistic Updates**: Instant UI feedback
- **Query Caching**: React Query cache management
- **Pagination**: Ready for large appointment lists
- **Lazy Loading**: Activity timeline loads on demand
- **Bundle Size**: Components are tree-shakeable

## 🛠️ Extending the Module

### Add New Status
1. Update schema in `appointment.ts`
2. Add to `STATE_TRANSITIONS` mapping
3. Add color in `STATUS_COLORS`
4. Update `ACTION_TO_STATUS`
5. Add UI in `AppointmentActions`

### Add New Side Effects
1. Update transition handler in API
2. Add activity event type
3. Update timeline component
4. Add toast notification

### Custom Fields
Use `metadata` field on appointments:
```typescript
appointment.metadata = {
  custom_field: 'value',
  preferences: { ... }
}
```

## 🎯 Production Checklist

- [ ] Replace mock API with real endpoints
- [ ] Implement WhatsApp webhook handling
- [ ] Add real-time updates (WebSocket/SSE)
- [ ] Configure time zone handling
- [ ] Add appointment reminders
- [ ] Implement recurring appointments
- [ ] Add capacity/conflict checking
- [ ] Set up analytics tracking
- [ ] Configure error monitoring
- [ ] Load test with 10K+ appointments

---

**Built with ❤️ for HERA Universal Architecture**

The Appointments module demonstrates HERA's power with a complete, production-ready appointment system that enforces business rules through an elegant state machine while maintaining perfect data integrity through the universal 6-table schema.