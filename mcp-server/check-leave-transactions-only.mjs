import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const ORG = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

console.log('\n🔍 TESTING HERA_TXN_CRUD_V1 QUERY ACTION\n')

// Test 1: Direct query to universal_transactions table
console.log('TEST 1: Direct table query for LEAVE transactions')
const { data: directQuery, error: directError } = await supabase
  .from('universal_transactions')
  .select('id, transaction_type, transaction_code, transaction_status')
  .eq('organization_id', ORG)
  .eq('transaction_type', 'LEAVE')
  .neq('transaction_status', 'voided')  // ✅ FIXED: Use transaction_status instead of deleted_at

if (directError) {
  console.error('❌ Direct query error:', directError)
} else {
  console.log(`✅ Direct query found ${directQuery.length} LEAVE transactions:`)
  directQuery.forEach((tx, i) => {
    console.log(`   ${i + 1}. ${tx.transaction_code} - Status: ${tx.transaction_status}`)
  })
}

// Test 2: RPC call with QUERY action (what the hook uses)
console.log('\nTEST 2: RPC hera_txn_crud_v1 QUERY action for LEAVE transactions')
const { data: rpcQuery, error: rpcError } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: '5cc02ac5-4bf3-4dd8-a81b-6de7234bdf4d', // Owner user
  p_organization_id: ORG,
  p_payload: {
    transaction_type: 'LEAVE',
    include_lines: false,
    include_deleted: false,
    limit: 100,
    offset: 0
  }
})

if (rpcError) {
  console.error('❌ RPC query error:', rpcError)
} else {
  console.log('✅ RPC query response:')
  console.log('   Success:', rpcQuery.success)
  console.log('   Data success:', rpcQuery.data?.success)
  console.log('   Items count:', rpcQuery.data?.data?.items?.length || 0)

  if (rpcQuery.data?.data?.items) {
    console.log('\n   Transactions by type:')
    const byType = {}
    rpcQuery.data.data.items.forEach(item => {
      const type = item.header?.transaction_type || item.transaction_type
      byType[type] = (byType[type] || 0) + 1
    })
    console.log('   ', byType)

    console.log('\n   First 5 transactions:')
    rpcQuery.data.data.items.slice(0, 5).forEach((item, i) => {
      const header = item.header || item
      console.log(`   ${i + 1}. ${header.transaction_type} - ${header.transaction_code}`)
    })
  }
}

console.log('\n')
