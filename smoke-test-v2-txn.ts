#!/usr/bin/env tsx

/**
 * HERA V2 Transaction CRUD - Smoke Tests
 * Tests: Emit → Read → Query → Reverse happy path + negative cases
 */

import { txnClientV2 } from './src/lib/v2/client/txn-client'

// Test configuration
const TEST_ORG_ID = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944' // System org for testing
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

interface SmokeTestResult {
  testName: string
  success: boolean
  error?: string
  data?: any
  duration?: number
}

class SmokeTestRunner {
  private results: SmokeTestResult[] = []

  async runTest(testName: string, testFn: () => Promise<any>): Promise<SmokeTestResult> {
    console.log(`🧪 Running: ${testName}`)
    const startTime = Date.now()

    try {
      const data = await testFn()
      const result: SmokeTestResult = {
        testName,
        success: true,
        data,
        duration: Date.now() - startTime
      }
      this.results.push(result)
      console.log(`✅ ${testName} - ${result.duration}ms`)
      return result
    } catch (error: any) {
      const result: SmokeTestResult = {
        testName,
        success: false,
        error: error.message || String(error),
        duration: Date.now() - startTime
      }
      this.results.push(result)
      console.log(`❌ ${testName} - ${error.message}`)
      return result
    }
  }

  printSummary() {
    const total = this.results.length
    const passed = this.results.filter(r => r.success).length
    const failed = total - passed

    console.log('\n' + '='.repeat(60))
    console.log('🏁 SMOKE TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log('\n❌ FAILURES:')
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`  • ${r.testName}: ${r.error}`))
    }

    console.log('='.repeat(60))
  }
}

async function runSmokeTests() {
  const runner = new SmokeTestRunner()
  let transactionId: string
  let reversalTransactionId: string

  console.log('🚀 Starting HERA V2 Transaction CRUD Smoke Tests')
  console.log(`📡 Base URL: ${BASE_URL}`)
  console.log(`🏢 Test Org: ${TEST_ORG_ID}`)
  console.log()

  // 1. HAPPY PATH TESTS

  // Test 1: Emit Transaction
  const emitResult = await runner.runTest('Emit Transaction', async () => {
    const result = await txnClientV2.emit({
      organization_id: TEST_ORG_ID,
      transaction_type: 'sale',
      smart_code: 'HERA.RESTAURANT.SALES.ORDER.CORE.V1',
      transaction_date: new Date().toISOString(),
      source_entity_id: 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944', // Use org id as entity
      business_context: {
        location: 'Main Restaurant',
        server: 'John Doe'
      },
      lines: [
        {
          line_number: 1,
          line_type: 'ITEM',
          entity_id: TEST_ORG_ID, // Use org as product entity for test
          quantity: 2,
          unit_price: 25.50,
          line_amount: 51.00,
          smart_code: 'HERA.RESTAURANT.SALES.LINE.ITEM.V1',
          description: 'Margherita Pizza'
        },
        {
          line_number: 2,
          line_type: 'TAX',
          quantity: 1,
          unit_price: 2.95,
          line_amount: 2.95,
          smart_code: 'HERA.RESTAURANT.SALES.LINE.TAX.V1',
          description: 'Sales Tax (5%)'
        }
      ]
    })

    transactionId = result.transaction_id
    return result
  })

  // Test 2: Read Transaction (with lines)
  if (emitResult.success && transactionId) {
    await runner.runTest('Read Transaction with Lines', async () => {
      const result = await txnClientV2.read({
        organization_id: TEST_ORG_ID,
        transaction_id: transactionId,
        include_lines: true
      })

      // Validate response structure
      if (!result.transaction) throw new Error('No transaction in response')
      if (!result.transaction.lines || result.transaction.lines.length === 0) {
        throw new Error('No lines in transaction response')
      }

      return result
    })
  }

  // Test 3: Read Transaction (header only)
  if (emitResult.success && transactionId) {
    await runner.runTest('Read Transaction Header Only', async () => {
      const result = await txnClientV2.read({
        organization_id: TEST_ORG_ID,
        transaction_id: transactionId,
        include_lines: false
      })

      // Should not have lines
      if (result.transaction.lines && result.transaction.lines.length > 0) {
        throw new Error('Lines present when include_lines=false')
      }

      return result
    })
  }

  // Test 4: Query Transactions
  await runner.runTest('Query Transactions by Type', async () => {
    const result = await txnClientV2.query({
      organization_id: TEST_ORG_ID,
      transaction_type: 'sale',
      limit: 10,
      include_lines: false
    })

    if (!Array.isArray(result.transactions)) {
      throw new Error('Response transactions is not an array')
    }

    return result
  })

  // Test 5: Query with Lines
  await runner.runTest('Query Transactions with Lines', async () => {
    const result = await txnClientV2.query({
      organization_id: TEST_ORG_ID,
      transaction_type: 'sale',
      limit: 5,
      include_lines: true
    })

    return result
  })

  // Test 6: Reverse Transaction
  if (emitResult.success && transactionId) {
    const reverseResult = await runner.runTest('Reverse Transaction', async () => {
      const result = await txnClientV2.reverse({
        organization_id: TEST_ORG_ID,
        original_transaction_id: transactionId,
        smart_code: 'HERA.RESTAURANT.SALES.ORDER.REVERSAL.V1',
        reason: 'Customer cancellation - smoke test'
      })

      reversalTransactionId = result.reversal_transaction_id
      return result
    })
  }

  // Test 7: Read Reversed Transaction
  if (reversalTransactionId) {
    await runner.runTest('Read Reversal Transaction', async () => {
      const result = await txnClientV2.read({
        organization_id: TEST_ORG_ID,
        transaction_id: reversalTransactionId,
        include_lines: true
      })

      // Validate reversal properties
      if (result.transaction.status !== 'REVERSAL') {
        throw new Error(`Expected status REVERSAL, got ${result.transaction.status}`)
      }

      return result
    })
  }

  // 2. NEGATIVE TESTS

  // Test 8: Wrong Organization Access
  if (transactionId) {
    await runner.runTest('Wrong Organization Access (Should Fail)', async () => {
      try {
        await txnClientV2.read({
          organization_id: '00000000-0000-0000-0000-000000000000', // Wrong org
          transaction_id: transactionId,
          include_lines: true
        })
        throw new Error('Should have failed with wrong organization')
      } catch (error: any) {
        if (error.message.includes('Should have failed')) throw error
        // Expected to fail - this is success for this negative test
        return { success: true, message: 'Correctly rejected wrong organization' }
      }
    })
  }

  // Test 9: Invalid Smart Code
  await runner.runTest('Invalid Smart Code (Should Fail)', async () => {
    try {
      await txnClientV2.emit({
        organization_id: TEST_ORG_ID,
        transaction_type: 'sale',
        smart_code: 'invalid-code', // Invalid format
        transaction_date: new Date().toISOString(),
        lines: [
          {
            line_number: 1,
            line_type: 'ITEM',
            smart_code: 'HERA.TEST.LINE.V1',
            line_amount: 100
          }
        ]
      })
      throw new Error('Should have failed with invalid smart code')
    } catch (error: any) {
      if (error.message.includes('Should have failed')) throw error
      return { success: true, message: 'Correctly rejected invalid smart code' }
    }
  })

  // Test 10: Financial Balance Test (if implemented)
  await runner.runTest('Financial Balance Validation', async () => {
    const result = await txnClientV2.emit({
      organization_id: TEST_ORG_ID,
      transaction_type: 'journal_entry',
      smart_code: 'HERA.RESTAURANT.FINANCE.JOURNAL.ENTRY.V1',
      transaction_date: new Date().toISOString(),
      lines: [
        {
          line_number: 1,
          line_type: 'debit',
          line_amount: 100,
          dr_cr: 'DR',
          smart_code: 'HERA.RESTAURANT.FINANCE.GL.DEBIT.V1'
        },
        {
          line_number: 2,
          line_type: 'credit',
          line_amount: 100,
          dr_cr: 'CR',
          smart_code: 'HERA.RESTAURANT.FINANCE.GL.CREDIT.V1'
        }
      ]
    })

    return result
  })

  // 3. HELPER FUNCTIONS TEST

  // Test 11: Audit Trail Helper
  if (transactionId && reversalTransactionId) {
    await runner.runTest('Audit Trail Helper', async () => {
      const result = await txnClientV2.getAuditTrail(TEST_ORG_ID, transactionId)

      if (!result.original) throw new Error('No original transaction in audit trail')
      if (!Array.isArray(result.reversals)) throw new Error('Reversals is not an array')

      return result
    })
  }

  // Test 12: Balance Validation Helper
  await runner.runTest('Balance Validation Helper', async () => {
    const balanced = txnClientV2.validateBalance([
      { line_amount: 100, dr_cr: 'DR' },
      { line_amount: 100, dr_cr: 'CR' }
    ])

    const unbalanced = txnClientV2.validateBalance([
      { line_amount: 100, dr_cr: 'DR' },
      { line_amount: 90, dr_cr: 'CR' }
    ])

    if (!balanced) throw new Error('Balanced transaction failed validation')
    if (unbalanced) throw new Error('Unbalanced transaction passed validation')

    return { balanced: true, unbalanced: false }
  })

  runner.printSummary()
  return runner.results.filter(r => !r.success).length === 0
}

// Run smoke tests if called directly
if (require.main === module) {
  runSmokeTests()
    .then(success => {
      console.log(success ? '🎉 All smoke tests passed!' : '💥 Some tests failed!')
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Smoke test runner error:', error)
      process.exit(1)
    })
}

export { runSmokeTests }