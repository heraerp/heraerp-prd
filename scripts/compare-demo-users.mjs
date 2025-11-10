#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function compareUsers() {
  console.log('🔍 Comparing demo@heraerp.com vs salon@heraerp.com\n')

  try {
    // Check both users
    const users = [
      { email: 'hairtalkz01@gmail.com', name: 'Production User (WORKING)' },
      { email: 'salon@heraerp.com', name: 'New Salon Demo User (LOOPING)' }
    ]

    for (const userInfo of users) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📋 Checking ${userInfo.name} (${userInfo.email})`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      // Find auth user
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()
      if (listError) throw listError

      const authUser = authUsers.users.find(u => u.email === userInfo.email)
      if (!authUser) {
        console.log(`❌ Auth user not found for ${userInfo.email}\n`)
        continue
      }

      console.log(`✅ Auth User ID: ${authUser.id}`)

      // Find USER entity
      const { data: userEntities, error: entityError } = await supabase
        .from('core_entities')
        .select('id, entity_type, entity_name, smart_code, metadata')
        .eq('entity_type', 'USER')

      if (entityError) throw entityError

      let userEntity = userEntities.find(e => e.id === authUser.id)
      if (!userEntity) {
        userEntity = userEntities.find(e =>
          e.metadata?.supabase_user_id === authUser.id
        )
      }

      if (!userEntity) {
        console.log(`❌ USER entity not found\n`)
        continue
      }

      console.log(`✅ USER Entity ID: ${userEntity.id}`)
      console.log(`   Same as Auth ID: ${userEntity.id === authUser.id ? 'YES' : 'NO'}`)
      console.log(`   Metadata:`, JSON.stringify(userEntity.metadata, null, 2))
      console.log()

      // Call hera_auth_introspect_v1
      const { data: introspectResult, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
        p_actor_user_id: userEntity.id
      })

      if (introspectError) {
        console.error('❌ Introspect error:', introspectError)
        continue
      }

      console.log('📊 Introspect Result:')
      console.log(`   Organizations: ${introspectResult.organizations?.length || 0}`)
      console.log(`   Default Organization ID: ${introspectResult.default_organization_id}`)
      console.log(`   Default App: ${introspectResult.default_app}`)
      console.log()

      if (introspectResult.organizations && introspectResult.organizations.length > 0) {
        introspectResult.organizations.forEach((org, idx) => {
          console.log(`   Organization ${idx + 1}: ${org.name} (${org.code})`)
          console.log(`      ID: ${org.id}`)
          console.log(`      Primary Role: ${org.primary_role}`)
          console.log(`      Roles: ${JSON.stringify(org.roles)}`)
          console.log(`      Is Owner: ${org.is_owner}`)
          console.log(`      Is Admin: ${org.is_admin}`)
          console.log(`      Status: ${org.status}`)
          console.log(`      Apps: ${org.apps?.length || 0}`)
          if (org.apps && org.apps.length > 0) {
            org.apps.forEach(app => {
              console.log(`         - ${app.name} (${app.code})`)
            })
          }
          console.log()
        })
      } else {
        console.log('   ❌ NO ORGANIZATIONS!')
      }

      // Check HAS_ROLE relationships directly
      console.log('🔗 Direct Database Check - HAS_ROLE relationships:')
      const { data: hasRoles, error: roleError } = await supabase
        .from('core_relationships')
        .select('id, relationship_type, from_entity_id, to_entity_id, relationship_data, organization_id')
        .eq('relationship_type', 'HAS_ROLE')
        .eq('from_entity_id', userEntity.id)

      if (roleError) {
        console.log('   ❌ Error querying relationships:', roleError.message)
      } else if (!hasRoles || hasRoles.length === 0) {
        console.log('   ❌ NO HAS_ROLE relationships found!')
      } else {
        console.log(`   ✅ Found ${hasRoles.length} HAS_ROLE relationship(s):`)
        hasRoles.forEach((rel, idx) => {
          console.log(`      ${idx + 1}. Relationship ID: ${rel.id}`)
          console.log(`         Organization ID: ${rel.organization_id}`)
          console.log(`         Role Data:`, JSON.stringify(rel.relationship_data, null, 2))
          console.log()
        })
      }

      console.log()
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎯 COMPARISON SUMMARY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Check the differences above to identify why salon user is looping')

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

compareUsers()
