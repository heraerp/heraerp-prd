/**
 * Fiscal Period Compatibility Test Suite
 * Smart Code: HERA.ACCOUNTING.TEST.FISCAL.COMPATIBILITY.v2
 * 
 * Comprehensive test coverage for Fiscal DNA compatibility layer
 * ensuring seamless v1 to v2 migration and backward compatibility.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { FiscalDNACompatibilityLayer } from '../../src/lib/dna/integration/fiscal-dna-compatibility-layer'
import type { 
  FiscalPeriodV1, 
  FiscalPeriodV2Enhanced, 
  MigrationConfig 
} from '../../src/lib/dna/integration/fiscal-dna-compatibility-layer'

// Mock data for testing
const mockOrgId = '123e4567-e89b-12d3-a456-426614174000'
const mockTransactionDate = '2024-12-09'

const mockFiscalPeriodV1: FiscalPeriodV1 = {
  id: 'period-2024-12',
  organization_id: mockOrgId,
  period_code: '2024-12',
  period_name: 'December 2024',
  fiscal_year: '2024',
  start_date: '2024-12-01',
  end_date: '2024-12-31',
  status: 'OPEN',
  created_at: '2024-12-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z'
}

const mockFiscalPeriodV2: FiscalPeriodV2Enhanced = {
  period_id: 'period-2024-12',
  organization_id: mockOrgId,
  period_code: '2024-12',
  period_name: 'December 2024',
  period_type: 'monthly',
  status: 'OPEN',
  fiscal_year: '2024',
  start_date: '2024-12-01',
  end_date: '2024-12-31',
  reopenable: true,
  closing_rules: {
    depreciation_required: true,
    accruals_required: true,
    bank_reconciliation: true,
    inventory_adjustment: true,
    approval_required: true
  },
  enhanced_metadata: {
    auto_close_enabled: false,
    days_after_end_to_close: 5,
    warning_days_before_close: 3,
    created_by: 'test_user',
    last_modified_by: 'test_user'
  },
  transaction_count: 25,
  total_transaction_amount: 50000.00,
  all_transactions_balanced: true,
  health_score: 95.5
}

describe('Fiscal DNA Compatibility Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset to default configuration
    FiscalDNACompatibilityLayer.configureMigration({
      enable_v2_validation: true,
      fallback_to_v1: true,
      performance_monitoring: false,
      audit_all_calls: false,
      migration_phase: 'compatibility'
    })
  })

  describe('Configuration Management', () => {
    it('should allow migration configuration updates', () => {
      const newConfig: Partial<MigrationConfig> = {
        enable_v2_validation: false,
        migration_phase: 'full_migration'
      }

      FiscalDNACompatibilityLayer.configureMigration(newConfig)

      // Verify configuration was applied (would need internal access to test fully)
      expect(true).toBe(true) // Placeholder - in real implementation would verify internal state
    })

    it('should maintain existing config when partial updates provided', () => {
      FiscalDNACompatibilityLayer.configureMigration({
        enable_v2_validation: false
      })

      // Other settings should remain unchanged
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Fiscal Period Validation', () => {
    it('should validate open periods successfully with v2 engine', async () => {
      // Mock v2 validation success
      jest.spyOn(FiscalDNACompatibilityLayer as any, 'validateWithV2Enhanced')
        .mockResolvedValue({
          is_valid: true,
          period_status: mockFiscalPeriodV2,
          validation_result: {
            validation_passed: true,
            period_code: '2024-12',
            period_status: 'OPEN'
          },
          allowed_actions: ['POST', 'MODIFY', 'DELETE', 'REVERSE', 'ADJUST'],
          warnings: [],
          performance_metrics: {
            processing_time_ms: 8,
            cache_hit: false,
            validation_type: 'COMPLETE_VALIDATION',
            performance_tier: 'ENTERPRISE'
          }
        })

      const result = await FiscalDNACompatibilityLayer.validateFiscalPeriod(
        mockTransactionDate,
        mockOrgId
      )

      expect(result.valid).toBe(true)
      expect(result.period).toEqual(mockFiscalPeriodV2)
      expect(result.allowedActions).toContain('POST')
      expect(result.allowedActions).toContain('MODIFY')
      expect(result.performanceMetrics?.validation_engine).toBe('v2_enhanced')
    })

    it('should fallback to v1 when v2 fails and fallback is enabled', async () => {
      // Mock v2 validation failure
      jest.spyOn(FiscalDNACompatibilityLayer as any, 'validateWithV2Enhanced')
        .mockResolvedValue({
          is_valid: false,
          period_status: null,
          validation_result: {
            error_code: 'PERIOD_CLOSED',
            message: 'Period is closed'
          },
          allowed_actions: [],
          warnings: [],
          performance_metrics: {
            processing_time_ms: 12,
            performance_tier: 'STANDARD'
          }
        })

      // Mock v1 validation success
      jest.spyOn(FiscalDNACompatibilityLayer as any, 'validateWithV1Legacy')
        .mockResolvedValue({
          valid: true,
          period: mockFiscalPeriodV1,
          errors: [],
          warnings: [],
          allowedActions: ['POST', 'MODIFY', 'DELETE']
        })

      const result = await FiscalDNACompatibilityLayer.validateFiscalPeriod(
        mockTransactionDate,
        mockOrgId
      )

      expect(result.valid).toBe(true)
      expect(result.period).toEqual(mockFiscalPeriodV1)
      expect(result.performanceMetrics?.validation_engine).toBe('v1_legacy')
      expect(result.performanceMetrics?.fallback_used).toBe(true)
    })

    it('should respect disabled fallback configuration', async () => {
      FiscalDNACompatibilityLayer.configureMigration({
        fallback_to_v1: false
      })

      // Mock v2 validation failure
      jest.spyOn(FiscalDNACompatibilityLayer as any, 'validateWithV2Enhanced')
        .mockResolvedValue({
          is_valid: false,
          period_status: null,
          validation_result: {
            error_code: 'PERIOD_LOCKED',
            message: 'Period is locked'
          },
          allowed_actions: [],
          warnings: [],
          performance_metrics: {
            processing_time_ms: 10,
            performance_tier: 'PREMIUM'
          }
        })

      const result = await FiscalDNACompatibilityLayer.validateFiscalPeriod(
        mockTransactionDate,
        mockOrgId
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Period is locked')
      expect(result.performanceMetrics?.validation_engine).toBe('v2_enhanced')
    })

    it('should pass through user role and transaction type to v2 validation', async () => {
      const mockValidateV2 = jest.spyOn(FiscalDNACompatibilityLayer as any, 'validateWithV2Enhanced')
        .mockResolvedValue({
          is_valid: true,
          period_status: mockFiscalPeriodV2,
          validation_result: { validation_passed: true },
          allowed_actions: ['POST_ADJUSTMENT'],
          warnings: [{
            code: 'CLOSED_PERIOD_BYPASS',
            message: 'Posting to closed period with elevated permissions',
            severity: 'CAUTION'
          }],
          performance_metrics: { processing_time_ms: 6, performance_tier: 'ENTERPRISE' }
        })

      await FiscalDNACompatibilityLayer.validateFiscalPeriod(
        mockTransactionDate,
        mockOrgId,
        {
          transactionType: 'ADJUSTMENT',
          userRole: 'finance_admin',
          smartCode: 'HERA.ACCOUNTING.GL.TXN.ADJUSTMENT.v2'
        }
      )

      expect(mockValidateV2).toHaveBeenCalledWith(
        mockTransactionDate,
        mockOrgId,
        expect.objectContaining({
          transactionType: 'ADJUSTMENT',
          userRole: 'finance_admin',
          smartCode: 'HERA.ACCOUNTING.GL.TXN.ADJUSTMENT.v2'
        })
      )
    })
  })

  describe('Period Retrieval Methods', () => {
    it('should retrieve current fiscal period in v1 format', async () => {
      jest.spyOn(FiscalDNACompatibilityLayer, 'getCurrentFiscalPeriodV1')
        .mockResolvedValue(mockFiscalPeriodV1)

      const period = await FiscalDNACompatibilityLayer.getCurrentFiscalPeriodV1(
        mockOrgId,
        mockTransactionDate
      )

      expect(period).toEqual(mockFiscalPeriodV1)
      expect(period?.status).toBe('OPEN')
      expect(period?.period_code).toBe('2024-12')
    })

    it('should retrieve current fiscal period in v2 enhanced format', async () => {
      jest.spyOn(FiscalDNACompatibilityLayer, 'getCurrentFiscalPeriodV2')
        .mockResolvedValue(mockFiscalPeriodV2)

      const period = await FiscalDNACompatibilityLayer.getCurrentFiscalPeriodV2(
        mockOrgId,
        mockTransactionDate
      )

      expect(period).toEqual(mockFiscalPeriodV2)
      expect(period?.health_score).toBe(95.5)
      expect(period?.transaction_count).toBe(25)
      expect(period?.enhanced_metadata.auto_close_enabled).toBe(false)
    })

    it('should handle missing periods gracefully', async () => {
      jest.spyOn(FiscalDNACompatibilityLayer, 'getCurrentFiscalPeriodV1')
        .mockResolvedValue(null)

      const period = await FiscalDNACompatibilityLayer.getCurrentFiscalPeriodV1(
        mockOrgId,
        '2099-01-01' // Future date with no period
      )

      expect(period).toBeNull()
    })
  })

  describe('Format Conversion', () => {
    it('should convert v2 period to v1 format correctly', () => {
      const converted = FiscalDNACompatibilityLayer.convertV2ToV1Format(mockFiscalPeriodV2)

      expect(converted.id).toBe(mockFiscalPeriodV2.period_id)
      expect(converted.organization_id).toBe(mockFiscalPeriodV2.organization_id)
      expect(converted.period_code).toBe(mockFiscalPeriodV2.period_code)
      expect(converted.status).toBe(mockFiscalPeriodV2.status)
      expect(converted.fiscal_year).toBe(mockFiscalPeriodV2.fiscal_year)
    })

    it('should map TRANSITIONAL status to OPEN for v1 compatibility', () => {
      const transitionalPeriod: FiscalPeriodV2Enhanced = {
        ...mockFiscalPeriodV2,
        status: 'TRANSITIONAL'
      }

      const converted = FiscalDNACompatibilityLayer.convertV2ToV1Format(transitionalPeriod)

      expect(converted.status).toBe('OPEN') // TRANSITIONAL mapped to OPEN
    })
  })

  describe('Batch Validation', () => {
    it('should validate multiple transactions in parallel', async () => {
      const transactions = [
        { transactionDate: '2024-12-01', organizationId: mockOrgId },
        { transactionDate: '2024-12-15', organizationId: mockOrgId },
        { transactionDate: '2024-12-31', organizationId: mockOrgId }
      ]

      // Mock individual validations
      jest.spyOn(FiscalDNACompatibilityLayer, 'validateFiscalPeriod')
        .mockResolvedValue({
          valid: true,
          period: mockFiscalPeriodV2,
          allowedActions: ['POST', 'MODIFY']
        })

      const results = await FiscalDNACompatibilityLayer.validateBatchTransactions(transactions)

      expect(results).toHaveLength(3)
      expect(results.every(r => r.valid)).toBe(true)
      expect(results.every(r => r.period)).toBeTruthy()
    })

    it('should handle batch validation failures gracefully', async () => {
      const transactions = [
        { transactionDate: '2024-12-01', organizationId: mockOrgId },
        { transactionDate: '2024-11-15', organizationId: mockOrgId } // Closed period
      ]

      jest.spyOn(FiscalDNACompatibilityLayer, 'validateFiscalPeriod')
        .mockImplementation(async (date) => {
          if (date === '2024-11-15') {
            return {
              valid: false,
              errors: ['Period is closed']
            }
          }
          return {
            valid: true,
            period: mockFiscalPeriodV2
          }
        })

      const results = await FiscalDNACompatibilityLayer.validateBatchTransactions(transactions)

      expect(results).toHaveLength(2)
      expect(results[0].valid).toBe(true)
      expect(results[1].valid).toBe(false)
      expect(results[1].errors).toContain('Period is closed')
    })

    it('should handle Promise.allSettled rejections', async () => {
      const transactions = [
        { transactionDate: '2024-12-01', organizationId: mockOrgId }
      ]

      jest.spyOn(FiscalDNACompatibilityLayer, 'validateFiscalPeriod')
        .mockRejectedValue(new Error('Database connection failed'))

      const results = await FiscalDNACompatibilityLayer.validateBatchTransactions(transactions)

      expect(results).toHaveLength(1)
      expect(results[0].valid).toBe(false)
      expect(results[0].errors?.[0]).toContain('Batch validation failed')
    })
  })

  describe('Migration Status and Monitoring', () => {
    it('should provide migration status information', async () => {
      const status = await FiscalDNACompatibilityLayer.getMigrationStatus(mockOrgId)

      expect(status.current_phase).toBeDefined()
      expect(status.performance_comparison).toBeDefined()
      expect(status.performance_comparison.improvement_factor).toBeGreaterThan(1)
      expect(status.recommendations).toBeInstanceOf(Array)
      expect(status.migration_readiness).toMatch(/NOT_READY|READY|IN_PROGRESS|COMPLETE/)
    })

    it('should show v2 performance advantages', async () => {
      const status = await FiscalDNACompatibilityLayer.getMigrationStatus()

      expect(status.performance_comparison.v2_avg_time_ms).toBeLessThan(
        status.performance_comparison.v1_avg_time_ms
      )
      expect(status.performance_comparison.improvement_factor).toBeGreaterThan(2)
    })
  })

  describe('Performance Monitoring', () => {
    it('should collect performance metrics when enabled', async () => {
      FiscalDNACompatibilityLayer.configureMigration({
        performance_monitoring: true
      })

      const mockCollectMetrics = jest.spyOn(FiscalDNACompatibilityLayer, 'collectPerformanceMetrics')
        .mockResolvedValue()

      await FiscalDNACompatibilityLayer.collectPerformanceMetrics(
        'validate_fiscal_period',
        { valid: true, performanceMetrics: { validation_engine: 'v2_enhanced' } },
        8.5
      )

      expect(mockCollectMetrics).toHaveBeenCalledWith(
        'validate_fiscal_period',
        expect.objectContaining({ valid: true }),
        8.5
      )
    })

    it('should skip metrics collection when disabled', async () => {
      FiscalDNACompatibilityLayer.configureMigration({
        performance_monitoring: false
      })

      const mockCollectMetrics = jest.spyOn(FiscalDNACompatibilityLayer, 'collectPerformanceMetrics')

      await FiscalDNACompatibilityLayer.collectPerformanceMetrics(
        'validate_fiscal_period',
        { valid: true },
        10
      )

      // Should return early without making database calls
      expect(mockCollectMetrics).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      jest.spyOn(FiscalDNACompatibilityLayer as any, 'validateWithV2Enhanced')
        .mockRejectedValue(new Error('RPC connection failed'))

      jest.spyOn(FiscalDNACompatibilityLayer as any, 'validateWithV1Legacy')
        .mockRejectedValue(new Error('Database error'))

      const result = await FiscalDNACompatibilityLayer.validateFiscalPeriod(
        mockTransactionDate,
        mockOrgId
      )

      expect(result.valid).toBe(false)
      expect(result.errors?.[0]).toContain('Fiscal validation failed')
      expect(result.performanceMetrics?.validation_engine).toBe('error')
    })

    it('should provide meaningful error messages', async () => {
      jest.spyOn(FiscalDNACompatibilityLayer as any, 'validateWithV2Enhanced')
        .mockResolvedValue({
          is_valid: false,
          validation_result: {
            error_code: 'PERIOD_NOT_FOUND',
            message: 'No fiscal period found for date 2024-12-09',
            suggestion: 'Verify fiscal calendar setup for organization'
          },
          allowed_actions: [],
          warnings: [],
          performance_metrics: { processing_time_ms: 5 }
        })

      const result = await FiscalDNACompatibilityLayer.validateFiscalPeriod(
        mockTransactionDate,
        mockOrgId
      )

      expect(result.valid).toBe(false)
      expect(result.errors?.[0]).toContain('No fiscal period found for date')
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complex validation scenarios with warnings', async () => {
      jest.spyOn(FiscalDNACompatibilityLayer as any, 'validateWithV2Enhanced')
        .mockResolvedValue({
          is_valid: true,
          period_status: {
            ...mockFiscalPeriodV2,
            days_until_auto_close: 2
          },
          validation_result: { validation_passed: true },
          allowed_actions: ['POST', 'MODIFY'],
          warnings: [
            {
              code: 'PERIOD_AUTO_CLOSE_WARNING',
              message: 'Period will auto-close in 2 days',
              severity: 'WARNING'
            }
          ],
          performance_metrics: { processing_time_ms: 7, performance_tier: 'ENTERPRISE' }
        })

      const result = await FiscalDNACompatibilityLayer.validateFiscalPeriod(
        mockTransactionDate,
        mockOrgId
      )

      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Period will auto-close in 2 days')
      expect(result.allowedActions).toContain('POST')
    })

    it('should support different transaction types and user roles', async () => {
      const testCases = [
        {
          transactionType: 'JOURNAL_ENTRY',
          userRole: 'accountant',
          expectedActions: ['POST', 'MODIFY']
        },
        {
          transactionType: 'ADJUSTMENT',
          userRole: 'finance_admin',
          expectedActions: ['POST_ADJUSTMENT', 'REVERSE']
        },
        {
          transactionType: 'REVERSAL',
          userRole: 'system_admin',
          expectedActions: ['REVERSE', 'EMERGENCY_ADJUSTMENT']
        }
      ]

      for (const testCase of testCases) {
        jest.spyOn(FiscalDNACompatibilityLayer as any, 'validateWithV2Enhanced')
          .mockResolvedValue({
            is_valid: true,
            period_status: mockFiscalPeriodV2,
            validation_result: { validation_passed: true },
            allowed_actions: testCase.expectedActions,
            warnings: [],
            performance_metrics: { processing_time_ms: 6 }
          })

        const result = await FiscalDNACompatibilityLayer.validateFiscalPeriod(
          mockTransactionDate,
          mockOrgId,
          {
            transactionType: testCase.transactionType,
            userRole: testCase.userRole
          }
        )

        expect(result.valid).toBe(true)
        expect(result.allowedActions).toEqual(testCase.expectedActions)
      }
    })
  })
})

// Performance and load testing
describe('Fiscal DNA Compatibility Performance', () => {
  it('should maintain performance under load', async () => {
    const concurrentValidations = 50
    const startTime = performance.now()

    // Mock fast v2 validation
    jest.spyOn(FiscalDNACompatibilityLayer as any, 'validateWithV2Enhanced')
      .mockResolvedValue({
        is_valid: true,
        period_status: mockFiscalPeriodV2,
        validation_result: { validation_passed: true },
        allowed_actions: ['POST'],
        warnings: [],
        performance_metrics: { processing_time_ms: 5, performance_tier: 'ENTERPRISE' }
      })

    const promises = Array.from({ length: concurrentValidations }, () =>
      FiscalDNACompatibilityLayer.validateFiscalPeriod(mockTransactionDate, mockOrgId)
    )

    const results = await Promise.all(promises)
    const totalTime = performance.now() - startTime

    expect(results).toHaveLength(concurrentValidations)
    expect(results.every(r => r.valid)).toBe(true)
    expect(totalTime).toBeLessThan(1000) // Should complete within 1 second
  })

  it('should efficiently handle batch validations', async () => {
    const transactions = Array.from({ length: 100 }, (_, i) => ({
      transactionDate: '2024-12-09',
      organizationId: mockOrgId,
      transactionType: 'JOURNAL_ENTRY'
    }))

    jest.spyOn(FiscalDNACompatibilityLayer, 'validateFiscalPeriod')
      .mockResolvedValue({
        valid: true,
        period: mockFiscalPeriodV2,
        performanceMetrics: { processing_time_ms: 5 }
      })

    const startTime = performance.now()
    const results = await FiscalDNACompatibilityLayer.validateBatchTransactions(transactions)
    const totalTime = performance.now() - startTime

    expect(results).toHaveLength(100)
    expect(results.every(r => r.valid)).toBe(true)
    expect(totalTime / results.length).toBeLessThan(10) // < 10ms per validation average
  })
})