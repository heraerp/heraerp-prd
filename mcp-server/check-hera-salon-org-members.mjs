/**
 * 🔍 CHECK: HERA Salon organization and its members
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 CHECKING: HERA Salon Organization and Members')
console.log('='.repeat(80))
console.log('')

async function checkSalonOrg() {
  // Step 1: Find HERA Salon organization
  console.log('📝 Step 1: Searching for HERA Salon organization...')
  console.log('-'.repeat(80))

  const { data: orgs, error: orgError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, entity_code, created_at')
    .eq('entity_type', 'ORG')

  if (orgError) {
    console.log('❌ Error fetching organizations:', orgError.message)
    return
  }

  if (!orgs || orgs.length === 0) {
    console.log('⚠️  No organizations found')
    return
  }

  console.log(`📋 Found ${orgs.length} organizations:`)
  orgs.forEach((org, idx) => {
    console.log(`   ${idx + 1}. ${org.entity_name}`)
    console.log(`      ID: ${org.id}`)
    console.log(`      Code: ${org.entity_code || 'N/A'}`)
  })
  console.log('')

  // Find HERA Salon specifically
  const salonOrg = orgs.find(org =>
    org.entity_name.toLowerCase().includes('hera') &&
    org.entity_name.toLowerCase().includes('salon')
  )

  if (!salonOrg) {
    console.log('⚠️  HERA Salon organization not found')
    console.log('   Try using DEFAULT_ORGANIZATION_ID from .env instead')
    console.log(`   DEFAULT_ORGANIZATION_ID: ${process.env.DEFAULT_ORGANIZATION_ID}`)
    console.log('')

    // Use default org if set
    if (process.env.DEFAULT_ORGANIZATION_ID) {
      const defaultOrg = orgs.find(org => org.id === process.env.DEFAULT_ORGANIZATION_ID)
      if (defaultOrg) {
        console.log('✅ Using DEFAULT_ORGANIZATION_ID as target org:')
        console.log(`   Name: ${defaultOrg.entity_name}`)
        console.log(`   ID: ${defaultOrg.id}`)
        console.log('')
        return await checkOrgMembers(defaultOrg.id, defaultOrg.entity_name)
      }
    }
    return
  }

  console.log('✅ Found HERA Salon Organization:')
  console.log(`   Name: ${salonOrg.entity_name}`)
  console.log(`   ID: ${salonOrg.id}`)
  console.log(`   Code: ${salonOrg.entity_code || 'N/A'}`)
  console.log('')

  return await checkOrgMembers(salonOrg.id, salonOrg.entity_name)
}

async function checkOrgMembers(orgId, orgName) {
  // Step 2: Find all members of this organization
  console.log(`📝 Step 2: Finding members of ${orgName}...`)
  console.log('-'.repeat(80))

  const { data: relationships, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('target_entity_id', orgId)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .eq('is_active', true)

  if (relError) {
    console.log('❌ Error fetching relationships:', relError.message)
    return
  }

  if (!relationships || relationships.length === 0) {
    console.log('⚠️  No members found for this organization')
    console.log('   No USER_MEMBER_OF_ORG relationships exist')
    console.log('')
    return
  }

  console.log(`✅ Found ${relationships.length} member(s):`)
  console.log('')

  for (const rel of relationships) {
    const userId = rel.source_entity_id

    // Get user entity details
    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, entity_code')
      .eq('id', userId)
      .single()

    if (!userEntity) continue

    console.log(`👤 Member #${relationships.indexOf(rel) + 1}:`)
    console.log(`   Entity ID: ${userId}`)
    console.log(`   Name: ${userEntity.entity_name}`)
    console.log(`   Code: ${userEntity.entity_code || 'N/A'}`)

    // Get email from dynamic data
    const { data: emailField } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('entity_id', userId)
      .eq('field_name', 'email')
      .single()

    if (emailField) {
      console.log(`   📧 Email: ${emailField.field_value_text}`)
    } else {
      console.log(`   📧 Email: Not set`)
    }

    // Get role from relationship_data
    if (rel.relationship_data) {
      console.log(`   Relationship Data:`)
      if (rel.relationship_data.role) {
        console.log(`   📌 Role: ${rel.relationship_data.role}`)
      } else {
        console.log(`   ⚠️  Role: Not set in relationship_data`)
      }
      if (rel.relationship_data.is_primary !== undefined) {
        console.log(`   📌 Is Primary: ${rel.relationship_data.is_primary}`)
      }
      if (rel.relationship_data.last_accessed) {
        console.log(`   📌 Last Accessed: ${rel.relationship_data.last_accessed}`)
      }
    } else {
      console.log(`   ⚠️  No relationship_data JSON`)
    }

    // Get all dynamic data for this user in this org
    const { data: dynamicFields } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json')
      .eq('entity_id', userId)
      .eq('organization_id', orgId)

    if (dynamicFields && dynamicFields.length > 0) {
      console.log(`   Dynamic Data (${dynamicFields.length} fields):`)
      dynamicFields.forEach(field => {
        const value = field.field_value_text || JSON.stringify(field.field_value_json)
        console.log(`     - ${field.field_name}: ${value}`)
      })
    }

    console.log('')
  }
}

async function main() {
  await checkSalonOrg()

  console.log('='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log('')
  console.log('✅ Checked HERA Salon organization and members')
  console.log('   See details above')
  console.log('')
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
