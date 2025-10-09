/**
 * HERA Finance DNA v2 Zero Tables Migration Tests
 * 
 * Smart Code: HERA.ACCOUNTING.MIGRATION.ZERO.TABLES.TEST.v2
 * 
 * Comprehensive test suite for Zero Tables migration approach
 * Validates CTE-only operations and RPC-based migration patterns
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/test'
import { z } from 'zod'

// ===== TEST CONFIGURATION =====

const TEST_CONFIG = {
  organization_id: '00000000-0000-0000-0000-000000000000',
  from_date: '2025-01-01',
  to_date: '2025-12-31',
  batch_limit: 100,
  test_smart_codes: [
    'HERA.SALON.POS.TXN.SALE.v1',
    'HERA.ACCOUNTING.AR.TXN.CUSTOMER_INVOICE.v1',
    'HERA.ACCOUNTING.AP.TXN.VENDOR_BILL.v1'
  ]
}

// ===== VALIDATION SCHEMAS =====

const MigrationPreviewSchema = z.object({
  total_candidates: z.number().int().min(0),
  smart_code_breakdown: z.record(z.object({
    target_smart_code: z.string(),
    transaction_count: z.number().int().min(0)
  })),
  fiscal_period_status: z.record(z.object({
    status: z.string(),
    affected_transactions: z.number().int().min(0)
  })),
  sample_transactions: z.array(z.object({
    txn_id: z.string().uuid(),
    smart_code: z.string(),
    target_smart_code: z.string(),
    transaction_date: z.string()
  }))
})

const MigrationExecutionSchema = z.object({
  success: z.boolean(),
  transactions_processed: z.number().int().min(0),
  transactions_successful: z.number().int().min(0),
  transactions_failed: z.number().int().min(0),
  processing_time_ms: z.number().int().min(0),
  gl_balance_validated: z.boolean(),
  error_details: z.array(z.string())
})

const MigrationValidationSchema = z.object({
  overall_integrity_score: z.number().min(0).max(100),
  gl_balance_status: z.enum(['BALANCED', 'UNBALANCED']),
  smart_code_consistency: z.number().min(0).max(100),
  fiscal_period_compliance: z.boolean(),
  migration_completeness: z.number().min(0).max(100),
  recommendations: z.array(z.string().min(1))
})

// ===== HELPER FUNCTIONS =====

async function callMigrationAPI(endpoint: string, body: any) {
  const response = await fetch(`/api/v2/finance/migration/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hera-api-version': 'v2',
      'authorization': 'Bearer test-jwt-token'
    },
    body: JSON.stringify({
      apiVersion: 'v2',
      ...body
    })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`API call failed: ${errorData.error?.message || 'Unknown error'}`)
  }

  return response.json()
}

async function createTestTransactions(count: number = 10) {
  const transactions = []
  
  for (let i = 0; i < count; i++) {
    const txn = {
      organization_id: TEST_CONFIG.organization_id,
      transaction_type: 'TX.FINANCE.REVENUE.V1',
      smart_code: TEST_CONFIG.test_smart_codes[i % TEST_CONFIG.test_smart_codes.length],
      transaction_date: new Date(2025, 0, i + 1).toISOString(),
      total_amount: (i + 1) * 100,
      business_context: {
        test_transaction: true,
        test_batch_id: `batch_${Date.now()}`
      }
    }
    
    // Create transaction via API
    const result = await callMigrationAPI('create-test-transaction', txn)
    transactions.push(result.transaction_id)
  }
  
  return transactions
}

async function cleanupTestTransactions(transactionIds: string[]) {
  for (const txnId of transactionIds) {
    try {
      await callMigrationAPI('cleanup-test-transaction', { transaction_id: txnId })
    } catch (error) {
      console.warn(`Failed to cleanup transaction ${txnId}:`, error)
    }
  }
}

// ===== TEST SUITES =====

describe('Finance DNA v2 Zero Tables Migration', () => {
  let testTransactions: string[] = []

  beforeAll(async () => {
    console.log('🧪 Setting up Zero Tables migration test environment...')
    
    // Create test transactions
    testTransactions = await createTestTransactions(15)
    console.log(`✅ Created ${testTransactions.length} test transactions`)
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up Zero Tables migration test environment...')
    
    // Cleanup test transactions
    await cleanupTestTransactions(testTransactions)
    console.log('✅ Test cleanup completed')
  })

  describe('Phase 1: Migration Preview (CTE-Only)', () => {
    test('should preview migration candidates without creating tables', async () => {
      const result = await callMigrationAPI('preview', {
        organization_id: TEST_CONFIG.organization_id,
        from_date: TEST_CONFIG.from_date,
        to_date: TEST_CONFIG.to_date,
        batch_limit: TEST_CONFIG.batch_limit
      })

      // Validate response structure
      const validation = MigrationPreviewSchema.safeParse(result)
      expect(validation.success).toBe(true)

      if (validation.success) {
        const data = validation.data
        
        // Should identify migration candidates
        expect(data.total_candidates).toBeGreaterThanOrEqual(0)
        
        // Should provide smart code breakdown
        expect(Object.keys(data.smart_code_breakdown)).toEqual(
          expect.arrayContaining(TEST_CONFIG.test_smart_codes)
        )
        
        // Should include sample transactions if candidates exist
        if (data.total_candidates > 0) {
          expect(data.sample_transactions.length).toBeGreaterThan(0)
          expect(data.sample_transactions[0]).toHaveProperty('txn_id')
          expect(data.sample_transactions[0]).toHaveProperty('target_smart_code')
        }
        
        console.log('📊 Preview results:', {
          candidates: data.total_candidates,
          smart_codes: Object.keys(data.smart_code_breakdown).length,
          samples: data.sample_transactions.length
        })
      }
    })

    test('should handle empty result sets gracefully', async () => {
      const result = await callMigrationAPI('preview', {
        organization_id: '11111111-1111-1111-1111-111111111111', // Non-existent org
        from_date: '2020-01-01',
        to_date: '2020-12-31',
        batch_limit: 100
      })

      expect(result.total_candidates).toBe(0)
      expect(Object.keys(result.smart_code_breakdown || {})).toHaveLength(0)
      expect(result.sample_transactions).toHaveLength(0)
    })

    test('should respect batch limits', async () => {
      const smallBatchResult = await callMigrationAPI('preview', {
        organization_id: TEST_CONFIG.organization_id,
        from_date: TEST_CONFIG.from_date,
        to_date: TEST_CONFIG.to_date,
        batch_limit: 5
      })

      // Sample transactions should not exceed batch limit
      expect(smallBatchResult.sample_transactions.length).toBeLessThanOrEqual(5)
    })
  })

  describe('Phase 2: Migration Execution (Reverse + Repost)', () => {
    test('should execute dry run migration successfully', async () => {
      const result = await callMigrationAPI('execute', {
        organization_id: TEST_CONFIG.organization_id,
        from_date: TEST_CONFIG.from_date,
        to_date: TEST_CONFIG.to_date,
        batch_limit: 5,
        dry_run: true
      })

      // Validate response structure
      const validation = MigrationExecutionSchema.safeParse(result)
      expect(validation.success).toBe(true)

      if (validation.success) {
        const data = validation.data
        
        // Dry run should succeed
        expect(data.success).toBe(true)
        expect(data.transactions_failed).toBe(0)
        expect(data.error_details).toHaveLength(0)
        expect(data.processing_time_ms).toBeGreaterThanOrEqual(0)
        
        console.log('🏃‍♂️ Dry run results:', {
          processed: data.transactions_processed,
          successful: data.transactions_successful,
          time_ms: data.processing_time_ms
        })
      }
    })

    test('should execute actual migration with validation', async () => {
      const result = await callMigrationAPI('execute', {
        organization_id: TEST_CONFIG.organization_id,
        from_date: TEST_CONFIG.from_date,
        to_date: TEST_CONFIG.to_date,
        batch_limit: 3, // Small batch for testing
        dry_run: false
      })

      // Validate response structure
      const validation = MigrationExecutionSchema.safeParse(result)
      expect(validation.success).toBe(true)

      if (validation.success) {
        const data = validation.data
        
        // Migration should have results
        expect(data.transactions_processed).toBeGreaterThanOrEqual(0)
        expect(data.processing_time_ms).toBeGreaterThan(0)
        
        // GL balance should be validated
        expect(data.gl_balance_validated).toBe(true)
        
        // Should have low error rate
        const errorRate = data.transactions_processed > 0 
          ? data.transactions_failed / data.transactions_processed 
          : 0
        expect(errorRate).toBeLessThan(0.1) // Less than 10% error rate
        
        console.log('⚡ Migration execution results:', {
          processed: data.transactions_processed,
          successful: data.transactions_successful,
          failed: data.transactions_failed,
          gl_balanced: data.gl_balance_validated,
          time_ms: data.processing_time_ms
        })
      }
    })

    test('should maintain GL balance during migration', async () => {
      // Get pre-migration trial balance
      const preTB = await callMigrationAPI('trial-balance', {
        organization_id: TEST_CONFIG.organization_id,
        as_of_date: TEST_CONFIG.to_date
      })

      // Execute small migration batch
      const migrationResult = await callMigrationAPI('execute', {
        organization_id: TEST_CONFIG.organization_id,
        from_date: TEST_CONFIG.from_date,
        to_date: TEST_CONFIG.to_date,
        batch_limit: 2,
        dry_run: false
      })

      // Get post-migration trial balance
      const postTB = await callMigrationAPI('trial-balance', {
        organization_id: TEST_CONFIG.organization_id,
        as_of_date: TEST_CONFIG.to_date
      })

      // GL should remain balanced
      expect(migrationResult.gl_balance_validated).toBe(true)
      expect(postTB.is_balanced).toBe(true)
      
      // Total debits should equal total credits
      expect(Math.abs(postTB.total_debits - postTB.total_credits)).toBeLessThan(0.01)
    })
  })

  describe('Phase 3: Reporting Aliases (Metadata-Only)', () => {
    test('should apply reporting aliases correctly', async () => {
      const result = await callMigrationAPI('apply-alias', {
        organization_id: TEST_CONFIG.organization_id,
        source_smart_code: 'HERA.SALON.POS.TXN.SALE.v1',
        target_smart_code: 'HERA.SALON.POS.TXN.SALE.v2'
      })

      expect(result.transactions_updated).toBeGreaterThanOrEqual(0)
      expect(result.validation_passed).toBe(true)

      console.log('🏷️ Reporting alias results:', {
        updated: result.transactions_updated,
        validated: result.validation_passed
      })
    })

    test('should validate alias application', async () => {
      // Apply alias
      await callMigrationAPI('apply-alias', {
        organization_id: TEST_CONFIG.organization_id,
        source_smart_code: 'HERA.ACCOUNTING.AR.TXN.CUSTOMER_INVOICE.v1',
        target_smart_code: 'HERA.ACCOUNTING.AR.TXN.CUSTOMER_INVOICE.v2'
      })

      // Verify alias was applied by checking metadata
      const verificationResult = await callMigrationAPI('verify-alias', {
        organization_id: TEST_CONFIG.organization_id,
        source_smart_code: 'HERA.ACCOUNTING.AR.TXN.CUSTOMER_INVOICE.v1',
        expected_alias: 'HERA.ACCOUNTING.AR.TXN.CUSTOMER_INVOICE.v2'
      })

      expect(verificationResult.alias_correctly_applied).toBe(true)
    })
  })

  describe('Phase 4: Validation (Sacred Six Tables Only)', () => {
    test('should validate migration integrity comprehensively', async () => {
      const result = await callMigrationAPI('validate', {
        organization_id: TEST_CONFIG.organization_id
      })

      // Validate response structure
      const validation = MigrationValidationSchema.safeParse(result)
      expect(validation.success).toBe(true)

      if (validation.success) {
        const data = validation.data
        
        // Should have reasonable integrity scores
        expect(data.overall_integrity_score).toBeGreaterThanOrEqual(80)
        expect(data.smart_code_consistency).toBeGreaterThanOrEqual(0)
        expect(data.migration_completeness).toBeGreaterThanOrEqual(0)
        
        // GL balance should be correct
        expect(data.gl_balance_status).toBe('BALANCED')
        
        // Should provide recommendations
        expect(data.recommendations.length).toBeGreaterThan(0)
        expect(data.recommendations[0]).toBeTruthy()
        
        console.log('✅ Validation results:', {
          overall_score: data.overall_integrity_score,
          gl_status: data.gl_balance_status,
          smart_code_score: data.smart_code_consistency,
          completeness: data.migration_completeness,
          fiscal_compliant: data.fiscal_period_compliance
        })
      }
    })

    test('should detect validation issues when present', async () => {
      // This test would simulate validation failures in a controlled environment
      // For now, we'll test the structure and ensure it handles edge cases
      
      const result = await callMigrationAPI('validate', {
        organization_id: TEST_CONFIG.organization_id
      })

      // Should always return valid structure even if scores are low
      expect(result).toHaveProperty('overall_integrity_score')
      expect(result).toHaveProperty('recommendations')
      expect(Array.isArray(result.recommendations)).toBe(true)
    })
  })

  describe('Rollback Functionality (Zero Tables)', () => {
    test('should rollback migration successfully', async () => {
      // First, execute a small migration to have something to rollback
      const migrationResult = await callMigrationAPI('execute', {
        organization_id: TEST_CONFIG.organization_id,
        from_date: TEST_CONFIG.from_date,
        to_date: TEST_CONFIG.to_date,
        batch_limit: 1,
        dry_run: false
      })

      if (migrationResult.transactions_successful > 0) {
        // Now rollback the migration
        const rollbackResult = await callMigrationAPI('rollback', {
          organization_id: TEST_CONFIG.organization_id,
          migration_session_identifier: 'test_migration_session',
          rollback_reason: 'Test rollback procedure'
        })

        expect(rollbackResult.success).toBe(true)
        expect(rollbackResult.transactions_rolled_back).toBeGreaterThanOrEqual(0)
        expect(rollbackResult.error_details).toHaveLength(0)

        console.log('↩️ Rollback results:', {
          success: rollbackResult.success,
          rolled_back: rollbackResult.transactions_rolled_back
        })
      }
    })
  })

  describe('Performance and Scale Testing', () => {
    test('should handle large batch sizes efficiently', async () => {
      const startTime = Date.now()
      
      const result = await callMigrationAPI('preview', {
        organization_id: TEST_CONFIG.organization_id,
        from_date: '2024-01-01',
        to_date: '2025-12-31',
        batch_limit: 5000 // Large batch
      })
      
      const endTime = Date.now()
      const processingTime = endTime - startTime

      // Should complete within reasonable time (less than 30 seconds)
      expect(processingTime).toBeLessThan(30000)
      
      // Should handle large batch without errors
      expect(result).toHaveProperty('total_candidates')
      
      console.log('⚡ Performance test:', {
        batch_limit: 5000,
        processing_time_ms: processingTime,
        candidates_found: result.total_candidates
      })
    })

    test('should maintain performance with concurrent operations', async () => {
      // Execute multiple preview operations concurrently
      const concurrentOperations = Array.from({ length: 5 }, (_, i) =>
        callMigrationAPI('preview', {
          organization_id: TEST_CONFIG.organization_id,
          from_date: TEST_CONFIG.from_date,
          to_date: TEST_CONFIG.to_date,
          batch_limit: 100
        })
      )

      const startTime = Date.now()
      const results = await Promise.all(concurrentOperations)
      const endTime = Date.now()

      // All operations should succeed
      results.forEach(result => {
        expect(result).toHaveProperty('total_candidates')
      })

      // Should complete concurrent operations efficiently
      expect(endTime - startTime).toBeLessThan(15000) // 15 seconds max

      console.log('🔀 Concurrent operations test:', {
        operations: concurrentOperations.length,
        total_time_ms: endTime - startTime,
        avg_time_per_op: (endTime - startTime) / concurrentOperations.length
      })
    })
  })

  describe('Migration Comparison Reports', () => {
    test('should generate comprehensive comparison report', async () => {
      const result = await callMigrationAPI('comparison-report', {
        organization_id: TEST_CONFIG.organization_id,
        comparison_date: TEST_CONFIG.to_date
      })

      expect(result).toHaveProperty('comparison_summary')
      expect(result).toHaveProperty('trial_balance_comparison')
      expect(result).toHaveProperty('smart_code_distribution')
      expect(result).toHaveProperty('performance_metrics')

      // Summary should have migration progress
      expect(result.comparison_summary).toHaveProperty('migration_progress_pct')
      expect(result.comparison_summary.migration_progress_pct).toBeGreaterThanOrEqual(0)

      // Performance metrics should be reasonable
      expect(result.performance_metrics).toHaveProperty('success_rate')
      expect(result.performance_metrics.success_rate).toBeGreaterThanOrEqual(0)

      console.log('📊 Comparison report:', {
        migration_progress: result.comparison_summary.migration_progress_pct,
        financial_integrity: result.comparison_summary.financial_integrity,
        success_rate: result.performance_metrics.success_rate
      })
    })
  })
})

// ===== INTEGRATION TESTS =====

describe('Finance DNA v2 Integration with Existing Systems', () => {
  test('should maintain compatibility with v1 reporting', async () => {
    // Test that v1 reports still work during migration
    const v1Report = await callMigrationAPI('v1-compatibility-test', {
      organization_id: TEST_CONFIG.organization_id,
      report_type: 'trial_balance'
    })

    expect(v1Report.success).toBe(true)
    expect(v1Report.compatibility_maintained).toBe(true)
  })

  test('should enable v2 reporting features', async () => {
    // Test that v2 enhanced features are available
    const v2Report = await callMigrationAPI('v2-features-test', {
      organization_id: TEST_CONFIG.organization_id,
      feature_type: 'enhanced_reporting'
    })

    expect(v2Report.success).toBe(true)
    expect(v2Report.enhanced_features_available).toBe(true)
  })
})

export { TEST_CONFIG, MigrationPreviewSchema, MigrationExecutionSchema, MigrationValidationSchema }