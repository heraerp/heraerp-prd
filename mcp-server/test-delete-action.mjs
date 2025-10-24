#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Testing DELETE action in hera_entities_crud_v1...\n')
console.log('Configuration:')
console.log(`  - Organization: ${TENANT_ORG_ID}`)
console.log(`  - Actor: ${ACTOR_USER_ID}\n`)

// First, create a test entity to delete
console.log('Step 1: Creating test entity...')
const createResult = await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: ACTOR_USER_ID,
  p_organization_id: TENANT_ORG_ID,
  p_entity: {
    entity_type: 'TEST_DELETE',
    entity_name: 'Test Entity for Deletion',
    smart_code: 'HERA.TEST.DELETE.ENTITY.V1',
    status: 'active'
  },
  p_dynamic: {},
  p_relationships: {},
  p_options: {}
})

if (createResult.error) {
  console.log('❌ CREATE failed:', createResult.error)
  process.exit(1)
}

console.log('CREATE Response structure:')
console.log(JSON.stringify(createResult.data, null, 2))

const testEntityId = createResult.data?.data?.entity?.id 
                     || createResult.data?.entity?.id 
                     || createResult.data?.id

if (!testEntityId) {
  console.log('❌ Could not extract entity ID from CREATE response')
  console.log('Full response:', createResult.data)
  process.exit(1)
}

console.log('✅ Test entity created:', testEntityId, '\n')

// Now try to delete it
console.log('Step 2: Deleting test entity...')
const deleteResult = await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'DELETE',
  p_actor_user_id: ACTOR_USER_ID,
  p_organization_id: TENANT_ORG_ID,
  p_entity: {
    entity_id: testEntityId
  },
  p_dynamic: {},
  p_relationships: {},
  p_options: {}
})

if (deleteResult.error) {
  console.log('❌ DELETE Error Code:', deleteResult.error.code)
  console.log('❌ DELETE Error Message:', deleteResult.error.message)
  console.log('❌ DELETE Error Details:', deleteResult.error.details)
  console.log('❌ DELETE Error Hint:', deleteResult.error.hint)
} else if (deleteResult.data?.success === false) {
  console.log('❌ DELETE failed (success=false):', deleteResult.data)
} else {
  console.log('✅ DELETE succeeded!')
  console.log('Response:', JSON.stringify(deleteResult.data, null, 2))
}
