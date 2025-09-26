#!/usr/bin/env npx tsx

/**
 * Test the specific function that worked yesterday
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || supabaseServiceKey) {
  console.log('Supabase URL:', supabaseUrl)
  console.log('Service key length:', supabaseServiceKey?.length || 0)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Test parameters that might have worked yesterday
const TEST_ORG_ID = '719dfed1-09b4-4ca8-bfda-f682460de945' // HERA Demo Organization
const HAIR_TALKZ_ORG_ID = '33cd69f0-1b97-453f-ad6a-0c4c2f88e3d2' // Hair Talkz Salon

async function testVariations() {
  console.log('🔍 Testing hera_entity_upsert_v1 with various parameter combinations\n')
  
  // Test 1: Minimal parameters
  console.log('Test 1: Minimal parameters')
  try {
    const { data, error } = await supabase.rpc('hera_entity_upsert_v1', {
      p_org_id: TEST_ORG_ID,
      p_entity_type: 'test',
      p_entity_name: 'Test Entity',
      p_smart_code: 'HERA.TEST.ENTITY.V1'
    })
    
    if (error) {
      console.log('❌ Error:', error.message)
      console.log('   Code:', error.code)
      console.log('   Details:', error.details)
    } else {
      console.log('✅ Success! Data:', data)
    }
  } catch (err: any) {
    console.log('❌ Exception:', err.message)
  }
  
  // Test 2: With Hair Talkz org
  console.log('\nTest 2: With Hair Talkz organization')
  try {
    const { data, error } = await supabase.rpc('hera_entity_upsert_v1', {
      p_org_id: HAIR_TALKZ_ORG_ID,
      p_entity_type: 'service',
      p_entity_name: 'Test Salon Service',
      p_smart_code: 'HERA.SALON.SERVICE.TEST.V1'
    })
    
    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      console.log('✅ Success! Data:', data)
    }
  } catch (err: any) {
    console.log('❌ Exception:', err.message)
  }
  
  // Test 3: Check if function exists with different signature
  console.log('\nTest 3: Testing with all optional parameters')
  try {
    const { data, error } = await supabase.rpc('hera_entity_upsert_v1', {
      p_org_id: TEST_ORG_ID,
      p_entity_type: 'customer',
      p_entity_name: 'Test Customer',
      p_smart_code: 'HERA.CRM.CUSTOMER.TEST.V1',
      p_entity_code: 'CUST-001',
      p_entity_id: null,
      p_metadata: { test: true }
    })
    
    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      console.log('✅ Success! Data:', data)
    }
  } catch (err: any) {
    console.log('❌ Exception:', err.message)
  }
  
  // Test 4: Try to get function metadata
  console.log('\nTest 4: Checking function signature via pg_proc')
  try {
    const { data, error } = await supabase.rpc('pg_get_functiondef' as any, {
      funcoid: 'hera_entity_upsert_v1'
    })
    
    if (error) {
      console.log('❌ pg_get_functiondef error:', error.message)
    } else {
      console.log('✅ Function definition:', data)
    }
  } catch (err: any) {
    console.log('❌ pg_get_functiondef exception:', err.message)
  }
  
  // Test 5: Alternative check - see what functions are available
  console.log('\nTest 5: List functions with "hera" in name')
  try {
    // This might not work with RLS, but worth trying
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname, pronargs')
      .ilike('proname', 'hera%')
      .limit(20)
    
    if (error) {
      console.log('❌ Cannot query pg_proc:', error.message)
    } else if (data && data.length > 0) {
      console.log('✅ Found HERA functions:')
      data.forEach(func => {
        console.log(`  - ${func.proname} (${func.pronargs} args)`)
      })
    } else {
      console.log('❌ No HERA functions found')
    }
  } catch (err: any) {
    console.log('❌ Exception querying functions:', err.message)
  }
}

async function main() {
  console.log('🧪 TESTING YESTERDAY\'S WORKING FUNCTION\n')
  console.log('Database:', supabaseUrl.replace(/https:\/\/([^.]*).*/,'$1'))
  console.log('Testing hera_entity_upsert_v1 that reportedly worked yesterday...\n')
  
  await testVariations()
  
  console.log('\n📋 CONCLUSION:')
  console.log('If any of the above tests succeeded, the function exists.')
  console.log('If all failed with "could not find function", it was likely removed or never applied.')
}

main().catch(console.error)