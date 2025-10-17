/**
 * Test the membership logic without deploying the full RPC
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

const userId = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function testMembershipLogic() {
  console.log('🧪 Testing membership setup logic...')
  
  try {
    // Step 1: Check current state
    console.log('\n=== CURRENT STATE ===')
    
    const { data: currentUser } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'USER')
    
    console.log(`USER entity exists: ${currentUser?.length > 0}`)
    
    const { data: currentMemberships } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('organization_id', orgId)
    
    console.log(`MEMBER_OF relationships: ${currentMemberships?.length || 0}`)
    currentMemberships?.forEach((rel, i) => {
      console.log(`  ${i + 1}. ID: ${rel.id}, Active: ${rel.is_active}, To: ${rel.to_entity_id}`)
    })
    
    // Step 2: Find ORG entity
    console.log('\n=== ORG ENTITY LOOKUP ===')
    const { data: orgEntities } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'ORG')
    
    console.log(`Found ${orgEntities?.length || 0} ORG entities:`)
    orgEntities?.forEach((org, i) => {
      console.log(`  ${i + 1}. ID: ${org.id}, Name: ${org.entity_name}`)
    })
    
    const orgEntity = orgEntities?.[0]
    if (!orgEntity) {
      console.log('❌ No ORG entity found!')
      return false
    }
    
    // Step 3: Check if current relationships point to wrong target
    console.log('\n=== RELATIONSHIP ANALYSIS ===')
    const wrongTargets = currentMemberships?.filter(rel => 
      rel.to_entity_id === orgId && rel.is_active
    ) || []
    
    const correctTargets = currentMemberships?.filter(rel => 
      rel.to_entity_id === orgEntity.id && rel.is_active
    ) || []
    
    console.log(`Wrong targets (pointing to org UUID): ${wrongTargets.length}`)
    console.log(`Correct targets (pointing to ORG entity): ${correctTargets.length}`)
    
    // Step 4: Suggest action
    console.log('\n=== RECOMMENDATION ===')
    if (wrongTargets.length > 0) {
      console.log('🔧 NEEDS FIXING: Deactivate wrong relationships and create correct one')
      console.log(`   - Deactivate ${wrongTargets.length} wrong relationship(s)`)
      console.log(`   - Create relationship from USER:${userId} to ORG:${orgEntity.id}`)
    } else if (correctTargets.length > 1) {
      console.log('🔧 NEEDS CLEANUP: Multiple correct relationships exist')
      console.log(`   - Keep newest of ${correctTargets.length} relationships`)
    } else if (correctTargets.length === 1) {
      console.log('✅ GOOD: One correct relationship exists')
    } else {
      console.log('🔧 NEEDS CREATION: No relationships exist')
      console.log(`   - Create relationship from USER:${userId} to ORG:${orgEntity.id}`)
    }
    
    return true
    
  } catch (error) {
    console.error('💥 Test failed:', error)
    return false
  }
}

// Run the test
testMembershipLogic()
  .then(success => {
    console.log(`\n🎯 Test ${success ? 'COMPLETED' : 'FAILED'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })