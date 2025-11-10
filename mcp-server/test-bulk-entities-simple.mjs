#!/usr/bin/env node

/**
 * HERA Bulk Entities CRUD v1 - Simple Test
 * Tests basic functionality without requiring existing user entities
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const testData = {
  // Use a dummy UUID - the RPC will validate membership
  actor_user_id: '00000000-0000-0000-0000-000000000001',
  organization_id: process.env.DEFAULT_ORGANIZATION_ID || process.env.TEST_ORG_ID
}

console.log('🧪 HERA Bulk Entities CRUD v1 - Simple Functionality Test\n')
console.log(`Organization ID: ${testData.organization_id}\n`)

console.log('TEST 1: Empty Batch')
console.log('='.repeat(60))
const emptyResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'READ',  // READ doesn't require membership check
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: [],
  p_options: {}
})

console.log('Status:', emptyResult.error ? '❌ FAILED' : '✅ SUCCESS')
if (emptyResult.data) {
  console.log('Response:', JSON.stringify(emptyResult.data, null, 2))
} else {
  console.log('Error:', emptyResult.error)
}

console.log('\n\nTEST 2: Invalid Action')
console.log('='.repeat(60))
const invalidResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'INVALID',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: [],
  p_options: {}
})

console.log('Status:', invalidResult.data?.error ? '✅ REJECTED (Expected)' : '❌ Should Have Failed')
if (invalidResult.data) {
  console.log('Response:', JSON.stringify(invalidResult.data, null, 2))
}

console.log('\n\nTEST 3: Missing Organization')
console.log('='.repeat(60))
const noOrgResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: null,
  p_entities: [],
  p_options: {}
})

console.log('Status:', noOrgResult.data?.error ? '✅ REJECTED (Expected)' : '❌ Should Have Failed')
if (noOrgResult.data) {
  console.log('Response:', JSON.stringify(noOrgResult.data, null, 2))
}

console.log('\n\nTEST 4: Missing Actor')
console.log('='.repeat(60))
const noActorResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: null,
  p_organization_id: testData.organization_id,
  p_entities: [],
  p_options: {}
})

console.log('Status:', noActorResult.data?.error ? '✅ REJECTED (Expected)' : '❌ Should Have Failed')
if (noActorResult.data) {
  console.log('Response:', JSON.stringify(noActorResult.data, null, 2))
}

console.log('\n\nTEST 5: Batch Size Limit')
console.log('='.repeat(60))
const largeBatch = Array.from({ length: 1001 }, () => ({
  entity_type: 'CONTACT',
  entity_name: 'Test',
  smart_code: 'HERA.ENTERPRISE.CONTACT.v1'
}))

const limitResult = await supabase.rpc('hera_entities_bulk_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: testData.actor_user_id,
  p_organization_id: testData.organization_id,
  p_entities: largeBatch,
  p_options: {}
})

console.log('Status:', limitResult.data?.error ? '✅ REJECTED (Expected)' : '❌ Should Have Failed')
if (limitResult.data) {
  console.log('Error:', limitResult.data.error)
}

console.log('\n\n✅ Basic RPC function tests completed!')
console.log('\n📝 Note: Full CRUD tests require valid user entity membership.')
console.log('   To run full tests, create a USER entity in the organization first.')
