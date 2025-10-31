#!/usr/bin/env node
/**
 * Check ANY Recent Transactions
 * See if POS is creating any transactions at all
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID
const TEST_USER_ID = process.env.DEFAULT_USER_ENTITY_ID || '00000000-0000-0000-0000-000000000001'

console.log('\n🔍 CHECKING ANY RECENT TRANSACTIONS')
console.log('='.repeat(60))

// Get ANY transactions from today
const { data: allData, error: allError } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: TEST_USER_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    limit: 20 // Get last 20 transactions of any type
  }
})

if (allError) {
  console.log('❌ Query failed:', allError.message)
  process.exit(1)
}

const transactions = allData?.data?.data?.items || []

console.log(`\n📊 Found ${transactions.length} total transactions\n`)

if (transactions.length === 0) {
  console.log('⚠️  No transactions found at all!')
  console.log('   POS might not be creating transactions')
  process.exit(0)
}

// Group by transaction type
const byType = {}
transactions.forEach(t => {
  const type = t.transaction_type || 'UNKNOWN'
  if (!byType[type]) {
    byType[type] = []
  }
  byType[type].push(t)
})

console.log('📋 TRANSACTIONS BY TYPE:')
Object.entries(byType).forEach(([type, txns]) => {
  console.log(`\n  ${type}: ${txns.length} transactions`)
  txns.slice(0, 3).forEach(t => {
    console.log(`    - ${t.transaction_code} (${t.transaction_date})`)
    console.log(`      smart_code: ${t.smart_code}`)
    console.log(`      source: ${t.source_entity_id || 'NULL'}`)
    console.log(`      target: ${t.target_entity_id || 'NULL'}`)
  })
})

console.log('\n' + '='.repeat(60))
console.log('CHECK COMPLETE')
console.log('='.repeat(60) + '\n')
