#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const DEMO_USER_ENTITY_ID = '4d93b3f8-dfe8-430c-83ea-3128f6a520cf'

async function checkMemberships() {
  // Get demo auth user
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const demoUser = users.find(u => u.email === 'demo@heraerp.com')

  console.log('\n📧 DEMO USER AUTH DETAILS:\n')
  console.log(`Email: ${demoUser.email}`)
  console.log(`Auth UID: ${demoUser.id}`)
  console.log()

  // Find ALL USER entities
  const { data: userEntities } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code, organization_id, metadata, created_at')
    .eq('entity_type', 'USER')
    .order('created_at', { ascending: false })

  console.log(`\n👤 ALL USER ENTITIES:\n`)
  userEntities.forEach(entity => {
    console.log(`├─ ${entity.entity_name}`)
    console.log(`│  ID: ${entity.id}`)
    console.log(`│  Code: ${entity.entity_code}`)
    console.log(`│  Org: ${entity.organization_id}`)
    console.log(`│  Metadata: ${JSON.stringify(entity.metadata)}`)
    console.log(`│  Created: ${entity.created_at}`)
    console.log('│')
  })

  // Check if entity exists with auth UID
  const platformUserEntity = userEntities.find(e => e.id === demoUser.id)
  console.log(`\n🔍 PLATFORM USER ENTITY (id = auth.users.id):`)
  if (platformUserEntity) {
    console.log(`✅ EXISTS: ${platformUserEntity.entity_name} (${platformUserEntity.id})`)
  } else {
    console.log(`❌ NOT FOUND: No USER entity with id = ${demoUser.id}`)
  }
  console.log()

  console.log('\n🔍 Checking memberships for demo user...\n')

  // Get all memberships for demo user
  const { data: memberships, error } = await supabase
    .from('core_relationships')
    .select(`
      id,
      organization_id,
      relationship_type,
      relationship_data,
      is_active,
      created_at
    `)
    .eq('from_entity_id', DEMO_USER_ENTITY_ID)
    .eq('relationship_type', 'MEMBER_OF')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`Found ${memberships.length} memberships:\n`)

  // Get org details for each membership
  for (const membership of memberships) {
    const { data: org } = await supabase
      .from('core_organizations')
      .select('organization_name, organization_code')
      .eq('id', membership.organization_id)
      .single()

    console.log(`├─ ${org?.organization_name || 'Unknown'} (${org?.organization_code || 'N/A'})`)
    console.log(`│  ID: ${membership.organization_id}`)
    console.log(`│  Role: ${membership.relationship_data?.role || 'unknown'}`)
    console.log(`│  Active: ${membership.is_active}`)
    console.log(`│  Created: ${membership.created_at}`)
    console.log('│')
  }

  // Test introspection
  console.log('\n🔍 Testing introspection...\n')
  const { data: introspect, error: introspectError } = await supabase.rpc(
    'hera_auth_introspect_v1',
    { p_actor_user_id: DEMO_USER_ENTITY_ID }
  )

  if (introspectError) {
    console.error('❌ Introspection error:', introspectError)
  } else {
    console.log(`✅ Organizations: ${introspect.organization_count}`)
    console.log(`   Default Org: ${introspect.default_organization_id}`)
    console.log('\n   Organizations list:')
    introspect.organizations?.forEach((org, index) => {
      const appsList = org.apps?.map(a => a.code).join(', ') || 'none'
      console.log(`   ${index + 1}. ${org.name} (${org.code})`)
      console.log(`      Apps: [${appsList}]`)
      console.log(`      Role: ${org.primary_role}`)
    })
  }
}

checkMemberships()
