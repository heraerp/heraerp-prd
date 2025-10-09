#!/usr/bin/env node
/**
 * Finance DNA v2 - Final End-to-End Test
 * Test after applying all constraint fixes
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

// Use clean organization ID
const CLEAN_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

console.log('🎯 Finance DNA v2 - Final End-to-End Test');
console.log(`📍 Clean Organization: ${CLEAN_ORG_ID}`);
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
        const dataStr = JSON.stringify(result.data, null, 2);
        console.log(`   📊 Data: ${dataStr.substring(0, 150)}${dataStr.length > 150 ? '...' : ''}`);
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

async function testOrganizationValidation() {
  const { data, error } = await supabase.rpc('hera_validate_organization_access', {
    p_organization_id: CLEAN_ORG_ID
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { 
    success: data === true, 
    message: `Organization validation: ${data}`,
    data: { validated: data }
  };
}

async function testSmartCodeValidation() {
  const testCodes = [
    'HERA.ACCOUNTING.JOURNAL.ENTRY.v2',
    'HERA.ACCOUNTING.CHART.ACCOUNT.v2',
    'HERA.ACCOUNTING.AUDIT.OPERATION.v2'
  ];
  
  let allPassed = true;
  let results = [];
  
  for (const code of testCodes) {
    const { data, error } = await supabase.rpc('validate_finance_dna_smart_code', {
      p_smart_code: code
    });
    
    if (error || !data) {
      allPassed = false;
      results.push({ code, valid: false, error: error?.message });
    } else {
      results.push({ code, valid: true });
    }
  }
  
  return {
    success: allPassed,
    message: `Smart code validation: ${results.filter(r => r.valid).length}/${testCodes.length} passed`,
    data: { results }
  };
}

async function testCreateTestAccounts() {
  const { data, error } = await supabase.rpc('create_test_gl_accounts_v2', {
    p_organization_id: CLEAN_ORG_ID
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return {
    success: data > 0,
    message: `Created ${data} test GL accounts`,
    data: { accounts_created: data }
  };
}

async function testAuditLogging() {
  const { data, error } = await supabase.rpc('hera_audit_operation_v2', {
    p_organization_id: CLEAN_ORG_ID,
    p_operation_type: 'FINANCE_DNA_FINAL_TEST',
    p_operation_details: {
      test_type: 'final_validation',
      timestamp: new Date().toISOString()
    },
    p_smart_code: 'HERA.ACCOUNTING.AUDIT.OPERATION.v2'
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return {
    success: !!data,
    message: `Audit logged with ID: ${data}`,
    data: { audit_id: data }
  };
}

async function testTrialBalanceGeneration() {
  const { data, error } = await supabase.rpc('hera_generate_trial_balance_v2', {
    p_organization_id: CLEAN_ORG_ID,
    p_as_of_date: new Date().toISOString().split('T')[0],
    p_include_sub_accounts: true,
    p_currency_code: 'USD'
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return {
    success: Array.isArray(data),
    message: `Trial balance generated: ${data?.length || 0} accounts`,
    data: { 
      account_count: data?.length, 
      sample_accounts: data?.slice(0, 2)?.map(acc => ({
        code: acc.account_code,
        name: acc.account_name,
        type: acc.account_type
      }))
    }
  };
}

async function testPolicyCreation() {
  const { data, error } = await supabase.rpc('hera_create_financial_policy_v2', {
    p_organization_id: CLEAN_ORG_ID,
    p_policy_name: 'Final Test Policy',
    p_policy_type: 'AMOUNT_VALIDATION',
    p_policy_config: {
      max_amount: 10000,
      min_amount: 1
    },
    p_priority: 100
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return {
    success: !!data,
    message: `Policy created with ID: ${data}`,
    data: { policy_id: data }
  };
}

async function testPolicyExecution() {
  // Create a test policy first
  const { data: policyId, error: createError } = await supabase.rpc('hera_create_financial_policy_v2', {
    p_organization_id: CLEAN_ORG_ID,
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
    p_organization_id: CLEAN_ORG_ID,
    p_policy_id: policyId,
    p_transaction_data: {
      amount: 2500,
      transaction_type: 'journal_entry'
    }
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return {
    success: data?.policy_result === 'APPROVED',
    message: `Policy execution: ${data?.policy_result}`,
    data: { 
      result: data?.policy_result,
      reason: data?.reason
    }
  };
}

async function testCreateJournalEntry() {
  // First, get the actual entity IDs for our accounts
  const { data: accounts, error: accountsError } = await supabase
    .from('core_entities')
    .select('id, entity_code')
    .eq('organization_id', CLEAN_ORG_ID)
    .eq('entity_type', 'gl_account')
    .in('entity_code', ['1100', '4100']);
    
  if (accountsError || !accounts || accounts.length < 2) {
    return { success: false, error: 'Required GL accounts not found' };
  }
  
  const cashAccount = accounts.find(a => a.entity_code === '1100');
  const revenueAccount = accounts.find(a => a.entity_code === '4100');
  
  if (!cashAccount || !revenueAccount) {
    return { success: false, error: 'Cash or Revenue account not found' };
  }

  // Create a balanced journal entry
  const { data: txData, error: txError } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: CLEAN_ORG_ID,
      transaction_type: 'journal_entry',
      transaction_code: `JE-FINAL-${Date.now()}`,
      transaction_date: new Date().toISOString().split('T')[0],
      smart_code: 'HERA.ACCOUNTING.JOURNAL.ENTRY.v2',
      total_amount: 1000.00,
      metadata: { test_type: 'final_validation' }
    })
    .select()
    .single();
    
  if (txError) {
    return { success: false, error: txError.message };
  }
  
  // Create balanced transaction lines with correct entity UUIDs
  const lines = [
    {
      transaction_id: txData.id,
      organization_id: CLEAN_ORG_ID,
      line_number: 1,
      entity_id: cashAccount.id, // Use actual UUID
      line_type: 'DEBIT',
      line_amount: 1000.00,
      smart_code: 'HERA.ACCOUNTING.JOURNAL.LINE.v2'
    },
    {
      transaction_id: txData.id,
      organization_id: CLEAN_ORG_ID,
      line_number: 2,
      entity_id: revenueAccount.id, // Use actual UUID
      line_type: 'CREDIT',
      line_amount: 1000.00,
      smart_code: 'HERA.ACCOUNTING.JOURNAL.LINE.v2'
    }
  ];
  
  const { error: linesError } = await supabase
    .from('universal_transaction_lines')
    .insert(lines);
    
  if (linesError) {
    return { success: false, error: `Lines error: ${linesError.message}` };
  }
  
  return {
    success: true,
    message: `Journal entry created: ${txData.transaction_code}`,
    data: { 
      transaction_id: txData.id,
      transaction_code: txData.transaction_code,
      lines_count: lines.length
    }
  };
}

async function testPerformanceMetrics() {
  const startTime = Date.now();
  
  const { data, error } = await supabase.rpc('hera_generate_trial_balance_v2', {
    p_organization_id: CLEAN_ORG_ID,
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
    message: `Performance: ${duration}ms (${performancePassed ? 'PASS' : 'FAIL'})`,
    data: { 
      duration_ms: duration, 
      target_ms: performanceTarget,
      performance_grade: performancePassed ? 'A' : 'B',
      accounts_processed: data?.length || 0
    }
  };
}

async function main() {
  console.log('Finance DNA v2 Final Validation Testing');
  console.log('=====================================');
  console.log('');
  
  // Core validation tests
  console.log('🔧 Core Validation');
  console.log('------------------');
  await runTest('Organization Validation', testOrganizationValidation);
  await runTest('Smart Code Validation', testSmartCodeValidation);
  
  // Data setup tests
  console.log('🏗️  Data Setup');
  console.log('--------------');
  await runTest('Test Accounts Creation', testCreateTestAccounts);
  await runTest('Audit Logging', testAuditLogging);
  await runTest('Journal Entry Creation', testCreateJournalEntry);
  
  // Advanced functionality
  console.log('📊 Advanced Functions');
  console.log('--------------------');
  await runTest('Trial Balance Generation', testTrialBalanceGeneration);
  await runTest('Policy Creation', testPolicyCreation);
  await runTest('Policy Execution', testPolicyExecution);
  
  // Performance validation
  console.log('⚡ Performance Validation');
  console.log('-----------------------');
  await runTest('Performance Metrics', testPerformanceMetrics);
  
  // Final results
  console.log('');
  console.log('🎯 FINAL FINANCE DNA V2 RESULTS');
  console.log('================================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📋 Total:  ${testResults.total}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  console.log('');
  console.log('📋 Test Details:');
  testResults.details.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.test}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('');
  
  if (testResults.passed === testResults.total) {
    console.log('🎉 FINANCE DNA V2 IS FULLY OPERATIONAL!');
    console.log('✅ ALL SYSTEMS WORKING PERFECTLY');
    console.log('🚀 PRODUCTION READY - DEPLOYMENT APPROVED');
    console.log('');
    console.log('📋 Finance DNA v2 Features Validated:');
    console.log('   ✅ Organization validation and security');
    console.log('   ✅ Smart code validation (v2 format)');
    console.log('   ✅ Test data creation and management');
    console.log('   ✅ Audit logging and compliance');
    console.log('   ✅ Journal entry processing');
    console.log('   ✅ Trial balance generation');
    console.log('   ✅ Policy engine (creation & execution)');
    console.log('   ✅ Performance optimization (<2s)');
    console.log('');
    console.log('🧬 Finance DNA v2 Implementation: COMPLETE');
    
    process.exit(0);
  } else if (testResults.passed / testResults.total >= 0.8) {
    console.log('⚠️  MOSTLY OPERATIONAL - Minor Issues');
    console.log('🔧 Finance DNA v2 needs final adjustments');
    process.exit(1);
  } else {
    console.log('🚨 CRITICAL ISSUES DETECTED');
    console.log('❌ Finance DNA v2 requires additional fixes');
    process.exit(2);
  }
}

main().catch(err => {
  console.error('🔥 Fatal testing error:', err.message);
  process.exit(3);
});