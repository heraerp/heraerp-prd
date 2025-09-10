#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

async function createMovements() {
  console.log('📦 Creating inventory movements for Kerala Furniture Works...')
  
  // Get products
  const { data: products } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', FURNITURE_ORG_ID)
    .eq('entity_type', 'product')
    .like('smart_code', 'HERA.FURNITURE.PRODUCT%')
    .limit(10)
  
  if (!products || products.length === 0) {
    console.error('No products found')
    return
  }
  
  // Create some test suppliers if they don't exist
  const suppliers = [
    { entity_code: 'SUPP-001', entity_name: 'Kerala Wood Suppliers' },
    { entity_code: 'SUPP-002', entity_name: 'Premium Fabric House' }
  ]
  
  for (const supplier of suppliers) {
    await supabase
      .from('core_entities')
      .insert({
        ...supplier,
        entity_type: 'supplier',
        smart_code: 'HERA.FURNITURE.SUPPLIER.VENDOR.v1',
        organization_id: FURNITURE_ORG_ID,
        status: 'active'
      })
  }
  
  // Create some test customers
  const customers = [
    { entity_code: 'CUST-001', entity_name: 'Marriott Hotels Kerala' },
    { entity_code: 'CUST-002', entity_name: 'ITC Grand Chola' }
  ]
  
  for (const customer of customers) {
    await supabase
      .from('core_entities')
      .insert({
        ...customer,
        entity_type: 'customer',
        smart_code: 'HERA.FURNITURE.CUSTOMER.CORP.v1',
        organization_id: FURNITURE_ORG_ID,
        status: 'active'
      })
  }
  
  // Get the created entities
  const { data: supplierEntities } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', FURNITURE_ORG_ID)
    .eq('entity_type', 'supplier')
  
  const { data: customerEntities } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', FURNITURE_ORG_ID)
    .eq('entity_type', 'customer')
  
  // Create movements
  const movements = []
  const now = Date.now()
  
  // Purchase receipts
  for (let i = 0; i < 5; i++) {
    const product = products[i % products.length]
    const supplier = supplierEntities?.[i % supplierEntities.length]
    
    if (product && supplier) {
      movements.push({
        transaction_type: 'purchase_receipt',
        transaction_code: `GR-${now}-${i}`,
        transaction_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        smart_code: 'HERA.FURNITURE.INVENTORY.MOVEMENT.RECEIPT.v1',
        source_entity_id: supplier.id,
        target_entity_id: product.id,
        total_amount: Math.floor(Math.random() * 50) + 10,
        metadata: {
          movement_type: 'receipt',
          po_number: `PO-2025-${String(i + 1).padStart(4, '0')}`,
          location: 'Main Warehouse'
        },
        organization_id: FURNITURE_ORG_ID
      })
    }
  }
  
  // Sales deliveries
  for (let i = 0; i < 5; i++) {
    const product = products[(i + 5) % products.length]
    const customer = customerEntities?.[i % customerEntities.length]
    
    if (product && customer) {
      movements.push({
        transaction_type: 'sales_delivery',
        transaction_code: `GI-${now}-${i}`,
        transaction_date: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
        smart_code: 'HERA.FURNITURE.INVENTORY.MOVEMENT.DELIVERY.v1',
        source_entity_id: product.id,
        target_entity_id: customer.id,
        total_amount: Math.floor(Math.random() * 20) + 1,
        metadata: {
          movement_type: 'delivery',
          so_number: `SO-2025-${String(i + 1).padStart(4, '0')}`,
          location: 'Showroom'
        },
        organization_id: FURNITURE_ORG_ID
      })
    }
  }
  
  // Insert movements
  for (const movement of movements) {
    const { error } = await supabase
      .from('universal_transactions')
      .insert(movement)
    
    if (error) {
      console.error(`Error creating movement ${movement.transaction_code}:`, error.message)
    } else {
      console.log(`✅ Created ${movement.transaction_type}: ${movement.transaction_code}`)
    }
  }
  
  console.log(`\n✅ Created ${movements.length} inventory movements`)
}

createMovements().catch(console.error)