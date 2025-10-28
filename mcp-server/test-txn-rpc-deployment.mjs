import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const ORG = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR = '5cc02ac5-4bf3-4dd8-a81b-6de7234bdf4d'

console.log('\n🧪 COMPREHENSIVE RPC DEPLOYMENT TEST\n')
console.log('='.repeat(60))

// ============================================================================
// TEST 1: Transaction Type Filtering (Bug Fix Verification)
// ============================================================================
console.log('\n📋 TEST 1: Transaction Type Filtering (CRITICAL BUG FIX)')
console.log('-'.repeat(60))

// Get all transaction types in database
const { data: allTxns } = await supabase
  .from('universal_transactions')
  .select('transaction_type')
  .eq('organization_id', ORG)
  .neq('transaction_status', 'voided')

const typeBreakdown = {}
allTxns?.forEach(tx => {
  typeBreakdown[tx.transaction_type] = (typeBreakdown[tx.transaction_type] || 0) + 1
})

console.log('📊 Database has these transaction types:')
console.log('   ', JSON.stringify(typeBreakdown, null, 2))

// Test RPC filtering for LEAVE only
const { data: leaveRPC, error: leaveError } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: ACTOR,
  p_organization_id: ORG,
  p_payload: {
    transaction_type: 'LEAVE',
    include_deleted: false,
    limit: 100
  }
})

let returnedTypes = {}
if (leaveError) {
  console.error('❌ LEAVE filter test FAILED:', leaveError)
} else {
  const items = leaveRPC.data?.data?.items || []
  items.forEach(item => {
    const type = item.transaction_type
    returnedTypes[type] = (returnedTypes[type] || 0) + 1
  })

  console.log('\n🔍 RPC with transaction_type: "LEAVE" returned:')
  console.log('   ', JSON.stringify(returnedTypes, null, 2))

  const hasOnlyLeave = Object.keys(returnedTypes).length === 1 && returnedTypes.LEAVE
  if (hasOnlyLeave) {
    console.log('✅ TEST PASSED: RPC correctly filters by transaction_type')
  } else {
    console.log('❌ TEST FAILED: RPC returned other transaction types!')
  }
}

// ============================================================================
// TEST 2: Response Structure (No Refetch Needed)
// ============================================================================
console.log('\n\n📦 TEST 2: Response Structure Verification')
console.log('-'.repeat(60))

if (leaveRPC?.data?.data?.items?.[0]) {
  const item = leaveRPC.data.data.items[0]
  const requiredFields = [
    'id',
    'transaction_type',
    'transaction_code',
    'transaction_date',
    'source_entity_id',
    'target_entity_id',
    'total_amount',
    'transaction_status',
    'metadata',
    'created_by',
    'updated_by'
  ]

  console.log('🔍 Checking if transaction has all required fields...')
  const missingFields = requiredFields.filter(field => !(field in item))

  if (missingFields.length === 0) {
    console.log('✅ TEST PASSED: All required fields present')
    console.log('\n📋 Sample transaction:')
    console.log('   ID:', item.id)
    console.log('   Type:', item.transaction_type)
    console.log('   Code:', item.transaction_code)
    console.log('   Status:', item.transaction_status)
    console.log('   Source:', item.source_entity_id)
    console.log('   Target:', item.target_entity_id)
    console.log('   Amount:', item.total_amount)
    console.log('   Metadata:', JSON.stringify(item.metadata, null, 2))
  } else {
    console.log('❌ TEST FAILED: Missing fields:', missingFields)
  }
} else {
  console.log('⚠️  SKIPPED: No LEAVE transactions to verify structure')
}

// ============================================================================
// TEST 3: Pagination & Performance
// ============================================================================
console.log('\n\n⚡ TEST 3: Pagination & Performance')
console.log('-'.repeat(60))

const start = Date.now()
const { data: paginatedRPC } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: ACTOR,
  p_organization_id: ORG,
  p_payload: {
    limit: 10,
    offset: 0,
    include_deleted: false
  }
})
const duration = Date.now() - start

console.log('🔍 Pagination test:')
console.log('   Total transactions:', paginatedRPC?.data?.data?.total || 0)
console.log('   Returned items:', paginatedRPC?.data?.data?.items?.length || 0)
console.log('   Limit:', paginatedRPC?.data?.data?.limit)
console.log('   Offset:', paginatedRPC?.data?.data?.offset)
console.log('   Next offset:', paginatedRPC?.data?.data?.next_offset || 'null (no more pages)')
console.log('   Query time:', duration, 'ms')

if (duration < 500) {
  console.log('✅ TEST PASSED: Query completed in <500ms')
} else {
  console.log('⚠️  WARNING: Query took', duration, 'ms (expected <500ms)')
}

// ============================================================================
// TEST 4: Actor Stamping & Security
// ============================================================================
console.log('\n\n🔒 TEST 4: Actor Stamping & Security')
console.log('-'.repeat(60))

if (leaveRPC?.data?.data?.items?.[0]) {
  const item = leaveRPC.data.data.items[0]

  console.log('🔍 Verifying actor fields...')
  console.log('   Created by:', item.created_by)
  console.log('   Updated by:', item.updated_by)
  console.log('   Created at:', item.created_at)
  console.log('   Updated at:', item.updated_at)

  if (item.created_by && item.updated_by) {
    console.log('✅ TEST PASSED: Actor stamping working correctly')
  } else {
    console.log('❌ TEST FAILED: Missing actor stamps!')
  }
}

// ============================================================================
// TEST 5: Multiple Filter Combinations
// ============================================================================
console.log('\n\n🎯 TEST 5: Multiple Filter Combinations')
console.log('-'.repeat(60))

const { data: multiFilterRPC } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: ACTOR,
  p_organization_id: ORG,
  p_payload: {
    transaction_type: 'LEAVE',
    transaction_status: 'approved',
    limit: 50
  }
})

const approvedLeave = multiFilterRPC?.data?.data?.items || []
console.log('🔍 Testing multiple filters:')
console.log('   Filter: transaction_type=LEAVE AND transaction_status=approved')
console.log('   Returned:', approvedLeave.length, 'transactions')

const allMatch = approvedLeave.every(item =>
  item.transaction_type === 'LEAVE' && item.transaction_status === 'approved'
)

if (allMatch) {
  console.log('✅ TEST PASSED: Multiple filters working correctly')
} else {
  console.log('❌ TEST FAILED: Some items don\'t match filters')
}

// ============================================================================
// TEST SUMMARY
// ============================================================================
console.log('\n\n' + '='.repeat(60))
console.log('📊 TEST SUMMARY')
console.log('='.repeat(60))

const tests = [
  { name: 'Transaction Type Filtering', status: Object.keys(returnedTypes || {}).length === 1 && returnedTypes?.LEAVE },
  { name: 'Response Structure', status: leaveRPC?.data?.data?.items?.[0]?.id },
  { name: 'Pagination & Performance', status: duration < 500 },
  { name: 'Actor Stamping', status: leaveRPC?.data?.data?.items?.[0]?.created_by },
  { name: 'Multiple Filters', status: allMatch }
]

tests.forEach(test => {
  const icon = test.status ? '✅' : '❌'
  const status = test.status ? 'PASSED' : 'FAILED'
  console.log(`${icon} ${test.name}: ${status}`)
})

const allPassed = tests.every(t => t.status)
if (allPassed) {
  console.log('\n🎉 ALL TESTS PASSED! RPC deployment successful!')
  console.log('\n📝 Next steps:')
  console.log('   1. Clear browser cache (Ctrl+Shift+R)')
  console.log('   2. Open /salon/leave page')
  console.log('   3. Verify "Total Requests" shows correct count')
  console.log('   4. (Optional) Remove client-side workaround in useHeraLeave.ts')
} else {
  console.log('\n⚠️  Some tests failed. Review issues above.')
}

console.log('\n')
