import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function checkTransactions() {
  console.log('\n🔍 Checking available transactions...\n')

  const { data, error } = await supabase
    .from('universal_transactions')
    .select('id, transaction_code, transaction_date, transaction_type, total_amount')
    .eq('organization_id', TEST_ORG_ID)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`Found ${data.length} transactions:\n`)
  data.forEach((txn, i) => {
    console.log(`${i + 1}. ID: ${txn.id}`)
    console.log(`   Code: ${txn.transaction_code}`)
    console.log(`   Type: ${txn.transaction_type}`)
    console.log(`   Date: ${txn.transaction_date}`)
    console.log(`   Amount: ${txn.total_amount}`)
    console.log('')
  })
}

checkTransactions()
