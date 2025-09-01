#!/usr/bin/env node

/**
 * Setup Ice Cream Demo Data
 * Creates the Kochi Ice Cream Manufacturing demo organization and sample data
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Ice cream demo organization ID (must match the one in demo-org-resolver.ts)
const ICE_CREAM_ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

async function setupIceCreamDemo() {
  console.log('Setting up Ice Cream demo data...')
  
  try {
    // 1. Create organization
    console.log('Creating organization...')
    const { error: orgError } = await supabase
      .from('core_organizations')
      .upsert({
        id: ICE_CREAM_ORG_ID,
        organization_name: 'Kochi Ice Cream Manufacturing',
        organization_type: 'manufacturing',
        metadata: {
          industry: 'ice_cream',
          location: 'Kochi, Kerala',
          established: '2020',
          demo: true
        }
      })
    
    if (orgError && orgError.code !== '23505') { // Ignore duplicate key error
      throw orgError
    }
    
    // 2. Create products (ice cream flavors)
    console.log('Creating products...')
    const products = [
      // Premium Range
      { code: 'ICE-001', name: 'Belgian Chocolate', category: 'premium', price: 350 },
      { code: 'ICE-002', name: 'Madagascar Vanilla', category: 'premium', price: 320 },
      { code: 'ICE-003', name: 'Sicilian Pistachio', category: 'premium', price: 380 },
      { code: 'ICE-004', name: 'Japanese Matcha', category: 'premium', price: 360 },
      { code: 'ICE-005', name: 'French Lavender Honey', category: 'premium', price: 340 },
      
      // Classic Range
      { code: 'ICE-101', name: 'Classic Vanilla', category: 'classic', price: 180 },
      { code: 'ICE-102', name: 'Rich Chocolate', category: 'classic', price: 190 },
      { code: 'ICE-103', name: 'Fresh Strawberry', category: 'classic', price: 200 },
      { code: 'ICE-104', name: 'Cookies & Cream', category: 'classic', price: 210 },
      { code: 'ICE-105', name: 'Mint Chocolate Chip', category: 'classic', price: 195 },
      
      // Tropical Range
      { code: 'ICE-201', name: 'Kerala Coconut', category: 'tropical', price: 220 },
      { code: 'ICE-202', name: 'Alphonso Mango', category: 'tropical', price: 250 },
      { code: 'ICE-203', name: 'Tender Coconut', category: 'tropical', price: 230 },
      { code: 'ICE-204', name: 'Jackfruit Delight', category: 'tropical', price: 240 },
      { code: 'ICE-205', name: 'Passion Fruit Swirl', category: 'tropical', price: 245 },
      
      // Sugar-Free Range
      { code: 'ICE-301', name: 'Sugar-Free Vanilla', category: 'sugar_free', price: 280 },
      { code: 'ICE-302', name: 'Sugar-Free Chocolate', category: 'sugar_free', price: 290 },
      { code: 'ICE-303', name: 'Sugar-Free Berry Mix', category: 'sugar_free', price: 300 },
      
      // Seasonal Specials
      { code: 'ICE-401', name: 'Rose Kulfi', category: 'seasonal', price: 260 },
      { code: 'ICE-402', name: 'Saffron Badam', category: 'seasonal', price: 320 },
      { code: 'ICE-403', name: 'Thandai Fusion', category: 'seasonal', price: 280 },
      
      // Vegan Range
      { code: 'ICE-501', name: 'Vegan Dark Chocolate', category: 'vegan', price: 310 },
      { code: 'ICE-502', name: 'Vegan Coconut Vanilla', category: 'vegan', price: 300 },
      { code: 'ICE-503', name: 'Vegan Berry Blast', category: 'vegan', price: 320 },
      
      // Kids Special
      { code: 'ICE-601', name: 'Bubblegum Fantasy', category: 'kids', price: 170 },
      { code: 'ICE-602', name: 'Cotton Candy Dream', category: 'kids', price: 175 },
      { code: 'ICE-603', name: 'Rainbow Sherbet', category: 'kids', price: 165 },
      
      // Artisanal Collection
      { code: 'ICE-701', name: 'Salted Caramel Swirl', category: 'artisanal', price: 390 },
      { code: 'ICE-702', name: 'Honey Lavender', category: 'artisanal', price: 380 },
      { code: 'ICE-703', name: 'Earl Grey Tea', category: 'artisanal', price: 370 }
    ]
    
    for (const product of products) {
      const { error } = await supabase
        .from('core_entities')
        .upsert({
          organization_id: ICE_CREAM_ORG_ID,
          entity_type: 'product',
          entity_code: product.code,
          entity_name: product.name,
          metadata: {
            category: product.category,
            price_per_liter: product.price,
            serving_size: '100ml',
            calories_per_serving: Math.floor(Math.random() * 100) + 150,
            allergens: ['milk', 'may contain nuts']
          }
        })
      
      if (error && error.code !== '23505') {
        console.error(`Error creating product ${product.name}:`, error)
      }
    }
    
    // 3. Create outlets
    console.log('Creating outlets...')
    const outlets = [
      { code: 'OUTLET-001', name: 'Marine Drive Store', area: 'Marine Drive' },
      { code: 'OUTLET-002', name: 'Fort Kochi Outlet', area: 'Fort Kochi' },
      { code: 'OUTLET-003', name: 'Lulu Mall Kiosk', area: 'Edappally' },
      { code: 'OUTLET-004', name: 'Centre Square Mall', area: 'MG Road' },
      { code: 'OUTLET-005', name: 'Panampilly Nagar Store', area: 'Panampilly Nagar' },
      { code: 'OUTLET-006', name: 'Kakkanad Tech Park', area: 'Kakkanad' },
      { code: 'OUTLET-007', name: 'Vyttila Hub', area: 'Vyttila' },
      { code: 'OUTLET-008', name: 'Oberon Mall Store', area: 'Edappally' },
      { code: 'OUTLET-009', name: 'Gold Souk Grande', area: 'Vytilla' },
      { code: 'OUTLET-010', name: 'Bay Pride Mall', area: 'Marine Drive' },
      { code: 'OUTLET-011', name: 'Abad Nucleus Mall', area: 'Maradu' },
      { code: 'OUTLET-012', name: 'Sobha City Mall', area: 'Thrikkakara' }
    ]
    
    for (const outlet of outlets) {
      const { error } = await supabase
        .from('core_entities')
        .upsert({
          organization_id: ICE_CREAM_ORG_ID,
          entity_type: 'location',
          entity_code: outlet.code,
          entity_name: outlet.name,
          metadata: {
            location_type: 'retail_outlet',
            area: outlet.area,
            city: 'Kochi',
            state: 'Kerala',
            capacity: Math.floor(Math.random() * 50) + 50,
            operating_hours: '10:00 AM - 10:00 PM'
          }
        })
      
      if (error && error.code !== '23505') {
        console.error(`Error creating outlet ${outlet.name}:`, error)
      }
    }
    
    // 4. Create some sample transactions (recent sales)
    console.log('Creating sample transactions...')
    const transactionTypes = ['sale', 'production_batch', 'quality_check']
    const today = new Date()
    
    for (let i = 0; i < 10; i++) {
      const transactionDate = new Date(today)
      transactionDate.setDate(today.getDate() - i)
      
      const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)]
      const amount = Math.floor(Math.random() * 50000) + 10000
      
      const { data: txn, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: ICE_CREAM_ORG_ID,
          transaction_type: transactionType,
          transaction_code: `TXN-${Date.now()}-${i}`,
          transaction_date: transactionDate.toISOString(),
          total_amount: amount,
          transaction_status: i < 3 ? 'completed' : 'in_progress',
          metadata: {
            demo: true,
            batch_number: transactionType === 'production_batch' ? `BATCH-${i}` : null,
            qc_status: transactionType === 'quality_check' ? 'passed' : null
          }
        })
        .select()
        .single()
      
      if (error) {
        console.error(`Error creating transaction ${i}:`, error)
      } else if (txn && transactionType === 'sale') {
        // Add line items for sales
        const numItems = Math.floor(Math.random() * 3) + 1
        for (let j = 0; j < numItems; j++) {
          const product = products[Math.floor(Math.random() * products.length)]
          const quantity = Math.floor(Math.random() * 5) + 1
          
          await supabase
            .from('universal_transaction_lines')
            .insert({
              transaction_id: txn.id,
              line_number: j + 1,
              line_type: 'product',
              quantity: quantity,
              unit_price: product.price,
              line_amount: quantity * product.price,
              metadata: {
                product_code: product.code,
                product_name: product.name
              }
            })
        }
      }
    }
    
    // 5. Create production batch records
    console.log('Creating production batches...')
    for (let i = 0; i < 5; i++) {
      const batchDate = new Date(today)
      batchDate.setDate(today.getDate() - i * 2)
      
      const { error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: ICE_CREAM_ORG_ID,
          transaction_type: 'production_batch',
          transaction_code: `BATCH-2024-${String(i + 1).padStart(3, '0')}`,
          transaction_date: batchDate.toISOString(),
          total_amount: Math.floor(Math.random() * 100000) + 50000,
          transaction_status: i === 0 ? 'in_progress' : 'completed',
          metadata: {
            batch_size_liters: Math.floor(Math.random() * 500) + 500,
            production_line: ['Line A', 'Line B', 'Line C'][Math.floor(Math.random() * 3)],
            shift: ['Morning', 'Evening', 'Night'][Math.floor(Math.random() * 3)],
            efficiency_percentage: Math.floor(Math.random() * 10) + 90
          }
        })
      
      if (error) {
        console.error(`Error creating production batch ${i}:`, error)
      }
    }
    
    console.log('✅ Ice cream demo data setup complete!')
    console.log(`Organization ID: ${ICE_CREAM_ORG_ID}`)
    console.log('You can now access the ice cream demo at /icecream')
    
  } catch (error) {
    console.error('Error setting up demo data:', error)
    process.exit(1)
  }
}

// Run the setup
setupIceCreamDemo()