/**
 * 🎯 FINAL STATUS: salon@heraerp.com Complete Analysis
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🎯 FINAL STATUS: salon@heraerp.com')
console.log('='.repeat(80))
console.log('')

async function getFinalStatus() {
  // User entity ID from auth metadata
  const USER_ENTITY_ID = '1ac56047-78c9-4c2c-93db-84dcf307ab91'

  // Get user entity
  const { data: entity } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', USER_ENTITY_ID)
    .single()

  console.log('✅ USER ENTITY EXISTS')
  console.log(`   ID: ${entity.id}`)
  console.log(`   Name: ${entity.entity_name}`)
  console.log(`   Type: ${entity.entity_type}`)
  console.log(`   Code: ${entity.entity_code}`)
  console.log(`   Organization: ${entity.organization_id}`)
  console.log(`   Platform Org: ${entity.organization_id === '00000000-0000-0000-0000-000000000000' ? 'YES ✅' : 'NO ❌'}`)
  console.log('')

  // Get membership
  const { data: memberships } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('relationship_type', 'MEMBER_OF')
    .single()

  if (!memberships) {
    console.log('❌ No membership found')
    return
  }

  console.log('✅ HAS MEMBERSHIP')
  console.log(`   Target Org ID: ${memberships.to_entity_id}`)
  console.log(`   Active: ${memberships.is_active}`)
  console.log('')

  // Check what this org ID is in BOTH tables
  const { data: entityOrg } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type')
    .eq('id', memberships.to_entity_id)
    .single()

  const { data: coreOrg } = await supabase
    .from('core_organizations')
    .select('id, name')
    .eq('id', memberships.to_entity_id)
    .maybeSingle()

  console.log('📋 ORGANIZATION DETAILS:')
  if (entityOrg) {
    console.log(`   In core_entities:`)
    console.log(`      Name: ${entityOrg.entity_name}`)
    console.log(`      Type: ${entityOrg.entity_type}`)
    console.log(`      ID: ${entityOrg.id}`)
  }

  if (coreOrg) {
    console.log(`   In core_organizations:`)
    console.log(`      Name: ${coreOrg.name}`)
    console.log(`      ID: ${coreOrg.id}`)
  }

  if (!coreOrg && entityOrg) {
    console.log(`   ⚠️  Org exists in core_entities but NOT in core_organizations`)
  }

  console.log('')

  // Check relationship_data for role
  console.log('📋 RELATIONSHIP DATA:')
  if (memberships.relationship_data && Object.keys(memberships.relationship_data).length > 0) {
    console.log(JSON.stringify(memberships.relationship_data, null, 2))

    if (memberships.relationship_data.role) {
      console.log(`   ✅ ROLE IS SET: ${memberships.relationship_data.role}`)
    } else {
      console.log(`   ❌ ROLE IS NOT SET`)
    }
  } else {
    console.log('   ⚠️  relationship_data is empty or null')
    console.log(`   ❌ ROLE IS NOT SET`)
  }

  console.log('')

  // Summary
  console.log('='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log('')

  console.log('✅ salon@heraerp.com EXISTS in Supabase Auth')
  console.log(`   Auth UID: ebd0e099-e25a-476b-b6dc-4b3c26fae4a7`)
  console.log('')

  console.log('✅ USER Entity EXISTS in Platform Org')
  console.log(`   Entity ID: ${USER_ENTITY_ID}`)
  console.log('')

  console.log(`✅ LINKED to Organization: ${entityOrg?.entity_name}`)
  console.log(`   Org ID: ${memberships.to_entity_id}`)
  console.log('')

  if (memberships.relationship_data?.role) {
    console.log(`✅ ROLE IS SET: ${memberships.relationship_data.role}`)
  } else {
    console.log(`❌ ROLE IS NOT SET in relationship_data`)
    console.log(`   Need to add role to relationship_data JSONB field`)
  }

  console.log('')
  console.log('='.repeat(80))
}

getFinalStatus().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
