#!/usr/bin/env node

// Create a draft appointment for testing the confirm functionality
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
const SALON_BRANCH_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

async function createDraftAppointment() {
  try {
    const appointmentId = crypto.randomUUID();
    const now = new Date();
    const startTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    console.log('Creating draft appointment for testing...');

    // 1. Create appointment entity
    const { error: entityError } = await supabase
      .from('core_entities')
      .insert({
        id: appointmentId,
        organization_id: SALON_ORG_ID,
        entity_type: 'appointment',
        entity_name: 'Test Customer - Draft Appointment',
        entity_code: `APT-DRAFT-${Date.now()}`,
        smart_code: 'HERA.SALON.APPT.ENTITY.APPOINTMENT.V1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (entityError) {
      console.error('❌ Error creating entity:', entityError);
      return;
    }

    // 2. Create dynamic fields
    const dynamicFields = [
      {
        field_name: 'start_time',
        field_value_text: startTime.toISOString(),
        smart_code: 'HERA.SALON.APPT.DYN.START.V1'
      },
      {
        field_name: 'end_time',
        field_value_text: endTime.toISOString(),
        smart_code: 'HERA.SALON.APPT.DYN.END.V1'
      },
      {
        field_name: 'status',
        field_value_text: 'draft',
        smart_code: 'HERA.SALON.APPT.DYN.STATUS.V1'
      },
      {
        field_name: 'customer_id',
        field_value_text: 'customer-test-draft',
        smart_code: 'HERA.SALON.APPT.DYN.CUSTOMER.V1'
      },
      {
        field_name: 'service_ids',
        field_value_json: JSON.stringify(['service-haircut']),
        smart_code: 'HERA.SALON.APPT.DYN.SERVICES.V1'
      },
      {
        field_name: 'stylist_id',
        field_value_text: 'staff1',
        smart_code: 'HERA.SALON.APPT.DYN.STYLIST.V1'
      },
      {
        field_name: 'branch_id',
        field_value_text: SALON_BRANCH_ID,
        smart_code: 'HERA.SALON.APPT.DYN.BRANCH.V1'
      },
      {
        field_name: 'price',
        field_value_number: 120,
        smart_code: 'HERA.SALON.APPT.DYN.PRICE.V1'
      },
      {
        field_name: 'customer_phone',
        field_value_text: '+971501234567',
        smart_code: 'HERA.SALON.APPT.DYN.PHONE.V1'
      }
    ];

    // Insert dynamic data
    for (const field of dynamicFields) {
      const { error } = await supabase
        .from('core_dynamic_data')
        .insert({
          id: crypto.randomUUID(),
          organization_id: SALON_ORG_ID,
          entity_id: appointmentId,
          field_name: field.field_name,
          field_type: field.field_value_number ? 'number' : 
                     field.field_value_json ? 'json' : 'text',
          field_value_text: field.field_value_text,
          field_value_number: field.field_value_number,
          field_value_json: field.field_value_json,
          smart_code: field.smart_code,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(`❌ Error creating dynamic field ${field.field_name}:`, error);
      }
    }

    console.log('✅ Created draft appointment!');
    console.log(`📅 Appointment ID: ${appointmentId}`);
    console.log(`👤 Customer: Test Customer`);
    console.log(`⏰ Time: ${startTime.toLocaleString()}`);
    console.log(`💇 Service: Haircut & Style`);
    console.log(`📱 Phone: +971501234567 (for WhatsApp testing)`);
    console.log(`🎯 Status: DRAFT (ready for confirmation testing)`);
    console.log('');
    console.log('Now you can test:');
    console.log('1. Visit http://localhost:3001/salon/kanban');
    console.log('2. Find the draft appointment in the DRAFT column');
    console.log('3. Click "Confirm" to test WhatsApp notification');

  } catch (error) {
    console.error('❌ Error creating draft appointment:', error);
  }
}

createDraftAppointment();