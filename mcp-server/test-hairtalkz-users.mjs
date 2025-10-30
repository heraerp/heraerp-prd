import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const HAIRTALKZ_USERS = [
  { email: 'hairtalkz2022@gmail.com', role: 'Owner' },
  { email: 'hairtalkz01@gmail.com', role: 'Receptionist 1' },
  { email: 'hairtalkz02@gmail.com', role: 'Receptionist 2' }
]

async function testUsers() {
  console.log('🔍 Testing Hairtalkz User Authentication Flow\n')
  console.log('=' .repeat(60))

  for (const testUser of HAIRTALKZ_USERS) {
    console.log(`\n👤 Testing: ${testUser.role} (${testUser.email})`)
    console.log('-'.repeat(60))

    // Step 1: Find user entity by email
    const { data: userEntities, error: userError } = await supabase
      .from('core_entities')
      .select('id, entity_name, smart_code')
      .eq('entity_type', 'USER')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .ilike('entity_name', `%${testUser.email}%`)
      .limit(1)

    if (userError || !userEntities || userEntities.length === 0) {
      console.log(`❌ User entity not found for ${testUser.email}`)
      continue
    }

    const userId = userEntities[0].id
    console.log(`✅ Found user entity: ${userId}`)
    console.log(`   Name: ${userEntities[0].entity_name}`)

    // Step 2: Call hera_auth_introspect_v1 (same as login flow)
    const { data: authContext, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: userId
    })

    if (introspectError) {
      console.log(`❌ Introspect RPC failed:`, introspectError.message)
      continue
    }

    const orgCount = authContext.organization_count || 0
    const isPlatformAdmin = authContext.is_platform_admin || false
    const defaultOrgId = authContext.default_organization_id || 'None'

    console.log(`\n📊 Authentication Context:`)
    console.log(`   Organizations: ${orgCount}`)
    console.log(`   Platform Admin: ${isPlatformAdmin}`)
    console.log(`   Default Org: ${defaultOrgId}`)

    if (authContext.organizations && authContext.organizations.length > 0) {
      const org = authContext.organizations[0]
      console.log(`\n🏢 Organization Details:`)
      console.log(`   ID: ${org.id}`)
      console.log(`   Name: ${org.name}`)
      console.log(`   Code: ${org.code}`)
      console.log(`   Status: ${org.status}`)
      console.log(`   Primary Role: ${org.primary_role}`)
      console.log(`   All Roles: ${org.roles.join(', ')}`)
      console.log(`   Is Owner: ${org.is_owner}`)
      console.log(`   Is Admin: ${org.is_admin}`)
      console.log(`   Joined: ${org.joined_at}`)

      // Step 3: Simulate role mapping (from salon-access page)
      const roleMapping = {
        'org_owner': 'owner',
        'org_admin': 'manager',
        'org_manager': 'manager',
        'org_accountant': 'accountant',
        'org_employee': 'receptionist',
        'owner': 'owner',
        'manager': 'manager',
        'receptionist': 'receptionist',
        'accountant': 'accountant',
        'member': 'receptionist'
      }

      const normalizedRole = String(org.primary_role).toLowerCase().trim()
      const salonRole = roleMapping[normalizedRole] || normalizedRole

      console.log(`\n🎯 Role Mapping Result:`)
      console.log(`   HERA Role: ${org.primary_role}`)
      console.log(`   Salon Role: ${salonRole}`)
      console.log(`   Redirect Path: ${salonRole === 'owner' ? '/salon/dashboard' : '/salon/receptionist'}`)

      console.log(`\n✅ ${testUser.role} authentication would succeed!`)
    } else {
      console.log(`\n⚠️ No organizations found for ${testUser.email}`)
    }

    console.log('=' .repeat(60))
  }

  console.log(`\n🎉 Authentication test completed!\n`)
}

testUsers()
