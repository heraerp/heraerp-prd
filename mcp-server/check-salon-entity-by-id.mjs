/**
 * 🔍 CHECK: USER entity by ID from auth metadata
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const USER_ENTITY_ID = '1ac56047-78c9-4c2c-93db-84dcf307ab91' // From auth metadata
const HERA_SALON_DEMO_ORG_ID = 'de5f248d-7747-44f3-9d11-a279f3158fa5'

console.log('🔍 CHECKING: USER Entity from Auth Metadata')
console.log('='.repeat(80))
console.log(`Entity ID: ${USER_ENTITY_ID}`)
console.log('')

async function checkUserEntity() {
  // Get entity details
  const { data: entity, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', USER_ENTITY_ID)
    .single()

  if (error || !entity) {
    console.log('❌ Entity not found:', error?.message || 'No data')
    return
  }

  console.log('✅ Found USER Entity!')
  console.log(`   Name: ${entity.entity_name}`)
  console.log(`   Type: ${entity.entity_type}`)
  console.log(`   Code: ${entity.entity_code}`)
  console.log(`   Organization: ${entity.organization_id}`)
  console.log(`   Created: ${entity.created_at}`)
  console.log(`   Updated: ${entity.updated_at}`)
  console.log('')

  // Get email from dynamic data
  const { data: emailField } = await supabase
    .from('core_dynamic_data')
    .select('field_value_text, organization_id')
    .eq('entity_id', USER_ENTITY_ID)
    .eq('field_name', 'email')
    .maybeSingle()

  if (emailField) {
    console.log(`📧 Email: ${emailField.field_value_text}`)
    console.log(`   (Email org: ${emailField.organization_id})`)
  } else {
    console.log(`📧 Email: Not set in core_dynamic_data`)
  }
  console.log('')

  // Get all dynamic data
  const { data: dynamicData } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_text, field_value_json, organization_id')
    .eq('entity_id', USER_ENTITY_ID)

  if (dynamicData && dynamicData.length > 0) {
    console.log(`📋 Dynamic Data (${dynamicData.length} fields):`)
    dynamicData.forEach(field => {
      const value = field.field_value_text || JSON.stringify(field.field_value_json)
      console.log(`   - ${field.field_name}: ${value}`)
      console.log(`     (org: ${field.organization_id})`)
    })
    console.log('')
  }

  // Check MEMBER_OF relationships
  const { data: memberships } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('relationship_type', 'MEMBER_OF')

  if (!memberships || memberships.length === 0) {
    console.log('❌ NO MEMBER_OF relationships found')
    console.log('   User is NOT linked to any organization')
    console.log('')

    // Check all relationship types
    const { data: allRels } = await supabase
      .from('core_relationships')
      .select('relationship_type, to_entity_id, is_active')
      .eq('from_entity_id', USER_ENTITY_ID)

    if (allRels && allRels.length > 0) {
      console.log(`📋 Other relationships (${allRels.length}):`)
      allRels.forEach(rel => {
        console.log(`   - ${rel.relationship_type} → ${rel.to_entity_id}`)
      })
    }
    console.log('')

    return { entity, memberships: null }
  }

  console.log(`✅ Found ${memberships.length} MEMBER_OF relationship(s)`)
  console.log('')

  for (const membership of memberships) {
    const { data: org } = await supabase
      .from('core_organizations')
      .select('name')
      .eq('id', membership.to_entity_id)
      .maybeSingle()

    const orgName = org?.name || 'Unknown Org'

    console.log(`🏢 Organization: ${orgName}`)
    console.log(`   Org ID: ${membership.to_entity_id}`)
    console.log(`   Active: ${membership.is_active}`)
    console.log(`   Created: ${membership.created_at}`)

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
      console.log(`      Full: ${JSON.stringify(membership.relationship_data)}`)
    } else {
      console.log(`   ⚠️  No relationship_data`)
    }

    console.log('')
  }

  return { entity, memberships }
}

async function main() {
  const result = await checkUserEntity()

  console.log('='.repeat(80))
  console.log('📊 FINAL ANSWER')
  console.log('='.repeat(80))
  console.log('')

  if (!result) {
    console.log('❌ Entity not found')
    return
  }

  const { entity, memberships } = result

  console.log('✅ salon@heraerp.com USER ENTITY FOUND')
  console.log(`   Entity ID: ${USER_ENTITY_ID}`)
  console.log(`   Name: ${entity.entity_name}`)
  console.log(`   In Platform Org: ${entity.organization_id === '00000000-0000-0000-0000-000000000000' ? 'YES ✅' : 'NO ❌'}`)
  console.log('')

  if (memberships && memberships.length > 0) {
    const salonMembership = memberships.find(m => m.to_entity_id === HERA_SALON_DEMO_ORG_ID)

    if (salonMembership) {
      console.log('✅ LINKED TO HERA SALON DEMO')
      const role = salonMembership.relationship_data?.role
      if (role) {
        console.log(`✅ ROLE IS SET: ${role}`)
      } else {
        console.log(`❌ ROLE IS NOT SET in relationship_data`)
      }
    } else {
      console.log('❌ NOT LINKED TO HERA SALON DEMO')
      console.log(`   Linked to ${memberships.length} other organization(s)`)
    }
  } else {
    console.log('❌ NOT LINKED TO ANY ORGANIZATION')
  }

  console.log('')
  console.log('='.repeat(80))
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
