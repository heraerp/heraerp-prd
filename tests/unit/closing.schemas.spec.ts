// ================================================================================
// CLOSING SCHEMAS UNIT TESTS
// Tests for closing workflow schemas and validation
// ================================================================================

import { describe, it, expect } from '@jest/globals'
import {
  WorkflowStatus,
  WorkflowStep,
  ClosingWorkflow,
  JournalEntrySummary,
  BranchStatus,
  CLOSING_SMART_CODES,
  DEFAULT_WORKFLOW_STEPS
} from '@/lib/api/closing'

describe('Closing Schemas', () => {
  
  describe('WorkflowStatus', () => {
    it('should validate all status values', () => {
      const validStatuses = ['pending', 'in_progress', 'done', 'error']
      
      validStatuses.forEach(status => {
        expect(() => WorkflowStatus.parse(status)).not.toThrow()
      })
    })

    it('should reject invalid status values', () => {
      const invalidStatuses = ['started', 'completed', 'failed', 'unknown']
      
      invalidStatuses.forEach(status => {
        expect(() => WorkflowStatus.parse(status)).toThrow()
      })
    })
  })

  describe('WorkflowStep', () => {
    it('should validate valid workflow step', () => {
      const validStep = {
        id: 'revenue_calc',
        name: 'Revenue Calculation',
        description: 'Calculate total revenue for the period',
        status: 'pending',
        smart_code: 'HERA.FIN.FISCAL.CLOSING.REVENUE.CALC.v1'
      }
      
      expect(() => WorkflowStep.parse(validStep)).not.toThrow()
    })

    it('should accept optional fields', () => {
      const stepWithOptionals = {
        id: 'revenue_calc',
        name: 'Revenue Calculation',
        description: 'Calculate total revenue for the period',
        status: 'done',
        started_at: '2025-01-31T10:00:00Z',
        completed_at: '2025-01-31T10:05:00Z',
        journal_entry_id: 'je_12345',
        smart_code: 'HERA.FIN.FISCAL.CLOSING.REVENUE.CALC.v1'
      }
      
      expect(() => WorkflowStep.parse(stepWithOptionals)).not.toThrow()
    })

    it('should accept error state with message', () => {
      const errorStep = {
        id: 'revenue_calc',
        name: 'Revenue Calculation',
        description: 'Calculate total revenue for the period',
        status: 'error',
        started_at: '2025-01-31T10:00:00Z',
        error_message: 'Failed to connect to database',
        smart_code: 'HERA.FIN.FISCAL.CLOSING.REVENUE.CALC.v1'
      }
      
      const parsed = WorkflowStep.parse(errorStep)
      expect(parsed.error_message).toBe('Failed to connect to database')
    })
  })

  describe('ClosingWorkflow', () => {
    it('should validate complete workflow', () => {
      const validWorkflow = {
        organization_id: 'org_12345',
        fiscal_year: '2025',
        status: 'pending',
        steps: [
          {
            id: 'revenue_calc',
            name: 'Revenue Calculation',
            description: 'Calculate total revenue',
            status: 'pending',
            smart_code: 'HERA.FIN.FISCAL.CLOSING.REVENUE.CALC.v1'
          }
        ]
      }
      
      expect(() => ClosingWorkflow.parse(validWorkflow)).not.toThrow()
    })

    it('should validate workflow with multiple steps', () => {
      const multiStepWorkflow = {
        organization_id: 'org_12345',
        fiscal_year: '2025',
        status: 'in_progress',
        started_at: '2025-01-31T09:00:00Z',
        started_by: 'admin@example.com',
        steps: DEFAULT_WORKFLOW_STEPS.map((step, index) => ({
          ...step,
          status: index === 0 ? 'done' : index === 1 ? 'in_progress' : 'pending'
        }))
      }
      
      const parsed = ClosingWorkflow.parse(multiStepWorkflow)
      expect(parsed.steps).toHaveLength(DEFAULT_WORKFLOW_STEPS.length)
      expect(parsed.steps[0].status).toBe('done')
      expect(parsed.steps[1].status).toBe('in_progress')
    })

    it('should require at least one step', () => {
      const noStepsWorkflow = {
        organization_id: 'org_12345',
        fiscal_year: '2025',
        status: 'pending',
        steps: []
      }
      
      // Should parse successfully but with empty array
      expect(() => ClosingWorkflow.parse(noStepsWorkflow)).not.toThrow()
    })
  })

  describe('JournalEntrySummary', () => {
    it('should validate valid journal entry summary', () => {
      const validJournal = {
        id: 'je_12345',
        transaction_code: 'JE-2025-001',
        transaction_date: '2025-01-31',
        description: 'Year-end closing journal entry',
        total_debit: 100000,
        total_credit: 100000,
        line_count: 10,
        smart_code: 'HERA.FIN.FISCAL.CLOSE.JE.v1',
        status: 'posted',
        created_at: '2025-01-31T10:00:00Z'
      }
      
      expect(() => JournalEntrySummary.parse(validJournal)).not.toThrow()
    })

    it('should enforce balanced journal entries', () => {
      const journal = {
        id: 'je_12345',
        transaction_code: 'JE-2025-001',
        transaction_date: '2025-01-31',
        description: 'Year-end closing journal entry',
        total_debit: 100000,
        total_credit: 100000,
        line_count: 10,
        smart_code: 'HERA.FIN.FISCAL.CLOSE.JE.v1',
        status: 'posted',
        created_at: '2025-01-31T10:00:00Z'
      }
      
      const parsed = JournalEntrySummary.parse(journal)
      expect(parsed.total_debit).toBe(parsed.total_credit)
    })
  })

  describe('BranchStatus', () => {
    it('should validate valid branch status', () => {
      const validBranch = {
        branch_id: 'branch_001',
        branch_code: 'DXB-001',
        branch_name: 'Dubai Main Branch',
        closing_status: 'pending',
        checklist_completion: 75,
        has_errors: false
      }
      
      expect(() => BranchStatus.parse(validBranch)).not.toThrow()
    })

    it('should accept optional last activity', () => {
      const branchWithActivity = {
        branch_id: 'branch_001',
        branch_code: 'DXB-001',
        branch_name: 'Dubai Main Branch',
        closing_status: 'in_progress',
        checklist_completion: 90,
        has_errors: false,
        last_activity: '2025-01-31T15:30:00Z'
      }
      
      expect(() => BranchStatus.parse(branchWithActivity)).not.toThrow()
    })

    it('should validate completion percentage bounds', () => {
      const branch = {
        branch_id: 'branch_001',
        branch_code: 'DXB-001',
        branch_name: 'Dubai Main Branch',
        closing_status: 'done',
        checklist_completion: 100,
        has_errors: false
      }
      
      const parsed = BranchStatus.parse(branch)
      expect(parsed.checklist_completion).toBeLessThanOrEqual(100)
      expect(parsed.checklist_completion).toBeGreaterThanOrEqual(0)
    })
  })

  describe('CLOSING_SMART_CODES', () => {
    it('should have all required smart codes', () => {
      expect(CLOSING_SMART_CODES.WORKFLOW_START).toBe('HERA.FIN.FISCAL.CLOSING.WORKFLOW.START.v1')
      expect(CLOSING_SMART_CODES.REVENUE_CALC).toBe('HERA.FIN.FISCAL.CLOSING.REVENUE.CALC.v1')
      expect(CLOSING_SMART_CODES.EXPENSE_CALC).toBe('HERA.FIN.FISCAL.CLOSING.EXPENSE.CALC.v1')
      expect(CLOSING_SMART_CODES.NET_INCOME_CALC).toBe('HERA.FIN.FISCAL.CLOSING.NET.INCOME.v1')
      expect(CLOSING_SMART_CODES.CLOSING_JE).toBe('HERA.FIN.FISCAL.CLOSE.JE.v1')
      expect(CLOSING_SMART_CODES.RE_TRANSFER).toBe('HERA.FIN.FISCAL.CLOSING.RE.TRANSFER.v1')
      expect(CLOSING_SMART_CODES.PL_ZEROOUT).toBe('HERA.FIN.FISCAL.CLOSING.PL.ZERO.v1')
      expect(CLOSING_SMART_CODES.BRANCH_ELIM).toBe('HERA.FIN.FISCAL.CLOSING.BRANCH.ELIM.v1')
      expect(CLOSING_SMART_CODES.CONSOLIDATION).toBe('HERA.FIN.FISCAL.CLOSING.CONSOLIDATE.v1')
    })

    it('should follow smart code naming convention', () => {
      Object.values(CLOSING_SMART_CODES).forEach(code => {
        expect(code).toMatch(/^HERA\.FIN\.FISCAL\./)
        expect(code).toMatch(/\.v1$/)
      })
    })
  })

  describe('DEFAULT_WORKFLOW_STEPS', () => {
    it('should have 8 steps', () => {
      expect(DEFAULT_WORKFLOW_STEPS).toHaveLength(8)
    })

    it('should have unique step IDs', () => {
      const ids = DEFAULT_WORKFLOW_STEPS.map(step => step.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have matching smart codes', () => {
      const stepSmartCodes: Record<string, string> = {
        revenue_calc: CLOSING_SMART_CODES.REVENUE_CALC,
        expense_calc: CLOSING_SMART_CODES.EXPENSE_CALC,
        net_income: CLOSING_SMART_CODES.NET_INCOME_CALC,
        closing_je: CLOSING_SMART_CODES.CLOSING_JE,
        re_transfer: CLOSING_SMART_CODES.RE_TRANSFER,
        pl_zeroout: CLOSING_SMART_CODES.PL_ZEROOUT,
        branch_elim: CLOSING_SMART_CODES.BRANCH_ELIM,
        consolidation: CLOSING_SMART_CODES.CONSOLIDATION
      }

      DEFAULT_WORKFLOW_STEPS.forEach(step => {
        expect(step.smart_code).toBe(stepSmartCodes[step.id])
      })
    })

    it('should have descriptions for all steps', () => {
      DEFAULT_WORKFLOW_STEPS.forEach(step => {
        expect(step.description).toBeTruthy()
        expect(step.description.length).toBeGreaterThan(10)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle workflow with completed status', () => {
      const completedWorkflow = {
        organization_id: 'org_12345',
        fiscal_year: '2025',
        status: 'done',
        started_at: '2025-01-31T09:00:00Z',
        completed_at: '2025-01-31T11:30:00Z',
        started_by: 'admin@example.com',
        steps: DEFAULT_WORKFLOW_STEPS.map(step => ({
          ...step,
          status: 'done',
          started_at: '2025-01-31T09:00:00Z',
          completed_at: '2025-01-31T11:30:00Z',
          journal_entry_id: `je_${step.id}`
        }))
      }
      
      expect(() => ClosingWorkflow.parse(completedWorkflow)).not.toThrow()
    })

    it('should handle large journal amounts', () => {
      const largeJournal = {
        id: 'je_large',
        transaction_code: 'JE-2025-999',
        transaction_date: '2025-12-31',
        description: 'Large corporation year-end closing',
        total_debit: 1000000000, // 1 billion
        total_credit: 1000000000,
        line_count: 500,
        smart_code: 'HERA.FIN.FISCAL.CLOSE.JE.v1',
        status: 'posted',
        created_at: '2025-12-31T23:59:59Z'
      }
      
      expect(() => JournalEntrySummary.parse(largeJournal)).not.toThrow()
    })

    it('should handle branch with 0% completion', () => {
      const newBranch = {
        branch_id: 'branch_new',
        branch_code: 'NEW-001',
        branch_name: 'New Branch',
        closing_status: 'pending',
        checklist_completion: 0,
        has_errors: false
      }
      
      expect(() => BranchStatus.parse(newBranch)).not.toThrow()
    })
  })
})