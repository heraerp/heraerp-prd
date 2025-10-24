#!/usr/bin/env node

/**
 * Discover hera_transactions_crud_v1 RPC signature
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const actorUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674';

async function discoverTransactionRpc() {
  console.log('Discovering hera_transactions_crud_v1 RPC signature...\n');

  // Test 1: Minimal call
  console.log('Test 1: Minimal parameters');
  try {
    const { data, error } = await supabase.rpc('hera_transactions_crud_v1', {});
    if (error) {
      console.log('Error:', error.message);
      console.log('Code:', error.code);
      console.log('Details:', error.details);
      console.log('Hint:', error.hint);
    } else {
      console.log('Success:', data);
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }

  console.log('\n---\n');

  // Test 2: With action only
  console.log('Test 2: With p_action only');
  try {
    const { data, error } = await supabase.rpc('hera_transactions_crud_v1', {
      p_action: 'read'
    });
    if (error) {
      console.log('Error:', error.message);
      console.log('Code:', error.code);
    } else {
      console.log('Success:', data);
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }

  console.log('\n---\n');

  // Test 3: With core params
  console.log('Test 3: With core parameters');
  try {
    const { data, error } = await supabase.rpc('hera_transactions_crud_v1', {
      p_action: 'read',
      p_organization_id: orgId,
      p_actor_user_id: actorUserId
    });
    if (error) {
      console.log('Error:', error.message);
      console.log('Code:', error.code);
    } else {
      console.log('Success! Found', Array.isArray(data) ? data.length : 'result');
      if (Array.isArray(data) && data.length > 0) {
        console.log('First item keys:', Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }

  console.log('\n---\n');

  // Test 4: Check if transactions table exists
  console.log('Test 4: Check actual transactions table');
  try {
    const { data, error, count } = await supabase
      .from('core_transaction')
      .select('*', { count: 'exact', head: true })
      .limit(0);

    if (error) {
      console.log('core_transaction error:', error.message);

      // Try without 's'
      const { data: data2, error: error2 } = await supabase
        .from('transaction')
        .select('*', { count: 'exact', head: true })
        .limit(0);

      if (error2) {
        console.log('transaction error:', error2.message);
      } else {
        console.log('✅ Found table: transaction');
      }
    } else {
      console.log('✅ Found table: core_transaction');
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

discoverTransactionRpc().catch(console.error);
