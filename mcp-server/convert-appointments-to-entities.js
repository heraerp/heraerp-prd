#!/usr/bin/env node

// ============================================================================
// HERA • Convert Transaction-based Appointments to Entity-based Appointments
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env.local' });

function uuidv4() {
  return crypto.randomUUID();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Constants
const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function convertAppointments() {
  console.log('🔄 Converting transaction-based appointments to entity-based appointments...\n');

  // 1. Get all appointment transactions
  const { data: transactions, error: transError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('transaction_type', 'appointment');

  if (transError) {
    console.error('Error fetching transactions:', transError);
    return;
  }

  console.log(`📊 Found ${transactions.length} appointment transactions to convert`);

  let converted = 0;
  let errors = 0;

  for (const transaction of transactions) {
    try {
      const metadata = transaction.metadata || {};
      
      // Create appointment entity
      const appointmentEntity = {
        id: uuidv4(),
        organization_id: SALON_ORG_ID,
        entity_type: 'appointment',
        entity_name: `${metadata.customer_name || 'Unknown'} - ${metadata.service_name || 'Service'} - ${new Date(metadata.start).toLocaleDateString()}`,
        entity_code: transaction.transaction_code,
        smart_code: 'HERA.SALON.APPT.ENTITY.APPOINTMENT.V1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert the entity
      const { error: entityError } = await supabase
        .from('core_entities')
        .insert(appointmentEntity);

      if (entityError) {
        console.error(`❌ Error creating entity for ${transaction.transaction_code}:`, entityError);
        errors++;
        continue;
      }

      // Create dynamic data fields
      const dynamicFields = [
        {
          field_name: 'start_time',
          field_value_text: metadata.start,
          smart_code: 'HERA.SALON.APPT.DYN.START.V1'
        },
        {
          field_name: 'end_time', 
          field_value_text: metadata.end,
          smart_code: 'HERA.SALON.APPT.DYN.END.V1'
        },
        {
          field_name: 'status',
          field_value_text: metadata.status?.toLowerCase() || 'booked',
          smart_code: 'HERA.SALON.APPT.DYN.STATUS.V1'
        },
        {
          field_name: 'customer_id',
          field_value_text: metadata.customer_id,
          smart_code: 'HERA.SALON.APPT.DYN.CUSTOMER.V1'
        },
        {
          field_name: 'service_ids',
          field_value_json: JSON.stringify([metadata.service_id]),
          smart_code: 'HERA.SALON.APPT.DYN.SERVICES.V1'
        },
        {
          field_name: 'stylist_id',
          field_value_text: metadata.staff_id,
          smart_code: 'HERA.SALON.APPT.DYN.STYLIST.V1'
        },
        {
          field_name: 'branch_id',
          field_value_text: metadata.branch_id,
          smart_code: 'HERA.SALON.APPT.DYN.BRANCH.V1'
        },
        {
          field_name: 'price',
          field_value_number: transaction.total_amount,
          smart_code: 'HERA.SALON.APPT.DYN.PRICE.V1'
        },
        {
          field_name: 'currency_code',
          field_value_text: transaction.transaction_currency_code || 'AED',
          smart_code: 'HERA.SALON.APPT.DYN.CURRENCY.V1'
        },
        {
          field_name: 'duration_minutes',
          field_value_number: metadata.duration_minutes,
          smart_code: 'HERA.SALON.APPT.DYN.DURATION.V1'
        }
      ];

      // Insert dynamic data
      for (const field of dynamicFields) {
        if (field.field_value_text || field.field_value_number || field.field_value_json) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              id: uuidv4(),
              organization_id: SALON_ORG_ID,
              entity_id: appointmentEntity.id,
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
        }
      }

      console.log(`✅ Converted: ${metadata.customer_name} - ${metadata.service_name} (${metadata.status})`);
      converted++;

    } catch (error) {
      console.error(`❌ Error converting transaction ${transaction.transaction_code}:`, error);
      errors++;
    }
  }

  console.log(`\n🎉 Conversion complete!`);
  console.log(`   ✅ Successfully converted: ${converted} appointments`);
  console.log(`   ❌ Errors: ${errors} appointments`);
  console.log(`\n📋 The /salon/appointments page should now show the seeded appointment data!`);
}

// Run the converter
convertAppointments()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error converting appointments:', error);
    process.exit(1);
  });