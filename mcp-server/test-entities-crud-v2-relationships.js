/**
 * Test: hera_entities_crud_v2 Relationship Retrieval
 *
 * Purpose: Verify if the RPC function returns relationships when include_relationships: true
 *
 * Expected Behavior:
 * - When include_relationships: true, should return entity WITH relationships array
 * - When include_relationships: false/omitted, should return entity WITHOUT relationships
 *
 * Issue: RPC may not be populating relationships field even when requested
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'
const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function testRelationshipRetrieval() {
  console.log('🔍 Testing hera_entities_crud_v2 Relationship Retrieval\n')
  console.log('Test Parameters:')
  console.log(`  User ID: ${TEST_USER_ID}`)
  console.log(`  Org ID: ${TEST_ORG_ID}\n`)

  // Test 1: Create a test entity
  console.log('📝 Test 1: Create Test Entity')
  console.log('=' .repeat(60))

  const createPayload = {
    p_action: 'create',
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_entity: {
      entity_type: 'test_relationship_check',
      entity_name: 'Test Entity for Relationship Check',
      smart_code: 'HERA.TEST.RELATIONSHIP.CHECK.V1',
      entity_description: 'Testing relationship retrieval'
    },
    p_dynamic: [],
    p_relationships: [],
    p_options: {}
  }

  console.log('Request:', JSON.stringify(createPayload, null, 2))

  const { data: createResult, error: createError } = await supabase.rpc(
    'hera_entities_crud_v2',
    createPayload
  )

  if (createError) {
    console.error('❌ Create Error:', createError)
    return
  }

  console.log('✅ Create Result:', JSON.stringify(createResult, null, 2))

  if (!createResult?.items || createResult.items.length === 0) {
    console.error('❌ Failed to create entity')
    return
  }

  const testEntityId = createResult.items[0].id
  console.log(`\n📌 Created Test Entity ID: ${testEntityId}\n`)

  // Test 2: Create a relationship for this entity
  console.log('🔗 Test 2: Create Test Relationship')
  console.log('=' .repeat(60))

  const { data: targetEntity, error: targetError } = await supabase.rpc(
    'hera_entities_crud_v2',
    {
      p_action: 'create',
      p_actor_user_id: TEST_USER_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'test_target',
        entity_name: 'Target Entity',
        smart_code: 'HERA.TEST.TARGET.ENTITY.V1'
      },
      p_dynamic: [],
      p_relationships: [],
      p_options: {}
    }
  )

  if (targetError || !targetEntity?.items || targetEntity.items.length === 0) {
    console.error('❌ Failed to create target entity:', targetError)
    return
  }

  const targetEntityId = targetEntity.items[0].id
  console.log(`📌 Created Target Entity ID: ${targetEntityId}`)

  // Create relationship using direct table insert (to ensure it exists)
  const { data: relationship, error: relError } = await supabase
    .from('core_relationships')
    .insert({
      from_entity_id: testEntityId,
      to_entity_id: targetEntityId,
      relationship_type: 'TEST_RELATIONSHIP',
      organization_id: TEST_ORG_ID,
      created_by: TEST_USER_ID,
      updated_by: TEST_USER_ID
    })
    .select()
    .single()

  if (relError) {
    console.error('❌ Relationship Creation Error:', relError)
  } else {
    console.log('✅ Relationship Created:', relationship?.id)
  }

  // Test 3: Query entity WITHOUT include_relationships
  console.log('\n📖 Test 3: Query Entity WITHOUT include_relationships')
  console.log('=' .repeat(60))

  const readWithoutRels = {
    p_action: 'read',
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_entity: null,
    p_dynamic: null,
    p_relationships: null,
    p_options: {
      where: { id: testEntityId }
    }
  }

  console.log('Request:', JSON.stringify(readWithoutRels, null, 2))

  const { data: resultWithoutRels, error: errorWithoutRels } = await supabase.rpc(
    'hera_entities_crud_v2',
    readWithoutRels
  )

  if (errorWithoutRels) {
    console.error('❌ Read Error (without rels):', errorWithoutRels)
  } else {
    console.log('✅ Result (without include_relationships):')
    console.log(JSON.stringify(resultWithoutRels, null, 2))
    const entity = resultWithoutRels?.items?.[0]
    console.log(`\n🔍 Has 'relationships' field: ${entity?.relationships ? 'YES' : 'NO'}`)
    if (entity?.relationships) {
      const relCount = typeof entity.relationships === 'object' ? Object.keys(entity.relationships).length : 0
      console.log(`   Relationships count: ${relCount}`)
    }
  }

  // Test 4: Query entity WITH include_relationships: true
  console.log('\n📖 Test 4: Query Entity WITH include_relationships: true')
  console.log('=' .repeat(60))

  const readWithRels = {
    p_action: 'read',
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_entity: null,
    p_dynamic: null,
    p_relationships: null,
    p_options: {
      where: { id: testEntityId },
      include_relationships: true
    }
  }

  console.log('Request:', JSON.stringify(readWithRels, null, 2))

  const { data: resultWithRels, error: errorWithRels } = await supabase.rpc(
    'hera_entities_crud_v2',
    readWithRels
  )

  if (errorWithRels) {
    console.error('❌ Read Error (with rels):', errorWithRels)
  } else {
    console.log('✅ Result (with include_relationships: true):')
    console.log(JSON.stringify(resultWithRels, null, 2))
    const entityWithRels = resultWithRels?.items?.[0]
    console.log(`\n🔍 Has 'relationships' field: ${entityWithRels?.relationships ? 'YES' : 'NO'}`)
    if (entityWithRels?.relationships) {
      const relCount = typeof entityWithRels.relationships === 'object' ? Object.keys(entityWithRels.relationships).length : 0
      console.log(`   Relationships count: ${relCount}`)
      console.log('   Relationships:', JSON.stringify(entityWithRels.relationships, null, 2))
    }
  }

  // Test 5: Direct query to verify relationship exists in DB
  console.log('\n🔍 Test 5: Direct Database Query for Relationships')
  console.log('=' .repeat(60))

  const { data: directRels, error: directError } = await supabase
    .from('core_relationships')
    .select('*')
    .or(`from_entity_id.eq.${testEntityId},to_entity_id.eq.${testEntityId}`)

  if (directError) {
    console.error('❌ Direct Query Error:', directError)
  } else {
    console.log(`✅ Found ${directRels.length} relationship(s) in database:`)
    console.log(JSON.stringify(directRels, null, 2))
  }

  // Test 6: Check RPC function signature
  console.log('\n📋 Test 6: Check RPC Function Signature')
  console.log('=' .repeat(60))

  const { data: rpcInfo, error: rpcError } = await supabase.rpc('hera_rpc_registry_v1', {
    p_function_name: 'hera_entities_crud_v2'
  }).single()

  if (rpcError) {
    console.log('⚠️  Could not retrieve RPC info (function may not exist in registry)')
  } else {
    console.log('RPC Function Info:')
    console.log(JSON.stringify(rpcInfo, null, 2))
  }

  // Summary
  const entityWithoutRels = resultWithoutRels?.items?.[0]
  const entityWithRels = resultWithRels?.items?.[0]
  const hasRelsWithoutFlag = entityWithoutRels?.relationships && Object.keys(entityWithoutRels.relationships).length > 0
  const hasRelsWithFlag = entityWithRels?.relationships && Object.keys(entityWithRels.relationships).length > 0

  console.log('\n' + '=' .repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(60))
  console.log(`✅ Entity Created: ${testEntityId}`)
  console.log(`✅ Target Entity Created: ${targetEntityId}`)
  console.log(`✅ Relationship Exists in DB: ${directRels?.length > 0 ? 'YES' : 'NO'}`)
  console.log(`\n🔍 ISSUE VERIFICATION:`)
  console.log(`   Without include_relationships: Has populated relationships? ${hasRelsWithoutFlag ? 'YES' : 'NO'}`)
  console.log(`   With include_relationships=true: Has populated relationships? ${hasRelsWithFlag ? 'YES' : 'NO'}`)

  if (!hasRelsWithFlag && directRels?.length > 0) {
    console.log('\n❌ CONFIRMED BUG: Relationships exist in DB but NOT returned by RPC')
    console.log('   The RPC function is not populating the relationships field.')
    console.log('   Even with include_relationships: true, the field is empty: {}')
  } else if (hasRelsWithFlag) {
    console.log('\n✅ Relationships ARE being returned correctly')
  } else {
    console.log('\n⚠️  No relationships found in database to test with')
  }

  // Cleanup
  console.log('\n🧹 Cleaning up test data...')
  await supabase.from('core_relationships').delete().eq('from_entity_id', testEntityId)
  await supabase.from('core_entities').delete().eq('id', testEntityId)
  await supabase.from('core_entities').delete().eq('id', targetEntityId)
  console.log('✅ Cleanup complete')
}

// Run the test
testRelationshipRetrieval().catch(console.error)
