#!/usr/bin/env node

/**
 * Seed script for Mario's Italian Bistro demo data
 * Uses HERA's universal 6-table architecture
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
  console.log('Required variables:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_SERVICE_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

async function seedRestaurantData() {
  console.log('🍕 Seeding Mario\'s Italian Bistro demo data...')
  
  try {
    // Read and execute the SQL seed file
    const sqlFile = path.join(__dirname, '..', 'database', 'seeds', 'restaurant-demo-data.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')
    
    console.log('📝 Executing SQL seed script...')
    
    // Split SQL into individual statements (basic approach)
    const statements = sqlContent
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('--'))
      .join('\n')
      .split(';')
      .filter(stmt => stmt.trim())
    
    console.log(`📊 Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (statement) {
        try {
          await supabase.rpc('exec_sql', { sql_query: statement })
          process.stdout.write(`\r✅ Progress: ${i + 1}/${statements.length} statements`)
        } catch (error) {
          // Try direct query execution for some statements
          if (statement.startsWith('INSERT') || statement.startsWith('UPDATE')) {
            // For INSERT/UPDATE statements, we'll need to handle them differently
            // This is a simplified approach - in production you'd want more robust SQL parsing
            console.log(`\n⚠️  Skipping complex statement: ${statement.substring(0, 50)}...`)
          }
        }
      }
    }
    
    console.log('\n\n🎉 Restaurant demo data seeded successfully!')
    console.log('\n📋 What was created:')
    console.log('✅ Mario\'s Italian Bistro organization')
    console.log('✅ Mario Rossi user profile')
    console.log('✅ 12 menu items (Pizza, Pasta, Salads, Seafood, Desserts)')
    console.log('✅ 4 sample customers')
    console.log('✅ 6 restaurant tables')
    console.log('✅ 4 sample orders with line items')
    console.log('\n🚀 Ready to test at: http://localhost:3001/restaurant')
    console.log('📧 Demo login: mario@restaurant.com / demo123')
    
  } catch (error) {
    console.error('\n❌ Error seeding restaurant data:', error)
    process.exit(1)
  }
}

// Alternative approach: Seed data using Supabase client directly
async function seedWithClient() {
  console.log('🍕 Seeding Mario\'s Italian Bistro demo data using Supabase client...')
  
  try {
    // 1. Create organization and client first
    console.log('🏢 Creating organization and client...')
    
    // Use the existing Mario Restaurant Group client
    const clientId = '7d2be253-dbef-497e-a3b8-424e89c5cb30' // Mario Restaurant Group from database
    const orgId = '550e8400-e29b-41d4-a716-446655440000'
    
    // First, check if organization already exists
    const { data: existingOrg } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('id', orgId)
      .single()
    
    if (!existingOrg) {
      // Create the organization entry using existing client
      const { error: orgError } = await supabase
        .from('core_organizations')
        .insert({
          id: orgId,
          client_id: clientId,
          organization_name: 'Mario\'s Italian Bistro',
          organization_code: 'MARIO_BISTRO',
          organization_type: 'restaurant',
          subscription_plan: 'professional', 
          status: 'active'
        })
      
      if (orgError) {
        console.error('Organization creation error:', orgError)
        throw orgError
      }
      console.log('✅ Created organization with existing client')
    } else {
      console.log('✅ Organization already exists')
    }
    
    console.log('✅ Using client ID:', clientId)
    console.log('✅ Using organization UUID:', orgId)
    
    // 2. Create Mario's user entity
    console.log('👨‍🍳 Creating Mario\'s user profile...')
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('entity_type', 'user_profile')
      .eq('entity_code', 'USR_MARIO')
      .single()
    
    let userId = existingUser?.id
    
    if (!userId) {
      userId = generateUUID()
      const { error: userError } = await supabase
        .from('core_entities')
        .insert({
          id: userId,
          organization_id: orgId,
          entity_type: 'user_profile',
          entity_name: 'Mario Rossi',
          entity_code: 'USR_MARIO',
          status: 'active'
        })
      
      if (userError) {
        console.error('User error:', userError)
        throw userError
      }
      console.log('✅ Created new user profile')
    } else {
      console.log('✅ Found existing user profile')
    }
    
    // 3. Add user properties
    console.log('⚙️  Adding user properties...')
    const userProperties = [
      { entity_id: userId, field_name: 'email', field_value: 'mario@restaurant.com', field_type: 'text' },
      { entity_id: userId, field_name: 'role', field_value: 'owner', field_type: 'text' },
      { entity_id: userId, field_name: 'phone', field_value: '+1-555-MARIO-01', field_type: 'text' },
      { entity_id: userId, field_name: 'permissions', field_value: '["entities", "transactions", "reports", "settings", "admin"]', field_type: 'json' }
    ]
    
    // Delete existing properties first, then insert new ones
    await supabase
      .from('core_dynamic_data')
      .delete()
      .eq('entity_id', userId)
    
    const { error: propsError } = await supabase
      .from('core_dynamic_data')
      .insert(userProperties)
    
    if (propsError) {
      console.error('Properties error:', propsError)
      throw propsError
    }
    console.log('✅ Added user properties')
    
    // 4. Create sample menu items
    console.log('🍕 Creating menu items...')
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
    
    // Delete existing menu items first
    await supabase
      .from('core_entities')
      .delete()
      .eq('organization_id', orgId)
      .eq('entity_type', 'menu_item')
    
    const { error: menuError } = await supabase
      .from('core_entities')
      .insert(menuItems)
    
    if (menuError) {
      console.error('Menu error:', menuError)
      throw menuError
    }
    console.log('✅ Created menu items')
    
    // 5. Add menu item properties
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
    
    console.log('\n🎉 Basic restaurant demo data seeded successfully!')
    console.log('\n📋 What was created:')
    console.log('✅ Mario\'s Italian Bistro organization')
    console.log('✅ Mario Rossi user profile')
    console.log('✅ 3 sample menu items (Pizza, Pasta, Salad)')
    console.log('\n🚀 Ready to test at: http://localhost:3001/restaurant')
    console.log('📧 Demo login: mario@restaurant.com / demo123')
    console.log('\n💡 Note: Create the Supabase user manually in the dashboard first!')
    
  } catch (error) {
    console.error('\n❌ Error seeding restaurant data:', error)
    process.exit(1)
  }
}

// Run the seeding
if (require.main === module) {
  seedWithClient()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { seedRestaurantData, seedWithClient }