#!/usr/bin/env node
/**
 * SECURITY FIX VALIDATION TEST
 * Testing: Enhanced actor validation for 100% test success
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const testData = {
  name: "Michele Hair (Owner)",
  user_entity_id: "09b0b92a-d797-489e-bc03-5ca0a6272674",
  organization_id: "378f24fb-d496-4ff7-8afa-ea34895a0eb8"
};

async function testSecurityFix() {
  console.log('🛡️ SECURITY FIX VALIDATION TEST');
  console.log('🎯 Goal: Achieve 100% test success with enhanced actor validation');
  console.log('📊 Testing: Invalid actor scenarios that should be REJECTED\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  function logTest(name, passed, details = '') {
    totalTests++;
    if (passed) {
      passedTests++;
      console.log(`✅ ${name}: PASSED ${details}`);
    } else {
      console.log(`❌ ${name}: FAILED ${details}`);
    }
  }
  
  try {
    // Test 1: Valid Michele actor (should PASS)
    console.log('🧪 Test 1: Valid Michele actor (should PASS)...');
    try {
      const result = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'CREATE',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_transaction: {
          transaction_type: 'test',
          smart_code: 'HERA.SALON.TEST.TXN.VALID.V1',
          transaction_code: `TEST-VALID-${Date.now()}`,
          total_amount: 1.00
        }
      });
      
      logTest('Valid Actor (Michele)', !result.error, 
               result.error ? `Error: ${result.error.message}` : 'Michele correctly accepted');
    } catch (error) {
      logTest('Valid Actor (Michele)', false, `Exception: ${error.message}`);
    }
    
    // Test 2: Invalid NULL UUID actor (should FAIL)
    console.log('\n🧪 Test 2: NULL UUID actor (should FAIL)...');
    try {
      const result = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'CREATE',
        p_actor_user_id: '00000000-0000-0000-0000-000000000000',
        p_organization_id: testData.organization_id,
        p_transaction: {
          transaction_type: 'test',
          smart_code: 'HERA.SALON.TEST.TXN.NULL.V1'
        }
      });
      
      const hasError = result.error !== null;
      const correctError = hasError && (
        result.error.message.includes('INVALID_ACTOR') ||
        result.error.message.includes('NULL_UUID') ||
        result.error.message.includes('ACTOR_USER_ID_REQUIRED') ||
        result.error.message.includes('ACTOR_NOT_MEMBER') ||
        result.error.message.includes('enforce_actor_requirement')
      );
      
      logTest('NULL UUID Actor Rejection', correctError, 
               correctError ? 'Correctly rejected with security error' : 
               hasError ? `Wrong error: ${result.error.message}` : 'Should be rejected');
    } catch (error) {
      const correctError = error.message.includes('INVALID_ACTOR') ||
                          error.message.includes('NULL_UUID') ||
                          error.message.includes('ACTOR_USER_ID_REQUIRED') ||
                          error.message.includes('ACTOR_NOT_MEMBER') ||
                          error.message.includes('enforce_actor_requirement');
      
      logTest('NULL UUID Actor Rejection', correctError, 
               correctError ? 'Correctly rejected with security error' : `Wrong error: ${error.message}`);
    }
    
    // Test 3: Non-existent actor UUID (should FAIL)
    console.log('\n🧪 Test 3: Fake actor UUID (should FAIL)...');
    try {
      const result = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'CREATE',
        p_actor_user_id: '99999999-9999-9999-9999-999999999999',
        p_organization_id: testData.organization_id,
        p_transaction: {
          transaction_type: 'test',
          smart_code: 'HERA.SALON.TEST.TXN.FAKE.V1'
        }
      });
      
      const hasError = result.error !== null;
      const correctError = hasError && (
        result.error.message.includes('ACTOR_ENTITY_NOT_FOUND') ||
        result.error.message.includes('ACTOR_NOT_MEMBER') ||
        result.error.message.includes('enforce_actor_requirement') ||
        result.error.message.includes('INVALID_ACTOR')
      );
      
      logTest('Fake Actor Rejection', correctError, 
               correctError ? 'Correctly rejected with security error' : 
               hasError ? `Wrong error: ${result.error.message}` : 'Should be rejected');
    } catch (error) {
      const correctError = error.message.includes('ACTOR_ENTITY_NOT_FOUND') ||
                          error.message.includes('ACTOR_NOT_MEMBER') ||
                          error.message.includes('enforce_actor_requirement') ||
                          error.message.includes('INVALID_ACTOR');
      
      logTest('Fake Actor Rejection', correctError, 
               correctError ? 'Correctly rejected with security error' : `Wrong error: ${error.message}`);
    }
    
    // Test 4: Cross-organization access (should FAIL)
    console.log('\n🧪 Test 4: Cross-organization access (should FAIL)...');
    try {
      const result = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'CREATE',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: '11111111-1111-1111-1111-111111111111', // Different org
        p_transaction: {
          transaction_type: 'test',
          smart_code: 'HERA.SALON.TEST.TXN.CROSS.V1'
        }
      });
      
      const hasError = result.error !== null;
      const correctError = hasError && (
        result.error.message.includes('ACTOR_NOT_MEMBER') ||
        result.error.message.includes('ORGANIZATION_ENTITY_NOT_FOUND') ||
        result.error.message.includes('enforce_actor_requirement') ||
        result.error.message.includes('INVALID_ORGANIZATION')
      );
      
      logTest('Cross-Org Access Rejection', correctError, 
               correctError ? 'Correctly rejected with security error' : 
               hasError ? `Wrong error: ${result.error.message}` : 'Should be rejected');
    } catch (error) {
      const correctError = error.message.includes('ACTOR_NOT_MEMBER') ||
                          error.message.includes('ORGANIZATION_ENTITY_NOT_FOUND') ||
                          error.message.includes('enforce_actor_requirement') ||
                          error.message.includes('INVALID_ORGANIZATION');
      
      logTest('Cross-Org Access Rejection', correctError, 
               correctError ? 'Correctly rejected with security error' : `Wrong error: ${error.message}`);
    }
    
    // Test 5: READ operation with invalid actor (should FAIL)
    console.log('\n🧪 Test 5: READ with invalid actor (should FAIL)...');
    try {
      const result = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'READ',
        p_actor_user_id: '88888888-8888-8888-8888-888888888888',
        p_organization_id: testData.organization_id,
        p_transaction: {},
        p_options: { limit: 1 }
      });
      
      const hasError = result.error !== null;
      const correctError = hasError && (
        result.error.message.includes('ACTOR_ENTITY_NOT_FOUND') ||
        result.error.message.includes('ACTOR_NOT_MEMBER') ||
        result.error.message.includes('enforce_actor_requirement') ||
        result.error.message.includes('INVALID_ACTOR')
      );
      
      logTest('READ Invalid Actor Rejection', correctError, 
               correctError ? 'Correctly rejected with security error' : 
               hasError ? `Wrong error: ${result.error.message}` : 'Should be rejected');
    } catch (error) {
      const correctError = error.message.includes('ACTOR_ENTITY_NOT_FOUND') ||
                          error.message.includes('ACTOR_NOT_MEMBER') ||
                          error.message.includes('enforce_actor_requirement') ||
                          error.message.includes('INVALID_ACTOR');
      
      logTest('READ Invalid Actor Rejection', correctError, 
               correctError ? 'Correctly rejected with security error' : `Wrong error: ${error.message}`);
    }
    
    // Results Summary
    console.log('\n🎉 SECURITY FIX VALIDATION COMPLETED!');
    console.log('═'.repeat(60));
    console.log(`📊 SECURITY TEST RESULTS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${totalTests - passedTests}`);
    console.log(`   📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('\n🟢 100% SUCCESS - SECURITY FIX WORKING PERFECTLY!');
      console.log('🛡️ All invalid actor attempts correctly rejected');
      console.log('✅ Valid Michele actor correctly accepted');
      console.log('🚀 Ready for 100% enterprise test success rate');
      
      console.log('\n📋 SECURITY IMPROVEMENTS CONFIRMED:');
      console.log('   ✅ NULL UUID actor blocking');
      console.log('   ✅ Fake actor detection and rejection');
      console.log('   ✅ Cross-organization access prevention');
      console.log('   ✅ Invalid READ operation blocking');
      console.log('   ✅ Comprehensive error handling');
      
      return true;
    } else {
      console.log('\n🟡 PARTIAL SUCCESS - Some security tests failed');
      console.log('🔍 Review failed tests and enhance validation further');
      console.log('💡 May need to deploy enhanced security function to Supabase');
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Security fix validation test failed:', error.message);
    return false;
  }
}

testSecurityFix();