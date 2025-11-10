/**
 * 🔍 CHECK: Default organization from .env
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const DEFAULT_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID

console.log('🔍 CHECKING: Default Organization')
console.log('='.repeat(80))
console.log(`DEFAULT_ORGANIZATION_ID: ${DEFAULT_ORG_ID}`)
console.log('')

async function checkDefaultOrg() {
  if (!DEFAULT_ORG_ID) {
    console.log('❌ DEFAULT_ORGANIZATION_ID not set in .env')
    return
  }

  // Check if this org exists
  const { data: org, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', DEFAULT_ORG_ID)
    .eq('entity_type', 'ORG')
    .single()

  if (error) {
    console.log('❌ Organization not found:', error.message)
    console.log('')
    console.log('📋 Available organizations:')

    const { data: allOrgs } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type')
      .eq('entity_type', 'ORG')

    allOrgs?.forEach((o, idx) => {
      console.log(`   ${idx + 1}. ${o.entity_name}`)
      console.log(`      ID: ${o.id}`)
    })
    console.log('')
    return
  }

  console.log('✅ Found Organization:')
  console.log(`   ID: ${org.id}`)
  console.log(`   Name: ${org.entity_name}`)
  console.log(`   Type: ${org.entity_type}`)
  console.log(`   Code: ${org.entity_code || 'N/A'}`)
  console.log(`   Created: ${org.created_at}`)
  console.log('')

  // Find members
  console.log('📝 Finding members of this organization...')
  console.log('-'.repeat(80))

  const { data: relationships, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('target_entity_id', DEFAULT_ORG_ID)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')

  if (relError) {
    console.log('❌ Error:', relError.message)
    return
  }

  if (!relationships || relationships.length === 0) {
    console.log('⚠️  No members found')
    console.log('')
    return
  }

  console.log(`✅ Found ${relationships.length} member(s):`)
  console.log('')

  for (const rel of relationships) {
    const userId = rel.source_entity_id

    // Get user details
    const { data: user } = await supabase
      .from('core_entities')
      .select('entity_name, entity_code')
      .eq('id', userId)
      .single()

    // Get email
    const { data: emailField } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('entity_id', userId)
      .eq('field_name', 'email')
      .maybeSingle()

    console.log(`👤 ${user?.entity_name || 'Unknown User'}`)
    console.log(`   ID: ${userId}`)
    console.log(`   Email: ${emailField?.field_value_text || 'Not set'}`)
    console.log(`   Active: ${rel.is_active}`)

    if (rel.relationship_data) {
      if (rel.relationship_data.role) {
        console.log(`   📌 Role: ${rel.relationship_data.role}`)
      } else {
        console.log(`   ⚠️  Role: Not set`)
      }
    } else {
      console.log(`   ⚠️  No relationship_data`)
    }
    console.log('')
  }
}

checkDefaultOrg().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
