#!/usr/bin/env node

/**
 * Create salon products for inventory management
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

// Salon products with inventory data
const SALON_PRODUCTS = [
  // Hair Color Products
  {
    entity_name: 'Hair Color - Blonde',
    entity_code: 'SKU-HC-BLO-001',
    smart_code: 'HERA.SALON.PROD.ENT.COLOR.v1',
    product_cost: 45.00,
    retail_price: 120.00,
    current_stock: 25,
    reorder_level: 10,
    safety_stock: 5,
    unit_of_measure: 'box'
  },
  {
    entity_name: 'Hair Color - Brown',
    entity_code: 'SKU-HC-BRO-001',
    smart_code: 'HERA.SALON.PROD.ENT.COLOR.v1',
    product_cost: 45.00,
    retail_price: 120.00,
    current_stock: 30,
    reorder_level: 12,
    safety_stock: 6,
    unit_of_measure: 'box'
  },
  {
    entity_name: 'Developer 20 Vol',
    entity_code: 'SKU-DEV-20V-001',
    smart_code: 'HERA.SALON.PROD.ENT.DEV.v1',
    product_cost: 15.00,
    retail_price: 35.00,
    current_stock: 1500,
    reorder_level: 500,
    safety_stock: 250,
    unit_of_measure: 'ml'
  },
  
  // Hair Treatment Products
  {
    entity_name: 'Keratin Treatment',
    entity_code: 'SKU-KER-TRT-001',
    smart_code: 'HERA.SALON.PROD.ENT.TREAT.v1',
    product_cost: 85.00,
    retail_price: 250.00,
    current_stock: 800,
    reorder_level: 300,
    safety_stock: 150,
    unit_of_measure: 'ml'
  },
  {
    entity_name: 'Hair Mask',
    entity_code: 'SKU-HM-001',
    smart_code: 'HERA.SALON.PROD.ENT.MASK.v1',
    product_cost: 25.00,
    retail_price: 65.00,
    current_stock: 1200,
    reorder_level: 400,
    safety_stock: 200,
    unit_of_measure: 'ml'
  },
  {
    entity_name: 'Argan Oil',
    entity_code: 'SKU-ARG-OIL-001',
    smart_code: 'HERA.SALON.PROD.ENT.OIL.v1',
    product_cost: 35.00,
    retail_price: 90.00,
    current_stock: 500,
    reorder_level: 200,
    safety_stock: 100,
    unit_of_measure: 'ml'
  },
  
  // Styling Products
  {
    entity_name: 'Hair Spray',
    entity_code: 'SKU-HS-001',
    smart_code: 'HERA.SALON.PROD.ENT.STYLE.v1',
    product_cost: 12.00,
    retail_price: 30.00,
    current_stock: 800,
    reorder_level: 300,
    safety_stock: 150,
    unit_of_measure: 'ml'
  },
  {
    entity_name: 'Styling Gel',
    entity_code: 'SKU-SG-001',
    smart_code: 'HERA.SALON.PROD.ENT.STYLE.v1',
    product_cost: 10.00,
    retail_price: 25.00,
    current_stock: 600,
    reorder_level: 250,
    safety_stock: 125,
    unit_of_measure: 'ml'
  },
  {
    entity_name: 'Heat Protectant',
    entity_code: 'SKU-HP-001',
    smart_code: 'HERA.SALON.PROD.ENT.PROT.v1',
    product_cost: 18.00,
    retail_price: 45.00,
    current_stock: 400,
    reorder_level: 150,
    safety_stock: 75,
    unit_of_measure: 'ml'
  },
  {
    entity_name: 'Color Protection Mask',
    entity_code: 'SKU-CPM-001',
    smart_code: 'HERA.SALON.PROD.ENT.MASK.v1',
    product_cost: 28.00,
    retail_price: 70.00,
    current_stock: 1000,
    reorder_level: 400,
    safety_stock: 200,
    unit_of_measure: 'ml'
  },
  
  // Nail Products
  {
    entity_name: 'Nail Polish',
    entity_code: 'SKU-NP-001',
    smart_code: 'HERA.SALON.PROD.ENT.POLISH.v1',
    product_cost: 8.00,
    retail_price: 20.00,
    current_stock: 50,
    reorder_level: 20,
    safety_stock: 10,
    unit_of_measure: 'bottle'
  },
  {
    entity_name: 'Base Coat',
    entity_code: 'SKU-BC-001',
    smart_code: 'HERA.SALON.PROD.ENT.NAIL.v1',
    product_cost: 10.00,
    retail_price: 25.00,
    current_stock: 30,
    reorder_level: 15,
    safety_stock: 8,
    unit_of_measure: 'bottle'
  },
  {
    entity_name: 'Top Coat',
    entity_code: 'SKU-TC-001',
    smart_code: 'HERA.SALON.PROD.ENT.NAIL.v1',
    product_cost: 10.00,
    retail_price: 25.00,
    current_stock: 30,
    reorder_level: 15,
    safety_stock: 8,
    unit_of_measure: 'bottle'
  },
  {
    entity_name: 'Cuticle Oil',
    entity_code: 'SKU-CO-001',
    smart_code: 'HERA.SALON.PROD.ENT.NAIL.v1',
    product_cost: 12.00,
    retail_price: 30.00,
    current_stock: 200,
    reorder_level: 80,
    safety_stock: 40,
    unit_of_measure: 'ml'
  },
  {
    entity_name: 'Foot Cream',
    entity_code: 'SKU-FC-001',
    smart_code: 'HERA.SALON.PROD.ENT.FOOT.v1',
    product_cost: 15.00,
    retail_price: 40.00,
    current_stock: 400,
    reorder_level: 150,
    safety_stock: 75,
    unit_of_measure: 'ml'
  }
]

async function createProducts() {
  console.log('🛍️ Creating salon products...\n')

  for (const product of SALON_PRODUCTS) {
    try {
      // Check if product already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORGANIZATION_ID)
        .eq('entity_code', product.entity_code)
        .single()

      if (existing) {
        console.log(`  ⚠️  Product already exists: ${product.entity_name}`)
        continue
      }

      // Create product entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'product',
          entity_name: product.entity_name,
          entity_code: product.entity_code,
          smart_code: product.smart_code,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (entityError) {
        console.error(`  ❌ Error creating ${product.entity_name}:`, entityError.message)
        continue
      }

      // Create dynamic data fields
      const dynamicFields = [
        { field_name: 'product_cost', field_value_number: product.product_cost },
        { field_name: 'retail_price', field_value_number: product.retail_price },
        { field_name: 'current_stock', field_value_number: product.current_stock },
        { field_name: 'reorder_level', field_value_number: product.reorder_level },
        { field_name: 'safety_stock', field_value_number: product.safety_stock },
        { field_name: 'unit_of_measure', field_value_text: product.unit_of_measure }
      ]

      for (const field of dynamicFields) {
        const { error } = await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: ORGANIZATION_ID,
            entity_id: entity.id,
            field_name: field.field_name,
            field_value_number: field.field_value_number,
            field_value_text: field.field_value_text,
            smart_code: `HERA.SALON.INV.DYN.${field.field_name.toUpperCase().substring(0,4)}.v1`,
            created_at: new Date().toISOString()
          })

        if (error) {
          console.error(`    ❌ Error setting ${field.field_name}:`, error.message)
        }
      }

      console.log(`  ✅ Created: ${product.entity_name} (${product.entity_code})`)
      console.log(`     Cost: ${product.product_cost} AED | Price: ${product.retail_price} AED`)
      console.log(`     Stock: ${product.current_stock} ${product.unit_of_measure} | Reorder at: ${product.reorder_level}`)

    } catch (error) {
      console.error(`  ❌ Unexpected error:`, error.message)
    }
  }
}

// Also create some product sale transactions
async function createProductSales() {
  console.log('\n💰 Creating sample product sales...\n')

  const productSales = [
    {
      transaction_code: 'SALE-PROD-001',
      customer_name: 'Aisha Mohammed',
      products: [
        { name: 'Hair Spray', quantity: 1 },
        { name: 'Styling Gel', quantity: 1 }
      ],
      total: 55.00
    },
    {
      transaction_code: 'SALE-PROD-002',
      customer_name: 'Fatima Al-Rashid',
      products: [
        { name: 'Keratin Treatment', quantity: 1 },
        { name: 'Hair Mask', quantity: 2 }
      ],
      total: 380.00
    },
    {
      transaction_code: 'SALE-PROD-003',
      customer_name: 'Sarah Ahmed',
      products: [
        { name: 'Nail Polish', quantity: 2 },
        { name: 'Base Coat', quantity: 1 },
        { name: 'Top Coat', quantity: 1 }
      ],
      total: 90.00
    }
  ]

  // Get product entities
  const { data: products } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORGANIZATION_ID)
    .eq('entity_type', 'product')

  const productMap = new Map()
  products?.forEach(p => productMap.set(p.entity_name, p))

  for (const sale of productSales) {
    // Create transaction
    const { data: txn, error: txnError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORGANIZATION_ID,
        transaction_type: 'sale',
        transaction_code: sale.transaction_code,
        transaction_date: new Date().toISOString(),
        total_amount: sale.total,
        smart_code: 'HERA.SALON.SALE.TXN.PROD.v1',
        metadata: {
          customer_name: sale.customer_name,
          payment_method: 'cash'
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (txnError) {
      console.error(`  ❌ Error creating sale ${sale.transaction_code}:`, txnError.message)
      continue
    }

    // Create transaction lines
    let lineNumber = 1
    for (const item of sale.products) {
      const product = productMap.get(item.name)
      if (!product) continue

      // Get product price
      const { data: priceData } = await supabase
        .from('core_dynamic_data')
        .select('field_value_number')
        .eq('entity_id', product.id)
        .eq('field_name', 'retail_price')
        .single()

      const unitPrice = priceData?.field_value_number || 0

      const { error } = await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: ORGANIZATION_ID,
          transaction_id: txn.id,
          line_number: lineNumber++,
          line_entity_id: product.id,
          quantity: item.quantity,
          unit_price: unitPrice,
          line_amount: unitPrice * item.quantity,
          smart_code: 'HERA.SALON.SALE.LINE.PRODUCT.v1',
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error(`    ❌ Error creating line for ${item.name}:`, error.message)
      }
    }

    console.log(`  ✅ Created sale: ${sale.transaction_code} - ${sale.customer_name} (${sale.total} AED)`)
  }
}

async function main() {
  console.log('🚀 Stage G - Product Creation for Hair Talkz Salon')
  console.log('=' .repeat(60))
  console.log()

  // Create products
  await createProducts()

  // Create sample sales
  await createProductSales()

  console.log('\n✅ Product setup complete!')
}

// Run the script
main().catch(console.error)