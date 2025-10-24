#!/usr/bin/env node
/**
 * Setup organization membership for USER entities
 * Creates MEMBER_OF relationships for all HairTalkz users
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // HairTalkz Salon

async function setupUserOrgMembership() {
  try {
    console.log('🔧 Setting up organization memberships for USER entities\n')
    console.log(`Target org: ${ORG_ID}\n`)

    // Get all auth users for HairTalkz
    const { data: authUsers } = await supabase.auth.admin.listUsers()

    const hairtalkzUsers = authUsers.users.filter(u =>
      u.email.includes('@hairtalkz') || u.email === 'michele@hairtalkz.ae'
    )

    console.log(`Found ${hairtalkzUsers.length} HairTalkz users\n`)

    for (const authUser of hairtalkzUsers) {
      console.log(`📧 ${authUser.email}`)

      // Find USER entity
      const { data: userEntity } = await supabase
        .from('core_entities')
        .select('id, entity_name')
        .eq('entity_type', 'USER')
        .eq('metadata->>supabase_user_id', authUser.id)
        .maybeSingle()

      if (!userEntity) {
        console.log('   ⚠️  No USER entity - skipping')
        continue
      }

      console.log(`   USER entity: ${userEntity.id}`)

      // Check if membership already exists
      const { data: existing } = await supabase
        .from('core_relationships')
        .select('id')
        .eq('source_entity_id', userEntity.id)
        .eq('target_entity_id', ORG_ID)
        .eq('relationship_type', 'MEMBER_OF')
        .maybeSingle()

      if (existing) {
        console.log('   ✅ Membership already exists')
        continue
      }

      // Determine role based on email
      let role = 'STAFF'
      if (authUser.email.includes('owner') || authUser.email.includes('admin')) {
        role = 'OWNER'
      } else if (authUser.email.includes('manager') || authUser.email === 'michele@hairtalkz.ae') {
        role = 'MANAGER'
      } else if (authUser.email.includes('accountant')) {
        role = 'ACCOUNTANT'
      } else if (authUser.email.includes('receptionist')) {
        role = 'RECEPTIONIST'
      } else if (authUser.email.includes('stylist')) {
        role = 'STYLIST'
      }

      // Create MEMBER_OF relationship
      const { data: relationship, error: relError } = await supabase
        .from('core_relationships')
        .insert({
          relationship_type: 'MEMBER_OF',
          source_entity_id: userEntity.id,
          target_entity_id: ORG_ID,
          organization_id: ORG_ID,
          smart_code: 'HERA.GENERIC.RELATIONSHIP.MEMBERSHIP.V1',
          relationship_data: {
            role: role,
            joined_at: new Date().toISOString(),
            status: 'active'
          },
          is_active: true,
          effective_from: new Date().toISOString(),
          created_by: userEntity.id,
          updated_by: userEntity.id
        })
        .select()
        .single()

      if (relError) {
        console.error('   ❌ Error creating membership:', relError.message)
        continue
      }

      console.log(`   ✅ Membership created (role: ${role})`)
    }

    console.log('\n✅ Setup complete!')

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

setupUserOrgMembership()
