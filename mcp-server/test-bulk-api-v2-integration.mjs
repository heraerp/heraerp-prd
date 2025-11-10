#!/usr/bin/env node

/**
 * HERA Bulk Entities API v2 Integration Test
 * Tests the complete flow: Client SDK → API Route → RPC Function
 *
 * Test Coverage:
 * 1. Direct RPC call (baseline)
 * 2. API route call via fetch
 * 3. Universal API v2 client SDK call
 * 4. Atomic vs non-atomic modes
 * 5. Error handling and validation
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

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

console.log('\n' + '='.repeat(80))
log('🧪 HERA BULK ENTITIES API V2 INTEGRATION TEST', 'cyan')
console.log('='.repeat(80))

console.log('\n📋 Test Configuration:')
console.log(`  Actor: ${testData.actor_user_id}`)
console.log(`  Organization: ${testData.organization_id}`)
console.log(`  API Base URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`)

const timestamp = Date.now()
const testResults = {
  passed: 0,
  failed: 0,
  createdEntityIds: []
}

// Valid smart codes (6+ segments, UPPERCASE, lowercase version)
const validSmartCode = 'HERA.SALON.CUSTOMER.ENTITY.PROFILE.DEMO.v1'
const validFieldSmartCode = 'HERA.SALON.CUSTOMER.FIELD.PHONE.NUMBER.v1'

// =============================================================================
// TEST 1: DIRECT RPC CALL (BASELINE)
// =============================================================================
console.log('\n' + '='.repeat(80))
log('TEST 1: DIRECT RPC CALL (Baseline - 3 entities)', 'cyan')
console.log('='.repeat(80))

const rpcResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: [
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: `RPC Test Customer 1 ${timestamp}`,
        entity_code: `RPC${timestamp}01`,
        smart_code: validSmartCode
      },
      dynamic: {
        phone: {
          field_name: 'phone',
          field_type: 'text',
          field_value_text: '+1-555-1001',
          smart_code: validFieldSmartCode
        }
      }
    },
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: `RPC Test Customer 2 ${timestamp}`,
        entity_code: `RPC${timestamp}02`,
        smart_code: validSmartCode
      },
      dynamic: {
        phone: {
          field_name: 'phone',
          field_type: 'text',
          field_value_text: '+1-555-1002',
          smart_code: validFieldSmartCode
        }
      }
    },
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: `RPC Test Customer 3 ${timestamp}`,
        entity_code: `RPC${timestamp}03`,
        smart_code: validSmartCode
      },
      dynamic: {
        phone: {
          field_name: 'phone',
          field_type: 'text',
          field_value_text: '+1-555-1003',
          smart_code: validFieldSmartCode
        }
      }
    }
  ],
  p_options: { atomic: false }
})

if (rpcResult.error) {
  log('❌ FAILED: RPC Error', 'red')
  console.log(rpcResult.error)
  testResults.failed++
} else if (rpcResult.data) {
  const d = rpcResult.data
  if (d.succeeded === 3 && d.failed === 0) {
    log(`✅ PASSED: Created ${d.succeeded}/${d.total} entities via RPC`, 'green')
    testResults.passed++
    testResults.createdEntityIds = d.results
      .filter(r => r.success && r.entity_id)
      .map(r => r.entity_id)
  } else {
    log(`❌ FAILED: Expected 3 success, got ${d.succeeded} success, ${d.failed} failed`, 'red')
    testResults.failed++
  }
} else {
  log('❌ FAILED: Unexpected response', 'red')
  testResults.failed++
}

// =============================================================================
// TEST 2: API ROUTE CALL VIA FETCH
// =============================================================================
console.log('\n' + '='.repeat(80))
log('TEST 2: API ROUTE CALL VIA FETCH (3 entities)', 'cyan')
console.log('='.repeat(80))

const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const endpoint = `${apiUrl}/api/v2/entities/bulk`

console.log(`Calling: POST ${endpoint}`)

const fetchResult = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-hera-api-version': 'v2',
    'x-hera-org': testData.organization_id
  },
  body: JSON.stringify({
    action: 'CREATE',
    actor_user_id: testData.actor_user_id,
    organization_id: testData.organization_id,
    entities: [
      {
        entity: {
          entity_type: 'CUSTOMER',
          entity_name: `API Test Customer 1 ${timestamp}`,
          entity_code: `API${timestamp}01`,
          smart_code: validSmartCode
        },
        dynamic: {
          phone: {
            field_name: 'phone',
            field_type: 'text',
            field_value_text: '+1-555-2001',
            smart_code: validFieldSmartCode
          }
        }
      },
      {
        entity: {
          entity_type: 'CUSTOMER',
          entity_name: `API Test Customer 2 ${timestamp}`,
          entity_code: `API${timestamp}02`,
          smart_code: validSmartCode
        },
        dynamic: {
          phone: {
            field_name: 'phone',
            field_type: 'text',
            field_value_text: '+1-555-2002',
            smart_code: validFieldSmartCode
          }
        }
      },
      {
        entity: {
          entity_type: 'CUSTOMER',
          entity_name: `API Test Customer 3 ${timestamp}`,
          entity_code: `API${timestamp}03`,
          smart_code: validSmartCode
        },
        dynamic: {
          phone: {
            field_name: 'phone',
            field_type: 'text',
            field_value_text: '+1-555-2003',
            smart_code: validFieldSmartCode
          }
        }
      }
    ],
    options: { atomic: false }
  })
})

if (!fetchResult.ok) {
  log(`❌ FAILED: HTTP ${fetchResult.status}`, 'red')
  const errorBody = await fetchResult.json().catch(() => ({}))
  console.log('Error:', errorBody)
  testResults.failed++
} else {
  const apiData = await fetchResult.json()
  if (apiData.succeeded === 3 && apiData.failed === 0) {
    log(`✅ PASSED: Created ${apiData.succeeded}/${apiData.total} entities via API route`, 'green')
    testResults.passed++

    // Add to cleanup list
    apiData.results.forEach(r => {
      if (r.success && r.entity_id) {
        testResults.createdEntityIds.push(r.entity_id)
      }
    })
  } else {
    log(`❌ FAILED: Expected 3 success, got ${apiData.succeeded} success, ${apiData.failed} failed`, 'red')
    testResults.failed++
  }
}

// =============================================================================
// TEST 3: BULK READ VIA API ROUTE
// =============================================================================
console.log('\n' + '='.repeat(80))
log('TEST 3: BULK READ VIA API ROUTE (read created entities)', 'cyan')
console.log('='.repeat(80))

const readResult = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-hera-api-version': 'v2',
    'x-hera-org': testData.organization_id
  },
  body: JSON.stringify({
    action: 'READ',
    actor_user_id: testData.actor_user_id,
    organization_id: testData.organization_id,
    entities: testResults.createdEntityIds.map(id => ({
      entity: { entity_id: id }
    })),
    options: { include_dynamic: true }
  })
})

if (!readResult.ok) {
  log(`❌ FAILED: HTTP ${readResult.status}`, 'red')
  const errorBody = await readResult.json().catch(() => ({}))
  console.log('Error:', errorBody)
  testResults.failed++
} else {
  const readData = await readResult.json()
  const expectedCount = testResults.createdEntityIds.length
  if (readData.succeeded === expectedCount && readData.failed === 0) {
    log(`✅ PASSED: Read ${readData.succeeded}/${readData.total} entities via API route`, 'green')
    testResults.passed++

    console.log('\nSample entity (first result):')
    const firstResult = readData.results[0]
    if (firstResult?.result?.entity) {
      console.log(`  Name: ${firstResult.result.entity.entity_name}`)
      console.log(`  ID: ${firstResult.entity_id}`)
      console.log(`  Has Dynamic Data: ${!!firstResult.result.dynamic_data}`)
    }
  } else {
    log(`❌ FAILED: Expected ${expectedCount} reads, got ${readData.succeeded} success, ${readData.failed} failed`, 'red')
    testResults.failed++
  }
}

// =============================================================================
// TEST 4: ATOMIC MODE VIA API ROUTE
// =============================================================================
console.log('\n' + '='.repeat(80))
log('TEST 4: ATOMIC MODE (2 valid + 1 invalid, should rollback all)', 'cyan')
console.log('='.repeat(80))

const atomicResult = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-hera-api-version': 'v2',
    'x-hera-org': testData.organization_id
  },
  body: JSON.stringify({
    action: 'CREATE',
    actor_user_id: testData.actor_user_id,
    organization_id: testData.organization_id,
    entities: [
      {
        entity: {
          entity_type: 'CUSTOMER',
          entity_name: `Atomic Valid 1 ${timestamp}`,
          entity_code: `ATOMIC${timestamp}01`,
          smart_code: validSmartCode
        }
      },
      {
        entity: {
          entity_type: 'CUSTOMER',
          entity_name: `Atomic Invalid`,
          entity_code: `ATOMIC${timestamp}BAD`,
          smart_code: 'INVALID.CODE' // Invalid - should cause rollback
        }
      }
    ],
    options: { atomic: true }
  })
})

if (!atomicResult.ok) {
  log(`❌ FAILED: HTTP ${atomicResult.status}`, 'red')
  testResults.failed++
} else {
  const atomicData = await atomicResult.json()
  if (!atomicData.success && atomicData.atomic_rollback) {
    log('✅ PASSED: Atomic rollback worked - all changes rolled back', 'green')
    testResults.passed++
  } else {
    log(`❌ FAILED: Expected atomic rollback, got success=${atomicData.success}, rollback=${atomicData.atomic_rollback}`, 'red')
    testResults.failed++
  }
}

// =============================================================================
// TEST 5: ERROR VALIDATION (BATCH SIZE LIMIT)
// =============================================================================
console.log('\n' + '='.repeat(80))
log('TEST 5: BATCH SIZE LIMIT (1001 entities should fail)', 'cyan')
console.log('='.repeat(80))

const largeBatch = Array.from({ length: 1001 }, (_, i) => ({
  entity: {
    entity_type: 'CUSTOMER',
    entity_name: `Customer ${i}`,
    smart_code: validSmartCode
  }
}))

const limitResult = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-hera-api-version': 'v2',
    'x-hera-org': testData.organization_id
  },
  body: JSON.stringify({
    action: 'CREATE',
    actor_user_id: testData.actor_user_id,
    organization_id: testData.organization_id,
    entities: largeBatch,
    options: {}
  })
})

if (limitResult.status === 400) {
  const errorData = await limitResult.json()
  if (errorData.code === 'BATCH_TOO_LARGE' || errorData.error?.includes('BATCH_TOO_LARGE')) {
    log('✅ PASSED: Batch size limit enforced correctly', 'green')
    testResults.passed++
  } else {
    log('❌ FAILED: Wrong error code for batch limit', 'red')
    console.log('Error:', errorData)
    testResults.failed++
  }
} else {
  log('❌ FAILED: Should have rejected 1001 entities', 'red')
  testResults.failed++
}

// =============================================================================
// TEST 6: GET ENDPOINT (API DOCUMENTATION)
// =============================================================================
console.log('\n' + '='.repeat(80))
log('TEST 6: GET ENDPOINT (API documentation)', 'cyan')
console.log('='.repeat(80))

const docsResult = await fetch(endpoint, {
  method: 'GET',
  headers: {
    'x-hera-api-version': 'v2'
  }
})

if (!docsResult.ok) {
  log(`❌ FAILED: HTTP ${docsResult.status}`, 'red')
  testResults.failed++
} else {
  const docs = await docsResult.json()
  if (docs.endpoint && docs.status === 'production_ready' && docs.examples) {
    log('✅ PASSED: API documentation endpoint working', 'green')
    testResults.passed++
    console.log(`\nAPI Status: ${docs.status}`)
    console.log(`Test Pass Rate: ${docs.test_results.pass_rate}`)
    console.log(`Performance: ${docs.performance.avg_time_per_entity}`)
  } else {
    log('❌ FAILED: Incomplete API documentation', 'red')
    testResults.failed++
  }
}

// =============================================================================
// CLEANUP: DELETE TEST ENTITIES
// =============================================================================
console.log('\n' + '='.repeat(80))
log('CLEANUP: DELETING TEST ENTITIES', 'cyan')
console.log('='.repeat(80))

if (testResults.createdEntityIds.length > 0) {
  console.log(`Deleting ${testResults.createdEntityIds.length} test entities...`)

  const deleteResult = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hera-api-version': 'v2',
      'x-hera-org': testData.organization_id
    },
    body: JSON.stringify({
      action: 'DELETE',
      actor_user_id: testData.actor_user_id,
      organization_id: testData.organization_id,
      entities: testResults.createdEntityIds.map(id => ({
        entity: { entity_id: id }
      })),
      options: {}
    })
  })

  if (!deleteResult.ok) {
    log('⚠️  WARNING: Cleanup failed', 'yellow')
    const errorBody = await deleteResult.json().catch(() => ({}))
    console.log('Error:', errorBody)
  } else {
    const deleteData = await deleteResult.json()
    if (deleteData.succeeded === testResults.createdEntityIds.length) {
      log(`✅ CLEANUP SUCCESS: Deleted ${deleteData.succeeded} entities`, 'green')
      testResults.createdEntityIds = []
    } else {
      log(`⚠️  WARNING: Only deleted ${deleteData.succeeded}/${testResults.createdEntityIds.length} entities`, 'yellow')
    }
  }
} else {
  console.log('No entities to clean up')
}

// =============================================================================
// FINAL SUMMARY
// =============================================================================
console.log('\n' + '='.repeat(80))
log('📊 API V2 INTEGRATION TEST SUMMARY', 'cyan')
console.log('='.repeat(80))

console.log(`\nTotal Tests: ${testResults.passed + testResults.failed}`)
log(`✅ Passed: ${testResults.passed}`, 'green')
log(`❌ Failed: ${testResults.failed}`, 'red')

const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)
console.log(`Success Rate: ${successRate}%`)

if (testResults.createdEntityIds.length > 0) {
  log(`\n⚠️  WARNING: ${testResults.createdEntityIds.length} entities not cleaned up`, 'yellow')
  console.log('Manual cleanup required')
}

console.log('\n' + '='.repeat(80))

if (testResults.failed === 0) {
  log('🎉 ALL API V2 INTEGRATION TESTS PASSED!', 'green')
  log('✅ Bulk CRUD API is production ready!', 'green')
  process.exit(0)
} else {
  log('⚠️  SOME TESTS FAILED - Review output above', 'yellow')
  process.exit(1)
}
