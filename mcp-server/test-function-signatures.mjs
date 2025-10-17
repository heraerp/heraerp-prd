#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testFunctionSignatures() {
  console.log('🔍 Testing transaction RPC function signatures...\n');
  
  // Test hera_transactions_post_v2
  console.log('Testing hera_transactions_post_v2...');
  try {
    const result = await supabase.rpc('hera_transactions_post_v2', { invalid: 'test' });
    console.log('✅ Function exists');
  } catch (error) {
    console.log('📋 Signature hint:', error.hint);
    console.log('📋 Details:', error.details);
  }
  
  // Test hera_txn_create_v1  
  console.log('\nTesting hera_txn_create_v1...');
  try {
    const result = await supabase.rpc('hera_txn_create_v1', { invalid: 'test' });
    console.log('✅ Function exists');
  } catch (error) {
    console.log('📋 Signature hint:', error.hint);
    console.log('📋 Details:', error.details);
  }
  
  // Test if hera_transactions_crud_v1 exists
  console.log('\nTesting hera_transactions_crud_v1...');
  try {
    const result = await supabase.rpc('hera_transactions_crud_v1', { invalid: 'test' });
    console.log('✅ Function exists');
  } catch (error) {
    console.log('📋 Signature hint:', error.hint);
    console.log('📋 Details:', error.details);
  }
}

testFunctionSignatures();