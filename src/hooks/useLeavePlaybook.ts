'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiV2 } from '@/lib/client/fetchV2'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { toast } from 'sonner'

// ============================================================================
// 🏛️ LEAVE MANAGEMENT HOOK - ENTERPRISE GRADE
// ============================================================================
// Architecture: HERA Universal 6-Table Pattern
// - Leave Requests → universal_transactions (transaction_type: 'LEAVE_REQUEST')
// - Leave Policies → core_entities (entity_type: 'LEAVE_POLICY')
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
  // Data Fetching
  // ============================================================================

  /**
   * Fetch all leave status entities (one-time setup per organization)
   */
  const {
    data: statusEntities = [],
    isLoading: statusLoading,
    error: statusError,
  } = useQuery({
    queryKey: ['leave-statuses', organizationId],
    queryFn: async () => {
      if (!organizationId) return []

      const response = await apiV2.get('entities', {
        entity_type: 'LEAVE_STATUS',
        organization_id: organizationId,
      })

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch leave statuses')
      }

      return response.data
    },
    enabled: !!organizationId,
    staleTime: 60 * 60 * 1000, // 1 hour (statuses rarely change)
  })

  /**
   * Fetch all leave policies
   */
  const {
    data: policies = [],
    isLoading: policiesLoading,
    error: policiesError,
  } = useQuery({
    queryKey: ['leave-policies', organizationId],
    queryFn: async () => {
      if (!organizationId) return []

      const response = await apiV2.get('entities', {
        entity_type: 'LEAVE_POLICY',
        organization_id: organizationId,
      })

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch leave policies')
      }

      return response.data.map((entity: any) => ({
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
      })) as LeavePolicy[]
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  /**
   * Fetch all leave requests (transactions)
   */
  const {
    data: leaveRequests = [],
    isLoading: requestsLoading,
    error: requestsError,
  } = useQuery({
    queryKey: ['leave-requests', organizationId, currentYear, options.branchId],
    queryFn: async () => {
      if (!organizationId) return []

      // Fetch all leave request transactions
      const response = await apiV2.get('transactions', {
        transaction_type: 'LEAVE_REQUEST',
        organization_id: organizationId,
      })

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch leave requests')
      }

      const transactions = response.data

      // Get status for each request via relationships
      const requestsWithStatus = await Promise.all(
        transactions.map(async (txn: any) => {
          try {
            // Get current status relationship
            const statusRelResponse = await apiV2.get('relationships', {
              from_entity_id: txn.id,
              relationship_type: 'HAS_STATUS',
              organization_id: organizationId,
            })

            let statusCode = 'LEAVE_STATUS_SUBMITTED'
            let statusName = 'Submitted'
            let statusColor = STATUS_COLORS.SUBMITTED

            if (
              statusRelResponse.success &&
              statusRelResponse.data &&
              statusRelResponse.data.length > 0
            ) {
              const statusRel = statusRelResponse.data[0]
              const statusEntity = statusEntities.find(
                (s: any) => s.id === statusRel.to_entity_id
              )

              if (statusEntity) {
                statusCode = statusEntity.entity_code
                statusName = statusEntity.entity_name
                statusColor = statusEntity.metadata?.color || statusColor
              }
            }

            // Get staff entity for name
            const staffResponse = await apiV2.get(`entities/${txn.from_entity_id}`)
            const staffName =
              staffResponse.success && staffResponse.data
                ? staffResponse.data.entity_name
                : 'Unknown Staff'

            // Get manager entity for name
            const managerResponse = await apiV2.get(`entities/${txn.to_entity_id}`)
            const managerName =
              managerResponse.success && managerResponse.data
                ? managerResponse.data.entity_name
                : 'Unknown Manager'

            return {
              id: txn.id,
              transaction_code: txn.transaction_code,
              transaction_date: txn.transaction_date,
              staff_id: txn.from_entity_id,
              staff_name: staffName,
              manager_id: txn.to_entity_id,
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
            console.error('Error fetching status for request:', error)
            return null
          }
        })
      )

      // Filter out nulls and filter by year
      const validRequests = requestsWithStatus.filter((req): req is LeaveRequest => {
        if (!req) return false
        const startDate = new Date(req.start_date)
        return startDate.getFullYear() === currentYear
      })

      return validRequests
    },
    enabled: !!organizationId && statusEntities.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  /**
   * Fetch all staff members
   */
  const {
    data: staff = [],
    isLoading: staffLoading,
    error: staffError,
  } = useQuery({
    queryKey: ['staff', organizationId],
    queryFn: async () => {
      if (!organizationId) return []

      const response = await apiV2.get('entities', {
        entity_type: 'STAFF',
        organization_id: organizationId,
      })

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch staff')
      }

      return response.data
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  /**
   * Calculate leave balances for all staff
   */
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
            policyId = policyRelResponse.data[0].to_entity_id
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

  /**
   * Create a new leave request
   */
  const createLeaveMutation = useMutation({
    mutationFn: async (data: CreateLeaveRequestInput) => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      // Calculate total days
      const totalDays = calculateDays(data.start_date, data.end_date)

      // Generate transaction code
      const transactionCode = generateTransactionCode(new Date().getFullYear())

      // Create leave request transaction
      const response = await apiV2.post('transactions', {
        apiVersion: 'v2',
        transaction_type: 'LEAVE_REQUEST',
        transaction_code: transactionCode,
        transaction_date: new Date().toISOString(),
        smart_code: `HERA.SALON.HR.LEAVE.REQUEST.${data.leave_type}.V1`,
        organization_id: organizationId,
        from_entity_id: data.staff_id,
        to_entity_id: data.manager_id,
        total_amount: totalDays,
        currency: 'DAYS',
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

      if (!response.success || !response.data) {
        throw new Error('Failed to create leave request')
      }

      const leaveRequestId = response.data.id

      // Get SUBMITTED status entity ID
      const submittedStatus = statusEntities.find(
        (s: any) => s.entity_code === STATUS_CODES.SUBMITTED
      )

      if (!submittedStatus) {
        throw new Error('SUBMITTED status entity not found')
      }

      // Create status relationship
      await apiV2.post('relationships', {
        apiVersion: 'v2',
        from_entity_id: leaveRequestId,
        to_entity_id: submittedStatus.id,
        relationship_type: 'HAS_STATUS',
        smart_code: 'HERA.SALON.HR.LEAVE.STATUS.REL.V1',
        organization_id: organizationId,
        metadata: {
          status_changed_at: new Date().toISOString(),
          status_changed_by: data.staff_id,
          previous_status: null,
        },
      })

      return response.data
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['leave-requests', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances', organizationId] })
      toast.success('Leave request created successfully')
    },
    onError: (error: any) => {
      console.error('Error creating leave request:', error)
      toast.error(error.message || 'Failed to create leave request')
    },
  })

  /**
   * Approve a leave request
   */
  const approveLeaveMutation = useMutation({
    mutationFn: async ({
      requestId,
      approvedBy,
      notes,
    }: {
      requestId: string
      approvedBy: string
      notes?: string
    }) => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      // Get APPROVED status entity ID
      const approvedStatus = statusEntities.find(
        (s: any) => s.entity_code === STATUS_CODES.APPROVED
      )

      if (!approvedStatus) {
        throw new Error('APPROVED status entity not found')
      }

      // Get current status relationship
      const currentStatusResponse = await apiV2.get('relationships', {
        from_entity_id: requestId,
        relationship_type: 'HAS_STATUS',
        organization_id: organizationId,
      })

      let previousStatus = 'SUBMITTED'
      if (
        currentStatusResponse.success &&
        currentStatusResponse.data &&
        currentStatusResponse.data.length > 0
      ) {
        const statusRel = currentStatusResponse.data[0]
        const statusEntity = statusEntities.find(
          (s: any) => s.id === statusRel.to_entity_id
        )
        if (statusEntity) {
          previousStatus =
            Object.keys(STATUS_CODES).find(
              (k) => STATUS_CODES[k as LeaveStatus] === statusEntity.entity_code
            ) || 'SUBMITTED'
        }

        // Delete old status relationship
        await apiV2.delete(`relationships/${statusRel.id}`)
      }

      // Create new APPROVED status relationship
      await apiV2.post('relationships', {
        apiVersion: 'v2',
        from_entity_id: requestId,
        to_entity_id: approvedStatus.id,
        relationship_type: 'HAS_STATUS',
        smart_code: 'HERA.SALON.HR.LEAVE.STATUS.REL.V1',
        organization_id: organizationId,
        metadata: {
          status_changed_at: new Date().toISOString(),
          status_changed_by: approvedBy,
          previous_status: previousStatus,
          approval_notes: notes,
        },
      })

      // Update transaction metadata
      const transactionResponse = await apiV2.get(`transactions/${requestId}`)
      if (transactionResponse.success && transactionResponse.data) {
        await apiV2.put(`transactions/${requestId}`, {
          apiVersion: 'v2',
          metadata: {
            ...transactionResponse.data.metadata,
            approved_by: approvedBy,
            approved_at: new Date().toISOString(),
            approval_notes: notes,
          },
        })
      }

      return { requestId, status: 'APPROVED' }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances', organizationId] })
      toast.success('Leave request approved')
    },
    onError: (error: any) => {
      console.error('Error approving leave request:', error)
      toast.error(error.message || 'Failed to approve leave request')
    },
  })

  /**
   * Reject a leave request
   */
  const rejectLeaveMutation = useMutation({
    mutationFn: async ({
      requestId,
      rejectedBy,
      reason,
    }: {
      requestId: string
      rejectedBy: string
      reason?: string
    }) => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      // Get REJECTED status entity ID
      const rejectedStatus = statusEntities.find(
        (s: any) => s.entity_code === STATUS_CODES.REJECTED
      )

      if (!rejectedStatus) {
        throw new Error('REJECTED status entity not found')
      }

      // Get current status relationship and delete
      const currentStatusResponse = await apiV2.get('relationships', {
        from_entity_id: requestId,
        relationship_type: 'HAS_STATUS',
        organization_id: organizationId,
      })

      if (
        currentStatusResponse.success &&
        currentStatusResponse.data &&
        currentStatusResponse.data.length > 0
      ) {
        await apiV2.delete(`relationships/${currentStatusResponse.data[0].id}`)
      }

      // Create new REJECTED status relationship
      await apiV2.post('relationships', {
        apiVersion: 'v2',
        from_entity_id: requestId,
        to_entity_id: rejectedStatus.id,
        relationship_type: 'HAS_STATUS',
        smart_code: 'HERA.SALON.HR.LEAVE.STATUS.REL.V1',
        organization_id: organizationId,
        metadata: {
          status_changed_at: new Date().toISOString(),
          status_changed_by: rejectedBy,
          rejection_reason: reason,
        },
      })

      // Update transaction metadata
      const transactionResponse = await apiV2.get(`transactions/${requestId}`)
      if (transactionResponse.success && transactionResponse.data) {
        await apiV2.put(`transactions/${requestId}`, {
          apiVersion: 'v2',
          metadata: {
            ...transactionResponse.data.metadata,
            rejected_by: rejectedBy,
            rejected_at: new Date().toISOString(),
            rejection_reason: reason,
          },
        })
      }

      return { requestId, status: 'REJECTED' }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances', organizationId] })
      toast.success('Leave request rejected')
    },
    onError: (error: any) => {
      console.error('Error rejecting leave request:', error)
      toast.error(error.message || 'Failed to reject leave request')
    },
  })

  /**
   * Cancel a leave request (by staff)
   */
  const cancelLeaveMutation = useMutation({
    mutationFn: async ({ requestId, staffId }: { requestId: string; staffId: string }) => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      // Get CANCELLED status entity ID
      const cancelledStatus = statusEntities.find(
        (s: any) => s.entity_code === STATUS_CODES.CANCELLED
      )

      if (!cancelledStatus) {
        throw new Error('CANCELLED status entity not found')
      }

      // Get current status relationship and delete
      const currentStatusResponse = await apiV2.get('relationships', {
        from_entity_id: requestId,
        relationship_type: 'HAS_STATUS',
        organization_id: organizationId,
      })

      if (
        currentStatusResponse.success &&
        currentStatusResponse.data &&
        currentStatusResponse.data.length > 0
      ) {
        await apiV2.delete(`relationships/${currentStatusResponse.data[0].id}`)
      }

      // Create new CANCELLED status relationship
      await apiV2.post('relationships', {
        apiVersion: 'v2',
        from_entity_id: requestId,
        to_entity_id: cancelledStatus.id,
        relationship_type: 'HAS_STATUS',
        smart_code: 'HERA.SALON.HR.LEAVE.STATUS.REL.V1',
        organization_id: organizationId,
        metadata: {
          status_changed_at: new Date().toISOString(),
          status_changed_by: staffId,
        },
      })

      return { requestId, status: 'CANCELLED' }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests', organizationId] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances', organizationId] })
      toast.success('Leave request cancelled')
    },
    onError: (error: any) => {
      console.error('Error cancelling leave request:', error)
      toast.error(error.message || 'Failed to cancel leave request')
    },
  })

  // ============================================================================
  // Mutations - Leave Policies
  // ============================================================================

  /**
   * Create a new leave policy
   */
  const createPolicyMutation = useMutation({
    mutationFn: async (data: CreateLeavePolicy) => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      const response = await apiV2.post('entities', {
        apiVersion: 'v2',
        entity_type: 'LEAVE_POLICY',
        entity_name: data.entity_name,
        entity_code: `POL-${data.leave_type}-${Date.now()}`,
        smart_code: 'HERA.SALON.HR.LEAVE.POLICY.V1',
        organization_id: organizationId,
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

      if (!response.success || !response.data) {
        throw new Error('Failed to create leave policy')
      }

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-policies', organizationId] })
      toast.success('Leave policy created successfully')
    },
    onError: (error: any) => {
      console.error('Error creating leave policy:', error)
      toast.error(error.message || 'Failed to create leave policy')
    },
  })

  /**
   * Update a leave policy
   */
  const updatePolicyMutation = useMutation({
    mutationFn: async ({ policyId, data }: { policyId: string; data: Partial<CreateLeavePolicy> }) => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      // Get existing policy
      const existingResponse = await apiV2.get(`entities/${policyId}`)
      if (!existingResponse.success || !existingResponse.data) {
        throw new Error('Policy not found')
      }

      const existing = existingResponse.data

      const response = await apiV2.put(`entities/${policyId}`, {
        apiVersion: 'v2',
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

      if (!response.success) {
        throw new Error('Failed to update leave policy')
      }

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-policies', organizationId] })
      toast.success('Leave policy updated successfully')
    },
    onError: (error: any) => {
      console.error('Error updating leave policy:', error)
      toast.error(error.message || 'Failed to update leave policy')
    },
  })

  /**
   * Delete a leave policy
   */
  const deletePolicyMutation = useMutation({
    mutationFn: async (policyId: string) => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      const response = await apiV2.delete(`entities/${policyId}`)

      if (!response.success) {
        throw new Error('Failed to delete leave policy')
      }

      return policyId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-policies', organizationId] })
      toast.success('Leave policy deleted successfully')
    },
    onError: (error: any) => {
      console.error('Error deleting leave policy:', error)
      toast.error(error.message || 'Failed to delete leave policy')
    },
  })

  // ============================================================================
  // Return
  // ============================================================================

  const loading =
    contextLoading ||
    statusLoading ||
    policiesLoading ||
    requestsLoading ||
    staffLoading ||
    balancesLoading

  const error =
    statusError?.message ||
    policiesError?.message ||
    requestsError?.message ||
    staffError?.message ||
    null

  return {
    // Data
    requests: leaveRequests,
    balancesByStaff,
    policies,
    staff,
    statusEntities,

    // States
    loading,
    error,

    // Actions - Leave Requests
    createLeave: createLeaveMutation.mutateAsync,
    approveLeave: approveLeaveMutation.mutateAsync,
    rejectLeave: rejectLeaveMutation.mutateAsync,
    cancelLeave: cancelLeaveMutation.mutateAsync,

    // Actions - Policies
    createPolicy: createPolicyMutation.mutateAsync,
    updatePolicy: updatePolicyMutation.mutateAsync,
    deletePolicy: deletePolicyMutation.mutateAsync,

    // Utilities
    calculateDays,
  }
}
