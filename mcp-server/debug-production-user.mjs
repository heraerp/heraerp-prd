/**
 * Debug the production user's complete authentication state
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

async function debugProductionUser() {
  console.log('🔍 Debugging production user authentication state...')
  console.log(`Production User: ${productionUserId} (michele@hairtalkz.com)`)
  console.log(`Organization: ${orgId}`)
  
  try {
    // 1. Check USER entity
    console.log('\n=== 1. USER ENTITY CHECK ===')
    const { data: userEntities, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'USER')
      .eq('organization_id', orgId)
      .or(`metadata->>'supabase_uid'.eq.${productionUserId},id.eq.${productionUserId}`)
    
    if (userError) {
      console.error('❌ USER entity query failed:', userError)
      return false
    }
    
    console.log(`Found ${userEntities?.length || 0} USER entities matching production user:`)
    userEntities?.forEach((user, i) => {
      console.log(`  ${i + 1}. ID: ${user.id}`)
      console.log(`     Name: ${user.entity_name}`)
      console.log(`     Email: ${user.metadata?.email}`)
      console.log(`     Supabase UID: ${user.metadata?.supabase_uid}`)
      console.log(`     Created: ${user.created_at}`)
      console.log()
    })
    
    // 2. Check resolve-membership query specifically
    console.log('=== 2. RESOLVE-MEMBERSHIP SIMULATION ===')
    
    // Get MEMBER_OF relationship
    const { data: relationship, error: relError } = await supabase
      .from('core_relationships')
      .select('id, to_entity_id, organization_id, relationship_data, is_active, from_entity_id, relationship_type')
      .eq('from_entity_id', productionUserId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
      .maybeSingle()
    
    if (relError) {
      console.error('❌ MEMBER_OF relationship query failed:', relError)
      return false
    }
    
    if (!relationship) {
      console.log('❌ No active MEMBER_OF relationship found')
      return false
    }
    
    console.log('✅ MEMBER_OF relationship found:')
    console.log(`   ID: ${relationship.id}`)
    console.log(`   From: ${relationship.from_entity_id}`)
    console.log(`   To: ${relationship.to_entity_id}`)
    console.log(`   Org: ${relationship.organization_id}`)
    console.log(`   Data: ${JSON.stringify(relationship.relationship_data)}`)
    
    // Get USER entity using resolve-membership logic
    const tenantOrgId = relationship.organization_id
    console.log(`\\nLooking for USER entity in tenant org: ${tenantOrgId}`)
    
    // Try ID match first
    const { data: userByIdData, error: userByIdError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, metadata')
      .eq('entity_type', 'USER')
      .eq('organization_id', tenantOrgId)
      .eq('id', productionUserId)
      .maybeSingle()
    
    console.log('USER by ID result:', { data: userByIdData, error: userByIdError })
    
    if (!userByIdData) {
      // Try metadata match
      const { data: userByMetadataData, error: userByMetadataError } = await supabase
        .from('core_entities')
        .select('id, entity_name, entity_code, metadata')
        .eq('entity_type', 'USER')
        .eq('organization_id', tenantOrgId)
        .eq('metadata->>supabase_uid', productionUserId)
        .maybeSingle()
      
      console.log('USER by metadata result:', { data: userByMetadataData, error: userByMetadataError })
    }
    
    // 3. Check ORG entity
    console.log('\\n=== 3. ORG ENTITY CHECK ===')
    const { data: orgEntity, error: orgEntityError } = await supabase
      .from('core_entities')
      .select('id, entity_type')
      .eq('id', relationship.to_entity_id)
      .eq('entity_type', 'ORG')
      .eq('organization_id', tenantOrgId)
      .maybeSingle()
    
    console.log('ORG entity result:', { data: orgEntity, error: orgEntityError })
    
    // 4. Compare with working local user
    console.log('\\n=== 4. COMPARISON WITH LOCAL USER ===')
    const localUserId = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
    
    const { data: localUserEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', localUserId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'USER')
    
    console.log(`Local user entity exists: ${localUserEntity?.length > 0}`)
    if (localUserEntity?.length > 0) {
      const local = localUserEntity[0]
      const prod = userEntities?.find(u => u.id === productionUserId)
      
      console.log('\\nField comparison:')
      console.log(`  ID match: Local=${local.id === localUserId}, Prod=${prod?.id === productionUserId}`)
      console.log(`  Org match: Local=${local.organization_id === orgId}, Prod=${prod?.organization_id === orgId}`)
      console.log(`  Metadata: Local=${!!local.metadata?.supabase_uid}, Prod=${!!prod?.metadata?.supabase_uid}`)
    }
    
    // 5. Final diagnosis
    console.log('\\n=== 5. DIAGNOSIS ===')
    if (userByIdData || userEntities?.some(u => u.id === productionUserId)) {
      console.log('✅ Production user has proper USER entity')
      console.log('✅ Production user has proper MEMBER_OF relationship')
      console.log('⚠️ Issue might be in frontend code or API endpoint differences')
      console.log('\\n🔍 Possible causes:')
      console.log('   1. API endpoint differences between local/production')
      console.log('   2. Environment variable differences')
      console.log('   3. Frontend code differences')
      console.log('   4. Cookie/session storage issues in production')
      console.log('   5. CORS or network issues')
    } else {
      console.log('❌ Production user missing proper USER entity')
      console.log('🔧 Need to create USER entity for production user')
    }
    
    return true
    
  } catch (error) {
    console.error('💥 Debug failed:', error)
    return false
  }
}

// Run the debug
debugProductionUser()
  .then(success => {
    console.log(`\\n🎯 Debug ${success ? 'COMPLETED' : 'FAILED'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })