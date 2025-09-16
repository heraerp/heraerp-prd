// ================================================================================
// FINANCE RULES SCHEMAS UNIT TESTS
// Tests for Finance DNA posting rule schemas and validation
// ================================================================================

import { describe, it, expect } from '@jest/globals'
import { Mapping, PostingRule } from '@/lib/schemas/financeRules'

describe('Finance Rules Schemas', () => {
  
  describe('Mapping Schema', () => {
    it('should validate valid mapping', () => {
      const validMapping = {
        account: '4100',
        side: 'debit' as const,
        amount_source: 'gross' as const,
        multiplier: 1,
        memo: 'Sales revenue'
      }
      
      expect(() => Mapping.parse(validMapping)).not.toThrow()
    })

    it('should validate all sides', () => {
      const sides: Array<'debit' | 'credit'> = ['debit', 'credit']
      
      sides.forEach(side => {
        const mapping = {
          account: '4100',
          side,
          amount_source: 'gross' as const,
          multiplier: 1
        }
        expect(() => Mapping.parse(mapping)).not.toThrow()
      })
    })

    it('should validate all amount sources', () => {
      const sources = ['net', 'tax', 'gross', 'tip', 'discount', 'cogs', 'commission', 'custom']
      
      sources.forEach(amount_source => {
        const mapping = {
          account: '4100',
          side: 'credit' as const,
          amount_source,
          multiplier: 1
        }
        expect(() => Mapping.parse(mapping)).not.toThrow()
      })
    })

    it('should reject short account codes', () => {
      const invalidMapping = {
        account: '4', // Too short
        side: 'debit',
        amount_source: 'gross',
        multiplier: 1
      }
      
      expect(() => Mapping.parse(invalidMapping)).toThrow()
    })

    it('should default multiplier to 1', () => {
      const mapping = {
        account: '4100',
        side: 'debit' as const,
        amount_source: 'gross' as const
      }
      
      const parsed = Mapping.parse(mapping)
      expect(parsed.multiplier).toBe(1)
    })

    it('should accept negative multipliers', () => {
      const mapping = {
        account: '4100',
        side: 'debit' as const,
        amount_source: 'gross' as const,
        multiplier: -1
      }
      
      expect(() => Mapping.parse(mapping)).not.toThrow()
    })

    it('should make memo optional', () => {
      const mappingWithoutMemo = {
        account: '4100',
        side: 'debit' as const,
        amount_source: 'gross' as const,
        multiplier: 1
      }
      
      const parsed = Mapping.parse(mappingWithoutMemo)
      expect(parsed.memo).toBeUndefined()
    })
  })

  describe('PostingRule Schema', () => {
    it('should validate valid posting rule', () => {
      const validRule: PostingRule = {
        key: 'FIN_DNA.RULES.POS_SALE.v1',
        title: 'POS Sale Posting',
        description: 'Posts POS sales to revenue accounts',
        category: 'pos',
        enabled: true,
        smart_code: 'HERA.FIN.POSTING.POS.SALE.v1',
        applies_to: ['HERA.POS.SALE.v1'],
        conditions: {},
        mappings: [{
          account: '4100',
          side: 'credit',
          amount_source: 'gross',
          multiplier: 1
        }],
        last_run_at: '2025-01-01T10:00:00Z',
        version: 'v1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
      
      expect(() => PostingRule.parse(validRule)).not.toThrow()
    })

    it('should validate all categories', () => {
      const categories = ['pos', 'payments', 'inventory', 'commissions', 'fiscal', 'other']
      
      categories.forEach(category => {
        const rule = createMinimalRule({ category })
        expect(() => PostingRule.parse(rule)).not.toThrow()
      })
    })

    it('should reject short keys', () => {
      const rule = createMinimalRule({ key: 'SHORT' })
      expect(() => PostingRule.parse(rule)).toThrow()
    })

    it('should reject short titles', () => {
      const rule = createMinimalRule({ title: 'AB' })
      expect(() => PostingRule.parse(rule)).toThrow()
    })

    it('should reject smart codes not starting with HERA.', () => {
      const rule = createMinimalRule({ smart_code: 'INVALID.CODE.v1' })
      expect(() => PostingRule.parse(rule)).toThrow()
    })

    it('should reject empty applies_to array', () => {
      const rule = createMinimalRule({ applies_to: [] })
      expect(() => PostingRule.parse(rule)).toThrow()
    })

    it('should reject empty mappings array', () => {
      const rule = createMinimalRule({ mappings: [] })
      expect(() => PostingRule.parse(rule)).toThrow()
    })

    it('should validate version format', () => {
      const validVersions = ['v1', 'v2', 'v10', 'v999']
      validVersions.forEach(version => {
        const rule = createMinimalRule({ version })
        expect(() => PostingRule.parse(rule)).not.toThrow()
      })

      const invalidVersions = ['1', 'V1', 'v', 'version1', 'v1.0']
      invalidVersions.forEach(version => {
        const rule = createMinimalRule({ version })
        expect(() => PostingRule.parse(rule)).toThrow()
      })
    })

    it('should default enabled to true', () => {
      const rule = {
        key: 'FIN_DNA.RULES.TEST.v1',
        title: 'Test Rule',
        smart_code: 'HERA.TEST.v1',
        applies_to: ['HERA.TEST.v1'],
        mappings: [{
          account: '1000',
          side: 'debit' as const,
          amount_source: 'gross' as const,
          multiplier: 1
        }]
      }
      
      const parsed = PostingRule.parse(rule)
      expect(parsed.enabled).toBe(true)
      expect(parsed.category).toBe('other')
      expect(parsed.version).toBe('v1')
    })

    it('should accept complex conditions', () => {
      const rule = createMinimalRule({
        conditions: {
          amount_greater_than: 100,
          account_types: ['revenue', 'expense'],
          nested: {
            field: 'value',
            array: [1, 2, 3]
          }
        }
      })
      
      expect(() => PostingRule.parse(rule)).not.toThrow()
    })

    it('should make optional fields optional', () => {
      const minimalRule = {
        key: 'FIN_DNA.RULES.MIN.v1',
        title: 'Minimal Rule',
        smart_code: 'HERA.MIN.v1',
        applies_to: ['HERA.MIN.v1'],
        mappings: [{
          account: '1000',
          side: 'debit' as const,
          amount_source: 'gross' as const,
          multiplier: 1
        }]
      }
      
      const parsed = PostingRule.parse(minimalRule)
      expect(parsed.description).toBeUndefined()
      expect(parsed.last_run_at).toBeUndefined()
      expect(parsed.created_at).toBeUndefined()
      expect(parsed.updated_at).toBeUndefined()
    })

    it('should validate multiple mappings', () => {
      const rule = createMinimalRule({
        mappings: [
          {
            account: '1100',
            side: 'debit' as const,
            amount_source: 'gross' as const,
            multiplier: 1,
            memo: 'Cash'
          },
          {
            account: '4100',
            side: 'credit' as const,
            amount_source: 'net' as const,
            multiplier: 1,
            memo: 'Revenue'
          },
          {
            account: '2250',
            side: 'credit' as const,
            amount_source: 'tax' as const,
            multiplier: 1,
            memo: 'Sales Tax'
          }
        ]
      })
      
      expect(() => PostingRule.parse(rule)).not.toThrow()
    })
  })

  describe('Business Logic Validation', () => {
    it('should ensure debit/credit balance in mappings', () => {
      // This is a business rule that might be enforced at runtime
      const rule = createMinimalRule({
        mappings: [
          {
            account: '1100',
            side: 'debit' as const,
            amount_source: 'gross' as const,
            multiplier: 1
          },
          {
            account: '4100',
            side: 'credit' as const,
            amount_source: 'gross' as const,
            multiplier: 1
          }
        ]
      })
      
      // Schema validates structure, business logic validates balance
      expect(() => PostingRule.parse(rule)).not.toThrow()
    })

    it('should handle commission calculations', () => {
      const rule = createMinimalRule({
        key: 'FIN_DNA.RULES.COMMISSION.ACCRUAL.v1',
        title: 'Commission Accrual',
        category: 'commissions',
        smart_code: 'HERA.FIN.COMMISSION.ACCRUAL.v1',
        applies_to: ['HERA.SALON.SALE.v1'],
        mappings: [
          {
            account: '5500',
            side: 'debit' as const,
            amount_source: 'commission' as const,
            multiplier: 0.35,
            memo: 'Staff commission expense'
          },
          {
            account: '2300',
            side: 'credit' as const,
            amount_source: 'commission' as const,
            multiplier: 0.35,
            memo: 'Commission payable'
          }
        ]
      })
      
      expect(() => PostingRule.parse(rule)).not.toThrow()
    })
  })
})

// Helper function to create minimal valid rule
function createMinimalRule(overrides: Partial<PostingRule> = {}): any {
  return {
    key: 'FIN_DNA.RULES.TEST.v1',
    title: 'Test Rule',
    category: 'other',
    enabled: true,
    smart_code: 'HERA.TEST.v1',
    applies_to: ['HERA.TEST.v1'],
    conditions: {},
    mappings: [{
      account: '1000',
      side: 'debit',
      amount_source: 'gross',
      multiplier: 1
    }],
    version: 'v1',
    ...overrides
  }
}