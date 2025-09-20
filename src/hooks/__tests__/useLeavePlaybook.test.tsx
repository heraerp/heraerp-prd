import { renderHook, act, waitFor } from '@testing-library/react'
import { useLeavePlaybook } from '../useLeavePlaybook'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Mock the auth hook
jest.mock('@/components/auth/HERAAuthProvider', () => ({
  useHERAAuth: jest.fn()
}))

// Mock the playbook functions
jest.mock('@/lib/playbook/hr_leave', () => ({
  listStaff: jest.fn(),
  listPolicies: jest.fn(),
  listRequests: jest.fn(),
  createRequest: jest.fn(),
  decideRequest: jest.fn(),
  getBalances: jest.fn(),
  listHolidays: jest.fn(),
  calculateWorkingDays: jest.fn(() => 5)
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn(() => '2024-01-01'),
  startOfYear: jest.fn(() => new Date('2024-01-01')),
  endOfYear: jest.fn(() => new Date('2024-12-31'))
}))

// Import after mocks
import * as hrLeaveApi from '@/lib/playbook/hr_leave'

describe('useLeavePlaybook', () => {
  const mockOrganization = {
    id: 'org-123',
    name: 'Test Salon'
  }

  const mockStaff = [
    {
      id: 'staff-1',
      entity_name: 'Sarah Johnson',
      entity_code: 'EMP001',
      metadata: { branch_id: 'branch-1' }
    }
  ]

  const mockPolicies = [
    {
      id: 'policy-1',
      entity_name: 'Standard Annual Leave',
      metadata: { annual_entitlement: 21 }
    }
  ]

  const mockRequests = [
    {
      id: 'req-1',
      source_entity_id: 'staff-1',
      status: 'pending',
      metadata: {
        from: '2024-01-15',
        to: '2024-01-17',
        type: 'ANNUAL',
        days: 3
      }
    }
  ]

  const mockBalances = [
    {
      staff_id: 'staff-1',
      policy_id: 'policy-1',
      period_start: '2024-01-01',
      period_end: '2024-12-31',
      entitlement_days: 21,
      carried_over_days: 0,
      accrued_days: 17.5,
      taken_days: 10,
      scheduled_days: 3
    }
  ]

  const mockHolidays = [
    {
      id: 'holiday-1',
      metadata: { date: '2024-01-01', name: 'New Year' }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useHERAAuth as jest.Mock).mockReturnValue({
      organization: mockOrganization,
      isAuthenticated: true
    })
    ;(hrLeaveApi.listStaff as jest.Mock).mockResolvedValue({ items: mockStaff })
    ;(hrLeaveApi.listPolicies as jest.Mock).mockResolvedValue({ items: mockPolicies })
    ;(hrLeaveApi.listRequests as jest.Mock).mockResolvedValue({ items: mockRequests })
    ;(hrLeaveApi.getBalances as jest.Mock).mockResolvedValue(mockBalances)
    ;(hrLeaveApi.listHolidays as jest.Mock).mockResolvedValue({ items: mockHolidays })
  })

  it('loads initial data when authenticated', async () => {
    const { result } = renderHook(() => useLeavePlaybook())

    await waitFor(() => {
      expect(result.current.staff).toEqual(mockStaff)
      expect(result.current.policies).toEqual(mockPolicies)
      expect(result.current.holidays).toEqual(mockHolidays)
      expect(result.current.requests).toEqual(mockRequests)
    })

    expect(hrLeaveApi.listStaff).toHaveBeenCalledWith({
      organization_id: 'org-123',
      branch_id: undefined,
      q: undefined
    })

    expect(hrLeaveApi.listPolicies).toHaveBeenCalledWith({
      organization_id: 'org-123'
    })

    expect(hrLeaveApi.listHolidays).toHaveBeenCalledWith({
      organization_id: 'org-123',
      year: new Date().getFullYear()
    })
  })

  it('does not load data when not authenticated', () => {
    ;(useHERAAuth as jest.Mock).mockReturnValue({
      organization: null,
      isAuthenticated: false
    })

    renderHook(() => useLeavePlaybook())

    expect(hrLeaveApi.listStaff).not.toHaveBeenCalled()
    expect(hrLeaveApi.listPolicies).not.toHaveBeenCalled()
    expect(hrLeaveApi.listRequests).not.toHaveBeenCalled()
  })

  it('filters requests by branch', async () => {
    const { result } = renderHook(() => useLeavePlaybook({
      branchId: 'branch-1'
    }))

    await waitFor(() => {
      expect(hrLeaveApi.listRequests).toHaveBeenCalledWith(
        expect.objectContaining({
          branch_id: 'branch-1'
        })
      )
    })
  })

  it('filters requests by status', async () => {
    const { result } = renderHook(() => useLeavePlaybook({
      status: 'pending'
    }))

    await waitFor(() => {
      expect(hrLeaveApi.listRequests).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending'
        })
      )
    })
  })

  it('calculates remaining balance correctly', async () => {
    const { result } = renderHook(() => useLeavePlaybook())

    await waitFor(() => {
      const balance = result.current.balancesByStaff['staff-1']
      expect(balance.remaining).toBe(4.5) // 21 + 0 + 17.5 - 10 - 3
    })
  })

  it('creates leave request with correct data', async () => {
    ;(hrLeaveApi.createRequest as jest.Mock).mockResolvedValue({ id: 'new-req-1' })

    const { result } = renderHook(() => useLeavePlaybook())

    const leaveData = {
      staff_id: 'staff-1',
      branch_id: 'branch-1',
      type: 'ANNUAL' as const,
      from: new Date('2024-02-01'),
      to: new Date('2024-02-05'),
      half_day_start: false,
      half_day_end: false,
      notes: 'Vacation'
    }

    await act(async () => {
      await result.current.createLeave(leaveData)
    })

    expect(hrLeaveApi.createRequest).toHaveBeenCalledWith({
      organization_id: 'org-123',
      staff_id: 'staff-1',
      branch_id: 'branch-1',
      from: new Date('2024-02-01'),
      to: new Date('2024-02-05'),
      lines: expect.any(Array),
      notes: 'Vacation'
    })
  })

  it('handles approval correctly', async () => {
    ;(hrLeaveApi.decideRequest as jest.Mock).mockResolvedValue({ success: true })

    const { result } = renderHook(() => useLeavePlaybook())

    await act(async () => {
      await result.current.approve('req-1', 'Approved for team event')
    })

    expect(hrLeaveApi.decideRequest).toHaveBeenCalledWith({
      organization_id: 'org-123',
      request_id: 'req-1',
      approver_id: 'org-123',
      decision: 'APPROVE',
      reason: 'Approved for team event'
    })
  })

  it('handles rejection with reason', async () => {
    ;(hrLeaveApi.decideRequest as jest.Mock).mockResolvedValue({ success: true })

    const { result } = renderHook(() => useLeavePlaybook())

    await act(async () => {
      await result.current.reject('req-1', 'Insufficient coverage')
    })

    expect(hrLeaveApi.decideRequest).toHaveBeenCalledWith({
      organization_id: 'org-123',
      request_id: 'req-1',
      approver_id: 'org-123',
      decision: 'REJECT',
      reason: 'Insufficient coverage'
    })
  })

  it('exports CSV report correctly', async () => {
    const createElementSpy = jest.spyOn(document, 'createElement')
    const clickSpy = jest.fn()
    createElementSpy.mockReturnValue({ click: clickSpy } as any)

    const { result } = renderHook(() => useLeavePlaybook())

    await waitFor(() => {
      expect(result.current.staff).toEqual(mockStaff)
    })

    await act(async () => {
      await result.current.exportAnnualReportCSV({ year: 2024 })
    })

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(clickSpy).toHaveBeenCalled()
  })

  it('handles errors gracefully', async () => {
    ;(hrLeaveApi.listRequests as jest.Mock).mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useLeavePlaybook())

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load leave requests')
      expect(result.current.loading).toBe(false)
    })
  })

  it('supports pagination', async () => {
    const { result } = renderHook(() => useLeavePlaybook({
      page: 2,
      pageSize: 10
    }))

    await waitFor(() => {
      expect(hrLeaveApi.listRequests).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10
        })
      )
    })
  })
})