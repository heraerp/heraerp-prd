import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testOnboard() {
  console.log('🔍 Testing hera_onboard_user_v1 with correct parameters...\n')

  // Correct parameters based on the hint
  const { data, error } = await supabase.rpc('hera_onboard_user_v1', {
    p_supabase_user_id: '00000000-0000-0000-0000-000000000001',
    p_actor_user_id: '00000000-0000-0000-0000-000000000000',
    p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    p_role: 'owner'
  })

  if (error) {
    console.log('❌ RPC call failed:', error.message)
    console.log('   Error details:', error)
  } else {
    console.log('✅ RPC call successful!')
    console.log('   Result:', JSON.stringify(data, null, 2))
  }
}

testOnboard()
