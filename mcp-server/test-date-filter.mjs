#!/usr/bin/env node
/**
 * Test Date Filter Bug - Daily Sales Report
 * Purpose: Verify that date_from and date_to filters are being applied correctly
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
const TEST_USER_ID = process.env.DEFAULT_USER_ENTITY_ID

console.log('\n🧪 DATE FILTER BUG TEST')
console.log('=' . repeat(60))

// Test with Oct 31, 2025 (today's date based on logs)
const testDate = new Date('2025-10-31')
const startDate = startOfDay(testDate).toISOString()
const endDate = endOfDay(testDate).toISOString()

console.log('\n📅 Test Parameters:')
console.log('  Date:', format(testDate, 'yyyy-MM-dd'))
console.log('  Start:', startDate)
console.log('  End:', endDate)
console.log('  Org ID:', TEST_ORG_ID)
console.log('  User ID:', TEST_USER_ID)

console.log('\n🚀 Sending QUERY with date filters...\n')

const payload = {
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
}

console.log('📤 RPC Payload:')
console.log(JSON.stringify(payload, null, 2))

// First check if we have a user ID
if (!TEST_USER_ID) {
  console.log('\n❌ TEST_USER_ID is missing from .env')
  console.log('  Please add DEFAULT_USER_ENTITY_ID to your .env file')
  process.exit(1)
}

const { data, error } = await supabase.rpc('hera_txn_crud_v1', payload)

console.log('\n📥 RPC Response:')
console.log('  Error:', error?.message || 'None')
console.log('  Success:', data?.success)

if (!data?.success) {
  console.log('  ❌ QUERY Failed:', data?.error)
  process.exit(1)
}

const transactions = data?.data?.data?.items || []

console.log('  Transaction Count:', transactions.length)

if (transactions.length === 0) {
  console.log('  ✅ No transactions found (expected if none exist)')
} else {
  console.log('\n📊 Transaction Dates Analysis:')

  const dates = transactions.map(t => ({
    id: t.header?.id || t.id,
    code: t.header?.transaction_code || t.transaction_code,
    date: t.header?.transaction_date || t.transaction_date,
    withinRange: false
  }))

  // Check if each date is within the requested range
  dates.forEach(d => {
    const txnDate = new Date(d.date)
    const startCheck = new Date(startDate)
    const endCheck = new Date(endDate)
    d.withinRange = txnDate >= startCheck && txnDate <= endCheck
  })

  // Sort by date
  dates.sort((a, b) => new Date(a.date) - new Date(b.date))

  console.log('\n  Transactions by date:')
  dates.forEach(d => {
    const icon = d.withinRange ? '✅' : '❌'
    console.log(`  ${icon} ${d.code}: ${d.date}`)
  })

  const withinRange = dates.filter(d => d.withinRange).length
  const outsideRange = dates.filter(d => !d.withinRange).length

  console.log('\n  Summary:')
  console.log(`    ✅ Within range: ${withinRange}`)
  console.log(`    ❌ Outside range: ${outsideRange}`)

  if (outsideRange > 0) {
    console.log('\n  🚨 BUG CONFIRMED: Date filter is NOT working correctly!')
    console.log('  Expected: Only transactions from', format(testDate, 'yyyy-MM-dd'))
    console.log('  Actual: Got transactions from multiple days')

    console.log('\n  📋 Date Range in Results:')
    console.log('    Earliest:', dates[0].date)
    console.log('    Latest:', dates[dates.length - 1].date)
  } else {
    console.log('\n  ✅ Date filter is working correctly!')
  }
}

console.log('\n' + '='.repeat(60))
console.log('Test complete\n')
