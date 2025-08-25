#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSalonInventory() {
  console.log('🛍️ Creating Salon Inventory Products\n');
  console.log(`📍 Organization: ${organizationId}\n`);

  const products = [
    {
      name: "L'Oréal Professional Serie Expert Shampoo",
      code: 'LOREAL-SHMP-001',
      category: 'Hair Care',
      price: 42.99,
      stock: 25,
      reorderPoint: 10
    },
    {
      name: 'OPI Gel Polish - Big Apple Red',
      code: 'OPI-GEL-RED',
      category: 'Nail Care',
      price: 18.99,
      stock: 15,
      reorderPoint: 8
    },
    {
      name: 'Moroccanoil Treatment Original',
      code: 'MOR-OIL-001',
      category: 'Hair Care',
      price: 44.00,
      stock: 12,
      reorderPoint: 5
    },
    {
      name: 'Dermalogica Daily Microfoliant',
      code: 'DERM-MICRO-001',
      category: 'Skincare',
      price: 65.00,
      stock: 3,
      reorderPoint: 5
    },
    {
      name: 'Wella Professionals Koleston Perfect',
      code: 'WELLA-COLOR-001',
      category: 'Hair Color',
      price: 28.99,
      stock: 20,
      reorderPoint: 10
    }
  ];

  let successCount = 0;

  for (const product of products) {
    try {
      // Step 1: Create product entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'product',
          entity_name: product.name,
          entity_code: product.code,
          smart_code: 'HERA.SALON.PRODUCT.INVENTORY.v1',
          metadata: {
            category: product.category,
            sku: product.code
          },
          status: 'active'
        })
        .select()
        .single();

      if (entityError) {
        console.error(`❌ Error creating ${product.name}:`, entityError.message);
        continue;
      }

      // Step 2: Add dynamic fields
      const fields = [
        { field_name: 'price', field_value_number: product.price },
        { field_name: 'stock_quantity', field_value_number: product.stock },
        { field_name: 'reorder_point', field_value_number: product.reorderPoint }
      ];

      for (const field of fields) {
        const { error: fieldError } = await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: organizationId,
            entity_id: entity.id,
            ...field,
            smart_code: `HERA.SALON.PRODUCT.FIELD.${field.field_name.toUpperCase()}.v1`
          });

        if (fieldError) {
          console.error(`   ⚠️  Error setting ${field.field_name}:`, fieldError.message);
        }
      }

      console.log(`✅ Created: ${product.name}`);
      console.log(`   SKU: ${product.code}`);
      console.log(`   Stock: ${product.stock} units @ $${product.price}`);
      console.log('');
      
      successCount++;
    } catch (error) {
      console.error(`❌ Unexpected error:`, error.message);
    }
  }

  console.log(`\n📊 Summary: Created ${successCount} of ${products.length} products`);
  console.log('\n🌐 Visit http://localhost:3000/org/salon/inventory to see them!');
}

createSalonInventory();