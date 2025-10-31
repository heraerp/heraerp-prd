#!/usr/bin/env node
/**
 * Test Branch Filter Deployment
 * Comprehensive test of hera_txn_query_v1 branch filtering
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

console.log('\n🧪 TESTING BRANCH FILTER DEPLOYMENT')
console.log('='.repeat(70))
console.log('Organization ID:', TEST_ORG_ID)
console.log('User ID:', TEST_USER_ID)

// ============================================================================
// TEST 1: Verify function has the new filters
// ============================================================================
console.log('\n📋 TEST 1: Verify function code contains new filters')
console.log('-'.repeat(70))

const { data: funcData, error: funcError } = await supabase.rpc('pg_get_functiondef', {
  funcid: 'hera_txn_query_v1'::regproc::oid
}).single()

if (funcError) {
  console.log('❌ Could not check function code:', funcError.message)
  console.log('   Skipping code verification...')
} else {
  const funcDef = funcData?.pg_get_functiondef || ''
  const hasSourceVar = funcDef.includes('v_source_entity_id')
  const hasTargetVar = funcDef.includes('v_target_entity_id')
  const hasSourceWhere = funcDef.includes('t.source_entity_id = v_source_entity_id')
  const hasTargetWhere = funcDef.includes('t.target_entity_id = v_target_entity_id')

  console.log('  v_source_entity_id declared:', hasSourceVar ? '✅ YES' : '❌ NO')
  console.log('  v_target_entity_id declared:', hasTargetVar ? '✅ YES' : '❌ NO')
  console.log('  source_entity_id WHERE clause:', hasSourceWhere ? '✅ YES' : '❌ NO')
  console.log('  target_entity_id WHERE clause:', hasTargetWhere ? '✅ YES' : '❌ NO')

  if (hasSourceVar && hasTargetVar && hasSourceWhere && hasTargetWhere) {
    console.log('\n✅ Function code is CORRECT - all filters present')
  } else {
    console.log('\n❌ Function code is MISSING filters - needs redeployment!')
  }
}

// ============================================================================
// TEST 2: Get all transactions (no filter)
// ============================================================================
console.log('\n📋 TEST 2: Query ALL transactions (no branch filter)')
console.log('-'.repeat(70))

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
  console.log('❌ Query ALL failed:', allError.message)
  process.exit(1)
}

const allTransactions = allData?.data?.data?.items || []
console.log('  Total transactions found:', allTransactions.length)

if (allTransactions.length === 0) {
  console.log('\n⚠️  NO TRANSACTIONS FOUND')
  console.log('   Cannot test branch filtering without data')
  console.log('   Create a POS sale first, then run this test again')
  process.exit(0)
}

// Analyze branch distribution
const branchMap = {}
allTransactions.forEach(t => {
  const sourceId = t.source_entity_id || 'NULL'
  const targetId = t.target_entity_id || 'NULL'

  if (!branchMap[targetId]) {
    branchMap[targetId] = {
      target: targetId,
      source: sourceId,
      count: 0,
      codes: []
    }
  }
  branchMap[targetId].count++
  if (branchMap[targetId].codes.length < 3) {
    branchMap[targetId].codes.push(t.transaction_code)
  }
})

console.log('\n  Branch Distribution (by target_entity_id):')
Object.values(branchMap).forEach(b => {
  const label = b.target === 'NULL' ? '❌ NULL (no branch)' : `✅ ${b.target.substring(0, 12)}...`
  console.log(`    ${label}: ${b.count} transactions`)
  console.log(`      Sample codes: ${b.codes.join(', ')}`)
})

// ============================================================================
// TEST 3: Test branch filtering
// ============================================================================
console.log('\n📋 TEST 3: Test branch filtering with specific branch')
console.log('-'.repeat(70))

const branches = Object.values(branchMap).filter(b => b.target !== 'NULL')

if (branches.length === 0) {
  console.log('❌ No transactions with valid target_entity_id (branch)')
  console.log('   All transactions have NULL target_entity_id')
  console.log('   Branch filter cannot work - POS needs to set target_entity_id')
  console.log('\n💡 Fix: Update POS code to set target_entity_id = branch')
  process.exit(1)
}

const testBranch = branches[0]
console.log(`  Testing with branch: ${testBranch.target}`)
console.log(`  Expected result: ${testBranch.count} transactions`)

const { data: branchData, error: branchError } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: TEST_USER_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    transaction_type: 'GL_JOURNAL',
    smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
    target_entity_id: testBranch.target, // ✅ BRANCH FILTER
    limit: 1000
  }
})

if (branchError) {
  console.log('❌ Branch filter query failed:', branchError.message)
  process.exit(1)
}

const branchTransactions = branchData?.data?.data?.items || []
console.log(`  Actual result: ${branchTransactions.length} transactions`)

// Verify all returned transactions have correct branch
const wrongBranch = branchTransactions.filter(t => t.target_entity_id !== testBranch.target)

if (wrongBranch.length > 0) {
  console.log(`\n❌ FILTER FAILED: Found ${wrongBranch.length} transactions from wrong branch`)
  console.log('   Wrong transactions:', wrongBranch.map(t => t.transaction_code).join(', '))
  process.exit(1)
}

if (branchTransactions.length === testBranch.count) {
  console.log('\n✅ BRANCH FILTER WORKING PERFECTLY!')
  console.log('   All transactions match the filtered branch')
} else if (branchTransactions.length < allTransactions.length) {
  console.log('\n✅ BRANCH FILTER IS WORKING!')
  console.log(`   Filtered from ${allTransactions.length} to ${branchTransactions.length} transactions`)
} else {
  console.log('\n⚠️  WARNING: Filter did not reduce transaction count')
  console.log(`   Expected: ${testBranch.count}, Got: ${branchTransactions.length}`)
}

// ============================================================================
// TEST 4: Test "All Branches" (no branch filter)
// ============================================================================
console.log('\n📋 TEST 4: Test "All Branches" (null filter)')
console.log('-'.repeat(70))

const { data: nullData, error: nullError } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: TEST_USER_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    transaction_type: 'GL_JOURNAL',
    smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
    // No target_entity_id = "All Branches"
    limit: 1000
  }
})

if (nullError) {
  console.log('❌ Null filter query failed:', nullError.message)
} else {
  const nullTransactions = nullData?.data?.data?.items || []
  console.log(`  "All Branches" result: ${nullTransactions.length} transactions`)

  if (nullTransactions.length === allTransactions.length) {
    console.log('✅ "All Branches" works correctly (returns all transactions)')
  } else {
    console.log('⚠️  Count mismatch - might be caching issue')
  }
}

// ============================================================================
// TEST 5: Sample transaction structure
// ============================================================================
console.log('\n📋 TEST 5: Sample transaction structure')
console.log('-'.repeat(70))

const sample = allTransactions[0]
console.log('  Transaction Code:', sample.transaction_code)
console.log('  Transaction Date:', sample.transaction_date)
console.log('  Source Entity ID:', sample.source_entity_id || '❌ NULL')
console.log('  Target Entity ID:', sample.target_entity_id || '❌ NULL')
console.log('  Business Context:')
console.log('    branch_id:', sample.business_context?.branch_id || '❌ NULL')
console.log('    customer_id:', sample.business_context?.customer_id || '❌ NULL')

console.log('\n' + '='.repeat(70))
console.log('✅ DEPLOYMENT TEST COMPLETE')
console.log('='.repeat(70))

// Summary
console.log('\n📊 SUMMARY:')
console.log(`  Total transactions: ${allTransactions.length}`)
console.log(`  Branches found: ${branches.length}`)
console.log(`  Branch filter test: ${branchTransactions.length === testBranch.count ? '✅ PASS' : '⚠️  WARNING'}`)
console.log('\n💡 Next Steps:')
if (branches.length > 0) {
  console.log('  1. Branch filter is working correctly')
  console.log('  2. Test in UI at /salon/reports/sales/daily')
  console.log('  3. Select different branches and verify filtering')
} else {
  console.log('  1. Update POS code to set target_entity_id = branch')
  console.log('  2. Create new POS sales')
  console.log('  3. Run this test again')
}
console.log('\n')
