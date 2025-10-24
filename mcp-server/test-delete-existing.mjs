#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'
const EXISTING_CUSTOMER_ID = '9707e113-fce7-4030-8df9-a4589f70d1fb' // From the READ test above

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Testing DELETE action with existing customer...\n')
console.log('Configuration:')
console.log(`  - Organization: ${TENANT_ORG_ID}`)
console.log(`  - Actor: ${ACTOR_USER_ID}`)
console.log(`  - Customer: ${EXISTING_CUSTOMER_ID}\n`)

console.log('Testing DELETE action...')
const deleteResult = await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'DELETE',
  p_actor_user_id: ACTOR_USER_ID,
  p_organization_id: TENANT_ORG_ID,
  p_entity: {
    entity_id: EXISTING_CUSTOMER_ID
  },
  p_dynamic: {},
  p_relationships: {},
  p_options: {}
})

console.log('\n' + '='.repeat(80))
if (deleteResult.error) {
  console.log('❌ DELETE Error Code:', deleteResult.error.code)
  console.log('❌ DELETE Error Message:', deleteResult.error.message)
  console.log('❌ DELETE Error Details:', deleteResult.error.details || 'none')
  console.log('❌ DELETE Error Hint:', deleteResult.error.hint || 'none')
  
  // Check if it's calling a non-existent function
  if (deleteResult.error.message.includes('does not exist')) {
    console.log('\n⚠️  The orchestrator is trying to call a function that does NOT exist:')
    const match = deleteResult.error.message.match(/function\s+([^\s]+)\s*\(/i)
    if (match) {
      console.log(`     Missing function: ${match[1]}`)
    }
  }
} else if (deleteResult.data?.success === false) {
  console.log('❌ DELETE failed (success=false):')
  console.log(JSON.stringify(deleteResult.data, null, 2))
} else {
  console.log('✅ DELETE succeeded!')
  console.log('Response:', JSON.stringify(deleteResult.data, null, 2))
}
console.log('='.repeat(80))
