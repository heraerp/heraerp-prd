#!/usr/bin/env node

/**
 * SAP FI MCP Server Tests
 * Tests AI agent integration capabilities
 */

const { sapFITools } = require('../../mcp-server/hera-sap-fi-mcp-server');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// Test configuration
const TEST_ORG_ID = '12345678-1234-1234-1234-123456789012';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test utilities
async function runTest(testName, testFn) {
  console.log(`\n🧪 Testing: ${testName}`);
  try {
    await testFn();
    console.log(`✅ ${testName} - PASSED`);
  } catch (error) {
    console.error(`❌ ${testName} - FAILED:`, error.message);
    throw error;
  }
}

// Test cases
async function testJournalEntryPosting() {
  const params = {
    organization_id: TEST_ORG_ID,
    posting_date: new Date().toISOString().split('T')[0],
    description: 'Test journal entry from MCP',
    lines: [
      {
        gl_account: '6100',
        debit_amount: 1000,
        description: 'Office supplies expense'
      },
      {
        gl_account: '1100',
        credit_amount: 1000,
        description: 'Cash payment'
      }
    ]
  };

  const result = await sapFITools['sap.fi.post_journal_entry'].handler(params);
  
  if (!result.success) {
    throw new Error(`Journal entry posting failed: ${result.error}`);
  }
  
  if (!result.transaction_id || !result.sap_document_number) {
    throw new Error('Missing required fields in response');
  }
  
  console.log(`  ✓ Created transaction: ${result.transaction_id}`);
  console.log(`  ✓ SAP document number: ${result.sap_document_number}`);
  
  return result.transaction_id;
}

async function testGLBalanceQuery() {
  const params = {
    organization_id: TEST_ORG_ID,
    gl_account: '6100',
    period: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString()
  };

  const result = await sapFITools['sap.fi.get_gl_balance'].handler(params);
  
  if (result.gl_account !== '6100') {
    throw new Error('GL account mismatch');
  }
  
  if (typeof result.balance !== 'number') {
    throw new Error('Invalid balance type');
  }
  
  console.log(`  ✓ GL Account: ${result.gl_account}`);
  console.log(`  ✓ Balance: ${result.balance} ${result.currency}`);
  console.log(`  ✓ Debit Total: ${result.debit_total}`);
  console.log(`  ✓ Credit Total: ${result.credit_total}`);
}

async function testAPInvoiceCreation() {
  // First create a vendor
  const { data: vendor } = await supabase
    .from('core_entities')
    .insert({
      organization_id: TEST_ORG_ID,
      entity_type: 'vendor',
      entity_name: 'Test MCP Vendor',
      entity_code: 'VENDOR-MCP-001',
      smart_code: 'HERA.ERP.FI.MD.VENDOR.v1'
    })
    .select()
    .single();

  const params = {
    organization_id: TEST_ORG_ID,
    vendor_id: vendor.id,
    invoice_date: new Date().toISOString().split('T')[0],
    invoice_number: `INV-${Date.now()}`,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lines: [
      {
        gl_account: '5100',
        amount: 5000,
        cost_center: 'CC-100',
        description: 'Professional services'
      },
      {
        gl_account: '5200',
        amount: 2500,
        cost_center: 'CC-100',
        description: 'Consulting fees'
      }
    ]
  };

  const result = await sapFITools['sap.fi.create_ap_invoice'].handler(params);
  
  if (!result.success) {
    throw new Error(`AP invoice creation failed: ${result.error}`);
  }
  
  console.log(`  ✓ Created AP invoice: ${result.transaction_id}`);
  console.log(`  ✓ Total amount: 7500`);
  
  return { vendorId: vendor.id, transactionId: result.transaction_id };
}

async function testDuplicateInvoiceDetection() {
  const { vendorId } = await testAPInvoiceCreation();
  
  // Check for duplicate with same invoice number
  const params = {
    organization_id: TEST_ORG_ID,
    vendor_id: vendorId,
    invoice_number: 'INV-DUPLICATE-001',
    invoice_amount: 5000,
    invoice_date: new Date().toISOString().split('T')[0]
  };

  // Create first invoice
  await supabase
    .from('universal_transactions')
    .insert({
      organization_id: TEST_ORG_ID,
      transaction_type: 'purchase_invoice',
      transaction_code: 'PI-DUP-001',
      transaction_date: params.invoice_date,
      source_entity_id: vendorId,
      total_amount: 5000,
      smart_code: 'HERA.ERP.FI.AP.INVOICE.v1',
      metadata: { invoice_number: 'INV-DUPLICATE-001' }
    });

  // Check for duplicate
  const result = await sapFITools['sap.fi.check_duplicate_invoice'].handler(params);
  
  if (!result.is_duplicate) {
    throw new Error('Failed to detect duplicate invoice');
  }
  
  if (result.confidence < 0.9) {
    throw new Error(`Low confidence score: ${result.confidence}`);
  }
  
  console.log(`  ✓ Duplicate detected: ${result.is_duplicate}`);
  console.log(`  ✓ Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  console.log(`  ✓ Recommendation: ${result.recommendation}`);
}

async function testBankReconciliation() {
  // Create bank account
  const { data: bankAccount } = await supabase
    .from('core_entities')
    .insert({
      organization_id: TEST_ORG_ID,
      entity_type: 'bank_account',
      entity_name: 'Test Bank Account',
      entity_code: 'BANK-001',
      smart_code: 'HERA.FIN.BANK.ACCOUNT.v1'
    })
    .select()
    .single();

  const params = {
    organization_id: TEST_ORG_ID,
    bank_account_id: bankAccount.id,
    statement_date: new Date().toISOString().split('T')[0],
    statement_balance: 50000,
    transactions: [
      {
        date: new Date().toISOString().split('T')[0],
        amount: -1000,
        reference: 'CHK-001',
        description: 'Check payment'
      },
      {
        date: new Date().toISOString().split('T')[0],
        amount: 5000,
        reference: 'DEP-001',
        description: 'Customer deposit'
      }
    ]
  };

  const result = await sapFITools['sap.fi.reconcile_bank_statement'].handler(params);
  
  if (typeof result.match_rate !== 'string') {
    throw new Error('Invalid match rate format');
  }
  
  console.log(`  ✓ Total transactions: ${result.total_transactions}`);
  console.log(`  ✓ Matched: ${result.matched_count}`);
  console.log(`  ✓ Unmatched: ${result.unmatched_count}`);
  console.log(`  ✓ Match rate: ${result.match_rate}`);
}

// Performance test
async function testBatchPerformance() {
  console.log('\n⚡ Performance Test: Batch Journal Entry Creation');
  
  const startTime = Date.now();
  const batchSize = 10;
  const promises = [];
  
  for (let i = 0; i < batchSize; i++) {
    const params = {
      organization_id: TEST_ORG_ID,
      posting_date: new Date().toISOString().split('T')[0],
      description: `Batch entry ${i + 1}`,
      lines: [
        {
          gl_account: '6100',
          debit_amount: 100 + i,
          description: `Expense ${i + 1}`
        },
        {
          gl_account: '1100',
          credit_amount: 100 + i,
          description: `Payment ${i + 1}`
        }
      ]
    };
    
    promises.push(sapFITools['sap.fi.post_journal_entry'].handler(params));
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  const successCount = results.filter(r => r.success).length;
  
  console.log(`  ✓ Created ${successCount}/${batchSize} entries`);
  console.log(`  ✓ Total time: ${duration.toFixed(2)} seconds`);
  console.log(`  ✓ Average time per entry: ${(duration / batchSize).toFixed(2)} seconds`);
  
  if (successCount !== batchSize) {
    throw new Error(`Some entries failed: ${batchSize - successCount} failures`);
  }
}

// Cleanup function
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete test transactions
  await supabase
    .from('universal_transactions')
    .delete()
    .eq('organization_id', TEST_ORG_ID);
  
  // Delete test entities
  await supabase
    .from('core_entities')
    .delete()
    .eq('organization_id', TEST_ORG_ID);
  
  // Delete test dynamic data
  await supabase
    .from('core_dynamic_data')
    .delete()
    .eq('organization_id', TEST_ORG_ID);
  
  console.log('✅ Cleanup complete');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 HERA SAP FI MCP Server Test Suite');
  console.log('====================================');
  
  try {
    // Run all tests
    await runTest('Journal Entry Posting', testJournalEntryPosting);
    await runTest('GL Balance Query', testGLBalanceQuery);
    await runTest('AP Invoice Creation', testAPInvoiceCreation);
    await runTest('Duplicate Invoice Detection', testDuplicateInvoiceDetection);
    await runTest('Bank Reconciliation', testBankReconciliation);
    await testBatchPerformance();
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };