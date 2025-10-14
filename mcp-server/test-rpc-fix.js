#!/usr/bin/env node
/**
 * Test the RPC fix for total calculation
 * Verifies that payment lines are excluded from total_amount
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRpcFix() {
  console.log('🧪 Testing RPC fix for total calculation...\n')
  console.log('='.repeat(100))

  // Get organization ID from environment
  const orgId = process.env.DEFAULT_ORGANIZATION_ID
  if (!orgId) {
    console.error('❌ DEFAULT_ORGANIZATION_ID not set in .env')
    process.exit(1)
  }

  // Test data: Simple sale with payment line
  const testHeader = {
    organization_id: orgId,
    transaction_type: 'SALE',
    transaction_code: 'TEST-FIX-' + Date.now(),
    transaction_date: new Date().toISOString(),
    source_entity_id: null, // Walk-in customer
    target_entity_id: null, // No staff for test
    transaction_status: 'completed',
    smart_code: 'HERA.SALON.TXN.SALE.CREATE.V1',
    metadata: {
      test: true,
      purpose: 'Verify RPC fix excludes payment lines from total'
    }
  }

  const testLines = [
    {
      line_number: 1,
      line_type: 'service',
      description: 'Haircut',
      quantity: 1,
      unit_amount: 450.00,
      line_amount: 450.00,
      smart_code: 'HERA.SALON.TXN.SERVICE.COMPLETE.V1'
    },
    {
      line_number: 2,
      line_type: 'tax',
      description: 'VAT (5%)',
      quantity: 1,
      unit_amount: 22.50,
      line_amount: 22.50,
      smart_code: 'HERA.SALON.TAX.VAT.TXN.V1'
    },
    {
      line_number: 3,
      line_type: 'payment',
      description: 'Payment - CARD',
      quantity: 1,
      unit_amount: 472.50,
      line_amount: 472.50,
      smart_code: 'HERA.SALON.POS.PAYMENT.CARD.V1'
    }
  ]

  console.log('\n📋 Test Transaction:')
  console.log('   Service: AED 450.00')
  console.log('   Tax (5%): AED 22.50')
  console.log('   Payment: AED 472.50')
  console.log('\n   ✅ EXPECTED total_amount: AED 472.50 (service + tax, excluding payment)')
  console.log('   ❌ BEFORE FIX would be: AED 945.00 (including payment line)')
  console.log('\n' + '-'.repeat(100))

  try {
    // Call the RPC function
    console.log('\n🔧 Calling hera_txn_create_v1...')
    const { data, error } = await supabase.rpc('hera_txn_create_v1', {
      p_header: testHeader,
      p_lines: testLines,
      p_actor_user_id: '00000000-0000-0000-0000-000000000000' // System user
    })

    if (error) {
      console.error('\n❌ RPC call failed:', error)
      return
    }

    console.log('\n✅ Transaction created:', data.transaction_id)

    // Fetch the transaction to verify total
    const { data: txn, error: fetchError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('id', data.transaction_id)
      .single()

    if (fetchError) {
      console.error('\n❌ Failed to fetch transaction:', fetchError)
      return
    }

    console.log('\n' + '='.repeat(100))
    console.log('\n📊 VERIFICATION RESULTS:')
    console.log('\n   Transaction ID:', txn.id)
    console.log('   Transaction Code:', txn.transaction_code)
    console.log('   Status:', txn.transaction_status)

    // Fetch transaction lines
    const { data: lines, error: linesError } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .eq('transaction_id', data.transaction_id)
      .order('line_number')

    if (!linesError && lines) {
      console.log('\n   📜 Transaction Lines:')
      let customerFacingTotal = 0
      lines.forEach(line => {
        console.log(`      ${line.line_number}. ${line.line_type.toUpperCase()}: AED ${line.line_amount.toFixed(2)} - ${line.description}`)

        // Calculate what the total SHOULD be (exclude payment/commission)
        if (line.line_type !== 'payment' && line.line_type !== 'commission') {
          customerFacingTotal += parseFloat(line.line_amount)
        }
      })

      console.log('\n   💡 Calculation Breakdown:')
      console.log(`      Customer-facing total (service + tax): AED ${customerFacingTotal.toFixed(2)}`)
      console.log(`      Stored total_amount field: AED ${parseFloat(txn.total_amount).toFixed(2)}`)

      const difference = Math.abs(parseFloat(txn.total_amount) - customerFacingTotal)

      if (difference < 0.01) {
        console.log('\n   ✅ SUCCESS! Total is correct (excludes payment lines)')
        console.log('   ✅ Fix is working properly!')
      } else {
        console.log('\n   ❌ FAILURE! Total is incorrect')
        console.log(`   ❌ Difference: AED ${difference.toFixed(2)}`)
        console.log('   ❌ Payment lines may still be included in total')
      }
    }

    // Clean up test transaction
    console.log('\n' + '-'.repeat(100))
    console.log('\n🧹 Cleaning up test transaction...')

    const { error: deleteError } = await supabase
      .from('universal_transactions')
      .delete()
      .eq('id', data.transaction_id)

    if (deleteError) {
      console.log('   ⚠️  Could not delete test transaction (manual cleanup needed)')
    } else {
      console.log('   ✅ Test transaction deleted')
    }

  } catch (err) {
    console.error('\n❌ Test failed with error:', err)
  }

  console.log('\n' + '='.repeat(100))
  console.log('\n✅ Test complete!\n')
}

testRpcFix()
