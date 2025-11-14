#!/usr/bin/env node
/**
 * HERA v2.3 Hard Gate Test Script
 * Tests that direct RPC access is blocked while API v2 Gateway works
 */

import { createClient } from '@supabase/supabase-js';

// Configuration - update these for your environment
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qqagokigwuujyeyrgdkq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTM1MjYsImV4cCI6MjA3NTM4OTUyNn0.H_u1YByJg63dGkhIQsvr3oeUSe4UOOcv_g341h3BJOY';

console.log('🛡️  HERA v2.3 Hard Gate Test Suite');
console.log('=====================================');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testHardGate() {
  const results = {
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      total: 0
    }
  };

  // Test 1: Gateway test endpoint should work
  console.log('\n📋 Test 1: Gateway test endpoint accessibility...');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/api-v2/gateway/test`);
    const data = await response.json();
    
    if (response.ok && data.gateway_status === 'operational') {
      console.log('✅ PASS: Gateway test endpoint is accessible');
      console.log(`   Version: ${data.version}, Hard Gate: ${data.hard_gate}`);
      results.tests.push({ test: 'gateway_endpoint', status: 'PASS', details: data });
      results.summary.passed++;
    } else {
      console.log('❌ FAIL: Gateway test endpoint not working properly');
      console.log('   Response:', data);
      results.tests.push({ test: 'gateway_endpoint', status: 'FAIL', details: data });
      results.summary.failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Gateway test endpoint error:', error.message);
    results.tests.push({ test: 'gateway_endpoint', status: 'FAIL', error: error.message });
    results.summary.failed++;
  }

  // Test 2: Direct RPC call should be blocked
  console.log('\n🚫 Test 2: Direct RPC call blocking...');
  try {
    const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: '00000000-0000-0000-0000-000000000001', // Test UUID
      p_organization_id: '00000000-0000-0000-0000-000000000002', // Test UUID
      p_entity: {},
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    });

    if (error && error.message.includes('API v2 Gateway')) {
      console.log('✅ PASS: Direct RPC call properly blocked');
      console.log(`   Error message: ${error.message}`);
      results.tests.push({ test: 'direct_rpc_blocked', status: 'PASS', error: error.message });
      results.summary.passed++;
    } else if (error) {
      console.log('⚠️  PARTIAL: Direct RPC failed but not with gateway error');
      console.log(`   Error: ${error.message}`);
      results.tests.push({ test: 'direct_rpc_blocked', status: 'PARTIAL', error: error.message });
      results.summary.failed++;
    } else {
      console.log('❌ FAIL: Direct RPC call was NOT blocked (Hard Gate not working!)');
      console.log('   Data returned:', data);
      results.tests.push({ test: 'direct_rpc_blocked', status: 'FAIL', data: data });
      results.summary.failed++;
    }
  } catch (error) {
    if (error.message.includes('API v2 Gateway') || error.message.includes('Forbidden')) {
      console.log('✅ PASS: Direct RPC call properly blocked by network/auth layer');
      console.log(`   Error: ${error.message}`);
      results.tests.push({ test: 'direct_rpc_blocked', status: 'PASS', error: error.message });
      results.summary.passed++;
    } else {
      console.log('❌ FAIL: Unexpected error blocking direct RPC');
      console.log(`   Error: ${error.message}`);
      results.tests.push({ test: 'direct_rpc_blocked', status: 'FAIL', error: error.message });
      results.summary.failed++;
    }
  }

  // Test 3: Test the gateway enforcement function directly
  console.log('\n🧪 Test 3: Gateway enforcement function test...');
  try {
    const { data, error } = await supabase.rpc('test_gateway_enforcement');
    
    if (error) {
      console.log('❌ FAIL: Could not call test function');
      console.log(`   Error: ${error.message}`);
      results.tests.push({ test: 'enforcement_function', status: 'FAIL', error: error.message });
      results.summary.failed++;
    } else if (data && data.test_1_direct_call_blocked === true) {
      console.log('✅ PASS: Gateway enforcement function working correctly');
      console.log(`   Test results: ${JSON.stringify(data)}`);
      results.tests.push({ test: 'enforcement_function', status: 'PASS', data: data });
      results.summary.passed++;
    } else {
      console.log('❌ FAIL: Gateway enforcement function not blocking correctly');
      console.log(`   Test results: ${JSON.stringify(data)}`);
      results.tests.push({ test: 'enforcement_function', status: 'FAIL', data: data });
      results.summary.failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Gateway enforcement test error:', error.message);
    results.tests.push({ test: 'enforcement_function', status: 'FAIL', error: error.message });
    results.summary.failed++;
  }

  results.summary.total = results.summary.passed + results.summary.failed;

  // Print summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  
  if (results.summary.failed === 0) {
    console.log('\n🎉 All tests passed! Hard Gate is working correctly.');
    console.log('   ✅ Gateway endpoint accessible');
    console.log('   ✅ Direct RPC calls blocked');
    console.log('   ✅ Enforcement function operational');
  } else {
    console.log('\n⚠️  Some tests failed. Check the implementation:');
    results.tests.forEach(test => {
      if (test.status === 'FAIL') {
        console.log(`   ❌ ${test.test}: ${test.error || 'Check details above'}`);
      }
    });
  }

  // Output JSON for automated testing
  if (process.env.JSON_OUTPUT) {
    console.log('\n' + JSON.stringify(results, null, 2));
  }

  return results.summary.failed === 0;
}

// Run tests
testHardGate()
  .then(success => {
    console.log('\n🏁 Test execution completed.');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });