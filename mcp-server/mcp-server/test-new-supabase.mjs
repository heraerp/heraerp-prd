import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Testing Supabase Connection')
console.log('📍 Supabase URL:', supabaseUrl)
console.log('🔑 Service Role Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n📊 Test 1: Fetching organizations...')
    const { data: orgs, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, entity_name, entity_type')
      .limit(5)

    if (orgError) {
      console.error('❌ Organization query failed:', orgError.message)
    } else {
      console.log('✅ Organizations found:', orgs.length)
      orgs.forEach(org => {
        console.log(`   - ${org.entity_name} (${org.id})`)
      })
    }

    // Find Hair Talkz Salon organization
    console.log('\n📊 Test 2: Finding Hair Talkz Salon organization...')
    const { data: salonOrgs, error: salonError } = await supabase
      .from('core_organizations')
      .select('id, entity_name')
      .ilike('entity_name', '%hair%talkz%')

    if (salonError) {
      console.error('❌ Salon query failed:', salonError.message)
    } else if (!salonOrgs || salonOrgs.length === 0) {
      console.log('⚠️ Hair Talkz Salon not found in this Supabase instance')
    } else {
      console.log('✅ Hair Talkz Salon found:', salonOrgs[0].id)
      const orgId = salonOrgs[0].id

      // Test RPC call to fetch services
      console.log('\n📊 Test 3: Fetching services using RPC...')
      const { data: rpcResult, error: rpcError } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: '00000000-0000-0000-0000-000000000000',
        p_organization_id: orgId,
        p_entity: {
          entity_type: 'SERVICE'
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {
          limit: 10
        }
      })

      if (rpcError) {
        console.error('❌ RPC call failed:', rpcError.message)
        console.error('   Error details:', rpcError)
      } else {
        console.log('✅ RPC call successful!')
        console.log('   Response structure:', {
          success: rpcResult?.success,
          itemCount: rpcResult?.items?.length || 0,
          hasError: !!rpcResult?.error
        })
        
        if (rpcResult?.items && rpcResult.items.length > 0) {
          console.log('   Services found:', rpcResult.items.length)
          rpcResult.items.slice(0, 3).forEach(service => {
            console.log(`   - ${service.entity_name} (${service.entity_type})`)
          })
        } else {
          console.log('   ⚠️ No services found')
        }
      }
    }

    console.log('\n✅ Connection test completed!')

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
    console.error('   Stack:', error.stack)
  }
}

testConnection()
