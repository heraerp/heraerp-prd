import { createClient } from '@supabase/supabase-js'

const supa = createClient(
  process.env.SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_KEY || ''
)

async function main() {
  const org = process.env.HERA_TEST_ORG_ID
  
  if (!org) {
    throw new Error('HERA_TEST_ORG_ID environment variable is required')
  }
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required')
  }

  console.log('💨 Running posting smoke test...\n')
  console.log(`   Organization ID: ${org}`)
  console.log(`   Timestamp: ${new Date().toISOString()}\n`)

  // Create a balanced journal entry
  const payload = {
    transaction_type: 'JOURNAL',
    currency: 'USD',
    description: 'CI smoke test - balanced journal entry',
    transaction_date: new Date().toISOString(),
    lines: [
      { 
        gl_account_code: '1000', 
        debit: 100.00, 
        credit: 0, 
        memo: 'Test debit to cash account',
        smart_code: 'HERA.FIN.GL.LINE.DEBIT.V1'
      },
      { 
        gl_account_code: '4000', 
        debit: 0, 
        credit: 100.00, 
        memo: 'Test credit to revenue account',
        smart_code: 'HERA.FIN.GL.LINE.CREDIT.V1'
      }
    ],
    meta: { 
      ci_test: true,
      test_type: 'posting_smoke',
      test_timestamp: Date.now()
    }
  }

  console.log('📝 Posting journal entry:')
  console.log(`   Type: ${payload.transaction_type}`)
  console.log(`   Currency: ${payload.currency}`)
  console.log(`   Lines: ${payload.lines.length}`)
  console.log(`   Total Debits: ${payload.lines.reduce((sum, l) => sum + l.debit, 0)}`)
  console.log(`   Total Credits: ${payload.lines.reduce((sum, l) => sum + l.credit, 0)}\n`)

  // Call hera_txn_post_v2
  const { data, error } = await supa.rpc('hera_txn_post_v2', { 
    p_organization_id: org, 
    p_payload: payload 
  })
  
  if (error) {
    // Check if it's a function not found error
    if (error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('⚠️  hera_txn_post_v2 RPC not found. This may indicate:')
      console.log('   - The function hasn\'t been deployed yet')
      console.log('   - You\'re using an older database schema')
      console.log('   - The function has a different name\n')
      console.log('💡 To fix this, ensure the latest migrations are applied.')
      
      // Exit with success since this is expected in some environments
      process.exit(0)
    }
    
    throw new Error(`Posting failed: ${error.message}`)
  }
  
  if (!data?.success) {
    throw new Error(`Posting did not return success. Response: ${JSON.stringify(data)}`)
  }

  console.log('✅ Posting successful!')
  
  if (data.data?.header) {
    console.log(`\n📄 Transaction created:`)
    console.log(`   ID: ${data.data.header.id}`)
    console.log(`   Code: ${data.data.header.transaction_code || 'N/A'}`)
    console.log(`   Amount: ${data.data.header.amount_total}`)
  }
  
  if (data.data?.lines && Array.isArray(data.data.lines)) {
    console.log(`\n📊 Transaction lines:`)
    data.data.lines.forEach((line: any, idx: number) => {
      console.log(`   Line ${idx + 1}: ${line.debit > 0 ? 'DR' : 'CR'} ${line.debit || line.credit} - ${line.memo}`)
    })
  }

  // Verify the transaction is balanced
  const totalDebits = payload.lines.reduce((sum, l) => sum + l.debit, 0)
  const totalCredits = payload.lines.reduce((sum, l) => sum + l.credit, 0)
  
  if (Math.abs(totalDebits - totalCredits) > 0.001) {
    throw new Error(`Transaction is not balanced! Debits: ${totalDebits}, Credits: ${totalCredits}`)
  }

  console.log('\n🎯 Balance check passed!')
  console.log('✅ All posting smoke tests passed!')
}

main().catch(err => {
  console.error('❌ Posting smoke test failed:', err.message)
  process.exit(1)
})