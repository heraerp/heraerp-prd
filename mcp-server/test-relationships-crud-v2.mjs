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

console.log('🧪 Testing hera_entities_crud_v2 Relationship Handling')
console.log('='   .repeat(60))
console.log(`Organization: ${TEST_ORG_ID}`)
console.log(`Actor: ${TEST_ACTOR_ID}`)

async function testRelationshipHandling() {
  try {
    // Step 1: Create two entities that we'll relate
    console.log('\n📝 Step 1: Creating source entity (customer)')
    const customerResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'customer',
        entity_name: 'Test Customer for Relationships',
        smart_code: 'HERA.TEST.CUSTOMER.ENTITY.REL.V1'
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    })

    if (customerResult.error) {
      console.error('❌ Failed to create customer:', customerResult.error)
      return
    }

    const customerId = customerResult.data
    console.log(`✅ Customer created with ID: ${customerId}`)

    console.log('\n📝 Step 2: Creating target entity (status)')
    const statusResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'status',
        entity_name: 'Active Status',
        smart_code: 'HERA.TEST.STATUS.ENTITY.ACTIVE.V1'
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    })

    if (statusResult.error) {
      console.error('❌ Failed to create status:', statusResult.error)
      return
    }

    const statusId = statusResult.data
    console.log(`✅ Status created with ID: ${statusId}`)

    // Step 2: Create entity WITH relationships
    console.log('\n📝 Step 3: Creating entity WITH relationships')
    const entityWithRelResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'product',
        entity_name: 'Test Product with Relationships',
        smart_code: 'HERA.TEST.PRODUCT.ENTITY.REL.V1'
      },
      p_dynamic: {
        price: {
          field_type: 'number',
          field_value_number: 99.99,
          smart_code: 'HERA.TEST.PRODUCT.FIELD.PRICE.V1'
        }
      },
      p_relationships: [
        {
          source_entity_id: null, // Will be filled with created entity ID
          target_entity_id: customerId,
          relationship_type: 'BELONGS_TO_CUSTOMER',
          relationship_data: {
            priority: 'high',
            created_via: 'test_script'
          }
        },
        {
          source_entity_id: null, // Will be filled with created entity ID  
          target_entity_id: statusId,
          relationship_type: 'HAS_STATUS',
          relationship_data: {
            status_type: 'active',
            auto_assigned: true
          }
        }
      ],
      p_options: {
        include_relationships: true
      }
    })

    if (entityWithRelResult.error) {
      console.error('❌ Failed to create entity with relationships:', entityWithRelResult.error)
      return
    }

    const productId = entityWithRelResult.data
    console.log(`✅ Product created with ID: ${productId}`)
    console.log(`📊 Result data:`, JSON.stringify(entityWithRelResult.data, null, 2))

    // Step 3: Read the entity back with relationships
    console.log('\n📝 Step 4: Reading entity back WITH include_relationships: true')
    const readResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_id: productId
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {
        include_relationships: true
      }
    })

    if (readResult.error) {
      console.error('❌ Failed to read entity:', readResult.error)
      return
    }

    console.log(`📊 Read result:`, JSON.stringify(readResult.data, null, 2))

    // Step 4: Check if relationships exist in core_relationships table directly
    console.log('\n📝 Step 5: Checking core_relationships table directly')
    const { data: directRelationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', TEST_ORG_ID)
      .or(`source_entity_id.eq.${productId},target_entity_id.eq.${productId}`)

    if (relError) {
      console.error('❌ Failed to query relationships directly:', relError)
      return
    }

    console.log(`📊 Direct relationships query (${directRelationships.length} found):`)
    directRelationships.forEach((rel, index) => {
      console.log(`   ${index + 1}. ${rel.relationship_type}: ${rel.source_entity_id} → ${rel.target_entity_id}`)
      console.log(`      Data: ${JSON.stringify(rel.relationship_data)}`)
    })

    // Step 5: Test reading with different options
    console.log('\n📝 Step 6: Testing READ without include_relationships')
    const readWithoutRel = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_id: productId
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    })

    if (readWithoutRel.error) {
      console.error('❌ Failed to read without relationships:', readWithoutRel.error)
    } else {
      console.log(`📊 Read without relationships:`, JSON.stringify(readWithoutRel.data, null, 2))
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🔍 DIAGNOSIS SUMMARY:')
    console.log(`✅ Created entities: Customer (${customerId}), Status (${statusId}), Product (${productId})`)
    console.log(`📊 Direct relationships found: ${directRelationships.length}`)
    console.log(`🔄 RPC returning relationships: ${JSON.stringify(readResult.data).includes('relationships')}`)
    
    if (directRelationships.length === 0) {
      console.log('❌ ISSUE: Relationships not being created in database')
    } else if (!JSON.stringify(readResult.data).includes('relationships')) {
      console.log('❌ ISSUE: Relationships exist in DB but RPC not returning them')
    } else {
      console.log('✅ SUCCESS: Relationships working correctly')
    }

    return {
      customerId,
      statusId,
      productId,
      directRelationships,
      readResult: readResult.data
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error)
    throw error
  }
}

// Run the test
testRelationshipHandling()
  .then(result => {
    console.log('\n✨ Test completed')
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error.message)
    process.exit(1)
  })