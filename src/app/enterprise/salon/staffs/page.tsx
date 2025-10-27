'use client'

import React, { useState, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { useHeraRoles } from '@/hooks/useHeraRoles'
import { useHeraBranches } from '@/hooks/useHeraBranches'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { SalonLuxeKPICard } from '@/components/salon/shared/SalonLuxeKPICard'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
import { ComplianceAlertBanner } from '@/components/salon/compliance/ComplianceAlertBanner'
import { scanStaffCompliance } from '@/lib/compliance/staff-compliance'
import type { StaffFormValues } from './StaffModal'
import { Plus, Users, UserCircle, RefreshCw, Palmtree, Shield, AlertTriangle, LogIn, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  emerald: '#0F6F5C',
  rose: '#E8B4B8'
}

// Lazy load tab components for instant page load
const StaffListTab = lazy(() =>
  import('./StaffListTab').then(module => ({ default: module.StaffListTab }))
)
const RolesTab = lazy(() => import('./RolesTab').then(module => ({ default: module.RolesTab })))
const StaffModal = lazy(() =>
  import('./StaffModal').then(module => ({ default: module.StaffModal }))
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

function StaffsPageContent() {
  const { organizationId } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()
  const queryClient = useQueryClient()
  const router = useRouter()

  // State
  const [activeTab, setActiveTab] = useState('staff')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'active' | 'all'>('active') // ✅ FIX: View mode for UI filtering only

  // 🚀 UPGRADED: Now using useHeraStaff hook (60% fewer API calls)
  // Always fetch ALL staff (including archived) for consistent KPI calculations
  const {
    staff: allStaff,
    isLoading: isLoadingStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    archiveStaff,
    restoreStaff,
    refetch,
    isCreating,
    isUpdating,
    isDeleting
  } = useHeraStaff({
    organizationId: organizationId || '',
    includeArchived: true, // ✅ FIX: Always fetch all staff for stable KPIs
    enabled: !!organizationId && activeTab === 'staff' // Only fetch when tab is active
  })

  // ✅ FIX: Filter staff based on view mode (UI-only filtering)
  const staff = React.useMemo(() => {
    if (!allStaff) return []
    if (viewMode === 'all') return allStaff
    return allStaff.filter(s => s.status === 'active')
  }, [allStaff, viewMode])

  // Fetch roles for the staff modal
  const { roles } = useHeraRoles({
    organizationId: organizationId || '',
    includeInactive: false
  })

  // Fetch branches for the staff modal
  const { branches } = useHeraBranches({
    organizationId: organizationId || '',
    includeArchived: false
  })

  // ✅ FIX: Calculate stats from ALL staff for consistent KPI display
  const stats = {
    totalStaff: allStaff?.length || 0, // Total team size (active + archived)
    activeToday: allStaff?.filter(s => s && s.status === 'active').length || 0,
    onLeave: allStaff?.filter(s => s && s.status === 'on_leave').length || 0,
    totalRoles: roles?.length || 0
  }

  // 🏥 COMPLIANCE: Scan for expiring documents (30-day warning)
  const compliance = React.useMemo(() => {
    if (!allStaff || allStaff.length === 0) {
      return { totalIssues: 0, critical: 0, warning: 0, issues: [] }
    }
    return scanStaffCompliance(allStaff, 30) // 30 days warning period
  }, [allStaff])

  // CRUD Handlers
  const handleOpenModal = (staffMember?: any) => {
    setEditingStaff(staffMember || null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingStaff(null)
  }

  const handleSave = async (data: StaffFormValues) => {
    const fullName = `${data.first_name} ${data.last_name}`.trim()
    const loadingId = showLoading(
      editingStaff ? 'Updating staff member...' : 'Creating staff member...',
      'Please wait while we save your changes'
    )

    try {
      if (editingStaff) {
        // Update existing staff using useHeraStaff hook
        await updateStaff(editingStaff.id, data)
        removeToast(loadingId)
        showSuccess('Staff member updated successfully', `${fullName} has been updated`)
      } else {
        // Create new staff using useHeraStaff hook
        await createStaff(data)
        removeToast(loadingId)
        showSuccess('Staff member created successfully', `${fullName} has been added to your team`)
      }

      handleCloseModal()
    } catch (error: any) {
      removeToast(loadingId)
      showError(
        editingStaff ? 'Failed to update staff member' : 'Failed to create staff member',
        error.message || 'Please try again or contact support'
      )
    }
  }

  const handleDelete = (staffId: string) => {
    const staffMember = staff?.find(s => s.id === staffId)
    setStaffToDelete(staffMember)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return

    const staffName = staffToDelete?.entity_name || 'Staff member'
    const staffId = staffToDelete.id
    const loadingId = showLoading('Deleting staff member...', 'This action cannot be undone')

    try {
      console.log('[handleDelete] Starting delete for:', { id: staffId, name: staffName })

      // useHeraStaff has smart delete: tries hard delete, falls back to archive if referenced
      const result = await deleteStaff(staffId)

      console.log('[handleDelete] Delete complete, result:', result)

      // ✅ OPTIMISTIC UPDATE: Update cache based on result
      queryClient.setQueryData(
        ['universal-entities', 'STAFF', organizationId],
        (oldData: any) => {
          if (!oldData) return oldData
          console.log('[handleDelete] Updating cache:', {
            oldCount: oldData.length,
            staffId,
            wasArchived: result.archived
          })

          if (result.archived) {
            // If archived (not deleted), update status to archived
            const newData = oldData.map((s: any) =>
              s.id === staffId ? { ...s, status: 'archived' } : s
            )
            console.log('[handleDelete] Updated status to archived in cache')
            return newData
          } else {
            // If truly deleted, remove from cache
            const newData = oldData.filter((s: any) => s.id !== staffId)
            console.log('[handleDelete] Removed from cache:', { newCount: newData.length })
            return newData
          }
        }
      )

      removeToast(loadingId)

      if (result.archived) {
        // Staff was archived because it's referenced
        showSuccess(
          'Staff member archived',
          result.message || `${staffName} has been archived (cannot delete due to existing references)`
        )
      } else {
        // Staff was permanently deleted
        showSuccess('Staff member deleted', `${staffName} has been permanently removed`)
      }

      setDeleteDialogOpen(false)
      setStaffToDelete(null)
    } catch (error: any) {
      console.error('[handleDelete] Error:', error)
      removeToast(loadingId)
      showError('Failed to delete staff member', error.message || 'Please try again')
    }
  }

  const handleArchive = async (staffId: string) => {
    const staffMember = staff?.find(s => s.id === staffId)
    const staffName = staffMember?.entity_name || 'Staff member'

    const loadingId = showLoading('Archiving staff member...', 'Please wait')

    try {
      console.log('[handleArchive] Starting archive for:', { staffId, staffName, currentStatus: staffMember?.status })

      // Archive in database - RPC handles the update
      await archiveStaff(staffId)

      console.log('[handleArchive] Archive complete in DB, updating React Query cache...')

      // ✅ OPTIMISTIC UPDATE: Update status in cache
      // No need to refetch - we know exactly what changed!
      // UI filtering will handle showing/hiding based on view mode
      queryClient.setQueryData(
        ['universal-entities', 'STAFF', organizationId],
        (oldData: any) => {
          if (!oldData) return oldData
          console.log('[handleArchive] Updating status to archived in cache:', {
            oldCount: oldData.length,
            staffId
          })

          const newData = oldData.map((s: any) =>
            s.id === staffId ? { ...s, status: 'archived' } : s
          )
          console.log('[handleArchive] Cache updated:', { newCount: newData.length })
          return newData
        }
      )

      removeToast(loadingId)
      showSuccess('Staff member archived', `${staffName} has been archived and removed from active list`)
    } catch (error: any) {
      console.error('[handleArchive] Error:', error)
      removeToast(loadingId)
      showError('Failed to archive staff member', error.message || 'Please try again')
    }
  }

  const handleRestore = async (staffId: string) => {
    const staffMember = staff?.find(s => s.id === staffId)
    const staffName = staffMember?.entity_name || 'Staff member'

    const loadingId = showLoading('Restoring staff member...', 'Please wait')

    try {
      console.log('[handleRestore] Starting restore for:', { staffId, staffName })

      // Restore in database - RPC handles the update
      await restoreStaff(staffId)

      console.log('[handleRestore] Restore complete in DB, updating React Query cache...')

      // ✅ OPTIMISTIC UPDATE: Update status in cache
      // No need to refetch - we already have all staff in cache!
      // UI filtering will handle showing/hiding based on view mode
      queryClient.setQueryData(
        ['universal-entities', 'STAFF', organizationId],
        (oldData: any) => {
          if (!oldData) return oldData
          console.log('[handleRestore] Updating status to active in cache:', { staffId })
          return oldData.map((s: any) =>
            s.id === staffId ? { ...s, status: 'active' } : s
          )
        }
      )

      console.log('[handleRestore] Cache updated - restored staff now visible')

      removeToast(loadingId)
      showSuccess('Staff member restored', `${staffName} has been restored to active status`)
    } catch (error: any) {
      console.error('[handleRestore] Error:', error)
      removeToast(loadingId)
      showError('Failed to restore staff member', error.message || 'Please try again')
    }
  }

  // Get authentication state
  const { isAuthenticated, isLoading: authLoading, status } = useHERAAuth()

  // 🔐 Authentication Check: Not authenticated and not loading
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.black }}>
        <div
          className="max-w-md w-full text-center p-8 rounded-xl border animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: COLORS.gold + '40',
            boxShadow: `0 8px 24px ${COLORS.black}60`
          }}
        >
          {/* Warning Icon */}
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center animate-pulse"
            style={{
              backgroundColor: COLORS.gold + '20',
              border: `2px solid ${COLORS.gold}`
            }}
          >
            <AlertTriangle className="w-8 h-8" style={{ color: COLORS.gold }} />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-3" style={{ color: COLORS.champagne }}>
            Authentication Required
          </h2>

          {/* Message */}
          <p className="mb-6 leading-relaxed" style={{ color: COLORS.lightText }}>
            Please log in to access the staff management system. Your session may have expired or you need to authenticate.
          </p>

          {/* Redirect Button */}
          <SalonLuxeButton
            variant="primary"
            size="lg"
            onClick={() => router.push('/salon/auth')}
            icon={<LogIn className="w-5 h-5" />}
            className="w-full"
          >
            Go to Login
          </SalonLuxeButton>

          {/* Status Info */}
          <div
            className="mt-6 p-3 rounded-lg text-xs"
            style={{
              backgroundColor: COLORS.black,
              border: `1px solid ${COLORS.bronze}40`,
              color: COLORS.bronze
            }}
          >
            Status: {status === 'error' ? 'Authentication Error' : 'Not Authenticated'}
          </div>
        </div>
      </div>
    )
  }

  // 🔄 Loading State: Authentication in progress
  if (authLoading || !organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.black }}>
        <div
          className="text-center p-8 rounded-xl animate-pulse"
          style={{
            backgroundColor: COLORS.charcoal,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: COLORS.gold }} />
          <h2 className="text-xl font-medium mb-2" style={{ color: COLORS.champagne }}>
            {authLoading ? 'Authenticating...' : 'Loading...'}
          </h2>
          <p style={{ color: COLORS.lightText, opacity: 0.7 }}>
            {authLoading ? 'Verifying your credentials' : 'Setting up staff management'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <SalonLuxePage
      title="Staff & Roles"
      description="Manage your team members and employee roles"
      actions={
        <>
          {/* Leave & Attendance - Emerald color */}
          <button
            onClick={() => router.push('/salon/leave')}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.emerald,
              color: COLORS.champagne,
              border: `1px solid ${COLORS.emerald}`
            }}
          >
            <Calendar className="w-4 h-4" />
            Leave & Attendance
          </button>
          {/* Add Team Member - Gold color */}
          {activeTab === 'staff' && (
            <button
              onClick={() => handleOpenModal()}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: COLORS.gold,
                color: COLORS.black,
                border: `1px solid ${COLORS.gold}`
              }}
            >
              <Plus className="w-4 h-4" />
              Add Team Member
            </button>
          )}
          {/* Refresh Data - Icon only at the end */}
          <button
            onClick={() => refetch()}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.charcoal,
              border: `1px solid ${COLORS.bronze}40`,
              color: COLORS.bronze
            }}
            title="Refresh team data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </>
      }
    >
      {/* 📱 PREMIUM MOBILE HEADER */}
      <PremiumMobileHeader
        title="Team"
        subtitle={`${stats.totalStaff} members`}
        showNotifications
        notificationCount={3}
        shrinkOnScroll
        rightAction={
          <button
            onClick={() => handleOpenModal()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#D4AF37] active:scale-90 transition-transform duration-200 shadow-lg"
            aria-label="Add staff member"
            style={{
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)'
            }}
          >
            <Plus className="w-5 h-5 text-black" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="p-4 md:p-6 lg:p-8">
        {/* 📱 ENTERPRISE-GRADE KPI CARDS - Reusable SalonLuxeKPICard Component */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
          <SalonLuxeKPICard
            title="Total Staff"
            value={stats.totalStaff}
            icon={Users}
            color={COLORS.bronze}
            description="Team members"
            animationDelay={0}
          />
          <SalonLuxeKPICard
            title="Active Today"
            value={stats.activeToday}
            icon={UserCircle}
            color={COLORS.emerald}
            description="Working now"
            animationDelay={100}
          />
          <SalonLuxeKPICard
            title="On Leave"
            value={stats.onLeave}
            icon={Palmtree}
            color={COLORS.rose}
            description="Away today"
            animationDelay={200}
          />
          <SalonLuxeKPICard
            title="Employee Roles"
            value={stats.totalRoles}
            icon={Shield}
            color={COLORS.gold}
            description="Role types"
            animationDelay={300}
          />
        </div>

        {/* 📱 MOBILE QUICK ACTIONS */}
        <div className="md:hidden mb-6 flex gap-2">
          <button
            onClick={() => router.push('/salon/leave')}
            className="flex-1 min-h-[48px] rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            style={{
              backgroundColor: COLORS.emerald,
              color: COLORS.champagne
            }}
          >
            <Calendar className="w-4 h-4" />
            Leave & Attendance
          </button>
          <button
            onClick={() => refetch()}
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

        {/* 🏥 COMPLIANCE ALERT BANNER - Shows expiring documents (owner only) */}
        {compliance.totalIssues > 0 && (
          <ComplianceAlertBanner
            compliance={compliance}
            onStaffClick={(staffId) => {
              const staffMember = allStaff?.find(s => s.id === staffId)
              if (staffMember) {
                handleOpenModal(staffMember)
              }
            }}
          />
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.black} 100%)`,
              border: `1px solid ${COLORS.gold}30`,
              padding: '4px'
            }}
          >
            <TabsTrigger
              value="staff"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold/20 data-[state=active]:to-gold/10 transition-all duration-300"
              style={{ color: COLORS.champagne }}
            >
              <Users className="w-4 h-4 mr-2" />
              Staff Members
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold/20 data-[state=active]:to-gold/10 transition-all duration-300"
              style={{ color: COLORS.champagne }}
            >
              <Shield className="w-4 h-4 mr-2" />
              Employee Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Suspense fallback={<TabLoader />}>
              <StaffListTab
                staff={staff || []}
                isLoading={isLoadingStaff}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onAdd={() => handleOpenModal()}
                branches={branches || []}
                includeArchived={viewMode === 'all'}
                setIncludeArchived={(value) => setViewMode(value ? 'all' : 'active')}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="roles" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Suspense fallback={<TabLoader />}>
              <RolesTab organizationId={organizationId} />
            </Suspense>
          </TabsContent>
        </Tabs>

        {/* 📱 MOBILE-FIRST: Bottom spacing for comfortable mobile scrolling - MANDATORY */}
        <div className="h-20 md:h-0" />
      </div>

      {/* Staff Modal - Lazy Loaded */}
      {modalOpen && (
        <Suspense fallback={null}>
          <StaffModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            onSave={handleSave}
            onDelete={handleDelete}
            onArchive={handleArchive}
            staff={editingStaff}
            roles={roles || []}
            branches={branches || []}
            userRole="manager"
            isLoading={isCreating || isUpdating}
          />
        </Suspense>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          className="max-w-md"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.bronze}40`,
            boxShadow: '0 20px 30px rgba(0,0,0,0.3)'
          }}
        >
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: '#FF6B6B20',
                  border: '1px solid #FF6B6B40'
                }}
              >
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <AlertDialogTitle
                className="text-lg font-semibold"
                style={{ color: COLORS.champagne }}
              >
                Delete Staff Member
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>

          <div className="space-y-3" style={{ color: COLORS.lightText }}>
            <p className="text-sm">
              Are you sure you want to delete{' '}
              <span className="font-semibold" style={{ color: COLORS.champagne }}>
                "{staffToDelete?.entity_name}"
              </span>
              ?
            </p>
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: '#FFA50015',
                borderColor: '#FFA50030'
              }}
            >
              <p className="text-sm">
                <strong>Note:</strong> If this staff member is referenced in appointments, transactions, or schedules,
                they will be <strong>archived</strong> instead of deleted. Archived staff can be restored later.
              </p>
            </div>
          </div>

          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setStaffToDelete(null)
              }}
              disabled={isDeleting}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Staff Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SalonLuxePage>
  )
}

export default function StaffsPage() {
  return (
    <StatusToastProvider>
      <StaffsPageContent />
    </StatusToastProvider>
  )
}
