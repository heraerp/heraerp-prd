#!/usr/bin/env node
/**
 * Setup Appointment Test Data for salon
 * Creates test appointment entities with all necessary fields
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function setupAppointmentTestData() {
  console.log('🎯 Setting up Appointment Test Data for salon...\n');

  const testData = [
    {
      name: 'Sample Appointment 1',
      date: 'Sample date value',
      time: 'Sample time value',
      duration: 'Sample duration value',
      notes: 'Sample notes value',
      status: 'Sample status value',
      type: 'Sample type value'
    },
    {
      name: 'Sample Appointment 2',
      date: 'Another date value',
      time: 'Another time value',
      duration: 'Another duration value',
      notes: 'Another notes value',
      status: 'Another status value',
      type: 'Another type value'
    },
    {
      name: 'Sample Appointment 3',
      date: 'Third date value',
      time: 'Third time value',
      duration: 'Third duration value',
      notes: 'Third notes value',
      status: 'Third status value',
      type: 'Third type value'
    }
  ];

  for (const item of testData) {
    try {
      // 1. Create entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'appointment',
          entity_name: item.name,
          entity_code: `APPOINTMENT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          smart_code: 'HERA.SALON.APPOINTMENT.v1',
          status: 'active'
        })
        .select()
        .single();

      if (entityError) throw entityError;

      console.log(`✅ Created appointment: ${item.name}`);

      // 2. Add dynamic fields
      const fields = [
        { field_name: 'date', field_value_text: item.date, field_type: 'text' },
        { field_name: 'time', field_value_text: item.time, field_type: 'text' },
        { field_name: 'duration', field_value_text: item.duration, field_type: 'text' },
        { field_name: 'notes', field_value_text: item.notes, field_type: 'text' },
        { field_name: 'status', field_value_text: item.status, field_type: 'text' },
        { field_name: 'type', field_value_text: item.type, field_type: 'text' }
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

  console.log('\n✅ Appointment test data setup complete!');
}

// Run the setup
setupAppointmentTestData().catch(console.error);