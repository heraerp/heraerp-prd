/**
 * Debug Michele's MEMBER_OF relationships - this is where the real duplicate issue is
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

const userId = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'

async function debugMicheleRelationships() {
  console.log('🔍 Debugging Michele MEMBER_OF relationships...')
  console.log(`User ID: ${userId}`)
  console.log()

  try {
    // 1. Exact same query from resolve-membership that's failing
    console.log('=== 1. EXACT QUERY FROM RESOLVE-MEMBERSHIP (that fails) ===')
    const { data: problematicQuery, error: problemError } = await supabase
      .from('core_relationships')
      .select('id, to_entity_id, organization_id, relationship_data, is_active, from_entity_id, relationship_type')
      .eq('from_entity_id', userId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
      .maybeSingle()

    console.log('Result:', { data: problematicQuery, error: problemError })
    console.log()

    // 2. Check all MEMBER_OF relationships for Michele
    console.log('=== 2. ALL MEMBER_OF RELATIONSHIPS FOR MICHELE ===')
    const { data: allRelationships, error: allError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userId)
      .eq('relationship_type', 'MEMBER_OF')

    console.log(`Found ${allRelationships?.length || 0} MEMBER_OF relationships:`)
    allRelationships?.forEach((rel, i) => {
      console.log(`  ${i + 1}. ID: ${rel.id}`)
      console.log(`     To Entity: ${rel.to_entity_id}`)
      console.log(`     Organization: ${rel.organization_id}`)
      console.log(`     Is Active: ${rel.is_active}`)
      console.log(`     Created: ${rel.created_at}`)
      console.log(`     Data: ${JSON.stringify(rel.relationship_data)}`)
      console.log()
    })

    // 3. Check active vs inactive
    console.log('=== 3. ACTIVE vs INACTIVE MEMBER_OF RELATIONSHIPS ===')
    const activeCount = allRelationships?.filter(r => r.is_active).length || 0
    const inactiveCount = allRelationships?.filter(r => !r.is_active).length || 0
    
    console.log(`Active: ${activeCount}`)
    console.log(`Inactive: ${inactiveCount}`)
    console.log(`Total: ${allRelationships?.length || 0}`)
    
    if (activeCount > 1) {
      console.log('🚨 PROBLEM IDENTIFIED: Multiple active MEMBER_OF relationships')
      console.log('   - Need to deactivate duplicates or fix the query logic')
      
      // Show which ones are active
      console.log('\n=== ACTIVE RELATIONSHIPS (need to clean up) ===')
      const activeRels = allRelationships?.filter(r => r.is_active) || []
      activeRels.forEach((rel, i) => {
        console.log(`  ${i + 1}. ID: ${rel.id} -> Org: ${rel.organization_id} (Created: ${rel.created_at})`)
      })
    }

  } catch (error) {
    console.error('💥 Debug failed:', error)
  }
}

// Run the debug
debugMicheleRelationships()
  .then(() => {
    console.log('\n🎯 Debug completed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })