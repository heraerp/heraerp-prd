/**
 * Final Comprehensive Test: hera_entities_crud_v2 Relationship Handling
 *
 * Purpose: Test if relationships are ACTUALLY created and returned properly
 *
 * Tests:
 * 1. Create entity WITH relationships in single call
 * 2. Verify relationships were created in database
 * 3. Read entity back with include_relationships: true
 * 4. Verify relationships are returned in response
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

async function testRelationshipHandling() {
  console.log('🔍 FINAL TEST: hera_entities_crud_v2 Relationship Handling\n')
  console.log('Test Parameters:')
  console.log(`  User ID: ${TEST_USER_ID}`)
  console.log(`  Org ID: ${TEST_ORG_ID}\n`)
  console.log('=' .repeat(70))

  // Step 1: Create a target entity to relate to (e.g., a category)
  console.log('\n📝 Step 1: Create Target Entity (Category)')
  console.log('=' .repeat(70))

  const { data: categoryResult, error: categoryError } = await supabase.rpc('hera_entities_crud_v2', {
    p_action: 'create',
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_entity: {
      entity_type: 'CATEGORY',
      entity_name: 'Premium Hair Products',
      smart_code: 'HERA.TEST.CATEGORY.PREMIUM.V1'
    },
    p_dynamic: null,
    p_relationships: null,
    p_options: {}
  })

  if (categoryError) {
    console.error('❌ Category creation failed:', categoryError)
    return
  }

  if (!categoryResult?.items || categoryResult.items.length === 0) {
    console.error('❌ No category returned')
    return
  }

  const categoryId = categoryResult.items[0].id
  console.log('✅ Category Created:', categoryId)
  console.log('   Name:', categoryResult.items[0].entity_name)

  // Step 2: Create entity WITH relationship in single call
  console.log('\n📝 Step 2: Create Entity WITH Relationship (Product → Category)')
  console.log('=' .repeat(70))

  const createWithRelPayload = {
    p_action: 'create',
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_entity: {
      entity_type: 'PRODUCT',
      entity_name: 'Premium Shampoo',
      smart_code: 'HERA.TEST.PRODUCT.SHAMPOO.V1'
    },
    p_dynamic: {
      price: {
        field_type: 'number',
        field_value_number: 49.99,
        smart_code: 'HERA.TEST.PRODUCT.DYN.PRICE.V1'
      }
    },
    p_relationships: [
      {
        to_entity_id: categoryId,
        relationship_type: 'HAS_CATEGORY',
        smart_code: 'HERA.TEST.PRODUCT.REL.CATEGORY.V1'
      }
    ],
    p_options: {}
  }

  console.log('Request Payload:')
  console.log(JSON.stringify(createWithRelPayload, null, 2))

  const { data: productResult, error: productError } = await supabase.rpc(
    'hera_entities_crud_v2',
    createWithRelPayload
  )

  if (productError) {
    console.error('\n❌ Product creation with relationship FAILED:', productError)
    await cleanup(categoryId, null)
    return
  }

  console.log('\n✅ RPC Call Succeeded')
  console.log('Full Response:')
  console.log(JSON.stringify(productResult, null, 2))

  if (!productResult?.items || productResult.items.length === 0) {
    console.error('\n❌ No product returned in response')
    await cleanup(categoryId, null)
    return
  }

  const productId = productResult.items[0].id
  console.log(`\n✅ Product Created: ${productId}`)
  console.log(`   Name: ${productResult.items[0].entity_name}`)

  // Step 3: Verify relationship was created in database (direct query)
  console.log('\n📝 Step 3: Verify Relationship in Database (Direct Query)')
  console.log('=' .repeat(70))

  const { data: directRels, error: directError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', productId)
    .eq('organization_id', TEST_ORG_ID)

  if (directError) {
    console.error('❌ Direct query error:', directError)
  } else {
    console.log(`\n📊 Found ${directRels.length} relationship(s) in database:`)
    if (directRels.length > 0) {
      directRels.forEach((rel, idx) => {
        console.log(`\nRelationship ${idx + 1}:`)
        console.log(`  ID: ${rel.id}`)
        console.log(`  From: ${rel.from_entity_id} (Product)`)
        console.log(`  To: ${rel.to_entity_id} (Category)`)
        console.log(`  Type: ${rel.relationship_type}`)
        console.log(`  Smart Code: ${rel.smart_code}`)
        console.log(`  Is Active: ${rel.is_active}`)
      })
    } else {
      console.log('⚠️  No relationships found in database!')
    }
  }

  // Step 4: Read entity back with include_relationships: true
  console.log('\n📝 Step 4: Read Entity WITH include_relationships: true')
  console.log('=' .repeat(70))

  const readPayload = {
    p_action: 'read',
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_entity: null,
    p_dynamic: null,
    p_relationships: null,
    p_options: {
      where: { id: productId },
      include_relationships: true,
      include_dynamic: true
    }
  }

  console.log('Request Payload:')
  console.log(JSON.stringify(readPayload, null, 2))

  const { data: readResult, error: readError } = await supabase.rpc(
    'hera_entities_crud_v2',
    readPayload
  )

  if (readError) {
    console.error('\n❌ READ operation FAILED:', readError)
  } else {
    console.log('\n✅ READ operation succeeded')
    console.log('Full Response:')
    console.log(JSON.stringify(readResult, null, 2))

    if (readResult?.items && readResult.items.length > 0) {
      const entity = readResult.items[0]
      console.log('\n📊 Entity Data Analysis:')
      console.log(`  Entity ID: ${entity.id}`)
      console.log(`  Entity Name: ${entity.entity_name}`)
      console.log(`  Has 'relationships' field: ${entity.relationships ? 'YES' : 'NO'}`)

      if (entity.relationships) {
        const relType = typeof entity.relationships
        const relKeys = relType === 'object' ? Object.keys(entity.relationships) : []
        console.log(`  Relationships type: ${relType}`)
        console.log(`  Relationships keys: [${relKeys.join(', ')}]`)
        console.log(`  Relationships empty: ${relKeys.length === 0 ? 'YES ⚠️' : 'NO ✅'}`)

        if (relKeys.length > 0) {
          console.log('\n  📋 Relationships Content:')
          console.log(JSON.stringify(entity.relationships, null, 4))
        }
      }

      console.log(`  Has 'dynamic' field: ${entity.dynamic ? 'YES' : 'NO'}`)
      if (entity.dynamic) {
        console.log(`  Dynamic fields: ${JSON.stringify(entity.dynamic)}`)
      }
    }
  }

  // Step 5: Try reading with different approaches
  console.log('\n📝 Step 5: Alternative Read Approaches')
  console.log('=' .repeat(70))

  // Try LIST action instead of READ
  console.log('\n🔍 Trying LIST action with filters...')
  const { data: listResult, error: listError } = await supabase.rpc('hera_entities_crud_v2', {
    p_action: 'list',
    p_actor_user_id: TEST_USER_ID,
    p_organization_id: TEST_ORG_ID,
    p_entity: null,
    p_dynamic: null,
    p_relationships: null,
    p_options: {
      entity_type: 'PRODUCT',
      include_relationships: true,
      limit: 10
    }
  })

  if (listError) {
    console.log('❌ LIST action not supported or failed:', listError.message)
  } else {
    console.log('✅ LIST action succeeded')
    const products = listResult?.items || []
    const ourProduct = products.find(p => p.id === productId)
    if (ourProduct) {
      console.log('📊 Our product found in list:')
      console.log(`  Has relationships: ${ourProduct.relationships ? 'YES' : 'NO'}`)
      if (ourProduct.relationships && Object.keys(ourProduct.relationships).length > 0) {
        console.log('  Relationships:', JSON.stringify(ourProduct.relationships, null, 2))
      }
    }
  }

  // Final Summary
  console.log('\n' + '=' .repeat(70))
  console.log('📊 FINAL TEST SUMMARY')
  console.log('=' .repeat(70))
  console.log(`✅ Category Created: ${categoryId}`)
  console.log(`✅ Product Created: ${productId}`)
  console.log(`✅ Relationship Requested in CREATE: YES`)
  console.log(`📊 Relationship in Database: ${directRels?.length > 0 ? 'YES ✅' : 'NO ❌'}`)
  console.log(`📊 Relationship Returned by RPC: ${readResult?.items?.[0]?.relationships && Object.keys(readResult.items[0].relationships).length > 0 ? 'YES ✅' : 'NO ❌'}`)

  if (directRels?.length > 0 && (!readResult?.items?.[0]?.relationships || Object.keys(readResult.items[0].relationships).length === 0)) {
    console.log('\n❌ CONFIRMED BUG:')
    console.log('   - Relationship EXISTS in database')
    console.log('   - Relationship NOT returned by hera_entities_crud_v2')
    console.log('   - include_relationships: true is IGNORED')
  } else if (directRels?.length === 0) {
    console.log('\n❌ RELATIONSHIP CREATION FAILED:')
    console.log('   - p_relationships was provided in CREATE')
    console.log('   - No relationship found in database')
    console.log('   - RPC did not create the relationship')
  } else {
    console.log('\n✅ RELATIONSHIPS WORKING CORRECTLY!')
  }

  // Cleanup
  console.log('\n🧹 Cleaning up test data...')
  await cleanup(categoryId, productId)
  console.log('✅ Cleanup complete')
}

async function cleanup(categoryId, productId) {
  if (productId) {
    await supabase.from('core_relationships').delete().eq('from_entity_id', productId)
    await supabase.from('core_dynamic_data').delete().eq('entity_id', productId)
    await supabase.from('core_entities').delete().eq('id', productId)
  }
  if (categoryId) {
    await supabase.from('core_entities').delete().eq('id', categoryId)
  }
}

// Run the test
testRelationshipHandling().catch(console.error)
