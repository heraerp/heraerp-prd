import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkStaffReferences() {
  console.log('Checking what blocks staff deletion...')
  
  const testData = {
    organization_id: "96b1b1b6-56df-42d5-80d5-3c73854682eb"
  }
  
  // Get a sample staff member
  const { data: staffMembers } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('entity_type', 'STAFF')
    .eq('organization_id', testData.organization_id)
    .limit(1)
  
  if (!staffMembers || staffMembers.length === 0) {
    console.log('No staff members found')
    return
  }
  
  const staffId = staffMembers[0].id
  console.log(`Checking references for staff: ${staffMembers[0].entity_name}`)
  
  // Check relationships table
  const { data: relationships } = await supabase
    .from('core_relationships')
    .select('relationship_type, source_entity_id, target_entity_id')
    .or(`source_entity_id.eq.${staffId},target_entity_id.eq.${staffId}`)
  
  console.log('Relationships:', relationships?.length || 0)
  
  // Check transactions table
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('id, transaction_type, source_entity_id, target_entity_id')
    .or(`source_entity_id.eq.${staffId},target_entity_id.eq.${staffId}`)
  
  console.log('Transactions:', transactions?.length || 0)
  
  // Check transaction lines
  const { data: txnLines } = await supabase
    .from('universal_transaction_lines')
    .select('id, transaction_id, entity_id, line_type')
    .eq('entity_id', staffId)
  
  console.log('Transaction lines:', txnLines?.length || 0)
  
  const totalRefs = (relationships?.length || 0) + (transactions?.length || 0) + (txnLines?.length || 0)
  console.log(`Total references: ${totalRefs}`)
  
  if (totalRefs > 0) {
    console.log('Staff CANNOT be hard deleted (has references)')
  } else {
    console.log('Staff CAN be hard deleted (no references)')
  }
}

checkStaffReferences().catch(console.error)
