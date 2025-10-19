/**
 * Delete All Transactions & Lines - Safe Cleanup
 * Deletes all transactions and their lines from Hair Talkz organization
 * Uses proper cascading deletion order: lines first, then transactions
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const ORGANIZATION_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function deleteAllTransactions() {
  console.log('🗑️  TRANSACTION & LINES CLEANUP')
  console.log('='.repeat(60))
  console.log(`Organization: ${ORGANIZATION_ID}\n`)

  try {
    // STEP 1: Count and show what we're deleting
    console.log('Step 1: Analyzing data...\n')

    const { data: transactions, error: txError } = await supabase
      .from('universal_transactions')
      .select('id, transaction_type, transaction_code, transaction_date')
      .eq('organization_id', ORGANIZATION_ID)

    if (txError) {
      console.error('Error reading transactions:', txError)
      return
    }

    const txCount = transactions?.length || 0
    console.log(`📄 Transactions found: ${txCount}`)

    if (txCount > 0) {
      // Group by type
      const byType = transactions.reduce((acc, t) => {
        acc[t.transaction_type] = (acc[t.transaction_type] || 0) + 1
        return acc
      }, {})

      console.log('\n   Breakdown by type:')
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`   • ${type}: ${count}`)
      })

      console.log('\n   Sample transactions:')
      transactions.slice(0, 5).forEach((t, i) => {
        console.log(`   ${i + 1}. [${t.transaction_type}] ${t.transaction_code || 'No code'}`)
      })
      if (txCount > 5) console.log(`   ... and ${txCount - 5} more`)
    }

    // Count lines
    const { count: lineCount, error: lineCountError } = await supabase
      .from('universal_transaction_lines')
      .select('id', { count: 'exact' })
      .eq('organization_id', ORGANIZATION_ID)

    if (lineCountError) {
      console.error('Error counting lines:', lineCountError)
      return
    }

    console.log(`\n📋 Transaction lines found: ${lineCount || 0}`)

    if (txCount === 0 && (lineCount === 0)) {
      console.log('\n✅ No data to delete. Database is already clean.')
      return
    }

    // STEP 2: Delete transaction lines FIRST (foreign key constraint)
    console.log('\n' + '='.repeat(60))
    console.log('Step 2: Deleting transaction lines...\n')

    const { error: deleteLinesError } = await supabase
      .from('universal_transaction_lines')
      .delete()
      .eq('organization_id', ORGANIZATION_ID)

    if (deleteLinesError) {
      console.error('❌ Error deleting lines:', deleteLinesError)
      return
    }

    console.log(`✅ Deleted ${lineCount || 0} transaction lines`)

    // STEP 3: Delete transactions
    console.log('\n' + '='.repeat(60))
    console.log('Step 3: Deleting transactions...\n')

    const { error: deleteTxError } = await supabase
      .from('universal_transactions')
      .delete()
      .eq('organization_id', ORGANIZATION_ID)

    if (deleteTxError) {
      console.error('❌ Error deleting transactions:', deleteTxError)
      return
    }

    console.log(`✅ Deleted ${txCount} transactions`)

    // STEP 4: Verify cleanup
    console.log('\n' + '='.repeat(60))
    console.log('Step 4: Verifying cleanup...\n')

    const { count: remainingTx } = await supabase
      .from('universal_transactions')
      .select('id', { count: 'exact' })
      .eq('organization_id', ORGANIZATION_ID)

    const { count: remainingLines } = await supabase
      .from('universal_transaction_lines')
      .select('id', { count: 'exact' })
      .eq('organization_id', ORGANIZATION_ID)

    console.log(`Remaining transactions: ${remainingTx || 0}`)
    console.log(`Remaining lines: ${remainingLines || 0}`)

    if (remainingTx === 0 && remainingLines === 0) {
      console.log('\n✅ VERIFICATION PASSED: All data deleted successfully!')
    } else {
      console.log('\n⚠️  WARNING: Some records remain')
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`Transactions deleted: ${txCount}`)
    console.log(`Lines deleted: ${lineCount || 0}`)
    console.log(`Transactions remaining: ${remainingTx || 0}`)
    console.log(`Lines remaining: ${remainingLines || 0}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

console.log('\n')
deleteAllTransactions()
  .then(() => {
    console.log('\n✅ Cleanup script completed\n')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Script failed:', err)
    process.exit(1)
  })
