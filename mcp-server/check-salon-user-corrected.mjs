/**
 * 🔍 FINAL CHECK: salon@heraerp.com with CORRECT field names
 * Using from_entity_id and to_entity_id (not source/target)
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'
const HERA_SALON_DEMO_ORG_ID = 'de5f248d-7747-44f3-9d11-a279f3158fa5'

console.log('🔍 CHECKING: salon@heraerp.com with CORRECT Schema Fields')
console.log('='.repeat(80))
console.log('')

async function checkSalonUser() {
  // Step 1: Find user by email
  console.log('📝 Step 1: Finding salon@heraerp.com...')
  console.log('-'.repeat(80))

  const { data: emailFields, error: emailError } = await supabase
    .from('core_dynamic_data')
    .select('entity_id, field_value_text')
    .eq('field_name', 'email')
    .eq('field_value_text', 'salon@heraerp.com')

  if (emailError || !emailFields || emailFields.length === 0) {
    console.log('❌ salon@heraerp.com NOT FOUND')
    console.log('')
    return null
  }

  const userId = emailFields[0].entity_id
  console.log(`✅ Found user: ${userId}`)
  console.log('')

  // Step 2: Get user entity details
  console.log('📝 Step 2: Getting user entity details...')
  console.log('-'.repeat(80))

  const { data: user } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', userId)
    .single()

  console.log(`Name: ${user.entity_name}`)
  console.log(`Type: ${user.entity_type}`)
  console.log(`Code: ${user.entity_code}`)
  console.log(`Organization: ${user.organization_id}`)
  console.log(`In Platform Org: ${user.organization_id === PLATFORM_ORG_ID ? 'YES ✅' : 'NO ❌'}`)
  console.log('')

  // Step 3: Check MEMBER_OF relationships (using CORRECT field names)
  console.log('📝 Step 3: Checking MEMBER_OF relationships...')
  console.log('-'.repeat(80))

  const { data: memberships, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', userId)  // CORRECT: from_entity_id, not source_entity_id
    .eq('relationship_type', 'MEMBER_OF')

  if (relError) {
    console.log('❌ Error:', relError.message)
    return { userId, user, memberships: null }
  }

  if (!memberships || memberships.length === 0) {
    console.log('❌ No MEMBER_OF relationships found')
    console.log('')

    // Check all relationships for this user
    const { data: allRels } = await supabase
      .from('core_relationships')
      .select('relationship_type, to_entity_id, is_active')
      .eq('from_entity_id', userId)

    if (allRels && allRels.length > 0) {
      console.log(`📋 User has ${allRels.length} total relationships:`)
      allRels.forEach(rel => {
        console.log(`   - ${rel.relationship_type} → ${rel.to_entity_id}`)
      })
    } else {
      console.log('⚠️  User has NO relationships at all')
    }
    console.log('')

    return { userId, user, memberships: null }
  }

  console.log(`✅ Found ${memberships.length} MEMBER_OF relationship(s)`)
  console.log('')

  for (const membership of memberships) {
    // Get organization name
    const { data: org } = await supabase
      .from('core_organizations')
      .select('name')
      .eq('id', membership.to_entity_id)  // CORRECT: to_entity_id
      .maybeSingle()

    const orgName = org?.name || 'Unknown Org'

    console.log(`🏢 Organization: ${orgName}`)
    console.log(`   Org ID: ${membership.to_entity_id}`)
    console.log(`   Active: ${membership.is_active}`)
    console.log(`   Created: ${membership.created_at}`)

    // Check if this is HERA Salon Demo
    if (membership.to_entity_id === HERA_SALON_DEMO_ORG_ID) {
      console.log(`   ⭐ THIS IS HERA SALON DEMO!`)
    }

    if (membership.relationship_data && Object.keys(membership.relationship_data).length > 0) {
      console.log(`   Relationship Data:`)
      if (membership.relationship_data.role) {
        console.log(`      📌 Role: ${membership.relationship_data.role}`)
      } else {
        console.log(`      ⚠️  Role: Not set`)
      }
      if (membership.relationship_data.is_primary !== undefined) {
        console.log(`      Primary: ${membership.relationship_data.is_primary}`)
      }
      console.log(`      Full data: ${JSON.stringify(membership.relationship_data)}`)
    } else {
      console.log(`   ⚠️  No relationship_data or empty`)
    }

    console.log('')
  }

  return { userId, user, memberships }
}

async function main() {
  const result = await checkSalonUser()

  console.log('='.repeat(80))
  console.log('📊 FINAL SUMMARY')
  console.log('='.repeat(80))
  console.log('')

  if (!result) {
    console.log('❌ salon@heraerp.com does NOT exist in database')
    console.log('')
    console.log('💡 User needs to be created first')
    console.log('')
    return
  }

  const { userId, user, memberships } = result

  console.log('✅ USER EXISTS: salon@heraerp.com')
  console.log(`   Entity ID: ${userId}`)
  console.log(`   Name: ${user.entity_name}`)
  console.log(`   In Platform Org: ${user.organization_id === PLATFORM_ORG_ID ? 'YES ✅' : 'NO ❌'}`)
  console.log('')

  if (memberships && memberships.length > 0) {
    console.log(`✅ HAS ${memberships.length} ORGANIZATION MEMBERSHIP(S)`)

    const salonMembership = memberships.find(m => m.to_entity_id === HERA_SALON_DEMO_ORG_ID)
    if (salonMembership) {
      console.log(`✅ LINKED TO HERA SALON DEMO`)
      const role = salonMembership.relationship_data?.role
      if (role) {
        console.log(`✅ ROLE IS SET: ${role}`)
      } else {
        console.log(`❌ ROLE IS NOT SET`)
      }
    } else {
      console.log(`❌ NOT LINKED TO HERA SALON DEMO`)
    }
  } else {
    console.log(`❌ HAS NO ORGANIZATION MEMBERSHIPS`)
  }

  console.log('')
  console.log('='.repeat(80))
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
