'use client'

import React, { useState, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useHeraLeave } from '@/hooks/useHeraLeave'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { SalonLuxeKPICard } from '@/components/salon/shared/SalonLuxeKPICard'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
import { Plus, FileText, Clock, CheckCircle, Calendar, RefreshCw, Settings, Users, AlertTriangle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#9B59B6',
  rose: '#E8B4B8'
}

// Lazy load tab components for instant page load
const LeaveRequestsTab = lazy(() =>
  import('./LeaveRequestsTab').then(module => ({ default: module.LeaveRequestsTab }))
)
const LeaveCalendarTab = lazy(() =>
  import('./LeaveCalendarTab').then(module => ({ default: module.LeaveCalendarTab }))
)
const LeaveReportTab = lazy(() =>
  import('./LeaveReportTab').then(module => ({ default: module.LeaveReportTab }))
)
const LeavePoliciesTab = lazy(() =>
  import('./LeavePoliciesTab').then(module => ({ default: module.LeavePoliciesTab }))
)
const LeaveModal = lazy(() =>
  import('./LeaveModal').then(module => ({ default: module.LeaveModal }))
)
const PolicyModal = lazy(() =>
  import('./PolicyModal').then(module => ({ default: module.PolicyModal }))
)

// Loading fallback component
function TabLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.gold }} />
      <span className="ml-3" style={{ color: COLORS.bronze }}>
        Loading...
      </span>
    </div>
  )
}

function LeaveManagementPageContent() {
  const { organizationId, availableBranches } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()
  const router = useRouter()

  // State
  const [activeTab, setActiveTab] = useState('requests')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<string>()
  const [policyModalOpen, setPolicyModalOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null)

  // ✅ NEW: Leave request state management
  const [selectedRequest, setSelectedRequest] = useState<any>(null) // For edit mode
  const [requestDeleteDialogOpen, setRequestDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)

  // ✅ ENTERPRISE PATTERN: Server-side filters state
  const [policyFilters, setPolicyFilters] = useState<{
    leave_type?: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
    status?: 'active' | 'archived' | 'all'
  }>({ status: 'all' })

  // 🚀 UPGRADED: Now using useHeraLeave hook with RPC-first architecture
  // Fetch ALL policies (including archived) so we can filter client-side like services page
  const {
    requests,
    policies: allPolicies,
    staff,
    balances,
    isLoading,
    isCreating,
    isUpdatingRequest, // ✅ NEW
    isDeletingRequest, // ✅ NEW
    isCreatingPolicy,
    isUpdatingPolicy,
    isArchivingPolicy,
    isRestoringPolicy,
    isDeletingPolicy,
    createRequest,
    updateRequest, // ✅ NEW
    deleteRequest, // ✅ NEW
    createPolicy,
    updatePolicy,
    archivePolicy,
    restorePolicy,
    deletePolicy,
    approveRequest,
    rejectRequest,
    cancelRequest,
    withdrawRequest // ✅ NEW
  } = useHeraLeave({
    organizationId: organizationId || '',
    branchId: selectedBranch,
    year: new Date().getFullYear(),
    includeArchived: true // ✅ FIXED: Fetch ALL policies, filter client-side
  })

  // ✅ ENTERPRISE PATTERN: Client-side filtering (like services page)
  const policies = React.useMemo(() => {
    if (!allPolicies) return []

    return allPolicies.filter(policy => {
      // Apply status filter
      if (policyFilters.status === 'active' && !policy.active) return false
      if (policyFilters.status === 'archived' && policy.active) return false
      // 'all' shows everything

      // Apply leave type filter
      if (policyFilters.leave_type && policy.leave_type !== policyFilters.leave_type) return false

      return true
    })
  }, [allPolicies, policyFilters])

  // Calculate stats
  const stats = {
    totalRequests: requests?.length || 0,
    pendingRequests: requests?.filter(r => r.status === 'submitted').length || 0,
    approvedRequests: requests?.filter(r => r.status === 'approved').length || 0,
    upcomingLeave: requests?.filter(r => {
      if (r.status !== 'approved') return false
      const startDate = new Date(r.start_date)
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return startDate >= now && startDate <= sevenDaysFromNow
    }).length || 0
  }

  // CRUD Handlers
  const handleCreateRequest = async (data: any) => {
    const loadingId = showLoading('Creating leave request...', 'Please wait')

    try {
      await createRequest(data)
      removeToast(loadingId)
      showSuccess('Leave request created', 'Your leave request has been submitted for approval')
      setModalOpen(false)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to create leave request', error.message || 'Please try again')
    }
  }

  const handleApprove = async (requestId: string, notes?: string) => {
    const request = requests?.find(r => r.id === requestId)
    const staffName = request?.staff_name || 'Staff member'

    const loadingId = showLoading('Approving leave request...', 'Please wait')

    try {
      await approveRequest(requestId, notes)
      removeToast(loadingId)
      showSuccess('Leave request approved', `${staffName}'s leave request has been approved`)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to approve request', error.message || 'Please try again')
    }
  }

  const handleReject = async (requestId: string, reason?: string) => {
    const request = requests?.find(r => r.id === requestId)
    const staffName = request?.staff_name || 'Staff member'

    const loadingId = showLoading('Rejecting leave request...', 'Please wait')

    try {
      await rejectRequest(requestId, reason)
      removeToast(loadingId)
      showSuccess('Leave request rejected', `${staffName}'s leave request has been rejected`)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to reject request', error.message || 'Please try again')
    }
  }

  // ✅ NEW: Leave request CRUD handlers
  const handleEditRequest = (request: any) => {
    console.log('📝 [page] EDIT REQUEST CLICKED:', { requestId: request.id, staffName: request.staff_name })
    setSelectedRequest(request)
    setModalOpen(true)
  }

  const handleUpdateRequest = async (data: any) => {
    console.log('📝 [page] UPDATE REQUEST CALLED:', {
      hasSelectedRequest: !!selectedRequest,
      selectedRequestId: selectedRequest?.id,
      dataKeys: Object.keys(data)
    })

    if (!selectedRequest?.id) {
      console.warn('⚠️ [page] No selected request ID!')
      return
    }

    const loadingId = showLoading('Updating leave request...', 'Please wait')

    try {
      console.log('🚀 [page] Calling updateRequest mutation...')
      await updateRequest({ requestId: selectedRequest.id, data })
      console.log('✅ [page] Update request completed successfully')
      removeToast(loadingId)
      showSuccess('Request updated', 'Leave request has been updated successfully')
      setModalOpen(false)
      setSelectedRequest(null)
    } catch (error: any) {
      console.error('❌ [page] Update request error:', error)
      removeToast(loadingId)
      showError('Failed to update request', error.message || 'Please try again')
    }
  }

  const handleWithdrawRequest = async (requestId: string) => {
    const request = requests?.find(r => r.id === requestId)
    const staffName = request?.staff_name || 'Staff member'

    const loadingId = showLoading('Withdrawing leave request...', 'Please wait')

    try {
      await withdrawRequest(requestId)
      removeToast(loadingId)
      showSuccess('Request withdrawn', `${staffName}'s leave request has been withdrawn`)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to withdraw request', error.message || 'Please try again')
    }
  }

  const handleDeleteRequest = (requestId: string) => {
    console.log('🗑️ [page] DELETE REQUEST CLICKED:', { requestId })
    setRequestToDelete(requestId)
    setRequestDeleteDialogOpen(true)
  }

  const handleConfirmDeleteRequest = async () => {
    if (!requestToDelete) return

    const request = requests?.find(r => r.id === requestToDelete)
    const staffName = request?.staff_name || 'Staff member'

    const loadingId = showLoading('Deleting leave request...', 'Please wait')

    try {
      await deleteRequest(requestToDelete)
      removeToast(loadingId)
      showSuccess('Request deleted', `${staffName}'s leave request has been permanently deleted`)
      setRequestDeleteDialogOpen(false)
      setRequestToDelete(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to delete request', error.message || 'Please try again')
      console.error('Request delete error:', error)
    }
  }

  const handleCreatePolicy = async (data: any) => {
    const loadingId = showLoading('Creating leave policy...', 'Please wait')

    try {
      // ✅ CORRECT: Use hook's createPolicy function (no direct RPC calls)
      await createPolicy(data)

      removeToast(loadingId)
      showSuccess('Leave policy created', `Policy "${data.policy_name}" has been created successfully`)
      setPolicyModalOpen(false)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to create policy', error.message || 'Please try again')
      console.error('Policy creation error:', error)
    }
  }

  // Policy CRUD Handlers (following services page pattern)
  const handleEditPolicy = (policy: any) => {
    console.log('📝 [page] EDIT POLICY CLICKED:', { policyId: policy.id, policyName: policy.entity_name })
    setSelectedPolicy(policy)
    setPolicyModalOpen(true)
  }

  const handleUpdatePolicy = async (data: any) => {
    console.log('📝 [page] UPDATE POLICY CALLED:', {
      hasSelectedPolicy: !!selectedPolicy,
      selectedPolicyId: selectedPolicy?.id,
      dataKeys: Object.keys(data)
    })

    if (!selectedPolicy?.id) {
      console.warn('⚠️ [page] No selected policy ID!')
      return
    }

    const loadingId = showLoading('Updating leave policy...', 'Please wait')

    try {
      console.log('🚀 [page] Calling updatePolicy mutation...')
      await updatePolicy({ id: selectedPolicy.id, data })
      console.log('✅ [page] Update policy completed successfully')
      removeToast(loadingId)
      showSuccess('Policy updated', `Policy "${data.policy_name}" has been updated successfully`)
      setPolicyModalOpen(false)
      setSelectedPolicy(null)
    } catch (error: any) {
      console.error('❌ [page] Update policy error:', error)
      removeToast(loadingId)
      showError('Failed to update policy', error.message || 'Please try again')
      console.error('Policy update error:', error)
    }
  }

  const handleArchivePolicy = async (policyId: string) => {
    const policy = policies?.find(p => p.id === policyId)
    const policyName = policy?.entity_name || 'Policy'

    console.log('📦 [page] ARCHIVE POLICY CALLED:', { policyId, policyName })

    const loadingId = showLoading('Archiving policy...', 'Please wait')

    try {
      console.log('🚀 [page] Calling archivePolicy mutation...')
      await archivePolicy(policyId)
      console.log('✅ [page] Archive policy completed successfully')
      removeToast(loadingId)
      showSuccess('Policy archived', `"${policyName}" has been archived`)
    } catch (error: any) {
      console.error('❌ [page] Archive policy error:', error)
      removeToast(loadingId)
      showError('Failed to archive policy', error.message || 'Please try again')
      console.error('Policy archive error:', error)
    }
  }

  const handleRestorePolicy = async (policyId: string) => {
    const policy = policies?.find(p => p.id === policyId)
    const policyName = policy?.entity_name || 'Policy'

    const loadingId = showLoading('Restoring policy...', 'Please wait')

    try {
      await restorePolicy(policyId)
      removeToast(loadingId)
      showSuccess('Policy restored', `"${policyName}" has been restored`)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to restore policy', error.message || 'Please try again')
      console.error('Policy restore error:', error)
    }
  }

  const handleDeletePolicy = (policyId: string) => {
    setPolicyToDelete(policyId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!policyToDelete) return

    const policy = policies?.find(p => p.id === policyToDelete)
    const policyName = policy?.entity_name || 'Policy'

    const loadingId = showLoading('Deleting policy...', 'Please wait')

    try {
      const result = await deletePolicy(policyToDelete)
      removeToast(loadingId)

      if (result.archived) {
        // Policy was archived instead of deleted
        showSuccess(
          'Policy archived',
          result.message || `"${policyName}" is being used and has been archived instead of deleted`
        )
      } else {
        // Policy was permanently deleted
        showSuccess('Policy deleted', `"${policyName}" has been permanently deleted`)
      }

      setDeleteDialogOpen(false)
      setPolicyToDelete(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to delete policy', error.message || 'Please try again')
      console.error('Policy delete error:', error)
    }
  }

  if (!organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.black }}>
        <div
          className="text-center p-8 rounded-xl"
          style={{
            backgroundColor: COLORS.charcoal,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h2 className="text-xl font-medium mb-2" style={{ color: COLORS.champagne }}>
            Loading...
          </h2>
          <p style={{ color: COLORS.bronze, opacity: 0.7 }}>Setting up leave management.</p>
        </div>
      </div>
    )
  }

  return (
    <SalonLuxePage
      title="Leave Management"
      description="Manage staff leave requests and policies"
      actions={
        <>
          {/* Team Management - Emerald color */}
          <button
            onClick={() => router.push('/salon/staffs')}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.emerald,
              color: COLORS.champagne,
              border: `1px solid ${COLORS.emerald}`
            }}
          >
            <Users className="w-4 h-4" />
            Team Management
          </button>
          {/* Submit Leave Request - Gold color */}
          {activeTab === 'requests' && (
            <button
              onClick={() => setModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: COLORS.gold,
                color: COLORS.black,
                border: `1px solid ${COLORS.gold}`
              }}
            >
              <Plus className="w-4 h-4" />
              Submit Leave Request
            </button>
          )}
          {/* Configure Policy - Plum color */}
          {activeTab === 'policies' && (
            <button
              onClick={() => setPolicyModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: COLORS.plum,
                color: COLORS.champagne,
                border: `1px solid ${COLORS.plum}`
              }}
            >
              <Settings className="w-4 h-4" />
              Configure Policy
            </button>
          )}
          {/* Refresh Data - Icon only at the end */}
          <button
            onClick={() => window.location.reload()}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.charcoal,
              border: `1px solid ${COLORS.bronze}40`,
              color: COLORS.bronze
            }}
            title="Refresh leave data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </>
      }
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
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#D4AF37] active:scale-90 transition-transform duration-200 shadow-lg"
            aria-label="New leave request"
            style={{
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)'
            }}
          >
            <Plus className="w-5 h-5 text-black" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="p-4 md:p-6 lg:p-8">
        {/* 📊 ENTERPRISE-GRADE KPI CARDS - Reusable SalonLuxeKPICard Component */}
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

        {/* 📱 MOBILE QUICK ACTIONS */}
        <div className="md:hidden mb-6 flex gap-2">
          <button
            onClick={() => router.push('/salon/staffs')}
            className="flex-1 min-h-[48px] rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            style={{
              backgroundColor: COLORS.emerald,
              color: COLORS.champagne
            }}
          >
            <Users className="w-4 h-4" />
            Team Management
          </button>
          <button
            onClick={() => window.location.reload()}
            className="min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center"
            style={{
              backgroundColor: COLORS.charcoal,
              border: `1px solid ${COLORS.bronze}40`,
              color: COLORS.bronze
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Branch Selector (Desktop) */}
        <div className="hidden md:flex items-center gap-3 mb-6">
          <label className="text-sm font-medium" style={{ color: COLORS.champagne }}>
            Branch:
          </label>
          <select
            className="px-3 py-2 rounded-lg border text-sm transition-all duration-300"
            style={{
              borderColor: COLORS.bronze,
              color: COLORS.champagne,
              backgroundColor: COLORS.charcoal
            }}
            value={selectedBranch || ''}
            onChange={e => setSelectedBranch(e.target.value || undefined)}
          >
            <option value="">All Branches</option>
            {availableBranches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.entity_name}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.black} 100%)`,
              border: `1px solid ${COLORS.gold}30`,
              padding: '4px'
            }}
          >
            <TabsTrigger
              value="requests"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold/20 data-[state=active]:to-gold/10 transition-all duration-300"
              style={{ color: COLORS.champagne }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Requests
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold/20 data-[state=active]:to-gold/10 transition-all duration-300"
              style={{ color: COLORS.champagne }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger
              value="report"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold/20 data-[state=active]:to-gold/10 transition-all duration-300"
              style={{ color: COLORS.champagne }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Report
            </TabsTrigger>
            <TabsTrigger
              value="policies"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold/20 data-[state=active]:to-gold/10 transition-all duration-300"
              style={{ color: COLORS.champagne }}
            >
              <Settings className="w-4 h-4 mr-2" />
              Policies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Suspense fallback={<TabLoader />}>
              <LeaveRequestsTab
                requests={requests || []}
                staff={staff || []}
                isLoading={isLoading}
                onApprove={handleApprove}
                onReject={handleReject}
                onCancel={cancelRequest}
                onEdit={handleEditRequest} // ✅ NEW
                onDelete={handleDeleteRequest} // ✅ NEW
                onWithdraw={handleWithdrawRequest} // ✅ NEW
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="calendar" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Suspense fallback={<TabLoader />}>
              <LeaveCalendarTab
                requests={requests?.filter(r => r.status === 'approved') || []}
                staff={staff || []}
                branchId={selectedBranch}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="report" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Suspense fallback={<TabLoader />}>
              <LeaveReportTab
                staff={staff || []}
                balances={balances || {}}
                requests={requests || []}
                branchId={selectedBranch}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="policies" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Suspense fallback={<TabLoader />}>
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
            </Suspense>
          </TabsContent>
        </Tabs>

        {/* 📱 MOBILE-FIRST: Bottom spacing for comfortable mobile scrolling - MANDATORY */}
        <div className="h-20 md:h-0" />
      </div>

      {/* Leave Request Modal - Lazy Loaded */}
      {modalOpen && (
        <Suspense fallback={null}>
          <LeaveModal
            open={modalOpen}
            onOpenChange={(open) => {
              setModalOpen(open)
              if (!open) setSelectedRequest(null) // ✅ Clear selected request on close
            }}
            onSubmit={selectedRequest ? handleUpdateRequest : handleCreateRequest} // ✅ Route to update or create
            staff={staff || []}
            policies={policies || []}
            balances={balances || {}}
            isLoading={selectedRequest ? isUpdatingRequest : isCreating} // ✅ Use appropriate loading state
            initialData={selectedRequest} // ✅ Pass selected request for edit mode
          />
        </Suspense>
      )}

      {/* Policy Modal - Lazy Loaded */}
      {policyModalOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* Delete Policy Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.bronze}30`
          }}
        >
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${COLORS.rose}20` }}
              >
                <AlertTriangle className="w-6 h-6" style={{ color: COLORS.rose }} />
              </div>
              <AlertDialogTitle style={{ color: COLORS.champagne }}>
                Delete Leave Policy?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription style={{ color: COLORS.bronze }}>
              This action cannot be undone. This policy will be permanently deleted from the system.
            </AlertDialogDescription>
            {policyToDelete && policies?.find(p => p.id === policyToDelete) && (
              <div
                className="mt-3 p-3 rounded-lg"
                style={{ backgroundColor: `${COLORS.black}40` }}
              >
                <div className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                  {policies.find(p => p.id === policyToDelete)?.entity_name}
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{
                backgroundColor: COLORS.charcoal,
                borderColor: `${COLORS.bronze}30`,
                color: COLORS.champagne
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              style={{
                backgroundColor: COLORS.rose,
                color: 'white'
              }}
            >
              Delete Policy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ NEW: Delete Request Confirmation Dialog */}
      <AlertDialog open={requestDeleteDialogOpen} onOpenChange={setRequestDeleteDialogOpen}>
        <AlertDialogContent
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.bronze}30`
          }}
        >
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${COLORS.rose}20` }}
              >
                <AlertTriangle className="w-6 h-6" style={{ color: COLORS.rose }} />
              </div>
              <AlertDialogTitle style={{ color: COLORS.champagne }}>
                Delete Leave Request?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription style={{ color: COLORS.bronze }}>
              This action cannot be undone. This leave request will be permanently deleted.
            </AlertDialogDescription>
            {requestToDelete && requests?.find(r => r.id === requestToDelete) && (
              <div
                className="mt-3 p-3 rounded-lg"
                style={{ backgroundColor: `${COLORS.black}40` }}
              >
                <div className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                  {requests.find(r => r.id === requestToDelete)?.staff_name} - {requests.find(r => r.id === requestToDelete)?.transaction_code}
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{
                backgroundColor: COLORS.charcoal,
                borderColor: `${COLORS.bronze}30`,
                color: COLORS.champagne
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteRequest}
              style={{
                backgroundColor: COLORS.rose,
                color: 'white'
              }}
            >
              Delete Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SalonLuxePage>
  )
}

export default function LeaveManagementPage() {
  return (
    <StatusToastProvider>
      <LeaveManagementPageContent />
    </StatusToastProvider>
  )
}
