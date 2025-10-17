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

// Test configuration
const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

console.log('🚀 TESTING CURRENT vs ENTERPRISE RELATIONSHIP FUNCTIONALITY')
console.log('='   .repeat(80))

async function testCurrentFunction() {
  console.log('\n📊 Testing CURRENT hera_entities_crud_v2 function...')
  
  try {
    // Create customer
    const customerResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'customer',
        entity_name: 'Current Function Test Customer',
        smart_code: 'HERA.TEST.CURRENT.CUSTOMER.V1'
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    })
    
    if (customerResult.error) {
      console.error('❌ Customer creation failed:', customerResult.error.message)
      return false
    }
    
    const customerId = customerResult.data.items[0].id
    console.log(`✅ Customer created: ${customerId}`)
    
    // Create product WITH relationships
    const productResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'product',
        entity_name: 'Current Function Test Product',
        smart_code: 'HERA.TEST.CURRENT.PRODUCT.V1'
      },
      p_dynamic: {
        price: {
          field_type: 'number',
          field_value_number: 89.99,
          smart_code: 'HERA.TEST.CURRENT.PRODUCT.FIELD.PRICE.V1'
        }
      },
      p_relationships: [
        {
          target_entity_id: customerId,
          relationship_type: 'BELONGS_TO_CUSTOMER',
          relationship_data: {
            test: 'current_function',
            priority: 'medium'
          }
        }
      ],
      p_options: {
        include_relationships: true,
        include_dynamic: true
      }
    })
    
    if (productResult.error) {
      console.error('❌ Product creation failed:', productResult.error.message)
      return false
    }
    
    const product = productResult.data.items[0]
    console.log(`✅ Product created: ${product.id}`)
    console.log(`📊 Relationships in CREATE response: ${JSON.stringify(product.relationships, null, 2)}`)
    
    // Test READ with relationships
    const readResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_id: product.id
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {
        include_relationships: true,
        include_dynamic: true
      }
    })
    
    if (readResult.error) {
      console.error('❌ Read failed:', readResult.error.message)
      return false
    }
    
    const readProduct = readResult.data.items[0]
    console.log(`✅ Product read successfully`)
    console.log(`📊 Relationships in READ response: ${JSON.stringify(readProduct.relationships, null, 2)}`)
    
    // Check direct relationships in database
    const { data: directRels, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', TEST_ORG_ID)
      .or(`from_entity_id.eq.${product.id},to_entity_id.eq.${product.id}`)
    
    if (relError) {
      console.error('❌ Direct relationship query failed:', relError.message)
      return false
    }
    
    console.log(`📊 Direct relationships in DB: ${directRels.length}`)
    directRels.forEach((rel, i) => {
      console.log(`   ${i + 1}. ${rel.relationship_type}: ${rel.from_entity_id} → ${rel.to_entity_id}`)
    })
    
    return {
      productId: product.id,
      customerId,
      relationshipsInCreateResponse: Object.keys(product.relationships).length,
      relationshipsInReadResponse: Object.keys(readProduct.relationships).length,
      relationshipsInDatabase: directRels.length
    }
    
  } catch (error) {
    console.error('❌ Current function test failed:', error.message)
    return false
  }
}

async function main() {
  console.log(`🏢 Organization: ${TEST_ORG_ID}`)
  console.log(`👤 Actor: ${TEST_ACTOR_ID}`)
  
  const currentResult = await testCurrentFunction()
  if (!currentResult) {
    console.log('\n❌ Current function test failed')
    process.exit(1)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('📋 CURRENT FUNCTION ANALYSIS RESULTS')
  console.log('='.repeat(80))
  console.log(`🔗 Relationships in CREATE response: ${currentResult.relationshipsInCreateResponse}`)
  console.log(`🔗 Relationships in READ response: ${currentResult.relationshipsInReadResponse}`)
  console.log(`🔗 Relationships in database: ${currentResult.relationshipsInDatabase}`)
  
  if (currentResult.relationshipsInDatabase > 0 && currentResult.relationshipsInReadResponse === 0) {
    console.log('\n❌ CONFIRMED ISSUE: Relationships exist in DB but RPC not returning them')
    console.log('📝 SOLUTION NEEDED: Enhanced RPC function with relationship retrieval logic')
  } else if (currentResult.relationshipsInDatabase === 0) {
    console.log('\n❌ CONFIRMED ISSUE: Relationships not being created in DB at all')
    console.log('📝 SOLUTION NEEDED: Enhanced RPC function with relationship creation logic')
  } else {
    console.log('\n✅ Current function appears to be working correctly')
  }
  
  console.log('\n🎯 NEXT STEPS:')
  console.log('1. Deploy the enterprise relationship SQL manually in Supabase dashboard')
  console.log('2. Copy the SQL from: deploy-hera-entities-crud-v2-enterprise-relationships.sql')
  console.log('3. Execute in Supabase SQL editor')
  console.log('4. Re-run this test to verify improvement')
  
  console.log('\n📁 Enterprise SQL file ready for manual deployment')
}

main().catch(error => {
  console.error('💥 Critical error:', error.message)
  process.exit(1)
})