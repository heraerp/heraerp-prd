#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Organization IDs from Stage A
const HO_ORG_ID = "30cbd9d1-7610-4e6a-9694-ea259dc6b23a";

// Helper to convert slug to entity_code
function slugToCode(slug) {
  // price_list:PL-AED-STD -> PL-AED-STD
  // service:HAIRCUT_BASIC -> BASIC-HAIRCUT
  // product:SHAMPOO_RET -> SHAMPOO_RET
  
  const [type, code] = slug.split(':');
  
  if (type === 'price_list') {
    return code;
  } else if (type === 'service') {
    if (code === 'HAIRCUT_BASIC') return 'BASIC-HAIRCUT';
    if (code === 'HAIR_COLOR') return 'HAIR-COLORING';
  }
  
  return code;
}

// Helper to get smart codes - must match HERA pattern (min 4 segments)
function getSmartCode(entityType, subType) {
  const smartCodes = {
    'price_list': 'HERA.SALON.CATALOG.PRICE_LIST.ENTITY.v1',
    'service': 'HERA.SALON.CATALOG.SERVICE.ENTITY.v1',
    'product': 'HERA.SALON.CATALOG.PRODUCT.ENTITY.v1',
    'branch': 'HERA.SALON.ORG.BRANCH.ENTITY.v1',
    'dynamic_price_list': 'HERA.SALON.CATALOG.PRICE_LIST.DYN.v1',
    'dynamic_service': 'HERA.SALON.CATALOG.SERVICE.DYN.v1',
    'dynamic_product': 'HERA.SALON.CATALOG.PRODUCT.DYN.v1',
    'dynamic_default': 'HERA.SALON.CATALOG.ENTITY.DYN.v1',
    'relationship': 'HERA.SALON.CATALOG.RELATIONSHIP.LINK.v1',
    'reorder_level': 'HERA.SALON.INVENTORY.REORDER.LEVEL.v1',
    'price_list_items': 'HERA.SALON.CATALOG.PRICE_LIST.ITEMS.v1'
  };
  
  return smartCodes[entityType] || smartCodes[subType] || 'HERA.SALON.CATALOG.ENTITY.GENERIC.v1';
}

async function applyEntities() {
  console.log('\n📦 Applying entities.seed.yml...');
  
  const entitiesYaml = fs.readFileSync(
    path.join(__dirname, '..', 'hera', 'seeds', 'salon', 'entities.seed.yml'),
    'utf8'
  );
  const entitiesData = yaml.load(entitiesYaml);
  
  const entities = [];
  const entityMap = {};
  
  for (const item of entitiesData.items) {
    const entityCode = slugToCode(item.slug);
    const entityType = item.metadata.entity_type;
    
    const entity = {
      organization_id: HO_ORG_ID,
      entity_code: entityCode,
      entity_name: item.name,
      entity_type: entityType,
      smart_code: getSmartCode(entityType),
      status: 'active',
      metadata: item.metadata
    };
    
    entities.push(entity);
    entityMap[item.slug] = entityCode;
  }
  
  // Insert entities one by one to handle conflicts properly
  const insertedEntities = [];
  
  for (const entity of entities) {
    // First check if it exists
    const { data: existing } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', HO_ORG_ID)
      .eq('entity_code', entity.entity_code)
      .single();
    
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('core_entities')
        .update({
          entity_name: entity.entity_name,
          entity_type: entity.entity_type,
          smart_code: entity.smart_code,
          status: entity.status,
          metadata: entity.metadata
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      insertedEntities.push(data);
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('core_entities')
        .insert(entity)
        .select()
        .single();
      
      if (error) throw error;
      insertedEntities.push(data);
    }
  }
  
  const data = insertedEntities;
  const error = null;
  
  if (error) {
    console.error('Error inserting entities:', error);
    throw error;
  }
  
  console.log(`✅ Created/updated ${data.length} entities`);
  
  // Store entity IDs for relationships
  const entityIdMap = {};
  data.forEach(e => {
    entityIdMap[e.entity_code] = e.id;
  });
  
  return { entityMap, entityIdMap };
}

async function applyDynamicData(entityIdMap) {
  console.log('\n🔧 Applying dynamic_data.seed.yml...');
  
  const dynamicYaml = fs.readFileSync(
    path.join(__dirname, '..', 'hera', 'seeds', 'salon', 'dynamic_data.seed.yml'),
    'utf8'
  );
  const dynamicData = yaml.load(dynamicYaml);
  
  const dynamicRows = [];
  
  for (const row of dynamicData.rows) {
    const entityCode = slugToCode(row.entity_slug);
    const entityId = entityIdMap[entityCode];
    
    if (!entityId) {
      console.warn(`Entity not found for: ${row.entity_slug}`);
      continue;
    }
    
    const fieldName = row.key_slug.replace(/\./g, '_');
    const entityType = row.entity_slug.split(':')[0];
    
    const dynamicRow = {
      organization_id: HO_ORG_ID,
      entity_id: entityId,
      field_name: fieldName,
      smart_code: getSmartCode(`dynamic_${entityType}`) || 'HERA.SALON.CATALOG.ENTITY.DYN.v1',
      [`field_value_${row.value_type}`]: row.value
    };
    
    dynamicRows.push(dynamicRow);
  }
  
  // Special handling for price list items
  const priceListData = {
    'BASIC-HAIRCUT': { price: 75.0, currency: 'AED' },
    'HAIR-COLORING': { price: 250.0, currency: 'AED' },
    'SHAMPOO_RET': { price: 35.0, currency: 'AED' }
  };
  
  const plEntityId = entityIdMap['PL-AED-STD'];
  if (plEntityId) {
    const priceListItems = [];
    for (const [code, data] of Object.entries(priceListData)) {
      if (entityIdMap[code]) {
        priceListItems.push({
          entity_code: code,
          entity_id: entityIdMap[code],
          price: data.price,
          currency: data.currency
        });
      }
    }
    
    dynamicRows.push({
      organization_id: HO_ORG_ID,
      entity_id: plEntityId,
      field_name: 'ITEM_IN_PRICE_LIST',
      field_value_json: priceListItems,
      smart_code: getSmartCode('price_list_items')
    });
  }
  
  // Special handling for reorder levels
  const reorderLevels = {
    'SHAMPOO_RET': 50,
    'DYE_COLOR': 200
  };
  
  for (const [code, level] of Object.entries(reorderLevels)) {
    if (entityIdMap[code]) {
      dynamicRows.push({
        organization_id: HO_ORG_ID,
        entity_id: entityIdMap[code],
        field_name: 'reorder_level',
        field_value_number: level,
        smart_code: getSmartCode('reorder_level')
      });
    }
  }
  
  // Insert dynamic data one by one
  const insertedDynamic = [];
  
  for (const row of dynamicRows) {
    // Check if exists
    const { data: existing } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', HO_ORG_ID)
      .eq('entity_id', row.entity_id)
      .eq('field_name', row.field_name)
      .single();
    
    if (existing) {
      // Update existing
      const updateData = {
        smart_code: row.smart_code,
        field_value_text: row.field_value_text || null,
        field_value_number: row.field_value_number || null,
        field_value_json: row.field_value_json || null
      };
      
      const { data, error } = await supabase
        .from('core_dynamic_data')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      insertedDynamic.push(data);
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('core_dynamic_data')
        .insert(row)
        .select()
        .single();
      
      if (error) throw error;
      insertedDynamic.push(data);
    }
  }
  
  const data = insertedDynamic;
  const error = null;
  
  if (error) {
    console.error('Error inserting dynamic data:', error);
    throw error;
  }
  
  console.log(`✅ Created/updated ${data.length} dynamic data records`);
}

async function applyRelationships(entityIdMap) {
  console.log('\n🔗 Applying relationships.seed.yml...');
  
  const relYaml = fs.readFileSync(
    path.join(__dirname, '..', 'hera', 'seeds', 'salon', 'relationships.seed.yml'),
    'utf8'
  );
  const relData = yaml.load(relYaml);
  
  const relationships = [];
  
  for (const row of relData.rows) {
    const fromCode = slugToCode(row.from_slug);
    const toCode = slugToCode(row.to_slug);
    
    const fromId = entityIdMap[fromCode];
    const toId = entityIdMap[toCode];
    
    if (!fromId || !toId) {
      console.warn(`Entity not found for relationship: ${row.from_slug} -> ${row.to_slug}`);
      continue;
    }
    
    // For SERVICE_BOM, update the relationship_data
    let relationshipData = row.relationship_data;
    if (row.relationship_type === 'SERVICE_BOM') {
      relationshipData = {
        qty_per_service: row.relationship_data.quantity,
        uom: row.relationship_data.uom
      };
    }
    
    relationships.push({
      organization_id: HO_ORG_ID,
      from_entity_id: fromId,
      to_entity_id: toId,
      relationship_type: row.relationship_type,
      relationship_data: relationshipData,
      smart_code: getSmartCode('relationship'),
      is_active: true
    });
  }
  
  // Insert relationships one by one
  const insertedRelationships = [];
  
  for (const rel of relationships) {
    // Check if exists
    const { data: existing } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', HO_ORG_ID)
      .eq('from_entity_id', rel.from_entity_id)
      .eq('to_entity_id', rel.to_entity_id)
      .eq('relationship_type', rel.relationship_type)
      .single();
    
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('core_relationships')
        .update({
          relationship_data: rel.relationship_data,
          smart_code: rel.smart_code,
          is_active: rel.is_active
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      insertedRelationships.push(data);
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('core_relationships')
        .insert(rel)
        .select()
        .single();
      
      if (error) throw error;
      insertedRelationships.push(data);
    }
  }
  
  const data = insertedRelationships;
  const error = null;
  
  if (error) {
    console.error('Error inserting relationships:', error);
    throw error;
  }
  
  console.log(`✅ Created/updated ${data.length} relationships`);
}

async function main() {
  try {
    console.log('=== Stage B: Applying HO Catalog & Policies ===');
    console.log(`Organization ID: ${HO_ORG_ID}\n`);
    
    // Apply entities first
    const { entityMap, entityIdMap } = await applyEntities();
    
    // Apply dynamic data
    await applyDynamicData(entityIdMap);
    
    // Apply relationships
    await applyRelationships(entityIdMap);
    
    console.log('\n✅ Stage B1 Complete: HO catalog and policies applied successfully');
    console.log('\n📋 Next step: Run verification queries (Stage B2)');
    
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

// Check if js-yaml is installed
try {
  require('js-yaml');
} catch (e) {
  console.log('Installing js-yaml...');
  require('child_process').execSync('npm install js-yaml', { stdio: 'inherit' });
}

main();