#!/usr/bin/env node
/**
 * Check Latest Transaction
 * Verify the most recent GL_JOURNAL transaction structure
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID
const TEST_USER_ID = process.env.DEFAULT_USER_ENTITY_ID || '00000000-0000-0000-0000-000000000001'

console.log('\n🔍 CHECKING LATEST GL_JOURNAL TRANSACTION')
console.log('='.repeat(60))

// Get the most recent GL_JOURNAL transaction
const { data: allData, error: allError } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: TEST_USER_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    transaction_type: 'GL_JOURNAL',
    smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
    limit: 10 // Get last 10 transactions
  }
})

if (allError) {
  console.log('❌ Query failed:', allError.message)
  process.exit(1)
}

const transactions = allData?.data?.data?.items || []

console.log(`\n📊 Found ${transactions.length} GL_JOURNAL transactions\n`)

if (transactions.length === 0) {
  console.log('⚠️  No GL_JOURNAL transactions found')
  console.log('   Create a POS sale to generate transactions')
  process.exit(0)
}

// Show the most recent transaction
const latest = transactions[0]

console.log('📋 LATEST TRANSACTION:')
console.log('  Transaction ID:', latest.id)
console.log('  Transaction Code:', latest.transaction_code)
console.log('  Transaction Date:', latest.transaction_date)
console.log('  Smart Code:', latest.smart_code)
console.log('  Total Amount:', latest.total_amount)
console.log('\n🔑 ENTITY FIELDS (KEY FOR FILTERING):')
console.log('  source_entity_id:', latest.source_entity_id || '❌ NULL')
console.log('  target_entity_id:', latest.target_entity_id || '❌ NULL')

console.log('\n📦 BUSINESS CONTEXT:')
console.log('  branch_id:', latest.business_context?.branch_id || '❌ NULL')
console.log('  customer_id:', latest.business_context?.customer_id || '❌ NULL')
console.log('  source:', latest.business_context?.source || '❌ NULL')

console.log('\n🧪 FILTERING TEST:')
console.log('  Branch in business_context.branch_id:', !!latest.business_context?.branch_id ? '✅ YES' : '❌ NO')
console.log('  Branch in target_entity_id (for reports):', !!latest.target_entity_id ? '✅ YES' : '❌ NO')
console.log('  Customer in source_entity_id:', !!latest.source_entity_id ? '✅ YES' : '❌ NO')

// Test if report filter would work
const testBranchId = latest.business_context?.branch_id || latest.target_entity_id || latest.source_entity_id

if (testBranchId) {
  console.log(`\n🧪 Testing branch filter with: ${testBranchId.substring(0, 8)}...`)

  const { data: branchData, error: branchError } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'QUERY',
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_payload: {
      transaction_type: 'GL_JOURNAL',
      smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
      target_entity_id: testBranchId, // Reports filter by target_entity_id
      limit: 100
    }
  })

  if (branchError) {
    console.log('❌ Branch filter failed:', branchError.message)
  } else {
    const branchTransactions = branchData?.data?.data?.items || []
    console.log(`  Filter by target_entity_id: ${branchTransactions.length} transactions`)

    if (branchTransactions.length === 0) {
      console.log('\n🚨 PROBLEM: target_entity_id filter returned 0 results!')
      console.log('   This means branch is NOT in target_entity_id field')
      console.log('   Check if POS code update was deployed correctly')
    } else {
      console.log('\n✅ Branch filter is working!')
    }
  }
}

console.log('\n' + '='.repeat(60))
console.log('CHECK COMPLETE')
console.log('='.repeat(60) + '\n')
