#!/usr/bin/env node

/**
 * Check Payment Methods in Transactions
 * Verifies that both card and cash payment methods exist
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const salonOrgId = process.env.HERA_SALON_ORG_ID

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkPaymentMethods() {
  console.log('🔍 Checking Payment Methods in Transactions...\n')
  console.log(`Organization ID: ${salonOrgId}\n`)

  try {
    // Query 1: Check transaction-level payment methods
    console.log('📊 Query 1: Transaction-Level Payment Methods')
    console.log('=' .repeat(80))

    const { data: transactions, error: txError } = await supabase
      .from('universal_transactions')
      .select('id, transaction_code, total_amount, metadata, transaction_status, created_at, lines:universal_transaction_lines(*)')
      .eq('organization_id', salonOrgId)
      .eq('transaction_status', 'completed')
      .eq('transaction_type', 'SALE')
      .order('created_at', { ascending: false })
      .limit(20)

    if (txError) {
      console.error('❌ Error querying transactions:', txError)
      return
    }

    console.log(`\nFound ${transactions.length} completed SALE transactions\n`)

    // Analyze payment methods
    const paymentMethodStats = {
      transaction_level: {
        cash: 0,
        card: 0,
        other: 0,
        empty: 0
      },
      metadata_level: {
        cash: 0,
        card: 0,
        other: 0,
        empty: 0
      }
    }

    transactions.forEach((tx, index) => {
      const metadataPaymentMethod = tx.metadata?.payment_method || tx.metadata?.paymentMethod || ''
      const paymentLines = tx.lines?.filter(line => line.line_type === 'payment') || []

      console.log(`\n[${index + 1}] Transaction: ${tx.transaction_code || tx.id.substring(0, 8)}`)
      console.log(`    Amount: AED ${tx.total_amount || 0}`)
      console.log(`    metadata.payment_method: ${metadataPaymentMethod || '(empty)'}`)
      console.log(`    Payment lines: ${paymentLines.length}`)

      // Show payment line details
      paymentLines.forEach((line, idx) => {
        const lineMethod = line.payment_method || line.metadata?.payment_method || ''
        console.log(`      [Line ${idx + 1}] Method: ${lineMethod || '(empty)'}, Amount: ${Math.abs(line.line_amount || 0)}`)
      })

      console.log(`    Created: ${new Date(tx.created_at).toLocaleString()}`)

      // Count metadata-level
      if (!metadataPaymentMethod) {
        paymentMethodStats.metadata_level.empty++
      } else if (metadataPaymentMethod.toLowerCase().includes('cash')) {
        paymentMethodStats.metadata_level.cash++
      } else if (metadataPaymentMethod.toLowerCase().includes('card')) {
        paymentMethodStats.metadata_level.card++
      } else {
        paymentMethodStats.metadata_level.other++
      }

      // Count from payment lines
      paymentLines.forEach(line => {
        const lineMethod = (line.payment_method || line.metadata?.payment_method || '').toLowerCase()
        if (!lineMethod) {
          paymentMethodStats.transaction_level.empty++
        } else if (lineMethod.includes('cash')) {
          paymentMethodStats.transaction_level.cash++
        } else if (lineMethod.includes('card')) {
          paymentMethodStats.transaction_level.card++
        } else {
          paymentMethodStats.transaction_level.other++
        }
      })
    })

    // Print summary
    console.log('\n\n📈 Payment Method Summary')
    console.log('=' .repeat(80))
    console.log('\n🔹 Transaction Lines (line_type = payment):')
    console.log(`   Cash: ${paymentMethodStats.transaction_level.cash}`)
    console.log(`   Card: ${paymentMethodStats.transaction_level.card}`)
    console.log(`   Other: ${paymentMethodStats.transaction_level.other}`)
    console.log(`   Empty: ${paymentMethodStats.transaction_level.empty}`)

    console.log('\n🔹 Metadata-Level (metadata.payment_method):')
    console.log(`   Cash: ${paymentMethodStats.metadata_level.cash}`)
    console.log(`   Card: ${paymentMethodStats.metadata_level.card}`)
    console.log(`   Other: ${paymentMethodStats.metadata_level.other}`)
    console.log(`   Empty: ${paymentMethodStats.metadata_level.empty}`)

    // Lines already fetched above with transactions

    // Final verdict
    console.log('\n\n✅ VERIFICATION RESULTS')
    console.log('=' .repeat(80))

    const hasCash = paymentMethodStats.transaction_level.cash > 0 ||
                     paymentMethodStats.metadata_level.cash > 0

    const hasCard = paymentMethodStats.transaction_level.card > 0 ||
                     paymentMethodStats.metadata_level.card > 0

    if (hasCash && hasCard) {
      console.log('✅ Both CASH and CARD payment methods found in database!')
      console.log('✅ Dashboard calculation should show both payment types')
    } else if (hasCash && !hasCard) {
      console.log('⚠️  Only CASH payments found - no CARD transactions detected')
    } else if (!hasCash && hasCard) {
      console.log('⚠️  Only CARD payments found - no CASH transactions detected')
    } else {
      console.log('❌ No clear payment method data found')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the check
checkPaymentMethods()
  .then(() => {
    console.log('\n✨ Check complete!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
