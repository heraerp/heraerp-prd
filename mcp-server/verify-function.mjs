#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('\n🔍 Verifying hera_txn_crud_v1 function...\n')

// Try to call with minimal parameters
const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: '00000000-0000-0000-0000-000000000001',
  p_organization_id: process.env.DEFAULT_ORGANIZATION_ID,
  p_payload: {}
})

if (error) {
  console.log('❌ Function call failed:', error.message)
  console.log('   Error code:', error.code)
  console.log('   Details:', error.details)
  console.log('\n💡 This likely means:')
  console.log('   1. Function signature mismatch')
  console.log('   2. Function not deployed')
  console.log('   3. Wrong parameter names')
} else {
  console.log('✅ Function is callable!')
  console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 200))
}

console.log('\n')
