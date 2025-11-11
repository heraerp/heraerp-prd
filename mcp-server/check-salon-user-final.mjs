/**
 * 🔍 FINAL CHECK: salon@heraerp.com in Platform Org linked to HERA Salon Demo
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'
const HERA_SALON_DEMO_ORG_ID = 'de5f248d-7747-44f3-9d11-a279f3158fa5' // From core_organizations

console.log('🔍 CHECKING: salon@heraerp.com → HERA Salon Demo')
console.log('='.repeat(80))
console.log(`Platform Org: ${PLATFORM_ORG_ID}`)
console.log(`HERA Salon Demo Org: ${HERA_SALON_DEMO_ORG_ID}`)
console.log('')

async function checkSalonUser() {
  // Step 1: Find user with email salon@heraerp.com
  console.log('📝 Step 1: Finding user salon@heraerp.com...')
  console.log('-'.repeat(80))

  const { data: emailFields, error: emailError } = await supabase
    .from('core_dynamic_data')
    .select('entity_id, field_value_text, organization_id')
    .eq('field_name', 'email')
    .eq('field_value_text', 'salon@heraerp.com')

  if (emailError) {
    console.log('❌ Error searching for email:', emailError.message)
    return null
  }

  if (!emailFields || emailFields.length === 0) {
    console.log('❌ User not found with email salon@heraerp.com')
    console.log('')

    // Try searching for similar emails
    const { data: similarEmails } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_value_text')
      .eq('field_name', 'email')
      .ilike('field_value_text', '%salon%')

    if (similarEmails && similarEmails.length > 0) {
      console.log('💡 Found emails with "salon" in them:')
      similarEmails.forEach(item => {
        console.log(`   - ${item.field_value_text} (${item.entity_id})`)
      })
    }
    console.log('')
    return null
  }

  console.log(`✅ Found ${emailFields.length} user(s) with email salon@heraerp.com`)
  emailFields.forEach((item, idx) => {
    console.log(`   ${idx + 1}. Entity ID: ${item.entity_id}`)
    console.log(`      Org ID: ${item.organization_id}`)
  })
  console.log('')

  const userId = emailFields[0].entity_id

  // Step 2: Get user entity details
  console.log('📝 Step 2: Getting user entity details...')
  console.log('-'.repeat(80))

  const { data: userEntity, error: userError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError || !userEntity) {
    console.log('❌ Could not fetch user entity:', userError?.message)
    return null
  }

  console.log('✅ User Entity:')
  console.log(`   ID: ${userEntity.id}`)
  console.log(`   Name: ${userEntity.entity_name}`)
  console.log(`   Type: ${userEntity.entity_type}`)
  console.log(`   Code: ${userEntity.entity_code}`)
  console.log(`   Organization ID: ${userEntity.organization_id}`)
  console.log(`   Created: ${userEntity.created_at}`)

  if (userEntity.organization_id === PLATFORM_ORG_ID) {
    console.log(`   ✅ User IS in Platform Org`)
  } else {
    console.log(`   ⚠️  User is NOT in Platform Org`)
    console.log(`      (In org: ${userEntity.organization_id})`)
  }
  console.log('')

  // Step 3: Check relationship to HERA Salon Demo
  console.log('📝 Step 3: Checking USER_MEMBER_OF_ORG relationship to HERA Salon Demo...')
  console.log('-'.repeat(80))

  const { data: relationships, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('source_entity_id', userId)
    .eq('target_entity_id', HERA_SALON_DEMO_ORG_ID)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')

  if (relError) {
    console.log('❌ Error checking relationship:', relError.message)
    console.log('')
    return { userId, userEntity, relationship: null }
  }

  if (!relationships || relationships.length === 0) {
    console.log('❌ NO RELATIONSHIP FOUND')
    console.log('   User is NOT linked to HERA Salon Demo')
    console.log('')

    // Check all relationships for this user
    const { data: allRels } = await supabase
      .from('core_relationships')
      .select('relationship_type, target_entity_id, is_active, relationship_data')
      .eq('source_entity_id', userId)

    if (allRels && allRels.length > 0) {
      console.log(`📋 User has ${allRels.length} total relationship(s):`)
      for (const rel of allRels) {
        console.log(`   - ${rel.relationship_type} → ${rel.target_entity_id}`)
        console.log(`     Active: ${rel.is_active}`)
        if (rel.relationship_data?.role) {
          console.log(`     Role: ${rel.relationship_data.role}`)
        }
      }
    } else {
      console.log('⚠️  User has NO relationships at all')
    }
    console.log('')

    return { userId, userEntity, relationship: null }
  }

  const relationship = relationships[0]
  console.log('✅ RELATIONSHIP FOUND!')
  console.log(`   Relationship ID: ${relationship.id}`)
  console.log(`   Type: ${relationship.relationship_type}`)
  console.log(`   Source (User): ${relationship.source_entity_id}`)
  console.log(`   Target (Org): ${relationship.target_entity_id}`)
  console.log(`   Active: ${relationship.is_active}`)
  console.log(`   Created: ${relationship.created_at}`)
  console.log(`   Updated: ${relationship.updated_at}`)
  console.log('')

  if (relationship.relationship_data) {
    console.log('📌 Relationship Data:')
    console.log(JSON.stringify(relationship.relationship_data, null, 2))
    console.log('')

    if (relationship.relationship_data.role) {
      console.log(`   ✅ ROLE IS SET: ${relationship.relationship_data.role}`)
    } else {
      console.log(`   ⚠️  ROLE IS NOT SET in relationship_data`)
    }

    if (relationship.relationship_data.is_primary !== undefined) {
      console.log(`   Is Primary Org: ${relationship.relationship_data.is_primary}`)
    }

    if (relationship.relationship_data.last_accessed) {
      console.log(`   Last Accessed: ${relationship.relationship_data.last_accessed}`)
    }
  } else {
    console.log('⚠️  No relationship_data JSON found')
  }
  console.log('')

  return { userId, userEntity, relationship }
}

async function main() {
  const result = await checkSalonUser()

  console.log('='.repeat(80))
  console.log('📊 FINAL SUMMARY')
  console.log('='.repeat(80))
  console.log('')

  if (!result) {
    console.log('❌ FAILED: salon@heraerp.com not found in system')
    console.log('')
    console.log('💡 TO CREATE:')
    console.log('   1. Create user entity in Platform Org (00000000-0000-0000-0000-000000000000)')
    console.log('   2. Add email field via core_dynamic_data: salon@heraerp.com')
    console.log('   3. Create USER_MEMBER_OF_ORG relationship to HERA Salon Demo')
    console.log('   4. Set role in relationship_data: { role: "admin" }')
    console.log('')
    return
  }

  const { userId, userEntity, relationship } = result

  console.log('USER STATUS:')
  console.log(`   ✅ Found: salon@heraerp.com`)
  console.log(`   Entity ID: ${userId}`)
  console.log(`   Name: ${userEntity.entity_name}`)
  console.log(`   In Platform Org: ${userEntity.organization_id === PLATFORM_ORG_ID ? 'YES ✅' : 'NO ❌'}`)
  console.log('')

  console.log('ORGANIZATION LINK:')
  if (relationship) {
    console.log(`   ✅ LINKED to HERA Salon Demo`)
    console.log(`   Active: ${relationship.is_active ? 'YES ✅' : 'NO ❌'}`)
    console.log('')

    console.log('ROLE STATUS:')
    const role = relationship.relationship_data?.role
    if (role) {
      console.log(`   ✅ ROLE IS SET: ${role}`)
    } else {
      console.log(`   ❌ ROLE IS NOT SET`)
      console.log(`      relationship_data: ${JSON.stringify(relationship.relationship_data)}`)
    }
  } else {
    console.log(`   ❌ NOT LINKED to HERA Salon Demo`)
    console.log(`   No USER_MEMBER_OF_ORG relationship found`)
  }

  console.log('')
  console.log('='.repeat(80))
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
