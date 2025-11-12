#!/usr/bin/env node

/**
 * HERA Transaction Query Filtering Test
 * Tests hera_txn_crud_v1 QUERY action with source_entity_id filtering
 *
 * Purpose: Verify customer transaction history filtering works correctly
 *
 * Test Steps:
 * 1. Create test customer entities
 * 2. Create transactions for different customers
 * 3. Query transactions filtered by source_entity_id
 * 4. Verify only the correct customer's transactions are returned
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

console.log('🧪 HERA Transaction Query Filtering Test')
console.log('==========================================')
console.log('')

// ============================================================================
// Test Data
// ============================================================================

let organizationId = null
let actorUserId = null
let customer1Id = null
let customer2Id = null
let transaction1Id = null
let transaction2Id = null
let transaction3Id = null

// ============================================================================
// Helper Functions
// ============================================================================

function logStep(step, message) {
  console.log(`\n${step} ${message}`)
  console.log('-'.repeat(60))
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

// ============================================================================
// Test Steps
// ============================================================================

async function step1_GetOrganization() {
  logStep('STEP 1:', 'Get Test Organization')

  const { data: orgs, error } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .limit(5)

  if (error) {
    logError(`Failed to fetch organizations: ${error.message}`)
    throw error
  }

  // Find salon or use first org
  const salonOrg = orgs.find(org =>
    org.organization_name.toLowerCase().includes('salon') ||
    org.organization_name.toLowerCase().includes('michele')
  )

  organizationId = salonOrg ? salonOrg.id : orgs[0].id
  logSuccess(`Using organization: ${salonOrg ? salonOrg.organization_name : orgs[0].organization_name}`)
  logInfo(`Organization ID: ${organizationId}`)
}

async function step2_GetActorUser() {
  logStep('STEP 2:', 'Get Actor User')

  // Get any user entity for the organization
  const { data: users, error } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'USER')
    .limit(1)

  if (error || !users || users.length === 0) {
    logError(`Failed to fetch user: ${error?.message || 'No users found'}`)
    // Use platform user as fallback
    actorUserId = '00000000-0000-0000-0000-000000000001'
    logInfo(`Using fallback actor: ${actorUserId}`)
  } else {
    actorUserId = users[0].id
    logSuccess(`Found actor user: ${users[0].entity_name}`)
    logInfo(`Actor User ID: ${actorUserId}`)
  }
}

async function step3_CreateTestCustomers() {
  logStep('STEP 3:', 'Create Test Customers')

  // Create Customer 1
  const { data: customer1Result, error: error1 } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: actorUserId,
    p_organization_id: organizationId,
    p_entity: {
      entity_type: 'CUSTOMER',
      entity_name: `Test Customer 1 - ${Date.now()}`,
      smart_code: 'HERA.SALON.CUSTOMER.ENTITY.INDIVIDUAL.v1'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {}
  })

  if (error1 || !customer1Result?.success) {
    logError(`Failed to create Customer 1: ${error1?.message || customer1Result?.error}`)
    throw new Error('Customer 1 creation failed')
  }

  customer1Id = customer1Result.entity.id
  logSuccess(`Created Customer 1: ${customer1Result.entity.entity_name}`)
  logInfo(`Customer 1 ID: ${customer1Id}`)

  // Create Customer 2
  const { data: customer2Result, error: error2 } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: actorUserId,
    p_organization_id: organizationId,
    p_entity: {
      entity_type: 'CUSTOMER',
      entity_name: `Test Customer 2 - ${Date.now()}`,
      smart_code: 'HERA.SALON.CUSTOMER.ENTITY.INDIVIDUAL.v1'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {}
  })

  if (error2 || !customer2Result?.success) {
    logError(`Failed to create Customer 2: ${error2?.message || customer2Result?.error}`)
    throw new Error('Customer 2 creation failed')
  }

  customer2Id = customer2Result.entity.id
  logSuccess(`Created Customer 2: ${customer2Result.entity.entity_name}`)
  logInfo(`Customer 2 ID: ${customer2Id}`)
}

async function step4_CreateTransactions() {
  logStep('STEP 4:', 'Create Test Transactions')

  // Transaction 1 for Customer 1
  const { data: txn1Result, error: error1 } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: actorUserId,
    p_organization_id: organizationId,
    p_payload: {
      header: {
        organization_id: organizationId,
        transaction_type: 'SALE',
        smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
        source_entity_id: customer1Id,
        total_amount: 100.00,
        transaction_status: 'completed'
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
        }
      ]
    }
  })

  if (error1 || !txn1Result?.success) {
    logError(`Failed to create Transaction 1: ${error1?.message || txn1Result?.error}`)
    throw new Error('Transaction 1 creation failed')
  }

  transaction1Id = txn1Result.transaction_id || txn1Result.data?.transaction_id
  logSuccess(`Created Transaction 1 for Customer 1: $100.00`)
  logInfo(`Transaction 1 ID: ${transaction1Id}`)

  // Transaction 2 for Customer 1
  const { data: txn2Result, error: error2 } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: actorUserId,
    p_organization_id: organizationId,
    p_payload: {
      header: {
        organization_id: organizationId,
        transaction_type: 'SALE',
        smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
        source_entity_id: customer1Id,
        total_amount: 200.00,
        transaction_status: 'completed'
      },
      lines: [
        {
          line_number: 1,
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

  if (error2 || !txn2Result?.success) {
    logError(`Failed to create Transaction 2: ${error2?.message || txn2Result?.error}`)
    throw new Error('Transaction 2 creation failed')
  }

  transaction2Id = txn2Result.transaction_id || txn2Result.data?.transaction_id
  logSuccess(`Created Transaction 2 for Customer 1: $200.00`)
  logInfo(`Transaction 2 ID: ${transaction2Id}`)

  // Transaction 3 for Customer 2
  const { data: txn3Result, error: error3 } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: actorUserId,
    p_organization_id: organizationId,
    p_payload: {
      header: {
        organization_id: organizationId,
        transaction_type: 'SALE',
        smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
        source_entity_id: customer2Id,
        total_amount: 150.00,
        transaction_status: 'completed'
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

  if (error3 || !txn3Result?.success) {
    logError(`Failed to create Transaction 3: ${error3?.message || txn3Result?.error}`)
    throw new Error('Transaction 3 creation failed')
  }

  transaction3Id = txn3Result.transaction_id || txn3Result.data?.transaction_id
  logSuccess(`Created Transaction 3 for Customer 2: $150.00`)
  logInfo(`Transaction 3 ID: ${transaction3Id}`)
}

async function step5_QueryCustomer1Transactions() {
  logStep('STEP 5:', 'Query Customer 1 Transactions (CRITICAL TEST)')

  logInfo(`Querying transactions for Customer 1: ${customer1Id}`)

  const { data: queryResult, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'QUERY',
    p_actor_user_id: actorUserId,
    p_organization_id: organizationId,
    p_payload: {
      filters: {
        source_entity_id: customer1Id,
        include_lines: true
      }
    }
  })

  if (error) {
    logError(`Query failed: ${error.message}`)
    throw error
  }

  if (!queryResult?.success) {
    logError(`Query returned failure: ${queryResult?.error}`)
    throw new Error('Query returned failure')
  }

  const transactions = queryResult.data?.data?.items || queryResult.data?.items || []

  console.log('\n📊 Query Result:')
  console.log(`   Total transactions returned: ${transactions.length}`)

  // Verify filtering
  const customer1Transactions = transactions.filter(txn => {
    const sourceId = txn.header?.source_entity_id || txn.source_entity_id
    return sourceId === customer1Id
  })

  const otherCustomerTransactions = transactions.filter(txn => {
    const sourceId = txn.header?.source_entity_id || txn.source_entity_id
    return sourceId !== customer1Id
  })

  console.log(`   Customer 1 transactions: ${customer1Transactions.length}`)
  console.log(`   Other customer transactions: ${otherCustomerTransactions.length}`)

  // Display transaction details
  transactions.forEach((txn, index) => {
    const header = txn.header || txn
    console.log(`\n   Transaction ${index + 1}:`)
    console.log(`      ID: ${header.id}`)
    console.log(`      Source Entity ID: ${header.source_entity_id}`)
    console.log(`      Amount: $${header.total_amount}`)
    console.log(`      Status: ${header.transaction_status}`)
  })

  // Validation
  if (customer1Transactions.length !== 2) {
    logError(`Expected 2 transactions for Customer 1, got ${customer1Transactions.length}`)
    return false
  }

  if (otherCustomerTransactions.length > 0) {
    logError(`❌ FILTERING FAILED: Found ${otherCustomerTransactions.length} transactions from other customers!`)
    return false
  }

  logSuccess('✅ FILTERING WORKS: Only Customer 1 transactions returned')
  return true
}

async function step6_QueryCustomer2Transactions() {
  logStep('STEP 6:', 'Query Customer 2 Transactions (Verification)')

  logInfo(`Querying transactions for Customer 2: ${customer2Id}`)

  const { data: queryResult, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'QUERY',
    p_actor_user_id: actorUserId,
    p_organization_id: organizationId,
    p_payload: {
      filters: {
        source_entity_id: customer2Id,
        include_lines: true
      }
    }
  })

  if (error) {
    logError(`Query failed: ${error.message}`)
    throw error
  }

  if (!queryResult?.success) {
    logError(`Query returned failure: ${queryResult?.error}`)
    throw new Error('Query returned failure')
  }

  const transactions = queryResult.data?.data?.items || queryResult.data?.items || []

  console.log('\n📊 Query Result:')
  console.log(`   Total transactions returned: ${transactions.length}`)

  // Verify filtering
  const customer2Transactions = transactions.filter(txn => {
    const sourceId = txn.header?.source_entity_id || txn.source_entity_id
    return sourceId === customer2Id
  })

  const otherCustomerTransactions = transactions.filter(txn => {
    const sourceId = txn.header?.source_entity_id || txn.source_entity_id
    return sourceId !== customer2Id
  })

  console.log(`   Customer 2 transactions: ${customer2Transactions.length}`)
  console.log(`   Other customer transactions: ${otherCustomerTransactions.length}`)

  // Validation
  if (customer2Transactions.length !== 1) {
    logError(`Expected 1 transaction for Customer 2, got ${customer2Transactions.length}`)
    return false
  }

  if (otherCustomerTransactions.length > 0) {
    logError(`❌ FILTERING FAILED: Found ${otherCustomerTransactions.length} transactions from other customers!`)
    return false
  }

  logSuccess('✅ FILTERING WORKS: Only Customer 2 transactions returned')
  return true
}

// ============================================================================
// Main Test Execution
// ============================================================================

async function runTests() {
  const startTime = Date.now()
  let allTestsPassed = true

  try {
    await step1_GetOrganization()
    await step2_GetActorUser()
    await step3_CreateTestCustomers()
    await step4_CreateTransactions()

    const test1Passed = await step5_QueryCustomer1Transactions()
    const test2Passed = await step6_QueryCustomer2Transactions()

    allTestsPassed = test1Passed && test2Passed

    // Summary
    console.log('\n')
    console.log('=' .repeat(60))
    console.log('📋 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`Customer 1 Query Test: ${test1Passed ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`Customer 2 Query Test: ${test2Passed ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`\nOverall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
    console.log(`Execution Time: ${Date.now() - startTime}ms`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:')
    console.error(error.message)
    console.error('\nStack trace:')
    console.error(error.stack)
    allTestsPassed = false
  }

  process.exit(allTestsPassed ? 0 : 1)
}

runTests()
