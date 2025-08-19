#!/usr/bin/env node
/**
 * Setup Product Test Data for salon
 * Creates test product entities with all necessary fields
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function setupProductTestData() {
  console.log('🎯 Setting up Product Test Data for salon...\n');

  const testData = [
    {
      name: 'Sample Product 1',
      sku: 'Sample sku value',
      price: 'Sample price value',
      cost: 'Sample cost value',
      stock_level: 'Sample stock_level value',
      reorder_point: 'Sample reorder_point value',
      category: 'Sample category value',
      location: 'Sample location value'
    },
    {
      name: 'Sample Product 2',
      sku: 'Another sku value',
      price: 'Another price value',
      cost: 'Another cost value',
      stock_level: 'Another stock_level value',
      reorder_point: 'Another reorder_point value',
      category: 'Another category value',
      location: 'Another location value'
    },
    {
      name: 'Sample Product 3',
      sku: 'Third sku value',
      price: 'Third price value',
      cost: 'Third cost value',
      stock_level: 'Third stock_level value',
      reorder_point: 'Third reorder_point value',
      category: 'Third category value',
      location: 'Third location value'
    }
  ];

  for (const item of testData) {
    try {
      // 1. Create entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'product',
          entity_name: item.name,
          entity_code: `PRODUCT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          smart_code: 'HERA.SALON.PRODUCT.v1',
          status: 'active'
        })
        .select()
        .single();

      if (entityError) throw entityError;

      console.log(`✅ Created product: ${item.name}`);

      // 2. Add dynamic fields
      const fields = [
        { field_name: 'sku', field_value_text: item.sku, field_type: 'text' },
        { field_name: 'price', field_value_text: item.price, field_type: 'text' },
        { field_name: 'cost', field_value_text: item.cost, field_type: 'text' },
        { field_name: 'stock_level', field_value_text: item.stock_level, field_type: 'text' },
        { field_name: 'reorder_point', field_value_text: item.reorder_point, field_type: 'text' },
        { field_name: 'category', field_value_text: item.category, field_type: 'text' },
        { field_name: 'location', field_value_text: item.location, field_type: 'text' }
      ];

      for (const field of fields) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: organizationId,
            entity_id: entity.id,
            ...field,
            smart_code: `HERA.SALON.FIELD.${field.field_name.toUpperCase()}.v1`
          });
      }

      console.log(`  📝 Added ${fields.length} fields`);

    } catch (error) {
      console.error(`❌ Error creating ${item.name}:`, error.message);
    }
  }

  console.log('\n✅ Product test data setup complete!');
}

// Run the setup
setupProductTestData().catch(console.error);