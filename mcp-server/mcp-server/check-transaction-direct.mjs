#!/usr/bin/env node
/**
 * Check Transaction Directly
 * Query universal_transactions table directly to see if transaction exists
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID
const TRANSACTION_CODE = 'TXN-1761918346501'

console.log('\n🔍 CHECKING TRANSACTION DIRECTLY')
console.log('='.repeat(60))
console.log('Transaction Code:', TRANSACTION_CODE)
console.log('Organization ID:', TEST_ORG_ID)

// Query directly from universal_transactions table
const { data: directData, error: directError } = await supabase
  .from('universal_transactions')
  .select('*')
  .eq('transaction_code', TRANSACTION_CODE)
  .eq('organization_id', TEST_ORG_ID)

if (directError) {
  console.log('\n❌ Direct query failed:', directError.message)
  process.exit(1)
}

console.log(`\n📊 Direct query found: ${directData?.length || 0} transactions`)

if (!directData || directData.length === 0) {
  console.log('\n⚠️  Transaction NOT found in database!')
  console.log('   Possible reasons:')
  console.log('   1. Transaction creation failed')
  console.log('   2. Wrong organization_id')
  console.log('   3. Transaction was rolled back')
  process.exit(0)
}

const txn = directData[0]

console.log('\n✅ TRANSACTION FOUND!')
console.log('='.repeat(60))
console.log('📋 BASIC INFO:')
console.log('  ID:', txn.id)
console.log('  Code:', txn.transaction_code)
console.log('  Type:', txn.transaction_type)
console.log('  Date:', txn.transaction_date)
console.log('  Amount:', txn.total_amount)
console.log('  Smart Code:', txn.smart_code)
console.log('  Status:', txn.transaction_status)

console.log('\n🔑 ENTITY FIELDS (KEY FOR FILTERING):')
console.log('  source_entity_id:', txn.source_entity_id || '❌ NULL')
console.log('  target_entity_id:', txn.target_entity_id || '❌ NULL')

console.log('\n📦 BUSINESS CONTEXT:')
if (txn.business_context) {
  console.log('  branch_id:', txn.business_context.branch_id || '❌ NULL')
  console.log('  customer_id:', txn.business_context.customer_id || '❌ NULL')
  console.log('  source:', txn.business_context.source || '❌ NULL')
} else {
  console.log('  ❌ No business_context')
}

console.log('\n🧪 DIAGNOSIS:')
console.log('  Has source_entity_id?', !!txn.source_entity_id ? '✅ YES' : '❌ NO')
console.log('  Has target_entity_id?', !!txn.target_entity_id ? '✅ YES' : '❌ NO')
console.log('  Has branch in business_context?', !!txn.business_context?.branch_id ? '✅ YES' : '❌ NO')

console.log('\n🔍 WHY RPC QUERY MIGHT FAIL:')
if (txn.transaction_type !== 'GL_JOURNAL') {
  console.log('  ❌ Transaction type is NOT GL_JOURNAL')
  console.log(`     Got: ${txn.transaction_type}`)
  console.log('     Reports query for: GL_JOURNAL')
}
if (!txn.smart_code || !txn.smart_code.includes('POSSALE')) {
  console.log('  ❌ Smart code does NOT match POSSALE pattern')
  console.log(`     Got: ${txn.smart_code}`)
  console.log('     Reports query for: HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1')
}
if (!txn.target_entity_id) {
  console.log('  ❌ target_entity_id is NULL')
  console.log('     Reports filter by target_entity_id for branch')
}

console.log('\n' + '='.repeat(60))
console.log('CHECK COMPLETE')
console.log('='.repeat(60) + '\n')
