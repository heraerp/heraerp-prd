#!/usr/bin/env node
/**
 * Test branch creation with orchestrator RPC
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testBranchCreate() {
  console.log('Testing branch creation with orchestrator RPC...\n')

  const payload = {
    p_action: 'CREATE',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'BRANCH',
      entity_name: 'Test Branch',
      smart_code: 'HERA.SALON.BRANCH.ENTITY.LOCATION.v1',
      entity_code: 'BR-TEST-' + Date.now()
    },
    p_dynamic: {
      opening_time: {
        value: '09:00',
        type: 'text',
        smart_code: 'HERA.SALON.BRANCH.FIELD.OPENING_TIME.v1'
      },
      closing_time: {
        value: '18:00',
        type: 'text',
        smart_code: 'HERA.SALON.BRANCH.FIELD.CLOSING_TIME.v1'
      },
      address: {
        value: '123 Test Street',
        type: 'text',
        smart_code: 'HERA.SALON.BRANCH.FIELD.ADDRESS.v1'
      }
    },
    p_relationships: {},  // Empty - no relationships
    p_options: {
      include_dynamic: true,
      include_relationships: true,
      system_actor_user_id: ACTOR_USER_ID  // Add system actor for internal triggers
    }
  }

  console.log('📤 Payload:', JSON.stringify(payload, null, 2))

  const result = await supabase.rpc('hera_entities_crud_v1', payload)

  console.log('\n📥 Response:', JSON.stringify(result, null, 2))

  if (result.data?.success) {
    console.log('\n✅ SUCCESS!')
    console.log('Entity ID:', result.data.entity_id)
    console.log('Entity:', result.data.data?.entity)
    console.log('Dynamic Data:', result.data.data?.dynamic_data)
  } else {
    console.log('\n❌ FAILED!')
    console.log('Error:', result.data?.error || result.error?.message)
  }
}

testBranchCreate().catch(console.error)
