#!/usr/bin/env node
/**
 * Setup Patient Test Data for healthcare
 * Creates test patient entities with all necessary fields
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function setupPatientTestData() {
  console.log('🎯 Setting up Patient Test Data for healthcare...\n');

  const testData = [
    {
      name: 'Sample Patient 1',
      medical_record_number: 'Sample medical_record_number value',
      date_of_birth: 'Sample date_of_birth value',
      blood_type: 'Sample blood_type value',
      allergies: 'Sample allergies value',
      medications: 'Sample medications value',
      insurance_info: 'Sample insurance_info value'
    },
    {
      name: 'Sample Patient 2',
      medical_record_number: 'Another medical_record_number value',
      date_of_birth: 'Another date_of_birth value',
      blood_type: 'Another blood_type value',
      allergies: 'Another allergies value',
      medications: 'Another medications value',
      insurance_info: 'Another insurance_info value'
    },
    {
      name: 'Sample Patient 3',
      medical_record_number: 'Third medical_record_number value',
      date_of_birth: 'Third date_of_birth value',
      blood_type: 'Third blood_type value',
      allergies: 'Third allergies value',
      medications: 'Third medications value',
      insurance_info: 'Third insurance_info value'
    }
  ];

  for (const item of testData) {
    try {
      // 1. Create entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'patient',
          entity_name: item.name,
          entity_code: `PATIENT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          smart_code: 'HERA.HLTH.PATIENT.v1',
          status: 'active'
        })
        .select()
        .single();

      if (entityError) throw entityError;

      console.log(`✅ Created patient: ${item.name}`);

      // 2. Add dynamic fields
      const fields = [
        { field_name: 'medical_record_number', field_value_text: item.medical_record_number, field_type: 'text' },
        { field_name: 'date_of_birth', field_value_text: item.date_of_birth, field_type: 'text' },
        { field_name: 'blood_type', field_value_text: item.blood_type, field_type: 'text' },
        { field_name: 'allergies', field_value_text: item.allergies, field_type: 'text' },
        { field_name: 'medications', field_value_text: item.medications, field_type: 'text' },
        { field_name: 'insurance_info', field_value_text: item.insurance_info, field_type: 'text' }
      ];

      for (const field of fields) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: organizationId,
            entity_id: entity.id,
            ...field,
            smart_code: `HERA.HLTH.FIELD.${field.field_name.toUpperCase()}.v1`
          });
      }

      console.log(`  📝 Added ${fields.length} fields`);

    } catch (error) {
      console.error(`❌ Error creating ${item.name}:`, error.message);
    }
  }

  console.log('\n✅ Patient test data setup complete!');
}

// Run the setup
setupPatientTestData().catch(console.error);