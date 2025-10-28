import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Testing hera_txn_crud_v1 QUERY action...\n')

const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a',
  p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_payload: {
    transaction_type: 'LEAVE',
    limit: 1,
    include_lines: false
  }
})

if (error) {
  console.error('❌ RPC Error:', JSON.stringify(error, null, 2))
  process.exit(1)
}

console.log('📊 Full RPC Response:')
console.log(JSON.stringify(data, null, 2))

if (data?.data?.items?.[0]) {
  console.log('\n📊 First Item Fields:')
  const firstItem = data.data.items[0]
  console.log('  id:', firstItem.id)
  console.log('  transaction_code:', firstItem.transaction_code)
  console.log('  source_entity_id:', firstItem.source_entity_id)
  console.log('  target_entity_id:', firstItem.target_entity_id)
  console.log('  metadata:', JSON.stringify(firstItem.metadata, null, 2))
  console.log('  created_at:', firstItem.created_at)
  console.log('  updated_at:', firstItem.updated_at)
}
