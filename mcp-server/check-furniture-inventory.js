#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkInventoryData() {
  console.log('🔍 Checking Furniture Inventory Data...\n')
  
  // Check all organizations with Furniture in name
  const { data: orgs } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .or('organization_name.ilike.%furniture%,organization_name.ilike.%Furniture%')
  
  console.log('📊 Furniture Organizations:')
  orgs?.forEach(org => console.log(`   - ${org.organization_name}: ${org.id}`))
  
  // Check the specific organization - Kerala Furniture Works (Demo)
  const ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'
  console.log(`\n🎯 Checking data for organization: ${ORG_ID}`)
  
  // Check products
  const { data: products, count: productCount } = await supabase
    .from('core_entities')
    .select('*', { count: 'exact' })
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'product')
    .like('smart_code', 'HERA.FURNITURE.PRODUCT%')
  
  console.log(`\n📦 Products: ${productCount || 0}`)
  products?.slice(0, 5).forEach(p => console.log(`   - ${p.entity_name} (${p.entity_code})`))
  
  // Check dynamic data (inventory levels)
  const { data: dynamicData, count: dynamicCount } = await supabase
    .from('core_dynamic_data')
    .select('*', { count: 'exact' })
    .eq('organization_id', ORG_ID)
    .in('field_name', ['stock_quantity', 'reserved_quantity', 'location'])
  
  console.log(`\n📋 Dynamic Data Records: ${dynamicCount || 0}`)
  
  // Check locations
  const { data: locations, count: locationCount } = await supabase
    .from('core_entities')
    .select('*', { count: 'exact' })
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'location')
  
  console.log(`\n📍 Locations: ${locationCount || 0}`)
  locations?.forEach(l => console.log(`   - ${l.entity_name} (${l.entity_code})`))
  
  // Check inventory movements
  const { data: movements, count: movementCount } = await supabase
    .from('universal_transactions')
    .select('*', { count: 'exact' })
    .eq('organization_id', ORG_ID)
    .or('smart_code.like.%INVENTORY%,transaction_type.in.(stock_movement,purchase_receipt,sales_delivery)')
  
  console.log(`\n🚚 Inventory Movements: ${movementCount || 0}`)
  movements?.slice(0, 5).forEach(m => {
    console.log(`   - ${m.transaction_type}: ${m.transaction_code} (Amount: ${m.total_amount})`)
  })
  
  // Check for other organizations that might have furniture data
  console.log('\n🔍 Checking other organizations with furniture products...')
  const { data: otherOrgs } = await supabase
    .from('core_entities')
    .select('organization_id, entity_name')
    .eq('entity_type', 'product')
    .like('smart_code', 'HERA.FURNITURE%')
    .not('organization_id', 'eq', ORG_ID)
  
  const uniqueOrgs = [...new Set(otherOrgs?.map(o => o.organization_id) || [])]
  console.log(`Found furniture products in ${uniqueOrgs.length} other organizations`)
  
  if (uniqueOrgs.length > 0) {
    for (const orgId of uniqueOrgs.slice(0, 3)) {
      const { data: orgInfo } = await supabase
        .from('core_organizations')
        .select('organization_name')
        .eq('id', orgId)
        .single()
      
      const { count } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('entity_type', 'product')
        .like('smart_code', 'HERA.FURNITURE%')
      
      console.log(`   - ${orgInfo?.organization_name || 'Unknown'} (${orgId}): ${count} products`)
    }
  }
}

checkInventoryData().catch(console.error)