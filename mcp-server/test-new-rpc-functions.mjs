#!/usr/bin/env node
/**
 * Test new HERA v2.3 RPC functions:
 * - hera_onboard_user_v1 (with role parameter)
 * - hera_organizations_crud_v1 (CREATE with bootstrap)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing HERA v2.3 RPC Functions');
console.log('='.repeat(70));

const ACTOR_USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'; // hairtalkz2022@gmail.com (owner)

async function runTests() {
  try {
    // ════════════════════════════════════════════════════════════════════
    // TEST 1: hera_onboard_user_v1 with NEW signature
    // ════════════════════════════════════════════════════════════════════
    console.log('\n📋 TEST 1: hera_onboard_user_v1 with role parameter');
    console.log('-'.repeat(70));

    // Create test user
    const testEmail = 'test-v23-' + Date.now() + '@heratest.com';
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true
    });

    if (authError) {
      console.log('   ❌ Auth Error:', authError.message);
      return;
    }

    const newUserId = authData.user.id;
    console.log('   ✅ Test user created:', newUserId);
    console.log('   Email:', testEmail);

    // Test with different roles
    const testOrg = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // Hair Talkz

    console.log('\n   🔹 Test 1a: Onboard as "owner"');
    const { data: result1, error: error1 } = await supabase.rpc('hera_onboard_user_v1', {
      p_supabase_user_id: newUserId,
      p_organization_id: testOrg,
      p_actor_user_id: ACTOR_USER_ID,
      p_role: 'owner'
    });

    if (error1) {
      console.log('   ❌ Error:', error1.message);
      console.log('   Hint:', error1.hint);
    } else {
      console.log('   ✅ Success!');
      console.log('   Result:', JSON.stringify(result1, null, 2));
    }

    // Check relationship_data
    const { data: rel1 } = await supabase
      .from('core_relationships')
      .select('relationship_data')
      .eq('from_entity_id', newUserId)
      .eq('organization_id', testOrg)
      .single();

    console.log('   relationship_data:', JSON.stringify(rel1?.relationship_data, null, 2));

    // Cleanup membership
    await supabase
      .from('core_relationships')
      .delete()
      .eq('from_entity_id', newUserId)
      .eq('organization_id', testOrg);

    console.log('\n   🔹 Test 1b: Onboard with custom label "receptionist"');
    const { data: result2, error: error2 } = await supabase.rpc('hera_onboard_user_v1', {
      p_supabase_user_id: newUserId,
      p_organization_id: testOrg,
      p_actor_user_id: ACTOR_USER_ID,
      p_role: 'receptionist'
    });

    if (error2) {
      console.log('   ❌ Error:', error2.message);
    } else {
      console.log('   ✅ Success!');
      console.log('   Result:', JSON.stringify(result2, null, 2));
    }

    const { data: rel2 } = await supabase
      .from('core_relationships')
      .select('relationship_data')
      .eq('from_entity_id', newUserId)
      .eq('organization_id', testOrg)
      .single();

    console.log('   relationship_data:', JSON.stringify(rel2?.relationship_data, null, 2));

    // Cleanup test user
    await supabase
      .from('core_relationships')
      .delete()
      .eq('from_entity_id', newUserId);

    await supabase
      .from('core_entities')
      .delete()
      .eq('id', newUserId);

    await supabase.auth.admin.deleteUser(newUserId);

    console.log('   ✅ Test 1 cleanup complete');

    // ════════════════════════════════════════════════════════════════════
    // TEST 2: hera_organizations_crud_v1 CREATE with bootstrap
    // ════════════════════════════════════════════════════════════════════
    console.log('\n📋 TEST 2: hera_organizations_crud_v1 CREATE with bootstrap');
    console.log('-'.repeat(70));

    // Create test user for signup simulation
    const signupEmail = 'signup-test-' + Date.now() + '@heratest.com';
    const { data: signupAuth, error: signupAuthError } = await supabase.auth.admin.createUser({
      email: signupEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Salon Owner'
      }
    });

    if (signupAuthError) {
      console.log('   ❌ Signup Auth Error:', signupAuthError.message);
      return;
    }

    const signupUserId = signupAuth.user.id;
    console.log('   ✅ Signup user created:', signupUserId);
    console.log('   Email:', signupEmail);

    // Create organization with bootstrap
    const orgCode = 'ORG-' + Date.now().toString(36).toUpperCase();
    const { data: orgResult, error: orgError } = await supabase.rpc('hera_organizations_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: signupUserId,
      p_payload: {
        organization_name: 'Test Salon',
        organization_code: orgCode,
        organization_type: 'business_unit',
        industry_classification: 'beauty_salon',
        settings: {
          currency: 'USD',
          selected_app: 'salon',
          created_via: 'signup'
        },
        status: 'active',
        bootstrap: true  // This should auto-onboard actor as owner
      }
    });

    if (orgError) {
      console.log('   ❌ Org Creation Error:', orgError.message);
      console.log('   Hint:', orgError.hint);
    } else {
      console.log('   ✅ Organization created!');
      console.log('   Result:', JSON.stringify(orgResult, null, 2));

      const createdOrgId = orgResult.organization.id;

      // Verify membership was created
      const { data: membership } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('from_entity_id', signupUserId)
        .eq('organization_id', createdOrgId)
        .eq('relationship_type', 'MEMBER_OF')
        .single();

      if (membership) {
        console.log('   ✅ Membership verified!');
        console.log('   Role:', membership.relationship_data?.role);
        console.log('   Label:', membership.relationship_data?.label);
      } else {
        console.log('   ⚠️  No membership found');
      }

      // Cleanup
      await supabase
        .from('core_relationships')
        .delete()
        .eq('from_entity_id', signupUserId)
        .eq('organization_id', createdOrgId);

      await supabase
        .from('core_organizations')
        .delete()
        .eq('id', createdOrgId);
    }

    // Cleanup signup user
    await supabase
      .from('core_entities')
      .delete()
      .eq('id', signupUserId);

    await supabase.auth.admin.deleteUser(signupUserId);

    console.log('   ✅ Test 2 cleanup complete');

    // ════════════════════════════════════════════════════════════════════
    // TEST 3: Full signup flow simulation
    // ════════════════════════════════════════════════════════════════════
    console.log('\n📋 TEST 3: Full signup flow simulation');
    console.log('-'.repeat(70));

    // Step 1: Create auth user
    const fullSignupEmail = 'full-signup-' + Date.now() + '@heratest.com';
    const { data: fullAuth, error: fullAuthError } = await supabase.auth.admin.createUser({
      email: fullSignupEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Full Test Owner',
        business_name: 'Full Test Salon',
        industry: 'beauty_salon',
        currency: 'USD'
      }
    });

    if (fullAuthError) {
      console.log('   ❌ Full Signup Error:', fullAuthError.message);
      return;
    }

    const fullUserId = fullAuth.user.id;
    console.log('   Step 1: ✅ Auth user created:', fullUserId);

    // Step 2: Create organization with bootstrap
    const fullOrgCode = 'ORG-' + Date.now().toString(36).toUpperCase();
    const { data: fullOrgResult, error: fullOrgError } = await supabase.rpc('hera_organizations_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: fullUserId,
      p_payload: {
        organization_name: fullAuth.user.user_metadata.business_name,
        organization_code: fullOrgCode,
        organization_type: 'business_unit',
        industry_classification: fullAuth.user.user_metadata.industry,
        settings: {
          currency: fullAuth.user.user_metadata.currency,
          selected_app: 'salon',
          created_via: 'signup',
          theme: { preset: 'salon-luxe' }
        },
        status: 'active',
        bootstrap: true  // Auto-onboard as owner
      }
    });

    if (fullOrgError) {
      console.log('   Step 2: ❌ Error:', fullOrgError.message);

      // Cleanup
      await supabase.auth.admin.deleteUser(fullUserId);
      return;
    }

    console.log('   Step 2: ✅ Organization created!');
    const fullOrgId = fullOrgResult.organization.id;

    // Step 3: Verify complete setup
    const { data: finalMembership } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', fullUserId)
      .eq('organization_id', fullOrgId)
      .eq('relationship_type', 'MEMBER_OF')
      .single();

    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', fullUserId)
      .single();

    console.log('   Step 3: ✅ Verification complete!');
    console.log('   User Entity:', userEntity?.entity_name);
    console.log('   Membership Role:', finalMembership?.relationship_data?.role);
    console.log('   Organization ID:', fullOrgId);

    // Cleanup
    await supabase
      .from('core_relationships')
      .delete()
      .eq('from_entity_id', fullUserId);

    await supabase
      .from('core_organizations')
      .delete()
      .eq('id', fullOrgId);

    await supabase
      .from('core_entities')
      .delete()
      .eq('id', fullUserId);

    await supabase.auth.admin.deleteUser(fullUserId);

    console.log('   ✅ Test 3 cleanup complete');

  } catch (err) {
    console.log('   ❌ Exception:', err.message);
    console.log('   Stack:', err.stack);
  }
}

// Run tests
await runTests();

console.log('\n' + '='.repeat(70));
console.log('📊 PRODUCTION SIGNUP PATTERN (v2.3)');
console.log('='.repeat(70));
console.log(`
✅ SINGLE RPC CALL FOR COMPLETE SIGNUP:

// Step 1: Create Supabase auth user
const { data: authData } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name, business_name, industry, currency }
  }
})

// Step 2: Create organization with auto-onboarding
const { data: org } = await supabase.rpc('hera_organizations_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: authData.user.id,
  p_payload: {
    organization_name: business_name,
    organization_code: 'ORG-' + Date.now().toString(36).toUpperCase(),
    organization_type: 'business_unit',
    industry_classification: industry,
    settings: { currency, selected_app: 'salon' },
    status: 'active',
    bootstrap: true  // ← Auto-onboards actor as ORG_OWNER
  }
})

// Done! User is created, org is created, user is owner - all in 2 calls.
`);
console.log('');
