#!/usr/bin/env node
/**
 * Setup Loyalty_program Test Data for salon
 * Creates test loyalty_program entities with all necessary fields
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function setupLoyalty_programTestData() {
  console.log('🎯 Setting up Loyalty_program Test Data for salon...\n');

  const testData = [
    {
      name: 'Sample Loyalty_program 1',
      points_ratio: 'Sample points_ratio value',
      tier_benefits: 'Sample tier_benefits value',
      expiry_days: 'Sample expiry_days value',
      tier_name: 'Sample tier_name value',
      minimum_spend: 'Sample minimum_spend value'
    },
    {
      name: 'Sample Loyalty_program 2',
      points_ratio: 'Another points_ratio value',
      tier_benefits: 'Another tier_benefits value',
      expiry_days: 'Another expiry_days value',
      tier_name: 'Another tier_name value',
      minimum_spend: 'Another minimum_spend value'
    },
    {
      name: 'Sample Loyalty_program 3',
      points_ratio: 'Third points_ratio value',
      tier_benefits: 'Third tier_benefits value',
      expiry_days: 'Third expiry_days value',
      tier_name: 'Third tier_name value',
      minimum_spend: 'Third minimum_spend value'
    }
  ];

  for (const item of testData) {
    try {
      // 1. Create entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'loyalty_program',
          entity_name: item.name,
          entity_code: `LOYALTY_PROGRAM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          smart_code: 'HERA.SALON.LOYALTY_PROGRAM.v1',
          status: 'active'
        })
        .select()
        .single();

      if (entityError) throw entityError;

      console.log(`✅ Created loyalty_program: ${item.name}`);

      // 2. Add dynamic fields
      const fields = [
        { field_name: 'points_ratio', field_value_text: item.points_ratio, field_type: 'text' },
        { field_name: 'tier_benefits', field_value_text: item.tier_benefits, field_type: 'text' },
        { field_name: 'expiry_days', field_value_text: item.expiry_days, field_type: 'text' },
        { field_name: 'tier_name', field_value_text: item.tier_name, field_type: 'text' },
        { field_name: 'minimum_spend', field_value_text: item.minimum_spend, field_type: 'text' }
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

  console.log('\n✅ Loyalty_program test data setup complete!');
}

// Run the setup
setupLoyalty_programTestData().catch(console.error);