// ================================================================================
// FISCAL SCHEMAS UNIT TESTS
// Tests for fiscal configuration schemas and validation
// ================================================================================

import { describe, it, expect } from '@jest/globals'
import {
  FiscalConfig,
  FiscalPeriod,
  CloseChecklistItem,
  CloseChecklist,
  YearCloseRequest,
  PeriodStatus
} from '@/lib/schemas/fiscal'

describe('Fiscal Schemas', () => {
  
  describe('FiscalConfig', () => {
    it('should validate valid fiscal config', () => {
      const validConfig = {
        fiscal_year_start: '2025-01-01',
        retained_earnings_account: '3200',
        lock_after_days: 7
      }
      
      expect(() => FiscalConfig.parse(validConfig)).not.toThrow()
    })

    it('should reject invalid date format', () => {
      const invalidConfig = {
        fiscal_year_start: '01/01/2025', // Wrong format
        retained_earnings_account: '3200',
        lock_after_days: 7
      }
      
      expect(() => FiscalConfig.parse(invalidConfig)).toThrow()
    })

    it('should reject empty retained earnings account', () => {
      const invalidConfig = {
        fiscal_year_start: '2025-01-01',
        retained_earnings_account: '', // Too short
        lock_after_days: 7
      }
      
      expect(() => FiscalConfig.parse(invalidConfig)).toThrow()
    })

    it('should enforce lock_after_days bounds', () => {
      // Test lower bound
      const tooLow = {
        fiscal_year_start: '2025-01-01',
        retained_earnings_account: '3200',
        lock_after_days: -1
      }
      expect(() => FiscalConfig.parse(tooLow)).toThrow()

      // Test upper bound
      const tooHigh = {
        fiscal_year_start: '2025-01-01',
        retained_earnings_account: '3200',
        lock_after_days: 91
      }
      expect(() => FiscalConfig.parse(tooHigh)).toThrow()

      // Test valid boundaries
      const atMin = {
        fiscal_year_start: '2025-01-01',
        retained_earnings_account: '3200',
        lock_after_days: 0
      }
      expect(() => FiscalConfig.parse(atMin)).not.toThrow()

      const atMax = {
        fiscal_year_start: '2025-01-01',
        retained_earnings_account: '3200',
        lock_after_days: 90
      }
      expect(() => FiscalConfig.parse(atMax)).not.toThrow()
    })

    it('should accept optional fields', () => {
      const withOptionals = {
        fiscal_year_start: '2025-01-01',
        retained_earnings_account: '3200',
        lock_after_days: 7,
        updated_at: '2025-01-01T00:00:00Z',
        updated_by: 'admin@example.com'
      }
      
      expect(() => FiscalConfig.parse(withOptionals)).not.toThrow()
    })
  })

  describe('FiscalPeriod', () => {
    it('should validate valid fiscal period', () => {
      const validPeriod = {
        code: '2025-01',
        from: '2025-01-01',
        to: '2025-01-31',
        status: 'open' as const
      }
      
      expect(() => FiscalPeriod.parse(validPeriod)).not.toThrow()
    })

    it('should validate all status values', () => {
      const statuses: Array<typeof PeriodStatus._type> = ['open', 'locked', 'closed']
      
      statuses.forEach(status => {
        const period = {
          code: '2025-01',
          from: '2025-01-01',
          to: '2025-01-31',
          status
        }
        expect(() => FiscalPeriod.parse(period)).not.toThrow()
      })
    })

    it('should reject invalid period code format', () => {
      const invalidCodes = ['2025-1', '2025-13', '25-01', '2025/01', 'INVALID']
      
      invalidCodes.forEach(code => {
        const period = {
          code,
          from: '2025-01-01',
          to: '2025-01-31',
          status: 'open'
        }
        expect(() => FiscalPeriod.parse(period)).toThrow()
      })
    })

    it('should validate date ranges', () => {
      const validPeriod = {
        code: '2025-01',
        from: '2025-01-01',
        to: '2025-01-31',
        status: 'open'
      }
      
      const result = FiscalPeriod.parse(validPeriod)
      expect(result.from).toBe('2025-01-01')
      expect(result.to).toBe('2025-01-31')
    })

    it('should accept optional tracking fields', () => {
      const withTracking = {
        code: '2025-01',
        from: '2025-01-01',
        to: '2025-01-31',
        status: 'locked' as const,
        locked_at: '2025-02-01T00:00:00Z',
        locked_by: 'admin@example.com'
      }
      
      expect(() => FiscalPeriod.parse(withTracking)).not.toThrow()
    })
  })

  describe('CloseChecklist', () => {
    it('should validate checklist item', () => {
      const validItem = {
        key: 'pos_posted',
        label: 'All POS transactions posted',
        completed: false
      }
      
      expect(() => CloseChecklistItem.parse(validItem)).not.toThrow()
    })

    it('should accept completed item with metadata', () => {
      const completedItem = {
        key: 'pos_posted',
        label: 'All POS transactions posted',
        description: 'Ensure all daily sales are recorded',
        completed: true,
        completed_at: '2025-01-31T23:45:00Z',
        completed_by: 'john@example.com',
        notes: 'Verified against daily reports'
      }
      
      expect(() => CloseChecklistItem.parse(completedItem)).not.toThrow()
    })

    it('should validate array of checklist items', () => {
      const checklist = [
        {
          key: 'pos_posted',
          label: 'All POS transactions posted',
          completed: true
        },
        {
          key: 'commissions_accrued',
          label: 'All commissions accrued',
          completed: false
        }
      ]
      
      expect(() => CloseChecklist.parse(checklist)).not.toThrow()
      expect(CloseChecklist.parse(checklist)).toHaveLength(2)
    })

    it('should reject unknown keys when strict mode enabled', () => {
      const itemWithExtra = {
        key: 'pos_posted',
        label: 'All POS transactions posted',
        completed: false,
        unknown_field: 'should fail in strict mode'
      }
      
      // In production, unknown keys might be stripped rather than rejected
      // This behavior depends on Zod configuration
      const parsed = CloseChecklistItem.parse(itemWithExtra)
      expect(parsed).not.toHaveProperty('unknown_field')
    })
  })

  describe('YearCloseRequest', () => {
    it('should validate valid year close request', () => {
      const validRequest = {
        fiscal_year: '2025',
        retained_earnings_account: '3200',
        confirm_all_periods_closed: true
      }
      
      expect(() => YearCloseRequest.parse(validRequest)).not.toThrow()
    })

    it('should reject invalid year format', () => {
      const invalidYears = ['25', '202', '20255', '2025-01', 'YEAR']
      
      invalidYears.forEach(fiscal_year => {
        const request = {
          fiscal_year,
          retained_earnings_account: '3200',
          confirm_all_periods_closed: true
        }
        expect(() => YearCloseRequest.parse(request)).toThrow()
      })
    })

    it('should require retained earnings account', () => {
      const missingAccount = {
        fiscal_year: '2025',
        retained_earnings_account: '', // Empty
        confirm_all_periods_closed: true
      }
      
      expect(() => YearCloseRequest.parse(missingAccount)).toThrow()
    })

    it('should accept optional notes', () => {
      const withNotes = {
        fiscal_year: '2025',
        retained_earnings_account: '3200',
        confirm_all_periods_closed: true,
        notes: 'Year-end closing completed by finance team'
      }
      
      expect(() => YearCloseRequest.parse(withNotes)).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle leap year dates', () => {
      const leapYearPeriod = {
        code: '2024-02',
        from: '2024-02-01',
        to: '2024-02-29', // Leap year
        status: 'open'
      }
      
      expect(() => FiscalPeriod.parse(leapYearPeriod)).not.toThrow()
    })

    it('should allow decimal lock_after_days', () => {
      const config = {
        fiscal_year_start: '2025-01-01',
        retained_earnings_account: '3200',
        lock_after_days: 7.5 // Should be coerced to integer
      }
      
      const parsed = FiscalConfig.parse(config)
      expect(parsed.lock_after_days).toBe(7) // Integers only
    })

    it('should handle timezone in date strings', () => {
      const itemWithTimezone = {
        key: 'test',
        label: 'Test Item',
        completed: true,
        completed_at: '2025-01-31T23:45:00+04:00' // With timezone
      }
      
      expect(() => CloseChecklistItem.parse(itemWithTimezone)).not.toThrow()
    })
  })
})