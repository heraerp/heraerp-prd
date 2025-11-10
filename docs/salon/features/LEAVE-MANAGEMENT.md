# HERA Salon - Leave Management Feature Guide

**Version**: 1.0 (Production Ready)
**Last Updated**: 2025-01-07
**Smart Code**: `HERA.DOCS.SALON.FEATURES.LEAVE.v1`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Components](#components)
5. [Hooks](#hooks)
6. [Status Workflow](#status-workflow)
7. [Leave Balance Calculation](#leave-balance-calculation)
8. [UI Patterns](#ui-patterns)
9. [API Integration](#api-integration)
10. [Common Tasks](#common-tasks)
11. [Testing](#testing)
12. [Known Issues](#known-issues)

---

## 🎯 Overview

The Leave Management feature provides comprehensive leave request submission, approval workflows, policy management, and leave balance tracking for salon staff.

### Key Features

- **Leave Request Workflow** - Draft → Submit → Approve/Reject with full audit trail
- **Leave Policies** - Configurable policies by type (Annual, Sick, Unpaid, Other)
- **Leave Balances** - Real-time calculation with prorated entitlements
- **Calendar Visualization** - Visual leave calendar for approved requests
- **Approval Management** - Manager/owner approval with notes
- **Excel Reporting** - Detailed leave reports with approver information
- **Half-Day Support** - Full-day and half-day leave requests (0.5 days)
- **Smart Delete** - Automatic archive fallback for referenced policies

### Success Metrics

- ✅ **4 Leave Statuses**: draft, submitted, approved, rejected, cancelled
- ✅ **4 Leave Types**: Annual, Sick, Unpaid, Other
- ✅ **Prorated Entitlements**: IMMEDIATE and MONTHLY accrual methods
- ✅ **Transaction-Based**: Leave requests stored in `universal_transactions`
- ✅ **Entity-Based Policies**: Leave policies stored in `core_entities`
- ✅ **Real-Time Balances**: Client-side calculation from staff, policies, and requests

**File Path**: `/src/app/salon/leave/page.tsx:99-986`

---

## 🏗️ Architecture

### High-Level Flow

```
┌─────────────────────┐
│   Leave Request     │
│   (Staff Action)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  universal_         │◄───── useHeraLeave hook
│  transactions       │       (useUniversalTransactionV1)
│  (transaction_type: │
│   'LEAVE')          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Status Workflow    │
│  draft → submitted  │
│  → approved/rejected│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Leave Balance      │
│  Calculation        │
│  (Client-Side)      │
└─────────────────────┘
```

### Technology Stack

- **Next.js 15.4.2** - App Router with Server Components
- **React 19.1.0** - Client components for interactivity
- **React Query** - Server state management with smart caching
- **HERA DNA** - Universal Transaction V1 + Entity V1
- **Luxe Design System** - Mobile-first responsive design

**Architecture Decision**: Leave requests are **transactions**, not entities. This provides automatic audit trail, workflow support, and prevents accidental deletion of historical leave data.

---

## 🗄️ Data Model

### Leave Request (Transaction)

```typescript
// Stored in: universal_transactions
export interface LeaveRequest {
  id: string                      // Transaction ID
  transaction_code: string        // LEAVE-2025-ABC123
  transaction_date: string        // Submission date
  staff_id: string                // source_entity_id (who is taking leave)
  staff_name: string              // Enriched from staff entity
  manager_id: string              // target_entity_id (who approves)
  manager_name: string            // Enriched from staff entity
  leave_type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
  start_date: string              // Leave start date
  end_date: string                // Leave end date
  total_days: number              // Duration (supports 0.5 for half-day)
  isHalfDay?: boolean             // Half-day leave flag
  halfDayPeriod?: 'morning' | 'afternoon'  // Which half
  reason: string                  // Leave reason
  notes?: string                  // Additional notes
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'
  submitted_at: string            // When submitted
  approved_at?: string            // When approved
  approved_by?: string            // Approver user ID
  approved_by_name?: string       // Approver name (stored for reports)
  approval_notes?: string         // Approval comments
  rejected_at?: string            // When rejected
  rejected_by?: string            // Rejector user ID
  rejected_by_name?: string       // Rejector name (stored for reports)
  rejection_reason?: string       // Rejection reason
  smart_code: string              // HERA.SALON.HR.LEAVE.{TYPE}.v1
}

// Transaction Metadata (stored in metadata field)
{
  leave_type: 'ANNUAL',
  start_date: '2025-06-01',
  end_date: '2025-06-05',
  total_days: 5,
  isHalfDay: false,
  halfDayPeriod: null,
  reason: 'Family vacation',
  notes: 'Will be unreachable',
  submitted_at: '2025-05-01T10:00:00Z',
  approved_at: '2025-05-01T15:00:00Z',
  approved_by: 'user-uuid',
  approved_by_name: 'John Manager', // ✅ Stored for reports
  approval_notes: 'Approved'
}
```

**File Path**: `/src/hooks/useHeraLeave.ts:24-51`

### Leave Policy (Entity)

```typescript
// Stored in: core_entities (entity_type: 'LEAVE_POLICY')
export interface LeavePolicy {
  id: string                      // Entity ID
  entity_name: string             // Policy name (e.g., "Annual Leave Policy 2025")
  leave_type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
  annual_entitlement: number      // Days per year (e.g., 30)
  carry_over_cap: number          // Max carry-over days (e.g., 5)
  min_notice_days: number         // Minimum notice required (e.g., 7)
  max_consecutive_days: number    // Max consecutive days (e.g., 15)
  min_leave_days: number          // Minimum leave duration (e.g., 0.5)
  accrual_method: 'IMMEDIATE' | 'MONTHLY'  // Entitlement accrual
  probation_period_months: number // Probation period (e.g., 3)
  applies_to: 'FULL_TIME' | 'PART_TIME' | 'ALL'  // Staff category
  effective_from: string          // Policy start date
  effective_to?: string           // Policy end date
  description?: string            // Policy description
  active: boolean                 // Active status (entity.status)
}

// Dynamic Fields (stored in core_dynamic_data)
{
  leave_type: { value: 'ANNUAL', type: 'text', smart_code: 'HERA.SALON.LEAVE.FIELD.TYPE.v1' },
  annual_entitlement: { value: '30', type: 'number', smart_code: 'HERA.SALON.LEAVE.FIELD.ENTITLEMENT.v1' },
  carry_over_cap: { value: '5', type: 'number', smart_code: 'HERA.SALON.LEAVE.FIELD.CARRYOVER.v1' },
  min_notice_days: { value: '7', type: 'number', smart_code: 'HERA.SALON.LEAVE.FIELD.NOTICE.v1' },
  max_consecutive_days: { value: '15', type: 'number', smart_code: 'HERA.SALON.LEAVE.FIELD.MAXDAYS.v1' },
  min_leave_days: { value: '0.5', type: 'number', smart_code: 'HERA.SALON.LEAVE.FIELD.MINDAYS.v1' },
  accrual_method: { value: 'IMMEDIATE', type: 'text', smart_code: 'HERA.SALON.LEAVE.FIELD.ACCRUAL.v1' },
  probation_period_months: { value: '3', type: 'number', smart_code: 'HERA.SALON.LEAVE.FIELD.PROBATION.v1' },
  applies_to: { value: 'ALL', type: 'text', smart_code: 'HERA.SALON.LEAVE.FIELD.APPLIES.v1' },
  effective_from: { value: '2025-01-01', type: 'date', smart_code: 'HERA.SALON.LEAVE.FIELD.EFFECTIVEFROM.v1' },
  description: { value: 'Standard policy', type: 'text', smart_code: 'HERA.SALON.LEAVE.FIELD.DESCRIPTION.v1' }
}
```

**File Path**: `/src/hooks/useHeraLeave.ts:53-69`

### Leave Balance (Calculated)

```typescript
// Calculated in-memory (NOT stored in database)
export interface LeaveBalance {
  staff_id: string
  staff_name: string
  policy_id: string
  policy_name: string
  entitlement: number             // Prorated entitlement for current year
  carry_over: number              // Carry-over from previous year (TODO)
  total_allocation: number        // entitlement + carry_over
  used_days: number               // Sum of approved leave requests
  pending_days: number            // Sum of submitted leave requests
  remaining_days: number          // total_allocation - used_days
  available_days: number          // remaining_days - pending_days
  hire_date: string               // Staff hire date
  months_worked: number           // Months worked this year
  annual_entitlement: number      // Full annual entitlement from policy
  accrual_method: string          // IMMEDIATE or MONTHLY
}

// Calculation Logic
const entitlement = calculateProratedEntitlement(
  hireDate,              // '2024-06-01'
  currentYear,           // 2025
  annualEntitlement,     // 30 days
  accrualMethod          // 'MONTHLY'
)
// Result: 20 days (hired in June = 7 months worked × 2.5 days/month)
```

**File Path**: `/src/hooks/useHeraLeave.ts:71-87`

---

## 🧩 Components

### Page Component

**`/src/app/salon/leave/page.tsx`** (987 lines)

Main page orchestrating the entire leave management system.

**Key Sections**:
- **KPI Cards** (4 cards): Total Requests, Pending, Approved, Upcoming (next 7 days)
- **Tabs** (4 tabs): Requests, Calendar, Report, Policies
- **Modals** (2 modals): LeaveModal (request CRUD), PolicyModal (policy CRUD)
- **Alert Dialogs** (2 dialogs): Delete request, Delete policy confirmations

**File Path**: `/src/app/salon/leave/page.tsx:99-986`

### Tab Components

**LeaveRequestsTab** - Request listing with status filters

```tsx
<LeaveRequestsTab
  requests={requests || []}
  staff={staff || []}
  isLoading={isLoading}
  onApprove={handleApprove}
  onReject={handleReject}
  onCancel={cancelRequest}
  onEdit={handleEditRequest}      // ✅ Edit draft/submitted
  onDelete={handleDeleteRequest}   // ✅ Delete draft/rejected/cancelled
  onWithdraw={handleWithdrawRequest} // ✅ Withdraw submitted/approved
/>
```

**Features**:
- **Mobile Cards**: Collapsible cards with expandable details
- **Desktop Table**: Sortable table with inline actions
- **Status Filtering**: All, Draft, Submitted, Approved, Rejected, Cancelled
- **Search**: By staff name, transaction code, or leave type
- **CRUD Actions Menu**: Edit, Withdraw, Delete (context-aware)

**File Path**: `/src/app/salon/leave/LeaveRequestsTab.tsx:1-816`

**LeaveCalendarTab** - Visual calendar of approved leave

```tsx
<LeaveCalendarTab
  requests={requests?.filter(r => r.status === 'approved') || []}
  staff={staff || []}
  branchId={selectedBranch}
/>
```

**Features**:
- **Monthly Calendar View**: Shows approved leave overlays
- **Staff Filtering**: Filter by specific staff member
- **Color-Coded Types**: Annual (plum), Sick (rose), Unpaid (bronze), Other (gray)
- **Hover Details**: Staff name, leave type, duration

**File Path**: `/src/app/salon/leave/LeaveCalendarTab.tsx`

**LeaveReportTab** - Detailed leave balance report

```tsx
<LeaveReportTab
  staff={staff || []}
  balances={balances || {}}
  requests={requests || []}
  users={users || []}  // ✅ For approver name resolution (backward compatibility)
  branchId={selectedBranch}
/>
```

**Features**:
- **Staff Balance Table**: Entitlement, Used, Pending, Remaining, Available
- **Excel Export**: Professional Excel report with styling
- **Prorated Calculations**: Respects hire date and accrual method
- **Approver Names**: Stored in metadata (eliminates USER entity lookup)

**File Path**: `/src/app/salon/leave/LeaveReportTab.tsx`

**LeavePoliciesTab** - Policy management

```tsx
<LeavePoliciesTab
  policies={policies || []}
  isLoading={isLoading}
  onAdd={() => setPolicyModalOpen(true)}
  onEdit={handleEditPolicy}
  onArchive={handleArchivePolicy}
  onRestore={handleRestorePolicy}
  onDelete={handleDeletePolicy}
  filters={policyFilters}
  onFiltersChange={setPolicyFilters}
/>
```

**Features**:
- **Policy Cards**: Policy details with action buttons
- **Client-Side Filtering**: Leave type, Active/Archived/All
- **CRUD Operations**: Create, Edit, Archive, Restore, Delete
- **Smart Delete**: Automatic archive fallback if referenced

**File Path**: `/src/app/salon/leave/LeavePoliciesTab.tsx`

### Modal Components

**LeaveModal** - Create/Edit leave request

```tsx
<LeaveModal
  open={modalOpen}
  onOpenChange={(open) => {
    setModalOpen(open)
    if (!open) setSelectedRequest(null)
  }}
  onSubmit={selectedRequest ? handleUpdateRequest : handleCreateRequest}
  staff={staff || []}
  policies={policies || []}
  balances={balances || {}}
  isLoading={selectedRequest ? isUpdatingRequest : isCreating}
  initialData={selectedRequest}  // ✅ For edit mode
/>
```

**Features**:
- **Create Mode**: Empty form for new request
- **Edit Mode**: Pre-filled form with existing request data
- **Validation**: Real-time validation against policy rules
- **Balance Check**: Shows available days and warns if insufficient
- **Half-Day Support**: Toggle for half-day leave with morning/afternoon selection
- **Smart Defaults**: Auto-selects policy based on leave type

**File Path**: `/src/app/salon/leave/LeaveModal.tsx`

**PolicyModal** - Create/Edit leave policy

```tsx
<PolicyModal
  open={policyModalOpen}
  onOpenChange={(open) => {
    setPolicyModalOpen(open)
    if (!open) setSelectedPolicy(null)
  }}
  onSubmit={selectedPolicy ? handleUpdatePolicy : handleCreatePolicy}
  initialData={selectedPolicy}
  isLoading={selectedPolicy ? isUpdatingPolicy : isCreatingPolicy}
/>
```

**Features**:
- **Policy Configuration**: All policy fields with validation
- **Accrual Method**: IMMEDIATE vs MONTHLY selection
- **Date Ranges**: Effective from/to date pickers
- **Preview**: Real-time preview of policy rules

**File Path**: `/src/app/salon/leave/PolicyModal.tsx`

---

## 🪝 Hooks

### useHeraLeave

**File**: `/src/hooks/useHeraLeave.ts` (1,164 lines)

**Purpose**: Enterprise-grade leave management with RPC-first architecture

**Key Features**:
- **useUniversalTransactionV1**: RPC-based transaction fetching (leave requests)
- **useUniversalEntityV1**: RPC-based entity fetching (policies, staff)
- **Client-Side Balances**: Real-time calculation from requests and policies
- **Smart Caching**: 30-second staleTime for policies/staff (change infrequently)
- **Prorated Entitlements**: IMMEDIATE and MONTHLY accrual methods

**Usage**:

```typescript
const {
  // Data
  requests,        // LeaveRequest[] - All leave requests
  policies,        // LeavePolicy[] - All leave policies (filtered client-side)
  staff,           // Staff[] - All active staff members
  balances,        // Record<staffId, LeaveBalance> - Calculated balances

  // Loading States
  isLoading,               // Initial data loading
  isCreating,              // Creating new request
  isUpdatingRequest,       // Updating existing request
  isDeletingRequest,       // Deleting request
  isCreatingPolicy,        // Creating new policy
  isUpdatingPolicy,        // Updating existing policy
  isArchivingPolicy,       // Archiving policy
  isRestoringPolicy,       // Restoring archived policy
  isDeletingPolicy,        // Deleting policy

  // Leave Request Actions
  createRequest,           // (data) => Promise - Create leave request
  updateRequest,           // ({ requestId, data }) => Promise - Edit request
  deleteRequest,           // (requestId) => Promise - Delete request
  approveRequest,          // (requestId, notes?) => Promise - Approve
  rejectRequest,           // (requestId, reason?) => Promise - Reject
  cancelRequest,           // (requestId) => Promise - Cancel
  withdrawRequest,         // (requestId) => Promise - Withdraw (alias for cancel)

  // Leave Policy Actions
  createPolicy,            // (data) => Promise - Create policy
  updatePolicy,            // ({ id, data }) => Promise - Update policy
  archivePolicy,           // (id) => Promise - Archive policy
  restorePolicy,           // (id) => Promise - Restore policy
  deletePolicy,            // (id) => Promise - Delete with auto-archive fallback

  // Utilities
  calculateDays            // (start, end) => number - Calculate days between dates
} = useHeraLeave({
  organizationId: 'org-uuid',
  branchId: 'branch-uuid',      // Optional branch filter
  year: 2025,                   // Year for balance calculations
  includeArchived: true         // Include archived policies
})
```

**File Path**: `/src/hooks/useHeraLeave.ts:194-1163`

### Key Functions

**calculateProratedEntitlement** - Prorated entitlement calculation

```typescript
function calculateProratedEntitlement(
  hireDate: string | undefined,     // '2024-06-01'
  currentYear: number,              // 2025
  annualEntitlement: number,        // 30 days
  accrualMethod: 'IMMEDIATE' | 'MONTHLY' = 'MONTHLY'
): number {
  // If IMMEDIATE, return full entitlement
  if (accrualMethod === 'IMMEDIATE') {
    return annualEntitlement
  }

  // MONTHLY accrual
  const MONTHLY_ACCRUAL = annualEntitlement / 12  // 2.5 days/month

  // Calculate months worked this year
  const hire = new Date(hireDate)
  const hireYear = hire.getFullYear()
  const hireMonth = hire.getMonth()

  if (hireYear > currentYear) return 0  // Not hired yet
  if (hireYear < currentYear) return annualEntitlement  // Full year

  // Hired this year
  const currentMonth = new Date().getMonth()
  const monthsWorked = Math.max(0, currentMonth - hireMonth + 1)

  return Math.round(monthsWorked * MONTHLY_ACCRUAL * 10) / 10
}

// Example: Hired June 1, 2024 (Month 5, 0-indexed)
// Current: January 2025 (Month 0)
// Months worked: 0 - 5 + 1 = -4 (clamped to 0)
// Result: 0 days (new year, accrual starts from Jan 1)

// Example: Hired June 1, 2025 (Month 5, 0-indexed)
// Current: December 2025 (Month 11)
// Months worked: 11 - 5 + 1 = 7 months
// Result: 7 × 2.5 = 17.5 days
```

**File Path**: `/src/hooks/useHeraLeave.ts:154-188`

**generateTransactionCode** - Generate leave request code

```typescript
function generateTransactionCode(year: number): string {
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `LEAVE-${year}-${randomId}`
}

// Example: LEAVE-2025-A3K9X2
```

**File Path**: `/src/hooks/useHeraLeave.ts:128-131`

**calculateDays** - Calculate total days between dates

```typescript
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1  // Include both start and end date
}

// Example: calculateDays('2025-06-01', '2025-06-05')
// Result: 5 days (June 1, 2, 3, 4, 5)

// Example: calculateDays('2025-06-01', '2025-06-01')
// Result: 1 day (single day)
```

**File Path**: `/src/hooks/useHeraLeave.ts:117-123`

---

## 🔄 Status Workflow

### Leave Request Lifecycle

```
┌──────────┐
│  draft   │ ──────────┐
└────┬─────┘           │
     │                 │
     │ Submit          │ Edit Draft
     ▼                 │
┌──────────┐           │
│submitted │ ◄─────────┘
└────┬─────┘
     │
     ├─── Approve ──► ┌──────────┐
     │                │ approved │
     │                └────┬─────┘
     │                     │
     │                     │ Withdraw (cancel)
     │                     ▼
     │                ┌──────────┐
     │                │cancelled │
     │                └──────────┘
     │
     └─── Reject ───► ┌──────────┐
                      │ rejected │
                      └──────────┘
```

### Status Transitions

| From       | To           | Action        | Who Can Perform      | Notes                          |
|------------|--------------|---------------|----------------------|--------------------------------|
| draft      | submitted    | Submit        | Request Creator      | Sends for approval             |
| draft      | deleted      | Delete        | Request Creator      | Permanent deletion             |
| submitted  | approved     | Approve       | Manager/Owner        | Stores approver name           |
| submitted  | rejected     | Reject        | Manager/Owner        | Stores rejection reason        |
| submitted  | cancelled    | Withdraw      | Request Creator      | Before approval                |
| submitted  | draft        | Edit          | Request Creator      | Make changes before approval   |
| approved   | cancelled    | Withdraw      | Request Creator      | After approval (rare)          |
| rejected   | deleted      | Delete        | Request Creator/Admin| Clean up rejected requests     |
| cancelled  | deleted      | Delete        | Request Creator/Admin| Clean up cancelled requests    |

### Status-Based Actions

**Draft Requests**:
- ✅ **Edit** - Modify request details
- ✅ **Delete** - Permanent deletion (no audit trail needed)
- ✅ **Submit** - Send for approval

**Submitted Requests**:
- ✅ **Approve** (Manager/Owner) - Approve with optional notes
- ✅ **Reject** (Manager/Owner) - Reject with reason
- ✅ **Withdraw** (Creator) - Cancel before approval
- ✅ **Edit** (Creator) - Make changes before approval

**Approved Requests**:
- ✅ **Withdraw** (Creator) - Cancel approved leave (rare, requires reason)
- ❌ **Edit** - Not allowed (create new request instead)
- ❌ **Delete** - Not allowed (audit trail required)

**Rejected/Cancelled Requests**:
- ✅ **Delete** - Clean up old requests
- ❌ **Edit** - Not allowed (create new request instead)

**File Path**: `/src/app/salon/leave/LeaveRequestsTab.tsx:233-280`

---

## 🧮 Leave Balance Calculation

### Calculation Logic

Leave balances are calculated **client-side in real-time** from three data sources:

1. **Staff Data** - Hire date, role, employment status
2. **Leave Policies** - Annual entitlement, accrual method
3. **Leave Requests** - Approved and pending requests

**Formula**:

```typescript
// 1. Get prorated entitlement for current year
const entitlement = calculateProratedEntitlement(
  hireDate,              // '2024-06-01'
  currentYear,           // 2025
  annualEntitlement,     // 30 days (from policy)
  accrualMethod          // 'MONTHLY' (from policy)
)

// 2. Calculate used days (approved requests)
const usedDays = requests
  .filter(r => r.staff_id === staffId && r.status === 'approved')
  .reduce((sum, r) => sum + r.total_days, 0)

// 3. Calculate pending days (submitted requests)
const pendingDays = requests
  .filter(r => r.staff_id === staffId && r.status === 'submitted')
  .reduce((sum, r) => sum + r.total_days, 0)

// 4. Calculate carry-over (TODO: not yet implemented)
const carryOver = 0

// 5. Calculate totals
const totalAllocation = entitlement + carryOver
const remainingDays = totalAllocation - usedDays
const availableDays = remainingDays - pendingDays

// Result
{
  entitlement: 30,        // Full entitlement for this year
  carry_over: 0,          // Carry-over from last year
  total_allocation: 30,   // Total available
  used_days: 10,          // Already taken
  pending_days: 5,        // Awaiting approval
  remaining_days: 20,     // Not yet taken
  available_days: 15      // Can request now
}
```

**File Path**: `/src/hooks/useHeraLeave.ts:424-490`

### Accrual Methods

**IMMEDIATE** - Full entitlement available immediately

```typescript
// Staff hired: June 1, 2025
// Annual entitlement: 30 days
// Accrual method: IMMEDIATE

// Result: 30 days available immediately on hire date
```

**MONTHLY** - Prorated based on months worked

```typescript
// Staff hired: June 1, 2025 (Month 5, 0-indexed)
// Annual entitlement: 30 days
// Accrual method: MONTHLY
// Current date: December 31, 2025 (Month 11)

// Calculation:
const MONTHLY_ACCRUAL = 30 / 12  // 2.5 days per month
const monthsWorked = 11 - 5 + 1  // 7 months (June-Dec)
const entitlement = 7 × 2.5 = 17.5 days

// Result: 17.5 days available (prorated for 7 months)
```

### Half-Day Leave Support

The system supports half-day leave requests with 0.5-day increments:

```typescript
// Full-day leave
{
  start_date: '2025-06-01',
  end_date: '2025-06-01',
  isHalfDay: false,
  total_days: 1.0
}

// Half-day leave (morning)
{
  start_date: '2025-06-01',
  end_date: '2025-06-01',
  isHalfDay: true,
  halfDayPeriod: 'morning',
  total_days: 0.5
}

// Half-day leave (afternoon)
{
  start_date: '2025-06-01',
  end_date: '2025-06-01',
  isHalfDay: true,
  halfDayPeriod: 'afternoon',
  total_days: 0.5
}

// Multi-day with half-day at end
{
  start_date: '2025-06-01',
  end_date: '2025-06-03',
  isHalfDay: true,
  halfDayPeriod: 'morning',  // June 3 is half-day morning
  total_days: 2.5  // June 1 (1.0) + June 2 (1.0) + June 3 (0.5)
}
```

**File Path**: `/src/hooks/useHeraLeave.ts:89-101`

---

## 🎨 UI Patterns

### Mobile-First Responsive Design

The leave management system follows HERA's mobile-first design principles:

**Mobile Experience (< 768px)**:
- **Premium Mobile Header**: iOS-style with notification badge
- **Collapsible Cards**: Expandable leave request cards with details
- **Bottom Spacing**: 20px spacing for comfortable mobile scrolling
- **Touch-Friendly Buttons**: 44px minimum touch targets
- **Vertical Action Buttons**: Full-width stacked buttons
- **CRUD Actions Menu**: Dropdown menu with context-aware actions

**Desktop Experience (≥ 768px)**:
- **Page Header**: Title + description + action buttons
- **Data-Dense Table**: Sortable table with inline actions
- **Horizontal Actions**: Inline action buttons with icons
- **Branch Filter Dropdown**: Desktop-only branch selector

### KPI Cards

```tsx
<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
  <SalonLuxeKPICard
    title="Total Requests"
    value={stats.totalRequests}
    icon={FileText}
    color={COLORS.gold}
    description="This year"
    animationDelay={0}
  />
  <SalonLuxeKPICard
    title="Pending"
    value={stats.pendingRequests}
    icon={Clock}
    color={COLORS.bronze}
    description="Awaiting approval"
    animationDelay={100}
  />
  <SalonLuxeKPICard
    title="Approved"
    value={stats.approvedRequests}
    icon={CheckCircle}
    color={COLORS.emerald}
    description="This month"
    animationDelay={200}
  />
  <SalonLuxeKPICard
    title="Upcoming"
    value={stats.upcomingLeave}
    icon={Calendar}
    color={COLORS.plum}
    description="Next 7 days"
    animationDelay={300}
  />
</div>
```

**File Path**: `/src/app/salon/leave/page.tsx:640-673`

### Premium Mobile Header

```tsx
<PremiumMobileHeader
  title="Leave"
  subtitle={`${stats.totalRequests} requests`}
  showNotifications
  notificationCount={stats.pendingRequests}  // Pending approval badge
  shrinkOnScroll
  rightAction={
    <button
      onClick={() => setModalOpen(true)}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-[#D4AF37] active:scale-90 transition-transform duration-200 shadow-lg"
      aria-label="New leave request"
    >
      <Plus className="w-5 h-5 text-black" strokeWidth={2.5} />
    </button>
  }
/>
```

**Features**:
- **iOS-Style Status Bar Spacer**: 44px spacer for notch
- **Notification Badge**: Shows pending approval count
- **Shrink on Scroll**: Compact header when scrolling
- **Floating Action Button**: Quick create button (gold color)

**File Path**: `/src/app/salon/leave/page.tsx:618-636`

### Status Badges

```tsx
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    draft: {
      label: 'Draft',
      icon: Edit2,
      color: COLORS.gold,
      bgColor: `${COLORS.gold}20`
    },
    submitted: {
      label: 'Submitted',
      icon: Clock,
      color: COLORS.bronze,
      bgColor: `${COLORS.bronze}20`
    },
    approved: {
      label: 'Approved',
      icon: CheckCircle,
      color: COLORS.emerald,
      bgColor: `${COLORS.emerald}20`
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      color: COLORS.rose,
      bgColor: `${COLORS.rose}20`
    },
    cancelled: {
      label: 'Cancelled',
      icon: Ban,
      color: '#666',
      bgColor: '#66666620'
    }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  const Icon = config.icon

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
      style={{ color: config.color, backgroundColor: config.bgColor }}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  )
}
```

**File Path**: `/src/app/salon/leave/LeaveRequestsTab.tsx:40-61`

### CRUD Actions Menu

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="w-8 h-8 rounded-lg flex items-center justify-center">
      <MoreVertical className="w-4 h-4" />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    {/* Edit - For draft and submitted requests */}
    {(request.status === 'draft' || request.status === 'submitted') && onEdit && (
      <DropdownMenuItem onClick={() => onEdit(request)}>
        <Edit2 className="w-4 h-4 mr-2" />
        Edit Request
      </DropdownMenuItem>
    )}

    {/* Withdraw - For submitted or approved requests (NOT drafts) */}
    {(request.status === 'submitted' || request.status === 'approved') && onWithdraw && (
      <DropdownMenuItem onClick={() => onWithdraw(request.id)}>
        <Ban className="w-4 h-4 mr-2" />
        Withdraw Request
      </DropdownMenuItem>
    )}

    {/* Delete - For drafts, rejected, and cancelled requests */}
    {(request.status === 'draft' || request.status === 'rejected' || request.status === 'cancelled') && onDelete && (
      <DropdownMenuItem onClick={() => onDelete(request.id)}>
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Request
      </DropdownMenuItem>
    )}
  </DropdownMenuContent>
</DropdownMenu>
```

**Features**:
- **Context-Aware Actions**: Only shows applicable actions for current status
- **Icon + Label**: Clear action labels with icons
- **Color Coding**: Delete actions in rose color
- **Graceful Fallback**: Shows "No actions" message if no actions available

**File Path**: `/src/app/salon/leave/LeaveRequestsTab.tsx:214-282`

---

## 🔌 API Integration

### Leave Request Operations

**Create Leave Request**:

```typescript
const createRequest = async (data: CreateLeaveRequestInput) => {
  const totalDays = data.totalDays ?? calculateDays(data.start_date, data.end_date)
  const transactionCode = generateTransactionCode(year)

  const result = await createTransaction({
    transaction_type: 'LEAVE',
    transaction_code: transactionCode,
    smart_code: `HERA.SALON.HR.LEAVE.${data.leave_type}.v1`,
    transaction_date: new Date().toISOString(),
    source_entity_id: data.staff_id,      // Who is taking leave
    target_entity_id: data.manager_id,    // Manager approving
    total_amount: totalDays,              // Supports 0.5 for half-day
    transaction_status: data.status || 'submitted',
    metadata: {
      leave_type: data.leave_type,
      start_date: data.start_date,
      end_date: data.end_date,
      total_days: totalDays,
      isHalfDay: data.isHalfDay || false,
      halfDayPeriod: data.halfDayPeriod || null,
      reason: data.reason,
      notes: data.notes,
      submitted_at: new Date().toISOString()
    },
    lines: [
      {
        line_number: 1,
        line_type: 'LEAVE',
        description: `${data.leave_type} Leave: ${totalDays} day${totalDays !== 1 ? 's' : ''}`,
        quantity: totalDays,
        unit_amount: 1,
        line_amount: totalDays,
        smart_code: `HERA.SALON.HR.LINE.${data.leave_type}.v1`
      }
    ]
  })

  return result
}
```

**File Path**: `/src/hooks/useHeraLeave.ts:908-954`

**Update Leave Request**:

```typescript
const updateRequest = async ({ requestId, data }: {
  requestId: string
  data: Partial<CreateLeaveRequestInput>
}) => {
  const existingRequest = requests.find(r => r.id === requestId)
  if (!existingRequest) throw new Error('Request not found')

  const startDate = data.start_date || existingRequest.start_date
  const endDate = data.end_date || existingRequest.end_date
  const totalDays = data.totalDays ?? calculateDays(startDate, endDate)

  const updatedMetadata = {
    leave_type: data.leave_type || existingRequest.leave_type,
    start_date: startDate,
    end_date: endDate,
    total_days: totalDays,
    isHalfDay: data.isHalfDay ?? false,
    halfDayPeriod: data.halfDayPeriod || null,
    reason: data.reason || existingRequest.reason,
    notes: data.notes !== undefined ? data.notes : existingRequest.notes,
    submitted_at: existingRequest.submitted_at
  }

  const result = await updateTransaction({
    transaction_id: requestId,
    smart_code: existingRequest.smart_code || 'HERA.SALON.HR.LEAVE.UPDATE.v1',
    source_entity_id: data.staff_id || existingRequest.staff_id,
    target_entity_id: data.manager_id || existingRequest.manager_id,
    total_amount: totalDays,
    transaction_status: data.status || existingRequest.status,
    metadata: updatedMetadata
  })

  return result
}
```

**File Path**: `/src/hooks/useHeraLeave.ts:1008-1058`

**Approve Leave Request**:

```typescript
const approveRequest = async (requestId: string, notes?: string) => {
  const existingRequest = requests.find(r => r.id === requestId)
  if (!existingRequest) throw new Error('Request not found')

  // ✅ MERGE with existing metadata (don't lose existing data)
  const updatedMetadata = {
    ...existingRequest.metadata,
    leave_type: existingRequest.leave_type,
    start_date: existingRequest.start_date,
    end_date: existingRequest.end_date,
    total_days: existingRequest.total_days,
    reason: existingRequest.reason,
    notes: existingRequest.notes,
    submitted_at: existingRequest.submitted_at,
    approved_at: new Date().toISOString(),
    approval_notes: notes,
    approved_by: user?.id,
    // ✅ Store approver name for reports (eliminates USER entity lookup)
    approved_by_name: user?.entity_name || user?.name || 'Unknown User'
  }

  const result = await updateTransaction({
    transaction_id: requestId,
    smart_code: existingRequest.smart_code || 'HERA.SALON.HR.LEAVE.UPDATE.v1',
    transaction_status: 'approved',
    metadata: updatedMetadata
  })

  return result
}
```

**File Path**: `/src/hooks/useHeraLeave.ts:956-1005`

### Leave Policy Operations

**Create Leave Policy**:

```typescript
const createPolicy = async (data: {
  policy_name: string
  leave_type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
  annual_entitlement: number
  accrual_method: 'IMMEDIATE' | 'MONTHLY'
  applies_to: 'FULL_TIME' | 'PART_TIME' | 'ALL'
  min_notice_days: number
  max_consecutive_days: number
  min_leave_days: number
  carry_over_cap?: number
  probation_period_months?: number
  effective_from?: string
  effective_to?: string
  description?: string
  active: boolean
}) => {
  const result = await callRPC('hera_entities_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: user.id,
    p_organization_id: organizationId,
    p_entity: {
      entity_type: 'LEAVE_POLICY',
      entity_name: data.policy_name,
      smart_code: `HERA.SALON.LEAVE.POLICY.${data.leave_type}.v1`,
      status: 'active'
    },
    p_dynamic: {
      leave_type: {
        value: data.leave_type,
        type: 'text',
        smart_code: 'HERA.SALON.LEAVE.FIELD.TYPE.v1'
      },
      annual_entitlement: {
        value: String(data.annual_entitlement),
        type: 'number',
        smart_code: 'HERA.SALON.LEAVE.FIELD.ENTITLEMENT.v1'
      },
      // ... more fields
    },
    p_relationships: {},
    p_options: {
      include_dynamic: true,
      include_relationships: false
    }
  })

  if (result.error) {
    throw new Error(result.error.message || 'Failed to create policy')
  }

  return result.data
}
```

**File Path**: `/src/hooks/useHeraLeave.ts:497-620`

**Smart Delete Policy** (Auto-Archive Fallback):

```typescript
const deletePolicy = async (id: string): Promise<{
  success: boolean
  archived: boolean
  message?: string
}> => {
  try {
    // Try hard delete first
    const result = await callRPC('hera_entities_crud_v1', {
      p_action: 'DELETE',
      p_actor_user_id: user.id,
      p_organization_id: organizationId,
      p_entity: { entity_id: id },
      p_options: {}
    })

    if (result.error) {
      // If delete fails due to foreign key constraint, archive instead
      if (result.error.message?.includes('foreign key') || result.error.message?.includes('referenced')) {
        await archivePolicy(id)
        return {
          success: true,
          archived: true,
          message: 'Policy is being used and has been archived instead of deleted'
        }
      }
      throw new Error(result.error.message || 'Failed to delete policy')
    }

    return { success: true, archived: false }
  } catch (error: any) {
    // Fallback to archive on any error
    if (error.message?.includes('foreign key') || error.message?.includes('referenced')) {
      await archivePolicy(id)
      return {
        success: true,
        archived: true,
        message: 'Policy is being used and has been archived instead of deleted'
      }
    }
    throw error
  }
}
```

**File Path**: `/src/hooks/useHeraLeave.ts:847-906`

---

## 📝 Common Tasks

### Task 1: Create Leave Request

```typescript
const { createRequest } = useHeraLeave({ organizationId })

await createRequest({
  staff_id: 'staff-uuid',
  manager_id: 'manager-uuid',
  leave_type: 'ANNUAL',
  start_date: '2025-06-01',
  end_date: '2025-06-05',
  reason: 'Family vacation',
  notes: 'Will be unreachable',
  status: 'submitted'  // or 'draft' for draft
})
```

### Task 2: Create Half-Day Leave Request

```typescript
await createRequest({
  staff_id: 'staff-uuid',
  manager_id: 'manager-uuid',
  leave_type: 'ANNUAL',
  start_date: '2025-06-01',
  end_date: '2025-06-01',
  reason: 'Doctor appointment',
  isHalfDay: true,               // ✅ Enable half-day
  halfDayPeriod: 'morning',      // ✅ morning or afternoon
  totalDays: 0.5,                // ✅ Pre-calculated (optional)
  status: 'submitted'
})
```

### Task 3: Approve Leave Request

```typescript
const { approveRequest } = useHeraLeave({ organizationId })

await approveRequest(
  'request-uuid',
  'Approved. Enjoy your vacation!'  // Optional approval notes
)
```

### Task 4: Create Leave Policy

```typescript
const { createPolicy } = useHeraLeave({ organizationId })

await createPolicy({
  policy_name: 'Annual Leave Policy 2025',
  leave_type: 'ANNUAL',
  annual_entitlement: 30,           // 30 days per year
  carry_over_cap: 5,                // Max 5 days carry-over
  min_notice_days: 7,               // 7 days advance notice
  max_consecutive_days: 15,         // Max 15 consecutive days
  min_leave_days: 0.5,              // Minimum 0.5 days (half-day)
  accrual_method: 'MONTHLY',        // Prorated monthly
  probation_period_months: 3,       // 3 months probation
  applies_to: 'ALL',                // All staff categories
  effective_from: '2025-01-01',
  description: 'Standard annual leave policy',
  active: true
})
```

### Task 5: Calculate Leave Balance for Staff

```typescript
const { balances } = useHeraLeave({ organizationId, year: 2025 })

// Get balance for specific staff member
const staffBalance = balances['staff-uuid']

console.log({
  entitlement: staffBalance.entitlement,      // 30 days
  used_days: staffBalance.used_days,          // 10 days
  pending_days: staffBalance.pending_days,    // 5 days
  remaining_days: staffBalance.remaining_days,// 20 days
  available_days: staffBalance.available_days // 15 days
})
```

### Task 6: Filter Leave Requests by Status

```typescript
const { requests } = useHeraLeave({ organizationId })

// Get all pending approval requests
const pendingRequests = requests.filter(r =>
  r.status === 'submitted'
)

// Get all approved requests for next 7 days
const upcomingLeave = requests.filter(r => {
  if (r.status !== 'approved') return false
  const startDate = new Date(r.start_date)
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return startDate >= now && startDate <= sevenDaysFromNow
})

// Get all draft requests for current user
const myDrafts = requests.filter(r =>
  r.status === 'draft' && r.staff_id === currentUserId
)
```

### Task 7: Export Leave Report to Excel

The leave report tab includes an Excel export feature:

```typescript
// Excel export includes:
// - Staff name
// - Policy name
// - Hire date
// - Months worked
// - Annual entitlement
// - Entitlement (prorated)
// - Used days
// - Pending days
// - Remaining days
// - Available days

// Export triggered by button in LeaveReportTab
// File format: HERA_Leave_Report_YYYY-MM-DD_HH-MM-SS.xlsx
```

### Task 8: Smart Delete Policy with Auto-Archive

```typescript
const { deletePolicy } = useHeraLeave({ organizationId })

const result = await deletePolicy('policy-uuid')

if (result.archived) {
  // Policy was archived instead of deleted (referenced by leave requests)
  showSuccess('Policy archived', result.message)
} else {
  // Policy was permanently deleted
  showSuccess('Policy deleted', 'Policy has been permanently deleted')
}
```

---

## 🧪 Testing

### Unit Tests

**Test Leave Balance Calculation**:

```typescript
describe('calculateProratedEntitlement', () => {
  test('IMMEDIATE accrual gives full entitlement', () => {
    const result = calculateProratedEntitlement(
      '2024-06-01',  // Hired mid-year
      2025,
      30,            // 30 days annual
      'IMMEDIATE'
    )
    expect(result).toBe(30)  // Full entitlement immediately
  })

  test('MONTHLY accrual prorates based on months worked', () => {
    const result = calculateProratedEntitlement(
      '2025-06-01',  // Hired June 1 (month 5, 0-indexed)
      2025,
      30,            // 30 days annual
      'MONTHLY'
    )
    // Assume current date is Dec 31, 2025 (month 11)
    // Months worked: 11 - 5 + 1 = 7 months
    // Entitlement: 7 × 2.5 = 17.5 days
    expect(result).toBe(17.5)
  })

  test('Staff hired in previous year gets full entitlement', () => {
    const result = calculateProratedEntitlement(
      '2024-01-01',  // Hired last year
      2025,
      30,
      'MONTHLY'
    )
    expect(result).toBe(30)  // Full year entitlement
  })
})
```

### Integration Tests

**Test Leave Request Workflow**:

```typescript
describe('Leave Request Workflow', () => {
  test('Create draft → Submit → Approve flow', async () => {
    const { createRequest, approveRequest, requests } = renderHook(() =>
      useHeraLeave({ organizationId: 'test-org' })
    ).result.current

    // Create draft
    await createRequest({
      staff_id: 'staff-1',
      manager_id: 'manager-1',
      leave_type: 'ANNUAL',
      start_date: '2025-06-01',
      end_date: '2025-06-05',
      reason: 'Test vacation',
      status: 'draft'
    })

    const draft = requests.find(r => r.status === 'draft')
    expect(draft).toBeDefined()
    expect(draft?.total_days).toBe(5)

    // Submit (change status to submitted)
    await updateRequest({
      requestId: draft.id,
      data: { status: 'submitted' }
    })

    const submitted = requests.find(r => r.id === draft.id)
    expect(submitted?.status).toBe('submitted')

    // Approve
    await approveRequest(draft.id, 'Approved')

    const approved = requests.find(r => r.id === draft.id)
    expect(approved?.status).toBe('approved')
    expect(approved?.approved_by_name).toBeDefined()
  })
})
```

### E2E Tests

**Test Leave Policy CRUD**:

```typescript
describe('Leave Policy Management', () => {
  test('Create → Edit → Archive → Restore → Delete policy', async () => {
    // Navigate to leave management
    await page.goto('/salon/leave')
    await page.click('[data-testid="policies-tab"]')

    // Create policy
    await page.click('[data-testid="configure-policy-btn"]')
    await page.fill('[name="policy_name"]', 'Test Policy')
    await page.selectOption('[name="leave_type"]', 'ANNUAL')
    await page.fill('[name="annual_entitlement"]', '30')
    await page.click('[data-testid="save-policy-btn"]')

    // Verify policy created
    await expect(page.locator('text=Test Policy')).toBeVisible()

    // Edit policy
    await page.click('[data-testid="edit-policy-btn"]')
    await page.fill('[name="annual_entitlement"]', '35')
    await page.click('[data-testid="save-policy-btn"]')

    // Verify policy updated
    await expect(page.locator('text=35 days')).toBeVisible()

    // Archive policy
    await page.click('[data-testid="archive-policy-btn"]')
    await expect(page.locator('text=archived')).toBeVisible()

    // Restore policy
    await page.click('[data-testid="restore-policy-btn"]')
    await expect(page.locator('text=active')).toBeVisible()

    // Delete policy (smart delete will archive if referenced)
    await page.click('[data-testid="delete-policy-btn"]')
    await page.click('[data-testid="confirm-delete-btn"]')
  })
})
```

---

## ⚠️ Known Issues

### Issue 1: RPC Transaction Type Filter Not Working

**Problem**: `hera_txn_crud_v1` RPC function's QUERY action ignores `transaction_type` filter in payload.

**Impact**: All transactions are returned, not just `LEAVE` transactions.

**Workaround**: Client-side filtering implemented in `useHeraLeave` hook:

```typescript
const activeTransactions = requestsData.items.filter((txn: any) =>
  !txn.deleted_at && txn.transaction_type === 'LEAVE'
)
```

**Status**: Documented workaround in place. RPC function fix pending.

**File Path**: `/src/hooks/useHeraLeave.ts:386-388`

---

### Issue 2: USER Entity RLS May Fail

**Problem**: Platform USER entities stored in Platform Organization (`00000000-0000-0000-0000-000000000000`) may not be accessible due to RLS policies in tenant context.

**Impact**: Approver name lookup from USER entities fails for backward compatibility with old leave requests.

**Solution**: Store approver names in transaction metadata at approval time:

```typescript
metadata: {
  approved_by: user?.id,
  approved_by_name: user?.entity_name || user?.name || 'Unknown User'  // ✅ Stored
}
```

**Status**: New approvals store names. Old approvals gracefully degrade to "Unknown User".

**File Path**: `/src/hooks/useHeraLeave.ts:981-982`

---

### Issue 3: Carry-Over Logic Not Implemented

**Problem**: Leave balance carry-over from previous year is not yet implemented.

**Impact**: `carry_over` field always shows 0 in leave balances.

**Workaround**: Manually adjust entitlements at year start if needed.

**Status**: TODO feature for future release.

**File Path**: `/src/hooks/useHeraLeave.ts:457`

---

## 📚 Additional Resources

### Related Features

- [STAFF.md](./STAFF.md) - Staff management with compliance tracking
- [APPOINTMENTS.md](./APPOINTMENTS.md) - Appointment scheduling (staff availability check)
- [DASHBOARD.md](./DASHBOARD.md) - Dashboard metrics (upcoming leave)

### Technical References

- [HOOKS.md](./HOOKS.md) - Custom hooks reference
- [DATA-MODELS.md](./DATA-MODELS.md) - Sacred Six schema
- [MOBILE-LAYOUT.md](./MOBILE-LAYOUT.md) - Mobile-first design patterns

### External Documentation

- [React Query Documentation](https://tanstack.com/query/latest)
- [HERA DNA Smart Codes](../../../docs/playbooks/_shared/SMART_CODE_GUIDE.md)
- [Universal API V2 Patterns](../../../docs/dna/UNIVERSAL-API-V2-RPC-PATTERNS.md)

---

<div align="center">

**Built with HERA DNA** | **Leave Management v1.0 (Production Ready)**

[← Back to Developer Guide](../DEVELOPER-GUIDE.md) | [Staff →](./STAFF.md)

**For Support**: Check [Known Issues](#known-issues) or contact HERA development team

</div>
