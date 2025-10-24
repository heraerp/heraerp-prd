#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🔍 Testing Response Structure\n');

const result = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: TEST_ACTOR_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    header: {
      organization_id: TEST_ORG_ID,
      transaction_type: 'SALE',
      transaction_code: 'DEBUG-' + Date.now(),
      smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
      total_amount: 50,
      transaction_status: 'completed'
    },
    lines: [{
      line_number: 1,
      line_type: 'service',
      description: 'Debug Service',
      quantity: 1,
      unit_amount: 50,
      line_amount: 50
    }]
  }
});

console.log('Full result object:');
console.log(JSON.stringify(result, null, 2));

console.log('\n\nExtraction attempts:');
console.log('result.data:', typeof result.data);
console.log('result.data.transaction_id:', result.data?.transaction_id);
console.log('result.data.data:', typeof result.data?.data);
console.log('result.data.data.transaction_id:', result.data?.data?.transaction_id);

// Cleanup
if (result.data?.transaction_id) {
  console.log('\n\nCleaning up test transaction:', result.data.transaction_id);
  await supabase.from('universal_transaction_lines')
    .delete()
    .eq('transaction_id', result.data.transaction_id)
    .eq('organization_id', TEST_ORG_ID);

  await supabase.from('universal_transactions')
    .delete()
    .eq('id', result.data.transaction_id)
    .eq('organization_id', TEST_ORG_ID);

  console.log('✅ Cleanup complete');
}
