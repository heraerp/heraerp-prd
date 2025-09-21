import { useState, useEffect, useCallback } from 'react'
import { format, startOfYear, endOfYear } from 'date-fns'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import {
  listStaff,
  listPolicies,
  listRequests,
  createRequest,
  decideRequest,
  getBalances,
  upsertBalance,
  listHolidays,
  calculateWorkingDays
} from '@/lib/playbook/hr_leave'
import type { LeaveRequest, LeavePolicy } from '@/schemas/hr_leave'

interface UseLeavePlaybookOptions {
  branchId?: string
  staffId?: string
  range?: { from: Date; to: Date }
  status?: 'pending' | 'approved' | 'rejected' | 'all'
  query?: string
  page?: number
  pageSize?: number
}

interface LeaveBalance {
  staff_id: string
  policy_id: string
  period_start: string
  period_end: string
  entitlement_days: number
  carried_over_days: number
  accrued_days: number
  taken_days: number
  scheduled_days: number
  remaining?: number
}

interface Staff {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    branch_id?: string
    role?: string
    join_date?: string
  }
}

export function useLeavePlaybook(options: UseLeavePlaybookOptions = {}) {
  const { organization, isAuthenticated } = useHERAAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localOrgId, setLocalOrgId] = useState<string | null>(null)

  const [requests, setRequests] = useState<any[]>([])
  const [balancesByStaff, setBalancesByStaff] = useState<Record<string, LeaveBalance>>({})
  const [policies, setPolicies] = useState<any[]>([])
  const [holidays, setHolidays] = useState<any[]>([])
  const [staff, setStaff] = useState<Staff[]>([])

  // Get organization ID from localStorage for demo mode
  useEffect(() => {
    const storedOrgId = localStorage.getItem('organizationId')
    if (storedOrgId) {
      setLocalOrgId(storedOrgId)
    }
  }, [])

  const organizationId = organization?.id || localOrgId || ''
  const { branchId, staffId, range, status = 'all', query, page = 1, pageSize = 50 } = options

  // Refresh function to reload data
  const refreshData = useCallback(async () => {
    if (!organizationId || (!isAuthenticated && !localOrgId)) return

    setLoading(true)
    setError(null)

    try {
      const offset = (page - 1) * pageSize
      const res = await listRequests({
        organization_id: organizationId,
        branch_id: branchId,
        staff_id: staffId,
        status: status === 'all' ? undefined : status,
        from: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
        to: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
        limit: pageSize,
        offset
      })

      setRequests(res.items || [])
    } catch (err) {
      console.error('Failed to refresh requests:', err)
      setError('Failed to refresh leave requests')
    } finally {
      setLoading(false)
    }
  }, [organizationId, branchId, staffId, status, range, page, pageSize, isAuthenticated, localOrgId])

  // Load policies and holidays once
  useEffect(() => {
    if (!organizationId || (!isAuthenticated && !localOrgId)) return

    const loadStaticData = async () => {
      try {
        const currentYear = new Date().getFullYear()
        const [policiesRes, holidaysRes] = await Promise.all([
          listPolicies({ organization_id: organizationId }),
          listHolidays({ organization_id: organizationId, year: currentYear })
        ])

        setPolicies(policiesRes.items || [])
        setHolidays(holidaysRes.items || [])
      } catch (err) {
        console.error('Failed to load static data:', err)
      }
    }

    loadStaticData()
  }, [organizationId, isAuthenticated, localOrgId])

  // Load staff
  useEffect(() => {
    if (!organizationId || (!isAuthenticated && !localOrgId)) return

    const loadStaff = async () => {
      try {
        const res = await listStaff({
          organization_id: organizationId,
          branch_id: branchId,
          q: query
        })
        setStaff(res.items || [])
      } catch (err) {
        console.error('Failed to load staff:', err)
      }
    }

    loadStaff()
  }, [organizationId, branchId, query, isAuthenticated, localOrgId])

  // Load requests
  useEffect(() => {
    if (!organizationId || (!isAuthenticated && !localOrgId)) return

    const loadRequests = async () => {
      setLoading(true)
      setError(null)

      try {
        const offset = (page - 1) * pageSize
        const res = await listRequests({
          organization_id: organizationId,
          branch_id: branchId,
          staff_id: staffId,
          status: status === 'all' ? undefined : status,
          from: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
          to: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
          limit: pageSize,
          offset
        })

        setRequests(res.items || [])
      } catch (err) {
        console.error('Failed to load requests:', err)
        setError('Failed to load leave requests')
      } finally {
        setLoading(false)
      }
    }

    loadRequests()
  }, [organizationId, branchId, staffId, status, range, page, pageSize, isAuthenticated, localOrgId])

  // Load balances for visible staff
  useEffect(() => {
    if (!organizationId || (!isAuthenticated && !localOrgId) || staff.length === 0) return

    const loadBalances = async () => {
      try {
        const year = new Date().getFullYear()
        const periodStart = format(startOfYear(new Date(year, 0, 1)), 'yyyy-MM-dd')
        const periodEnd = format(endOfYear(new Date(year, 11, 31)), 'yyyy-MM-dd')

        const balances = await getBalances({
          organization_id: organizationId,
          staff_ids: staff.map(s => s.id),
          period_start: periodStart,
          period_end: periodEnd
        })

        // Convert to lookup object and calculate remaining
        const balanceMap: Record<string, LeaveBalance> = {}
        for (const balance of balances) {
          const remaining =
            balance.entitlement_days +
            balance.carried_over_days +
            balance.accrued_days -
            balance.taken_days -
            balance.scheduled_days

          balanceMap[balance.staff_id] = {
            ...balance,
            remaining
          }
        }

        setBalancesByStaff(balanceMap)
      } catch (err) {
        console.error('Failed to load balances:', err)
      }
    }

    loadBalances()
  }, [organizationId, staff, isAuthenticated, localOrgId])

  // Create leave request
  const createLeave = useCallback(
    async (payload: LeaveRequest) => {
      if (!organizationId) throw new Error('No organization')

      try {
        setLoading(true)

        // Calculate working days
        const holidayDates = holidays.map(h => new Date(h.metadata.date))
        const workingDays = calculateWorkingDays(
          payload.from,
          payload.to,
          holidayDates,
          payload.half_day_start,
          payload.half_day_end
        )

        // Generate lines for each day
        const days = []
        const current = new Date(payload.from)
        while (current <= payload.to) {
          days.push({
            date: format(current, 'yyyy-MM-dd'),
            portion: 1,
            type: payload.type
          })
          current.setDate(current.getDate() + 1)
        }

        // Adjust for half days
        if (payload.half_day_start && days.length > 0) {
          days[0].portion = 0.5
        }
        if (payload.half_day_end && days.length > 0) {
          days[days.length - 1].portion = 0.5
        }

        const result = await createRequest({
          organization_id: organizationId,
          staff_id: payload.staff_id,
          branch_id: payload.branch_id,
          from: payload.from,
          to: payload.to,
          lines: days,
          notes: payload.notes
        })

        // Reload requests and balances
        await refreshData()

        return result
      } catch (err) {
        console.error('Failed to create request:', err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [organizationId, holidays, refreshData]
  )

  // Approve/reject request
  const approve = useCallback(
    async (request_id: string, reason?: string) => {
      if (!organizationId) throw new Error('No organization')

      try {
        setLoading(true)
        await decideRequest({
          organization_id: organizationId,
          request_id,
          approver_id: organization?.id || organizationId, // Using org as approver for now
          decision: 'APPROVE',
          reason
        })

        await refreshData()
      } catch (err) {
        console.error('Failed to approve request:', err)
        setError('Failed to approve request')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [organizationId, organization, refreshData]
  )

  const reject = useCallback(
    async (request_id: string, reason?: string) => {
      if (!organizationId || !reason) throw new Error('Reason required for rejection')

      try {
        setLoading(true)
        await decideRequest({
          organization_id: organizationId,
          request_id,
          approver_id: organization?.id || organizationId,
          decision: 'REJECT',
          reason
        })

        await refreshData()
      } catch (err) {
        console.error('Failed to reject request:', err)
        setError('Failed to reject request')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [organizationId, organization, refreshData]
  )

  // Export CSV
  const exportAnnualReportCSV = useCallback(
    async ({ year, branchId }: { year: number; branchId?: string }) => {
      // Generate CSV content
      const headers = [
        'Organization',
        'Branch',
        'Staff Code',
        'Staff Name',
        'Entitlement',
        'Carry-over',
        'Accrued',
        'Taken',
        'Scheduled',
        'Remaining',
        'Year'
      ]
      const rows = []

      for (const staffMember of staff) {
        const balance = balancesByStaff[staffMember.id]
        if (!balance) continue

        if (branchId && staffMember.metadata?.branch_id !== branchId) continue

        rows.push([
          organization?.name || 'Unknown',
          staffMember.metadata?.branch_id || 'Main',
          staffMember.entity_code,
          staffMember.entity_name,
          balance.entitlement_days,
          balance.carried_over_days,
          balance.accrued_days,
          balance.taken_days,
          balance.scheduled_days,
          balance.remaining || 0,
          year
        ])
      }

      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

      // Download
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `annual-leave-report-${year}.csv`
      a.click()
      URL.revokeObjectURL(url)
    },
    [staff, balancesByStaff, organization]
  )

  return {
    // Data
    requests,
    balancesByStaff,
    policies,
    holidays,
    staff,
    loading,
    error,

    // Actions
    createLeave,
    approve,
    reject,
    exportAnnualReportCSV,
    refreshData
  }
}
