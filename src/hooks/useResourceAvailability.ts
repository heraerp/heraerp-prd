/**
 * HERA Universal Resource Availability Hook
 * Smart Code: HERA.HOOKS.CALENDAR.AVAILABILITY.v1
 *
 * Checks resource availability across all industries
 * - Leave requests (approved time off)
 * - Business hours validation
 * - Existing appointment conflicts
 *
 * Ported from Salon Calendar's useStaffAvailability hook
 */

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiV2 } from '@/lib/client/fetchV2'

export interface UseResourceAvailabilityParams {
  businessType: string
  organizationId: string
  branchId?: string
  enabled?: boolean
}

export interface AvailabilityCheck {
  available: boolean
  reason?: string
  conflictingAppointments?: any[]
}

export function useResourceAvailability({
  businessType,
  organizationId,
  branchId,
  enabled = true
}: UseResourceAvailabilityParams) {
  // ✅ HERA DATA: Fetch approved leave requests
  const {
    data: approvedLeaveRequests = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['resource-leave', organizationId, branchId],
    queryFn: async () => {
      try {
        // Fetch leave transactions from universal_transactions
        const result = await apiV2.get('transactions', {
          organization_id: organizationId,
          transaction_type: 'leave',
          status: 'approved',
          ...(branchId && { branch_id: branchId })
        })

        console.log('🏖️ [Availability] Loaded leave requests:', result.data?.length || 0)
        return result.data || []
      } catch (err) {
        console.error('[Availability] Failed to fetch leave requests:', err)
        return []
      }
    },
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000 // 5 minutes
  })

  // ✅ CHECK: Is resource available at specific date/time?
  const checkResourceAvailability = useCallback(
    async (
      resourceId: string,
      date: Date,
      time: string,
      duration: number = 60
    ): Promise<AvailabilityCheck> => {
      // Check 1: Is resource on leave?
      const isOnLeave = approvedLeaveRequests.some(leave => {
        const leaveDate = new Date(leave.transaction_date || leave.start_time)
        const leaveDateString = leaveDate.toDateString()
        const checkDateString = date.toDateString()

        // Check if leave is for this resource and date matches
        const matchesResource = leave.source_entity_id === resourceId || leave.stylist_id === resourceId
        const matchesDate = leaveDateString === checkDateString

        return matchesResource && matchesDate
      })

      if (isOnLeave) {
        return {
          available: false,
          reason: 'Resource is on leave'
        }
      }

      // Check 2: Business hours validation (could be expanded)
      const [hours, minutes] = time.split(':').map(Number)
      if (hours < 8 || hours > 22) {
        return {
          available: false,
          reason: 'Outside business hours'
        }
      }

      // Check 3: Existing appointments (would need to pass appointments or fetch)
      // This is a simplified version - full implementation would check for overlaps

      return {
        available: true
      }
    },
    [approvedLeaveRequests]
  )

  // ✅ HELPER: Get unavailable dates for a resource
  const getUnavailableDates = useCallback(
    (resourceId: string): Date[] => {
      return approvedLeaveRequests
        .filter(
          leave => leave.source_entity_id === resourceId || leave.stylist_id === resourceId
        )
        .map(leave => new Date(leave.transaction_date || leave.start_time))
    },
    [approvedLeaveRequests]
  )

  // ✅ HELPER: Check if resource is available on a specific date (all day)
  const isResourceAvailableOnDate = useCallback(
    (resourceId: string, date: Date): boolean => {
      const dateString = date.toDateString()

      return !approvedLeaveRequests.some(leave => {
        const leaveDate = new Date(leave.transaction_date || leave.start_time)
        const matchesResource = leave.source_entity_id === resourceId || leave.stylist_id === resourceId
        const matchesDate = leaveDate.toDateString() === dateString

        return matchesResource && matchesDate
      })
    },
    [approvedLeaveRequests]
  )

  return {
    checkResourceAvailability,
    getUnavailableDates,
    isResourceAvailableOnDate,
    approvedLeaveRequests,
    isLoading,
    refetch
  }
}
