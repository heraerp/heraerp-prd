'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1'
import { useHeraRoles } from '@/hooks/useHeraRoles'
import { useHeraBranches } from '@/hooks/useHeraBranches'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { StaffModal, type StaffFormValues } from './StaffModal'
import {
  Plus,
  Users,
  UserCircle,
  Search,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  User,
  RefreshCw,
  Palmtree
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

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

// Avatar color palette
const AVATAR_COLORS = [
  { bg: '#D4AF3720', border: '#D4AF37', icon: '#D4AF37' }, // Gold
  { bg: '#0F6F5C20', border: '#0F6F5C', icon: '#0F6F5C' }, // Emerald
  { bg: '#E8B4B820', border: '#E8B4B8', icon: '#E8B4B8' }, // Rose
  { bg: '#8C785320', border: '#8C7853', icon: '#8C7853' }, // Bronze
  { bg: '#B8860B20', border: '#B8860B', icon: '#B8860B' }, // Gold Dark
  { bg: '#F5E6C820', border: '#D4AF37', icon: '#D4AF37' } // Champagne with gold
]

// Get consistent color for staff member
const getAvatarColor = (id: string, index: number) => {
  const colorIndex = id
    ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length
    : index % AVATAR_COLORS.length
  return AVATAR_COLORS[colorIndex]
}

function StaffsPageContent() {
  const router = useRouter()
  const { organization, organizationId } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)

  // 🌟 USE UNIVERSAL ENTITY V1 HOOK - Same pattern as customers page
  const {
    entities: staff,
    isLoading,
    error,
    create,
    update,
    delete: deleteEntity,
    archive,
    restore,
    refetch,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntityV1({
    entity_type: 'STAFF', // Just change the entity type!
    organizationId: organizationId || '',
    dynamicFields: [
      { name: 'first_name', type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.FIRSTNAME.V1' },
      { name: 'last_name', type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.LASTNAME.V1' },
      { name: 'phone', type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.PHONE.V1' },
      { name: 'email', type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.EMAIL.V1' },
      { name: 'role_title', type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.ROLE.V1' },
      { name: 'hire_date', type: 'date', smart_code: 'HERA.SALON.STAFF.FIELD.HIREDATE.V1' },
      { name: 'hourly_cost', type: 'number', smart_code: 'HERA.SALON.STAFF.FIELD.HOURLY.COST.V1' },
      { name: 'display_rate', type: 'number', smart_code: 'HERA.SALON.STAFF.FIELD.DISPLAY.RATE.V1' },
      { name: 'nationality', type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.NATIONALITY.V1' },
      { name: 'passport_no', type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.PASSPORT.V1' },
      { name: 'visa_exp_date', type: 'date', smart_code: 'HERA.SALON.STAFF.FIELD.VISA.EXP.V1' },
      { name: 'insurance_exp_date', type: 'date', smart_code: 'HERA.SALON.STAFF.FIELD.INSURANCE.EXP.V1' }
    ],
    filters: {
      include_dynamic: true,
      status: includeArchived ? undefined : 'active'
    }
  })

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

  // Calculate stats
  const stats = useMemo(
    () => ({
      totalStaff: staff?.length || 0,
      activeToday: staff?.filter(s => s && s.status === 'active').length || 0,
      onLeave: staff?.filter(s => s && s.status === 'on_leave').length || 0
    }),
    [staff]
  )

  // Filter staff
  const filteredStaff = useMemo(
    () =>
      staff?.filter(s => {
        const matchesSearch =
          s.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.role_title?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch
      }) || [],
    [staff, searchTerm]
  )

  // CRUD Handlers
  const handleOpenModal = useCallback((staffMember?: any) => {
    setEditingStaff(staffMember || null)
    setModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setEditingStaff(null)
  }, [])

  const handleSave = useCallback(
    async (data: StaffFormValues) => {
      const fullName = `${data.first_name} ${data.last_name}`.trim()
      const loadingId = showLoading(
        editingStaff ? 'Updating staff member...' : 'Creating staff member...',
        'Please wait while we save your changes'
      )

      try {
        if (editingStaff) {
          // Update existing staff
          const dynamic_patch: Record<string, any> = {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            email: data.email,
            role_title: data.role_title,
            hire_date: data.hire_date
          }

          // Add advanced fields if provided
          if (data.hourly_cost !== undefined) dynamic_patch.hourly_cost = data.hourly_cost
          if (data.display_rate !== undefined) dynamic_patch.display_rate = data.display_rate
          if (data.nationality) dynamic_patch.nationality = data.nationality
          if (data.passport_no) dynamic_patch.passport_no = data.passport_no
          if (data.visa_exp_date) dynamic_patch.visa_exp_date = data.visa_exp_date
          if (data.insurance_exp_date) dynamic_patch.insurance_exp_date = data.insurance_exp_date

          await update({
            entity_id: editingStaff.id,
            entity_name: fullName,
            status: data.status === 'inactive' ? 'archived' : 'active',
            dynamic_patch
          })
          removeToast(loadingId)
          showSuccess('Staff member updated successfully', `${fullName} has been updated`)
        } else {
          // Create new staff
          const dynamic_fields: Record<string, any> = {
            first_name: { value: data.first_name, type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.FIRSTNAME.V1' },
            last_name: { value: data.last_name, type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.LASTNAME.V1' },
            phone: { value: data.phone, type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.PHONE.V1' },
            email: { value: data.email, type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.EMAIL.V1' },
            role_title: { value: data.role_title, type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.ROLE.V1' },
            hire_date: { value: data.hire_date, type: 'date', smart_code: 'HERA.SALON.STAFF.FIELD.HIREDATE.V1' }
          }

          // Add advanced fields if provided
          if (data.hourly_cost !== undefined) {
            dynamic_fields.hourly_cost = { value: data.hourly_cost, type: 'number', smart_code: 'HERA.SALON.STAFF.FIELD.HOURLY.COST.V1' }
          }
          if (data.display_rate !== undefined) {
            dynamic_fields.display_rate = { value: data.display_rate, type: 'number', smart_code: 'HERA.SALON.STAFF.FIELD.DISPLAY.RATE.V1' }
          }
          if (data.nationality) {
            dynamic_fields.nationality = { value: data.nationality, type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.NATIONALITY.V1' }
          }
          if (data.passport_no) {
            dynamic_fields.passport_no = { value: data.passport_no, type: 'text', smart_code: 'HERA.SALON.STAFF.FIELD.PASSPORT.V1' }
          }
          if (data.visa_exp_date) {
            dynamic_fields.visa_exp_date = { value: data.visa_exp_date, type: 'date', smart_code: 'HERA.SALON.STAFF.FIELD.VISA.EXP.V1' }
          }
          if (data.insurance_exp_date) {
            dynamic_fields.insurance_exp_date = { value: data.insurance_exp_date, type: 'date', smart_code: 'HERA.SALON.STAFF.FIELD.INSURANCE.EXP.V1' }
          }

          await create({
            entity_type: 'STAFF',
            entity_name: fullName,
            smart_code: 'HERA.SALON.STAFF.ENTITY.MEMBER.V1',
            status: data.status === 'inactive' ? 'archived' : 'active',
            dynamic_fields
          })
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
    },
    [editingStaff, create, update, showLoading, removeToast, showSuccess, showError, handleCloseModal]
  )

  const handleDelete = useCallback(
    async (staffId: string) => {
      const staffMember = staff?.find(s => s.id === staffId)
      const staffName = staffMember?.entity_name || 'Staff member'

      const loadingId = showLoading('Deleting staff member...', 'This action cannot be undone')

      try {
        await deleteEntity({ entity_id: staffId })
        removeToast(loadingId)
        showSuccess('Staff member deleted', `${staffName} has been permanently removed`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to delete staff member', error.message || 'Please try again')
      }
    },
    [staff, deleteEntity, showLoading, removeToast, showSuccess, showError]
  )

  const handleArchive = useCallback(
    async (staffId: string) => {
      const staffMember = staff?.find(s => s.id === staffId)
      const staffName = staffMember?.entity_name || 'Staff member'

      const loadingId = showLoading('Archiving staff member...', 'Please wait')

      try {
        await archive(staffId)
        removeToast(loadingId)
        showSuccess('Staff member archived', `${staffName} has been archived`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to archive staff member', error.message || 'Please try again')
      }
    },
    [staff, archive, showLoading, removeToast, showSuccess, showError]
  )

  const handleRestore = useCallback(
    async (staffId: string) => {
      const staffMember = staff?.find(s => s.id === staffId)
      const staffName = staffMember?.entity_name || 'Staff member'

      const loadingId = showLoading('Restoring staff member...', 'Please wait')

      try {
        await restore(staffId)
        removeToast(loadingId)
        showSuccess('Staff member restored', `${staffName} has been restored`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to restore staff member', error.message || 'Please try again')
      }
    },
    [staff, restore, showLoading, removeToast, showSuccess, showError]
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
    <SalonLuxePage
      title="Staff Management"
      description="Manage your team members"
      actions={
        <>
          <SalonLuxeButton
            variant="outline"
            size="md"
            onClick={() => refetch()}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </SalonLuxeButton>
          <SalonLuxeButton
            variant="primary"
            size="md"
            onClick={() => handleOpenModal()}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Staff Member
          </SalonLuxeButton>
        </>
      }
    >
      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: 'Total Staff',
              value: stats.totalStaff,
              icon: Users,
              color: COLORS.gold
            },
            {
              title: 'Active Today',
              value: stats.activeToday,
              icon: UserCircle,
              color: COLORS.emerald
            },
            {
              title: 'On Leave',
              value: stats.onLeave,
              icon: Palmtree,
              color: COLORS.rose
            }
          ].map((stat, index) => (
            <Card
              key={index}
              className="transition-all duration-300 hover:scale-105"
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div
            className="flex items-center justify-between gap-4 p-4 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalLight}90 0%, ${COLORS.charcoal}90 100%)`,
              border: `1px solid ${COLORS.gold}20`
            }}
          >
            <Tabs
              value={includeArchived ? 'all' : 'active'}
              onValueChange={v => setIncludeArchived(v === 'all')}
            >
              <TabsList
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.black} 100%)`,
                  border: `1px solid ${COLORS.gold}30`
                }}
              >
                <TabsTrigger value="active" style={{ color: COLORS.champagne }}>
                  Active
                </TabsTrigger>
                <TabsTrigger value="all" style={{ color: COLORS.champagne }}>
                  All Staff
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
                style={{ color: COLORS.gold }}
              />
              <Input
                placeholder="Search by name or role..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.black} 100%)`,
                  border: `1px solid ${COLORS.gold}30`,
                  color: COLORS.champagne,
                  borderRadius: '0.75rem'
                }}
              />
            </div>
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
              const avatarColor = getAvatarColor(member.id, index)
              return (
                <Card
                  key={member.id}
                  className="group relative overflow-hidden transition-all duration-300 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoal} 100%)`,
                    border: `1px solid ${isArchived ? COLORS.bronze + '30' : COLORS.gold + '30'}`,
                    boxShadow: `0 8px 24px ${COLORS.black}60`
                  }}
                >
                  {isArchived && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge
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

                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div
                        className="h-14 w-14 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: avatarColor.bg,
                          border: `2px solid ${avatarColor.border}`
                        }}
                      >
                        <User className="h-8 w-8" style={{ color: avatarColor.icon }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg" style={{ color: COLORS.champagne }}>
                          {member.entity_name}
                        </h3>
                        <Badge
                          className="mt-2"
                          style={{
                            background: `linear-gradient(135deg, ${COLORS.emerald}20 0%, ${COLORS.gold}10 100%)`,
                            color: COLORS.emerald,
                            border: `1px solid ${COLORS.emerald}40`
                          }}
                        >
                          {member.role_title || 'Staff Member'}
                        </Badge>

                        <div className="mt-4 space-y-2 text-sm" style={{ color: COLORS.bronze }}>
                          {member.phone && (
                            <div className="flex items-center gap-2">
                              <span>📱</span>
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.email && (
                            <div className="flex items-center gap-2 truncate">
                              <span>✉️</span>
                              <span className="truncate">{member.email}</span>
                            </div>
                          )}
                        </div>

                        {member.hire_date && (
                          <div
                            className="mt-4 pt-3 text-xs border-t"
                            style={{
                              color: COLORS.bronze,
                              opacity: 0.6,
                              borderColor: `${COLORS.bronze}20`
                            }}
                          >
                            Joined {format(new Date(member.hire_date), 'MMM d, yyyy')}
                          </div>
                        )}

                        <div className="mt-4 flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: COLORS.gold + '40',
                                  color: COLORS.champagne
                                }}
                              >
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              style={{
                                background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.charcoalDark} 100%)`,
                                border: `1px solid ${COLORS.gold}40`
                              }}
                            >
                              <DropdownMenuItem
                                onClick={() => handleOpenModal(member)}
                                style={{ color: COLORS.lightText }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator style={{ backgroundColor: COLORS.gold + '20' }} />

                              {member.status === 'archived' ? (
                                <DropdownMenuItem
                                  onClick={() => handleRestore(member.id)}
                                  style={{ color: COLORS.lightText }}
                                >
                                  <ArchiveRestore className="mr-2 h-4 w-4" />
                                  Restore
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleArchive(member.id)}
                                  style={{ color: COLORS.lightText }}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator style={{ backgroundColor: COLORS.gold + '20' }} />

                              <DropdownMenuItem
                                onClick={() => handleDelete(member.id)}
                                style={{ color: '#FF6B6B' }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
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

        {/* Empty State */}
        {!isLoading && filteredStaff.length === 0 && (
          <div
            className="text-center py-20 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalLight}60 0%, ${COLORS.charcoal}60 100%)`,
              border: `1px solid ${COLORS.gold}20`
            }}
          >
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.bronze}20 100%)`,
                border: `2px solid ${COLORS.gold}40`
              }}
            >
              <UserCircle className="h-10 w-10" style={{ color: COLORS.gold }} />
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: COLORS.champagne }}>
              No staff members found
            </h3>
            <p className="text-base mb-6" style={{ color: COLORS.bronze, opacity: 0.8 }}>
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Click below to add your first team member'}
            </p>
            {!searchTerm && (
              <SalonLuxeButton
                variant="primary"
                size="lg"
                onClick={() => handleOpenModal()}
                icon={<Plus className="w-5 h-5" />}
              >
                Add Your First Staff Member
              </SalonLuxeButton>
            )}
          </div>
        )}
      </div>

      {/* Staff Modal */}
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
