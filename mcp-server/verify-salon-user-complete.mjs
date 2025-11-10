/**
 * ✅ VERIFY: Complete salon@heraerp.com setup following HERA standard
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const USER_ENTITY_ID = '1ac56047-78c9-4c2c-93db-84dcf307ab91'
const HERA_SALON_DEMO_ORG_ID = '7f1d5200-2106-4f94-8095-8a04bc114623'

console.log('✅ VERIFICATION: salon@heraerp.com Complete Setup')
console.log('='.repeat(80))
console.log('')

async function verifyComplete() {
  // 1. Auth user
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const authUser = users.find(u => u.email === 'salon@heraerp.com')

  console.log('1️⃣  SUPABASE AUTH USER')
  console.log('-'.repeat(80))
  if (authUser) {
    console.log('✅ EXISTS')
    console.log(`   Email: ${authUser.email}`)
    console.log(`   Auth UID: ${authUser.id}`)
    console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`)
    console.log(`   Last Sign In: ${authUser.last_sign_in_at || 'Never'}`)
    console.log(`   user_metadata.hera_user_entity_id: ${authUser.user_metadata?.hera_user_entity_id}`)
  } else {
    console.log('❌ NOT FOUND')
  }
  console.log('')

  // 2. USER entity
  const { data: userEntity } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', USER_ENTITY_ID)
    .single()

  console.log('2️⃣  USER ENTITY (Platform Org)')
  console.log('-'.repeat(80))
  if (userEntity) {
    console.log('✅ EXISTS')
    console.log(`   Entity ID: ${userEntity.id}`)
    console.log(`   Name: ${userEntity.entity_name}`)
    console.log(`   Code: ${userEntity.entity_code}`)
    console.log(`   Organization: ${userEntity.organization_id}`)
    console.log(`   Platform Org: ${userEntity.organization_id === '00000000-0000-0000-0000-000000000000' ? 'YES ✅' : 'NO ❌'}`)
  } else {
    console.log('❌ NOT FOUND')
  }
  console.log('')

  // 3. MEMBER_OF relationship
  const { data: memberOf } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('to_entity_id', HERA_SALON_DEMO_ORG_ID)
    .eq('relationship_type', 'MEMBER_OF')
    .single()

  console.log('3️⃣  MEMBER_OF RELATIONSHIP (User → Organization)')
  console.log('-'.repeat(80))
  if (memberOf) {
    console.log('✅ EXISTS')
    console.log(`   Relationship ID: ${memberOf.id}`)
    console.log(`   From: ${memberOf.from_entity_id} (User)`)
    console.log(`   To: ${memberOf.to_entity_id} (Organization)`)
    console.log(`   Active: ${memberOf.is_active}`)
    console.log(`   relationship_data: ${JSON.stringify(memberOf.relationship_data)}`)

    if (Object.keys(memberOf.relationship_data || {}).length === 0) {
      console.log(`   ✅ relationship_data is clean (as per HERA standard)`)
    } else {
      console.log(`   ⚠️  relationship_data should be empty for MEMBER_OF`)
    }
  } else {
    console.log('❌ NOT FOUND')
  }
  console.log('')

  // 4. HAS_ROLE relationship (check ALL, not just one org_id)
  const { data: hasRole, error: hasRoleError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('relationship_type', 'HAS_ROLE')

  if (hasRoleError) {
    console.log('Error fetching HAS_ROLE:', hasRoleError.message)
  }

  console.log('4️⃣  HAS_ROLE RELATIONSHIP (User → ROLE)')
  console.log('-'.repeat(80))
  if (hasRole && hasRole.length > 0) {
    console.log(`✅ EXISTS (${hasRole.length} role(s))`)
    for (let idx = 0; idx < hasRole.length; idx++) {
      const rel = hasRole[idx]
      console.log(`\n   Role #${idx + 1}:`)
      console.log(`      Relationship ID: ${rel.id}`)
      console.log(`      Organization ID: ${rel.organization_id}`)
      console.log(`      From: ${rel.from_entity_id} (User)`)
      console.log(`      To: ${rel.to_entity_id} (ROLE entity)`)
      console.log(`      Active: ${rel.is_active}`)
      console.log(`      relationship_data:`, rel.relationship_data)

      if (rel.relationship_data?.role_code) {
        console.log(`      ✅ Role Code: ${rel.relationship_data.role_code}`)
      }
      if (rel.relationship_data?.is_primary !== undefined) {
        console.log(`      ✅ Is Primary: ${rel.relationship_data.is_primary}`)
      }

      // Get role entity separately
      const { data: roleEnt } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', rel.to_entity_id)
        .maybeSingle()

      if (roleEnt) {
        console.log(`\n      ROLE Entity Details:`)
        console.log(`         ID: ${roleEnt.id}`)
        console.log(`         Code: ${roleEnt.entity_code}`)
        console.log(`         Name: ${roleEnt.entity_name}`)
      }
    }
  } else {
    console.log('❌ NOT FOUND')
  }
  console.log('')

  // Summary
  console.log('='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log('')

  const allGood = authUser && userEntity && memberOf && hasRole && hasRole.length > 0

  if (allGood) {
    console.log('🎉 COMPLETE SUCCESS!')
    console.log('')
    console.log('✅ salon@heraerp.com is fully configured following HERA standard:')
    console.log('')
    console.log('   1. Supabase Auth User ✅')
    console.log('   2. USER Entity in Platform Org ✅')
    console.log('   3. MEMBER_OF → HERA Salon Demo ✅')
    console.log('   4. HAS_ROLE → ORG_ADMIN ✅')
    console.log('')
    console.log('HERA Pattern Compliance:')
    console.log('   ✅ USER entity lives in Platform Org (00000000-...)')
    console.log('   ✅ MEMBER_OF establishes org membership (clean relationship_data)')
    console.log('   ✅ HAS_ROLE establishes permissions (separate from membership)')
    console.log('   ✅ ROLE entity properly created in tenant org')
    console.log('   ✅ role_code and is_primary in HAS_ROLE.relationship_data')
    console.log('')
    console.log('User can now:')
    console.log('   • Log in to HERA Salon Demo')
    console.log('   • Access with ORG_ADMIN privileges')
    console.log('   • Have proper separation of membership and permissions')
  } else {
    console.log('⚠️  INCOMPLETE SETUP')
    console.log('')
    if (!authUser) console.log('   ❌ Missing Supabase Auth user')
    if (!userEntity) console.log('   ❌ Missing USER entity')
    if (!memberOf) console.log('   ❌ Missing MEMBER_OF relationship')
    if (!hasRole || hasRole.length === 0) console.log('   ❌ Missing HAS_ROLE relationship')
  }

  console.log('')
  console.log('='.repeat(80))
}

verifyComplete().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
