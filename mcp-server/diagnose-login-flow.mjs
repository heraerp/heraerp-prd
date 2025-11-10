#!/usr/bin/env node

/**
 * Diagnose Login Flow for salon@heraerp.com
 * Traces what happens step-by-step during login
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function diagnoseLoginFlow() {
  console.log('🔍 DIAGNOSING LOGIN FLOW FOR salon@heraerp.com\n')
  console.log('='.repeat(80))

  const targetEmail = 'salon@heraerp.com'
  const targetPassword = 'demo2025!'

  try {
    // STEP 1: Authenticate
    console.log('\n📧 STEP 1: Authenticate with Supabase')
    console.log('-'.repeat(80))

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword
    })

    if (authError) {
      console.error('❌ Auth failed:', authError)
      return
    }

    console.log('✅ Authentication successful')
    console.log('   Auth UID:', authData.user.id)
    console.log('   Email:', authData.user.email)
    console.log('   Metadata:', JSON.stringify(authData.user.user_metadata, null, 2))

    const authUid = authData.user.id
    const userEntityId = authData.user.user_metadata?.hera_user_entity_id

    console.log('\n🔑 KEY IDS:')
    console.log('   Auth UID:', authUid)
    console.log('   User Entity ID (from metadata):', userEntityId)

    // STEP 2: Call API to resolve membership
    console.log('\n🌐 STEP 2: Call /api/v2/auth/resolve-membership')
    console.log('-'.repeat(80))

    const apiUrl = 'http://localhost:3000/api/v2/auth/resolve-membership'
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`
      }
    })

    console.log('   Response status:', response.status)

    const membershipData = await response.json()

    if (response.ok) {
      console.log('✅ Membership resolved successfully')
      console.log('   User Entity ID:', membershipData.user_entity_id)
      console.log('   Organization ID:', membershipData.membership.organization_id)
      console.log('   Organization Name:', membershipData.membership.organization_name)
      console.log('   Primary Role:', membershipData.membership.primary_role)
      console.log('   Role (normalized):', membershipData.membership.role)
    } else {
      console.error('❌ API returned error:', membershipData)
      return
    }

    // STEP 3: Simulate what SecuredSalonProvider does
    console.log('\n🔐 STEP 3: Simulate SecuredSalonProvider initialization')
    console.log('-'.repeat(80))

    const orgIdFromAPI = membershipData.membership.organization_id
    const roleFromAPI = membershipData.membership.role || membershipData.membership.primary_role

    console.log('   API returned:')
    console.log('     organizationId:', orgIdFromAPI)
    console.log('     role:', roleFromAPI)

    // STEP 4: Check if there's mismatch with what might be cached
    console.log('\n⚠️  STEP 4: Check for potential localStorage conflicts')
    console.log('-'.repeat(80))
    console.log('   (Note: This script can\'t access browser localStorage)')
    console.log('   (But SecuredSalonProvider checks:)')
    console.log('     - localStorage.getItem("organizationId")')
    console.log('     - securityStore.organizationId')
    console.log('')
    console.log('   If EITHER of these doesn\'t match orgId from JWT:')
    console.log('   → Triggers cache clearing')
    console.log('   → Clears ALL localStorage')
    console.log('   → Clears Zustand store')
    console.log('   → This INVALIDATES the session → causes logout')

    // STEP 5: Check core_entities for user
    console.log('\n👤 STEP 5: Verify USER entity in core_entities')
    console.log('-'.repeat(80))

    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userEntityId)
      .eq('entity_type', 'USER')
      .single()

    if (userError || !userEntity) {
      console.log('❌ USER entity not found:', userError)
    } else {
      console.log('✅ USER entity found:')
      console.log('   Entity ID:', userEntity.id)
      console.log('   Entity Name:', userEntity.entity_name)
      console.log('   Organization ID:', userEntity.organization_id)
      console.log('   Metadata:', JSON.stringify(userEntity.metadata, null, 2))
    }

    // STEP 6: Introspect with user entity ID
    console.log('\n🔍 STEP 6: Introspect with user entity ID')
    console.log('-'.repeat(80))

    const { data: introspection, error: introError } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: userEntityId
    })

    if (introError) {
      console.log('❌ Introspection failed:', introError)
    } else {
      console.log('✅ Introspection successful:')
      console.log('   Organization count:', introspection.organization_count)
      if (introspection.organizations && introspection.organizations.length > 0) {
        const org = introspection.organizations[0]
        console.log('   Default org ID:', org.id)
        console.log('   Default org name:', org.name)
        console.log('   Default org code:', org.code)
        console.log('   Primary role:', org.primary_role)
      }
    }

    // STEP 7: The SMOKING GUN - Check for secondary initialization
    console.log('\n💥 STEP 7: THE SMOKING GUN - What causes logout?')
    console.log('-'.repeat(80))
    console.log('   SecuredSalonProvider.tsx lines 727-750:')
    console.log('')
    console.log('   When initializeSecureContext() runs:')
    console.log('   1. Gets session → resolves security context')
    console.log('   2. Gets orgId from securityContext: ' + orgIdFromAPI)
    console.log('   3. Checks localStorage.getItem("organizationId")')
    console.log('   4. Checks securityStore.organizationId')
    console.log('   5. IF either doesn\'t match securityContext.orgId:')
    console.log('      → Clears ALL localStorage')
    console.log('      → Clears Zustand store')
    console.log('      → This INVALIDATES the session!')
    console.log('')
    console.log('   🚨 PROBLEM: If SecuredSalonProvider runs BEFORE')
    console.log('      HERAAuthProvider finishes storing the NEW org ID,')
    console.log('      it will see a MISMATCH and clear everything!')

    console.log('\n📋 STEP 8: Recommended Fix')
    console.log('-'.repeat(80))
    console.log('   Option 1: Remove org ID mismatch check')
    console.log('     → Trust that login page already cleared localStorage')
    console.log('     → SecuredSalonProvider should NOT clear during init')
    console.log('')
    console.log('   Option 2: Only clear on SIGNED_IN event with different user')
    console.log('     → Check if user changed, not org changed')
    console.log('     → Org change within same user = valid scenario')
    console.log('')
    console.log('   Option 3: Add grace period after login')
    console.log('     → Don\'t check for mismatch in first 3 seconds')
    console.log('     → Allows HERAAuthProvider to finish storing')

    // Sign out
    await supabase.auth.signOut()
    console.log('\n✅ Signed out')

  } catch (error) {
    console.error('\n❌ Diagnosis failed:', error)
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ Diagnosis complete')
}

diagnoseLoginFlow()
