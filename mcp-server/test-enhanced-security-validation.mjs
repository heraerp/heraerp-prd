#!/usr/bin/env node
/**
 * ENHANCED SECURITY VALIDATION TEST
 * Testing: Fix for 100% test success rate by strengthening invalid actor detection
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

async function testEnhancedSecurityValidation() {
  console.log('🛡️ ENHANCED SECURITY VALIDATION TEST');
  console.log('🎯 Goal: Fix invalid actor validation for 100% test success');
  console.log('📊 Testing: NULL UUIDs, fake actors, platform org access\n');
  
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
    // First, deploy the enhanced security function
    console.log('🔧 Step 1: Deploy enhanced security validation...');
    const deployResult = await supabase.rpc('exec_sql', {
      sql: `
        -- Deploy enhanced actor security validation
        CREATE OR REPLACE FUNCTION enforce_actor_requirement(
          p_actor_user_id uuid,
          p_organization_id uuid,
          p_function_name text DEFAULT 'unknown_function'
        ) RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        DECLARE
          v_membership_exists boolean := false;
          v_actor_entity_exists boolean := false;
          v_org_entity_exists boolean := false;
          v_actor_type text;
          v_org_type text;
        BEGIN
          -- ENHANCED: Validate required parameters with detailed error handling
          IF p_actor_user_id IS NULL THEN
            RAISE EXCEPTION USING 
              ERRCODE='22023', 
              MESSAGE='ACTOR_USER_ID_REQUIRED',
              DETAIL=format('Function %s requires a valid actor_user_id for audit trail', p_function_name),
              HINT='All database operations require actor identification for security';
          END IF;
          
          IF p_organization_id IS NULL THEN
            RAISE EXCEPTION USING 
              ERRCODE='22023', 
              MESSAGE='ORGANIZATION_ID_REQUIRED',
              DETAIL=format('Function %s requires a valid organization_id for tenant isolation', p_function_name),
              HINT='All operations must be scoped to an organization';
          END IF;
          
          -- ENHANCED: Check for invalid/malicious UUIDs
          IF p_actor_user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
            RAISE EXCEPTION USING 
              ERRCODE='42501', 
              MESSAGE='INVALID_ACTOR_NULL_UUID',
              DETAIL='Actor cannot be null UUID (00000000-0000-0000-0000-000000000000)',
              HINT='Use a valid user entity UUID for actor identification';
          END IF;
          
          IF p_organization_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
            RAISE EXCEPTION USING 
              ERRCODE='42501', 
              MESSAGE='INVALID_ORGANIZATION_PLATFORM_UUID',
              DETAIL='Cannot perform business operations in platform organization',
              HINT='Use a valid tenant organization UUID';
          END IF;
          
          -- ENHANCED: Step 1 - Verify actor entity exists with type validation
          SELECT e.entity_type
          FROM core_entities e
          WHERE e.id = p_actor_user_id
            AND e.entity_type = 'USER'
            AND e.organization_id IN (
              '00000000-0000-0000-0000-000000000000'::uuid, -- Platform org
              p_organization_id
            )
          INTO v_actor_type;
          
          IF v_actor_type IS NULL THEN
            -- Check if entity exists but wrong type
            SELECT e.entity_type
            FROM core_entities e
            WHERE e.id = p_actor_user_id
            INTO v_actor_type;
            
            IF v_actor_type IS NOT NULL THEN
              RAISE EXCEPTION USING 
                ERRCODE='42501', 
                MESSAGE='INVALID_ACTOR_ENTITY_TYPE',
                DETAIL=format('Actor %s exists but is type %s, not USER', p_actor_user_id, v_actor_type),
                HINT='Actor must be a USER entity type';
            ELSE
              RAISE EXCEPTION USING 
                ERRCODE='42501', 
                MESSAGE='ACTOR_ENTITY_NOT_FOUND',
                DETAIL=format('Actor entity %s does not exist in any accessible organization', p_actor_user_id),
                HINT='Actor must be a valid USER entity in platform or target organization';
            END IF;
          END IF;
          
          -- ENHANCED: Step 2 - Verify organization entity exists with type validation
          SELECT e.entity_type
          FROM core_entities e
          WHERE e.id = p_organization_id
            AND e.entity_type = 'ORGANIZATION'
          INTO v_org_type;
          
          IF v_org_type IS NULL THEN
            RAISE EXCEPTION USING 
              ERRCODE='42501', 
              MESSAGE='ORGANIZATION_ENTITY_NOT_FOUND',
              DETAIL=format('Organization entity %s does not exist', p_organization_id),
              HINT='Organization must be a valid ORGANIZATION entity';
          END IF;
          
          -- ENHANCED: Step 3 - Check membership relationship with detailed validation
          SELECT EXISTS (
            SELECT 1 
            FROM core_relationships r
            WHERE r.source_entity_id = p_actor_user_id
              AND r.target_entity_id = p_organization_id
              AND r.relationship_type IN ('MEMBER_OF', 'USER_MEMBER_OF_ORG')
              AND r.is_active = true
              AND (
                r.organization_id = '00000000-0000-0000-0000-000000000000'::uuid OR
                r.organization_id = p_organization_id
              )
          ) INTO v_membership_exists;
          
          -- ENHANCED: If no membership found, provide detailed error
          IF NOT v_membership_exists THEN
            RAISE EXCEPTION USING 
              ERRCODE='42501', 
              MESSAGE='ACTOR_NOT_MEMBER_OF_ORGANIZATION',
              DETAIL=format('Actor %s (USER) is not a member of organization %s (ORGANIZATION) - function: %s', 
                            p_actor_user_id, p_organization_id, p_function_name),
              HINT='User must have active MEMBER_OF or USER_MEMBER_OF_ORG relationship with the organization';
          END IF;
          
          -- Validation passed
          RETURN;
        END;
        $$;
      `
    });
    
    if (!deployResult.error) {
      console.log('✅ Enhanced security function deployed successfully\n');
    } else {
      console.log('❌ Failed to deploy enhanced security:', deployResult.error.message);
      return;
    }
    
    // Test 1: Valid Michele actor (should PASS)
    console.log('📋 SECURITY TEST SUITE - ENHANCED VALIDATION');
    console.log('\n🧪 Test 1: Valid Michele actor (should PASS)...');
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
      
      logTest('Valid Actor Test', !result.error, result.error ? result.error.message : 'Michele accepted');
    } catch (error) {
      logTest('Valid Actor Test', false, error.message);
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
      
      const correctlyRejected = result.error && result.error.message.includes('INVALID_ACTOR_NULL_UUID');
      logTest('NULL UUID Actor Test', correctlyRejected, 
               correctlyRejected ? 'Correctly rejected' : 'Should be rejected');
    } catch (error) {
      const correctlyRejected = error.message.includes('INVALID_ACTOR_NULL_UUID');
      logTest('NULL UUID Actor Test', correctlyRejected, 
               correctlyRejected ? 'Correctly rejected' : 'Wrong error: ' + error.message);
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
      
      const correctlyRejected = result.error && 
        (result.error.message.includes('ACTOR_ENTITY_NOT_FOUND') || 
         result.error.message.includes('ACTOR_NOT_MEMBER'));
      logTest('Fake Actor Test', correctlyRejected, 
               correctlyRejected ? 'Correctly rejected' : 'Should be rejected');
    } catch (error) {
      const correctlyRejected = error.message.includes('ACTOR_ENTITY_NOT_FOUND') || 
                               error.message.includes('ACTOR_NOT_MEMBER');
      logTest('Fake Actor Test', correctlyRejected, 
               correctlyRejected ? 'Correctly rejected' : 'Wrong error: ' + error.message);
    }
    
    // Test 4: Platform organization access (should FAIL)
    console.log('\n🧪 Test 4: Platform org access (should FAIL)...');
    try {
      const result = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'CREATE',
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: '00000000-0000-0000-0000-000000000000',
        p_transaction: {
          transaction_type: 'test',
          smart_code: 'HERA.SALON.TEST.TXN.PLATFORM.V1'
        }
      });
      
      const correctlyRejected = result.error && result.error.message.includes('INVALID_ORGANIZATION_PLATFORM_UUID');
      logTest('Platform Org Test', correctlyRejected, 
               correctlyRejected ? 'Correctly rejected' : 'Should be rejected');
    } catch (error) {
      const correctlyRejected = error.message.includes('INVALID_ORGANIZATION_PLATFORM_UUID');
      logTest('Platform Org Test', correctlyRejected, 
               correctlyRejected ? 'Correctly rejected' : 'Wrong error: ' + error.message);
    }
    
    // Test 5: Cross-organization actor access (should FAIL)
    console.log('\n🧪 Test 5: Cross-org actor access (should FAIL)...');
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
      
      const correctlyRejected = result.error && 
        (result.error.message.includes('ACTOR_NOT_MEMBER') || 
         result.error.message.includes('ORGANIZATION_ENTITY_NOT_FOUND'));
      logTest('Cross-Org Access Test', correctlyRejected, 
               correctlyRejected ? 'Correctly rejected' : 'Should be rejected');
    } catch (error) {
      const correctlyRejected = error.message.includes('ACTOR_NOT_MEMBER') || 
                               error.message.includes('ORGANIZATION_ENTITY_NOT_FOUND');
      logTest('Cross-Org Access Test', correctlyRejected, 
               correctlyRejected ? 'Correctly rejected' : 'Wrong error: ' + error.message);
    }
    
    // Final Results
    console.log('\n🎉 ENHANCED SECURITY VALIDATION COMPLETED!');
    console.log('═'.repeat(60));
    console.log(`📊 SECURITY TEST RESULTS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${totalTests - passedTests}`);
    console.log(`   📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('\n🟢 100% SUCCESS - ENHANCED SECURITY VALIDATION WORKING!');
      console.log('🛡️ All invalid actor attempts correctly rejected');
      console.log('✅ Michele (valid actor) correctly accepted');
      console.log('🚀 Ready for 100% enterprise test success rate');
    } else {
      console.log('\n🟡 NEEDS ATTENTION - Some security tests failed');
      console.log('🔍 Review failed tests and enhance validation further');
    }
    
    console.log('\n🔒 SECURITY FEATURES ENHANCED:');
    console.log('   ✅ NULL UUID detection and blocking');
    console.log('   ✅ Platform organization access prevention');
    console.log('   ✅ Non-existent actor detection');
    console.log('   ✅ Cross-organization access prevention');
    console.log('   ✅ Entity type validation (USER, ORGANIZATION)');
    console.log('   ✅ Detailed error messages for debugging');
    console.log('   ✅ Comprehensive membership validation');
    
  } catch (error) {
    console.error('❌ Enhanced security validation test failed:', error.message);
  }
}

testEnhancedSecurityValidation();