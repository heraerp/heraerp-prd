#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Checking hera_txn_create_v1 signature...\n');

// Try calling with minimal params to see error message
const result = await supabase.rpc('hera_txn_create_v1', {
  p_header: {
    organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    transaction_type: 'test'
  },
  p_lines: [],
  p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674'
});

console.log('Result:', JSON.stringify(result, null, 2));

// Also test hera_txn_crud_v1
console.log('\n\n🔍 Testing hera_txn_crud_v1...\n');
const crudResult = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
  p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_payload: {
    filters: { limit: 1 }
  }
});

console.log('CRUD Result:', JSON.stringify(crudResult, null, 2));
