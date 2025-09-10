#!/usr/bin/env node
require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'f0af4ced-9d12-4a55-a649-b484368db249';

console.log('🪑 HERA Furniture Catalog Seeder');
console.log('================================');
console.log(`Organization ID: ${organizationId}`);

// Comprehensive furniture product catalog
const FURNITURE_CATALOG = [
  // Office Furniture
  {
    entity_code: 'DESK-EXE-001',
    entity_name: 'Executive Office Desk - Premium Teak',
    smart_code: 'HERA.FURNITURE.PRODUCT.DESK.EXECUTIVE.v1',
    metadata: { category: 'office', sub_category: 'desks' },
    dynamic_fields: {
      category: 'office',
      sub_category: 'desks',
      material: 'premium teak',
      finish: 'natural polish',
      length_cm: 180,
      width_cm: 90,
      height_cm: 75,
      weight_kg: 85,
      price: 55000,
      cost: 35000,
      lead_time_days: 14,
      stock_quantity: 12,
      min_order_qty: 1,
      warranty_years: 5
    }
  },
  {
    entity_code: 'DESK-STD-002',
    entity_name: 'Standard Office Desk - Engineered Wood',
    smart_code: 'HERA.FURNITURE.PRODUCT.DESK.STANDARD.v1',
    metadata: { category: 'office', sub_category: 'desks' },
    dynamic_fields: {
      category: 'office',
      sub_category: 'desks',
      material: 'engineered wood',
      finish: 'laminate walnut',
      length_cm: 150,
      width_cm: 75,
      height_cm: 75,
      weight_kg: 45,
      price: 18500,
      cost: 11000,
      lead_time_days: 7,
      stock_quantity: 28,
      min_order_qty: 1,
      warranty_years: 2
    }
  },
  
  // Seating
  {
    entity_code: 'CHAIR-ERG-001',
    entity_name: 'Ergonomic High-Back Office Chair',
    smart_code: 'HERA.FURNITURE.PRODUCT.CHAIR.ERGONOMIC.v1',
    metadata: { category: 'seating', sub_category: 'office_chairs' },
    dynamic_fields: {
      category: 'seating',
      sub_category: 'office_chairs',
      material: 'mesh',
      finish: 'black',
      length_cm: 65,
      width_cm: 65,
      height_cm: 120,
      weight_kg: 22,
      price: 18500,
      cost: 12000,
      lead_time_days: 5,
      stock_quantity: 45,
      min_order_qty: 1,
      warranty_years: 3
    }
  },
  {
    entity_code: 'SOFA-3S-001',
    entity_name: '3-Seater Living Room Sofa - Premium Leather',
    smart_code: 'HERA.FURNITURE.PRODUCT.SOFA.3SEATER.v1',
    metadata: { category: 'seating', sub_category: 'sofas' },
    dynamic_fields: {
      category: 'seating',
      sub_category: 'sofas',
      material: 'leather',
      finish: 'cognac brown',
      length_cm: 210,
      width_cm: 85,
      height_cm: 90,
      weight_kg: 120,
      price: 125000,
      cost: 75000,
      lead_time_days: 21,
      stock_quantity: 5,
      min_order_qty: 1,
      warranty_years: 7
    }
  },
  {
    entity_code: 'CHAIR-DIN-001',
    entity_name: 'Dining Chair - Solid Oak',
    smart_code: 'HERA.FURNITURE.PRODUCT.CHAIR.DINING.v1',
    metadata: { category: 'seating', sub_category: 'dining_chairs' },
    dynamic_fields: {
      category: 'seating',
      sub_category: 'dining_chairs',
      material: 'oak',
      finish: 'dark walnut',
      length_cm: 45,
      width_cm: 45,
      height_cm: 95,
      weight_kg: 8,
      price: 8500,
      cost: 5200,
      lead_time_days: 7,
      stock_quantity: 120,
      min_order_qty: 4,
      warranty_years: 3
    }
  },
  
  // Tables
  {
    entity_code: 'TABLE-CONF-008',
    entity_name: 'Conference Table 8-Seater Oval',
    smart_code: 'HERA.FURNITURE.PRODUCT.TABLE.CONFERENCE.v1',
    metadata: { category: 'tables', sub_category: 'conference' },
    dynamic_fields: {
      category: 'tables',
      sub_category: 'conference',
      material: 'engineered wood',
      finish: 'walnut veneer',
      length_cm: 300,
      width_cm: 120,
      height_cm: 75,
      weight_kg: 150,
      price: 95000,
      cost: 68000,
      lead_time_days: 14,
      stock_quantity: 3,
      min_order_qty: 1,
      warranty_years: 5
    }
  },
  {
    entity_code: 'TABLE-DIN-006',
    entity_name: 'Dining Table 6-Seater Glass Top',
    smart_code: 'HERA.FURNITURE.PRODUCT.TABLE.DINING.v1',
    metadata: { category: 'tables', sub_category: 'dining' },
    dynamic_fields: {
      category: 'tables',
      sub_category: 'dining',
      material: 'glass',
      finish: 'tempered clear',
      length_cm: 180,
      width_cm: 90,
      height_cm: 75,
      weight_kg: 95,
      price: 65000,
      cost: 42000,
      lead_time_days: 10,
      stock_quantity: 8,
      min_order_qty: 1,
      warranty_years: 2
    }
  },
  {
    entity_code: 'TABLE-COF-001',
    entity_name: 'Coffee Table - Modern Minimalist',
    smart_code: 'HERA.FURNITURE.PRODUCT.TABLE.COFFEE.v1',
    metadata: { category: 'tables', sub_category: 'coffee' },
    dynamic_fields: {
      category: 'tables',
      sub_category: 'coffee',
      material: 'mdf',
      finish: 'white matte',
      length_cm: 120,
      width_cm: 60,
      height_cm: 45,
      weight_kg: 35,
      price: 22000,
      cost: 14000,
      lead_time_days: 5,
      stock_quantity: 15,
      min_order_qty: 1,
      warranty_years: 2
    }
  },
  
  // Storage
  {
    entity_code: 'CAB-FILE-004',
    entity_name: '4-Drawer Filing Cabinet - Metal',
    smart_code: 'HERA.FURNITURE.PRODUCT.CABINET.FILING.v1',
    metadata: { category: 'storage', sub_category: 'filing' },
    dynamic_fields: {
      category: 'storage',
      sub_category: 'filing',
      material: 'steel',
      finish: 'powder coat gray',
      length_cm: 45,
      width_cm: 60,
      height_cm: 132,
      weight_kg: 45,
      price: 18500,
      cost: 12000,
      lead_time_days: 7,
      stock_quantity: 35,
      min_order_qty: 1,
      warranty_years: 5
    }
  },
  {
    entity_code: 'SHELF-BOOK-005',
    entity_name: '5-Tier Bookshelf - Solid Pine',
    smart_code: 'HERA.FURNITURE.PRODUCT.SHELF.BOOKCASE.v1',
    metadata: { category: 'storage', sub_category: 'shelving' },
    dynamic_fields: {
      category: 'storage',
      sub_category: 'shelving',
      material: 'pine',
      finish: 'natural',
      length_cm: 90,
      width_cm: 35,
      height_cm: 180,
      weight_kg: 55,
      price: 28500,
      cost: 18000,
      lead_time_days: 10,
      stock_quantity: 22,
      min_order_qty: 1,
      warranty_years: 3
    }
  },
  {
    entity_code: 'WARD-3DR-001',
    entity_name: '3-Door Wardrobe with Mirror',
    smart_code: 'HERA.FURNITURE.PRODUCT.WARDROBE.3DOOR.v1',
    metadata: { category: 'storage', sub_category: 'wardrobes' },
    dynamic_fields: {
      category: 'storage',
      sub_category: 'wardrobes',
      material: 'particle board',
      finish: 'laminate oak',
      length_cm: 150,
      width_cm: 60,
      height_cm: 210,
      weight_kg: 125,
      price: 42000,
      cost: 28000,
      lead_time_days: 14,
      stock_quantity: 10,
      min_order_qty: 1,
      warranty_years: 2
    }
  },
  
  // Beds
  {
    entity_code: 'BED-KING-001',
    entity_name: 'King Size Bed with Storage - Hydraulic',
    smart_code: 'HERA.FURNITURE.PRODUCT.BED.KING.v1',
    metadata: { category: 'beds', sub_category: 'king_size' },
    dynamic_fields: {
      category: 'beds',
      sub_category: 'king_size',
      material: 'engineered wood',
      finish: 'walnut laminate',
      length_cm: 210,
      width_cm: 190,
      height_cm: 90,
      weight_kg: 180,
      price: 85000,
      cost: 55000,
      lead_time_days: 21,
      stock_quantity: 7,
      min_order_qty: 1,
      warranty_years: 5
    }
  },
  {
    entity_code: 'BED-QUEEN-001',
    entity_name: 'Queen Size Platform Bed - Minimalist',
    smart_code: 'HERA.FURNITURE.PRODUCT.BED.QUEEN.v1',
    metadata: { category: 'beds', sub_category: 'queen_size' },
    dynamic_fields: {
      category: 'beds',
      sub_category: 'queen_size',
      material: 'solid wood',
      finish: 'natural teak',
      length_cm: 210,
      width_cm: 160,
      height_cm: 40,
      weight_kg: 120,
      price: 65000,
      cost: 42000,
      lead_time_days: 14,
      stock_quantity: 9,
      min_order_qty: 1,
      warranty_years: 7
    }
  },
  {
    entity_code: 'BED-BUNK-001',
    entity_name: 'Kids Bunk Bed with Safety Rails',
    smart_code: 'HERA.FURNITURE.PRODUCT.BED.BUNK.v1',
    metadata: { category: 'beds', sub_category: 'kids' },
    dynamic_fields: {
      category: 'beds',
      sub_category: 'kids',
      material: 'pine wood',
      finish: 'white paint',
      length_cm: 200,
      width_cm: 100,
      height_cm: 170,
      weight_kg: 95,
      price: 38000,
      cost: 25000,
      lead_time_days: 10,
      stock_quantity: 15,
      min_order_qty: 1,
      warranty_years: 3
    }
  }
];

// Raw materials and components for BOM
const RAW_MATERIALS = [
  {
    entity_code: 'RM-WOOD-TEAK-001',
    entity_name: 'Premium Teak Wood Plank',
    smart_code: 'HERA.FURNITURE.MATERIAL.WOOD.TEAK.v1',
    metadata: { category: 'raw_material', type: 'wood' },
    dynamic_fields: {
      material_type: 'wood',
      species: 'teak',
      unit_of_measure: 'sqft',
      cost_per_unit: 850,
      supplier_lead_time: 7,
      min_order_qty: 100
    }
  },
  {
    entity_code: 'RM-GLASS-TEMP-001',
    entity_name: 'Tempered Glass Sheet 12mm',
    smart_code: 'HERA.FURNITURE.MATERIAL.GLASS.TEMPERED.v1',
    metadata: { category: 'raw_material', type: 'glass' },
    dynamic_fields: {
      material_type: 'glass',
      thickness_mm: 12,
      unit_of_measure: 'sqft',
      cost_per_unit: 350,
      supplier_lead_time: 5,
      min_order_qty: 50
    }
  },
  {
    entity_code: 'RM-METAL-LEG-001',
    entity_name: 'Chrome Table Leg Set',
    smart_code: 'HERA.FURNITURE.COMPONENT.METAL.LEGS.v1',
    metadata: { category: 'component', type: 'hardware' },
    dynamic_fields: {
      material_type: 'metal',
      finish: 'chrome',
      unit_of_measure: 'set',
      cost_per_unit: 2500,
      supplier_lead_time: 3,
      min_order_qty: 10
    }
  },
  {
    entity_code: 'RM-FABRIC-LEATH-001',
    entity_name: 'Premium Leather - Cognac Brown',
    smart_code: 'HERA.FURNITURE.MATERIAL.FABRIC.LEATHER.v1',
    metadata: { category: 'raw_material', type: 'fabric' },
    dynamic_fields: {
      material_type: 'leather',
      color: 'cognac brown',
      unit_of_measure: 'sqm',
      cost_per_unit: 1200,
      supplier_lead_time: 14,
      min_order_qty: 25
    }
  }
];

async function seedFurnitureCatalog() {
  try {
    console.log('\n📦 Creating furniture products...');
    let productCount = 0;
    let errorCount = 0;

    for (const product of FURNITURE_CATALOG) {
      // Check if product already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('entity_code', product.entity_code)
        .single();

      if (existing) {
        console.log(`⚠️  Product ${product.entity_code} already exists, skipping...`);
        continue;
      }

      // Create product entity
      const { data: entity, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'product',
          entity_code: product.entity_code,
          entity_name: product.entity_name,
          smart_code: product.smart_code,
          metadata: product.metadata,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating ${product.entity_code}:`, error.message);
        errorCount++;
        continue;
      }

      // Add dynamic fields
      const dynamicInserts = [];
      for (const [field_name, value] of Object.entries(product.dynamic_fields)) {
        const fieldData = {
          organization_id: organizationId,
          entity_id: entity.id,
          field_name,
          smart_code: `${product.smart_code}.${field_name}`,
          field_value_text: null,
          field_value_number: null,
          field_value_boolean: null,
          field_value_json: null
        };

        if (typeof value === 'string') {
          fieldData.field_value_text = value;
        } else if (typeof value === 'number') {
          fieldData.field_value_number = value;
        } else if (typeof value === 'boolean') {
          fieldData.field_value_boolean = value;
        } else if (typeof value === 'object') {
          fieldData.field_value_json = JSON.stringify(value);
        }

        dynamicInserts.push(fieldData);
      }

      if (dynamicInserts.length > 0) {
        const { error: dynError } = await supabase
          .from('core_dynamic_data')
          .insert(dynamicInserts);

        if (dynError) {
          console.error(`❌ Error adding dynamic fields for ${product.entity_code}:`, dynError.message);
        }
      }

      console.log(`✅ Created product: ${product.entity_name} (${product.entity_code})`);
      productCount++;
    }

    // Create raw materials
    console.log('\n🔧 Creating raw materials and components...');
    let materialCount = 0;

    for (const material of RAW_MATERIALS) {
      // Check if material already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('entity_code', material.entity_code)
        .single();

      if (existing) {
        console.log(`⚠️  Material ${material.entity_code} already exists, skipping...`);
        continue;
      }

      // Create material entity
      const { data: entity, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'raw_material',
          entity_code: material.entity_code,
          entity_name: material.entity_name,
          smart_code: material.smart_code,
          metadata: material.metadata,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating ${material.entity_code}:`, error.message);
        errorCount++;
        continue;
      }

      // Add dynamic fields
      for (const [field_name, value] of Object.entries(material.dynamic_fields)) {
        const fieldData = {
          organization_id: organizationId,
          entity_id: entity.id,
          field_name,
          smart_code: `${material.smart_code}.${field_name}`,
          field_value_text: typeof value === 'string' ? value : null,
          field_value_number: typeof value === 'number' ? value : null
        };

        await supabase
          .from('core_dynamic_data')
          .insert(fieldData);
      }

      console.log(`✅ Created material: ${material.entity_name} (${material.entity_code})`);
      materialCount++;
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`✅ Products created: ${productCount}`);
    console.log(`✅ Materials created: ${materialCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\n🎉 Furniture catalog seeding completed!');

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
  }
}

// Run the seeder
seedFurnitureCatalog();