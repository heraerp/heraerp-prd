#!/usr/bin/env node

/**
 * HERA Furniture Inventory Seed Data
 * Creates inventory locations, stock levels, and movements
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Furniture organization ID - Kerala Furniture Works (Demo)
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

// Warehouse locations
const LOCATIONS = [
  {
    entity_code: 'LOC-MAIN-WH',
    entity_name: 'Main Warehouse',
    smart_code: 'HERA.FURNITURE.LOCATION.WAREHOUSE.MAIN.v1',
    metadata: {
      type: 'warehouse',
      capacity: 'high',
      address: '123 Industrial Way, Dubai, UAE'
    }
  },
  {
    entity_code: 'LOC-SHOWROOM',
    entity_name: 'Showroom',
    smart_code: 'HERA.FURNITURE.LOCATION.SHOWROOM.MAIN.v1',
    metadata: {
      type: 'showroom',
      capacity: 'medium',
      address: '456 Design District, Dubai, UAE'
    }
  },
  {
    entity_code: 'LOC-PROD-FLOOR',
    entity_name: 'Production Floor',
    smart_code: 'HERA.FURNITURE.LOCATION.PRODUCTION.MAIN.v1',
    metadata: {
      type: 'production',
      capacity: 'high',
      address: '789 Manufacturing Zone, Dubai, UAE'
    }
  }
]

// Inventory dynamic fields for products
const INVENTORY_FIELDS = [
  'stock_quantity',
  'reserved_quantity',
  'reorder_point',
  'reorder_quantity',
  'location',
  'bin_location',
  'last_stock_check',
  'stock_value'
]

// Movement types for transactions
const MOVEMENT_TYPES = {
  PURCHASE_RECEIPT: 'purchase_receipt',
  SALES_DELIVERY: 'sales_delivery',
  STOCK_ADJUSTMENT: 'stock_adjustment',
  PRODUCTION_OUTPUT: 'production_output',
  PRODUCTION_CONSUMPTION: 'production_consumption',
  TRANSFER: 'stock_transfer'
}

async function seedInventoryLocations() {
  console.log('\n📍 Creating inventory locations...')
  
  for (const location of LOCATIONS) {
    try {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'location',
          entity_code: location.entity_code,
          entity_name: location.entity_name,
          smart_code: location.smart_code,
          metadata: location.metadata,
          organization_id: FURNITURE_ORG_ID,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error
      console.log(`✅ Created location: ${location.entity_name}`)
    } catch (error) {
      console.error(`❌ Error creating location ${location.entity_name}:`, error.message)
    }
  }
}

async function seedProductInventory() {
  console.log('\n📦 Adding inventory data to products...')
  
  // Get all furniture products
  const { data: products, error: productsError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', FURNITURE_ORG_ID)
    .eq('entity_type', 'product')
    .like('smart_code', 'HERA.FURNITURE.PRODUCT%')
  
  if (productsError) {
    console.error('❌ Error fetching products:', productsError.message)
    return
  }
  
  console.log(`Found ${products.length} products to add inventory data`)
  
  // Get locations for assignment
  const locations = ['Main Warehouse', 'Showroom', 'Production Floor']
  
  for (const product of products) {
    try {
      // Calculate inventory levels based on product type
      const isRawMaterial = product.smart_code.includes('.RAW_MATERIAL.')
      const isComponent = product.smart_code.includes('.COMPONENT.')
      
      const baseStock = isRawMaterial ? Math.floor(Math.random() * 500) + 100 :
                       isComponent ? Math.floor(Math.random() * 200) + 50 :
                       Math.floor(Math.random() * 100) + 10
      
      const reserved = Math.floor(baseStock * 0.15) // 15% reserved
      const reorderPoint = Math.floor(baseStock * 0.25) // Reorder at 25%
      const reorderQty = Math.floor(baseStock * 0.5) // Reorder 50% of base
      
      // Assign location based on product type
      const location = isRawMaterial ? 'Main Warehouse' :
                      isComponent ? 'Production Floor' :
                      locations[Math.floor(Math.random() * locations.length)]
      
      // Add inventory fields
      const inventoryData = [
        {
          entity_id: product.id,
          field_name: 'stock_quantity',
          field_value_number: baseStock,
          smart_code: 'HERA.FURNITURE.INVENTORY.STOCK.QTY.v1',
          organization_id: FURNITURE_ORG_ID
        },
        {
          entity_id: product.id,
          field_name: 'reserved_quantity',
          field_value_number: reserved,
          smart_code: 'HERA.FURNITURE.INVENTORY.RESERVED.QTY.v1',
          organization_id: FURNITURE_ORG_ID
        },
        {
          entity_id: product.id,
          field_name: 'reorder_point',
          field_value_number: reorderPoint,
          smart_code: 'HERA.FURNITURE.INVENTORY.REORDER.POINT.v1',
          organization_id: FURNITURE_ORG_ID
        },
        {
          entity_id: product.id,
          field_name: 'reorder_quantity',
          field_value_number: reorderQty,
          smart_code: 'HERA.FURNITURE.INVENTORY.REORDER.QTY.v1',
          organization_id: FURNITURE_ORG_ID
        },
        {
          entity_id: product.id,
          field_name: 'location',
          field_value_text: location,
          smart_code: 'HERA.FURNITURE.INVENTORY.LOCATION.v1',
          organization_id: FURNITURE_ORG_ID
        },
        {
          entity_id: product.id,
          field_name: 'bin_location',
          field_value_text: `${location.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 99) + 1}-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
          smart_code: 'HERA.FURNITURE.INVENTORY.BIN.v1',
          organization_id: FURNITURE_ORG_ID
        },
        {
          entity_id: product.id,
          field_name: 'last_stock_check',
          field_value_text: new Date().toISOString(),
          smart_code: 'HERA.FURNITURE.INVENTORY.LAST_CHECK.v1',
          organization_id: FURNITURE_ORG_ID
        }
      ]
      
      // Insert inventory data
      const { error: invError } = await supabase
        .from('core_dynamic_data')
        .insert(inventoryData)
      
      if (invError) throw invError
      
      console.log(`✅ Added inventory data for: ${product.entity_name} (Stock: ${baseStock}, Location: ${location})`)
      
    } catch (error) {
      console.error(`❌ Error adding inventory for ${product.entity_name}:`, error.message)
    }
  }
}

async function seedInventoryMovements() {
  console.log('\n📋 Creating inventory movements...')
  
  // Get products and suppliers/customers for movements
  const { data: products } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', FURNITURE_ORG_ID)
    .eq('entity_type', 'product')
    .like('smart_code', 'HERA.FURNITURE.PRODUCT%')
    .limit(10) // Create movements for first 10 products
  
  const { data: suppliers } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', FURNITURE_ORG_ID)
    .eq('entity_type', 'supplier')
    .limit(5)
  
  const { data: customers } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', FURNITURE_ORG_ID)
    .eq('entity_type', 'customer')
    .limit(5)
  
  if (!products || !suppliers || !customers) {
    console.error('❌ Missing required entities for movements')
    return
  }
  
  // Create various types of movements
  const movements = []
  
  // Purchase receipts
  for (let i = 0; i < 5; i++) {
    const product = products[i % products.length]
    const supplier = suppliers[i % suppliers.length]
    const quantity = Math.floor(Math.random() * 50) + 10
    const unitCost = Math.floor(Math.random() * 200) + 50
    
    movements.push({
      transaction_type: MOVEMENT_TYPES.PURCHASE_RECEIPT,
      transaction_code: `GR-${Date.now()}-${i}`,
      transaction_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 30 days
      smart_code: 'HERA.FURNITURE.INVENTORY.MOVEMENT.RECEIPT.v1',
      source_entity_id: supplier.id,
      target_entity_id: product.id,
      total_amount: quantity,
      metadata: {
        movement_type: 'receipt',
        quantity: quantity,
        unit_cost: unitCost,
        total_value: quantity * unitCost,
        location: 'Main Warehouse',
        po_number: `PO-2024-${String(i + 1).padStart(4, '0')}`
      },
      organization_id: FURNITURE_ORG_ID
    })
  }
  
  // Sales deliveries
  for (let i = 0; i < 5; i++) {
    const product = products[(i + 5) % products.length]
    const customer = customers[i % customers.length]
    const quantity = Math.floor(Math.random() * 20) + 1
    const unitPrice = Math.floor(Math.random() * 500) + 100
    
    movements.push({
      transaction_type: MOVEMENT_TYPES.SALES_DELIVERY,
      transaction_code: `GI-${Date.now()}-${i}`,
      transaction_date: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 15 days
      smart_code: 'HERA.FURNITURE.INVENTORY.MOVEMENT.DELIVERY.v1',
      source_entity_id: product.id,
      target_entity_id: customer.id,
      total_amount: quantity,
      metadata: {
        movement_type: 'delivery',
        quantity: quantity,
        unit_price: unitPrice,
        total_value: quantity * unitPrice,
        location: 'Main Warehouse',
        so_number: `SO-2024-${String(i + 1).padStart(4, '0')}`
      },
      organization_id: FURNITURE_ORG_ID
    })
  }
  
  // Stock adjustments
  for (let i = 0; i < 3; i++) {
    const product = products[i % products.length]
    const adjustment = Math.floor(Math.random() * 20) - 10 // Can be positive or negative
    
    movements.push({
      transaction_type: MOVEMENT_TYPES.STOCK_ADJUSTMENT,
      transaction_code: `ADJ-${Date.now()}-${i}`,
      transaction_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 7 days
      smart_code: 'HERA.FURNITURE.INVENTORY.MOVEMENT.ADJUSTMENT.v1',
      source_entity_id: product.id,
      target_entity_id: product.id,
      total_amount: Math.abs(adjustment),
      metadata: {
        movement_type: 'adjustment',
        quantity: adjustment,
        reason: adjustment > 0 ? 'Physical count surplus' : 'Physical count shortage',
        location: 'Main Warehouse',
        adjusted_by: 'Inventory Manager'
      },
      organization_id: FURNITURE_ORG_ID
    })
  }
  
  // Production output (for finished goods)
  for (let i = 0; i < 2; i++) {
    const product = products.find(p => p.smart_code && (p.smart_code.includes('.DESK.') || p.smart_code.includes('.CHAIR.')))
    if (product && product.id) {
      const quantity = Math.floor(Math.random() * 10) + 5
      
      movements.push({
        transaction_type: MOVEMENT_TYPES.PRODUCTION_OUTPUT,
        transaction_code: `PROD-OUT-${Date.now()}-${i}`,
        transaction_date: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
        smart_code: 'HERA.FURNITURE.INVENTORY.MOVEMENT.PRODUCTION.v1',
        source_entity_id: product.id,
        target_entity_id: product.id,
        total_amount: quantity,
        metadata: {
          movement_type: 'production_output',
          quantity: quantity,
          production_order: `WO-2024-${String(i + 1).padStart(4, '0')}`,
          location: 'Production Floor',
          completed_by: 'Production Supervisor'
        },
        organization_id: FURNITURE_ORG_ID
      })
    }
  }
  
  // Insert all movements
  for (const movement of movements) {
    try {
      const { data, error } = await supabase
        .from('universal_transactions')
        .insert(movement)
        .select()
        .single()
      
      if (error) throw error
      console.log(`✅ Created ${movement.transaction_type}: ${movement.transaction_code} (Qty: ${movement.total_amount})`)
      
    } catch (error) {
      console.error(`❌ Error creating movement ${movement.transaction_code}:`, error.message)
    }
  }
}

async function main() {
  console.log('🚀 Starting HERA Furniture Inventory Seed...')
  console.log(`📊 Using organization: ${FURNITURE_ORG_ID}`)
  
  try {
    // Create locations
    await seedInventoryLocations()
    
    // Add inventory data to products
    await seedProductInventory()
    
    // Create inventory movements
    await seedInventoryMovements()
    
    console.log('\n✨ Furniture inventory seed completed!')
    
    // Summary
    const { count: locationCount } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'location')
    
    const { count: movementCount } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', FURNITURE_ORG_ID)
      .like('smart_code', 'HERA.FURNITURE.INVENTORY.MOVEMENT%')
    
    console.log('\n📊 Summary:')
    console.log(`   - Locations created: ${locationCount || 0}`)
    const { count: productCount } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'product')
    
    console.log(`   - Products with inventory: ${productCount || 0}`)
    console.log(`   - Inventory movements: ${movementCount || 0}`)
    
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message)
    process.exit(1)
  }
}

// Run the seed
main().catch(console.error)