import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Verifying hera_txn_query_v1 fix...\n')

const { data, error } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_filters: { transaction_type: 'LEAVE', limit: 1 }
})

if (error) {
  console.error('❌ RPC Error:', error)
  process.exit(1)
}

console.log('📊 Response Structure Check:')
console.log('─'.repeat(80))

const firstItem = data?.data?.items?.[0]
if (!firstItem) {
  console.error('❌ No items returned')
  process.exit(1)
}

const requiredFields = {
  'id': firstItem.id,
  'transaction_code': firstItem.transaction_code,
  'transaction_type': firstItem.transaction_type,
  'transaction_status': firstItem.transaction_status,
  'source_entity_id': firstItem.source_entity_id,
  'target_entity_id': firstItem.target_entity_id,
  'metadata': firstItem.metadata,
  'created_at': firstItem.created_at,
  'updated_at': firstItem.updated_at,
  'created_by': firstItem.created_by,
  'updated_by': firstItem.updated_by,
  'business_context': firstItem.business_context
}

console.log('Total fields returned:', Object.keys(firstItem).length)
console.log('')

let allPassed = true
for (const [field, value] of Object.entries(requiredFields)) {
  const exists = field in firstItem
  const hasValue = value !== undefined && value !== null
  const status = exists ? (hasValue ? '✅' : '⚠️ ') : '❌'

  console.log(`${status} ${field.padEnd(25)} ${exists ? (hasValue ? `= ${JSON.stringify(value).substring(0, 50)}` : '(null)') : '(missing)'}`)

  if (!exists) allPassed = false
}

console.log('─'.repeat(80))

if (allPassed) {
  console.log('\n✅ SUCCESS! All required fields are now returned by hera_txn_query_v1')
  console.log('\n📋 Sample metadata content:')
  if (firstItem.metadata) {
    console.log(JSON.stringify(firstItem.metadata, null, 2))
  }
  console.log('\n🎯 The leave management page should now display:')
  console.log('   • Staff names (from source_entity_id lookup)')
  console.log('   • Manager names (from target_entity_id lookup)')
  console.log('   • Start/end dates (from metadata)')
  console.log('   • Leave reasons (from metadata)')
  console.log('   • Created/updated timestamps')
  process.exit(0)
} else {
  console.log('\n❌ FAILED: Some required fields are still missing')
  console.log('   Please check that the SQL was deployed correctly.')
  process.exit(1)
}
