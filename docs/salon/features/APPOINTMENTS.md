# Appointments Feature Guide

**Version**: 2.0
**Last Updated**: 2025-01-07
**Smart Code**: `HERA.DOCS.SALON.FEATURE.APPOINTMENTS.v1`

> **Complete reference for the Salon Appointments system with calendar, booking, kanban board, and status workflow**

---

## 📋 Overview

### Purpose
The Appointments system provides comprehensive booking and management with:
- **Calendar View**: Month/week/day views with time slot booking
- **Kanban Board**: Status-based workflow (draft → booked → checked_in → in_progress → payment_pending → completed)
- **Status Workflow**: 8-state lifecycle with validation and transition rules
- **POS Integration**: One-click payment processing from appointments
- **Branch Filtering**: Multi-location appointment management
- **Real-time Updates**: Cross-tab synchronization via localStorage events

### User Roles
- **Owner/Admin**: Full appointment management
- **Receptionist**: Book, check-in, complete appointments
- **Manager**: View and manage all appointments
- **Stylist**: View own appointments (future feature)

### Related Features
- [Point of Sale](/docs/salon/features/POINT-OF-SALE.md) - Payment processing
- [Calendar](/docs/salon/features/CALENDAR.md) - Universal calendar component
- [Customers](/docs/salon/features/CUSTOMERS.md) - Customer management
- [Services](/docs/salon/features/SERVICES.md) - Service catalog
- [Staff](/docs/salon/features/STAFF.md) - Stylist management

---

## 🏗️ Architecture

### Data Model

**Sacred Six Tables Used:**
1. **universal_transactions**
   - Appointments as **TRANSACTION** type (not entities)
   - `transaction_type: 'APPOINTMENT'` (UPPERCASE required)
   - `source_entity_id`: Customer ID
   - `target_entity_id`: Stylist ID
   - `transaction_status`: Current status (draft, booked, checked_in, etc.)
   - `total_amount`: Total price from services

2. **universal_transaction_lines**
   - Service line items
   - `line_type: 'service'`
   - `entity_id`: Service entity ID
   - `quantity`: Always 1 for appointments
   - `unit_amount`: Service price
   - `line_amount`: Total for line

3. **core_entities**
   - Customers (`entity_type: 'CUSTOMER'`)
   - Services (`entity_type: 'SERVICE'`)
   - Staff (`entity_type: 'STAFF'`)

4. **Metadata Structure** (in `universal_transactions.metadata`):
```typescript
{
  start_time: string        // ISO datetime
  end_time: string          // ISO datetime
  duration_minutes: number  // Total duration
  notes: string | null      // Customer notes
  branch_id: string | null  // Branch location
  service_ids: string[]     // Array of service IDs
  service_names: string[]   // Enriched service names
  service_prices: number[]  // Enriched service prices
}
```

**Smart Codes:**
```typescript
// Transaction Smart Codes
'HERA.SALON.TXN.APPOINTMENT.CREATE.v1'  // Create appointment
'HERA.SALON.TXN.APPOINTMENT.UPDATE.v1'  // Update appointment
'HERA.SALON.TXN.APPOINTMENT.v1'         // General appointment

// Service Line Smart Codes
'HERA.SALON.SVC.LINE.STANDARD.v1'       // Service line item
```

### Status Workflow

**8-State Lifecycle**:
```
draft → booked → checked_in → in_progress → payment_pending → completed
                                    ↓
                                cancelled / no_show
```

**Status Configuration**:
```typescript
export const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: '#6B7280', icon: 'FileEdit' },
  booked: { label: 'Booked', color: '#3B82F6', icon: 'Calendar' },
  checked_in: { label: 'Checked In', color: '#8B5CF6', icon: 'UserCheck' },
  in_progress: { label: 'In Progress', color: '#F59E0B', icon: 'Clock' },
  payment_pending: { label: 'Payment Pending', color: '#EF4444', icon: 'DollarSign' },
  completed: { label: 'Completed', color: '#10B981', icon: 'CheckCircle' },
  cancelled: { label: 'Cancelled', color: '#6B7280', icon: 'XCircle' },
  no_show: { label: 'No Show', color: '#DC2626', icon: 'AlertCircle' }
}
```

**Valid Transitions** (forward flow only):
```typescript
export const VALID_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  draft: ['booked', 'checked_in', 'in_progress', 'payment_pending', 'completed', 'cancelled'],
  booked: ['checked_in', 'in_progress', 'payment_pending', 'completed', 'cancelled', 'no_show'],
  checked_in: ['in_progress', 'payment_pending', 'completed', 'cancelled', 'no_show'],
  in_progress: ['payment_pending', 'completed', 'cancelled'],
  payment_pending: ['completed', 'cancelled'],
  completed: [],  // Terminal state
  cancelled: [],  // Terminal state
  no_show: []     // Terminal state
}
```

**Transition Rules**:
- ✅ **Forward transitions** allowed (skip intermediate steps)
- ❌ **Backward transitions** blocked (cannot go from completed → in_progress)
- ✅ **Cancel/No-Show** allowed from any non-terminal state
- ❌ **Terminal states** (completed, cancelled, no_show) cannot transition

### Component Hierarchy

```
AppointmentsPage (Guard Wrapper)
  └── StatusToastProvider
        └── AppointmentsContent (Main Component)
              ├── PremiumMobileHeader (Mobile only)
              ├── Desktop Header
              ├── Filter Bar (Branch, Status, Date, Search)
              ├── View Switcher (Grid/List)
              ├── Appointment Grid/List
              │     └── AppointmentCard (for each appointment)
              │           ├── Status Badge
              │           ├── Customer/Stylist Info
              │           ├── Service Details
              │           ├── Quick Actions (Check-in, Complete, Cancel)
              │           └── Dropdown Menu (Edit, Delete, Archive)
              │
              └── Modals
                    ├── AppointmentModal (Create/Edit) - Lazy loaded
                    ├── DeleteConfirmDialog
                    ├── CancelConfirmDialog
                    └── PostponeDialog
```

### State Management

**useHeraAppointments Hook** (Central data layer):
```typescript
const {
  appointments,              // Enriched appointment list
  isLoading,                // Loading state
  createAppointment,        // Create new appointment
  updateAppointment,        // Update existing appointment
  updateAppointmentStatus,  // Update status only
  deleteAppointment,        // Delete appointment (drafts only)
  archiveAppointment,       // Soft delete (cancel)
  restoreAppointment,       // Restore from cancelled
  canTransitionTo,          // Validate status transition
  isForwardTransition,      // Check if transition is forward
  getTransitionErrorMessage,// Get error message for invalid transition
  refetch                   // Manual refetch
} = useHeraAppointments({
  organizationId,
  includeArchived: false,
  filters: {
    status: 'all',
    branch_id: selectedBranchId,
    date_from: '2025-01-01',
    date_to: '2025-12-31'
  }
})
```

**Appointment Interface**:
```typescript
export interface Appointment {
  id: string
  entity_name: string
  transaction_code: string
  transaction_date: string
  customer_id: string
  customer_name: string        // Enriched from customerMap
  stylist_id: string | null
  stylist_name: string         // Enriched from staffMap
  start_time: string           // ISO datetime
  end_time: string             // ISO datetime
  duration_minutes: number
  price: number                // Calculated from service prices
  total_amount: number
  status: AppointmentStatus
  notes: string | null
  branch_id: string | null
  metadata: {
    service_ids: string[]
    service_names: string[]    // Enriched from serviceMap
    service_prices: number[]   // Enriched from serviceMap
    start_time: string
    end_time: string
    duration_minutes: number
    notes: string | null
    branch_id: string | null
  }
  created_at: string
  updated_at: string
  smart_code: string
}
```

---

## 🔧 Key Components

### 1. Main Appointments Page
**File**: `/src/app/salon/appointments/page.tsx` (1000+ lines)

**Purpose**: Entry point with grid/list views, filters, and appointment management

**Key Features**:
- Grid view (cards) and list view (compact rows)
- Multi-filter system (status, date range, branch, search)
- Lazy-loaded appointment modal for performance
- Real-time status updates with optimistic UI
- Branch filtering with useBranchFilter hook

**State Management**:
```typescript
const [searchTerm, setSearchTerm] = useState('')
const [statusFilter, setStatusFilter] = useState<string>('all')
const [dateFilter, setDateFilter] = useState<string>('next7days')
const [viewMode, setViewMode] = useState<ViewMode>('grid')
const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
const [modalOpen, setModalOpen] = useState(false)
```

**Filter Logic**:
```typescript
const filteredAppointments = useMemo(() => {
  return appointments.filter(apt => {
    // Status filter
    if (statusFilter !== 'all' && apt.status !== statusFilter) return false

    // Search filter (customer name, stylist name, notes)
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchesCustomer = apt.customer_name.toLowerCase().includes(search)
      const matchesStylist = apt.stylist_name.toLowerCase().includes(search)
      const matchesNotes = apt.notes?.toLowerCase().includes(search)
      if (!matchesCustomer && !matchesStylist && !matchesNotes) return false
    }

    // Date filter
    const aptDate = new Date(apt.start_time)
    const now = new Date()

    switch (dateFilter) {
      case 'today':
        return aptDate.toDateString() === now.toDateString()
      case 'tomorrow':
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return aptDate.toDateString() === tomorrow.toDateString()
      case 'next7days':
        const next7 = new Date(now)
        next7.setDate(next7.getDate() + 7)
        return aptDate >= now && aptDate <= next7
      case 'next30days':
        const next30 = new Date(now)
        next30.setDate(next30.getDate() + 30)
        return aptDate >= now && aptDate <= next30
      case 'all':
      default:
        return true
    }
  })
}, [appointments, statusFilter, searchTerm, dateFilter])
```

### 2. AppointmentModal Component
**File**: `/src/components/salon/appointments/AppointmentModal.tsx`

**Purpose**: Create and edit appointments with full service selection

**Features**:
- Customer search/selection
- Stylist selection
- Service multi-select with prices
- Date/time picker
- Duration calculation (sum of service durations)
- Total price calculation (sum of service prices)
- Notes field
- Branch selection

**Props**:
```typescript
interface AppointmentModalProps {
  open: boolean
  onClose: () => void
  appointment?: Appointment | null  // Edit mode if provided
  organizationId: string
  onSave: (data: CreateAppointmentData | UpdateAppointmentData) => Promise<void>
}
```

**Form Structure**:
```tsx
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{appointment ? 'Edit' : 'New'} Appointment</DialogTitle>
    </DialogHeader>

    {/* Customer Selection */}
    <CustomerSearchCombobox
      value={selectedCustomerId}
      onChange={setSelectedCustomerId}
      customers={customers}
    />

    {/* Stylist Selection */}
    <Select value={selectedStylistId} onValueChange={setSelectedStylistId}>
      <SelectTrigger>
        <SelectValue placeholder="Select stylist" />
      </SelectTrigger>
      <SelectContent>
        {staff.map(s => (
          <SelectItem key={s.id} value={s.id}>
            {s.entity_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {/* Service Multi-Select */}
    <ServiceMultiSelect
      value={selectedServiceIds}
      onChange={setSelectedServiceIds}
      services={services}
      showPrices={true}
    />

    {/* Date Picker */}
    <Input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
    />

    {/* Time Picker */}
    <Input
      type="time"
      value={selectedTime}
      onChange={(e) => setSelectedTime(e.target.value)}
    />

    {/* Calculated Duration (read-only) */}
    <Input
      value={`${totalDuration} minutes`}
      disabled
    />

    {/* Calculated Price (read-only) */}
    <Input
      value={formatCurrency(totalPrice)}
      disabled
    />

    {/* Notes */}
    <Textarea
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
      placeholder="Special requests or notes..."
    />

    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={handleSave}>
        {appointment ? 'Update' : 'Create'} Appointment
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Validation**:
```typescript
const validate = () => {
  const errors: string[] = []

  if (!selectedCustomerId) errors.push('Customer is required')
  if (selectedServiceIds.length === 0) errors.push('At least one service is required')
  if (!selectedDate) errors.push('Date is required')
  if (!selectedTime) errors.push('Time is required')

  return errors
}
```

### 3. AppointmentCard Component
**File**: `/src/components/salon/appointments/AppointmentCard.tsx`

**Purpose**: Display individual appointment in grid/list view

**Features**:
- Status badge with color coding
- Customer and stylist information
- Service list with prices
- Time and duration display
- Quick action buttons (Check-in, Complete)
- Dropdown menu (Edit, Delete, Cancel, Archive)
- Mobile-responsive layout

**Card Layout**:
```tsx
<div className="p-4 rounded-xl hover:scale-[1.02] transition-transform">
  {/* Header */}
  <div className="flex items-start justify-between mb-3">
    <div className="flex items-center gap-2">
      <Badge style={{ backgroundColor: STATUS_CONFIG[apt.status].color }}>
        {STATUS_CONFIG[apt.status].label}
      </Badge>
      {apt.branch_id && <Building2 className="w-4 h-4 text-bronze" />}
    </div>

    {/* Dropdown Menu */}
    <DropdownMenu>
      <DropdownMenuTrigger>
        <MoreVertical className="w-5 h-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onEdit(apt)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(apt)}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCancel(apt)}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  {/* Customer */}
  <div className="mb-2">
    <div className="flex items-center gap-2">
      <User className="w-4 h-4 text-gold" />
      <span className="font-semibold text-champagne">{apt.customer_name}</span>
    </div>
  </div>

  {/* Stylist */}
  <div className="mb-3">
    <div className="flex items-center gap-2">
      <Scissors className="w-4 h-4 text-bronze" />
      <span className="text-sm text-bronze">{apt.stylist_name}</span>
    </div>
  </div>

  {/* Services */}
  <div className="mb-3 space-y-1">
    {apt.metadata.service_names.map((name, idx) => (
      <div key={idx} className="flex justify-between text-sm">
        <span className="text-champagne">{name}</span>
        <span className="text-gold">{formatCurrency(apt.metadata.service_prices[idx])}</span>
      </div>
    ))}
  </div>

  {/* Time and Duration */}
  <div className="flex items-center justify-between text-sm text-bronze mb-4">
    <div className="flex items-center gap-1">
      <Clock className="w-3 h-3" />
      {format(new Date(apt.start_time), 'MMM dd, h:mm a')}
    </div>
    <span>{apt.duration_minutes} min</span>
  </div>

  {/* Total Price */}
  <div className="flex justify-between items-center mb-4 pt-3 border-t border-gold/20">
    <span className="font-semibold text-champagne">Total</span>
    <span className="text-xl font-bold text-gold">{formatCurrency(apt.total_amount)}</span>
  </div>

  {/* Quick Actions */}
  <div className="flex gap-2">
    {apt.status === 'booked' && (
      <Button
        onClick={() => onUpdateStatus(apt.id, 'checked_in')}
        className="flex-1"
        size="sm"
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Check In
      </Button>
    )}

    {apt.status === 'checked_in' && (
      <Button
        onClick={() => onUpdateStatus(apt.id, 'in_progress')}
        className="flex-1"
        size="sm"
      >
        <Clock className="w-4 h-4 mr-2" />
        Start Service
      </Button>
    )}

    {apt.status === 'in_progress' && (
      <Button
        onClick={() => onUpdateStatus(apt.id, 'payment_pending')}
        className="flex-1"
        size="sm"
      >
        <DollarSign className="w-4 h-4 mr-2" />
        Request Payment
      </Button>
    )}

    {apt.status === 'payment_pending' && (
      <Button
        onClick={() => onNavigateToPOS(apt)}
        className="flex-1"
        size="sm"
      >
        <CreditCard className="w-4 h-4 mr-2" />
        Process Payment
      </Button>
    )}
  </div>
</div>
```

### 4. Calendar View
**File**: `/src/app/salon/appointments/calendar/page.tsx`

**Purpose**: Month/week/day calendar views with time slot booking

**Features**:
- Month view with appointment dots
- Week view with time slots
- Day view with detailed schedule
- Drag-and-drop appointment rescheduling (future)
- Color-coded by status
- Click to view/edit appointment

**Integration**: Uses HeraDnaUniversalResourceCalendar component from `/src/components/calendar/`

---

## 🔌 Hooks & Utilities

### useHeraAppointments Hook
**File**: `/src/hooks/useHeraAppointments.ts` (659 lines)

**Purpose**: Complete appointment CRUD with status workflow and enrichment

**Architecture**:
- **Layer 1**: Universal hooks (useUniversalEntityV1, useUniversalTransactionV1)
- **Layer 2**: Enrichment layer (this hook)
- Fetches appointments as TRANSACTIONS
- Enriches with customer/stylist/service names and prices
- Provides status workflow validation

**Key Methods**:

**1. Create Appointment**:
```typescript
const createAppointment = async (data: CreateAppointmentData) => {
  const result = await createTransaction({
    transaction_type: 'APPOINTMENT',
    smart_code: 'HERA.SALON.TXN.APPOINTMENT.CREATE.v1',
    transaction_code: `APT-${Date.now()}`,
    transaction_date: data.start_time,
    source_entity_id: data.customer_id,
    target_entity_id: data.stylist_id || null,
    total_amount: data.price,
    transaction_status: data.status || 'draft',
    metadata: {
      start_time: data.start_time,
      end_time: data.end_time,
      duration_minutes: data.duration_minutes || 60,
      notes: data.notes || null,
      branch_id: data.branch_id || null
    },
    lines: (data.service_ids || []).map((serviceId, index) => ({
      line_number: index + 1,
      line_type: 'service',
      entity_id: serviceId,
      description: serviceMap.get(serviceId)?.name || 'Service',
      quantity: 1,
      unit_amount: serviceMap.get(serviceId)?.price || 0,
      line_amount: serviceMap.get(serviceId)?.price || 0,
      smart_code: 'HERA.SALON.SVC.LINE.STANDARD.v1'
    }))
  })

  return result
}
```

**2. Update Appointment**:
```typescript
const updateAppointment = async ({
  id,
  data,
  skipValidation
}: {
  id: string
  data: UpdateAppointmentData
  skipValidation?: boolean
}) => {
  const appointment = enrichedAppointments.find(a => a.id === id)
  if (!appointment) throw new Error('Appointment not found')

  // Validate status transition (unless skipValidation)
  if (data.status && data.status !== appointment.status && !skipValidation) {
    const currentStatus = appointment.status as AppointmentStatus
    const newStatus = data.status as AppointmentStatus
    if (!canTransitionTo(currentStatus, newStatus)) {
      throw new Error(`Cannot transition from "${currentStatus}" to "${newStatus}"`)
    }
  }

  const result = await updateTransaction({
    transaction_id: id,
    smart_code: appointment.smart_code || 'HERA.SALON.TXN.APPOINTMENT.UPDATE.v1',
    ...(data.customer_id && { source_entity_id: data.customer_id }),
    ...(data.stylist_id !== undefined && { target_entity_id: data.stylist_id }),
    ...(data.price && { total_amount: data.price }),
    ...(data.start_time && { transaction_date: data.start_time }),
    ...(data.status && { transaction_status: data.status }),
    metadata: {
      ...appointment.metadata,
      ...(data.start_time && { start_time: data.start_time }),
      ...(data.end_time && { end_time: data.end_time }),
      ...(data.duration_minutes && { duration_minutes: data.duration_minutes }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.branch_id !== undefined && { branch_id: data.branch_id }),
      ...(data.service_ids && { service_ids: data.service_ids })
    }
  })

  return result
}
```

**3. Status Workflow Helpers**:
```typescript
// Check if transition is valid
export function canTransitionTo(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): boolean {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus]
  return allowedTransitions.includes(newStatus)
}

// Check if transition is forward
export function isForwardTransition(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): boolean {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)
  const newIndex = STATUS_ORDER.indexOf(newStatus)

  // Special cases for terminal states
  if (newStatus === 'cancelled' || newStatus === 'no_show') return true
  if (currentIndex === -1 || newIndex === -1) return false

  return newIndex > currentIndex
}

// Get error message for invalid transition
export function getTransitionErrorMessage(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): string {
  // Terminal states
  if (currentStatus === 'completed') {
    return 'Completed appointments cannot be changed. Create a new appointment instead.'
  }
  if (currentStatus === 'cancelled') {
    return 'Cancelled appointments cannot be changed. Please restore first.'
  }
  if (currentStatus === 'no_show') {
    return 'No-show appointments cannot be changed. Please restore first.'
  }

  // Backwards transition
  if (!isForwardTransition(currentStatus, newStatus) && newStatus !== 'cancelled' && newStatus !== 'no_show') {
    return `Cannot move backwards from "${STATUS_CONFIG[currentStatus].label}" to "${STATUS_CONFIG[newStatus].label}"`
  }

  return `Cannot transition from "${STATUS_CONFIG[currentStatus].label}" to "${STATUS_CONFIG[newStatus].label}"`
}
```

**4. Enrichment Logic**:
```typescript
// Transform transactions to appointments with enriched data
const enrichedAppointments = useMemo(() => {
  return transactions.map(txn => {
    // Enrich customer name from map
    const customerName = txn.source_entity_id
      ? customerMap.get(txn.source_entity_id) || 'Unknown Customer'
      : 'Unknown Customer'

    // Enrich stylist name from map
    const stylistName = txn.target_entity_id
      ? staffMap.get(txn.target_entity_id) || 'Unassigned'
      : 'Unassigned'

    // Enrich service data from service_ids
    const serviceIds = txn.metadata?.service_ids || []
    const serviceNames: string[] = []
    const servicePrices: number[] = []

    serviceIds.forEach(serviceId => {
      const serviceData = serviceMap.get(serviceId)
      if (serviceData) {
        serviceNames.push(serviceData.name)
        servicePrices.push(serviceData.price)
      } else {
        serviceNames.push('Service')
        servicePrices.push(0)
      }
    })

    // Calculate correct total from service prices
    const calculatedTotal = servicePrices.reduce((sum, price) => sum + price, 0)

    return {
      id: txn.id,
      entity_name: `${customerName} - ${new Date(txn.metadata.start_time).toLocaleDateString()}`,
      transaction_code: txn.transaction_code,
      transaction_date: txn.transaction_date,
      customer_id: txn.source_entity_id,
      customer_name: customerName,
      stylist_id: txn.target_entity_id,
      stylist_name: stylistName,
      start_time: txn.metadata.start_time,
      end_time: txn.metadata.end_time,
      duration_minutes: txn.metadata.duration_minutes,
      price: calculatedTotal,
      total_amount: calculatedTotal,
      status: txn.transaction_status,
      notes: txn.metadata.notes,
      branch_id: txn.metadata.branch_id,
      metadata: {
        ...txn.metadata,
        service_ids: serviceIds,
        service_names: serviceNames,
        service_prices: servicePrices
      },
      created_at: txn.created_at,
      updated_at: txn.updated_at,
      smart_code: txn.smart_code
    }
  })
}, [transactions, customerMap, staffMap, serviceMap])
```

---

## 🎨 Patterns & Conventions

### POS Integration Pattern

**Purpose**: Seamless flow from appointment to payment processing

**Implementation** (in AppointmentCard):
```typescript
const handleNavigateToPOS = (appointment: Appointment) => {
  // Store appointment data in sessionStorage
  sessionStorage.setItem('pos_appointment', JSON.stringify({
    id: appointment.id,
    customer_id: appointment.customer_id,
    customer_name: appointment.customer_name,
    stylist_id: appointment.stylist_id,
    stylist_name: appointment.stylist_name,
    branch_id: appointment.branch_id,
    service_ids: appointment.metadata.service_ids,
    service_names: appointment.metadata.service_names,
    service_prices: appointment.metadata.service_prices
  }))

  // Navigate to POS
  router.push('/salon/pos')
}
```

**POS reads this data** (in `/src/app/salon/pos/page.tsx`):
```typescript
useEffect(() => {
  const storedAppointment = sessionStorage.getItem('pos_appointment')
  if (storedAppointment) {
    const appointmentData = JSON.parse(storedAppointment)

    // Auto-populate POS ticket
    addCustomerToTicket({
      customer_id: appointmentData.customer_id,
      customer_name: appointmentData.customer_name
    })

    addItemsFromAppointment(appointmentData)

    // Clear sessionStorage
    sessionStorage.removeItem('pos_appointment')
  }
}, [])
```

**After Payment** (POS updates appointment status):
```typescript
// In PaymentDialog onComplete
await updateAppointmentStatus({
  id: ticket.appointment_id,
  status: 'completed'
})

// Set localStorage flag for calendar refresh
localStorage.setItem('appointment_status_updated', JSON.stringify({
  appointment_id: ticket.appointment_id,
  status: 'completed',
  timestamp: new Date().toISOString()
}))
```

### Cross-Tab Synchronization

**Purpose**: Refresh appointments when status changes in another tab

**Implementation** (in appointments page):
```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'appointment_status_updated') {
      // Refetch appointments
      refetch()

      // Clear the flag
      localStorage.removeItem('appointment_status_updated')
    }
  }

  window.addEventListener('storage', handleStorageChange)
  return () => window.removeEventListener('storage', handleStorageChange)
}, [refetch])
```

---

## 🔍 Common Tasks

### Task 1: Add New Status

**Goal**: Add "confirmed" status between "booked" and "checked_in"

**Steps**:

**1. Update Type**:
```typescript
// useHeraAppointments.ts
export type AppointmentStatus =
  | 'draft'
  | 'booked'
  | 'confirmed'  // NEW
  | 'checked_in'
  | 'in_progress'
  | 'payment_pending'
  | 'completed'
  | 'cancelled'
  | 'no_show'
```

**2. Update Status Config**:
```typescript
export const STATUS_CONFIG: Record<AppointmentStatus, {...}> = {
  // ... existing statuses
  confirmed: { label: 'Confirmed', color: '#059669', icon: 'CheckCheck' }
}
```

**3. Update Valid Transitions**:
```typescript
export const VALID_STATUS_TRANSITIONS = {
  draft: ['booked', 'confirmed', 'checked_in', ...],
  booked: ['confirmed', 'checked_in', ...],
  confirmed: ['checked_in', 'in_progress', ...],  // NEW
  // ... rest
}
```

**4. Update Status Order**:
```typescript
const STATUS_ORDER: AppointmentStatus[] = [
  'draft',
  'booked',
  'confirmed',  // NEW
  'checked_in',
  'in_progress',
  'payment_pending',
  'completed'
]
```

### Task 2: Add Appointment Reminders

**Goal**: Send WhatsApp reminders 24 hours before appointment

**Steps**:

**1. Create Reminder Service**:
```typescript
// services/appointment-reminders.ts
export async function scheduleReminder(appointment: Appointment) {
  const reminderTime = new Date(appointment.start_time)
  reminderTime.setHours(reminderTime.getHours() - 24)

  await createTransaction({
    transaction_type: 'REMINDER',
    smart_code: 'HERA.SALON.TXN.REMINDER.WHATSAPP.v1',
    source_entity_id: appointment.customer_id,
    target_entity_id: appointment.id,
    transaction_date: reminderTime.toISOString(),
    transaction_status: 'scheduled',
    metadata: {
      reminder_type: 'whatsapp',
      appointment_id: appointment.id,
      send_at: reminderTime.toISOString()
    }
  })
}
```

**2. Call on Appointment Create/Update**:
```typescript
// After creating appointment
const newAppointment = await createAppointment(data)
await scheduleReminder(newAppointment)
```

**3. Create Cron Job** (Supabase Edge Function):
```typescript
// supabase/functions/send-reminders/index.ts
Deno.serve(async () => {
  const now = new Date()

  // Fetch due reminders
  const { data: reminders } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_type', 'REMINDER')
    .eq('transaction_status', 'scheduled')
    .lte('transaction_date', now.toISOString())

  // Send each reminder
  for (const reminder of reminders) {
    await sendWhatsAppMessage({
      to: reminder.metadata.customer_phone,
      message: `Reminder: Your appointment tomorrow at ${reminder.metadata.appointment_time}`
    })

    // Mark as sent
    await supabase
      .from('universal_transactions')
      .update({ transaction_status: 'sent' })
      .eq('id', reminder.id)
  }

  return new Response('OK')
})
```

---

## 📊 Success Metrics

An Appointments feature is considered production-ready when:
- ✅ All status transitions validate correctly
- ✅ POS integration works seamlessly (sessionStorage handoff)
- ✅ Cross-tab synchronization updates appointments in real-time
- ✅ Grid and list views perform well with 100+ appointments
- ✅ Calendar view displays appointments correctly
- ✅ Mobile responsive on 375px+ screens
- ✅ E2E tests cover complete booking workflow
- ✅ Appointment enrichment (names, prices) accurate
- ✅ Terminal states (completed, cancelled) cannot transition

---

## 🔗 See Also

- [Point of Sale Feature](/docs/salon/features/POINT-OF-SALE.md) - Payment processing
- [Calendar Feature](/docs/salon/features/CALENDAR.md) - Universal calendar
- [Customers Feature](/docs/salon/features/CUSTOMERS.md) - Customer management
- [Services Feature](/docs/salon/features/SERVICES.md) - Service catalog
- [Staff Feature](/docs/salon/features/STAFF.md) - Stylist management

---

<div align="center">

**Appointments Feature Guide** | **HERA Salon Module v2.0** | **Enterprise Ready**

[← Back to Developer Guide](../DEVELOPER-GUIDE.md) | [Next: Customers →](./CUSTOMERS.md)

</div>
