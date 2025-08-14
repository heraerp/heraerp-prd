#!/usr/bin/env node

/**
 * Simple seed script that creates menu items directly
 * This bypasses the complex organization constraints for testing
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Generate UUID v4
function generateUUID() {
  return crypto.randomUUID()
}

// Load environment variables manually from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

async function simpleSeed() {
  console.log('🍕 Creating simple menu items for testing...')
  
  try {
    const orgId = '550e8400-e29b-41d4-a716-446655440000'
    
    // Create menu items directly
    console.log('🍝 Creating menu items...')
    
    const pizzaId = generateUUID()
    const pastaId = generateUUID()
    const saladId = generateUUID()
    
    const menuItems = [
      {
        id: pizzaId,
        organization_id: orgId,
        entity_type: 'menu_item',
        entity_name: 'Margherita Pizza',
        entity_code: 'PIZZA_MARG',
        status: 'active'
      },
      {
        id: pastaId,
        organization_id: orgId,
        entity_type: 'menu_item',
        entity_name: 'Spaghetti Carbonara',
        entity_code: 'PASTA_CARB',
        status: 'active'
      },
      {
        id: saladId,
        organization_id: orgId,
        entity_type: 'menu_item',
        entity_name: 'Caesar Salad',
        entity_code: 'SALAD_CAES',
        status: 'active'
      }
    ]
    
    // First, clean up existing menu items
    await supabase
      .from('core_entities')
      .delete()
      .eq('organization_id', orgId)
      .eq('entity_type', 'menu_item')
    
    // Insert menu items
    const { error: menuError } = await supabase
      .from('core_entities')
      .insert(menuItems)
    
    if (menuError) {
      console.error('Menu error:', menuError)
      throw menuError
    }
    console.log('✅ Created 3 menu items')
    
    // Add menu item properties
    console.log('💰 Adding menu properties...')
    const menuProperties = [
      // Margherita Pizza
      { entity_id: pizzaId, field_name: 'price', field_value: '18.50', field_type: 'decimal' },
      { entity_id: pizzaId, field_name: 'description', field_value: 'Classic pizza with fresh mozzarella, tomatoes, and basil', field_type: 'text' },
      { entity_id: pizzaId, field_name: 'category', field_value: 'Pizza', field_type: 'text' },
      { entity_id: pizzaId, field_name: 'prep_time', field_value: '12', field_type: 'integer' },
      { entity_id: pizzaId, field_name: 'dietary_tags', field_value: '["vegetarian", "gluten_free_option"]', field_type: 'json' },
      { entity_id: pizzaId, field_name: 'ingredients', field_value: 'Tomato sauce, fresh mozzarella, basil, olive oil', field_type: 'text' },
      { entity_id: pizzaId, field_name: 'popularity', field_value: '95', field_type: 'integer' },
      
      // Spaghetti Carbonara
      { entity_id: pastaId, field_name: 'price', field_value: '22.00', field_type: 'decimal' },
      { entity_id: pastaId, field_name: 'description', field_value: 'Traditional Roman pasta with eggs, cheese, and pancetta', field_type: 'text' },
      { entity_id: pastaId, field_name: 'category', field_value: 'Pasta', field_type: 'text' },
      { entity_id: pastaId, field_name: 'prep_time', field_value: '15', field_type: 'integer' },
      { entity_id: pastaId, field_name: 'dietary_tags', field_value: '[]', field_type: 'json' },
      { entity_id: pastaId, field_name: 'ingredients', field_value: 'Spaghetti, eggs, pecorino cheese, pancetta, black pepper', field_type: 'text' },
      { entity_id: pastaId, field_name: 'popularity', field_value: '88', field_type: 'integer' },
      
      // Caesar Salad
      { entity_id: saladId, field_name: 'price', field_value: '14.50', field_type: 'decimal' },
      { entity_id: saladId, field_name: 'description', field_value: 'Crisp romaine lettuce with parmesan and homemade croutons', field_type: 'text' },
      { entity_id: saladId, field_name: 'category', field_value: 'Salads', field_type: 'text' },
      { entity_id: saladId, field_name: 'prep_time', field_value: '8', field_type: 'integer' },
      { entity_id: saladId, field_name: 'dietary_tags', field_value: '["vegetarian", "keto_friendly"]', field_type: 'json' },
      { entity_id: saladId, field_name: 'ingredients', field_value: 'Romaine lettuce, parmesan, croutons, caesar dressing', field_type: 'text' },
      { entity_id: saladId, field_name: 'popularity', field_value: '72', field_type: 'integer' }
    ]
    
    // Delete existing menu properties
    await supabase
      .from('core_dynamic_data')
      .delete()
      .in('entity_id', [pizzaId, pastaId, saladId])
    
    const { error: menuPropsError } = await supabase
      .from('core_dynamic_data')
      .insert(menuProperties)
    
    if (menuPropsError) {
      console.error('Menu properties error:', menuPropsError)
      throw menuPropsError
    }
    console.log('✅ Added menu properties')
    
    console.log('\n🎉 Simple menu data seeded successfully!')
    console.log('\n📋 What was created:')
    console.log('✅ 3 sample menu items (Pizza, Pasta, Salad)')
    console.log('\n🚀 Ready to test at: http://localhost:3001/restaurant')
    console.log('💡 Note: Menu should now load from real Supabase data!')
    
  } catch (error) {
    console.error('\n❌ Error seeding menu data:', error)
    process.exit(1)
  }
}

// Run the seeding
if (require.main === module) {
  simpleSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { simpleSeed }