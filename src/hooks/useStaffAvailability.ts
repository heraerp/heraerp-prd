// ================================================================================
// STAFF AVAILABILITY HOOK
// Smart Code: HERA.HOOKS.SALON.STAFF_AVAILABILITY.v1
// Checks staff leave status to prevent booking unavailable staff
// ================================================================================

import React from 'react'
import { useHeraLeave, type LeaveRequest } from './useHeraLeave'

export interface StaffAvailabilityCheck {
  isAvailable: boolean
  leaveStatus?: {
    leave_type: string
    start_date: string
    end_date: string
    isHalfDay: boolean
    halfDayPeriod?: 'morning' | 'afternoon'
    reason: string
  }
}

export interface UseStaffAvailabilityOptions {
  organizationId: string
  branchId?: string
}

/**
 * Hook to check staff availability based on approved leave requests
 *
 * @example
 * const { checkStaffAvailability, isLoading } = useStaffAvailability({
 *   organizationId: 'org-id',
 *   branchId: 'branch-id'
 * })
 *
 * const availability = checkStaffAvailability('staff-id', '2025-01-15', 'morning')
 * if (!availability.isAvailable) {
 *   console.log('Staff on leave:', availability.leaveStatus)
 * }
 */
export function useStaffAvailability(options: UseStaffAvailabilityOptions) {
  const { organizationId, branchId } = options

  // ✅ LAYER 1: Fetch leave requests using useHeraLeave hook
  const {
    requests,
    isLoading
  } = useHeraLeave({
    organizationId,
    branchId,
    year: new Date().getFullYear(),
    includeArchived: false
  })

  // ✅ LAYER 2: Filter to only approved leave requests
  const approvedLeaveRequests = React.useMemo(() => {
    return requests.filter(request => request.status === 'approved')
  }, [requests])

  /**
   * Check if a staff member is available on a specific date and time
   *
   * @param staffId - Staff member entity ID
   * @param date - Date to check (YYYY-MM-DD format)
   * @param period - Optional time period ('morning' | 'afternoon' | 'full_day')
   * @returns Availability status with leave details if unavailable
   */
  const checkStaffAvailability = React.useCallback(
    (
      staffId: string,
      date: string,
      period: 'morning' | 'afternoon' | 'full_day' = 'full_day'
    ): StaffAvailabilityCheck => {
      // Find any approved leave requests for this staff member that overlap with the date
      const leaveOnDate = approvedLeaveRequests.find(leave => {
        if (leave.staff_id !== staffId) return false

        const checkDate = new Date(date)
        const startDate = new Date(leave.start_date)
        const endDate = new Date(leave.end_date)

        // Check if date falls within leave period
        const isInLeavePeriod = checkDate >= startDate && checkDate <= endDate

        if (!isInLeavePeriod) return false

        // If leave is half-day, check if it conflicts with requested period
        if (leave.isHalfDay && leave.halfDayPeriod && period !== 'full_day') {
          return leave.halfDayPeriod === period
        }

        return true
      })

      if (leaveOnDate) {
        return {
          isAvailable: false,
          leaveStatus: {
            leave_type: leaveOnDate.leave_type,
            start_date: leaveOnDate.start_date,
            end_date: leaveOnDate.end_date,
            isHalfDay: leaveOnDate.isHalfDay || false,
            halfDayPeriod: leaveOnDate.halfDayPeriod,
            reason: leaveOnDate.reason
          }
        }
      }

      return {
        isAvailable: true
      }
    },
    [approvedLeaveRequests]
  )

  /**
   * Get all unavailable dates for a staff member within a date range
   * Useful for calendar views to show leave periods
   *
   * @param staffId - Staff member entity ID
   * @param startDate - Range start date (YYYY-MM-DD)
   * @param endDate - Range end date (YYYY-MM-DD)
   * @returns Array of dates with leave information
   */
  const getUnavailableDates = React.useCallback(
    (
      staffId: string,
      startDate: string,
      endDate: string
    ): Array<{
      date: string
      leave_type: string
      isHalfDay: boolean
      halfDayPeriod?: 'morning' | 'afternoon'
    }> => {
      const unavailableDates: Array<{
        date: string
        leave_type: string
        isHalfDay: boolean
        halfDayPeriod?: 'morning' | 'afternoon'
      }> = []

      const rangeStart = new Date(startDate)
      const rangeEnd = new Date(endDate)

      approvedLeaveRequests.forEach(leave => {
        if (leave.staff_id !== staffId) return

        const leaveStart = new Date(leave.start_date)
        const leaveEnd = new Date(leave.end_date)

        // Find overlap between leave period and requested range
        const overlapStart = leaveStart > rangeStart ? leaveStart : rangeStart
        const overlapEnd = leaveEnd < rangeEnd ? leaveEnd : rangeEnd

        if (overlapStart <= overlapEnd) {
          // Generate all dates in the overlap period
          const currentDate = new Date(overlapStart)
          while (currentDate <= overlapEnd) {
            unavailableDates.push({
              date: currentDate.toISOString().split('T')[0],
              leave_type: leave.leave_type,
              isHalfDay: leave.isHalfDay || false,
              halfDayPeriod: leave.halfDayPeriod
            })
            currentDate.setDate(currentDate.getDate() + 1)
          }
        }
      })

      return unavailableDates
    },
    [approvedLeaveRequests]
  )

  /**
   * Get all staff members who are unavailable on a specific date
   * Useful for filtering available staff in booking interfaces
   *
   * @param date - Date to check (YYYY-MM-DD)
   * @param period - Optional time period ('morning' | 'afternoon' | 'full_day')
   * @returns Array of staff IDs that are unavailable
   */
  const getUnavailableStaff = React.useCallback(
    (date: string, period: 'morning' | 'afternoon' | 'full_day' = 'full_day'): string[] => {
      const unavailableStaffIds = new Set<string>()

      approvedLeaveRequests.forEach(leave => {
        const checkDate = new Date(date)
        const startDate = new Date(leave.start_date)
        const endDate = new Date(leave.end_date)

        const isInLeavePeriod = checkDate >= startDate && checkDate <= endDate

        if (isInLeavePeriod) {
          // If leave is half-day, check if it conflicts with requested period
          if (leave.isHalfDay && leave.halfDayPeriod && period !== 'full_day') {
            if (leave.halfDayPeriod === period) {
              unavailableStaffIds.add(leave.staff_id)
            }
          } else {
            unavailableStaffIds.add(leave.staff_id)
          }
        }
      })

      return Array.from(unavailableStaffIds)
    },
    [approvedLeaveRequests]
  )

  return {
    checkStaffAvailability,
    getUnavailableDates,
    getUnavailableStaff,
    approvedLeaveRequests,
    isLoading
  }
}
