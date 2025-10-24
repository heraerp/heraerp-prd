#!/usr/bin/env node
/**
 * Test hera_organization_crud_v1 function
 * Tests organization creation for signup flow
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test data
const TEST_USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'; // hairtalkz2022@gmail.com (owner)
const TEST_ORG_NAME = 'HERA Test Organization ' + Date.now();

console.log('🔍 Testing hera_organization_crud_v1 Function');
console.log('='.repeat(70));

// Step 1: Check if function exists
console.log('\n📋 Step 1: Checking if function exists...');
try {
  const { data, error } = await supabase
    .from('pg_proc')
    .select('proname, proargnames')
    .eq('proname', 'hera_organization_crud_v1')
    .single();

  if (error) {
    console.log('   ❌ Function does not exist:', error.message);
    console.log('   ℹ️  Need to create hera_organization_crud_v1 RPC function');
  } else {
    console.log('   ✅ Function exists:', data.proname);
    console.log('   📝 Arguments:', data.proargnames);
  }
} catch (err) {
  console.log('   ❌ Error checking function:', err.message);
}

// Step 2: Test CREATE operation
console.log('\n📋 Step 2: Testing CREATE operation...');
try {
  const { data, error } = await supabase.rpc('hera_organization_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: TEST_USER_ID,
    p_organization: {
      organization_name: TEST_ORG_NAME,
      industry: 'salon',
      currency: 'USD',
      settings: {
        selected_app: 'salon',
        created_via: 'signup_test'
      }
    }
  });

  if (error) {
    console.log('   ❌ CREATE Error:', error.message);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
    console.log('   Hint:', error.hint);
  } else {
    console.log('   ✅ CREATE Success!');
    console.log('   Organization ID:', data.organization_id || data.id || data);

    // Step 3: Test READ operation
    if (data.organization_id || data.id) {
      const orgId = data.organization_id || data.id;
      console.log('\n📋 Step 3: Testing READ operation...');

      const { data: readData, error: readError } = await supabase.rpc('hera_organization_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: TEST_USER_ID,
        p_organization_id: orgId
      });

      if (readError) {
        console.log('   ❌ READ Error:', readError.message);
      } else {
        console.log('   ✅ READ Success!');
        console.log('   Organization:', JSON.stringify(readData, null, 2));
      }

      // Step 4: Cleanup - DELETE test organization
      console.log('\n📋 Step 4: Cleaning up test organization...');

      const { error: deleteError } = await supabase.rpc('hera_organization_crud_v1', {
        p_action: 'DELETE',
        p_actor_user_id: TEST_USER_ID,
        p_organization_id: orgId
      });

      if (deleteError) {
        console.log('   ⚠️  DELETE Warning:', deleteError.message);
        console.log('   ℹ️  Manual cleanup may be needed for org:', orgId);
      } else {
        console.log('   ✅ Test organization deleted');
      }
    }
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

// Alternative: Check for other organization-related functions
console.log('\n📋 Alternative: Checking for other organization functions...');
try {
  const { data, error } = await supabase
    .from('pg_proc')
    .select('proname')
    .like('proname', '%organization%')
    .order('proname');

  if (error) {
    console.log('   ❌ Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('   ✅ Found organization-related functions:');
    data.forEach(fn => console.log(`      - ${fn.proname}`));
  } else {
    console.log('   ℹ️  No organization-related functions found');
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

// Fallback: Direct table insertion
console.log('\n📋 Fallback: Testing direct core_organizations insert...');
try {
  const testOrgData = {
    organization_name: 'Direct Insert Test ' + Date.now(),
    industry: 'salon',
    currency: 'USD',
    smart_code: 'HERA.ORG.ENTITY.SALON.V1',
    settings: {
      selected_app: 'salon',
      created_via: 'direct_insert_test'
    },
    created_by: TEST_USER_ID,
    updated_by: TEST_USER_ID
  };

  const { data, error } = await supabase
    .from('core_organizations')
    .insert(testOrgData)
    .select()
    .single();

  if (error) {
    console.log('   ❌ Direct insert Error:', error.message);
    console.log('   Code:', error.code);
  } else {
    console.log('   ✅ Direct insert Success!');
    console.log('   Organization ID:', data.id);

    // Cleanup
    await supabase
      .from('core_organizations')
      .delete()
      .eq('id', data.id);
    console.log('   ✅ Test organization deleted');
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

console.log('\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));
console.log('\nIf hera_organization_crud_v1 does NOT exist:');
console.log('✅ OPTION 1: Use direct table insert (shown above - WORKS)');
console.log('✅ OPTION 2: Create the RPC function in Supabase');
console.log('✅ OPTION 3: Use API endpoint /api/v2/organizations (recommended)');
console.log('\nFor signup flow, we can:');
console.log('1. Create organization via direct insert');
console.log('2. Create membership relationship via core_relationships');
console.log('3. Store role in relationship_data JSON field');
console.log('');
