#!/usr/bin/env node

/**
 * Diagnose User Memberships Issue
 *
 * Investigates why verifyAuth() is finding no memberships for user
 * User ID: b3fcd455-7df2-42d2-bdd1-c962636cc8a7
 * Expected Org: 378f24fb-d496-4ff7-8afa-ea34895a0eb8
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const userId = 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7'
const expectedOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function diagnose() {
  console.log('\n🔍 DIAGNOSING USER MEMBERSHIP ISSUE')
  console.log('=' .repeat(80))
  console.log('User ID:', userId)
  console.log('Expected Org:', expectedOrgId)
  console.log('=' .repeat(80))

  // 1. Check auth.users table for user metadata
  console.log('\n📋 Step 1: Check Supabase Auth User Metadata')
  const { data: authUser, error: authError } = await supabase
    .from('auth.users')
    .select('id, email, raw_user_meta_data')
    .eq('id', userId)
    .single()

  if (authError) {
    console.error('❌ Error querying auth.users:', authError)
  } else {
    console.log('✅ Auth User Found:', {
      id: authUser.id,
      email: authUser.email,
      hasMetadata: !!authUser.raw_user_meta_data,
      organizationIdInMetadata: authUser.raw_user_meta_data?.organization_id
    })
    if (authUser.raw_user_meta_data?.organization_id) {
      console.log('   🎯 JWT will include org:', authUser.raw_user_meta_data.organization_id)
    } else {
      console.log('   ⚠️ JWT will NOT include organization_id (missing from metadata)')
    }
  }

  // 2. Check core_relationships for MEMBER_OF relationships
  console.log('\n📋 Step 2: Check core_relationships for MEMBER_OF relationships')

  // Try the query exactly as verifyAuth() does it
  const { data: membershipsDirect, error: memberError } = await supabase
    .from('core_relationships')
    .select('to_entity_id, organization_id, relationship_data, is_active')
    .eq('from_entity_id', userId)
    .eq('relationship_type', 'MEMBER_OF')
    .eq('is_active', true)

  if (memberError) {
    console.error('❌ Error querying memberships:', memberError)
  } else {
    console.log(`✅ Found ${membershipsDirect?.length || 0} MEMBER_OF relationships`)
    if (membershipsDirect && membershipsDirect.length > 0) {
      membershipsDirect.forEach((m, idx) => {
        console.log(`\n   Membership ${idx + 1}:`)
        console.log('   - Organization ID:', m.organization_id)
        console.log('   - Target Entity:', m.to_entity_id)
        console.log('   - Role:', m.relationship_data?.role)
        console.log('   - Active:', m.is_active)
        console.log('   - Matches Expected Org:', m.organization_id === expectedOrgId ? '✅ YES' : '❌ NO')
      })
    } else {
      console.log('   ⚠️ NO MEMBERSHIPS FOUND - This is why verifyAuth() fails!')
    }
  }

  // 3. Check if there are ANY relationships for this user (regardless of type)
  console.log('\n📋 Step 3: Check ALL relationships for this user')
  const { data: allRels, error: allRelsError } = await supabase
    .from('core_relationships')
    .select('relationship_type, organization_id, to_entity_id, is_active')
    .eq('from_entity_id', userId)

  if (allRelsError) {
    console.error('❌ Error querying all relationships:', allRelsError)
  } else {
    console.log(`✅ Found ${allRels?.length || 0} total relationships for this user`)
    if (allRels && allRels.length > 0) {
      const typeCounts = {}
      allRels.forEach(r => {
        typeCounts[r.relationship_type] = (typeCounts[r.relationship_type] || 0) + 1
      })
      console.log('   Relationship types:', typeCounts)

      // Check if there's a USER_MEMBER_OF_ORG instead
      const userMemberOfOrg = allRels.find(r => r.relationship_type === 'USER_MEMBER_OF_ORG')
      if (userMemberOfOrg) {
        console.log('\n   🔍 Found USER_MEMBER_OF_ORG relationship:')
        console.log('      Organization ID:', userMemberOfOrg.organization_id)
        console.log('      Target Entity:', userMemberOfOrg.to_entity_id)
        console.log('      Active:', userMemberOfOrg.is_active)
        console.log('\n   ⚠️ ISSUE IDENTIFIED: Relationship type is USER_MEMBER_OF_ORG, not MEMBER_OF')
        console.log('      verifyAuth() queries for MEMBER_OF but data uses USER_MEMBER_OF_ORG')
      }
    }
  }

  // 4. Check core_entities to see if user entity exists
  console.log('\n📋 Step 4: Check if user entity exists in core_entities')
  const { data: userEntity, error: entityError } = await supabase
    .from('core_entities')
    .select('id, entity_type, entity_name, organization_id')
    .eq('id', userId)
    .single()

  if (entityError) {
    console.error('❌ User entity not found in core_entities:', entityError.message)
  } else {
    console.log('✅ User Entity Found:', {
      id: userEntity.id,
      type: userEntity.entity_type,
      name: userEntity.entity_name,
      org: userEntity.organization_id
    })
  }

  // 5. Check if the expected organization exists
  console.log('\n📋 Step 5: Verify expected organization exists')
  const { data: org, error: orgError } = await supabase
    .from('core_organizations')
    .select('id, org_name, org_code')
    .eq('id', expectedOrgId)
    .single()

  if (orgError) {
    console.error('❌ Organization not found:', orgError.message)
  } else {
    console.log('✅ Organization Found:', {
      id: org.id,
      name: org.org_name,
      code: org.org_code
    })
  }

  // 6. Summary and recommendations
  console.log('\n' + '='.repeat(80))
  console.log('📊 DIAGNOSIS SUMMARY')
  console.log('='.repeat(80))

  const hasJWTOrg = authUser?.raw_user_meta_data?.organization_id
  const hasMemberOf = membershipsDirect && membershipsDirect.length > 0
  const hasAnyRels = allRels && allRels.length > 0

  console.log('\n✅ CHECKS:')
  console.log(`   - JWT has organization_id: ${hasJWTOrg ? '✅ YES' : '❌ NO'}`)
  console.log(`   - Has MEMBER_OF relationships: ${hasMemberOf ? '✅ YES' : '❌ NO'}`)
  console.log(`   - Has ANY relationships: ${hasAnyRels ? '✅ YES' : '❌ NO'}`)

  console.log('\n🎯 ROOT CAUSE:')
  if (!hasMemberOf && hasAnyRels) {
    const hasUserMemberOfOrg = allRels?.some(r => r.relationship_type === 'USER_MEMBER_OF_ORG')
    if (hasUserMemberOfOrg) {
      console.log('   ❌ RELATIONSHIP TYPE MISMATCH')
      console.log('      Database uses: USER_MEMBER_OF_ORG')
      console.log('      verifyAuth() queries for: MEMBER_OF')
      console.log('\n💡 FIX OPTIONS:')
      console.log('   Option A: Update verifyAuth() to query for USER_MEMBER_OF_ORG')
      console.log('   Option B: Create MEMBER_OF relationship for this user')
      console.log('   Option C: Update JWT metadata with organization_id')
    }
  } else if (!hasMemberOf && !hasAnyRels) {
    console.log('   ❌ NO RELATIONSHIPS EXIST FOR THIS USER')
    console.log('\n💡 FIX: Create membership relationship:')
    console.log(`
      await supabase.rpc('hera_relationships_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: '${userId}',
        p_organization_id: '${expectedOrgId}',
        p_relationship: {
          from_entity_id: '${userId}',
          to_entity_id: '${expectedOrgId}',
          relationship_type: 'MEMBER_OF',
          relationship_data: { role: 'OWNER' }
        }
      })
    `)
  } else if (hasMemberOf && !hasJWTOrg) {
    console.log('   ⚠️ MEMBERSHIPS EXIST BUT JWT MISSING ORGANIZATION')
    console.log('\n💡 FIX: Update user metadata:')
    console.log(`
      UPDATE auth.users
      SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{organization_id}',
        '"${expectedOrgId}"'::jsonb
      )
      WHERE id = '${userId}';
    `)
  }

  console.log('\n' + '='.repeat(80))
}

diagnose().catch(console.error)
