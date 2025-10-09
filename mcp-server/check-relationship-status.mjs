import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function checkRelationshipStatus() {
  console.log('=== CHECKING RELATIONSHIP STATUS ===')
  
  // Check total relationships in the system
  const { data: allRelationships, error: allError } = await supabase
    .from('core_relationships')
    .select('id, from_entity_id, to_entity_id, relationship_type, organization_id, created_at')
    .order('created_at', { ascending: false })
    .limit(20)
    
  console.log('Recent relationships in system:', { 
    count: allRelationships?.length || 0,
    error: allError 
  })
  
  if (allRelationships && allRelationships.length > 0) {
    console.log('\nRecent relationships:')
    allRelationships.forEach(rel => {
      console.log(`- ${rel.relationship_type}: ${rel.from_entity_id} -> ${rel.to_entity_id} (org: ${rel.organization_id})`)
    })
  }
  
  // Check for any USER_MEMBER_OF_ORG relationships
  const { data: userMemberships, error: memberError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    
  console.log('\nUSER_MEMBER_OF_ORG relationships:', { 
    count: userMemberships?.length || 0,
    data: userMemberships,
    error: memberError 
  })
  
  // Check if the relationship was recently deleted
  console.log('\nChecking for recent relationship deletions...')
  
  // Check audit logs if they exist
  const { data: auditLogs, error: auditError } = await supabase
    .from('universal_transactions')
    .select('*')
    .ilike('transaction_type', '%delete%')
    .order('created_at', { ascending: false })
    .limit(10)
    
  console.log('Recent deletion transactions:', { 
    count: auditLogs?.length || 0,
    error: auditError 
  })
  
  if (auditLogs && auditLogs.length > 0) {
    auditLogs.forEach(log => {
      console.log(`- ${log.transaction_type}: ${log.id} at ${log.created_at}`)
    })
  }
}

checkRelationshipStatus().catch(console.error)