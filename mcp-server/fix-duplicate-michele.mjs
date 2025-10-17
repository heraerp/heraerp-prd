/**
 * Fix duplicate user entities for Michele
 * This resolves the "JSON object requested, multiple (or no) rows returned" error
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

async function fixDuplicateMichele() {
  const userId = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  
  console.log('🔍 Checking for duplicate Michele entities...')
  
  try {
    // Find all user entities for Michele
    const { data: userEntities, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('smart_code', 'HERA.AUTH.USER.ENTITY.V1')
      .eq('entity_name', userId)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Database error:', error)
      return false
    }
    
    console.log(`📊 Found ${userEntities.length} user entities for Michele`)
    
    if (userEntities.length <= 1) {
      console.log('✅ No duplicates found - Michele is clean!')
      return true
    }
    
    // Keep the newest one, delete the rest
    const toKeep = userEntities[0] // Newest due to ORDER BY created_at DESC
    const toDelete = userEntities.slice(1)
    
    console.log(`✅ Keeping newest entity: ${toKeep.id} (created: ${toKeep.created_at})`)
    console.log(`🗑️ Will delete ${toDelete.length} duplicate(s):`)
    
    // Show what we're deleting
    for (const entity of toDelete) {
      console.log(`   - ${entity.id} (created: ${entity.created_at})`)
    }
    
    // Delete the duplicates
    for (const entity of toDelete) {
      console.log(`🗑️ Deleting duplicate entity: ${entity.id}`)
      
      const { error: deleteError } = await supabase
        .from('core_entities')
        .delete()
        .eq('id', entity.id)
        .eq('organization_id', orgId) // Safety check
      
      if (deleteError) {
        console.error(`❌ Error deleting ${entity.id}:`, deleteError)
        return false
      }
      
      console.log(`✅ Deleted ${entity.id}`)
    }
    
    console.log('🎉 Michele duplicates cleaned up successfully!')
    
    // Verify the fix
    const { data: verification, error: verifyError } = await supabase
      .from('core_entities')
      .select('id, created_at')
      .eq('smart_code', 'HERA.AUTH.USER.ENTITY.V1')
      .eq('entity_name', userId)
      .eq('organization_id', orgId)
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError)
      return false
    }
    
    console.log(`✅ Verification: ${verification.length} user entity remaining`)
    if (verification.length === 1) {
      console.log(`   Entity ID: ${verification[0].id}`)
      console.log('🎯 Michele should now be able to authenticate!')
    }
    
    return true
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return false
  }
}

// Run the fix
fixDuplicateMichele()
  .then(success => {
    if (success) {
      console.log('\n🚀 Fix completed! Try logging in as Michele now.')
    } else {
      console.log('\n❌ Fix failed. Try creating a new test user instead.')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })