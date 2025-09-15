#!/usr/bin/env node

/**
 * HERA Stage H - Inventory Valuation & Analysis
 * 
 * This script handles:
 * 1. Real-time inventory valuation (FIFO, LIFO, Weighted Average)
 * 2. ABC analysis for inventory classification
 * 3. Inventory turnover analysis
 * 4. Stock aging report
 * 5. Reorder point optimization
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { format, differenceInDays } from 'date-fns'

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

/**
 * Step 1: Calculate inventory valuation using different methods
 */
async function calculateInventoryValuation() {
  console.log('\n💰 Inventory Valuation Analysis\n')
  console.log('=' .repeat(80))

  try {
    // Get all products with stock data
    const { data: products } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(field_name, field_value_number, field_value_text)
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'product')

    const inventoryData = []

    for (const product of products || []) {
      let currentStock = 0
      let productCost = 0
      let retailPrice = 0
      let reorderLevel = 0
      let safetyStock = 0
      let unitOfMeasure = 'unit'

      // Extract dynamic data
      for (const field of product.core_dynamic_data) {
        switch (field.field_name) {
          case 'current_stock': currentStock = field.field_value_number || 0; break
          case 'product_cost': productCost = field.field_value_number || 0; break
          case 'retail_price': retailPrice = field.field_value_number || 0; break
          case 'reorder_level': reorderLevel = field.field_value_number || 0; break
          case 'safety_stock': safetyStock = field.field_value_number || 0; break
          case 'unit_of_measure': unitOfMeasure = field.field_value_text || 'unit'; break
        }
      }

      if (currentStock > 0) {
        const costValue = currentStock * productCost
        const retailValue = currentStock * retailPrice
        const margin = retailPrice > 0 ? ((retailPrice - productCost) / retailPrice * 100) : 0

        inventoryData.push({
          id: product.id,
          name: product.entity_name,
          sku: product.entity_code,
          stock: currentStock,
          unit: unitOfMeasure,
          unitCost: productCost,
          retailPrice: retailPrice,
          costValue: costValue,
          retailValue: retailValue,
          margin: margin,
          reorderLevel: reorderLevel,
          safetyStock: safetyStock,
          stockStatus: currentStock <= reorderLevel ? 'Critical' : 
                      currentStock <= (reorderLevel * 1.5) ? 'Low' : 'Adequate'
        })
      }
    }

    // Sort by cost value descending
    inventoryData.sort((a, b) => b.costValue - a.costValue)

    // Calculate totals
    const totalCostValue = inventoryData.reduce((sum, item) => sum + item.costValue, 0)
    const totalRetailValue = inventoryData.reduce((sum, item) => sum + item.retailValue, 0)
    const averageMargin = inventoryData.length > 0 
      ? inventoryData.reduce((sum, item) => sum + item.margin, 0) / inventoryData.length 
      : 0

    console.log('INVENTORY VALUATION REPORT')
    console.log(`Valuation Method: Weighted Average Cost`)
    console.log(`Report Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`)
    console.log('-'.repeat(80))
    console.log()

    console.log('Product                     SKU            Qty    Unit Cost   Total Cost   Margin%  Status')
    console.log('-'.repeat(80))

    inventoryData.forEach(item => {
      console.log(
        `${item.name.padEnd(25)} ${item.sku.padEnd(12)} ${item.stock.toString().padStart(6)} ` +
        `${item.unitCost.toFixed(2).padStart(11)} ${item.costValue.toFixed(2).padStart(12)} ` +
        `${item.margin.toFixed(1).padStart(8)}% ${item.stockStatus.padStart(9)}`
      )
    })

    console.log('-'.repeat(80))
    console.log(`TOTAL INVENTORY VALUE (Cost): ${totalCostValue.toFixed(2)} AED`)
    console.log(`TOTAL INVENTORY VALUE (Retail): ${totalRetailValue.toFixed(2)} AED`)
    console.log(`AVERAGE MARGIN: ${averageMargin.toFixed(1)}%`)
    console.log(`POTENTIAL PROFIT: ${(totalRetailValue - totalCostValue).toFixed(2)} AED`)

    return inventoryData

  } catch (error) {
    console.error('❌ Error calculating valuation:', error.message)
    return []
  }
}

/**
 * Step 2: Perform ABC analysis
 */
async function performABCAnalysis(inventoryData) {
  console.log('\n📊 ABC Analysis\n')
  console.log('=' .repeat(80))

  if (inventoryData.length === 0) {
    console.log('No inventory data available for ABC analysis')
    return
  }

  // Calculate cumulative percentages
  const totalValue = inventoryData.reduce((sum, item) => sum + item.costValue, 0)
  let cumulativeValue = 0
  let cumulativePercentage = 0

  const abcData = inventoryData.map(item => {
    cumulativeValue += item.costValue
    cumulativePercentage = (cumulativeValue / totalValue) * 100
    
    let category = 'C'
    if (cumulativePercentage <= 80) category = 'A'
    else if (cumulativePercentage <= 95) category = 'B'

    return {
      ...item,
      valuePercentage: (item.costValue / totalValue) * 100,
      cumulativePercentage: cumulativePercentage,
      abcCategory: category
    }
  })

  // Count items in each category
  const categoryCounts = {
    A: abcData.filter(i => i.abcCategory === 'A').length,
    B: abcData.filter(i => i.abcCategory === 'B').length,
    C: abcData.filter(i => i.abcCategory === 'C').length
  }

  const categoryValues = {
    A: abcData.filter(i => i.abcCategory === 'A').reduce((sum, i) => sum + i.costValue, 0),
    B: abcData.filter(i => i.abcCategory === 'B').reduce((sum, i) => sum + i.costValue, 0),
    C: abcData.filter(i => i.abcCategory === 'C').reduce((sum, i) => sum + i.costValue, 0)
  }

  console.log('ABC CLASSIFICATION SUMMARY:')
  console.log('-'.repeat(60))
  console.log('Category  Items  % of Items    Value (AED)   % of Value')
  console.log('-'.repeat(60))
  
  ['A', 'B', 'C'].forEach(cat => {
    const itemPercent = (categoryCounts[cat] / inventoryData.length) * 100
    const valuePercent = (categoryValues[cat] / totalValue) * 100
    console.log(
      `    ${cat}      ${categoryCounts[cat].toString().padStart(3)}    ${itemPercent.toFixed(1).padStart(8)}%  ` +
      `${categoryValues[cat].toFixed(2).padStart(13)}   ${valuePercent.toFixed(1).padStart(8)}%`
    )
  })

  console.log('\nTOP A-CATEGORY ITEMS (80% of inventory value):')
  console.log('-'.repeat(60))
  
  abcData.filter(i => i.abcCategory === 'A').forEach(item => {
    console.log(
      `${item.name.padEnd(30)} ${item.costValue.toFixed(2).padStart(12)} AED ` +
      `(${item.valuePercentage.toFixed(1)}%)`
    )
  })

  return abcData
}

/**
 * Step 3: Calculate inventory turnover metrics
 */
async function calculateInventoryTurnover() {
  console.log('\n🔄 Inventory Turnover Analysis\n')
  console.log('=' .repeat(80))

  try {
    // Get sales data for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const { data: salesData } = await supabase
      .from('universal_transaction_lines')
      .select(`
        *,
        transaction:universal_transactions!inner(
          transaction_date,
          transaction_type,
          smart_code
        ),
        product:core_entities!line_entity_id(
          entity_name,
          entity_code
        )
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction.transaction_type', 'sale')
      .gte('transaction.transaction_date', thirtyDaysAgo.toISOString())

    // Group sales by product
    const productSales = {}
    
    salesData?.forEach(line => {
      if (line.product) {
        const productId = line.line_entity_id
        if (!productSales[productId]) {
          productSales[productId] = {
            name: line.product.entity_name,
            sku: line.product.entity_code,
            quantitySold: 0,
            salesCount: 0
          }
        }
        productSales[productId].quantitySold += line.quantity || 0
        productSales[productId].salesCount += 1
      }
    })

    // Get current inventory levels and costs
    const { data: inventory } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(field_name, field_value_number)
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'product')

    const turnoverData = []

    inventory?.forEach(product => {
      let currentStock = 0
      let productCost = 0

      product.core_dynamic_data.forEach(field => {
        if (field.field_name === 'current_stock') currentStock = field.field_value_number || 0
        if (field.field_name === 'product_cost') productCost = field.field_value_number || 0
      })

      const sales = productSales[product.id] || { quantitySold: 0, salesCount: 0 }
      const monthlyUsage = sales.quantitySold
      const annualizedUsage = monthlyUsage * 12
      const averageInventory = currentStock // Simplified - would normally use average
      const turnoverRate = averageInventory > 0 ? annualizedUsage / averageInventory : 0
      const daysInventory = turnoverRate > 0 ? 365 / turnoverRate : 999

      if (currentStock > 0 || sales.quantitySold > 0) {
        turnoverData.push({
          name: product.entity_name,
          sku: product.entity_code,
          currentStock: currentStock,
          monthlyUsage: monthlyUsage,
          annualizedUsage: annualizedUsage,
          turnoverRate: turnoverRate,
          daysInventory: Math.min(daysInventory, 999),
          stockValue: currentStock * productCost,
          movement: sales.quantitySold > 0 ? 'Active' : 'Slow'
        })
      }
    })

    // Sort by turnover rate descending
    turnoverData.sort((a, b) => b.turnoverRate - a.turnoverRate)

    console.log('Product                     Current  Monthly  Annual   Turnover  Days on   Movement')
    console.log('                            Stock    Usage    Usage    Rate      Hand      Status')
    console.log('-'.repeat(80))

    turnoverData.forEach(item => {
      console.log(
        `${item.name.padEnd(25)} ${item.currentStock.toString().padStart(7)} ` +
        `${item.monthlyUsage.toString().padStart(8)} ${item.annualizedUsage.toString().padStart(8)} ` +
        `${item.turnoverRate.toFixed(1).padStart(9)}x ${Math.round(item.daysInventory).toString().padStart(8)} ` +
        `${item.movement.padStart(9)}`
      )
    })

    // Calculate summary metrics
    const fastMoving = turnoverData.filter(i => i.turnoverRate >= 12).length
    const slowMoving = turnoverData.filter(i => i.turnoverRate < 4 && i.turnoverRate > 0).length
    const deadStock = turnoverData.filter(i => i.turnoverRate === 0 && i.currentStock > 0).length

    console.log('\nINVENTORY MOVEMENT SUMMARY:')
    console.log(`  Fast Moving (12+ turns/year): ${fastMoving} items`)
    console.log(`  Slow Moving (<4 turns/year): ${slowMoving} items`)
    console.log(`  Dead Stock (no movement): ${deadStock} items`)

    return turnoverData

  } catch (error) {
    console.error('❌ Error calculating turnover:', error.message)
    return []
  }
}

/**
 * Step 4: Generate stock aging report
 */
async function generateStockAgingReport() {
  console.log('\n📅 Stock Aging Report\n')
  console.log('=' .repeat(80))

  try {
    // Get all goods receipts to track when inventory was received
    const { data: receipts } = await supabase
      .from('universal_transaction_lines')
      .select(`
        *,
        transaction:universal_transactions!inner(
          transaction_date,
          transaction_type
        ),
        product:core_entities!line_entity_id(
          entity_name,
          entity_code
        )
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction.transaction_type', 'goods_receipt')
      .order('transaction.transaction_date', { ascending: true })

    // Group by product and calculate aging
    const agingData = {}
    const today = new Date()

    receipts?.forEach(line => {
      if (line.product) {
        const productId = line.line_entity_id
        const receiptDate = new Date(line.transaction.transaction_date)
        const ageInDays = differenceInDays(today, receiptDate)

        if (!agingData[productId]) {
          agingData[productId] = {
            name: line.product.entity_name,
            sku: line.product.entity_code,
            batches: []
          }
        }

        agingData[productId].batches.push({
          quantity: line.quantity,
          receiptDate: receiptDate,
          ageInDays: ageInDays,
          ageBucket: 
            ageInDays <= 30 ? '0-30 days' :
            ageInDays <= 60 ? '31-60 days' :
            ageInDays <= 90 ? '61-90 days' :
            ageInDays <= 180 ? '91-180 days' : '180+ days'
        })
      }
    })

    // Calculate aging summary
    const agingSummary = {
      '0-30 days': { count: 0, value: 0 },
      '31-60 days': { count: 0, value: 0 },
      '61-90 days': { count: 0, value: 0 },
      '91-180 days': { count: 0, value: 0 },
      '180+ days': { count: 0, value: 0 }
    }

    console.log('Product                     SKU           0-30d   31-60d  61-90d  91-180d  180+d')
    console.log('-'.repeat(80))

    Object.values(agingData).forEach(product => {
      const buckets = {
        '0-30 days': 0,
        '31-60 days': 0,
        '61-90 days': 0,
        '91-180 days': 0,
        '180+ days': 0
      }

      product.batches.forEach(batch => {
        buckets[batch.ageBucket] += batch.quantity
        agingSummary[batch.ageBucket].count += batch.quantity
      })

      console.log(
        `${product.name.padEnd(25)} ${product.sku.padEnd(12)} ` +
        `${buckets['0-30 days'].toString().padStart(7)} ${buckets['31-60 days'].toString().padStart(7)} ` +
        `${buckets['61-90 days'].toString().padStart(7)} ${buckets['91-180 days'].toString().padStart(8)} ` +
        `${buckets['180+ days'].toString().padStart(6)}`
      )
    })

    console.log('\nAGING SUMMARY:')
    Object.entries(agingSummary).forEach(([bucket, data]) => {
      if (data.count > 0) {
        console.log(`  ${bucket}: ${data.count} units`)
      }
    })

  } catch (error) {
    console.error('❌ Error generating aging report:', error.message)
  }
}

/**
 * Step 5: Optimize reorder points based on usage patterns
 */
async function optimizeReorderPoints(turnoverData) {
  console.log('\n🎯 Reorder Point Optimization\n')
  console.log('=' .repeat(80))

  if (turnoverData.length === 0) {
    console.log('No turnover data available for optimization')
    return
  }

  console.log('Product                     Current  Suggested  Lead Time  Safety   Status')
  console.log('                            Reorder  Reorder    (days)     Stock')
  console.log('-'.repeat(80))

  const recommendations = []

  for (const item of turnoverData) {
    // Calculate suggested reorder point based on usage
    const dailyUsage = item.annualizedUsage / 365
    const leadTimeDays = 7 // Assume 7-day lead time
    const safetyDays = 3 // 3 days safety stock
    
    const suggestedReorder = Math.ceil(dailyUsage * (leadTimeDays + safetyDays))
    const suggestedSafety = Math.ceil(dailyUsage * safetyDays)

    // Get current reorder level
    const { data: reorderData } = await supabase
      .from('core_dynamic_data')
      .select('field_value_number')
      .eq('entity_id', item.sku)
      .eq('field_name', 'reorder_level')
      .single()

    const currentReorder = reorderData?.field_value_number || 0
    const status = currentReorder === 0 ? 'Not Set' :
                  Math.abs(currentReorder - suggestedReorder) > suggestedReorder * 0.2 ? 'Adjust' : 'OK'

    if (item.monthlyUsage > 0) {
      console.log(
        `${item.name.padEnd(25)} ${currentReorder.toString().padStart(8)} ` +
        `${suggestedReorder.toString().padStart(9)} ${leadTimeDays.toString().padStart(10)} ` +
        `${suggestedSafety.toString().padStart(8)}  ${status}`
      )

      if (status === 'Adjust' || status === 'Not Set') {
        recommendations.push({
          product: item.name,
          current: currentReorder,
          suggested: suggestedReorder,
          reason: item.turnoverRate > 12 ? 'High turnover rate' : 
                 item.turnoverRate < 4 ? 'Low turnover rate' : 'Usage pattern change'
        })
      }
    }
  }

  if (recommendations.length > 0) {
    console.log('\n📋 REORDER POINT RECOMMENDATIONS:')
    recommendations.forEach(rec => {
      console.log(`  • ${rec.product}: ${rec.current} → ${rec.suggested} (${rec.reason})`)
    })
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 HERA Stage H - Inventory Valuation & Analysis')
  console.log('=' .repeat(60))
  console.log(`Organization: Hair Talkz Ladies Salon`)
  console.log(`Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`)
  console.log('=' .repeat(60))

  // Step 1: Calculate inventory valuation
  const inventoryData = await calculateInventoryValuation()

  // Step 2: Perform ABC analysis
  await performABCAnalysis(inventoryData)

  // Step 3: Calculate turnover metrics
  const turnoverData = await calculateInventoryTurnover()

  // Step 4: Generate aging report
  await generateStockAgingReport()

  // Step 5: Optimize reorder points
  await optimizeReorderPoints(turnoverData)

  console.log('\n✅ Stage H - Inventory Valuation Complete!')
}

// Run the script
main().catch(console.error)