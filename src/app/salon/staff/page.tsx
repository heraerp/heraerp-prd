'use client'

import { useState } from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { SalonAuthGuard } from '@/components/salon/auth/SalonAuthGuard'
import { useHeraStaff, type StaffFormValues } from '@/hooks/useHeraStaff'
import { useHeraRoles, type RoleFormValues, type Role } from '@/hooks/useHeraRoles'
import { RoleModal } from './RoleModal'
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
  MapPin
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { SalonLuxeModal } from '@/components/salon/SalonLuxeModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
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
  const { toast } = useToast()
  const organizationId = organization?.id

  // Use the new useHeraStaff hook
  const { staff, isLoading, error, createStaff, isCreating, refetch } = useHeraStaff({
    filters: {
      branch_id: selectedBranchId || undefined  // Filter by selected branch
    }
  })

  // Use the new useHeraRoles hook
  const {
    roles,
    isLoading: isLoadingRoles,
    createRole,
    updateRole,
    deleteRole,
    isCreating: isCreatingRole,
    isUpdating: isUpdatingRole,
    isDeleting: isDeletingRole
  } = useHeraRoles({
    organizationId: organizationId || '',
    includeInactive: false,
    userRole: 'manager' // TODO: Get from auth context
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | undefined>()
  const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff')
  const [roleSearchTerm, setRoleSearchTerm] = useState('')
  const [staffModalOpen, setStaffModalOpen] = useState(false)

  const [newStaff, setNewStaff] = useState<StaffFormValues>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role_id: undefined,
    role_title: '',
    status: 'active',
    hourly_cost: 0,
    display_rate: 0,
    skills: [],
    bio: ''
  })

  // Calculate stats from staff data
  const stats: StaffStats = {
    totalStaff: staff?.length || 0,
    activeToday: staff?.filter(s => s.status === 'active').length || 0,
    onLeave: staff?.filter(s => s.status === 'on_leave').length || 0,
    averageRating: 4.8
  }

  const handleAddStaff = async () => {
    if (!organizationId || !newStaff.first_name || !newStaff.last_name) return

    try {
      // Find the selected role to get both role_id and role_title
      const selectedRoleData = roles?.find(r => r.id === newStaff.role_id)

      await createStaff({
        ...newStaff,
        role_id: selectedRoleData?.id,
        role_title: selectedRoleData?.title || selectedRoleData?.entity_name || '',
        branch_id: selectedBranchId || undefined  // Associate with selected branch
      })

      toast({
        title: 'Success',
        description: 'Staff member added successfully',
        variant: 'default'
      })

      // Reset form
      setNewStaff({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role_id: undefined,
        role_title: '',
        status: 'active',
        hourly_cost: 0,
        display_rate: 0,
        skills: [],
        bio: ''
      })

      // Close modal
      setStaffModalOpen(false)
    } catch (error) {
      console.error('Error adding staff:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add staff member',
        variant: 'destructive'
      })
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

    try {
      if (selectedRole) {
        await updateRole(selectedRole.id, roleData)
        toast({
          title: 'Success',
          description: 'Role updated successfully',
          variant: 'default'
        })
      } else {
        await createRole(roleData)
        toast({
          title: 'Success',
          description: 'Role created successfully',
          variant: 'default'
        })
      }
    } catch (error) {
      console.error('Error saving role:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save role',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!organizationId) return

    try {
      await deleteRole(roleId)
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error deleting role:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete role',
        variant: 'destructive'
      })
      throw error
    }
  }

  const filteredStaff =
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
    }) || []

  const filteredRoles =
    roles?.filter(
      r =>
        r.title?.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
        r.entity_name?.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(roleSearchTerm.toLowerCase())
    ) || []

  // Role stats
  const roleStats = {
    totalRoles: roles?.length || 0,
    activeRoles: roles?.filter(r => r.status === 'active').length || 0,
    inactiveRoles: roles?.filter(r => r.status === 'inactive').length || 0
  }

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
                  onClick={() => setStaffModalOpen(true)}
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

                <SalonLuxeModal
                  open={staffModalOpen}
                  onClose={() => setStaffModalOpen(false)}
                  title="Add New Staff Member"
                  maxWidth="48rem"
                >
                  <div className="space-y-5 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="first_name"
                          className="text-sm font-semibold mb-2 block"
                          style={{ color: COLORS.champagne }}
                        >
                          First Name
                        </Label>
                        <Input
                          id="first_name"
                          value={newStaff.first_name}
                          onChange={e => setNewStaff({ ...newStaff, first_name: e.target.value })}
                          placeholder="First name"
                          className="transition-all duration-200 border-0 outline-none"
                          style={{
                            backgroundColor: COLORS.charcoalLight,
                            border: `1px solid ${COLORS.gold}66`,
                            color: COLORS.champagne,
                            padding: '0.75rem',
                            borderRadius: '0.375rem'
                          }}
                          onFocus={e => {
                            e.target.style.border = `2px solid ${COLORS.gold}`
                            e.target.style.boxShadow = `0 0 0 3px ${COLORS.gold}20`
                          }}
                          onBlur={e => {
                            e.target.style.border = `1px solid ${COLORS.gold}66`
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="last_name"
                          className="text-sm font-semibold mb-2 block"
                          style={{ color: COLORS.champagne }}
                        >
                          Last Name
                        </Label>
                        <Input
                          id="last_name"
                          value={newStaff.last_name}
                          onChange={e => setNewStaff({ ...newStaff, last_name: e.target.value })}
                          placeholder="Last name"
                          className="transition-all duration-200 border-0 outline-none"
                          style={{
                            backgroundColor: COLORS.charcoalLight,
                            border: `1px solid ${COLORS.gold}66`,
                            color: COLORS.champagne,
                            padding: '0.75rem',
                            borderRadius: '0.375rem'
                          }}
                          onFocus={e => {
                            e.target.style.border = `2px solid ${COLORS.gold}`
                            e.target.style.boxShadow = `0 0 0 3px ${COLORS.gold}20`
                          }}
                          onBlur={e => {
                            e.target.style.border = `1px solid ${COLORS.gold}66`
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="role_id"
                        className="text-sm font-semibold mb-2 block"
                        style={{ color: COLORS.champagne }}
                      >
                        Role <span style={{ color: COLORS.gold, fontSize: '1.2em' }}>*</span>
                      </Label>
                      <Select
                        value={newStaff.role_id || ''}
                        onValueChange={value => setNewStaff({ ...newStaff, role_id: value })}
                      >
                        <SelectTrigger
                          className="border-[#D4AF37] focus:border-[#D4AF37] focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                          style={{
                            backgroundColor: COLORS.charcoalLight,
                            color: COLORS.champagne,
                            borderColor: `${COLORS.gold}40`,
                            padding: '0.75rem'
                          }}
                        >
                          <SelectValue placeholder="Select a role (required)" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          {roles?.map(role => (
                            <SelectItem key={role.id} value={role.id} className="hera-select-item">
                              {role.title || role.entity_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="phone"
                          className="text-sm font-semibold mb-2 block"
                          style={{ color: COLORS.champagne }}
                        >
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          value={newStaff.phone || ''}
                          onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                          placeholder="+971 50 123 4567"
                          className="transition-all duration-200 border-0 outline-none"
                          style={{
                            backgroundColor: COLORS.charcoalLight,
                            border: `1px solid ${COLORS.gold}66`,
                            color: COLORS.champagne,
                            padding: '0.75rem',
                            borderRadius: '0.375rem'
                          }}
                          onFocus={e => {
                            e.target.style.border = `2px solid ${COLORS.gold}`
                            e.target.style.boxShadow = `0 0 0 3px ${COLORS.gold}20`
                          }}
                          onBlur={e => {
                            e.target.style.border = `1px solid ${COLORS.gold}66`
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="email"
                          className="text-sm font-semibold mb-2 block"
                          style={{ color: COLORS.champagne }}
                        >
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newStaff.email}
                          onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                          placeholder="staff@salon.com"
                          className="transition-all duration-200 border-0 outline-none"
                          style={{
                            backgroundColor: COLORS.charcoalLight,
                            border: `1px solid ${COLORS.gold}66`,
                            color: COLORS.champagne,
                            padding: '0.75rem',
                            borderRadius: '0.375rem'
                          }}
                          onFocus={e => {
                            e.target.style.border = `2px solid ${COLORS.gold}`
                            e.target.style.boxShadow = `0 0 0 3px ${COLORS.gold}20`
                          }}
                          onBlur={e => {
                            e.target.style.border = `1px solid ${COLORS.gold}66`
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="display_rate"
                          className="text-sm font-semibold mb-2 block"
                          style={{ color: COLORS.champagne }}
                        >
                          Display Rate (AED/hr)
                        </Label>
                        <Input
                          id="display_rate"
                          type="number"
                          value={newStaff.display_rate || ''}
                          onChange={e =>
                            setNewStaff({
                              ...newStaff,
                              display_rate: parseFloat(e.target.value) || 0
                            })
                          }
                          placeholder="150"
                          className="transition-all duration-200 border-0 outline-none"
                          style={{
                            backgroundColor: COLORS.charcoalLight,
                            border: `1px solid ${COLORS.gold}66`,
                            color: COLORS.champagne,
                            padding: '0.75rem',
                            borderRadius: '0.375rem'
                          }}
                          onFocus={e => {
                            e.target.style.border = `2px solid ${COLORS.gold}`
                            e.target.style.boxShadow = `0 0 0 3px ${COLORS.gold}20`
                          }}
                          onBlur={e => {
                            e.target.style.border = `1px solid ${COLORS.gold}66`
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="hourly_cost"
                          className="text-sm font-semibold mb-2 block"
                          style={{ color: COLORS.champagne }}
                        >
                          Hourly Cost (AED)
                        </Label>
                        <Input
                          id="hourly_cost"
                          type="number"
                          value={newStaff.hourly_cost || ''}
                          onChange={e =>
                            setNewStaff({
                              ...newStaff,
                              hourly_cost: parseFloat(e.target.value) || 0
                            })
                          }
                          placeholder="80"
                          className="transition-all duration-200 border-0 outline-none"
                          style={{
                            backgroundColor: COLORS.charcoalLight,
                            border: `1px solid ${COLORS.gold}66`,
                            color: COLORS.champagne,
                            padding: '0.75rem',
                            borderRadius: '0.375rem'
                          }}
                          onFocus={e => {
                            e.target.style.border = `2px solid ${COLORS.gold}`
                            e.target.style.boxShadow = `0 0 0 3px ${COLORS.gold}20`
                          }}
                          onBlur={e => {
                            e.target.style.border = `1px solid ${COLORS.gold}66`
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </div>
                    </div>
                    {roles && roles.length === 0 ? (
                      <Alert
                        style={{
                          backgroundColor: COLORS.charcoalLight,
                          border: `1px solid ${COLORS.gold}40`,
                          color: COLORS.champagne
                        }}
                      >
                        <AlertDescription style={{ color: COLORS.bronze }}>
                          Please create at least one role first before adding staff members.
                          <Button
                            onClick={() => {
                              setStaffModalOpen(false)
                              setActiveTab('roles')
                              setTimeout(() => handleOpenRoleModal(), 300)
                            }}
                            className="mt-3 w-full"
                            style={{
                              background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                              color: COLORS.black,
                              border: 'none'
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Go to Roles Tab
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Button
                        className="w-full hover:opacity-90 transition-opacity"
                        onClick={handleAddStaff}
                        disabled={
                          isCreating ||
                          !newStaff.first_name ||
                          !newStaff.last_name ||
                          !newStaff.role_id
                        }
                        style={{
                          background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                          color: COLORS.black,
                          border: 'none'
                        }}
                      >
                        {isCreating ? 'Adding...' : 'Add Staff Member'}
                      </Button>
                    )}
                  </div>
                </SalonLuxeModal>
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                {
                  title: 'Total Staff',
                  value: stats.totalStaff,
                  desc: 'Team members',
                  icon: Users,
                  color: COLORS.emerald
                },
                {
                  title: 'Active Today',
                  value: stats.activeToday,
                  desc: 'Working now',
                  icon: UserCheck,
                  color: COLORS.gold
                },
                {
                  title: 'On Leave',
                  value: stats.onLeave,
                  desc: 'Away today',
                  icon: Calendar,
                  color: COLORS.bronze
                },
                {
                  title: 'Avg Rating',
                  value: stats.averageRating,
                  desc: 'Out of 5.0',
                  icon: TrendingUp,
                  color: COLORS.champagne
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

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    style={{ color: COLORS.bronze }}
                  />
                  <Input
                    placeholder="Search by name or role..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 border-0 outline-none"
                    style={{
                      backgroundColor: COLORS.charcoalLight,
                      border: `1px solid ${COLORS.gold}30`,
                      color: COLORS.champagne,
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>

                <BranchSelector variant="default" />
              </div>

              {/* Active Filters */}
              {selectedBranchId && (
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: COLORS.bronze }}>
                    Active filters:
                  </span>
                  <Badge
                    className="gap-1.5 font-medium border cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: 'rgba(212, 175, 55, 0.15)',
                      color: COLORS.gold,
                      borderColor: 'rgba(212, 175, 55, 0.3)'
                    }}
                    onClick={() => setSelectedBranchId(null)}
                  >
                    <Building2 className="w-3 h-3" />
                    <MapPin className="w-3 h-3" />
                    {availableBranches.find(b => b.id === selectedBranchId)?.entity_name || 'Branch'}
                    <button
                      className="ml-1 hover:text-white"
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedBranchId(null)
                      }}
                    >
                      ×
                    </button>
                  </Badge>
                </div>
              )}
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
                {filteredStaff.map(member => (
                  <Card
                    key={member.id}
                    className="transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      backgroundColor: COLORS.charcoalLight,
                      border: `1px solid ${COLORS.gold}20`,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar
                          className="h-12 w-12"
                          style={{
                            backgroundColor: COLORS.gold,
                            color: COLORS.black
                          }}
                        >
                          <AvatarFallback
                            style={{ backgroundColor: COLORS.gold, color: COLORS.black }}
                          >
                            {member.entity_name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3
                              className="font-semibold text-lg"
                              style={{ color: COLORS.champagne }}
                            >
                              {member.entity_name}
                            </h3>
                            {member.status === 'on_leave' && (
                              <Badge
                                className="ml-2"
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
                            className="mt-1"
                            style={{
                              backgroundColor: `${COLORS.emerald}20`,
                              color: COLORS.emerald,
                              border: `1px solid ${COLORS.emerald}40`
                            }}
                          >
                            {member.role_title || 'Staff Member'}
                          </Badge>
                          <div className="mt-3 space-y-1 text-sm" style={{ color: COLORS.bronze }}>
                            {member.phone && <div>📱 {member.phone}</div>}
                            {member.email && <div>✉️ {member.email}</div>}
                            <div className="flex gap-4 mt-2">
                              {member.display_rate && <span>💰 AED {member.display_rate}/hr</span>}
                              {member.skills && member.skills.length > 0 && (
                                <span>🎨 {member.skills.slice(0, 2).join(', ')}</span>
                              )}
                            </div>
                          </div>
                          <div
                            className="mt-3 text-xs"
                            style={{ color: COLORS.bronze, opacity: 0.7 }}
                          >
                            Joined {format(new Date(member.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredStaff.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.bronze }} />
                <h3 className="text-lg font-medium mb-2" style={{ color: COLORS.champagne }}>
                  No staff members found
                </h3>
                <p style={{ color: COLORS.bronze }}>
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Click "Add Staff Member" to add your first employee'}
                </p>
                {!searchTerm && (
                  <Button
                    className="mt-4"
                    onClick={() => setStaffModalOpen(true)}
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                      color: COLORS.black,
                      border: 'none'
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
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
                  title: 'Inactive',
                  value: roleStats.inactiveRoles,
                  desc: 'Not in use',
                  icon: Settings,
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

            {/* Role Search */}
            <div className="mb-6">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: COLORS.bronze }}
                />
                <Input
                  placeholder="Search roles by title, description..."
                  value={roleSearchTerm}
                  onChange={e => setRoleSearchTerm(e.target.value)}
                  className="pl-10 max-w-md"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    border: `1px solid ${COLORS.gold}30`,
                    color: COLORS.champagne
                  }}
                />
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
                      {filteredRoles.map((role, index) => (
                        <tr
                          key={role.id}
                          className="border-b transition-all duration-200 hover:shadow-md"
                          style={{
                            borderColor: COLORS.gold + '10',
                            backgroundColor: index % 2 === 0 ? 'transparent' : COLORS.black + '40'
                          }}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2 rounded-lg"
                                style={{
                                  backgroundColor: COLORS.gold + '20',
                                  border: `1px solid ${COLORS.gold}40`
                                }}
                              >
                                <Shield className="h-4 w-4" style={{ color: COLORS.gold }} />
                              </div>
                              <div>
                                <div className="font-semibold" style={{ color: COLORS.champagne }}>
                                  {role.title || role.entity_name}
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
                                backgroundColor:
                                  role.status === 'active'
                                    ? COLORS.emerald + '20'
                                    : COLORS.bronze + '20',
                                color: role.status === 'active' ? COLORS.emerald : COLORS.bronze,
                                border: `1px solid ${
                                  role.status === 'active' ? COLORS.emerald : COLORS.bronze
                                }40`,
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.75rem'
                              }}
                            >
                              {role.status || 'active'}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleOpenRoleModal(role)}
                                style={{
                                  backgroundColor: COLORS.gold + '20',
                                  color: COLORS.gold,
                                  border: `1px solid ${COLORS.gold}40`
                                }}
                                className="hover:opacity-80 transition-opacity"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
    <SalonAuthGuard requiredRoles={['Owner', 'Administrator', 'owner', 'administrator']}>
      <StaffContent />
    </SalonAuthGuard>
  )
}
