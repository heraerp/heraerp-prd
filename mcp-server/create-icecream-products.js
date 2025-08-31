#!/usr/bin/env node

/**
 * Create Ice Cream Products for Demo
 * Uses HERA universal architecture
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

async function createIceCreamProducts() {
  console.log('🍦 Creating ice cream products...\n')

  const products = [
    // Premium Ice Creams
    {
      entity_name: 'Vanilla Supreme',
      entity_code: 'ICE-VANILLA-001',
      smart_code: 'HERA.MFG.PRODUCT.ICECREAM.VANILLA.v1',
      metadata: {
        category: 'premium',
        flavor: 'vanilla',
        size: '500ml',
        unit: 'containers',
        cost_per_unit: 120,
        price_per_unit: 200,
        ingredients: ['milk', 'cream', 'sugar', 'vanilla extract'],
        calories_per_100g: 207,
        shelf_life_days: 180
      }
    },
    {
      entity_name: 'Belgian Chocolate',
      entity_code: 'ICE-CHOCO-001',
      smart_code: 'HERA.MFG.PRODUCT.ICECREAM.CHOCOLATE.v1',
      metadata: {
        category: 'premium',
        flavor: 'chocolate',
        size: '500ml',
        unit: 'containers',
        cost_per_unit: 150,
        price_per_unit: 250,
        ingredients: ['milk', 'cream', 'sugar', 'belgian chocolate', 'cocoa'],
        calories_per_100g: 236,
        shelf_life_days: 180
      }
    },
    {
      entity_name: 'Strawberry Delight',
      entity_code: 'ICE-STRAW-001',
      smart_code: 'HERA.MFG.PRODUCT.ICECREAM.STRAWBERRY.v1',
      metadata: {
        category: 'premium',
        flavor: 'strawberry',
        size: '500ml',
        unit: 'containers',
        cost_per_unit: 140,
        price_per_unit: 240,
        ingredients: ['milk', 'cream', 'sugar', 'strawberry pulp', 'natural color'],
        calories_per_100g: 192,
        shelf_life_days: 180
      }
    },
    // Family Packs
    {
      entity_name: 'Mango Family Pack',
      entity_code: 'ICE-MANGO-FAM',
      smart_code: 'HERA.MFG.PRODUCT.ICECREAM.MANGO.FAMILY.v1',
      metadata: {
        category: 'family_pack',
        flavor: 'mango',
        size: '1000ml',
        unit: 'containers',
        cost_per_unit: 200,
        price_per_unit: 350,
        ingredients: ['milk', 'cream', 'sugar', 'alphonso mango pulp'],
        calories_per_100g: 198,
        shelf_life_days: 180
      }
    },
    {
      entity_name: 'Butterscotch Family Pack',
      entity_code: 'ICE-BUTTER-FAM',
      smart_code: 'HERA.MFG.PRODUCT.ICECREAM.BUTTERSCOTCH.FAMILY.v1',
      metadata: {
        category: 'family_pack',
        flavor: 'butterscotch',
        size: '1000ml',
        unit: 'containers',
        cost_per_unit: 220,
        price_per_unit: 380,
        ingredients: ['milk', 'cream', 'sugar', 'butterscotch sauce', 'cashew pieces'],
        calories_per_100g: 245,
        shelf_life_days: 180
      }
    },
    // Sugar-Free Options
    {
      entity_name: 'Sugar-Free Vanilla',
      entity_code: 'ICE-SF-VANILLA',
      smart_code: 'HERA.MFG.PRODUCT.ICECREAM.SUGARFREE.VANILLA.v1',
      metadata: {
        category: 'sugar_free',
        flavor: 'vanilla',
        size: '500ml',
        unit: 'containers',
        cost_per_unit: 180,
        price_per_unit: 300,
        ingredients: ['milk', 'cream', 'stevia', 'vanilla extract'],
        calories_per_100g: 120,
        shelf_life_days: 150,
        dietary: ['diabetic_friendly', 'low_calorie']
      }
    },
    // Kulfi Range
    {
      entity_name: 'Malai Kulfi',
      entity_code: 'ICE-KULFI-001',
      smart_code: 'HERA.MFG.PRODUCT.KULFI.MALAI.v1',
      metadata: {
        category: 'kulfi',
        flavor: 'malai',
        size: '100ml',
        unit: 'sticks',
        cost_per_unit: 20,
        price_per_unit: 35,
        ingredients: ['full cream milk', 'sugar', 'cardamom', 'pistachios'],
        calories_per_100g: 260,
        shelf_life_days: 120
      }
    },
    {
      entity_name: 'Kesar Pista Kulfi',
      entity_code: 'ICE-KULFI-002',
      smart_code: 'HERA.MFG.PRODUCT.KULFI.KESARPISTA.v1',
      metadata: {
        category: 'kulfi',
        flavor: 'kesar_pista',
        size: '100ml',
        unit: 'sticks',
        cost_per_unit: 25,
        price_per_unit: 40,
        ingredients: ['full cream milk', 'sugar', 'saffron', 'pistachios', 'almonds'],
        calories_per_100g: 275,
        shelf_life_days: 120
      }
    },
    // Sorbets
    {
      entity_name: 'Lemon Sorbet',
      entity_code: 'ICE-SORBET-001',
      smart_code: 'HERA.MFG.PRODUCT.SORBET.LEMON.v1',
      metadata: {
        category: 'sorbet',
        flavor: 'lemon',
        size: '500ml',
        unit: 'containers',
        cost_per_unit: 100,
        price_per_unit: 180,
        ingredients: ['water', 'sugar', 'lemon juice', 'lemon zest'],
        calories_per_100g: 110,
        shelf_life_days: 150,
        dietary: ['vegan', 'dairy_free']
      }
    },
    // Novelties
    {
      entity_name: 'Choco Bar',
      entity_code: 'ICE-BAR-001',
      smart_code: 'HERA.MFG.PRODUCT.NOVELTY.CHOCOBAR.v1',
      metadata: {
        category: 'novelty',
        flavor: 'chocolate',
        size: '80ml',
        unit: 'pieces',
        cost_per_unit: 15,
        price_per_unit: 25,
        ingredients: ['milk', 'cream', 'sugar', 'chocolate coating'],
        calories_per_100g: 290,
        shelf_life_days: 90
      }
    }
  ]

  try {
    for (const product of products) {
      console.log(`🍨 Creating ${product.entity_name}...`)

      // Create product entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'product',
          entity_name: product.entity_name,
          entity_code: product.entity_code,
          smart_code: product.smart_code,
          metadata: product.metadata
        })
        .select()
        .single()

      if (entityError) {
        console.error(`❌ Error creating ${product.entity_name}:`, entityError)
        continue
      }

      console.log(`✅ Created: ${product.entity_name} (${product.entity_code})`)

      // Add dynamic data for additional properties
      const dynamicFields = [
        { field_name: 'reorder_level', field_value_number: 50 },
        { field_name: 'max_stock_level', field_value_number: 500 },
        { field_name: 'production_batch_size', field_value_number: 100 },
        { field_name: 'quality_check_required', field_value_text: 'true' }
      ]

      for (const field of dynamicFields) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            entity_id: entity.id,
            organization_id: ORG_ID,
            field_name: field.field_name,
            field_value_text: field.field_value_text || null,
            field_value_number: field.field_value_number || null,
            smart_code: `HERA.MFG.FIELD.${field.field_name.toUpperCase()}.v1`
          })
      }
    }

    console.log('\n✅ All ice cream products created successfully!')
    console.log('\n📊 Product Summary:')
    console.log(`   Premium Ice Creams: 3`)
    console.log(`   Family Packs: 2`)
    console.log(`   Sugar-Free Options: 1`)
    console.log(`   Kulfi Range: 2`)
    console.log(`   Sorbets: 1`)
    console.log(`   Novelties: 1`)
    console.log(`   Total Products: ${products.length}`)

  } catch (error) {
    console.error('❌ Error creating products:', error)
    process.exit(1)
  }
}

// Run the setup
createIceCreamProducts()