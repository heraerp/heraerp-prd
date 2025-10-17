/**
 * Investigate what entity c0771739-ddb6-47fb-ae82-d34febedf098 is
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

const mysteryId = 'c0771739-ddb6-47fb-ae82-d34febedf098'
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function investigateMysteryEntity() {
  console.log('🔍 Investigating mystery entity...')
  console.log(`Mystery ID: ${mysteryId}`)
  console.log(`Org ID: ${orgId}`)
  
  try {
    // Check if it's an entity
    console.log('\n=== ENTITY SEARCH ===')
    const { data: entities } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', mysteryId)
    
    if (entities && entities.length > 0) {
      const entity = entities[0]
      console.log('✅ Found entity:')
      console.log(`   Type: ${entity.entity_type}`)
      console.log(`   Name: ${entity.entity_name}`)
      console.log(`   Code: ${entity.entity_code}`)
      console.log(`   Org: ${entity.organization_id}`)
      console.log(`   Smart Code: ${entity.smart_code}`)
      console.log(`   Created: ${entity.created_at}`)
    } else {
      console.log('❌ Not found as entity')
    }
    
    // Check if it's referenced in relationships
    console.log('\n=== RELATIONSHIP REFERENCES ===')
    const { data: asSource } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', mysteryId)
      .limit(5)
    
    const { data: asTarget } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('to_entity_id', mysteryId)
      .limit(5)
    
    console.log(`As source: ${asSource?.length || 0} relationships`)
    console.log(`As target: ${asTarget?.length || 0} relationships`)
    
    if (asTarget && asTarget.length > 0) {
      console.log('\n=== RELATIONSHIPS POINTING TO MYSTERY ENTITY ===')
      asTarget.forEach((rel, i) => {
        console.log(`  ${i + 1}. From: ${rel.from_entity_id}, Type: ${rel.relationship_type}, Active: ${rel.is_active}`)
      })
    }
    
    // Compare with actual ORG entity
    console.log('\n=== COMPARISON WITH ACTUAL ORG ENTITY ===')
    const { data: orgEntities } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', orgId)
    
    if (orgEntities && orgEntities.length > 0) {
      const orgEntity = orgEntities[0]
      console.log('✅ Actual ORG entity:')
      console.log(`   Type: ${orgEntity.entity_type}`)
      console.log(`   Name: ${orgEntity.entity_name}`)
      console.log(`   Code: ${orgEntity.entity_code}`)
      console.log(`   Smart Code: ${orgEntity.smart_code}`)
      console.log(`   Created: ${orgEntity.created_at}`)
    }
    
    // Conclusion
    console.log('\n=== CONCLUSION ===')
    if (entities && entities.length > 0) {
      const entity = entities[0]
      if (entity.entity_type === 'ORG') {
        console.log('🚨 PROBLEM: Mystery entity is ALSO an ORG entity!')
        console.log('   This means we have TWO ORG entities in the same organization')
        console.log('   Need to determine which one is correct and clean up')
      } else {
        console.log(`✅ Mystery entity is a ${entity.entity_type}, not an ORG`)
        console.log('   The relationship should point to the ORG entity instead')
      }
    }
    
    return true
    
  } catch (error) {
    console.error('💥 Investigation failed:', error)
    return false
  }
}

// Run the investigation
investigateMysteryEntity()
  .then(success => {
    console.log(`\n🎯 Investigation ${success ? 'COMPLETED' : 'FAILED'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })