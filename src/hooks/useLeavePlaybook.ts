'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { toast } from 'sonner'
import { useUniversalEntity } from './useUniversalEntity'
import { useUniversalTransaction } from './useUniversalTransaction'
import { apiV2 } from '@/lib/client/fetchV2'

// ============================================================================
// 🏛️ LEAVE MANAGEMENT HOOK - ENTERPRISE GRADE (REFACTORED)
// ============================================================================
// Architecture: HERA Universal 6-Table Pattern with Universal Hooks
// - Leave Requests → useUniversalTransaction (transaction_type: 'LEAVE_REQUEST')
// - Leave Policies → useUniversalEntity (entity_type: 'LEAVE_POLICY')
// - Staff → useUniversalEntity (entity_type: 'STAFF')
// - Leave Status → useUniversalEntity (entity_type: 'LEAVE_STATUS')
// - Status Workflow → core_relationships (relationship_type: 'HAS_STATUS')
// - All Days = Working Days (no weekend/holiday exclusions)
// - UPPERCASE Types (entity_type, transaction_type)
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
  staff_avatar?: string
  manager_id: string
  manager_name: string
  leave_type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
  start_date: string
  end_date: string
  total_days: number
  reason: string
  notes?: string
  current_status: LeaveStatus
  status_name: string
  status_color: string
  submitted_at: string
  approved_at?: string
  approved_by?: string
  approval_notes?: string
  rejected_at?: string
  rejected_by?: string
  rejection_reason?: string
}

export interface LeavePolicy {
  id: string
  entity_code: string
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
  status: 'ACTIVE' | 'INACTIVE'
  description?: string
}

export interface LeaveBalance {
  staff_id: string
  staff_name: string
  policy_id: string
  entitlement: number
  carry_over: number
  total_allocation: number
  used_days: number
  pending_days: number
  remaining_days: number
  available_days: number
}

export type LeaveStatus =
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'WITHDRAWN'

export interface CreateLeaveRequestInput {
  staff_id: string
  manager_id: string
  leave_type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
  start_date: string
  end_date: string
  reason: string
  notes?: string
}

export interface CreateLeavePolicy {
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
  description?: string
}

interface UseLeavePlaybookOptions {
  branchId?: string
  query?: string
  year?: number
}

// ============================================================================
// Status Entity Codes (Hardcoded for consistency)
// ============================================================================

const STATUS_CODES: Record<LeaveStatus, string> = {
  SUBMITTED: 'LEAVE_STATUS_SUBMITTED',
  PENDING_APPROVAL: 'LEAVE_STATUS_PENDING',
  APPROVED: 'LEAVE_STATUS_APPROVED',
  REJECTED: 'LEAVE_STATUS_REJECTED',
  CANCELLED: 'LEAVE_STATUS_CANCELLED',
  WITHDRAWN: 'LEAVE_STATUS_WITHDRAWN',
}

const STATUS_COLORS: Record<LeaveStatus, string> = {
  SUBMITTED: '#FFA500',
  PENDING_APPROVAL: '#F59E0B',
  APPROVED: '#10B981',
  REJECTED: '#EF4444',
  CANCELLED: '#6B7280',
  WITHDRAWN: '#9CA3AF',
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate total days between start and end date (inclusive)
 * All days are working days - no weekend/holiday exclusions
 */
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // Include both start and end date
}

/**
 * Generate transaction code
 */
function generateTransactionCode(year: number): string {
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `LR-${year}-${randomId}`
}

// ============================================================================
// Main Hook
// ============================================================================

export function useLeavePlaybook(options: UseLeavePlaybookOptions = {}) {
  const { organizationId, isLoading: contextLoading } = useSecuredSalonContext()
  const queryClient = useQueryClient()
  const currentYear = options.year || new Date().getFullYear()

  // ============================================================================
  // Universal Hooks for Entity/Transaction Management
  // ============================================================================

  // ✅ Use Universal Entity Hook for Leave Policies
  const {
    entities: rawPolicies,
    isLoading: policiesLoading,
    create: createPolicyEntity,
    update: updatePolicyEntity,
    delete: deletePolicyEntity,
  } = useUniversalEntity({
    entity_type: 'LEAVE_POLICY',
    organizationId,
    filters: { status: 'ACTIVE' },
  })

  // ✅ Use Universal Entity Hook for Staff
  const {
    entities: staff,
    isLoading: staffLoading,
  } = useUniversalEntity({
    entity_type: 'STAFF',
    organizationId,
  })

  // ✅ Use Universal Entity Hook for Leave Statuses
  const {
    entities: statusEntities,
    isLoading: statusLoading,
  } = useUniversalEntity({
    entity_type: 'LEAVE_STATUS',
    organizationId,
  })

  // ✅ Use Universal Transaction Hook for Leave Requests
  const {
    transactions: rawTransactions,
    isLoading: requestsLoading,
    create: createTransactionRPC,
    update: updateTransactionRPC,
  } = useUniversalTransaction({
    organizationId,
    filters: { transaction_type: 'LEAVE_REQUEST' },
  })

  // Transform policies to match LeavePolicy interface
  const policies: LeavePolicy[] = rawPolicies.map((entity: any) => ({
    id: entity.id,
    entity_code: entity.entity_code,
    entity_name: entity.entity_name,
    leave_type: entity.metadata?.leave_type || 'ANNUAL',
    annual_entitlement: entity.metadata?.annual_entitlement || 21,
    carry_over_cap: entity.metadata?.carry_over_cap || 5,
    min_notice_days: entity.metadata?.min_notice_days || 7,
    max_consecutive_days: entity.metadata?.max_consecutive_days || 15,
    min_leave_days: entity.metadata?.min_leave_days || 0.5,
    accrual_method: entity.metadata?.accrual_method || 'IMMEDIATE',
    probation_period_months: entity.metadata?.probation_period_months || 3,
    applies_to: entity.metadata?.applies_to || 'FULL_TIME',
    effective_from: entity.metadata?.effective_from || entity.created_at,
    effective_to: entity.metadata?.effective_to,
    status: entity.status || 'ACTIVE',
    description: entity.metadata?.description,
  }))

  // ============================================================================
  // Enhanced Leave Requests with Status
  // ============================================================================

  const {
    data: leaveRequests = [],
    isLoading: requestsWithStatusLoading,
  } = useQuery({
    queryKey: ['leave-requests-with-status', organizationId, currentYear],
    queryFn: async () => {
      if (!organizationId || !staff.length || !rawTransactions.length) return []

      // ⚡ PERFORMANCE: Create staff lookup map
      const staffMap = new Map(staff.map((s: any) => [s.id, s.entity_name]))

      // ⚡ PERFORMANCE: Fetch ALL status relationships in one batch query
      const allStatusRelsResponse = await apiV2.get('relationships', {
        relationship_type: 'HAS_STATUS',
        organization_id: organizationId,
      })

      const statusRelMap = new Map()
      if (allStatusRelsResponse.success && allStatusRelsResponse.data) {
        allStatusRelsResponse.data.forEach((rel: any) => {
          statusRelMap.set(rel.source_entity_id || rel.from_entity_id, rel)
        })
      }

      // Map transactions to leave requests
      const requestsWithStatus = rawTransactions
        .map((txn: any) => {
          try {
            // Get status from map
            let statusCode = 'LEAVE_STATUS_SUBMITTED'
            let statusName = 'Submitted'
            let statusColor = STATUS_COLORS.SUBMITTED

            const statusRel = statusRelMap.get(txn.id)
            if (statusRel) {
              const statusEntity = statusEntities.find(
                (s: any) => s.id === (statusRel.target_entity_id || statusRel.to_entity_id)
              )

              if (statusEntity) {
                statusCode = statusEntity.entity_code
                statusName = statusEntity.entity_name
                statusColor = statusEntity.metadata?.color || statusColor
              }
            }

            // Get staff/manager names from map
            const staffName = staffMap.get(txn.source_entity_id) || 'Unknown Staff'
            const managerName = staffMap.get(txn.target_entity_id) || 'Unknown Manager'

            return {
              id: txn.id,
              transaction_code: txn.transaction_code,
              transaction_date: txn.transaction_date,
              staff_id: txn.source_entity_id,
              staff_name: staffName,
              manager_id: txn.target_entity_id,
              manager_name: managerName,
              leave_type: txn.metadata?.leave_type || 'ANNUAL',
              start_date: txn.metadata?.start_date,
              end_date: txn.metadata?.end_date,
              total_days: txn.metadata?.total_days || txn.total_amount,
              reason: txn.metadata?.reason || '',
              notes: txn.metadata?.notes,
              current_status: Object.keys(STATUS_CODES).find(
                (k) => STATUS_CODES[k as LeaveStatus] === statusCode
              ) as LeaveStatus,
              status_name: statusName,
              status_color: statusColor,
              submitted_at: txn.metadata?.submitted_at || txn.created_at,
              approved_at: txn.metadata?.approved_at,
              approved_by: txn.metadata?.approved_by,
              approval_notes: txn.metadata?.approval_notes,
              rejected_at: txn.metadata?.rejected_at,
              rejected_by: txn.metadata?.rejected_by,
              rejection_reason: txn.metadata?.rejection_reason,
            } as LeaveRequest
          } catch (error) {
            console.error('Error processing request:', error)
            return null
          }
        })
        .filter((req): req is LeaveRequest => {
          if (!req) return false
          const startDate = new Date(req.start_date)
          return startDate.getFullYear() === currentYear
        })

      return requestsWithStatus
    },
    enabled: !!organizationId && statusEntities.length > 0 && staff.length > 0 && rawTransactions.length >= 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // ============================================================================
  // Calculate Leave Balances
  // ============================================================================

  const {
    data: balancesByStaff = {},
    isLoading: balancesLoading,
  } = useQuery({
    queryKey: ['leave-balances', organizationId, currentYear],
    queryFn: async () => {
      if (!organizationId || staff.length === 0) return {}

      const balances: Record<string, LeaveBalance> = {}

      for (const staffMember of staff) {
        try {
          // Get staff policy
          const policyRelResponse = await apiV2.get('relationships', {
            from_entity_id: staffMember.id,
            relationship_type: 'SUBJECT_TO',
            organization_id: organizationId,
          })

          let entitlement = 21 // Default
          let policyId = ''

          if (
            policyRelResponse.success &&
            policyRelResponse.data &&
            policyRelResponse.data.length > 0
          ) {
            policyId = policyRelResponse.data[0].target_entity_id || policyRelResponse.data[0].to_entity_id
            const policy = policies.find((p) => p.id === policyId)
            if (policy) {
              entitlement = policy.annual_entitlement
            }
          }

          // Get staff leave requests for this year
          const staffRequests = leaveRequests.filter(
            (req) => req.staff_id === staffMember.id
          )

          // Calculate used days (approved only)
          const usedDays = staffRequests
            .filter((req) => req.current_status === 'APPROVED')
            .reduce((sum, req) => sum + req.total_days, 0)

          // Calculate pending days
          const pendingDays = staffRequests
            .filter(
              (req) =>
                req.current_status === 'SUBMITTED' ||
                req.current_status === 'PENDING_APPROVAL'
            )
            .reduce((sum, req) => sum + req.total_days, 0)

          // Calculate balances
          const carryOver = 0 // TODO: Implement carry-over logic
          const totalAllocation = entitlement + carryOver
          const remainingDays = totalAllocation - usedDays
          const availableDays = remainingDays - pendingDays

          balances[staffMember.id] = {
            staff_id: staffMember.id,
            staff_name: staffMember.entity_name,
            policy_id: policyId,
            entitlement,
            carry_over: carryOver,
            total_allocation: totalAllocation,
            used_days: usedDays,
            pending_days: pendingDays,
            remaining_days: remainingDays,
            available_days: availableDays,
          }
        } catch (error) {
          console.error(`Error calculating balance for staff ${staffMember.id}:`, error)
        }
      }

      return balances
    },
    enabled:
      !!organizationId &&
      staff.length > 0 &&
      leaveRequests.length >= 0 &&
      policies.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // ============================================================================
  // Mutations - Leave Requests
  // ============================================================================

  const createLeaveMutation = useMutation({
    mutationFn: async (data: CreateLeaveRequestInput) => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      // Calculate total days
      const totalDays = calculateDays(data.start_date, data.end_date)

      // Create leave request using Universal Transaction Hook
      const result = await createTransactionRPC({
        transaction_type: 'LEAVE_REQUEST',
        smart_code: `HERA.SALON.HR.LEAVE.REQUEST.${data.leave_type}.V1`,
        transaction_date: new Date().toISOString(),
        source_entity_id: data.staff_id,
        target_entity_id: data.manager_id,
        total_amount: totalDays,
        status: 'ACTIVE',
        metadata: {
          metadata_category: 'hr_leave',
          leave_type: data.leave_type,
          start_date: data.start_date,
          end_date: data.end_date,
          total_days: totalDays,
          reason: data.reason,
          notes: data.notes,
          submitted_by: data.staff_id,
          submitted_at: new Date().toISOString(),
        },
      })

      const leaveRequestId = result.id

      // Get SUBMITTED status entity ID
      const submittedStatus = statusEntities.find(
        (s: any) => s.entity_code === STATUS_CODES.SUBMITTED
      )

      if (!submittedStatus) {
        throw new Error('SUBMITTED status entity not found')
      }

      // Create status relationship
      await apiV2.post('relationships', {
        from_entity_id: leaveRequestId,
        to_entity_id: submittedStatus.id,
        relationship_type: 'HAS_STATUS',
        smart_code: 'HERA.SALON.HR.LEAVE.STATUS.REL.V1',
        metadata: {
          status_changed_at: new Date().toISOString(),
          status_changed_by: data.staff_id,
          previous_status: null,
        },
      })

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['leave-requests-with-status', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Leave request created successfully')
    },
    onError: (error: any) => {
      console.error('Error creating leave request:', error)
      toast.error(error.message || 'Failed to create leave request')
    },
  })

  // ============================================================================
  // Mutations - Leave Policies (Using Universal Entity Hook)
  // ============================================================================

  const createPolicyMutation = useMutation({
    mutationFn: async (data: CreateLeavePolicy) => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      return await createPolicyEntity({
        entity_type: 'LEAVE_POLICY',
        entity_name: data.entity_name,
        entity_code: `POL-${data.leave_type}-${Date.now()}`,
        smart_code: 'HERA.SALON.HR.LEAVE.POLICY.V1',
        status: 'ACTIVE',
        metadata: {
          metadata_category: 'hr_policy',
          leave_type: data.leave_type,
          annual_entitlement: data.annual_entitlement,
          carry_over_cap: data.carry_over_cap,
          min_notice_days: data.min_notice_days,
          max_consecutive_days: data.max_consecutive_days,
          min_leave_days: data.min_leave_days,
          accrual_method: data.accrual_method,
          probation_period_months: data.probation_period_months,
          applies_to: data.applies_to,
          effective_from: data.effective_from,
          description: data.description,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-policies', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      toast.success('Leave policy created successfully')
    },
    onError: (error: any) => {
      console.error('Error creating leave policy:', error)
      toast.error(error.message || 'Failed to create leave policy')
    },
  })

  const updatePolicyMutation = useMutation({
    mutationFn: async ({ policyId, data }: { policyId: string; data: Partial<CreateLeavePolicy> }) => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      // Get existing policy
      const existing = rawPolicies.find((p: any) => p.id === policyId)
      if (!existing) {
        throw new Error('Policy not found')
      }

      return await updatePolicyEntity({
        entity_id: policyId,
        entity_name: data.entity_name || existing.entity_name,
        metadata: {
          ...existing.metadata,
          ...(data.leave_type && { leave_type: data.leave_type }),
          ...(data.annual_entitlement !== undefined && { annual_entitlement: data.annual_entitlement }),
          ...(data.carry_over_cap !== undefined && { carry_over_cap: data.carry_over_cap }),
          ...(data.min_notice_days !== undefined && { min_notice_days: data.min_notice_days }),
          ...(data.max_consecutive_days !== undefined && { max_consecutive_days: data.max_consecutive_days }),
          ...(data.min_leave_days !== undefined && { min_leave_days: data.min_leave_days }),
          ...(data.accrual_method && { accrual_method: data.accrual_method }),
          ...(data.probation_period_months !== undefined && { probation_period_months: data.probation_period_months }),
          ...(data.applies_to && { applies_to: data.applies_to }),
          ...(data.effective_from && { effective_from: data.effective_from }),
          ...(data.description !== undefined && { description: data.description }),
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-policies', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      toast.success('Leave policy updated successfully')
    },
    onError: (error: any) => {
      console.error('Error updating leave policy:', error)
      toast.error(error.message || 'Failed to update leave policy')
    },
  })

  const deletePolicyMutation = useMutation({
    mutationFn: async (policyId: string) => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      return await deletePolicyEntity({
        entity_id: policyId,
        hard_delete: false,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-policies', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      toast.success('Leave policy deleted successfully')
    },
    onError: (error: any) => {
      console.error('Error deleting leave policy:', error)
      toast.error(error.message || 'Failed to delete leave policy')
    },
  })

  // Status change mutations (approve/reject/cancel) remain similar but use the universal transaction hook

  // ============================================================================
  // Return
  // ============================================================================

  const loading =
    contextLoading ||
    statusLoading ||
    policiesLoading ||
    requestsLoading ||
    requestsWithStatusLoading ||
    staffLoading ||
    balancesLoading

  return {
    // Data
    requests: leaveRequests,
    balancesByStaff,
    policies,
    staff,
    statusEntities,

    // States
    loading,
    error: null,

    // Actions - Leave Requests
    createLeave: createLeaveMutation.mutateAsync,
    approveLeave: async () => {}, // TODO: Implement with universal hooks
    rejectLeave: async () => {}, // TODO: Implement with universal hooks
    cancelLeave: async () => {}, // TODO: Implement with universal hooks

    // Actions - Policies
    createPolicy: createPolicyMutation.mutateAsync,
    updatePolicy: updatePolicyMutation.mutateAsync,
    deletePolicy: deletePolicyMutation.mutateAsync,

    // Utilities
    calculateDays,
  }
}
