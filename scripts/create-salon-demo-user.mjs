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

async function createSalonDemoUser() {
  console.log('🚀 Creating Salon demo user...\n')

  // Demo user credentials
  const email = 'salon@heraerp.com'
  const password = 'demo2025!'
  const fullName = 'Salon Demo User'

  try {
    // Step 1: Find Salon demo organization
    console.log('📋 Step 1: Finding Salon demo organization...')
    const { data: orgs, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, organization_code, organization_name')
      .or('organization_name.ilike.%salon%demo%,organization_code.ilike.%demo-salon%')
      .limit(5)

    if (orgError) throw orgError
    if (!orgs || orgs.length === 0) {
      throw new Error('Salon demo organization not found. Please create it first.')
    }

    // Show all matching orgs
    console.log(`Found ${orgs.length} matching organization(s):`)
    orgs.forEach((org, idx) => {
      console.log(`   ${idx + 1}. ${org.organization_name} (${org.organization_code})`)
    })

    // Use the first one (most likely the correct one)
    const salonOrg = orgs[0]
    console.log(`\n✅ Using: ${salonOrg.organization_name} (${salonOrg.organization_code})`)
    console.log(`   Organization ID: ${salonOrg.id}\n`)

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
      p_organization_id: salonOrg.id,
      p_actor_user_id: authUserId,  // Self-onboarding
      p_role: 'owner'  // Will be normalized to ORG_OWNER
    })

    if (onboardError) {
      console.error('❌ Onboarding error:', onboardError)
      throw onboardError
    }

    console.log('✅ User onboarded successfully!')
    console.log(`   Result:`, JSON.stringify(onboardResult, null, 2))
    console.log()

    // Step 4: Verify relationships
    console.log('🔍 Step 4: Verifying relationships...')

    const { data: hasRole, error: roleError } = await supabase
      .from('core_relationships')
      .select('id, relationship_type, from_entity_id, to_entity_id, relationship_data, organization_id')
      .eq('relationship_type', 'HAS_ROLE')
      .eq('from_entity_id', onboardResult.user_entity_id)
      .eq('organization_id', salonOrg.id)
      .single()

    if (roleError) {
      console.warn('⚠️  Could not verify HAS_ROLE relationship:', roleError.message)
    } else {
      console.log(`✅ HAS_ROLE relationship verified: ${hasRole.id}`)
      console.log(`   Role Code: ${hasRole.relationship_data?.role_code || 'N/A'}`)
      console.log(`   Expected: ORG_OWNER`)
      console.log(`   Match: ${hasRole.relationship_data?.role_code === 'ORG_OWNER' ? '✅ YES' : '❌ NO'}`)
    }

    console.log('\n✨ SUCCESS! Salon demo user created and linked!\n')
    console.log('📋 Login Credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`   Organization: ${salonOrg.organization_name}`)
    console.log(`   Organization ID: ${salonOrg.id}`)
    console.log(`   User Entity ID: ${onboardResult.user_entity_id}`)
    console.log(`   Auth User ID: ${authUserId}`)
    console.log(`   Role: ORG_OWNER`)

  } catch (error) {
    console.error('\n❌ Error creating Salon demo user:', error)
    process.exit(1)
  }
}

createSalonDemoUser()
