/**
 * Fix Michele's duplicate MEMBER_OF relationships
 * Keep the newer one pointing to the proper ORG entity, deactivate the old one
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

const userId = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function fixMicheleRelationships() {
  console.log('🔧 Fixing Michele duplicate MEMBER_OF relationships...')
  
  try {
    // Get all active MEMBER_OF relationships
    const { data: relationships, error } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
      .order('created_at', { ascending: false }) // Newest first

    if (error) {
      console.error('❌ Database error:', error)
      return false
    }

    console.log(`Found ${relationships.length} active MEMBER_OF relationships`)

    if (relationships.length <= 1) {
      console.log('✅ No duplicates found - Michele is clean!')
      return true
    }

    // Keep the newest one, deactivate the rest
    const toKeep = relationships[0] // Newest
    const toDeactivate = relationships.slice(1) // All others

    console.log(`✅ Keeping newest relationship: ${toKeep.id}`)
    console.log(`   - Points to entity: ${toKeep.to_entity_id}`)
    console.log(`   - Created: ${toKeep.created_at}`)
    console.log(`   - Role: ${toKeep.relationship_data?.role}`)

    console.log(`\n🔄 Will deactivate ${toDeactivate.length} older relationship(s):`)

    // Deactivate the older ones
    for (const rel of toDeactivate) {
      console.log(`\n🔄 Deactivating relationship: ${rel.id}`)
      console.log(`   - Points to entity: ${rel.to_entity_id}`)
      console.log(`   - Created: ${rel.created_at}`)
      
      const { error: updateError } = await supabase
        .from('core_relationships')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString(),
          updated_by: userId // Michele is doing the cleanup
        })
        .eq('id', rel.id)
        .eq('organization_id', orgId) // Safety check

      if (updateError) {
        console.error(`❌ Error deactivating ${rel.id}:`, updateError)
        return false
      }

      console.log(`✅ Deactivated ${rel.id}`)
    }

    // Verify the fix
    console.log('\n🔍 Verifying fix...')
    const { data: verification, error: verifyError } = await supabase
      .from('core_relationships')
      .select('id, to_entity_id, is_active, created_at')
      .eq('from_entity_id', userId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)

    if (verifyError) {
      console.error('❌ Verification error:', verifyError)
      return false
    }

    console.log(`✅ Verification: ${verification.length} active MEMBER_OF relationship remaining`)
    if (verification.length === 1) {
      console.log(`   Relationship ID: ${verification[0].id}`)
      console.log(`   Points to: ${verification[0].to_entity_id}`)
      console.log('🎯 Michele should now be able to authenticate!')
    }

    return true

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return false
  }
}

// Run the fix
fixMicheleRelationships()
  .then(success => {
    if (success) {
      console.log('\n🚀 Fix completed! Try the auth flow again.')
    } else {
      console.log('\n❌ Fix failed. Manual intervention may be needed.')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })