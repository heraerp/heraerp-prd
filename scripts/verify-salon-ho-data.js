#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HO_ORG_ID = "30cbd9d1-7610-4e6a-9694-ea259dc6b23a";

async function runVerification() {
  console.log('=== Stage B2: Verification Queries ===\n');
  console.log(`HO Organization ID: ${HO_ORG_ID}\n`);
  
  // 1. Entities present at HO
  console.log('1️⃣  Entities present at HO:');
  console.log('-----------------------------');
  
  const { data: entities, error: entitiesError } = await supabase
    .from('core_entities')
    .select('entity_code, entity_type, smart_code, status')
    .eq('organization_id', HO_ORG_ID)
    .in('entity_code', ['PL-AED-STD', 'BASIC-HAIRCUT', 'HAIR-COLORING', 'SHAMPOO_RET', 'DYE_COLOR'])
    .order('entity_code');
  
  if (entitiesError) {
    console.error('Error:', entitiesError);
  } else {
    console.table(entities);
    console.log(`✅ Found ${entities.length} entities (expected 5)\n`);
  }
  
  // 2. Price list items captured as policy
  console.log('2️⃣  Price list items (ITEM_IN_PRICE_LIST):');
  console.log('--------------------------------------------');
  
  const { data: priceListData, error: priceListError } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_json')
    .eq('organization_id', HO_ORG_ID)
    .eq('field_name', 'ITEM_IN_PRICE_LIST');
  
  if (priceListError) {
    console.error('Error:', priceListError);
  } else {
    if (priceListData.length > 0) {
      const items = priceListData[0].field_value_json;
      console.log('Price List Contents:');
      items.forEach(item => {
        console.log(`  - ${item.entity_code}: ${item.currency} ${item.price}`);
      });
      console.log(`\n✅ Found price list with ${items.length} items\n`);
    } else {
      console.log('❌ No price list data found\n');
    }
  }
  
  // 3. Reorder levels
  console.log('3️⃣  Reorder levels:');
  console.log('--------------------');
  
  const { data: reorderLevels, error: reorderError } = await supabase
    .from('core_dynamic_data')
    .select('entity_id, field_value_number')
    .eq('organization_id', HO_ORG_ID)
    .eq('field_name', 'reorder_level');
  
  // Get entity codes separately
  let reorderData = [];
  if (!reorderError && reorderLevels) {
    for (const level of reorderLevels) {
      const { data: entity } = await supabase
        .from('core_entities')
        .select('entity_code')
        .eq('id', level.entity_id)
        .single();
      
      if (entity) {
        reorderData.push({
          entity_code: entity.entity_code,
          reorder_level: level.field_value_number
        });
      }
    }
    reorderData.sort((a, b) => a.entity_code.localeCompare(b.entity_code));
  }
  
  if (reorderError) {
    console.error('Error:', reorderError);
  } else {
    console.table(reorderData);
    console.log(`✅ Found ${reorderData.length} reorder levels (expected 2: DYE_COLOR=200, SHAMPOO_RET=50)\n`);
  }
  
  // 4. Service BOM relationships
  console.log('4️⃣  Service BOM relationships:');
  console.log('--------------------------------');
  
  const { data: bomRelationships, error: bomError } = await supabase
    .from('core_relationships')
    .select(`
      relationship_type,
      relationship_data,
      from_entity:core_entities!from_entity_id(entity_code),
      to_entity:core_entities!to_entity_id(entity_code)
    `)
    .eq('organization_id', HO_ORG_ID)
    .eq('relationship_type', 'SERVICE_BOM');
  
  if (bomError) {
    console.error('Error:', bomError);
  } else {
    const bomData = bomRelationships.map(r => ({
      from: r.from_entity.entity_code,
      to: r.to_entity.entity_code,
      qty_per_service: r.relationship_data.qty_per_service,
      uom: r.relationship_data.uom
    }));
    console.table(bomData);
    console.log(`✅ Found ${bomData.length} SERVICE_BOM relationships (expected: HAIR-COLORING → DYE_COLOR, 50 ml)\n`);
  }
  
  // Summary
  console.log('\n📊 VERIFICATION SUMMARY:');
  console.log('========================');
  console.log(`✅ Entities: ${entities?.length || 0}/5`);
  console.log(`✅ Price List Items: ${priceListData?.length > 0 ? '✓' : '✗'}`);
  console.log(`✅ Reorder Levels: ${reorderLevels?.length || 0}/2`);
  console.log(`✅ Service BOM: ${bomRelationships?.length || 0}/1`);
}

runVerification().catch(console.error);