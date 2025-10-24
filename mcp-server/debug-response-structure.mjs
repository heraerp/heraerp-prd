#!/usr/bin/env node
/**
 * Debug script to inspect the actual response structure
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🔍 DEBUG: Response Structure Analysis\n');

const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: TEST_ACTOR_ID,
  p_organization_id: TEST_ORG_ID,
  p_payload: {
    header: {
      organization_id: TEST_ORG_ID,
      transaction_type: 'SALE',
      transaction_code: 'DEBUG-' + Date.now(),
      smart_code: 'HERA.SALON.POS.SALE.TXN.RETAIL.v1',
      total_amount: 100
    },
    lines: [
      {
        line_number: 1,
        line_type: 'service',
        description: 'Test Service',
        quantity: 1,
        unit_amount: 100,
        line_amount: 100
      }
    ]
  }
});

console.log('📦 FULL RESPONSE STRUCTURE:');
console.log('=' .repeat(60));
console.log(JSON.stringify({ data, error }, null, 2));
console.log('');

if (error) {
  console.log('❌ RPC Error:', error.message);
  process.exit(1);
}

if (data) {
  console.log('📊 RESPONSE ANALYSIS:');
  console.log('-'.repeat(60));
  console.log('Top-level keys:', Object.keys(data));
  console.log('');

  console.log('data.success:', data.success);
  console.log('data.action:', data.action);
  console.log('data.transaction_id:', data.transaction_id);
  console.log('');

  if (data.error) {
    console.log('❌ Function Error:', data.error);
    console.log('   Error detail:', data.error_detail);
    console.log('   Error hint:', data.error_hint);
    console.log('   Error context:', data.error_context);
  }

  if (data.data) {
    console.log('data.data exists:', typeof data.data);
    console.log('data.data keys:', Object.keys(data.data));
    console.log('');

    if (data.data.data) {
      console.log('data.data.data exists:', typeof data.data.data);
      console.log('data.data.data keys:', Object.keys(data.data.data));
      console.log('');

      if (data.data.data.header) {
        console.log('HEADER:', data.data.data.header);
      }

      if (data.data.data.lines) {
        console.log('LINES:', data.data.data.lines);
      }
    }
  }
}
