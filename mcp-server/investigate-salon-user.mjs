#!/usr/bin/env node

/**
 * Investigation Script: salon@heraerp.com User Configuration
 * Checks role mapping, organization membership, and user entity setup
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 INVESTIGATING salon@heraerp.com USER CONFIGURATION\n')
console.log('=' .repeat(80))

async function investigateSalonUser() {
  const targetEmail = 'salon@heraerp.com'

  try {
    console.log('\n📧 Step 1: Find Auth User by Email')
    console.log('-'.repeat(80))

    // Get auth user
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Auth query failed:', authError)
      return
    }

    const salonAuthUser = authUsers.users.find(u => u.email === targetEmail)

    if (!salonAuthUser) {
      console.error(`❌ No auth user found with email: ${targetEmail}`)
      return
    }

    console.log('✅ Auth User Found:')
    console.log('   Auth UID:', salonAuthUser.id)
    console.log('   Email:', salonAuthUser.email)
    console.log('   Created:', new Date(salonAuthUser.created_at).toISOString())
    console.log('   Metadata:', JSON.stringify(salonAuthUser.user_metadata, null, 2))

    // Check for user entity mapping in metadata
    const userEntityId = salonAuthUser.user_metadata?.hera_user_entity_id
    console.log('   HERA User Entity ID (from metadata):', userEntityId || '⚠️  NOT SET')

    console.log('\n👤 Step 2: Find USER Entity in Platform Organization')
    console.log('-'.repeat(80))

    const PLATFORM_ORG = '00000000-0000-0000-0000-000000000000'

    // Query for USER entity
    const { data: userEntities, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'USER')
      .eq('organization_id', PLATFORM_ORG)
      .or(`entity_name.ilike.%${targetEmail}%,metadata->>email.eq.${targetEmail}`)

    if (userError) {
      console.error('❌ USER entity query failed:', userError)
    }

    console.log(`✅ Found ${userEntities?.length || 0} USER entities matching email`)

    if (userEntities && userEntities.length > 0) {
      userEntities.forEach((entity, idx) => {
        console.log(`\n   USER Entity ${idx + 1}:`)
        console.log('   Entity ID:', entity.id)
        console.log('   Entity Name:', entity.entity_name)
        console.log('   Smart Code:', entity.smart_code)
        console.log('   Metadata:', JSON.stringify(entity.metadata, null, 2))
        console.log('   Created By:', entity.created_by)
        console.log('   Created At:', entity.created_at)
      })
    } else {
      console.log('   ⚠️  NO USER ENTITIES FOUND - This might be the issue!')
    }

    console.log('\n🏢 Step 3: Find Salon Organization')
    console.log('-'.repeat(80))

    const { data: salonOrgs, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .ilike('name', '%salon%')

    if (orgError) {
      console.error('❌ Organization query failed:', orgError)
    }

    console.log(`✅ Found ${salonOrgs?.length || 0} organizations matching "salon"`)

    let targetOrgId = null

    if (salonOrgs && salonOrgs.length > 0) {
      salonOrgs.forEach((org, idx) => {
        console.log(`\n   Organization ${idx + 1}:`)
        console.log('   Org ID:', org.id)
        console.log('   Org Name:', org.name)
        console.log('   Org Code:', org.code)
        console.log('   Industry:', org.industry)

        if (org.name.toLowerCase().includes('hera salon')) {
          targetOrgId = org.id
          console.log('   ⭐ THIS IS THE TARGET ORGANIZATION')
        }
      })
    }

    if (!targetOrgId && salonOrgs && salonOrgs.length > 0) {
      targetOrgId = salonOrgs[0].id
      console.log(`\n   ℹ️  Using first salon org as target: ${targetOrgId}`)
    }

    console.log('\n🔗 Step 4: Find Membership Relationships')
    console.log('-'.repeat(80))

    if (userEntityId && targetOrgId) {
      const { data: memberships, error: memberError } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('from_entity_id', userEntityId)
        .eq('to_entity_id', targetOrgId)
        .eq('relationship_type', 'USER_MEMBER_OF_ORG')

      if (memberError) {
        console.error('❌ Membership query failed:', memberError)
      }

      console.log(`✅ Found ${memberships?.length || 0} membership relationships`)

      if (memberships && memberships.length > 0) {
        memberships.forEach((rel, idx) => {
          console.log(`\n   Membership ${idx + 1}:`)
          console.log('   Relationship ID:', rel.id)
          console.log('   From (User):', rel.from_entity_id)
          console.log('   To (Org):', rel.to_entity_id)
          console.log('   Type:', rel.relationship_type)
          console.log('   Relationship Data:', JSON.stringify(rel.relationship_data, null, 2))
          console.log('   Created At:', rel.created_at)
        })
      } else {
        console.log('   ⚠️  NO MEMBERSHIP RELATIONSHIPS FOUND - This is likely the issue!')
      }
    } else {
      console.log('   ⚠️  Cannot check memberships - missing userEntityId or targetOrgId')
    }

    console.log('\n📋 Step 5: Check Dynamic Data (Role Assignment)')
    console.log('-'.repeat(80))

    if (userEntityId && targetOrgId) {
      const { data: dynamicData, error: dynError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', userEntityId)
        .eq('organization_id', targetOrgId)
        .eq('field_name', 'role')

      if (dynError) {
        console.error('❌ Dynamic data query failed:', dynError)
      }

      console.log(`✅ Found ${dynamicData?.length || 0} role assignments`)

      if (dynamicData && dynamicData.length > 0) {
        dynamicData.forEach((data, idx) => {
          console.log(`\n   Role Assignment ${idx + 1}:`)
          console.log('   Field Name:', data.field_name)
          console.log('   Field Value:', data.field_value_text)
          console.log('   Field Type:', data.field_type)
          console.log('   Smart Code:', data.smart_code)
          console.log('   Organization:', data.organization_id)
        })
      } else {
        console.log('   ⚠️  NO ROLE ASSIGNMENTS FOUND in dynamic data')
      }
    }

    console.log('\n🧪 Step 6: Test hera_auth_introspect_v1')
    console.log('-'.repeat(80))

    const { data: introspection, error: introError } = await supabase
      .rpc('hera_auth_introspect_v1', {
        p_auth_uid: salonAuthUser.id
      })

    if (introError) {
      console.error('❌ Introspection failed:', introError)
    } else {
      console.log('✅ Introspection Result:')
      console.log(JSON.stringify(introspection, null, 2))
    }

    console.log('\n' + '='.repeat(80))
    console.log('📊 DIAGNOSIS SUMMARY')
    console.log('='.repeat(80))

    const issues = []

    if (!userEntityId) {
      issues.push('❌ Auth user metadata missing hera_user_entity_id')
    }

    if (!userEntities || userEntities.length === 0) {
      issues.push('❌ No USER entity found in platform organization')
    }

    if (!targetOrgId) {
      issues.push('❌ No salon organization found')
    }

    if (userEntityId && targetOrgId) {
      const { data: memberships } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('from_entity_id', userEntityId)
        .eq('to_entity_id', targetOrgId)
        .eq('relationship_type', 'USER_MEMBER_OF_ORG')

      if (!memberships || memberships.length === 0) {
        issues.push('❌ No USER_MEMBER_OF_ORG relationship found')
      } else {
        // Check for role in relationship data
        const hasRole = memberships.some(m =>
          m.relationship_data?.roles && m.relationship_data.roles.length > 0
        )

        if (!hasRole) {
          issues.push('⚠️  Membership exists but no roles assigned in relationship_data')
        }
      }
    }

    if (issues.length === 0) {
      console.log('✅ All checks passed - user should be able to log in')
    } else {
      console.log('❌ Issues found:')
      issues.forEach(issue => console.log('   ' + issue))

      console.log('\n💡 RECOMMENDED FIX:')
      console.log('   Run: node fix-salon-user.mjs')
      console.log('   This will recreate the user with proper role mapping')
    }

    console.log('\n🔍 COMPARISON: Check hairtalkz01@gmail.com (working user)')
    console.log('='.repeat(80))

    const workingEmail = 'hairtalkz01@gmail.com'
    const workingAuthUser = authUsers.users.find(u => u.email === workingEmail)

    if (workingAuthUser) {
      console.log('✅ Working User Auth UID:', workingAuthUser.id)
      console.log('   Email:', workingAuthUser.email)
      console.log('   Metadata:', JSON.stringify(workingAuthUser.user_metadata, null, 2))

      const { data: workingIntrospection } = await supabase
        .rpc('hera_auth_introspect_v1', {
          p_auth_uid: workingAuthUser.id
        })

      if (workingIntrospection) {
        console.log('\n✅ Working User Introspection:')
        console.log(JSON.stringify(workingIntrospection, null, 2))
      }
    }

  } catch (error) {
    console.error('\n💥 Investigation failed:', error)
  }
}

// Run investigation
investigateSalonUser()
  .then(() => {
    console.log('\n✅ Investigation complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
