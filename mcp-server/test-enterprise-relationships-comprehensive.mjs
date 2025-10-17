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

console.log('🚀 ENTERPRISE RELATIONSHIP TESTING SUITE')
console.log('='   .repeat(80))
console.log(`🏢 Organization: ${TEST_ORG_ID}`)
console.log(`👤 Actor: ${TEST_ACTOR_ID}`)

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
}

function logTest(name, status, details = null) {
  testResults.total++
  const result = {
    name,
    status,
    details,
    timestamp: new Date().toISOString()
  }
  
  if (status === 'PASS') {
    testResults.passed++
    console.log(`✅ ${name}`)
  } else {
    testResults.failed++
    console.log(`❌ ${name}`)
    if (details) console.log(`   📝 ${details}`)
  }
  
  testResults.tests.push(result)
}

async function deployEnterpriseFunction() {
  console.log('\n📦 STEP 1: Deploying Enterprise Relationship Function')
  console.log('-'.repeat(60))
  
  try {
    // Read the SQL file content
    const { readFileSync } = await import('fs')
    const sqlContent = readFileSync('./deploy-hera-entities-crud-v2-enterprise-relationships.sql', 'utf8')
    
    // Execute the deployment
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      logTest('Deploy Enterprise Function', 'FAIL', error.message)
      return false
    }
    
    logTest('Deploy Enterprise Function', 'PASS')
    return true
  } catch (error) {
    logTest('Deploy Enterprise Function', 'FAIL', error.message)
    return false
  }
}

async function testCreateWithRelationships() {
  console.log('\n🔗 STEP 2: Testing CREATE with Relationships')
  console.log('-'.repeat(60))
  
  try {
    // Create target entities for relationships
    const customerResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'customer',
        entity_name: 'Test Customer for Relationships',
        smart_code: 'HERA.TEST.CUSTOMER.ENTITY.REL.V1'
      },
      p_dynamic: {
        email: {
          field_type: 'text',
          field_value_text: 'customer@test.com',
          smart_code: 'HERA.TEST.CUSTOMER.FIELD.EMAIL.V1'
        }
      },
      p_relationships: [],
      p_options: {}
    })
    
    if (customerResult.error) {
      logTest('Create Target Customer', 'FAIL', customerResult.error.message)
      return false
    }
    
    const customerId = customerResult.data.items[0].id
    logTest('Create Target Customer', 'PASS', `ID: ${customerId}`)
    
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
      logTest('Create Target Status', 'FAIL', statusResult.error.message)
      return false
    }
    
    const statusId = statusResult.data.items[0].id
    logTest('Create Target Status', 'PASS', `ID: ${statusId}`)
    
    // Create entity WITH relationships
    const productResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'product',
        entity_name: 'Enterprise Test Product',
        smart_code: 'HERA.TEST.PRODUCT.ENTITY.ENTERPRISE.V1'
      },
      p_dynamic: {
        price: {
          field_type: 'number',
          field_value_number: 149.99,
          smart_code: 'HERA.TEST.PRODUCT.FIELD.PRICE.V1'
        },
        category: {
          field_type: 'text',
          field_value_text: 'Premium Services',
          smart_code: 'HERA.TEST.PRODUCT.FIELD.CATEGORY.V1'
        }
      },
      p_relationships: [
        {
          target_entity_id: customerId,
          relationship_type: 'BELONGS_TO_CUSTOMER',
          relationship_direction: 'outbound',
          relationship_data: {
            priority: 'high',
            created_via: 'enterprise_test',
            test_metadata: true
          }
        },
        {
          target_entity_id: statusId,
          relationship_type: 'HAS_STATUS',
          relationship_direction: 'outbound',
          relationship_data: {
            status_type: 'active',
            auto_assigned: true
          }
        }
      ],
      p_options: {
        include_relationships: true,
        include_dynamic: true
      }
    })
    
    if (productResult.error) {
      logTest('Create Product with Relationships', 'FAIL', productResult.error.message)
      return false
    }
    
    const productId = productResult.data.items[0].id
    const product = productResult.data.items[0]
    
    // Validate creation
    if (!product.dynamic || !product.dynamic.price) {
      logTest('Validate Dynamic Fields', 'FAIL', 'Dynamic fields missing')
      return false
    }
    logTest('Validate Dynamic Fields', 'PASS', `Price: ${product.dynamic.price.value}`)
    
    if (!product.relationships || Object.keys(product.relationships).length === 0) {
      logTest('Validate Relationships Created', 'FAIL', 'No relationships found in response')
      return false
    }
    logTest('Validate Relationships Created', 'PASS', `Relationship types: ${Object.keys(product.relationships).join(', ')}`)
    
    // Validate metadata
    if (!productResult.data.metadata || !productResult.data.metadata.relationships_created) {
      logTest('Validate Creation Metadata', 'FAIL', 'Creation metadata missing')
      return false
    }
    logTest('Validate Creation Metadata', 'PASS', 
      `Relationships created: ${productResult.data.metadata.relationships_created}`)
    
    return { productId, customerId, statusId }
    
  } catch (error) {
    logTest('Create with Relationships - Exception', 'FAIL', error.message)
    return false
  }
}

async function testReadWithRelationships(entityIds) {
  console.log('\n📖 STEP 3: Testing READ with Relationships')
  console.log('-'.repeat(60))
  
  if (!entityIds) {
    logTest('READ Test Prerequisites', 'FAIL', 'No entity IDs from previous test')
    return false
  }
  
  try {
    // Test READ without relationships
    const readWithoutRel = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_id: entityIds.productId
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {
        include_relationships: false,
        include_dynamic: true
      }
    })
    
    if (readWithoutRel.error) {
      logTest('READ without Relationships', 'FAIL', readWithoutRel.error.message)
      return false
    }
    
    const productWithoutRel = readWithoutRel.data.items[0]
    if (productWithoutRel.relationships && Object.keys(productWithoutRel.relationships).length > 0) {
      logTest('READ without Relationships', 'FAIL', 'Relationships included when not requested')
      return false
    }
    logTest('READ without Relationships', 'PASS', 'No relationships included as expected')
    
    // Test READ with relationships
    const readWithRel = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_id: entityIds.productId
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {
        include_relationships: true,
        include_dynamic: true
      }
    })
    
    if (readWithRel.error) {
      logTest('READ with Relationships', 'FAIL', readWithRel.error.message)
      return false
    }
    
    const productWithRel = readWithRel.data.items[0]
    if (!productWithRel.relationships || Object.keys(productWithRel.relationships).length === 0) {
      logTest('READ with Relationships', 'FAIL', 'No relationships found when requested')
      return false
    }
    logTest('READ with Relationships', 'PASS', 
      `Found relationship types: ${Object.keys(productWithRel.relationships).join(', ')}`)
    
    // Validate relationship data structure
    const relationshipTypes = Object.keys(productWithRel.relationships)
    let relationshipValidation = true
    
    for (const relType of relationshipTypes) {
      const rels = productWithRel.relationships[relType]
      if (!Array.isArray(rels) || rels.length === 0) {
        relationshipValidation = false
        break
      }
      
      const rel = rels[0]
      if (!rel.id || !rel.from_entity_id || !rel.to_entity_id || !rel.relationship_type) {
        relationshipValidation = false
        break
      }
      
      if (!rel.related_entity || !rel.related_entity.id || !rel.related_entity.entity_name) {
        relationshipValidation = false
        break
      }
    }
    
    if (!relationshipValidation) {
      logTest('Validate Relationship Structure', 'FAIL', 'Invalid relationship data structure')
      return false
    }
    logTest('Validate Relationship Structure', 'PASS', 'All relationship fields present')
    
    return productWithRel
    
  } catch (error) {
    logTest('READ with Relationships - Exception', 'FAIL', error.message)
    return false
  }
}

async function testUpdateWithRelationships(entityIds) {
  console.log('\n✏️ STEP 4: Testing UPDATE with Relationships')
  console.log('-'.repeat(60))
  
  if (!entityIds) {
    logTest('UPDATE Test Prerequisites', 'FAIL', 'No entity IDs from previous test')
    return false
  }
  
  try {
    // Create a new target entity for update test
    const newTargetResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'category',
        entity_name: 'Premium Category',
        smart_code: 'HERA.TEST.CATEGORY.ENTITY.PREMIUM.V1'
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    })
    
    if (newTargetResult.error) {
      logTest('Create Update Target', 'FAIL', newTargetResult.error.message)
      return false
    }
    
    const newTargetId = newTargetResult.data.items[0].id
    logTest('Create Update Target', 'PASS', `ID: ${newTargetId}`)
    
    // Update entity with new relationships
    const updateResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'UPDATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_id: entityIds.productId,
        entity_name: 'Updated Enterprise Product',
        status: 'active'
      },
      p_dynamic: {
        price: {
          field_type: 'number',
          field_value_number: 199.99,
          smart_code: 'HERA.TEST.PRODUCT.FIELD.PRICE.V1'
        },
        description: {
          field_type: 'text',
          field_value_text: 'Updated premium service description',
          smart_code: 'HERA.TEST.PRODUCT.FIELD.DESC.V1'
        }
      },
      p_relationships: [
        {
          target_entity_id: newTargetId,
          relationship_type: 'BELONGS_TO_CATEGORY',
          relationship_direction: 'outbound',
          relationship_data: {
            category_type: 'premium',
            updated_via: 'enterprise_test'
          }
        },
        {
          target_entity_id: entityIds.statusId,
          relationship_type: 'HAS_STATUS',
          relationship_direction: 'outbound',
          relationship_data: {
            status_type: 'active',
            auto_assigned: true,
            updated: true
          }
        }
      ],
      p_options: {
        include_relationships: true,
        include_dynamic: true
      }
    })
    
    if (updateResult.error) {
      logTest('UPDATE with Relationships', 'FAIL', updateResult.error.message)
      return false
    }
    
    const updatedProduct = updateResult.data.items[0]
    
    // Validate updates
    if (updatedProduct.entity_name !== 'Updated Enterprise Product') {
      logTest('Validate Entity Update', 'FAIL', 'Entity name not updated')
      return false
    }
    logTest('Validate Entity Update', 'PASS', 'Entity name updated correctly')
    
    if (!updatedProduct.dynamic.price || updatedProduct.dynamic.price.value !== '199.99') {
      logTest('Validate Dynamic Update', 'FAIL', 'Price not updated correctly')
      return false
    }
    logTest('Validate Dynamic Update', 'PASS', 'Price updated to 199.99')
    
    if (!updatedProduct.dynamic.description) {
      logTest('Validate New Dynamic Field', 'FAIL', 'New description field not added')
      return false
    }
    logTest('Validate New Dynamic Field', 'PASS', 'Description field added')
    
    if (!updatedProduct.relationships || Object.keys(updatedProduct.relationships).length === 0) {
      logTest('Validate Relationship Update', 'FAIL', 'No relationships after update')
      return false
    }
    
    const hasNewCategory = updatedProduct.relationships['BELONGS_TO_CATEGORY']
    if (!hasNewCategory) {
      logTest('Validate New Relationship', 'FAIL', 'New category relationship not found')
      return false
    }
    logTest('Validate New Relationship', 'PASS', 'Category relationship created')
    
    return updatedProduct
    
  } catch (error) {
    logTest('UPDATE with Relationships - Exception', 'FAIL', error.message)
    return false
  }
}

async function testRelationshipValidation() {
  console.log('\n🛡️ STEP 5: Testing Relationship Validation')
  console.log('-'.repeat(60))
  
  try {
    // Test invalid target entity
    const invalidTargetResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'test_validation',
        entity_name: 'Validation Test Entity',
        smart_code: 'HERA.TEST.VALIDATION.ENTITY.V1'
      },
      p_dynamic: {},
      p_relationships: [
        {
          target_entity_id: '00000000-0000-0000-0000-000000000000',
          relationship_type: 'INVALID_TARGET',
          relationship_data: {}
        }
      ],
      p_options: {}
    })
    
    if (!invalidTargetResult.error) {
      logTest('Invalid Target Validation', 'FAIL', 'Should have failed with invalid target')
      return false
    }
    
    if (invalidTargetResult.error.message.includes('REL_TARGET_NOT_FOUND')) {
      logTest('Invalid Target Validation', 'PASS', 'Correctly rejected invalid target')
    } else {
      logTest('Invalid Target Validation', 'FAIL', `Unexpected error: ${invalidTargetResult.error.message}`)
      return false
    }
    
    // Test missing relationship type
    const missingTypeResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_type: 'test_validation2',
        entity_name: 'Validation Test Entity 2',
        smart_code: 'HERA.TEST.VALIDATION2.ENTITY.V1'
      },
      p_dynamic: {},
      p_relationships: [
        {
          target_entity_id: TEST_ACTOR_ID, // Using actor ID as dummy target
          relationship_data: {}
        }
      ],
      p_options: {}
    })
    
    if (!missingTypeResult.error) {
      logTest('Missing Type Validation', 'FAIL', 'Should have failed with missing relationship_type')
      return false
    }
    
    if (missingTypeResult.error.message.includes('REL_TYPE_REQUIRED')) {
      logTest('Missing Type Validation', 'PASS', 'Correctly rejected missing relationship_type')
    } else {
      logTest('Missing Type Validation', 'FAIL', `Unexpected error: ${missingTypeResult.error.message}`)
      return false
    }
    
    return true
    
  } catch (error) {
    logTest('Relationship Validation - Exception', 'FAIL', error.message)
    return false
  }
}

async function testDeleteWithRelationships(entityIds) {
  console.log('\n🗑️ STEP 6: Testing DELETE with Relationships')
  console.log('-'.repeat(60))
  
  if (!entityIds) {
    logTest('DELETE Test Prerequisites', 'FAIL', 'No entity IDs from previous test')
    return false
  }
  
  try {
    // Delete the product
    const deleteResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'DELETE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_id: entityIds.productId
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    })
    
    if (deleteResult.error) {
      logTest('DELETE Entity', 'FAIL', deleteResult.error.message)
      return false
    }
    
    if (!deleteResult.data.metadata || !deleteResult.data.metadata.deleted) {
      logTest('DELETE Entity', 'FAIL', 'Delete metadata missing')
      return false
    }
    logTest('DELETE Entity', 'PASS', 'Entity deleted successfully')
    
    // Verify entity is marked as deleted
    const readDeletedResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_entity: {
        entity_id: entityIds.productId
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    })
    
    if (!readDeletedResult.error) {
      const deletedEntity = readDeletedResult.data.items[0]
      if (deletedEntity.status !== 'deleted') {
        logTest('Verify Soft Delete', 'FAIL', 'Entity not marked as deleted')
        return false
      }
      logTest('Verify Soft Delete', 'PASS', 'Entity marked as deleted')
    } else {
      logTest('Verify Soft Delete', 'FAIL', 'Could not read deleted entity')
      return false
    }
    
    // Check if relationships are deactivated
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', TEST_ORG_ID)
      .or(`from_entity_id.eq.${entityIds.productId},to_entity_id.eq.${entityIds.productId}`)
    
    if (relError) {
      logTest('Check Relationship Deactivation', 'FAIL', relError.message)
      return false
    }
    
    const activeRelationships = relationships.filter(r => r.is_active)
    if (activeRelationships.length > 0) {
      logTest('Check Relationship Deactivation', 'FAIL', 'Some relationships still active')
      return false
    }
    logTest('Check Relationship Deactivation', 'PASS', 'All relationships deactivated')
    
    return true
    
  } catch (error) {
    logTest('DELETE with Relationships - Exception', 'FAIL', error.message)
    return false
  }
}

async function runComprehensiveTests() {
  console.log('\n🧪 Starting Comprehensive Enterprise Relationship Tests...\n')
  
  try {
    // Deploy the enterprise function
    const deployed = await deployEnterpriseFunction()
    if (!deployed) {
      console.log('\n❌ Deployment failed. Stopping tests.')
      return
    }
    
    // Test CREATE with relationships
    const entityIds = await testCreateWithRelationships()
    if (!entityIds) {
      console.log('\n❌ CREATE tests failed. Stopping tests.')
      return
    }
    
    // Test READ with relationships
    const readResult = await testReadWithRelationships(entityIds)
    if (!readResult) {
      console.log('\n❌ READ tests failed. Continuing with remaining tests.')
    }
    
    // Test UPDATE with relationships
    const updateResult = await testUpdateWithRelationships(entityIds)
    if (!updateResult) {
      console.log('\n❌ UPDATE tests failed. Continuing with remaining tests.')
    }
    
    // Test validation
    await testRelationshipValidation()
    
    // Test DELETE with relationships
    await testDeleteWithRelationships(entityIds)
    
  } catch (error) {
    logTest('Test Suite - Critical Error', 'FAIL', error.message)
  }
  
  // Print final results
  console.log('\n' + '='.repeat(80))
  console.log('🏁 FINAL TEST RESULTS')
  console.log('='.repeat(80))
  console.log(`📊 Total Tests: ${testResults.total}`)
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`)
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:')
    testResults.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => console.log(`   • ${t.name}: ${t.details || 'No details'}`))
  }
  
  if (testResults.passed === testResults.total) {
    console.log('\n🎉 ALL TESTS PASSED! Enterprise relationship handling is working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.')
  }
  
  console.log('\n✨ Test suite completed.')
}

// Run the comprehensive test suite
runComprehensiveTests().catch(error => {
  console.error('\n💥 Test suite failed with critical error:', error.message)
  process.exit(1)
})