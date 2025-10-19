#!/usr/bin/env node
/**
 * Debug Customer RPC Response Structure
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugResponse() {
  console.log('🔍 Debugging Customer RPC Response Structure\n')

  const payload = {
    p_action: 'READ',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: { entity_type: 'CUSTOMER' },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      limit: 10,
      include_dynamic: true,
      include_relationships: true
    }
  }

  const result = await supabase.rpc('hera_entities_crud_v1', payload)

  if (result.error) {
    console.log('❌ Error:', result.error.message)
    return
  }

  console.log('✅ RPC Success\n')

  // Full response structure
  console.log('📦 Full result.data structure:')
  console.log(JSON.stringify(result.data, null, 2))

  console.log('\n' + '='.repeat(80))

  // Analyze list structure
  if (result.data?.data?.list?.length > 0) {
    const firstItem = result.data.data.list[0]

    console.log('\n📋 First item in list:')
    console.log(JSON.stringify(firstItem, null, 2))

    console.log('\n🔍 First item structure:')
    console.log('  - Top level keys:', Object.keys(firstItem))

    if (firstItem.entity) {
      console.log('\n🎯 firstItem.entity:')
      console.log(JSON.stringify(firstItem.entity, null, 2))
      console.log('  - Entity keys:', Object.keys(firstItem.entity))
    }

    if (firstItem.dynamic_data) {
      console.log('\n📊 firstItem.dynamic_data:')
      console.log(JSON.stringify(firstItem.dynamic_data, null, 2))
    }

    if (firstItem.relationships) {
      console.log('\n🔗 firstItem.relationships:')
      console.log(JSON.stringify(firstItem.relationships, null, 2))
    }
  }
}

debugResponse().catch(console.error)
