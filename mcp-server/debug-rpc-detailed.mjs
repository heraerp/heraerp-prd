#!/usr/bin/env node
/**
 * Detailed RPC Response Debugging
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugRPC() {
  console.log('🔍 Detailed RPC Response Analysis\n')

  const payload = {
    p_action: 'READ',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'CUSTOMER'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      limit: 10,
      include_dynamic: true,
      include_relationships: true
    }
  }

  console.log('📤 Request Payload:')
  console.log(JSON.stringify(payload, null, 2))
  console.log('')

  const result = await supabase.rpc('hera_entities_crud_v1', payload)

  if (result.error) {
    console.log('❌ RPC Error:', result.error)
    return
  }

  console.log('✅ RPC Call Successful\n')

  console.log('=' .repeat(80))
  console.log('COMPLETE RAW RESPONSE')
  console.log('='.repeat(80))
  console.log(JSON.stringify(result.data, null, 2))
  console.log('')

  // Analyze structure
  console.log('='.repeat(80))
  console.log('STRUCTURE ANALYSIS')
  console.log('='.repeat(80))
  console.log('result.data type:', typeof result.data)
  console.log('result.data keys:', Object.keys(result.data || {}))
  console.log('')

  if (result.data?.data) {
    console.log('result.data.data type:', typeof result.data.data)
    console.log('result.data.data keys:', Object.keys(result.data.data || {}))
    console.log('')

    if (result.data.data.list) {
      console.log('result.data.data.list length:', result.data.data.list.length)
      console.log('result.data.data.list type:', Array.isArray(result.data.data.list) ? 'array' : typeof result.data.data.list)
      console.log('')

      if (result.data.data.list.length > 0) {
        const first = result.data.data.list[0]
        console.log('First list item:')
        console.log(JSON.stringify(first, null, 2))
        console.log('')

        console.log('First list item keys:', Object.keys(first))
        console.log('first.entity type:', typeof first.entity)
        console.log('first.entity keys:', Object.keys(first.entity || {}))
        console.log('first.entity is empty?:', Object.keys(first.entity || {}).length === 0)
        console.log('')

        console.log('first.dynamic_data type:', Array.isArray(first.dynamic_data) ? 'array' : typeof first.dynamic_data)
        console.log('first.dynamic_data length:', first.dynamic_data?.length || 0)
        console.log('')

        console.log('first.relationships type:', Array.isArray(first.relationships) ? 'array' : typeof first.relationships)
        console.log('first.relationships length:', first.relationships?.length || 0)
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('RECOMMENDATION')
  console.log('='.repeat(80))
  console.log('The RPC is returning { entity: {}, dynamic_data: [], relationships: [] }')
  console.log('This indicates the hera_entities_crud_v1 function has a bug.')
  console.log('The entity object should contain the actual entity data from core_entities table.')
  console.log('\nExpected format:')
  console.log('{')
  console.log('  entity: {')
  console.log('    id: "uuid",')
  console.log('    entity_name: "Customer Name",')
  console.log('    entity_type: "CUSTOMER",')
  console.log('    smart_code: "...",')
  console.log('    ...')
  console.log('  },')
  console.log('  dynamic_data: [...],')
  console.log('  relationships: [...]')
  console.log('}')
}

debugRPC().catch(console.error)
