const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

  // Check STAFF with any status
  const { data: staff } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, status')
    .eq('organization_id', orgId)
    .eq('entity_type', 'STAFF')

  console.log('\n📊 STAFF Entities:')
  staff?.forEach(s => {
    console.log(`  - ${s.entity_name}: status="${s.status}"`)
  })

  // Check LEAVE_POLICY with any status
  const { data: policies } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, status')
    .eq('organization_id', orgId)
    .eq('entity_type', 'LEAVE_POLICY')

  console.log('\n📋 LEAVE_POLICY Entities:')
  policies?.forEach(p => {
    console.log(`  - ${p.entity_name}: status="${p.status}"`)
  })

  // Check LEAVE transactions
  const { data: txns } = await supabase
    .from('universal_transactions')
    .select('id, transaction_code, transaction_type, transaction_status')
    .eq('organization_id', orgId)
    .eq('transaction_type', 'LEAVE')

  console.log('\n💼 LEAVE Transactions:')
  txns?.forEach(t => {
    console.log(`  - ${t.transaction_code}: status="${t.transaction_status}"`)
  })
}

check()
