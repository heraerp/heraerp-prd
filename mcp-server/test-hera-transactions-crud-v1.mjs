#!/usr/bin/env node
/**
 * Test hera_transactions_crud_v1 to discover the correct signature
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

async function testTransactionsCrudV1() {
  console.log('🧪 Testing hera_transactions_crud_v1 signature discovery...');
  
  // Try different parameter combinations to discover the signature
  const testCalls = [
    {
      name: 'Minimal test',
      params: {}
    },
    {
      name: 'With action only',
      params: { p_action: 'CREATE' }
    },
    {
      name: 'CRUD pattern like entities',
      params: {
        p_action: 'CREATE',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id
      }
    },
    {
      name: 'CRUD with transaction object',
      params: {
        p_action: 'CREATE',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_transaction: {},
        p_lines: []
      }
    }
  ];
  
  for (const test of testCalls) {
    console.log(`\n📋 ${test.name}:`);
    try {
      const result = await supabase.rpc('hera_transactions_crud_v1', test.params);
      console.log('✅ SUCCESS:', result.data);
      break; // If one succeeds, we found a working pattern
    } catch (error) {
      if (error.hint) {
        console.log('💡 Hint:', error.hint);
      }
      if (error.details) {
        console.log('📋 Details:', error.details);
      }
      console.log('❌ Error:', error.message);
    }
  }
}

testTransactionsCrudV1();