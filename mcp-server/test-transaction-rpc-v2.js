#!/usr/bin/env node

/**
 * Test hera_transactions_crud_v1 with correct signature
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

async function testTransactionRpc() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   Testing hera_transactions_crud_v1 - APPOINTMENT Transactions   ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Test 1: Read with transaction filter object
  console.log('═'.repeat(70));
  console.log('TEST 1: Read APPOINTMENT transactions (with filter object)');
  console.log('═'.repeat(70) + '\n');

  try {
    const start = Date.now();

    const { data, error } = await supabase.rpc('hera_transactions_crud_v1', {
      p_action: 'read',
      p_organization_id: orgId,
      p_actor_user_id: actorUserId,
      p_transaction: {
        transaction_type: 'APPOINTMENT'
      }
    });

    const elapsed = Date.now() - start;

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
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
        console.log(`   Transaction Number: ${apt.transaction_number || apt.transaction_code || 'N/A'}`);
        console.log(`   Type: ${apt.transaction_type}`);
        console.log(`   Status: ${apt.transaction_status}`);
        console.log(`   Customer: ${apt.source_entity_id}`);
        console.log(`   Staff: ${apt.target_entity_id}`);
        console.log(`   Total: $${apt.total_amount}`);
        console.log(`   Date: ${apt.transaction_date}`);
        console.log(`   Has lines: ${apt.lines ? 'Yes (' + apt.lines.length + ')' : 'No'}\n`);
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // Test 2: Read with options (include_lines)
  console.log('═'.repeat(70));
  console.log('TEST 2: Read with include_lines option');
  console.log('═'.repeat(70) + '\n');

  try {
    const start = Date.now();

    const { data, error } = await supabase.rpc('hera_transactions_crud_v1', {
      p_action: 'read',
      p_organization_id: orgId,
      p_actor_user_id: actorUserId,
      p_transaction: {
        transaction_type: 'APPOINTMENT'
      },
      p_options: {
        include_lines: true,
        limit: 10
      }
    });

    const elapsed = Date.now() - start;

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Code:', error.code);
    } else {
      const items = data?.items || data || [];
      const appointments = Array.isArray(items) ? items : [];

      console.log(`✅ Retrieved ${appointments.length} appointments with lines`);
      console.log(`⏱️  Time: ${elapsed}ms\n`);

      if (appointments.length > 0 && appointments[0].lines) {
        console.log(`📋 First appointment has ${appointments[0].lines.length} lines`);
        if (appointments[0].lines.length > 0) {
          const line = appointments[0].lines[0];
          console.log('   First line:');
          console.log(`      Entity ID: ${line.entity_id}`);
          console.log(`      Quantity: ${line.quantity}`);
          console.log(`      Unit Price: $${line.unit_price}`);
          console.log(`      Line Total: $${line.line_total}\n`);
        }
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // Test 3: Compare with direct table query
  console.log('═'.repeat(70));
  console.log('TEST 3: Direct Table Query (Current Pattern)');
  console.log('═'.repeat(70) + '\n');

  try {
    const start = Date.now();

    const { data, error } = await supabase
      .from('core_transaction')
      .select('*')
      .eq('organization_id', orgId)
      .eq('transaction_type', 'APPOINTMENT')
      .order('transaction_date', { ascending: false })
      .limit(10);

    const elapsed = Date.now() - start;

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log(`✅ Retrieved ${data.length} appointments`);
      console.log(`⏱️  Time: ${elapsed}ms\n`);

      if (data.length > 0) {
        const apt = data[0];
        console.log('📦 First Appointment:');
        console.log(`   ID: ${apt.id}`);
        console.log(`   Transaction Number: ${apt.transaction_number || apt.transaction_code || 'N/A'}`);
        console.log(`   Type: ${apt.transaction_type}`);
        console.log(`   Status: ${apt.transaction_status}`);
        console.log(`   Total: $${apt.total_amount}\n`);
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('═'.repeat(70));
  console.log('Test Complete!');
  console.log('═'.repeat(70) + '\n');
}

testTransactionRpc().catch(console.error);
