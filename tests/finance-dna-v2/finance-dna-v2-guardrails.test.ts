/**
 * Finance DNA v2 - Comprehensive Guardrails Test Suite
 * Smart Code: HERA.ACCOUNTING.TEST.GUARDRAILS.v2
 * 
 * Complete test coverage for Finance DNA v2 guardrails including
 * Smart Code validation, fiscal periods, COA mapping, AI confidence,
 * and multi-currency GL balance validation.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { HERAGuardrailsV2, CLI_EXIT_CODES_V2 } from '../../src/lib/guardrails/hera-guardrails-v2'
import { FinanceDNAV2CIIntegration } from '../../src/lib/guardrails/finance-dna-v2-ci-config'
import type { GuardrailResult } from '../../src/lib/guardrails/hera-guardrails'

describe('Finance DNA v2 Guardrails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Smart Code Validation v2', () => {
    it('should validate correct v2 Smart Code patterns', () => {
      const validCodes = [
        'HERA.ACCOUNTING.GL.TXN.JOURNAL.v2',
        'HERA.ACCOUNTING.AR.TXN.INVOICE.v2',
        'HERA.ACCOUNTING.AP.TXN.BILL.v2',
        'HERA.ACCOUNTING.HR.TXN.PAYROLL.v2',
        'HERA.ACCOUNTING.SEED.POLICY.POSTING_RULE.v2',
        'HERA.ACCOUNTING.RPC.POSTING.ENGINE.v2'
      ]

      validCodes.forEach(code => {
        const result = HERAGuardrailsV2.validateSmartCodeV2(code)
        expect(result.passed).toBe(true)
        expect(result.violations).toHaveLength(0)
      })
    })

    it('should reject invalid v2 Smart Code patterns', () => {
      const invalidCodes = [
        'HERA.INVALID.CODE.v2',                    // Too few segments
        'HERA.ACCOUNTING.GL.v2',                   // Missing segments
        'INVALID.ACCOUNTING.GL.TXN.JOURNAL.v2',   // Wrong prefix
        'HERA.ACCOUNTING.GL.TXN.JOURNAL.v1',      // Wrong version
        'HERA.ACCOUNTING.GL.TXN.JOURNAL',         // Missing version
        '',                                        // Empty string
        'HERA.accounting.gl.txn.journal.v2'       // Lowercase
      ]

      invalidCodes.forEach(code => {
        const result = HERAGuardrailsV2.validateSmartCodeV2(code)
        expect(result.passed).toBe(false)
        expect(result.violations.length).toBeGreaterThan(0)
        expect(result.violations[0].severity).toBe('ERROR')
      })
    })

    it('should provide helpful error messages for invalid codes', () => {
      const result = HERAGuardrailsV2.validateSmartCodeV2('INVALID.CODE.v2')
      
      expect(result.violations[0]).toMatchObject({
        code: 'SMART-CODE-V2-FORMAT',
        message: expect.stringContaining('does not match v2 pattern'),
        severity: 'ERROR',
        context: expect.objectContaining({
          expected_pattern: 'HERA.ACCOUNTING.{MODULE}.{TYPE}.{SUBTYPE}.v2',
          examples: expect.arrayContaining([
            'HERA.ACCOUNTING.GL.TXN.JOURNAL.v2',
            'HERA.ACCOUNTING.AR.RULE.REVENUE_RECOGNITION.v2'
          ])
        })
      })
    })

    it('should handle backward compatibility with v1 codes', () => {
      const v1Code = 'HERA.SALON.POS.TXN.SALE.V1'
      const result = HERAGuardrailsV2.validateSmartCodeV2(v1Code)
      
      // Should validate using v1 rules
      expect(result.passed).toBe(true)
    })
  })

  describe('Fiscal Period Validation', () => {
    it('should validate open fiscal periods', async () => {
      const result = await HERAGuardrailsV2.validateFiscalPeriod(
        '2024-12-09',
        '123e4567-e89b-12d3-a456-426614174000'
      )

      expect(result.passed).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should reject transactions in closed periods', async () => {
      // Mock closed period
      jest.spyOn(HERAGuardrailsV2 as any, 'getFiscalPeriodStatus')
        .mockResolvedValue({
          period_code: '2024-11',
          period_name: 'November 2024',
          status: 'CLOSED',
          fiscal_year: '2024',
          start_date: '2024-11-01',
          end_date: '2024-11-30'
        })

      const result = await HERAGuardrailsV2.validateFiscalPeriod(
        '2024-11-15',
        '123e4567-e89b-12d3-a456-426614174000'
      )

      expect(result.passed).toBe(false)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0]).toMatchObject({
        code: 'TXN-PERIOD-CLOSED',
        message: expect.stringContaining('Cannot post to closed fiscal period'),
        severity: 'ERROR',
        context: expect.objectContaining({
          period_code: '2024-11',
          period_status: 'CLOSED'
        })
      })
    })

    it('should reject transactions in locked periods', async () => {
      jest.spyOn(HERAGuardrailsV2 as any, 'getFiscalPeriodStatus')
        .mockResolvedValue({
          period_code: '2024-10',
          period_name: 'October 2024',
          status: 'LOCKED',
          fiscal_year: '2024',
          start_date: '2024-10-01',
          end_date: '2024-10-31'
        })

      const result = await HERAGuardrailsV2.validateFiscalPeriod(
        '2024-10-15',
        '123e4567-e89b-12d3-a456-426614174000'
      )

      expect(result.passed).toBe(false)
      expect(result.violations[0].code).toBe('TXN-PERIOD-LOCKED')
    })

    it('should handle fiscal period validation errors gracefully', async () => {
      jest.spyOn(HERAGuardrailsV2 as any, 'getFiscalPeriodStatus')
        .mockRejectedValue(new Error('Database connection failed'))

      const result = await HERAGuardrailsV2.validateFiscalPeriod(
        '2024-12-09',
        '123e4567-e89b-12d3-a456-426614174000'
      )

      expect(result.passed).toBe(false)
      expect(result.violations[0].code).toBe('TXN-PERIOD-VALIDATION-ERROR')
    })
  })

  describe('COA Mapping Validation', () => {
    it('should validate active GL accounts', async () => {
      jest.spyOn(HERAGuardrailsV2 as any, 'validateAccountsExist')
        .mockResolvedValue([
          { account_code: '1100000', is_active: true },
          { account_code: '4100000', is_active: true }
        ])

      const result = await HERAGuardrailsV2.validateCOAMapping(
        ['1100000', '4100000'],
        '123e4567-e89b-12d3-a456-426614174000'
      )

      expect(result.passed).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should reject non-existent GL accounts', async () => {
      jest.spyOn(HERAGuardrailsV2 as any, 'validateAccountsExist')
        .mockResolvedValue([
          { account_code: '1100000', is_active: true }
          // Missing '9999999'
        ])

      const result = await HERAGuardrailsV2.validateCOAMapping(
        ['1100000', '9999999'],
        '123e4567-e89b-12d3-a456-426614174000'
      )

      expect(result.passed).toBe(false)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0]).toMatchObject({
        code: 'COA-MAPPING-NOT-FOUND',
        message: 'GL account 9999999 not found in Chart of Accounts',
        severity: 'ERROR',
        context: { account_code: '9999999' }
      })
    })

    it('should reject inactive GL accounts', async () => {
      jest.spyOn(HERAGuardrailsV2 as any, 'validateAccountsExist')
        .mockResolvedValue([
          { account_code: '1100000', is_active: true },
          { account_code: '4100000', is_active: false }
        ])

      const result = await HERAGuardrailsV2.validateCOAMapping(
        ['1100000', '4100000'],
        '123e4567-e89b-12d3-a456-426614174000'
      )

      expect(result.passed).toBe(false)
      expect(result.violations[0]).toMatchObject({
        code: 'COA-MAPPING-INACTIVE',
        message: 'GL account 4100000 is inactive',
        severity: 'ERROR'
      })
    })
  })

  describe('AI Confidence Validation', () => {
    it('should pass high confidence transactions', () => {
      const result = HERAGuardrailsV2.validateAIConfidence(0.95, 500, 'manager')

      expect(result.passed).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should require approval for medium confidence', () => {
      const result = HERAGuardrailsV2.validateAIConfidence(0.75, 500, 'manager')

      expect(result.passed).toBe(true) // Passes but with warning
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0]).toMatchObject({
        code: 'TXN-AI-VERIFY',
        severity: 'WARNING',
        context: expect.objectContaining({
          ai_confidence: 0.75,
          approval_level: expect.any(String)
        })
      })
    })

    it('should reject low confidence transactions', () => {
      const result = HERAGuardrailsV2.validateAIConfidence(0.2, 500, 'manager')

      expect(result.passed).toBe(false)
      expect(result.violations[0]).toMatchObject({
        code: 'TXN-AI-CONFIDENCE-TOO-LOW',
        severity: 'ERROR',
        context: expect.objectContaining({
          ai_confidence: 0.2,
          recommendation: 'REJECT'
        })
      })
    })

    it('should adjust approval level based on transaction amount', () => {
      const highAmountResult = HERAGuardrailsV2.validateAIConfidence(0.75, 15000, 'manager')
      const lowAmountResult = HERAGuardrailsV2.validateAIConfidence(0.75, 500, 'manager')

      expect(highAmountResult.violations[0].context.approval_level).toBe('OWNER')
      expect(lowAmountResult.violations[0].context.approval_level).toBe('MANAGER')
    })
  })

  describe('Multi-Currency GL Balance Validation', () => {
    it('should validate balanced single-currency transactions', () => {
      const lines = [
        {
          line_type: 'GL',
          debit_amount: 1000,
          credit_amount: 0,
          currency: 'USD'
        },
        {
          line_type: 'GL',
          debit_amount: 0,
          credit_amount: 1000,
          currency: 'USD'
        }
      ]

      const result = HERAGuardrailsV2.validateMultiCurrencyGLBalance(lines)

      expect(result.passed).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should validate balanced multi-currency transactions', () => {
      const lines = [
        { line_type: 'GL', debit_amount: 1000, credit_amount: 0, currency: 'USD' },
        { line_type: 'GL', debit_amount: 0, credit_amount: 1000, currency: 'USD' },
        { line_type: 'GL', debit_amount: 500, credit_amount: 0, currency: 'EUR' },
        { line_type: 'GL', debit_amount: 0, credit_amount: 500, currency: 'EUR' }
      ]

      const result = HERAGuardrailsV2.validateMultiCurrencyGLBalance(lines)

      expect(result.passed).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should reject unbalanced transactions per currency', () => {
      const lines = [
        { line_type: 'GL', debit_amount: 1000, credit_amount: 0, currency: 'USD' },
        { line_type: 'GL', debit_amount: 0, credit_amount: 900, currency: 'USD' } // Unbalanced by 100
      ]

      const result = HERAGuardrailsV2.validateMultiCurrencyGLBalance(lines)

      expect(result.passed).toBe(false)
      expect(result.violations[0]).toMatchObject({
        code: 'MULTI-CURRENCY-BALANCE',
        message: expect.stringContaining('GL entries not balanced for USD: 100.00 difference'),
        severity: 'ERROR',
        context: expect.objectContaining({
          currency: 'USD',
          net_balance: 100,
          total_debits: 1000,
          total_credits: 900
        })
      })
    })

    it('should handle invalid amounts gracefully', () => {
      const lines = [
        { line_type: 'GL', debit_amount: 'invalid', credit_amount: 0, currency: 'USD' }
      ]

      const result = HERAGuardrailsV2.validateMultiCurrencyGLBalance(lines)

      expect(result.passed).toBe(false)
      expect(result.violations[0].code).toBe('GL-AMOUNT-INVALID')
    })

    it('should handle missing currency defaults', () => {
      const lines = [
        { line_type: 'GL', debit_amount: 1000, credit_amount: 0 }, // No currency
        { line_type: 'GL', debit_amount: 0, credit_amount: 1000 }
      ]

      const result = HERAGuardrailsV2.validateMultiCurrencyGLBalance(lines)

      expect(result.passed).toBe(true) // Should default to USD and balance
    })
  })

  describe('Comprehensive Transaction Validation', () => {
    const validTransaction = {
      smart_code: 'HERA.ACCOUNTING.GL.TXN.JOURNAL.v2',
      organization_id: '123e4567-e89b-12d3-a456-426614174000',
      transaction_date: '2024-12-09',
      total_amount: 1000.00,
      ai_confidence: 0.85,
      lines: [
        {
          line_type: 'GL',
          account_code: '1100000',
          debit_amount: 1000.00,
          credit_amount: 0,
          currency: 'USD'
        },
        {
          line_type: 'GL',
          account_code: '4100000',
          debit_amount: 0,
          credit_amount: 1000.00,
          currency: 'USD'
        }
      ]
    }

    beforeEach(() => {
      // Mock all async validation methods to return success
      jest.spyOn(HERAGuardrailsV2 as any, 'getFiscalPeriodStatus')
        .mockResolvedValue({
          period_code: '2024-12',
          status: 'OPEN',
          fiscal_year: '2024'
        })

      jest.spyOn(HERAGuardrailsV2 as any, 'validateAccountsExist')
        .mockResolvedValue([
          { account_code: '1100000', is_active: true },
          { account_code: '4100000', is_active: true }
        ])
    })

    it('should validate complete valid transaction', async () => {
      const result = await HERAGuardrailsV2.validateTransactionV2(validTransaction)

      expect(result.passed).toBe(true)
      expect(result.violations.filter(v => v.severity === 'ERROR')).toHaveLength(0)
    })

    it('should accumulate violations from all validation layers', async () => {
      const invalidTransaction = {
        ...validTransaction,
        smart_code: 'INVALID.CODE.v2',
        ai_confidence: 0.2, // Too low
        lines: [
          { line_type: 'GL', debit_amount: 1000, credit_amount: 0, currency: 'USD' },
          { line_type: 'GL', debit_amount: 0, credit_amount: 900, currency: 'USD' } // Unbalanced
        ]
      }

      const result = await HERAGuardrailsV2.validateTransactionV2(invalidTransaction)

      expect(result.passed).toBe(false)
      expect(result.violations.length).toBeGreaterThan(1) // Multiple violations
      
      const errorCodes = result.violations.map(v => v.code)
      expect(errorCodes).toContain('SMART-CODE-V2-FORMAT')
      expect(errorCodes).toContain('TXN-AI-CONFIDENCE-TOO-LOW')
      expect(errorCodes).toContain('MULTI-CURRENCY-BALANCE')
    })

    it('should validate GL line account codes', async () => {
      const transactionWithBadAccount = {
        ...validTransaction,
        lines: [
          { line_type: 'GL', account_code: '9999999', debit_amount: 1000, credit_amount: 0 },
          { line_type: 'GL', account_code: '4100000', debit_amount: 0, credit_amount: 1000 }
        ]
      }

      jest.spyOn(HERAGuardrailsV2 as any, 'validateAccountsExist')
        .mockResolvedValue([
          { account_code: '4100000', is_active: true }
          // Missing '9999999'
        ])

      const result = await HERAGuardrailsV2.validateTransactionV2(transactionWithBadAccount)

      expect(result.passed).toBe(false)
      expect(result.violations.some(v => v.code === 'COA-MAPPING-NOT-FOUND')).toBe(true)
    })
  })

  describe('CI Integration', () => {
    it('should execute complete CI pipeline successfully', async () => {
      const result = await FinanceDNAV2CIIntegration.executeCI(
        { environment: 'development', strict_mode: false },
        { 
          gl_balance_validation: true,
          fiscal_period_validation: false, // Quick test
          performance_benchmarks: {
            max_processing_time_ms: 10000,
            max_memory_usage_mb: 512,
            min_throughput_per_second: 50
          }
        }
      )

      expect(result.success).toBe(true)
      expect(result.exit_code).toBe(0)
      expect(result.results.gate_results).toBeDefined()
      expect(result.results.smoke_test_results).toBeDefined()
      expect(result.results.performance_summary).toBeDefined()
    })

    it('should fail CI pipeline on validation errors', async () => {
      // Mock a failing gate
      jest.spyOn(FinanceDNAV2CIIntegration as any, 'validateCoreFunctionality')
        .mockResolvedValue({
          passed: false,
          violations: [{ code: 'TEST_ERROR', message: 'Test error', severity: 'ERROR' }]
        })

      const result = await FinanceDNAV2CIIntegration.executeCI(
        { environment: 'development', strict_mode: true }
      )

      expect(result.success).toBe(false)
      expect(result.exit_code).not.toBe(0)
    })

    it('should generate performance recommendations', async () => {
      const result = await FinanceDNAV2CIIntegration.executeCI()

      expect(result.recommendations).toBeDefined()
      expect(Array.isArray(result.recommendations)).toBe(true)
    })
  })

  describe('Exit Codes', () => {
    it('should define all v2 exit codes', () => {
      expect(CLI_EXIT_CODES_V2.FISCAL_PERIOD_CLOSED).toBe(40)
      expect(CLI_EXIT_CODES_V2.FISCAL_PERIOD_LOCKED).toBe(41)
      expect(CLI_EXIT_CODES_V2.AI_CONFIDENCE_TOO_LOW).toBe(42)
      expect(CLI_EXIT_CODES_V2.COA_MAPPING_INVALID).toBe(43)
      expect(CLI_EXIT_CODES_V2.MULTI_CURRENCY_UNBALANCED).toBe(44)
      expect(CLI_EXIT_CODES_V2.SMART_CODE_V2_INVALID).toBe(45)
    })
  })

  describe('Report Generation', () => {
    it('should generate comprehensive v2 guardrail report', () => {
      const mockResults = [
        {
          passed: false,
          violations: [
            { code: 'ERROR1', message: 'Error message', severity: 'ERROR' },
            { code: 'WARN1', message: 'Warning message', severity: 'WARNING' },
            { code: 'INFO1', message: 'Info message', severity: 'INFO' }
          ]
        }
      ]

      const report = HERAGuardrailsV2.generateReportV2(mockResults)

      expect(report).toContain('🛡️ HERA Guardrails v2 Report')
      expect(report).toContain('❌ 1 ERRORS:')
      expect(report).toContain('⚠️  1 WARNINGS:')
      expect(report).toContain('ℹ️  1 INFORMATION:')
      expect(report).toContain('Status: ❌ FAILED')
      expect(report).toContain('Finance DNA v2: ⚠️ REVIEW REQUIRED')
    })

    it('should generate success report for clean validation', () => {
      const mockResults = [
        { passed: true, violations: [] }
      ]

      const report = HERAGuardrailsV2.generateReportV2(mockResults)

      expect(report).toContain('✅ All guardrails passed!')
      expect(report).toContain('🧬 Finance DNA v2 compliance: PERFECT')
      expect(report).toContain('Status: ✅ PASSED')
      expect(report).toContain('Finance DNA v2: 🧬 COMPLIANT')
    })
  })
})

// Performance and load testing
describe('Finance DNA v2 Performance Tests', () => {
  it('should handle high-volume validation requests', async () => {
    const transactions = Array.from({ length: 100 }, (_, i) => ({
      smart_code: 'HERA.ACCOUNTING.GL.TXN.JOURNAL.v2',
      organization_id: '123e4567-e89b-12d3-a456-426614174000',
      transaction_date: '2024-12-09',
      total_amount: 1000.00 + i,
      ai_confidence: 0.85,
      lines: [
        { line_type: 'GL', debit_amount: 1000 + i, credit_amount: 0, currency: 'USD' },
        { line_type: 'GL', debit_amount: 0, credit_amount: 1000 + i, currency: 'USD' }
      ]
    }))

    const startTime = performance.now()
    
    const results = await Promise.all(
      transactions.map(txn => HERAGuardrailsV2.validateTransactionV2(txn))
    )

    const endTime = performance.now()
    const avgTimePerTransaction = (endTime - startTime) / transactions.length

    expect(results).toHaveLength(100)
    expect(results.every(r => r.passed)).toBe(true)
    expect(avgTimePerTransaction).toBeLessThan(50) // < 50ms per transaction
  })

  it('should maintain memory efficiency during bulk validation', () => {
    const initialMemory = process.memoryUsage().heapUsed
    
    // Process large dataset
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      line_type: 'GL',
      debit_amount: i % 2 === 0 ? 100 : 0,
      credit_amount: i % 2 === 1 ? 100 : 0,
      currency: i % 3 === 0 ? 'USD' : i % 3 === 1 ? 'EUR' : 'GBP'
    }))

    const result = HERAGuardrailsV2.validateMultiCurrencyGLBalance(largeDataset)

    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024 // MB

    expect(memoryIncrease).toBeLessThan(50) // < 50MB increase
    expect(result).toBeDefined()
  })
})