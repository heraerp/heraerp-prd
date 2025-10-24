#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Testing if hera_entities_crud_v1 exists...\n')
console.log('Configuration:')
console.log(`  - Organization: ${TENANT_ORG_ID}`)
console.log(`  - Actor: ${ACTOR_USER_ID}\n`)

const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: ACTOR_USER_ID,
  p_organization_id: TENANT_ORG_ID,
  p_entity: { entity_type: 'CUSTOMER' },
  p_dynamic: {},
  p_relationships: {},
  p_options: { limit: 1 }
})

if (error) {
  console.log('❌ Error:', error.code, error.message)
  if (error.code === 'PGRST202') {
    console.log('\n⚠️  Function does NOT exist in database')
  } else {
    console.log('\n⚠️  Function exists but returned an error')
  }
} else {
  console.log('✅ Function EXISTS and returned successfully')
  console.log('Response:', JSON.stringify(data, null, 2))
}
