#!/usr/bin/env node

/**
 * Check Transaction Status in Database
 * Verify if POS transactions are being created with status='completed'
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

console.log('🔍 Checking Transaction Status in Supabase...\n')
console.log(`Organization ID: ${salonOrgId}\n`)

// Query 1: Check most recent SALE transactions
const { data, error } = await supabase
  .from('universal_transactions')
  .select('id, transaction_code, transaction_type, transaction_status, total_amount, metadata, created_at')
  .eq('organization_id', salonOrgId)
  .eq('transaction_type', 'SALE')
  .order('created_at', { ascending: false })
  .limit(5)

if (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}

console.log(`Found ${data.length} recent SALE transactions\n`)

// Display transactions
data.forEach((tx, i) => {
  console.log(`\n[${i + 1}] Transaction: ${tx.transaction_code || tx.id.substring(0, 8)}`)
  console.log(`    Type: ${tx.transaction_type}`)
  console.log(`    Status: ${tx.transaction_status || '(not set)'} ${tx.transaction_status === 'completed' ? '✅' : '❌'}`)
  console.log(`    Amount: AED ${tx.total_amount || 0}`)
  console.log(`    Metadata status: ${tx.metadata?.status || '(not set)'}`)
  console.log(`    Created: ${new Date(tx.created_at).toLocaleString()}`)
})

// Summary
const statusCounts = data.reduce((acc, tx) => {
  const status = tx.transaction_status || 'null'
  acc[status] = (acc[status] || 0) + 1
  return acc
}, {})

console.log('\n\n📊 Status Summary:')
Object.entries(statusCounts).forEach(([status, count]) => {
  const icon = status === 'completed' ? '✅' : '❌'
  console.log(`   ${icon} ${status}: ${count} transaction(s)`)
})

// Check if all are completed
const allCompleted = data.every(tx => tx.transaction_status === 'completed')
if (allCompleted && data.length > 0) {
  console.log('\n✅ All recent transactions are COMPLETED')
  console.log('✅ Dashboard should display payment method breakdown')
} else if (data.length === 0) {
  console.log('\n⚠️  No SALE transactions found')
  console.log('   Create a POS sale to test')
} else {
  console.log('\n❌ Some transactions are NOT completed')
  console.log('   Fix needed: Ensure status is set to "completed" on creation')
}

console.log('\n')
process.exit(0)
