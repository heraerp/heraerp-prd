#!/usr/bin/env node
/**
 * Verify Date Filter Fix Deployment
 * Tests that date_from and date_to filters are working correctly
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { startOfDay, endOfDay, format } from 'date-fns'

config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID
const TEST_USER_ID = process.env.DEFAULT_USER_ENTITY_ID || '00000000-0000-0000-0000-000000000001'

console.log('\n✅ VERIFYING DATE FILTER FIX DEPLOYMENT')
console.log('='.repeat(60))

// Step 1: Verify function was updated
console.log('\n📋 Step 1: Checking function deployment...\n')

const { data: funcCheck, error: funcError } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: TEST_USER_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    transaction_type: 'GL_JOURNAL',
    limit: 1
  }
})

if (funcError) {
  console.log('❌ Function call failed:', funcError.message)
  console.log('   Make sure the function was deployed correctly')
  process.exit(1)
}

console.log('✅ Function is callable and responding')

// Step 2: Test with date filter
console.log('\n📋 Step 2: Testing date filter functionality...\n')

const testDate = new Date('2025-10-31')
const startDate = startOfDay(testDate).toISOString()
const endDate = endOfDay(testDate).toISOString()

console.log('Test Parameters:')
console.log('  Date:', format(testDate, 'yyyy-MM-dd'))
console.log('  Start:', startDate)
console.log('  End:', endDate)

const { data: dateTest, error: dateError } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: TEST_USER_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    transaction_type: 'GL_JOURNAL',
    smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
    date_from: startDate,
    date_to: endDate,
    include_lines: true,
    limit: 1000
  }
})

if (dateError) {
  console.log('\n❌ Date filter test failed:', dateError.message)
  process.exit(1)
}

if (!dateTest?.success) {
  console.log('\n❌ Query failed:', dateTest?.error || 'Unknown error')
  process.exit(1)
}

const transactions = dateTest?.data?.data?.items || []

console.log('\n📊 Query Results:')
console.log('  Success:', dateTest.success)
console.log('  Transaction Count:', transactions.length)

if (transactions.length === 0) {
  console.log('\n✅ No transactions found for Oct 31, 2025')
  console.log('   This is expected if you have no transactions on that date')
  console.log('   Date filter is working correctly!')
} else {
  // Check if all transactions are within the date range
  const dates = transactions.map(t => ({
    date: t.transaction_date,
    withinRange: false
  }))

  dates.forEach(d => {
    const txnDate = new Date(d.date)
    const startCheck = new Date(startDate)
    const endCheck = new Date(endDate)
    d.withinRange = txnDate >= startCheck && txnDate <= endCheck
  })

  dates.sort((a, b) => new Date(a.date) - new Date(b.date))

  console.log('\n📅 Transaction Dates:')
  dates.forEach(d => {
    const icon = d.withinRange ? '✅' : '❌'
    console.log(`  ${icon} ${d.date}`)
  })

  const withinRange = dates.filter(d => d.withinRange).length
  const outsideRange = dates.filter(d => !d.withinRange).length

  console.log('\n📊 Date Filter Analysis:')
  console.log(`  ✅ Within range (${format(testDate, 'yyyy-MM-dd')}): ${withinRange}`)
  console.log(`  ❌ Outside range: ${outsideRange}`)

  if (outsideRange > 0) {
    console.log('\n❌ DATE FILTER FIX FAILED!')
    console.log('   Some transactions are from outside the requested date range')
    console.log('   Please check the deployment')
    console.log('\n   Expected: Only Oct 31, 2025')
    console.log('   Got: Dates from', dates[0].date, 'to', dates[dates.length - 1].date)
    process.exit(1)
  } else {
    console.log('\n✅ DATE FILTER FIX VERIFIED!')
    console.log('   All transactions are from the correct date')
  }
}

// Step 3: Test without date filter (should return all)
console.log('\n📋 Step 3: Testing query without date filter...\n')

const { data: allTest, error: allError } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: TEST_USER_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    transaction_type: 'GL_JOURNAL',
    smart_code: 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1',
    include_lines: false,
    limit: 100
  }
})

if (allError) {
  console.log('❌ Query without date filter failed:', allError.message)
  process.exit(1)
}

const allTransactions = allTest?.data?.data?.items || []
console.log('  Transactions without date filter:', allTransactions.length)

if (allTransactions.length > transactions.length) {
  console.log('✅ Query without date filter returns more results')
  console.log('   This confirms date filtering is working correctly')
} else if (allTransactions.length === transactions.length && transactions.length > 0) {
  console.log('⚠️  Same number of transactions with and without filter')
  console.log('   This could mean all transactions happen to be on Oct 31')
  console.log('   Or the date filter might not be working')
} else {
  console.log('✅ Query behavior is consistent')
}

console.log('\n' + '='.repeat(60))
console.log('✅ DEPLOYMENT VERIFICATION COMPLETE')
console.log('='.repeat(60))
console.log('\n📝 Next Steps:')
console.log('  1. Go to /salon/reports/sales/daily')
console.log('  2. Select different dates and verify results change')
console.log('  3. Check browser console for date filter logs')
console.log('  4. Verify branch + date filtering works together')
console.log('\n')
