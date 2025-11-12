#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTransactionLines() {
  console.log('\n🔍 CHECKING TRANSACTION LINES IN DATABASE\n')

  try {
    // Step 1: Get ALL recent transactions (any type)
    console.log('📊 Step 1: Finding most recent transactions...')
    const { data: recentTxns, error: txnError } = await supabase
      .from('universal_transactions')
      .select('id, transaction_type, transaction_code, transaction_date, total_amount, source_entity_id, target_entity_id')
      .eq('organization_id', process.env.DEFAULT_ORGANIZATION_ID)
      .order('created_at', { ascending: false })
      .limit(10)

    if (txnError) {
      console.error('❌ Error fetching transactions:', txnError)
      return
    }

    if (!recentTxns || recentTxns.length === 0) {
      console.log('❌ No transactions found in database!')
      return
    }

    console.log(`\n✅ Found ${recentTxns.length} recent transactions:`)
    recentTxns.forEach((txn, idx) => {
      console.log(`  ${idx + 1}. ${txn.transaction_type} - ${txn.transaction_code} (${txn.transaction_date})`)
    })

    // Pick the most recent transaction
    const mostRecent = recentTxns[0]
    console.log(`\n🎯 Analyzing most recent transaction: ${mostRecent.transaction_code}`)
    console.log(JSON.stringify(mostRecent, null, 2))

    // Step 2: Get transaction lines for this transaction
    console.log('\n📊 Step 2: Fetching transaction lines...')
    const { data: lines, error: linesError } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .eq('transaction_id', mostRecent.id)
      .order('line_number', { ascending: true })

    if (linesError) {
      console.error('❌ Error fetching transaction lines:', linesError)
      return
    }

    console.log(`\n✅ Found ${lines.length} transaction lines:`)
    lines.forEach((line, idx) => {
      console.log(`\n📋 Line ${idx + 1}:`)
      console.log('  line_number:', line.line_number)
      console.log('  line_type:', line.line_type)
      console.log('  entity_id:', line.entity_id)
      console.log('  description:', line.description)
      console.log('  quantity:', line.quantity)
      console.log('  unit_amount:', line.unit_amount)
      console.log('  line_amount:', line.line_amount)
      console.log('  line_data:', JSON.stringify(line.line_data, null, 2))
      console.log('  smart_code:', line.smart_code)
    })

    // Step 3: If entity_id is null, check if service entities exist
    if (lines.some(line => line.entity_id === null)) {
      console.log('\n⚠️ WARNING: Some lines have NULL entity_id')
      console.log('\n📊 Step 3: Checking if service entities exist in database...')

      const { data: services, error: servicesError } = await supabase
        .from('core_entities')
        .select('id, entity_name, entity_type')
        .eq('entity_type', 'service')
        .eq('organization_id', process.env.DEFAULT_ORGANIZATION_ID)
        .limit(5)

      if (servicesError) {
        console.error('❌ Error fetching services:', servicesError)
      } else {
        console.log(`\n✅ Found ${services.length} service entities (sample):`)
        services.forEach(service => {
          console.log(`  - ${service.entity_name} (ID: ${service.id})`)
        })
      }
    }

    // Step 4: Check if description field has any data
    console.log('\n📊 Step 4: Summary of transaction line data quality:')
    const nullEntityIds = lines.filter(line => line.entity_id === null).length
    const nullDescriptions = lines.filter(line => line.description === null).length
    const nullAmounts = lines.filter(line => line.line_amount === null).length

    console.log(`  Total lines: ${lines.length}`)
    console.log(`  Lines with NULL entity_id: ${nullEntityIds}`)
    console.log(`  Lines with NULL description: ${nullDescriptions}`)
    console.log(`  Lines with NULL line_amount: ${nullAmounts}`)

    if (nullEntityIds > 0 || nullDescriptions > 0 || nullAmounts > 0) {
      console.log('\n🚨 CRITICAL: Transaction lines are missing essential data in database!')
      console.log('This confirms data is NOT being written correctly by the RPC function.')
    } else {
      console.log('\n✅ All transaction lines have complete data in database.')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkTransactionLines()
