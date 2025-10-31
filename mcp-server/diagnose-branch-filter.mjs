#!/usr/bin/env node
/**
 * Diagnose Branch Filter Issue
 * Check what branch data exists in transactions
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

console.log('\n🔍 DIAGNOSING BRANCH FILTER ISSUE')
console.log('='.repeat(60))

// Step 1: Get ALL transactions to see what we have
console.log('\n📋 Step 1: Checking all GL_JOURNAL transactions...\n')

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

console.log('📊 Total Transactions:', allTransactions.length)

if (allTransactions.length === 0) {
  console.log('\n⚠️  No GL_JOURNAL transactions found')
  console.log('   Create some POS sales first to test branch filtering')
  process.exit(0)
}

// Step 2: Analyze target_entity_id (branch) values
console.log('\n📋 Step 2: Analyzing target_entity_id (branch) values...\n')

const branchAnalysis = {}
allTransactions.forEach(t => {
  const branchId = t.target_entity_id
  const key = branchId || 'NULL'

  if (!branchAnalysis[key]) {
    branchAnalysis[key] = {
      id: branchId,
      count: 0,
      sampleCodes: []
    }
  }

  branchAnalysis[key].count++
  if (branchAnalysis[key].sampleCodes.length < 3) {
    branchAnalysis[key].sampleCodes.push(t.transaction_code)
  }
})

console.log('Branch Distribution:')
Object.entries(branchAnalysis).forEach(([key, data]) => {
  const displayId = key === 'NULL' ? '❌ NULL (no branch set)' : `✅ ${data.id.substring(0, 8)}...`
  console.log(`  ${displayId}`)
  console.log(`    Transactions: ${data.count}`)
  console.log(`    Sample codes: ${data.sampleCodes.join(', ')}`)
  console.log('')
})

// Step 3: If we have NULL branches, that's the problem
const nullBranches = branchAnalysis['NULL']
if (nullBranches) {
  console.log('🚨 PROBLEM FOUND: target_entity_id is NULL!')
  console.log(`   ${nullBranches.count} transactions have no branch assigned`)
  console.log('\n💡 Solution:')
  console.log('   When creating POS sales, make sure to set the branch (target_entity_id)')
  console.log('   Example:')
  console.log('   {')
  console.log('     transaction_type: "GL_JOURNAL",')
  console.log('     smart_code: "HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1",')
  console.log('     target_entity_id: "<branch-uuid>",  // ← SET THIS')
  console.log('     ...')
  console.log('   }')
}

// Step 4: Test branch filter with real branch ID
const branches = Object.entries(branchAnalysis)
  .filter(([key]) => key !== 'NULL')
  .map(([_, data]) => data)

if (branches.length === 0) {
  console.log('\n⚠️  No branches with valid target_entity_id found')
  console.log('   All transactions have NULL target_entity_id')
  console.log('   Branch filter cannot work without branch data')
  process.exit(0)
}

console.log('\n📋 Step 3: Testing branch filter with real data...\n')

const testBranch = branches[0]
console.log(`Testing with branch: ${testBranch.id}`)
console.log(`Expected result: ${testBranch.count} transactions`)

const { data: branchData, error: branchError } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: TEST_USER_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    transaction_type: 'GL_JOURNAL',
    smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
    target_entity_id: testBranch.id,
    limit: 1000
  }
})

if (branchError) {
  console.log('\n❌ Branch filter query failed:', branchError.message)
  process.exit(1)
}

const branchTransactions = branchData?.data?.data?.items || []

console.log(`\nResults:`)
console.log(`  Expected: ${testBranch.count} transactions`)
console.log(`  Got: ${branchTransactions.length} transactions`)

if (branchTransactions.length === testBranch.count) {
  console.log('\n✅ BRANCH FILTER IS WORKING CORRECTLY!')
} else {
  console.log('\n❌ BRANCH FILTER ISSUE DETECTED')
  console.log('   Filter is not returning expected results')
}

// Step 5: Check if branch entities exist
console.log('\n📋 Step 4: Checking if branches exist as entities...\n')

for (const branch of branches) {
  // Try to query the branch entity
  const { data: entityData, error: entityError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type')
    .eq('id', branch.id)
    .eq('organization_id', TEST_ORG_ID)
    .single()

  if (entityError) {
    console.log(`❌ Branch ${branch.id.substring(0, 8)}... NOT FOUND in core_entities`)
    console.log(`   This might be an invalid branch ID`)
  } else {
    console.log(`✅ Branch ${branch.id.substring(0, 8)}...`)
    console.log(`   Name: ${entityData.entity_name}`)
    console.log(`   Type: ${entityData.entity_type}`)
  }
}

console.log('\n' + '='.repeat(60))
console.log('DIAGNOSIS COMPLETE')
console.log('='.repeat(60))
console.log('\n')
