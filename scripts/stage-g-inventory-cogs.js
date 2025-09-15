#!/usr/bin/env node

/**
 * HERA Stage G - Inventory & COGS Management
 * 
 * This script handles:
 * 1. Product COGS auto-posting configuration
 * 2. Inventory consumption tracking
 * 3. Reorder level alerts
 * 4. Automatic COGS journal entries
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

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

// Salon-specific GL accounts
const GL_ACCOUNTS = {
  COGS_PRODUCTS: '5010',        // Cost of Goods Sold - Products
  INVENTORY_PRODUCTS: '1410',    // Inventory - Retail Products
  REVENUE_PRODUCTS: '4120'       // Product Sales Revenue
}

/**
 * Step 1: Configure COGS posting rules for all products
 */
async function configureCOGSPostingRules() {
  console.log('\n📋 Configuring COGS Posting Rules...\n')

  try {
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'product')

    if (productsError) throw productsError

    console.log(`Found ${products.length} products to configure`)

    // For each product, ensure COGS posting configuration
    for (const product of products) {
      // Check if COGS configuration exists
      const { data: existingConfig } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', product.id)
        .eq('field_name', 'cogs_config')
        .single()

      if (!existingConfig) {
        // Create COGS configuration
        const cogsConfig = {
          cogs_account: GL_ACCOUNTS.COGS_PRODUCTS,
          inventory_account: GL_ACCOUNTS.INVENTORY_PRODUCTS,
          revenue_account: GL_ACCOUNTS.REVENUE_PRODUCTS,
          auto_post: true
        }

        const { error: configError } = await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: ORGANIZATION_ID,
            entity_id: product.id,
            field_name: 'cogs_config',
            field_value_text: JSON.stringify(cogsConfig),
            smart_code: 'HERA.SALON.INVENTORY.COGS.CONFIG.v1',
            created_at: new Date().toISOString()
          })

        if (configError) {
          console.error(`  ❌ Error configuring ${product.entity_name}:`, configError.message)
        } else {
          console.log(`  ✅ Configured COGS for: ${product.entity_name}`)
        }
      }
    }

    // Create Finance DNA posting rules for product sales
    const postingRules = [
      {
        organization_id: ORGANIZATION_ID,
        entity_type: 'posting_rule',
        entity_name: 'Product Sale COGS Posting',
        entity_code: 'RULE-PRODUCT-SALE-COGS',
        smart_code: 'HERA.FIN.DNA.RULE.PRODUCT.SALE.v1',
        created_at: new Date().toISOString()
      },
      {
        organization_id: ORGANIZATION_ID,
        entity_type: 'posting_rule',
        entity_name: 'Inventory Adjustment Posting',
        entity_code: 'RULE-INVENTORY-ADJUST',
        smart_code: 'HERA.FIN.DNA.RULE.INVENTORY.ADJUST.v1',
        created_at: new Date().toISOString()
      }
    ]

    for (const rule of postingRules) {
      const { data: existing } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORGANIZATION_ID)
        .eq('entity_code', rule.entity_code)
        .single()

      if (!existing) {
        const { error } = await supabase
          .from('core_entities')
          .insert(rule)

        if (error) {
          console.error(`  ❌ Error creating rule ${rule.entity_name}:`, error.message)
        } else {
          console.log(`  ✅ Created posting rule: ${rule.entity_name}`)
        }
      }
    }

  } catch (error) {
    console.error('❌ Error configuring COGS rules:', error.message)
  }
}

/**
 * Step 2: Process product sales and create COGS entries
 */
async function processProductCOGS() {
  console.log('\n💰 Processing Product COGS...\n')

  try {
    // Get all product sale transactions without COGS entries
    const { data: productSales, error: salesError } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines!inner(*)
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction_type', 'sale')
      .like('smart_code', '%PRODUCT%')
      .is('metadata->cogs_posted', null)

    if (salesError) throw salesError

    console.log(`Found ${productSales.length} product sales to process`)

    let totalCOGS = 0
    let processedCount = 0

    for (const sale of productSales) {
      // Calculate COGS for each line item
      let saleCOGS = 0
      const cogsLines = []

      for (const line of sale.universal_transaction_lines) {
        // Get product cost from dynamic data
        const { data: costData } = await supabase
          .from('core_dynamic_data')
          .select('*')
          .eq('entity_id', line.line_entity_id)
          .eq('field_name', 'product_cost')
          .single()

        if (costData) {
          const unitCost = costData.field_value_number || 0
          const lineCOGS = unitCost * line.quantity

          saleCOGS += lineCOGS
          
          cogsLines.push({
            product_id: line.line_entity_id,
            quantity: line.quantity,
            unit_cost: unitCost,
            total_cost: lineCOGS
          })
        }
      }

      if (saleCOGS > 0) {
        // Create COGS journal entry
        const cogsJournal = {
          organization_id: ORGANIZATION_ID,
          transaction_type: 'journal_entry',
          transaction_date: sale.transaction_date,
          transaction_code: `COGS-${sale.transaction_code}`,
          reference_transaction_id: sale.id,
          total_amount: saleCOGS,
          smart_code: 'HERA.FIN.GL.TXN.JE.COGS.v1',
          metadata: {
            source_transaction: sale.transaction_code,
            auto_generated: true,
            cogs_lines: cogsLines
          },
          created_at: new Date().toISOString()
        }

        const { data: journal, error: journalError } = await supabase
          .from('universal_transactions')
          .insert(cogsJournal)
          .select()
          .single()

        if (journalError) {
          console.error(`  ❌ Error creating COGS journal for ${sale.transaction_code}:`, journalError.message)
          continue
        }

        // Create journal lines
        const journalLines = [
          // Debit COGS
          {
            organization_id: ORGANIZATION_ID,
            transaction_id: journal.id,
            line_number: 1,
            line_entity_id: GL_ACCOUNTS.COGS_PRODUCTS,
            line_amount: saleCOGS,
            is_debit: true,
            smart_code: 'HERA.FIN.GL.LINE.JE.DEBIT.v1',
            metadata: {
              gl_account: GL_ACCOUNTS.COGS_PRODUCTS,
              description: 'Cost of Goods Sold'
            },
            created_at: new Date().toISOString()
          },
          // Credit Inventory
          {
            organization_id: ORGANIZATION_ID,
            transaction_id: journal.id,
            line_number: 2,
            line_entity_id: GL_ACCOUNTS.INVENTORY_PRODUCTS,
            line_amount: saleCOGS,
            is_debit: false,
            smart_code: 'HERA.FIN.GL.LINE.JE.CREDIT.v1',
            metadata: {
              gl_account: GL_ACCOUNTS.INVENTORY_PRODUCTS,
              description: 'Inventory - Retail Products'
            },
            created_at: new Date().toISOString()
          }
        ]

        const { error: linesError } = await supabase
          .from('universal_transaction_lines')
          .insert(journalLines)

        if (linesError) {
          console.error(`  ❌ Error creating journal lines:`, linesError.message)
          continue
        }

        // Update original transaction to mark COGS posted
        const { error: updateError } = await supabase
          .from('universal_transactions')
          .update({ 
            metadata: { 
              ...sale.metadata, 
              cogs_posted: true,
              cogs_journal_id: journal.id
            } 
          })
          .eq('id', sale.id)

        if (!updateError) {
          totalCOGS += saleCOGS
          processedCount++
          console.log(`  ✅ COGS posted for ${sale.transaction_code}: ${saleCOGS.toFixed(2)} AED`)
        }
      }
    }

    console.log(`\n✅ Total COGS processed: ${totalCOGS.toFixed(2)} AED (${processedCount} transactions)`)

  } catch (error) {
    console.error('❌ Error processing COGS:', error.message)
  }
}

/**
 * Step 3: Update inventory levels and check reorder points
 */
async function updateInventoryLevels() {
  console.log('\n📦 Updating Inventory Levels...\n')

  try {
    // Get all products with inventory tracking
    const { data: products, error: productsError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'product')

    if (productsError) throw productsError

    const lowStockProducts = []

    for (const product of products) {
      // Find current stock and reorder levels
      let currentStock = 0
      let reorderLevel = 0
      let safetyStock = 0

      for (const field of product.core_dynamic_data) {
        if (field.field_name === 'current_stock') {
          currentStock = field.field_value_number || 0
        } else if (field.field_name === 'reorder_level') {
          reorderLevel = field.field_value_number || 0
        } else if (field.field_name === 'safety_stock') {
          safetyStock = field.field_value_number || 0
        }
      }

      // Calculate consumed quantity from recent sales
      const { data: recentSales } = await supabase
        .from('universal_transaction_lines')
        .select('quantity')
        .eq('line_entity_id', product.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

      const weeklyConsumption = recentSales?.reduce((sum, line) => sum + (line.quantity || 0), 0) || 0

      // Update current stock based on consumption
      const newStock = Math.max(0, currentStock - weeklyConsumption)

      // Update stock level
      const { error: updateError } = await supabase
        .from('core_dynamic_data')
        .update({ 
          field_value_number: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('entity_id', product.id)
        .eq('field_name', 'current_stock')

      if (!updateError) {
        console.log(`  ✅ ${product.entity_name}: Stock updated to ${newStock} units`)

        // Check reorder point
        if (newStock <= reorderLevel) {
          lowStockProducts.push({
            product: product.entity_name,
            sku: product.entity_code,
            current_stock: newStock,
            reorder_level: reorderLevel,
            safety_stock: safetyStock,
            weekly_consumption: weeklyConsumption,
            suggested_order: Math.max(reorderLevel * 2 - newStock, weeklyConsumption * 4)
          })
        }
      }
    }

    // Create reorder alerts
    if (lowStockProducts.length > 0) {
      console.log('\n🚨 LOW STOCK ALERTS:\n')
      
      for (const item of lowStockProducts) {
        console.log(`  ⚠️  ${item.product} (${item.sku})`)
        console.log(`     Current: ${item.current_stock} | Reorder at: ${item.reorder_level}`)
        console.log(`     Weekly usage: ${item.weekly_consumption} | Suggested order: ${item.suggested_order} units`)
        
        // Create alert entity
        const alert = {
          organization_id: ORGANIZATION_ID,
          entity_type: 'inventory_alert',
          entity_name: `Low Stock Alert - ${item.product}`,
          entity_code: `ALERT-${item.sku}-${format(new Date(), 'yyyyMMdd')}`,
          smart_code: 'HERA.SALON.INVENTORY.ALERT.LOW_STOCK.v1',
          metadata: {
            product_name: item.product,
            sku: item.sku,
            current_stock: item.current_stock,
            reorder_level: item.reorder_level,
            suggested_order: item.suggested_order,
            alert_date: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('core_entities')
          .insert(alert)

        if (!error) {
          console.log(`     ✅ Alert created\n`)
        }
      }
    } else {
      console.log('\n✅ All products have adequate stock levels')
    }

  } catch (error) {
    console.error('❌ Error updating inventory levels:', error.message)
  }
}

/**
 * Step 4: Generate inventory valuation report
 */
async function generateInventoryValuation() {
  console.log('\n📊 Generating Inventory Valuation Report...\n')

  try {
    // Get all products with stock and cost data
    const { data: products, error } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'product')

    if (error) throw error

    let totalValue = 0
    const valuationData = []

    for (const product of products) {
      let currentStock = 0
      let productCost = 0
      let retailPrice = 0

      for (const field of product.core_dynamic_data) {
        if (field.field_name === 'current_stock') {
          currentStock = field.field_value_number || 0
        } else if (field.field_name === 'product_cost') {
          productCost = field.field_value_number || 0
        } else if (field.field_name === 'retail_price') {
          retailPrice = field.field_value_number || 0
        }
      }

      const stockValue = currentStock * productCost
      const retailValue = currentStock * retailPrice
      const margin = retailPrice > 0 ? ((retailPrice - productCost) / retailPrice * 100) : 0

      if (currentStock > 0) {
        valuationData.push({
          product: product.entity_name,
          sku: product.entity_code,
          quantity: currentStock,
          unit_cost: productCost,
          total_cost: stockValue,
          retail_value: retailValue,
          margin_percent: margin
        })

        totalValue += stockValue
      }
    }

    // Sort by value descending
    valuationData.sort((a, b) => b.total_cost - a.total_cost)

    console.log('INVENTORY VALUATION REPORT')
    console.log('=' .repeat(80))
    console.log()
    console.log('Product                          Qty    Unit Cost   Total Cost   Retail Value  Margin%')
    console.log('-'.repeat(80))

    for (const item of valuationData) {
      console.log(
        `${item.product.padEnd(30)} ${item.quantity.toString().padStart(5)} ` +
        `${item.unit_cost.toFixed(2).padStart(12)} ${item.total_cost.toFixed(2).padStart(12)} ` +
        `${item.retail_value.toFixed(2).padStart(13)} ${item.margin_percent.toFixed(1).padStart(8)}%`
      )
    }

    console.log('-'.repeat(80))
    console.log(`TOTAL INVENTORY VALUE: ${totalValue.toFixed(2)} AED`)
    console.log()

    // Calculate inventory turnover metrics
    const { data: monthSales } = await supabase
      .from('universal_transactions')
      .select('total_amount')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction_type', 'sale')
      .like('smart_code', '%PRODUCT%')
      .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const monthlyRevenue = monthSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0
    const annualizedCOGS = monthlyRevenue * 12 * 0.65 // Assuming 35% margin
    const inventoryTurnover = totalValue > 0 ? annualizedCOGS / totalValue : 0
    const daysInventory = inventoryTurnover > 0 ? 365 / inventoryTurnover : 0

    console.log('INVENTORY METRICS:')
    console.log(`  Monthly Product Revenue: ${monthlyRevenue.toFixed(2)} AED`)
    console.log(`  Inventory Turnover Rate: ${inventoryTurnover.toFixed(2)}x per year`)
    console.log(`  Days Inventory on Hand: ${Math.round(daysInventory)} days`)

  } catch (error) {
    console.error('❌ Error generating valuation report:', error.message)
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 HERA Stage G - Inventory & COGS Management')
  console.log('=' .repeat(60))
  console.log(`Organization: Hair Talkz Ladies Salon`)
  console.log(`Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`)
  console.log('=' .repeat(60))

  // Step 1: Configure COGS posting rules
  await configureCOGSPostingRules()

  // Step 2: Process product COGS
  await processProductCOGS()

  // Step 3: Update inventory levels and check reorder points
  await updateInventoryLevels()

  // Step 4: Generate inventory valuation report
  await generateInventoryValuation()

  console.log('\n✅ Stage G - Inventory & COGS Management Complete!')
}

// Run the script
main().catch(console.error)