import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const ORG = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

console.log('\n🔍 CHECKING CURRENT TRANSACTIONS\n')
console.log('='.repeat(60))

// Get ALL transactions
const { data: allTxs, error: allError } = await supabase
  .from('universal_transactions')
  .select('id, transaction_type, transaction_code, transaction_date, transaction_status, smart_code, created_at')
  .eq('organization_id', ORG)
  .order('created_at', { ascending: false })

if (allError) {
  console.error('Error:', allError)
} else {
  console.log(`\n📊 TOTAL TRANSACTIONS: ${allTxs?.length || 0}\n`)
  
  if (allTxs && allTxs.length > 0) {
    // Group by type
    const byType = {}
    allTxs.forEach(tx => {
      if (!byType[tx.transaction_type]) {
        byType[tx.transaction_type] = []
      }
      byType[tx.transaction_type].push(tx)
    })

    console.log('📋 BREAKDOWN BY TYPE:\n')
    Object.entries(byType).forEach(([type, txs]) => {
      console.log(`   ${type}: ${txs.length} transactions`)
      
      // Show first few
      txs.slice(0, 3).forEach((tx, i) => {
        console.log(`      ${i+1}. ${tx.transaction_code || 'No code'} - Status: ${tx.transaction_status || 'N/A'}`)
      })
      if (txs.length > 3) {
        console.log(`      ... and ${txs.length - 3} more`)
      }
      console.log()
    })

    // Check for LEAVE type specifically
    console.log('='.repeat(60))
    console.log('\n🎯 LEAVE TRANSACTIONS SPECIFICALLY:\n')
    const leaveTxs = allTxs.filter(tx => 
      tx.transaction_type === 'LEAVE' || 
      tx.transaction_type === 'leave' ||
      tx.smart_code?.includes('LEAVE')
    )
    
    console.log(`   Found: ${leaveTxs.length} LEAVE transactions`)
    if (leaveTxs.length > 0) {
      leaveTxs.forEach((tx, i) => {
        console.log(`   ${i+1}. Type: ${tx.transaction_type}`)
        console.log(`      Code: ${tx.transaction_code}`)
        console.log(`      Status: ${tx.transaction_status}`)
        console.log(`      Smart Code: ${tx.smart_code}`)
        console.log(`      Created: ${tx.created_at}`)
        console.log()
      })
    }
  }
}

console.log('='.repeat(60))
console.log('\n💡 If you see 23 transactions but we deleted LEAVE yesterday,')
console.log('   it means the app is querying a DIFFERENT transaction type!\n')
