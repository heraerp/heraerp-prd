#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🧪 Direct Call to hera_txn_create_v1\n');

const result = await supabase.rpc('hera_txn_create_v1', {
  p_header: {
    organization_id: TEST_ORG_ID,
    transaction_type: 'SALE',
    transaction_code: 'DIRECT-' + Date.now(),
    smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
    total_amount: 75,
    transaction_status: 'completed'
  },
  p_lines: [{
    line_number: 1,
    line_type: 'service',
    description: 'Direct Test',
    quantity: 1,
    unit_amount: 75,
    line_amount: 75
  }],
  p_actor_user_id: TEST_ACTOR_ID
});

console.log('Result:', JSON.stringify(result, null, 2));

if (result.error) {
  console.log('\n❌ DIRECT CALL FAILED');
  console.log('Error:', result.error.message);
  console.log('\nThis confirms hera_txn_create_v1 was NOT updated');
} else if (result.data?.success) {
  console.log('\n✅ DIRECT CALL SUCCEEDED');
  console.log('Transaction ID:', result.data.transaction_id);
  console.log('\nCleaning up...');

  await supabase.from('universal_transaction_lines')
    .delete()
    .eq('transaction_id', result.data.transaction_id)
    .eq('organization_id', TEST_ORG_ID);

  await supabase.from('universal_transactions')
    .delete()
    .eq('id', result.data.transaction_id)
    .eq('organization_id', TEST_ORG_ID);

  console.log('✅ Cleanup done');
}
