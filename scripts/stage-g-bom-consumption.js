#!/usr/bin/env node

/**
 * HERA Stage G - BOM Consumption for Salon Services
 * 
 * This script handles:
 * 1. BOM setup for salon services (e.g., hair coloring uses specific products)
 * 2. Automatic inventory consumption when services are performed
 * 3. Service cost calculation including product usage
 * 4. Inventory reconciliation
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

// Service-to-Product BOM mappings
const SERVICE_BOM = {
  'Hair Coloring': [
    { product: 'Hair Color - Blonde', quantity: 0.5, unit: 'box' },
    { product: 'Developer 20 Vol', quantity: 100, unit: 'ml' },
    { product: 'Color Protection Mask', quantity: 50, unit: 'ml' }
  ],
  'Hair Treatment': [
    { product: 'Keratin Treatment', quantity: 75, unit: 'ml' },
    { product: 'Hair Mask', quantity: 50, unit: 'ml' },
    { product: 'Argan Oil', quantity: 10, unit: 'ml' }
  ],
  'Hair Styling': [
    { product: 'Hair Spray', quantity: 30, unit: 'ml' },
    { product: 'Styling Gel', quantity: 20, unit: 'ml' },
    { product: 'Heat Protectant', quantity: 15, unit: 'ml' }
  ],
  'Hair Cut & Style': [
    { product: 'Hair Spray', quantity: 20, unit: 'ml' },
    { product: 'Styling Gel', quantity: 15, unit: 'ml' }
  ],
  'Manicure': [
    { product: 'Nail Polish', quantity: 0.25, unit: 'bottle' },
    { product: 'Base Coat', quantity: 0.1, unit: 'bottle' },
    { product: 'Top Coat', quantity: 0.1, unit: 'bottle' },
    { product: 'Cuticle Oil', quantity: 5, unit: 'ml' }
  ],
  'Pedicure': [
    { product: 'Nail Polish', quantity: 0.3, unit: 'bottle' },
    { product: 'Base Coat', quantity: 0.15, unit: 'bottle' },
    { product: 'Top Coat', quantity: 0.15, unit: 'bottle' },
    { product: 'Foot Cream', quantity: 20, unit: 'ml' }
  ]
}

/**
 * Step 1: Create BOM relationships between services and products
 */
async function createServiceBOM() {
  console.log('\n🔧 Creating Service BOM Relationships...\n')

  try {
    // Get all services
    const { data: services, error: servicesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'service')

    if (servicesError) throw servicesError

    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'product')

    if (productsError) throw productsError

    // Create product lookup map
    const productMap = new Map()
    products.forEach(p => productMap.set(p.entity_name, p))

    let bomCount = 0

    for (const service of services) {
      const bomItems = SERVICE_BOM[service.entity_name]
      if (!bomItems) continue

      console.log(`\n📋 Setting up BOM for: ${service.entity_name}`)

      for (const item of bomItems) {
        const product = productMap.get(item.product)
        if (!product) {
          console.log(`  ⚠️  Product not found: ${item.product}`)
          continue
        }

        // Check if BOM relationship exists
        const { data: existing } = await supabase
          .from('core_relationships')
          .select('*')
          .eq('from_entity_id', service.id)
          .eq('to_entity_id', product.id)
          .eq('relationship_type', 'uses_product')
          .single()

        if (!existing) {
          // Create BOM relationship
          const { error } = await supabase
            .from('core_relationships')
            .insert({
              organization_id: ORGANIZATION_ID,
              from_entity_id: service.id,
              to_entity_id: product.id,
              relationship_type: 'uses_product',
              smart_code: 'HERA.SALON.BOM.SERVICE.PRODUCT.v1',
              metadata: {
                quantity: item.quantity,
                unit: item.unit,
                bom_type: 'standard',
                cost_allocation: 'direct'
              },
              created_at: new Date().toISOString()
            })

          if (!error) {
            console.log(`  ✅ ${item.product}: ${item.quantity} ${item.unit}`)
            bomCount++
          } else {
            console.error(`  ❌ Error creating BOM for ${item.product}:`, error.message)
          }
        }
      }
    }

    console.log(`\n✅ Created ${bomCount} BOM relationships`)

  } catch (error) {
    console.error('❌ Error creating service BOM:', error.message)
  }
}

/**
 * Step 2: Process service transactions and consume inventory
 */
async function processServiceConsumption() {
  console.log('\n📦 Processing Service Inventory Consumption...\n')

  try {
    // Get recent service transactions without consumption posted
    const { data: serviceTxns, error: txnError } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines!inner(
          *,
          line_entity:core_entities!line_entity_id(*)
        )
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction_type', 'sale')
      .like('smart_code', '%SERVICE%')
      .is('metadata->inventory_consumed', null)
      .order('transaction_date', { ascending: true })
      .limit(50)

    if (txnError) throw txnError

    console.log(`Found ${serviceTxns.length} service transactions to process`)

    let totalConsumptionValue = 0
    let processedCount = 0

    for (const txn of serviceTxns) {
      console.log(`\n Processing: ${txn.transaction_code}`)
      
      let txnConsumptionValue = 0
      const consumptionEntries = []

      for (const line of txn.universal_transaction_lines) {
        if (line.line_entity?.entity_type !== 'service') continue

        const serviceName = line.line_entity.entity_name
        console.log(`  Service: ${serviceName} x ${line.quantity}`)

        // Get BOM for this service
        const { data: bomItems, error: bomError } = await supabase
          .from('core_relationships')
          .select(`
            *,
            product:core_entities!to_entity_id(*)
          `)
          .eq('from_entity_id', line.line_entity_id)
          .eq('relationship_type', 'uses_product')

        if (bomError || !bomItems) continue

        for (const bomItem of bomItems) {
          const consumedQty = (bomItem.metadata?.quantity || 0) * line.quantity
          
          // Get product cost
          const { data: costData } = await supabase
            .from('core_dynamic_data')
            .select('field_value_number')
            .eq('entity_id', bomItem.to_entity_id)
            .eq('field_name', 'product_cost')
            .single()

          const unitCost = costData?.field_value_number || 0
          const consumptionValue = unitCost * consumedQty

          consumptionEntries.push({
            product_id: bomItem.to_entity_id,
            product_name: bomItem.product.entity_name,
            quantity: consumedQty,
            unit: bomItem.metadata?.unit || 'unit',
            unit_cost: unitCost,
            total_value: consumptionValue
          })

          txnConsumptionValue += consumptionValue

          // Update product stock
          const { data: stockData } = await supabase
            .from('core_dynamic_data')
            .select('*')
            .eq('entity_id', bomItem.to_entity_id)
            .eq('field_name', 'current_stock')
            .single()

          if (stockData) {
            const newStock = Math.max(0, (stockData.field_value_number || 0) - consumedQty)
            
            await supabase
              .from('core_dynamic_data')
              .update({ 
                field_value_number: newStock,
                updated_at: new Date().toISOString()
              })
              .eq('id', stockData.id)

            console.log(`    ✅ ${bomItem.product.entity_name}: consumed ${consumedQty} ${bomItem.metadata?.unit || 'unit'} (stock: ${newStock})`)
          }
        }
      }

      if (consumptionEntries.length > 0) {
        // Create inventory consumption transaction
        const consumptionTxn = {
          organization_id: ORGANIZATION_ID,
          transaction_type: 'inventory_consumption',
          transaction_date: txn.transaction_date,
          transaction_code: `CONSUME-${txn.transaction_code}`,
          reference_transaction_id: txn.id,
          total_amount: txnConsumptionValue,
          smart_code: 'HERA.SALON.INVENTORY.CONSUME.SERVICE.v1',
          metadata: {
            source_transaction: txn.transaction_code,
            consumption_entries: consumptionEntries,
            auto_generated: true
          },
          created_at: new Date().toISOString()
        }

        const { data: consumption, error: consumeError } = await supabase
          .from('universal_transactions')
          .insert(consumptionTxn)
          .select()
          .single()

        if (!consumeError) {
          // Update original transaction
          await supabase
            .from('universal_transactions')
            .update({ 
              metadata: { 
                ...txn.metadata, 
                inventory_consumed: true,
                consumption_txn_id: consumption.id,
                consumption_value: txnConsumptionValue
              } 
            })
            .eq('id', txn.id)

          totalConsumptionValue += txnConsumptionValue
          processedCount++
          console.log(`  💰 Total consumption value: ${txnConsumptionValue.toFixed(2)} AED`)
        }
      }
    }

    console.log(`\n✅ Processed ${processedCount} transactions`)
    console.log(`💰 Total inventory consumed: ${totalConsumptionValue.toFixed(2)} AED`)

  } catch (error) {
    console.error('❌ Error processing service consumption:', error.message)
  }
}

/**
 * Step 3: Calculate true service profitability including product costs
 */
async function calculateServiceProfitability() {
  console.log('\n💰 Calculating Service Profitability...\n')

  try {
    // Get all services
    const { data: services, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'service')

    if (error) throw error

    const profitabilityData = []

    for (const service of services) {
      // Get service price
      const { data: priceData } = await supabase
        .from('core_dynamic_data')
        .select('field_value_number')
        .eq('entity_id', service.id)
        .eq('field_name', 'service_price')
        .single()

      const servicePrice = priceData?.field_value_number || 0

      // Calculate BOM cost
      const { data: bomItems } = await supabase
        .from('core_relationships')
        .select(`
          *,
          product:core_entities!to_entity_id(*)
        `)
        .eq('from_entity_id', service.id)
        .eq('relationship_type', 'uses_product')

      let bomCost = 0
      const bomDetails = []

      for (const item of bomItems || []) {
        const { data: costData } = await supabase
          .from('core_dynamic_data')
          .select('field_value_number')
          .eq('entity_id', item.to_entity_id)
          .eq('field_name', 'product_cost')
          .single()

        const unitCost = costData?.field_value_number || 0
        const itemCost = unitCost * (item.metadata?.quantity || 0)
        
        bomCost += itemCost
        bomDetails.push({
          product: item.product.entity_name,
          quantity: item.metadata?.quantity || 0,
          unit: item.metadata?.unit || 'unit',
          cost: itemCost
        })
      }

      // Calculate labor cost (35% commission)
      const laborCost = servicePrice * 0.35

      // Total cost and margin
      const totalCost = bomCost + laborCost
      const grossMargin = servicePrice - totalCost
      const marginPercent = servicePrice > 0 ? (grossMargin / servicePrice * 100) : 0

      profitabilityData.push({
        service: service.entity_name,
        price: servicePrice,
        bomCost: bomCost,
        laborCost: laborCost,
        totalCost: totalCost,
        grossMargin: grossMargin,
        marginPercent: marginPercent,
        bomDetails: bomDetails
      })
    }

    // Sort by margin percentage
    profitabilityData.sort((a, b) => b.marginPercent - a.marginPercent)

    console.log('SERVICE PROFITABILITY ANALYSIS')
    console.log('=' .repeat(90))
    console.log()
    console.log('Service                  Price   BOM Cost  Labor Cost  Total Cost  Margin   Margin %')
    console.log('-'.repeat(90))

    for (const item of profitabilityData) {
      console.log(
        `${item.service.padEnd(22)} ${item.price.toFixed(2).padStart(7)} ` +
        `${item.bomCost.toFixed(2).padStart(10)} ${item.laborCost.toFixed(2).padStart(11)} ` +
        `${item.totalCost.toFixed(2).padStart(11)} ${item.grossMargin.toFixed(2).padStart(8)} ` +
        `${item.marginPercent.toFixed(1).padStart(8)}%`
      )
    }

    console.log('-'.repeat(90))

    // Show detailed BOM for top services
    console.log('\nDETAILED BOM BREAKDOWN (Top 3 Services):')
    console.log('=' .repeat(60))

    const topServices = profitabilityData.slice(0, 3)
    for (const service of topServices) {
      console.log(`\n${service.service} (Margin: ${service.marginPercent.toFixed(1)}%)`)
      console.log('-'.repeat(40))
      
      if (service.bomDetails.length > 0) {
        for (const item of service.bomDetails) {
          console.log(`  ${item.product}: ${item.quantity} ${item.unit} = ${item.cost.toFixed(2)} AED`)
        }
        console.log(`  Total BOM Cost: ${service.bomCost.toFixed(2)} AED`)
      } else {
        console.log('  No product consumption')
      }
    }

  } catch (error) {
    console.error('❌ Error calculating profitability:', error.message)
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 HERA Stage G - BOM & Service Consumption')
  console.log('=' .repeat(60))
  console.log(`Organization: Hair Talkz Ladies Salon`)
  console.log(`Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`)
  console.log('=' .repeat(60))

  // Step 1: Create service BOM relationships
  await createServiceBOM()

  // Step 2: Process service consumption
  await processServiceConsumption()

  // Step 3: Calculate service profitability
  await calculateServiceProfitability()

  console.log('\n✅ BOM & Service Consumption Processing Complete!')
}

// Run the script
main().catch(console.error)