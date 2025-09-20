import {
  calculateWorkingDays,
  listStaff,
  listPolicies,
  listRequests,
  createRequest,
  decideRequest,
  getBalances,
  upsertBalance,
  listHolidays
} from '../hr_leave'
import { universalApi } from '@/lib/universal-api-v2'

// Mock the universal API
jest.mock('@/lib/universal-api-v2', () => ({
  universalApi: {
    read: jest.fn(),
    listEntities: jest.fn(),
    createEntity: jest.fn(),
    updateEntity: jest.fn(),
    createTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    setDynamicField: jest.fn()
  }
}))

describe('hr_leave playbook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateWorkingDays', () => {
    it('calculates working days correctly excluding weekends', () => {
      const from = new Date('2024-01-01') // Monday
      const to = new Date('2024-01-05') // Friday
      const holidays: Date[] = []
      
      const result = calculateWorkingDays(from, to, holidays, false, false)
      expect(result).toBe(5) // Mon-Fri
    })

    it('excludes holidays from working days', () => {
      const from = new Date('2024-01-01')
      const to = new Date('2024-01-05')
      const holidays = [new Date('2024-01-03')] // Wednesday
      
      const result = calculateWorkingDays(from, to, holidays, false, false)
      expect(result).toBe(4) // 5 days - 1 holiday
    })

    it('handles half days correctly', () => {
      const from = new Date('2024-01-01')
      const to = new Date('2024-01-05')
      const holidays: Date[] = []
      
      const result = calculateWorkingDays(from, to, holidays, true, true)
      expect(result).toBe(4) // 5 days - 0.5 start - 0.5 end
    })

    it('excludes weekends correctly', () => {
      const from = new Date('2024-01-05') // Friday
      const to = new Date('2024-01-08') // Monday
      const holidays: Date[] = []
      
      const result = calculateWorkingDays(from, to, holidays, false, false)
      expect(result).toBe(2) // Friday and Monday only
    })

    it('handles single day leave', () => {
      const from = new Date('2024-01-03') // Wednesday
      const to = new Date('2024-01-03') // Same day
      const holidays: Date[] = []
      
      const result = calculateWorkingDays(from, to, holidays, false, false)
      expect(result).toBe(1)
    })

    it('handles half day on single day leave', () => {
      const from = new Date('2024-01-03')
      const to = new Date('2024-01-03')
      const holidays: Date[] = []
      
      const result = calculateWorkingDays(from, to, holidays, true, false)
      expect(result).toBe(0.5)
    })
  })

  describe('listStaff', () => {
    it('queries staff entities correctly', async () => {
      const mockStaff = [
        { id: 'staff-1', entity_type: 'employee', entity_name: 'John Doe' }
      ]
      ;(universalApi.listEntities as jest.Mock).mockResolvedValue({ data: mockStaff })

      const result = await listStaff({
        organization_id: 'org-123',
        branch_id: 'branch-1'
      })

      expect(universalApi.listEntities).toHaveBeenCalledWith({
        entity_type: 'employee',
        organization_id: 'org-123'
      })

      expect(result.items).toEqual(mockStaff)
    })

    it('filters by search query', async () => {
      const mockStaff = [
        { id: 'staff-1', entity_name: 'John Doe' },
        { id: 'staff-2', entity_name: 'Jane Smith' }
      ]
      ;(universalApi.listEntities as jest.Mock).mockResolvedValue({ data: mockStaff })

      const result = await listStaff({
        organization_id: 'org-123',
        q: 'john'
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].entity_name).toBe('John Doe')
    })
  })

  describe('listPolicies', () => {
    it('queries leave policies correctly', async () => {
      const mockPolicies = [
        { 
          id: 'policy-1', 
          entity_type: 'hr_policy',
          smart_code: 'HERA.SALON.HR.POL.LEAVE.ANNUAL.V1'
        }
      ]
      ;(universalApi.listEntities as jest.Mock).mockResolvedValue({ data: mockPolicies })

      const result = await listPolicies({ organization_id: 'org-123' })

      expect(universalApi.listEntities).toHaveBeenCalledWith({
        entity_type: 'hr_policy',
        organization_id: 'org-123'
      })

      expect(result.items).toHaveLength(1)
    })

    it('filters only leave policies', async () => {
      const mockPolicies = [
        { 
          id: 'policy-1', 
          smart_code: 'HERA.SALON.HR.POL.LEAVE.ANNUAL.V1'
        },
        { 
          id: 'policy-2', 
          smart_code: 'HERA.SALON.HR.POL.ATTENDANCE.V1'
        }
      ]
      ;(universalApi.listEntities as jest.Mock).mockResolvedValue({ data: mockPolicies })

      const result = await listPolicies({ organization_id: 'org-123' })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe('policy-1')
    })
  })

  describe('createRequest', () => {
    it('creates leave request transaction correctly', async () => {
      const mockTransaction = { id: 'txn-1' }
      ;(universalApi.createTransaction as jest.Mock).mockResolvedValue({ data: mockTransaction })

      const result = await createRequest({
        organization_id: 'org-123',
        staff_id: 'staff-1',
        branch_id: 'branch-1',
        from: new Date('2024-01-15'),
        to: new Date('2024-01-17'),
        lines: [
          { date: '2024-01-15', portion: 1, type: 'ANNUAL' },
          { date: '2024-01-16', portion: 1, type: 'ANNUAL' },
          { date: '2024-01-17', portion: 1, type: 'ANNUAL' }
        ],
        notes: 'Family vacation'
      })

      expect(universalApi.createTransaction).toHaveBeenCalledWith({
        transaction_type: 'leave_request',
        smart_code: 'HERA.SALON.HR.LEAVE.REQUEST.V1',
        organization_id: 'org-123',
        source_entity_id: 'staff-1',
        status: 'pending',
        metadata: {
          from: '2024-01-15',
          to: '2024-01-17',
          type: 'ANNUAL',
          days: 3,
          notes: 'Family vacation',
          branch_id: 'branch-1'
        },
        lines: expect.arrayContaining([
          expect.objectContaining({
            entity_type: 'leave_day',
            smart_code: 'HERA.SALON.HR.LEAVE.DAY.V1'
          })
        ])
      })

      expect(result).toEqual(mockTransaction)
    })

    it('handles half days in calculation', async () => {
      ;(universalApi.createTransaction as jest.Mock).mockResolvedValue({ data: { id: 'txn-1' } })

      await createRequest({
        organization_id: 'org-123',
        staff_id: 'staff-1',
        branch_id: 'branch-1',
        from: new Date('2024-01-15'),
        to: new Date('2024-01-15'),
        lines: [
          { date: '2024-01-15', portion: 0.5, type: 'ANNUAL' }
        ]
      })

      expect(universalApi.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            days: 0.5
          })
        })
      )
    })
  })

  describe('decideRequest', () => {
    it('approves request correctly', async () => {
      const mockRequest = {
        id: 'req-1',
        status: 'pending'
      }
      ;(universalApi.read as jest.Mock).mockResolvedValue({ 
        data: [mockRequest] 
      })
      ;(universalApi.updateTransaction as jest.Mock).mockResolvedValue({ 
        data: { ...mockRequest, status: 'approved' } 
      })

      const result = await decideRequest({
        organization_id: 'org-123',
        request_id: 'req-1',
        approver_id: 'manager-1',
        decision: 'APPROVE',
        reason: 'Looks good'
      })

      expect(universalApi.updateTransaction).toHaveBeenCalledWith('req-1', {
        status: 'approved'
      })

      expect(universalApi.setDynamicField).toHaveBeenCalledWith(
        'req-1',
        'approval_data',
        expect.objectContaining({
          decision: 'APPROVE',
          approver_id: 'manager-1',
          reason: 'Looks good'
        })
      )
    })

    it('rejects request correctly', async () => {
      const mockRequest = {
        id: 'req-1',
        status: 'pending'
      }
      ;(universalApi.read as jest.Mock).mockResolvedValue({ 
        data: [mockRequest] 
      })
      ;(universalApi.updateTransaction as jest.Mock).mockResolvedValue({ 
        data: { ...mockRequest, status: 'rejected' } 
      })

      const result = await decideRequest({
        organization_id: 'org-123',
        request_id: 'req-1',
        approver_id: 'manager-1',
        decision: 'REJECT',
        reason: 'Not enough coverage'
      })

      expect(universalApi.updateTransaction).toHaveBeenCalledWith('req-1', {
        status: 'rejected'
      })
    })

    it('throws error if request not found', async () => {
      ;(universalApi.read as jest.Mock).mockResolvedValue({ data: [] })

      await expect(
        decideRequest({
          organization_id: 'org-123',
          request_id: 'req-999',
          approver_id: 'manager-1',
          decision: 'APPROVE'
        })
      ).rejects.toThrow('Leave request not found')
    })
  })

  describe('getBalances', () => {
    it('retrieves balances correctly', async () => {
      const mockBalances = [
        {
          id: 'bal-1',
          entity_type: 'leave_balance',
          metadata: {
            staff_id: 'staff-1',
            policy_id: 'policy-1',
            period_start: '2024-01-01',
            entitlement_days: 21,
            taken_days: 5
          }
        }
      ]
      ;(universalApi.listEntities as jest.Mock).mockResolvedValue({ data: mockBalances })

      const result = await getBalances({
        organization_id: 'org-123',
        staff_ids: ['staff-1'],
        period_start: '2024-01-01',
        period_end: '2024-12-31'
      })

      expect(universalApi.listEntities).toHaveBeenCalledWith({
        entity_type: 'leave_balance',
        organization_id: 'org-123'
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(expect.objectContaining({
        staff_id: 'staff-1',
        entitlement_days: 21,
        taken_days: 5
      }))
    })

    it('filters by staff IDs', async () => {
      const mockBalances = [
        {
          metadata: { staff_id: 'staff-1' }
        },
        {
          metadata: { staff_id: 'staff-2' }
        }
      ]
      ;(universalApi.listEntities as jest.Mock).mockResolvedValue({ data: mockBalances })

      const result = await getBalances({
        organization_id: 'org-123',
        staff_ids: ['staff-1']
      })

      expect(result).toHaveLength(1)
    })
  })

  describe('listHolidays', () => {
    it('lists holidays for specific year', async () => {
      const mockHolidays = [
        {
          id: 'hol-1',
          entity_type: 'public_holiday',
          metadata: {
            date: '2024-01-01',
            name: 'New Year'
          }
        }
      ]
      ;(universalApi.listEntities as jest.Mock).mockResolvedValue({ data: mockHolidays })

      const result = await listHolidays({
        organization_id: 'org-123',
        year: 2024
      })

      expect(universalApi.listEntities).toHaveBeenCalledWith({
        entity_type: 'public_holiday',
        organization_id: 'org-123'
      })

      expect(result.items).toHaveLength(1)
    })

    it('filters holidays by year', async () => {
      const mockHolidays = [
        {
          metadata: { date: '2024-01-01' }
        },
        {
          metadata: { date: '2023-12-25' }
        }
      ]
      ;(universalApi.listEntities as jest.Mock).mockResolvedValue({ data: mockHolidays })

      const result = await listHolidays({
        organization_id: 'org-123',
        year: 2024
      })

      expect(result.items).toHaveLength(1)
    })
  })
})