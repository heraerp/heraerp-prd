#!/usr/bin/env node
/**
 * DIAGNOSE SECURITY ISSUE
 * Check why security validation isn't working properly
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

async function diagnoseSecurity() {
  console.log('🔍 DIAGNOSING SECURITY VALIDATION ISSUE...');
  console.log('🎯 Goal: Understand why invalid actors are not being rejected\n');
  
  try {
    // Test 1: Check if enforce_actor_requirement function exists and its definition
    console.log('📋 Step 1: Check enforce_actor_requirement function...');
    const functionCheck = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_definition')
      .eq('routine_name', 'enforce_actor_requirement');
    
    if (functionCheck.data && functionCheck.data.length > 0) {
      console.log('✅ enforce_actor_requirement function exists');
      console.log('📋 Function found in schema');
    } else {
      console.log('❌ enforce_actor_requirement function NOT found');
      console.log('💡 This explains why security validation is not working');
    }
    
    // Test 2: Direct test of enforce_actor_requirement function  
    console.log('\n📋 Step 2: Direct test of security function...');
    try {
      const validTest = await supabase.rpc('enforce_actor_requirement', {
        p_actor_user_id: testData.user_entity_id,
        p_organization_id: testData.organization_id,
        p_function_name: 'diagnostic_test'
      });
      
      if (!validTest.error) {
        console.log('✅ Valid actor (Michele) passes security check');
      } else {
        console.log('❌ Valid actor failed security check:', validTest.error.message);
      }
    } catch (error) {
      console.log('❌ Error calling enforce_actor_requirement:', error.message);
    }
    
    // Test 3: Try invalid actor
    console.log('\n📋 Step 3: Test invalid actor directly...');
    try {
      const invalidTest = await supabase.rpc('enforce_actor_requirement', {
        p_actor_user_id: '00000000-0000-0000-0000-000000000000',
        p_organization_id: testData.organization_id,
        p_function_name: 'diagnostic_test_invalid'
      });
      
      if (invalidTest.error) {
        console.log('✅ Invalid actor (NULL UUID) correctly rejected:', invalidTest.error.message);
      } else {
        console.log('❌ Invalid actor (NULL UUID) was NOT rejected - security gap!');
      }
    } catch (error) {
      console.log('✅ Invalid actor correctly rejected with exception:', error.message);
    }
    
    // Test 4: Check hera_transactions_crud_v2 function definition
    console.log('\n📋 Step 4: Check transaction CRUD function...');
    const crudCheck = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'hera_transactions_crud_v2');
    
    if (crudCheck.data && crudCheck.data.length > 0) {
      console.log('✅ hera_transactions_crud_v2 function exists');
    } else {
      console.log('❌ hera_transactions_crud_v2 function NOT found');
    }
    
    // Test 5: Simple entity check
    console.log('\n📋 Step 5: Check if Michele exists as USER entity...');
    const micheleCheck = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, organization_id')
      .eq('id', testData.user_entity_id);
    
    if (micheleCheck.data && micheleCheck.data.length > 0) {
      const michele = micheleCheck.data[0];
      console.log('✅ Michele entity found:');
      console.log(`   ID: ${michele.id}`);
      console.log(`   Type: ${michele.entity_type}`);
      console.log(`   Name: ${michele.entity_name}`);
      console.log(`   Org: ${michele.organization_id}`);
    } else {
      console.log('❌ Michele entity NOT found');
    }
    
    // Test 6: Check organization entity
    console.log('\n📋 Step 6: Check Hair Talkz organization...');
    const orgCheck = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name')
      .eq('id', testData.organization_id);
    
    if (orgCheck.data && orgCheck.data.length > 0) {
      const org = orgCheck.data[0];
      console.log('✅ Organization entity found:');
      console.log(`   ID: ${org.id}`);
      console.log(`   Type: ${org.entity_type}`);
      console.log(`   Name: ${org.entity_name}`);
    } else {
      console.log('❌ Organization entity NOT found');
    }
    
    // Test 7: Check membership relationship
    console.log('\n📋 Step 7: Check Michele membership in Hair Talkz...');
    const membershipCheck = await supabase
      .from('core_relationships')
      .select('source_entity_id, target_entity_id, relationship_type, is_active, organization_id')
      .eq('source_entity_id', testData.user_entity_id)
      .eq('target_entity_id', testData.organization_id);
    
    if (membershipCheck.data && membershipCheck.data.length > 0) {
      console.log('✅ Membership relationship found:');
      membershipCheck.data.forEach((rel, i) => {
        console.log(`   ${i+1}. Type: ${rel.relationship_type}, Active: ${rel.is_active}, Org: ${rel.organization_id}`);
      });
    } else {
      console.log('❌ No membership relationship found - this could be the issue!');
    }
    
    console.log('\n🔍 DIAGNOSTIC SUMMARY:');
    console.log('Based on the above checks, the security validation issue is likely due to:');
    console.log('1. Missing or outdated enforce_actor_requirement function');
    console.log('2. Function exists but not being called properly');
    console.log('3. Missing membership relationships');
    console.log('4. Function permissions issue');
    
    console.log('\n💡 RECOMMENDED FIXES:');
    console.log('1. Deploy enhanced enforce_actor_requirement function');
    console.log('2. Verify function is called in hera_transactions_crud_v2');
    console.log('3. Check membership relationships exist');
    console.log('4. Test function permissions and access');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

diagnoseSecurity();