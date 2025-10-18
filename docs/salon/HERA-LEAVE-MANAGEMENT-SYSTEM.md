# HERA Leave Management System Documentation

**Smart Code**: `HERA.SALON.HR.LEAVE.*V1`
**Status**: ✅ Production Ready
**Architecture**: Sacred Six Tables with Universal API v2
**Last Updated**: 2025-01-16

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Data Model](#architecture--data-model)
3. [Smart Codes](#smart-codes)
4. [Entity & Transaction Types](#entity--transaction-types)
5. [API Endpoints](#api-endpoints)
6. [UI Components](#ui-components)
7. [Business Logic](#business-logic)
8. [Testing & Validation](#testing--validation)
9. [Future Enhancements](#future-enhancements)

---

## 🎯 System Overview

The HERA Leave Management System provides enterprise-grade leave/PTO management for salon businesses using HERA's Universal Architecture. It follows the Sacred Six pattern with **NO schema changes**, storing all data in the 6 core tables.

### Key Features

✅ **Leave Requests**: Create, approve, reject, cancel leave requests
✅ **Leave Policies**: Define annual entitlements, carryover, notice periods
✅ **Leave Balances**: Real-time calculation of used/pending/remaining days
✅ **Leave Calendar**: Visual calendar showing approved leave
✅ **Annual Reports**: Export leave reports by staff/year
✅ **Status Workflows**: Transaction-based status management (no relationships)
✅ **Multi-Branch**: Support for multi-location businesses
✅ **Audit Trail**: Complete audit trail via universal_transactions
✅ **SalonLuxe UI**: Enterprise-grade dark theme with gold accents

---

## 🏗️ Architecture & Data Model

### Sacred Six Tables Usage

```
┌─────────────────────────────────────────────────────────────┐
│                    LEAVE MANAGEMENT                          │
├─────────────────────────────────────────────────────────────┤
│ core_entities (3 entity types)                              │
│   → LEAVE_POLICY (policies)                                 │
│   → STAFF (staff members)                                   │
│   → LEAVE_STATUS (workflow states) [deprecated]             │
├─────────────────────────────────────────────────────────────┤
│ core_dynamic_data                                            │
│   → Store all policy/request attributes                     │
│   → annual_entitlement, carry_over_cap, etc.                │
├─────────────────────────────────────────────────────────────┤
│ universal_transactions                                       │
│   → transaction_type: 'LEAVE'                               │
│   → transaction_status: submitted/approved/rejected         │
│   → source_entity_id: staff_id (requester)                  │
│   → target_entity_id: manager_id (approver)                 │
│   → total_amount: total_days                                │
├─────────────────────────────────────────────────────────────┤
│ universal_transaction_lines                                  │
│   → Line item with leave details                            │
│   → line_type: 'leave'                                      │
│   → quantity: total_days                                    │
├─────────────────────────────────────────────────────────────┤
│ core_relationships (DEPRECATED)                              │
│   → Originally used for status workflow                     │
│   → NOW using transaction_status field instead              │
└─────────────────────────────────────────────────────────────┘
```

### Status Management Evolution

**OLD APPROACH** (deprecated):
```typescript
// ❌ Used relationships for status
CREATE relationship (
  relationship_type: 'HAS_STATUS',
  from: LEAVE_REQUEST,
  to: LEAVE_STATUS
)
```

**NEW APPROACH** (current):
```typescript
// ✅ Use transaction_status field directly
universal_transactions {
  transaction_status: 'submitted' | 'approved' | 'rejected'
}
```

---

## 🏷️ Smart Codes

All smart codes follow the HERA pattern: `HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.V{N}`

### Leave Request Smart Codes

```typescript
// Transaction-level smart codes
HERA.SALON.HR.LEAVE.ANNUAL.V1      // Annual leave request
HERA.SALON.HR.LEAVE.SICK.V1        // Sick leave request
HERA.SALON.HR.LEAVE.UNPAID.V1      // Unpaid leave request

// Transaction line smart codes
HERA.SALON.HR.LINE.ANNUAL.V1       // Annual leave line item
HERA.SALON.HR.LINE.SICK.V1         // Sick leave line item
HERA.SALON.HR.LINE.UNPAID.V1       // Unpaid leave line item
```

### Leave Policy Smart Codes

```typescript
HERA.SALON.HR.LEAVE.POLICY.V1      // Leave policy entity
```

### Smart Code Format

- **6 segments** total (not 7)
- **UPPERCASE** segments
- **Trailing version** like `.V1` (not `.v1`)
- **Format validation**: `HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.V{N}`

---

## 📊 Entity & Transaction Types

### 1. LEAVE_POLICY Entity

**entity_type**: `'LEAVE_POLICY'`
**smart_code**: `'HERA.SALON.HR.LEAVE.POLICY.V1'`

**Metadata Fields** (stored in `core_entities.metadata`):
```typescript
{
  metadata_category: 'hr_policy',
  leave_type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER',
  annual_entitlement: number,         // Days per year
  carry_over_cap: number,             // Max carryover days
  min_notice_days: number,            // Required notice period
  max_consecutive_days: number,       // Max consecutive days off
  min_leave_days: number,             // Min leave duration (0.5 for half days)
  accrual_method: 'IMMEDIATE' | 'MONTHLY',
  probation_period_months: number,    // Probation before eligibility
  applies_to: 'FULL_TIME' | 'PART_TIME' | 'ALL',
  effective_from: string,             // ISO date
  effective_to?: string,              // ISO date (optional)
  description?: string
}
```

**Example Policy Creation**:
```typescript
await createPolicy({
  entity_name: 'Annual Leave Policy 2025',
  leave_type: 'ANNUAL',
  annual_entitlement: 21,
  carry_over_cap: 5,
  min_notice_days: 7,
  max_consecutive_days: 15,
  min_leave_days: 0.5,
  accrual_method: 'IMMEDIATE',
  probation_period_months: 3,
  applies_to: 'FULL_TIME',
  effective_from: '2025-01-01'
})
```

### 2. LEAVE Transaction

**transaction_type**: `'LEAVE'`
**smart_code**: `'HERA.SALON.HR.LEAVE.{TYPE}.V1'`

**Transaction Fields**:
```typescript
{
  // Core transaction fields
  transaction_type: 'LEAVE',
  smart_code: 'HERA.SALON.HR.LEAVE.ANNUAL.V1',
  transaction_date: string,           // ISO date
  source_entity_id: string,           // Staff ID (requester)
  target_entity_id: string,           // Manager ID (approver)
  total_amount: number,               // Total days
  transaction_status: string,         // 'submitted'|'approved'|'rejected'

  // Metadata
  metadata: {
    metadata_category: 'hr_leave',
    leave_type: 'ANNUAL' | 'SICK' | 'UNPAID',
    start_date: string,               // ISO date
    end_date: string,                 // ISO date
    total_days: number,
    reason: string,
    notes?: string,
    submitted_by: string,             // User ID
    submitted_at: string,             // ISO timestamp
    approved_at?: string,
    approved_by?: string,
    approval_notes?: string,
    rejected_at?: string,
    rejected_by?: string,
    rejection_reason?: string
  },

  // Transaction lines (required)
  lines: [{
    line_type: 'leave',
    description: string,
    quantity: number,                 // Total days
    unit_amount: 1,
    line_amount: number,              // Total days
    smart_code: 'HERA.SALON.HR.LINE.ANNUAL.V1',
    metadata: {
      leave_type: string,
      start_date: string,
      end_date: string
    }
  }]
}
```

**Example Leave Request Creation**:
```typescript
await createLeave({
  staff_id: 'staff-uuid',
  manager_id: 'manager-uuid',
  leave_type: 'ANNUAL',
  start_date: '2025-06-01',
  end_date: '2025-06-05',
  reason: 'Family vacation',
  notes: 'Will be unavailable'
})
```

---

## 🔌 API Endpoints

### Universal API v2 Pattern

All leave management uses the Universal API v2 endpoints with automatic organization isolation and authentication.

### Leave Requests

#### Create Leave Request
```http
POST /api/v2/transactions
Content-Type: application/json

{
  "transaction_type": "LEAVE",
  "smart_code": "HERA.SALON.HR.LEAVE.ANNUAL.V1",
  "transaction_date": "2025-01-16T00:00:00Z",
  "source_entity_id": "<staff_id>",
  "target_entity_id": "<manager_id>",
  "total_amount": 5,
  "status": "submitted",
  "metadata": {
    "metadata_category": "hr_leave",
    "leave_type": "ANNUAL",
    "start_date": "2025-06-01",
    "end_date": "2025-06-05",
    "total_days": 5,
    "reason": "Family vacation",
    "notes": "Will be unavailable",
    "submitted_by": "<user_id>",
    "submitted_at": "2025-01-16T10:00:00Z"
  },
  "lines": [{
    "line_type": "leave",
    "description": "ANNUAL Leave: 5 days",
    "quantity": 5,
    "unit_amount": 1,
    "line_amount": 5,
    "smart_code": "HERA.SALON.HR.LINE.ANNUAL.V1",
    "metadata": {
      "leave_type": "ANNUAL",
      "start_date": "2025-06-01",
      "end_date": "2025-06-05"
    }
  }]
}
```

#### Approve Leave Request
```http
PUT /api/v2/transactions/:id
Content-Type: application/json

{
  "transaction_id": "<leave_request_id>",
  "status": "approved",
  "metadata": {
    "approved_by": "<approver_user_id>",
    "approved_at": "2025-01-16T12:00:00Z",
    "approval_notes": "Approved - enjoy your vacation"
  }
}
```

#### Reject Leave Request
```http
PUT /api/v2/transactions/:id
Content-Type: application/json

{
  "transaction_id": "<leave_request_id>",
  "status": "rejected",
  "metadata": {
    "rejected_by": "<approver_user_id>",
    "rejected_at": "2025-01-16T12:00:00Z",
    "rejection_reason": "Insufficient coverage during this period"
  }
}
```

### Leave Policies

#### Create Leave Policy
```http
POST /api/v2/entities
Content-Type: application/json

{
  "entity_type": "LEAVE_POLICY",
  "entity_name": "Annual Leave Policy 2025",
  "entity_code": "POL-ANNUAL-1234567890",
  "smart_code": "HERA.SALON.HR.LEAVE.POLICY.V1",
  "status": "ACTIVE",
  "metadata": {
    "metadata_category": "hr_policy",
    "leave_type": "ANNUAL",
    "annual_entitlement": 21,
    "carry_over_cap": 5,
    "min_notice_days": 7,
    "max_consecutive_days": 15,
    "min_leave_days": 0.5,
    "accrual_method": "IMMEDIATE",
    "probation_period_months": 3,
    "applies_to": "FULL_TIME",
    "effective_from": "2025-01-01",
    "description": "Standard annual leave policy"
  }
}
```

---

## 🎨 UI Components

### SalonLuxe Theme

All UI components use the Salon Luxe design system with:
- **Dark charcoal backgrounds** (`#0F0F0F`, `#1A1A1A`)
- **Gold accents** (`#D4AF37`)
- **Champagne text** (`#F5E6C8`)
- **Glassmorphic effects**
- **Smooth animations**

### Key Components

#### 1. LeaveManagementPage
**Path**: `/src/app/salon/leave/page.tsx`

Main page with tabs:
- **Requests**: List of all leave requests with approve/reject actions
- **Calendar**: Visual calendar showing approved leave
- **Report**: Annual leave report with balances
- **Policies**: Leave policy management

**Features**:
- ✅ Keyboard shortcuts (`/` for search, `⌘N` for new request)
- ✅ Branch filtering
- ✅ Staff search
- ✅ Responsive design
- ✅ Real-time updates via React Query

#### 2. LeaveRequestModal
**Path**: `/src/components/salon/leave/LeaveRequestModal.tsx`

**Features**:
- ✅ SalonLuxeModal wrapper
- ✅ Staff selection
- ✅ Leave type dropdown
- ✅ Date range picker with calendar
- ✅ Half-day options
- ✅ Working days calculation (excludes weekends/holidays)
- ✅ Notice period warnings
- ✅ Keyboard shortcut (`⌘Enter` to submit)

**Validation**:
- Start date <= end date
- Future dates only
- Staff selection required

#### 3. LeaveRequestList
**Path**: `/src/components/salon/leave/LeaveRequestList.tsx`

**Features**:
- ✅ Status-based filtering
- ✅ Approve/Reject buttons (for admins)
- ✅ Status badges with colors
- ✅ Staff avatars
- ✅ Date formatting
- ✅ Working days display

#### 4. LeaveCalendar
**Path**: `/src/components/salon/leave/LeaveCalendar.tsx`

**Features**:
- ✅ Monthly calendar view
- ✅ Color-coded by staff
- ✅ Approved leave only
- ✅ Hover tooltips
- ✅ Branch filtering

#### 5. AnnualLeaveReport
**Path**: `/src/components/salon/leave/AnnualLeaveReport.tsx`

**Features**:
- ✅ Staff-by-staff breakdown
- ✅ Entitlement / Used / Remaining / Available
- ✅ Progress bars
- ✅ Export to CSV
- ✅ Year filtering

#### 6. PolicyModal
**Path**: `/src/components/salon/leave/PolicyModal.tsx`

**Features**:
- ✅ Create/Edit policies
- ✅ All policy fields
- ✅ Validation
- ✅ SalonLuxeModal wrapper

---

## 💼 Business Logic

### Working Days Calculation

The system calculates working days excluding:
- **Weekends**: Saturday and Sunday
- **Public Holidays**: Defined in organization policy

```typescript
function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  holidays: Date[],
  halfDayStart: boolean,
  halfDayEnd: boolean
): number {
  let days = 0
  let current = new Date(startDate)

  while (current <= endDate) {
    const isWeekend = current.getDay() === 0 || current.getDay() === 6
    const isHoliday = holidays.some(h =>
      h.toDateString() === current.toDateString()
    )

    if (!isWeekend && !isHoliday) {
      days++
    }

    current.setDate(current.getDate() + 1)
  }

  // Adjust for half days
  if (halfDayStart) days -= 0.5
  if (halfDayEnd) days -= 0.5

  return days
}
```

### Leave Balance Calculation

**In-memory calculation** (no additional API calls):

```typescript
interface LeaveBalance {
  staff_id: string
  staff_name: string
  policy_id: string
  entitlement: number        // Annual allowance
  carry_over: number         // Previous year carryover
  total_allocation: number   // entitlement + carry_over
  used_days: number          // Approved requests only
  pending_days: number       // Submitted/pending requests
  remaining_days: number     // total_allocation - used_days
  available_days: number     // remaining_days - pending_days
}

// Calculation logic
const usedDays = requests
  .filter(r => r.staff_id === staffId && r.current_status === 'APPROVED')
  .reduce((sum, r) => sum + r.total_days, 0)

const pendingDays = requests
  .filter(r => r.staff_id === staffId &&
    (r.current_status === 'SUBMITTED' ||
     r.current_status === 'PENDING_APPROVAL'))
  .reduce((sum, r) => sum + r.total_days, 0)

const remainingDays = totalAllocation - usedDays
const availableDays = remainingDays - pendingDays
```

### Status Workflow

```
┌──────────────┐
│  SUBMITTED   │ ← Initial state
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐   ┌──────────────┐
│   APPROVED   │   │   REJECTED   │
└──────────────┘   └──────────────┘
       │
       ▼
┌──────────────┐
│  CANCELLED   │ ← Can cancel approved (owner only)
└──────────────┘
```

**Status Transitions**:
- `submitted` → `approved` (Owner only)
- `submitted` → `rejected` (Owner only)
- `submitted` → `cancelled` (Manager/Owner)
- `approved` → `cancelled` (Owner only, with warning)

### Validation Rules

1. **Date Validation**:
   - Start date must be in the future
   - End date must be >= start date

2. **Notice Period**:
   - Warning if start date < min_notice_days from today
   - Does NOT block submission (soft warning)

3. **Balance Validation**:
   - **Soft validation**: System warns if exceeding balance
   - **Owner override**: Owner can approve over-balance requests

4. **Overlap Detection**:
   - Check for overlapping approved requests
   - Block if same staff has approved leave in date range

---

## 🧪 Testing & Validation

### Test Scenarios

#### 1. Create Leave Request
```typescript
// Scenario: Staff requests 5 days annual leave
await createLeave({
  staff_id: 'maya-uuid',
  manager_id: 'owner-uuid',
  leave_type: 'ANNUAL',
  start_date: '2025-06-01',
  end_date: '2025-06-05',
  reason: 'Family vacation'
})

// Expected:
// - Transaction created with status='submitted'
// - total_amount = 5
// - Transaction line created
// - Balance updated (pending_days += 5)
```

#### 2. Approve Leave Request
```typescript
// Scenario: Owner approves the request
await approveLeave(requestId, 'Approved - have a great trip!')

// Expected:
// - transaction_status changed to 'approved'
// - approved_at timestamp set
// - approved_by user ID set
// - Balance updated (used_days += 5, pending_days -= 5)
```

#### 3. Reject Leave Request
```typescript
// Scenario: Owner rejects due to coverage
await rejectLeave(requestId, 'Insufficient coverage during June')

// Expected:
// - transaction_status changed to 'rejected'
// - rejected_at timestamp set
// - rejected_by user ID set
// - Balance updated (pending_days -= 5)
```

#### 4. Balance Calculation
```typescript
// Scenario: Staff has 21 days entitlement, used 10, pending 5
const balance = balancesByStaff['maya-uuid']

// Expected:
// - entitlement: 21
// - used_days: 10
// - pending_days: 5
// - remaining_days: 11 (21 - 10)
// - available_days: 6 (11 - 5)
```

### Test Files

- `/src/hooks/__tests__/useLeavePlaybook.test.tsx`
- `/src/components/salon/leave/__tests__/LeaveRequestModal.test.tsx`
- `/src/components/salon/leave/__tests__/LeaveRequestList.test.tsx`
- `/src/components/salon/leave/__tests__/LeaveApprovalDrawer.test.tsx`

---

## 🔮 Future Enhancements

### Phase 2: Appointment Integration

**Objective**: Block staff availability when leave is approved

**Implementation**:
1. Create `LEAVE_BLOCKS` relationships on approval
2. Link to `SALON_LOCATION` or `CALENDAR_BLOCK` entities
3. Update appointment availability queries to exclude blocked dates
4. Detect conflicts with existing appointments
5. Flag conflicting appointments with `conflict_flag` in metadata

**Smart Codes**:
```typescript
HERA.SALON.LEAVE.REL.BLOCKS.V1          // Relationship type
HERA.SALON.APPT.DYN.CONFLICT_FLAG.V1    // Conflict flag
HERA.SALON.APPT.DYN.CONFLICT_REASON.V1  // Reason: 'LEAVE_OVERLAP'
```

### Phase 3: Advanced Policies

**Features**:
- Per-staff policy overrides via `POLICY_FOR` relationships
- Accrual-based entitlements (monthly accrual)
- Probation period enforcement
- Carryover limits and expiration
- Public holiday calendar management

### Phase 4: Reporting RPC

**Objective**: Runtime aggregation without views/MVs

**RPC**: `hera_leave_report_runtime_v1`

**Input**:
```typescript
{
  organization_id: string
  year?: number              // Default: current year
  staff_ids?: string[]       // Filter by staff
  branch_ids?: string[]      // Filter by branch
  leave_types?: string[]     // Filter by type
  status?: string[]          // Filter by status
}
```

**Output**:
```typescript
{
  staff: [{
    staff_id: string
    staff_name: string
    year: number
    allowance_days: number
    days_used: number
    days_pending: number
    days_remaining: number
    requests: [{
      id: string
      type: string
      start_date: string
      end_date: string
      days: number
      status: string
      conflicts: number
    }]
  }]
}
```

### Phase 5: AI Insights

**Features**:
- Leave pattern analysis
- Peak period detection
- Coverage risk alerts
- Approval recommendations
- Anomaly detection

**Smart Codes**:
```typescript
HERA.SALON.LEAVE.AI.PATTERN.V1        // Pattern analysis
HERA.SALON.LEAVE.AI.COVERAGE.V1       // Coverage risk
HERA.SALON.LEAVE.AI.ANOMALY.V1        // Anomaly detection
```

---

## 📚 Related Documentation

- [HERA Sacred Six Schema](/docs/schema/hera-sacred-six-schema.yaml)
- [HERA Smart Code Guide](/docs/playbooks/_shared/SMART_CODE_GUIDE.md)
- [Universal API v2 Patterns](/docs/dna/UNIVERSAL-API-V2-RPC-PATTERNS.md)
- [Salon Luxe Design System](/lib/constants/salon-luxe-colors.ts)
- [Multi-Tenant Auth Architecture](/docs/HERA-AUTHORIZATION-ARCHITECTURE.md)

---

## ✅ Compliance Checklist

- [x] **Sacred Six Only**: No schema changes, all data in 6 core tables
- [x] **Smart Codes**: All entities/transactions have valid smart codes
- [x] **Organization Isolation**: All queries filtered by organization_id
- [x] **Audit Trail**: Complete audit via universal_transactions
- [x] **UPPERCASE Types**: entity_type, transaction_type, smart codes
- [x] **Metadata Policy**: Business data NOT in metadata (using transactions)
- [x] **Universal API v2**: All CRUD via /api/v2/* endpoints
- [x] **SalonLuxe Theme**: All UI components follow design system
- [x] **Actor Accountability**: All mutations tracked by user ID
- [x] **RLS Enabled**: Row-level security enforced everywhere

---

## 🎓 Key Learnings

### What Works Well

1. **Transaction-based Leave Requests**: Using `universal_transactions` provides automatic audit trail and versioning
2. **Status in transaction_status**: Simpler than relationship-based workflows
3. **In-memory Balance Calculation**: No extra API calls, instant updates
4. **SalonLuxeModal**: Consistent, beautiful modal experience
5. **React Query**: Automatic caching and invalidation

### What to Avoid

1. ❌ **Don't use relationships for status**: Use `transaction_status` field instead
2. ❌ **Don't create views/MVs**: Calculate at runtime or in-memory
3. ❌ **Don't bypass organization_id**: Always filter by organization
4. ❌ **Don't store business data in metadata**: Use dynamic data or transactions
5. ❌ **Don't assume schema**: Always check actual field names

### HERA Patterns Applied

✅ **Universal Entity Pattern**: Policies as entities
✅ **Universal Transaction Pattern**: Leave requests as transactions
✅ **Dynamic Data Pattern**: Policy attributes in metadata
✅ **Smart Code Pattern**: 6-segment uppercase codes
✅ **Status Workflow Pattern**: Direct field instead of relationships
✅ **Audit Pattern**: Complete change history via transactions
✅ **Multi-Tenant Pattern**: Organization isolation everywhere

---

**Last Updated**: 2025-01-16
**Maintained By**: HERA Engineering Team
**Status**: ✅ Production Ready
