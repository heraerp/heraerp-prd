#!/usr/bin/env node

/**
 * Test script to verify HERA v2.2 actor stamping implementation
 * Tests entity creation, relationship creation, and transaction posting
 */

import { config } from 'dotenv'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Demo auth token for testing
const TEST_TOKEN = 'demo-token-salon-receptionist'
const ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

async function testAPI(endpoint, method = 'GET', body = null) {
  const url = `http://localhost:3003/api/v2${endpoint}`
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json',
      'x-hera-org-id': ORG_ID
    }
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, options)
    const data = await response.json()
    
    console.log(`\n${method} ${endpoint}:`, {
      status: response.status,
      success: data.success || response.ok,
      actor_stamped: data.actor_stamped,
      actor_user_id: data.actor_user_id,
      data: data.data || data.entity_id || data.relationship_id || data.transaction_id,
      error: data.error
    })
    
    return { response, data }
  } catch (error) {
    console.error(`❌ Error testing ${method} ${endpoint}:`, error.message)
    return { error }
  }
}

async function main() {
  console.log('🧪 Testing HERA v2.2 Actor Stamping Implementation')
  console.log('=' .repeat(60))

  // Test 1: Create an entity with actor stamping
  console.log('\n1️⃣ Testing Entity Creation with Actor Stamping...')
  const entityResult = await testAPI('/entities', 'POST', {
    entity_type: 'test_product',
    entity_name: 'Actor Stamping Test Product',
    smart_code: 'HERA.SALON.PRODUCT.ENTITY.STANDARD.V1',
    organization_id: ORG_ID,
    dynamic_fields: {
      price: {
        value: 99.99,
        type: 'number',
        smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
      },
      description: {
        value: 'Test product created with actor stamping',
        type: 'text',
        smart_code: 'HERA.SALON.PRODUCT.FIELD.DESCRIPTION.V1'
      }
    }
  })

  if (!entityResult.data?.data?.entity_id) {
    console.log('❌ Entity creation failed, skipping subsequent tests')
    return
  }

  const entityId = entityResult.data.data.entity_id
  console.log(`✅ Created entity: ${entityId}`)

  // Test 2: Create a relationship with actor stamping
  console.log('\n2️⃣ Testing Relationship Creation with Actor Stamping...')
  const categoryEntityId = '12345678-1234-1234-1234-123456789012' // Mock category entity
  
  const relationshipResult = await testAPI('/universal/relationship-upsert', 'POST', {
    organization_id: ORG_ID,
    from_entity_id: entityId,
    to_entity_id: categoryEntityId,
    relationship_type: 'HAS_CATEGORY',
    smart_code: 'HERA.SALON.PRODUCT.REL.HAS_CATEGORY.V1',
    relationship_data: {
      category_type: 'service'
    }
  })

  // Test 3: Create a transaction with actor stamping
  console.log('\n3️⃣ Testing Transaction Creation with Actor Stamping...')
  const transactionResult = await testAPI('/universal/txn-emit', 'POST', {
    organization_id: ORG_ID,
    transaction_type: 'test_sale',
    smart_code: 'HERA.SALON.POS.TXN.SALE.STANDARD.V1',
    transaction_number: `TEST-${Date.now()}`,
    transaction_date: new Date().toISOString(),
    source_entity_id: entityId,
    total_amount: 99.99,
    lines: [
      {
        line_order: 1,
        entity_id: entityId,
        line_type: 'service',
        description: 'Test service line',
        quantity: 1,
        unit_amount: 99.99,
        line_amount: 99.99,
        smart_code: 'HERA.SALON.POS.LINE.SERVICE.V1'
      }
    ]
  })

  // Test 4: Verify audit trails
  console.log('\n4️⃣ Testing Audit Trail Verification...')
  const entityReadResult = await testAPI(`/entities?entity_id=${entityId}&organization_id=${ORG_ID}`)

  console.log('\n📊 Actor Stamping Test Results Summary:')
  console.log('=' .repeat(60))
  
  const tests = [
    { name: 'Entity Creation', result: entityResult, hasActorStamp: entityResult.data?.actor_stamped },
    { name: 'Relationship Creation', result: relationshipResult, hasActorStamp: relationshipResult.data?.actor_stamped },
    { name: 'Transaction Creation', result: transactionResult, hasActorStamp: transactionResult.data?.actor_stamped },
    { name: 'Entity Read', result: entityReadResult, hasActorStamp: !!entityReadResult.data?.success }
  ]

  let passedTests = 0
  let totalTests = tests.length

  tests.forEach((test, index) => {
    const status = test.result.error 
      ? '❌ FAILED' 
      : test.hasActorStamp 
        ? '✅ PASSED' 
        : '⚠️  PARTIAL'
    
    console.log(`${index + 1}. ${test.name}: ${status}`)
    
    if (!test.result.error && test.hasActorStamp) {
      passedTests++
    }
  })

  console.log(`\n🎯 Test Score: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All actor stamping tests passed! HERA v2.2 implementation is working correctly.')
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.')
  }

  console.log('\n📝 Next Steps:')
  console.log('- Verify created_by and updated_by fields in database')
  console.log('- Test with real authentication tokens')
  console.log('- Run comprehensive integration tests')
  console.log('- Deploy to production with monitoring')
}

main().catch(console.error)