#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createCashewDemoUser() {
  console.log('🚀 Creating Cashew demo user...\n')

  // Demo user credentials
  const email = 'cashew@heraerp.com'
  const password = 'demo2025!'
  const fullName = 'Cashew Demo User'

  try {
    // Step 1: Find Cashew demo organization
    console.log('📋 Step 1: Finding Cashew demo organization...')
    const { data: orgs, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, organization_code, organization_name')
      .ilike('organization_name', '%cashew%')
      .limit(1)

    if (orgError) throw orgError
    if (!orgs || orgs.length === 0) {
      throw new Error('Cashew demo organization not found. Please create it first.')
    }

    const cashewOrg = orgs[0]
    console.log(`✅ Found organization: ${cashewOrg.organization_name} (${cashewOrg.organization_code})`)
    console.log(`   Organization ID: ${cashewOrg.id}\n`)

    // Step 2: Get or create Supabase auth user
    console.log('👤 Step 2: Getting or creating Supabase auth user...')
    let authUserId = null

    // First try to get existing user
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    const existingUser = existingUsers.users.find(u => u.email === email)

    if (existingUser) {
      console.log('⚠️  Auth user already exists')
      console.log(`✅ Using existing auth user: ${existingUser.id}`)
      console.log(`   Email: ${email}\n`)
      authUserId = existingUser.id
    } else {
      // Create new user if doesn't exist
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName
        }
      })

      if (authError) throw authError

      console.log(`✅ Created auth user: ${authData.user.id}`)
      console.log(`   Email: ${email}\n`)
      authUserId = authData.user.id
    }

    // Step 3: Use hera_onboard_user_v1 RPC to create USER entity and link to org
    console.log('🔗 Step 3: Onboarding user with hera_onboard_user_v1...')
    const { data: onboardResult, error: onboardError } = await supabase.rpc('hera_onboard_user_v1', {
      p_supabase_user_id: authUserId,
      p_organization_id: cashewOrg.id,
      p_actor_user_id: authUserId,  // Self-onboarding
      p_role: 'owner'  // owner|admin|manager|employee|staff|member
    })

    if (onboardError) {
      console.error('❌ Onboarding error:', onboardError)
      throw onboardError
    }

    console.log('✅ User onboarded successfully!')
    console.log(`   Result:`, JSON.stringify(onboardResult, null, 2))
    console.log()

    // Step 4: Verify USER entity created
    console.log('🔍 Step 4: Verifying USER entity...')
    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, smart_code')
      .eq('entity_type', 'USER')
      .eq('metadata->auth_user_id', authUserId)
      .single()

    if (entityError) {
      console.warn('⚠️  Could not verify USER entity:', entityError.message)
    } else {
      console.log(`✅ USER entity verified: ${userEntity.id}`)
      console.log(`   Name: ${userEntity.entity_name}`)
      console.log(`   Smart Code: ${userEntity.smart_code}\n`)
    }

    // Step 5: Verify MEMBER_OF relationship
    console.log('🔍 Step 5: Verifying MEMBER_OF relationship...')
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('id, relationship_type, from_entity_id, to_entity_id, metadata')
      .eq('relationship_type', 'MEMBER_OF')
      .eq('to_entity_id', cashewOrg.id)
      .eq('from_entity_id', userEntity?.id)

    if (relError) {
      console.warn('⚠️  Could not verify relationship:', relError.message)
    } else if (relationships && relationships.length > 0) {
      console.log(`✅ MEMBER_OF relationship verified: ${relationships[0].id}`)
      console.log(`   Metadata:`, JSON.stringify(relationships[0].metadata, null, 2))
    } else {
      console.warn('⚠️  No MEMBER_OF relationship found')
    }

    console.log('\n✨ SUCCESS! Cashew demo user created and linked!\n')
    console.log('📋 Login Credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`   Organization: ${cashewOrg.organization_name}`)
    console.log(`   Organization ID: ${cashewOrg.id}`)

  } catch (error) {
    console.error('\n❌ Error creating Cashew demo user:', error)
    process.exit(1)
  }
}

createCashewDemoUser()
