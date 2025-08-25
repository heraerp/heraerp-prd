#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInventoryWithMCP() {
  console.log('🧪 Testing Salon Inventory with MCP\n');
  console.log(`📍 Using Organization: ${organizationId}\n`);

  try {
    // Step 1: Create a product
    console.log('1️⃣ Creating product entity...');
    const productData = {
      organization_id: organizationId,
      entity_type: 'product',
      entity_name: 'Moroccanoil Treatment Light',
      entity_code: 'MOR-LIGHT-001',
      smart_code: 'HERA.SALON.PRODUCT.INVENTORY.v1',
      metadata: {
        category: 'Hair Care',
        sku: 'MOR-LIGHT-001',
        description: 'Lightweight argan oil treatment for fine hair'
      },
      status: 'active'
    };

    const { data: product, error: productError } = await supabase
      .from('core_entities')
      .insert(productData)
      .select()
      .single();

    if (productError) {
      console.error('❌ Error creating product:', productError);
      return;
    }

    console.log('✅ Product created:', product.entity_name);
    console.log('   ID:', product.id);

    // Step 2: Add dynamic fields
    console.log('\n2️⃣ Adding dynamic fields...');
    const dynamicFields = [
      {
        organization_id: organizationId,
        entity_id: product.id,
        field_name: 'price',
        field_value_number: 34.99,
        smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.v1'
      },
      {
        organization_id: organizationId,
        entity_id: product.id,
        field_name: 'stock_quantity',
        field_value_number: 25,
        smart_code: 'HERA.SALON.PRODUCT.FIELD.STOCK.v1'
      },
      {
        organization_id: organizationId,
        entity_id: product.id,
        field_name: 'reorder_point',
        field_value_number: 10,
        smart_code: 'HERA.SALON.PRODUCT.FIELD.REORDER.v1'
      }
    ];

    const { error: fieldsError } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicFields);

    if (fieldsError) {
      console.error('❌ Error adding fields:', fieldsError);
      return;
    }

    console.log('✅ Dynamic fields added successfully');

    // Step 3: Query the product with its fields
    console.log('\n3️⃣ Querying product with dynamic data...');
    const { data: productWithFields, error: queryError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data (
          field_name,
          field_value_text,
          field_value_number
        )
      `)
      .eq('id', product.id)
      .single();

    if (queryError) {
      console.error('❌ Error querying:', queryError);
      return;
    }

    console.log('✅ Product retrieved with fields:');
    console.log('   Name:', productWithFields.entity_name);
    console.log('   SKU:', productWithFields.entity_code);
    console.log('   Dynamic Fields:');
    productWithFields.core_dynamic_data.forEach(field => {
      const value = field.field_value_number || field.field_value_text;
      console.log(`     ${field.field_name}: ${value}`);
    });

    console.log('\n✨ Test completed successfully!');
    console.log('📱 Visit http://localhost:3000/org/salon/inventory to see the product');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testInventoryWithMCP();