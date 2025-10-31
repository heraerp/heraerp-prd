/**
 * Test READ operation for POS Sale transaction
 * To diagnose why SaleDetailsDialog shows N/A values
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Get these from the user - we need a real transaction ID from the POS payments page
const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const TEST_USER_ID = 'f0f4ced2-877a-4a0c-8860-f5bc574652f6'

async function testReadSaleTransaction() {
  console.log('\n🧪 Testing READ Sale Transaction')
  console.log('=' .repeat(60))

  try {
    // Step 1: Find a recent POS sale transaction
    console.log('\n📖 STEP 1: Finding recent POS sale transactions...')

    const { data: transactions, error: findError } = await supabase
      .from('universal_transactions')
      .select('id, transaction_code, transaction_date, transaction_type, total_amount')
      .eq('organization_id', TEST_ORG_ID)
      .eq('transaction_type', 'POS_SALE')
      .order('created_at', { ascending: false })
      .limit(5)

    if (findError) {
      console.error('❌ Error finding transactions:', findError)
      return
    }

    console.log('\n✅ Found transactions:')
    transactions.forEach((txn, i) => {
      console.log(`  ${i + 1}. ID: ${txn.id}`)
      console.log(`     Code: ${txn.transaction_code || 'N/A'}`)
      console.log(`     Date: ${txn.transaction_date}`)
      console.log(`     Type: ${txn.transaction_type}`)
      console.log(`     Amount: ${txn.total_amount}`)
    })

    if (transactions.length === 0) {
      console.log('\n⚠️  No POS sale transactions found. Cannot test.')
      return
    }

    // Use the first transaction
    const testTxnId = transactions[0].id

    console.log(`\n📖 STEP 2: Testing READ with transaction ID: ${testTxnId}`)

    // Test with NEW payload format (what SaleDetailsDialog is using)
    const readPayload = {
      transaction_id: testTxnId,
      include_lines: true
    }

    console.log('\n📤 READ Payload:', JSON.stringify({
      p_action: 'READ',
      p_actor_user_id: TEST_USER_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: readPayload
    }, null, 2))

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'hera_txn_crud_v1',
      {
        p_action: 'READ',
        p_actor_user_id: TEST_USER_ID,
        p_organization_id: TEST_ORG_ID,
        p_payload: readPayload
      }
    )

    if (rpcError) {
      console.error('\n❌ READ Error:', rpcError)
      return
    }

    console.log('\n✅ READ Response Structure:')
    console.log('  - success:', rpcData?.success)
    console.log('  - hasData:', !!rpcData?.data)
    console.log('  - data keys:', rpcData?.data ? Object.keys(rpcData.data) : [])

    console.log('\n📦 Full Response:')
    console.log(JSON.stringify(rpcData, null, 2))

    // Try different access paths
    console.log('\n🔍 Testing different data access paths:')

    console.log('\n1️⃣  rpcData?.data?.data (what SaleDetailsDialog uses):')
    console.log(rpcData?.data?.data ? 'EXISTS' : 'UNDEFINED')
    if (rpcData?.data?.data) {
      console.log('   Transaction:', rpcData.data.data)
      console.log('   Lines:', rpcData.data.data.lines)
    }

    console.log('\n2️⃣  rpcData?.data?.items?.[0] (old path):')
    console.log(rpcData?.data?.items ? 'EXISTS' : 'UNDEFINED')
    if (rpcData?.data?.items) {
      console.log('   Transaction:', rpcData.data.items[0])
    }

    console.log('\n3️⃣  rpcData?.data (direct):')
    if (rpcData?.data) {
      console.log('   Keys:', Object.keys(rpcData.data))
      console.log('   Data:', rpcData.data)
    }

    console.log('\n✅ Test Complete!')

  } catch (error) {
    console.error('\n❌ Test Failed:', error)
    console.error('Stack:', error.stack)
  }
}

testReadSaleTransaction()
