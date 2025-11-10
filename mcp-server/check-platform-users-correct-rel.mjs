/**
 * 🔍 CHECK: Platform users with CORRECT relationship type (MEMBER_OF)
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

console.log('🔍 CHECKING: Platform Users with MEMBER_OF Relationships')
console.log('='.repeat(80))
console.log('')

async function checkRelationshipTypes() {
  // First, let's see what relationship types exist
  console.log('📝 Step 1: Finding all relationship types in database...')
  console.log('-'.repeat(80))

  const { data: allRels, error: relError } = await supabase
    .from('core_relationships')
    .select('relationship_type')
    .limit(1000)

  if (relError) {
    console.log('❌ Error:', relError.message)
  } else {
    const uniqueTypes = [...new Set(allRels.map(r => r.relationship_type))]
    console.log(`✅ Found ${uniqueTypes.length} unique relationship types:`)
    uniqueTypes.forEach((type, idx) => {
      console.log(`   ${idx + 1}. ${type}`)
    })
  }
  console.log('')

  // Check for MEMBER_OF relationships
  console.log('📝 Step 2: Finding MEMBER_OF relationships...')
  console.log('-'.repeat(80))

  const { data: memberOfRels, error: memberError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('relationship_type', 'MEMBER_OF')

  if (memberError) {
    console.log('❌ Error:', memberError.message)
    return
  }

  if (!memberOfRels || memberOfRels.length === 0) {
    console.log('⚠️  No MEMBER_OF relationships found')
    console.log('')
    return
  }

  console.log(`✅ Found ${memberOfRels.length} MEMBER_OF relationships`)
  console.log('')

  // Group by source entity (users)
  const userMemberships = {}
  memberOfRels.forEach(rel => {
    if (!userMemberships[rel.source_entity_id]) {
      userMemberships[rel.source_entity_id] = []
    }
    userMemberships[rel.source_entity_id].push(rel)
  })

  console.log('📝 Step 3: Analyzing user memberships...')
  console.log('-'.repeat(80))
  console.log('')

  for (const [userId, memberships] of Object.entries(userMemberships)) {
    // Get user details
    const { data: user } = await supabase
      .from('core_entities')
      .select('entity_name, entity_type, entity_code, organization_id')
      .eq('id', userId)
      .single()

    // Show ALL entities with MEMBER_OF, not just USER type
    if (!user) continue

    console.log(`${user.entity_type === 'USER' ? '👤' : '🏢'} ${user.entity_name} (${user.entity_type})`)
    console.log(`   Entity ID: ${userId}`)
    console.log(`   Code: ${user.entity_code || 'N/A'}`)
    console.log(`   Organization: ${user.organization_id}`)

    // Get email
    const { data: emailField } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('entity_id', userId)
      .eq('field_name', 'email')
      .maybeSingle()

    console.log(`   📧 Email: ${emailField?.field_value_text || 'Not set'}`)
    console.log(`   🏢 Memberships: ${memberships.length}`)

    for (const membership of memberships) {
      // Get organization details
      const { data: org } = await supabase
        .from('core_organizations')
        .select('name')
        .eq('id', membership.target_entity_id)
        .maybeSingle()

      const orgName = org?.name || 'Unknown Org'

      console.log(`      - ${orgName}`)
      console.log(`        Org ID: ${membership.target_entity_id}`)
      console.log(`        Active: ${membership.is_active}`)

      if (membership.relationship_data) {
        if (membership.relationship_data.role) {
          console.log(`        📌 Role: ${membership.relationship_data.role}`)
        } else {
          console.log(`        ⚠️  Role: Not set in relationship_data`)
        }
        if (membership.relationship_data.is_primary !== undefined) {
          console.log(`        Primary: ${membership.relationship_data.is_primary}`)
        }
      } else {
        console.log(`        ⚠️  No relationship_data`)
      }
    }

    console.log('')
  }

  // Summary
  console.log('='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log('')
  console.log(`Total MEMBER_OF relationships: ${memberOfRels.length}`)
  console.log(`Unique users with memberships: ${Object.keys(userMemberships).length}`)
  console.log('')
}

async function checkSalonUserSpecifically() {
  console.log('📝 Step 4: Searching specifically for salon@heraerp.com...')
  console.log('-'.repeat(80))

  // Find user by email
  const { data: emailFields } = await supabase
    .from('core_dynamic_data')
    .select('entity_id, field_value_text')
    .eq('field_name', 'email')
    .eq('field_value_text', 'salon@heraerp.com')

  if (!emailFields || emailFields.length === 0) {
    console.log('❌ salon@heraerp.com NOT FOUND')
    console.log('')
    return
  }

  const userId = emailFields[0].entity_id
  console.log(`✅ Found salon@heraerp.com: ${userId}`)

  // Get user entity
  const { data: user } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', userId)
    .single()

  console.log(`   Name: ${user.entity_name}`)
  console.log(`   Org: ${user.organization_id}`)
  console.log(`   In Platform Org: ${user.organization_id === PLATFORM_ORG_ID ? 'YES ✅' : 'NO ❌'}`)
  console.log('')

  // Check MEMBER_OF relationships
  const { data: memberships } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('source_entity_id', userId)
    .eq('relationship_type', 'MEMBER_OF')

  if (!memberships || memberships.length === 0) {
    console.log('❌ No MEMBER_OF relationships found')
    console.log('')
    return
  }

  console.log(`✅ Found ${memberships.length} MEMBER_OF relationship(s):`)
  for (const rel of memberships) {
    const { data: org } = await supabase
      .from('core_organizations')
      .select('name')
      .eq('id', rel.target_entity_id)
      .maybeSingle()

    console.log(`   - ${org?.name || 'Unknown Org'}`)
    console.log(`     Org ID: ${rel.target_entity_id}`)
    console.log(`     Active: ${rel.is_active}`)
    if (rel.relationship_data?.role) {
      console.log(`     📌 Role: ${rel.relationship_data.role}`)
    } else {
      console.log(`     ⚠️  Role: Not set`)
    }
  }
  console.log('')
}

async function main() {
  await checkRelationshipTypes()
  await checkSalonUserSpecifically()
  console.log('='.repeat(80))
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
