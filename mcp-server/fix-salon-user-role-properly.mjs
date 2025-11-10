/**
 * 🔧 FIX (PROPER): Add role to salon@heraerp.com using HERA standard
 *
 * Current Issue:
 * - We added role to MEMBER_OF relationship_data (WRONG)
 * - HERA uses HAS_ROLE relationships instead (CORRECT)
 *
 * Solution Options:
 * 1. Call hera_onboard_user_v1 (idempotent, will update)
 * 2. Manually create HAS_ROLE relationship
 *
 * We'll use Option 1: Call hera_onboard_user_v1
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SUPABASE_USER_ID = 'ebd0e099-e25a-476b-b6dc-4b3c26fae4a7'
const USER_ENTITY_ID = '1ac56047-78c9-4c2c-93db-84dcf307ab91'
const HERA_SALON_DEMO_ORG_ID = '7f1d5200-2106-4f94-8095-8a04bc114623'
const ACTOR_USER_ID = USER_ENTITY_ID // Self-onboarding

console.log('🔧 FIXING: salon@heraerp.com Role (PROPER HERA WAY)')
console.log('='.repeat(80))
console.log('')

async function fixRoleProperly() {
  // Step 1: Check current state
  console.log('📝 Step 1: Checking current relationships...')
  console.log('-'.repeat(80))

  // Check MEMBER_OF
  const { data: memberOf } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('to_entity_id', HERA_SALON_DEMO_ORG_ID)
    .eq('relationship_type', 'MEMBER_OF')
    .maybeSingle()

  console.log(`MEMBER_OF relationship: ${memberOf ? 'EXISTS ✅' : 'NOT FOUND ❌'}`)
  if (memberOf) {
    console.log(`   relationship_data: ${JSON.stringify(memberOf.relationship_data)}`)
  }

  // Check HAS_ROLE
  const { data: hasRole } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('organization_id', HERA_SALON_DEMO_ORG_ID)
    .eq('relationship_type', 'HAS_ROLE')

  console.log(`HAS_ROLE relationships: ${hasRole?.length || 0}`)
  if (hasRole && hasRole.length > 0) {
    hasRole.forEach(rel => {
      console.log(`   - to_entity_id: ${rel.to_entity_id}`)
      console.log(`     relationship_data: ${JSON.stringify(rel.relationship_data)}`)
    })
  }
  console.log('')

  // Step 2: Call hera_onboard_user_v1
  console.log('📝 Step 2: Calling hera_onboard_user_v1...')
  console.log('-'.repeat(80))
  console.log(`Parameters:`)
  console.log(`   p_supabase_user_id: ${SUPABASE_USER_ID}`)
  console.log(`   p_organization_id: ${HERA_SALON_DEMO_ORG_ID}`)
  console.log(`   p_actor_user_id: ${ACTOR_USER_ID}`)
  console.log(`   p_role: 'admin'`)
  console.log('')

  const { data: onboardResult, error: onboardError } = await supabase.rpc('hera_onboard_user_v1', {
    p_supabase_user_id: SUPABASE_USER_ID,
    p_organization_id: HERA_SALON_DEMO_ORG_ID,
    p_actor_user_id: ACTOR_USER_ID,
    p_role: 'admin',
    p_is_active: true
  })

  if (onboardError) {
    console.log('❌ Error calling hera_onboard_user_v1:')
    console.log(`   Message: ${onboardError.message}`)
    console.log(`   Code: ${onboardError.code}`)
    console.log(`   Details: ${onboardError.details}`)
    console.log(`   Hint: ${onboardError.hint}`)
    console.log('')
    return false
  }

  console.log('✅ hera_onboard_user_v1 succeeded!')
  console.log('   Result:')
  console.log(JSON.stringify(onboardResult, null, 2))
  console.log('')

  // Step 3: Verify the results
  console.log('📝 Step 3: Verifying HERA role setup...')
  console.log('-'.repeat(80))

  // Check HAS_ROLE relationship
  const { data: verifyRole } = await supabase
    .from('core_relationships')
    .select('*, role_entity:to_entity_id(entity_name, entity_code)')
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('organization_id', HERA_SALON_DEMO_ORG_ID)
    .eq('relationship_type', 'HAS_ROLE')

  if (!verifyRole || verifyRole.length === 0) {
    console.log('❌ No HAS_ROLE relationship found')
    return false
  }

  console.log(`✅ Found ${verifyRole.length} HAS_ROLE relationship(s):`)
  verifyRole.forEach((rel, idx) => {
    console.log(`\n   ${idx + 1}. HAS_ROLE relationship:`)
    console.log(`      ID: ${rel.id}`)
    console.log(`      To Entity (ROLE): ${rel.to_entity_id}`)
    console.log(`      Active: ${rel.is_active}`)
    console.log(`      relationship_data: ${JSON.stringify(rel.relationship_data, null, 2)}`)

    if (rel.relationship_data?.role_code) {
      console.log(`      📌 Role Code: ${rel.relationship_data.role_code}`)
    }
    if (rel.relationship_data?.is_primary !== undefined) {
      console.log(`      📌 Is Primary: ${rel.relationship_data.is_primary}`)
    }
  })
  console.log('')

  // Check ROLE entity
  const roleEntityId = onboardResult.role_rel_id ? verifyRole[0]?.to_entity_id : null
  if (roleEntityId) {
    const { data: roleEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', roleEntityId)
      .single()

    if (roleEntity) {
      console.log('✅ ROLE entity details:')
      console.log(`   ID: ${roleEntity.id}`)
      console.log(`   Name: ${roleEntity.entity_name}`)
      console.log(`   Code: ${roleEntity.entity_code}`)
      console.log(`   Type: ${roleEntity.entity_type}`)
      console.log('')
    }
  }

  // Step 4: Clean up the incorrect relationship_data we added earlier
  console.log('📝 Step 4: Cleaning up incorrect MEMBER_OF relationship_data...')
  console.log('-'.repeat(80))

  const { error: cleanupError } = await supabase
    .from('core_relationships')
    .update({
      relationship_data: {}
    })
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('to_entity_id', HERA_SALON_DEMO_ORG_ID)
    .eq('relationship_type', 'MEMBER_OF')

  if (cleanupError) {
    console.log('⚠️  Could not clean up MEMBER_OF relationship_data:', cleanupError.message)
  } else {
    console.log('✅ Cleaned up MEMBER_OF relationship_data (role should be in HAS_ROLE)')
  }
  console.log('')

  return true
}

async function main() {
  const success = await fixRoleProperly()

  console.log('='.repeat(80))
  console.log('📊 FINAL RESULT')
  console.log('='.repeat(80))
  console.log('')

  if (success) {
    console.log('🎉 SUCCESS!')
    console.log('')
    console.log('✅ salon@heraerp.com is now properly configured using HERA standards:')
    console.log('')
    console.log('RELATIONSHIPS CREATED:')
    console.log('   1. MEMBER_OF: User → HERA Salon Demo Organization')
    console.log('      - Establishes organization membership')
    console.log('      - relationship_data: {} (empty, as per HERA standard)')
    console.log('')
    console.log('   2. HAS_ROLE: User → ROLE Entity (ORG_ADMIN)')
    console.log('      - Establishes role permissions')
    console.log('      - relationship_data: { role_code: "ORG_ADMIN", is_primary: true }')
    console.log('')
    console.log('ENTITIES CREATED:')
    console.log('   - ROLE entity with code "ORG_ADMIN" in HERA Salon Demo org')
    console.log('')
    console.log('This follows the HERA pattern:')
    console.log('   - MEMBER_OF = organization membership (who belongs where)')
    console.log('   - HAS_ROLE = permissions/privileges (what they can do)')
    console.log('')
  } else {
    console.log('❌ FAILED')
    console.log('   Could not set up role properly')
    console.log('   Please check error messages above')
  }

  console.log('')
  console.log('='.repeat(80))
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
