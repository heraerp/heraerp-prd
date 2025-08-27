#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Default organization ID from env
const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c';

async function createSalonProducts() {
  console.log('🛍️ Creating salon products...\n');

  const products = [
    {
      name: "L'Oréal Professional Shampoo",
      sku: 'SHMP-001',
      category: 'Hair Care',
      description: 'Sulfate-free professional shampoo for all hair types',
      price: 45.99,
      cost: 22.50,
      stock: 25,
      reorderPoint: 10,
      supplier: "L'Oréal Professional"
    },
    {
      name: 'Moisturizing Conditioner',
      sku: 'COND-001',
      category: 'Hair Care',
      description: 'Deep moisturizing conditioner for dry and damaged hair',
      price: 48.99,
      cost: 24.00,
      stock: 30,
      reorderPoint: 12,
      supplier: "L'Oréal Professional"
    },
    {
      name: 'OPI Gel Polish - Ruby Red',
      sku: 'NAIL-001',
      category: 'Nail Care',
      description: 'Long-lasting gel polish in Ruby Red',
      price: 18.99,
      cost: 9.00,
      stock: 8,
      reorderPoint: 8,
      supplier: 'OPI'
    },
    {
      name: 'Dermalogica Gentle Face Cleanser',
      sku: 'SKIN-001',
      category: 'Skincare',
      description: 'Gentle daily cleanser for all skin types',
      price: 65.00,
      cost: 32.00,
      stock: 3,
      reorderPoint: 10,
      supplier: 'Dermalogica'
    },
    {
      name: 'Wella Hair Color - Blonde',
      sku: 'COLOR-001',
      category: 'Hair Color',
      description: 'Professional permanent hair color - Light Blonde',
      price: 28.99,
      cost: 14.00,
      stock: 12,
      reorderPoint: 5,
      supplier: 'Wella Professionals'
    },
    {
      name: 'Professional Hair Dryer',
      sku: 'TOOL-001',
      category: 'Tools & Equipment',
      description: 'Ionic professional hair dryer with multiple heat settings',
      price: 189.99,
      cost: 95.00,
      stock: 5,
      reorderPoint: 2,
      supplier: 'Dyson'
    },
    {
      name: 'Argan Oil Hair Serum',
      sku: 'STYLE-001',
      category: 'Styling Products',
      description: 'Nourishing argan oil serum for shine and frizz control',
      price: 35.99,
      cost: 18.00,
      stock: 15,
      reorderPoint: 8,
      supplier: 'Moroccanoil'
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const product of products) {
    try {
      // Create the product entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'product',
          entity_name: product.name,
          entity_code: product.sku,
          smart_code: 'HERA.SALON.PRODUCT.INVENTORY.v1',
          metadata: {
            category: product.category,
            sku: product.sku,
            description: product.description
          },
          status: 'active'
        })
        .select()
        .single();

      if (entityError) {
        console.error(`❌ Error creating ${product.name}:`, entityError.message);
        errorCount++;
        continue;
      }

      // Create dynamic fields for the product
      const dynamicFields = [
        { field_name: 'price', field_value_number: product.price },
        { field_name: 'cost', field_value_number: product.cost },
        { field_name: 'stock_quantity', field_value_number: product.stock },
        { field_name: 'reorder_point', field_value_number: product.reorderPoint },
        { field_name: 'supplier', field_value_text: product.supplier }
      ];

      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .insert(
          dynamicFields.map(field => ({
            organization_id: organizationId,
            entity_id: entity.id,
            ...field,
            smart_code: `HERA.SALON.PRODUCT.FIELD.${field.field_name.toUpperCase()}.v1`
          }))
        );

      if (dynamicError) {
        console.error(`❌ Error creating fields for ${product.name}:`, dynamicError.message);
        errorCount++;
      } else {
        console.log(`✅ Created: ${product.name} (${product.sku})`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Unexpected error:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully created: ${successCount} products`);
  console.log(`❌ Errors: ${errorCount}`);
}

createSalonProducts();