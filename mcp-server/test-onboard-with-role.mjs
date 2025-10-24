#!/usr/bin/env node
/**
 * Test hera_onboard_user_v1 with role parameter
 * Check if it supports setting role in relationship_data
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Testing hera_onboard_user_v1 with Role Parameter');
console.log('='.repeat(70));

const ACTOR_USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'; // hairtalkz2022@gmail.com (owner)
const EXISTING_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // Hair Talkz

console.log('\n📋 Step 1: Creating test user...');

const testEmail = 'test-role-' + Date.now() + '@heratest.com';

try {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'TestPassword123!',
    email_confirm: true
  });

  if (authError) {
    console.log('   ❌ Error:', authError.message);
    process.exit(1);
  }

  const newUserId = authData.user.id;
  console.log('   ✅ User created:', newUserId);

  // Test 1: Try with p_role parameter
  console.log('\n📋 Test 1: Calling with p_role parameter...');

  const { data: data1, error: error1 } = await supabase.rpc('hera_onboard_user_v1', {
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: EXISTING_ORG_ID,
    p_supabase_user_id: newUserId,
    p_role: 'manager'
  });

  if (error1) {
    console.log('   ❌ Error:', error1.message);
    console.log('   Code:', error1.code);
  } else {
    console.log('   ✅ Success with p_role!');
    console.log('   Result:', JSON.stringify(data1, null, 2));

    // Check relationship_data
    const { data: rel1 } = await supabase
      .from('core_relationships')
      .select('relationship_data')
      .eq('from_entity_id', newUserId)
      .eq('organization_id', EXISTING_ORG_ID)
      .single();

    console.log('   relationship_data:', JSON.stringify(rel1?.relationship_data, null, 2));

    // Cleanup
    await supabase
      .from('core_relationships')
      .delete()
      .eq('from_entity_id', newUserId);
  }

  // Test 2: Try with p_user_role parameter
  console.log('\n📋 Test 2: Calling with p_user_role parameter...');

  const { data: data2, error: error2 } = await supabase.rpc('hera_onboard_user_v1', {
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: EXISTING_ORG_ID,
    p_supabase_user_id: newUserId,
    p_user_role: 'receptionist'
  });

  if (error2) {
    console.log('   ❌ Error:', error2.message);
  } else {
    console.log('   ✅ Success with p_user_role!');

    const { data: rel2 } = await supabase
      .from('core_relationships')
      .select('relationship_data')
      .eq('from_entity_id', newUserId)
      .eq('organization_id', EXISTING_ORG_ID)
      .single();

    console.log('   relationship_data:', JSON.stringify(rel2?.relationship_data, null, 2));

    // Cleanup
    await supabase
      .from('core_relationships')
      .delete()
      .eq('from_entity_id', newUserId);
  }

  // Test 3: Try with relationship_data parameter
  console.log('\n📋 Test 3: Calling with p_relationship_data parameter...');

  const { data: data3, error: error3 } = await supabase.rpc('hera_onboard_user_v1', {
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: EXISTING_ORG_ID,
    p_supabase_user_id: newUserId,
    p_relationship_data: {
      role: 'owner',
      joined_at: new Date().toISOString(),
      is_primary: true
    }
  });

  if (error3) {
    console.log('   ❌ Error:', error3.message);
  } else {
    console.log('   ✅ Success with p_relationship_data!');

    const { data: rel3 } = await supabase
      .from('core_relationships')
      .select('relationship_data')
      .eq('from_entity_id', newUserId)
      .eq('organization_id', EXISTING_ORG_ID)
      .single();

    console.log('   relationship_data:', JSON.stringify(rel3?.relationship_data, null, 2));

    // Cleanup
    await supabase
      .from('core_relationships')
      .delete()
      .eq('from_entity_id', newUserId);
  }

  // Test 4: Call without role and manually update
  console.log('\n📋 Test 4: Default call + manual update of relationship_data...');

  const { data: data4, error: error4 } = await supabase.rpc('hera_onboard_user_v1', {
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: EXISTING_ORG_ID,
    p_supabase_user_id: newUserId
  });

  if (error4) {
    console.log('   ❌ Error:', error4.message);
  } else {
    console.log('   ✅ Onboarding succeeded');

    // Manually update relationship_data
    const { error: updateError } = await supabase
      .from('core_relationships')
      .update({
        relationship_data: {
          role: 'owner',
          joined_at: new Date().toISOString(),
          is_primary: true
        }
      })
      .eq('from_entity_id', newUserId)
      .eq('organization_id', EXISTING_ORG_ID);

    if (updateError) {
      console.log('   ❌ Update error:', updateError.message);
    } else {
      console.log('   ✅ relationship_data updated successfully');

      // Verify
      const { data: rel4 } = await supabase
        .from('core_relationships')
        .select('relationship_data')
        .eq('from_entity_id', newUserId)
        .eq('organization_id', EXISTING_ORG_ID)
        .single();

      console.log('   relationship_data:', JSON.stringify(rel4?.relationship_data, null, 2));
    }
  }

  // Final cleanup
  console.log('\n📋 Final cleanup...');

  await supabase
    .from('core_relationships')
    .delete()
    .eq('from_entity_id', newUserId);

  await supabase
    .from('core_entities')
    .delete()
    .eq('id', newUserId);

  await supabase.auth.admin.deleteUser(newUserId);

  console.log('   ✅ Cleanup complete');

} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

console.log('\n' + '='.repeat(70));
console.log('📊 RECOMMENDATIONS');
console.log('='.repeat(70));
console.log('\nBased on test results:');
console.log('');
console.log('OPTION 1: If function accepts role parameter:');
console.log('  - Use hera_onboard_user_v1 with role parameter');
console.log('  - Single RPC call, clean and simple');
console.log('');
console.log('OPTION 2: If function does NOT accept role:');
console.log('  - Call hera_onboard_user_v1 without role');
console.log('  - Then UPDATE relationship_data with role');
console.log('  - Two-step process but guaranteed to work');
console.log('');
console.log('OPTION 3: Request function update:');
console.log('  - Ask to modify hera_onboard_user_v1');
console.log('  - Add p_role or p_relationship_data parameter');
console.log('  - Future-proof solution');
console.log('');
