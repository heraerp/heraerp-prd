#!/usr/bin/env node
/**
 * Debug script to check why services are not loading
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkServices() {
  console.log('🔍 Checking services in database...\n')

  // 1. Check raw services in core_entities table
  console.log('1️⃣ Checking raw services in core_entities...')
  const { data: rawServices, error: rawError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'SERVICE')
    .limit(5)

  if (rawError) {
    console.error('❌ Error fetching raw services:', rawError)
  } else {
    console.log(`✅ Found ${rawServices?.length || 0} services in core_entities`)
    if (rawServices && rawServices.length > 0) {
      console.log('First service:', JSON.stringify(rawServices[0], null, 2))
    }
  }

  console.log('\n2️⃣ Checking services via RPC (hera_entities_crud_v1)...')

  // Get first organization
  const { data: orgs } = await supabase
    .from('core_organizations')
    .select('id, entity_name')
    .limit(1)

  if (!orgs || orgs.length === 0) {
    console.error('❌ No organizations found!')
    return
  }

  const orgId = orgs[0].id
  console.log(`Using organization: ${orgs[0].entity_name} (${orgId})`)

  // Get first user
  const { data: users } = await supabase
    .from('core_entities')
    .select('id')
    .eq('entity_type', 'USER')
    .limit(1)

  if (!users || users.length === 0) {
    console.error('❌ No users found!')
    return
  }

  const userId = users[0].id
  console.log(`Using user: ${userId}`)

  // Call RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: userId,
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
    console.log('✅ RPC call successful!')
    console.log('Response structure:', {
      hasData: !!rpcData,
      hasItems: !!rpcData?.items,
      hasDataProperty: !!rpcData?.data,
      itemCount: rpcData?.items?.length || rpcData?.data?.length || 0,
      keys: rpcData ? Object.keys(rpcData) : []
    })

    if (rpcData?.items && rpcData.items.length > 0) {
      console.log('\nFirst service from RPC:')
      console.log(JSON.stringify(rpcData.items[0], null, 2))
    } else if (rpcData?.data && Array.isArray(rpcData.data) && rpcData.data.length > 0) {
      console.log('\nFirst service from RPC (data array):')
      console.log(JSON.stringify(rpcData.data[0], null, 2))
    } else {
      console.log('\n⚠️ No services returned from RPC')
      console.log('Full response:', JSON.stringify(rpcData, null, 2))
    }
  }

  console.log('\n3️⃣ Checking dynamic fields for services...')
  const { data: dynamicFields } = await supabase
    .from('core_dynamic_data')
    .select('entity_id, field_name, field_value_text, field_value_number')
    .in('entity_id', rawServices?.map(s => s.id) || [])
    .limit(10)

  console.log(`Found ${dynamicFields?.length || 0} dynamic fields`)
  if (dynamicFields && dynamicFields.length > 0) {
    console.log('Sample dynamic fields:', JSON.stringify(dynamicFields.slice(0, 3), null, 2))
  }

  console.log('\n4️⃣ Checking relationships for services...')
  const { data: relationships } = await supabase
    .from('core_relationships')
    .select('*')
    .in('source_entity_id', rawServices?.map(s => s.id) || [])
    .limit(10)

  console.log(`Found ${relationships?.length || 0} relationships`)
  if (relationships && relationships.length > 0) {
    console.log('Sample relationships:', JSON.stringify(relationships.slice(0, 3), null, 2))
  }
}

checkServices().catch(console.error)
