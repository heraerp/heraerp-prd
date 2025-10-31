#!/usr/bin/env node
/**
 * Simple Branch Filter Test
 * Test if branch filtering is working
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

console.log('\n🧪 SIMPLE BRANCH FILTER TEST')
console.log('='.repeat(60))

// Get ALL transactions
console.log('\n📋 Step 1: Get ALL GL_JOURNAL transactions...\n')

const { data: allData, error: allError } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: TEST_USER_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    transaction_type: 'GL_JOURNAL',
    smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
    limit: 1000
  }
})

if (allError) {
  console.log('❌ Query failed:', allError.message)
  process.exit(1)
}

const allTransactions = allData?.data?.data?.items || []
console.log(`✅ Found ${allTransactions.length} total transactions`)

if (allTransactions.length === 0) {
  console.log('\n⚠️  NO TRANSACTIONS - Create a POS sale first')
  process.exit(0)
}

// Analyze branches
console.log('\n📋 Step 2: Analyze branch distribution...\n')

const branchCounts = {}
allTransactions.forEach(t => {
  const branch = t.target_entity_id || 'NULL'
  branchCounts[branch] = (branchCounts[branch] || 0) + 1
})

console.log('Branch Distribution (by target_entity_id):')
Object.entries(branchCounts).forEach(([branch, count]) => {
  const label = branch === 'NULL' ? '❌ NULL' : `✅ ${branch.substring(0, 12)}...`
  console.log(`  ${label}: ${count} transactions`)
})

// Test filtering
const validBranches = Object.keys(branchCounts).filter(b => b !== 'NULL')

if (validBranches.length === 0) {
  console.log('\n❌ NO VALID BRANCHES')
  console.log('   All transactions have NULL target_entity_id')
  console.log('   POS code needs to set target_entity_id = branch')
  process.exit(1)
}

console.log('\n📋 Step 3: Test branch filter...\n')

const testBranch = validBranches[0]
const expectedCount = branchCounts[testBranch]

console.log(`Testing with branch: ${testBranch.substring(0, 12)}...`)
console.log(`Expected: ${expectedCount} transactions`)

const { data: branchData, error: branchError } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: TEST_USER_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    transaction_type: 'GL_JOURNAL',
    smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
    target_entity_id: testBranch,
    limit: 1000
  }
})

if (branchError) {
  console.log('❌ Branch filter query failed:', branchError.message)
  process.exit(1)
}

const branchTransactions = branchData?.data?.data?.items || []
console.log(`Got: ${branchTransactions.length} transactions`)

// Verify
const wrongBranch = branchTransactions.filter(t => t.target_entity_id !== testBranch)

if (wrongBranch.length > 0) {
  console.log(`\n❌ FILTER FAILED: ${wrongBranch.length} wrong branch`)
  process.exit(1)
}

if (branchTransactions.length === expectedCount) {
  console.log('\n✅ BRANCH FILTER WORKING PERFECTLY!')
} else {
  console.log(`\n⚠️  Count mismatch: expected ${expectedCount}, got ${branchTransactions.length}`)
}

console.log('\n' + '='.repeat(60))
console.log('TEST COMPLETE')
console.log('='.repeat(60) + '\n')
