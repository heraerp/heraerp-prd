#!/usr/bin/env node
/**
 * Verify the exact signatures of all functions called by hera_txn_crud_v1
 * and check if the calls match the actual function signatures
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getActualSignature(funcName) {
  // Query pg_catalog to get actual function signature
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        p.proname as function_name,
        pg_get_function_arguments(p.oid) as arguments,
        pg_get_function_identity_arguments(p.oid) as identity_args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = '${funcName}'
      LIMIT 1
    `
  });

  if (error || !data) {
    // Alternative: try to call with empty params to get signature from error
    const { error: callError } = await supabase.rpc(funcName, {});
    if (callError && callError.message) {
      // Extract parameter names from error message
      const match = callError.message.match(/\((.*?)\)/);
      if (match) {
        return match[1].split(',').map(p => p.trim());
      }
    }
    return null;
  }

  return data[0]?.arguments || null;
}

async function verifySignatures() {
  console.log('🔍 Verifying actual function signatures vs hera_txn_crud_v1 calls\n');
  console.log('═══════════════════════════════════════════════════════\n');

  const functions = [
    {
      name: 'hera_txn_create_v1',
      calledAs: 'hera_txn_create_v1(v_header, v_lines, p_actor_user_id)',
      calledParams: ['v_header:jsonb', 'v_lines:jsonb', 'p_actor_user_id:uuid']
    },
    {
      name: 'hera_txn_validate_v1',
      calledAs: 'hera_txn_validate_v1(p_org_id, v_txn_id)',
      calledParams: ['p_org_id:uuid', 'v_txn_id:uuid']
    },
    {
      name: 'hera_txn_read_v1',
      calledAs: 'hera_txn_read_v1(p_org_id, v_txn_id, true)',
      calledParams: ['p_org_id:uuid', 'v_txn_id:uuid', 'include_lines:boolean']
    },
    {
      name: 'hera_txn_query_v1',
      calledAs: 'hera_txn_query_v1(p_org_id, v_filters)',
      calledParams: ['p_org_id:uuid', 'v_filters:jsonb']
    },
    {
      name: 'hera_txn_update_v1',
      calledAs: 'hera_txn_update_v1(p_org_id, v_txn_id, v_patch, p_actor_user_id)',
      calledParams: ['p_org_id:uuid', 'v_txn_id:uuid', 'v_patch:jsonb', 'p_actor_user_id:uuid']
    },
    {
      name: 'hera_txn_delete_v1',
      calledAs: 'hera_txn_delete_v1(p_org_id, v_txn_id)',
      calledParams: ['p_org_id:uuid', 'v_txn_id:uuid']
    },
    {
      name: 'hera_txn_reverse_v1',
      calledAs: 'hera_txn_reverse_v1(p_org_id, v_txn_id, v_reversal_date, v_reason, p_actor_user_id)',
      calledParams: ['p_org_id:uuid', 'v_txn_id:uuid', 'v_reversal_date:timestamptz', 'v_reason:text', 'p_actor_user_id:uuid']
    },
    {
      name: 'hera_txn_void_v1',
      calledAs: 'hera_txn_void_v1(p_org_id, v_txn_id, v_reason, p_actor_user_id)',
      calledParams: ['p_org_id:uuid', 'v_txn_id:uuid', 'v_reason:text', 'p_actor_user_id:uuid']
    },
    {
      name: 'hera_txn_emit_v1',
      calledAs: 'hera_txn_emit_v1(p_org_id, type, smart_code, ...13 params total)',
      calledParams: ['p_org_id', 'p_transaction_type', 'p_smart_code', 'p_transaction_code', 'p_transaction_date', 'p_source_entity_id', 'p_target_entity_id', 'p_total_amount', 'p_transaction_status', 'p_reference_number', 'p_external_reference', 'p_business_context', 'p_metadata', 'p_actor_user_id']
    }
  ];

  const issues = [];

  for (const func of functions) {
    console.log(`\n📋 ${func.name}`);
    console.log(`   Called as: ${func.calledAs}`);

    // Get actual signature by attempting to call
    const { error } = await supabase.rpc(func.name, {});

    if (error) {
      if (error.code === '42883') {
        console.log(`   ❌ FUNCTION NOT FOUND`);
        issues.push({
          function: func.name,
          issue: 'Function not found',
          severity: 'CRITICAL'
        });
      } else {
        // Parse the actual signature from error
        const errorMsg = error.message;
        console.log(`   Actual signature error: ${errorMsg}`);

        // Try to extract parameter order from "Could not find function...(...)" message
        const match = errorMsg.match(/\((.*?)\)/);
        if (match) {
          const actualParams = match[1].split(',').map(p => p.trim()).filter(p => p);
          console.log(`   Actual parameters detected: ${actualParams.length > 0 ? actualParams.join(', ') : 'none'}`);

          // Compare with called parameters
          const calledParamNames = func.calledParams.map(p => p.split(':')[0]);
          console.log(`   Called with: ${calledParamNames.join(', ')}`);

          // Check for mismatches
          if (actualParams.length > 0 && actualParams.length !== calledParamNames.length) {
            console.log(`   ⚠️  PARAMETER COUNT MISMATCH: Expected ${actualParams.length}, called with ${calledParamNames.length}`);
            issues.push({
              function: func.name,
              issue: `Parameter count mismatch: expected ${actualParams.length}, called with ${calledParamNames.length}`,
              severity: 'HIGH',
              expected: actualParams,
              called: calledParamNames
            });
          }
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('ISSUES FOUND');
  console.log('═══════════════════════════════════════════════════════\n');

  if (issues.length === 0) {
    console.log('✅ No signature mismatches found');
    console.log('✅ All function calls appear correct\n');
  } else {
    console.log(`⚠️  Found ${issues.length} potential issues:\n`);

    const critical = issues.filter(i => i.severity === 'CRITICAL');
    const high = issues.filter(i => i.severity === 'HIGH');

    if (critical.length > 0) {
      console.log('🔴 CRITICAL ISSUES:');
      critical.forEach(issue => {
        console.log(`   - ${issue.function}: ${issue.issue}`);
      });
      console.log('');
    }

    if (high.length > 0) {
      console.log('🟡 HIGH PRIORITY ISSUES:');
      high.forEach(issue => {
        console.log(`   - ${issue.function}: ${issue.issue}`);
        if (issue.expected && issue.called) {
          console.log(`     Expected: ${issue.expected.join(', ')}`);
          console.log(`     Called with: ${issue.called.join(', ')}`);
        }
      });
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('FINAL RECOMMENDATION');
  console.log('═══════════════════════════════════════════════════════\n');

  const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;

  if (criticalCount > 0) {
    console.log('❌ DO NOT DEPLOY hera_txn_crud_v1');
    console.log(`❌ Fix ${criticalCount} critical issues first\n`);
  } else if (issues.length > 0) {
    console.log('⚠️  REVIEW REQUIRED before deployment');
    console.log(`⚠️  ${issues.length} potential issues detected\n`);
  } else {
    console.log('✅ hera_txn_crud_v1 is calling all functions correctly');
    console.log('✅ Safe to deploy (after fixing naming conventions)\n');
  }

  console.log('Note: Still need to fix:');
  console.log('  1. Rename p_org_id → p_organization_id (consistency)');
  console.log('  2. Change response format: ok → success');
  console.log('  3. Make p_actor_user_id required (remove DEFAULT NULL)\n');
}

verifySignatures().catch(err => {
  console.error('❌ Verification failed:', err.message);
  process.exit(1);
});
