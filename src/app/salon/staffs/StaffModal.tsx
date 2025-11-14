'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  User,
  Trash2,
  Archive,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Calendar,
  Building2,
  MapPin,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Mail,
  Phone
} from 'lucide-react'
import type { Role } from '@/hooks/useHeraRoles'
import { getRelationship, extractRelationshipIds } from '@/lib/normalize-entity'

// Branch interface
interface Branch {
  id: string
  entity_name: string
  entity_code?: string
}

// Common nationalities for UAE salons
const NATIONALITIES = [
  'United Arab Emirates',
  'India',
  'Philippines',
  'Pakistan',
  'Bangladesh',
  'Egypt',
  'Jordan',
  'Lebanon',
  'Sri Lanka',
  'Nepal',
  'Syria',
  'Palestine',
  'Sudan',
  'Yemen',
  'Morocco',
  'Indonesia',
  'Thailand',
  'Kenya',
  'Uganda',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia'
].sort()

// Helper to convert date from DB format to YYYY-MM-DD for HTML date input
function formatDateForInput(dateString: string | undefined): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    // Format as YYYY-MM-DD for HTML date input
    return date.toISOString().split('T')[0]
  } catch (e) {
    return ''
  }
}

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  charcoal: '#1A1A1A',
  charcoalLight: '#232323',
  bronze: '#8C7853',
  lightText: '#E0E0E0'
}

// Zod validation schema
const staffSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
  role_id: z.string().min(1, 'Role is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
  // Advanced fields
  hourly_cost: z.number().min(0).optional(),
  display_rate: z.number().min(0).optional(),
  hire_date: z.string().optional(),
  branch_ids: z.array(z.string()).optional(),
  // Document & Compliance fields
  nationality: z.string().optional(),
  passport_no: z.string().optional(),
  visa_exp_date: z.string().optional(),
  insurance_exp_date: z.string().optional()
})

// Expiration status utility function
function getExpirationStatus(expDate: string | undefined): {
  status: 'expired' | 'warning' | 'valid' | 'none'
  daysRemaining: number | null
  message: string
  color: string
} {
  if (!expDate) return {
    status: 'none',
    daysRemaining: null,
    message: 'Not set',
    color: COLORS.bronze
  }

  const exp = new Date(expDate)
  const now = new Date()
  const diffTime = exp.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return {
      status: 'expired',
      daysRemaining: Math.abs(diffDays),
      message: `EXPIRED ${Math.abs(diffDays)} days ago`,
      color: '#DC2626' // red-600
    }
  } else if (diffDays <= 30) {
    return {
      status: 'warning',
      daysRemaining: diffDays,
      message: `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
      color: '#F59E0B' // amber-500
    }
  } else {
    return {
      status: 'valid',
      daysRemaining: diffDays,
      message: `Valid for ${diffDays} days`,
      color: '#10B981' // green-500
    }
  }
}

type StaffSchemaType = z.infer<typeof staffSchema>

export interface StaffFormValues {
  first_name: string
  last_name: string
  email: string
  phone?: string
  role_id?: string
  role_title?: string
  status?: string
  hire_date?: string
  hourly_cost?: number
  display_rate?: number
  branch_ids?: string[]
  nationality?: string
  passport_no?: string
  visa_exp_date?: string
  insurance_exp_date?: string
}

interface StaffModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: StaffFormValues) => Promise<void>
  onDelete?: (staffId: string) => Promise<void>
  onArchive?: (staffId: string) => Promise<void>
  staff?: {
    id: string
    entity_name?: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    role_id?: string
    role_title?: string
    status?: string
    hire_date?: string
    hourly_cost?: number
    display_rate?: number
    relationships?: any
    nationality?: string
    passport_no?: string
    visa_exp_date?: string
    insurance_exp_date?: string
  }
  roles: Role[]
  branches?: Branch[]
  userRole?: 'owner' | 'manager' | 'receptionist' | 'staff'
  isLoading?: boolean
}

export function StaffModal({
  open,
  onOpenChange,
  onSave,
  onDelete,
  onArchive,
  staff,
  roles,
  branches = [],
  userRole = 'staff',
  isLoading = false
}: StaffModalProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const isEditMode = !!staff
  const canDelete = userRole === 'owner'
  const canArchive = ['owner', 'manager'].includes(userRole)

  // Construct full name from first and last name for edit mode
  const fullNameFromStaff = staff
    ? `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || staff.entity_name || ''
    : ''

  // ✅ UPPERCASE STANDARD: Extract branch IDs from STAFF_MEMBER_OF relationships
  // All relationships are normalized to UPPERCASE by useHeraStaff hook
  const memberOfRels = getRelationship(staff, 'STAFF_MEMBER_OF')
  const branchIdsFromStaff = extractRelationshipIds(memberOfRels, 'to_entity_id')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<StaffSchemaType>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      full_name: fullNameFromStaff,
      role_id: staff?.role_id || '',
      phone: staff?.phone || '',
      email: staff?.email || '',
      status: (staff?.status === 'archived' ? 'inactive' : 'active') as 'active' | 'inactive',
      hourly_cost: staff?.hourly_cost || 0,
      display_rate: staff?.display_rate || 0,
      hire_date: formatDateForInput(staff?.hire_date) || '',
      nationality: staff?.nationality || '',
      passport_no: staff?.passport_no || '',
      visa_exp_date: formatDateForInput(staff?.visa_exp_date) || '',
      insurance_exp_date: formatDateForInput(staff?.insurance_exp_date) || ''
    }
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      // 🔍 DEBUG: Log staff data received by modal
      if (staff) {
        console.log('[StaffModal] Received staff data:', {
          id: staff.id,
          name: staff.entity_name,
          status: staff.status,
          first_name: staff.first_name,
          last_name: staff.last_name
        })
      }

      const fullName = staff
        ? `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || staff.entity_name || ''
        : ''

      // Find the role_id - either from staff.role_id or by matching role_title
      let staffRoleId = staff?.role_id || ''

      // If we have a role_title but no role_id, try to find the matching role
      if (!staffRoleId && staff?.role_title && roles.length > 0) {
        const matchingRole = roles.find(
          r => r.title === staff.role_title || r.entity_name === staff.role_title
        )
        if (matchingRole) {
          staffRoleId = matchingRole.id
        }
      }

      const formData = {
        full_name: fullName,
        role_id: staffRoleId,
        phone: staff?.phone || '',
        email: staff?.email || '',
        status: (staff?.status === 'archived' ? 'inactive' : 'active') as 'active' | 'inactive',
        hourly_cost: staff?.hourly_cost || 0,
        display_rate: staff?.display_rate || 0,
        hire_date: formatDateForInput(staff?.hire_date) || '',
        branch_ids: branchIdsFromStaff,
        nationality: staff?.nationality || '',
        passport_no: staff?.passport_no || '',
        visa_exp_date: formatDateForInput(staff?.visa_exp_date) || '',
        insurance_exp_date: formatDateForInput(staff?.insurance_exp_date) || ''
      }

      reset(formData)

      // Auto-expand advanced if any advanced fields have values
      if (staff?.hourly_cost || staff?.display_rate || staff?.hire_date ||
          staff?.nationality || staff?.passport_no || staff?.visa_exp_date || staff?.insurance_exp_date) {
        setShowAdvanced(true)
      }
    }
  }, [open, staff, reset, roles])

  const onSubmit = async (data: StaffSchemaType) => {
    try {
      // Split full name into first and last
      const nameParts = data.full_name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || '' // Empty string if no last name

      // Find role to get role_title
      const selectedRole = roles.find(r => r.id === data.role_id)

      // 🎯 AUTO-ASSIGNMENT: If no branches selected, assign to all branches
      // This matches the UI promise: "This staff member will be automatically assigned to all {branches.length} locations when saved"
      let assignedBranchIds = data.branch_ids
      if (!assignedBranchIds || assignedBranchIds.length === 0) {
        // Auto-assign all available branches
        assignedBranchIds = branches.map(b => b.id)
        console.log('[StaffModal] Auto-assigning to all branches:', {
          branchCount: assignedBranchIds.length,
          branchIds: assignedBranchIds
        })
      } else {
        console.log('[StaffModal] Using selected branches:', {
          branchCount: assignedBranchIds.length,
          branchIds: assignedBranchIds
        })
      }

      const staffData: StaffFormValues = {
        first_name: firstName,
        last_name: lastName,
        email: data.email || '',
        phone: data.phone,
        role_id: data.role_id,
        role_title: selectedRole?.title || selectedRole?.entity_name || '',
        status: data.status === 'inactive' ? 'inactive' : 'active',
        hire_date: data.hire_date,
        hourly_cost: data.hourly_cost,
        display_rate: data.display_rate,
        branch_ids: assignedBranchIds, // ✅ FIX: Use auto-assigned branches if none selected
        nationality: data.nationality,
        passport_no: data.passport_no,
        visa_exp_date: data.visa_exp_date,
        insurance_exp_date: data.insurance_exp_date
      }

      await onSave(staffData)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save staff:', error)
    }
  }

  const handleDelete = async () => {
    if (!staff || !onDelete || !canDelete) return

    setIsDeleting(true)
    try {
      await onDelete(staff.id)
      setDeleteConfirmOpen(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete staff:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleArchive = async () => {
    if (!staff || !onArchive || !canArchive) return

    try {
      await onArchive(staff.id)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to archive staff:', error)
    }
  }

  const roleIdValue = watch('role_id')
  const statusValue = watch('status')

  return (
    <>
      <SalonLuxeModal
        open={open}
        onClose={onOpenChange}
        title={isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}
        description={
          isEditMode
            ? 'Update staff member information and assignments'
            : 'Add a new team member with role and branch assignments'
        }
        icon={<User className="h-6 w-6" />}
        size="md"
        className="!max-w-xl !max-h-[95vh]"
        footer={
          <>
            {isEditMode && canArchive && onArchive && staff?.status !== 'archived' && (
              <SalonLuxeButton
                variant="outline"
                onClick={handleArchive}
                disabled={isSubmitting || isLoading}
                icon={<Archive className="h-4 w-4" />}
              >
                Archive
              </SalonLuxeButton>
            )}
            {isEditMode && canDelete && onDelete && staff?.status === 'archived' && (
              <SalonLuxeButton
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isSubmitting || isLoading}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Delete
              </SalonLuxeButton>
            )}
            <div className="ml-auto flex gap-2">
              <SalonLuxeButton
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </SalonLuxeButton>
              <SalonLuxeButton
                type="submit"
                loading={isSubmitting || isLoading}
                onClick={handleSubmit(onSubmit)}
              >
                {isEditMode ? 'Update Staff' : 'Add Staff'}
              </SalonLuxeButton>
            </div>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Full Name Field (Required) */}
            <div className="space-y-2">
              <Label htmlFor="full_name" style={{ color: COLORS.champagne }}>
                Full Name <span style={{ color: COLORS.gold }}>*</span>
              </Label>
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="e.g., John Smith"
                className="transition-all duration-200"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  color: COLORS.champagne,
                  borderColor: COLORS.gold + '40',
                  padding: '0.75rem',
                  borderRadius: '0.375rem'
                }}
              />
              {errors.full_name && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{errors.full_name.message}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Role Field (Required) */}
            <div className="space-y-2">
              <Label htmlFor="role_id" style={{ color: COLORS.champagne }}>
                Role <span style={{ color: COLORS.gold }}>*</span>
              </Label>
              <Select value={roleIdValue} onValueChange={value => setValue('role_id', value)}>
                <SelectTrigger
                  className="border-[#D4AF37] focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    color: COLORS.champagne,
                    borderColor: `${COLORS.gold}40`,
                    padding: '0.75rem'
                  }}
                >
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  {roles && roles.length > 0 ? (
                    roles
                      .filter(r => r.status === 'active')
                      .map(role => (
                        <SelectItem key={role.id} value={role.id} className="hera-select-item">
                          {role.title || role.entity_name || 'Untitled Role'}
                        </SelectItem>
                      ))
                  ) : (
                    <div className="px-2 py-3 text-sm text-center text-gray-500">
                      No roles available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {errors.role_id && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{errors.role_id.message}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" style={{ color: COLORS.champagne }}>
                  Phone <span style={{ color: COLORS.bronze, fontSize: '0.85em' }}>(Optional)</span>
                </Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+971 50 123 4567"
                  className="transition-all duration-200"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    color: COLORS.champagne,
                    borderColor: COLORS.gold + '40',
                    padding: '0.75rem',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: COLORS.champagne }}>
                  Email <span style={{ color: COLORS.bronze, fontSize: '0.85em' }}>(Optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="staff@salon.com"
                  className="transition-all duration-200"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    color: COLORS.champagne,
                    borderColor: COLORS.gold + '40',
                    padding: '0.75rem',
                    borderRadius: '0.375rem'
                  }}
                />
                {errors.email && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{errors.email.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Status Field */}
            <div className="space-y-2">
              <Label htmlFor="status" style={{ color: COLORS.champagne }}>
                Status
              </Label>
              <Select
                value={statusValue}
                onValueChange={(value: 'active' | 'inactive') => setValue('status', value)}
              >
                <SelectTrigger
                  className="border-[#D4AF37] focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    color: COLORS.champagne,
                    borderColor: `${COLORS.gold}40`,
                    padding: '0.75rem'
                  }}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem value="active" className="hera-select-item">
                    Active
                  </SelectItem>
                  <SelectItem value="inactive" className="hera-select-item">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branch Assignment Section - Enterprise Grade */}
            <div
              className="relative p-6 rounded-xl border backdrop-blur-sm"
              style={{
                backgroundColor: COLORS.charcoal + 'E6',
                borderColor: COLORS.bronze + '30',
                boxShadow: `0 4px 12px ${COLORS.black}40`
              }}
            >
              {/* Section Header with Icon */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                <h3
                  className="text-lg font-semibold tracking-wide"
                  style={{ color: COLORS.champagne }}
                >
                  Branch Assignment
                </h3>
              </div>

              <div className="space-y-3">
                <Label
                  className="text-sm font-medium tracking-wide flex items-center gap-2"
                  style={{ color: COLORS.champagne }}
                >
                  <Building2 className="w-4 h-4" style={{ color: COLORS.gold }} />
                  Select Locations Where This Staff Member Works
                </Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {branches.length === 0 ? (
                    <div
                      className="col-span-2 p-4 rounded-lg text-center"
                      style={{
                        backgroundColor: COLORS.charcoalLight + '50',
                        border: `1px dashed ${COLORS.bronze}40`,
                        color: COLORS.lightText
                      }}
                    >
                      <Building2
                        className="w-8 h-8 mx-auto mb-2 opacity-50"
                        style={{ color: COLORS.bronze }}
                      />
                      <p className="text-sm opacity-70">No branches available</p>
                    </div>
                  ) : (
                    branches.map(branch => {
                      const branchIds = watch('branch_ids') || []
                      const isSelected = branchIds.includes(branch.id)
                      return (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => {
                            const currentValue = watch('branch_ids') || []
                            if (isSelected) {
                              setValue(
                                'branch_ids',
                                currentValue.filter(id => id !== branch.id)
                              )
                            } else {
                              setValue('branch_ids', [...currentValue, branch.id])
                            }
                          }}
                          className="relative group transition-all duration-200 hover:scale-102"
                          style={{
                            backgroundColor: isSelected
                              ? COLORS.charcoal
                              : COLORS.charcoalLight + '50',
                            border: `2px solid ${isSelected ? COLORS.gold : COLORS.bronze + '40'}`,
                            borderRadius: '12px',
                            padding: '14px',
                            cursor: 'pointer',
                            boxShadow: isSelected ? `0 0 20px ${COLORS.gold}30` : 'none'
                          }}
                        >
                          {/* Selection Indicator */}
                          {isSelected && (
                            <div
                              className="absolute top-2 right-2 animate-in zoom-in duration-200"
                              style={{ color: COLORS.gold }}
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          )}

                          {/* Branch Icon */}
                          <div
                            className="mb-2 flex items-center justify-center w-10 h-10 rounded-lg mx-auto"
                            style={{
                              backgroundColor: isSelected
                                ? COLORS.gold + '20'
                                : COLORS.bronze + '20',
                              border: `1px solid ${isSelected ? COLORS.gold : COLORS.bronze}40`
                            }}
                          >
                            <MapPin
                              className="w-5 h-5"
                              style={{ color: isSelected ? COLORS.gold : COLORS.bronze }}
                            />
                          </div>

                          {/* Branch Name */}
                          <div className="text-center">
                            <p
                              className="font-semibold text-sm mb-0.5 truncate"
                              style={{
                                color: isSelected ? COLORS.champagne : COLORS.lightText
                              }}
                            >
                              {branch.entity_name}
                            </p>
                            {branch.entity_code && (
                              <p
                                className="text-xs truncate"
                                style={{
                                  color: COLORS.bronze,
                                  opacity: isSelected ? 0.9 : 0.6
                                }}
                              >
                                {branch.entity_code}
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
                <div className="mt-3">
                  {watch('branch_ids') && watch('branch_ids')!.length > 0 ? (
                    <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                      Assigned to:{' '}
                      <span style={{ color: COLORS.gold, fontWeight: 600 }}>
                        {watch('branch_ids')!.length} location
                        {watch('branch_ids')!.length > 1 ? 's' : ''}
                      </span>
                    </p>
                  ) : (
                    <div
                      className="p-3 rounded-lg border flex items-start gap-2 animate-in fade-in slide-in-from-top-2"
                      style={{
                        backgroundColor: COLORS.gold + '10',
                        borderColor: COLORS.gold + '40'
                      }}
                    >
                      <Building2
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: COLORS.gold }}
                      />
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: COLORS.gold }}>
                          Auto-Assignment Active
                        </p>
                        <p className="text-xs" style={{ color: COLORS.champagne, opacity: 0.9 }}>
                          No locations selected. This staff member will be automatically assigned to{' '}
                          <strong>
                            all {branches.length} location{branches.length > 1 ? 's' : ''}
                          </strong>{' '}
                          when saved.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Fields Toggle */}
            <div>
              <SalonLuxeButton
                type="button"
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full justify-between"
                icon={<Briefcase className="h-4 w-4" />}
              >
                <span>Advanced Options</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                )}
              </SalonLuxeButton>
            </div>

            {/* Advanced Fields (Expandable) */}
            {showAdvanced && (
              <div
                className="space-y-4 p-4 rounded-lg border"
                style={{
                  backgroundColor: COLORS.black,
                  borderColor: COLORS.gold + '20'
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourly_cost" style={{ color: COLORS.champagne }}>
                      Hourly Cost (AED)
                    </Label>
                    <Input
                      id="hourly_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      {...register('hourly_cost', { valueAsNumber: true })}
                      placeholder="80.00"
                      className="transition-all duration-200"
                      style={{
                        backgroundColor: COLORS.charcoalLight,
                        color: COLORS.champagne,
                        borderColor: COLORS.gold + '40',
                        padding: '0.75rem',
                        borderRadius: '0.375rem'
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_rate" style={{ color: COLORS.champagne }}>
                      Display Rate (AED/hr)
                    </Label>
                    <Input
                      id="display_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      {...register('display_rate', { valueAsNumber: true })}
                      placeholder="150.00"
                      className="transition-all duration-200"
                      style={{
                        backgroundColor: COLORS.charcoalLight,
                        color: COLORS.champagne,
                        borderColor: COLORS.gold + '40',
                        padding: '0.75rem',
                        borderRadius: '0.375rem'
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hire_date" style={{ color: COLORS.champagne }}>
                    <Calendar className="h-4 w-4 inline mr-2" style={{ color: COLORS.gold }} />
                    Hire Date
                  </Label>
                  <div className="relative">
                    <Input
                      id="hire_date"
                      type="date"
                      {...register('hire_date')}
                      className="transition-all duration-200 [color-scheme:dark]"
                      style={{
                        backgroundColor: COLORS.charcoalLight,
                        color: COLORS.champagne,
                        borderColor: COLORS.gold + '40',
                        padding: '0.75rem',
                        paddingRight: '3rem',
                        borderRadius: '0.375rem'
                      }}
                    />
                    <Calendar
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none"
                      style={{ color: COLORS.gold, opacity: 0.7 }}
                    />
                  </div>
                </div>

                {/* Document & Compliance Section - Enterprise Grade */}
                <div
                  className="mt-6 p-5 rounded-xl border"
                  style={{
                    backgroundColor: COLORS.charcoal + 'E6',
                    borderColor: COLORS.gold + '30',
                    boxShadow: `0 4px 12px ${COLORS.black}40`
                  }}
                >
                  {/* Section Header */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                    <h3
                      className="text-lg font-semibold tracking-wide"
                      style={{ color: COLORS.champagne }}
                    >
                      Document & Compliance Tracking
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Nationality */}
                    <div className="space-y-2">
                      <Label htmlFor="nationality" style={{ color: COLORS.champagne }}>
                        Nationality
                      </Label>
                      <Select
                        value={watch('nationality') || ''}
                        onValueChange={(value) => setValue('nationality', value)}
                      >
                        <SelectTrigger
                          className="border-[#D4AF37] focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                          style={{
                            backgroundColor: COLORS.charcoalLight,
                            color: COLORS.champagne,
                            borderColor: `${COLORS.gold}40`,
                            padding: '0.75rem'
                          }}
                        >
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content max-h-[300px]">
                          {NATIONALITIES.map((nationality) => (
                            <SelectItem key={nationality} value={nationality} className="hera-select-item">
                              {nationality}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Passport Number */}
                    <div className="space-y-2">
                      <Label htmlFor="passport_no" style={{ color: COLORS.champagne }}>
                        <FileText className="h-4 w-4 inline mr-2" />
                        Passport Number
                      </Label>
                      <Input
                        id="passport_no"
                        {...register('passport_no')}
                        placeholder="Enter passport number"
                        className="transition-all duration-200"
                        style={{
                          backgroundColor: COLORS.charcoalLight,
                          color: COLORS.champagne,
                          borderColor: COLORS.gold + '40',
                          padding: '0.75rem',
                          borderRadius: '0.375rem'
                        }}
                      />
                    </div>

                    {/* Visa Expiration Date with Status Indicator */}
                    <div className="space-y-2">
                      <Label htmlFor="visa_exp_date" style={{ color: COLORS.champagne }}>
                        <Calendar className="h-4 w-4 inline mr-2" style={{ color: COLORS.gold }} />
                        Visa Expiration Date
                      </Label>
                      <div className="relative">
                        <Input
                          id="visa_exp_date"
                          type="date"
                          {...register('visa_exp_date')}
                          className="transition-all duration-200 [color-scheme:dark]"
                          style={{
                            backgroundColor: COLORS.charcoalLight,
                            color: COLORS.champagne,
                            borderColor: watch('visa_exp_date')
                              ? getExpirationStatus(watch('visa_exp_date')).color
                              : COLORS.gold + '40',
                            padding: '0.75rem',
                            paddingRight: '3rem',
                            borderRadius: '0.375rem',
                            borderWidth: watch('visa_exp_date') ? '2px' : '1px'
                          }}
                        />
                        <Calendar
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none"
                          style={{
                            color: watch('visa_exp_date')
                              ? getExpirationStatus(watch('visa_exp_date')).color
                              : COLORS.gold,
                            opacity: 0.7
                          }}
                        />
                        {watch('visa_exp_date') && (
                          <div className="mt-2 flex items-center gap-2">
                            <div
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                              style={{
                                backgroundColor: getExpirationStatus(watch('visa_exp_date')).color + '20',
                                color: getExpirationStatus(watch('visa_exp_date')).color,
                                border: `1px solid ${getExpirationStatus(watch('visa_exp_date')).color}60`
                              }}
                            >
                              {getExpirationStatus(watch('visa_exp_date')).status === 'expired' && (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {getExpirationStatus(watch('visa_exp_date')).status === 'warning' && (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {getExpirationStatus(watch('visa_exp_date')).message}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Insurance Expiration Date with Status Indicator */}
                    <div className="space-y-2">
                      <Label htmlFor="insurance_exp_date" style={{ color: COLORS.champagne }}>
                        <Calendar className="h-4 w-4 inline mr-2" style={{ color: COLORS.gold }} />
                        Insurance Expiration Date
                      </Label>
                      <div className="relative">
                        <Input
                          id="insurance_exp_date"
                          type="date"
                          {...register('insurance_exp_date')}
                          className="transition-all duration-200 [color-scheme:dark]"
                          style={{
                            backgroundColor: COLORS.charcoalLight,
                            color: COLORS.champagne,
                            borderColor: watch('insurance_exp_date')
                              ? getExpirationStatus(watch('insurance_exp_date')).color
                              : COLORS.gold + '40',
                            padding: '0.75rem',
                            paddingRight: '3rem',
                            borderRadius: '0.375rem',
                            borderWidth: watch('insurance_exp_date') ? '2px' : '1px'
                          }}
                        />
                        <Calendar
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none"
                          style={{
                            color: watch('insurance_exp_date')
                              ? getExpirationStatus(watch('insurance_exp_date')).color
                              : COLORS.gold,
                            opacity: 0.7
                          }}
                        />
                        {watch('insurance_exp_date') && (
                          <div className="mt-2 flex items-center gap-2">
                            <div
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                              style={{
                                backgroundColor: getExpirationStatus(watch('insurance_exp_date')).color + '20',
                                color: getExpirationStatus(watch('insurance_exp_date')).color,
                                border: `1px solid ${getExpirationStatus(watch('insurance_exp_date')).color}60`
                              }}
                            >
                              {getExpirationStatus(watch('insurance_exp_date')).status === 'expired' && (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {getExpirationStatus(watch('insurance_exp_date')).status === 'warning' && (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {getExpirationStatus(watch('insurance_exp_date')).message}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enterprise Info Banner */}
                    {(getExpirationStatus(watch('visa_exp_date')).status === 'warning' ||
                      getExpirationStatus(watch('visa_exp_date')).status === 'expired' ||
                      getExpirationStatus(watch('insurance_exp_date')).status === 'warning' ||
                      getExpirationStatus(watch('insurance_exp_date')).status === 'expired') && (
                      <div
                        className="p-3 rounded-lg border flex items-start gap-2 animate-in fade-in slide-in-from-top-2"
                        style={{
                          backgroundColor: '#F59E0B20',
                          borderColor: '#F59E0B60'
                        }}
                      >
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#F59E0B' }} />
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: '#F59E0B' }}>
                            Compliance Alert
                          </p>
                          <p className="text-xs" style={{ color: COLORS.champagne, opacity: 0.9 }}>
                            {getExpirationStatus(watch('visa_exp_date')).status === 'expired' ||
                            getExpirationStatus(watch('insurance_exp_date')).status === 'expired'
                              ? 'Critical: One or more documents have expired. Please renew immediately.'
                              : 'Warning: Documents expiring within 30 days. Schedule renewal soon.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </SalonLuxeModal>

      {/* Enterprise Delete Confirmation Dialog */}
      <SalonLuxeModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Permanent Deletion Warning"
        description="This action cannot be undone"
        icon={<Trash2 className="h-6 w-6" style={{ color: '#DC2626' }} />}
        size="md"
        footer={
          <>
            <SalonLuxeButton
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </SalonLuxeButton>
            <SalonLuxeButton
              variant="destructive"
              onClick={handleDelete}
              loading={isDeleting}
              icon={<Trash2 className="h-4 w-4" />}
            >
              Yes, Delete Permanently
            </SalonLuxeButton>
          </>
        }
      >
        <div className="space-y-4">
            <div
              className="p-4 rounded-lg border-l-4"
              style={{
                backgroundColor: '#991B1B10',
                borderColor: '#991B1B'
              }}
            >
              <p className="font-semibold mb-2" style={{ color: COLORS.champagne }}>
                You are about to permanently delete:
              </p>
              <p className="text-lg font-bold" style={{ color: COLORS.gold }}>
                &ldquo;{staff?.entity_name || `${staff?.first_name} ${staff?.last_name}`}&rdquo;
              </p>
            </div>

            <div className="space-y-2" style={{ color: COLORS.lightText }}>
              <p className="font-semibold" style={{ color: '#FEE2E2' }}>
                ⚠️ This action is irreversible and will:
              </p>
              <ul
                className="list-disc list-inside space-y-1 ml-4"
                style={{ color: COLORS.lightText }}
              >
                <li>Permanently remove this staff member from the system</li>
                <li>Cannot be recovered after deletion</li>
                <li>Remove all associated records and history</li>
                <li>Impact any linked appointments or services</li>
              </ul>
            </div>

            <div
              className="p-3 rounded-lg text-sm"
              style={{
                backgroundColor: COLORS.black,
                border: `1px solid ${COLORS.gold}40`
              }}
            >
              <p style={{ color: COLORS.bronze }}>
                💡 <strong>Enterprise Tip:</strong> Consider archiving instead if you might need
                this staff record in the future. Archived staff can be restored.
              </p>
            </div>
          </div>
        </SalonLuxeModal>
    </>
  )
}
