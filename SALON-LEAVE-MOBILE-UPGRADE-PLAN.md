# 📱 SALON LEAVE PAGE - ENTERPRISE MOBILE UPGRADE PLAN

**Status:** In Progress
**Target:** `/salon/leave` page upgrade to enterprise-grade mobile-first experience
**Architecture:** Universal Entity V1 + RPC hera_entities_crud_v1 + SalonLuxe components

---

## 🎯 UPGRADE GOALS

1. **Mobile-First Design** - PremiumMobileHeader, responsive KPIs, touch-optimized
2. **Lazy Loading** - Instant page load with Suspense boundaries
3. **Universal Entity V1** - Migrate from `useLeavePlaybook` to `useUniversalEntityV1` hook
4. **RPC-First** - All operations via `hera_entities_crud_v1` RPC function
5. **SalonLuxe Components** - SalonLuxePage, SalonLuxeModal, SalonLuxeButton
6. **Soft Animations** - Enterprise-grade gradients and animations

---

## 📋 IMPLEMENTATION CHECKLIST

### ✅ Phase 1: Entity Preset Configuration
- [x] Analyze current implementation (`useLeavePlaybook`)
- [ ] Create `LEAVE_REQUEST_PRESET` in `entityPresets.ts`
- [ ] Create `LEAVE_POLICY_PRESET` in `entityPresets.ts`
- [ ] Define all dynamic fields with smart codes
- [ ] Define relationships (staff → leave request, leave → policy)
- [ ] Add to `ENTITY_PRESETS` registry

### Phase 2: useHeraLeave Hook (RPC-First)
- [ ] Create `/src/hooks/useHeraLeave.ts`
- [ ] Import `useUniversalEntityV1` hook
- [ ] Implement CRUD operations via `hera_entities_crud_v1`
- [ ] Add leave balance calculation (in-memory)
- [ ] Add leave request status management
- [ ] Export typed interfaces

### Phase 3: Page Layout Upgrade
- [ ] Replace custom header with `SalonLuxePage`
- [ ] Add `PremiumMobileHeader` component
- [ ] Create responsive KPI cards with `SalonLuxeKPICard`
- [ ] Update tabs to use SalonLuxe styling
- [ ] Add mobile bottom spacing

### Phase 4: Lazy Loading Components
- [ ] Create `LeaveRequestsTab.tsx` (lazy loaded)
- [ ] Create `LeaveCalendarTab.tsx` (lazy loaded)
- [ ] Create `LeaveReportTab.tsx` (lazy loaded)
- [ ] Create `LeavePoliciesTab.tsx` (lazy loaded)
- [ ] Add Suspense boundaries with skeletons

### Phase 5: Leave Modal Upgrade
- [ ] Replace `LeaveRequestModal` with SalonLuxe version
- [ ] Add gradient animations
- [ ] Add form validation with Zod
- [ ] Implement touch-optimized inputs (44px min)
- [ ] Add loading states

### Phase 6: Testing & Documentation
- [ ] Test lazy loading performance
- [ ] Test mobile responsiveness (iPhone SE → iPad Pro)
- [ ] Test touch targets (44px minimum)
- [ ] Create upgrade documentation
- [ ] Update MOBILE-UPGRADE-PLAN.md

---

## 🧬 LEAVE REQUEST PRESET (Smart Codes)

### Entity Configuration

```typescript
export const LEAVE_REQUEST_PRESET = {
  entity_type: 'LEAVE_REQUEST',
  labels: {
    singular: 'Leave Request',
    plural: 'Leave Requests'
  },
  permissions: {
    create: () => true, // All staff can request leave
    edit: (role: Role) => ['owner', 'manager'].includes(role),
    delete: (role: Role) => ['owner', 'manager'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'leave_type',
      type: 'text' as const,
      smart_code: 'HERA.SALON.HR.LEAVE.DYN.TYPE.V1',
      required: true,
      ui: {
        label: 'Leave Type',
        widget: 'select',
        helpText: 'Type of leave requested'
      }
    },
    {
      name: 'start_date',
      type: 'date' as const,
      smart_code: 'HERA.SALON.HR.LEAVE.DYN.START_DATE.V1',
      required: true,
      ui: {
        label: 'Start Date',
        widget: 'date',
        required: true
      }
    },
    {
      name: 'end_date',
      type: 'date' as const,
      smart_code: 'HERA.SALON.HR.LEAVE.DYN.END_DATE.V1',
      required: true,
      ui: {
        label: 'End Date',
        widget: 'date',
        required: true
      }
    },
    {
      name: 'total_days',
      type: 'number' as const,
      smart_code: 'HERA.SALON.HR.LEAVE.DYN.TOTAL_DAYS.V1',
      required: true,
      ui: {
        label: 'Total Days',
        placeholder: '0',
        helpText: 'Number of leave days requested'
      }
    },
    {
      name: 'reason',
      type: 'text' as const,
      smart_code: 'HERA.SALON.HR.LEAVE.DYN.REASON.V1',
      required: true,
      ui: {
        label: 'Reason',
        widget: 'textarea',
        placeholder: 'Please provide a reason for your leave request',
        required: true
      }
    },
    {
      name: 'notes',
      type: 'text' as const,
      smart_code: 'HERA.SALON.HR.LEAVE.DYN.NOTES.V1',
      ui: {
        label: 'Additional Notes',
        widget: 'textarea',
        placeholder: 'Optional additional information'
      }
    },
    {
      name: 'status',
      type: 'text' as const,
      smart_code: 'HERA.SALON.HR.LEAVE.DYN.STATUS.V1',
      defaultValue: 'pending',
      ui: {
        label: 'Status',
        widget: 'select',
        helpText: 'Current status of leave request'
      }
    },
    {
      name: 'approved_by',
      type: 'text' as const,
      smart_code: 'HERA.SALON.HR.LEAVE.DYN.APPROVED_BY.V1',
      ui: {
        label: 'Approved By',
        helpText: 'Manager who approved the request',
        roles: ['owner', 'manager']
      }
    },
    {
      name: 'approved_at',
      type: 'date' as const,
      smart_code: 'HERA.SALON.HR.LEAVE.DYN.APPROVED_AT.V1',
      ui: {
        label: 'Approved At',
        widget: 'date',
        roles: ['owner', 'manager']
      }
    },
    {
      name: 'approval_notes',
      type: 'text' as const,
      smart_code: 'HERA.SALON.HR.LEAVE.DYN.APPROVAL_NOTES.V1',
      ui: {
        label: 'Approval Notes',
        widget: 'textarea',
        roles: ['owner', 'manager']
      }
    },
    {
      name: 'rejected_at',
      type: 'date' as const,
      smart_code: 'HERA.SALON.HR.LEAVE.DYN.REJECTED_AT.V1',
      ui: {
        label: 'Rejected At',
        widget: 'date',
        roles: ['owner', 'manager']
      }
    },
    {
      name: 'rejection_reason',
      type: 'text' as const,
      smart_code: 'HERA.SALON.HR.LEAVE.DYN.REJECTION_REASON.V1',
      ui: {
        label: 'Rejection Reason',
        widget: 'textarea',
        roles: ['owner', 'manager']
      }
    }
  ],
  relationships: [
    {
      type: 'LEAVE_REQUESTED_BY',
      smart_code: 'HERA.SALON.HR.LEAVE.REL.REQUESTED_BY.V1',
      cardinality: 'one' as const,
      ui: {
        label: 'Requested By',
        widget: 'select',
        optionsQueryKey: 'staff'
      }
    },
    {
      type: 'LEAVE_MANAGED_BY',
      smart_code: 'HERA.SALON.HR.LEAVE.REL.MANAGED_BY.V1',
      cardinality: 'one' as const,
      ui: {
        label: 'Manager',
        widget: 'select',
        optionsQueryKey: 'staff'
      }
    },
    {
      type: 'LEAVE_FOLLOWS_POLICY',
      smart_code: 'HERA.SALON.HR.LEAVE.REL.FOLLOWS_POLICY.V1',
      cardinality: 'one' as const,
      ui: {
        label: 'Leave Policy',
        widget: 'select',
        optionsQueryKey: 'leave-policies'
      }
    }
  ]
}
```

### Leave Policy Preset

```typescript
export const LEAVE_POLICY_PRESET = {
  entity_type: 'LEAVE_POLICY',
  labels: {
    singular: 'Leave Policy',
    plural: 'Leave Policies'
  },
  permissions: {
    create: (role: Role) => ['owner'].includes(role),
    edit: (role: Role) => ['owner', 'manager'].includes(role),
    delete: (role: Role) => ['owner'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      name: 'leave_type',
      type: 'text' as const,
      smart_code: 'HERA.SALON.HR.POLICY.DYN.TYPE.V1',
      required: true,
      ui: {
        label: 'Leave Type',
        widget: 'select',
        required: true
      }
    },
    {
      name: 'annual_entitlement',
      type: 'number' as const,
      smart_code: 'HERA.SALON.HR.POLICY.DYN.ENTITLEMENT.V1',
      required: true,
      ui: {
        label: 'Annual Entitlement (Days)',
        placeholder: '21',
        required: true
      }
    },
    {
      name: 'carry_over_cap',
      type: 'number' as const,
      smart_code: 'HERA.SALON.HR.POLICY.DYN.CARRY_OVER.V1',
      defaultValue: 5,
      ui: {
        label: 'Carry Over Cap (Days)',
        placeholder: '5'
      }
    },
    {
      name: 'min_notice_days',
      type: 'number' as const,
      smart_code: 'HERA.SALON.HR.POLICY.DYN.MIN_NOTICE.V1',
      defaultValue: 7,
      ui: {
        label: 'Minimum Notice (Days)',
        placeholder: '7'
      }
    },
    {
      name: 'max_consecutive_days',
      type: 'number' as const,
      smart_code: 'HERA.SALON.HR.POLICY.DYN.MAX_CONSECUTIVE.V1',
      defaultValue: 15,
      ui: {
        label: 'Max Consecutive Days',
        placeholder: '15'
      }
    },
    {
      name: 'accrual_method',
      type: 'text' as const,
      smart_code: 'HERA.SALON.HR.POLICY.DYN.ACCRUAL.V1',
      defaultValue: 'IMMEDIATE',
      ui: {
        label: 'Accrual Method',
        widget: 'select'
      }
    },
    {
      name: 'applies_to',
      type: 'text' as const,
      smart_code: 'HERA.SALON.HR.POLICY.DYN.APPLIES_TO.V1',
      defaultValue: 'ALL',
      ui: {
        label: 'Applies To',
        widget: 'select'
      }
    },
    {
      name: 'description',
      type: 'text' as const,
      smart_code: 'HERA.SALON.HR.POLICY.DYN.DESCRIPTION.V1',
      ui: {
        label: 'Description',
        widget: 'textarea',
        placeholder: 'Policy description'
      }
    },
    {
      name: 'active',
      type: 'boolean' as const,
      smart_code: 'HERA.SALON.HR.POLICY.DYN.ACTIVE.V1',
      defaultValue: true,
      ui: {
        label: 'Active',
        widget: 'checkbox'
      }
    }
  ],
  relationships: []
}
```

---

## 🚀 useHeraLeave Hook Structure

```typescript
// /src/hooks/useHeraLeave.ts
import { useUniversalEntityV1 } from './useUniversalEntityV1'
import { LEAVE_REQUEST_PRESET, LEAVE_POLICY_PRESET } from './entityPresets'

export function useHeraLeave(options: UseHeraLeaveOptions) {
  const { organizationId, filters } = options

  // Fetch leave requests
  const {
    entities: leaveRequests,
    isLoading: requestsLoading,
    create: createRequest,
    update: updateRequest,
    delete: deleteRequest
  } = useUniversalEntityV1({
    preset: LEAVE_REQUEST_PRESET,
    organizationId,
    filters
  })

  // Fetch leave policies
  const {
    entities: policies,
    isLoading: policiesLoading
  } = useUniversalEntityV1({
    preset: LEAVE_POLICY_PRESET,
    organizationId
  })

  // Fetch staff
  const {
    entities: staff,
    isLoading: staffLoading
  } = useUniversalEntityV1({
    preset: STAFF_PRESET,
    organizationId
  })

  // Calculate balances in-memory (same logic as useLeavePlaybook)
  const balances = React.useMemo(() => {
    // Implementation here
  }, [leaveRequests, staff])

  return {
    requests: leaveRequests,
    policies,
    staff,
    balances,
    isLoading: requestsLoading || policiesLoading || staffLoading,
    createRequest,
    updateRequest,
    deleteRequest,
    approveRequest: (id: string, notes?: string) => updateRequest(id, { status: 'approved', approval_notes: notes }),
    rejectRequest: (id: string, reason?: string) => updateRequest(id, { status: 'rejected', rejection_reason: reason })
  }
}
```

---

## 📱 Mobile-First Page Structure

```tsx
export default function LeaveManagementPage() {
  return (
    <StatusToastProvider>
      <SalonLuxePage
        title="Leave Management"
        description="Manage staff leave requests and policies"
        maxWidth="full"
        padding="lg"
      >
        {/* 📱 PREMIUM MOBILE HEADER */}
        <PremiumMobileHeader
          title="Leave"
          subtitle={`${stats.totalRequests} requests`}
          showNotifications
          notificationCount={stats.pendingRequests}
          shrinkOnScroll
          rightAction={
            <button
              onClick={() => setModalOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#D4AF37] active:scale-90 transition-transform"
            >
              <Plus className="w-5 h-5 text-black" />
            </button>
          }
        />

        <div className="p-4 md:p-6 lg:p-8">
          {/* 📊 ENTERPRISE-GRADE KPI CARDS */}
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

          {/* TABS with Lazy Loading */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="report">Report</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
            </TabsList>

            <TabsContent value="requests">
              <Suspense fallback={<TabLoader />}>
                <LeaveRequestsTab
                  requests={requests}
                  staff={staff}
                  onApprove={approveRequest}
                  onReject={rejectRequest}
                />
              </Suspense>
            </TabsContent>

            {/* Other tabs with lazy loading */}
          </Tabs>

          {/* 📱 MOBILE BOTTOM SPACING */}
          <div className="h-20 md:h-0" />
        </div>
      </SalonLuxePage>
    </StatusToastProvider>
  )
}
```

---

## ✅ SUCCESS CRITERIA

### Performance
- [ ] Initial page load < 1 second (FCP)
- [ ] Time to Interactive < 2 seconds
- [ ] Lazy loaded tabs < 500ms
- [ ] Lighthouse mobile score > 90

### Mobile UX
- [ ] All touch targets ≥ 44px
- [ ] Bottom nav never overlaps content
- [ ] Scroll animations smooth (60fps)
- [ ] PremiumMobileHeader shrinks on scroll

### Functionality
- [ ] All CRUD operations work via RPC
- [ ] Leave balance calculation accurate
- [ ] Role-based permissions enforced
- [ ] Status workflow (pending → approved/rejected)

### Code Quality
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no warnings
- [ ] All components have prop types
- [ ] Smart codes follow HERA DNA format

---

## 📊 MIGRATION COMPARISON

| Feature | Current (useLeavePlaybook) | New (useHeraLeave) |
|---------|---------------------------|-------------------|
| Hook | useUniversalEntity (old) | useUniversalEntityV1 (new) |
| RPC | hera_transaction_create_v1 | hera_entities_crud_v1 |
| Layout | Custom header + styling | SalonLuxePage + PremiumMobileHeader |
| KPI Cards | Custom components | SalonLuxeKPICard |
| Lazy Loading | ❌ None | ✅ All tabs lazy loaded |
| Mobile Header | ❌ None | ✅ PremiumMobileHeader |
| Touch Targets | ⚠️ Variable | ✅ 44px minimum |
| Animations | Basic | Enterprise gradients |

---

## 🚦 READY TO PROCEED?

This plan provides a complete roadmap for upgrading the leave page to enterprise-grade mobile-first standards.

**Next Steps:**
1. Add `LEAVE_REQUEST_PRESET` and `LEAVE_POLICY_PRESET` to `entityPresets.ts`
2. Create `useHeraLeave` hook with RPC-first architecture
3. Upgrade `page.tsx` with SalonLuxePage and mobile components
4. Create lazy-loaded tab components
5. Test and document

**Estimated Effort:** 4-6 hours for complete implementation

Would you like me to proceed with Phase 1 (Entity Presets)?
