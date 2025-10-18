#!/usr/bin/env node
/**
 * Check USER entity and organization membership
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // HairTalkz Salon

async function checkUserMembership() {
  try {
    console.log('🔍 Checking USER entity and organization membership\n')

    // Get auth users
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    console.log(`Found ${authUsers.users.length} auth users\n`)

    for (const authUser of authUsers.users) {
      console.log(`📧 ${authUser.email}`)
      console.log(`   Auth ID: ${authUser.id}`)

      // Find USER entity
      const { data: userEntity } = await supabase
        .from('core_entities')
        .select('id, entity_name, organization_id')
        .eq('entity_type', 'USER')
        .eq('metadata->>supabase_user_id', authUser.id)
        .maybeSingle()

      if (!userEntity) {
        console.log('   ❌ No USER entity found\n')
        continue
      }

      console.log(`   ✅ USER entity: ${userEntity.id}`)
      console.log(`   Organization: ${userEntity.organization_id}`)

      // Check MEMBER_OF relationships
      const { data: memberships } = await supabase
        .from('core_relationships')
        .select('target_entity_id, relationship_type, relationship_data, is_active')
        .eq('source_entity_id', userEntity.id)
        .eq('relationship_type', 'MEMBER_OF')
        .eq('is_active', true)

      console.log(`   Memberships: ${memberships?.length || 0}`)

      if (memberships && memberships.length > 0) {
        memberships.forEach(m => {
          const isOurOrg = m.target_entity_id === ORG_ID
          const marker = isOurOrg ? '✅' : '  '
          console.log(`   ${marker} → ${m.target_entity_id.substring(0, 8)}... (${m.relationship_data?.role || 'no role'})`)
        })
      }

      // Check if member of target org
      const isMember = memberships?.some(m => m.target_entity_id === ORG_ID)
      if (!isMember) {
        console.log(`   ⚠️  NOT a member of HairTalkz org: ${ORG_ID}`)
      }

      console.log('')
    }

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkUserMembership()
