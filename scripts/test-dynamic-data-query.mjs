#!/usr/bin/env node

/**
 * Test the dynamic data query that might be failing
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'
const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function testDynamicDataQuery() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    console.log('🔍 Testing dynamic data query')
    console.log('='.repeat(40))
    console.log('User ID:', USER_ID)
    console.log('Org ID:', ORG_ID)
    
    // This is the exact query from resolveUserEntity line 61-65
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json, field_type, smart_code')
      .eq('entity_id', USER_ID)
      .eq('organization_id', ORG_ID)
    
    console.log('\n📊 Dynamic Data Query Result:')
    if (dynamicError) {
      console.log('❌ Error:', dynamicError)
    } else {
      console.log(`✅ Found ${dynamicData?.length || 0} dynamic data records`)
      dynamicData?.forEach(d => {
        console.log(`  - Field: ${d.field_name}`)
        console.log(`  - Type: ${d.field_type}`)
        console.log(`  - Value: ${d.field_value_text || JSON.stringify(d.field_value_json)}`)
      })
    }
    
    // Also check what dynamic data exists for this user in any org
    const { data: allDynamicData, error: allError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', USER_ID)
    
    console.log('\n📊 All Dynamic Data for User:')
    if (allError) {
      console.log('❌ Error:', allError)
    } else {
      console.log(`📊 Found ${allDynamicData?.length || 0} total dynamic data records`)
      allDynamicData?.forEach(d => {
        console.log(`  - Field: ${d.field_name}`)
        console.log(`  - Org: ${d.organization_id}`)
        console.log(`  - Type: ${d.field_type}`)
        console.log(`  - Value: ${d.field_value_text || JSON.stringify(d.field_value_json)}`)
        console.log('  ---')
      })
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDynamicDataQuery()