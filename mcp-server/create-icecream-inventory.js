#!/usr/bin/env node

/**
 * Create Initial Inventory for Ice Cream Products
 * Uses HERA universal architecture with inventory transactions
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Kochi Ice Cream Org ID
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

async function createInitialInventory() {
  console.log('📦 Creating initial inventory stock...\n')

  try {
    // First, get the plant location (or create if doesn't exist)
    let { data: plantLocation } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'location')
      .eq('entity_code', 'LOC-PLANT')
      .single()

    if (!plantLocation) {
      console.log('📍 Creating plant location...')
      const { data: newLocation } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'location',
          entity_name: 'Main Production Plant',
          entity_code: 'LOC-PLANT',
          smart_code: 'HERA.MFG.LOCATION.PLANT.v1',
          metadata: {
            type: 'plant',
            address: 'Industrial Area, Kochi',
            current_temperature: -20,
            max_capacity: 10000,
            storage_type: 'frozen'
          }
        })
        .select()
        .single()
      
      plantLocation = newLocation
    }

    // Get all products
    const { data: products } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'product')

    if (!products || products.length === 0) {
      console.error('❌ No products found. Please run create-icecream-products.js first')
      process.exit(1)
    }

    console.log(`📍 Found ${products.length} products`)
    console.log(`📍 Plant location: ${plantLocation.entity_name}\n`)

    // Create initial stock transactions
    const inventoryTransactions = []
    const today = new Date().toISOString()
    const batchNo = `BATCH-${Date.now()}`

    for (const product of products) {
      // Determine initial stock based on product category
      let initialStock = 100
      if (product.metadata?.category === 'family_pack') {
        initialStock = 200
      } else if (product.metadata?.category === 'kulfi') {
        initialStock = 500
      } else if (product.metadata?.category === 'novelty') {
        initialStock = 300
      }

      console.log(`📦 Creating initial stock for ${product.entity_name}: ${initialStock} ${product.metadata?.unit || 'units'}`)

      // Create production batch transaction (initial stock)
      const { data: transaction, error: txnError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: ORG_ID,
          transaction_type: 'production_batch',
          transaction_date: today,
          transaction_code: `PROD-${Date.now()}-${product.entity_code}`,
          smart_code: 'HERA.MFG.TXN.PRODUCTION.BATCH.v1',
          total_amount: initialStock * (product.metadata?.cost_per_unit || 0),
          transaction_status: 'completed',
          metadata: {
            batch_no: batchNo,
            production_date: today,
            expiry_date: new Date(Date.now() + (product.metadata?.shelf_life_days || 180) * 24 * 60 * 60 * 1000).toISOString(),
            location_id: plantLocation.id,
            location_name: plantLocation.entity_name,
            quality_status: 'passed',
            temperature_maintained: -20
          }
        })
        .select()
        .single()

      if (txnError) {
        console.error(`❌ Error creating transaction for ${product.entity_name}:`, txnError)
        continue
      }

      // Create transaction line for the product
      const { error: lineError } = await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: ORG_ID,
          transaction_id: transaction.id,
          line_number: 1,
          entity_id: product.id,
          line_type: 'product',
          description: `Production of ${product.entity_name}`,
          quantity: initialStock,
          unit_amount: product.metadata?.cost_per_unit || 0,
          line_amount: initialStock * (product.metadata?.cost_per_unit || 0),
          smart_code: 'HERA.MFG.TXN.LINE.PRODUCTION.v1',
          line_data: {
            unit: product.metadata?.unit || 'units',
            batch_no: batchNo,
            location_id: plantLocation.id
          }
        })

      if (lineError) {
        console.error(`❌ Error creating transaction line for ${product.entity_name}:`, lineError)
      }

      inventoryTransactions.push({
        product: product.entity_name,
        quantity: initialStock,
        location: plantLocation.entity_name
      })
    }

    // Create some outlet locations with sample stock
    const outlets = [
      {
        name: 'MG Road Outlet',
        code: 'OUTLET-MG-001',
        address: 'MG Road, Kochi'
      },
      {
        name: 'Marine Drive Outlet',
        code: 'OUTLET-MD-001',
        address: 'Marine Drive, Kochi'
      }
    ]

    for (const outlet of outlets) {
      console.log(`\n📍 Creating outlet: ${outlet.name}`)
      
      const { data: outletLocation } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'location',
          entity_name: outlet.name,
          entity_code: outlet.code,
          smart_code: 'HERA.MFG.LOCATION.OUTLET.v1',
          metadata: {
            type: 'outlet',
            address: outlet.address,
            current_temperature: -18,
            max_capacity: 1000,
            storage_type: 'frozen'
          }
        })
        .select()
        .single()

      // Transfer some stock to outlets (sample data)
      const popularProducts = products.filter(p => 
        ['ICE-VANILLA-001', 'ICE-CHOCO-001', 'ICE-KULFI-001', 'ICE-BAR-001'].includes(p.entity_code)
      )

      for (const product of popularProducts) {
        const transferQty = 20
        console.log(`  📦 Transferring ${transferQty} ${product.entity_name} to ${outlet.name}`)

        // Create inventory transfer transaction
        const { data: transferTxn } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: ORG_ID,
            transaction_type: 'inventory_transfer',
            transaction_date: today,
            transaction_code: `TRNF-${Date.now()}-${product.entity_code}`,
            smart_code: 'HERA.MFG.TXN.INVENTORY.TRANSFER.v1',
            total_amount: transferQty * (product.metadata?.cost_per_unit || 0),
            transaction_status: 'completed',
            metadata: {
              from_location_id: plantLocation.id,
              from_location_name: plantLocation.entity_name,
              to_location_id: outletLocation.id,
              to_location_name: outletLocation.entity_name,
              batch_no: batchNo,
              transfer_reason: 'initial_stock'
            }
          })
          .select()
          .single()

        if (transferTxn) {
          await supabase
            .from('universal_transaction_lines')
            .insert({
              organization_id: ORG_ID,
              transaction_id: transferTxn.id,
              line_number: 1,
              entity_id: product.id,
              line_type: 'product',
              description: `Transfer of ${product.entity_name}`,
              quantity: transferQty,
              unit_amount: product.metadata?.cost_per_unit || 0,
              line_amount: transferQty * (product.metadata?.cost_per_unit || 0),
              smart_code: 'HERA.MFG.TXN.LINE.TRANSFER.v1'
            })
        }
      }
    }

    console.log('\n✅ Initial inventory created successfully!')
    console.log('\n📊 Inventory Summary:')
    console.log(`   Total Products: ${products.length}`)
    console.log(`   Plant Location: 1`)
    console.log(`   Outlet Locations: ${outlets.length}`)
    console.log(`   Batch Number: ${batchNo}`)

  } catch (error) {
    console.error('❌ Error creating inventory:', error)
    process.exit(1)
  }
}

// Run the setup
createInitialInventory()