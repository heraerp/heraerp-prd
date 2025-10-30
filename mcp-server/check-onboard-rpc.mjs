import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkOnboardRPC() {
  console.log('🔍 Checking hera_onboard_user_v1 RPC function...\n')

  // Check if RPC exists by querying pg_proc
  const { data: rpcInfo, error: rpcError } = await supabase.rpc('hera_onboard_user_v1', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    p_role: 'owner',
    p_metadata: {}
  })

  if (rpcError) {
    console.log('❌ RPC call failed:', rpcError.message)
    console.log('   Error code:', rpcError.code)
    console.log('   Error details:', rpcError.details)
    console.log('   Hint:', rpcError.hint)
  } else {
    console.log('✅ RPC exists and returned:')
    console.log(JSON.stringify(rpcInfo, null, 2))
  }

  // Check what RPC functions exist
  console.log('\n🔍 Listing available HERA RPC functions...')
  const { data: functions, error: funcError } = await supabase
    .from('pg_proc')
    .select('proname')
    .like('proname', 'hera_%')
    .limit(20)

  if (funcError) {
    console.log('❌ Cannot list functions:', funcError.message)
  } else {
    console.log('✅ Available HERA RPC functions:')
    functions.forEach(f => console.log('  -', f.proname))
  }
}

checkOnboardRPC()
