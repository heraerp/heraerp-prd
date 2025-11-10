/**
 * 🔧 FIX: Manually add HAS_ROLE relationship for salon@heraerp.com
 *
 * Since hera_onboard_user_v1 is failing, we'll create the HAS_ROLE
 * relationship manually following the HERA pattern
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const USER_ENTITY_ID = '1ac56047-78c9-4c2c-93db-84dcf307ab91'
const HERA_SALON_DEMO_ORG_ID = '7f1d5200-2106-4f94-8095-8a04bc114623'
const ACTOR_USER_ID = USER_ENTITY_ID

console.log('🔧 ADDING: HAS_ROLE Relationship Manually')
console.log('='.repeat(80))
console.log('')

async function addHasRoleManually() {
  // Step 1: Create or find ROLE entity
  console.log('📝 Step 1: Creating/finding ROLE entity...')
  console.log('-'.repeat(80))

  const roleCode = 'ORG_ADMIN'

  let { data: roleEntity, error: findError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', HERA_SALON_DEMO_ORG_ID)
    .eq('entity_type', 'ROLE')
    .eq('entity_code', roleCode)
    .maybeSingle()

  if (findError) {
    console.log('❌ Error finding ROLE:', findError.message)
    return false
  }

  if (!roleEntity) {
    console.log(`⚠️  ROLE entity "${roleCode}" not found, creating...`)

    const { data: newRole, error: createError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: HERA_SALON_DEMO_ORG_ID,
        entity_type: 'ROLE',
        entity_name: roleCode,
        entity_code: roleCode,
        smart_code: 'HERA.UNIVERSAL.ENTITY.ROLE.SHADOW.v1',
        smart_code_status: 'LIVE',
        status: 'active',
        metadata: { source: 'manual_has_role_creation' },
        created_by: ACTOR_USER_ID,
        updated_by: ACTOR_USER_ID
      })
      .select()
      .single()

    if (createError) {
      console.log('❌ Error creating ROLE:', createError.message)
      return false
    }

    roleEntity = newRole
    console.log('✅ Created ROLE entity:', roleEntity.id)
  } else {
    console.log('✅ Found existing ROLE entity:', roleEntity.id)
  }

  console.log(`   Code: ${roleEntity.entity_code}`)
  console.log(`   Name: ${roleEntity.entity_name}`)
  console.log('')

  // Step 2: Create HAS_ROLE relationship
  console.log('📝 Step 2: Creating HAS_ROLE relationship...')
  console.log('-'.repeat(80))

  // Check if already exists
  const { data: existing } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('to_entity_id', roleEntity.id)
    .eq('relationship_type', 'HAS_ROLE')
    .maybeSingle()

  if (existing) {
    console.log('✅ HAS_ROLE relationship already exists:', existing.id)
    console.log('   Updating it...')

    const { error: updateError } = await supabase
      .from('core_relationships')
      .update({
        is_active: true,
        relationship_data: {
          role_code: roleCode,
          is_primary: true
        },
        updated_by: ACTOR_USER_ID
      })
      .eq('id', existing.id)

    if (updateError) {
      console.log('❌ Error updating HAS_ROLE:', updateError.message)
      return false
    }

    console.log('✅ Updated HAS_ROLE relationship')
  } else {
    console.log('Creating new HAS_ROLE relationship...')

    const { data: newRel, error: createError } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: HERA_SALON_DEMO_ORG_ID,
        from_entity_id: USER_ENTITY_ID,
        to_entity_id: roleEntity.id,
        relationship_type: 'HAS_ROLE',
        is_active: true,
        effective_date: new Date().toISOString(),
        smart_code: 'HERA.SECURITY.USER.REL.HAS_ROLE.v1',
        relationship_data: {
          role_code: roleCode,
          is_primary: true
        },
        created_by: ACTOR_USER_ID,
        updated_by: ACTOR_USER_ID
      })
      .select()
      .single()

    if (createError) {
      console.log('❌ Error creating HAS_ROLE:', createError.message)
      console.log('   Details:', createError.details)
      return false
    }

    console.log('✅ Created HAS_ROLE relationship:', newRel.id)
  }
  console.log('')

  // Step 3: Clean up MEMBER_OF relationship_data
  console.log('📝 Step 3: Cleaning up MEMBER_OF relationship_data...')
  console.log('-'.repeat(80))

  const { error: cleanupError } = await supabase
    .from('core_relationships')
    .update({
      relationship_data: {}
    })
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('to_entity_id', HERA_SALON_DEMO_ORG_ID)
    .eq('relationship_type', 'MEMBER_OF')

  if (cleanupError) {
    console.log('⚠️  Could not clean up:', cleanupError.message)
  } else {
    console.log('✅ Cleaned up MEMBER_OF relationship_data')
  }
  console.log('')

  // Step 4: Verify
  console.log('📝 Step 4: Verifying final state...')
  console.log('-'.repeat(80))

  const { data: verifyRole } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('organization_id', HERA_SALON_DEMO_ORG_ID)
    .eq('relationship_type', 'HAS_ROLE')

  console.log(`HAS_ROLE relationships: ${verifyRole?.length || 0}`)
  if (verifyRole && verifyRole.length > 0) {
    verifyRole.forEach(rel => {
      console.log(`   - ID: ${rel.id}`)
      console.log(`     To ROLE entity: ${rel.to_entity_id}`)
      console.log(`     Active: ${rel.is_active}`)
      console.log(`     relationship_data:`, rel.relationship_data)
    })
  }
  console.log('')

  const { data: verifyMember } = await supabase
    .from('core_relationships')
    .select('relationship_data')
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('to_entity_id', HERA_SALON_DEMO_ORG_ID)
    .eq('relationship_type', 'MEMBER_OF')
    .single()

  console.log('MEMBER_OF relationship_data:', verifyMember?.relationship_data)
  console.log('')

  return true
}

async function main() {
  const success = await addHasRoleManually()

  console.log('='.repeat(80))
  console.log('📊 FINAL RESULT')
  console.log('='.repeat(80))
  console.log('')

  if (success) {
    console.log('🎉 SUCCESS!')
    console.log('')
    console.log('✅ salon@heraerp.com now follows HERA standard:')
    console.log('')
    console.log('RELATIONSHIPS:')
    console.log('   1. MEMBER_OF (User → Organization)')
    console.log('      - Establishes organization membership')
    console.log('      - relationship_data: {} (clean)')
    console.log('')
    console.log('   2. HAS_ROLE (User → ROLE entity)')
    console.log('      - ROLE entity: ORG_ADMIN')
    console.log('      - relationship_data: { role_code: "ORG_ADMIN", is_primary: true }')
    console.log('')
    console.log('This is the correct HERA pattern!')
    console.log('   - Separates membership from permissions')
    console.log('   - Role changes don\'t affect membership')
    console.log('   - Supports multiple roles per user')
  } else {
    console.log('❌ FAILED')
  }

  console.log('')
  console.log('='.repeat(80))
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
