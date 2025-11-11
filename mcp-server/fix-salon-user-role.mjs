/**
 * 🔧 FIX: Add role to salon@heraerp.com relationship_data
 *
 * Current Status:
 * - User: salon@heraerp.com (Auth UID: ebd0e099-e25a-476b-b6dc-4b3c26fae4a7)
 * - Entity ID: 1ac56047-78c9-4c2c-93db-84dcf307ab91
 * - Linked to: HERA Salon Demo (7f1d5200-2106-4f94-8095-8a04bc114623)
 * - Missing: Role in relationship_data
 *
 * Solution: Direct UPDATE of relationship_data JSONB field
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const USER_ENTITY_ID = '1ac56047-78c9-4c2c-93db-84dcf307ab91'
const HERA_SALON_DEMO_ORG_ID = '7f1d5200-2106-4f94-8095-8a04bc114623'

console.log('🔧 FIXING: salon@heraerp.com Role')
console.log('='.repeat(80))
console.log('')

async function fixSalonUserRole() {
  // Step 1: Verify current state
  console.log('📝 Step 1: Verifying current relationship...')
  console.log('-'.repeat(80))

  const { data: currentRel, error: fetchError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', USER_ENTITY_ID)
    .eq('to_entity_id', HERA_SALON_DEMO_ORG_ID)
    .eq('relationship_type', 'MEMBER_OF')
    .single()

  if (fetchError) {
    console.log('❌ Error fetching relationship:', fetchError.message)
    return false
  }

  if (!currentRel) {
    console.log('❌ No relationship found')
    return false
  }

  console.log('✅ Found relationship:')
  console.log(`   ID: ${currentRel.id}`)
  console.log(`   From: ${currentRel.from_entity_id}`)
  console.log(`   To: ${currentRel.to_entity_id}`)
  console.log(`   Active: ${currentRel.is_active}`)
  console.log(`   Current relationship_data: ${JSON.stringify(currentRel.relationship_data)}`)
  console.log('')

  // Step 2: Prepare new relationship_data
  console.log('📝 Step 2: Preparing new relationship_data...')
  console.log('-'.repeat(80))

  const newRelationshipData = {
    role: 'admin',
    is_primary: true,
    joined_at: currentRel.created_at,
    updated_at: new Date().toISOString()
  }

  console.log('✅ New relationship_data:')
  console.log(JSON.stringify(newRelationshipData, null, 2))
  console.log('')

  // Step 3: Update relationship_data
  console.log('📝 Step 3: Updating relationship_data...')
  console.log('-'.repeat(80))

  const { data: updateResult, error: updateError } = await supabase
    .from('core_relationships')
    .update({
      relationship_data: newRelationshipData
    })
    .eq('id', currentRel.id)
    .select()

  if (updateError) {
    console.log('❌ Error updating:', updateError.message)
    return false
  }

  console.log('✅ Update successful!')
  console.log('')

  // Step 4: Verify the update
  console.log('📝 Step 4: Verifying update...')
  console.log('-'.repeat(80))

  const { data: verifyRel, error: verifyError } = await supabase
    .from('core_relationships')
    .select('relationship_data')
    .eq('id', currentRel.id)
    .single()

  if (verifyError) {
    console.log('❌ Error verifying:', verifyError.message)
    return false
  }

  console.log('✅ Verified relationship_data:')
  console.log(JSON.stringify(verifyRel.relationship_data, null, 2))
  console.log('')

  // Check if role was set
  if (verifyRel.relationship_data?.role === 'admin') {
    console.log('✅ ROLE SUCCESSFULLY SET: admin')
    return true
  } else {
    console.log('⚠️  Role not found in relationship_data')
    return false
  }
}

async function main() {
  const success = await fixSalonUserRole()

  console.log('='.repeat(80))
  console.log('📊 FINAL RESULT')
  console.log('='.repeat(80))
  console.log('')

  if (success) {
    console.log('🎉 SUCCESS!')
    console.log('')
    console.log('✅ salon@heraerp.com is now properly configured:')
    console.log(`   - User Entity: ${USER_ENTITY_ID}`)
    console.log(`   - Organization: HERA Salon Demo`)
    console.log(`   - Org ID: ${HERA_SALON_DEMO_ORG_ID}`)
    console.log(`   - Role: admin`)
    console.log(`   - Is Primary: true`)
    console.log('')
    console.log('User can now:')
    console.log('   - Log in to HERA Salon Demo')
    console.log('   - Access with admin privileges')
    console.log('   - Have HERA Salon Demo as primary organization')
  } else {
    console.log('❌ FAILED')
    console.log('   Could not set role in relationship_data')
    console.log('   Please check error messages above')
  }

  console.log('')
  console.log('='.repeat(80))
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
