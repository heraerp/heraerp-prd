#!/usr/bin/env node

/**
 * Create Production Batch for Kochi Ice Cream
 * This demonstrates how raw materials convert to finished goods
 * using HERA's universal transaction system
 */

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

async function createProductionBatch() {
  console.log('🏭 Creating Production Batch for Vanilla Ice Cream...\n')
  
  try {
    // Step 1: Get entity IDs we need
    console.log('📋 Step 1: Fetching entity references...')
    
    // Get product (what we're making)
    const { data: product } = await supabase
      .from('core_entities')
      .select('id, entity_name, metadata')
      .eq('organization_id', ORG_ID)
      .eq('entity_code', 'SKU-VAN-500ML')
      .single()
      
    // Get recipe
    const { data: recipe } = await supabase
      .from('core_entities')
      .select('id, entity_name, metadata')
      .eq('organization_id', ORG_ID)
      .eq('entity_code', 'RCP-VANILLA-V1')
      .single()
      
    // Get raw materials
    const { data: rawMaterials } = await supabase
      .from('core_entities')
      .select('id, entity_code, entity_name')
      .eq('organization_id', ORG_ID)
      .in('entity_code', ['RM-MILK', 'RM-CREAM', 'RM-SUGAR'])
      
    // Get manufacturing plant
    const { data: plant } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', ORG_ID)
      .eq('entity_code', 'PLANT-KOCHI')
      .single()
      
    console.log('✓ Entities loaded')
    console.log(`  Product: ${product?.entity_name}`)
    console.log(`  Recipe: ${recipe?.entity_name}`)
    console.log(`  Location: ${plant?.entity_name}`)
    
    // Step 2: Create production batch transaction
    console.log('\n📝 Step 2: Creating production batch transaction...')
    
    const batchNumber = `BATCH-${new Date().toISOString().slice(0,10)}-001`
    const productionDate = new Date().toISOString()
    
    const { data: productionTxn, error: txnError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'production_batch',
        transaction_code: batchNumber,
        transaction_date: productionDate.slice(0,10),
        source_entity_id: plant?.id, // Manufacturing plant
        target_entity_id: product?.id, // Product being made
        reference_number: recipe?.entity_code,
        smart_code: 'HERA.FOODDAIRY.MFG.BATCH.PRODUCTION.V1',
        metadata: {
          batch_number: batchNumber,
          recipe_id: recipe?.id,
          recipe_version: 1,
          batch_size: 100, // 100 liters
          expected_output: 145, // 145 liters with overrun
          shift: 'day',
          production_date: productionDate,
          operator: 'Production Team A',
          temperature_log: {
            pasteurization: 78.5,
            homogenization: 4.0,
            freezing: -5.0
          }
        },
        transaction_status: 'in_progress',
        total_amount: 0 // Will calculate costs
      })
      .select()
      .single()
      
    if (txnError) throw txnError
    
    console.log(`✓ Production batch created: ${batchNumber}`)
    
    // Step 3: Create transaction lines for raw material consumption
    console.log('\n📦 Step 3: Recording raw material consumption...')
    
    // Define consumption based on recipe (for 100L batch)
    const consumption = [
      { material: 'RM-MILK', quantity: -60, unit: 'LITER', costPerUnit: 45 },
      { material: 'RM-CREAM', quantity: -25, unit: 'LITER', costPerUnit: 120 },
      { material: 'RM-SUGAR', quantity: -15, unit: 'KG', costPerUnit: 40 }
    ]
    
    let totalMaterialCost = 0
    
    for (const item of consumption) {
      const material = rawMaterials?.find(rm => rm.entity_code === item.material)
      if (!material) continue
      
      const lineCost = Math.abs(item.quantity) * item.costPerUnit
      totalMaterialCost += lineCost
      
      const { error: lineError } = await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: ORG_ID,
          transaction_id: productionTxn.id,
          line_number: consumption.indexOf(item) + 1,
          entity_id: material.id,
          line_type: 'raw_material_consumption',
          description: `Consume ${material.entity_name}`,
          quantity: item.quantity, // Negative for consumption
          unit_amount: item.costPerUnit,
          line_amount: -lineCost, // Negative for consumption
          smart_code: 'HERA.FOODDAIRY.INV.MOVE.ISSUE.V1',
          line_data: {
            lot_number: `LOT-${item.material}-2024-01`,
            unit_of_measure: item.unit,
            warehouse_location: 'COLD-STORAGE-01'
          }
        })
        
      if (lineError) console.error('Line error:', lineError)
      
      console.log(`  ✓ Consumed ${Math.abs(item.quantity)} ${item.unit} of ${material.entity_name} @ ₹${item.costPerUnit}/${item.unit}`)
    }
    
    // Step 4: Record production output (finished goods)
    console.log('\n🍦 Step 4: Recording production output...')
    
    // Actual yield (slightly less than expected due to normal loss)
    const actualYield = 142 // liters (vs 145 expected)
    const yieldVariance = ((actualYield - 145) / 145 * 100).toFixed(2)
    
    // Convert to retail units (500ml tubs)
    const tubsProduced = Math.floor(actualYield / 0.5)
    const costPerTub = totalMaterialCost / tubsProduced
    
    const { error: outputError } = await supabase
      .from('universal_transaction_lines')
      .insert({
        organization_id: ORG_ID,
        transaction_id: productionTxn.id,
        line_number: 10,
        entity_id: product?.id,
        line_type: 'finished_goods_output',
        description: `Produce ${product?.entity_name}`,
        quantity: tubsProduced, // Positive for production
        unit_amount: costPerTub,
        line_amount: totalMaterialCost, // Total value produced
        smart_code: 'HERA.FOODDAIRY.INV.MOVE.PRODUCE.V1',
        line_data: {
          lot_number: `FG-VAN-${new Date().toISOString().slice(0,10)}-001`,
          unit_of_measure: 'TUB',
          actual_yield_liters: actualYield,
          expected_yield_liters: 145,
          yield_variance_percent: yieldVariance,
          expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0,10), // 180 days shelf life
          quality_status: 'pending_qc'
        }
      })
      
    if (outputError) console.error('Output error:', outputError)
    
    console.log(`  ✓ Produced ${tubsProduced} tubs (500ml each)`)
    console.log(`  ✓ Actual yield: ${actualYield}L (${yieldVariance}% variance)`)
    console.log(`  ✓ Cost per tub: ₹${costPerTub.toFixed(2)}`)
    
    // Step 5: Update transaction with totals and complete it
    console.log('\n✅ Step 5: Completing production batch...')
    
    const { error: updateError } = await supabase
      .from('universal_transactions')
      .update({
        total_amount: totalMaterialCost,
        transaction_status: 'completed',
        metadata: {
          ...productionTxn.metadata,
          actual_output: tubsProduced,
          actual_yield_liters: actualYield,
          yield_variance_percent: yieldVariance,
          material_cost: totalMaterialCost,
          cost_per_unit: costPerTub,
          completion_time: new Date().toISOString()
        }
      })
      .eq('id', productionTxn.id)
      
    if (updateError) throw updateError
    
    // Step 6: Show journal entries that would be created
    console.log('\n📊 Step 6: Journal Entries (Auto-generated by Digital Accountant):')
    console.log('\nMaterial Consumption:')
    console.log('  DR: 1320 WIP Inventory            ₹', totalMaterialCost.toFixed(2))
    console.log('  CR: 1310 Raw Material Inventory   ₹', totalMaterialCost.toFixed(2))
    
    console.log('\nFinished Goods Production:')
    console.log('  DR: 1330 Finished Goods Inventory ₹', totalMaterialCost.toFixed(2))
    console.log('  CR: 1320 WIP Inventory            ₹', totalMaterialCost.toFixed(2))
    
    if (parseFloat(yieldVariance) < 0) {
      const varianceAmount = Math.abs(parseFloat(yieldVariance)) / 100 * totalMaterialCost
      console.log('\nYield Variance:')
      console.log('  DR: 5820 Yield Variance           ₹', varianceAmount.toFixed(2))
      console.log('  CR: 1330 Finished Goods Inventory ₹', varianceAmount.toFixed(2))
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📈 PRODUCTION BATCH SUMMARY')
    console.log('='.repeat(60))
    console.log(`Batch Number     : ${batchNumber}`)
    console.log(`Product          : ${product?.entity_name}`)
    console.log(`Quantity Produced: ${tubsProduced} tubs (500ml)`)
    console.log(`Total Volume     : ${actualYield} liters`)
    console.log(`Material Cost    : ₹${totalMaterialCost.toFixed(2)}`)
    console.log(`Cost per Tub     : ₹${costPerTub.toFixed(2)}`)
    console.log(`Yield Variance   : ${yieldVariance}%`)
    console.log(`Status           : Completed (Pending QC)`)
    console.log('='.repeat(60))
    
    return {
      batchNumber,
      productionTxnId: productionTxn.id,
      tubsProduced,
      costPerTub,
      totalCost: totalMaterialCost
    }
    
  } catch (error) {
    console.error('❌ Error creating production batch:', error.message)
    return null
  }
}

// Run the production batch
if (require.main === module) {
  createProductionBatch().then(result => {
    if (result) {
      console.log('\n✅ Production batch successfully created!')
      console.log('Transaction ID:', result.productionTxnId)
    }
  })
}

module.exports = { createProductionBatch }