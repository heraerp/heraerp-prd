#!/usr/bin/env node

/**
 * Update inventory levels from goods receipts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Hair Talkz organization ID
const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

async function updateInventoryFromReceipts() {
  console.log('📦 Updating Inventory from Goods Receipts...\n')

  try {
    // Get all goods receipts
    const { data: receipts } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines(*)
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction_type', 'goods_receipt')

    console.log(`Found ${receipts?.length || 0} goods receipts`)

    for (const receipt of receipts || []) {
      console.log(`\nProcessing ${receipt.transaction_code}:`)

      for (const line of receipt.universal_transaction_lines || []) {
        // Get product details
        const { data: product } = await supabase
          .from('core_entities')
          .select('*')
          .eq('id', line.entity_id)
          .single()

        if (!product) continue

        // Check if current_stock exists
        const { data: stockData } = await supabase
          .from('core_dynamic_data')
          .select('*')
          .eq('entity_id', line.entity_id)
          .eq('field_name', 'current_stock')
          .single()

        const currentStock = stockData?.field_value_number || 0
        const newStock = currentStock + line.quantity

        if (stockData) {
          // Update existing stock
          const { error } = await supabase
            .from('core_dynamic_data')
            .update({
              field_value_number: newStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', stockData.id)

          if (!error) {
            console.log(`  ✅ ${product.entity_name}: ${currentStock} → ${newStock} (+ ${line.quantity})`)
          } else {
            console.error(`  ❌ Error updating ${product.entity_name}:`, error.message)
          }
        } else {
          // Create stock record
          const { error } = await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: ORGANIZATION_ID,
              entity_id: line.entity_id,
              field_name: 'current_stock',
              field_value_number: newStock,
              smart_code: 'HERA.SALON.INV.DYN.CURR.v1',
              created_at: new Date().toISOString()
            })

          if (!error) {
            console.log(`  ✅ ${product.entity_name}: 0 → ${newStock} (+ ${line.quantity})`)
          } else {
            console.error(`  ❌ Error creating stock for ${product.entity_name}:`, error.message)
          }
        }
      }
    }

    // Show final inventory status
    console.log('\n📊 Current Inventory Status:\n')

    const { data: products } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(field_name, field_value_number)
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'product')

    const inventoryData = []
    
    for (const product of products || []) {
      let stock = 0
      let cost = 0
      
      for (const field of product.core_dynamic_data) {
        if (field.field_name === 'current_stock') stock = field.field_value_number || 0
        if (field.field_name === 'product_cost') cost = field.field_value_number || 0
      }

      if (stock > 0) {
        inventoryData.push({
          name: product.entity_name,
          sku: product.entity_code,
          stock: stock,
          value: stock * cost
        })
      }
    }

    // Sort by value
    inventoryData.sort((a, b) => b.value - a.value)

    console.log('Product                          SKU              Stock    Value (AED)')
    console.log('-'.repeat(70))

    let totalValue = 0
    for (const item of inventoryData) {
      console.log(
        `${item.name.padEnd(30)} ${item.sku.padEnd(15)} ${item.stock.toString().padStart(7)} ` +
        `${item.value.toFixed(2).padStart(12)}`
      )
      totalValue += item.value
    }

    console.log('-'.repeat(70))
    console.log(`TOTAL INVENTORY VALUE: ${totalValue.toFixed(2)} AED`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run the update
updateInventoryFromReceipts().catch(console.error)