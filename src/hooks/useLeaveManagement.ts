/**
 * HERA Leave Management Hook
 *
 * React hook for leave management functionality
 */

import { useState, useCallback, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { leaveManagementApi } from '@/lib/salon/leave-management-api'
import { calendarService } from '@/lib/salon/calendar-integration'
import { toast } from '@/hooks/use-toast'

export interface UseLeaveManagementOptions {
  autoRefreshInterval?: number
  enableCalendarSync?: boolean
  organizationId?: string
}

export function useLeaveManagement(options: UseLeaveManagementOptions = {}) {
  const { organization, user } = useHERAAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // State for leave data
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [leaveBalances, setLeaveBalances] = useState<any[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [teamOverview, setTeamOverview] = useState<any[]>([])

  // Use provided organizationId or fallback to organization
  const organizationId = options.organizationId || organization?.id

  // Submit a new leave request
  const submitLeaveRequest = useCallback(
    async (request: any) => {
      if (!organizationId) {
        toast({
          title: 'Error',
          description: 'No organization context found',
          variant: 'destructive'
        })
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const result = await leaveManagementApi.createLeaveRequest(request, organizationId)

        toast({
          title: 'Success',
          description: `Leave request submitted successfully (${result.businessDays} days)`
        })

        // Refresh data
        await refreshLeaveData()

        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [organizationId]
  )

  // Approve a leave request
  const approveLeaveRequest = useCallback(
    async (requestId: string) => {
      if (!organizationId || !user?.id) {
        toast({
          title: 'Error',
          description: 'Authentication required',
          variant: 'destructive'
        })
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const result = await leaveManagementApi.approveLeaveRequest(
          requestId,
          user.id,
          organizationId
        )

        // Sync to calendar if enabled
        if (options.enableCalendarSync && result.approval) {
          const request = leaveRequests.find(r => r.id === requestId)
          if (request) {
            await calendarService.createLeaveEvent(
              'mock', // Use mock provider for now
              request,
              request.employee_name || 'Employee',
              organizationId
            )
          }
        }

        toast({
          title: 'Success',
          description: 'Leave request approved successfully'
        })

        // Refresh data
        await refreshLeaveData()

        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [organizationId, user, options.enableCalendarSync, leaveRequests]
  )

  // Reject/Cancel a leave request
  const cancelLeaveRequest = useCallback(
    async (requestId: string, reason: string) => {
      if (!organizationId || !user?.id) {
        toast({
          title: 'Error',
          description: 'Authentication required',
          variant: 'destructive'
        })
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const result = await leaveManagementApi.cancelLeaveRequest(
          requestId,
          user.id,
          reason,
          organizationId
        )

        // Remove from calendar if synced
        if (options.enableCalendarSync) {
          await calendarService.deleteLeaveEvent(requestId, organizationId)
        }

        toast({
          title: 'Success',
          description: 'Leave request cancelled successfully'
        })

        // Refresh data
        await refreshLeaveData()

        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [organizationId, user, options.enableCalendarSync]
  )

  // Get employee leave balance
  const getEmployeeBalance = useCallback(
    async (employeeId: string, leaveType: string) => {
      if (!organizationId) return null

      try {
        const balance = await leaveManagementApi.getEmployeeBalance(
          employeeId,
          leaveType,
          organizationId
        )
        return balance
      } catch (err) {
        console.error('Failed to fetch leave balance:', err)
        return null
      }
    },
    [organizationId]
  )

  // Create manual balance adjustment
  const createBalanceAdjustment = useCallback(
    async (employeeId: string, leaveType: string, days: number, reason: string) => {
      if (!organizationId || !user?.id) {
        toast({
          title: 'Error',
          description: 'Authentication required',
          variant: 'destructive'
        })
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const result = await leaveManagementApi.createBalanceAdjustment(
          employeeId,
          leaveType,
          days,
          reason,
          user.id,
          organizationId
        )

        toast({
          title: 'Success',
          description: `Balance adjustment of ${days} days created successfully`
        })

        // Refresh data
        await refreshLeaveData()

        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [organizationId, user]
  )

  // Get team leave overview
  const getTeamOverview = useCallback(
    async (managerId: string, startDate: string, endDate: string) => {
      if (!organizationId) return []

      try {
        const overview = await leaveManagementApi.getTeamLeaveOverview(
          managerId,
          startDate,
          endDate,
          organizationId
        )
        setTeamOverview(overview)
        return overview
      } catch (err) {
        console.error('Failed to fetch team overview:', err)
        return []
      }
    },
    [organizationId]
  )

  // Generate annual leave report
  const generateAnnualReport = useCallback(
    async (fiscalYearStart: string, fiscalYearEnd: string, options?: any) => {
      if (!organizationId) {
        toast({
          title: 'Error',
          description: 'No organization context found',
          variant: 'destructive'
        })
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const report = await leaveManagementApi.generateAnnualLeaveReport(
          organizationId,
          fiscalYearStart,
          fiscalYearEnd,
          options
        )

        toast({
          title: 'Success',
          description: 'Annual leave report generated successfully'
        })

        return report
      } catch (err) {
        const error = err as Error
        setError(error)
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [organizationId]
  )

  // Refresh all leave data
  const refreshLeaveData = useCallback(async () => {
    if (!organizationId) return

    setLoading(true)
    try {
      // Fetch all leave requests for this organization
      const requests = await leaveManagementApi.api.getTransactions(organizationId)

      if (requests.success && requests.data) {
        // Filter for leave requests only
        const leaveRequests = requests.data.filter(
          r =>
            r.transaction_type === 'leave_request' &&
            r.smart_code === 'HERA.SALON.HR.LEAVE.REQUEST.V1'
        )

        // Separate pending and all requests
        const pending = leaveRequests
          .filter(r => (r.metadata as any)?.approval_status === 'pending')
          .map(r => ({
            id: r.id,
            employeeName: (r.metadata as any)?.employee_name || 'Unknown Employee',
            employeeRole: (r.metadata as any)?.employee_role || 'Staff',
            leaveType: (r.metadata as any)?.leave_type || 'annual',
            startDate: new Date((r.metadata as any)?.start_date || new Date()),
            endDate: new Date((r.metadata as any)?.end_date || new Date()),
            days: r.total_amount || 1,
            reason: (r.metadata as any)?.reason || 'No reason provided',
            status: (r.metadata as any)?.approval_status || 'pending'
          }))

        setPendingApprovals(pending)
        setLeaveRequests(leaveRequests)
      }

      // TODO: Fetch leave balances
      setLeaveBalances([])

      // TODO: Fetch team overview
      setTeamOverview([])
    } catch (err) {
      console.error('Failed to refresh leave data:', err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  // Auto-refresh if enabled
  useEffect(() => {
    if (options.autoRefreshInterval && organizationId) {
      const interval = setInterval(() => {
        refreshLeaveData()
      }, options.autoRefreshInterval)

      return () => clearInterval(interval)
    }
  }, [options.autoRefreshInterval, organizationId, refreshLeaveData])

  // Initial data load
  useEffect(() => {
    if (organizationId) {
      refreshLeaveData()
    }
  }, [organizationId, refreshLeaveData])

  return {
    // State
    loading,
    error,
    leaveRequests,
    leaveBalances,
    pendingApprovals,
    teamOverview,

    // Actions
    submitLeaveRequest,
    approveLeaveRequest,
    cancelLeaveRequest,
    getEmployeeBalance,
    createBalanceAdjustment,
    getTeamOverview,
    generateAnnualReport,
    refreshLeaveData,

    // Context
    organizationId,
    userId: user?.id
  }
}
