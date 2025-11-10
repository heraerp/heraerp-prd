/**
 * 🔍 CHECK: salon@heraerp.com organization membership and role
 *
 * Verifies:
 * 1. User exists with email salon@heraerp.com
 * 2. HERA Salon organization exists
 * 3. User is linked to HERA Salon via relationships
 * 4. User's role is properly set
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 CHECKING: salon@heraerp.com Organization Membership')
console.log('='.repeat(80))
console.log('')

async function checkUserOrgLink() {
  // Step 1: Find user by email in dynamic data
  console.log('📝 Step 1: Finding user with email salon@heraerp.com...')
  console.log('-'.repeat(80))

  const { data: emailData, error: emailError } = await supabase
    .from('core_dynamic_data')
    .select('entity_id, field_value_text')
    .eq('field_name', 'email')
    .eq('field_value_text', 'salon@heraerp.com')

  if (emailError) {
    console.log('❌ Error searching for email:', emailError.message)
    console.log('')
    return null
  }

  if (!emailData || emailData.length === 0) {
    console.log('❌ User not found with email salon@heraerp.com')
    console.log('')
    return null
  }

  if (emailData.length > 1) {
    console.log(`⚠️  Found ${emailData.length} users with email salon@heraerp.com`)
    console.log('   Using first result...')
    emailData.forEach((item, idx) => {
      console.log(`   ${idx + 1}. Entity ID: ${item.entity_id}`)
    })
    console.log('')
  }

  const userId = emailData[0].entity_id
  console.log('✅ Found user entity ID:', userId)
  console.log('')

  // Step 2: Get user entity details
  console.log('📝 Step 2: Getting user entity details...')
  console.log('-'.repeat(80))

  const { data: userEntity, error: userError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, entity_code, organization_id, created_at')
    .eq('id', userId)
    .single()

  if (userError || !userEntity) {
    console.log('❌ Could not fetch user entity')
    console.log('   Error:', userError?.message || 'No data')
    console.log('')
    return null
  }

  console.log('✅ User Entity:')
  console.log('   Name:', userEntity.entity_name)
  console.log('   Type:', userEntity.entity_type)
  console.log('   Code:', userEntity.entity_code)
  console.log('   Organization ID:', userEntity.organization_id)
  console.log('   Created:', userEntity.created_at)
  console.log('')

  // Step 3: Get all dynamic data for this user
  console.log('📝 Step 3: Getting user dynamic data (email, role, etc.)...')
  console.log('-'.repeat(80))

  const { data: dynamicData, error: dynamicError } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_text, field_value_json, organization_id')
    .eq('entity_id', userId)

  if (dynamicError) {
    console.log('❌ Error fetching dynamic data:', dynamicError.message)
  } else if (dynamicData && dynamicData.length > 0) {
    console.log('✅ Dynamic Data Fields:')
    dynamicData.forEach(field => {
      const value = field.field_value_text || JSON.stringify(field.field_value_json)
      console.log(`   ${field.field_name}: ${value}`)
      console.log(`      (org: ${field.organization_id})`)
    })
  } else {
    console.log('⚠️  No dynamic data found for user')
  }
  console.log('')

  // Step 4: Find HERA Salon organization
  console.log('📝 Step 4: Finding HERA Salon organization...')
  console.log('-'.repeat(80))

  const { data: salonOrg, error: salonError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type')
    .eq('entity_type', 'ORG')
    .ilike('entity_name', '%HERA%Salon%')
    .single()

  if (salonError || !salonOrg) {
    console.log('⚠️  HERA Salon org not found, trying alternative search...')

    // Try broader search
    const { data: orgs, error: orgsError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type')
      .eq('entity_type', 'ORG')

    if (orgsError) {
      console.log('❌ Error searching orgs:', orgsError.message)
      return { userId, userEntity, dynamicData, salonOrgId: null }
    }

    console.log('📋 Available Organizations:')
    orgs?.forEach(org => {
      console.log(`   - ${org.entity_name} (${org.id})`)
    })
    console.log('')
    return { userId, userEntity, dynamicData, salonOrgId: null }
  }

  const salonOrgId = salonOrg.id
  console.log('✅ Found HERA Salon Organization:')
  console.log('   Name:', salonOrg.entity_name)
  console.log('   ID:', salonOrgId)
  console.log('')

  // Step 5: Check relationship between user and HERA Salon
  console.log('📝 Step 5: Checking USER_MEMBER_OF_ORG relationship...')
  console.log('-'.repeat(80))

  const { data: relationships, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('source_entity_id', userId)
    .eq('target_entity_id', salonOrgId)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .eq('is_active', true)

  if (relError) {
    console.log('❌ Error checking relationship:', relError.message)
    console.log('')
    return { userId, userEntity, dynamicData, salonOrgId, relationship: null }
  }

  if (!relationships || relationships.length === 0) {
    console.log('❌ NO RELATIONSHIP FOUND')
    console.log('   User is NOT linked to HERA Salon organization')
    console.log('')

    // Check if user has ANY org relationships
    const { data: allRels } = await supabase
      .from('core_relationships')
      .select('relationship_type, target_entity_id, is_active')
      .eq('source_entity_id', userId)

    if (allRels && allRels.length > 0) {
      console.log('📋 User has these relationships:')
      allRels.forEach(rel => {
        console.log(`   - ${rel.relationship_type} → ${rel.target_entity_id} (active: ${rel.is_active})`)
      })
    } else {
      console.log('⚠️  User has NO relationships at all')
    }
    console.log('')

    return { userId, userEntity, dynamicData, salonOrgId, relationship: null }
  }

  const relationship = relationships[0]
  console.log('✅ RELATIONSHIP FOUND!')
  console.log('   Relationship ID:', relationship.id)
  console.log('   Type:', relationship.relationship_type)
  console.log('   Active:', relationship.is_active)
  console.log('   Created:', relationship.created_at)
  console.log('   Updated:', relationship.updated_at)

  if (relationship.relationship_data) {
    console.log('   Relationship Data:')
    console.log('   ', JSON.stringify(relationship.relationship_data, null, 2))

    const role = relationship.relationship_data.role
    const isPrimary = relationship.relationship_data.is_primary
    const lastAccessed = relationship.relationship_data.last_accessed

    if (role) {
      console.log('')
      console.log('   📌 Role:', role)
    }
    if (isPrimary !== undefined) {
      console.log('   📌 Is Primary Org:', isPrimary)
    }
    if (lastAccessed) {
      console.log('   📌 Last Accessed:', lastAccessed)
    }
  } else {
    console.log('   ⚠️  No relationship_data JSON found')
  }
  console.log('')

  return { userId, userEntity, dynamicData, salonOrgId, relationship }
}

async function main() {
  const result = await checkUserOrgLink()

  console.log('='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log('')

  if (!result) {
    console.log('❌ User salon@heraerp.com not found in system')
    return
  }

  const { userId, userEntity, dynamicData, salonOrgId, relationship } = result

  console.log('✅ User Found: salon@heraerp.com')
  console.log('   Entity ID:', userId)
  console.log('   Name:', userEntity?.entity_name)
  console.log('')

  if (salonOrgId) {
    console.log('✅ HERA Salon Org Found:', salonOrgId)
  } else {
    console.log('❌ HERA Salon Org NOT Found')
  }
  console.log('')

  if (relationship) {
    console.log('✅ USER IS LINKED to HERA Salon')
    const role = relationship.relationship_data?.role
    if (role) {
      console.log('✅ Role is SET:', role)
    } else {
      console.log('⚠️  Role is NOT set in relationship_data')
    }

    const isPrimary = relationship.relationship_data?.is_primary
    if (isPrimary !== undefined) {
      console.log('   Primary Org:', isPrimary ? 'YES' : 'NO')
    }
  } else {
    console.log('❌ USER IS NOT LINKED to HERA Salon')
    console.log('   No USER_MEMBER_OF_ORG relationship found')
  }

  console.log('')
  console.log('🔍 Dynamic Data Fields Found:', dynamicData?.length || 0)
  if (dynamicData && dynamicData.length > 0) {
    const roleField = dynamicData.find(f => f.field_name === 'role' || f.field_name === 'business_role')
    if (roleField) {
      console.log('   ✅ Role in dynamic data:', roleField.field_value_text || roleField.field_value_json)
    }
  }

  console.log('')
  console.log('='.repeat(80))
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
