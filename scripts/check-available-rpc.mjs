#!/usr/bin/env node

/**
 * Check what RPC functions are available in the database
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkAvailableRpc() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    console.log('🔍 Checking available RPC functions...')
    console.log('='.repeat(50))
    
    // Test the specific functions used in attach endpoint
    const functionsToTest = [
      'hera_entity_upsert_v1',
      'hera_relationship_upsert_v1',
      'resolve_user_identity_v1',
      'resolve_user_roles_in_org'
    ]
    
    for (const funcName of functionsToTest) {
      console.log(`\n📋 Testing ${funcName}:`)
      try {
        // Try calling with minimal params to see if function exists
        const { data, error } = await supabase.rpc(funcName, {})
        
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log('❌ Function does not exist')
          } else if (error.message.includes('argument') || error.message.includes('parameter')) {
            console.log('✅ Function exists (parameter error is expected)')
            console.log('   Error:', error.message.substring(0, 100) + '...')
          } else {
            console.log('⚠️ Function exists but returned error:')
            console.log('   Error:', error.message.substring(0, 100) + '...')
          }
        } else {
          console.log('✅ Function exists and worked')
          console.log('   Result:', data)
        }
      } catch (err) {
        console.log('❌ Function call failed:', err.message.substring(0, 100) + '...')
      }
    }
    
    // Test a simple entity creation to see what works
    console.log('\n🧪 Testing simple entity creation:')
    try {
      const { data: entityTest, error: entityError } = await supabase
        .from('core_entities')
        .insert([{
          id: '00000000-0000-0000-0000-000000000999',
          organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
          entity_type: 'TEST',
          entity_name: 'test-entity',
          entity_code: 'TEST-999',
          smart_code: 'HERA.TEST.ENTITY.V1'
        }])
        .select()
      
      if (entityError) {
        console.log('❌ Direct entity creation failed:', entityError.message)
      } else {
        console.log('✅ Direct entity creation works')
        
        // Clean up test entity
        await supabase
          .from('core_entities')
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000999')
      }
    } catch (err) {
      console.log('❌ Entity test failed:', err.message)
    }

  } catch (error) {
    console.error('❌ Check failed:', error)
  }
}

checkAvailableRpc()