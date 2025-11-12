#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function diagnoseCustomerTransactions() {
  console.log('\n🔍 DIAGNOSING CUSTOMER TRANSACTIONS\n')

  const CORRECT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  const WRONG_ORG_ID = '30c9841b-0472-4dc3-82af-6290192255ba'

  try {
    // Check transactions in BOTH organizations
    console.log('📊 Transactions by Organization:\n')

    const { data: correctOrgTxns } = await supabase
      .from('universal_transactions')
      .select('id, transaction_type, source_entity_id, created_at')
      .eq('organization_id', CORRECT_ORG_ID)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: wrongOrgTxns } = await supabase
      .from('universal_transactions')
      .select('id, transaction_type, source_entity_id, created_at')
      .eq('organization_id', WRONG_ORG_ID)
      .order('created_at', { ascending: false })
      .limit(10)

    console.log(`✅ CORRECT Org (${CORRECT_ORG_ID.slice(0, 8)}...):`  )
    console.log(`   ${correctOrgTxns?.length || 0} recent transactions`)

    console.log(`\n❌ WRONG Org (${WRONG_ORG_ID.slice(0, 8)}...):\n`)
    console.log(`   ${wrongOrgTxns?.length || 0} recent transactions`)

    if (wrongOrgTxns && wrongOrgTxns.length > 0) {
      console.log('\n🚨 FOUND TRANSACTIONS IN WRONG ORG!')
      console.log('These are TEST transactions with entity_id: null\n')

      // Check lines for wrong org transactions
      for (const txn of wrongOrgTxns.slice(0, 2)) {
        console.log(`\n  Transaction: ${txn.transaction_type} (${txn.created_at})`)

        const { data: lines } = await supabase
          .from('universal_transaction_lines')
          .select('line_number, line_type, entity_id, description')
          .eq('transaction_id', txn.id)

        console.log(`    Lines: ${lines?.length || 0}`)
        lines?.forEach(line => {
          console.log(`      L${line.line_number}: ${line.line_type} - entity_id: ${line.entity_id || 'NULL'} - desc: ${line.description || 'NULL'}`)
        })
      }
    }

    // Get a customer from correct org
    console.log('\n📊 Sample Customer Transaction Analysis:\n')
    const { data: customer } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', CORRECT_ORG_ID)
      .eq('entity_type', 'CUSTOMER')
      .limit(1)
      .single()

    if (customer) {
      console.log(`  Customer: ${customer.entity_name} (${customer.id})\n`)

      // Get their transactions
      const { data: custTxns } = await supabase
        .from('universal_transactions')
        .select('id, transaction_type, transaction_code, created_at')
        .eq('organization_id', CORRECT_ORG_ID)
        .eq('source_entity_id', customer.id)
        .order('created_at', { ascending: false})
        .limit(5)

      console.log(`  Transactions: ${custTxns?.length || 0}\n`)

      for (const txn of (custTxns || [])) {
        console.log(`    ${txn.transaction_type} - ${txn.transaction_code || 'NO CODE'} (${txn.created_at})`)

        const { data: lines } = await supabase
          .from('universal_transaction_lines')
          .select('line_number, line_type, entity_id, description')
          .eq('transaction_id', txn.id)
          .eq('line_type', 'service')

        console.log(`      Service lines: ${lines?.length || 0}`)
        lines?.forEach(line => {
          const hasEntityId = line.entity_id !== null
          const hasDescription = line.description !== null
          console.log(`        L${line.line_number}: entity_id: ${hasEntityId ? '✅ YES' : '❌ NULL'}, description: ${hasDescription ? '✅ ' + line.description : '❌ NULL'}`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

diagnoseCustomerTransactions()
