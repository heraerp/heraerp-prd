#!/usr/bin/env npx tsx

/**
 * Direct check for RPC function availability
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

// Test each function with minimal params to see the error message
async function testFunction(funcName: string) {
  try {
    const { data, error } = await supabase.rpc(funcName, {})
    
    if (error) {
      return {
        name: funcName,
        error: error.message,
        code: error.code,
        exists: !error.message.toLowerCase().includes('could not find')
      }
    }
    
    return {
      name: funcName,
      exists: true,
      success: true,
      data: data
    }
  } catch (err: any) {
    return {
      name: funcName,
      exists: false,
      error: err.message
    }
  }
}

async function main() {
  console.log('\n🔍 Direct RPC Function Check\n')
  console.log('Testing individual functions to see exact error messages...\n')
  
  // Test a subset of critical functions
  const criticalFunctions = [
    // Entity CRUD
    'hera_entity_upsert_v1',
    'hera_entity_read_v1',
    'hera_entity_query_v1',
    
    // Dynamic Data CRUD  
    'hera_dynamic_data_upsert_v1',
    'hera_dynamic_data_read_v1',
    'hera_dynamic_data_query_v1',
    
    // Relationship CRUD
    'hera_relationship_upsert_v1',
    'hera_relationship_query_v1',
    
    // Transaction CRUD
    'hera_txn_emit_v1',
    'hera_txn_read_v1',
    'hera_txn_query_v1',
    
    // Existing function we know works
    'fn_dynamic_fields_json'
  ]
  
  for (const funcName of criticalFunctions) {
    const result = await testFunction(funcName)
    
    if (result.exists) {
      console.log(`✅ ${funcName}`)
      if (result.error) {
        console.log(`   Error: ${result.error.substring(0, 100)}`)
      }
    } else {
      console.log(`❌ ${funcName}`)
      console.log(`   Error: ${result.error}`)
    }
  }
  
  // Now test with organization_id parameter
  console.log('\n📊 Testing with organization_id parameter...\n')
  
  const TEST_ORG_ID = '719dfed1-09b4-4ca8-bfda-f682460de945'
  
  for (const funcName of ['hera_entity_query_v1', 'hera_dynamic_data_query_v1']) {
    const { data, error } = await supabase.rpc(funcName, {
      p_org_id: TEST_ORG_ID,
      p_filters: {},
      p_limit: 1
    })
    
    if (error) {
      console.log(`❌ ${funcName} with params: ${error.message}`)
    } else {
      console.log(`✅ ${funcName} with params: Success`)
    }
  }
  
  // Check if functions exist under different schema
  console.log('\n🔍 Checking if functions exist in extensions schema...\n')
  
  const extensionsFunctions = [
    'extensions.hera_entity_upsert_v1',
    'extensions.hera_entity_query_v1'
  ]
  
  for (const funcName of extensionsFunctions) {
    const result = await testFunction(funcName)
    console.log(`${result.exists ? '✅' : '❌'} ${funcName}: ${result.exists ? 'Found' : 'Not found'}`)
  }
}

main().catch(console.error)