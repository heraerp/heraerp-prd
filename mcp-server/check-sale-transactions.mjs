import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function checkSaleTransactions() {
  console.log('\n🔍 Checking SALE transactions...\n')

  // Check for 'SALE' type
  const { data, error } = await supabase
    .from('universal_transactions')
    .select('id, transaction_code, transaction_date, transaction_type, total_amount, metadata')
    .eq('organization_id', TEST_ORG_ID)
    .eq('transaction_type', 'SALE')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`Found ${data.length} SALE transactions:\n`)
  data.forEach((txn, i) => {
    console.log(`${i + 1}. ID: ${txn.id}`)
    console.log(`   Code: ${txn.transaction_code}`)
    console.log(`   Type: ${txn.transaction_type}`)
    console.log(`   Date: ${txn.transaction_date}`)
    console.log(`   Amount: ${txn.total_amount}`)
    console.log(`   Metadata: ${JSON.stringify(txn.metadata)}`)
    console.log('')
  })

  if (data.length > 0) {
    console.log('\n📖 Now testing READ with first SALE transaction...\n')

    const testTxnId = data[0].id
    const TEST_USER_ID = 'f0f4ced2-877a-4a0c-8860-f5bc574652f6'

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'hera_txn_crud_v1',
      {
        p_action: 'READ',
        p_actor_user_id: TEST_USER_ID,
        p_organization_id: TEST_ORG_ID,
        p_payload: {
          transaction_id: testTxnId,
          include_lines: true
        }
      }
    )

    if (rpcError) {
      console.error('❌ RPC Error:', rpcError)
      return
    }

    console.log('✅ RPC Response Structure:')
    console.log('  - success:', rpcData?.success)
    console.log('  - hasData:', !!rpcData?.data)
    console.log('  - data keys:', rpcData?.data ? Object.keys(rpcData.data) : [])
    console.log('')

    console.log('📦 Full Response:')
    console.log(JSON.stringify(rpcData, null, 2))
    console.log('')

    console.log('🔍 Data Access Paths:')
    console.log('  1. rpcData?.data?.data:', rpcData?.data?.data ? 'EXISTS ✅' : 'UNDEFINED ❌')
    console.log('  2. rpcData?.data?.items?.[0]:', rpcData?.data?.items ? 'EXISTS ✅' : 'UNDEFINED ❌')
    console.log('  3. rpcData itself:', rpcData ? 'EXISTS ✅' : 'UNDEFINED ❌')
  }
}

checkSaleTransactions()
