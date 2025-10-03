'use client'

/**
 * Salon Staff Page
 *
 * Enterprise-grade staff management using Universal Entity v2
 * Follows HERA DNA standards with RPC-first architecture
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
  Users,
  Search,
  Filter,
  Plus,
  Check,
  X,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Shield,
  Star,
  MoreVertical,
  Trash2,
  Edit,
  User
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { useHeraRoles } from '@/hooks/useHeraRoles'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { SERVICE_PRESET } from '@/hooks/entityPresets'
import { StaffForm } from '@/components/salon/StaffForm'
import '@/styles/salon-luxe.css'

// Status configuration
const STAFF_STATUS = {
  active: { label: 'Active', color: LUXE_COLORS.emerald, icon: Check },
  inactive: { label: 'Inactive', color: LUXE_COLORS.bronze, icon: X },
  on_leave: { label: 'On Leave', color: LUXE_COLORS.gold, icon: Calendar }
}

export default function SalonStaffPage() {
  const { salonRole, hasPermission, isAuthenticated, organization } = useSecuredSalonContext()
  const { toast } = useToast()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [deletingStaff, setDeletingStaff] = useState<any>(null)
  const [hardDeleteConfirm, setHardDeleteConfirm] = useState(false)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Load staff with relationships
  const {
    staff,
    isLoading: staffLoading,
    error: staffError,
    refetch: refetchStaff,
    createStaff,
    updateStaff,
    archiveStaff,
    deleteStaff,
    filterSensitiveFields,
    isCreating,
    isUpdating,
    isDeleting
  } = useHeraStaff({
    filters: {
      include_dynamic: true,
      include_relationships: true,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }
  })

  // Load roles for dropdown
  const { roles, getActiveRoles, isLoading: rolesLoading } = useHeraRoles()

  // Load services for assignment
  const { entities: services, isLoading: servicesLoading } = useUniversalEntity({
    entity_type: 'SERVICE',
    filters: {
      include_dynamic: true,
      limit: 100
    },
    dynamicFields: SERVICE_PRESET.dynamicFields
  })

  // Load locations
  const { entities: locations } = useUniversalEntity({
    entity_type: 'LOCATION',
    filters: { limit: 20 }
  })

  // Filter and process staff list
  const filteredStaff = useMemo(() => {
    let filtered = filterSensitiveFields(staff || [], salonRole)

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        s =>
          s.entity_name?.toLowerCase().includes(query) ||
          s.dynamic_fields?.email?.value?.toLowerCase().includes(query) ||
          s.dynamic_fields?.phone?.value?.toLowerCase().includes(query) ||
          s.dynamic_fields?.role_title?.value?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.dynamic_fields?.status?.value === statusFilter)
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(s => {
        const roleId = s.relationships?.role?.to_entity?.id
        return roleId === roleFilter
      })
    }

    return filtered
  }, [staff, searchQuery, statusFilter, roleFilter, salonRole, filterSensitiveFields])

  // Handle create/update
  const handleSubmit = async (data: any) => {
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, data)
        toast({
          title: 'Staff updated',
          description: 'Staff member has been updated successfully.'
        })
      } else {
        await createStaff(data)
        toast({
          title: 'Staff created',
          description: 'New staff member has been added successfully.'
        })
      }

      setIsModalOpen(false)
      setEditingStaff(null)
      refetchStaff()
    } catch (error) {
      console.error('Failed to save staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to save staff member. Please try again.',
        variant: 'destructive'
      })
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deletingStaff) return

    try {
      if (hardDeleteConfirm) {
        await deleteStaff(deletingStaff.id, true)
        toast({
          title: 'Staff deleted',
          description: 'Staff member has been permanently deleted.'
        })
      } else {
        await archiveStaff(deletingStaff.id)
        toast({
          title: 'Staff archived',
          description: 'Staff member has been archived.'
        })
      }

      setDeletingStaff(null)
      setHardDeleteConfirm(false)
      refetchStaff()
    } catch (error) {
      console.error('Failed to delete staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete staff member. Please try again.',
        variant: 'destructive'
      })
    }
  }

  // Can manage staff
  const canManageStaff =
    hasPermission('salon:staff:write') || ['owner', 'manager'].includes(salonRole || '')
  const canViewCosts =
    hasPermission('salon:finance:read') || ['owner', 'manager'].includes(salonRole || '')

  // Loading state
  if (staffLoading || rolesLoading || servicesLoading) {
    return (
      <div className="p-8" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded" style={{ backgroundColor: `${LUXE_COLORS.gold}20` }} />
          <div
            className="h-64 rounded-lg"
            style={{ backgroundColor: `${LUXE_COLORS.charcoal}80` }}
          />
        </div>
      </div>
    )
  }

  // Error state
  if (staffError) {
    return (
      <div className="p-8" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
        <Alert className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load staff data. Please try again.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: LUXE_COLORS.champagne }}
            >
              Staff Management
            </h1>
            <p className="mt-1" style={{ color: LUXE_COLORS.bronze }}>
              Manage your salon team members
            </p>
          </div>

          {canManageStaff && (
            <Button
              onClick={() => {
                setEditingStaff(null)
                setIsModalOpen(true)
              }}
              className="shadow-lg hover:shadow-xl transition-all"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                color: LUXE_COLORS.black
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          )}
        </div>

        {/* Filters */}
        <div
          className="rounded-xl p-6 shadow-lg backdrop-blur-sm border"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoalLight}95`,
            borderColor: `${LUXE_COLORS.gold}20`
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: LUXE_COLORS.bronze }}
              />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="luxe-dropdown">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger
                style={{
                  backgroundColor: `${LUXE_COLORS.charcoal}80`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  color: LUXE_COLORS.lightText
                }}
              >
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent className="luxe-dropdown">
                <SelectItem value="all">All roles</SelectItem>
                {getActiveRoles().map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.dynamic_fields?.title?.value || role.entity_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span style={{ color: LUXE_COLORS.bronze }}>
                {filteredStaff.length} staff members
              </span>
            </div>
          </div>
        </div>

        {/* Staff Grid */}
        {filteredStaff.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center shadow-lg"
            style={{
              backgroundColor: `${LUXE_COLORS.charcoalLight}95`,
              borderColor: `${LUXE_COLORS.gold}20`
            }}
          >
            <Users className="w-16 h-16 mx-auto mb-4" style={{ color: `${LUXE_COLORS.gold}40` }} />
            <h3 className="text-lg font-medium mb-1" style={{ color: LUXE_COLORS.champagne }}>
              No staff members found
            </h3>
            <p style={{ color: LUXE_COLORS.bronze }}>
              {searchQuery || statusFilter !== 'all' || roleFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first staff member to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map(member => {
              const status = member.dynamic_fields?.status?.value || 'active'
              const statusConfig =
                STAFF_STATUS[status as keyof typeof STAFF_STATUS] || STAFF_STATUS.active
              const StatusIcon = statusConfig.icon
              const role = member.relationships?.role?.to_entity

              return (
                <div
                  key={member.id}
                  className="rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border group"
                  style={{
                    backgroundColor: `${LUXE_COLORS.charcoalLight}95`,
                    borderColor: `${LUXE_COLORS.gold}20`
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md"
                        style={{
                          background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                          color: LUXE_COLORS.black
                        }}
                      >
                        {member.entity_name
                          ?.split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                          {member.entity_name}
                        </h3>
                        <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                          {member.dynamic_fields?.role_title?.value || 'Staff Member'}
                        </p>
                      </div>
                    </div>

                    {canManageStaff && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical
                              className="h-4 w-4"
                              style={{ color: LUXE_COLORS.bronze }}
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          style={{
                            backgroundColor: LUXE_COLORS.charcoalLight,
                            border: `1px solid ${LUXE_COLORS.gold}30`
                          }}
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingStaff(member)
                              setIsModalOpen(true)
                            }}
                            style={{ color: LUXE_COLORS.lightText }}
                            className="hover:bg-gold/10"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator
                            style={{ backgroundColor: `${LUXE_COLORS.bronze}30` }}
                          />
                          <DropdownMenuItem
                            onClick={() => {
                              setDeletingStaff(member)
                              setHardDeleteConfirm(false)
                            }}
                            style={{ color: LUXE_COLORS.ruby }}
                            className="hover:bg-ruby/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          {['owner', 'manager'].includes(salonRole || '') && (
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingStaff(member)
                                setHardDeleteConfirm(true)
                              }}
                              style={{ color: LUXE_COLORS.ruby }}
                              className="hover:bg-ruby/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hard Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Status */}
                  <Badge
                    className="mb-4"
                    style={{
                      backgroundColor: `${statusConfig.color}20`,
                      color: statusConfig.color,
                      border: `1px solid ${statusConfig.color}40`
                    }}
                  >
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {member.dynamic_fields?.email?.value && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" style={{ color: LUXE_COLORS.bronze }} />
                        <a
                          href={`mailto:${member.dynamic_fields.email.value}`}
                          className="text-sm hover:underline"
                          style={{ color: LUXE_COLORS.lightText }}
                        >
                          {member.dynamic_fields.email.value}
                        </a>
                      </div>
                    )}

                    {member.dynamic_fields?.phone?.value && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" style={{ color: LUXE_COLORS.bronze }} />
                        <a
                          href={`tel:${member.dynamic_fields.phone.value}`}
                          className="text-sm hover:underline"
                          style={{ color: LUXE_COLORS.lightText }}
                        >
                          {member.dynamic_fields.phone.value}
                        </a>
                      </div>
                    )}

                    {member.dynamic_fields?.hire_date?.value && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" style={{ color: LUXE_COLORS.bronze }} />
                        <span className="text-sm" style={{ color: LUXE_COLORS.lightText }}>
                          Since{' '}
                          {format(parseISO(member.dynamic_fields.hire_date.value), 'MMM yyyy')}
                        </span>
                      </div>
                    )}

                    {canViewCosts && member.dynamic_fields?.display_rate?.value && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
                        <span className="text-sm" style={{ color: LUXE_COLORS.gold }}>
                          AED {member.dynamic_fields.display_rate.value}/hr
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {member.dynamic_fields?.skills?.value &&
                    Array.isArray(member.dynamic_fields.skills.value) &&
                    member.dynamic_fields.skills.value.length > 0 && (
                      <div
                        className="mt-4 pt-4 border-t"
                        style={{ borderColor: `${LUXE_COLORS.gold}20` }}
                      >
                        <div className="flex flex-wrap gap-2">
                          {member.dynamic_fields.skills.value
                            .slice(0, 3)
                            .map((skill: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                style={{
                                  backgroundColor: `${LUXE_COLORS.bronze}20`,
                                  color: LUXE_COLORS.bronze,
                                  border: `1px solid ${LUXE_COLORS.bronze}40`
                                }}
                              >
                                {skill}
                              </Badge>
                            ))}
                          {member.dynamic_fields.skills.value.length > 3 && (
                            <span className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                              +{member.dynamic_fields.skills.value.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent
            className="max-w-2xl max-h-[90vh] flex flex-col luxe-modal"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              border: `1px solid ${LUXE_COLORS.gold}30`,
              padding: 0
            }}
          >
            <DialogHeader
              className="px-6 pt-6 pb-4 border-b flex-shrink-0"
              style={{ borderColor: `${LUXE_COLORS.gold}20` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                    boxShadow: '0 4px 6px rgba(212, 175, 55, 0.3)'
                  }}
                >
                  <Users className="h-5 w-5" style={{ color: LUXE_COLORS.black }} />
                </div>
                <div>
                  <DialogTitle
                    className="text-xl font-semibold"
                    style={{ color: LUXE_COLORS.champagne }}
                  >
                    {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                  </DialogTitle>
                  <DialogDescription style={{ color: LUXE_COLORS.bronze }}>
                    {editingStaff
                      ? 'Update staff member information'
                      : 'Add a new team member to your salon'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <StaffForm
                staff={editingStaff}
                roles={getActiveRoles()}
                services={services || []}
                locations={locations || []}
                existingStaff={staff || []}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsModalOpen(false)
                  setEditingStaff(null)
                }}
                isLoading={isCreating || isUpdating}
                canViewCosts={canViewCosts}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingStaff} onOpenChange={() => setDeletingStaff(null)}>
          <DialogContent
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              border: `1px solid ${LUXE_COLORS.gold}30`
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: LUXE_COLORS.champagne }}>
                {hardDeleteConfirm ? 'Permanently Delete' : 'Archive'} Staff Member
              </DialogTitle>
              <DialogDescription style={{ color: LUXE_COLORS.bronze }}>
                {hardDeleteConfirm
                  ? 'This action cannot be undone. All data will be permanently deleted.'
                  : 'This will archive the staff member. They can be restored later if needed.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <p style={{ color: LUXE_COLORS.lightText }}>
                Are you sure you want to {hardDeleteConfirm ? 'permanently delete' : 'archive'}{' '}
                <strong>{deletingStaff?.entity_name}</strong>?
              </p>

              {hardDeleteConfirm && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-400">
                    This will remove all relationships and cannot be recovered.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeletingStaff(null)
                  setHardDeleteConfirm(false)
                }}
                style={{
                  borderColor: `${LUXE_COLORS.bronze}50`,
                  color: LUXE_COLORS.bronze
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  backgroundColor: LUXE_COLORS.ruby,
                  color: 'white'
                }}
              >
                {hardDeleteConfirm ? 'Delete Permanently' : 'Archive'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
