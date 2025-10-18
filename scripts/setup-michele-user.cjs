#!/usr/bin/env node
/**
 * Setup USER entity and membership for michele@hairtalkz.com
 * actor_user_id: 09b0b92a-d797-489e-bc03-5ca0a6272674
 * organization_id: 378f24fb-d496-4ff7-8afa-ea34895a0eb8
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SUPABASE_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'
const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function setupMicheleUser() {
  try {
    console.log('🔧 Setting up USER entity for michele@hairtalkz.com\n')

    // Get auth user details
    const { data: authUser } = await supabase.auth.admin.getUserById(SUPABASE_USER_ID)

    if (!authUser.user) {
      console.error('❌ Auth user not found')
      return
    }

    console.log(`✅ Auth user: ${authUser.user.email}`)
    console.log(`   ID: ${SUPABASE_USER_ID}\n`)

    // Step 1: Check if USER entity exists
    const { data: existingUser } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('entity_type', 'USER')
      .eq('metadata->>supabase_user_id', SUPABASE_USER_ID)
      .maybeSingle()

    let userEntityId

    if (existingUser) {
      console.log(`✅ USER entity exists: ${existingUser.id}`)
      userEntityId = existingUser.id
    } else {
      // Create USER entity
      console.log('🔨 Creating USER entity...')

      const { data: newUser, error: insertError } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'USER',
          entity_name: authUser.user.email || `User ${SUPABASE_USER_ID.substring(0, 8)}`,
          entity_code: `USER-${SUPABASE_USER_ID.substring(0, 8).toUpperCase()}`,
          smart_code: 'HERA.GENERIC.IDENTITY.ENTITY.PERSON.V1',
          organization_id: '00000000-0000-0000-0000-000000000000', // Platform org
          status: 'active',
          metadata: {
            supabase_user_id: SUPABASE_USER_ID,
            email: authUser.user.email,
            email_confirmed_at: authUser.user.email_confirmed_at,
            created_at: authUser.user.created_at
          },
          created_by: SUPABASE_USER_ID,
          updated_by: SUPABASE_USER_ID
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ Error creating USER entity:', insertError)
        return
      }

      console.log(`✅ USER entity created: ${newUser.id}`)
      userEntityId = newUser.id
    }

    console.log('')

    // Step 2: Check if MEMBER_OF relationship exists
    const { data: existingMembership } = await supabase
      .from('core_relationships')
      .select('id, relationship_data')
      .eq('source_entity_id', userEntityId)
      .eq('target_entity_id', ORG_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()

    if (existingMembership) {
      console.log(`✅ Membership already exists: ${existingMembership.id}`)
      console.log(`   Role: ${existingMembership.relationship_data?.role || 'unknown'}`)
      return
    }

    // Create MEMBER_OF relationship
    console.log('🔨 Creating MEMBER_OF relationship...')

    const { data: membership, error: membershipError } = await supabase
      .from('core_relationships')
      .insert({
        relationship_type: 'MEMBER_OF',
        source_entity_id: userEntityId,
        target_entity_id: ORG_ID,
        organization_id: ORG_ID,
        smart_code: 'HERA.GENERIC.RELATIONSHIP.MEMBERSHIP.V1',
        relationship_data: {
          role: 'OWNER', // Michele is the owner
          joined_at: new Date().toISOString(),
          status: 'active'
        },
        is_active: true,
        effective_from: new Date().toISOString(),
        created_by: userEntityId,
        updated_by: userEntityId
      })
      .select()
      .single()

    if (membershipError) {
      console.error('❌ Error creating membership:', membershipError)
      return
    }

    console.log(`✅ Membership created: ${membership.id}`)
    console.log(`   Role: OWNER`)
    console.log('')
    console.log('🎉 Setup complete!')
    console.log('')
    console.log('📋 Summary:')
    console.log(`   Auth ID: ${SUPABASE_USER_ID}`)
    console.log(`   USER entity ID: ${userEntityId}`)
    console.log(`   Organization ID: ${ORG_ID}`)
    console.log(`   Role: OWNER`)

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

setupMicheleUser()
