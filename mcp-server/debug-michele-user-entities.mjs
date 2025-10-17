/**
 * Debug Michele's USER entities to find the duplicate issue
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

const userId = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function debugMicheleUserEntities() {
  console.log('🔍 Debugging Michele USER entity situation...')
  console.log(`User ID: ${userId}`)
  console.log(`Org ID: ${orgId}`)
  console.log()

  try {
    // 1. Exact same query from resolve-membership that's failing
    console.log('=== 1. EXACT QUERY FROM RESOLVE-MEMBERSHIP (that fails) ===')
    const { data: problematicQuery, error: problemError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, metadata, created_at')
      .eq('entity_type', 'USER')
      .eq('organization_id', orgId)
      .or(`metadata->>'supabase_uid'.eq.${userId},id.eq.${userId}`)
      .maybeSingle()

    console.log('Result:', { count: problematicQuery ? 1 : 0, data: problematicQuery, error: problemError })
    console.log()

    // 2. Check all USER entities in this org
    console.log('=== 2. ALL USER ENTITIES IN ORG ===')
    const { data: allUsers, error: allUsersError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, metadata, created_at')
      .eq('entity_type', 'USER')
      .eq('organization_id', orgId)

    console.log(`Found ${allUsers?.length || 0} USER entities:`)
    allUsers?.forEach((user, i) => {
      console.log(`  ${i + 1}. ID: ${user.id}`)
      console.log(`     Name: ${user.entity_name}`)
      console.log(`     Metadata: ${JSON.stringify(user.metadata, null, 6)}`)
      console.log(`     Created: ${user.created_at}`)
      console.log()
    })

    // 3. Check entities with ID matching Michele's userId
    console.log('=== 3. ENTITIES WITH PRIMARY KEY = MICHELE USER ID ===')
    const { data: byId } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', orgId)

    console.log(`Found ${byId?.length || 0} entities with id=${userId}:`)
    byId?.forEach((entity, i) => {
      console.log(`  ${i + 1}. Type: ${entity.entity_type}`)
      console.log(`     Name: ${entity.entity_name}`)
      console.log(`     Metadata: ${JSON.stringify(entity.metadata, null, 6)}`)
      console.log()
    })

    // 4. Check entities with supabase_uid in metadata
    console.log('=== 4. ENTITIES WITH METADATA.supabase_uid = MICHELE USER ID ===')
    const { data: byMetadata } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('metadata->>supabase_uid', userId)

    console.log(`Found ${byMetadata?.length || 0} entities with metadata.supabase_uid=${userId}:`)
    byMetadata?.forEach((entity, i) => {
      console.log(`  ${i + 1}. Type: ${entity.entity_type}`)
      console.log(`     ID: ${entity.id}`)
      console.log(`     Name: ${entity.entity_name}`)
      console.log(`     Metadata: ${JSON.stringify(entity.metadata, null, 6)}`)
      console.log()
    })

    // 5. Summary and solution
    console.log('=== 5. ANALYSIS ===')
    const totalMatches = (byId?.length || 0) + (byMetadata?.length || 0)
    console.log(`Total entities matching .or() query: ${totalMatches}`)
    
    if (totalMatches > 1) {
      console.log('🚨 PROBLEM IDENTIFIED: Multiple entities match the .or() condition')
      console.log('   - The resolve-membership query uses .maybeSingle() which fails with >1 result')
      console.log('   - Need to fix the query logic to be more specific')
    } else if (totalMatches === 0) {
      console.log('🚨 PROBLEM IDENTIFIED: No USER entity found')
      console.log('   - Need to create USER entity for Michele')
    } else {
      console.log('✅ Only one entity matches - problem might be elsewhere')
    }

  } catch (error) {
    console.error('💥 Debug failed:', error)
  }
}

// Run the debug
debugMicheleUserEntities()
  .then(() => {
    console.log('\n🎯 Debug completed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })