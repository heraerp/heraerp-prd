/**
 * Test script to verify dynamic data fix for edge case values
 * Tests that values like 0, false, and '' are properly saved and retrieved
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testDynamicDataFix() {
  console.log('🧪 Testing Dynamic Data Fix for Edge Case Values\n')

  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  const testEntityName = `TEST_PRODUCT_${Date.now()}`

  try {
    // Step 0: Get or create a test user for actor stamping
    console.log('📝 Step 0: Getting test user for actor stamping...')
    const { data: existingUsers } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .eq('entity_type', 'user')
      .limit(1)

    let actorUserId
    if (existingUsers && existingUsers.length > 0) {
      actorUserId = existingUsers[0].id
      console.log(`✅ Using existing user: ${actorUserId}\n`)
    } else {
      console.log('⚠️  No users found - test will be limited\n')
      actorUserId = '00000000-0000-0000-0000-000000000001' // Dummy ID
    }

    // Step 1: Create test product entity
    console.log('📝 Step 1: Creating test product entity...')
    const { data: entityId, error: createError } = await supabase.rpc('hera_entity_upsert_v1', {
      p_organization_id: organizationId,
      p_entity_type: 'product',
      p_entity_name: testEntityName,
      p_smart_code: 'HERA.SALON.PROD.ENT.RETAIL.V1',
      p_entity_code: `TEST_${Date.now()}`,
      p_entity_id: null,
      p_entity_description: null,
      p_parent_entity_id: null,
      p_status: 'active',
      p_tags: null,
      p_smart_code_status: null,
      p_business_rules: null,
      p_metadata: null,
      p_ai_confidence: null,
      p_ai_classification: null,
      p_ai_insights: null,
      p_actor_user_id: actorUserId
    })

    if (createError) {
      console.error('❌ Failed to create entity:', createError)
      return
    }

    console.log(`✅ Entity created with ID: ${entityId}\n`)

    // Step 2: Set dynamic fields with edge case values
    console.log('📝 Step 2: Setting dynamic fields with edge case values...')
    console.log('   - price_cost: 0 (number, edge case)')
    console.log('   - stock_quantity: 100 (number, normal)')
    console.log('   - is_featured: false (boolean, edge case)')
    console.log('   - is_active: true (boolean, normal)')
    console.log('   - description: "" (text, edge case)')
    console.log('   - brand: "Test Brand" (text, normal)\n')

    const testFields = [
      {
        field_name: 'price_cost',
        field_type: 'number',
        field_value_number: 0, // Edge case: number with value 0
        value: 0,
        smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.COST.V1'
      },
      {
        field_name: 'stock_quantity',
        field_type: 'number',
        field_value_number: 100, // Normal number
        value: 100,
        smart_code: 'HERA.SALON.PRODUCT.DYN.STOCK.QTY.V1'
      },
      {
        field_name: 'is_featured',
        field_type: 'boolean',
        field_value_boolean: false, // Edge case: boolean with value false
        value: false,
        smart_code: 'HERA.SALON.PRODUCT.DYN.FEATURED.V1'
      },
      {
        field_name: 'is_active',
        field_type: 'boolean',
        field_value_boolean: true, // Normal boolean
        value: true,
        smart_code: 'HERA.SALON.PRODUCT.DYN.ACTIVE.V1'
      },
      {
        field_name: 'description',
        field_type: 'text',
        field_value_text: '', // Edge case: empty string
        value: '',
        smart_code: 'HERA.SALON.PRODUCT.DYN.DESC.V1'
      },
      {
        field_name: 'brand',
        field_type: 'text',
        field_value_text: 'Test Brand', // Normal text
        value: 'Test Brand',
        smart_code: 'HERA.SALON.PRODUCT.DYN.BRAND.V1'
      }
    ]

    const { data: batchResult, error: batchError } = await supabase.rpc('hera_dynamic_data_batch_v1', {
      p_organization_id: organizationId,
      p_entity_id: entityId,
      p_items: testFields,
      p_actor_user_id: actorUserId
    })

    if (batchError) {
      console.error('❌ Failed to set dynamic fields:', batchError)
      return
    }

    console.log('✅ Dynamic fields set successfully\n')

    // Step 3: Read back dynamic data to verify
    console.log('📝 Step 3: Reading back dynamic data to verify...\n')

    const { data: readData, error: readError } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_type, field_value_number, field_value_boolean, field_value_text')
      .eq('organization_id', organizationId)
      .eq('entity_id', entityId)

    if (readError) {
      console.error('❌ Failed to read dynamic data:', readError)
      return
    }

    console.log('📊 Raw database values:')
    readData.forEach(field => {
      let value
      if (field.field_type === 'number') {
        value = field.field_value_number
      } else if (field.field_type === 'boolean') {
        value = field.field_value_boolean
      } else if (field.field_type === 'text') {
        value = field.field_value_text
      }

      console.log(`   ${field.field_name} (${field.field_type}): ${JSON.stringify(value)}`)
    })

    // Step 4: Verify edge cases
    console.log('\n🔍 Step 4: Verifying edge cases...\n')

    const priceCost = readData.find(f => f.field_name === 'price_cost')
    const isFeatured = readData.find(f => f.field_name === 'is_featured')
    const description = readData.find(f => f.field_name === 'description')

    let allPassed = true

    // Test 1: Number with value 0
    if (priceCost && priceCost.field_value_number === 0) {
      console.log('✅ Test 1 PASSED: Number field with value 0 is preserved')
    } else {
      console.log(`❌ Test 1 FAILED: Expected price_cost = 0, got ${priceCost?.field_value_number}`)
      allPassed = false
    }

    // Test 2: Boolean with value false
    if (isFeatured && isFeatured.field_value_boolean === false) {
      console.log('✅ Test 2 PASSED: Boolean field with value false is preserved')
    } else {
      console.log(`❌ Test 2 FAILED: Expected is_featured = false, got ${isFeatured?.field_value_boolean}`)
      allPassed = false
    }

    // Test 3: Text with empty string
    if (description && description.field_value_text === '') {
      console.log('✅ Test 3 PASSED: Text field with empty string is preserved')
    } else {
      console.log(`❌ Test 3 FAILED: Expected description = "", got "${description?.field_value_text}"`)
      allPassed = false
    }

    console.log('\n' + '='.repeat(60))
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! Dynamic data fix is working correctly.')
    } else {
      console.log('⚠️  SOME TESTS FAILED! There may still be issues with dynamic data.')
    }
    console.log('='.repeat(60) + '\n')

    // Step 5: Cleanup - delete test entity
    console.log('🧹 Step 5: Cleaning up test entity...')
    await supabase
      .from('core_entities')
      .delete()
      .eq('id', entityId)
      .eq('organization_id', organizationId)

    console.log('✅ Test complete!\n')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testDynamicDataFix().catch(console.error)
