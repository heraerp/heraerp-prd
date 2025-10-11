import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUserOrg() {
  console.log('\n🔍 Checking User→Organization Mapping...\n')

  // Get all users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

  if (usersError) {
    console.log('❌ Error getting users:', usersError.message)
    return
  }

  console.log(`Found ${users?.length || 0} users:\n`)

  for (const user of users || []) {
    console.log(`👤 User: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   user_metadata.organization_id: ${user.user_metadata?.organization_id || 'NOT SET'}`)

    // Check if there's a USER entity for this auth user
    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('id, entity_name, organization_id')
      .eq('entity_type', 'USER')
      .eq('metadata->auth_user_id', user.id)
      .single()

    if (userEntity) {
      console.log(`   USER entity: ${userEntity.entity_name} (${userEntity.id})`)
      console.log(`   USER entity org: ${userEntity.organization_id}`)
    } else {
      console.log(`   ⚠️ No USER entity found for this auth user`)
    }

    // Check membership relationships
    if (userEntity) {
      const { data: memberships } = await supabase
        .from('core_relationships')
        .select('to_entity_id, relationship_type')
        .eq('from_entity_id', userEntity.id)
        .eq('relationship_type', 'USER_MEMBER_OF_ORG')

      if (memberships && memberships.length > 0) {
        console.log(`   Memberships: ${memberships.length}`)
        for (const membership of memberships) {
          const { data: org } = await supabase
            .from('core_entities')
            .select('id, entity_name')
            .eq('id', membership.to_entity_id)
            .single()

          console.log(`      → ${org?.entity_name || 'Unknown'} (${membership.to_entity_id})`)
        }
      } else {
        console.log(`   ⚠️ No organization memberships found`)
      }
    }

    console.log()
  }

  // Show appointment organization
  console.log('\n📋 Appointment Organization:')
  const { data: aptOrg } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type')
    .eq('id', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
    .single()

  if (aptOrg) {
    console.log(`   ${aptOrg.entity_name} (${aptOrg.entity_type})`)
    console.log(`   ID: ${aptOrg.id}`)
  } else {
    console.log(`   ⚠️ Organization ${salonOrgId} not found as entity!`)
  }
}

checkUserOrg().catch(console.error)
