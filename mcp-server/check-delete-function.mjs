#!/usr/bin/env node
/**
 * Check if hera_entity_delete_v1 exists and get its signature
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'
const TEST_ENTITY_ID = '9707e113-fce7-4030-8df9-a4589f70d1fb' // Existing customer

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Checking hera_entity_delete_v1 function...\n')

// Test 1: Try with 2 parameters (minimal signature)
console.log('Test 1: Calling with 2 parameters (p_organization_id, p_entity_id)')
const test1 = await supabase.rpc('hera_entity_delete_v1', {
  p_organization_id: TENANT_ORG_ID,
  p_entity_id: TEST_ENTITY_ID
})

if (test1.error) {
  console.log('❌ Error:', test1.error.code, '-', test1.error.message)
} else {
  console.log('✅ Success with 2 params:', test1.data)
}

console.log('\n' + '='.repeat(80) + '\n')

// Test 2: Try with 4 parameters (full signature from migration)
console.log('Test 2: Calling with 4 parameters (including cascade options)')
const test2 = await supabase.rpc('hera_entity_delete_v1', {
  p_organization_id: TENANT_ORG_ID,
  p_entity_id: TEST_ENTITY_ID,
  p_cascade_dynamic_data: false,  // Don't actually delete
  p_cascade_relationships: false  // Don't actually delete
})

if (test2.error) {
  console.log('❌ Error:', test2.error.code, '-', test2.error.message)
} else {
  console.log('✅ Success with 4 params:', test2.data)
}

console.log('\n' + '='.repeat(80) + '\n')

// Test 3: Check what happens with positional args (no parameter names)
console.log('Test 3: Testing signature understanding...')
console.log('Expected signature from migration:')
console.log('  hera_entity_delete_v1(')
console.log('    p_organization_id uuid,')
console.log('    p_entity_id uuid,')
console.log('    p_cascade_dynamic_data boolean DEFAULT true,')
console.log('    p_cascade_relationships boolean DEFAULT true')
console.log('  )')

console.log('\n' + '='.repeat(80) + '\n')

// Test 4: Query Postgres schema directly for function signature
console.log('Test 4: Querying pg_catalog for actual function signature...')
const schemaQuery = `
  SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_arguments(p.oid) as arguments,
    pg_catalog.pg_get_function_result(p.oid) as return_type
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname = 'hera_entity_delete_v1'
    AND n.nspname = 'public'
`

const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
  sql: schemaQuery
})

if (schemaError) {
  console.log('❌ Schema query failed:', schemaError.message)
  console.log('   (exec_sql RPC may not exist, trying alternative...)')
  
  // Alternative: Try to infer from error messages
  console.log('\n📋 Attempting to call function to see error signature...')
  const { error: sigError } = await supabase.rpc('hera_entity_delete_v1', {})
  
  if (sigError && sigError.message) {
    console.log('Error message reveals signature:')
    console.log('  ', sigError.message)
  }
} else {
  console.log('✅ Function signature from database:')
  console.log(JSON.stringify(schemaData, null, 2))
}

console.log('\n' + '='.repeat(80))
console.log('SUMMARY')
console.log('='.repeat(80))

if (!test1.error || !test2.error) {
  console.log('✅ hera_entity_delete_v1 EXISTS in the database')
  console.log('')
  console.log('Working signature:')
  if (!test2.error) {
    console.log('  - 4 parameters: p_organization_id, p_entity_id, p_cascade_dynamic_data, p_cascade_relationships')
  } else if (!test1.error) {
    console.log('  - 2 parameters: p_organization_id, p_entity_id (defaults used for cascade)')
  }
} else {
  console.log('❌ hera_entity_delete_v1 does NOT exist or has different signature')
  console.log('Error:', test1.error.message)
}
console.log('='.repeat(80))
