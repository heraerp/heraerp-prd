#!/usr/bin/env node
/**
 * Finance DNA v2 Comprehensive Testing Suite
 * Validate all Finance DNA v2 functions are working correctly
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually
const envPath = join(__dirname, '../.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

console.log('🧪 Finance DNA v2 Comprehensive Testing Suite');
console.log(`📍 Organization: ${organizationId}`);
console.log('');

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`🧪 Testing: ${testName}`);
  
  try {
    const result = await testFunction();
    if (result.success) {
      testResults.passed++;
      console.log(`   ✅ PASS: ${result.message || 'Test passed'}`);
      if (result.data) {
        console.log(`   📊 Data: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
      }
    } else {
      testResults.failed++;
      console.log(`   ❌ FAIL: ${result.error || 'Test failed'}`);
    }
    testResults.details.push({ test: testName, ...result });
  } catch (error) {
    testResults.failed++;
    console.log(`   ❌ ERROR: ${error.message}`);
    testResults.details.push({ test: testName, success: false, error: error.message });
  }
  console.log('');
}

// Core Setup Functions Tests
async function testOrganizationValidation() {
  const { data, error } = await supabase.rpc('hera_validate_organization_access', {
    p_organization_id: organizationId
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { 
    success: data === true, 
    message: `Organization validation returned: ${data}`,
    data: data 
  };
}

async function testSmartCodeValidation() {
  const testCodes = [
    { code: 'HERA.ACCOUNTING.JOURNAL.ENTRY.v2', shouldPass: true },
    { code: 'HERA.ACCOUNTING.TRIAL.BALANCE.v2', shouldPass: true },
    { code: 'INVALID.CODE', shouldPass: false },
    { code: '', shouldPass: false }
  ];
  
  let allPassed = true;
  let results = [];
  
  for (const test of testCodes) {
    const { data, error } = await supabase.rpc('validate_finance_dna_smart_code', {
      p_smart_code: test.code
    });
    
    if (error) {
      allPassed = false;
      results.push({ code: test.code, error: error.message });
    } else {
      const passed = data === test.shouldPass;
      if (!passed) allPassed = false;
      results.push({ code: test.code, expected: test.shouldPass, actual: data, passed });
    }
  }
  
  return {
    success: allPassed,
    message: `Smart code validation: ${results.filter(r => r.passed !== false).length}/${testCodes.length} tests passed`,
    data: results
  };
}

async function testAuditLogging() {
  const { data, error } = await supabase.rpc('hera_audit_operation_v2', {
    p_organization_id: organizationId,
    p_operation_type: 'FINANCE_DNA_TEST',
    p_operation_details: {
      test_name: 'Finance DNA v2 Testing',
      test_timestamp: new Date().toISOString(),
      test_description: 'Validating audit logging functionality'
    }
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return {
    success: !!data,
    message: `Audit operation logged with ID: ${data}`,
    data: { audit_id: data }
  };
}

// Reporting Functions Tests
async function testTrialBalanceGeneration() {
  const { data, error } = await supabase.rpc('hera_generate_trial_balance_v2', {
    p_organization_id: organizationId,
    p_as_of_date: new Date().toISOString().split('T')[0],
    p_include_sub_accounts: true,
    p_currency_code: 'USD'
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return {
    success: Array.isArray(data),
    message: `Trial balance generated with ${data?.length || 0} accounts`,
    data: { account_count: data?.length, sample: data?.slice(0, 3) }
  };
}

async function testProfitLossGeneration() {
  const { data, error } = await supabase.rpc('hera_generate_profit_loss_v2', {
    p_organization_id: organizationId,
    p_start_date: '2024-01-01',
    p_end_date: new Date().toISOString().split('T')[0],
    p_currency_code: 'USD'
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return {
    success: Array.isArray(data),
    message: `P&L statement generated with ${data?.length || 0} line items`,
    data: { line_count: data?.length, sample: data?.slice(0, 3) }
  };
}

async function testBalanceSheetGeneration() {
  const { data, error } = await supabase.rpc('hera_generate_balance_sheet_v2', {
    p_organization_id: organizationId,
    p_as_of_date: new Date().toISOString().split('T')[0],
    p_currency_code: 'USD'
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return {
    success: Array.isArray(data),
    message: `Balance sheet generated with ${data?.length || 0} accounts`,
    data: { account_count: data?.length, sample: data?.slice(0, 3) }
  };
}

// Policy Engine Tests
async function testPolicyCreation() {
  const { data, error } = await supabase.rpc('hera_create_financial_policy_v2', {
    p_organization_id: organizationId,
    p_policy_name: 'Test Finance Policy',
    p_policy_type: 'APPROVAL_WORKFLOW',
    p_policy_config: {
      approval_threshold: 1000,
      required_approvers: 2,
      escalation_rules: {
        '5000': 'manager',
        '10000': 'director'
      }
    },
    p_priority: 100
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return {
    success: !!data,
    message: `Financial policy created with ID: ${data}`,
    data: { policy_id: data }
  };
}

async function testPolicyExecution() {
  // First create a test policy
  const { data: policyId, error: createError } = await supabase.rpc('hera_create_financial_policy_v2', {
    p_organization_id: organizationId,
    p_policy_name: 'Test Execution Policy',
    p_policy_type: 'AMOUNT_VALIDATION',
    p_policy_config: {
      max_amount: 5000,
      min_amount: 1
    },
    p_priority: 200
  });
  
  if (createError) {
    return { success: false, error: `Policy creation failed: ${createError.message}` };
  }
  
  // Test policy execution
  const { data, error } = await supabase.rpc('hera_execute_financial_policy_v2', {
    p_organization_id: organizationId,
    p_policy_id: policyId,
    p_transaction_data: {
      amount: 2500,
      transaction_type: 'journal_entry',
      smart_code: 'HERA.ACCOUNTING.TEST.EXECUTION.v2'
    }
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return {
    success: data?.policy_result === 'APPROVED' || data?.policy_result === 'PASSED',
    message: `Policy execution result: ${data?.policy_result}`,
    data: data
  };
}

// Migration Functions Tests
async function testMigrationAssessment() {
  const { data, error } = await supabase.rpc('hera_assess_migration_candidates_v2', {
    p_organization_id: organizationId
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return {
    success: Array.isArray(data),
    message: `Migration assessment completed: ${data?.length || 0} candidates found`,
    data: { candidate_count: data?.length, sample: data?.slice(0, 3) }
  };
}

async function testPerformanceMetrics() {
  console.log('📊 Performance Metrics Test');
  
  const startTime = Date.now();
  
  // Test trial balance performance
  const { data, error } = await supabase.rpc('hera_generate_trial_balance_v2', {
    p_organization_id: organizationId,
    p_as_of_date: new Date().toISOString().split('T')[0]
  });
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  const performanceTarget = 2000; // 2 seconds
  const performancePassed = duration < performanceTarget;
  
  return {
    success: performancePassed,
    message: `Trial balance generated in ${duration}ms (target: <${performanceTarget}ms)`,
    data: { 
      duration_ms: duration, 
      target_ms: performanceTarget,
      performance_ratio: duration / performanceTarget,
      account_count: data?.length 
    }
  };
}

async function main() {
  console.log('Finance DNA v2 Comprehensive Testing');
  console.log('===================================');
  console.log('');
  
  // Core Setup Functions
  console.log('🔧 Testing Core Setup Functions');
  console.log('-------------------------------');
  await runTest('Organization Validation', testOrganizationValidation);
  await runTest('Smart Code Validation', testSmartCodeValidation);
  await runTest('Audit Logging', testAuditLogging);
  
  // Reporting Functions
  console.log('📊 Testing Reporting Functions');
  console.log('-----------------------------');
  await runTest('Trial Balance Generation', testTrialBalanceGeneration);
  await runTest('Profit & Loss Generation', testProfitLossGeneration);
  await runTest('Balance Sheet Generation', testBalanceSheetGeneration);
  
  // Policy Engine
  console.log('🔒 Testing Policy Engine');
  console.log('-----------------------');
  await runTest('Policy Creation', testPolicyCreation);
  await runTest('Policy Execution', testPolicyExecution);
  
  // Migration Functions
  console.log('🔄 Testing Migration Functions');
  console.log('-----------------------------');
  await runTest('Migration Assessment', testMigrationAssessment);
  
  // Performance Testing
  console.log('⚡ Performance Testing');
  console.log('--------------------');
  await runTest('Performance Metrics', testPerformanceMetrics);
  
  // Final Results
  console.log('');
  console.log('📊 Final Test Results');
  console.log('====================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📋 Total:  ${testResults.total}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  console.log('');
  console.log('📋 Detailed Results:');
  testResults.details.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.test}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('');
  
  if (testResults.passed === testResults.total) {
    console.log('🎉 All Finance DNA v2 functions are working perfectly!');
    console.log('✅ Finance DNA v2 implementation is PRODUCTION READY');
    process.exit(0);
  } else if (testResults.passed / testResults.total >= 0.8) {
    console.log('⚠️  Most functions working, some issues need attention');
    console.log('🔧 Finance DNA v2 implementation needs minor fixes');
    process.exit(1);
  } else {
    console.log('🚨 Significant issues found in Finance DNA v2 implementation');
    console.log('❌ Major fixes required before production use');
    process.exit(2);
  }
}

main().catch(err => {
  console.error('🔥 Fatal testing error:', err.message);
  process.exit(3);
});