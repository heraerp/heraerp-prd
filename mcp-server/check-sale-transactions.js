#!/usr/bin/env node
/**
 * Check recent SALE transactions for branch information
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSaleTransactions() {
  console.log('🔍 Checking recent SALE transactions...\n')

  try {
    // Get recent sale transactions (both uppercase and lowercase)
    const { data: transactions, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .or('transaction_type.eq.SALE,transaction_type.eq.sale')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    if (!transactions || transactions.length === 0) {
      console.log('⚠️  No SALE transactions found\n')
      return
    }

    console.log(`✅ Found ${transactions.length} SALE transactions:\n`)
    console.log('='.repeat(120))

    // Cache for branch lookups
    const branchCache = {}

    for (const txn of transactions) {
      console.log(`\n💰 Transaction: ${txn.transaction_code || txn.id}`)
      console.log(`   ID: ${txn.id}`)
      console.log(`   Type: ${txn.transaction_type}`)
      console.log(`   Created: ${new Date(txn.created_at).toLocaleString()}`)
      console.log(`   Total Amount: AED ${txn.total_amount?.toFixed(2) || '0.00'}`)
      console.log(`   Status: ${txn.transaction_status}`)

      // Check target_entity_id (should be branch)
      const branch_id = txn.target_entity_id
      console.log(`\n   🎯 target_entity_id: ${branch_id || 'NULL'}`)

      if (branch_id) {
        // Look up branch details (use cache)
        if (!branchCache[branch_id]) {
          const { data: branch, error: branchError } = await supabase
            .from('core_entities')
            .select('entity_name, entity_type')
            .eq('id', branch_id)
            .maybeSingle()

          if (!branchError && branch) {
            // Get branch address
            const { data: addressData, error: addressError } = await supabase
              .from('core_dynamic_data')
              .select('field_value_text')
              .eq('entity_id', branch_id)
              .eq('field_name', 'address')
              .maybeSingle()

            branchCache[branch_id] = {
              name: branch.entity_name,
              type: branch.entity_type,
              address: addressData?.field_value_text || 'No address'
            }
          } else {
            branchCache[branch_id] = { name: 'ENTITY NOT FOUND', type: 'N/A', address: 'N/A' }
          }
        }

        const branchInfo = branchCache[branch_id]
        console.log(`   🏢 Branch Name: ${branchInfo.name}`)
        console.log(`   🏢 Entity Type: ${branchInfo.type}`)
        console.log(`   📍 Address: "${branchInfo.address}"`)

        // Check for address issues
        if (branchInfo.address && branchInfo.address !== 'No address') {
          const addressLen = branchInfo.address.length
          const hotelCount = (branchInfo.address.match(/Hotel/gi) || []).length

          if (addressLen > 150) {
            console.log(`   🚨 WARNING: Very long address (${addressLen} chars)`)
          }
          if (hotelCount > 1) {
            console.log(`   🚨 ISSUE: Multiple "Hotel" references (${hotelCount}) - likely concatenated!`)
          }
        }
      } else {
        console.log(`   ⚠️  No target_entity_id (branch) set!`)
      }

      // Check source_entity_id (should be customer)
      const customer_id = txn.source_entity_id
      console.log(`\n   👤 source_entity_id: ${customer_id || 'NULL'}`)

      if (customer_id) {
        const { data: customer, error: custError } = await supabase
          .from('core_entities')
          .select('entity_name, entity_type')
          .eq('id', customer_id)
          .maybeSingle()

        if (!custError && customer) {
          console.log(`   👤 Customer: ${customer.entity_name} (${customer.entity_type})`)
        }
      }

      // Check business_context for additional branch info
      if (txn.business_context) {
        console.log(`\n   📋 business_context:`)
        const bc = txn.business_context
        if (bc.branch_id) console.log(`      branch_id: ${bc.branch_id}`)
        if (bc.branch_name) console.log(`      branch_name: ${bc.branch_name}`)
      }

      // Check metadata
      if (txn.metadata) {
        console.log(`\n   📋 metadata keys: ${Object.keys(txn.metadata).join(', ')}`)
        if (txn.metadata.branch_id) console.log(`      metadata.branch_id: ${txn.metadata.branch_id}`)
        if (txn.metadata.branch_name) console.log(`      metadata.branch_name: ${txn.metadata.branch_name}`)
      }

      // Get transaction lines
      const { data: lines, error: linesError } = await supabase
        .from('universal_transaction_lines')
        .select('line_type, line_amount, description')
        .eq('transaction_id', txn.id)
        .order('line_number')

      if (!linesError && lines && lines.length > 0) {
        console.log(`\n   📜 Transaction Lines (${lines.length} total):`)

        const linesByType = {}
        lines.forEach(line => {
          if (!linesByType[line.line_type]) {
            linesByType[line.line_type] = { count: 0, total: 0 }
          }
          linesByType[line.line_type].count++
          linesByType[line.line_type].total += line.line_amount || 0
        })

        Object.entries(linesByType).forEach(([type, info]) => {
          console.log(`      ${type}: ${info.count} lines, AED ${info.total.toFixed(2)}`)
        })

        // Calculate what the total SHOULD be (excluding payment lines)
        const customerTotal = lines
          .filter(l => l.line_type !== 'payment' && l.line_type !== 'commission')
          .reduce((sum, l) => sum + (l.line_amount || 0), 0)

        const storedTotal = txn.total_amount || 0
        const difference = storedTotal - customerTotal

        console.log(`\n   💡 Revenue Calculation:`)
        console.log(`      Customer-facing total: AED ${customerTotal.toFixed(2)}`)
        console.log(`      Stored total_amount: AED ${storedTotal.toFixed(2)}`)
        if (Math.abs(difference) > 0.01) {
          console.log(`      ⚠️  Difference: AED ${difference.toFixed(2)}`)
          if (Math.abs(difference - customerTotal) < 1) {
            console.log(`      🚨 DOUBLED! Payment lines likely included in total`)
          }
        } else {
          console.log(`      ✅ Totals match!`)
        }
      }

      console.log('\n' + '-'.repeat(120))
    }

    // Summary
    console.log('\n' + '='.repeat(120))
    console.log('\n📊 Summary:')
    console.log(`   Total transactions checked: ${transactions.length}`)

    const withBranch = transactions.filter(t => t.target_entity_id).length
    const withoutBranch = transactions.length - withBranch

    console.log(`   ✅ With branch (target_entity_id): ${withBranch}`)
    console.log(`   ⚠️  Without branch: ${withoutBranch}`)

    // Check for unique branches used
    const uniqueBranches = [...new Set(transactions.map(t => t.target_entity_id).filter(Boolean))]
    console.log(`   🏢 Unique branches: ${uniqueBranches.length}`)
    uniqueBranches.forEach(branchId => {
      const info = branchCache[branchId]
      if (info) {
        console.log(`      • ${info.name}`)
      }
    })

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

checkSaleTransactions()
