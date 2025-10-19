#!/usr/bin/env node
/**
 * Test Customer CRUD Operations
 * Tests: READ and UPDATE customer with dynamic data
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// ============================================
// Configuration
// ============================================
const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ============================================
// Test 1: List Customers
// ============================================
async function test1_ListCustomers() {
  console.log('\n' + '='.repeat(80))
  console.log('Test #1: List Customers (READ by entity_type)')
  console.log('='.repeat(80))

  const payload = {
    p_action: 'READ',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'CUSTOMER'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      limit: 10,
      include_dynamic: true,
      include_relationships: true
    }
  }

  console.log('\n📤 Payload:')
  console.log(JSON.stringify(payload, null, 2))

  const start = Date.now()
  const result = await supabase.rpc('hera_entities_crud_v1', payload)
  const duration = Date.now() - start

  console.log(`\n⏱️  Duration: ${duration}ms`)

  console.log('\n📥 Response:')
  if (result.error) {
    console.log('❌ RPC Error:', result.error.message)
    return null
  }

  console.log('✅ Success:', result.data?.success)
  console.log('📊 Response structure:', {
    hasData: !!result.data,
    dataKeys: result.data ? Object.keys(result.data) : [],
    hasEntity: !!result.data?.data?.entity,
    hasList: !!result.data?.data?.list,
    listLength: result.data?.data?.list?.length || 0
  })

  if (result.data?.data?.list?.length > 0) {
    const firstCustomer = result.data.data.list[0]
    console.log('\n👤 First customer:', {
      id: firstCustomer.id,
      entity_name: firstCustomer.entity_name,
      entity_type: firstCustomer.entity_type,
      smart_code: firstCustomer.smart_code,
      allKeys: Object.keys(firstCustomer),
      hasDynamicData: !!firstCustomer.dynamic_data,
      dynamicDataCount: firstCustomer.dynamic_data?.length || 0,
      dynamicFields: firstCustomer.dynamic_data || [],
      hasRelationships: !!firstCustomer.relationships,
      relationshipsCount: firstCustomer.relationships?.length || 0
    })

    return firstCustomer
  }

  console.log('\n⚠️  No customers found')
  return null
}

// ============================================
// Test 2: Read Single Customer by ID
// ============================================
async function test2_ReadCustomerById(customerId) {
  if (!customerId) {
    console.log('\n⚠️  Skipping Test 2: No customer ID provided')
    return null
  }

  console.log('\n' + '='.repeat(80))
  console.log('Test #2: Read Single Customer by ID')
  console.log('='.repeat(80))

  const payload = {
    p_action: 'READ',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_id: customerId
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      include_dynamic: true,
      include_relationships: true
    }
  }

  console.log('\n📤 Payload:')
  console.log(JSON.stringify(payload, null, 2))

  const start = Date.now()
  const result = await supabase.rpc('hera_entities_crud_v1', payload)
  const duration = Date.now() - start

  console.log(`\n⏱️  Duration: ${duration}ms`)

  console.log('\n📥 Response:')
  if (result.error) {
    console.log('❌ RPC Error:', result.error.message)
    return null
  }

  console.log('✅ Success:', result.data?.success)
  console.log('📊 Response structure:', {
    hasData: !!result.data,
    dataKeys: result.data ? Object.keys(result.data) : [],
    hasEntity: !!result.data?.data?.entity,
    hasDynamicData: !!result.data?.data?.dynamic_data,
    dynamicDataCount: result.data?.data?.dynamic_data?.length || 0,
    hasRelationships: !!result.data?.data?.relationships,
    relationshipsCount: result.data?.data?.relationships?.length || 0
  })

  if (result.data?.data?.entity) {
    const customer = result.data.data.entity
    console.log('\n👤 Customer details:', {
      id: customer.id,
      entity_name: customer.entity_name,
      entity_type: customer.entity_type,
      smart_code: customer.smart_code
    })

    console.log('\n📋 Dynamic data:', result.data.data.dynamic_data)
    console.log('\n🔗 Relationships:', result.data.data.relationships)

    return result.data.data
  }

  return null
}

// ============================================
// Test 3: Update Customer with Dynamic Fields
// ============================================
async function test3_UpdateCustomer(customerId) {
  if (!customerId) {
    console.log('\n⚠️  Skipping Test 3: No customer ID provided')
    return null
  }

  console.log('\n' + '='.repeat(80))
  console.log('Test #3: Update Customer with Dynamic Fields')
  console.log('='.repeat(80))

  const payload = {
    p_action: 'UPDATE',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_id: customerId,
      entity_name: 'Test Customer - Updated ' + new Date().toISOString()
    },
    p_dynamic: {
      phone: {
        value: '+971501234567',
        type: 'text',
        smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.V1'
      },
      email: {
        value: 'test@example.com',
        type: 'text',
        smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.V1'
      },
      vip: {
        value: 'true',
        type: 'boolean',
        smart_code: 'HERA.SALON.CUSTOMER.FIELD.VIP.V1'
      }
    },
    p_relationships: {},
    p_options: {
      include_dynamic: true,
      include_relationships: true,
      relationships_mode: 'REPLACE'
    }
  }

  console.log('\n📤 Payload:')
  console.log(JSON.stringify(payload, null, 2))

  const start = Date.now()
  const result = await supabase.rpc('hera_entities_crud_v1', payload)
  const duration = Date.now() - start

  console.log(`\n⏱️  Duration: ${duration}ms`)

  console.log('\n📥 Response:')
  if (result.error) {
    console.log('❌ RPC Error:', result.error.message)
    return null
  }

  console.log('✅ Success:', result.data?.success)
  console.log('📊 Response structure:', {
    hasData: !!result.data,
    dataKeys: result.data ? Object.keys(result.data) : [],
    hasEntity: !!result.data?.data?.entity,
    hasDynamicData: !!result.data?.data?.dynamic_data,
    dynamicDataCount: result.data?.data?.dynamic_data?.length || 0
  })

  if (result.data?.data) {
    console.log('\n✅ Update successful!')
    console.log('Updated entity:', result.data.data.entity)
    console.log('Updated dynamic data:', result.data.data.dynamic_data)
  }

  return result.data
}

// ============================================
// Test 4: Re-read Customer to Verify Update
// ============================================
async function test4_VerifyUpdate(customerId) {
  if (!customerId) {
    console.log('\n⚠️  Skipping Test 4: No customer ID provided')
    return null
  }

  console.log('\n' + '='.repeat(80))
  console.log('Test #4: Re-read Customer to Verify Update')
  console.log('='.repeat(80))

  // Wait a moment for the update to propagate
  await new Promise(resolve => setTimeout(resolve, 500))

  const result = await test2_ReadCustomerById(customerId)

  if (result?.dynamic_data) {
    console.log('\n🔍 Verification:')
    const phone = result.dynamic_data.find(f => f.field_name === 'phone')
    const email = result.dynamic_data.find(f => f.field_name === 'email')
    const vip = result.dynamic_data.find(f => f.field_name === 'vip')

    console.log('  📞 Phone:', phone?.field_value_text || 'NOT FOUND')
    console.log('  📧 Email:', email?.field_value_text || 'NOT FOUND')
    console.log('  ⭐ VIP:', vip?.field_value_boolean || 'NOT FOUND')

    if (phone?.field_value_text === '+971501234567' &&
        email?.field_value_text === 'test@example.com' &&
        vip?.field_value_boolean === true) {
      console.log('\n✅ UPDATE VERIFIED: All fields updated correctly!')
      return true
    } else {
      console.log('\n❌ UPDATE VERIFICATION FAILED: Fields do not match expected values')
      return false
    }
  }

  console.log('\n❌ UPDATE VERIFICATION FAILED: No dynamic data returned')
  return false
}

// ============================================
// Main Test Runner
// ============================================
async function runTests() {
  console.log('\n' + '='.repeat(80))
  console.log('HERA CUSTOMER CRUD TEST')
  console.log('Testing: hera_entities_crud_v1 with CUSTOMER entity')
  console.log('='.repeat(80))

  console.log('\n📋 Configuration:')
  console.log(`   Organization: ${TENANT_ORG_ID}`)
  console.log(`   Actor:        ${ACTOR_USER_ID}`)

  try {
    // Test 1: List customers
    const firstCustomer = await test1_ListCustomers()

    if (!firstCustomer) {
      console.log('\n❌ No customers found. Cannot continue with tests.')
      return
    }

    const customerId = firstCustomer.id
    console.log(`\n🎯 Using customer ID: ${customerId}`)

    // Test 2: Read single customer
    await test2_ReadCustomerById(customerId)

    // Test 3: Update customer
    await test3_UpdateCustomer(customerId)

    // Test 4: Verify update
    const verified = await test4_VerifyUpdate(customerId)

    // Summary
    console.log('\n\n' + '='.repeat(80))
    console.log('TEST SUMMARY')
    console.log('='.repeat(80))

    if (verified) {
      console.log('\n✅ ALL TESTS PASSED!')
      console.log('   - Customers can be listed with dynamic data')
      console.log('   - Single customer can be read with dynamic data')
      console.log('   - Customer can be updated with new dynamic data')
      console.log('   - Updates are persisted and can be verified')
    } else {
      console.log('\n❌ TESTS FAILED!')
      console.log('   Check the logs above for details')
    }

    console.log('\n' + '='.repeat(80))

  } catch (error) {
    console.error('\n❌ Test suite failed with error:')
    console.error(error)
  }
}

// Run the test suite
runTests().catch(error => {
  console.error('\n❌ Fatal error:')
  console.error(error)
  process.exit(1)
})
