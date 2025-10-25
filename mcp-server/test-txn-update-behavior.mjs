#!/usr/bin/env node

/**
 * Test hera_txn_crud_v1 UPDATE behavior
 *
 * Purpose: Verify what data is returned after UPDATE action
 * and whether it reflects the updated values immediately
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Test configuration
const TEST_CONFIG = {
  organizationId: '378f24fb-d496-4ff7-8afa-ea34895a0eb8', // Valid organization with user
  actorUserId: '8bafb26b-9fae-491d-a399-816cc7925753' // Valid user entity
}

console.log('🧪 Testing hera_txn_crud_v1 UPDATE behavior\n')
console.log('Configuration:', TEST_CONFIG)
console.log('=' .repeat(80))

/**
 * Step 1: Create a test transaction
 */
async function createTestTransaction() {
  console.log('\n📝 STEP 1: Creating test transaction...')

  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: TEST_CONFIG.actorUserId,
    p_organization_id: TEST_CONFIG.organizationId,
    p_payload: {
      header: {
        organization_id: TEST_CONFIG.organizationId,
        transaction_type: 'TEST_UPDATE',
        transaction_code: `TEST-UPDATE-${Date.now()}`,
        smart_code: 'HERA.TEST.TXN.UPDATE.BEHAVIOR.v1',
        transaction_date: new Date().toISOString(),
        transaction_status: 'draft',
        total_amount: 100,
        metadata: {
          test_field: 'original_value',
          created_for_testing: true
        }
      },
      lines: []
    }
  })

  if (error) {
    console.error('❌ CREATE Error:', error)
    throw error
  }

  if (!data?.success || !data?.data?.success) {
    console.error('❌ CREATE Failed:', data)
    throw new Error('Failed to create test transaction')
  }

  const transactionId = data.data.transaction_id || data.transaction_id
  const createdTransaction = data.data.data

  console.log('✅ CREATE Success')
  console.log('   Transaction ID:', transactionId)
  console.log('   Initial Status:', createdTransaction.header?.transaction_status)
  console.log('   Initial Metadata:', JSON.stringify(createdTransaction.header?.metadata, null, 2))

  return { transactionId, createdTransaction }
}

/**
 * Step 2: Update the transaction and examine the response
 */
async function updateTransaction(transactionId) {
  console.log('\n🔄 STEP 2: Updating transaction...')
  console.log('   Updating status: draft → approved')
  console.log('   Updating metadata: test_field → updated_value')

  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'UPDATE',
    p_actor_user_id: TEST_CONFIG.actorUserId,
    p_organization_id: TEST_CONFIG.organizationId,
    p_payload: {
      transaction_id: transactionId,
      patch: {
        transaction_status: 'approved',
        metadata: {
          test_field: 'updated_value',
          created_for_testing: true,
          updated_at_timestamp: new Date().toISOString()
        }
      }
    }
  })

  if (error) {
    console.error('❌ UPDATE Error:', error)
    throw error
  }

  console.log('\n📊 UPDATE Response Structure:')
  console.log('   Outer action:', data?.action)
  console.log('   Outer success:', data?.success)
  console.log('   Inner action:', data?.data?.action)
  console.log('   Inner success:', data?.data?.success)
  console.log('   Transaction ID:', data?.transaction_id)

  // Extract the returned transaction data
  const returnedTransaction = data?.data?.data

  console.log('\n🔍 Returned Transaction Data:')
  console.log('   Has header?', !!returnedTransaction?.header)
  console.log('   Has lines?', !!returnedTransaction?.lines)

  if (returnedTransaction?.header) {
    console.log('\n   Header Fields:')
    console.log('   - ID:', returnedTransaction.header.id)
    console.log('   - Transaction Code:', returnedTransaction.header.transaction_code)
    console.log('   - Status (CRITICAL):', returnedTransaction.header.transaction_status)
    console.log('   - Metadata:', JSON.stringify(returnedTransaction.header.metadata, null, 2))
    console.log('   - Updated At:', returnedTransaction.header.updated_at)
  }

  return { updateResponse: data, returnedTransaction }
}

/**
 * Step 3: Query the transaction directly to verify actual DB state
 */
async function queryTransactionDirect(transactionId) {
  console.log('\n🔍 STEP 3: Querying transaction directly from DB...')

  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: TEST_CONFIG.actorUserId,
    p_organization_id: TEST_CONFIG.organizationId,
    p_payload: {
      transaction_id: transactionId
    }
  })

  if (error) {
    console.error('❌ READ Error:', error)
    throw error
  }

  const queriedTransaction = data?.data?.data

  console.log('✅ READ Success')
  console.log('   Status from direct query:', queriedTransaction?.header?.transaction_status)
  console.log('   Metadata from direct query:', JSON.stringify(queriedTransaction?.header?.metadata, null, 2))
  console.log('   Updated At:', queriedTransaction?.header?.updated_at)

  return queriedTransaction
}

/**
 * Step 4: Compare UPDATE response vs Direct READ
 */
function compareResults(returnedTransaction, queriedTransaction) {
  console.log('\n🔬 STEP 4: Comparing UPDATE response vs Direct READ...')
  console.log('=' .repeat(80))

  const returnedStatus = returnedTransaction?.header?.transaction_status
  const queriedStatus = queriedTransaction?.header?.transaction_status
  const returnedMetadata = returnedTransaction?.header?.metadata
  const queriedMetadata = queriedTransaction?.header?.metadata

  console.log('\n📊 Status Comparison:')
  console.log('   UPDATE returned:', returnedStatus)
  console.log('   Direct READ returned:', queriedStatus)
  console.log('   Match?', returnedStatus === queriedStatus ? '✅ YES' : '❌ NO')

  console.log('\n📊 Metadata Comparison:')
  console.log('   UPDATE returned test_field:', returnedMetadata?.test_field)
  console.log('   Direct READ returned test_field:', queriedMetadata?.test_field)
  console.log('   Match?', returnedMetadata?.test_field === queriedMetadata?.test_field ? '✅ YES' : '❌ NO')

  console.log('\n📊 Updated At Comparison:')
  console.log('   UPDATE returned:', returnedTransaction?.header?.updated_at)
  console.log('   Direct READ returned:', queriedTransaction?.header?.updated_at)
  console.log('   Match?', returnedTransaction?.header?.updated_at === queriedTransaction?.header?.updated_at ? '✅ YES' : '❌ NO')

  // Final verdict
  const allMatch = (
    returnedStatus === queriedStatus &&
    returnedMetadata?.test_field === queriedMetadata?.test_field &&
    returnedTransaction?.header?.updated_at === queriedTransaction?.header?.updated_at
  )

  console.log('\n🏁 FINAL VERDICT:')
  if (allMatch) {
    console.log('   ✅ UPDATE returns FRESH data - all values match')
  } else {
    console.log('   ❌ UPDATE returns STALE data - values do NOT match')
    console.log('   ⚠️  This explains why the UI is not updating!')
    console.log('   💡 Solution: Invalidate cache and force refetch after UPDATE')
  }

  return allMatch
}

/**
 * Step 5: Cleanup - Delete test transaction
 */
async function cleanup(transactionId) {
  console.log('\n🧹 STEP 5: Cleaning up test transaction...')

  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'DELETE',
    p_actor_user_id: TEST_CONFIG.actorUserId,
    p_organization_id: TEST_CONFIG.organizationId,
    p_payload: {
      transaction_id: transactionId
    }
  })

  if (error) {
    console.warn('⚠️ Cleanup Error:', error.message)
  } else {
    console.log('✅ Test transaction deleted')
  }
}

/**
 * Main test execution
 */
async function runTest() {
  let transactionId = null

  try {
    // Step 1: Create test transaction
    const { transactionId: id, createdTransaction } = await createTestTransaction()
    transactionId = id

    // Wait a moment to ensure DB write is complete
    await new Promise(resolve => setTimeout(resolve, 500))

    // Step 2: Update transaction and examine response
    const { returnedTransaction } = await updateTransaction(transactionId)

    // Wait a moment to ensure DB write is complete
    await new Promise(resolve => setTimeout(resolve, 500))

    // Step 3: Query transaction directly
    const queriedTransaction = await queryTransactionDirect(transactionId)

    // Step 4: Compare results
    const match = compareResults(returnedTransaction, queriedTransaction)

    // Step 5: Cleanup
    await cleanup(transactionId)

    console.log('\n' + '=' .repeat(80))
    console.log('🧪 Test Complete!')
    console.log('=' .repeat(80))

    process.exit(match ? 0 : 1)

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message)

    // Attempt cleanup
    if (transactionId) {
      await cleanup(transactionId).catch(() => {})
    }

    process.exit(1)
  }
}

// Run the test
runTest()
