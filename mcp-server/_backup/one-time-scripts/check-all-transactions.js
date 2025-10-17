#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '../.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const salonOrgId = process.env.HERA_SALON_ORG_ID

console.log('🔍 Checking ALL Transactions in Supabase...\n')

const { data, error } = await supabase
  .from('universal_transactions')
  .select('id, transaction_code, transaction_type, transaction_status, total_amount, metadata, created_at, lines:universal_transaction_lines(*)')
  .eq('organization_id', salonOrgId)
  .order('created_at', { ascending: false })
  .limit(20)

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

console.log(`Found ${data.length} total transactions\n`)

data.forEach((tx, i) => {
  const paymentMethod = tx.metadata?.payment_method || tx.metadata?.paymentMethod || ''
  const paymentLines = tx.lines?.filter(l => l.line_type === 'payment') || []
  
  console.log(`\n[${i + 1}] ${tx.transaction_code || tx.id.substring(0, 8)}`)
  console.log(`    Type: ${tx.transaction_type}`)
  console.log(`    Status: ${tx.transaction_status}`)
  console.log(`    Amount: AED ${tx.total_amount || 0}`)
  console.log(`    Payment Method (metadata): ${paymentMethod || '(empty)'}`)
  console.log(`    Payment Lines: ${paymentLines.length}`)
  
  paymentLines.forEach((line, idx) => {
    const method = line.payment_method || line.metadata?.payment_method || '(empty)'
    console.log(`      [Line ${idx + 1}] ${method} - AED ${Math.abs(line.line_amount || 0)}`)
  })
  
  console.log(`    Created: ${new Date(tx.created_at).toLocaleString()}`)
})

// Summary
const cashCount = data.filter(tx => {
  const method = (tx.metadata?.payment_method || '').toLowerCase()
  const hasLineCash = tx.lines?.some(l => 
    l.line_type === 'payment' && 
    (l.payment_method || l.metadata?.payment_method || '').toLowerCase().includes('cash')
  )
  return method.includes('cash') || hasLineCash
}).length

const cardCount = data.filter(tx => {
  const method = (tx.metadata?.payment_method || '').toLowerCase()
  const hasLineCard = tx.lines?.some(l => 
    l.line_type === 'payment' && 
    (l.payment_method || l.metadata?.payment_method || '').toLowerCase().includes('card')
  )
  return method.includes('card') || hasLineCard
}).length

console.log('\n\n📊 Summary:')
console.log(`   Transactions with CASH: ${cashCount}`)
console.log(`   Transactions with CARD: ${cardCount}`)

if (cashCount > 0 && cardCount > 0) {
  console.log('\n✅ Both CASH and CARD found!')
} else if (cashCount > 0) {
  console.log('\n⚠️  Only CASH found')
} else if (cardCount > 0) {
  console.log('\n⚠️  Only CARD found')
} else {
  console.log('\n⚠️  No payment method data found')
}
