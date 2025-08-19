#!/usr/bin/env node
/**
 * Setup Transaction Test Data for salon
 * Creates test transaction entities with all necessary fields
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function setupTransactionTestData() {
  console.log('🎯 Setting up Transaction Test Data for salon...\n');

  const testData = [
    {
      name: 'Sample Transaction 1',
      payment_method: 'Sample payment_method value',
      amount: 'Sample amount value',
      reference_number: 'Sample reference_number value',
      status: 'Sample status value',
      notes: 'Sample notes value'
    },
    {
      name: 'Sample Transaction 2',
      payment_method: 'Another payment_method value',
      amount: 'Another amount value',
      reference_number: 'Another reference_number value',
      status: 'Another status value',
      notes: 'Another notes value'
    },
    {
      name: 'Sample Transaction 3',
      payment_method: 'Third payment_method value',
      amount: 'Third amount value',
      reference_number: 'Third reference_number value',
      status: 'Third status value',
      notes: 'Third notes value'
    }
  ];

  for (const item of testData) {
    try {
      // 1. Create entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'transaction',
          entity_name: item.name,
          entity_code: `TRANSACTION-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          smart_code: 'HERA.SALON.TRANSACTION.v1',
          status: 'active'
        })
        .select()
        .single();

      if (entityError) throw entityError;

      console.log(`✅ Created transaction: ${item.name}`);

      // 2. Add dynamic fields
      const fields = [
        { field_name: 'payment_method', field_value_text: item.payment_method, field_type: 'text' },
        { field_name: 'amount', field_value_text: item.amount, field_type: 'text' },
        { field_name: 'reference_number', field_value_text: item.reference_number, field_type: 'text' },
        { field_name: 'status', field_value_text: item.status, field_type: 'text' },
        { field_name: 'notes', field_value_text: item.notes, field_type: 'text' }
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

  console.log('\n✅ Transaction test data setup complete!');
}

// Run the setup
setupTransactionTestData().catch(console.error);