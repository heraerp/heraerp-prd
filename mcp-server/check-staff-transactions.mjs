import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkStaffTransactions() {
  try {
    console.log('\n🔍 Checking for staff named "test"...\n')
    
    // Find staff named "test"
    const { data: staff, error: staffError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'STAFF')
      .ilike('entity_name', '%test%')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (staffError) {
      console.error('❌ Error fetching staff:', staffError)
      return
    }
    
    console.log(`Found ${staff?.length || 0} staff members with "test" in name:\n`)
    staff?.forEach(s => {
      console.log(`  📋 ID: ${s.id}`)
      console.log(`  📋 Name: ${s.entity_name}`)
      console.log(`  📋 Status: ${s.status}`)
      console.log(`  📋 Deleted At: ${s.deleted_at || 'NULL'}`)
      console.log(`  📋 Created: ${s.created_at}`)
      console.log('')
    })
    
    if (!staff || staff.length === 0) {
      console.log('⚠️  No staff found with "test" in name\n')
      return
    }
    
    // Check each staff for transaction references
    for (const s of staff) {
      console.log(`\n🔍 Checking transactions for: ${s.entity_name} (${s.id})\n`)
      
      // Check as source_entity_id
      const { data: sourceTxns, error: sourceError } = await supabase
        .from('universal_transactions')
        .select('id, transaction_type, transaction_number, created_at')
        .eq('source_entity_id', s.id)
        .limit(10)
      
      if (sourceError) {
        console.error('  ❌ Error checking source transactions:', sourceError)
      } else {
        console.log(`  📊 As SOURCE (${sourceTxns?.length || 0} transactions):`)
        sourceTxns?.forEach(t => {
          console.log(`    - ${t.transaction_type} #${t.transaction_number} (${t.id})`)
        })
      }
      
      // Check as target_entity_id
      const { data: targetTxns, error: targetError } = await supabase
        .from('universal_transactions')
        .select('id, transaction_type, transaction_number, created_at')
        .eq('target_entity_id', s.id)
        .limit(10)
      
      if (targetError) {
        console.error('  ❌ Error checking target transactions:', targetError)
      } else {
        console.log(`  📊 As TARGET (${targetTxns?.length || 0} transactions):`)
        targetTxns?.forEach(t => {
          console.log(`    - ${t.transaction_type} #${t.transaction_number} (${t.id})`)
        })
      }
      
      // Check in transaction lines
      const { data: lineTxns, error: lineError } = await supabase
        .from('universal_transaction_lines')
        .select('id, transaction_id, line_type, entity_id')
        .eq('entity_id', s.id)
        .limit(10)
      
      if (lineError) {
        console.error('  ❌ Error checking transaction lines:', lineError)
      } else {
        console.log(`  📊 In TRANSACTION LINES (${lineTxns?.length || 0} references):`)
        lineTxns?.forEach(l => {
          console.log(`    - Transaction ${l.transaction_id} - Line ${l.id}`)
        })
      }
      
      const totalRefs = (sourceTxns?.length || 0) + (targetTxns?.length || 0) + (lineTxns?.length || 0)
      
      if (totalRefs === 0) {
        console.log(`\n  ✅ Staff has NO transaction references - should be deletable\n`)
      } else {
        console.log(`\n  ⚠️  Staff has ${totalRefs} transaction references - CANNOT hard delete\n`)
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkStaffTransactions()
