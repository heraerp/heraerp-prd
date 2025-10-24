const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  console.log('\n🔍 Testing RPC function directly...\n')

  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  const actorId = '09b0b92a-d797-489e-bc03-5ca0a6272674'

  console.log('Parameters:')
  console.log('  org_id:', orgId)
  console.log('  actor_id:', actorId)
  console.log('  entity_type: STAFF\n')

  const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
    p_action: 'READ',
    p_actor_user_id: actorId,
    p_organization_id: orgId,
    p_entity: { entity_type: 'STAFF' },
    p_dynamic: null,
    p_relationships: null,
    p_options: { limit: 100, include_dynamic: true }
  })

  if (error) {
    console.log('❌ RPC Error:')
    console.log('   Message:', error.message)
    console.log('   Code:', error.code)
    console.log('   Details:', error.details)
    console.log('   Hint:', error.hint)
  } else {
    console.log('✅ RPC executed successfully')
    console.log('   Response type:', typeof data)
    console.log('   Is Array:', Array.isArray(data))
    if (Array.isArray(data)) {
      console.log('   Count:', data.length)
      if (data.length > 0) {
        console.log('   Sample:', JSON.stringify(data[0], null, 2))
      }
    } else {
      console.log('   Data:', JSON.stringify(data, null, 2))
    }
  }
}

check()
