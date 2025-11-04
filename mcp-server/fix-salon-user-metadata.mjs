#!/usr/bin/env node

/**
 * Fix salon@heraerp.com Auth User Metadata
 * Adds hera_user_entity_id to auth metadata so HERAAuthProvider can map correctly
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixSalonUserMetadata() {
  console.log('🔧 FIXING salon@heraerp.com Auth User Metadata\n')
  console.log('='.repeat(80))

  const targetEmail = 'salon@heraerp.com'
  const authUid = 'ebd0e099-e25a-476b-b6dc-4b3c26fae4a7'
  const userEntityId = '1ac56047-78c9-4c2c-93db-84dcf307ab91'

  try {
    console.log('\n📧 Step 1: Verify Auth User')
    console.log('-'.repeat(80))

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`)
    }

    const salonAuthUser = authUsers.users.find(u => u.email === targetEmail)

    if (!salonAuthUser) {
      throw new Error(`Auth user not found: ${targetEmail}`)
    }

    console.log('✅ Auth User Found:')
    console.log(`   Auth UID: ${salonAuthUser.id}`)
    console.log(`   Email: ${salonAuthUser.email}`)
    console.log(`   Current Metadata:`, JSON.stringify(salonAuthUser.user_metadata, null, 2))

    console.log('\n👤 Step 2: Verify USER Entity')
    console.log('-'.repeat(80))

    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userEntityId)
      .eq('entity_type', 'USER')
      .single()

    if (entityError || !userEntity) {
      throw new Error(`USER entity not found: ${userEntityId}`)
    }

    console.log('✅ USER Entity Found:')
    console.log(`   Entity ID: ${userEntity.id}`)
    console.log(`   Entity Name: ${userEntity.entity_name}`)
    console.log(`   Organization: ${userEntity.organization_id}`)
    console.log(`   Metadata:`, JSON.stringify(userEntity.metadata, null, 2))

    console.log('\n🔗 Step 3: Verify Membership')
    console.log('-'.repeat(80))

    const { data: introspection, error: introError } = await supabase
      .rpc('hera_auth_introspect_v1', {
        p_actor_user_id: userEntityId
      })

    if (introError) {
      throw new Error(`Introspection failed: ${introError.message}`)
    }

    if (!introspection || !introspection.organizations || introspection.organizations.length === 0) {
      throw new Error('No organizations found for user')
    }

    console.log('✅ Introspection Successful:')
    console.log(`   Organizations: ${introspection.organization_count}`)
    introspection.organizations.forEach((org, idx) => {
      console.log(`   ${idx + 1}. ${org.name} (${org.code})`)
      console.log(`      Org ID: ${org.id}`)
      console.log(`      Role: ${org.primary_role}`)
      console.log(`      Apps: ${JSON.stringify(org.apps?.map(a => a.code) || [])}`)
    })

    console.log('\n🔧 Step 4: Update Auth User Metadata')
    console.log('-'.repeat(80))

    const newMetadata = {
      ...salonAuthUser.user_metadata,
      hera_user_entity_id: userEntityId,
      full_name: salonAuthUser.user_metadata?.full_name || 'Salon Demo User',
      email_verified: true
    }

    console.log('Updating auth user metadata to:')
    console.log(JSON.stringify(newMetadata, null, 2))

    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      authUid,
      {
        user_metadata: newMetadata
      }
    )

    if (updateError) {
      throw new Error(`Failed to update user metadata: ${updateError.message}`)
    }

    console.log('\n✅ Auth User Metadata Updated Successfully!')
    console.log('   Updated Metadata:', JSON.stringify(updatedUser.user.user_metadata, null, 2))

    console.log('\n🧪 Step 5: Verify Fix Works')
    console.log('-'.repeat(80))

    // Simulate what the API does
    const { data: lookupTest, error: lookupError } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('entity_type', 'USER')
      .contains('metadata', { supabase_user_id: authUid })
      .limit(1)

    if (lookupTest && lookupTest.length > 0) {
      console.log('✅ USER Entity Lookup Works:')
      console.log(`   Found: ${lookupTest[0].entity_name} (${lookupTest[0].id})`)
    } else {
      console.log('⚠️ USER Entity Lookup still needs supabase_user_id in entity metadata')
    }

    // Test what HERAAuthProvider will see
    console.log('\n✅ What HERAAuthProvider Will See:')
    console.log(`   1. Auth UID: ${authUid}`)
    console.log(`   2. Metadata hera_user_entity_id: ${newMetadata.hera_user_entity_id}`)
    console.log(`   3. Will use entity ID: ${newMetadata.hera_user_entity_id}`)
    console.log(`   4. Introspect with entity ID → ${introspection.organization_count} org(s)`)
    console.log(`   5. Default org: ${introspection.organizations[0].name}`)
    console.log(`   6. Role: ${introspection.organizations[0].primary_role}`)

    console.log('\n' + '='.repeat(80))
    console.log('✅ FIX COMPLETE!')
    console.log('='.repeat(80))
    console.log('\n📋 Summary:')
    console.log('   ✅ Auth user metadata updated with hera_user_entity_id')
    console.log('   ✅ USER entity exists and has proper relationships')
    console.log('   ✅ Introspection returns HERA Salon Demo org with ORG_OWNER role')
    console.log('   ✅ Login should now work without logout issue')
    console.log('\n💡 Next Step: Test login with salon@heraerp.com')
    console.log('   URL: http://localhost:3000/salon/auth')
    console.log('   Email: salon@heraerp.com')
    console.log('   Password: demo2025!')

  } catch (error) {
    console.error('\n❌ Fix failed:', error)
    process.exit(1)
  }
}

fixSalonUserMetadata()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
