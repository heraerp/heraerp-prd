#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🧪 Simple CREATE Test\n');
console.log('Testing if orchestrator CREATE is fixed...\n');

const result = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: TEST_ACTOR_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    header: {
      organization_id: TEST_ORG_ID,
      transaction_type: 'SALE',
      transaction_code: 'FIXED-TEST-' + Date.now(),
      smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
      total_amount: 150,
      transaction_status: 'completed'
    },
    lines: [
      {
        line_number: 1,
        line_type: 'service',
        description: 'Haircut',
        quantity: 1,
        unit_amount: 150,
        line_amount: 150
      }
    ]
  }
});

console.log('═'.repeat(60));
console.log('RESULT ANALYSIS:');
console.log('═'.repeat(60));

if (result.error) {
  console.log('❌ RPC ERROR:', result.error.message);
  console.log('Code:', result.error.code);
  process.exit(1);
}

const response = result.data;

console.log('\n1. SUCCESS STATUS:');
console.log('   response.success:', response.success);
console.log('   response.action:', response.action);

console.log('\n2. TRANSACTION ID:');
console.log('   response.transaction_id:', response.transaction_id);

console.log('\n3. ERROR CHECK:');
console.log('   response.error:', response.error || 'None');

console.log('\n4. NESTED DATA:');
console.log('   response.data exists:', !!response.data);
console.log('   response.data.success:', response.data?.success);
console.log('   response.data.action:', response.data?.action);

console.log('\n5. HEADER CHECK:');
const header = response.data?.data?.header;
if (header) {
  console.log('   ✅ Header found!');
  console.log('   - Header fields:', Object.keys(header).length);
  console.log('   - Transaction ID:', header.id);
  console.log('   - Transaction type:', header.transaction_type);
  console.log('   - Total amount:', header.total_amount);
  console.log('   - Status:', header.transaction_status);
} else {
  console.log('   ❌ No header found');
}

console.log('\n6. LINES CHECK:');
const lines = response.data?.data?.lines;
if (lines) {
  console.log('   ✅ Lines found!');
  console.log('   - Line count:', lines.length);
  if (lines.length > 0) {
    console.log('   - Line 1 fields:', Object.keys(lines[0]).length);
    console.log('   - Line 1 description:', lines[0].description);
    console.log('   - Line 1 amount:', lines[0].line_amount);
  }
} else {
  console.log('   ❌ No lines found');
}

// Cleanup
if (response.transaction_id) {
  console.log('\n\n🧹 CLEANUP:');
  console.log('Deleting test transaction:', response.transaction_id);

  await supabase.from('universal_transaction_lines')
    .delete()
    .eq('transaction_id', response.transaction_id)
    .eq('organization_id', TEST_ORG_ID);

  await supabase.from('universal_transactions')
    .delete()
    .eq('id', response.transaction_id)
    .eq('organization_id', TEST_ORG_ID);

  console.log('✅ Cleanup complete');
}

console.log('\n\n═'.repeat(60));
if (response.success && response.transaction_id && header) {
  console.log('🎉 SUCCESS! CREATE IS WORKING!');
  console.log('═'.repeat(60));
  console.log('✅ Transaction created with ID:', response.transaction_id);
  console.log('✅ Header has', Object.keys(header).length, 'fields (expected 35)');
  console.log('✅ Lines has', lines?.length || 0, 'items (expected 1)');
  console.log('\n🚀 ORCHESTRATOR DEPLOYMENT SUCCESSFUL!');
} else {
  console.log('❌ FAILURE - Something is wrong');
  console.log('═'.repeat(60));
  console.log('Debug info:', JSON.stringify(response, null, 2));
}

console.log('');
