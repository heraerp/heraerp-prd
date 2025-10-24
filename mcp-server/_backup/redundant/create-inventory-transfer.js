#!/usr/bin/env node

/**
 * Create Inventory Transfer from Plant to Retail Outlet
 * This demonstrates multi-location inventory management
 */

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

async function createInventoryTransfer() {
  console.log('🚚 Creating Inventory Transfer to Retail Outlet...\n')
  
  try {
    // Get entities
    const { data: plant } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', ORG_ID)
      .eq('entity_code', 'PLANT-KOCHI')
      .single()
      
    const { data: outlet } = await supabase
      .from('core_entities')
      .select('id, entity_name, metadata')
      .eq('organization_id', ORG_ID)
      .eq('entity_code', 'OUTLET-MGROAD')
      .single()
      
    const { data: product } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', ORG_ID)
      .eq('entity_code', 'SKU-VAN-500ML')
      .single()
      
    console.log('📍 Transfer Route:')
    console.log(`  From: ${plant?.entity_name}`)
    console.log(`  To: ${outlet?.entity_name}`)
    console.log(`  Product: ${product?.entity_name}`)
    
    // Create transfer transaction
    const transferCode = `TRANS-${new Date().toISOString().slice(0,10)}-001`
    
    const { data: transferTxn, error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'inventory_transfer',
        transaction_code: transferCode,
        transaction_date: new Date().toISOString().slice(0,10),
        source_entity_id: plant?.id,
        target_entity_id: outlet?.id,
        smart_code: 'HERA.FOODDAIRY.INV.MOVE.TRANSFER.V1',
        metadata: {
          transfer_type: 'plant_to_outlet',
          vehicle_number: 'KL-07-AB-1234',
          driver_name: 'Rajesh Kumar',
          driver_mobile: '9876543210',
          departure_time: new Date().toISOString(),
          expected_arrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
          temperature_controlled: true,
          required_temp: '-18 to -20°C'
        },
        transaction_status: 'in_transit',
        total_amount: 0
      })
      .select()
      .single()
      
    if (error) throw error
    
    console.log(`\n✓ Transfer initiated: ${transferCode}`)
    
    // Add transfer lines (products being transferred)
    const transferQuantity = 50 // tubs
    const costPerTub = 22.18 // from production
    
    await supabase
      .from('universal_transaction_lines')
      .insert([
        // Outbound from plant (negative quantity)
        {
          organization_id: ORG_ID,
          transaction_id: transferTxn.id,
          line_number: 1,
          entity_id: product?.id,
          line_type: 'transfer_out',
          description: `Transfer out ${product?.entity_name}`,
          quantity: -transferQuantity,
          unit_amount: costPerTub,
          line_amount: -(transferQuantity * costPerTub),
          smart_code: 'HERA.FOODDAIRY.INV.MOVE.ISSUE.V1',
          line_data: {
            lot_number: 'FG-VAN-2025-08-30-001',
            from_location: 'PLANT-KOCHI',
            unit_of_measure: 'TUB'
          }
        },
        // Inbound to outlet (positive quantity)
        {
          organization_id: ORG_ID,
          transaction_id: transferTxn.id,
          line_number: 2,
          entity_id: product?.id,
          line_type: 'transfer_in',
          description: `Receive ${product?.entity_name}`,
          quantity: transferQuantity,
          unit_amount: costPerTub,
          line_amount: transferQuantity * costPerTub,
          smart_code: 'HERA.FOODDAIRY.INV.MOVE.RECEIPT.V1',
          line_data: {
            lot_number: 'FG-VAN-2025-08-30-001',
            to_location: 'OUTLET-MGROAD',
            unit_of_measure: 'TUB',
            storage_location: 'FREEZER-01'
          }
        }
      ])
      
    console.log(`\n📦 Transfer Details:`)
    console.log(`  Quantity: ${transferQuantity} tubs`)
    console.log(`  Value: ₹${(transferQuantity * costPerTub).toFixed(2)}`)
    console.log(`  Status: In Transit 🚚`)
    
    // Simulate temperature monitoring during transit
    console.log('\n🌡️ Temperature Monitoring:')
    const tempReadings = [
      { time: '10:00', temp: -19.5, location: 'Loading' },
      { time: '10:30', temp: -19.2, location: 'Highway' },
      { time: '11:00', temp: -18.8, location: 'City Entry' },
      { time: '11:30', temp: -18.5, location: 'MG Road' }
    ]
    
    for (const reading of tempReadings) {
      console.log(`  ${reading.time} - ${reading.temp}°C at ${reading.location} ✅`)
    }
    
    // Complete the transfer
    console.log('\n📍 Delivery at outlet...')
    
    await supabase
      .from('universal_transactions')
      .update({
        transaction_status: 'completed',
        metadata: {
          ...transferTxn.metadata,
          actual_arrival: new Date().toISOString(),
          delivery_status: 'received',
          temperature_maintained: true,
          received_by: 'Store Manager',
          temperature_log: tempReadings
        }
      })
      .eq('id', transferTxn.id)
      
    console.log('✅ Transfer completed successfully!')
    
    // Show inventory impact
    console.log('\n📊 Inventory Impact:')
    console.log('  Plant (PLANT-KOCHI):')
    console.log(`    Vanilla Ice Cream: -${transferQuantity} tubs`)
    console.log('  Outlet (OUTLET-MGROAD):')
    console.log(`    Vanilla Ice Cream: +${transferQuantity} tubs`)
    console.log(`    Ready for sale at ₹150/tub (MRP)`)
    
    return transferTxn
    
  } catch (error) {
    console.error('❌ Error in inventory transfer:', error.message)
  }
}

// Run if called directly
if (require.main === module) {
  createInventoryTransfer()
}

module.exports = { createInventoryTransfer }