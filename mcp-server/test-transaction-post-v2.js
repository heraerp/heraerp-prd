#!/usr/bin/env node

/**
 * Test hera_transactions_post_v2 RPC
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

async function testTransactionPostV2() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   Testing hera_transactions_post_v2 - APPOINTMENT Transactions   ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Test 1: Discover function signature
  console.log('═'.repeat(70));
  console.log('TEST 1: Discover Function Signature');
  console.log('═'.repeat(70) + '\n');

  try {
    const { data, error } = await supabase.rpc('hera_transactions_post_v2', {});

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

  console.log('\n');

  // Test 2: Try with organization_id and action
  console.log('═'.repeat(70));
  console.log('TEST 2: With organization_id and p_action');
  console.log('═'.repeat(70) + '\n');

  try {
    const { data, error } = await supabase.rpc('hera_transactions_post_v2', {
      p_organization_id: orgId,
      p_action: 'read'
    });

    if (error) {
      console.log('Error:', error.message);
      console.log('Code:', error.code);
    } else {
      console.log('Success!', typeof data, Array.isArray(data) ? data.length : 'result');
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }

  console.log('\n');

  // Test 3: Full parameters guess
  console.log('═'.repeat(70));
  console.log('TEST 3: Full Parameters (guessing from entities pattern)');
  console.log('═'.repeat(70) + '\n');

  try {
    const start = Date.now();

    const { data, error } = await supabase.rpc('hera_transactions_post_v2', {
      p_action: 'read',
      p_actor_user_id: actorUserId,
      p_organization_id: orgId,
      p_transaction: {
        transaction_type: 'APPOINTMENT'
      },
      p_options: {
        limit: 10,
        include_lines: true
      },
      p_lines: null
    });

    const elapsed = Date.now() - start;

    if (error) {
      console.log('Error:', error.message);
      console.log('Code:', error.code);
    } else {
      const items = data?.items || data || [];
      const appointments = Array.isArray(items) ? items : [];

      console.log(`✅ Retrieved ${appointments.length} appointments`);
      console.log(`⏱️  Time: ${elapsed}ms`);
      console.log(`📏 Response size: ${JSON.stringify(data).length} bytes\n`);

      if (appointments.length > 0) {
        const apt = appointments[0];
        console.log('📦 First Appointment:');
        console.log(`   ID: ${apt.id}`);
        console.log(`   Type: ${apt.transaction_type}`);
        console.log(`   Status: ${apt.transaction_status}`);
        console.log(`   Customer: ${apt.source_entity_id}`);
        console.log(`   Staff: ${apt.target_entity_id}`);
        console.log(`   Total: $${apt.total_amount}`);
        console.log(`   Date: ${apt.transaction_date}`);
        console.log(`   Has lines: ${apt.lines ? 'Yes (' + apt.lines.length + ')' : 'No'}`);
        console.log(`   Keys: ${Object.keys(apt).join(', ')}\n`);

        console.log('Full appointment:\n');
        console.log(JSON.stringify(apt, null, 2));
      }
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }

  console.log('\n');
  console.log('═'.repeat(70));
  console.log('Test Complete!');
  console.log('═'.repeat(70) + '\n');
}

testTransactionPostV2().catch(console.error);
