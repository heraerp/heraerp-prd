/**
 * Fix production user's MEMBER_OF relationships
 * Production user: 09b0b92a-d797-489e-bc03-5ca0a6272674 (michele@hairtalkz.com)
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

const productionUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674' // michele@hairtalkz.com
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const correctOrgEntity = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // ORG entity
const wrongOrgEntity = 'c0771739-ddb6-47fb-ae82-d34febedf098'   // ORGANIZATION entity

async function fixProductionUserRelationships() {
  console.log('🔧 Fixing PRODUCTION user relationships...')
  console.log(`Production User: ${productionUserId} (michele@hairtalkz.com)`)
  console.log(`Correct target (ORG): ${correctOrgEntity}`)
  console.log(`Wrong target (ORGANIZATION): ${wrongOrgEntity}`)
  
  try {
    // Get all current relationships for production user
    const { data: relationships, error } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', productionUserId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('organization_id', orgId)
    
    if (error) {
      console.error('❌ Database error:', error)
      return false
    }
    
    console.log(`\nFound ${relationships.length} MEMBER_OF relationships for production user:`)
    relationships.forEach((rel, i) => {
      const targetType = rel.to_entity_id === correctOrgEntity ? 'ORG' : 
                        rel.to_entity_id === wrongOrgEntity ? 'ORGANIZATION' : 'UNKNOWN'
      console.log(`  ${i + 1}. ${rel.id} -> ${rel.to_entity_id} (${targetType}) [Active: ${rel.is_active}]`)
      console.log(`     Created: ${rel.created_at}`)
    })
    
    // Find relationships by target
    const correctRelationships = relationships.filter(r => r.to_entity_id === correctOrgEntity)
    const wrongRelationships = relationships.filter(r => r.to_entity_id === wrongOrgEntity)
    
    console.log(`\n=== ANALYSIS ===`)
    console.log(`Correct (to ORG): ${correctRelationships.length}`)
    console.log(`Wrong (to ORGANIZATION): ${wrongRelationships.length}`)
    
    // Ensure the CORRECT relationship is active
    for (const rel of correctRelationships) {
      if (!rel.is_active) {
        console.log(`\n🔄 Reactivating correct relationship: ${rel.id}`)
        const { error: updateError } = await supabase
          .from('core_relationships')
          .update({ 
            is_active: true,
            updated_at: new Date().toISOString(),
            updated_by: productionUserId
          })
          .eq('id', rel.id)
        
        if (updateError) {
          console.error(`❌ Error reactivating ${rel.id}:`, updateError)
          return false
        }
        console.log(`✅ Reactivated ${rel.id}`)
      } else {
        console.log(`✅ Correct relationship ${rel.id} already active`)
      }
    }
    
    // Deactivate the WRONG relationships
    for (const rel of wrongRelationships) {
      if (rel.is_active) {
        console.log(`\n🔄 Deactivating wrong relationship: ${rel.id}`)
        const { error: updateError } = await supabase
          .from('core_relationships')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString(),
            updated_by: productionUserId
          })
          .eq('id', rel.id)
        
        if (updateError) {
          console.error(`❌ Error deactivating ${rel.id}:`, updateError)
          return false
        }
        console.log(`✅ Deactivated ${rel.id}`)
      } else {
        console.log(`✅ Wrong relationship ${rel.id} already inactive`)
      }
    }
    
    // If no correct relationship exists, create one
    if (correctRelationships.length === 0) {
      console.log(`\n🆕 Creating correct MEMBER_OF relationship for production user...`)
      const { data: newRel, error: createError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: orgId,
          from_entity_id: productionUserId,
          to_entity_id: correctOrgEntity,
          relationship_type: 'MEMBER_OF',
          relationship_direction: 'forward',
          relationship_data: { role: 'OWNER', permissions: ['*'] },
          smart_code: 'HERA.AUTH.USER.REL.MEMBER_OF.V1',
          smart_code_status: 'LIVE',
          is_active: true,
          created_by: productionUserId,
          updated_by: productionUserId
        })
        .select()
      
      if (createError) {
        console.error(`❌ Error creating relationship:`, createError)
        return false
      }
      console.log(`✅ Created new relationship: ${newRel[0].id}`)
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...')
    const { data: verification, error: verifyError } = await supabase
      .from('core_relationships')
      .select('id, to_entity_id, is_active, created_at')
      .eq('from_entity_id', productionUserId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('organization_id', orgId)
      .eq('is_active', true)
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError)
      return false
    }
    
    console.log(`✅ Verification: ${verification.length} active MEMBER_OF relationship(s)`)
    verification.forEach((rel, i) => {
      const targetType = rel.to_entity_id === correctOrgEntity ? 'ORG (CORRECT)' : 'OTHER'
      console.log(`   ${i + 1}. ${rel.id} -> ${rel.to_entity_id} (${targetType})`)
    })
    
    const correctActiveCount = verification.filter(r => r.to_entity_id === correctOrgEntity).length
    if (correctActiveCount === 1) {
      console.log('🎯 Perfect! Production user has exactly 1 active relationship to the correct ORG entity')
    } else {
      console.log(`⚠️ Issue: ${correctActiveCount} relationships to correct ORG entity (should be 1)`)
    }
    
    return correctActiveCount === 1
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return false
  }
}

// Run the fix
fixProductionUserRelationships()
  .then(success => {
    if (success) {
      console.log('\n🚀 Fix completed! Production should work now.')
      console.log('🌐 Try accessing: https://heraerp.com/salon/dashboard')
    } else {
      console.log('\n❌ Fix failed. Manual intervention may be needed.')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })