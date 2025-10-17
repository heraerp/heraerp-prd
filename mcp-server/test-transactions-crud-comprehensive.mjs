#!/usr/bin/env node
/**
 * Comprehensive test of hera_transactions_crud_v1 with full CRUD operations
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

async function testTransactionsCrudComprehensive() {
  console.log('🧪 Testing hera_transactions_crud_v1 COMPREHENSIVE CRUD...');
  
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
        entity_name: 'Test Customer for Transactions',
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
    
    // Now test various transaction CRUD patterns
    const crudTests = [
      {
        name: 'CREATE with basic transaction data',
        action: 'CREATE',
        params: {
          p_action: 'CREATE',
          p_actor_user_id: testData.user_entity_id,
          p_organization_id: testData.organization_id,
          p_transaction: {
            transaction_type: 'appointment',
            smart_code: 'HERA.SALON.APPOINTMENT.TXN.BOOKED.V1',
            source_entity_id: customerId,
            target_entity_id: testData.user_entity_id,
            total_amount: 150.00
          }
        }
      },
      {
        name: 'CREATE with transaction and lines',
        action: 'CREATE',
        params: {
          p_action: 'CREATE',
          p_actor_user_id: testData.user_entity_id,
          p_organization_id: testData.organization_id,
          p_transaction: {
            transaction_type: 'sale',
            smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
            source_entity_id: customerId,
            target_entity_id: testData.user_entity_id,
            total_amount: 85.99
          },
          p_lines: [
            {
              line_type: 'product',
              description: 'Hair Serum',
              quantity: 1,
              unit_amount: 85.99,
              line_amount: 85.99
            }
          ]
        }
      }
    ];
    
    for (const test of crudTests) {
      console.log(`\n📋 Testing: ${test.name}`);
      
      try {
        const result = await supabase.rpc('hera_transactions_crud_v1', test.params);
        
        if (result.error) {
          console.log('❌ Error:', result.error);
          if (result.error.hint) {
            console.log('💡 Hint:', result.error.hint);
          }
        } else {
          console.log('✅ SUCCESS!');
          console.log('📊 Result:', JSON.stringify(result.data, null, 2));
          
          // If we created a transaction, try to read it
          if (result.data && result.data.transaction_id) {
            console.log('\n📖 Testing READ of created transaction...');
            const readResult = await supabase.rpc('hera_transactions_crud_v1', {
              p_action: 'READ',
              p_actor_user_id: testData.user_entity_id,
              p_organization_id: testData.organization_id,
              p_transaction: {
                transaction_id: result.data.transaction_id
              }
            });
            
            if (readResult.error) {
              console.log('❌ READ Error:', readResult.error);
            } else {
              console.log('✅ READ Success:', JSON.stringify(readResult.data, null, 2));
            }
          }
        }
        
      } catch (error) {
        console.log('❌ Exception:', error.message);
        if (error.hint) {
          console.log('💡 Hint:', error.hint);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Cleanup
    if (customerId) {
      await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'DELETE',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_entity: { entity_id: customerId },
        p_dynamic: {},
        p_relationships: [],
        p_options: {}
      });
      console.log('\n🧹 Cleaned up test customer');
    }
  }
}

testTransactionsCrudComprehensive();