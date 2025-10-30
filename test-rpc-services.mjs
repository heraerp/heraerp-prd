#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testRPC() {
  // Get the service organization
  const { data: services } = await supabase
    .from('core_entities')
    .select('organization_id')
    .eq('entity_type', 'SERVICE')
    .limit(1)

  const orgId = services?.[0]?.organization_id
  console.log('Service organization ID:', orgId)

  // Get organization details
  const { data: org } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', orgId)
    .single()

  console.log('Organization:', org?.entity_name, '(', org?.entity_type, ')')

  // Get a user from that organization
  const { data: user } = await supabase
    .from('core_entities')
    .select('id')
    .eq('entity_type', 'USER')
    .eq('organization_id', orgId)
    .limit(1)

  console.log('User ID:', user?.[0]?.id)

  // Now test the RPC call
  console.log('\n🔍 Testing RPC call...')
  const { data: rpcData, error: rpcError } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: user?.[0]?.id,
    p_organization_id: orgId,
    p_entity: {
      entity_type: 'SERVICE'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      limit: 100,
      include_dynamic: true,
      include_relationships: true
    }
  })

  if (rpcError) {
    console.error('❌ RPC Error:', rpcError)
  } else {
    console.log('✅ RPC Success!')
    console.log('Response keys:', Object.keys(rpcData || {}))
    console.log('Item count:', rpcData?.items?.length || rpcData?.data?.length || 0)

    if (rpcData?.items && rpcData.items.length > 0) {
      console.log('\nFirst item structure:')
      const first = rpcData.items[0]
      console.log('Keys:', Object.keys(first))
      console.log('Has entity:', Boolean(first.entity))
      console.log('Has dynamic_data:', Boolean(first.dynamic_data))
      console.log('Entity name:', first.entity?.entity_name || first.entity_name)

      console.log('\nFull first item:')
      console.log(JSON.stringify(first, null, 2))
    } else if (rpcData?.data) {
      console.log('\nResponse data structure:')
      console.log(JSON.stringify(rpcData, null, 2))
    }
  }
}

testRPC().catch(console.error)
