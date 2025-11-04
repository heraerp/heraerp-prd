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

async function checkSalonAuthIntrospect() {
  console.log('🔍 Checking salon@heraerp.com using hera_auth_introspect_v1...\n')

  const email = 'salon@heraerp.com'

  try {
    // Step 1: Find auth user
    console.log('📋 Step 1: Finding auth user...')
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    const authUser = users.users.find(u => u.email === email)
    if (!authUser) {
      throw new Error(`Auth user ${email} not found`)
    }

    console.log(`✅ Auth User ID: ${authUser.id}`)
    console.log(`   Email: ${authUser.email}\n`)

    // Step 2: Find USER entity
    console.log('📋 Step 2: Finding USER entity...')
    const { data: userEntities, error: entityError } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, smart_code, metadata')
      .eq('entity_type', 'USER')

    if (entityError) throw entityError

    // Look for user entity by auth ID or metadata
    let userEntity = userEntities.find(e => e.id === authUser.id)
    if (!userEntity) {
      // Try to find by metadata
      userEntity = userEntities.find(e =>
        e.metadata?.supabase_user_id === authUser.id
      )
    }

    if (!userEntity) {
      console.error('❌ USER entity not found!')
      console.log('   This means hera_onboard_user_v1 did not create the USER entity properly')
      process.exit(1)
    }

    console.log(`✅ USER Entity ID: ${userEntity.id}`)
    console.log(`   Entity Name: ${userEntity.entity_name}`)
    console.log(`   Smart Code: ${userEntity.smart_code}`)
    console.log(`   Metadata:`, JSON.stringify(userEntity.metadata, null, 2))
    console.log()

    // Step 3: Call hera_auth_introspect_v1 (THIS IS WHAT THE AUTH SYSTEM USES)
    console.log('📋 Step 3: Calling hera_auth_introspect_v1...')
    console.log('   (This is the RPC that /api/v2/auth/resolve-membership uses)')
    console.log()

    const { data: introspectResult, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: userEntity.id  // Use USER entity ID (not auth ID)
    })

    if (introspectError) {
      console.error('❌ hera_auth_introspect_v1 error:', introspectError)
      throw introspectError
    }

    console.log('✅ hera_auth_introspect_v1 Result:')
    console.log(JSON.stringify(introspectResult, null, 2))
    console.log()

    // Step 4: Analyze the result
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 AUTHENTICATION ANALYSIS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (!introspectResult) {
      console.log('❌ No result from hera_auth_introspect_v1')
      console.log('   This means the user has no memberships!')
      process.exit(1)
    }

    console.log(`Actor User ID: ${introspectResult.actor_user_id || 'N/A'}`)
    console.log(`Actor Name: ${introspectResult.actor_name || 'N/A'}`)
    console.log(`Organizations: ${introspectResult.organizations?.length || 0}`)
    console.log()

    if (!introspectResult.organizations || introspectResult.organizations.length === 0) {
      console.log('❌ NO ORGANIZATIONS FOUND!')
      console.log('   This is why /salon/auth is looping!')
      console.log('   The user has no organization memberships visible to hera_auth_introspect_v1')
      console.log()
      console.log('🔧 DEBUGGING STEPS:')
      console.log('   1. Check if MEMBER_OF relationship exists')
      console.log('   2. Check if HAS_ROLE relationship exists')
      console.log('   3. Verify relationships are in correct organization')
      console.log('   4. Check if relationships are active (no expiration)')
      process.exit(1)
    }

    console.log('✅ Organizations found:')
    introspectResult.organizations.forEach((org, idx) => {
      console.log(`\n   ${idx + 1}. Organization: ${org.name} (${org.code})`)
      console.log(`      ID: ${org.id}`)
      console.log(`      Type: ${org.type || 'N/A'}`)
      console.log(`      Role: ${org.role || 'N/A'}`)
      console.log(`      Role Code: ${org.role_code || 'N/A'}`)
      console.log(`      User Role: ${org.user_role || 'N/A'}`)
      console.log(`      Primary Role: ${org.primary_role || 'N/A'}`)
      console.log(`      Apps: ${org.apps?.length || 0}`)
      if (org.apps && org.apps.length > 0) {
        org.apps.forEach(app => {
          console.log(`         - ${app.name} (${app.code})`)
        })
      }
    })

    console.log()
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎯 EXPECTED FOR SALON USER')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Organizations: 1')
    console.log('Organization Name: HERA Salon Demo')
    console.log('Organization Code: DEMO-SALON')
    console.log('Role: ORG_OWNER')
    console.log('Apps: Should include SALON app')
    console.log()

    // Validate
    const salonOrg = introspectResult.organizations.find(o =>
      o.code === 'DEMO-SALON' || o.name?.includes('Salon')
    )

    if (!salonOrg) {
      console.log('❌ ISSUE: DEMO-SALON organization not found in introspect result!')
      console.log('   Available organizations:', introspectResult.organizations.map(o => o.code).join(', '))
    } else {
      console.log('✅ DEMO-SALON organization found')
      console.log(`   Role: ${salonOrg.role_code || salonOrg.role || salonOrg.user_role}`)

      const role = salonOrg.role_code || salonOrg.role || salonOrg.user_role
      if (role === 'ORG_OWNER') {
        console.log('   ✅ Role is ORG_OWNER - CORRECT!')
      } else {
        console.log(`   ❌ Role is ${role} - EXPECTED ORG_OWNER!`)
      }

      if (salonOrg.apps && salonOrg.apps.length > 0) {
        console.log(`   ✅ Apps found: ${salonOrg.apps.length}`)
      } else {
        console.log('   ❌ No apps found - this could cause issues!')
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

checkSalonAuthIntrospect()
