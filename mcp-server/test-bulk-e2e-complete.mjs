#!/usr/bin/env node

/**
 * HERA Bulk Entities CRUD - Complete E2E Test
 * Tests CREATE, READ, UPDATE, DELETE with proper smart codes
 *
 * Smart Code Rules:
 * - Minimum 6 segments
 * - All UPPERCASE except version
 * - Version in lowercase (e.g., .v1)
 * - No underscores
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
log('🧪 HERA BULK ENTITIES CRUD - COMPLETE E2E TEST', 'cyan')
console.log('='.repeat(80))

console.log('\n📋 Test Configuration:')
console.log(`  Actor: ${testData.actor_user_id}`)
console.log(`  Organization: ${testData.organization_id}`)
console.log(`  Smart Code Format: HERA.DOMAIN.MODULE.TYPE.SUBTYPE.DETAIL.v1`)

const timestamp = Date.now()
const testResults = {
  passed: 0,
  failed: 0,
  createdEntityIds: []
}

// Proper smart codes with 6+ segments, all uppercase, lowercase version
const validSmartCode = 'HERA.SALON.CUSTOMER.ENTITY.PROFILE.DEMO.v1'
const validFieldSmartCode = 'HERA.SALON.CUSTOMER.FIELD.PHONE.NUMBER.v1'

console.log(`\n✅ Using valid smart codes:`)
console.log(`   Entity: ${validSmartCode}`)
console.log(`   Field:  ${validFieldSmartCode}`)

// =============================================================================
// TEST 1: BULK CREATE
// =============================================================================
console.log('\n' + '='.repeat(80))
log('TEST 1: BULK CREATE (3 customers, non-atomic mode)', 'cyan')
console.log('='.repeat(80))

const createResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: [
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: `Bulk Customer One ${timestamp}`,
        entity_code: `BC${timestamp}01`,
        smart_code: validSmartCode
      },
      dynamic: {
        phone: {
          field_name: 'phone',
          field_type: 'text',
          field_value_text: '+1-555-0001',
          smart_code: validFieldSmartCode
        }
      }
    },
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: `Bulk Customer Two ${timestamp}`,
        entity_code: `BC${timestamp}02`,
        smart_code: validSmartCode
      },
      dynamic: {
        phone: {
          field_name: 'phone',
          field_type: 'text',
          field_value_text: '+1-555-0002',
          smart_code: validFieldSmartCode
        }
      }
    },
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: `Bulk Customer Three ${timestamp}`,
        entity_code: `BC${timestamp}03`,
        smart_code: validSmartCode
      },
      dynamic: {
        phone: {
          field_name: 'phone',
          field_type: 'text',
          field_value_text: '+1-555-0003',
          smart_code: validFieldSmartCode
        }
      }
    }
  ],
  p_options: { atomic: false }
})

if (createResult.error) {
  log('❌ FAILED: RPC Error', 'red')
  console.log(createResult.error)
  testResults.failed++
} else if (createResult.data) {
  const d = createResult.data
  if (d.succeeded === 3 && d.failed === 0) {
    log(`✅ PASSED: Created ${d.succeeded}/${d.total} entities successfully`, 'green')
    testResults.passed++
    testResults.createdEntityIds = d.results
      .filter(r => r.success && r.entity_id)
      .map(r => r.entity_id)

    console.log('\nCreated Entity IDs:')
    testResults.createdEntityIds.forEach((id, idx) => {
      console.log(`  ${idx + 1}. ${id}`)
    })
  } else {
    log(`❌ FAILED: Expected 3 success, got ${d.succeeded} success, ${d.failed} failed`, 'red')
    testResults.failed++

    if (d.failed > 0) {
      console.log('\nFailure details:')
      d.results.forEach((r, idx) => {
        if (!r.success) {
          console.log(`  Entity ${idx + 1}: ${r.result?.error || 'Unknown error'}`)
        }
      })
    }
  }
} else {
  log('❌ FAILED: Unexpected response', 'red')
  testResults.failed++
}

// Only continue if CREATE succeeded
if (testResults.createdEntityIds.length === 0) {
  log('\n⚠️  Cannot continue with READ, UPDATE, DELETE tests - CREATE failed', 'yellow')
  console.log('\n' + '='.repeat(80))
  log('TEST SUITE ABORTED', 'red')
  console.log('='.repeat(80))
  process.exit(1)
}

// =============================================================================
// TEST 2: BULK READ
// =============================================================================
console.log('\n' + '='.repeat(80))
log('TEST 2: BULK READ (read created entities)', 'cyan')
console.log('='.repeat(80))

const readResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: testResults.createdEntityIds.map(id => ({
    entity: {
      entity_id: id
    }
  })),
  p_options: {}
})

if (readResult.error) {
  log('❌ FAILED: RPC Error', 'red')
  console.log(readResult.error)
  testResults.failed++
} else if (readResult.data) {
  const d = readResult.data
  if (d.succeeded === 3 && d.failed === 0) {
    log(`✅ PASSED: Read ${d.succeeded}/${d.total} entities successfully`, 'green')
    testResults.passed++

    console.log('\nRead entities:')
    d.results.forEach((r, idx) => {
      if (r.success) {
        const entity = r.result?.entity
        console.log(`  ${idx + 1}. ${entity?.entity_name} (${r.entity_id})`)
      }
    })
  } else {
    log(`❌ FAILED: Expected 3 success, got ${d.succeeded} success, ${d.failed} failed`, 'red')
    testResults.failed++
  }
} else {
  log('❌ FAILED: Unexpected response', 'red')
  testResults.failed++
}

// =============================================================================
// TEST 3: BULK UPDATE
// =============================================================================
console.log('\n' + '='.repeat(80))
log('TEST 3: BULK UPDATE (update entity names)', 'cyan')
console.log('='.repeat(80))

const updateResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'UPDATE',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: testResults.createdEntityIds.map((id, idx) => ({
    entity: {
      entity_id: id,
      entity_name: `UPDATED Customer ${idx + 1} ${timestamp}`,
      smart_code: validSmartCode
    },
    dynamic: {
      phone: {
        field_name: 'phone',
        field_type: 'text',
        field_value_text: `+1-555-999${idx}`,
        smart_code: validFieldSmartCode
      }
    }
  })),
  p_options: {}
})

if (updateResult.error) {
  log('❌ FAILED: RPC Error', 'red')
  console.log(updateResult.error)
  testResults.failed++
} else if (updateResult.data) {
  const d = updateResult.data
  if (d.succeeded === 3 && d.failed === 0) {
    log(`✅ PASSED: Updated ${d.succeeded}/${d.total} entities successfully`, 'green')
    testResults.passed++

    console.log('\nUpdated entities:')
    d.results.forEach((r, idx) => {
      if (r.success) {
        console.log(`  ${idx + 1}. ${r.entity_id} - Updated`)
      }
    })
  } else {
    log(`❌ FAILED: Expected 3 success, got ${d.succeeded} success, ${d.failed} failed`, 'red')
    testResults.failed++

    if (d.failed > 0) {
      console.log('\nFailure details:')
      d.results.forEach((r, idx) => {
        if (!r.success) {
          console.log(`  Entity ${idx + 1}: ${r.result?.error || 'Unknown error'}`)
        }
      })
    }
  }
} else {
  log('❌ FAILED: Unexpected response', 'red')
  testResults.failed++
}

// =============================================================================
// TEST 4: ATOMIC MODE TEST
// =============================================================================
console.log('\n' + '='.repeat(80))
log('TEST 4: ATOMIC MODE (2 valid + 1 invalid, should rollback all)', 'cyan')
console.log('='.repeat(80))

const atomicResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: [
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: `Atomic Test 1 ${timestamp}`,
        entity_code: `AT${timestamp}01`,
        smart_code: validSmartCode
      }
    },
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: `Atomic Test Invalid`,
        entity_code: `AT${timestamp}BAD`,
        smart_code: 'INVALID.CODE'  // Invalid - should cause rollback
      }
    }
  ],
  p_options: { atomic: true }
})

if (atomicResult.data) {
  const d = atomicResult.data
  if (!d.success && d.atomic_rollback) {
    log('✅ PASSED: Atomic rollback worked - all changes rolled back', 'green')
    testResults.passed++
  } else {
    log(`❌ FAILED: Expected atomic rollback, got success=${d.success}, rollback=${d.atomic_rollback}`, 'red')
    testResults.failed++
  }
} else {
  log('❌ FAILED: RPC Error', 'red')
  console.log(atomicResult.error)
  testResults.failed++
}

// =============================================================================
// TEST 5: NON-ATOMIC MODE TEST
// =============================================================================
console.log('\n' + '='.repeat(80))
log('TEST 5: NON-ATOMIC MODE (2 valid + 1 invalid, should create 2)', 'cyan')
console.log('='.repeat(80))

const nonAtomicResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: [
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: `NonAtomic Valid 1 ${timestamp}`,
        entity_code: `NA${timestamp}01`,
        smart_code: validSmartCode
      }
    },
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: `Invalid`,
        smart_code: 'INVALID'  // Invalid - should fail but continue
      }
    },
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: `NonAtomic Valid 2 ${timestamp}`,
        entity_code: `NA${timestamp}02`,
        smart_code: validSmartCode
      }
    }
  ],
  p_options: { atomic: false }
})

if (nonAtomicResult.error) {
  log('❌ FAILED: RPC Error', 'red')
  console.log(nonAtomicResult.error)
  testResults.failed++
} else if (nonAtomicResult.data) {
  const d = nonAtomicResult.data
  if (d.succeeded === 2 && d.failed === 1) {
    log(`✅ PASSED: Non-atomic mode - ${d.succeeded} succeeded, ${d.failed} failed as expected`, 'green')
    testResults.passed++

    // Add successful entities to cleanup list
    d.results.forEach(r => {
      if (r.success && r.entity_id) {
        testResults.createdEntityIds.push(r.entity_id)
      }
    })
  } else {
    log(`❌ FAILED: Expected 2 success + 1 fail, got ${d.succeeded} success, ${d.failed} failed`, 'red')
    testResults.failed++
  }
} else {
  log('❌ FAILED: Unexpected response', 'red')
  testResults.failed++
}

// =============================================================================
// TEST 6: BULK DELETE (CLEANUP)
// =============================================================================
console.log('\n' + '='.repeat(80))
log('TEST 6: BULK DELETE (cleanup all test entities)', 'cyan')
console.log('='.repeat(80))

const deleteResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'DELETE',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: testResults.createdEntityIds.map(id => ({
    entity: {
      entity_id: id
    }
  })),
  p_options: {}
})

if (deleteResult.error) {
  log('❌ FAILED: RPC Error', 'red')
  console.log(deleteResult.error)
  testResults.failed++
} else if (deleteResult.data) {
  const d = deleteResult.data
  const expectedDeletes = testResults.createdEntityIds.length
  if (d.succeeded === expectedDeletes) {
    log(`✅ PASSED: Deleted ${d.succeeded}/${d.total} entities successfully`, 'green')
    testResults.passed++
    testResults.createdEntityIds = [] // Cleared
  } else {
    log(`❌ FAILED: Expected ${expectedDeletes} deletes, got ${d.succeeded} success, ${d.failed} failed`, 'red')
    testResults.failed++
  }
} else {
  log('❌ FAILED: Unexpected response', 'red')
  testResults.failed++
}

// =============================================================================
// FINAL SUMMARY
// =============================================================================
console.log('\n' + '='.repeat(80))
log('📊 E2E TEST SUMMARY', 'cyan')
console.log('='.repeat(80))

console.log(`\nTotal Tests: ${testResults.passed + testResults.failed}`)
log(`✅ Passed: ${testResults.passed}`, 'green')
log(`❌ Failed: ${testResults.failed}`, 'red')

const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)
console.log(`Success Rate: ${successRate}%`)

if (testResults.createdEntityIds.length > 0) {
  log(`\n⚠️  WARNING: ${testResults.createdEntityIds.length} entities not cleaned up`, 'yellow')
  console.log('Manual cleanup required for:')
  testResults.createdEntityIds.forEach((id, idx) => {
    console.log(`  ${idx + 1}. ${id}`)
  })
}

console.log('\n' + '='.repeat(80))

if (testResults.failed === 0) {
  log('🎉 ALL E2E TESTS PASSED! Bulk RPC is production-ready!', 'green')
  process.exit(0)
} else {
  log('⚠️  SOME TESTS FAILED - Review output above', 'yellow')
  process.exit(1)
}
