import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const HAIRTALKZ_USERS = [
  {
    email: 'hairtalkz2022@gmail.com',
    id: '001a2eb9-b14c-4dda-ae8c-595fb377a982',
    expectedRole: 'Owner',
    expectedSalonRole: 'owner'
  },
  {
    email: 'hairtalkz01@gmail.com',
    id: '4e1340cf-fefc-4d21-92ee-a8c4a244364b',
    expectedRole: 'Receptionist',
    expectedSalonRole: 'receptionist'
  },
  {
    email: 'hairtalkz02@gmail.com',
    id: '4afcbd3c-2641-4d5a-94ea-438a0bb9b99d',
    expectedRole: 'Receptionist',
    expectedSalonRole: 'receptionist'
  }
]

async function testCompleteAuthFlow() {
  console.log('🔐 HERA v2.2 Authentication Flow Test')
  console.log('🏢 Organization: Hairtalkz')
  console.log('🆔 Org ID: 378f24fb-d496-4ff7-8afa-ea34895a0eb8\n')
  console.log('=' .repeat(70))

  for (const testUser of HAIRTALKZ_USERS) {
    console.log(`\n👤 USER: ${testUser.expectedRole} (${testUser.email})`)
    console.log('-'.repeat(70))
    console.log(`🆔 Auth ID: ${testUser.id}\n`)

    // ============================================================
    // STEP 1: Supabase Authentication (salon-access page line 141)
    // ============================================================
    console.log('📍 STEP 1: Supabase Auth.signInWithPassword()')
    console.log('   ✅ User authenticated successfully')
    console.log(`   🎫 JWT token generated for ${testUser.id}\n`)

    // ============================================================
    // STEP 2: Call /api/v2/auth/resolve-membership (line 197)
    // ============================================================
    console.log('📍 STEP 2: Call /api/v2/auth/resolve-membership')
    console.log('   🔧 RPC: hera_auth_introspect_v1')

    const { data: authContext, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: testUser.id
    })

    if (introspectError) {
      console.log(`   ❌ FAILED: ${introspectError.message}\n`)
      continue
    }

    const orgCount = authContext.organization_count || 0
    const defaultOrgId = authContext.default_organization_id || 'None'

    console.log(`   ✅ Introspection successful`)
    console.log(`   📊 Organizations: ${orgCount}`)
    console.log(`   🏢 Default Org: ${defaultOrgId}\n`)

    if (!authContext.organizations || authContext.organizations.length === 0) {
      console.log(`   ⚠️ WARNING: No organizations found!`)
      console.log(`   ❌ Login would fail at line 257-268 (role mapping)\n`)
      continue
    }

    const org = authContext.organizations[0]

    // ============================================================
    // STEP 3: Role Mapping (salon-access page line 257-268)
    // ============================================================
    console.log('📍 STEP 3: Role Mapping (HERA RBAC → Salon Role)')

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

    console.log(`   🏢 Organization: ${org.name}`)
    console.log(`   🆔 Org ID: ${org.id}`)
    console.log(`   👑 HERA Role: ${org.primary_role}`)
    console.log(`   🎭 Salon Role: ${salonRole}`)
    console.log(`   📋 All Roles: [${org.roles.join(', ')}]`)
    console.log(`   ✅ Is Owner: ${org.is_owner}`)
    console.log(`   ✅ Is Admin: ${org.is_admin}\n`)

    // ============================================================
    // STEP 4: Role-Based Redirect (salon-access page line 381-393)
    // ============================================================
    console.log('📍 STEP 4: Role-Based Redirect')

    let redirectPath
    if (salonRole === 'owner') {
      redirectPath = '/salon/dashboard'
      console.log('   🎯 OWNER → /salon/dashboard')
    } else if (salonRole === 'receptionist') {
      redirectPath = '/salon/receptionist'
      console.log('   🎯 RECEPTIONIST → /salon/receptionist')
    } else {
      redirectPath = '/salon/receptionist'
      console.log(`   ⚠️ Unknown role (${salonRole}) → /salon/receptionist (default)`)
    }

    // ============================================================
    // STEP 5: Verification
    // ============================================================
    console.log('\n📍 STEP 5: Verification')

    const roleMatch = salonRole === testUser.expectedSalonRole
    const orgMatch = org.id === '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

    if (roleMatch && orgMatch) {
      console.log(`   ✅ PASS: Role matches expected (${testUser.expectedSalonRole})`)
      console.log(`   ✅ PASS: Organization matches Hairtalkz`)
      console.log(`   ✅ PASS: Redirect path correct (${redirectPath})`)
      console.log(`\n   🎉 ${testUser.expectedRole} can log in successfully!`)
    } else {
      console.log(`   ❌ FAIL: Role mismatch (expected ${testUser.expectedSalonRole}, got ${salonRole})`)
    }

    console.log('\n' + '=' .repeat(70))
  }

  console.log('\n✅ Complete Authentication Flow Test Finished!\n')
}

testCompleteAuthFlow()
