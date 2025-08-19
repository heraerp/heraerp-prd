#!/usr/bin/env node
/**
 * Setup Employee Test Data for salon
 * Creates test employee entities with all necessary fields
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function setupEmployeeTestData() {
  console.log('🎯 Setting up Employee Test Data for salon...\n');

  const testData = [
    {
      name: 'Sample Employee 1',
      email: 'Sample email value',
      phone: 'Sample phone value',
      role: 'Sample role value',
      specialties: 'Sample specialties value',
      hourly_rate: 'Sample hourly_rate value',
      commission_rate: 'Sample commission_rate value'
    },
    {
      name: 'Sample Employee 2',
      email: 'Another email value',
      phone: 'Another phone value',
      role: 'Another role value',
      specialties: 'Another specialties value',
      hourly_rate: 'Another hourly_rate value',
      commission_rate: 'Another commission_rate value'
    },
    {
      name: 'Sample Employee 3',
      email: 'Third email value',
      phone: 'Third phone value',
      role: 'Third role value',
      specialties: 'Third specialties value',
      hourly_rate: 'Third hourly_rate value',
      commission_rate: 'Third commission_rate value'
    }
  ];

  for (const item of testData) {
    try {
      // 1. Create entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'employee',
          entity_name: item.name,
          entity_code: `EMPLOYEE-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          smart_code: 'HERA.SALON.EMPLOYEE.v1',
          status: 'active'
        })
        .select()
        .single();

      if (entityError) throw entityError;

      console.log(`✅ Created employee: ${item.name}`);

      // 2. Add dynamic fields
      const fields = [
        { field_name: 'email', field_value_text: item.email, field_type: 'text' },
        { field_name: 'phone', field_value_text: item.phone, field_type: 'text' },
        { field_name: 'role', field_value_text: item.role, field_type: 'text' },
        { field_name: 'specialties', field_value_text: item.specialties, field_type: 'text' },
        { field_name: 'hourly_rate', field_value_text: item.hourly_rate, field_type: 'text' },
        { field_name: 'commission_rate', field_value_text: item.commission_rate, field_type: 'text' }
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

  console.log('\n✅ Employee test data setup complete!');
}

// Run the setup
setupEmployeeTestData().catch(console.error);