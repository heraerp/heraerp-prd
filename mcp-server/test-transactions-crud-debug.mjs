#!/usr/bin/env node
/**
 * Debug hera_transactions_crud_v1 with minimal payload to identify issues
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const testData = {
  user_entity_id: "09b0b92a-d797-489e-bc03-5ca0a6272674",
  organization_id: "378f24fb-d496-4ff7-8afa-ea34895a0eb8"
};

async function debugTransactionsCrud() {
  console.log('🔍 Debug hera_transactions_crud_v1 step by step...');
  
  let customerId = null;
  
  try {
    // First create a customer
    console.log('\n👤 Creating test customer...');
    const customerResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: testData.user_entity_id,
      p_organization_id: testData.organization_id,
      p_entity: {
        entity_type: 'customer',
        entity_name: 'Debug Customer',
        smart_code: 'HERA.SALON.CUSTOMER.ENTITY.REGULAR.V1'
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    });
    
    if (customerResult.error) {
      console.log('❌ Customer creation failed:', customerResult.error);
      return;
    }
    
    customerId = customerResult.data?.items?.[0]?.id;
    console.log('✅ Customer created:', customerId);
    
    // Test 1: Simple READ operation (should work)
    console.log('\n📖 Test 1: Simple READ operation...');
    const readResult = await supabase.rpc('hera_transactions_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: testData.user_entity_id,
      p_organization_id: testData.organization_id,
      p_payload: {},
      p_options: {
        limit: 5
      }
    });
    
    console.log('READ result:', readResult.error ? 'FAILED' : 'SUCCESS');
    if (readResult.error) {
      console.log('READ error:', readResult.error);
    } else {
      console.log('READ data:', JSON.stringify(readResult.data, null, 2));
    }
    
    // Test 2: Minimal CREATE operation
    console.log('\n➕ Test 2: Minimal CREATE operation...');
    const createResult = await supabase.rpc('hera_transactions_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: testData.user_entity_id,
      p_organization_id: testData.organization_id,
      p_payload: {
        header: {
          transaction_type: 'appointment',
          smart_code: 'HERA.SALON.APPOINTMENT.TXN.BOOKED.V1',
          transaction_code: `DEBUG-${Date.now()}`,
          source_entity_id: customerId,
          target_entity_id: testData.user_entity_id,
          transaction_date: new Date().toISOString(),
          total_amount: 100.00
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Debug Service',
            quantity: 1,
            unit_amount: 100.00,
            line_amount: 100.00
          }
        ]
      },
      p_options: {}
    });
    
    console.log('CREATE result:', createResult.error ? 'FAILED' : 'SUCCESS');
    if (createResult.error) {
      console.log('CREATE error:', createResult.error);
      console.log('CREATE error code:', createResult.error.code);
      console.log('CREATE error details:', createResult.error.details);
      console.log('CREATE error hint:', createResult.error.hint);
    } else {
      console.log('CREATE success!');
      console.log('Created transaction:', JSON.stringify(createResult.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

debugTransactionsCrud();