'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useHeraStaff, type StaffFormValues } from '@/hooks/useHeraStaff'
import { useHeraRoles, type RoleFormValues, type Role } from '@/hooks/useHeraRoles'
import { RoleModal } from './RoleModal'
import { StaffModal } from './StaffModal'
import { BranchSelector } from '@/components/salon/BranchSelector'
import {
  Plus,
  Clock,
  Calendar,
  UserCheck,
  TrendingUp,
  Users,
  Search,
  Edit,
  Trash2,
  Palmtree,
  ChevronRight,
  Shield,
  Settings,
  Building2,
  MapPin,
  MoreVertical,
  Archive,
  ArchiveRestore,
  X
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// Luxe color palette
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

interface StaffStats {
  totalStaff: number
  activeToday: number
  onLeave: number
  averageRating: number
}

function StaffContent() {
  const {
    user,
    organization,
    selectedBranchId,
    availableBranches,
    setSelectedBranchId,
    isLoadingBranches
  } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()
  const organizationId = organization?.id

  // State declarations (MUST be before hook calls that use them)
  const [searchTerm, setSearchTerm] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | undefined>()
  const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff')
  const [roleSearchTerm, setRoleSearchTerm] = useState('')
  const [staffModalOpen, setStaffModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)

  // Ensure default filter is "All Locations" on mount (run once)
  React.useEffect(() => {
    // Always set to null on first mount to show all staff
    setSelectedBranchId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 🎯 ENTERPRISE PATTERN: Fetch ALL staff for global KPIs (dashboard metrics)
  // This provides the "big picture" regardless of tab/filter selection
  // NO filters applied to KPIs - always show complete organization data
  const { staff: allStaffForKPIs, isLoading: isLoadingKPIs } = useHeraStaff({
    organizationId: organizationId || '',
    filters: {
      branch_id: undefined // No branch filter for KPIs
    },
    includeArchived: true // Get ALL staff (active + archived) for accurate KPIs
  })

  // Fetch filtered staff for display list (controlled by tab + user filters)
  const {
    staff,
    isLoading,
    error,
    createStaff,
    updateStaff,
    deleteStaff,
    archiveStaff,
    restoreStaff,
    isCreating,
    isUpdating,
    isDeleting,
    refetch
  } = useHeraStaff({
    organizationId: organizationId || '',
    filters: {
      // Only add branch_id filter if a specific branch is selected
      ...(selectedBranchId && selectedBranchId !== null ? { branch_id: selectedBranchId } : {})
    },
    includeArchived // Tab controls list, not KPIs
  })

  // 🎯 ENTERPRISE PATTERN: Fetch ALL roles for global KPIs (dashboard metrics)
  const { roles: allRolesForKPIs, isLoading: isLoadingRolesKPIs } = useHeraRoles({
    organizationId: organizationId || '',
    includeInactive: true, // Get ALL roles for accurate KPIs
    userRole: 'manager'
  })

  // Fetch filtered roles for display (controlled by tab)
  const {
    roles,
    isLoading: isLoadingRoles,
    createRole,
    updateRole,
    deleteRole,
    archiveRole,
    restoreRole,
    isCreating: isCreatingRole,
    isUpdating: isUpdatingRole,
    isDeleting: isDeletingRole
  } = useHeraRoles({
    organizationId: organizationId || '',
    includeInactive: includeArchived, // Tab controls list, not KPIs
    userRole: 'manager'
  })

  // Calculate stats from ALL staff data - memoized for performance
  // 🎯 ENTERPRISE DASHBOARD PATTERN: KPIs show GLOBAL metrics, independent of tab/filter
  // Tab selection controls the LIST below, not the dashboard metrics
  // This is standard enterprise UX where KPIs = "big picture", Filters = "drill-down"
  const stats: StaffStats = useMemo(
    () => ({
      totalStaff: allStaffForKPIs?.length || 0,
      activeToday: allStaffForKPIs?.filter(s => s && s.status === 'active').length || 0,
      onLeave: allStaffForKPIs?.filter(s => s && s.status === 'on_leave').length || 0,
      averageRating: 4.8
    }),
    [allStaffForKPIs]
  )

  const handleSaveStaff = async (staffData: StaffFormValues) => {
    if (!organizationId) return

    // Construct staff name from first_name and last_name (matching the createStaff pattern)
    const staffName =
      staffData.full_name ||
      `${staffData.first_name || ''} ${staffData.last_name || ''}`.trim() ||
      'Staff member'

    // If no branches selected, assign to ALL available branches
    const branchIds =
      staffData.branch_ids && staffData.branch_ids.length > 0
        ? staffData.branch_ids
        : availableBranches.map(b => b.id)

    const staffDataWithBranches = {
      ...staffData,
      branch_ids: branchIds
    }

    const loadingId = showLoading(
      editingStaff ? 'Updating staff member...' : 'Creating staff member...',
      'Please wait while we save your changes'
    )

    try {
      if (editingStaff) {
        // Update existing staff
        await updateStaff(editingStaff.id, staffDataWithBranches)
        removeToast(loadingId)
        showSuccess('Staff member updated successfully', `${staffName} has been updated`)
      } else {
        // Create new staff
        await createStaff(staffDataWithBranches)
        removeToast(loadingId)
        showSuccess('Staff member created successfully', `${staffName} has been added to your team`)
      }

      setStaffModalOpen(false)
      setEditingStaff(null)
      // 🎯 ENTERPRISE PATTERN: No explicit refetch needed - mutation auto-invalidates queries
    } catch (error) {
      console.error('Error saving staff:', error)
      removeToast(loadingId)
      showError(
        editingStaff ? 'Failed to update staff member' : 'Failed to create staff member',
        error instanceof Error ? error.message : 'Please try again or contact support'
      )
      throw error // Re-throw so modal knows to stay open
    }
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!organizationId) return

    const staffMember = staff?.find(s => s.id === staffId)
    const staffName = staffMember?.entity_name || 'Staff member'

    const loadingId = showLoading('Deleting staff member...', 'This action cannot be undone')

    try {
      // 🎯 ENTERPRISE PATTERN: Smart delete with automatic fallback to archive
      // Same pattern as services page for consistency
      const result = await deleteStaff(staffId, 'Permanently delete staff member')
      removeToast(loadingId)

      if (result.archived) {
        // Staff was archived instead of deleted (referenced in appointments/transactions)
        showSuccess('Staff member archived', result.message || `${staffName} has been archived`)
      } else {
        // Staff was successfully deleted
        showSuccess('Staff member deleted', `${staffName} has been permanently removed`)
      }
      // 🎯 ENTERPRISE PATTERN: No explicit refetch needed - mutation auto-invalidates queries
    } catch (error: any) {
      // 🎯 ENTERPRISE PATTERN: Don't log or show errors for successful archive fallbacks
      const isArchiveSuccess =
        error.message?.includes('archived') ||
        error.message?.includes('referenced') ||
        error.code === 'TRANSACTION_INTEGRITY_VIOLATION'

      if (!isArchiveSuccess) {
        console.error('Error deleting staff:', error)
        removeToast(loadingId)
        showError(
          'Failed to delete staff member',
          error instanceof Error ? error.message : 'Please try again'
        )
        throw error
      }
      // If archive fallback succeeded, the success toast was already shown by deleteStaff
    }
  }

  const handleArchiveStaff = async (staffId: string) => {
    if (!organizationId) return

    const staffMember = staff?.find(s => s.id === staffId)
    const staffName = staffMember?.entity_name || 'Staff member'

    const loadingId = showLoading('Archiving staff member...', 'Please wait')

    try {
      await archiveStaff(staffId)
      // 🎯 ENTERPRISE PATTERN: No explicit refetch needed - mutation auto-invalidates queries
      // Same pattern as services page for consistency
      removeToast(loadingId)
      showSuccess('Staff member archived', `${staffName} has been archived`)
    } catch (error) {
      console.error('Error archiving staff:', error)
      removeToast(loadingId)
      showError(
        'Failed to archive staff member',
        error instanceof Error ? error.message : 'Please try again'
      )
      // ✅ Don't throw - let modal/dropdown handle UI state
    }
  }

  const handleRestoreStaff = async (staffId: string) => {
    if (!organizationId) return

    const staffMember = staff?.find(s => s.id === staffId)
    const staffName = staffMember?.entity_name || 'Staff member'

    const loadingId = showLoading('Restoring staff member...', 'Please wait')

    try {
      await restoreStaff(staffId)
      // 🎯 ENTERPRISE PATTERN: No explicit refetch needed - mutation auto-invalidates queries
      // Same pattern as services page for consistency
      removeToast(loadingId)
      showSuccess('Staff member restored', `${staffName} has been restored`)
    } catch (error) {
      console.error('Error restoring staff:', error)
      removeToast(loadingId)
      showError(
        'Failed to restore staff member',
        error instanceof Error ? error.message : 'Please try again'
      )
      // ✅ Don't throw - let modal/dropdown handle UI state
    }
  }

  // Role modal handlers
  const handleOpenRoleModal = (role?: Role) => {
    setSelectedRole(role)
    setRoleModalOpen(true)
  }

  const handleCloseRoleModal = () => {
    setSelectedRole(undefined)
    setRoleModalOpen(false)
  }

  const handleSaveRole = async (roleData: RoleFormValues) => {
    if (!organizationId) return

    const loadingId = showLoading(
      selectedRole ? 'Updating role...' : 'Creating role...',
      'Please wait'
    )

    try {
      if (selectedRole) {
        await updateRole(selectedRole.id, roleData)
        removeToast(loadingId)
        showSuccess('Role updated successfully', `${roleData.title} has been updated`)
      } else {
        await createRole(roleData)
        removeToast(loadingId)
        showSuccess('Role created successfully', `${roleData.title} has been added`)
      }
    } catch (error) {
      console.error('Error saving role:', error)
      removeToast(loadingId)
      showError(
        selectedRole ? 'Failed to update role' : 'Failed to create role',
        error instanceof Error ? error.message : 'Please try again or contact support'
      )
      throw error
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!organizationId) return

    const role = roles?.find(r => r.id === roleId)
    const roleName = role?.title || role?.entity_name || 'Role'

    const loadingId = showLoading('Deleting role...', 'This action cannot be undone')

    try {
      await deleteRole(roleId)
      removeToast(loadingId)
      showSuccess('Role deleted', `${roleName} has been removed`)
    } catch (error) {
      console.error('Error deleting role:', error)
      removeToast(loadingId)
      showError(
        'Failed to delete role',
        error instanceof Error ? error.message : 'Please try again'
      )
      throw error
    }
  }

  const handleArchiveRole = async (roleId: string) => {
    if (!organizationId) return

    const role = roles?.find(r => r.id === roleId)
    const roleName = role?.title || role?.entity_name || 'Role'

    const loadingId = showLoading('Archiving role...', 'Please wait')

    try {
      await archiveRole(roleId)
      removeToast(loadingId)
      showSuccess('Role archived', `${roleName} has been archived`)
    } catch (error) {
      console.error('Error archiving role:', error)
      removeToast(loadingId)
      showError(
        'Failed to archive role',
        error instanceof Error ? error.message : 'Please try again'
      )
      // ✅ Don't throw - let dropdown handle UI state
    }
  }

  const handleRestoreRole = async (roleId: string) => {
    if (!organizationId) return

    const role = roles?.find(r => r.id === roleId)
    const roleName = role?.title || role?.entity_name || 'Role'

    const loadingId = showLoading('Restoring role...', 'Please wait')

    try {
      await restoreRole(roleId)
      removeToast(loadingId)
      showSuccess('Role restored', `${roleName} has been restored`)
    } catch (error) {
      console.error('Error restoring role:', error)
      removeToast(loadingId)
      showError(
        'Failed to restore role',
        error instanceof Error ? error.message : 'Please try again'
      )
      // ✅ Don't throw - let dropdown handle UI state
    }
  }

  // Memoized filtered lists for performance
  const filteredStaff = useMemo(
    () =>
      staff?.filter(s => {
        // Search filter
        const matchesSearch =
          s.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.role_title?.toLowerCase().includes(searchTerm.toLowerCase())

        // Branch filter - TODO: Update this to use relationships once staff are linked to branches
        // For now, all staff are shown regardless of selected branch
        return matchesSearch
      }) || [],
    [staff, searchTerm]
  )

  const filteredRoles = useMemo(
    () =>
      roles?.filter(
        r =>
          r.title?.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
          r.entity_name?.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
          r.description?.toLowerCase().includes(roleSearchTerm.toLowerCase())
      ) || [],
    [roles, roleSearchTerm]
  )

  // Calculate staff count per role - memoized for performance
  // 🎯 ENTERPRISE PATTERN: Use ALL staff for accurate role assignment counts
  const getStaffCountForRole = useCallback(
    (roleId: string) => {
      const role = roles?.find(r => r.id === roleId) || allRolesForKPIs?.find(r => r.id === roleId)
      if (!role) return 0

      return (
        allStaffForKPIs?.filter(s => {
          // First check if there's a direct role_id match
          if (s.role_id === roleId) return true

          // Then check if role_title matches this role's title or entity_name
          const roleTitle = s.role_title?.toLowerCase() || ''
          const thisRoleTitle = role.title?.toLowerCase() || ''
          const thisRoleEntityName = role.entity_name?.toLowerCase() || ''

          return roleTitle && (roleTitle === thisRoleTitle || roleTitle === thisRoleEntityName)
        }).length || 0
      )
    },
    [roles, allRolesForKPIs, allStaffForKPIs]
  )

  // Role stats from ALL roles - memoized for performance
  // 🎯 ENTERPRISE DASHBOARD PATTERN: KPIs show GLOBAL metrics, independent of tab/filter
  // Tab selection controls the LIST below, not the dashboard metrics
  const roleStats = useMemo(
    () => ({
      totalRoles: allRolesForKPIs?.length || 0,
      activeRoles: allRolesForKPIs?.filter(r => r.status === 'active').length || 0,
      archivedRoles:
        allRolesForKPIs?.filter(r => r.status === 'archived' || r.status === 'inactive').length || 0
    }),
    [allRolesForKPIs]
  )

  if (!organizationId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.black }}
      >
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
          <p style={{ color: COLORS.lightText, opacity: 0.7 }}>Setting up staff management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.black }}>
      <style jsx>{`
        input::placeholder,
        textarea::placeholder {
          color: ${COLORS.bronze} !important;
          opacity: 0.7 !important;
        }
        input::-webkit-input-placeholder,
        textarea::-webkit-input-placeholder {
          color: ${COLORS.bronze} !important;
          opacity: 0.7 !important;
        }
        input::-moz-placeholder,
        textarea::-moz-placeholder {
          color: ${COLORS.bronze} !important;
          opacity: 0.7 !important;
        }
        input:-ms-input-placeholder,
        textarea:-ms-input-placeholder {
          color: ${COLORS.bronze} !important;
          opacity: 0.7 !important;
        }
      `}</style>
      <div
        className="rounded-2xl p-8"
        style={{
          backgroundColor: COLORS.charcoal,
          border: `1px solid ${COLORS.gold}20`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{
                background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Staff Management
            </h1>
            <p style={{ color: COLORS.bronze }}>Manage staff members and roles</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => (window.location.href = '/salon/leave1')}
              style={{
                background: `linear-gradient(135deg, ${COLORS.emerald} 0%, ${COLORS.emerald}DD 100%)`,
                color: COLORS.champagne,
                border: 'none'
              }}
              className="hover:opacity-90"
            >
              <Palmtree className="w-4 h-4 mr-2" />
              Manage Leave
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            {activeTab === 'staff' ? (
              <>
                <Button
                  onClick={() => {
                    setEditingStaff(null)
                    setStaffModalOpen(true)
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                    color: COLORS.black,
                    border: 'none'
                  }}
                  className="hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff Member
                </Button>

                <StaffModal
                  open={staffModalOpen}
                  onOpenChange={setStaffModalOpen}
                  onSave={handleSaveStaff}
                  onDelete={handleDeleteStaff}
                  onArchive={handleArchiveStaff}
                  staff={editingStaff}
                  roles={roles || []}
                  branches={availableBranches || []}
                  userRole="manager"
                  isLoading={isCreating || isUpdating}
                />
              </>
            ) : (
              <Button
                onClick={() => handleOpenRoleModal()}
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black,
                  border: 'none'
                }}
                className="hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Role
              </Button>
            )}
          </div>
        </div>

        {/* Enterprise Tabs */}
        <div className="mb-6">
          <div
            className="flex gap-2 p-1 rounded-lg"
            style={{
              backgroundColor: COLORS.black,
              border: `1px solid ${COLORS.gold}20`
            }}
          >
            <button
              onClick={() => setActiveTab('staff')}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all duration-200',
                activeTab === 'staff' ? 'shadow-lg' : 'hover:bg-opacity-50'
              )}
              style={{
                backgroundColor: activeTab === 'staff' ? COLORS.gold : 'transparent',
                color: activeTab === 'staff' ? COLORS.black : COLORS.champagne
              }}
            >
              <Users className="w-4 h-4" />
              Staff Members
              <Badge
                className="ml-2"
                style={{
                  backgroundColor: activeTab === 'staff' ? COLORS.black : COLORS.charcoalLight,
                  color: activeTab === 'staff' ? COLORS.gold : COLORS.bronze,
                  border: 'none'
                }}
              >
                {stats.totalStaff}
              </Badge>
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all duration-200',
                activeTab === 'roles' ? 'shadow-lg' : 'hover:bg-opacity-50'
              )}
              style={{
                backgroundColor: activeTab === 'roles' ? COLORS.gold : 'transparent',
                color: activeTab === 'roles' ? COLORS.black : COLORS.champagne
              }}
            >
              <Shield className="w-4 h-4" />
              Roles
              <Badge
                className="ml-2"
                style={{
                  backgroundColor: activeTab === 'roles' ? COLORS.black : COLORS.charcoalLight,
                  color: activeTab === 'roles' ? COLORS.gold : COLORS.bronze,
                  border: 'none'
                }}
              >
                {roleStats.totalRoles}
              </Badge>
            </button>
          </div>
        </div>

        {/* Staff Tab Content */}
        {activeTab === 'staff' && (
          <>
            {/* Stats Cards - Luxe Gradient Design */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                {
                  title: 'Total Staff',
                  value: stats.totalStaff,
                  desc: 'Team members',
                  icon: Users,
                  gradient: `linear-gradient(135deg, ${COLORS.gold}15 0%, ${COLORS.emerald}15 100%)`
                },
                {
                  title: 'Active Today',
                  value: stats.activeToday,
                  desc: 'Working now',
                  icon: UserCheck,
                  gradient: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.goldDark}10 100%)`
                },
                {
                  title: 'On Leave',
                  value: stats.onLeave,
                  desc: 'Away today',
                  icon: Calendar,
                  gradient: `linear-gradient(135deg, ${COLORS.bronze}15 0%, ${COLORS.rose}15 100%)`
                },
                {
                  title: 'Avg Rating',
                  value: stats.averageRating,
                  desc: 'Out of 5.0',
                  icon: TrendingUp,
                  gradient: `linear-gradient(135deg, ${COLORS.champagne}15 0%, ${COLORS.gold}15 100%)`
                }
              ].map((stat, index) => (
                <Card
                  key={index}
                  className="group transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-4"
                  style={{
                    background: stat.gradient,
                    backgroundColor: COLORS.charcoalLight,
                    border: `1px solid ${COLORS.gold}30`,
                    boxShadow: `0 4px 20px ${COLORS.black}40`,
                    backdropFilter: 'blur(10px)',
                    animationDelay: `${index * 100}ms`,
                    animationDuration: '600ms'
                  }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle
                      className="text-sm font-semibold tracking-wide transition-colors duration-300 group-hover:text-champagne"
                      style={{ color: COLORS.bronze }}
                    >
                      {stat.title}
                    </CardTitle>
                    <div
                      className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                      style={{
                        backgroundColor: `${COLORS.gold}20`,
                        border: `1px solid ${COLORS.gold}40`
                      }}
                    >
                      <stat.icon className="h-5 w-5" style={{ color: COLORS.gold }} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-3xl font-bold mb-1 transition-all duration-300 group-hover:scale-110"
                      style={{ color: COLORS.champagne }}
                    >
                      {stat.value}
                    </div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: COLORS.bronze, opacity: 0.8 }}
                    >
                      {stat.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Search and Filters - Luxe Design */}
            <div className="mb-8 space-y-4">
              {/* Archive Toggle and Search */}
              <div
                className="flex items-center justify-between gap-4 p-4 rounded-xl backdrop-blur-xl"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalLight}90 0%, ${COLORS.charcoal}90 100%)`,
                  border: `1px solid ${COLORS.gold}20`,
                  boxShadow: `0 4px 12px ${COLORS.black}40`
                }}
              >
                <div className="flex items-center gap-4">
                  <Tabs
                    value={includeArchived ? 'all' : 'active'}
                    onValueChange={v => setIncludeArchived(v === 'all')}
                  >
                    <TabsList
                      className="transition-all duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.black} 100%)`,
                        border: `1px solid ${COLORS.gold}30`,
                        padding: '4px'
                      }}
                    >
                      <TabsTrigger
                        value="active"
                        className="transition-all duration-300 data-[state=active]:bg-gradient-to-r"
                        style={{
                          color: COLORS.champagne
                        }}
                      >
                        Active
                      </TabsTrigger>
                      <TabsTrigger
                        value="all"
                        className="transition-all duration-300 data-[state=active]:bg-gradient-to-r"
                        style={{
                          color: COLORS.champagne
                        }}
                      >
                        All Staff
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex items-center gap-2">
                    {selectedBranchId && (
                      <div
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-2"
                        style={{
                          backgroundColor: COLORS.gold + '20',
                          borderColor: COLORS.gold + '40',
                          color: COLORS.champagne
                        }}
                      >
                        <Building2 className="h-3 w-3" style={{ color: COLORS.gold }} />
                        <span>
                          {availableBranches.find(b => b.id === selectedBranchId)?.entity_name ||
                            'Branch'}
                        </span>
                        <button
                          onClick={() => setSelectedBranchId(null)}
                          className="ml-1 hover:scale-110 active:scale-95 transition-all duration-200 rounded-full p-0.5 hover:bg-gold/20"
                          aria-label="Clear branch filter"
                        >
                          <X className="h-3 w-3" style={{ color: COLORS.gold }} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative flex-1 max-w-md">
                  <Search
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-all duration-300"
                    style={{ color: COLORS.gold }}
                  />
                  <Input
                    placeholder="Search by name or role..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 border-0 outline-none transition-all duration-300 focus:ring-2 focus:scale-[1.02]"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.black} 100%)`,
                      border: `1px solid ${COLORS.gold}30`,
                      color: COLORS.champagne,
                      borderRadius: '0.75rem',
                      boxShadow: `inset 0 2px 8px ${COLORS.black}40`,
                      ringColor: `${COLORS.gold}40`
                    }}
                  />
                </div>

                <BranchSelector variant="default" />
              </div>
            </div>

            {/* Staff List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2"
                  style={{ borderColor: COLORS.gold }}
                />
                <span className="ml-3" style={{ color: COLORS.bronze }}>
                  Loading staff data...
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStaff.map((member, index) => {
                  const isArchived = member.status === 'archived'
                  return (
                    <Card
                      key={member.id}
                      className="group relative overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl animate-in fade-in slide-in-from-bottom-3"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoal} 100%)`,
                        border: `1px solid ${isArchived ? COLORS.bronze + '30' : COLORS.gold + '30'}`,
                        boxShadow: `0 8px 24px ${COLORS.black}60`,
                        backdropFilter: 'blur(10px)',
                        animationDelay: `${index * 80}ms`,
                        animationDuration: '500ms'
                      }}
                    >
                      {/* Gradient Overlay */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at top right, ${COLORS.gold}15 0%, transparent 70%)`
                        }}
                      />

                      {/* Archived Badge */}
                      {isArchived && (
                        <div className="absolute top-3 right-3 z-10">
                          <Badge
                            className="text-xs font-semibold"
                            style={{
                              backgroundColor: `${COLORS.bronze}30`,
                              color: COLORS.bronze,
                              border: `1px solid ${COLORS.bronze}60`
                            }}
                          >
                            Archived
                          </Badge>
                        </div>
                      )}

                      <CardContent className="p-6 relative z-10">
                        <div className="flex items-start space-x-4">
                          <div className="relative">
                            <Avatar
                              className="h-14 w-14 ring-2 transition-all duration-300 group-hover:ring-4 group-hover:scale-110"
                              style={{
                                backgroundColor: COLORS.gold,
                                color: COLORS.black,
                                ringColor: `${COLORS.gold}40`
                              }}
                            >
                              <AvatarFallback
                                className="font-bold text-lg"
                                style={{ backgroundColor: COLORS.gold, color: COLORS.black }}
                              >
                                {member.entity_name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {/* Active Status Indicator */}
                            {!isArchived && member.status === 'active' && (
                              <div
                                className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 animate-pulse"
                                style={{
                                  backgroundColor: COLORS.emerald,
                                  borderColor: COLORS.charcoalLight
                                }}
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3
                                className="font-bold text-lg transition-colors duration-300 group-hover:text-gold"
                                style={{ color: COLORS.champagne }}
                              >
                                {member.entity_name}
                              </h3>
                              {member.status === 'on_leave' && (
                                <Badge
                                  className="ml-2 animate-in fade-in"
                                  style={{
                                    backgroundColor: `${COLORS.rose}20`,
                                    color: COLORS.rose,
                                    border: `1px solid ${COLORS.rose}40`,
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  <Palmtree className="w-3 h-3 mr-1" />
                                  On Leave
                                </Badge>
                              )}
                            </div>
                            <Badge
                              className="mt-2 transition-all duration-300 group-hover:scale-105"
                              style={{
                                background: `linear-gradient(135deg, ${COLORS.emerald}20 0%, ${COLORS.gold}10 100%)`,
                                color: COLORS.emerald,
                                border: `1px solid ${COLORS.emerald}40`,
                                fontWeight: 600
                              }}
                            >
                              {member.role_title || 'Staff Member'}
                            </Badge>
                            {/* Contact and Additional Info */}
                            <div
                              className="mt-4 space-y-2 text-sm transition-all duration-300 group-hover:text-champagne"
                              style={{ color: COLORS.bronze }}
                            >
                              {member.phone && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs">📱</span>
                                  <span className="font-medium">{member.phone}</span>
                                </div>
                              )}
                              {member.email && (
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-xs">✉️</span>
                                  <span className="font-medium truncate">{member.email}</span>
                                </div>
                              )}

                              {/* Only show this section if there's rate or skills */}
                              {((member.display_rate && member.display_rate > 0) ||
                                (member.skills && member.skills.length > 0)) && (
                                <div
                                  className="flex gap-4 mt-3 pt-3 border-t"
                                  style={{ borderColor: `${COLORS.bronze}20` }}
                                >
                                  {member.display_rate && member.display_rate > 0 && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs">💰</span>
                                      <span className="font-bold" style={{ color: COLORS.gold }}>
                                        AED {member.display_rate}/hr
                                      </span>
                                    </div>
                                  )}
                                  {member.skills && member.skills.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs">🎨</span>
                                      <span className="text-xs">
                                        {member.skills.slice(0, 2).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Only show hire date if it exists */}
                            {member.hire_date && (
                              <div
                                className="mt-4 pt-3 text-xs flex items-center justify-between border-t"
                                style={{
                                  color: COLORS.bronze,
                                  opacity: 0.6,
                                  borderColor: `${COLORS.bronze}20`
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    Joined {format(new Date(member.hire_date), 'MMM d, yyyy')}
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="mt-4 flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                    style={{
                                      background: `linear-gradient(135deg, ${COLORS.gold}15 0%, transparent 100%)`,
                                      borderColor: COLORS.gold + '40',
                                      color: COLORS.champagne,
                                      backdropFilter: 'blur(10px)'
                                    }}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="backdrop-blur-xl"
                                  style={{
                                    background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.charcoalDark} 100%)`,
                                    border: `1px solid ${COLORS.gold}40`,
                                    boxShadow: `0 8px 32px ${COLORS.black}80`
                                  }}
                                >
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingStaff(member)
                                      setStaffModalOpen(true)
                                    }}
                                    style={{ color: COLORS.lightText }}
                                    className="hover:!bg-cyan-900/30 hover:!text-cyan-300 transition-all duration-200 cursor-pointer"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span className="font-medium">Edit</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator
                                    style={{ backgroundColor: COLORS.gold + '20' }}
                                  />

                                  {member.status === 'archived' ? (
                                    <DropdownMenuItem
                                      onClick={() => handleRestoreStaff(member.id)}
                                      style={{ color: COLORS.lightText }}
                                      className="hover:!bg-green-900/30 hover:!text-green-300 transition-all duration-200 cursor-pointer"
                                    >
                                      <ArchiveRestore className="mr-2 h-4 w-4" />
                                      <span className="font-medium">Restore</span>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => handleArchiveStaff(member.id)}
                                      style={{ color: COLORS.lightText }}
                                      className="hover:!bg-yellow-900/30 hover:!text-yellow-300 transition-all duration-200 cursor-pointer"
                                    >
                                      <Archive className="mr-2 h-4 w-4" />
                                      <span className="font-medium">Archive</span>
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuSeparator
                                    style={{ backgroundColor: COLORS.gold + '20' }}
                                  />

                                  <DropdownMenuItem
                                    onClick={() => handleDeleteStaff(member.id)}
                                    className="hover:!bg-red-900/30 hover:!text-red-300 transition-all duration-200 cursor-pointer"
                                    style={{ color: '#FF6B6B' }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span className="font-medium">Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Empty State - Luxe Design */}
            {!isLoading && filteredStaff.length === 0 && (
              <div
                className="text-center py-20 rounded-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-700"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalLight}60 0%, ${COLORS.charcoal}60 100%)`,
                  border: `1px solid ${COLORS.gold}20`,
                  boxShadow: `0 8px 32px ${COLORS.black}40`
                }}
              >
                <div
                  className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center animate-pulse"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.bronze}20 100%)`,
                    border: `2px solid ${COLORS.gold}40`
                  }}
                >
                  <Users className="h-10 w-10" style={{ color: COLORS.gold }} />
                </div>
                <h3
                  className="text-2xl font-bold mb-3 tracking-wide"
                  style={{ color: COLORS.champagne }}
                >
                  No staff members found
                </h3>
                <p
                  className="text-base font-medium mb-6"
                  style={{ color: COLORS.bronze, opacity: 0.8 }}
                >
                  {searchTerm
                    ? 'Try adjusting your search terms or filters'
                    : 'Click below to build your dream team'}
                </p>
                {!searchTerm && (
                  <Button
                    className="mt-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                    onClick={() => {
                      setEditingStaff(null)
                      setStaffModalOpen(true)
                    }}
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                      color: COLORS.black,
                      border: 'none',
                      padding: '1rem 2rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: `0 4px 16px ${COLORS.gold}40`
                    }}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Your First Staff Member
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* Roles Tab Content - Enterprise Grade */}
        {activeTab === 'roles' && (
          <>
            {/* Role Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  title: 'Total Roles',
                  value: roleStats.totalRoles,
                  desc: 'Defined roles',
                  icon: Shield,
                  color: COLORS.gold
                },
                {
                  title: 'Active',
                  value: roleStats.activeRoles,
                  desc: 'In use',
                  icon: UserCheck,
                  color: COLORS.emerald
                },
                {
                  title: 'Archived',
                  value: roleStats.archivedRoles,
                  desc: includeArchived ? 'Archived roles' : 'Not shown',
                  icon: Archive,
                  color: COLORS.bronze
                }
              ].map((stat, index) => (
                <Card
                  key={index}
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    border: `1px solid ${COLORS.gold}20`,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium" style={{ color: COLORS.bronze }}>
                      {stat.title}
                    </CardTitle>
                    <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
                      {stat.value}
                    </div>
                    <p className="text-xs" style={{ color: COLORS.bronze }}>
                      {stat.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Archive Toggle and Role Search */}
            <div className="mb-8 space-y-4">
              <div
                className="flex items-center justify-between gap-4 p-4 rounded-xl backdrop-blur-xl"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalLight}90 0%, ${COLORS.charcoal}90 100%)`,
                  border: `1px solid ${COLORS.gold}20`,
                  boxShadow: `0 4px 12px ${COLORS.black}40`
                }}
              >
                <div className="flex items-center gap-4">
                  <Tabs
                    value={includeArchived ? 'all' : 'active'}
                    onValueChange={v => setIncludeArchived(v === 'all')}
                  >
                    <TabsList
                      className="transition-all duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.black} 100%)`,
                        border: `1px solid ${COLORS.gold}30`,
                        padding: '4px'
                      }}
                    >
                      <TabsTrigger
                        value="active"
                        className="transition-all duration-300 data-[state=active]:bg-gradient-to-r"
                        style={{
                          color: COLORS.champagne
                        }}
                      >
                        Active Roles
                      </TabsTrigger>
                      <TabsTrigger
                        value="all"
                        className="transition-all duration-300 data-[state=active]:bg-gradient-to-r"
                        style={{
                          color: COLORS.champagne
                        }}
                      >
                        All Roles
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="relative flex-1 max-w-md">
                  <Search
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-all duration-300"
                    style={{ color: COLORS.gold }}
                  />
                  <Input
                    placeholder="Search roles by title, description..."
                    value={roleSearchTerm}
                    onChange={e => setRoleSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 border-0 outline-none transition-all duration-300 focus:ring-2 focus:scale-[1.02]"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.black} 100%)`,
                      border: `1px solid ${COLORS.gold}30`,
                      color: COLORS.champagne,
                      borderRadius: '0.75rem',
                      boxShadow: `inset 0 2px 8px ${COLORS.black}40`,
                      ringColor: `${COLORS.gold}40`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Enterprise Roles Table */}
            {isLoadingRoles ? (
              <div className="flex items-center justify-center py-12">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2"
                  style={{ borderColor: COLORS.gold }}
                />
                <span className="ml-3" style={{ color: COLORS.bronze }}>
                  Loading roles...
                </span>
              </div>
            ) : filteredRoles && filteredRoles.length > 0 ? (
              <Card
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${COLORS.gold}20`,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
                }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2" style={{ borderColor: COLORS.gold + '30' }}>
                        <th
                          className="text-left py-4 px-6 font-semibold text-sm uppercase tracking-wider"
                          style={{ color: COLORS.champagne }}
                        >
                          Role
                        </th>
                        <th
                          className="text-left py-4 px-6 font-semibold text-sm uppercase tracking-wider"
                          style={{ color: COLORS.champagne }}
                        >
                          Description
                        </th>
                        <th
                          className="text-center py-4 px-6 font-semibold text-sm uppercase tracking-wider"
                          style={{ color: COLORS.champagne }}
                        >
                          Staff Count
                        </th>
                        <th
                          className="text-center py-4 px-6 font-semibold text-sm uppercase tracking-wider"
                          style={{ color: COLORS.champagne }}
                        >
                          Rank
                        </th>
                        <th
                          className="text-center py-4 px-6 font-semibold text-sm uppercase tracking-wider"
                          style={{ color: COLORS.champagne }}
                        >
                          Status
                        </th>
                        <th
                          className="text-right py-4 px-6 font-semibold text-sm uppercase tracking-wider"
                          style={{ color: COLORS.champagne }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoles.map((role, index) => {
                        const isArchived = role.status === 'archived' || role.status === 'inactive'
                        return (
                          <tr
                            key={role.id}
                            className="border-b transition-all duration-200 hover:shadow-md"
                            style={{
                              borderColor: COLORS.gold + '10',
                              backgroundColor:
                                index % 2 === 0 ? 'transparent' : COLORS.black + '40',
                              opacity: isArchived ? 0.7 : 1
                            }}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div
                                  className="p-2 rounded-lg"
                                  style={{
                                    backgroundColor: isArchived
                                      ? COLORS.bronze + '20'
                                      : COLORS.gold + '20',
                                    border: `1px solid ${isArchived ? COLORS.bronze : COLORS.gold}40`
                                  }}
                                >
                                  <Shield
                                    className="h-4 w-4"
                                    style={{ color: isArchived ? COLORS.bronze : COLORS.gold }}
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="font-semibold"
                                      style={{ color: COLORS.champagne }}
                                    >
                                      {role.title || role.entity_name}
                                    </span>
                                    {isArchived && (
                                      <Badge
                                        className="text-xs font-semibold"
                                        style={{
                                          backgroundColor: `${COLORS.bronze}30`,
                                          color: COLORS.bronze,
                                          border: `1px solid ${COLORS.bronze}60`
                                        }}
                                      >
                                        Archived
                                      </Badge>
                                    )}
                                  </div>
                                  {role.rank && (
                                    <div className="text-xs mt-1" style={{ color: COLORS.bronze }}>
                                      Priority Level {role.rank}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm max-w-md" style={{ color: COLORS.bronze }}>
                                {role.description || (
                                  <span style={{ opacity: 0.5 }}>No description provided</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all duration-300 hover:scale-105"
                                style={{
                                  backgroundColor:
                                    getStaffCountForRole(role.id) > 0
                                      ? COLORS.gold + '20'
                                      : COLORS.bronze + '10',
                                  color:
                                    getStaffCountForRole(role.id) > 0 ? COLORS.gold : COLORS.bronze,
                                  border: `2px solid ${getStaffCountForRole(role.id) > 0 ? COLORS.gold + '40' : COLORS.bronze + '30'}`
                                }}
                              >
                                <Users className="w-4 h-4" />
                                <span className="text-lg">{getStaffCountForRole(role.id)}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div
                                className="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold"
                                style={{
                                  backgroundColor: COLORS.emerald + '20',
                                  color: COLORS.emerald,
                                  border: `2px solid ${COLORS.emerald}40`
                                }}
                              >
                                {role.rank || '-'}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <Badge
                                className="font-medium"
                                style={{
                                  backgroundColor: isArchived
                                    ? COLORS.bronze + '20'
                                    : COLORS.emerald + '20',
                                  color: isArchived ? COLORS.bronze : COLORS.emerald,
                                  border: `1px solid ${isArchived ? COLORS.bronze : COLORS.emerald}40`,
                                  fontSize: '0.75rem',
                                  padding: '0.25rem 0.75rem'
                                }}
                              >
                                {isArchived ? 'Archived' : 'Active'}
                              </Badge>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                      style={{
                                        background: `linear-gradient(135deg, ${COLORS.gold}15 0%, transparent 100%)`,
                                        borderColor: COLORS.gold + '40',
                                        color: COLORS.champagne,
                                        backdropFilter: 'blur(10px)'
                                      }}
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="backdrop-blur-xl"
                                    style={{
                                      background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.charcoalDark} 100%)`,
                                      border: `1px solid ${COLORS.gold}40`,
                                      boxShadow: `0 8px 32px ${COLORS.black}80`
                                    }}
                                  >
                                    <DropdownMenuItem
                                      onClick={() => handleOpenRoleModal(role)}
                                      style={{ color: COLORS.lightText }}
                                      className="hover:!bg-cyan-900/30 hover:!text-cyan-300 transition-all duration-200 cursor-pointer"
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      <span className="font-medium">Edit</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator
                                      style={{ backgroundColor: COLORS.gold + '20' }}
                                    />

                                    {role.status === 'archived' || role.status === 'inactive' ? (
                                      <DropdownMenuItem
                                        onClick={() => handleRestoreRole(role.id)}
                                        style={{ color: COLORS.lightText }}
                                        className="hover:!bg-green-900/30 hover:!text-green-300 transition-all duration-200 cursor-pointer"
                                      >
                                        <ArchiveRestore className="mr-2 h-4 w-4" />
                                        <span className="font-medium">Restore</span>
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={() => handleArchiveRole(role.id)}
                                        style={{ color: COLORS.lightText }}
                                        className="hover:!bg-yellow-900/30 hover:!text-yellow-300 transition-all duration-200 cursor-pointer"
                                      >
                                        <Archive className="mr-2 h-4 w-4" />
                                        <span className="font-medium">Archive</span>
                                      </DropdownMenuItem>
                                    )}

                                    <DropdownMenuSeparator
                                      style={{ backgroundColor: COLORS.gold + '20' }}
                                    />

                                    <DropdownMenuItem
                                      onClick={() => handleDeleteRole(role.id)}
                                      className="hover:!bg-red-900/30 hover:!text-red-300 transition-all duration-200 cursor-pointer"
                                      style={{ color: '#FF6B6B' }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      <span className="font-medium">Delete</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${COLORS.gold}20`,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
                }}
              >
                <CardContent className="py-16">
                  <div className="text-center">
                    <div
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                      style={{
                        backgroundColor: COLORS.gold + '10',
                        border: `2px dashed ${COLORS.gold}40`
                      }}
                    >
                      <Shield className="h-10 w-10" style={{ color: COLORS.gold }} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.champagne }}>
                      {roleSearchTerm ? 'No roles found' : 'No roles defined yet'}
                    </h3>
                    <p className="text-sm mb-6" style={{ color: COLORS.bronze }}>
                      {roleSearchTerm
                        ? 'Try adjusting your search terms'
                        : 'Create your first role to define permissions and hierarchy for your team'}
                    </p>
                    {!roleSearchTerm && (
                      <Button
                        onClick={() => handleOpenRoleModal()}
                        style={{
                          background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                          color: COLORS.black,
                          border: 'none'
                        }}
                        className="hover:opacity-90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Role
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Role Modal */}
      <RoleModal
        open={roleModalOpen}
        onOpenChange={handleCloseRoleModal}
        onSave={handleSaveRole}
        onDelete={handleDeleteRole}
        role={selectedRole}
        userRole="manager"
        isLoading={isCreatingRole || isUpdatingRole || isDeletingRole}
      />
    </div>
  )
}

export default function StaffPage() {
  return (
    <StatusToastProvider>
      <StaffContent />
    </StatusToastProvider>
  )
}
