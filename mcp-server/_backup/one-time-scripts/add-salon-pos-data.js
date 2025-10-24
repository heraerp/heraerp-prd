#!/usr/bin/env node
/**
 * Add Sample Salon Services and Products with Prices
 * This script adds test data for the salon POS system
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Sample services with prices
const salonServices = [
  { 
    name: 'Haircut - Women', 
    category: 'hair',
    price: 150,
    duration: 45,
    description: 'Professional women\'s haircut with styling'
  },
  { 
    name: 'Haircut - Men', 
    category: 'hair',
    price: 80,
    duration: 30,
    description: 'Professional men\'s haircut'
  },
  { 
    name: 'Hair Color - Full', 
    category: 'hair',
    price: 350,
    duration: 120,
    description: 'Full head color treatment'
  },
  { 
    name: 'Highlights', 
    category: 'hair',
    price: 450,
    duration: 150,
    description: 'Professional highlights'
  },
  { 
    name: 'Manicure', 
    category: 'nails',
    price: 120,
    duration: 45,
    description: 'Classic manicure'
  },
  { 
    name: 'Pedicure', 
    category: 'nails',
    price: 150,
    duration: 60,
    description: 'Classic pedicure'
  },
  { 
    name: 'Gel Nails', 
    category: 'nails',
    price: 200,
    duration: 90,
    description: 'Gel nail application'
  },
  { 
    name: 'Facial - Basic', 
    category: 'skincare',
    price: 250,
    duration: 60,
    description: 'Basic facial treatment'
  },
  { 
    name: 'Facial - Premium', 
    category: 'skincare',
    price: 450,
    duration: 90,
    description: 'Premium facial with advanced treatments'
  }
]

// Sample products with prices
const salonProducts = [
  { 
    name: 'Shampoo - Professional', 
    brand: 'L\'Oreal',
    price: 85,
    stock: 25,
    category: 'hair-care'
  },
  { 
    name: 'Conditioner - Professional', 
    brand: 'L\'Oreal',
    price: 85,
    stock: 20,
    category: 'hair-care'
  },
  { 
    name: 'Hair Serum', 
    brand: 'Moroccan Oil',
    price: 180,
    stock: 15,
    category: 'hair-care'
  },
  { 
    name: 'Nail Polish - OPI', 
    brand: 'OPI',
    price: 45,
    stock: 50,
    category: 'nail-care'
  },
  { 
    name: 'Hand Cream', 
    brand: 'Clarins',
    price: 120,
    stock: 30,
    category: 'skincare'
  },
  { 
    name: 'Face Cream - Day', 
    brand: 'Clinique',
    price: 280,
    stock: 12,
    category: 'skincare'
  },
  { 
    name: 'Face Cream - Night', 
    brand: 'Clinique',
    price: 320,
    stock: 10,
    category: 'skincare'
  }
]

async function addSalonPOSData() {
  console.log('💇 Adding salon POS data...\n')

  try {
    const orgId = '550e8400-e29b-41d4-a716-446655440000'
    console.log(`Organization ID: ${orgId}\n`)

    // Add services
    console.log('📋 Adding Services...')
    for (const service of salonServices) {
      console.log(`  Processing: ${service.name}`)
      
      // Check if service already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id, entity_name')
        .eq('organization_id', orgId)
        .eq('entity_type', 'salon_service')
        .eq('entity_name', service.name)
        .single()

      if (existing) {
        console.log(`    ✓ Already exists`)
        
        // Update price if missing
        const { data: priceData } = await supabase
          .from('core_dynamic_data')
          .select('id')
          .eq('entity_id', existing.id)
          .eq('field_name', 'price')
          .single()

        if (!priceData) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: orgId,
              entity_id: existing.id,
              field_name: 'price',
              field_value_number: service.price,
              smart_code: 'HERA.SALON.SERVICE.DYN.PRICE.v1'
            })
          console.log(`    ✓ Added price: AED ${service.price}`)
        }
        continue
      }

      // Create new service
      const { data: newService, error: createError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'salon_service',
          entity_name: service.name,
          entity_code: `SERVICE-${service.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}`,
          smart_code: `HERA.SALON.SERVICE.${service.category.toUpperCase()}.v1`,
          status: 'active',
          metadata: {
            category: service.category
          }
        })
        .select()
        .single()

      if (createError) {
        console.error(`    ❌ Error creating service:`, createError.message)
        continue
      }

      console.log(`    ✅ Created service entity`)

      // Add dynamic fields
      const dynamicFields = [
        { field_name: 'price', field_value_number: service.price },
        { field_name: 'duration', field_value_number: service.duration },
        { field_name: 'description', field_value_text: service.description },
        { field_name: 'category', field_value_text: service.category }
      ]

      for (const field of dynamicFields) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: orgId,
            entity_id: newService.id,
            ...field,
            smart_code: `HERA.SALON.SERVICE.DYN.${field.field_name.toUpperCase()}.v1`
          })
      }
      console.log(`    ✅ Added all fields including price: AED ${service.price}`)
    }

    // Add products
    console.log('\n📦 Adding Products...')
    for (const product of salonProducts) {
      console.log(`  Processing: ${product.name}`)
      
      // Check if product already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id, entity_name')
        .eq('organization_id', orgId)
        .eq('entity_type', 'salon_product_item')
        .eq('entity_name', product.name)
        .single()

      if (existing) {
        console.log(`    ✓ Already exists`)
        
        // Update price if missing
        const { data: priceData } = await supabase
          .from('core_dynamic_data')
          .select('id')
          .eq('entity_id', existing.id)
          .eq('field_name', 'price')
          .single()

        if (!priceData) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: orgId,
              entity_id: existing.id,
              field_name: 'price',
              field_value_number: product.price,
              smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.v1'
            })
          console.log(`    ✓ Added price: AED ${product.price}`)
        }
        continue
      }

      // Create new product
      const { data: newProduct, error: createError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'salon_product_item',
          entity_name: product.name,
          entity_code: `PROD-${product.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}`,
          smart_code: `HERA.SALON.PRODUCT.${product.category.toUpperCase()}.v1`,
          status: 'active',
          metadata: {
            category: product.category
          }
        })
        .select()
        .single()

      if (createError) {
        console.error(`    ❌ Error creating product:`, createError.message)
        continue
      }

      console.log(`    ✅ Created product entity`)

      // Add dynamic fields
      const dynamicFields = [
        { field_name: 'price', field_value_number: product.price },
        { field_name: 'brand', field_value_text: product.brand },
        { field_name: 'current_stock', field_value_number: product.stock },
        { field_name: 'category', field_value_text: product.category }
      ]

      for (const field of dynamicFields) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: orgId,
            entity_id: newProduct.id,
            ...field,
            smart_code: `HERA.SALON.PRODUCT.DYN.${field.field_name.toUpperCase()}.v1`
          })
      }
      console.log(`    ✅ Added all fields including price: AED ${product.price}`)
    }

    // Display summary
    console.log('\n📊 Summary:')
    
    const { data: allServices } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', orgId)
      .eq('entity_type', 'salon_service')
      .eq('status', 'active')

    const { data: allProducts } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', orgId)
      .eq('entity_type', 'product')
      .eq('status', 'active')

    console.log(`Total active services: ${allServices?.length || 0}`)
    console.log(`Total active products: ${allProducts?.length || 0}`)

    console.log('\n✅ Salon POS data setup completed!')
    console.log('You can now test the POS at /salon/pos')
    
  } catch (error) {
    console.error('\n❌ Error adding salon POS data:', error.message)
    console.error(error)
  }
}

// Run the script
addSalonPOSData()