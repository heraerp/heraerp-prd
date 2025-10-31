'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { callRPC } from '@/lib/universal-api-v2-client'
import { useUniversalTransactionV1 } from '@/hooks/useUniversalTransactionV1'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// ============================================================================
// 🏛️ LEAVE MANAGEMENT HOOK - ENTERPRISE GRADE (RPC-FIRST)
// ============================================================================
// Architecture: HERA Universal Entity V1 + Transactions V1
// - Leave Requests → universal_transactions (transaction_type: 'LEAVE')
// - Leave Policies → core_entities (entity_type: 'LEAVE_POLICY')
// - Staff → core_entities (entity_type: 'STAFF')
// - Status Workflow → transaction_status field (submitted, approved, rejected, cancelled)
// - ✅ UPGRADED: Using useUniversalTransactionV1 hook (hera_txn_crud_v1 orchestrator)
// ============================================================================

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface LeaveRequest {
  id: string
  transaction_code: string
  transaction_date: string
  staff_id: string
  staff_name: string
  manager_id: string
  manager_name: string
  leave_type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
  start_date: string
  end_date: string
  total_days: number
  isHalfDay?: boolean // ✅ Half-day leave flag
  halfDayPeriod?: 'morning' | 'afternoon' // ✅ Which half of the day
  reason: string
  notes?: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled' // ✅ Removed 'pending'
  submitted_at: string
  approved_at?: string
  approved_by?: string
  approved_by_name?: string // ✅ Stored approver name (for reports)
  approval_notes?: string
  rejected_at?: string
  rejected_by?: string
  rejected_by_name?: string // ✅ Stored rejector name (for reports)
  rejection_reason?: string
  smart_code: string
}

export interface LeavePolicy {
  id: string
  entity_name: string
  leave_type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
  annual_entitlement: number
  carry_over_cap: number
  min_notice_days: number
  max_consecutive_days: number
  min_leave_days: number
  accrual_method: 'IMMEDIATE' | 'MONTHLY'
  probation_period_months: number
  applies_to: 'FULL_TIME' | 'PART_TIME' | 'ALL'
  effective_from: string
  effective_to?: string
  description?: string
  active: boolean
}

export interface LeaveBalance {
  staff_id: string
  staff_name: string
  policy_id: string
  policy_name: string
  entitlement: number
  carry_over: number
  total_allocation: number
  used_days: number
  pending_days: number
  remaining_days: number
  available_days: number
  hire_date: string
  months_worked: number
  annual_entitlement: number
  accrual_method: string
}

export interface CreateLeaveRequestInput {
  staff_id: string
  manager_id: string
  leave_type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
  start_date: string
  end_date: string
  reason: string
  notes?: string
  status?: 'draft' | 'submitted' // ✅ Removed 'pending'
  isHalfDay?: boolean // ✅ Half-day leave flag
  halfDayPeriod?: 'morning' | 'afternoon' // ✅ Which half of the day (morning/afternoon)
  totalDays?: number // ✅ Pre-calculated total days (respects half-day = 0.5)
}

interface UseHeraLeaveOptions {
  organizationId: string
  branchId?: string
  year?: number
  includeArchived?: boolean
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate total days between start and end date (inclusive)
 */
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // Include both start and end date
}

/**
 * Generate transaction code for leave request
 */
function generateTransactionCode(year: number): string {
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `LEAVE-${year}-${randomId}`
}

/**
 * Get matching leave policy for staff member
 */
function getMatchingPolicy(
  staffMember: any,
  policies: LeavePolicy[],
  leaveType: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER' = 'ANNUAL'
): LeavePolicy | null {
  // Find matching active policy
  const policy = policies.find(p =>
    p.active &&
    p.leave_type === leaveType &&
    p.applies_to === 'ALL' // For now, only match ALL policies
  )

  return policy || null
}

/**
 * Calculate prorated entitlement based on hire date and policy
 */
function calculateProratedEntitlement(
  hireDate: string | undefined,
  currentYear: number,
  annualEntitlement: number,
  accrualMethod: 'IMMEDIATE' | 'MONTHLY' = 'MONTHLY'
): number {
  // If no hire date, use January 1st of current year as default
  const hire = hireDate ? new Date(hireDate) : new Date(currentYear, 0, 1)
  const hireYear = hire.getFullYear()
  const hireMonth = hire.getMonth() // 0-11

  // If accrual method is IMMEDIATE, give full entitlement
  if (accrualMethod === 'IMMEDIATE') {
    return annualEntitlement
  }

  // MONTHLY accrual method
  const MONTHLY_ACCRUAL = annualEntitlement / 12

  if (hireYear > currentYear) return 0 // Not hired yet

  if (hireYear < currentYear) {
    return annualEntitlement // Full entitlement for previous years
  }

  // Hired this year - prorated from hire month
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() // 0-11

  // Months worked (inclusive of hire month)
  const monthsWorked = Math.max(0, currentMonth - hireMonth + 1)

  // Prorated entitlement
  return Math.round(monthsWorked * MONTHLY_ACCRUAL * 10) / 10 // Round to 1 decimal
}

// ============================================================================
// Main Hook
// ============================================================================

export function useHeraLeave(options: UseHeraLeaveOptions) {
  const { organizationId, branchId, year = new Date().getFullYear(), includeArchived = false } = options
  const queryClient = useQueryClient()
  const { user } = useHERAAuth()

  // ============================================================================
  // Fetch Leave Policies (Entities)
  // ============================================================================

  const {
    data: policiesData,
    isLoading: policiesLoading,
    error: policiesError
  } = useQuery({
    queryKey: ['leave-policies', organizationId, includeArchived],
    queryFn: async () => {
      const entityFilter: any = {
        entity_type: 'LEAVE_POLICY'  // ✅ CORRECT: Inside p_entity
      }

      // ✅ OPTIMIZED: Load all data once, filter client-side
      // Only exclude archived if explicitly disabled
      if (!includeArchived) {
        entityFilter.status = 'active'
      }

      const result = await callRPC('hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: user?.id || '',
        p_organization_id: organizationId,
        p_entity: entityFilter,
        p_options: {
          include_dynamic: true,
          include_relationships: false
        }
      })

      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!organizationId && !!user?.id,
    // ✅ PERFORMANCE: Smart caching for policies (changes infrequently)
    staleTime: 30000, // 30 seconds - policies don't change often
    gcTime: 5 * 60 * 1000 // 5 minutes in cache
  })

  // ============================================================================
  // Fetch Staff (Entities)
  // ============================================================================

  const {
    data: staffData,
    isLoading: staffLoading,
    error: staffError
  } = useQuery({
    queryKey: ['staff', organizationId],
    queryFn: async () => {
      const result = await callRPC('hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: user?.id || '',
        p_organization_id: organizationId,
        p_entity: {
          entity_type: 'STAFF',
          status: 'active'
        },
        p_options: {
          include_dynamic: true,
          include_relationships: false
        }
      })

      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!organizationId && !!user?.id,
    // ✅ PERFORMANCE: Smart caching for staff (changes infrequently)
    staleTime: 30000, // 30 seconds - staff roster doesn't change often
    gcTime: 5 * 60 * 1000 // 5 minutes in cache
  })

  // ============================================================================
  // ✅ UPGRADED: Fetch Leave Requests using useUniversalTransactionV1
  // ============================================================================

  const {
    transactions: leaveTransactions,
    isLoading: requestsLoading,
    error: requestsErrorMsg,
    create: createTransaction,
    update: updateTransaction
  } = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'LEAVE',
      include_lines: false,
      include_deleted: false
    }
  })

  // Map error format
  const requestsError = requestsErrorMsg ? { message: requestsErrorMsg } : null
  const requestsData = { items: leaveTransactions }

  // ============================================================================
  // Transform Data
  // ============================================================================

  const policies: LeavePolicy[] = React.useMemo(() => {
    const list = policiesData?.data?.list || policiesData?.list || policiesData?.items || []
    if (!list.length) return []

    // Transform to LeavePolicy objects (return ALL, filtering happens in UI)
    return list.map((item: any) => {
      // Extract entity and dynamic_data from the item
      const entity = item.entity || item
      const dynamicDataArray = item.dynamic_data || []

      // Convert dynamic_data array to object for easy access
      const dynamicData: Record<string, any> = {}
      dynamicDataArray.forEach((field: any) => {
        const fieldName = field.field_name
        // Use the appropriate field value based on field_type
        const value = field.field_value_text ||
                     field.field_value_number ||
                     field.field_value_boolean ||
                     field.field_value_date ||
                     field.field_value_json
        dynamicData[fieldName] = value
      })

      return {
        id: entity.id,
        entity_name: entity.entity_name,
        leave_type: dynamicData.leave_type || 'ANNUAL',
        annual_entitlement: dynamicData.annual_entitlement || 21,
        carry_over_cap: dynamicData.carry_over_cap || 5,
        min_notice_days: dynamicData.min_notice_days || 7,
        max_consecutive_days: dynamicData.max_consecutive_days || 15,
        min_leave_days: dynamicData.min_leave_days || 0.5,
        accrual_method: dynamicData.accrual_method || 'IMMEDIATE',
        probation_period_months: dynamicData.probation_period_months || 3,
        applies_to: dynamicData.applies_to || 'ALL',
        effective_from: dynamicData.effective_from || entity.created_at || new Date().toISOString(),
        effective_to: dynamicData.effective_to,
        description: dynamicData.description,
        // ✅ FIXED: Use entity.status (not dynamic data) - matches services page pattern
        active: entity.status === 'active' || entity.status === null || entity.status === undefined
      }
    })
  }, [policiesData])

  const staff = React.useMemo(() => {
    const list = staffData?.data?.list || staffData?.list || staffData?.items || []
    if (!list.length) return []

    return list.map((item: any) => {
      // Extract entity and dynamic_data from the item
      const entity = item.entity || item
      const dynamicDataArray = item.dynamic_data || []

      // Convert dynamic_data array to object for easy access
      const dynamicData: Record<string, any> = {}
      dynamicDataArray.forEach((field: any) => {
        const fieldName = field.field_name
        const value = field.field_value_text ||
                     field.field_value_number ||
                     field.field_value_boolean ||
                     field.field_value_date ||
                     field.field_value_json
        dynamicData[fieldName] = value
      })

      return {
        id: entity.id,
        entity_name: entity.entity_name,
        first_name: dynamicData.first_name,
        last_name: dynamicData.last_name,
        email: dynamicData.email,
        role_title: dynamicData.role_title,
        hire_date: dynamicData.hire_date
      }
    })
  }, [staffData])

  const requests: LeaveRequest[] = React.useMemo(() => {
    if (!requestsData?.items || !staff.length) return []

    const staffMap = new Map(staff.map(s => [s.id, s.entity_name]))

    // ✅ FILTER: Exclude soft-deleted transactions AND enforce LEAVE transaction type
    // 🐛 WORKAROUND: RPC hera_txn_crud_v1 QUERY action ignores transaction_type filter
    // Filter client-side until RPC is fixed
    const activeTransactions = requestsData.items.filter((txn: any) =>
      !txn.deleted_at && txn.transaction_type === 'LEAVE'
    )

    return activeTransactions.map((txn: any) => ({
      id: txn.id,
      transaction_code: txn.transaction_code,
      transaction_date: txn.transaction_date,
      staff_id: txn.source_entity_id,
      staff_name: staffMap.get(txn.source_entity_id) || 'Unknown',
      manager_id: txn.target_entity_id,
      manager_name: staffMap.get(txn.target_entity_id) || 'Unknown',
      leave_type: txn.metadata?.leave_type || 'ANNUAL',
      start_date: txn.metadata?.start_date,
      end_date: txn.metadata?.end_date,
      total_days: txn.metadata?.total_days || txn.total_amount,
      isHalfDay: txn.metadata?.isHalfDay || false,
      halfDayPeriod: txn.metadata?.halfDayPeriod || undefined,
      reason: txn.metadata?.reason || '',
      notes: txn.metadata?.notes,
      status: txn.transaction_status || 'submitted',
      submitted_at: txn.metadata?.submitted_at || txn.created_at,
      approved_at: txn.metadata?.approved_at,
      approved_by: txn.metadata?.approved_by,
      approved_by_name: txn.metadata?.approved_by_name, // ✅ Extract stored approver name
      approval_notes: txn.metadata?.approval_notes,
      rejected_at: txn.metadata?.rejected_at,
      rejected_by: txn.metadata?.rejected_by,
      rejected_by_name: txn.metadata?.rejected_by_name, // ✅ Extract stored rejector name
      rejection_reason: txn.metadata?.rejection_reason,
      smart_code: txn.smart_code
    }))
  }, [requestsData, staff])

  // ============================================================================
  // Calculate Leave Balances (In-Memory)
  // ============================================================================

  const balances: Record<string, LeaveBalance> = React.useMemo(() => {
    if (!staff.length) return {}

    const balanceMap: Record<string, LeaveBalance> = {}

    staff.forEach((staffMember: any) => {
      // Get hire date (default to Jan 1 of current year if missing)
      const hireDate = staffMember.hire_date || `${year}-01-01`

      // Get staff's annual entitlement from policy
      const policy = getMatchingPolicy(staffMember, policies, 'ANNUAL')
      const annualEntitlement = policy?.annual_entitlement || 30
      const accrualMethod = policy?.accrual_method || 'MONTHLY'

      // Calculate prorated entitlement
      const entitlement = calculateProratedEntitlement(
        hireDate,
        year,
        annualEntitlement,
        accrualMethod
      )

      // Get staff requests
      const staffRequests = requests.filter(req => req.staff_id === staffMember.id)

      const usedDays = staffRequests
        .filter(req => req.status === 'approved')
        .reduce((sum, req) => sum + req.total_days, 0)

      const pendingDays = staffRequests
        .filter(req => req.status === 'submitted')
        .reduce((sum, req) => sum + req.total_days, 0)

      const carryOver = 0 // TODO: Implement carry-over logic if needed
      const totalAllocation = entitlement + carryOver
      const remainingDays = totalAllocation - usedDays
      const availableDays = remainingDays - pendingDays

      // Calculate months worked for display
      const hire = new Date(hireDate)
      const currentDate = new Date()
      const monthsWorked = Math.max(
        0,
        Math.min(12, (currentDate.getFullYear() - hire.getFullYear()) * 12 + (currentDate.getMonth() - hire.getMonth()) + 1)
      )

      balanceMap[staffMember.id] = {
        staff_id: staffMember.id,
        staff_name: staffMember.entity_name,
        policy_id: policy?.id || '',
        policy_name: policy?.entity_name || 'Default Policy',
        entitlement,
        carry_over: carryOver,
        total_allocation: totalAllocation,
        used_days: usedDays,
        pending_days: pendingDays,
        remaining_days: remainingDays,
        available_days: availableDays,
        hire_date: hireDate,
        months_worked: monthsWorked,
        annual_entitlement: annualEntitlement,
        accrual_method: accrualMethod
      }
    })

    return balanceMap
  }, [staff, requests, policies, year])

  // ============================================================================
  // ✅ UPGRADED: Mutations using useUniversalTransactionV1 + useUniversalEntityV1
  // ============================================================================

  // Policy creation mutation (uses entity CRUD)
  const createPolicyMutation = useMutation({
    mutationFn: async (data: {
      policy_name: string
      leave_type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
      annual_entitlement: number
      accrual_method: 'IMMEDIATE' | 'MONTHLY'
      applies_to: 'FULL_TIME' | 'PART_TIME' | 'ALL'
      min_notice_days: number
      max_consecutive_days: number
      min_leave_days: number
      carry_over_cap?: number
      probation_period_months?: number
      effective_from?: string
      effective_to?: string
      description?: string
      active: boolean
    }) => {
      if (!user?.id) {
        throw new Error('User ID required for policy creation')
      }

      const result = await callRPC('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: user.id,
        p_organization_id: organizationId,
        p_entity: {
          entity_type: 'LEAVE_POLICY',  // ✅ CORRECT: Inside p_entity, not separate parameter
          entity_name: data.policy_name,
          smart_code: `HERA.SALON.LEAVE.POLICY.${data.leave_type}.v1`,
          status: 'active'
        },
        p_dynamic: {
          // ✅ CORRECT: SIMPLE format with {value, type, smart_code}
          leave_type: {
            value: data.leave_type,
            type: 'text',
            smart_code: 'HERA.SALON.LEAVE.FIELD.TYPE.v1'
          },
          annual_entitlement: {
            value: String(data.annual_entitlement),
            type: 'number',
            smart_code: 'HERA.SALON.LEAVE.FIELD.ENTITLEMENT.v1'
          },
          carry_over_cap: {
            value: String(data.carry_over_cap || 5),
            type: 'number',
            smart_code: 'HERA.SALON.LEAVE.FIELD.CARRYOVER.v1'
          },
          min_notice_days: {
            value: String(data.min_notice_days),
            type: 'number',
            smart_code: 'HERA.SALON.LEAVE.FIELD.NOTICE.v1'
          },
          max_consecutive_days: {
            value: String(data.max_consecutive_days),
            type: 'number',
            smart_code: 'HERA.SALON.LEAVE.FIELD.MAXDAYS.v1'
          },
          min_leave_days: {
            value: String(data.min_leave_days),
            type: 'number',
            smart_code: 'HERA.SALON.LEAVE.FIELD.MINDAYS.v1'
          },
          accrual_method: {
            value: data.accrual_method,
            type: 'text',
            smart_code: 'HERA.SALON.LEAVE.FIELD.ACCRUAL.v1'
          },
          probation_period_months: {
            value: String(data.probation_period_months || 3),
            type: 'number',
            smart_code: 'HERA.SALON.LEAVE.FIELD.PROBATION.v1'
          },
          applies_to: {
            value: data.applies_to,
            type: 'text',
            smart_code: 'HERA.SALON.LEAVE.FIELD.APPLIES.v1'
          },
          effective_from: {
            value: data.effective_from || new Date().toISOString(),
            type: 'date',
            smart_code: 'HERA.SALON.LEAVE.FIELD.EFFECTIVEFROM.v1'
          },
          ...(data.effective_to && {
            effective_to: {
              value: data.effective_to,
              type: 'date',
              smart_code: 'HERA.SALON.LEAVE.FIELD.EFFECTIVETO.v1'
            }
          }),
          ...(data.description && {
            description: {
              value: data.description,
              type: 'text',
              smart_code: 'HERA.SALON.LEAVE.FIELD.DESCRIPTION.v1'
            }
          }),
          active: {
            value: String(data.active),
            type: 'boolean',
            smart_code: 'HERA.SALON.LEAVE.FIELD.ACTIVE.v1'
          }
        },
        p_relationships: {},  // ✅ CORRECT: Empty object, not array
        p_options: {
          include_dynamic: true,  // ✅ CORRECT: include_dynamic, not include_dynamic_data
          include_relationships: false
        }
      })

      if (result.error) {
        throw new Error(result.error.message || 'Failed to create policy')
      }

      if (result.data && !result.data.success) {
        throw new Error(result.data.error || 'RPC returned failure')
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-policies', organizationId] })
    }
  })

  // Policy update mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string
      data: {
        policy_name?: string
        leave_type?: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
        annual_entitlement?: number
        accrual_method?: 'IMMEDIATE' | 'MONTHLY'
        applies_to?: 'FULL_TIME' | 'PART_TIME' | 'ALL'
        min_notice_days?: number
        max_consecutive_days?: number
        min_leave_days?: number
        carry_over_cap?: number
        probation_period_months?: number
        effective_from?: string
        effective_to?: string
        description?: string
        active?: boolean
      }
    }) => {
      if (!user?.id) {
        throw new Error('User ID required for policy update')
      }

      // Build dynamic fields patch (only include fields that are being updated)
      const p_dynamic: Record<string, any> = {}

      if (data.leave_type !== undefined) {
        p_dynamic.leave_type = {
          value: data.leave_type,
          type: 'text',
          smart_code: 'HERA.SALON.LEAVE.FIELD.TYPE.v1'
        }
      }
      if (data.annual_entitlement !== undefined) {
        p_dynamic.annual_entitlement = {
          value: String(data.annual_entitlement),
          type: 'number',
          smart_code: 'HERA.SALON.LEAVE.FIELD.ENTITLEMENT.v1'
        }
      }
      if (data.carry_over_cap !== undefined) {
        p_dynamic.carry_over_cap = {
          value: String(data.carry_over_cap),
          type: 'number',
          smart_code: 'HERA.SALON.LEAVE.FIELD.CARRYOVER.v1'
        }
      }
      if (data.min_notice_days !== undefined) {
        p_dynamic.min_notice_days = {
          value: String(data.min_notice_days),
          type: 'number',
          smart_code: 'HERA.SALON.LEAVE.FIELD.NOTICE.v1'
        }
      }
      if (data.max_consecutive_days !== undefined) {
        p_dynamic.max_consecutive_days = {
          value: String(data.max_consecutive_days),
          type: 'number',
          smart_code: 'HERA.SALON.LEAVE.FIELD.MAXDAYS.v1'
        }
      }
      if (data.min_leave_days !== undefined) {
        p_dynamic.min_leave_days = {
          value: String(data.min_leave_days),
          type: 'number',
          smart_code: 'HERA.SALON.LEAVE.FIELD.MINDAYS.v1'
        }
      }
      if (data.accrual_method !== undefined) {
        p_dynamic.accrual_method = {
          value: data.accrual_method,
          type: 'text',
          smart_code: 'HERA.SALON.LEAVE.FIELD.ACCRUAL.v1'
        }
      }
      if (data.probation_period_months !== undefined) {
        p_dynamic.probation_period_months = {
          value: String(data.probation_period_months),
          type: 'number',
          smart_code: 'HERA.SALON.LEAVE.FIELD.PROBATION.v1'
        }
      }
      if (data.applies_to !== undefined) {
        p_dynamic.applies_to = {
          value: data.applies_to,
          type: 'text',
          smart_code: 'HERA.SALON.LEAVE.FIELD.APPLIES.v1'
        }
      }
      if (data.effective_from !== undefined) {
        p_dynamic.effective_from = {
          value: data.effective_from,
          type: 'date',
          smart_code: 'HERA.SALON.LEAVE.FIELD.EFFECTIVEFROM.v1'
        }
      }
      if (data.effective_to !== undefined) {
        p_dynamic.effective_to = {
          value: data.effective_to,
          type: 'date',
          smart_code: 'HERA.SALON.LEAVE.FIELD.EFFECTIVETO.v1'
        }
      }
      if (data.description !== undefined) {
        p_dynamic.description = {
          value: data.description,
          type: 'text',
          smart_code: 'HERA.SALON.LEAVE.FIELD.DESCRIPTION.v1'
        }
      }
      if (data.active !== undefined) {
        p_dynamic.active = {
          value: String(data.active),
          type: 'boolean',
          smart_code: 'HERA.SALON.LEAVE.FIELD.ACTIVE.v1'
        }
      }

      // Build entity patch (only include fields that are being updated)
      const p_entity: Record<string, any> = { entity_id: id }
      if (data.policy_name !== undefined) {
        p_entity.entity_name = data.policy_name
      }
      if (data.leave_type !== undefined) {
        p_entity.smart_code = `HERA.SALON.LEAVE.POLICY.${data.leave_type}.v1`
      }

      const result = await callRPC('hera_entities_crud_v1', {
        p_action: 'UPDATE',
        p_actor_user_id: user.id,
        p_organization_id: organizationId,
        p_entity,
        p_dynamic,
        p_options: {
          include_dynamic: true,
          include_relationships: false
        }
      })

      if (result.error) {
        throw new Error(result.error.message || 'Failed to update policy')
      }

      return { id, data: result.data }
    },
    onSuccess: () => {
      // ✅ SIMPLE: Just invalidate - let React Query refetch with latest data
      queryClient.invalidateQueries({ queryKey: ['leave-policies', organizationId] })
    }
  })

  // Policy archive mutation (soft delete)
  const archivePolicyMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) {
        throw new Error('User ID required for policy archive')
      }

      const result = await callRPC('hera_entities_crud_v1', {
        p_action: 'UPDATE',
        p_actor_user_id: user.id,
        p_organization_id: organizationId,
        p_entity: {
          entity_id: id,
          status: 'archived'
        },
        p_options: {
          include_dynamic: true,
          include_relationships: false
        }
      })

      if (result.error) {
        throw new Error(result.error.message || 'Failed to archive policy')
      }

      return { id, data: result.data }
    },
    onSuccess: () => {
      // ✅ SIMPLE: Just invalidate - let React Query refetch with latest data
      queryClient.invalidateQueries({ queryKey: ['leave-policies', organizationId] })
    }
  })

  // Policy restore mutation
  const restorePolicyMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) {
        throw new Error('User ID required for policy restore')
      }

      // ✅ SIMPLE: Only update entity.status (like services page) - no dynamic fields needed
      const result = await callRPC('hera_entities_crud_v1', {
        p_action: 'UPDATE',
        p_actor_user_id: user.id,
        p_organization_id: organizationId,
        p_entity: {
          entity_id: id,
          status: 'active'  // ✅ Only update status at entity level
        },
        p_options: {
          include_dynamic: true,
          include_relationships: false
        }
      })

      if (result.error) {
        throw new Error(result.error.message || 'Failed to restore policy')
      }

      return { id, data: result.data }
    },
    onSuccess: () => {
      // ✅ SIMPLE: Just invalidate - let React Query refetch with latest data
      queryClient.invalidateQueries({ queryKey: ['leave-policies', organizationId] })
    }
  })

  // 🎯 ENTERPRISE PATTERN: Smart delete with automatic fallback to archive
  // Try hard delete first, but if policy is referenced, archive instead
  const deletePolicyMutation = useMutation({
    mutationFn: async (
      id: string
    ): Promise<{
      success: boolean
      archived: boolean
      message?: string
    }> => {
      if (!user?.id) {
        throw new Error('User ID required for policy deletion')
      }

      try {
        // Try hard delete
        const result = await callRPC('hera_entities_crud_v1', {
          p_action: 'DELETE',
          p_actor_user_id: user.id,
          p_organization_id: organizationId,
          p_entity: {
            entity_id: id
          },
          p_options: {}
        })

        if (result.error) {
          // If delete fails due to foreign key constraint, archive instead
          if (result.error.message?.includes('foreign key') || result.error.message?.includes('referenced')) {
            console.log('🔄 [useHeraLeave] Policy referenced, archiving instead of deleting')
            await archivePolicyMutation.mutateAsync(id)
            return {
              success: true,
              archived: true,
              message: 'Policy is being used and has been archived instead of deleted'
            }
          }
          throw new Error(result.error.message || 'Failed to delete policy')
        }

        return {
          success: true,
          archived: false
        }
      } catch (error: any) {
        // Fallback to archive on any error
        if (error.message?.includes('foreign key') || error.message?.includes('referenced')) {
          console.log('🔄 [useHeraLeave] Policy referenced, archiving instead of deleting')
          await archivePolicyMutation.mutateAsync(id)
          return {
            success: true,
            archived: true,
            message: 'Policy is being used and has been archived instead of deleted'
          }
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-policies', organizationId] })
    }
  })

  const createRequestMutation = useMutation({
    mutationFn: async (data: CreateLeaveRequestInput) => {
      // ✅ Use provided totalDays (respects half-day = 0.5) or calculate if not provided
      const totalDays = data.totalDays ?? calculateDays(data.start_date, data.end_date)
      const transactionCode = generateTransactionCode(year)

      // Use the createTransaction function from useUniversalTransactionV1
      const result = await createTransaction({
        transaction_type: 'LEAVE',
        transaction_code: transactionCode,
        smart_code: `HERA.SALON.HR.LEAVE.${data.leave_type}.v1`,
        transaction_date: new Date().toISOString(),
        source_entity_id: data.staff_id, // Who is taking leave
        target_entity_id: data.manager_id, // Manager approving
        total_amount: totalDays, // ✅ Now respects half-day (0.5)
        transaction_status: data.status || 'submitted', // ✅ Use provided status or default to submitted
        metadata: {
          leave_type: data.leave_type,
          start_date: data.start_date,
          end_date: data.end_date,
          total_days: totalDays, // ✅ Store correct value (0.5 for half-day)
          isHalfDay: data.isHalfDay || false, // ✅ Store half-day flag for audit trail
          halfDayPeriod: data.halfDayPeriod || null, // ✅ Store morning/afternoon selection
          reason: data.reason,
          notes: data.notes,
          submitted_at: new Date().toISOString()
        },
        lines: [
          {
            line_number: 1,
            line_type: 'LEAVE',
            description: `${data.leave_type} Leave: ${totalDays} day${totalDays !== 1 ? 's' : ''}`,
            quantity: totalDays, // ✅ Correct quantity (0.5 for half-day)
            unit_amount: 1,
            line_amount: totalDays, // ✅ Correct amount (0.5 for half-day)
            smart_code: `HERA.SALON.HR.LINE.${data.leave_type}.v1`
          }
        ]
      })

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['transactions-v1'] })
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status, notes }: { requestId: string; status: string; notes?: string }) => {
      // ✅ CRITICAL FIX: Find existing request to merge metadata (don't lose existing data)
      const existingRequest = requests.find(r => r.id === requestId)
      if (!existingRequest) {
        throw new Error('Request not found')
      }

      // Build updated metadata - MERGE with existing metadata
      const updatedMetadata: Record<string, any> = {
        // ✅ Preserve existing metadata fields
        leave_type: existingRequest.leave_type,
        start_date: existingRequest.start_date,
        end_date: existingRequest.end_date,
        total_days: existingRequest.total_days,
        reason: existingRequest.reason,
        notes: existingRequest.notes,
        submitted_at: existingRequest.submitted_at
      }

      // Add status-specific fields
      if (status === 'approved') {
        updatedMetadata.approved_at = new Date().toISOString()
        updatedMetadata.approval_notes = notes
        updatedMetadata.approved_by = user?.id
        // ✅ Store approver name for reports (eliminates need for USER entity lookup)
        updatedMetadata.approved_by_name = user?.entity_name || user?.name || 'Unknown User'
      } else if (status === 'rejected') {
        updatedMetadata.rejected_at = new Date().toISOString()
        updatedMetadata.rejection_reason = notes
        updatedMetadata.rejected_by = user?.id
        // ✅ Store rejector name for reports (eliminates need for USER entity lookup)
        updatedMetadata.rejected_by_name = user?.entity_name || user?.name || 'Unknown User'
      }

      // Use the updateTransaction function from useUniversalTransactionV1
      const result = await updateTransaction({
        transaction_id: requestId,
        smart_code: existingRequest.smart_code || 'HERA.SALON.HR.LEAVE.UPDATE.v1', // 🚨 REQUIRED: Guardrails enforce smart_code on UPDATE
        transaction_status: status,
        metadata: updatedMetadata
      })

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['transactions-v1'] })
    }
  })

  // ✅ NEW: Update leave request mutation (edit request details)
  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, data }: { requestId: string; data: Partial<CreateLeaveRequestInput> }) => {
      // Find existing request to merge data
      const existingRequest = requests.find(r => r.id === requestId)
      if (!existingRequest) {
        throw new Error('Request not found')
      }

      // ✅ Use provided totalDays (respects half-day = 0.5) or calculate if not provided
      const startDate = data.start_date || existingRequest.start_date
      const endDate = data.end_date || existingRequest.end_date
      const totalDays = data.totalDays ?? calculateDays(startDate, endDate)

      // Build updated metadata
      const updatedMetadata: Record<string, any> = {
        leave_type: data.leave_type || existingRequest.leave_type,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays, // ✅ Store correct value (0.5 for half-day)
        isHalfDay: data.isHalfDay ?? false, // ✅ Store half-day flag for audit trail
        halfDayPeriod: data.halfDayPeriod || null, // ✅ Store morning/afternoon selection
        reason: data.reason || existingRequest.reason,
        notes: data.notes !== undefined ? data.notes : existingRequest.notes,
        submitted_at: existingRequest.submitted_at
      }

      // ✅ CRITICAL FIX: Update transaction_status if status is provided (draft → submitted)
      const updatePayload: any = {
        transaction_id: requestId,
        smart_code: existingRequest.smart_code || 'HERA.SALON.HR.LEAVE.UPDATE.v1', // 🚨 REQUIRED: Guardrails enforce smart_code on UPDATE
        source_entity_id: data.staff_id || existingRequest.staff_id,
        target_entity_id: data.manager_id || existingRequest.manager_id,
        total_amount: totalDays, // ✅ Now respects half-day (0.5)
        metadata: updatedMetadata
      }

      // If status is changing (e.g., draft → submitted), include it
      if (data.status && data.status !== existingRequest.status) {
        updatePayload.transaction_status = data.status
      }

      // Use the updateTransaction function from useUniversalTransactionV1
      const result = await updateTransaction(updatePayload)

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['transactions-v1'] })
    }
  })

  // ✅ NEW: Delete leave request mutation (hard delete)
  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user?.id) {
        throw new Error('User ID required for request deletion')
      }

      console.log('🗑️ [useHeraLeave] Deleting leave request:', { requestId, userId: user.id, organizationId })

      const result = await callRPC('hera_txn_crud_v1', {
        p_action: 'DELETE',
        p_actor_user_id: user.id,
        p_organization_id: organizationId,
        p_payload: {
          transaction_id: requestId
        }
      })

      console.log('🗑️ [useHeraLeave] DELETE RPC Response:', {
        hasError: !!result.error,
        error: result.error,
        hasData: !!result.data,
        data: result.data,
        fullResult: result
      })

      // ✅ CRITICAL: Check response format (orchestrator pattern)
      if (result.error) {
        console.error('❌ [useHeraLeave] DELETE RPC client error:', result.error)
        throw new Error(result.error.message || 'Failed to delete request')
      }

      // Check orchestrator success
      if (result.data && !result.data.success) {
        console.error('❌ [useHeraLeave] DELETE orchestrator error:', result.data.error)
        throw new Error(result.data.error || 'DELETE operation failed')
      }

      // Check inner success (data.data.success)
      if (result.data?.data && !result.data.data.success) {
        console.error('❌ [useHeraLeave] DELETE function error:', result.data.data.error)
        throw new Error(result.data.data.error || 'DELETE function failed')
      }

      console.log('✅ [useHeraLeave] Leave request deleted successfully')

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['transactions-v1'] })
    }
  })

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Data
    requests,
    policies,
    staff,
    balances,

    // Loading States
    isLoading: policiesLoading || staffLoading || requestsLoading,
    isCreating: createRequestMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
    isUpdatingRequest: updateRequestMutation.isPending, // ✅ NEW
    isDeletingRequest: deleteRequestMutation.isPending, // ✅ NEW
    isCreatingPolicy: createPolicyMutation.isPending,
    isUpdatingPolicy: updatePolicyMutation.isPending,
    isArchivingPolicy: archivePolicyMutation.isPending,
    isRestoringPolicy: restorePolicyMutation.isPending,
    isDeletingPolicy: deletePolicyMutation.isPending,

    // Errors
    error: policiesError || staffError || requestsError,

    // Actions - Leave Requests (CRUD + Workflow)
    createRequest: createRequestMutation.mutateAsync,
    updateRequest: updateRequestMutation.mutateAsync, // ✅ NEW: Edit request
    deleteRequest: deleteRequestMutation.mutateAsync, // ✅ NEW: Delete request
    approveRequest: (requestId: string, notes?: string) =>
      updateStatusMutation.mutateAsync({ requestId, status: 'approved', notes }),
    rejectRequest: (requestId: string, reason?: string) =>
      updateStatusMutation.mutateAsync({ requestId, status: 'rejected', notes: reason }),
    cancelRequest: (requestId: string) =>
      updateStatusMutation.mutateAsync({ requestId, status: 'cancelled' }),
    withdrawRequest: (requestId: string) => // ✅ NEW: Alias for cancel (better UX terminology)
      updateStatusMutation.mutateAsync({ requestId, status: 'cancelled' }),

    // Actions - Leave Policies (CRUD)
    createPolicy: createPolicyMutation.mutateAsync,
    updatePolicy: updatePolicyMutation.mutateAsync,
    archivePolicy: archivePolicyMutation.mutateAsync,
    restorePolicy: restorePolicyMutation.mutateAsync,
    deletePolicy: deletePolicyMutation.mutateAsync,

    // Utilities
    calculateDays
  }
}
