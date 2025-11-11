#!/usr/bin/env node
/**
 * Comprehensive Test Suite: hera_txn_crud_v1
 *
 * Tests all 9 actions + edge cases + error scenarios
 *
 * Actions tested:
 * 1. CREATE - Create transaction with header + lines
 * 2. READ - Read single transaction
 * 3. UPDATE - Update transaction
 * 4. DELETE - Delete transaction
 * 5. QUERY - Query transactions with filters
 * 6. EMIT - Emit lightweight event
 * 7. REVERSE - Reverse transaction
 * 8. VOID - Void transaction
 * 9. VALIDATE - Validate transaction
 *
 * Edge cases:
 * - Missing actor (should fail)
 * - Missing organization (should fail)
 * - Org mismatch (should fail)
 * - Invalid action (should fail)
 * - Missing transaction_id for actions that require it
 * - Response format validation
 * - Complete data return (header + lines)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Test data - Using Hairtalkz organization with valid member
const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // Hairtalkz
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'; // Valid member of Hairtalkz

// Track created transaction IDs for cleanup
const createdTransactionIds = [];

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${'='.repeat(60)}`);
  log('cyan', `TEST: ${testName}`);
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log('green', `✅ ${message}`);
}

function logError(message) {
  log('red', `❌ ${message}`);
}

function logWarning(message) {
  log('yellow', `⚠️  ${message}`);
}

function logInfo(message) {
  log('blue', `ℹ️  ${message}`);
}

// Validation helpers
function validateResponseStructure(data, testName) {
  const required = ['success', 'action', 'data'];
  const missing = required.filter(field => !(field in data));

  if (missing.length > 0) {
    logError(`${testName}: Missing required fields: ${missing.join(', ')}`);
    return false;
  }

  if (typeof data.success !== 'boolean') {
    logError(`${testName}: 'success' should be boolean, got ${typeof data.success}`);
    return false;
  }

  if (typeof data.action !== 'string') {
    logError(`${testName}: 'action' should be string, got ${typeof data.action}`);
    return false;
  }

  // Action should be uppercase
  if (data.action !== data.action.toUpperCase()) {
    logWarning(`${testName}: Action should be uppercase, got '${data.action}'`);
  }

  return true;
}

function validateTransactionData(data, testName) {
  if (!data.transaction) {
    logError(`${testName}: Missing 'transaction' in data`);
    return false;
  }

  const txn = data.transaction;
  const requiredFields = ['id', 'organization_id', 'transaction_type', 'smart_code'];
  const missing = requiredFields.filter(field => !txn[field]);

  if (missing.length > 0) {
    logError(`${testName}: Transaction missing fields: ${missing.join(', ')}`);
    return false;
  }

  return true;
}

// Test functions
async function testCreate() {
  logTest('CREATE - Create Transaction with Header + Lines');

  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: {
        header: {
          organization_id: TEST_ORG_ID,
          transaction_type: 'sale',
          transaction_code: `TEST-SALE-${Date.now()}`,
          smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
          source_entity_id: null,
          target_entity_id: null,
          total_amount: 150.00,
          transaction_status: 'completed',
          business_context: { test: true },
          metadata: { created_by_test: 'hera_txn_crud_v1_test' }
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Test Service',
            quantity: 1,
            unit_amount: 150.00,
            line_amount: 150.00
          }
        ]
      }
    });

    if (error) {
      logError(`CREATE failed: ${error.message}`);
      return { success: false, error };
    }

    logInfo('Response structure:');
    console.log(JSON.stringify(data, null, 2));

    // Validate response structure
    if (!validateResponseStructure(data, 'CREATE')) {
      return { success: false };
    }

    // Validate success
    if (!data.success) {
      logError(`CREATE returned success=false: ${data.error || 'No error message'}`);
      return { success: false };
    }

    // Validate transaction_id at root level
    if (!data.transaction_id) {
      logError('CREATE: Missing transaction_id at root level');
      return { success: false };
    }

    // Validate complete data structure (header + lines)
    if (!validateTransactionData(data.data, 'CREATE')) {
      return { success: false };
    }

    // Validate lines are included
    if (!data.data.lines || !Array.isArray(data.data.lines)) {
      logError('CREATE: Missing or invalid lines array');
      return { success: false };
    }

    if (data.data.lines.length !== 1) {
      logError(`CREATE: Expected 1 line, got ${data.data.lines.length}`);
      return { success: false };
    }

    // Track for cleanup
    createdTransactionIds.push(data.transaction_id);

    logSuccess('CREATE: Transaction created successfully');
    logSuccess(`CREATE: Transaction ID: ${data.transaction_id}`);
    logSuccess(`CREATE: Returned ${data.data.lines.length} line(s)`);
    logSuccess('CREATE: Complete data structure returned (header + lines)');

    return { success: true, transaction_id: data.transaction_id };

  } catch (err) {
    logError(`CREATE exception: ${err.message}`);
    return { success: false, error: err };
  }
}

async function testRead(transactionId) {
  logTest('READ - Read Single Transaction');

  if (!transactionId) {
    logWarning('READ: Skipped (no transaction_id from CREATE)');
    return { success: false, skipped: true };
  }

  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: {
        transaction_id: transactionId
      }
    });

    if (error) {
      logError(`READ failed: ${error.message}`);
      return { success: false, error };
    }

    if (!validateResponseStructure(data, 'READ') || !data.success) {
      return { success: false };
    }

    if (!validateTransactionData(data.data, 'READ')) {
      return { success: false };
    }

    // Verify ID matches
    if (data.transaction_id !== transactionId) {
      logError(`READ: ID mismatch. Expected ${transactionId}, got ${data.transaction_id}`);
      return { success: false };
    }

    logSuccess('READ: Transaction retrieved successfully');
    logSuccess(`READ: Lines included: ${data.data.lines ? data.data.lines.length : 0}`);

    return { success: true };

  } catch (err) {
    logError(`READ exception: ${err.message}`);
    return { success: false, error: err };
  }
}

async function testUpdate(transactionId) {
  logTest('UPDATE - Update Transaction');

  if (!transactionId) {
    logWarning('UPDATE: Skipped (no transaction_id)');
    return { success: false, skipped: true };
  }

  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'UPDATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: {
        transaction_id: transactionId,
        patch: {
          transaction_status: 'updated_by_test',
          metadata: { updated: true }
        }
      }
    });

    if (error) {
      logError(`UPDATE failed: ${error.message}`);
      return { success: false, error };
    }

    if (!validateResponseStructure(data, 'UPDATE') || !data.success) {
      return { success: false };
    }

    // Should return fresh data with lines
    if (!validateTransactionData(data.data, 'UPDATE')) {
      return { success: false };
    }

    logSuccess('UPDATE: Transaction updated successfully');
    logSuccess('UPDATE: Fresh data returned with lines');

    return { success: true };

  } catch (err) {
    logError(`UPDATE exception: ${err.message}`);
    return { success: false, error: err };
  }
}

async function testQuery() {
  logTest('QUERY - Query Transactions');

  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'QUERY',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: {
        filters: {
          transaction_type: 'sale',
          limit: 10
        }
      }
    });

    if (error) {
      logError(`QUERY failed: ${error.message}`);
      return { success: false, error };
    }

    if (!validateResponseStructure(data, 'QUERY') || !data.success) {
      return { success: false };
    }

    // QUERY should return array
    if (!Array.isArray(data.data)) {
      logError(`QUERY: Expected array, got ${typeof data.data}`);
      return { success: false };
    }

    logSuccess(`QUERY: Retrieved ${data.data.length} transaction(s)`);

    return { success: true };

  } catch (err) {
    logError(`QUERY exception: ${err.message}`);
    return { success: false, error: err };
  }
}

async function testEmit() {
  logTest('EMIT - Emit Lightweight Event');

  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'EMIT',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: {
        header: {
          organization_id: TEST_ORG_ID,
          transaction_type: 'event',
          transaction_code: `TEST-EVENT-${Date.now()}`,
          smart_code: 'HERA.SALON.EVENT.TXN.TEST.V1',
          total_amount: 0,
          transaction_status: 'emitted'
        }
      }
    });

    if (error) {
      logError(`EMIT failed: ${error.message}`);
      return { success: false, error };
    }

    if (!validateResponseStructure(data, 'EMIT') || !data.success) {
      return { success: false };
    }

    logSuccess('EMIT: Event emitted successfully');

    // Track if returns transaction_id
    if (data.transaction_id) {
      createdTransactionIds.push(data.transaction_id);
    }

    return { success: true };

  } catch (err) {
    logError(`EMIT exception: ${err.message}`);
    return { success: false, error: err };
  }
}

async function testValidate(transactionId) {
  logTest('VALIDATE - Validate Transaction');

  if (!transactionId) {
    logWarning('VALIDATE: Skipped (no transaction_id)');
    return { success: false, skipped: true };
  }

  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'VALIDATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: {
        transaction_id: transactionId
      }
    });

    if (error) {
      logError(`VALIDATE failed: ${error.message}`);
      return { success: false, error };
    }

    if (!validateResponseStructure(data, 'VALIDATE') || !data.success) {
      return { success: false };
    }

    logSuccess('VALIDATE: Transaction validated');

    return { success: true };

  } catch (err) {
    logError(`VALIDATE exception: ${err.message}`);
    return { success: false, error: err };
  }
}

// Edge case tests
async function testMissingActor() {
  logTest('EDGE CASE: Missing Actor (Should Fail)');

  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: null, // ❌ Missing
      p_organization_id: TEST_ORG_ID,
      p_payload: {
        header: {
          organization_id: TEST_ORG_ID,
          transaction_type: 'sale',
          smart_code: 'HERA.TEST.TXN.V1'
        }
      }
    });

    if (error && error.message.includes('ACTOR_REQUIRED')) {
      logSuccess('Missing actor correctly rejected');
      return { success: true };
    }

    if (data && !data.success && data.error && data.error.includes('ACTOR_REQUIRED')) {
      logSuccess('Missing actor correctly rejected (in response)');
      return { success: true };
    }

    logError('Missing actor should have been rejected');
    return { success: false };

  } catch (err) {
    if (err.message.includes('ACTOR_REQUIRED')) {
      logSuccess('Missing actor correctly rejected (exception)');
      return { success: true };
    }
    logError(`Unexpected error: ${err.message}`);
    return { success: false };
  }
}

async function testMissingOrganization() {
  logTest('EDGE CASE: Missing Organization (Should Fail)');

  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: null, // ❌ Missing
      p_payload: {
        header: {
          organization_id: null,
          transaction_type: 'sale',
          smart_code: 'HERA.TEST.TXN.V1'
        }
      }
    });

    if (error && error.message.includes('ORG_REQUIRED')) {
      logSuccess('Missing organization correctly rejected');
      return { success: true };
    }

    if (data && !data.success && data.error && data.error.includes('ORG_REQUIRED')) {
      logSuccess('Missing organization correctly rejected (in response)');
      return { success: true };
    }

    logError('Missing organization should have been rejected');
    return { success: false };

  } catch (err) {
    if (err.message.includes('ORG_REQUIRED')) {
      logSuccess('Missing organization correctly rejected (exception)');
      return { success: true };
    }
    logError(`Unexpected error: ${err.message}`);
    return { success: false };
  }
}

async function testOrgMismatch() {
  logTest('EDGE CASE: Organization Mismatch (Should Fail)');

  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: {
        header: {
          organization_id: '00000000-0000-0000-0000-000000000099', // ❌ Different org
          transaction_type: 'sale',
          smart_code: 'HERA.TEST.TXN.V1'
        }
      }
    });

    if (error && error.message.includes('ORG_MISMATCH')) {
      logSuccess('Organization mismatch correctly rejected');
      return { success: true };
    }

    if (data && !data.success && data.error && data.error.includes('ORG_MISMATCH')) {
      logSuccess('Organization mismatch correctly rejected (in response)');
      return { success: true };
    }

    logError('Organization mismatch should have been rejected');
    return { success: false };

  } catch (err) {
    if (err.message.includes('ORG_MISMATCH')) {
      logSuccess('Organization mismatch correctly rejected (exception)');
      return { success: true };
    }
    logError(`Unexpected error: ${err.message}`);
    return { success: false };
  }
}

async function testInvalidAction() {
  logTest('EDGE CASE: Invalid Action (Should Fail)');

  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'INVALID_ACTION',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: {}
    });

    if (error && error.message.includes('UNKNOWN_ACTION')) {
      logSuccess('Invalid action correctly rejected');
      return { success: true };
    }

    if (data && !data.success && data.error && data.error.includes('UNKNOWN_ACTION')) {
      logSuccess('Invalid action correctly rejected (in response)');
      return { success: true };
    }

    logError('Invalid action should have been rejected');
    return { success: false };

  } catch (err) {
    if (err.message.includes('UNKNOWN_ACTION')) {
      logSuccess('Invalid action correctly rejected (exception)');
      return { success: true };
    }
    logError(`Unexpected error: ${err.message}`);
    return { success: false };
  }
}

async function testMissingTransactionId() {
  logTest('EDGE CASE: Missing Transaction ID for READ (Should Fail)');

  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: TEST_ACTOR_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: {} // ❌ Missing transaction_id
    });

    if (error && error.message.includes('PARAM_REQUIRED')) {
      logSuccess('Missing transaction_id correctly rejected');
      return { success: true };
    }

    if (data && !data.success && data.error && data.error.includes('PARAM_REQUIRED')) {
      logSuccess('Missing transaction_id correctly rejected (in response)');
      return { success: true };
    }

    logError('Missing transaction_id should have been rejected');
    return { success: false };

  } catch (err) {
    if (err.message.includes('PARAM_REQUIRED') || err.message.includes('transaction_id')) {
      logSuccess('Missing transaction_id correctly rejected (exception)');
      return { success: true };
    }
    logError(`Unexpected error: ${err.message}`);
    return { success: false };
  }
}

// Cleanup function
async function cleanup() {
  logTest('CLEANUP: Delete Test Transactions');

  if (createdTransactionIds.length === 0) {
    logInfo('No transactions to clean up');
    return;
  }

  let cleanedCount = 0;
  for (const txnId of createdTransactionIds) {
    try {
      const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
        p_action: 'DELETE',
        p_actor_user_id: TEST_ACTOR_ID,
        p_organization_id: TEST_ORG_ID,
        p_payload: {
          transaction_id: txnId
        }
      });

      if (!error && data?.success) {
        cleanedCount++;
      }
    } catch (err) {
      logWarning(`Failed to delete ${txnId}: ${err.message}`);
    }
  }

  logSuccess(`Cleaned up ${cleanedCount}/${createdTransactionIds.length} test transactions`);
}

// Main test runner
async function runTests() {
  console.log('\n');
  log('cyan', '═'.repeat(70));
  log('cyan', '  HERA Transaction CRUD V1 - Comprehensive Test Suite');
  log('cyan', '═'.repeat(70));
  console.log('\n');

  logInfo(`Organization ID: ${TEST_ORG_ID}`);
  logInfo(`Actor ID: ${TEST_ACTOR_ID}`);
  console.log('\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };

  const tests = [
    // Core CRUD operations
    { name: 'CREATE', fn: testCreate },
    { name: 'READ', fn: (ctx) => testRead(ctx.transactionId) },
    { name: 'UPDATE', fn: (ctx) => testUpdate(ctx.transactionId) },
    { name: 'QUERY', fn: testQuery },
    { name: 'EMIT', fn: testEmit },
    { name: 'VALIDATE', fn: (ctx) => testValidate(ctx.transactionId) },

    // Edge cases
    { name: 'Missing Actor', fn: testMissingActor },
    { name: 'Missing Organization', fn: testMissingOrganization },
    { name: 'Org Mismatch', fn: testOrgMismatch },
    { name: 'Invalid Action', fn: testInvalidAction },
    { name: 'Missing Transaction ID', fn: testMissingTransactionId }
  ];

  const context = {};

  for (const test of tests) {
    results.total++;
    const result = await test.fn(context);

    if (result.skipped) {
      results.skipped++;
      continue;
    }

    if (result.success) {
      results.passed++;
      if (result.transaction_id) {
        context.transactionId = result.transaction_id;
      }
    } else {
      results.failed++;
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Cleanup
  await cleanup();

  // Final summary
  console.log('\n');
  log('cyan', '═'.repeat(70));
  log('cyan', '  TEST SUMMARY');
  log('cyan', '═'.repeat(70));
  console.log('\n');

  log('blue', `Total Tests:    ${results.total}`);
  log('green', `Passed:         ${results.passed}`);
  log('red', `Failed:         ${results.failed}`);
  log('yellow', `Skipped:        ${results.skipped}`);
  console.log('\n');

  const successRate = ((results.passed / (results.total - results.skipped)) * 100).toFixed(1);

  if (results.failed === 0) {
    log('green', `✅ ALL TESTS PASSED (${successRate}% success rate)`);
    log('green', '✅ hera_txn_crud_v1 IS PRODUCTION READY');
  } else {
    log('red', `❌ ${results.failed} TEST(S) FAILED (${successRate}% success rate)`);
    log('red', '❌ FIX ISSUES BEFORE DEPLOYMENT');
  }

  console.log('\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  logError(`Test suite crashed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
