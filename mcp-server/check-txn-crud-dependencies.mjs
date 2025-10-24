#!/usr/bin/env node
/**
 * Check if all RPC functions called by hera_txn_crud_v1 exist
 * and verify their signatures match the calls
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test org and actor IDs
const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001';
const TEST_ACTOR_ID = '00000000-0000-0000-0000-000000000002';
const TEST_TXN_ID = '00000000-0000-0000-0000-000000000003';

async function checkRPCFunction(funcName, testParams, expectedCall) {
  console.log(`\n📋 Checking: ${funcName}`);
  console.log(`   Expected call: ${expectedCall}`);

  const { data, error } = await supabase.rpc(funcName, testParams);

  if (error) {
    if (error.code === '42883') {
      console.log(`   ❌ FUNCTION NOT FOUND`);
      return { exists: false, error: 'not_found' };
    } else {
      console.log(`   ✅ Function exists`);
      console.log(`   Signature from error: ${error.message}`);

      // Check if signature matches expected call
      const hasOrgId = error.message.includes('p_org_id') || error.message.includes('p_organization_id');
      const hasActorId = error.message.includes('p_actor_user_id');

      console.log(`   Parameters detected:`);
      console.log(`     - organization_id: ${hasOrgId ? '✅' : '❌'}`);
      console.log(`     - actor_user_id: ${hasActorId ? '✅' : '❌'}`);

      return { exists: true, error: error.message, hasOrgId, hasActorId };
    }
  } else {
    console.log(`   ✅ Function exists (returned data)`);
    return { exists: true, data };
  }
}

async function checkAllDependencies() {
  console.log('🔍 Checking all RPC functions called by hera_txn_crud_v1\n');
  console.log('═══════════════════════════════════════════════════════\n');

  const functions = [
    {
      name: 'hera_txn_create_v1',
      call: 'hera_txn_create_v1(v_header, v_lines, p_actor_user_id)',
      expectedParams: ['p_header:jsonb', 'p_lines:jsonb', 'p_actor_user_id:uuid'],
      testParams: {
        p_header: {
          organization_id: TEST_ORG_ID,
          transaction_type: 'test',
          smart_code: 'HERA.TEST.TXN.TEST.v1'
        },
        p_lines: [],
        p_actor_user_id: TEST_ACTOR_ID
      }
    },
    {
      name: 'hera_txn_validate_v1',
      call: 'hera_txn_validate_v1(p_org_id, v_txn_id)',
      expectedParams: ['p_org_id:uuid', 'p_txn_id:uuid'],
      testParams: {
        p_org_id: TEST_ORG_ID,
        p_txn_id: TEST_TXN_ID
      }
    },
    {
      name: 'hera_txn_read_v1',
      call: 'hera_txn_read_v1(p_org_id, v_txn_id, true)',
      expectedParams: ['p_org_id:uuid', 'p_txn_id:uuid', 'p_include_lines:boolean'],
      testParams: {
        p_org_id: TEST_ORG_ID,
        p_txn_id: TEST_TXN_ID,
        p_include_lines: true
      }
    },
    {
      name: 'hera_txn_query_v1',
      call: 'hera_txn_query_v1(p_org_id, v_filters)',
      expectedParams: ['p_org_id:uuid', 'p_filters:jsonb'],
      testParams: {
        p_org_id: TEST_ORG_ID,
        p_filters: {}
      }
    },
    {
      name: 'hera_txn_update_v1',
      call: 'hera_txn_update_v1(p_org_id, v_txn_id, v_patch, p_actor_user_id)',
      expectedParams: ['p_org_id:uuid', 'p_txn_id:uuid', 'p_patch:jsonb', 'p_actor_user_id:uuid'],
      testParams: {
        p_org_id: TEST_ORG_ID,
        p_txn_id: TEST_TXN_ID,
        p_patch: {},
        p_actor_user_id: TEST_ACTOR_ID
      }
    },
    {
      name: 'hera_txn_delete_v1',
      call: 'hera_txn_delete_v1(p_org_id, v_txn_id)',
      expectedParams: ['p_org_id:uuid', 'p_txn_id:uuid'],
      testParams: {
        p_org_id: TEST_ORG_ID,
        p_txn_id: TEST_TXN_ID
      }
    },
    {
      name: 'hera_txn_emit_v1',
      call: 'hera_txn_emit_v1(p_org_id, type, smart_code, code, date, source, target, amount, status, ref, ext_ref, context, metadata, actor)',
      expectedParams: ['13 parameters total'],
      testParams: {
        p_org_id: TEST_ORG_ID,
        p_transaction_type: 'test',
        p_smart_code: 'HERA.TEST.TXN.TEST.v1',
        p_transaction_code: 'TEST-001',
        p_transaction_date: new Date().toISOString(),
        p_source_entity_id: null,
        p_target_entity_id: null,
        p_total_amount: 0,
        p_transaction_status: 'pending',
        p_reference_number: null,
        p_external_reference: null,
        p_business_context: {},
        p_metadata: {},
        p_actor_user_id: TEST_ACTOR_ID
      }
    },
    {
      name: 'hera_txn_reverse_v1',
      call: 'hera_txn_reverse_v1(p_org_id, v_txn_id, v_reversal_date, v_reason, p_actor_user_id)',
      expectedParams: ['p_org_id:uuid', 'p_txn_id:uuid', 'p_reversal_date:timestamptz', 'p_reason:text', 'p_actor_user_id:uuid'],
      testParams: {
        p_org_id: TEST_ORG_ID,
        p_txn_id: TEST_TXN_ID,
        p_reversal_date: new Date().toISOString(),
        p_reason: 'test',
        p_actor_user_id: TEST_ACTOR_ID
      }
    },
    {
      name: 'hera_txn_void_v1',
      call: 'hera_txn_void_v1(p_org_id, v_txn_id, v_reason, p_actor_user_id)',
      expectedParams: ['p_org_id:uuid', 'p_txn_id:uuid', 'p_reason:text', 'p_actor_user_id:uuid'],
      testParams: {
        p_org_id: TEST_ORG_ID,
        p_txn_id: TEST_TXN_ID,
        p_reason: 'test',
        p_actor_user_id: TEST_ACTOR_ID
      }
    }
  ];

  const results = [];

  for (const func of functions) {
    const result = await checkRPCFunction(func.name, func.testParams, func.call);
    results.push({
      name: func.name,
      ...result,
      expectedParams: func.expectedParams
    });

    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
  }

  // Summary
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  const existing = results.filter(r => r.exists);
  const missing = results.filter(r => !r.exists);

  console.log(`✅ Functions found: ${existing.length}/${results.length}`);
  console.log(`❌ Functions missing: ${missing.length}/${results.length}\n`);

  if (missing.length > 0) {
    console.log('⚠️  MISSING FUNCTIONS:');
    missing.forEach(f => {
      console.log(`   - ${f.name}`);
      console.log(`     Expected params: ${f.expectedParams.join(', ')}`);
    });
  }

  console.log('\n📊 PARAMETER NAMING ANALYSIS:\n');

  const orgIdUsage = {
    p_org_id: existing.filter(r => r.error && r.error.includes('p_org_id')).length,
    p_organization_id: existing.filter(r => r.error && r.error.includes('p_organization_id')).length
  };

  console.log(`   p_org_id usage: ${orgIdUsage.p_org_id} functions`);
  console.log(`   p_organization_id usage: ${orgIdUsage.p_organization_id} functions`);

  if (orgIdUsage.p_org_id > 0 && orgIdUsage.p_organization_id > 0) {
    console.log(`\n   ⚠️  INCONSISTENT NAMING: Mix of p_org_id and p_organization_id`);
  } else if (orgIdUsage.p_org_id > 0) {
    console.log(`\n   ✅ All functions use p_org_id (consistent)`);
  } else if (orgIdUsage.p_organization_id > 0) {
    console.log(`\n   ✅ All functions use p_organization_id (consistent)`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('RECOMMENDATION');
  console.log('═══════════════════════════════════════════════════════\n');

  if (missing.length === 0) {
    console.log('✅ All dependent functions exist');
    console.log('✅ hera_txn_crud_v1 can be safely deployed');
  } else {
    console.log('❌ Cannot deploy hera_txn_crud_v1 yet');
    console.log(`❌ Missing ${missing.length} dependent functions`);
    console.log('\nCreate these functions first:');
    missing.forEach(f => console.log(`   - ${f.name}`));
  }

  console.log('\n');
}

checkAllDependencies().catch(err => {
  console.error('❌ Check failed:', err.message);
  process.exit(1);
});
