# Leave Management Implementation Plan

## 📊 Analysis Summary

### Current State
- **Old Page**: `/salon/leave` - Simple wrapper using `LeaveManagementDashboard` component
- **New Page**: `/salon/leave1` - Modern implementation with tabs, search, filters, and multiple views
- **Status**: New page is more feature-complete but missing the `useLeavePlaybook` hook

### Key Differences

| Feature | Old (/salon/leave) | New (/salon/leave1) |
|---------|-------------------|---------------------|
| **UI Style** | Basic PageLayout | Modern luxury salon theme |
| **Navigation** | Simple header | Sticky header with breadcrumbs |
| **Views** | Single dashboard | 4 tabs (Requests, Calendar, Report, Policies) |
| **Search** | Not available | Full-text search with keyboard shortcut (/) |
| **Filters** | Not available | Branch filter |
| **Actions** | Limited | Create request, Approve, Reject, Export |
| **Components** | LeaveManagementDashboard | Multiple specialized components |
| **Hook** | None | useLeavePlaybook (needs creation) |
| **Authorization** | Basic | Three-layer pattern |
| **Mobile** | Basic | Responsive with mobile-optimized buttons |

---

## 🎯 Implementation Plan

### Phase 1: Preparation & Backup ✅

#### Step 1.1: Backup Old Page
```bash
# Create backup of old leave page
cp -r /home/san/PRD/heraerp-prd/src/app/salon/leave \
      /home/san/PRD/heraerp-prd/src/app/salon/leave.backup
```

#### Step 1.2: Document Dependencies
- `LeaveManagementDashboard` component - May still be useful for simple view
- Check if any other pages reference `/salon/leave`

---

### Phase 2: Rename & Replace 🔄

#### Step 2.1: Remove Old Page
```bash
rm -rf /home/san/PRD/heraerp-prd/src/app/salon/leave
```

#### Step 2.2: Rename New Page
```bash
mv /home/san/PRD/heraerp-prd/src/app/salon/leave1 \
   /home/san/PRD/heraerp-prd/src/app/salon/leave
```

#### Step 2.3: Update Navigation References
Update `SalonRoleBasedDarkSidebar.tsx` (already references `/salon/leave1` - change to `/salon/leave`):
```typescript
// Line 116 in allApps array
{ title: 'Leave', href: '/salon/leave', icon: CalendarCheck },
```

---

### Phase 3: Create useLeavePlaybook Hook 🎣

**Location**: `/src/hooks/useLeavePlaybook.ts`

#### Core Functionality Required:

```typescript
interface UseLeavePlaybookOptions {
  branchId?: string
  query?: string
}

interface UseLeavePlaybookReturn {
  // Data
  requests: LeaveRequest[]
  balancesByStaff: Record<string, LeaveBalance>
  policies: LeavePolicy[]
  holidays: Holiday[]
  staff: StaffMember[]

  // States
  loading: boolean
  error: string | null

  // Actions
  createLeave: (data: CreateLeaveRequest) => Promise<void>
  approve: (requestId: string) => Promise<void>
  reject: (requestId: string, reason?: string) => Promise<void>
  exportAnnualReportCSV: (options: ExportOptions) => void
}
```

#### Data Sources (Universal API v2):

1. **Leave Requests** → `core_entities` with `entity_type = 'leave_request'`
   - Store in: `core_dynamic_data` fields:
     - `staff_id` (entity_id reference)
     - `leave_type` (annual, sick, unpaid, etc.)
     - `start_date`, `end_date`
     - `days_requested`
     - `status` (pending, approved, rejected)
     - `reason`
     - `approver_id`
     - `approved_date`

2. **Leave Policies** → `core_entities` with `entity_type = 'leave_policy'`
   - Store in: `metadata`:
     - `annual_entitlement` (e.g., 21 days)
     - `carry_over_cap` (e.g., 5 days)
     - `min_notice_days` (e.g., 7 days)
     - `blackout_dates`

3. **Staff** → `core_entities` with `entity_type = 'staff'`
   - Already exists - use existing staff data

4. **Leave Balances** → Calculate from:
   - Policy entitlements
   - Approved leave requests (current year)
   - Carry-over from previous year

5. **Holidays** → `core_entities` with `entity_type = 'public_holiday'`
   - Store in: `core_dynamic_data`:
     - `holiday_date`
     - `holiday_name`
     - `is_recurring` (annual)

---

### Phase 4: Universal API Integration 🔌

#### API Endpoints Needed:

```typescript
// 1. Fetch leave requests
const { data: requests } = await apiV2.get('entities', {
  entity_type: 'leave_request',
  organization_id: orgId,
  // Filter by branch via relationships
  relationship_filter: branchId ? `MEMBER_OF:${branchId}` : undefined
})

// 2. Create leave request
const { data: newRequest } = await apiV2.post('entities', {
  entity_type: 'leave_request',
  entity_name: `Leave Request - ${staffName} - ${startDate}`,
  smart_code: 'HERA.SALON.HR.LEAVE.REQUEST.V1',
  organization_id: orgId,
  dynamic_data: {
    staff_id: staffEntityId,
    leave_type: 'annual',
    start_date: '2025-01-15',
    end_date: '2025-01-20',
    days_requested: 5,
    status: 'pending',
    reason: 'Family vacation'
  }
})

// 3. Approve leave request
await apiV2.put('entities/dynamic-data', {
  entity_id: requestId,
  organization_id: orgId,
  fields: [
    { field_name: 'status', field_value: 'approved', field_type: 'text' },
    { field_name: 'approver_id', field_value: currentUserId, field_type: 'text' },
    { field_name: 'approved_date', field_value: new Date().toISOString(), field_type: 'text' }
  ]
})

// 4. Fetch staff with leave relationships
const { data: staff } = await apiV2.get('entities', {
  entity_type: 'staff',
  organization_id: orgId,
  status: 'active'
})
```

---

### Phase 5: Component Updates 🎨

#### Components That Need Updates:

1. **LeaveRequestList.tsx**
   - Update to use real data from hook
   - Add loading states
   - Add empty states
   - Implement approval/rejection flow

2. **LeaveRequestModal.tsx**
   - Connect to `createLeave` function
   - Add form validation
   - Calculate working days (exclude weekends & holidays)
   - Show leave balance preview

3. **LeaveCalendar.tsx**
   - Display approved leaves on calendar
   - Color-code by leave type
   - Show staff names on hover
   - Handle date range selection

4. **AnnualLeaveReport.tsx**
   - Calculate balances from data
   - Show entitlement, used, remaining
   - Export to CSV functionality
   - Filter by branch

5. **PolicyModal.tsx**
   - Create/edit leave policies
   - Form validation
   - Save to `core_entities`

---

### Phase 6: Data Model Implementation 📊

#### Entity Types to Create:

```typescript
// 1. Leave Request Entity
{
  id: 'uuid',
  entity_type: 'leave_request',
  entity_name: 'Annual Leave - Sarah Johnson - Jan 2025',
  entity_code: 'LR-2025-001',
  smart_code: 'HERA.SALON.HR.LEAVE.REQUEST.V1',
  organization_id: 'org-id',
  status: 'active',
  created_at: '2025-01-10T10:00:00Z',
  metadata: {
    metadata_category: 'hr_leave'
  }
}

// Dynamic Data for Leave Request
{
  entity_id: 'leave-request-id',
  fields: [
    { field_name: 'staff_id', field_type: 'text', field_value: 'staff-entity-id' },
    { field_name: 'leave_type', field_type: 'text', field_value: 'annual' },
    { field_name: 'start_date', field_type: 'text', field_value: '2025-01-15' },
    { field_name: 'end_date', field_type: 'text', field_value: '2025-01-20' },
    { field_name: 'days_requested', field_type: 'number', field_value: 5 },
    { field_name: 'working_days', field_type: 'number', field_value: 5 },
    { field_name: 'status', field_type: 'text', field_value: 'pending' },
    { field_name: 'reason', field_type: 'text', field_value: 'Family vacation' },
    { field_name: 'notes', field_type: 'text', field_value: '' },
    { field_name: 'approver_id', field_type: 'text', field_value: '' },
    { field_name: 'approved_date', field_type: 'text', field_value: '' },
    { field_name: 'rejection_reason', field_type: 'text', field_value: '' }
  ]
}

// 2. Leave Policy Entity
{
  id: 'uuid',
  entity_type: 'leave_policy',
  entity_name: 'Annual Leave Policy - Full Time',
  entity_code: 'POL-ANNUAL-FT',
  smart_code: 'HERA.SALON.HR.LEAVE.POLICY.V1',
  organization_id: 'org-id',
  status: 'active',
  metadata: {
    metadata_category: 'hr_policy',
    annual_entitlement: 21,
    carry_over_cap: 5,
    min_notice_days: 7,
    max_consecutive_days: 15,
    blackout_dates: ['2025-12-20:2025-12-31', '2025-06-01:2025-06-15']
  }
}

// 3. Public Holiday Entity
{
  id: 'uuid',
  entity_type: 'public_holiday',
  entity_name: 'New Year\'s Day 2025',
  entity_code: 'HOL-2025-001',
  smart_code: 'HERA.SALON.HR.HOLIDAY.V1',
  organization_id: 'org-id',
  status: 'active'
}

// Dynamic Data for Holiday
{
  entity_id: 'holiday-id',
  fields: [
    { field_name: 'holiday_date', field_type: 'text', field_value: '2025-01-01' },
    { field_name: 'is_recurring', field_type: 'boolean', field_value: true },
    { field_name: 'country', field_type: 'text', field_value: 'UAE' }
  ]
}
```

---

### Phase 7: Business Logic 🧮

#### Leave Balance Calculation:

```typescript
function calculateLeaveBalance(
  staffId: string,
  policy: LeavePolicy,
  requests: LeaveRequest[],
  year: number
): LeaveBalance {
  // 1. Get annual entitlement from policy
  const entitlement = policy.metadata.annual_entitlement || 21

  // 2. Get carry-over from previous year (if any)
  const carryOver = 0 // TODO: Get from previous year's balance

  // 3. Calculate total allocation
  const totalAllocation = entitlement + carryOver

  // 4. Calculate used days (approved requests only)
  const approvedRequests = requests.filter(
    r => r.staff_id === staffId &&
         r.status === 'approved' &&
         new Date(r.start_date).getFullYear() === year
  )

  const usedDays = approvedRequests.reduce(
    (sum, r) => sum + (r.working_days || r.days_requested || 0),
    0
  )

  // 5. Calculate pending days
  const pendingRequests = requests.filter(
    r => r.staff_id === staffId &&
         r.status === 'pending' &&
         new Date(r.start_date).getFullYear() === year
  )

  const pendingDays = pendingRequests.reduce(
    (sum, r) => sum + (r.working_days || r.days_requested || 0),
    0
  )

  // 6. Calculate remaining
  const remaining = totalAllocation - usedDays
  const availableForBooking = remaining - pendingDays

  return {
    entitlement,
    carryOver,
    totalAllocation,
    usedDays,
    pendingDays,
    remaining,
    availableForBooking
  }
}
```

#### Working Days Calculation:

```typescript
function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  holidays: Holiday[]
): number {
  let workingDays = 0
  const current = new Date(startDate)

  while (current <= endDate) {
    // Skip weekends (Saturday = 6, Sunday = 0 in UAE context)
    const dayOfWeek = current.getDay()
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 // Friday & Saturday for UAE

    // Check if it's a public holiday
    const dateStr = current.toISOString().split('T')[0]
    const isHoliday = holidays.some(h => h.holiday_date === dateStr)

    if (!isWeekend && !isHoliday) {
      workingDays++
    }

    current.setDate(current.getDate() + 1)
  }

  return workingDays
}
```

---

### Phase 8: Testing Strategy 🧪

#### Test Cases:

1. **Leave Request Creation**
   - ✅ Create annual leave request
   - ✅ Calculate working days correctly
   - ✅ Validate against policy rules
   - ✅ Check leave balance before approval

2. **Approval Workflow**
   - ✅ Approve leave request
   - ✅ Update leave balance
   - ✅ Send notification (future)
   - ✅ Reject leave request with reason

3. **Leave Balance**
   - ✅ Calculate entitlement correctly
   - ✅ Track used days
   - ✅ Handle carry-over
   - ✅ Show pending requests

4. **Calendar View**
   - ✅ Display all approved leaves
   - ✅ Color-code by leave type
   - ✅ Show overlapping leaves
   - ✅ Export to CSV

5. **Policy Management**
   - ✅ Create leave policy
   - ✅ Edit policy settings
   - ✅ Apply policy to staff

---

### Phase 9: Migration Steps 🔄

#### Step-by-Step Execution:

1. **Backup** (2 minutes)
   ```bash
   cp -r src/app/salon/leave src/app/salon/leave.backup
   ```

2. **Remove Old** (1 minute)
   ```bash
   rm -rf src/app/salon/leave
   ```

3. **Rename** (1 minute)
   ```bash
   mv src/app/salon/leave1 src/app/salon/leave
   ```

4. **Create Hook** (30 minutes)
   - Create `/src/hooks/useLeavePlaybook.ts`
   - Implement all CRUD operations
   - Add error handling
   - Add loading states

5. **Update Components** (45 minutes)
   - Update LeaveRequestModal
   - Update LeaveRequestList
   - Update LeaveCalendar
   - Update AnnualLeaveReport

6. **Test** (30 minutes)
   - Create test leave requests
   - Approve/reject requests
   - Check calendar display
   - Export reports

7. **Update Navigation** (5 minutes)
   - Update sidebar references from `/salon/leave1` to `/salon/leave`
   - Update any other navigation links

---

## 🎨 UI/UX Enhancements

### Current Luxury Theme Features:
- ✅ Salon luxury colors (gold, champagne, charcoal)
- ✅ Gradient backgrounds
- ✅ Rounded corners and shadows
- ✅ Smooth transitions
- ✅ Mobile-responsive design

### Additional Enhancements to Add:

1. **Loading States**
   - Skeleton loaders for requests list
   - Shimmer effect while loading calendar
   - Inline loading for approval buttons

2. **Empty States**
   - No requests yet - Create your first request
   - No policies - Setup leave policies
   - No holidays - Add public holidays

3. **Success/Error Feedback**
   - Toast notifications for actions
   - Inline error messages
   - Success animations

4. **Keyboard Shortcuts**
   - `/` - Focus search
   - `Cmd/Ctrl + N` - New request
   - `Esc` - Close modals

5. **Filters & Sorting**
   - Filter by status (pending, approved, rejected)
   - Filter by leave type
   - Sort by date, staff name
   - Quick filters (My requests, Team requests)

---

## 🔒 Security Considerations

1. **Authorization Checks**
   - Only managers/owners can approve leaves
   - Staff can only see their own requests
   - Admin-only policy management

2. **Data Validation**
   - Start date < End date
   - Minimum notice period
   - Check leave balance before submission
   - Validate against blackout dates

3. **Audit Trail**
   - Log all leave requests
   - Track approval/rejection history
   - Record who approved/rejected

---

## 📝 Next Steps

### Immediate Actions (This Session):
1. ✅ Create implementation plan (Done)
2. 🔄 Backup old leave page
3. 🔄 Rename leave1 to leave
4. 🔄 Create useLeavePlaybook hook skeleton

### Follow-up Tasks:
1. Implement full useLeavePlaybook hook with API integration
2. Update all leave components with real data
3. Add comprehensive error handling
4. Implement leave balance calculation
5. Test end-to-end workflow
6. Add documentation for HR team

---

## 📊 Success Metrics

- ✅ All leave requests stored in universal tables
- ✅ Zero hardcoded data
- ✅ Full CRUD operations working
- ✅ Approval workflow functional
- ✅ Calendar view accurate
- ✅ Reports exportable
- ✅ Mobile-responsive
- ✅ No console errors
- ✅ Fast load times (<2s)

---

## 🎯 Estimated Timeline

| Phase | Time Estimate | Status |
|-------|--------------|--------|
| Backup & Rename | 5 minutes | Pending |
| Create Hook | 30 minutes | Pending |
| Update Components | 45 minutes | Pending |
| API Integration | 30 minutes | Pending |
| Testing | 30 minutes | Pending |
| Bug Fixes | 15 minutes | Pending |
| **Total** | **2.5 hours** | **Ready** |

---

## 🚀 Ready to Implement

The plan is comprehensive and ready for execution. The new leave management system will provide:
- ✨ Modern, luxury UI
- 🔄 Complete CRUD operations
- 📊 Advanced reporting
- 📅 Visual calendar
- 🎯 Role-based access
- 📱 Mobile-friendly
- 🔒 Enterprise-grade security

**All using the universal 6-table architecture with zero schema changes!**
