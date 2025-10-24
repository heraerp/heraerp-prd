#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';
const EXISTING_TXN_ID = '9137c153-c7fa-4bc4-83fe-67aeb18bcdaa'; // From QUERY result

console.log('🧪 Testing READ on existing transaction\n');

const result = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: TEST_ACTOR_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    transaction_id: EXISTING_TXN_ID
  }
});

console.log('Result:', JSON.stringify(result, null, 2));

if (result.data) {
  console.log('\n\nExtracted data:');
  console.log('- Transaction ID:', result.data.transaction_id);
  console.log('- Has header:', !!result.data.data?.data?.header);
  console.log('- Has lines:', !!result.data.data?.data?.lines);

  if (result.data.data?.data?.header) {
    const header = result.data.data.data.header;
    console.log('- Header fields:', Object.keys(header).length);
    console.log('- Transaction type:', header.transaction_type);
    console.log('- Total amount:', header.total_amount);
    console.log('- Status:', header.transaction_status);
  }
}
