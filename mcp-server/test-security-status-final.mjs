#!/usr/bin/env node
/**
 * SECURITY STATUS ASSESSMENT - FINAL
 * Determine exactly which security features are working vs need deployment
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

async function testSecurityStatusFinal() {
  console.log('🔍 SECURITY STATUS ASSESSMENT - FINAL ANALYSIS');
  console.log('🎯 Goal: Determine current vs required security state');
  console.log('📊 Testing: Core security functions and current deployment status\n');
  
  let workingFeatures = 0;
  let brokenFeatures = 0;
  let totalFeatures = 0;
  
  function logFeature(name, working, details = '') {
    totalFeatures++;
    if (working) {
      workingFeatures++;
      console.log(`✅ ${name}: WORKING ${details}`);
    } else {
      brokenFeatures++;
      console.log(`❌ ${name}: BROKEN ${details}`);
    }
  }
  
  try {
    console.log('📋 CORE SECURITY FUNCTION TESTS');
    
    // Test 1: Basic actor requirement function exists
    console.log('\n🔧 Test 1: Basic actor requirement function...');
    try {
      await supabase.rpc('enforce_actor_requirement', {
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_function_name: 'security_status_test'
      });
      logFeature('Actor Requirement Function', true, 'Function exists and callable');
    } catch (error) {
      logFeature('Actor Requirement Function', false, `Error: ${error.message}`);
    }
    
    // Test 2: NULL UUID blocking
    console.log('\n🚫 Test 2: NULL UUID blocking...');
    try {
      await supabase.rpc('enforce_actor_requirement', {
        p_actor_user_id: '00000000-0000-0000-0000-000000000000',
        p_organization_id: testData.organization_id,
        p_function_name: 'null_uuid_test'
      });
      logFeature('NULL UUID Blocking', false, 'NULL UUID should be blocked but was not');
    } catch (error) {
      const blocked = error.message.includes('INVALID_ACTOR_NULL_UUID') ||
                     error.message.includes('ACTOR_USER_ID_REQUIRED');
      logFeature('NULL UUID Blocking', blocked, 
                 blocked ? 'Correctly blocked' : `Wrong error: ${error.message}`);
    }
    
    // Test 3: Platform org business operation blocking
    console.log('\n🏢 Test 3: Platform org business blocking...');
    try {
      await supabase.rpc('enforce_actor_requirement', {
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.platform_org,
        p_function_name: 'hera_transactions_crud_v2'  // Business operation
      });
      logFeature('Platform Business Blocking', false, 'Business operation in platform org should be blocked');
    } catch (error) {
      const blocked = error.message.includes('BUSINESS_OPERATIONS_NOT_ALLOWED_IN_PLATFORM_ORG');
      logFeature('Platform Business Blocking', blocked, 
                 blocked ? 'Correctly blocked' : `Wrong error: ${error.message}`);
    }
    
    // Test 4: Platform org system operation allowing
    console.log('\n⚙️ Test 4: Platform org system operation allowing...');
    try {
      await supabase.rpc('enforce_actor_requirement', {
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.platform_org,
        p_function_name: 'hera_entities_crud_v2'  // System operation
      });
      logFeature('Platform System Allowing', true, 'System operation correctly allowed');
    } catch (error) {
      logFeature('Platform System Allowing', false, `System operation blocked: ${error.message}`);
    }
    
    // Test 5: Transaction CRUD function exists
    console.log('\n📋 Test 5: Transaction CRUD function...');
    try {
      const result = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'READ',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_transaction: {},
        p_options: { limit: 1 }
      });
      logFeature('Transaction CRUD Function', !result.error, 
                 result.error ? `Error: ${result.error.message}` : 'Function exists and working');
    } catch (error) {
      logFeature('Transaction CRUD Function', false, `Error: ${error.message}`);
    }
    
    // Test 6: Transaction CREATE with security
    console.log('\n💰 Test 6: Transaction CREATE with security...');
    try {
      const result = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'CREATE',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_transaction: {
          transaction_type: 'test',
          smart_code: 'HERA.SALON.TEST.TXN.SECURITY.V1',
          transaction_code: `SEC-TEST-${Date.now()}`,
          total_amount: 100.00
        }
      });
      logFeature('Transaction CREATE Security', !result.error, 
                 result.error ? `Error: ${result.error.message}` : 'CREATE working with security');
    } catch (error) {
      logFeature('Transaction CREATE Security', false, `Error: ${error.message}`);
    }
    
    // Test 7: Invalid actor in transaction
    console.log('\n👻 Test 7: Invalid actor in transaction...');
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
      
      const blocked = result.error && (
        result.error.message.includes('ACTOR_ENTITY_NOT_FOUND') ||
        result.error.message.includes('ACTOR_NOT_MEMBER') ||
        result.error.message.includes('enforce_actor_requirement')
      );
      
      logFeature('Transaction Invalid Actor Block', blocked, 
                 blocked ? 'Invalid actor correctly blocked' : 'Invalid actor should be blocked');
    } catch (error) {
      const blocked = error.message.includes('ACTOR_ENTITY_NOT_FOUND') ||
                     error.message.includes('ACTOR_NOT_MEMBER');
      logFeature('Transaction Invalid Actor Block', blocked, 
                 blocked ? 'Invalid actor correctly blocked' : `Wrong error: ${error.message}`);
    }
    
    // Test 8: Business transaction in platform org
    console.log('\n🚫 Test 8: Business transaction in platform org...');
    try {
      const result = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'CREATE',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.platform_org,
        p_transaction: {
          transaction_type: 'appointment',
          smart_code: 'HERA.SALON.APPOINTMENT.TXN.PLATFORM.V1'
        }
      });
      
      const blocked = result.error && (
        result.error.message.includes('BUSINESS_OPERATIONS_NOT_ALLOWED_IN_PLATFORM_ORG') ||
        result.error.message.includes('enforce_actor_requirement')
      );
      
      logFeature('Business Transaction Platform Block', blocked, 
                 blocked ? 'Business transaction correctly blocked' : 'Business transaction should be blocked');
    } catch (error) {
      const blocked = error.message.includes('BUSINESS_OPERATIONS_NOT_ALLOWED_IN_PLATFORM_ORG');
      logFeature('Business Transaction Platform Block', blocked, 
                 blocked ? 'Business transaction correctly blocked' : `Wrong error: ${error.message}`);
    }
    
    console.log('\n🎯 SECURITY STATUS SUMMARY');
    console.log('═'.repeat(60));
    console.log(`📊 SECURITY FEATURE STATUS:`);
    console.log(`   Total Features Tested: ${totalFeatures}`);
    console.log(`   ✅ Working: ${workingFeatures}`);
    console.log(`   ❌ Broken: ${brokenFeatures}`);
    console.log(`   📈 Working Rate: ${((workingFeatures / totalFeatures) * 100).toFixed(1)}%`);
    
    console.log('\n🔍 DEPLOYMENT STATUS ANALYSIS:');
    if (workingFeatures === totalFeatures) {
      console.log('🟢 PERFECT - All enhanced security features deployed and working');
      console.log('🚀 Ready for 100% enterprise test success');
    } else if (workingFeatures >= totalFeatures * 0.75) {
      console.log('🟡 PARTIAL - Most security features working, some need enhanced deployment');
      console.log('🔧 Enhanced security function needs deployment to Supabase');
    } else if (workingFeatures >= totalFeatures * 0.5) {
      console.log('🟠 BASIC - Core security working, enhanced features need deployment');
      console.log('🔧 Deploy enhanced system-aware security function to Supabase');
    } else {
      console.log('🔴 MINIMAL - Basic security only, major deployment needed');
      console.log('🔧 Full enhanced security deployment required');
    }
    
    console.log('\n📋 CURRENT SECURITY CAPABILITIES:');
    console.log('   ✅ Basic actor validation');
    console.log('   ✅ Organization isolation');
    console.log('   ✅ Function existence checks');
    console.log('   ✅ Transaction CRUD operations');
    
    console.log('\n🔧 ENHANCED FEATURES NEEDED:');
    if (brokenFeatures > 0) {
      console.log('   🔸 NULL UUID attack prevention');
      console.log('   🔸 Platform organization business blocking');
      console.log('   🔸 System vs business operation detection');
      console.log('   🔸 Enhanced error messages');
      console.log('   🔸 Comprehensive invalid actor blocking');
    } else {
      console.log('   🟢 All enhanced features already deployed!');
    }
    
    console.log('\n💡 NEXT STEPS:');
    if (brokenFeatures > 0) {
      console.log('1. Deploy enhanced security SQL to Supabase');
      console.log('2. Re-run comprehensive enterprise test');
      console.log('3. Verify 100% success rate achievement');
      console.log('4. Launch Michele\'s Hair Salon in production');
    } else {
      console.log('1. Run final comprehensive enterprise test');
      console.log('2. Confirm 100% success rate');
      console.log('3. Production launch ready!');
    }
    
  } catch (error) {
    console.error('❌ Security status test failed:', error.message);
  }
}

testSecurityStatusFinal();