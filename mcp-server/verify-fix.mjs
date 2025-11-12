#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyFix() {
  const CORRECT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

  console.log('\n🔍 VERIFYING FIX - Testing RPC Function\n')

  // Call the RPC function the same way the frontend does
  const { data, error } = await supabase.rpc('hera_txn_query_v1', {
    p_org_id: CORRECT_ORG_ID,
    p_filters: {
      transaction_type: 'SALE',
      include_lines: true,
      limit: 1
    }
  })

  if (error) {
    console.error('❌ RPC Error:', error)
    return
  }

  console.log('✅ RPC Response Structure:')
  console.log('  success:', data.success)
  console.log('  action:', data.action)
  console.log('  items count:', data.data.items.length)

  if (data.data.items.length > 0) {
    const firstTxn = data.data.items[0]
    console.log('\n📊 First Transaction:')
    console.log('  ID:', firstTxn.id)
    console.log('  Type:', firstTxn.transaction_type)
    console.log('  Code:', firstTxn.transaction_code)
    console.log('  Lines:', firstTxn.lines?.length || 0)

    if (firstTxn.lines && firstTxn.lines.length > 0) {
      console.log('\n📋 Transaction Lines:')
      firstTxn.lines.forEach((line, idx) => {
        console.log(`\n  Line ${idx + 1}:`)
        console.log(`    line_type: ${line.line_type}`)
        console.log(`    entity_id: ${line.entity_id || 'NULL'} ${line.entity_id ? '✅' : '❌'}`)
        console.log(`    description: ${line.description || 'NULL'} ${line.description ? '✅' : '❌'}`)
        console.log(`    quantity: ${line.quantity}`)
        console.log(`    unit_amount: ${line.unit_amount}`)
        console.log(`    line_amount: ${line.line_amount}`)
      })

      // Check if fix worked
      const serviceLines = firstTxn.lines.filter(l => l.line_type === 'service')
      const hasEntityId = serviceLines.some(l => l.entity_id !== null)
      const hasDescription = serviceLines.some(l => l.description !== null)

      console.log('\n🎯 FIX VERIFICATION:')
      if (hasEntityId && hasDescription) {
        console.log('  ✅ FIX SUCCESSFUL - Service lines have entity_id and description!')
      } else {
        console.log('  ❌ FIX FAILED - Service lines still have NULL values')
        console.log(`     entity_id present: ${hasEntityId}`)
        console.log(`     description present: ${hasDescription}`)
      }
    }
  } else {
    console.log('\n⚠️ No SALE transactions found to verify')
  }
}

verifyFix()
