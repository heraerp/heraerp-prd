/**
 * 🔍 CHECK: All USER entities in Platform Organization
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

console.log('🔍 CHECKING: All USER Entities in Platform Organization')
console.log('='.repeat(80))
console.log(`Platform Org ID: ${PLATFORM_ORG_ID}`)
console.log('')

async function checkPlatformUsers() {
  // Get all USER entities in platform org
  console.log('📝 Fetching all USER entities in Platform Org...')
  console.log('-'.repeat(80))

  const { data: users, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', PLATFORM_ORG_ID)
    .eq('entity_type', 'USER')
    .order('created_at', { ascending: false })

  if (error) {
    console.log('❌ Error fetching users:', error.message)
    return
  }

  if (!users || users.length === 0) {
    console.log('⚠️  No USER entities found in Platform Org')
    console.log('')
    return
  }

  console.log(`✅ Found ${users.length} USER entities in Platform Org`)
  console.log('')

  // Process each user
  for (let i = 0; i < users.length; i++) {
    const user = users[i]

    console.log(`👤 USER #${i + 1}:`)
    console.log(`   Entity ID: ${user.id}`)
    console.log(`   Name: ${user.entity_name}`)
    console.log(`   Code: ${user.entity_code || 'N/A'}`)
    console.log(`   Created: ${user.created_at}`)
    console.log(`   Updated: ${user.updated_at}`)

    // Get email from dynamic data
    const { data: emailField } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text, organization_id')
      .eq('entity_id', user.id)
      .eq('field_name', 'email')
      .maybeSingle()

    if (emailField) {
      console.log(`   📧 Email: ${emailField.field_value_text}`)
      console.log(`      (Email org: ${emailField.organization_id})`)
    } else {
      console.log(`   📧 Email: Not set`)
    }

    // Get all dynamic data for this user in platform org
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json, organization_id')
      .eq('entity_id', user.id)
      .eq('organization_id', PLATFORM_ORG_ID)

    if (dynamicData && dynamicData.length > 0) {
      console.log(`   Dynamic Data (Platform Org): ${dynamicData.length} fields`)
      dynamicData.forEach(field => {
        const value = field.field_value_text || JSON.stringify(field.field_value_json)
        if (field.field_name !== 'email') { // Already shown above
          console.log(`      - ${field.field_name}: ${value}`)
        }
      })
    }

    // Get organization memberships
    const { data: memberships } = await supabase
      .from('core_relationships')
      .select('target_entity_id, relationship_type, is_active, relationship_data, created_at')
      .eq('source_entity_id', user.id)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')

    if (memberships && memberships.length > 0) {
      console.log(`   🏢 Organization Memberships: ${memberships.length}`)

      for (const membership of memberships) {
        // Get org name
        const { data: org } = await supabase
          .from('core_organizations')
          .select('name')
          .eq('id', membership.target_entity_id)
          .maybeSingle()

        const orgName = org?.name || 'Unknown Org'

        console.log(`      - ${orgName}`)
        console.log(`        Org ID: ${membership.target_entity_id}`)
        console.log(`        Active: ${membership.is_active}`)
        console.log(`        Created: ${membership.created_at}`)

        if (membership.relationship_data) {
          if (membership.relationship_data.role) {
            console.log(`        📌 Role: ${membership.relationship_data.role}`)
          } else {
            console.log(`        ⚠️  Role: Not set`)
          }

          if (membership.relationship_data.is_primary !== undefined) {
            console.log(`        Primary: ${membership.relationship_data.is_primary}`)
          }

          if (membership.relationship_data.last_accessed) {
            console.log(`        Last Accessed: ${membership.relationship_data.last_accessed}`)
          }
        } else {
          console.log(`        ⚠️  No relationship_data`)
        }
      }
    } else {
      console.log(`   🏢 Organization Memberships: 0`)
      console.log(`      ⚠️  User has no organization memberships`)
    }

    console.log('')
  }

  // Summary statistics
  console.log('='.repeat(80))
  console.log('📊 SUMMARY STATISTICS')
  console.log('='.repeat(80))
  console.log('')

  // Count users with emails
  let usersWithEmail = 0
  let usersWithMemberships = 0
  let usersWithRoles = 0

  for (const user of users) {
    const { data: emailField } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('entity_id', user.id)
      .eq('field_name', 'email')
      .maybeSingle()

    if (emailField) usersWithEmail++

    const { data: memberships } = await supabase
      .from('core_relationships')
      .select('relationship_data')
      .eq('source_entity_id', user.id)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')

    if (memberships && memberships.length > 0) {
      usersWithMemberships++

      const hasRole = memberships.some(m => m.relationship_data?.role)
      if (hasRole) usersWithRoles++
    }
  }

  console.log(`Total Users: ${users.length}`)
  console.log(`Users with Email: ${usersWithEmail}`)
  console.log(`Users with Org Memberships: ${usersWithMemberships}`)
  console.log(`Users with Roles Set: ${usersWithRoles}`)
  console.log('')

  console.log('='.repeat(80))
}

checkPlatformUsers().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
