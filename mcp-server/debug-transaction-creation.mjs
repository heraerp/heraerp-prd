#!/usr/bin/env node
/**
 * 🔍 DEBUG TRANSACTION CREATION
 * 
 * This script specifically debugs transaction creation to understand
 * why transactions are succeeding but returning null IDs.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SALON_DATA = {
  organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  user_id: '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'
};

async function debugTransactionCreation() {
  console.log('🔍 DEBUG: Testing transaction creation with detailed response logging...\n');
  
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: SALON_DATA.user_id,
      p_organization_id: SALON_DATA.organization_id,
      p_payload: {
        header: {
          organization_id: SALON_DATA.organization_id,
          transaction_type: 'test_sale',
          transaction_code: `DEBUG-SALE-${Date.now()}`,
          smart_code: 'HERA.SALON.DEBUG.SALE.TEST.v1',
          source_entity_id: null,
          target_entity_id: null,
          total_amount: 100.00,
          transaction_status: 'completed',
          business_context: { debug: true },
          metadata: { debug_test: true }
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Debug Test Service',
            quantity: 1,
            unit_amount: 100.00,
            line_amount: 100.00
          }
        ]
      }
    });
    
    console.log('📊 RAW RESPONSE DATA:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');
    
    if (error) {
      console.log('❌ ERROR:');
      console.log(JSON.stringify(error, null, 2));
      return;
    }
    
    console.log('✅ SUCCESS - Transaction created!');
    console.log('📋 Response Structure Analysis:');
    console.log(`   • data.success: ${data?.success}`);
    console.log(`   • data.action: ${data?.action}`);
    console.log(`   • data.transaction_id: ${data?.transaction_id}`);
    console.log(`   • data.data exists: ${!!data?.data}`);
    console.log(`   • data.data.transaction exists: ${!!data?.data?.transaction}`);
    console.log(`   • data.data.transaction.id: ${data?.data?.transaction?.id}`);
    
    // Try to find transaction ID in various places
    const possibleIds = [
      data?.transaction_id,
      data?.data?.transaction_id,
      data?.data?.transaction?.id,
      data?.data?.id,
      data?.id
    ];
    
    console.log('\n🔍 Searching for transaction ID in response:');
    possibleIds.forEach((id, index) => {
      console.log(`   • Location ${index + 1}: ${id || 'null'}`);
    });
    
    const actualId = possibleIds.find(id => id && id !== null);
    
    if (actualId) {
      console.log(`\n✅ Found transaction ID: ${actualId}`);
      
      // Try to read it back
      console.log('\n🔄 Attempting to read back the transaction...');
      const { data: readData, error: readError } = await supabase.rpc('hera_txn_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: SALON_DATA.user_id,
        p_organization_id: SALON_DATA.organization_id,
        p_payload: {
          transaction_id: actualId
        }
      });
      
      if (readError) {
        console.log('❌ Read back failed:', readError);
      } else {
        console.log('✅ Read back successful!');
        console.log(`   Transaction Type: ${readData?.data?.transaction?.transaction_type}`);
        console.log(`   Total Amount: $${readData?.data?.transaction?.total_amount}`);
        console.log(`   Status: ${readData?.data?.transaction?.transaction_status}`);
      }
    } else {
      console.log('\n❌ No transaction ID found in response!');
      
      // Check if transaction was actually created by querying recent transactions
      console.log('\n🔍 Checking recent transactions to see if it was created...');
      const { data: recent, error: recentError } = await supabase
        .from('universal_transactions')
        .select('id, transaction_type, transaction_code, total_amount, created_at')
        .eq('organization_id', SALON_DATA.organization_id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!recentError && recent) {
        console.log('📋 Recent transactions:');
        recent.forEach(txn => {
          console.log(`   • ${txn.transaction_type}: ${txn.transaction_code} ($${txn.total_amount})`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Exception:', error.message);
    console.error(error);
  }
}

debugTransactionCreation();