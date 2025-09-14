/**
 * Test HERA Standards Validation System
 */

const { heraValidationService } = require('./src/lib/services/hera-validation-service.ts');

async function testValidation() {
  console.log('🧪 Testing HERA Standards Validation System');
  console.log('=' .repeat(50));
  
  const testOrgId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  
  try {
    // Test 1: Valid entity type
    console.log('\n✅ Test 1: Valid Entity Type');
    const validEntity = await heraValidationService.validateEntity({
      entity_type: 'customer',
      entity_name: 'Test Customer Corp',
      entity_code: 'CUST-001',
      smart_code: 'HERA.GEN.CRM.CUST.ENT.v1',
      organization_id: testOrgId
    });
    console.log('Result:', validEntity.valid ? '✅ PASSED' : '❌ FAILED');
    if (validEntity.warnings.length > 0) {
      console.log('Warnings:', validEntity.warnings.map(w => w.message));
    }
    
    // Test 2: Invalid entity type
    console.log('\n❌ Test 2: Invalid Entity Type');
    const invalidEntity = await heraValidationService.validateEntity({
      entity_type: 'client', // Should be 'customer'
      entity_name: 'Test Client Corp',
      organization_id: testOrgId
    });
    console.log('Result:', !invalidEntity.valid ? '✅ PASSED (correctly failed)' : '❌ FAILED');
    if (invalidEntity.errors.length > 0) {
      console.log('Errors:', invalidEntity.errors.map(e => `${e.message} (suggestion: ${e.suggestion})`));
    }
    
    // Test 3: Valid transaction type
    console.log('\n✅ Test 3: Valid Transaction Type');
    const validTransaction = await heraValidationService.validateTransaction({
      transaction_type: 'sale',
      transaction_code: 'SALE-001',
      smart_code: 'HERA.GEN.POS.SALE.TXN.v1',
      total_amount: 150.00,
      organization_id: testOrgId
    });
    console.log('Result:', validTransaction.valid ? '✅ PASSED' : '❌ FAILED');
    if (validTransaction.warnings.length > 0) {
      console.log('Warnings:', validTransaction.warnings.map(w => w.message));
    }
    
    // Test 4: Invalid transaction type
    console.log('\n❌ Test 4: Invalid Transaction Type');
    const invalidTransaction = await heraValidationService.validateTransaction({
      transaction_type: 'order', // Should be 'sale'
      total_amount: 150.00,
      organization_id: testOrgId
    });
    console.log('Result:', !invalidTransaction.valid ? '✅ PASSED (correctly failed)' : '❌ FAILED');
    if (invalidTransaction.errors.length > 0) {
      console.log('Errors:', invalidTransaction.errors.map(e => `${e.message} (suggestion: ${e.suggestion})`));
    }
    
    // Test 5: Get validation statistics
    console.log('\n📊 Test 5: Validation Statistics');
    const stats = await heraValidationService.getValidationStats(testOrgId);
    console.log('Organization Stats:');
    console.log(`  Total Entities: ${stats.totalEntities}`);
    console.log(`  Compliant Entities: ${stats.standardCompliantEntities}`);
    console.log(`  Total Transactions: ${stats.totalTransactions}`);
    console.log(`  Compliant Transactions: ${stats.standardCompliantTransactions}`);
    console.log(`  Overall Compliance: ${stats.compliancePercentage}%`);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run tests
testValidation();