/**
 * Verify MEMBER_OF relationships exist for HERA Salon Demo
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_ORG_ID = 'de5f248d-7747-44f3-9d11-a279f3158fa5'
const KNOWN_USER_ID = '1ac56047-78c9-4c2c-93db-84dcf307ab91'

console.log('🔍 VERIFYING: MEMBER_OF relationships for HERA Salon Demo')
console.log('='.repeat(80))
console.log('')

async function verifyMemberOf() {
  // Step 1: Get organization entity
  console.log('Step 1: Finding organization entity...')
  const { data: orgEntity, error: orgError } = await supabase
    .from('core_entities')
    .select('id, entity_type, entity_name, organization_id')
    .eq('organization_id', TEST_ORG_ID)
    .eq('entity_type', 'ORGANIZATION')
    .limit(1)
    .single()
  
  if (orgError || !orgEntity) {
    console.log('❌ Organization entity NOT found')
    console.log('   Error:', orgError?.message)
    console.log('')
    console.log('This explains why hera_users_list_v1 returns zero users!')
    return false
  }
  
  console.log('✅ Organization entity found:')
  console.log(`   ID: ${orgEntity.id}`)
  console.log(`   Name: ${orgEntity.entity_name}`)
  console.log(`   Type: ${orgEntity.entity_type}`)
  console.log('')
  
  // Step 2: Check MEMBER_OF relationships
  console.log('Step 2: Checking MEMBER_OF relationships...')
  const { data: memberOf, error: memberError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('organization_id', TEST_ORG_ID)
    .eq('to_entity_id', orgEntity.id)
    .eq('relationship_type', 'MEMBER_OF')
  
  if (memberError) {
    console.log('❌ Error querying MEMBER_OF relationships:', memberError.message)
    return false
  }
  
  console.log(`✅ Found ${memberOf?.length || 0} MEMBER_OF relationship(s)`)
  console.log('')
  
  if (!memberOf || memberOf.length === 0) {
    console.log('❌ NO MEMBER_OF RELATIONSHIPS FOUND!')
    console.log('')
    console.log('This explains why hera_users_list_v1 returns zero users!')
    console.log('')
    console.log('Solution: User needs to be onboarded properly using hera_onboard_user_v1')
    return false
  }
  
  // Display relationships
  memberOf.forEach((rel, idx) => {
    console.log(`MEMBER_OF #${idx + 1}:`)
    console.log(`   from_entity_id (user): ${rel.from_entity_id}`)
    console.log(`   to_entity_id (org): ${rel.to_entity_id}`)
    console.log(`   relationship_data: ${JSON.stringify(rel.relationship_data)}`)
    console.log(`   is_active: ${rel.is_active}`)
    console.log(`   Known user match: ${rel.from_entity_id === KNOWN_USER_ID ? 'YES ✅' : 'NO'}`)
    console.log('')
  })
  
  // Step 3: Check HAS_ROLE relationships
  console.log('Step 3: Checking HAS_ROLE relationships...')
  const { data: hasRole, error: roleError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('organization_id', TEST_ORG_ID)
    .eq('relationship_type', 'HAS_ROLE')
    .in('from_entity_id', memberOf.map(m => m.from_entity_id))
  
  if (roleError) {
    console.log('❌ Error querying HAS_ROLE relationships:', roleError.message)
  } else {
    console.log(`✅ Found ${hasRole?.length || 0} HAS_ROLE relationship(s)`)
    console.log('')
    
    if (hasRole && hasRole.length > 0) {
      hasRole.forEach((rel, idx) => {
        console.log(`HAS_ROLE #${idx + 1}:`)
        console.log(`   from_entity_id (user): ${rel.from_entity_id}`)
        console.log(`   to_entity_id (role): ${rel.to_entity_id}`)
        console.log(`   role_code: ${rel.relationship_data?.role_code || 'N/A'}`)
        console.log(`   is_primary: ${rel.relationship_data?.is_primary || false}`)
        console.log(`   is_active: ${rel.is_active}`)
        console.log('')
      })
    }
  }
  
  console.log('='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log('')
  console.log(`Organization entity: ${orgEntity ? '✅ EXISTS' : '❌ MISSING'}`)
  console.log(`MEMBER_OF relationships: ${memberOf.length > 0 ? `✅ ${memberOf.length} found` : '❌ NONE'}`)
  console.log(`HAS_ROLE relationships: ${hasRole && hasRole.length > 0 ? `✅ ${hasRole.length} found` : '❌ NONE'}`)
  console.log('')
  
  if (memberOf.length > 0) {
    console.log('✅ Data structure is correct for hera_users_list_v1')
    console.log('')
    console.log('If RPC still returns zero, the fix needs to be deployed:')
    console.log('   → /mcp-server/fix-hera-users-list-v1.sql')
  } else {
    console.log('❌ Missing MEMBER_OF relationships')
    console.log('')
    console.log('Users need to be onboarded using hera_onboard_user_v1')
  }
  
  return memberOf.length > 0
}

verifyMemberOf().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
