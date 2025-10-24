#!/usr/bin/env node
/**
 * Test hera_organization_create_v1 function
 * Based on the hint from the previous test
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test data
const TEST_USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'; // hairtalkz2022@gmail.com (owner)
const TEST_ORG_NAME = 'HERA Test Org ' + Date.now();

console.log('🔍 Testing hera_organization_create_v1 Function');
console.log('='.repeat(70));

// Test 1: Try with minimal parameters
console.log('\n📋 Test 1: Minimal parameters...');
try {
  const { data, error } = await supabase.rpc('hera_organization_create_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_organization_name: TEST_ORG_NAME
  });

  if (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
    console.log('   Hint:', error.hint);
  } else {
    console.log('   ✅ Success!');
    console.log('   Result:', JSON.stringify(data, null, 2));
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

// Test 2: Try with settings
console.log('\n📋 Test 2: With settings parameter...');
try {
  const { data, error } = await supabase.rpc('hera_organization_create_v1', {
    p_actor_user_id: TEST_USER_ID,
    p_organization_name: TEST_ORG_NAME + ' Settings',
    p_settings: {
      industry: 'salon',
      currency: 'USD',
      selected_app: 'salon',
      created_via: 'signup_test'
    }
  });

  if (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   Code:', error.code);
  } else {
    console.log('   ✅ Success!');
    console.log('   Organization ID:', data?.organization_id || data?.id || data);

    if (data?.organization_id || data?.id) {
      const orgId = data.organization_id || data.id;

      // Read back the organization
      console.log('\n📋 Reading back organization...');
      const { data: orgData, error: readError } = await supabase
        .from('core_organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (readError) {
        console.log('   ❌ Read Error:', readError.message);
      } else {
        console.log('   ✅ Organization data:');
        console.log('      Name:', orgData.organization_name);
        console.log('      Smart Code:', orgData.smart_code);
        console.log('      Settings:', JSON.stringify(orgData.settings, null, 2));
        console.log('      Created By:', orgData.created_by);
      }

      // Check if membership was created
      console.log('\n📋 Checking membership relationship...');
      const { data: membership, error: memberError } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('from_entity_id', TEST_USER_ID)
        .eq('to_entity_id', orgId)
        .eq('relationship_type', 'MEMBER_OF');

      if (memberError) {
        console.log('   ❌ Membership Error:', memberError.message);
      } else if (membership && membership.length > 0) {
        console.log('   ✅ Membership exists!');
        console.log('      Role:', membership[0].relationship_data?.role);
        console.log('      Organization:', membership[0].organization_id);
      } else {
        console.log('   ℹ️  No membership relationship found');
        console.log('      Need to create it separately');
      }

      // Cleanup
      console.log('\n📋 Cleaning up test organization...');
      const { error: deleteError } = await supabase
        .from('core_organizations')
        .delete()
        .eq('id', orgId);

      if (deleteError) {
        console.log('   ⚠️  Cleanup warning:', deleteError.message);
      } else {
        console.log('   ✅ Test organization deleted');
      }
    }
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

// Test 3: Check actual function signature
console.log('\n📋 Test 3: Trying to get function signature...');
try {
  // Try calling with empty params to see what it expects
  const { error } = await supabase.rpc('hera_organization_create_v1');

  if (error) {
    console.log('   ℹ️  Function expects:', error.message);
    console.log('   Details:', error.details);
  }
} catch (err) {
  console.log('   ℹ️  Info:', err.message);
}

console.log('\n' + '='.repeat(70));
console.log('📊 SUMMARY');
console.log('='.repeat(70));
console.log('\nFunction: hera_organization_create_v1');
console.log('Purpose: Create organization with automatic owner membership');
console.log('\nNext steps for signup flow:');
console.log('1. Use hera_organization_create_v1 if it works');
console.log('2. Verify it creates the membership relationship automatically');
console.log('3. If not, create membership separately via core_relationships');
console.log('');
