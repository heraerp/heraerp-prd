#!/usr:bin/env node

/**
 * Final comprehensive test with valid smart codes
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const testData = {
  actor_user_id: '4d93b3f8-dfe8-430c-83ea-3128f6a520cf',
  organization_id: 'de5f248d-7747-44f3-9d11-a279f3158fa5'
}

console.log('\n🎯 HERA Bulk Entities CRUD - Final Comprehensive Test\n')
console.log('='.repeat(70))

const testResults = {
  passed: 0,
  failed: 0,
  createdEntities: []
}

// TEST 1: Bulk CREATE with UNIVERSAL smart codes (3 customers)
console.log('\n✅ TEST 1: Bulk CREATE (3 customers, non-atomic)')
const timestamp = Date.now()

const createResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: [
    {
      entity_type: 'CUSTOMER',
      entity_name: `Bulk Test Customer 1 ${timestamp}`,
      entity_code: `BULK${timestamp}01`,
      smart_code: 'HERA.UNIVERSAL.ENTITY.CUSTOMER.v1'
    },
    {
      entity_type: 'CUSTOMER',
      entity_name: `Bulk Test Customer 2 ${timestamp}`,
      entity_code: `BULK${timestamp}02`,
      smart_code: 'HERA.UNIVERSAL.ENTITY.CUSTOMER.v1'
    },
    {
      entity_type: 'CUSTOMER',
      entity_name: `Bulk Test Customer 3 ${timestamp}`,
      entity_code: `BULK${timestamp}03`,
      smart_code: 'HERA.UNIVERSAL.ENTITY.CUSTOMER.v1'
    }
  ],
  p_options: { atomic: false }
})

if (createResult.data) {
  const d = createResult.data
  if (d.succeeded === 3) {
    console.log(`✅ PASS: Created ${d.succeeded}/${d.total} entities`)
    testResults.passed++
    testResults.createdEntities = d.results.filter(r => r.success).map(r => r.entity_id)
  } else {
    console.log(`❌ FAIL: Only ${d.succeeded}/${d.total} succeeded`)
    if (d.failed > 0) {
      d.results.forEach((r, idx) => {
        if (!r.success) {
          console.log(`   Entity ${idx + 1}: ${r.result?.error || 'Unknown error'}`)
        }
      })
    }
    testResults.failed++
  }
} else {
  console.log('❌ FAIL: RPC error:', createResult.error)
  testResults.failed++
}

// TEST 2: Atomic mode - all success
console.log('\n✅ TEST 2: Atomic CREATE (2 customers, atomic mode)')
const atomicResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: [
    {
      entity_type: 'CUSTOMER',
      entity_name: `Atomic Test 1 ${timestamp}`,
      entity_code: `ATOMIC${timestamp}01`,
      smart_code: 'HERA.UNIVERSAL.ENTITY.CUSTOMER.v1'
    },
    {
      entity_type: 'CUSTOMER',
      entity_name: `Atomic Test 2 ${timestamp}`,
      entity_code: `ATOMIC${timestamp}02`,
      smart_code: 'HERA.UNIVERSAL.ENTITY.CUSTOMER.v1'
    }
  ],
  p_options: { atomic: true }
})

if (atomicResult.data) {
  const d = atomicResult.data
  if (d.succeeded === 2 && d.success) {
    console.log(`✅ PASS: Atomic mode created ${d.succeeded}/${d.total} entities`)
    testResults.passed++
    testResults.createdEntities.push(...d.results.filter(r => r.success).map(r => r.entity_id))
  } else {
    console.log(`❌ FAIL: Atomic result - success=${d.success}, succeeded=${d.succeeded}`)
    testResults.failed++
  }
} else {
  console.log('❌ FAIL: RPC error:', atomicResult.error)
  testResults.failed++
}

// TEST 3: Atomic mode - rollback on failure
console.log('\n✅ TEST 3: Atomic ROLLBACK (1 valid + 1 invalid, should rollback all)')
const rollbackResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: [
    {
      entity_type: 'CUSTOMER',
      entity_name: `Rollback Test ${timestamp}`,
      entity_code: `ROLLBACK${timestamp}`,
      smart_code: 'HERA.UNIVERSAL.ENTITY.CUSTOMER.v1'
    },
    {
      entity_type: 'CUSTOMER',
      entity_name: 'Invalid Entity',
      entity_code: 'INVALID',
      smart_code: 'INVALID_SMART_CODE'
    }
  ],
  p_options: { atomic: true }
})

if (rollbackResult.data) {
  const d = rollbackResult.data
  if (!d.success && d.atomic_rollback) {
    console.log('✅ PASS: Atomic rollback worked - all changes rolled back')
    testResults.passed++
  } else {
    console.log(`❌ FAIL: Expected rollback but got success=${d.success}, rollback=${d.atomic_rollback}`)
    testResults.failed++
  }
} else {
  console.log('❌ FAIL: RPC error:', rollbackResult.error)
  testResults.failed++
}

// TEST 4: Non-atomic - continue on error
console.log('\n✅ TEST 4: Non-Atomic (2 valid + 1 invalid, should create 2)')
const nonAtomicResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: [
    {
      entity_type: 'CUSTOMER',
      entity_name: `Non-Atomic 1 ${timestamp}`,
      entity_code: `NONATOMIC${timestamp}01`,
      smart_code: 'HERA.UNIVERSAL.ENTITY.CUSTOMER.v1'
    },
    {
      entity_type: 'CUSTOMER',
      entity_name: 'Invalid',
      smart_code: 'INVALID_CODE'
    },
    {
      entity_type: 'CUSTOMER',
      entity_name: `Non-Atomic 2 ${timestamp}`,
      entity_code: `NONATOMIC${timestamp}02`,
      smart_code: 'HERA.UNIVERSAL.ENTITY.CUSTOMER.v1'
    }
  ],
  p_options: { atomic: false }
})

if (nonAtomicResult.data) {
  const d = nonAtomicResult.data
  if (d.succeeded === 2 && d.failed === 1) {
    console.log(`✅ PASS: Non-atomic continued - ${d.succeeded} created, ${d.failed} failed`)
    testResults.passed++
    testResults.createdEntities.push(...d.results.filter(r => r.success).map(r => r.entity_id))
  } else {
    console.log(`❌ FAIL: Expected 2 success, 1 fail - got ${d.succeeded} success, ${d.failed} fail`)
    testResults.failed++
  }
} else {
  console.log('❌ FAIL: RPC error:', nonAtomicResult.error)
  testResults.failed++
}

// TEST 5: Guardrails
console.log('\n✅ TEST 5: Batch size limit (1001 entities)')
const largeBatch = Array.from({ length: 1001 }, (_, i) => ({
  entity_type: 'CUSTOMER',
  entity_name: `Customer ${i}`,
  smart_code: 'HERA.UNIVERSAL.ENTITY.CUSTOMER.v1'
}))

const limitResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: largeBatch
})

if (limitResult.data && limitResult.data.error && limitResult.data.error.includes('BATCH_TOO_LARGE')) {
  console.log('✅ PASS: Batch size limit enforced correctly')
  testResults.passed++
} else {
  console.log('❌ FAIL: Should have rejected 1001 entities')
  testResults.failed++
}

// SUMMARY
console.log('\n' + '='.repeat(70))
console.log('📊 TEST SUMMARY')
console.log('='.repeat(70))
console.log(`Total Tests: ${testResults.passed + testResults.failed}`)
console.log(`✅ Passed: ${testResults.passed}`)
console.log(`❌ Failed: ${testResults.failed}`)
console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`)

if (testResults.createdEntities.length > 0) {
  console.log(`\n🧹 Created ${testResults.createdEntities.length} test entities`)
  console.log('\nEntity IDs for cleanup:')
  testResults.createdEntities.forEach((id, idx) => {
    console.log(`  ${idx + 1}. ${id}`)
  })
}

console.log('\n' + '='.repeat(70))

if (testResults.failed === 0) {
  console.log('🎉 ALL TESTS PASSED! Bulk RPC is working correctly!')
} else {
  console.log('⚠️  Some tests failed - see details above')
}

console.log()
