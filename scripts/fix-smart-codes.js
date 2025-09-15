#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HO_ORG_ID = "30cbd9d1-7610-4e6a-9694-ea259dc6b23a";

// More specific smart codes for each entity
const entitySmartCodes = {
  'PL-AED-STD': 'HERA.SALON.CATALOG.PRICE_LIST.AED_STD.v1',
  'BASIC-HAIRCUT': 'HERA.SALON.SERVICE.HAIRCUT.BASIC.v1',
  'HAIR-COLORING': 'HERA.SALON.SERVICE.COLORING.FULL.v1',
  'SHAMPOO_RET': 'HERA.SALON.PRODUCT.SHAMPOO.RETAIL.v1',
  'DYE_COLOR': 'HERA.SALON.PRODUCT.DYE.CONSUMABLE.v1',
  'DUBAI-MAIN': 'HERA.SALON.BRANCH.DUBAI.MAIN.v1',
  'DUBAI-MARINA': 'HERA.SALON.BRANCH.DUBAI.MARINA.v1',
  'DUBAI_MAIN': 'HERA.SALON.BRANCH.DUBAI.MAIN.v1',
  'DUBAI_MARINA': 'HERA.SALON.BRANCH.DUBAI.MARINA.v1'
};

// Dynamic data smart codes by field type
const dynamicSmartCodes = {
  'price_list_currency': 'HERA.SALON.PRICE_LIST.CURRENCY.CONFIG.v1',
  'service_duration_min': 'HERA.SALON.SERVICE.DURATION.POLICY.v1',
  'service_base_fee': 'HERA.SALON.SERVICE.FEE.POLICY.v1',
  'product_sku': 'HERA.SALON.PRODUCT.SKU.IDENTIFIER.v1',
  'product_category': 'HERA.SALON.PRODUCT.CATEGORY.CLASS.v1',
  'product_reorder_level': 'HERA.SALON.INVENTORY.REORDER.POLICY.v1',
  'reorder_level': 'HERA.SALON.INVENTORY.REORDER.THRESHOLD.v1',
  'ITEM_IN_PRICE_LIST': 'HERA.SALON.PRICE_LIST.ITEMS.CONFIG.v1'
};

// Relationship smart codes by type
const relationshipSmartCodes = {
  'ITEM_IN_PRICE_LIST': 'HERA.SALON.PRICE_LIST.ITEM.REL.v1',
  'SERVICE_BOM': 'HERA.SALON.SERVICE.BOM.REL.v1'
};

async function fixEntitySmartCodes() {
  console.log('🔧 Fixing entity smart codes...');
  
  for (const [entityCode, smartCode] of Object.entries(entitySmartCodes)) {
    const { error } = await supabase
      .from('core_entities')
      .update({ smart_code: smartCode })
      .eq('organization_id', HO_ORG_ID)
      .eq('entity_code', entityCode);
    
    if (error) {
      console.error(`Error updating ${entityCode}:`, error);
    } else {
      console.log(`✅ Updated ${entityCode} → ${smartCode}`);
    }
  }
}

async function fixDynamicDataSmartCodes() {
  console.log('\n🔧 Fixing dynamic data smart codes...');
  
  for (const [fieldName, smartCode] of Object.entries(dynamicSmartCodes)) {
    const { error } = await supabase
      .from('core_dynamic_data')
      .update({ smart_code: smartCode })
      .eq('organization_id', HO_ORG_ID)
      .eq('field_name', fieldName);
    
    if (error) {
      console.error(`Error updating ${fieldName}:`, error);
    } else {
      console.log(`✅ Updated ${fieldName} → ${smartCode}`);
    }
  }
}

async function fixRelationshipSmartCodes() {
  console.log('\n🔧 Fixing relationship smart codes...');
  
  // Get all relationships to update individually
  const { data: relationships } = await supabase
    .from('core_relationships')
    .select('id, relationship_type, from_entity_id, to_entity_id')
    .eq('organization_id', HO_ORG_ID);
  
  if (relationships) {
    for (const rel of relationships) {
      // Get entity codes for more specific smart codes
      const { data: fromEntity } = await supabase
        .from('core_entities')
        .select('entity_code')
        .eq('id', rel.from_entity_id)
        .single();
      
      const { data: toEntity } = await supabase
        .from('core_entities')
        .select('entity_code')
        .eq('id', rel.to_entity_id)
        .single();
      
      let smartCode;
      if (rel.relationship_type === 'ITEM_IN_PRICE_LIST') {
        // Make unique by including the item code
        smartCode = `HERA.SALON.PRICE_LIST.ITEM.${toEntity.entity_code.replace('-', '_')}.v1`;
      } else if (rel.relationship_type === 'SERVICE_BOM') {
        // Make unique by including service and product
        smartCode = `HERA.SALON.SERVICE.BOM.${fromEntity.entity_code.replace('-', '_')}.v1`;
      } else {
        smartCode = relationshipSmartCodes[rel.relationship_type] || 'HERA.SALON.REL.GENERIC.v1';
      }
      
      const { error } = await supabase
        .from('core_relationships')
        .update({ smart_code: smartCode })
        .eq('id', rel.id);
      
      if (error) {
        console.error(`Error updating relationship ${rel.id}:`, error);
      } else {
        console.log(`✅ Updated ${rel.relationship_type}: ${fromEntity.entity_code} → ${toEntity.entity_code} = ${smartCode}`);
      }
    }
  }
}

async function main() {
  console.log('=== Fixing Smart Code Uniqueness ===\n');
  
  await fixEntitySmartCodes();
  await fixDynamicDataSmartCodes();
  await fixRelationshipSmartCodes();
  
  console.log('\n✅ Smart code fixes complete');
  
  // Run a quick verification
  console.log('\n📊 Verification:');
  
  const { data: duplicates } = await supabase
    .from('core_entities')
    .select('smart_code')
    .eq('organization_id', HO_ORG_ID);
  
  const counts = {};
  duplicates?.forEach(row => {
    counts[row.smart_code] = (counts[row.smart_code] || 0) + 1;
  });
  
  const stillDuplicated = Object.entries(counts).filter(([, count]) => count > 1);
  
  if (stillDuplicated.length === 0) {
    console.log('✅ No more duplicate smart codes in entities');
  } else {
    console.log('❌ Still have duplicates:', stillDuplicated);
  }
}

main().catch(console.error);