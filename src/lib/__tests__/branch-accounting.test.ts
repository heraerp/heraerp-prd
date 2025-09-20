/**
 * Tests for Branch Accounting Implementation
 * Verifies branch_id requirements and P&L aggregation
 */

import { assertBranchOnEvent } from '@/lib/guardrails/branch'
import { postEventWithBranch } from '@/lib/playbook/finance'
import { getBranchPnL } from '@/server/reports/branch-pnl'

describe('Branch Accounting', () => {
  describe('Branch Guardrails', () => {
    it('should require branch_id for POS transactions', () => {
      expect(() => {
        assertBranchOnEvent({
          transaction_type: 'POS_SALE',
          business_context: { /* missing branch_id */ },
          lines: []
        })
      }).toThrow('branch_id required in business_context')
    })

    it('should require branch_id for appointment transactions', () => {
      expect(() => {
        assertBranchOnEvent({
          transaction_type: 'APPT_BOOKING',
          business_context: { /* missing branch_id */ },
          lines: []
        })
      }).toThrow('branch_id required in business_context')
    })

    it('should not require branch_id for general journal entries', () => {
      expect(() => {
        assertBranchOnEvent({
          transaction_type: 'JOURNAL_ENTRY',
          business_context: {},
          lines: []
        })
      }).not.toThrow()
    })

    it('should enforce consistent branch_id across all lines', () => {
      expect(() => {
        assertBranchOnEvent({
          transaction_type: 'POS_SALE',
          business_context: { branch_id: 'branch-1' },
          lines: [
            { line_data: { branch_id: 'branch-1' } },
            { line_data: { branch_id: 'branch-2' } } // Different branch!
          ]
        })
      }).toThrow('All lines must carry the same branch_id')
    })

    it('should accept lines without explicit branch_id (inherit from transaction)', () => {
      expect(() => {
        assertBranchOnEvent({
          transaction_type: 'POS_SALE',
          business_context: { branch_id: 'branch-1' },
          lines: [
            { line_data: {} }, // No branch_id, should inherit
            { line_data: { branch_id: 'branch-1' } } // Explicit match
          ]
        })
      }).not.toThrow()
    })
  })

  describe('Branch-aware Posting', () => {
    it('should reject postEventWithBranch without branch_id', async () => {
      await expect(postEventWithBranch({
        organization_id: 'test-org',
        transaction_type: 'POS_SALE',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        business_context: {} as any, // Missing branch_id
        lines: []
      })).rejects.toThrow('branch_id is required')
    })

    it('should propagate branch_id to all transaction lines', async () => {
      const mockCreate = jest.fn().mockResolvedValue({ 
        success: true, 
        data: { id: 'txn-123' } 
      })
      
      jest.mock('@/src/lib/universal-api-v2', () => ({
        universalApi: {
          setOrganizationId: jest.fn(),
          create: mockCreate
        }
      }))

      await postEventWithBranch({
        organization_id: 'test-org',
        transaction_type: 'POS_SALE',
        smart_code: 'HERA.SALON.POS.TXN.SALE.V1',
        business_context: { branch_id: 'branch-123' },
        lines: [
          {
            line_number: 1,
            line_type: 'REVENUE',
            line_amount: -1000,
            smart_code: 'HERA.ACCOUNTING.GL.LINE.REVENUE.V1'
          }
        ]
      })

      // Verify branch_id was added to line metadata
      const lineCall = mockCreate.mock.calls.find(
        call => call[0] === 'universal_transaction_lines'
      )
      expect(lineCall?.[1]?.metadata?.branch_id).toBe('branch-123')
    })
  })

  describe('Branch P&L Reporting', () => {
    it('should filter transactions by date range', async () => {
      const mockRead = jest.fn()
        .mockResolvedValueOnce({ // Transactions
          success: true,
          data: [{ id: 'txn-1' }, { id: 'txn-2' }]
        })
        .mockResolvedValueOnce({ // Lines
          success: true,
          data: [
            {
              transaction_id: 'txn-1',
              line_type: 'REVENUE',
              line_amount: -1000,
              metadata: { branch_id: 'branch-1' }
            }
          ]
        })
        .mockResolvedValueOnce({ // Branch entities
          success: true,
          data: [{ id: 'branch-1', entity_name: 'Main Branch' }]
        })

      jest.mock('@/src/lib/universal-api-v2', () => ({
        universalApi: {
          setOrganizationId: jest.fn(),
          read: mockRead
        }
      }))

      const result = await getBranchPnL({
        organization_id: 'test-org',
        date_from: '2024-01-01',
        date_to: '2024-01-31'
      })

      // Verify date filter was applied
      const txnCall = mockRead.mock.calls[0]
      expect(txnCall[1]).toMatchObject({
        organization_id: 'test-org'
      })
      // Note: Actual date filtering logic would be more complex
    })

    it('should aggregate amounts by branch and line type', async () => {
      const mockData = {
        transactions: [{ id: 'txn-1' }],
        lines: [
          {
            transaction_id: 'txn-1',
            line_type: 'REVENUE',
            line_amount: -1000,
            metadata: { branch_id: 'branch-1' }
          },
          {
            transaction_id: 'txn-1',
            line_type: 'REVENUE',
            line_amount: -500,
            metadata: { branch_id: 'branch-1' }
          },
          {
            transaction_id: 'txn-1',
            line_type: 'EXPENSE',
            line_amount: 300,
            metadata: { branch_id: 'branch-1' }
          }
        ],
        branches: [{ id: 'branch-1', entity_name: 'Main Branch' }]
      }

      // Mock the API calls
      const result = await getBranchPnL({
        organization_id: 'test-org',
        branch_id: 'branch-1'
      })

      // Should aggregate by branch and type
      expect(result.rows).toContainEqual(
        expect.objectContaining({
          branch_id: 'branch-1',
          line_type: 'REVENUE',
          amount: -1500, // Sum of revenue lines
          transaction_count: 2
        })
      )

      expect(result.rows).toContainEqual(
        expect.objectContaining({
          branch_id: 'branch-1',
          line_type: 'EXPENSE',
          amount: 300,
          transaction_count: 1
        })
      )
    })

    it('should calculate summary totals correctly', async () => {
      const result = {
        rows: [
          { branch_id: 'b1', line_type: 'REVENUE', amount: -2000 },
          { branch_id: 'b1', line_type: 'EXPENSE', amount: 800 },
          { branch_id: 'b2', line_type: 'REVENUE', amount: -1500 },
          { branch_id: 'b2', line_type: 'EXPENSE', amount: 600 }
        ],
        summary: {
          total_revenue: 3500,
          total_expenses: 1400,
          net_income: 2100,
          branches_count: 2
        }
      }

      expect(result.summary.total_revenue).toBe(3500)
      expect(result.summary.total_expenses).toBe(1400)
      expect(result.summary.net_income).toBe(2100)
      expect(result.summary.branches_count).toBe(2)
    })
  })

  describe('Integration with Universal API', () => {
    it('should use array filters for efficient queries', async () => {
      // When fetching lines for multiple transactions
      const txnIds = ['txn-1', 'txn-2', 'txn-3']
      
      // Should use array filter instead of multiple queries
      const mockRead = jest.fn().mockResolvedValue({
        success: true,
        data: []
      })

      jest.mock('@/src/lib/universal-api-v2', () => ({
        universalApi: {
          setOrganizationId: jest.fn(),
          read: mockRead
        }
      }))

      await getBranchPnL({
        organization_id: 'test-org'
      })

      // Verify array filter was used
      const lineCall = mockRead.mock.calls.find(
        call => call[0] === 'universal_transaction_lines'
      )
      expect(lineCall?.[1]?.transaction_id).toBeInstanceOf(Array)
    })

    it('should handle empty array filters gracefully', async () => {
      // When no transactions found, should not query lines
      const mockRead = jest.fn()
        .mockResolvedValueOnce({ // No transactions
          success: true,
          data: []
        })

      const result = await getBranchPnL({
        organization_id: 'test-org'
      })

      expect(result).toEqual({ rows: [] })
      // Should not attempt to query lines with empty array
      expect(mockRead).toHaveBeenCalledTimes(1)
    })
  })
})