#!/usr/bin/env node
/**
 * Test: STAFF Relationship Smart Code Map
 *
 * Tests the fix for NULL smart_code constraint violation when creating staff with roles.
 * This validates that relationship_smart_code_map in p_options is correctly used.
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

// Create test role first
let ROLE_ENTITY_ID = null
let STAFF_ENTITY_ID = null

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n🧪 Testing STAFF Relationship Smart Code Map Fix\n')
console.log('=' .repeat(80))

// Step 1: Create a test ROLE entity
console.log('\n📝 Step 1: Creating test ROLE entity...')

const createRolePayload = {
  p_action: 'CREATE',
  p_actor_user_id: ACTOR_USER_ID,
  p_organization_id: TENANT_ORG_ID,
  p_entity: {
    entity_type: 'ROLE',
    entity_name: 'Test Stylist Role',
    smart_code: 'HERA.SALON.ROLE.ENTITY.POSITION.v1',
    entity_code: `ROLE-TEST-${Date.now()}`
  },
  p_dynamic: {
    role_title: {
      value: 'Senior Hair Stylist',
      type: 'text',
      smart_code: 'HERA.SALON.ROLE.DYN.TITLE.v1'
    }
  },
  p_relationships: {},
  p_options: {
    include_dynamic: true
  }
}

console.log('📤 Payload:', JSON.stringify(createRolePayload, null, 2))

const roleResult = await supabase.rpc('hera_entities_crud_v1', createRolePayload)

console.log('\n📥 Response:', JSON.stringify(roleResult, null, 2))

if (roleResult.error) {
  console.log('\n❌ FAILED: Could not create role entity')
  console.log('Error:', roleResult.error)
  process.exit(1)
}

if (roleResult.data?.success === false) {
  console.log('\n❌ FAILED: RPC returned error')
  console.log('Error:', roleResult.data.error)
  process.exit(1)
}

ROLE_ENTITY_ID = roleResult.data?.entity_id

if (!ROLE_ENTITY_ID) {
  console.log('\n❌ FAILED: No role entity ID returned')
  process.exit(1)
}

console.log(`\n✅ SUCCESS: Role entity created with ID: ${ROLE_ENTITY_ID}`)

// Step 2: Create STAFF entity with relationship to ROLE using smart_code_map
console.log('\n' + '='.repeat(80))
console.log('\n📝 Step 2: Creating STAFF entity with STAFF_HAS_ROLE relationship...')

const createStaffPayload = {
  p_action: 'CREATE',
  p_actor_user_id: ACTOR_USER_ID,
  p_organization_id: TENANT_ORG_ID,
  p_entity: {
    entity_type: 'STAFF',
    entity_name: 'Test Staff Member',
    smart_code: 'HERA.SALON.STAFF.ENTITY.PERSON.v1',
    entity_code: `STAFF-TEST-${Date.now()}`
  },
  p_dynamic: {
    first_name: {
      value: 'John',
      type: 'text',
      smart_code: 'HERA.SALON.STAFF.DYN.FIRST.NAME.v1'
    },
    last_name: {
      value: 'Doe',
      type: 'text',
      smart_code: 'HERA.SALON.STAFF.DYN.LAST.NAME.v1'
    },
    email: {
      value: 'john.doe@test.com',
      type: 'text',
      smart_code: 'HERA.SALON.STAFF.DYN.EMAIL.v1'
    }
  },
  p_relationships: {
    STAFF_HAS_ROLE: [ROLE_ENTITY_ID]
  },
  p_options: {
    include_dynamic: true,
    include_relationships: true,
    relationships_mode: 'UPSERT',
    // ✅ FIX: Pass smart_code per relationship type
    relationship_smart_code_map: {
      STAFF_HAS_ROLE: 'HERA.SALON.STAFF.REL.HAS_ROLE.v1'
    }
  }
}

console.log('\n📤 Payload:')
console.log(JSON.stringify(createStaffPayload, null, 2))

const staffResult = await supabase.rpc('hera_entities_crud_v1', createStaffPayload)

console.log('\n📥 Response:')
console.log(JSON.stringify(staffResult, null, 2))

// Validate response
console.log('\n' + '='.repeat(80))
console.log('\n🧪 Validating Response...\n')

let allTestsPassed = true

// Test 1: No RPC error
if (staffResult.error) {
  console.log('❌ Test 1 FAILED: RPC returned error')
  console.log('   Error:', staffResult.error.message)
  allTestsPassed = false
} else {
  console.log('✅ Test 1 PASSED: No RPC error')
}

// Test 2: success = true
if (staffResult.data?.success !== true) {
  console.log('❌ Test 2 FAILED: success !== true')
  console.log('   Value:', staffResult.data?.success)
  console.log('   Error:', staffResult.data?.error)
  allTestsPassed = false
} else {
  console.log('✅ Test 2 PASSED: success = true')
}

// Test 3: entity_id exists
STAFF_ENTITY_ID = staffResult.data?.entity_id

if (!STAFF_ENTITY_ID) {
  console.log('❌ Test 3 FAILED: No entity_id returned')
  allTestsPassed = false
} else {
  console.log(`✅ Test 3 PASSED: entity_id = ${STAFF_ENTITY_ID}`)
}

// Test 4: Entity object returned
const entity = staffResult.data?.data?.entity

if (!entity || !entity.id) {
  console.log('❌ Test 4 FAILED: No entity object returned')
  allTestsPassed = false
} else {
  console.log(`✅ Test 4 PASSED: Entity object returned with ${Object.keys(entity).length} fields`)
}

// Test 5: Entity name correct
if (entity?.entity_name !== 'Test Staff Member') {
  console.log('❌ Test 5 FAILED: entity_name mismatch')
  console.log('   Expected: Test Staff Member')
  console.log('   Got:', entity?.entity_name)
  allTestsPassed = false
} else {
  console.log('✅ Test 5 PASSED: entity_name = "Test Staff Member"')
}

// Test 6: Dynamic data included
const dynamicData = staffResult.data?.data?.dynamic_data

if (!Array.isArray(dynamicData) || dynamicData.length === 0) {
  console.log('❌ Test 6 FAILED: No dynamic_data array or empty')
  allTestsPassed = false
} else {
  console.log(`✅ Test 6 PASSED: dynamic_data array with ${dynamicData.length} fields`)
}

// Test 7: Relationships included
const relationships = staffResult.data?.data?.relationships

if (!Array.isArray(relationships)) {
  console.log('❌ Test 7 FAILED: No relationships array')
  allTestsPassed = false
} else {
  console.log(`✅ Test 7 PASSED: relationships array with ${relationships.length} items`)
}

// Test 8: STAFF_HAS_ROLE relationship exists
const hasRoleRel = relationships?.find(rel =>
  rel.relationship_type === 'STAFF_HAS_ROLE' &&
  rel.to_entity_id === ROLE_ENTITY_ID
)

if (!hasRoleRel) {
  console.log('❌ Test 8 FAILED: STAFF_HAS_ROLE relationship not found')
  console.log('   Expected to_entity_id:', ROLE_ENTITY_ID)
  console.log('   Relationships:', relationships)
  allTestsPassed = false
} else {
  console.log('✅ Test 8 PASSED: STAFF_HAS_ROLE relationship exists')
}

// Test 9: CRITICAL - Relationship has smart_code (not NULL)
if (!hasRoleRel?.smart_code) {
  console.log('❌ Test 9 FAILED: STAFF_HAS_ROLE relationship has NULL smart_code')
  console.log('   This is the bug we are testing for!')
  allTestsPassed = false
} else {
  console.log(`✅ Test 9 PASSED: Relationship smart_code = ${hasRoleRel.smart_code}`)
}

// Test 10: Smart code matches expected pattern
const expectedSmartCode = 'HERA.SALON.STAFF.REL.HAS_ROLE.v1'

if (hasRoleRel?.smart_code !== expectedSmartCode) {
  console.log('❌ Test 10 FAILED: smart_code pattern mismatch')
  console.log('   Expected:', expectedSmartCode)
  console.log('   Got:', hasRoleRel?.smart_code)
  allTestsPassed = false
} else {
  console.log(`✅ Test 10 PASSED: smart_code matches expected pattern`)
}

// Final Summary
console.log('\n' + '='.repeat(80))
console.log('\n📊 TEST SUMMARY\n')

if (allTestsPassed) {
  console.log('✅✅✅ ALL TESTS PASSED ✅✅✅')
  console.log('\nThe relationship_smart_code_map fix is working correctly!')
  console.log('STAFF entities can now be created with roles without NULL smart_code errors.')
} else {
  console.log('❌❌❌ SOME TESTS FAILED ❌❌❌')
  console.log('\nPlease review the failures above.')
  process.exit(1)
}

console.log('\n' + '='.repeat(80) + '\n')
