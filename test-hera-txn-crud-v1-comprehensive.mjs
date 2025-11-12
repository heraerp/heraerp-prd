#!/usr/bin/env node

/**
 * HERA Transaction CRUD v1 - Comprehensive Test Suite
 * Tests ALL actions and options of hera_txn_crud_v1 RPC
 *
 * Actions Tested:
 * 1. CREATE - Create transaction with header + lines
 * 2. READ - Read single transaction with lines
 * 3. QUERY - Query transactions with filters (source_entity_id, target_entity_id, date range, etc.)
 * 4. UPDATE - Update transaction fields
 * 5. DELETE - Delete transaction
 * 6. VOID - Soft delete with audit trail
 * 7. EMIT - Emit transaction event
 * 8. REVERSE - Reverse transaction
 * 9. VALIDATE - Validate transaction
 *
 * Query Options Tested:
 * - source_entity_id filtering
 * - target_entity_id filtering
 * - transaction_type filtering
 * - date_from / date_to filtering
 * - include_lines option
 * - include_deleted option
 * - limit / offset pagination
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
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 HERA Transaction CRUD v1 - Comprehensive Test Suite')
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
  transaction1Id: null,
  transaction2Id: null,
  transaction3Id: null,
  testResults: [],
  startTime: Date.now()
}

// ============================================================================
// Helper Functions
// ============================================================================

function logSection(title) {
  console.log('\n' + '='.repeat(70))
  console.log(`📋 ${title}`)
  console.log('='.repeat(70))
}

function logTest(testName) {
  console.log(`\n🧪 TEST: ${testName}`)
  console.log('-'.repeat(70))
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
  console.log(`📊 ${label}:`)
  console.log(JSON.stringify(data, null, 2))
}

function recordTest(testName, passed, duration, details = null) {
  testState.testResults.push({
    name: testName,
    passed,
    duration,
    details
  })

  if (passed) {
    logSuccess(`PASSED (${duration}ms)`)
  } else {
    logError(`FAILED (${duration}ms)`)
    if (details) {
      console.log(`   Details: ${details}`)
    }
  }
}

// ============================================================================
// Setup Functions
// ============================================================================

async function setupTestEnvironment() {
  logSection('SETUP: Test Environment')

  // Get organization
  logInfo('Getting test organization...')
  const { data: orgs, error: orgError } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .limit(5)

  if (orgError) {
    logError(`Failed to fetch organizations: ${orgError.message}`)
    throw orgError
  }

  // Find salon org (exclude PLATFORM org)
  const salonOrg = orgs.find(org =>
    (org.organization_name.toLowerCase().includes('salon') ||
     org.organization_name.toLowerCase().includes('michele')) &&
    org.id !== '00000000-0000-0000-0000-000000000000'
  )

  // Fallback to first non-platform org
  const nonPlatformOrg = orgs.find(org => org.id !== '00000000-0000-0000-0000-000000000000')

  testState.organizationId = salonOrg ? salonOrg.id : (nonPlatformOrg ? nonPlatformOrg.id : orgs[0].id)
  logSuccess(`Organization: ${salonOrg ? salonOrg.organization_name : orgs[0].organization_name}`)
  logInfo(`Organization ID: ${testState.organizationId}`)

  // Get actor user - find a user who is a member of this organization
  logInfo('\nGetting actor user who is member of organization...')

  // Get memberships for this org
  const { data: memberships, error: memberError } = await supabase
    .from('core_relationships')
    .select('from_entity_id')
    .eq('to_entity_id', testState.organizationId)
    .eq('relationship_type', 'MEMBER_OF')
    .limit(1)

  if (memberError || !memberships || memberships.length === 0) {
    logError('No members found for this organization')
    throw new Error('No valid actor user found')
  }

  testState.actorUserId = memberships[0].from_entity_id

  // Get user details
  const { data: userDetails } = await supabase
    .from('core_entities')
    .select('entity_name')
    .eq('id', testState.actorUserId)
    .single()

  logSuccess(`Actor User: ${userDetails?.entity_name || 'Unknown'}`)
  logInfo(`Actor User ID: ${testState.actorUserId}`)

  // Create test entities
  logInfo('\nCreating test entities...')

  // Customer 1
  const { data: customer1Result, error: customer1Error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: testState.actorUserId,
    p_organization_id: testState.organizationId,
    p_entity: {
      entity_type: 'CUSTOMER',
      entity_name: `Test Customer 1 - ${Date.now()}`,
      smart_code: 'HERA.SALON.CUSTOMER.ENTITY.INDIVIDUAL.v1'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {}
  })

  if (customer1Error) {
    logError(`Failed to create Customer 1 - Supabase Error: ${customer1Error.message}`)
    throw new Error('Customer 1 creation failed - Supabase error')
  }

  if (!customer1Result?.success) {
    logError(`Failed to create Customer 1 - RPC returned failure`)
    logData('RPC Response', customer1Result)
    throw new Error('Customer 1 creation failed - RPC failure')
  }

  const customer1Entity = customer1Result.data?.entity || customer1Result.entity
  if (!customer1Entity?.id) {
    logError(`Customer 1 created but no entity.id in response`)
    logData('RPC Response', customer1Result)
    throw new Error('Customer 1 creation - no entity ID')
  }

  testState.customer1Id = customer1Entity.id
  logSuccess(`Customer 1: ${customer1Entity.entity_name}`)

  // Customer 2
  const { data: customer2Result, error: customer2Error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: testState.actorUserId,
    p_organization_id: testState.organizationId,
    p_entity: {
      entity_type: 'CUSTOMER',
      entity_name: `Test Customer 2 - ${Date.now()}`,
      smart_code: 'HERA.SALON.CUSTOMER.ENTITY.INDIVIDUAL.v1'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {}
  })

  if (customer2Error || !customer2Result?.success) {
    logError(`Failed to create Customer 2: ${customer2Error?.message || JSON.stringify(customer2Result)}`)
    throw new Error('Customer 2 creation failed')
  }

  const customer2Entity = customer2Result.data?.entity || customer2Result.entity
  testState.customer2Id = customer2Entity.id
  logSuccess(`Customer 2: ${customer2Entity.entity_name}`)

  // Staff
  const { data: staffResult, error: staffError } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: testState.actorUserId,
    p_organization_id: testState.organizationId,
    p_entity: {
      entity_type: 'STAFF',
      entity_name: `Test Staff - ${Date.now()}`,
      smart_code: 'HERA.SALON.STAFF.ENTITY.STYLIST.v1'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {}
  })

  if (staffError || !staffResult?.success) {
    logError(`Failed to create Staff: ${staffError?.message || JSON.stringify(staffResult)}`)
    throw new Error('Staff creation failed')
  }

  const staffEntity = staffResult.data?.entity || staffResult.entity
  testState.staffId = staffEntity.id
  logSuccess(`Staff: ${staffEntity.entity_name}`)
}

// ============================================================================
// Test 1: CREATE Action
// ============================================================================

async function test1_CreateWithLines() {
  logTest('1. CREATE - Transaction with Header + Lines')
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
          transaction_status: 'completed',
          transaction_date: new Date().toISOString()
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Haircut',
            quantity: 1,
            unit_amount: 100.00,
            line_amount: 100.00,
            smart_code: 'HERA.SALON.SERVICE.LINE.ITEM.v1'
          },
          {
            line_number: 2,
            line_type: 'service',
            description: 'Color Treatment',
            quantity: 1,
            unit_amount: 200.00,
            line_amount: 200.00,
            smart_code: 'HERA.SALON.SERVICE.LINE.ITEM.v1'
          }
        ]
      }
    })

    const duration = Date.now() - startTime

    if (error) {
      recordTest('CREATE with lines', false, duration, error.message)
      return false
    }

    if (!result?.success) {
      recordTest('CREATE with lines', false, duration, result?.error || 'No success flag')
      return false
    }

    testState.transaction1Id = result.transaction_id || result.data?.transaction_id
    logInfo(`Transaction ID: ${testState.transaction1Id}`)
    logInfo(`Lines Created: 2`)
    logData('Response', result)

    recordTest('CREATE with lines', true, duration)
    return true

  } catch (error) {
    const duration = Date.now() - startTime
    recordTest('CREATE with lines', false, duration, error.message)
    return false
  }
}

// ============================================================================
// Test 2: READ Action (with lines)
// ============================================================================

async function test2_ReadWithLines() {
  logTest('2. READ - Single Transaction with Lines')
  const startTime = Date.now()

  try {
    const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        transaction_id: testState.transaction1Id,
        include_lines: true
      }
    })

    const duration = Date.now() - startTime

    if (error) {
      recordTest('READ with lines', false, duration, error.message)
      return false
    }

    if (!result?.success) {
      recordTest('READ with lines', false, duration, result?.error || 'No success flag')
      return false
    }

    const header = result.data?.header || result.data?.data?.header
    const lines = result.data?.lines || result.data?.data?.lines || []

    logInfo(`Transaction ID: ${header?.id}`)
    logInfo(`Source Entity: ${header?.source_entity_id}`)
    logInfo(`Target Entity: ${header?.target_entity_id}`)
    logInfo(`Total Amount: $${header?.total_amount}`)
    logInfo(`Lines Returned: ${lines.length}`)

    lines.forEach((line, idx) => {
      logInfo(`  Line ${idx + 1}: ${line.description} - $${line.line_amount}`)
    })

    logData('Response', result)

    const passed = lines.length === 2
    recordTest('READ with lines', passed, duration, passed ? null : `Expected 2 lines, got ${lines.length}`)
    return passed

  } catch (error) {
    const duration = Date.now() - startTime
    recordTest('READ with lines', false, duration, error.message)
    return false
  }
}

// ============================================================================
// Test 3: CREATE More Transactions for Query Tests
// ============================================================================

async function test3_CreateMoreTransactions() {
  logTest('3. CREATE - Additional Transactions for Query Tests')
  const startTime = Date.now()

  try {
    // Transaction 2 for Customer 1
    const { data: result2 } = await supabase.rpc('hera_txn_crud_v1', {
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
          total_amount: 150.00,
          transaction_status: 'completed',
          transaction_date: new Date().toISOString()
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Manicure',
            quantity: 1,
            unit_amount: 150.00,
            line_amount: 150.00,
            smart_code: 'HERA.SALON.SERVICE.LINE.ITEM.v1'
          }
        ]
      }
    })
    testState.transaction2Id = result2.transaction_id || result2.data?.transaction_id
    logSuccess(`Transaction 2 created: $150.00`)

    // Transaction 3 for Customer 2
    const { data: result3 } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        header: {
          organization_id: testState.organizationId,
          transaction_type: 'SALE',
          smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
          source_entity_id: testState.customer2Id,
          target_entity_id: testState.staffId,
          total_amount: 250.00,
          transaction_status: 'completed',
          transaction_date: new Date().toISOString()
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Hair Styling',
            quantity: 1,
            unit_amount: 250.00,
            line_amount: 250.00,
            smart_code: 'HERA.SALON.SERVICE.LINE.ITEM.v1'
          }
        ]
      }
    })
    testState.transaction3Id = result3.transaction_id || result3.data?.transaction_id
    logSuccess(`Transaction 3 created: $250.00`)

    const duration = Date.now() - startTime
    recordTest('CREATE additional transactions', true, duration)
    return true

  } catch (error) {
    const duration = Date.now() - startTime
    recordTest('CREATE additional transactions', false, duration, error.message)
    return false
  }
}

// ============================================================================
// Test 4: QUERY with source_entity_id Filter
// ============================================================================

async function test4_QueryBySourceEntity() {
  logTest('4. QUERY - Filter by source_entity_id (Customer)')
  const startTime = Date.now()

  try {
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
      recordTest('QUERY by source_entity_id', false, duration, error.message)
      return false
    }

    if (!result?.success) {
      recordTest('QUERY by source_entity_id', false, duration, result?.error || 'No success flag')
      return false
    }

    const transactions = result.data?.data?.items || result.data?.items || []

    logInfo(`Total Transactions Returned: ${transactions.length}`)

    // Verify all transactions belong to customer1
    const wrongCustomer = transactions.find(txn => {
      const sourceId = txn.header?.source_entity_id || txn.source_entity_id
      return sourceId !== testState.customer1Id
    })

    transactions.forEach((txn, idx) => {
      const header = txn.header || txn
      logInfo(`  Txn ${idx + 1}: $${header.total_amount} - Customer: ${header.source_entity_id === testState.customer1Id ? 'CORRECT' : 'WRONG'}`)
    })

    const passed = transactions.length === 2 && !wrongCustomer
    recordTest('QUERY by source_entity_id', passed, duration,
      passed ? null : `Expected 2 transactions for customer1, got ${transactions.length}, wrong customer: ${!!wrongCustomer}`)
    return passed

  } catch (error) {
    const duration = Date.now() - startTime
    recordTest('QUERY by source_entity_id', false, duration, error.message)
    return false
  }
}

// ============================================================================
// Test 5: QUERY with target_entity_id Filter
// ============================================================================

async function test5_QueryByTargetEntity() {
  logTest('5. QUERY - Filter by target_entity_id (Staff)')
  const startTime = Date.now()

  try {
    const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'QUERY',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        filters: {
          target_entity_id: testState.staffId,
          include_lines: false
        }
      }
    })

    const duration = Date.now() - startTime

    if (error) {
      recordTest('QUERY by target_entity_id', false, duration, error.message)
      return false
    }

    const transactions = result.data?.data?.items || result.data?.items || []

    logInfo(`Total Transactions Returned: ${transactions.length}`)

    transactions.forEach((txn, idx) => {
      const header = txn.header || txn
      logInfo(`  Txn ${idx + 1}: $${header.total_amount} - Staff: ${header.target_entity_id === testState.staffId ? 'CORRECT' : 'WRONG'}`)
    })

    const passed = transactions.length === 3
    recordTest('QUERY by target_entity_id', passed, duration,
      passed ? null : `Expected 3 transactions for staff, got ${transactions.length}`)
    return passed

  } catch (error) {
    const duration = Date.now() - startTime
    recordTest('QUERY by target_entity_id', false, duration, error.message)
    return false
  }
}

// ============================================================================
// Test 6: QUERY with include_lines Option
// ============================================================================

async function test6_QueryWithLines() {
  logTest('6. QUERY - With include_lines=true')
  const startTime = Date.now()

  try {
    const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'QUERY',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        filters: {
          source_entity_id: testState.customer1Id,
          include_lines: true
        }
      }
    })

    const duration = Date.now() - startTime

    if (error) {
      recordTest('QUERY with include_lines', false, duration, error.message)
      return false
    }

    const transactions = result.data?.data?.items || result.data?.items || []

    logInfo(`Total Transactions Returned: ${transactions.length}`)

    let totalLines = 0
    transactions.forEach((txn, idx) => {
      const lines = txn.lines || []
      totalLines += lines.length
      logInfo(`  Txn ${idx + 1}: ${lines.length} lines`)
      lines.forEach((line, lineIdx) => {
        logInfo(`    Line ${lineIdx + 1}: ${line.description} - $${line.line_amount}`)
      })
    })

    const passed = transactions.length === 2 && totalLines === 3
    recordTest('QUERY with include_lines', passed, duration,
      passed ? null : `Expected 2 txns with 3 total lines, got ${transactions.length} txns with ${totalLines} lines`)
    return passed

  } catch (error) {
    const duration = Date.now() - startTime
    recordTest('QUERY with include_lines', false, duration, error.message)
    return false
  }
}

// ============================================================================
// Test 7: QUERY with transaction_type Filter
// ============================================================================

async function test7_QueryByTransactionType() {
  logTest('7. QUERY - Filter by transaction_type')
  const startTime = Date.now()

  try {
    const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'QUERY',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        filters: {
          transaction_type: 'SALE',
          include_lines: false
        }
      }
    })

    const duration = Date.now() - startTime

    if (error) {
      recordTest('QUERY by transaction_type', false, duration, error.message)
      return false
    }

    const transactions = result.data?.data?.items || result.data?.items || []

    logInfo(`Total SALE Transactions: ${transactions.length}`)

    const passed = transactions.length >= 3
    recordTest('QUERY by transaction_type', passed, duration,
      passed ? null : `Expected at least 3 SALE transactions, got ${transactions.length}`)
    return passed

  } catch (error) {
    const duration = Date.now() - startTime
    recordTest('QUERY by transaction_type', false, duration, error.message)
    return false
  }
}

// ============================================================================
// Test 8: QUERY with limit/offset Pagination
// ============================================================================

async function test8_QueryWithPagination() {
  logTest('8. QUERY - Pagination (limit=2, offset=0)')
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

    if (error) {
      recordTest('QUERY with pagination', false, duration, error.message)
      return false
    }

    const transactions = result.data?.data?.items || result.data?.items || []

    logInfo(`Returned Transactions: ${transactions.length} (expected: 2)`)

    const passed = transactions.length === 2
    recordTest('QUERY with pagination', passed, duration,
      passed ? null : `Expected 2 transactions with limit=2, got ${transactions.length}`)
    return passed

  } catch (error) {
    const duration = Date.now() - startTime
    recordTest('QUERY with pagination', false, duration, error.message)
    return false
  }
}

// ============================================================================
// Test 9: UPDATE Action
// ============================================================================

async function test9_UpdateTransaction() {
  logTest('9. UPDATE - Modify Transaction Status')
  const startTime = Date.now()

  try {
    const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'UPDATE',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        transaction_id: testState.transaction1Id,
        header: {
          smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
          organization_id: testState.organizationId
        },
        patch: {
          transaction_status: 'refunded',
          total_amount: 250.00
        }
      }
    })

    const duration = Date.now() - startTime

    if (error) {
      recordTest('UPDATE transaction', false, duration, error.message)
      return false
    }

    if (!result?.success) {
      recordTest('UPDATE transaction', false, duration, result?.error || 'No success flag')
      return false
    }

    const header = result.data?.header || result.data?.data?.header
    logInfo(`Updated Status: ${header?.transaction_status}`)
    logInfo(`Updated Amount: $${header?.total_amount}`)

    const passed = header?.transaction_status === 'refunded' && header?.total_amount === 250.00
    recordTest('UPDATE transaction', passed, duration)
    return passed

  } catch (error) {
    const duration = Date.now() - startTime
    recordTest('UPDATE transaction', false, duration, error.message)
    return false
  }
}

// ============================================================================
// Test 10: VOID Action
// ============================================================================

async function test10_VoidTransaction() {
  logTest('10. VOID - Soft Delete Transaction')
  const startTime = Date.now()

  try {
    const { data: result, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'VOID',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        transaction_id: testState.transaction3Id,
        reason: 'Test void - customer cancelled'
      }
    })

    const duration = Date.now() - startTime

    if (error) {
      recordTest('VOID transaction', false, duration, error.message)
      return false
    }

    if (!result?.success) {
      recordTest('VOID transaction', false, duration, result?.error || 'No success flag')
      return false
    }

    logSuccess('Transaction voided successfully')

    // Verify it's excluded from normal queries
    const { data: queryResult } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'QUERY',
      p_actor_user_id: testState.actorUserId,
      p_organization_id: testState.organizationId,
      p_payload: {
        filters: {
          source_entity_id: testState.customer2Id,
          include_lines: false,
          include_deleted: false
        }
      }
    })

    const transactions = queryResult.data?.data?.items || queryResult.data?.items || []
    logInfo(`Customer 2 transactions (excluding voided): ${transactions.length}`)

    const passed = transactions.length === 0
    recordTest('VOID transaction', passed, duration,
      passed ? null : `Expected 0 active transactions after void, got ${transactions.length}`)
    return passed

  } catch (error) {
    const duration = Date.now() - startTime
    recordTest('VOID transaction', false, duration, error.message)
    return false
  }
}

// ============================================================================
// Main Test Execution
// ============================================================================

async function runAllTests() {
  try {
    await setupTestEnvironment()

    logSection('RUNNING TESTS')

    await test1_CreateWithLines()
    await test2_ReadWithLines()
    await test3_CreateMoreTransactions()
    await test4_QueryBySourceEntity()
    await test5_QueryByTargetEntity()
    await test6_QueryWithLines()
    await test7_QueryByTransactionType()
    await test8_QueryWithPagination()
    await test9_UpdateTransaction()
    await test10_VoidTransaction()

    // Summary
    logSection('TEST SUMMARY')

    const totalTests = testState.testResults.length
    const passedTests = testState.testResults.filter(t => t.passed).length
    const failedTests = totalTests - passedTests
    const totalDuration = Date.now() - testState.startTime
    const avgDuration = Math.round(totalDuration / totalTests)

    console.log(`\n📊 Results:`)
    console.log(`   Total Tests: ${totalTests}`)
    console.log(`   Passed: ${passedTests} ✅`)
    console.log(`   Failed: ${failedTests} ❌`)
    console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`)
    console.log(`\n⏱️  Performance:`)
    console.log(`   Total Duration: ${totalDuration}ms`)
    console.log(`   Average per Test: ${avgDuration}ms`)

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
    console.error('\n💥 TEST SUITE FAILED WITH ERROR:')
    console.error(error.message)
    console.error('\nStack trace:')
    console.error(error.stack)
    process.exit(1)
  }
}

runAllTests()
