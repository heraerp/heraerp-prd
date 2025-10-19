#!/usr/bin/env node
/**
 * Compare READ by entity_type vs READ by entity_id
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'
const CUSTOMER_ID = '96dc31b8-ad99-465b-a3db-4952f1599f71' // From check-customers-directly.mjs

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testReadByType() {
  console.log('=' .repeat(80))
  console.log('Test 1: READ by entity_type (CUSTOMER)')
  console.log('='.repeat(80))

  const payload = {
    p_action: 'READ',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'CUSTOMER'  // ← Reading by TYPE
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      limit: 10,
      include_dynamic: true,
      include_relationships: true
    }
  }

  const result = await supabase.rpc('hera_entities_crud_v1', payload)

  console.log('\n✅ Success:', result.data?.success)
  console.log('📊 List length:', result.data?.data?.list?.length || 0)

  if (result.data?.data?.list?.length > 0) {
    const first = result.data.data.list[0]
    console.log('\n📋 First item entity:', {
      isEmpty: Object.keys(first.entity || {}).length === 0,
      keys: Object.keys(first.entity || {}),
      id: first.entity?.id,
      entity_name: first.entity?.entity_name,
      entity_type: first.entity?.entity_type
    })
  }
}

async function testReadById() {
  console.log('\n' + '='.repeat(80))
  console.log('Test 2: READ by entity_id')
  console.log('='.repeat(80))

  const payload = {
    p_action: 'READ',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_id: CUSTOMER_ID  // ← Reading by ID
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      include_dynamic: true,
      include_relationships: true
    }
  }

  const result = await supabase.rpc('hera_entities_crud_v1', payload)

  console.log('\n✅ Success:', result.data?.success)
  console.log('📊 Has entity:', !!result.data?.data?.entity)

  if (result.data?.data?.entity) {
    const entity = result.data.data.entity
    console.log('\n📋 Entity:', {
      isEmpty: Object.keys(entity).length === 0,
      keys: Object.keys(entity),
      id: entity.id,
      entity_name: entity.entity_name,
      entity_type: entity.entity_type,
      smart_code: entity.smart_code,
      status: entity.status
    })
  }
}

async function runComparison() {
  console.log('\n🔍 Comparing READ by entity_type vs entity_id\n')
  console.log('Configuration:')
  console.log(`  - Organization: ${TENANT_ORG_ID}`)
  console.log(`  - Actor: ${ACTOR_USER_ID}`)
  console.log(`  - Customer ID: ${CUSTOMER_ID}\n`)

  await testReadByType()
  await testReadById()

  console.log('\n' + '='.repeat(80))
  console.log('ANALYSIS')
  console.log('='.repeat(80))
  console.log('The test suite only tests READ by entity_id (which works)')
  console.log('But our customers page uses READ by entity_type (which returns empty entities)')
  console.log('\nThis is why the test passed but the page fails!')
  console.log('='.repeat(80) + '\n')
}

runComparison().catch(console.error)
