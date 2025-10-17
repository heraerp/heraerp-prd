#!/usr/bin/env node
/**
 * Test script to check transaction RPC functions in Supabase
 * Tests for hera_txn_create_v1 and other transaction functions
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function listAllFunctions() {
  console.log('\n🔍 Checking available HERA transaction functions...\n');

  try {
    // Query PostgreSQL system catalog for all functions matching 'hera_txn%'
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT
            p.proname as function_name,
            pg_get_function_arguments(p.oid) as arguments,
            pg_get_function_result(p.oid) as return_type,
            d.description
          FROM pg_proc p
          LEFT JOIN pg_description d ON p.oid = d.objoid
          LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public'
            AND p.proname LIKE 'hera_txn%'
          ORDER BY p.proname;
        `
      });

    if (error) {
      console.log('❌ Cannot query system catalog (this is normal with RLS)');
      console.log('   Will test functions directly instead...\n');
      return false;
    }

    if (data && data.length > 0) {
      console.log('✅ Found HERA transaction functions:\n');
      data.forEach(fn => {
        console.log(`  📋 ${fn.function_name}`);
        console.log(`     Args: ${fn.arguments}`);
        console.log(`     Returns: ${fn.return_type}\n`);
      });
      return true;
    } else {
      console.log('⚠️  No hera_txn_* functions found\n');
      return false;
    }
  } catch (err) {
    console.log('⚠️  Could not query functions:', err.message);
    return false;
  }
}

async function testTxnCreateV1() {
  console.log('\n🧪 Testing hera_txn_create_v1...\n');

  const testParams = {
    p_organization_id: organizationId,
    p_transaction_type: 'test_transaction',
    p_smart_code: 'HERA.TEST.TXN.CREATE.TEST.V1',
    p_transaction_code: 'TEST-TXN-' + Date.now(),
    p_transaction_date: new Date().toISOString(),
    p_source_entity_id: null,
    p_target_entity_id: null,
    p_total_amount: 100.00,
    p_transaction_status: 'draft',
    p_reference_number: null,
    p_external_reference: null,
    p_business_context: {},
    p_metadata: {},
    p_approval_required: false,
    p_approved_by: null,
    p_approved_at: null,
    p_transaction_currency_code: 'AED',
    p_base_currency_code: 'AED',
    p_exchange_rate: 1.0,
    p_exchange_rate_date: null,
    p_exchange_rate_type: null,
    p_fiscal_period_entity_id: null,
    p_fiscal_year: new Date().getFullYear(),
    p_fiscal_period: new Date().getMonth() + 1,
    p_posting_period_code: null,
    p_lines: [],
    p_actor_user_id: null
  };

  try {
    const { data, error } = await supabase.rpc('hera_txn_create_v1', testParams);

    if (error) {
      console.log('❌ Function call failed:');
      console.log('   Code:', error.code);
      console.log('   Message:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
      return false;
    }

    console.log('✅ hera_txn_create_v1 exists and works!');
    console.log('   Transaction ID:', data);
    return true;
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
    return false;
  }
}

async function testTxnReadV1() {
  console.log('\n🧪 Testing hera_txn_read_v1...\n');

  // First create a test transaction to read
  const { data: txns, error: queryError } = await supabase
    .from('universal_transactions')
    .select('id')
    .eq('organization_id', organizationId)
    .limit(1);

  if (queryError || !txns || txns.length === 0) {
    console.log('⚠️  No transactions found to test read function');
    return false;
  }

  const testTxnId = txns[0].id;

  try {
    const { data, error } = await supabase.rpc('hera_txn_read_v1', {
      p_org_id: organizationId,
      p_transaction_id: testTxnId,
      p_include_lines: true
    });

    if (error) {
      console.log('❌ hera_txn_read_v1 failed:', error.message);
      return false;
    }

    console.log('✅ hera_txn_read_v1 exists and works!');
    console.log('   Data:', JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
    return false;
  }
}

async function testTxnQueryV1() {
  console.log('\n🧪 Testing hera_txn_query_v1...\n');

  try {
    const { data, error } = await supabase.rpc('hera_txn_query_v1', {
      p_org_id: organizationId,
      p_filters: {
        limit: 5
      }
    });

    if (error) {
      console.log('❌ hera_txn_query_v1 failed:', error.message);
      return false;
    }

    console.log('✅ hera_txn_query_v1 exists and works!');
    console.log('   Total transactions:', data.total);
    console.log('   Returned:', data.data?.length || 0);
    return true;
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
    return false;
  }
}

async function checkTransactionTable() {
  console.log('\n📊 Checking universal_transactions table...\n');

  try {
    const { count, error } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (error) {
      console.log('❌ Cannot access universal_transactions:', error.message);
      return false;
    }

    console.log(`✅ universal_transactions table accessible`);
    console.log(`   Total transactions: ${count || 0}\n`);
    return true;
  } catch (err) {
    console.log('❌ Error:', err.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 HERA Transaction Functions Test Suite');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Organization ID: ${organizationId}\n`);

  const results = {
    tableAccess: false,
    functionsList: false,
    txnCreateV1: false,
    txnReadV1: false,
    txnQueryV1: false
  };

  // Test 1: Check table access
  results.tableAccess = await checkTransactionTable();

  // Test 2: List all functions (if possible)
  results.functionsList = await listAllFunctions();

  // Test 3: Test hera_txn_create_v1
  results.txnCreateV1 = await testTxnCreateV1();

  // Test 4: Test hera_txn_read_v1
  results.txnReadV1 = await testTxnReadV1();

  // Test 5: Test hera_txn_query_v1
  results.txnQueryV1 = await testTxnQueryV1();

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`  Table Access:        ${results.tableAccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Functions List:      ${results.functionsList ? '✅ PASS' : '⚠️  SKIP'}`);
  console.log(`  hera_txn_create_v1:  ${results.txnCreateV1 ? '✅ PASS' : '❌ FAIL - FUNCTION MISSING!'}`);
  console.log(`  hera_txn_read_v1:    ${results.txnReadV1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  hera_txn_query_v1:   ${results.txnQueryV1 ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n═══════════════════════════════════════════════════════\n');

  if (!results.txnCreateV1) {
    console.log('🚨 CRITICAL: hera_txn_create_v1 function is MISSING!');
    console.log('   This function needs to be created in the database.');
    console.log('   The API endpoint /api/v2/universal/txn-emit expects it.\n');
  }

  process.exit(results.txnCreateV1 ? 0 : 1);
}

main();
