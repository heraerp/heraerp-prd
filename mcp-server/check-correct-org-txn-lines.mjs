#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkCorrectOrgTransactionLines() {
  console.log('\n🔍 CHECKING TRANSACTION LINES IN CORRECT ORGANIZATION\n')

  const CORRECT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

  try {
    // Get most recent SALE transaction
    const { data: recentSale, error: txnError } = await supabase
      .from('universal_transactions')
      .select('id, transaction_type, transaction_code, transaction_date, total_amount')
      .eq('organization_id', CORRECT_ORG_ID)
      .eq('transaction_type', 'SALE')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (txnError) {
      console.error('❌ Error fetching transaction:', txnError)
      return
    }

    console.log('✅ Most recent SALE transaction:')
    console.log(JSON.stringify(recentSale, null, 2))

    // Get transaction lines
    const { data: lines, error: linesError } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .eq('transaction_id', recentSale.id)
      .order('line_number', { ascending: true })

    if (linesError) {
      console.error('❌ Error fetching lines:', linesError)
      return
    }

    console.log(`\n✅ Found ${lines.length} transaction lines:\n`)

    lines.forEach((line, idx) => {
      console.log(`📋 Line ${idx + 1}:`)
      console.log(`  line_number: ${line.line_number}`)
      console.log(`  line_type: ${line.line_type}`)
      console.log(`  entity_id: ${line.entity_id}`)
      console.log(`  description: ${line.description}`)
      console.log(`  quantity: ${line.quantity}`)
      console.log(`  unit_amount: ${line.unit_amount}`)
      console.log(`  line_amount: ${line.line_amount}`)
      console.log(`  line_data: ${JSON.stringify(line.line_data, null, 2)}`)
      console.log(`  smart_code: ${line.smart_code}\n`)
    })

    // Check if entity_id can be resolved to service name
    const entityIds = lines.map(l => l.entity_id).filter(Boolean)
    if (entityIds.length > 0) {
      console.log('🔍 Resolving entity_id to service names:\n')

      const { data: services, error: servicesError } = await supabase
        .from('core_entities')
        .select('id, entity_name')
        .in('id', entityIds)

      if (servicesError) {
        console.error('❌ Error fetching services:', servicesError)
      } else {
        services.forEach(s => {
          console.log(`  ✅ ${s.id} → ${s.entity_name}`)
        })
      }
    } else {
      console.log('❌ No entity_id values to resolve (all NULL)')
    }

    // Summary
    console.log('\n📊 Transaction Line Data Quality Summary:')
    const nullEntityIds = lines.filter(l => l.entity_id === null).length
    const nullDescriptions = lines.filter(l => l.description === null).length
    const nullAmounts = lines.filter(l => l.line_amount === null).length

    console.log(`  Total lines: ${lines.length}`)
    console.log(`  Lines with NULL entity_id: ${nullEntityIds} ${nullEntityIds > 0 ? '❌' : '✅'}`)
    console.log(`  Lines with NULL description: ${nullDescriptions} ${nullDescriptions > 0 ? '❌' : '✅'}`)
    console.log(`  Lines with NULL line_amount: ${nullAmounts} ${nullAmounts > 0 ? '❌' : '✅'}`)

    if (nullEntityIds > 0) {
      console.log('\n🚨 CRITICAL: entity_id is NULL - services cannot be resolved!')
      console.log('This is why customer history shows "Service" instead of actual service names.')
    } else {
      console.log('\n✅ All transaction lines have entity_id - resolution should work!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkCorrectOrgTransactionLines()
