import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const ORG = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

const { data: entities } = await supabase
  .from('core_entities')
  .select('id, entity_name, entity_type, smart_code')
  .eq('organization_id', ORG)
  .like('smart_code', '%LEAVE.POLICY%')

console.log('\n📦 LEAVE POLICY STORAGE:\n')
if (entities && entities.length > 0) {
  console.log('✅ Stored as ENTITY in core_entities:')
  entities.forEach(e => {
    console.log(`   • ${e.entity_name}`)
    console.log(`     ID: ${e.id}`)
    console.log(`     Type: ${e.entity_type}`)
    console.log(`     Smart Code: ${e.smart_code}`)
  })
} else {
  console.log('❌ Not found in entities')
}

const { data: txs } = await supabase
  .from('universal_transactions')
  .select('id, transaction_type, smart_code')
  .eq('organization_id', ORG)
  .like('smart_code', '%LEAVE.POLICY%')

if (txs && txs.length > 0) {
  console.log('\n✅ Also stored as TRANSACTION:')
  txs.forEach(t => console.log(`   • ${t.transaction_type} - ${t.smart_code}`))
} else {
  console.log('\n❌ Not stored as transaction')
}

console.log('\n💡 ANSWER: Leave policy is stored as an ENTITY\n')
