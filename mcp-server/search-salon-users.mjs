/**
 * 🔍 SEARCH: Find all users with "salon" in their email
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 SEARCHING: Users with "salon" in email')
console.log('='.repeat(80))
console.log('')

async function searchSalonUsers() {
  // Search for emails containing "salon"
  const { data: emailFields, error } = await supabase
    .from('core_dynamic_data')
    .select('entity_id, field_value_text, organization_id')
    .eq('field_name', 'email')
    .ilike('field_value_text', '%salon%')

  if (error) {
    console.log('❌ Error searching:', error.message)
    return
  }

  if (!emailFields || emailFields.length === 0) {
    console.log('⚠️  No users found with "salon" in email')
    console.log('')
    console.log('Let me search for ALL users with email field...')

    const { data: allEmails } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_value_text, organization_id')
      .eq('field_name', 'email')
      .limit(10)

    if (allEmails && allEmails.length > 0) {
      console.log(`\n📋 Found ${allEmails.length} users (showing first 10):`)
      for (const item of allEmails) {
        console.log(`   - ${item.field_value_text}`)
        console.log(`     Entity ID: ${item.entity_id}`)
        console.log(`     Org ID: ${item.organization_id}`)
        console.log('')
      }
    }
    return
  }

  console.log(`✅ Found ${emailFields.length} user(s) with "salon" in email:`)
  console.log('')

  for (const emailField of emailFields) {
    console.log(`📧 Email: ${emailField.field_value_text}`)
    console.log(`   Entity ID: ${emailField.entity_id}`)
    console.log(`   Org ID: ${emailField.organization_id}`)

    // Get user entity details
    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('entity_name, entity_type, entity_code')
      .eq('id', emailField.entity_id)
      .single()

    if (userEntity) {
      console.log(`   Name: ${userEntity.entity_name}`)
      console.log(`   Type: ${userEntity.entity_type}`)
      console.log(`   Code: ${userEntity.entity_code}`)
    }

    // Check for relationships
    const { data: relationships } = await supabase
      .from('core_relationships')
      .select('relationship_type, target_entity_id, relationship_data, is_active')
      .eq('source_entity_id', emailField.entity_id)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')

    if (relationships && relationships.length > 0) {
      console.log(`   Memberships: ${relationships.length}`)
      for (const rel of relationships) {
        console.log(`     - Target Org: ${rel.target_entity_id}`)
        console.log(`       Active: ${rel.is_active}`)
        if (rel.relationship_data?.role) {
          console.log(`       Role: ${rel.relationship_data.role}`)
        }
      }
    } else {
      console.log(`   ⚠️  No organization memberships`)
    }

    console.log('')
  }
}

searchSalonUsers().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
