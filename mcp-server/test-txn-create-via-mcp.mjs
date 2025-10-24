#!/usr/bin/env node
/**
 * Test transaction creation directly via MCP server pattern
 * Using the same proven pattern as entity CRUD tests
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🧪 MCP-Style Transaction CREATE Test\n');
console.log('=' .repeat(60));
console.log('Organization:', TEST_ORG_ID);
console.log('Actor:', TEST_ACTOR_ID);
console.log('');

// Test 1: Direct call to hera_txn_create_v1 (bypassing orchestrator)
console.log('📋 TEST 1: Direct hera_txn_create_v1 call');
console.log('-'.repeat(60));

const test1Result = await supabase.rpc('hera_txn_create_v1', {
  p_header: {
    organization_id: TEST_ORG_ID,
    transaction_type: 'SALE',
    transaction_code: 'MCP-TEST-' + Date.now(),
    smart_code: 'HERA.SALON.POS.SALE.TXN.v1',  // 5 total segments
    total_amount: 100,
    transaction_status: 'completed'
  },
  p_lines: [
    {
      line_number: 1,
      line_type: 'service',
      description: 'Test Service',
      quantity: 1,
      unit_amount: 100,
      line_amount: 100,
      smart_code: 'HERA.SALON.SERVICE.LINE.ITEM.v1'
    }
  ],
  p_actor_user_id: TEST_ACTOR_ID
});

console.log('\n📦 RESULT:');
if (test1Result.error) {
  console.log('❌ RPC Error:', test1Result.error.message);
  console.log('   Code:', test1Result.error.code);
  console.log('   Details:', test1Result.error.details);
  console.log('   Hint:', test1Result.error.hint);
} else {
  console.log('✅ RPC call succeeded');
  console.log('Response type:', typeof test1Result.data);

  if (test1Result.data) {
    console.log('\n📊 Response structure:');
    console.log(JSON.stringify(test1Result.data, null, 2));

    // Check if it's the wrapper object
    if (test1Result.data.success !== undefined) {
      console.log('\n🎯 Function response:');
      console.log('   Success:', test1Result.data.success);
      console.log('   Action:', test1Result.data.action);
      console.log('   Transaction ID:', test1Result.data.transaction_id);

      if (test1Result.data.error) {
        console.log('\n❌ Function error:', test1Result.data.error);
        console.log('   Detail:', test1Result.data.error_detail);
        console.log('   Hint:', test1Result.data.error_hint);
        console.log('   Context:', test1Result.data.error_context);
      }

      if (test1Result.data.data) {
        console.log('\n📄 Transaction data returned:');
        console.log('   Keys:', Object.keys(test1Result.data.data));
      }
    }
  }
}

console.log('\n');

// Test 2: Try with even more segments (6 total)
console.log('📋 TEST 2: Try with 6-segment smart code');
console.log('-'.repeat(60));

const test2Result = await supabase.rpc('hera_txn_create_v1', {
  p_header: {
    organization_id: TEST_ORG_ID,
    transaction_type: 'SALE',
    transaction_code: 'MCP-TEST2-' + Date.now(),
    smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',  // 6 total segments
    total_amount: 150
  },
  p_lines: [],
  p_actor_user_id: TEST_ACTOR_ID
});

console.log('\n📦 RESULT:');
if (test2Result.error) {
  console.log('❌ RPC Error:', test2Result.error.message);
} else if (test2Result.data?.success === false) {
  console.log('❌ Function Error:', test2Result.data.error);
} else if (test2Result.data?.success === true) {
  console.log('✅ Success! Transaction ID:', test2Result.data.transaction_id);

  // Cleanup
  if (test2Result.data.transaction_id) {
    await supabase.from('universal_transactions')
      .delete()
      .eq('id', test2Result.data.transaction_id);
    console.log('✅ Cleanup complete');
  }
} else {
  console.log('⚠️  Unexpected response:', test2Result.data);
}

console.log('\n');

// Test 3: Minimal smart code (4 total segments - minimum)
console.log('📋 TEST 3: Minimal smart code (4 segments total)');
console.log('-'.repeat(60));

const test3Result = await supabase.rpc('hera_txn_create_v1', {
  p_header: {
    organization_id: TEST_ORG_ID,
    transaction_type: 'SALE',
    transaction_code: 'MCP-TEST3-' + Date.now(),
    smart_code: 'HERA.SALON.TXN.SALE.v1',  // 4 total segments (HERA + SALON + TXN + SALE + v1)
    total_amount: 200
  },
  p_lines: [],
  p_actor_user_id: TEST_ACTOR_ID
});

console.log('\n📦 RESULT:');
if (test3Result.error) {
  console.log('❌ RPC Error:', test3Result.error.message);
} else if (test3Result.data?.success === false) {
  console.log('❌ Function Error:', test3Result.data.error);
  console.log('   This helps us understand the minimum segment requirement');
} else if (test3Result.data?.success === true) {
  console.log('✅ Success! Transaction ID:', test3Result.data.transaction_id);

  // Cleanup
  if (test3Result.data.transaction_id) {
    await supabase.from('universal_transactions')
      .delete()
      .eq('id', test3Result.data.transaction_id);
    console.log('✅ Cleanup complete');
  }
} else {
  console.log('⚠️  Unexpected response:', test3Result.data);
}

console.log('\n');
console.log('═'.repeat(60));
console.log('DIAGNOSIS');
console.log('═'.repeat(60));
console.log('');

if (test1Result.data?.success === false &&
    test1Result.data?.error?.includes('SMART_CODE_INVALID')) {
  console.log('🔴 CONFIRMED: Smart code validation is blocking CREATE');
  console.log('');
  console.log('The regex pattern in the deployed function needs to be fixed.');
  console.log('See SMART-CODE-VALIDATION-FINDINGS.md for details.');
  console.log('');
  console.log('Fix required: Remove extra backslashes from regex pattern');
} else if (test1Result.data?.success === true) {
  console.log('🟢 Transaction creation is WORKING!');
  console.log('');
  console.log('The deployed function is accepting smart codes correctly.');
} else if (test1Result.error) {
  console.log('🔴 RPC-level error (not function-level)');
  console.log('');
  console.log('Issue:', test1Result.error.message);
}

console.log('');
