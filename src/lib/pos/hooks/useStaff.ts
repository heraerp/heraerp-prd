/**
 * HERA POS Staff Hook
 * Smart Code: HERA.RETAIL.POS.HOOK.STAFF.v1
 * 
 * React hook for managing staff entities with Indian compliance and real Supabase data
 */

import { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { createUniversalPOSService, POS_SMART_CODES, POSServiceResponse, POSEntity } from '../universal-pos-service'

// ==================== Types ====================

export interface StaffMember {
  id?: string
  name: string
  email?: string
  phone?: string
  role: 'manager' | 'cashier' | 'sales_associate' | 'security' | 'cleaner'
  salary?: number
  hireDate: string
  panNumber?: string  // Indian compliance
  aadharNumber?: string  // Indian compliance
  status?: 'active' | 'inactive' | 'on_leave' | 'terminated'
  permissions?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface StaffFilters {
  search?: string
  role?: string
  status?: string
  hiredAfter?: string
  hiredBefore?: string
}

// ==================== Hook ====================

export function useStaff() {
  const { organization } = useHERAAuth()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create service instance
  const posService = organization ? createUniversalPOSService(organization.id) : null

  // ============ Staff Roles Configuration ============

  const staffRoles = [
    { value: 'manager', label: 'Store Manager', permissions: ['all'] },
    { value: 'cashier', label: 'Cashier', permissions: ['pos', 'payments'] },
    { value: 'sales_associate', label: 'Sales Associate', permissions: ['pos', 'customers'] },
    { value: 'security', label: 'Security Guard', permissions: ['basic'] },
    { value: 'cleaner', label: 'Cleaner', permissions: ['basic'] }
  ]

  // ============ Load Staff ============

  const loadStaff = async (filters?: StaffFilters) => {
    if (!posService) {
      setError('Organization context required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await posService.searchEntities('STAFF', {
        search: filters?.search,
        limit: 100,
        offset: 0
      })

      if (response.success && response.data) {
        const formattedStaff = response.data.map(member => 
          posService.convertToUIFormat(member)
        )
        
        // Apply client-side filters
        let filteredStaff = formattedStaff
        
        if (filters?.role && filters.role !== 'all') {
          filteredStaff = filteredStaff.filter(member => member.role === filters.role)
        }

        if (filters?.status && filters.status !== 'all') {
          filteredStaff = filteredStaff.filter(member => member.status === filters.status)
        }

        if (filters?.hiredAfter) {
          filteredStaff = filteredStaff.filter(member => 
            new Date(member.hireDate) >= new Date(filters.hiredAfter!)
          )
        }

        if (filters?.hiredBefore) {
          filteredStaff = filteredStaff.filter(member => 
            new Date(member.hireDate) <= new Date(filters.hiredBefore!)
          )
        }

        setStaff(filteredStaff)
      } else {
        setError(response.error || 'Failed to load staff')
        setStaff([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  // ============ Create Staff Member ============

  const createStaffMember = async (staffData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<POSServiceResponse<POSEntity>> => {
    if (!posService) {
      return { success: false, error: 'Organization context required' }
    }

    // Validate Indian compliance fields
    if (!staffData.panNumber && !staffData.aadharNumber) {
      return { 
        success: false, 
        error: 'Either PAN number or Aadhar number is required for Indian compliance' 
      }
    }

    const dynamicFields = [
      {
        field_name: 'role',
        field_type: 'text' as const,
        field_value_text: staffData.role,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.ROLE
      },
      {
        field_name: 'hire_date',
        field_type: 'date' as const,
        field_value_text: staffData.hireDate,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.HIRE_DATE
      }
    ]

    if (staffData.email) {
      dynamicFields.push({
        field_name: 'email',
        field_type: 'email' as const,
        field_value_text: staffData.email,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.EMAIL
      })
    }

    if (staffData.phone) {
      dynamicFields.push({
        field_name: 'phone',
        field_type: 'phone' as const,
        field_value_text: staffData.phone,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.PHONE
      })
    }

    if (staffData.salary) {
      dynamicFields.push({
        field_name: 'salary',
        field_type: 'currency' as const,
        field_value_number: staffData.salary,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.SALARY
      })
    }

    // Indian compliance fields
    if (staffData.panNumber) {
      dynamicFields.push({
        field_name: 'pan_number',
        field_type: 'text' as const,
        field_value_text: staffData.panNumber,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.PAN_NUMBER
      })
    }

    if (staffData.aadharNumber) {
      dynamicFields.push({
        field_name: 'aadhar_number',
        field_type: 'text' as const,
        field_value_text: staffData.aadharNumber,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.AADHAR_NUMBER
      })
    }

    const result = await posService.createEntity({
      entity_type: 'STAFF',
      entity_name: staffData.name,
      smart_code: POS_SMART_CODES.STAFF,
      organization_id: organization!.id,
      dynamic_fields: dynamicFields
    })

    // Refresh staff list if successful
    if (result.success) {
      loadStaff()
    }

    return result
  }

  // ============ Update Staff Member ============

  const updateStaffMember = async (staffId: string, updates: Partial<StaffMember>): Promise<POSServiceResponse<POSEntity>> => {
    if (!posService) {
      return { success: false, error: 'Organization context required' }
    }

    const dynamicFields = []

    if (updates.email !== undefined) {
      dynamicFields.push({
        field_name: 'email',
        field_type: 'email' as const,
        field_value_text: updates.email,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.EMAIL
      })
    }

    if (updates.phone !== undefined) {
      dynamicFields.push({
        field_name: 'phone',
        field_type: 'phone' as const,
        field_value_text: updates.phone,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.PHONE
      })
    }

    if (updates.role !== undefined) {
      dynamicFields.push({
        field_name: 'role',
        field_type: 'text' as const,
        field_value_text: updates.role,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.ROLE
      })
    }

    if (updates.salary !== undefined) {
      dynamicFields.push({
        field_name: 'salary',
        field_type: 'currency' as const,
        field_value_number: updates.salary,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.SALARY
      })
    }

    if (updates.hireDate !== undefined) {
      dynamicFields.push({
        field_name: 'hire_date',
        field_type: 'date' as const,
        field_value_text: updates.hireDate,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.HIRE_DATE
      })
    }

    if (updates.panNumber !== undefined) {
      dynamicFields.push({
        field_name: 'pan_number',
        field_type: 'text' as const,
        field_value_text: updates.panNumber,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.PAN_NUMBER
      })
    }

    if (updates.aadharNumber !== undefined) {
      dynamicFields.push({
        field_name: 'aadhar_number',
        field_type: 'text' as const,
        field_value_text: updates.aadharNumber,
        smart_code: POS_SMART_CODES.FIELDS.STAFF.AADHAR_NUMBER
      })
    }

    const result = await posService.updateEntity(staffId, {
      entity_name: updates.name,
      dynamic_fields: dynamicFields
    })

    // Refresh staff list if successful
    if (result.success) {
      loadStaff()
    }

    return result
  }

  // ============ Delete Staff Member ============

  const deleteStaffMember = async (staffId: string): Promise<POSServiceResponse<boolean>> => {
    if (!posService) {
      return { success: false, error: 'Organization context required' }
    }

    const result = await posService.deleteEntity(staffId)

    // Refresh staff list if successful
    if (result.success) {
      loadStaff()
    }

    return result
  }

  // ============ Get Staff Member by ID ============

  const getStaffMember = async (staffId: string): Promise<StaffMember | null> => {
    if (!posService) {
      return null
    }

    const response = await posService.getEntity(staffId)
    
    if (response.success && response.data) {
      return posService.convertToUIFormat(response.data)
    }

    return null
  }

  // ============ Staff Analytics ============

  const getStaffStats = () => {
    const totalStaff = staff.length
    const activeStaff = staff.filter(member => member.status === 'active').length
    const onLeave = staff.filter(member => member.status === 'on_leave').length
    const roleDistribution = staff.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const averageSalary = staff.length > 0 
      ? staff.reduce((sum, member) => sum + (member.salary || 0), 0) / staff.filter(member => member.salary).length 
      : 0

    return {
      totalStaff,
      activeStaff,
      onLeave,
      roleDistribution,
      averageSalary: Math.round(averageSalary),
      complianceRate: Math.round((staff.filter(member => member.panNumber || member.aadharNumber).length / totalStaff) * 100)
    }
  }

  // ============ Role Management ============

  const getPermissionsForRole = (role: string): string[] => {
    const roleConfig = staffRoles.find(r => r.value === role)
    return roleConfig?.permissions || ['basic']
  }

  const hasPermission = (staffMember: StaffMember, permission: string): boolean => {
    const rolePermissions = getPermissionsForRole(staffMember.role)
    return rolePermissions.includes('all') || rolePermissions.includes(permission)
  }

  // ============ Indian Compliance Helpers ============

  const validatePAN = (panNumber: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    return panRegex.test(panNumber)
  }

  const validateAadhar = (aadharNumber: string): boolean => {
    const aadharRegex = /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/
    return aadharRegex.test(aadharNumber.replace(/\s/g, ''))
  }

  // ============ Auto-load on mount ============

  useEffect(() => {
    if (organization) {
      loadStaff()
    }
  }, [organization])

  // ============ Return Hook Interface ============

  return {
    // Data
    staff,
    loading,
    error,
    staffRoles,

    // Actions
    loadStaff,
    createStaffMember,
    updateStaffMember,
    deleteStaffMember,
    getStaffMember,

    // Analytics
    getStaffStats,

    // Permissions
    getPermissionsForRole,
    hasPermission,

    // Indian Compliance
    validatePAN,
    validateAadhar,

    // Utilities
    refresh: () => loadStaff()
  }
}