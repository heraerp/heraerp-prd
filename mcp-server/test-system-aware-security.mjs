#!/usr/bin/env node
/**
 * SYSTEM-AWARE SECURITY TEST
 * Testing: Enhanced security that properly handles system vs business operations
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
  organization_id: "378f24fb-d496-4ff7-8afa-ea34895a0eb8",
  platform_org: "00000000-0000-0000-0000-000000000000"
};

async function testSystemAwareSecurity() {
  console.log('🛡️ SYSTEM-AWARE SECURITY VALIDATION TEST');
  console.log('🎯 Goal: Properly handle system vs business operations in platform org');
  console.log('📊 Testing: Platform org access rules, tenant org rules, security validation\n');
  
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
    console.log('📋 PHASE 1: TENANT ORGANIZATION OPERATIONS (Hair Talkz)');
    
    // Test 1: Valid business operation in tenant org (should PASS)
    console.log('\n🧪 Test 1: Michele business transaction in Hair Talkz (should PASS)...');
    try {
      const result = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'CREATE',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_transaction: {
          transaction_type: 'appointment',
          smart_code: 'HERA.SALON.TEST.TXN.TENANT.V1',
          transaction_code: `TENANT-${Date.now()}`,
          total_amount: 150.00
        }
      });
      
      logTest('Tenant Business Operation', !result.error, 
               result.error ? `Error: ${result.error.message}` : 'Michele appointment in Hair Talkz allowed');
    } catch (error) {
      logTest('Tenant Business Operation', false, `Exception: ${error.message}`);
    }
    
    // Test 2: Valid READ operation in tenant org (should PASS)
    console.log('\n🧪 Test 2: Michele READ transactions in Hair Talkz (should PASS)...');
    try {
      const result = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'READ',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_transaction: {},
        p_options: { limit: 5 }
      });
      
      logTest('Tenant READ Operation', !result.error, 
               result.error ? `Error: ${result.error.message}` : 'Michele READ in Hair Talkz allowed');
    } catch (error) {
      logTest('Tenant READ Operation', false, `Exception: ${error.message}`);
    }
    
    console.log('\n📋 PHASE 2: PLATFORM ORGANIZATION SYSTEM OPERATIONS');
    
    // Test 3: System operation in platform org (should PASS)
    console.log('\n🧪 Test 3: System entity operation in platform org (should PASS)...');
    try {
      const result = await supabase.rpc('hera_entities_crud_v2', {
        p_action: 'READ',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.platform_org,
        p_entity: { entity_type: 'USER' },
        p_dynamic: {},
        p_relationships: [],
        p_options: { limit: 1 }
      });
      
      logTest('Platform System Operation', !result.error, 
               result.error ? `Error: ${result.error.message}` : 'System operation in platform org allowed');
    } catch (error) {
      logTest('Platform System Operation', false, `Exception: ${error.message}`);
    }
    
    console.log('\n📋 PHASE 3: PLATFORM ORGANIZATION BUSINESS OPERATIONS (Should FAIL)');
    
    // Test 4: Business operation in platform org (should FAIL)
    console.log('\n🧪 Test 4: Business transaction in platform org (should FAIL)...');
    try {
      const result = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'CREATE',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.platform_org,
        p_transaction: {
          transaction_type: 'appointment',
          smart_code: 'HERA.SALON.TEST.TXN.PLATFORM.V1',
          transaction_code: `PLATFORM-${Date.now()}`,
          total_amount: 150.00
        }
      });
      
      const correctlyBlocked = result.error && (
        result.error.message.includes('BUSINESS_OPERATIONS_NOT_ALLOWED_IN_PLATFORM_ORG') ||
        result.error.message.includes('enforce_actor_requirement') ||
        result.error.message.includes('INVALID_ORGANIZATION')
      );
      
      logTest('Platform Business Block', correctlyBlocked, 
               correctlyBlocked ? 'Business operation correctly blocked' : 'Should be blocked');
    } catch (error) {
      const correctlyBlocked = error.message.includes('BUSINESS_OPERATIONS_NOT_ALLOWED_IN_PLATFORM_ORG') ||
                              error.message.includes('enforce_actor_requirement') ||
                              error.message.includes('INVALID_ORGANIZATION');
      
      logTest('Platform Business Block', correctlyBlocked, 
               correctlyBlocked ? 'Business operation correctly blocked' : `Wrong error: ${error.message}`);
    }
    
    console.log('\n📋 PHASE 4: INVALID ACTOR SCENARIOS (Should FAIL)');
    
    // Test 5: NULL UUID actor (should FAIL)
    console.log('\n🧪 Test 5: NULL UUID actor (should FAIL)...');
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
      
      const correctlyBlocked = result.error && (
        result.error.message.includes('INVALID_ACTOR_NULL_UUID') ||
        result.error.message.includes('ACTOR_USER_ID_REQUIRED') ||
        result.error.message.includes('enforce_actor_requirement')
      );
      
      logTest('NULL UUID Block', correctlyBlocked, 
               correctlyBlocked ? 'NULL UUID correctly blocked' : 'Should be blocked');
    } catch (error) {
      const correctlyBlocked = error.message.includes('INVALID_ACTOR_NULL_UUID') ||
                              error.message.includes('ACTOR_USER_ID_REQUIRED') ||
                              error.message.includes('enforce_actor_requirement');
      
      logTest('NULL UUID Block', correctlyBlocked, 
               correctlyBlocked ? 'NULL UUID correctly blocked' : `Wrong error: ${error.message}`);
    }
    
    // Test 6: Fake actor (should FAIL)
    console.log('\n🧪 Test 6: Fake actor (should FAIL)...');
    try {
      const result = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'READ',
        p_actor_user_id: '99999999-9999-9999-9999-999999999999',
        p_organization_id: testData.organization_id,
        p_transaction: {},
        p_options: { limit: 1 }
      });
      
      const correctlyBlocked = result.error && (
        result.error.message.includes('ACTOR_ENTITY_NOT_FOUND') ||
        result.error.message.includes('ACTOR_NOT_MEMBER') ||
        result.error.message.includes('enforce_actor_requirement')
      );
      
      logTest('Fake Actor Block', correctlyBlocked, 
               correctlyBlocked ? 'Fake actor correctly blocked' : 'Should be blocked');
    } catch (error) {
      const correctlyBlocked = error.message.includes('ACTOR_ENTITY_NOT_FOUND') ||
                              error.message.includes('ACTOR_NOT_MEMBER') ||
                              error.message.includes('enforce_actor_requirement');
      
      logTest('Fake Actor Block', correctlyBlocked, 
               correctlyBlocked ? 'Fake actor correctly blocked' : `Wrong error: ${error.message}`);
    }
    
    // Test 7: Cross-organization access (should FAIL)
    console.log('\n🧪 Test 7: Cross-organization access (should FAIL)...');
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
      
      const correctlyBlocked = result.error && (
        result.error.message.includes('ACTOR_NOT_MEMBER') ||
        result.error.message.includes('ORGANIZATION_ENTITY_NOT_FOUND') ||
        result.error.message.includes('enforce_actor_requirement')
      );
      
      logTest('Cross-Org Block', correctlyBlocked, 
               correctlyBlocked ? 'Cross-org access correctly blocked' : 'Should be blocked');
    } catch (error) {
      const correctlyBlocked = error.message.includes('ACTOR_NOT_MEMBER') ||
                              error.message.includes('ORGANIZATION_ENTITY_NOT_FOUND') ||
                              error.message.includes('enforce_actor_requirement');
      
      logTest('Cross-Org Block', correctlyBlocked, 
               correctlyBlocked ? 'Cross-org access correctly blocked' : `Wrong error: ${error.message}`);
    }
    
    // Results Summary
    console.log('\n🎉 SYSTEM-AWARE SECURITY TEST COMPLETED!');
    console.log('═'.repeat(70));
    console.log(`📊 SYSTEM-AWARE SECURITY RESULTS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${totalTests - passedTests}`);
    console.log(`   📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('\n🟢 100% SUCCESS - SYSTEM-AWARE SECURITY WORKING PERFECTLY!');
      console.log('🛡️ All security scenarios correctly handled');
      console.log('✅ Platform org rules properly enforced');
      console.log('✅ Tenant org operations working correctly');
      console.log('✅ Invalid actors properly blocked');
      console.log('🚀 Ready for 100% enterprise test success rate');
      
      console.log('\n📋 SYSTEM-AWARE FEATURES CONFIRMED:');
      console.log('   ✅ Platform Org + System Operation = ALLOWED');
      console.log('   ✅ Platform Org + Business Operation = BLOCKED');
      console.log('   ✅ Tenant Org + Valid Actor + Any Operation = ALLOWED');
      console.log('   ✅ NULL UUID Actor + Any Operation = BLOCKED');
      console.log('   ✅ Fake Actor + Any Operation = BLOCKED');
      console.log('   ✅ Cross-Org Access = BLOCKED');
      
      return true;
    } else if (passedTests >= totalTests * 0.8) {
      console.log('\n🟡 MOSTLY SUCCESSFUL - Minor issues remain');
      console.log('🔍 Review failed tests and enhance validation further');
      console.log('💡 May need to deploy enhanced security function to Supabase');
      
      return false;
    } else {
      console.log('\n🟠 PARTIAL SUCCESS - Significant issues remain');
      console.log('🔍 Enhanced security function needs deployment to Supabase');
      console.log('💡 Current function lacks system-aware logic');
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ System-aware security test failed:', error.message);
    return false;
  }
}

testSystemAwareSecurity();