#!/usr/bin/env node
/**
 * Setup Employee Test Data
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
  console.log('🎯 Setting up Employee Test Data...\n');

  const testData = [
    {
      name: 'Emma Thompson',
      email: 'emma@salon.com',
      phone: '(555) 123-4567',
      role: 'Senior Stylist',
      specialties: 'Hair Cutting, Color Specialist, Bridal Styling',
      hourly_rate: '85',
      commission_rate: '45'
    },
    {
      name: 'David Rodriguez',
      email: 'david@salon.com',
      phone: '(555) 987-6543',
      role: 'Barber',
      specialties: 'Classic Cuts, Beard Styling, Hot Towel Shaves',
      hourly_rate: '65',
      commission_rate: '40'
    },
    {
      name: 'Alex Chen',
      email: 'alex@salon.com',
      phone: '(555) 456-7890',
      role: 'Junior Stylist',
      specialties: 'Basic Cuts, Blow Drying, Treatments',
      hourly_rate: '45',
      commission_rate: '35'
    },
    {
      name: 'Sarah Kim',
      email: 'sarah@salon.com',
      phone: '(555) 321-9876',
      role: 'Nail Technician',
      specialties: 'Manicures, Pedicures, Nail Art, Gel Polish',
      hourly_rate: '50',
      commission_rate: '40'
    },
    {
      name: 'Michael Foster',
      email: 'michael@salon.com',
      phone: '(555) 654-3210',
      role: 'Massage Therapist',
      specialties: 'Swedish Massage, Deep Tissue, Hot Stone Therapy',
      hourly_rate: '75',
      commission_rate: '50'
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
          entity_code: `EMPLOYEE-${Date.now()}`,
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
      console.error(`❌ Error creating ${item.name}:`, error);
    }
  }

  console.log('\n✅ Employee test data setup complete!');
}

// Run the setup
setupEmployeeTestData().catch(console.error);