/**
 * Check what organization ID the production user should actually be in
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

const productionUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674' // michele@hairtalkz.com
const envOrgId = 'f0af4ced-9d12-4a55-a649-b484368db249' // from env vars
const actualOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // where we found the user

async function checkProductionOrg() {
  console.log('🔍 Checking production user organization mapping...')
  console.log(`Production User: ${productionUserId}`)
  console.log(`ENV Org ID: ${envOrgId}`)
  console.log(`Actual Org ID: ${actualOrgId}`)
  
  try {
    // Check USER entity in ENV org
    console.log('\\n=== USER IN ENV ORG ===')
    const { data: userInEnvOrg } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', productionUserId)
      .eq('organization_id', envOrgId)
      .eq('entity_type', 'USER')
    
    console.log(`USER entity in ENV org (${envOrgId}): ${userInEnvOrg?.length > 0 ? 'EXISTS' : 'NOT FOUND'}`)
    
    // Check USER entity in actual org  
    console.log('\\n=== USER IN ACTUAL ORG ===')
    const { data: userInActualOrg } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', productionUserId)
      .eq('organization_id', actualOrgId)
      .eq('entity_type', 'USER')
    
    console.log(`USER entity in actual org (${actualOrgId}): ${userInActualOrg?.length > 0 ? 'EXISTS' : 'NOT FOUND'}`)
    if (userInActualOrg?.length > 0) {
      console.log(`   Name: ${userInActualOrg[0].entity_name}`)
      console.log(`   Email: ${userInActualOrg[0].metadata?.email}`)
    }
    
    // Check MEMBER_OF relationships in both orgs
    console.log('\\n=== MEMBER_OF RELATIONSHIPS ===')
    const { data: allRelationships } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', productionUserId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
    
    console.log(`Found ${allRelationships?.length || 0} active MEMBER_OF relationships:`)
    allRelationships?.forEach((rel, i) => {
      const isEnvOrg = rel.organization_id === envOrgId
      const isActualOrg = rel.organization_id === actualOrgId
      console.log(`  ${i + 1}. Org: ${rel.organization_id} ${isEnvOrg ? '(ENV)' : isActualOrg ? '(ACTUAL)' : '(OTHER)'}`)
      console.log(`     To: ${rel.to_entity_id}`)
      console.log(`     Created: ${rel.created_at}`)
    })
    
    // Check organization entities
    console.log('\\n=== ORGANIZATION ENTITIES ===')
    const { data: envOrgEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', envOrgId)
      .eq('entity_type', 'ORG')
      .limit(1)
    
    const { data: actualOrgEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', actualOrgId)
      .eq('entity_type', 'ORG')
      .limit(1)
    
    console.log(`ENV org entity (${envOrgId}): ${envOrgEntity?.length > 0 ? envOrgEntity[0].entity_name : 'NOT FOUND'}`)
    console.log(`Actual org entity (${actualOrgId}): ${actualOrgEntity?.length > 0 ? actualOrgEntity[0].entity_name : 'NOT FOUND'}`)
    
    // Final diagnosis
    console.log('\\n=== DIAGNOSIS ===')
    if (userInEnvOrg?.length > 0) {
      console.log('✅ Production user exists in ENV org - environment variables are correct')
    } else if (userInActualOrg?.length > 0) {
      console.log('🚨 PROBLEM FOUND: Production user exists in DIFFERENT org than ENV variables!')
      console.log(`   User is in: ${actualOrgId}`)
      console.log(`   ENV points to: ${envOrgId}`)
      console.log('\\n🔧 SOLUTION: Update production environment variables:')
      console.log(`   NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID=${actualOrgId}`)
    } else {
      console.log('❌ Production user not found in either organization')
    }
    
    return true
    
  } catch (error) {
    console.error('💥 Check failed:', error)
    return false
  }
}

// Run the check
checkProductionOrg()
  .then(success => {
    console.log(`\\n🎯 Check ${success ? 'COMPLETED' : 'FAILED'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })