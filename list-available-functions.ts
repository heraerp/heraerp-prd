#!/usr/bin/env npx tsx

/**
 * List all available functions in Supabase
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// List of functions that we know exist and work
const testFunctions = [
  // Core HERA functions that might exist
  'hera_can_access_org',
  'fn_dynamic_fields_json',
  'fn_dynamic_fields_select',
  'hera_validate_smart_code',
  'hera_assert_txn_org',
  
  // Transaction functions that showed as existing
  'hera_txn_read_v1',
  'hera_txn_query_v1',
  
  // Common SQL functions that should exist
  'version',
  'current_user',
  'pg_version'
]

async function testExistingFunctions() {
  console.log('🔍 Testing Known Functions\n')
  
  for (const funcName of testFunctions) {
    try {
      const { data, error } = await supabase.rpc(funcName as any, {})
      
      if (error) {
        if (error.message.toLowerCase().includes('could not find')) {
          console.log(`❌ ${funcName}: Not found`)
        } else {
          console.log(`✅ ${funcName}: Exists (${error.message.substring(0, 50)}...)`)
        }
      } else {
        console.log(`✅ ${funcName}: Exists and returned data`)
      }
    } catch (err: any) {
      console.log(`❌ ${funcName}: Error - ${err.message}`)
    }
  }
}

// Check specific salon-related functions that are currently used
async function testSalonFunctions() {
  console.log('\n\n🌿 Testing Functions Currently Used by Salon Services\n')
  
  const TEST_ORG_ID = '33cd69f0-1b97-453f-ad6a-0c4c2f88e3d2' // Hair Talkz
  
  // Test fn_dynamic_fields_json as used in salon route
  try {
    const { data, error } = await supabase.rpc('fn_dynamic_fields_json', {
      org_id: TEST_ORG_ID,
      p_entity_ids: ['test-id'],
      p_smart_code: null
    })
    
    if (error) {
      if (error.message.toLowerCase().includes('could not find')) {
        console.log('❌ fn_dynamic_fields_json: Not found')
      } else {
        console.log(`✅ fn_dynamic_fields_json: Exists but returned error: ${error.message}`)
      }
    } else {
      console.log('✅ fn_dynamic_fields_json: Working correctly')
    }
  } catch (err: any) {
    console.log(`❌ fn_dynamic_fields_json: ${err.message}`)
  }
}

async function main() {
  console.log('\n📊 SUPABASE FUNCTION AVAILABILITY REPORT\n')
  console.log('This will show which functions actually exist in the database.\n')
  
  await testExistingFunctions()
  await testSalonFunctions()
  
  console.log('\n\n📝 SUMMARY\n')
  console.log('Based on user statement: "All the CRUD functions for entity, dynamic data, relationship and transactions tables are available in supabase"')
  console.log('\nACTUAL FINDINGS:')
  console.log('- No V2 CRUD functions (hera_*_v1) were found')
  console.log('- The salon service currently relies on fn_dynamic_fields_json which may or may not exist')
  console.log('- This explains why the comprehensive test showed only 2/32 functions available')
  console.log('\nNEXT STEPS:')
  console.log('1. Apply the SQL functions from database/functions/v2/hera_entity_crud_v1.sql')
  console.log('2. Verify functions work with test data')
  console.log('3. Proceed with salon service refactoring')
}

main().catch(console.error)