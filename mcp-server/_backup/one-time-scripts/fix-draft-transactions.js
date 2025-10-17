#!/usr/bin/env node

/**
 * Fix Draft Transactions - Update to Completed Status
 * Updates all SALE transactions from 'draft' to 'completed' status
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '../.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const salonOrgId = process.env.HERA_SALON_ORG_ID

console.log('🔧 Fixing Draft Transactions...\n')
console.log(`Organization ID: ${salonOrgId}\n`)

// Step 1: Count draft transactions
const { data: draftTransactions, error: countError } = await supabase
  .from('universal_transactions')
  .select('id, transaction_code, transaction_status, metadata')
  .eq('organization_id', salonOrgId)
  .eq('transaction_type', 'SALE')
  .eq('transaction_status', 'draft')

if (countError) {
  console.error('❌ Error counting draft transactions:', countError)
  process.exit(1)
}

console.log(`Found ${draftTransactions.length} draft SALE transactions\n`)

if (draftTransactions.length === 0) {
  console.log('✅ No draft transactions to fix!')
  console.log('   All transactions are already completed.')
  process.exit(0)
}

// Display transactions that will be updated
console.log('📋 Transactions to be updated:\n')
draftTransactions.forEach((tx, i) => {
  console.log(`  [${i + 1}] ${tx.transaction_code || tx.id.substring(0, 8)}`)
  console.log(`      Current: transaction_status='draft', metadata.status='${tx.metadata?.status || 'not set'}'`)
  console.log(`      Will update: transaction_status='completed'`)
  console.log('')
})

// Step 2: Update all draft transactions to completed
console.log('🔄 Updating transactions...\n')

const { data: updateResult, error: updateError } = await supabase
  .from('universal_transactions')
  .update({
    transaction_status: 'completed'
  })
  .eq('organization_id', salonOrgId)
  .eq('transaction_type', 'SALE')
  .eq('transaction_status', 'draft')
  .select()

if (updateError) {
  console.error('❌ Error updating transactions:', updateError)
  process.exit(1)
}

console.log(`✅ Successfully updated ${updateResult.length} transactions to 'completed' status\n`)

// Step 3: Verify update
const { data: verifyTransactions, error: verifyError } = await supabase
  .from('universal_transactions')
  .select('transaction_status, count')
  .eq('organization_id', salonOrgId)
  .eq('transaction_type', 'SALE')

if (verifyError) {
  console.error('⚠️  Could not verify update:', verifyError)
} else {
  console.log('📊 Verification Results:')

  const { data: completedCount } = await supabase
    .from('universal_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', salonOrgId)
    .eq('transaction_type', 'SALE')
    .eq('transaction_status', 'completed')

  const { data: draftCount } = await supabase
    .from('universal_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', salonOrgId)
    .eq('transaction_type', 'SALE')
    .eq('transaction_status', 'draft')

  console.log(`   ✅ Completed: ${completedCount.count} transaction(s)`)
  console.log(`   ❌ Draft: ${draftCount.count} transaction(s)`)
}

console.log('\n🎉 DONE!')
console.log('✅ Dashboard should now display payment method breakdown')
console.log('✅ Refresh the dashboard to see the changes')
console.log('\n')

process.exit(0)
