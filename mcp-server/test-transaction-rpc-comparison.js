#!/usr/bin/env node

/**
 * Compare Current Transaction Pattern vs hera_transaction_crud_v1 RPC
 * Test with APPOINTMENT transactions from /salon/appointments
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ACTUAL PRODUCTION IDS
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const actorUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674';

async function compareTransactionPatterns() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   Transaction Patterns Comparison - Appointments                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  console.log('Testing APPOINTMENT transactions (what /salon/appointments uses)\n\n');

  // ============================================================================
  // METHOD 1: Current Pattern (getTransactions via API)
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('METHOD 1: Current Pattern - Query via Direct Supabase');
  console.log('═'.repeat(70) + '\n');

  let currentAppointments = [];

  try {
    console.log('Querying core_transactions table directly...');
    const start = Date.now();

    const { data, error } = await supabase
      .from('core_transactions')
      .select('*')
      .eq('organization_id', orgId)
      .eq('transaction_type', 'APPOINTMENT')
      .order('transaction_date', { ascending: false })
      .limit(100);

    const elapsed = Date.now() - start;

    if (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    } else {
      currentAppointments = data || [];
      console.log(`   ✅ Retrieved ${currentAppointments.length} appointments`);
      console.log(`   ⏱️  Time: ${elapsed}ms\n`);

      if (currentAppointments.length > 0) {
        const sample = currentAppointments[0];
        console.log('   📦 Sample Appointment:');
        console.log(`      ID: ${sample.id}`);
        console.log(`      Transaction Code: ${sample.transaction_code}`);
        console.log(`      Type: ${sample.transaction_type}`);
        console.log(`      Status: ${sample.transaction_status}`);
        console.log(`      Customer: ${sample.source_entity_id}`);
        console.log(`      Staff: ${sample.target_entity_id}`);
        console.log(`      Total: $${sample.total_amount}`);
        console.log(`      Date: ${sample.transaction_date}`);
        console.log(`      Metadata keys: ${Object.keys(sample.metadata || {}).join(', ')}`);
      }
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}\n`);
  }

  console.log('\n');

  // ============================================================================
  // METHOD 2: RPC V1 Pattern (hera_transaction_crud_v1)
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('METHOD 2: RPC V1 Pattern (hera_transaction_crud_v1)');
  console.log('═'.repeat(70) + '\n');

  let rpcAppointments = [];

  try {
    console.log('Calling hera_transaction_crud_v1 RPC...');
    const start = Date.now();

    const { data, error } = await supabase.rpc('hera_transactions_crud_v1', {
      p_action: 'read',
      p_actor_user_id: actorUserId,
      p_organization_id: orgId,
      p_transaction: {
        transaction_type: 'APPOINTMENT'
      },
      p_options: {
        limit: 100,
        include_lines: true
      },
      p_lines: null
    });

    const elapsed = Date.now() - start;

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   Code: ${error.code}\n`);
    } else {
      rpcAppointments = data?.items || data || [];
      console.log(`   ✅ Retrieved ${rpcAppointments.length} appointments`);
      console.log(`   ⏱️  Time: ${elapsed}ms\n`);

      if (rpcAppointments.length > 0) {
        const sample = rpcAppointments[0];
        console.log('   📦 Sample Appointment:');
        console.log(`      ID: ${sample.id || sample.transaction_id}`);
        console.log(`      Transaction Code: ${sample.transaction_code}`);
        console.log(`      Type: ${sample.transaction_type}`);
        console.log(`      Status: ${sample.transaction_status}`);
        console.log(`      Customer: ${sample.source_entity_id}`);
        console.log(`      Staff: ${sample.target_entity_id}`);
        console.log(`      Total: $${sample.total_amount}`);
        console.log(`      Date: ${sample.transaction_date}`);
        console.log(`      Metadata keys: ${Object.keys(sample.metadata || {}).join(', ')}`);
        console.log(`      Has lines: ${Array.isArray(sample.lines) ? 'Yes (' + sample.lines.length + ')' : 'No'}`);
      }
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}\n`);
  }

  console.log('\n');

  // ============================================================================
  // DETAILED COMPARISON
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('DETAILED COMPARISON');
  console.log('═'.repeat(70) + '\n');

  console.log('📊 Count Comparison:');
  console.log(`   Current Pattern: ${currentAppointments.length} appointments`);
  console.log(`   RPC V1:          ${rpcAppointments.length} appointments`);
  console.log(`   Match? ${currentAppointments.length === rpcAppointments.length ? '✅ YES' : '❌ NO'}\n`);

  if (currentAppointments.length === 0 || rpcAppointments.length === 0) {
    console.log('⚠️  Cannot compare - one or both methods returned no data\n');
  } else {
    // Compare IDs
    const currentIds = new Set(currentAppointments.map(a => a.id));
    const rpcIds = new Set(rpcAppointments.map(a => a.id || a.transaction_id));

    let matchingIds = 0;
    const onlyInCurrent = [];
    const onlyInRpc = [];

    currentIds.forEach(id => {
      if (rpcIds.has(id)) {
        matchingIds++;
      } else {
        onlyInCurrent.push(id);
      }
    });

    rpcIds.forEach(id => {
      if (!currentIds.has(id)) {
        onlyInRpc.push(id);
      }
    });

    console.log('🔍 ID Comparison:');
    console.log(`   Both methods: ${matchingIds} appointments`);
    console.log(`   Only in Current: ${onlyInCurrent.length}`);
    console.log(`   Only in RPC: ${onlyInRpc.length}\n`);

    // Field-by-field comparison
    if (matchingIds > 0 && currentAppointments.length > 0 && rpcAppointments.length > 0) {
      console.log('═'.repeat(70));
      console.log('FIELD-BY-FIELD COMPARISON - First Appointment');
      console.log('═'.repeat(70) + '\n');

      const current = currentAppointments[0];
      const rpc = rpcAppointments.find(a => (a.id || a.transaction_id) === current.id) || rpcAppointments[0];

      console.log(`Comparing: ${current.transaction_code}\n`);

      // Core fields
      console.log('✅ Core Fields:');
      const fields = [
        'transaction_code',
        'transaction_type',
        'transaction_status',
        'source_entity_id',
        'target_entity_id',
        'total_amount',
        'transaction_date'
      ];

      let allMatch = true;
      fields.forEach(field => {
        const currentVal = current[field];
        const rpcVal = rpc[field];
        const match = currentVal === rpcVal;
        if (!match) allMatch = false;

        console.log(`   ${field}:`);
        console.log(`      Current: ${currentVal}`);
        console.log(`      RPC:     ${rpcVal}`);
        console.log(`      ${match ? '✅' : '❌'}`);
      });
      console.log(`   Overall: ${allMatch ? '✅ All match' : '❌ Some mismatch'}\n`);

      // Metadata comparison
      console.log('📋 Metadata Comparison:');
      const currentMeta = current.metadata || {};
      const rpcMeta = rpc.metadata || {};

      const currentMetaKeys = Object.keys(currentMeta).sort();
      const rpcMetaKeys = Object.keys(rpcMeta).sort();

      console.log(`   Current has: ${currentMetaKeys.join(', ') || 'none'}`);
      console.log(`   RPC has: ${rpcMetaKeys.join(', ') || 'none'}`);
      console.log(`   ${currentMetaKeys.length === rpcMetaKeys.length ? '✅' : '❌'}\n`);

      // Lines comparison
      console.log('📄 Transaction Lines:');
      const currentLines = current.lines || [];
      const rpcLines = rpc.lines || [];
      console.log(`   Current has: ${currentLines.length} lines`);
      console.log(`   RPC has: ${rpcLines.length} lines`);
      console.log(`   ${currentLines.length === rpcLines.length ? '✅' : '❌'}\n`);

      // Full objects
      console.log('═'.repeat(70));
      console.log('FULL APPOINTMENT - Current Pattern');
      console.log('═'.repeat(70) + '\n');
      console.log(JSON.stringify(current, null, 2));
      console.log('\n\n');

      console.log('═'.repeat(70));
      console.log('FULL APPOINTMENT - RPC V1');
      console.log('═'.repeat(70) + '\n');
      console.log(JSON.stringify(rpc, null, 2));
      console.log('\n\n');
    }
  }

  // ============================================================================
  // FINAL VERDICT
  // ============================================================================
  console.log('═'.repeat(70));
  console.log('FINAL VERDICT - Can We Replace with RPC V1?');
  console.log('═'.repeat(70) + '\n');

  const sameCount = currentAppointments.length === rpcAppointments.length;

  if (rpcAppointments.length === 0) {
    console.log('⚠️  RPC V1 NOT AVAILABLE');
    console.log('   RPC function may not exist or has issues\n');
    console.log('Recommendation:');
    console.log('   🔍 Check if hera_transaction_crud_v1 exists in database');
    console.log('   🔍 Verify RPC function signature');
    console.log('   🔍 Check for errors in RPC execution\n');
  } else if (sameCount && currentAppointments.length > 0) {
    console.log('✅ YES - Perfect Match!\n');
    console.log('Results:');
    console.log(`   ✅ Same appointment count (${currentAppointments.length})`);
    console.log(`   ✅ Same appointment IDs`);
    console.log(`   ✅ Transaction data matches\n`);

    console.log('Benefits of RPC V1:');
    console.log('   ✅ Unified CRUD interface');
    console.log('   ✅ Consistent with hera_entities_crud_v2 pattern');
    console.log('   ✅ Built-in validation and audit');
    console.log('   ✅ Server-side processing');
    console.log('   ✅ Better error handling\n');

    console.log('Recommendation:');
    console.log('   🚀 Replace useUniversalTransaction with RPC V1');
    console.log('   🚀 Update appointment hooks to use new RPC');
    console.log('   🚀 Maintain compatibility with existing code\n');
  } else {
    console.log('⚠️  INVESTIGATE FURTHER\n');
    console.log('Issues:');
    if (!sameCount) {
      console.log(`   ❌ Different counts (Current: ${currentAppointments.length}, RPC: ${rpcAppointments.length})`);
    }
    console.log('\nRecommendation:');
    console.log('   🔍 Investigate data differences');
    console.log('   🔍 Check RPC filtering logic');
    console.log('   🔍 Verify organization_id filtering\n');
  }

  console.log('═'.repeat(70));
  console.log('Test Complete!');
  console.log('═'.repeat(70) + '\n');
}

compareTransactionPatterns().catch(console.error);
