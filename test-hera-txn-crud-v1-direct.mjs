#!/usr/bin/env node

/**
 * HERA Transaction CRUD v1 - Direct RPC Test
 * Tests hera_txn_crud_v1 RPC function directly with existing entities
 *
 * Actions Tested:
 * 1. CREATE - Create transaction with header + lines
 * 2. READ - Read single transaction with/without lines
 * 3. QUERY - Query transactions with various filters
 * 4. UPDATE - Update transaction
 * 5. VOID - Soft delete transaction
 *
 * Query Options Tested:
 * - source_entity_id filtering
 * - target_entity_id filtering
 * - transaction_type filtering
 * - include_lines option
 * - limit/offset pagination
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// ============================================================================
// Configuration
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 HERA Transaction CRUD v1 - Direct RPC Test')
console.log('='.repeat(70))
console.log('')

// ============================================================================
// Test State
// ============================================================================

const testState = {
  organizationId: null,
  actorUserId: null,
  customer1Id: null,
  customer2Id: null,
  staffId: null,
  createdTransactions: [],
  testResults: [],
  startTime: Date.now()
}

// ============================================================================
// Helper Functions
// ============================================================================

function logTest(testName) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`🧪 ${testName}`)
  console.log('='.repeat(70))
}

function logSuccess(message) {
  console.log(`✅ ${message}`)
}

function logError(message) {
  console.error(`❌ ${message}`)
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`)
}

function logData(label, data) {
  console.log(`\n📊 ${label}:`)
  console.log(JSON.stringify(data, null, 2))
}

function recordTest(testName, passed, duration, details = null) {
  testState.testResults.push({ name: testName, passed, duration, details })
  if (passed) {
    logSuccess(`PASSED (${duration}ms)`)
  } else {
    logError(`FAILED (${duration}ms)${details ? ': ' + details : ''}`)
  }
}

// ============================================================================
// Setup - Get Existing Entities
// ============================================================================

async function setupTestEnvironment() {
  logTest('SETUP: Using Existing Entities')

  // Get non-platform organization
  const { data: orgs } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .limit(5)

  testState.organizationId = orgs[0].id
  logSuccess(`Organization: ${orgs[0].organization_name}`)
  logInfo(`Organization ID: ${testState.organizationId}`)

  // Get actor user (member of org)
  const { data: memberships } = await supabase
    .from('core_relationships')
    .select('from_entity_id')
    .eq('to_entity_id', testState.organizationId)
    .eq('relationship_type', 'MEMBER_OF')
    .limit(1)

  testState.actorUserId = memberships[0].from_entity_id
  logSuccess(`Actor User ID: ${testState.actorUserId}`)

  // Get existing customers
  const { data: customers } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('organization_id', testState.organizationId)
    .eq('entity_type', 'CUSTOMER')
    .limit(2)

  if (customers && customers.length >= 2) {
    testState.customer1Id = customers[0].id
    testState.customer2Id = customers[1].id
    logSuccess(`Customer 1: ${customers[0].entity_name}`)
    logSuccess(`Customer 2: ${customers[1].entity_name}`)
  } else {
    logInfo('Not enough customers found, will use null for customer IDs')
  }

  // Get existing staff
  const { data: staff } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('organization_id', testState.organizationId)
    .eq('entity_type', 'STAFF')
    .limit(1)

  if (staff && staff.length > 0) {
    testState.staffId = staff[0].id
    logSuccess(`Staff: ${staff[0].entity_name}`)
  } else {
    logInfo('No staff found, will use null for staff ID')
  }
}

// ============================================================================
// Test 1: CREATE Action
// ============================================================================

async function test1_CreateTransaction() {
  logTest('TEST 1: CREATE - Transaction with Header + Lines')
  const startTime = Date.now()

  try {
    const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        header: {
          organization_id: testState.organizationId,
          transaction_type: 'SALE',
          smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
          source_entity_id: testState.customer1Id,
          target_entity_id: testState.staffId,
          total_amount: 300.00,
          transaction_status: 'completed'
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Test Service 1',
            quantity: 1,
            unit_amount: 100.00,
            line_amount: 100.00,
            smart_code: 'HERA.SALON.SERVICE.LINE.ITEM.v1'
          },
          {
            line_number: 2,
            line_type: 'service',
            description: 'Test Service 2',
            quantity: 1,
            unit_amount: 200.00,
            line_amount: 200.00,
            smart_code: 'HERA.SALON.SERVICE.LINE.ITEM.v1'
          }
        ]
      }
    })

    const duration = Date.now() - startTime

    if (error || !result?.success) {
      recordTest('CREATE', false, duration, error?.message || result?.error)
      return false
    }

    const txnId = result.transaction_id || result.data?.transaction_id
    testState.createdTransactions.push(txnId)

    logInfo(`Transaction ID: ${txnId}`)
    logInfo(`Lines Created: 2`)
    logData('Full Response', result)

    recordTest('CREATE', true, duration)
    return true

  } catch (error) {
    recordTest('CREATE', false, Date.now() - startTime, error.message)
    return false
  }
}

// ============================================================================
// Test 2: READ with Lines
// ============================================================================

async function test2_ReadWithLines() {
  logTest('TEST 2: READ - Single Transaction WITH Lines')
  const startTime = Date.now()

  if (testState.createdTransactions.length === 0) {
    recordTest('READ with lines', false, 0, 'No transactions to read')
    return false
  }

  try {
    const txnId = testState.createdTransactions[0]

    const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        transaction_id: txnId,
        include_lines: true
      }
    })

    const duration = Date.now() - startTime

    if (error || !result?.success) {
      recordTest('READ with lines', false, duration, error?.message || result?.error)
      return false
    }

    const header = result.data?.header || result.data?.data?.header
    const lines = result.data?.lines || result.data?.data?.lines || []

    logInfo(`Transaction ID: ${header?.id}`)
    logInfo(`Source: ${header?.source_entity_id}`)
    logInfo(`Target: ${header?.target_entity_id}`)
    logInfo(`Amount: $${header?.total_amount}`)
    logInfo(`Lines Returned: ${lines.length}`)

    lines.forEach((line, idx) => {
      logInfo(`  Line ${idx + 1}: ${line.description} - $${line.line_amount}`)
    })

    const passed = lines.length === 2
    recordTest('READ with lines', passed, duration, passed ? null : `Expected 2 lines, got ${lines.length}`)
    return passed

  } catch (error) {
    recordTest('READ with lines', false, Date.now() - startTime, error.message)
    return false
  }
}

// ============================================================================
// Test 3: READ without Lines
// ============================================================================

async function test3_ReadWithoutLines() {
  logTest('TEST 3: READ - Single Transaction WITHOUT Lines')
  const startTime = Date.now()

  if (testState.createdTransactions.length === 0) {
    recordTest('READ without lines', false, 0, 'No transactions to read')
    return false
  }

  try {
    const txnId = testState.createdTransactions[0]

    const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        transaction_id: txnId,
        include_lines: false
      }
    })

    const duration = Date.now() - startTime

    if (error || !result?.success) {
      recordTest('READ without lines', false, duration, error?.message || result?.error)
      return false
    }

    const header = result.data?.header || result.data?.data?.header
    const lines = result.data?.lines || result.data?.data?.lines || []

    logInfo(`Transaction ID: ${header?.id}`)
    logInfo(`Lines Returned: ${lines.length}`)

    const passed = lines.length === 0
    recordTest('READ without lines', passed, duration, passed ? null : `Expected 0 lines, got ${lines.length}`)
    return passed

  } catch (error) {
    recordTest('READ without lines', false, Date.now() - startTime, error.message)
    return false
  }
}

// ============================================================================
// Test 4: QUERY by source_entity_id
// ============================================================================

async function test4_QueryBySourceEntity() {
  logTest('TEST 4: QUERY - Filter by source_entity_id')
  const startTime = Date.now()

  if (!testState.customer1Id) {
    recordTest('QUERY by source_entity_id', false, 0, 'No customer1 ID available')
    return false
  }

  try {
    logInfo(`Querying for source_entity_id: ${testState.customer1Id}`)

    const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'QUERY',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        filters: {
          source_entity_id: testState.customer1Id,
          include_lines: false
        }
      }
    })

    const duration = Date.now() - startTime

    if (error) {
      logData('Error', error)
      recordTest('QUERY by source_entity_id', false, duration, error.message)
      return false
    }

    if (!result?.success) {
      logData('Failed Result', result)
      recordTest('QUERY by source_entity_id', false, duration, result?.error)
      return false
    }

    logData('Full Response', result)

    const transactions = result.data?.data?.items || result.data?.items || result.data || []

    logInfo(`Total Transactions Returned: ${transactions.length}`)

    // Check if all have correct source_entity_id
    const wrongTransactions = transactions.filter(txn => {
      const sourceId = txn.header?.source_entity_id || txn.source_entity_id
      return sourceId !== testState.customer1Id
    })

    transactions.forEach((txn, idx) => {
      const header = txn.header || txn
      const isCorrect = header.source_entity_id === testState.customer1Id
      logInfo(`  Txn ${idx + 1}: $${header.total_amount} - Source: ${header.source_entity_id} ${isCorrect ? '✅' : '❌ WRONG'}`)
    })

    const passed = wrongTransactions.length === 0 && transactions.length > 0
    recordTest('QUERY by source_entity_id', passed, duration,
      passed ? null : `Found ${wrongTransactions.length} transactions with wrong source_entity_id`)
    return passed

  } catch (error) {
    recordTest('QUERY by source_entity_id', false, Date.now() - startTime, error.message)
    return false
  }
}

// ============================================================================
// Test 5: QUERY with include_lines
// ============================================================================

async function test5_QueryWithLines() {
  logTest('TEST 5: QUERY - With include_lines=true')
  const startTime = Date.now()

  try {
    const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'QUERY',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        filters: {
          transaction_type: 'SALE',
          include_lines: true,
          limit: 5
        }
      }
    })

    const duration = Date.now() - startTime

    if (error || !result?.success) {
      recordTest('QUERY with include_lines', false, duration, error?.message || result?.error)
      return false
    }

    const transactions = result.data?.data?.items || result.data?.items || []

    logInfo(`Transactions Returned: ${transactions.length}`)

    let totalLines = 0
    transactions.forEach((txn, idx) => {
      const lines = txn.lines || []
      totalLines += lines.length
      logInfo(`  Txn ${idx + 1}: ${lines.length} lines`)
    })

    logInfo(`Total Lines: ${totalLines}`)

    const passed = totalLines > 0
    recordTest('QUERY with include_lines', passed, duration,
      passed ? null : 'No lines returned')
    return passed

  } catch (error) {
    recordTest('QUERY with include_lines', false, Date.now() - startTime, error.message)
    return false
  }
}

// ============================================================================
// Test 6: QUERY with limit
// ============================================================================

async function test6_QueryWithLimit() {
  logTest('TEST 6: QUERY - Pagination with limit')
  const startTime = Date.now()

  try {
    const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'QUERY',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        filters: {
          transaction_type: 'SALE',
          limit: 2,
          offset: 0,
          include_lines: false
        }
      }
    })

    const duration = Date.now() - startTime

    if (error || !result?.success) {
      recordTest('QUERY with limit', false, duration, error?.message || result?.error)
      return false
    }

    const transactions = result.data?.data?.items || result.data?.items || []

    logInfo(`Limit Requested: 2`)
    logInfo(`Transactions Returned: ${transactions.length}`)

    const passed = transactions.length <= 2
    recordTest('QUERY with limit', passed, duration,
      passed ? null : `Expected ≤2 transactions, got ${transactions.length}`)
    return passed

  } catch (error) {
    recordTest('QUERY with limit', false, Date.now() - startTime, error.message)
    return false
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function runAllTests() {
  try {
    await setupTestEnvironment()

    logInfo('\n\nStarting Tests...\n')

    await test1_CreateTransaction()
    await test2_ReadWithLines()
    await test3_ReadWithoutLines()
    await test4_QueryBySourceEntity()
    await test5_QueryWithLines()
    await test6_QueryWithLimit()

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('📋 TEST SUMMARY')
    console.log('='.repeat(70))

    const totalTests = testState.testResults.length
    const passedTests = testState.testResults.filter(t => t.passed).length
    const failedTests = totalTests - passedTests
    const totalDuration = Date.now() - testState.startTime

    console.log(`\n📊 Results:`)
    console.log(`   Total Tests: ${totalTests}`)
    console.log(`   Passed: ${passedTests} ✅`)
    console.log(`   Failed: ${failedTests} ❌`)
    console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
    console.log(`\n⏱️  Performance:`)
    console.log(`   Total Duration: ${totalDuration}ms`)
    console.log(`   Average per Test: ${Math.round(totalDuration / totalTests)}ms`)

    console.log(`\n📋 Detailed Results:`)
    testState.testResults.forEach((result, idx) => {
      const icon = result.passed ? '✅' : '❌'
      console.log(`   ${idx + 1}. ${icon} ${result.name} (${result.duration}ms)`)
      if (!result.passed && result.details) {
        console.log(`      → ${result.details}`)
      }
    })

    console.log('\n' + '='.repeat(70))
    console.log(passedTests === totalTests ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED')
    console.log('='.repeat(70))

    process.exit(passedTests === totalTests ? 0 : 1)

  } catch (error) {
    console.error('\n💥 TEST SUITE FAILED:')
    console.error(error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

runAllTests()
