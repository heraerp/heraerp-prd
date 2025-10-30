import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testIntrospect() {
  console.log('🔍 Testing hera_auth_introspect_v1 RPC function...\n')

  // Test with a valid user ID (platform admin/owner)
  const testUserId = '00000000-0000-0000-0000-000000000001'

  const { data, error } = await supabase.rpc('hera_auth_introspect_v1', {
    p_actor_user_id: testUserId
  })

  if (error) {
    console.log('❌ RPC call failed:', error.message)
    console.log('   Error details:', error)
  } else {
    console.log('✅ RPC call successful!')
    console.log('   Result:', JSON.stringify(data, null, 2))
  }
}

testIntrospect()
