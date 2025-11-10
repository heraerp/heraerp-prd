/**
 * 🔍 CHECK: Supabase Auth Users
 * Note: This requires service role key to access auth.users
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

console.log('🔍 CHECKING: Supabase Auth Users')
console.log('='.repeat(80))
console.log('')

async function checkAuthUsers() {
  console.log('📝 Searching for salon@heraerp.com in Supabase Auth...')
  console.log('-'.repeat(80))

  // Method 1: Use Supabase Admin API to list users
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.log('❌ Error listing auth users:', error.message)
      console.log('   Error code:', error.code || error.status)
      console.log('')

      // Try alternative method
      console.log('💡 Trying alternative: Query auth.users table directly...')
      console.log('-'.repeat(80))

      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('*')

      if (authError) {
        console.log('❌ Cannot access auth.users table:', authError.message)
        console.log('')
        console.log('⚠️  Note: Auth users table may not be directly accessible')
        console.log('   This is normal for Supabase - auth tables are restricted')
        console.log('')
        return null
      }

      console.log(`✅ Found ${authUsers.length} auth users via direct query`)
      return authUsers
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No auth users found')
      console.log('')
      return []
    }

    console.log(`✅ Found ${users.length} Supabase Auth users`)
    console.log('')

    // Search for salon@heraerp.com
    const salonUser = users.find(u => u.email === 'salon@heraerp.com')

    if (!salonUser) {
      console.log('❌ salon@heraerp.com NOT FOUND in Supabase Auth')
      console.log('')
      console.log('📋 Available auth users (first 10):')
      users.slice(0, 10).forEach((user, idx) => {
        console.log(`   ${idx + 1}. ${user.email}`)
        console.log(`      ID: ${user.id}`)
        console.log(`      Created: ${user.created_at}`)
      })
      console.log('')

      if (users.length > 10) {
        console.log(`   ... and ${users.length - 10} more users`)
        console.log('')
      }

      return users
    }

    console.log('✅ FOUND salon@heraerp.com in Supabase Auth!')
    console.log('')
    console.log('📧 User Details:')
    console.log(`   Email: ${salonUser.email}`)
    console.log(`   Auth ID (UID): ${salonUser.id}`)
    console.log(`   Created: ${salonUser.created_at}`)
    console.log(`   Last Sign In: ${salonUser.last_sign_in_at || 'Never'}`)
    console.log(`   Email Confirmed: ${salonUser.email_confirmed_at ? 'Yes ✅' : 'No ❌'}`)
    console.log(`   Phone: ${salonUser.phone || 'Not set'}`)
    console.log(`   Role: ${salonUser.role || 'Not set'}`)
    console.log('')

    if (salonUser.user_metadata) {
      console.log('📋 User Metadata:')
      console.log(JSON.stringify(salonUser.user_metadata, null, 2))
      console.log('')
    }

    if (salonUser.app_metadata) {
      console.log('📋 App Metadata:')
      console.log(JSON.stringify(salonUser.app_metadata, null, 2))
      console.log('')
    }

    // Now check if this auth user is linked to a USER entity
    console.log('📝 Checking if auth user is linked to USER entity...')
    console.log('-'.repeat(80))

    // Search for entity with this auth UID as entity_code
    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_code', salonUser.id)
      .eq('entity_type', 'USER')
      .maybeSingle()

    if (!userEntity) {
      console.log('❌ No USER entity found with entity_code matching auth UID')
      console.log(`   Looking for entity_code: ${salonUser.id}`)
      console.log('')
      console.log('💡 Auth user exists but is NOT linked to a USER entity')
      console.log('   Need to create USER entity with entity_code = auth UID')
      console.log('')
      return { authUser: salonUser, userEntity: null }
    }

    console.log('✅ Found linked USER entity!')
    console.log(`   Entity ID: ${userEntity.id}`)
    console.log(`   Name: ${userEntity.entity_name}`)
    console.log(`   Code: ${userEntity.entity_code}`)
    console.log(`   Organization: ${userEntity.organization_id}`)
    console.log('')

    // Check memberships
    const { data: memberships } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userEntity.id)
      .eq('relationship_type', 'MEMBER_OF')

    if (memberships && memberships.length > 0) {
      console.log(`✅ Has ${memberships.length} organization membership(s)`)
      for (const membership of memberships) {
        const { data: org } = await supabase
          .from('core_organizations')
          .select('name')
          .eq('id', membership.to_entity_id)
          .maybeSingle()

        console.log(`   - ${org?.name || 'Unknown Org'}`)
        console.log(`     Org ID: ${membership.to_entity_id}`)
        if (membership.relationship_data?.role) {
          console.log(`     📌 Role: ${membership.relationship_data.role}`)
        }
      }
    } else {
      console.log('⚠️  No organization memberships')
    }
    console.log('')

    return { authUser: salonUser, userEntity, memberships }

  } catch (err) {
    console.log('❌ Error accessing auth API:', err.message)
    console.log('')
    return null
  }
}

async function main() {
  const result = await checkAuthUsers()

  console.log('='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log('')

  if (!result) {
    console.log('⚠️  Could not access Supabase Auth users')
    console.log('   This may require additional permissions')
    console.log('')
    return
  }

  if (Array.isArray(result)) {
    // Just got list of users, salon not found
    console.log('❌ salon@heraerp.com NOT in Supabase Auth')
    console.log(`   Found ${result.length} other auth users`)
    console.log('')
    return
  }

  if (result.authUser) {
    console.log('✅ salon@heraerp.com EXISTS in Supabase Auth')
    console.log(`   Auth UID: ${result.authUser.id}`)
    console.log('')

    if (result.userEntity) {
      console.log('✅ Linked to USER entity')
      console.log(`   Entity ID: ${result.userEntity.id}`)
      console.log('')

      if (result.memberships && result.memberships.length > 0) {
        console.log(`✅ Has ${result.memberships.length} organization membership(s)`)
      } else {
        console.log('❌ Has NO organization memberships')
        console.log('   Need to create MEMBER_OF relationship')
      }
    } else {
      console.log('❌ NOT linked to USER entity')
      console.log('   Need to create USER entity with entity_code = auth UID')
    }
  }

  console.log('')
  console.log('='.repeat(80))
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
