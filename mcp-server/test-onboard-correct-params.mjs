#!/usr/bin/env node
/**
 * Test hera_onboard_user_v1 with correct parameters
 * Based on hint: p_actor_user_id, p_organization_id, p_supabase_user_id
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Testing hera_onboard_user_v1 with Correct Parameters');
console.log('='.repeat(70));
console.log('\nFunction signature (from hint):');
console.log('  hera_onboard_user_v1(p_actor_user_id, p_organization_id, p_supabase_user_id)');
console.log('');

// Test users
const ACTOR_USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'; // hairtalkz2022@gmail.com (owner)
const EXISTING_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // Hair Talkz

// First, create a test user in Supabase auth
console.log('📋 Step 1: Creating test user in Supabase auth...');

const testEmail = 'test-onboard-' + Date.now() + '@heratest.com';
const testPassword = 'TestPassword123!';

try {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true
  });

  if (authError) {
    console.log('   ❌ Error creating user:', authError.message);
    process.exit(1);
  }

  const newUserId = authData.user.id;
  console.log('   ✅ Test user created!');
  console.log('   User ID:', newUserId);
  console.log('   Email:', testEmail);

  // Now test the onboard function
  console.log('\n📋 Step 2: Testing hera_onboard_user_v1...');

  const { data, error } = await supabase.rpc('hera_onboard_user_v1', {
    p_actor_user_id: ACTOR_USER_ID,  // WHO is performing the onboarding (owner)
    p_organization_id: EXISTING_ORG_ID,  // WHICH organization
    p_supabase_user_id: newUserId  // WHO is being onboarded (new user)
  });

  if (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
    console.log('   Hint:', error.hint);
  } else {
    console.log('   ✅ Onboarding successful!');
    console.log('   Result:', JSON.stringify(data, null, 2));

    // Verify the membership was created
    console.log('\n📋 Step 3: Verifying membership was created...');

    const { data: membership, error: memberError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', newUserId)
      .eq('organization_id', EXISTING_ORG_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .single();

    if (memberError) {
      console.log('   ❌ Error:', memberError.message);
    } else {
      console.log('   ✅ Membership verified!');
      console.log('   from_entity_id:', membership.from_entity_id);
      console.log('   to_entity_id:', membership.to_entity_id);
      console.log('   organization_id:', membership.organization_id);
      console.log('   relationship_type:', membership.relationship_type);
      console.log('   relationship_data:', JSON.stringify(membership.relationship_data, null, 2));
      console.log('   smart_code:', membership.smart_code);
      console.log('   is_active:', membership.is_active);
    }

    // Check if user entity was created
    console.log('\n📋 Step 4: Checking if user entity was created...');

    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', newUserId)
      .single();

    if (entityError) {
      console.log('   ℹ️  No user entity found (may not be needed)');
    } else {
      console.log('   ✅ User entity exists!');
      console.log('   entity_type:', userEntity.entity_type);
      console.log('   entity_name:', userEntity.entity_name);
      console.log('   smart_code:', userEntity.smart_code);
    }
  }

  // Cleanup: Delete test user
  console.log('\n📋 Step 5: Cleaning up test user...');

  // Delete membership
  await supabase
    .from('core_relationships')
    .delete()
    .eq('from_entity_id', newUserId)
    .eq('organization_id', EXISTING_ORG_ID);

  // Delete entity if exists
  await supabase
    .from('core_entities')
    .delete()
    .eq('id', newUserId);

  // Delete auth user
  const { error: deleteError } = await supabase.auth.admin.deleteUser(newUserId);

  if (deleteError) {
    console.log('   ⚠️  Cleanup warning:', deleteError.message);
  } else {
    console.log('   ✅ Test user cleaned up');
  }

} catch (err) {
  console.log('   ❌ Exception:', err.message);
  console.log('   Stack:', err.stack);
}

console.log('\n' + '='.repeat(70));
console.log('📊 SUMMARY FOR SIGNUP FLOW');
console.log('='.repeat(70));
console.log('\n✅ If hera_onboard_user_v1 works:');
console.log(`
await supabase.rpc('hera_onboard_user_v1', {
  p_actor_user_id: newUserId,  // The new user (acts as their own actor)
  p_organization_id: newOrgId,  // The newly created organization
  p_supabase_user_id: newUserId  // The new user's Supabase ID
});
`);

console.log('This function should:');
console.log('  1. Create a user entity in core_entities');
console.log('  2. Create a MEMBER_OF relationship in core_relationships');
console.log('  3. Set appropriate smart_code and metadata');
console.log('  4. Return success confirmation');
console.log('');
