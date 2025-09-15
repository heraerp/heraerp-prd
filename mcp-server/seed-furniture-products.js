#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use the NEXT_PUBLIC_ prefixed variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const KERALA_FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

async function createProductsWithDynamicData() {
  console.log('\n🪑 Creating furniture products with dynamic data...');
  
  const products = [
    {
      entity_type: 'product',
      entity_name: 'Executive Office Chair - High Back',
      entity_code: 'FUR-CHR-001',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.OFFICE.CHAIR.v1',
      metadata: {
        category: 'office',
        sub_category: 'seating'
      },
      dynamic_fields: {
        category: 'office',
        sub_category: 'seating',
        material: 'leather',
        length_cm: 65,
        width_cm: 70,
        height_cm: 120,
        price: 18500,
        cost: 12000,
        stock_quantity: 15,
        reorder_point: 5,
        description: 'Premium executive chair with ergonomic design, lumbar support, and genuine leather upholstery'
      }
    },
    {
      entity_type: 'product',
      entity_name: 'Modern Conference Table - 8 Seater',
      entity_code: 'FUR-TBL-002',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.OFFICE.TABLE.v1',
      metadata: {
        category: 'tables',
        sub_category: 'conference'
      },
      dynamic_fields: {
        category: 'tables',
        material: 'wood',
        length_cm: 240,
        width_cm: 120,
        height_cm: 75,
        price: 65000,
        cost: 42000,
        stock_quantity: 8,
        reorder_point: 2,
        description: 'Elegant conference table with cable management system and solid wood construction'
      }
    },
    {
      entity_type: 'product',
      entity_name: 'Ergonomic Mesh Task Chair',
      entity_code: 'FUR-CHR-003',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.OFFICE.CHAIR.v1',
      metadata: {
        category: 'seating',
        sub_category: 'task_chair'
      },
      dynamic_fields: {
        category: 'seating',
        material: 'fabric',
        length_cm: 58,
        width_cm: 60,
        height_cm: 95,
        price: 8500,
        cost: 5500,
        stock_quantity: 32,
        reorder_point: 10,
        description: 'Breathable mesh back task chair with adjustable armrests and seat height'
      }
    },
    {
      entity_type: 'product',
      entity_name: 'L-Shaped Executive Desk',
      entity_code: 'FUR-DSK-004',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.OFFICE.DESK.v1',
      metadata: {
        category: 'office',
        sub_category: 'desks'
      },
      dynamic_fields: {
        category: 'office',
        material: 'wood',
        length_cm: 180,
        width_cm: 160,
        height_cm: 75,
        price: 32000,
        cost: 20000,
        stock_quantity: 5,
        reorder_point: 2,
        description: 'Premium L-shaped executive desk with built-in storage and wire management'
      }
    },
    {
      entity_type: 'product',
      entity_name: 'Mobile Storage Cabinet',
      entity_code: 'FUR-STG-005',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.STORAGE.CABINET.v1',
      metadata: {
        category: 'storage',
        sub_category: 'mobile'
      },
      dynamic_fields: {
        category: 'storage',
        material: 'metal',
        length_cm: 40,
        width_cm: 55,
        height_cm: 65,
        price: 6500,
        cost: 4200,
        stock_quantity: 18,
        reorder_point: 5,
        description: 'Mobile pedestal with 3 drawers and locking mechanism'
      }
    },
    {
      entity_type: 'product',
      entity_name: 'Visitor Chair - Set of 4',
      entity_code: 'FUR-CHR-006',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.SEATING.VISITOR.v1',
      metadata: {
        category: 'seating',
        sub_category: 'visitor'
      },
      dynamic_fields: {
        category: 'seating',
        material: 'fabric',
        length_cm: 50,
        width_cm: 52,
        height_cm: 82,
        price: 12000,
        cost: 8000,
        stock_quantity: 24,
        reorder_point: 8,
        description: 'Comfortable visitor chairs with padded seats and backs, sold as set of 4'
      }
    },
    {
      entity_type: 'product',
      entity_name: '4-Drawer Filing Cabinet',
      entity_code: 'FUR-STG-007',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.STORAGE.FILING.v1',
      metadata: {
        category: 'storage',
        sub_category: 'filing'
      },
      dynamic_fields: {
        category: 'storage',
        material: 'metal',
        length_cm: 45,
        width_cm: 62,
        height_cm: 132,
        price: 15000,
        cost: 9500,
        stock_quantity: 12,
        reorder_point: 4,
        description: 'Heavy-duty 4-drawer filing cabinet with central locking system'
      }
    },
    {
      entity_type: 'product',
      entity_name: 'Reception Sofa - 3 Seater',
      entity_code: 'FUR-SOF-008',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.SEATING.SOFA.v1',
      metadata: {
        category: 'seating',
        sub_category: 'sofa'
      },
      dynamic_fields: {
        category: 'seating',
        material: 'leather',
        length_cm: 180,
        width_cm: 85,
        height_cm: 75,
        price: 45000,
        cost: 28000,
        stock_quantity: 6,
        reorder_point: 2,
        description: 'Luxurious 3-seater reception sofa with premium leather upholstery'
      }
    },
    {
      entity_type: 'product',
      entity_name: 'Modular Workstation - 4 Person',
      entity_code: 'FUR-WST-009',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.OFFICE.WORKSTATION.v1',
      metadata: {
        category: 'office',
        sub_category: 'workstation'
      },
      dynamic_fields: {
        category: 'office',
        material: 'wood',
        length_cm: 240,
        width_cm: 240,
        height_cm: 120,
        price: 95000,
        cost: 62000,
        stock_quantity: 3,
        reorder_point: 1,
        description: 'Modern 4-person modular workstation with privacy panels and cable management'
      }
    },
    {
      entity_type: 'product',
      entity_name: 'Executive Bookshelf - 5 Tier',
      entity_code: 'FUR-STG-010',
      organization_id: KERALA_FURNITURE_ORG_ID,
      smart_code: 'HERA.FURNITURE.PRODUCT.STORAGE.BOOKSHELF.v1',
      metadata: {
        category: 'storage',
        sub_category: 'shelving'
      },
      dynamic_fields: {
        category: 'storage',
        material: 'wood',
        length_cm: 90,
        width_cm: 35,
        height_cm: 180,
        price: 22000,
        cost: 14000,
        stock_quantity: 10,
        reorder_point: 3,
        description: 'Classic 5-tier bookshelf in premium teak wood with adjustable shelves'
      }
    }
  ];

  // First create the entities
  const productEntities = products.map(p => ({
    entity_type: p.entity_type,
    entity_name: p.entity_name,
    entity_code: p.entity_code,
    organization_id: p.organization_id,
    smart_code: p.smart_code,
    metadata: p.metadata
  }));

  const { data: createdProducts, error: productError } = await supabase
    .from('core_entities')
    .insert(productEntities)
    .select();

  if (productError) {
    console.error('❌ Error creating products:', productError);
    return [];
  }

  console.log(`✅ Created ${createdProducts.length} products`);

  // Now create dynamic fields for each product
  let dynamicFieldsCreated = 0;
  
  for (let i = 0; i < createdProducts.length; i++) {
    const product = createdProducts[i];
    const dynamicFields = products[i].dynamic_fields;
    
    for (const [fieldName, fieldValue] of Object.entries(dynamicFields)) {
      const dynamicField = {
        entity_id: product.id,
        organization_id: KERALA_FURNITURE_ORG_ID,
        field_name: fieldName,
        smart_code: `HERA.FURNITURE.PRODUCT.DYN.${fieldName.toUpperCase()}.v1`
      };

      // Set appropriate field type based on value
      if (typeof fieldValue === 'number') {
        dynamicField.field_value_number = fieldValue;
      } else if (typeof fieldValue === 'boolean') {
        dynamicField.field_value_boolean = fieldValue;
      } else {
        dynamicField.field_value_text = fieldValue.toString();
      }

      const { error: fieldError } = await supabase
        .from('core_dynamic_data')
        .insert(dynamicField);

      if (fieldError) {
        console.error(`❌ Error creating dynamic field ${fieldName}:`, fieldError);
      } else {
        dynamicFieldsCreated++;
      }
    }
  }

  console.log(`✅ Created ${dynamicFieldsCreated} dynamic fields`);
  return createdProducts;
}

async function main() {
  console.log('🏭 Furniture Products Seed Data\n');
  
  // Check if organization exists
  const { data: org, error: orgError } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .eq('id', KERALA_FURNITURE_ORG_ID)
    .single();

  if (orgError || !org) {
    console.error('❌ Kerala Furniture Works organization not found. Please run create-furniture-data.js first.');
    process.exit(1);
  }

  console.log(`✅ Found organization: ${org.organization_name}`);
  
  await createProductsWithDynamicData();
  
  console.log('\n✅ Furniture products seed data complete!');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});