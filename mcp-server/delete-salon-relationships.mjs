/**
 * 🗑️ DELETE: Remove all relationships for salon@heraerp.com to clean up confusion
 *
 * Will delete:
 * - MEMBER_OF relationships
 * - HAS_ROLE relationships
 * - ROLE entities we created
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const USER_ENTITY_ID = '1ac56047-78c9-4c2c-93db-84dcf307ab91'

console.log('🗑️  DELETING: All relationships for salon@heraerp.com')
console.log('='.repeat(80))
console.log(`User Entity ID: ${USER_ENTITY_ID}`)
console.log('')

async function deleteAllRelationships() {
  // Step 1: Find all relationships for this user
  console.log('📝 Step 1: Finding all relationships...')
  console.log('-'.repeat(80))

  const { data: allRels, error: findError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', USER_ENTITY_ID)

  if (findError) {
    console.log('❌ Error finding relationships:', findError.message)
    return false
  }

  if (!allRels || allRels.length === 0) {
    console.log('⚠️  No relationships found')
    return true
  }

  console.log(`✅ Found ${allRels.length} relationship(s):`)
  allRels.forEach((rel, idx) => {
    console.log(`   ${idx + 1}. ${rel.relationship_type}`)
    console.log(`      ID: ${rel.id}`)
    console.log(`      To: ${rel.to_entity_id}`)
    console.log(`      Org: ${rel.organization_id}`)
  })
  console.log('')

  // Step 2: Collect ROLE entity IDs to delete
  console.log('📝 Step 2: Identifying ROLE entities to delete...')
  console.log('-'.repeat(80))

  const roleEntityIds = allRels
    .filter(rel => rel.relationship_type === 'HAS_ROLE')
    .map(rel => rel.to_entity_id)

  console.log(`Found ${roleEntityIds.length} ROLE entity(s) to check:`)
  roleEntityIds.forEach((id, idx) => {
    console.log(`   ${idx + 1}. ${id}`)
  })
  console.log('')

  // Step 3: Delete all relationships
  console.log('📝 Step 3: Deleting relationships...')
  console.log('-'.repeat(80))

  const { error: deleteRelError } = await supabase
    .from('core_relationships')
    .delete()
    .eq('from_entity_id', USER_ENTITY_ID)

  if (deleteRelError) {
    console.log('❌ Error deleting relationships:', deleteRelError.message)
    return false
  }

  console.log(`✅ Deleted ${allRels.length} relationship(s)`)
  console.log('')

  // Step 4: Delete ROLE entities we created
  console.log('📝 Step 4: Deleting ROLE entities...')
  console.log('-'.repeat(80))

  if (roleEntityIds.length > 0) {
    for (const roleId of roleEntityIds) {
      // Check if this ROLE entity has any other relationships
      const { data: otherRels } = await supabase
        .from('core_relationships')
        .select('id')
        .or(`from_entity_id.eq.${roleId},to_entity_id.eq.${roleId}`)

      if (otherRels && otherRels.length > 0) {
        console.log(`   ⚠️  ROLE ${roleId} has ${otherRels.length} other relationship(s), keeping it`)
        continue
      }

      // Safe to delete
      const { error: deleteRoleError } = await supabase
        .from('core_entities')
        .delete()
        .eq('id', roleId)
        .eq('entity_type', 'ROLE')

      if (deleteRoleError) {
        console.log(`   ⚠️  Could not delete ROLE ${roleId}:`, deleteRoleError.message)
      } else {
        console.log(`   ✅ Deleted ROLE entity: ${roleId}`)
      }
    }
  } else {
    console.log('   ℹ️  No ROLE entities to delete')
  }
  console.log('')

  // Step 5: Verify deletion
  console.log('📝 Step 5: Verifying deletion...')
  console.log('-'.repeat(80))

  const { data: verifyRels } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', USER_ENTITY_ID)

  if (!verifyRels || verifyRels.length === 0) {
    console.log('✅ All relationships deleted successfully')
  } else {
    console.log(`⚠️  Still found ${verifyRels.length} relationship(s):`)
    verifyRels.forEach(rel => {
      console.log(`   - ${rel.relationship_type} (${rel.id})`)
    })
  }
  console.log('')

  return true
}

async function main() {
  const success = await deleteAllRelationships()

  console.log('='.repeat(80))
  console.log('📊 FINAL RESULT')
  console.log('='.repeat(80))
  console.log('')

  if (success) {
    console.log('🎉 SUCCESS!')
    console.log('')
    console.log('✅ Deleted all relationships for salon@heraerp.com')
    console.log('')
    console.log('Current state:')
    console.log('   ✅ Supabase Auth user: EXISTS (unchanged)')
    console.log('   ✅ USER entity: EXISTS (unchanged)')
    console.log('   ❌ MEMBER_OF relationship: DELETED')
    console.log('   ❌ HAS_ROLE relationships: DELETED')
    console.log('   ❌ ROLE entities: DELETED (if not used elsewhere)')
    console.log('')
    console.log('User is now in clean state, ready for proper onboarding')
  } else {
    console.log('❌ FAILED')
    console.log('   Could not delete all relationships')
  }

  console.log('')
  console.log('='.repeat(80))
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
