#!/usr/bin/env node
/**
 * Setup Service Test Data for salon
 * Creates test service entities with all necessary fields
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function setupServiceTestData() {
  console.log('🎯 Setting up Service Test Data for salon...\n');

  const testData = [
    {
      name: 'Sample Service 1',
      name: 'Sample name value',
      category: 'Sample category value',
      price: 'Sample price value',
      duration: 'Sample duration value',
      description: 'Sample description value',
      requires_license: 'Sample requires_license value'
    },
    {
      name: 'Sample Service 2',
      name: 'Another name value',
      category: 'Another category value',
      price: 'Another price value',
      duration: 'Another duration value',
      description: 'Another description value',
      requires_license: 'Another requires_license value'
    },
    {
      name: 'Sample Service 3',
      name: 'Third name value',
      category: 'Third category value',
      price: 'Third price value',
      duration: 'Third duration value',
      description: 'Third description value',
      requires_license: 'Third requires_license value'
    }
  ];

  for (const item of testData) {
    try {
      // 1. Create entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'service',
          entity_name: item.name,
          entity_code: `SERVICE-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          smart_code: 'HERA.SALON.SERVICE.v1',
          status: 'active'
        })
        .select()
        .single();

      if (entityError) throw entityError;

      console.log(`✅ Created service: ${item.name}`);

      // 2. Add dynamic fields
      const fields = [
        { field_name: 'name', field_value_text: item.name, field_type: 'text' },
        { field_name: 'category', field_value_text: item.category, field_type: 'text' },
        { field_name: 'price', field_value_text: item.price, field_type: 'text' },
        { field_name: 'duration', field_value_text: item.duration, field_type: 'text' },
        { field_name: 'description', field_value_text: item.description, field_type: 'text' },
        { field_name: 'requires_license', field_value_text: item.requires_license, field_type: 'text' }
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

  console.log('\n✅ Service test data setup complete!');
}

// Run the setup
setupServiceTestData().catch(console.error);