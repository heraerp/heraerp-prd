#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addAppointmentDynamicData() {
  const organizationId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
  
  // Today and tomorrow dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Appointment configurations with realistic times
  const appointmentConfigs = [
    {
      entityId: 'db0d13f4-aa70-433c-9978-f3b7da5acbcc',
      data: {
        start_time: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
        end_time: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
        status: 'completed',
        price: 350,
        currency_code: 'AED'
      }
    },
    {
      entityId: '50ffa6d4-19cd-4eac-b7d2-a945ee22207a',
      data: {
        start_time: new Date(today.setHours(11, 30, 0, 0)).toISOString(),
        end_time: new Date(today.setHours(12, 30, 0, 0)).toISOString(),
        status: 'checked_in',
        price: 250,
        currency_code: 'AED'
      }
    },
    {
      entityId: '3e85c975-de7f-4bdc-bd00-1b91536f2229',
      data: {
        start_time: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
        end_time: new Date(today.setHours(15, 30, 0, 0)).toISOString(),
        status: 'booked',
        price: 450,
        currency_code: 'AED'
      }
    },
    {
      entityId: '58dea436-cac9-4ee9-a045-85ee05ab9acb',
      data: {
        start_time: new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString(),
        end_time: new Date(tomorrow.setHours(11, 0, 0, 0)).toISOString(),
        status: 'booked',
        price: 300,
        currency_code: 'AED'
      }
    },
    {
      entityId: 'b7402f40-b028-440f-adc6-d580ff1e6fa0',
      data: {
        start_time: new Date(tomorrow.setHours(15, 0, 0, 0)).toISOString(),
        end_time: new Date(tomorrow.setHours(16, 30, 0, 0)).toISOString(),
        status: 'booked',
        price: 550,
        currency_code: 'AED'
      }
    }
  ];

  console.log('🎯 Adding dynamic data to appointments...\n');

  for (const config of appointmentConfigs) {
    console.log(`\n📅 Processing appointment: ${config.entityId}`);
    
    // Add each field as a separate dynamic data entry
    for (const [fieldName, fieldValue] of Object.entries(config.data)) {
      try {
        // Determine the field type based on the value
        let fieldData = {
          entity_id: config.entityId,
          organization_id: organizationId,
          field_name: fieldName,
          smart_code: `HERA.SALON.APPT.DYN.${fieldName.toUpperCase()}.v1`
        };

        if (typeof fieldValue === 'number') {
          fieldData.field_value_number = fieldValue;
        } else {
          fieldData.field_value_text = fieldValue;
        }

        // Check if field already exists
        const { data: existing } = await supabase
          .from('core_dynamic_data')
          .select('*')
          .eq('entity_id', config.entityId)
          .eq('field_name', fieldName)
          .eq('organization_id', organizationId)
          .single();

        if (existing) {
          // Update existing field
          const { data, error } = await supabase
            .from('core_dynamic_data')
            .update(fieldData)
            .eq('id', existing.id);

          if (error) {
            console.error(`❌ Error updating ${fieldName}:`, error.message);
          } else {
            console.log(`✅ Updated ${fieldName}: ${fieldValue}`);
          }
        } else {
          // Create new field
          const { data, error } = await supabase
            .from('core_dynamic_data')
            .insert(fieldData);

          if (error) {
            console.error(`❌ Error creating ${fieldName}:`, error.message);
          } else {
            console.log(`✅ Created ${fieldName}: ${fieldValue}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${fieldName}:`, error.message);
      }
    }
  }

  console.log('\n\n🎉 Appointment dynamic data setup complete!');
  console.log('\n📊 Summary:');
  console.log(`- Total appointments updated: ${appointmentConfigs.length}`);
  console.log('- Statuses: completed (1), checked_in (1), booked (3)');
  console.log('- Date range: Today and tomorrow');
  console.log('- Price range: 250-550 AED');
}

// Run the function
addAppointmentDynamicData().catch(console.error);