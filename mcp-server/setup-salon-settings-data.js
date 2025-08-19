#!/usr/bin/env node
/**
 * Setup Setting Test Data for salon
 * Creates test setting entities with all necessary fields
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function setupSettingTestData() {
  console.log('🎯 Setting up Setting Test Data for salon...\n');

  const testData = [
    {
      name: 'Sample Setting 1',
      setting_key: 'Sample setting_key value',
      setting_value: 'Sample setting_value value',
      setting_type: 'Sample setting_type value',
      description: 'Sample description value',
      updated_by: 'Sample updated_by value'
    },
    {
      name: 'Sample Setting 2',
      setting_key: 'Another setting_key value',
      setting_value: 'Another setting_value value',
      setting_type: 'Another setting_type value',
      description: 'Another description value',
      updated_by: 'Another updated_by value'
    },
    {
      name: 'Sample Setting 3',
      setting_key: 'Third setting_key value',
      setting_value: 'Third setting_value value',
      setting_type: 'Third setting_type value',
      description: 'Third description value',
      updated_by: 'Third updated_by value'
    }
  ];

  for (const item of testData) {
    try {
      // 1. Create entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'setting',
          entity_name: item.name,
          entity_code: `SETTING-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          smart_code: 'HERA.SALON.SETTING.v1',
          status: 'active'
        })
        .select()
        .single();

      if (entityError) throw entityError;

      console.log(`✅ Created setting: ${item.name}`);

      // 2. Add dynamic fields
      const fields = [
        { field_name: 'setting_key', field_value_text: item.setting_key, field_type: 'text' },
        { field_name: 'setting_value', field_value_text: item.setting_value, field_type: 'text' },
        { field_name: 'setting_type', field_value_text: item.setting_type, field_type: 'text' },
        { field_name: 'description', field_value_text: item.description, field_type: 'text' },
        { field_name: 'updated_by', field_value_text: item.updated_by, field_type: 'text' }
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

  console.log('\n✅ Setting test data setup complete!');
}

// Run the setup
setupSettingTestData().catch(console.error);