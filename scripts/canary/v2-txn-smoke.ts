#!/usr/bin/env tsx
/**
 * V2 Transaction Smoke Test
 * Validates basic transaction operations through V2 facades
 */

import { apiV2 } from '@/lib/universal/v2/client'

const TEST_ORG_ID = process.env.TEST_ORG_ID || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'

interface SmokeTestResult {
  operation: string
  success: boolean
  transactionId?: string
  error?: string
  duration?: number
}

async function runTransactionSmokeTest(): Promise<void> {
  console.log('🧪 V2 Transaction Smoke Test Starting...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📍 Organization ID: ${TEST_ORG_ID}`)
  console.log()

  const results: SmokeTestResult[] = []
  let createdTransactionId: string | null = null
  let testEntityIds: string[] = []

  // Setup: Create test entities for transactions
  console.log('🔧 Setup: Creating test entities...')
  
  try {
    const entityPromises = [
      apiV2.post('/entities', {
        entity_type: 'test_customer',
        entity_name: 'Smoke Test Customer',
        smart_code: 'HERA.TEST.TXN.CUSTOMER.V1',
        organization_id: TEST_ORG_ID
      }),
      apiV2.post('/entities', {
        entity_type: 'test_product',
        entity_name: 'Smoke Test Product',
        smart_code: 'HERA.TEST.TXN.PRODUCT.V1',
        organization_id: TEST_ORG_ID
      })
    ]

    const entityResults = await Promise.all(entityPromises)
    testEntityIds = entityResults
      .filter(result => result.data?.success && result.data?.data?.entity_id)
      .map(result => result.data.data.entity_id)

    if (testEntityIds.length < 2) {
      console.log('❌ Failed to create required test entities')
      process.exit(1)
    }

    console.log(`✅ Created ${testEntityIds.length} test entities`)
    console.log(`   Customer Entity: ${testEntityIds[0]}`)
    console.log(`   Product Entity: ${testEntityIds[1]}`)
  } catch (error) {
    console.log(`❌ Setup failed: ${error}`)
    process.exit(1)
  }

  // Test 1: Emit Simple Transaction
  console.log('\n🔄 Test 1: Emitting simple transaction...')
  const startEmit = Date.now()

  try {
    const transactionData = {
      organization_id: TEST_ORG_ID,
      transaction_type: 'smoke_test_sale',
      smart_code: 'HERA.TEST.TXN.SMOKE.SALE.V1',
      transaction_date: new Date().toISOString(),
      source_entity_id: testEntityIds[0], // Customer
      target_entity_id: testEntityIds[1], // Product
      business_context: {
        total_amount: 100.00,
        currency: 'USD',
        payment_method: 'cash',
        description: 'V2 smoke test transaction'
      },
      lines: [
        {
          line_entity_id: testEntityIds[1],
          line_number: 1,
          quantity: 2,
          unit_price: 50.00,
          line_amount: 100.00,
          smart_code: 'HERA.TEST.TXN.LINE.SMOKE.V1'
        }
      ]
    }

    const { data, error } = await apiV2.post('/transactions', transactionData)
    const duration = Date.now() - startEmit

    if (error) {
      results.push({
        operation: 'Emit Transaction',
        success: false,
        error: error.message,
        duration
      })
      console.log(`❌ Emit failed: ${error.message}`)
    } else if (data?.api_version === 'v2' && data?.transaction_id) {
      createdTransactionId = data.transaction_id
      results.push({
        operation: 'Emit Transaction',
        success: true,
        transactionId: createdTransactionId,
        duration
      })
      console.log(`✅ Emitted transaction: ${createdTransactionId} (${duration}ms)`)
    } else {
      results.push({
        operation: 'Emit Transaction',
        success: false,
        error: 'Invalid response format',
        duration
      })
      console.log('❌ Emit failed: Invalid response format')
    }
  } catch (error) {
    const duration = Date.now() - startEmit
    results.push({
      operation: 'Emit Transaction',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    })
    console.log(`❌ Emit failed: ${error}`)
  }

  // Test 2: Read Transaction by ID
  if (createdTransactionId) {
    console.log('\n🔄 Test 2: Reading transaction by ID...')
    const startRead = Date.now()

    try {
      const { data, error } = await apiV2.get('/transactions', {
        txn_id: createdTransactionId,
        organization_id: TEST_ORG_ID
      })
      const duration = Date.now() - startRead

      if (error) {
        results.push({
          operation: 'Read Transaction',
          success: false,
          error: error.message,
          duration
        })
        console.log(`❌ Read failed: ${error.message}`)
      } else if (data?.api_version === 'v2') {
        results.push({
          operation: 'Read Transaction',
          success: true,
          transactionId: createdTransactionId,
          duration
        })
        console.log(`✅ Read transaction: ${createdTransactionId} (${duration}ms)`)
      } else {
        results.push({
          operation: 'Read Transaction',
          success: false,
          error: 'Transaction not found or invalid response',
          duration
        })
        console.log('❌ Read failed: Transaction not found')
      }
    } catch (error) {
      const duration = Date.now() - startRead
      results.push({
        operation: 'Read Transaction',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      })
      console.log(`❌ Read failed: ${error}`)
    }
  }

  // Test 3: Query Transactions
  console.log('\n🔄 Test 3: Querying transactions...')
  const startQuery = Date.now()

  try {
    const { data, error } = await apiV2.get('/transactions', {
      organization_id: TEST_ORG_ID,
      transaction_type: 'smoke_test_sale',
      limit: 10
    })
    const duration = Date.now() - startQuery

    if (error) {
      results.push({
        operation: 'Query Transactions',
        success: false,
        error: error.message,
        duration
      })
      console.log(`❌ Query failed: ${error.message}`)
    } else if (data?.api_version === 'v2') {
      results.push({
        operation: 'Query Transactions',
        success: true,
        duration
      })
      console.log(`✅ Queried transactions (${duration}ms)`)
    } else {
      results.push({
        operation: 'Query Transactions',
        success: false,
        error: 'Invalid response format',
        duration
      })
      console.log('❌ Query failed: Invalid response format')
    }
  } catch (error) {
    const duration = Date.now() - startQuery
    results.push({
      operation: 'Query Transactions',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    })
    console.log(`❌ Query failed: ${error}`)
  }

  // Test 4: Emit Multi-Line Transaction
  console.log('\n🔄 Test 4: Emitting multi-line transaction...')
  const startMultiLine = Date.now()

  try {
    const multiLineData = {
      organization_id: TEST_ORG_ID,
      transaction_type: 'smoke_test_multi',
      smart_code: 'HERA.TEST.TXN.SMOKE.MULTI.V1',
      transaction_date: new Date().toISOString(),
      source_entity_id: testEntityIds[0],
      business_context: {
        total_amount: 350.00,
        currency: 'USD',
        description: 'Multi-line smoke test'
      },
      lines: [
        {
          line_entity_id: testEntityIds[1],
          line_number: 1,
          quantity: 3,
          unit_price: 100.00,
          line_amount: 300.00,
          smart_code: 'HERA.TEST.TXN.LINE.MULTI1.V1'
        },
        {
          line_entity_id: testEntityIds[1],
          line_number: 2,
          quantity: 1,
          unit_price: 50.00,
          line_amount: 50.00,
          smart_code: 'HERA.TEST.TXN.LINE.MULTI2.V1'
        }
      ]
    }

    const { data, error } = await apiV2.post('/transactions', multiLineData)
    const duration = Date.now() - startMultiLine

    if (error) {
      results.push({
        operation: 'Emit Multi-Line Transaction',
        success: false,
        error: error.message,
        duration
      })
      console.log(`❌ Multi-line emit failed: ${error.message}`)
    } else if (data?.api_version === 'v2' && data?.transaction_id) {
      results.push({
        operation: 'Emit Multi-Line Transaction',
        success: true,
        transactionId: data.transaction_id,
        duration
      })
      console.log(`✅ Emitted multi-line transaction: ${data.transaction_id} (${duration}ms)`)
      console.log(`   Lines: 2 transaction lines`)
    } else {
      results.push({
        operation: 'Emit Multi-Line Transaction',
        success: false,
        error: 'Invalid response format',
        duration
      })
      console.log('❌ Multi-line emit failed: Invalid response format')
    }
  } catch (error) {
    const duration = Date.now() - startMultiLine
    results.push({
      operation: 'Emit Multi-Line Transaction',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    })
    console.log(`❌ Multi-line emit failed: ${error}`)
  }

  // Test 5: Transaction Reversal (Optional)
  if (createdTransactionId) {
    console.log('\n🔄 Test 5: Reversing transaction...')
    const startReverse = Date.now()

    try {
      const reversalData = {
        organization_id: TEST_ORG_ID,
        transaction_id: createdTransactionId,
        reversal_reason: 'Smoke test reversal',
        reversal_smart_code: 'HERA.TEST.TXN.REVERSAL.SMOKE.V1'
      }

      const { data, error } = await apiV2.post('/transactions?action=reverse', reversalData)
      const duration = Date.now() - startReverse

      if (error) {
        results.push({
          operation: 'Reverse Transaction',
          success: false,
          error: error.message,
          duration
        })
        console.log(`❌ Reversal failed: ${error.message}`)
      } else if (data?.api_version === 'v2' && data?.transaction_id) {
        results.push({
          operation: 'Reverse Transaction',
          success: true,
          transactionId: data.transaction_id,
          duration
        })
        console.log(`✅ Reversed transaction: ${data.transaction_id} (${duration}ms)`)
      } else {
        results.push({
          operation: 'Reverse Transaction',
          success: false,
          error: 'Invalid response format',
          duration
        })
        console.log('❌ Reversal failed: Invalid response format')
      }
    } catch (error) {
      const duration = Date.now() - startReverse
      results.push({
        operation: 'Reverse Transaction',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      })
      console.log(`❌ Reversal failed: ${error}`)
    }
  }

  // Print Summary
  console.log('\n📊 Smoke Test Summary')
  console.log('━━━━━━━━━━━━━━━━━━━━━━')
  
  const totalTests = results.length
  const passedTests = results.filter(r => r.success).length
  const failedTests = totalTests - passedTests
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0)

  console.log(`Tests Run: ${totalTests}`)
  console.log(`Passed: ${passedTests} ✅`)
  console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`)
  console.log(`Total Duration: ${totalDuration}ms`)
  console.log()

  // Detailed Results
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌'
    const duration = result.duration ? `${result.duration}ms` : 'N/A'
    console.log(`${index + 1}. ${status} ${result.operation} (${duration})`)
    if (result.transactionId) {
      console.log(`   Transaction ID: ${result.transactionId}`)
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  // Final Status
  console.log()
  if (failedTests === 0) {
    console.log('🎉 All transaction smoke tests passed!')
    if (createdTransactionId) {
      console.log(`📝 Created transaction ID: ${createdTransactionId}`)
    }
    console.log(`🧹 Test entities: ${testEntityIds.join(', ')}`)
    process.exit(0)
  } else {
    console.log('💥 Some transaction smoke tests failed!')
    process.exit(1)
  }
}

// Run the smoke test
if (require.main === module) {
  runTransactionSmokeTest().catch(error => {
    console.error('💥 Transaction smoke test crashed:', error)
    process.exit(1)
  })
}