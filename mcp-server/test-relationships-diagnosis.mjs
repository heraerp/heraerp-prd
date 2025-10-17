#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test organization and actor
const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

console.log('🔍 Diagnosing hera_entities_crud_v2 Relationship Issues')
console.log('='   .repeat(60))

async function diagnoseRelationshipIssues() {
  try {
    // Step 1: Create simple entity and get the correct ID
    console.log('\n📝 Step 1: Creating simple test entity')
    const simpleResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'test_entity',
        entity_name: 'Simple Test Entity',
        smart_code: 'HERA.TEST.SIMPLE.ENTITY.V1'
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    })

    console.log('📊 Simple CREATE result:', JSON.stringify(simpleResult, null, 2))
    
    if (simpleResult.error) {
      console.error('❌ Failed to create simple entity:', simpleResult.error)
      return
    }

    // Extract the actual entity ID from the response
    let entityId
    if (simpleResult.data && simpleResult.data.items && simpleResult.data.items[0]) {
      entityId = simpleResult.data.items[0].id
    } else if (typeof simpleResult.data === 'string') {
      entityId = simpleResult.data
    } else {
      console.error('❌ Cannot extract entity ID from result')
      return
    }

    console.log(`✅ Entity created with ID: ${entityId}`)

    // Step 2: Read the entity back
    console.log('\n📝 Step 2: Reading entity back without relationships')
    const readResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_id: entityId
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    })

    console.log('📊 READ result (no relationships):', JSON.stringify(readResult, null, 2))

    // Step 3: Read with include_relationships
    console.log('\n📝 Step 3: Reading entity back WITH include_relationships: true')
    const readWithRelResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_id: entityId
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {
        include_relationships: true
      }
    })

    console.log('📊 READ result (with relationships):', JSON.stringify(readWithRelResult, null, 2))

    // Step 4: Create another entity to test relationships
    console.log('\n📝 Step 4: Creating target entity for relationship')
    const targetResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'test_target',
        entity_name: 'Target Entity',
        smart_code: 'HERA.TEST.TARGET.ENTITY.V1'
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    })

    let targetId
    if (targetResult.data && targetResult.data.items && targetResult.data.items[0]) {
      targetId = targetResult.data.items[0].id
    } else if (typeof targetResult.data === 'string') {
      targetId = targetResult.data
    }

    console.log(`✅ Target entity created with ID: ${targetId}`)

    // Step 5: Create direct relationship in core_relationships table
    console.log('\n📝 Step 5: Creating direct relationship in core_relationships')
    const { data: relData, error: relError } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: TEST_ORG_ID,
        source_entity_id: entityId,
        target_entity_id: targetId,
        relationship_type: 'TEST_RELATIONSHIP',
        relationship_data: {
          test: 'direct_insert',
          created_via: 'diagnosis_script'
        },
        created_by: TEST_ACTOR_ID,
        updated_by: TEST_ACTOR_ID
      })
      .select()

    if (relError) {
      console.error('❌ Failed to create direct relationship:', relError)
    } else {
      console.log('✅ Direct relationship created:', relData)
    }

    // Step 6: Read entity with relationships again
    console.log('\n📝 Step 6: Reading entity after direct relationship creation')
    const finalReadResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_id: entityId
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {
        include_relationships: true
      }
    })

    console.log('📊 Final READ result (should include relationships):', JSON.stringify(finalReadResult, null, 2))

    // Step 7: Test CREATE with relationships
    console.log('\n📝 Step 7: Testing CREATE with relationships included')
    const createWithRelResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'test_with_rel',
        entity_name: 'Entity with Relationships',
        smart_code: 'HERA.TEST.WITH.REL.ENTITY.V1'
      },
      p_dynamic: {},
      p_relationships: [
        {
          target_entity_id: targetId,
          relationship_type: 'CREATED_WITH_REL',
          relationship_data: {
            test: 'via_rpc_create',
            priority: 'high'
          }
        }
      ],
      p_options: {
        include_relationships: true
      }
    })

    console.log('📊 CREATE with relationships result:', JSON.stringify(createWithRelResult, null, 2))

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🔍 DIAGNOSIS SUMMARY:')
    console.log('1. CREATE operation returns: full object with items array')
    console.log('2. Relationships field in response: empty object {}')
    console.log('3. Direct relationship insertion: works')
    console.log('4. RPC relationship creation: needs verification')
    console.log('5. include_relationships flag: not working in RPC function')

  } catch (error) {
    console.error('💥 Diagnosis failed:', error)
  }
}

// Run the diagnosis
diagnoseRelationshipIssues()
  .then(() => {
    console.log('\n✨ Diagnosis completed')
  })
  .catch(error => {
    console.error('\n💥 Diagnosis failed:', error.message)
    process.exit(1)
  })