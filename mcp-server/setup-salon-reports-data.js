#!/usr/bin/env node
/**
 * Setup Report Test Data for salon
 * Creates test report entities with all necessary fields
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function setupReportTestData() {
  console.log('🎯 Setting up Report Test Data for salon...\n');

  const testData = [
    {
      name: 'Sample Report 1',
      report_type: 'Sample report_type value',
      frequency: 'Sample frequency value',
      parameters: 'Sample parameters value',
      last_run: 'Sample last_run value',
      recipients: 'Sample recipients value',
      format: 'Sample format value'
    },
    {
      name: 'Sample Report 2',
      report_type: 'Another report_type value',
      frequency: 'Another frequency value',
      parameters: 'Another parameters value',
      last_run: 'Another last_run value',
      recipients: 'Another recipients value',
      format: 'Another format value'
    },
    {
      name: 'Sample Report 3',
      report_type: 'Third report_type value',
      frequency: 'Third frequency value',
      parameters: 'Third parameters value',
      last_run: 'Third last_run value',
      recipients: 'Third recipients value',
      format: 'Third format value'
    }
  ];

  for (const item of testData) {
    try {
      // 1. Create entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'report',
          entity_name: item.name,
          entity_code: `REPORT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          smart_code: 'HERA.SALON.REPORT.v1',
          status: 'active'
        })
        .select()
        .single();

      if (entityError) throw entityError;

      console.log(`✅ Created report: ${item.name}`);

      // 2. Add dynamic fields
      const fields = [
        { field_name: 'report_type', field_value_text: item.report_type, field_type: 'text' },
        { field_name: 'frequency', field_value_text: item.frequency, field_type: 'text' },
        { field_name: 'parameters', field_value_text: item.parameters, field_type: 'text' },
        { field_name: 'last_run', field_value_text: item.last_run, field_type: 'text' },
        { field_name: 'recipients', field_value_text: item.recipients, field_type: 'text' },
        { field_name: 'format', field_value_text: item.format, field_type: 'text' }
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

  console.log('\n✅ Report test data setup complete!');
}

// Run the setup
setupReportTestData().catch(console.error);