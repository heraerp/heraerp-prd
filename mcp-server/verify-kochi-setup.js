#!/usr/bin/env node

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

async function verifySetup() {
  console.log('🔍 Verifying Kochi Ice Cream setup...\n')
  
  // 1. Check GL Accounts
  console.log('📊 GL Accounts:')
  const { data: glAccounts } = await supabase
    .from('core_entities')
    .select('entity_code, entity_name')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'gl_account')
    .limit(5)
    
  if (glAccounts && glAccounts.length > 0) {
    glAccounts.forEach(acc => {
      console.log(`  - ${acc.entity_code}: ${acc.entity_name}`)
    })
    console.log(`  ... and ${glAccounts.length > 5 ? 'more' : ''}`)
  } else {
    console.log('  ❌ No GL accounts found')
  }
  
  // 2. Check Locations
  console.log('\n🏭 Locations:')
  const { data: locations } = await supabase
    .from('core_entities')
    .select('entity_code, entity_name, metadata')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'location')
    
  if (locations && locations.length > 0) {
    locations.forEach(loc => {
      console.log(`  - ${loc.entity_code}: ${loc.entity_name}`)
      if (loc.metadata?.address) {
        console.log(`    Address: ${loc.metadata.address}`)
      }
    })
  } else {
    console.log('  ❌ No locations found')
  }
  
  // 3. Check Products
  console.log('\n🍦 Products:')
  const { data: products } = await supabase
    .from('core_entities')
    .select('entity_code, entity_name, metadata')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'product')
    
  if (products && products.length > 0) {
    products.forEach(prod => {
      console.log(`  - ${prod.entity_code}: ${prod.entity_name}`)
      if (prod.metadata?.mrp) {
        console.log(`    MRP: ₹${prod.metadata.mrp}, GST: ${prod.metadata.gst_rate}%`)
      }
    })
  } else {
    console.log('  ❌ No products found')
  }
  
  // 4. Check Raw Materials
  console.log('\n🥛 Raw Materials:')
  const { data: materials } = await supabase
    .from('core_entities')
    .select('entity_code, entity_name')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'raw_material')
    
  if (materials && materials.length > 0) {
    materials.forEach(mat => {
      console.log(`  - ${mat.entity_code}: ${mat.entity_name}`)
    })
  } else {
    console.log('  ❌ No raw materials found')
  }
  
  // 5. Check Suppliers
  console.log('\n🚚 Suppliers:')
  const { data: suppliers } = await supabase
    .from('core_entities')
    .select('entity_code, entity_name, metadata')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'supplier')
    
  if (suppliers && suppliers.length > 0) {
    suppliers.forEach(sup => {
      console.log(`  - ${sup.entity_code}: ${sup.entity_name}`)
      if (sup.metadata?.supplier_type) {
        console.log(`    Type: ${sup.metadata.supplier_type}`)
      }
    })
  } else {
    console.log('  ❌ No suppliers found')
  }
  
  // 6. Check Recipes
  console.log('\n📝 Recipes:')
  const { data: recipes } = await supabase
    .from('core_entities')
    .select('entity_code, entity_name, metadata')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'recipe')
    
  if (recipes && recipes.length > 0) {
    recipes.forEach(rec => {
      console.log(`  - ${rec.entity_code}: ${rec.entity_name}`)
      if (rec.metadata?.batch_size) {
        console.log(`    Batch Size: ${rec.metadata.batch_size} ${rec.metadata.batch_unit}`)
      }
    })
  } else {
    console.log('  ❌ No recipes found')
  }
  
  // 7. Check Relationships
  console.log('\n🔗 Relationships:')
  const { data: relationships } = await supabase
    .from('core_relationships')
    .select('relationship_type')
    .eq('organization_id', ORG_ID)
    .limit(10)
    
  if (relationships && relationships.length > 0) {
    const types = [...new Set(relationships.map(r => r.relationship_type))]
    console.log(`  Found ${relationships.length} relationships of types:`)
    types.forEach(type => {
      console.log(`  - ${type}`)
    })
  } else {
    console.log('  ❌ No relationships found')
  }
  
  // 8. Check Dynamic Data
  console.log('\n📊 Dynamic Fields:')
  const { data: dynamicData } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_type')
    .eq('organization_id', ORG_ID)
    .limit(10)
    
  if (dynamicData && dynamicData.length > 0) {
    const fields = [...new Set(dynamicData.map(d => d.field_name))]
    console.log(`  Found ${dynamicData.length} dynamic fields:`)
    fields.forEach(field => {
      console.log(`  - ${field}`)
    })
  } else {
    console.log('  ❌ No dynamic data found')
  }
  
  console.log('\n✅ Verification complete!')
}

verifySetup()