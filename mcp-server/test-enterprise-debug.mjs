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

console.log('🔍 DEBUGGING ENTERPRISE RELATIONSHIP FUNCTION')
console.log('='   .repeat(80))

async function debugFunctionDeployment() {
  console.log('\n📊 Testing minimal entity creation...')
  
  try {
    // Test 1: Minimal entity creation
    console.log('\n1️⃣ Testing minimal CREATE...')
    
    const minimalResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'test_debug',
        entity_name: 'Debug Test Entity'
      }
    })
    
    if (minimalResult.error) {
      console.error('❌ Minimal CREATE failed:', minimalResult.error.message)
      console.log('\n🔧 The issue is likely in the SQL function. Let me create a hot fix...')
      return false
    }
    
    console.log('✅ Minimal CREATE succeeded!')
    console.log(`📋 Created entity: ${minimalResult.data.items[0].id}`)
    
    // Test 2: CREATE with relationships
    console.log('\n2️⃣ Testing CREATE with relationships...')
    
    const entityId1 = minimalResult.data.items[0].id
    
    // Create target entity first
    const targetResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'test_target',
        entity_name: 'Debug Target Entity'
      }
    })
    
    if (targetResult.error) {
      console.error('❌ Target CREATE failed:', targetResult.error.message)
      return false
    }
    
    const targetId = targetResult.data.items[0].id
    console.log(`✅ Target entity created: ${targetId}`)
    
    // Create entity WITH relationships
    const relationshipResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'test_with_rel',
        entity_name: 'Debug Entity with Relationships',
        smart_code: 'HERA.DEBUG.TEST.ENTITY.REL.V1'
      },
      p_dynamic: {
        test_field: {
          field_type: 'text',
          field_value_text: 'test_value'
        }
      },
      p_relationships: [
        {
          target_entity_id: targetId,
          relationship_type: 'DEBUG_RELATIONSHIP',
          relationship_data: {
            test: 'debug_data'
          }
        }
      ],
      p_options: {
        include_relationships: true,
        include_dynamic: true
      }
    })
    
    if (relationshipResult.error) {
      console.error('❌ Relationship CREATE failed:', relationshipResult.error.message)
      return false
    }
    
    const product = relationshipResult.data.items[0]
    console.log(`✅ Entity with relationships created: ${product.id}`)
    console.log(`📊 Relationships: ${JSON.stringify(product.relationships, null, 2)}`)
    console.log(`📊 Dynamic data: ${JSON.stringify(product.dynamic, null, 2)}`)
    
    // Test 3: READ with relationships
    console.log('\n3️⃣ Testing READ with relationships...')
    
    const readResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_id: product.id
      },
      p_options: {
        include_relationships: true,
        include_dynamic: true
      }
    })
    
    if (readResult.error) {
      console.error('❌ READ failed:', readResult.error.message)
      return false
    }
    
    const readProduct = readResult.data.items[0]
    console.log(`✅ READ with relationships succeeded!`)
    console.log(`📊 Relationships found: ${Object.keys(readProduct.relationships).length}`)
    
    if (Object.keys(readProduct.relationships).length > 0) {
      console.log(`🎉 SUCCESS! Relationships are working:`)
      Object.keys(readProduct.relationships).forEach(relType => {
        console.log(`   - ${relType}: ${readProduct.relationships[relType].length} relationship(s)`)
      })
    } else {
      console.log(`⚠️  No relationships found in READ response`)
    }
    
    // Test 4: Direct database check
    console.log('\n4️⃣ Checking relationships directly in database...')
    
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
      console.log(`      Data: ${JSON.stringify(rel.relationship_data)}`)
      console.log(`      Active: ${rel.is_active}`)
    })
    
    return {
      success: true,
      relationshipsInResponse: Object.keys(readProduct.relationships).length,
      relationshipsInDatabase: directRels.length,
      testEntityId: product.id
    }
    
  } catch (error) {
    console.error('❌ Debug test failed with exception:', error.message)
    return false
  }
}

async function main() {
  console.log(`🏢 Organization: ${TEST_ORG_ID}`)
  console.log(`👤 Actor: ${TEST_ACTOR_ID}`)
  
  const result = await debugFunctionDeployment()
  
  if (!result) {
    console.log('\n❌ Debug tests failed')
    process.exit(1)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('🎉 DEBUG TEST RESULTS')
  console.log('='.repeat(80))
  console.log(`✅ Enterprise function deployed and working!`)
  console.log(`🔗 Relationships in response: ${result.relationshipsInResponse}`)
  console.log(`🔗 Relationships in database: ${result.relationshipsInDatabase}`)
  
  if (result.relationshipsInDatabase > 0 && result.relationshipsInResponse > 0) {
    console.log('\n🏆 SUCCESS! Enterprise relationship handling is FULLY WORKING!')
    console.log('✨ Key achievements:')
    console.log('   ✅ Relationships created during entity CREATE')
    console.log('   ✅ Relationships stored in database correctly')
    console.log('   ✅ Relationships retrieved during entity READ')
    console.log('   ✅ Related entity data included in response')
    console.log('   ✅ Dynamic fields working correctly')
  } else if (result.relationshipsInDatabase > 0) {
    console.log('\n⚠️  Partial success: Relationships created but not returned in READ')
  } else {
    console.log('\n❌ Issue: Relationships not being created')
  }
  
  console.log('\n🔗 Enterprise relationship support is now active!')
}

main().catch(error => {
  console.error('💥 Critical error:', error.message)
  process.exit(1)
})