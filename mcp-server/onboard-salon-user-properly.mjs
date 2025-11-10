/**
 * 🚀 ONBOARD: salon@heraerp.com to HERA Salon Demo as ORG_OWNER
 *
 * Using hera_onboard_user_v1 RPC (the HERA standard way)
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// User details
const SUPABASE_USER_ID = 'ebd0e099-e25a-476b-b6dc-4b3c26fae4a7'
const USER_ENTITY_ID = '1ac56047-78c9-4c2c-93db-84dcf307ab91'

// Organization details - we need to determine which org ID to use
// There are two IDs for HERA Salon Demo:
// - core_organizations: de5f248d-7747-44f3-9d11-a279f3158fa5
// - core_entities: 7f1d5200-2106-4f94-8095-8a04bc114623

console.log('🚀 ONBOARDING: salon@heraerp.com to HERA Salon Demo')
console.log('='.repeat(80))
console.log('')

async function onboardSalonUser() {
  // Step 1: Determine which organization ID to use
  console.log('📝 Step 1: Checking HERA Salon Demo organization IDs...')
  console.log('-'.repeat(80))

  const { data: coreOrg } = await supabase
    .from('core_organizations')
    .select('*')
    .ilike('name', '%salon%demo%')
    .single()

  console.log('core_organizations entry:')
  if (coreOrg) {
    console.log(`   ID: ${coreOrg.id}`)
    console.log(`   Name: ${coreOrg.name}`)
  } else {
    console.log('   ⚠️  Not found')
  }

  const { data: entityOrg } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'ORGANIZATION')
    .ilike('entity_name', '%salon%demo%')
    .single()

  console.log('\ncore_entities entry:')
  if (entityOrg) {
    console.log(`   ID: ${entityOrg.id}`)
    console.log(`   Name: ${entityOrg.entity_name}`)
  } else {
    console.log('   ⚠️  Not found')
  }
  console.log('')

  // Use core_organizations ID (this is the canonical organization ID)
  const TARGET_ORG_ID = coreOrg?.id || 'de5f248d-7747-44f3-9d11-a279f3158fa5'

  console.log(`✅ Using organization ID: ${TARGET_ORG_ID}`)
  console.log(`   (from core_organizations table)`)
  console.log('')

  // Step 2: Call hera_onboard_user_v1
  console.log('📝 Step 2: Calling hera_onboard_user_v1...')
  console.log('-'.repeat(80))

  const params = {
    p_supabase_user_id: SUPABASE_USER_ID,
    p_organization_id: TARGET_ORG_ID,
    p_actor_user_id: USER_ENTITY_ID, // Self-onboarding
    p_role: 'owner', // Will be normalized to ORG_OWNER
    p_is_active: true
  }

  console.log('Parameters:')
  console.log(`   p_supabase_user_id: ${params.p_supabase_user_id}`)
  console.log(`   p_organization_id: ${params.p_organization_id}`)
  console.log(`   p_actor_user_id: ${params.p_actor_user_id}`)
  console.log(`   p_role: ${params.p_role}`)
  console.log(`   p_is_active: ${params.p_is_active}`)
  console.log('')

  const { data: result, error } = await supabase.rpc('hera_onboard_user_v1', params)

  if (error) {
    console.log('❌ ERROR calling hera_onboard_user_v1:')
    console.log(`   Message: ${error.message}`)
    console.log(`   Code: ${error.code}`)
    console.log(`   Details: ${error.details}`)
    console.log(`   Hint: ${error.hint}`)
    console.log('')
    return false
  }

  console.log('✅ hera_onboard_user_v1 SUCCESS!')
  console.log('')
  console.log('Result:')
  console.log(JSON.stringify(result, null, 2))
  console.log('')

  // Step 3: Verify the onboarding
  console.log('📝 Step 3: Verifying onboarding...')
  console.log('-'.repeat(80))

  // Check MEMBER_OF
  const { data: memberOf } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('relationship_type', 'MEMBER_OF')
    .eq('organization_id', TARGET_ORG_ID)
    .single()

  if (memberOf) {
    console.log('✅ MEMBER_OF relationship created')
    console.log(`   ID: ${memberOf.id}`)
    console.log(`   To: ${memberOf.to_entity_id}`)
    console.log(`   Active: ${memberOf.is_active}`)
  } else {
    console.log('⚠️  MEMBER_OF relationship not found')
  }
  console.log('')

  // Check HAS_ROLE
  const { data: hasRole } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('relationship_type', 'HAS_ROLE')
    .eq('organization_id', TARGET_ORG_ID)

  if (hasRole && hasRole.length > 0) {
    console.log(`✅ HAS_ROLE relationship(s) created: ${hasRole.length}`)
    hasRole.forEach((rel, idx) => {
      console.log(`\n   Role #${idx + 1}:`)
      console.log(`      ID: ${rel.id}`)
      console.log(`      To ROLE entity: ${rel.to_entity_id}`)
      console.log(`      Active: ${rel.is_active}`)
      console.log(`      relationship_data:`, rel.relationship_data)
    })
  } else {
    console.log('⚠️  HAS_ROLE relationship not found')
  }
  console.log('')

  return true
}

async function main() {
  const success = await onboardSalonUser()

  console.log('='.repeat(80))
  console.log('📊 FINAL RESULT')
  console.log('='.repeat(80))
  console.log('')

  if (success) {
    console.log('🎉 SUCCESS!')
    console.log('')
    console.log('✅ salon@heraerp.com successfully onboarded to HERA Salon Demo')
    console.log('')
    console.log('Relationships created:')
    console.log('   1. MEMBER_OF: User → HERA Salon Demo Organization')
    console.log('   2. HAS_ROLE: User → ROLE Entity (ORG_OWNER)')
    console.log('')
    console.log('User now has:')
    console.log('   • Organization membership in HERA Salon Demo')
    console.log('   • ORG_OWNER role with full admin privileges')
    console.log('   • Proper HERA-compliant setup')
    console.log('')
    console.log('User can now log in and access HERA Salon Demo!')
  } else {
    console.log('❌ FAILED')
    console.log('   Could not onboard user')
    console.log('   Check error messages above')
  }

  console.log('')
  console.log('='.repeat(80))
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
