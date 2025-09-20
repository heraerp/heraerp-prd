#!/usr/bin/env node

/**
 * Script to update salon service prices in production database
 * This ensures all services have proper pricing in their metadata
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Default service pricing data
const DEFAULT_PRICES = {
  // Hair Services
  'Classic Cut': 60,
  'Premium Cut & Style': 120,
  'Balayage': 350,
  'Full Color': 200,
  'Highlights': 280,
  'Root Touch Up': 120,
  'Glossing Treatment': 95,
  'Toner': 85,
  
  // Treatments
  'Keratin Treatment': 450,
  'Deep Conditioning': 80,
  'Olaplex Treatment': 120,
  'Scalp Treatment': 90,
  'Hair Mask': 75,
  
  // Styling
  'Blowout': 75,
  'Updo': 150,
  'Special Event Style': 200,
  'Curls & Waves': 95,
  
  // Beauty
  'Makeup Application': 120,
  'Bridal Makeup': 250,
  'Eyebrow Threading': 25,
  'Eyebrow Tinting': 35,
  'Lash Extensions': 180,
  'Lash Lift': 95,
  
  // Nails
  'Manicure': 45,
  'Pedicure': 65,
  'Gel Polish': 60,
  'Nail Art': 25,
  'Gel Extensions': 85,
  
  // Men's Services
  'Beard Trim': 35,
  'Hot Towel Shave': 55,
  'Men\'s Cut': 45,
  'Men\'s Color': 120,
  
  // Spa Services
  'Facial': 180,
  'Massage': 200,
  'Body Wrap': 220,
  'Microdermabrasion': 150,
  
  // Hair Extensions
  'Hair Extensions Consultation': 0,
  'Hair Extensions Install': 800,
  'Extensions Maintenance': 200
}

async function updateServicePrices() {
  try {
    console.log('🔄 Starting service price update...')
    
    // Get all service entities
    const { data: services, error: fetchError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'service')
      .limit(1000)
    
    if (fetchError) {
      console.error('❌ Error fetching services:', fetchError)
      return
    }
    
    console.log(`📋 Found ${services.length} services to process`)
    
    let updated = 0
    let skipped = 0
    
    for (const service of services) {
      // Check if service already has a price in metadata
      const currentPrice = service.metadata?.price || service.metadata?.base_price
      
      if (currentPrice && currentPrice > 0) {
        console.log(`✓ ${service.entity_name} already has price: $${currentPrice}`)
        skipped++
        continue
      }
      
      // Look for a default price based on service name
      let newPrice = 0
      for (const [serviceName, price] of Object.entries(DEFAULT_PRICES)) {
        if (service.entity_name.toLowerCase().includes(serviceName.toLowerCase())) {
          newPrice = price
          break
        }
      }
      
      // If no match found, set a default price based on category
      if (newPrice === 0) {
        const category = service.metadata?.category || ''
        if (category.toLowerCase().includes('color')) newPrice = 150
        else if (category.toLowerCase().includes('cut')) newPrice = 75
        else if (category.toLowerCase().includes('treatment')) newPrice = 100
        else if (category.toLowerCase().includes('style')) newPrice = 85
        else if (category.toLowerCase().includes('nail')) newPrice = 50
        else if (category.toLowerCase().includes('spa')) newPrice = 150
        else newPrice = 75 // Default price
      }
      
      // Update the service metadata with the price
      const updatedMetadata = {
        ...(service.metadata || {}),
        price: newPrice,
        base_price: newPrice,
        currency: 'AED',
        price_updated_at: new Date().toISOString(),
        price_updated_by: 'system_price_update'
      }
      
      const { error: updateError } = await supabase
        .from('core_entities')
        .update({ metadata: updatedMetadata })
        .eq('id', service.id)
      
      if (updateError) {
        console.error(`❌ Error updating ${service.entity_name}:`, updateError)
      } else {
        console.log(`✅ Updated ${service.entity_name} with price: $${newPrice}`)
        updated++
      }
    }
    
    console.log('\n📊 Summary:')
    console.log(`✅ Updated: ${updated} services`)
    console.log(`⏭️  Skipped: ${skipped} services (already had prices)`)
    console.log(`📋 Total processed: ${services.length} services`)
    
  } catch (error) {
    console.error('❌ Error in updateServicePrices:', error)
  }
}

// Add option to update products as well
async function updateProductPrices() {
  try {
    console.log('\n🔄 Starting product price update...')
    
    // Get all product entities
    const { data: products, error: fetchError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'product')
      .limit(1000)
    
    if (fetchError) {
      console.error('❌ Error fetching products:', fetchError)
      return
    }
    
    console.log(`📋 Found ${products.length} products to process`)
    
    // Default product prices
    const DEFAULT_PRODUCT_PRICES = {
      'Shampoo': 45,
      'Conditioner': 45,
      'Hair Mask': 65,
      'Styling Cream': 38,
      'Hair Oil': 55,
      'Heat Protectant': 42,
      'Hair Spray': 35,
      'Dry Shampoo': 38,
      'Hair Serum': 58,
      'Leave-in Treatment': 48
    }
    
    let updated = 0
    let skipped = 0
    
    for (const product of products) {
      const currentPrice = product.metadata?.price || product.metadata?.base_price
      
      if (currentPrice && currentPrice > 0) {
        console.log(`✓ ${product.entity_name} already has price: $${currentPrice}`)
        skipped++
        continue
      }
      
      // Look for a default price
      let newPrice = 0
      for (const [productName, price] of Object.entries(DEFAULT_PRODUCT_PRICES)) {
        if (product.entity_name.toLowerCase().includes(productName.toLowerCase())) {
          newPrice = price
          break
        }
      }
      
      // Default price if no match
      if (newPrice === 0) newPrice = 40
      
      const updatedMetadata = {
        ...(product.metadata || {}),
        price: newPrice,
        base_price: newPrice,
        currency: 'AED',
        price_updated_at: new Date().toISOString(),
        price_updated_by: 'system_price_update'
      }
      
      const { error: updateError } = await supabase
        .from('core_entities')
        .update({ metadata: updatedMetadata })
        .eq('id', product.id)
      
      if (updateError) {
        console.error(`❌ Error updating ${product.entity_name}:`, updateError)
      } else {
        console.log(`✅ Updated ${product.entity_name} with price: $${newPrice}`)
        updated++
      }
    }
    
    console.log('\n📊 Product Summary:')
    console.log(`✅ Updated: ${updated} products`)
    console.log(`⏭️  Skipped: ${skipped} products (already had prices)`)
    console.log(`📋 Total processed: ${products.length} products`)
    
  } catch (error) {
    console.error('❌ Error in updateProductPrices:', error)
  }
}

// Run the updates
async function main() {
  console.log('🎯 HERA Salon Price Update Script')
  console.log('================================\n')
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables. Please check your .env.local file')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  
  // Update services
  await updateServicePrices()
  
  // Update products
  await updateProductPrices()
  
  console.log('\n✅ Price update complete!')
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  updateServicePrices,
  updateProductPrices
}