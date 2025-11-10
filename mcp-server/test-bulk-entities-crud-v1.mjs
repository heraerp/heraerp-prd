#!/usr/bin/env node

/**
 * HERA Bulk Entities CRUD v1 - Comprehensive Test Suite
 *
 * Tests the deployed hera_entities_bulk_crud_v1 RPC function
 *
 * Usage:
 *   node test-bulk-entities-crud-v1.mjs
 *
 * Environment Variables Required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - DEFAULT_ORGANIZATION_ID (or TEST_ORG_ID)
 *   - TEST_USER_ID (actor entity ID)
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Test configuration
const testData = {
  actor_user_id: process.env.TEST_USER_ID || process.env.DEFAULT_USER_ID,
  organization_id: process.env.TEST_ORG_ID || process.env.DEFAULT_ORGANIZATION_ID
}

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(80))
  log(title, 'bright')
  console.log('='.repeat(80))
}

function logTest(testNumber, description) {
  log(`\n${testNumber}. ${description}`, 'cyan')
  console.log('-'.repeat(80))
}

function logResult(success, message, data = null) {
  if (success) {
    log(`✅ ${message}`, 'green')
  } else {
    log(`❌ ${message}`, 'red')
  }
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}

// Test suite
async function runTests() {
  logSection('🧪 HERA BULK ENTITIES CRUD v1 - COMPREHENSIVE TEST SUITE')

  log('\n📋 Test Configuration:', 'bright')
  console.log(`  Actor User ID: ${testData.actor_user_id}`)
  console.log(`  Organization ID: ${testData.organization_id}`)
  console.log(`  Supabase URL: ${process.env.SUPABASE_URL}`)

  if (!testData.actor_user_id || !testData.organization_id) {
    logResult(false, 'Missing required environment variables')
    console.log('\nRequired environment variables:')
    console.log('  - SUPABASE_URL')
    console.log('  - SUPABASE_SERVICE_ROLE_KEY')
    console.log('  - TEST_ORG_ID (or DEFAULT_ORGANIZATION_ID)')
    console.log('  - TEST_USER_ID (or DEFAULT_USER_ID)')
    process.exit(1)
  }

  const createdEntityIds = []
  let testsPassed = 0
  let testsFailed = 0

  try {
    // ===== TEST 1: Empty Batch =====
    logTest('TEST 1', 'Empty Batch Handling')
    const emptyResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: testData.actor_user_id,
      p_organization_id: testData.organization_id,
      p_entities: [],
      p_options: {}
    })

    if (emptyResult.error) {
      logResult(false, 'Empty batch test failed', emptyResult.error)
      testsFailed++
    } else if (emptyResult.data.total === 0 && emptyResult.data.success) {
      logResult(true, 'Empty batch handled correctly')
      console.log(`  Total: ${emptyResult.data.total}`)
      console.log(`  Succeeded: ${emptyResult.data.succeeded}`)
      console.log(`  Failed: ${emptyResult.data.failed}`)
      testsPassed++
    } else {
      logResult(false, 'Unexpected empty batch response', emptyResult.data)
      testsFailed++
    }

    // ===== TEST 2: Basic Bulk CREATE (Non-Atomic) =====
    logTest('TEST 2', 'Basic Bulk CREATE (Non-Atomic Mode)')
    const createResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: testData.actor_user_id,
      p_organization_id: testData.organization_id,
      p_entities: [
        {
          entity: {
            entity_type: 'CONTACT',
            entity_name: 'Bulk Test Contact 1',
            entity_code: 'BULK-TEST-001',
            smart_code: 'HERA.ENTERPRISE.CONTACT.v1'
          },
          dynamic: {
            email: {
              field_type: 'text',
              field_value: 'bulk1@example.com',
              smart_code: 'HERA.ENTERPRISE.CONTACT.FIELD.EMAIL.v1'
            }
          }
        },
        {
          entity: {
            entity_type: 'CONTACT',
            entity_name: 'Bulk Test Contact 2',
            entity_code: 'BULK-TEST-002',
            smart_code: 'HERA.ENTERPRISE.CONTACT.v1'
          },
          dynamic: {
            email: {
              field_type: 'text',
              field_value: 'bulk2@example.com',
              smart_code: 'HERA.ENTERPRISE.CONTACT.FIELD.EMAIL.v1'
            }
          }
        },
        {
          entity: {
            entity_type: 'CONTACT',
            entity_name: 'Bulk Test Contact 3',
            entity_code: 'BULK-TEST-003',
            smart_code: 'HERA.ENTERPRISE.CONTACT.v1'
          }
        }
      ],
      p_options: { atomic: false }
    })

    if (createResult.error) {
      logResult(false, 'Bulk CREATE failed', createResult.error)
      testsFailed++
    } else if (createResult.data.succeeded === 3) {
      logResult(true, 'Bulk CREATE succeeded')
      console.log(`  Total: ${createResult.data.total}`)
      console.log(`  Succeeded: ${createResult.data.succeeded}`)
      console.log(`  Failed: ${createResult.data.failed}`)
      console.log(`  Atomic Mode: ${createResult.data.atomic}`)

      // Store created entity IDs for cleanup
      createResult.data.results.forEach(result => {
        if (result.success && result.entity_id) {
          createdEntityIds.push(result.entity_id)
        }
      })
      testsPassed++
    } else {
      logResult(false, 'Unexpected CREATE result', createResult.data)
      testsFailed++
    }

    // ===== TEST 3: Atomic Mode - All Success =====
    logTest('TEST 3', 'Atomic Mode - All Entities Valid')
    const atomicSuccessResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: testData.actor_user_id,
      p_organization_id: testData.organization_id,
      p_entities: [
        {
          entity: {
            entity_type: 'CONTACT',
            entity_name: 'Atomic Test Contact 1',
            entity_code: 'ATOMIC-TEST-001',
            smart_code: 'HERA.ENTERPRISE.CONTACT.v1'
          }
        },
        {
          entity: {
            entity_type: 'CONTACT',
            entity_name: 'Atomic Test Contact 2',
            entity_code: 'ATOMIC-TEST-002',
            smart_code: 'HERA.ENTERPRISE.CONTACT.v1'
          }
        }
      ],
      p_options: { atomic: true }
    })

    if (atomicSuccessResult.error) {
      logResult(false, 'Atomic success test failed', atomicSuccessResult.error)
      testsFailed++
    } else if (atomicSuccessResult.data.succeeded === 2 && atomicSuccessResult.data.success) {
      logResult(true, 'Atomic mode with all valid entities succeeded')
      console.log(`  Total: ${atomicSuccessResult.data.total}`)
      console.log(`  Succeeded: ${atomicSuccessResult.data.succeeded}`)
      console.log(`  Failed: ${atomicSuccessResult.data.failed}`)

      atomicSuccessResult.data.results.forEach(result => {
        if (result.success && result.entity_id) {
          createdEntityIds.push(result.entity_id)
        }
      })
      testsPassed++
    } else {
      logResult(false, 'Unexpected atomic success result', atomicSuccessResult.data)
      testsFailed++
    }

    // ===== TEST 4: Atomic Mode - Rollback on Failure =====
    logTest('TEST 4', 'Atomic Mode - Rollback on Failure')
    const atomicFailResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: testData.actor_user_id,
      p_organization_id: testData.organization_id,
      p_entities: [
        {
          entity: {
            entity_type: 'CONTACT',
            entity_name: 'Will Rollback Contact 1',
            entity_code: 'ROLLBACK-001',
            smart_code: 'HERA.ENTERPRISE.CONTACT.v1'
          }
        },
        {
          entity: {
            entity_type: 'CONTACT',
            entity_name: 'Invalid Smart Code',
            entity_code: 'ROLLBACK-002',
            smart_code: 'INVALID_SMART_CODE'  // This should fail
          }
        }
      ],
      p_options: { atomic: true }
    })

    // In atomic mode, we expect the whole batch to fail
    if (atomicFailResult.data && atomicFailResult.data.success === false && atomicFailResult.data.atomic_rollback) {
      logResult(true, 'Atomic rollback worked correctly - all changes rolled back')
      console.log(`  Total: ${atomicFailResult.data.total}`)
      console.log(`  Succeeded: ${atomicFailResult.data.succeeded}`)
      console.log(`  Failed: ${atomicFailResult.data.failed}`)
      console.log(`  Atomic Rollback: ${atomicFailResult.data.atomic_rollback}`)
      console.log(`  Error: ${atomicFailResult.data.error}`)
      testsPassed++
    } else {
      logResult(false, 'Atomic rollback test failed - expected rollback', atomicFailResult.data || atomicFailResult.error)
      testsFailed++
    }

    // ===== TEST 5: Non-Atomic Mode - Continue on Error =====
    logTest('TEST 5', 'Non-Atomic Mode - Continue on Error')
    const nonAtomicResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: testData.actor_user_id,
      p_organization_id: testData.organization_id,
      p_entities: [
        {
          entity: {
            entity_type: 'CONTACT',
            entity_name: 'Non-Atomic Valid 1',
            entity_code: 'NON-ATOMIC-001',
            smart_code: 'HERA.ENTERPRISE.CONTACT.v1'
          }
        },
        {
          entity: {
            entity_type: 'CONTACT',
            entity_name: 'Non-Atomic Invalid',
            entity_code: 'NON-ATOMIC-002',
            smart_code: 'INVALID_SMART_CODE'  // This should fail
          }
        },
        {
          entity: {
            entity_type: 'CONTACT',
            entity_name: 'Non-Atomic Valid 2',
            entity_code: 'NON-ATOMIC-003',
            smart_code: 'HERA.ENTERPRISE.CONTACT.v1'
          }
        }
      ],
      p_options: { atomic: false }
    })

    if (nonAtomicResult.error) {
      logResult(false, 'Non-atomic test failed', nonAtomicResult.error)
      testsFailed++
    } else if (nonAtomicResult.data.succeeded === 2 && nonAtomicResult.data.failed === 1) {
      logResult(true, 'Non-atomic mode continued processing after error')
      console.log(`  Total: ${nonAtomicResult.data.total}`)
      console.log(`  Succeeded: ${nonAtomicResult.data.succeeded}`)
      console.log(`  Failed: ${nonAtomicResult.data.failed}`)

      nonAtomicResult.data.results.forEach((result, idx) => {
        if (result.success && result.entity_id) {
          createdEntityIds.push(result.entity_id)
          console.log(`  ✅ Entity ${idx}: ${result.entity_id}`)
        } else {
          console.log(`  ❌ Entity ${idx}: ${result.result?.error || 'Unknown error'}`)
        }
      })
      testsPassed++
    } else {
      logResult(false, 'Unexpected non-atomic result', nonAtomicResult.data)
      testsFailed++
    }

    // ===== TEST 6: Batch Size Limit =====
    logTest('TEST 6', 'Batch Size Limit (1000 entities)')
    const largeBatch = Array.from({ length: 1001 }, (_, i) => ({
      entity: {
        entity_type: 'CONTACT',
        entity_name: `Large Batch Contact ${i}`,
        entity_code: `LARGE-${i}`,
        smart_code: 'HERA.ENTERPRISE.CONTACT.v1'
      }
    }))

    const batchLimitResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: testData.actor_user_id,
      p_organization_id: testData.organization_id,
      p_entities: largeBatch,
      p_options: {}
    })

    if (batchLimitResult.data && batchLimitResult.data.success === false &&
        batchLimitResult.data.error && batchLimitResult.data.error.includes('BATCH_TOO_LARGE')) {
      logResult(true, 'Batch size limit enforced correctly')
      console.log(`  Error: ${batchLimitResult.data.error}`)
      testsPassed++
    } else {
      logResult(false, 'Batch size limit test failed - should reject 1001 entities',
        batchLimitResult.data || batchLimitResult.error)
      testsFailed++
    }

    // ===== TEST 7: Invalid Action =====
    logTest('TEST 7', 'Invalid Action Validation')
    const invalidActionResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
      p_action: 'INVALID_ACTION',
      p_actor_user_id: testData.actor_user_id,
      p_organization_id: testData.organization_id,
      p_entities: [],
      p_options: {}
    })

    if (invalidActionResult.data && invalidActionResult.data.success === false &&
        invalidActionResult.data.error && invalidActionResult.data.error.includes('INVALID_ACTION')) {
      logResult(true, 'Invalid action rejected correctly')
      console.log(`  Error: ${invalidActionResult.data.error}`)
      testsPassed++
    } else {
      logResult(false, 'Invalid action test failed', invalidActionResult.data || invalidActionResult.error)
      testsFailed++
    }

    // ===== TEST 8: Missing Organization ID =====
    logTest('TEST 8', 'Missing Organization ID Validation')
    const noOrgResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: testData.actor_user_id,
      p_organization_id: null,
      p_entities: [],
      p_options: {}
    })

    if (noOrgResult.data && noOrgResult.data.success === false &&
        noOrgResult.data.error && noOrgResult.data.error.includes('ORG_REQUIRED')) {
      logResult(true, 'Missing organization ID rejected correctly')
      console.log(`  Error: ${noOrgResult.data.error}`)
      testsPassed++
    } else {
      logResult(false, 'Missing org test failed', noOrgResult.data || noOrgResult.error)
      testsFailed++
    }

    // ===== TEST 9: Missing Actor ID =====
    logTest('TEST 9', 'Missing Actor ID Validation')
    const noActorResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: null,
      p_organization_id: testData.organization_id,
      p_entities: [],
      p_options: {}
    })

    if (noActorResult.data && noActorResult.data.success === false &&
        noActorResult.data.error && noActorResult.data.error.includes('ACTOR_REQUIRED')) {
      logResult(true, 'Missing actor ID rejected correctly')
      console.log(`  Error: ${noActorResult.data.error}`)
      testsPassed++
    } else {
      logResult(false, 'Missing actor test failed', noActorResult.data || noActorResult.error)
      testsFailed++
    }

    // ===== TEST 10: Bare Entity Format =====
    logTest('TEST 10', 'Bare Entity Format (Without Envelope)')
    const bareEntityResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: testData.actor_user_id,
      p_organization_id: testData.organization_id,
      p_entities: [
        {
          entity_type: 'CONTACT',
          entity_name: 'Bare Format Contact',
          entity_code: 'BARE-001',
          smart_code: 'HERA.ENTERPRISE.CONTACT.v1'
        }
      ],
      p_options: { atomic: false }
    })

    if (bareEntityResult.error) {
      logResult(false, 'Bare entity format test failed', bareEntityResult.error)
      testsFailed++
    } else if (bareEntityResult.data.succeeded === 1) {
      logResult(true, 'Bare entity format handled correctly')
      console.log(`  Total: ${bareEntityResult.data.total}`)
      console.log(`  Succeeded: ${bareEntityResult.data.succeeded}`)

      if (bareEntityResult.data.results[0]?.entity_id) {
        createdEntityIds.push(bareEntityResult.data.results[0].entity_id)
      }
      testsPassed++
    } else {
      logResult(false, 'Unexpected bare entity result', bareEntityResult.data)
      testsFailed++
    }

  } catch (error) {
    logResult(false, 'Test suite encountered unexpected error', error)
    testsFailed++
  }

  // ===== TEST SUMMARY =====
  logSection('📊 TEST SUMMARY')
  console.log(`Total Tests: ${testsPassed + testsFailed}`)
  log(`✅ Passed: ${testsPassed}`, 'green')
  log(`❌ Failed: ${testsFailed}`, 'red')
  console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`)

  if (createdEntityIds.length > 0) {
    log(`\n🧹 Created ${createdEntityIds.length} test entities during tests`, 'yellow')
    console.log('Entity IDs for manual cleanup if needed:')
    createdEntityIds.forEach(id => console.log(`  - ${id}`))
  }

  logSection('🎯 TEST SUITE COMPLETE')

  if (testsFailed === 0) {
    log('🎉 ALL TESTS PASSED! RPC function is working correctly.', 'green')
    process.exit(0)
  } else {
    log('⚠️  SOME TESTS FAILED - Review output above', 'red')
    process.exit(1)
  }
}

// Run the test suite
runTests().catch(error => {
  console.error('\n❌ Fatal error running test suite:')
  console.error(error)
  process.exit(1)
})
