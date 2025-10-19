#!/usr/bin/env node
/**
 * Test Customer RPC with different case variations
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testEntityType(entityType, label) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Testing with entity_type: "${entityType}" (${label})`)
  console.log('='.repeat(80))

  const payload = {
    p_action: 'READ',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: { entity_type: entityType },
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

  console.log('✅ Success:', result.data?.success)
  console.log('📊 List length:', result.data?.data?.list?.length || 0)

  if (result.data?.data?.list?.length > 0) {
    const firstItem = result.data.data.list[0]
    console.log('\n📋 First item structure:', {
      hasEntity: !!firstItem.entity,
      entityKeys: firstItem.entity ? Object.keys(firstItem.entity) : [],
      entityIsEmpty: firstItem.entity && Object.keys(firstItem.entity).length === 0,
      hasDynamicData: !!firstItem.dynamic_data,
      dynamicDataCount: firstItem.dynamic_data?.length || 0,
      hasRelationships: !!firstItem.relationships,
      relationshipsCount: firstItem.relationships?.length || 0
    })

    if (firstItem.entity && Object.keys(firstItem.entity).length > 0) {
      console.log('\n✅ Entity data:', {
        id: firstItem.entity.id,
        entity_name: firstItem.entity.entity_name,
        entity_type: firstItem.entity.entity_type,
        smart_code: firstItem.entity.smart_code,
        status: firstItem.entity.status
      })
    } else {
      console.log('\n❌ Entity object is empty!')
    }
  } else {
    console.log('\n❌ No items returned in list')
  }
}

async function runTests() {
  console.log('\n🔍 Testing entity_type Case Sensitivity\n')
  console.log('Configuration:')
  console.log(`  - Organization: ${TENANT_ORG_ID}`)
  console.log(`  - Actor: ${ACTOR_USER_ID}`)

  // Test different case variations
  await testEntityType('CUSTOMER', 'UPPERCASE')
  await testEntityType('customer', 'lowercase')
  await testEntityType('Customer', 'Capitalized')

  console.log('\n' + '='.repeat(80))
  console.log('TESTS COMPLETE')
  console.log('='.repeat(80))
}

runTests().catch(console.error)
