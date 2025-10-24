#!/usr/bin/env node
/**
 * Test SIMPLIFIED signup flow:
 * 1. Create organization directly (table doesn't have version column)
 * 2. Use hera_onboard_user_v1 to link user as owner
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing Simplified Org Creation + User Onboarding');
console.log('='.repeat(70));

async function testSimplifiedSignup() {
  try {
    // Step 1: Create auth user
    console.log('\n📋 Step 1: Creating auth user...');
    const testEmail = 'simple-signup-' + Date.now() + '@heratest.com';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Salon Owner',
        business_name: 'Test Salon Business',
        industry: 'beauty_salon',
        currency: 'USD'
      }
    });

    if (authError) {
      console.log('   ❌ Error:', authError.message);
      return;
    }

    const userId = authData.user.id;
    console.log('   ✅ User created:', userId);
    console.log('   Email:', testEmail);

    // Step 2: Create organization (direct table insert - no version column)
    console.log('\n📋 Step 2: Creating organization...');
    const orgCode = 'ORG-' + Date.now().toString(36).toUpperCase();

    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .insert({
        organization_name: authData.user.user_metadata.business_name,
        organization_code: orgCode,
        organization_type: 'business_unit',
        industry_classification: authData.user.user_metadata.industry,
        settings: {
          currency: authData.user.user_metadata.currency,
          selected_app: 'salon',
          created_via: 'signup',
          theme: { preset: 'salon-luxe' }
        },
        status: 'active',
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();

    if (orgError) {
      console.log('   ❌ Error:', orgError.message);

      // Cleanup
      await supabase.auth.admin.deleteUser(userId);
      return;
    }

    console.log('   ✅ Organization created:', org.id);
    console.log('   Name:', org.organization_name);
    console.log('   Code:', org.organization_code);

    // Step 3: Onboard user as owner using new RPC
    console.log('\n📋 Step 3: Onboarding user as owner...');
    const { data: onboardResult, error: onboardError } = await supabase.rpc('hera_onboard_user_v1', {
      p_supabase_user_id: userId,
      p_organization_id: org.id,
      p_actor_user_id: userId,
      p_role: 'owner'
    });

    if (onboardError) {
      console.log('   ❌ Error:', onboardError.message);
      console.log('   Hint:', onboardError.hint);
    } else {
      console.log('   ✅ User onboarded successfully!');
      console.log('   Result:', JSON.stringify(onboardResult, null, 2));
    }

    // Step 4: Verify complete setup
    console.log('\n📋 Step 4: Verifying setup...');

    // Check user entity
    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .single();

    // Check membership
    const { data: membership } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userId)
      .eq('organization_id', org.id)
      .eq('relationship_type', 'MEMBER_OF')
      .single();

    if (userEntity) {
      console.log('   ✅ User Entity:');
      console.log('      ID:', userEntity.id);
      console.log('      Name:', userEntity.entity_name);
      console.log('      Type:', userEntity.entity_type);
      console.log('      Smart Code:', userEntity.smart_code);
    } else {
      console.log('   ⚠️  User entity not found');
    }

    if (membership) {
      console.log('   ✅ Membership:');
      console.log('      Role:', membership.relationship_data?.role);
      console.log('      Label:', membership.relationship_data?.label);
      console.log('      Smart Code:', membership.smart_code);
      console.log('      Active:', membership.is_active);
    } else {
      console.log('   ⚠️  Membership not found');
    }

    // Cleanup
    console.log('\n📋 Step 5: Cleanup...');

    await supabase
      .from('core_relationships')
      .delete()
      .eq('from_entity_id', userId)
      .eq('organization_id', org.id);

    await supabase
      .from('core_organizations')
      .delete()
      .eq('id', org.id);

    await supabase
      .from('core_entities')
      .delete()
      .eq('id', userId);

    await supabase.auth.admin.deleteUser(userId);

    console.log('   ✅ Cleanup complete');

  } catch (err) {
    console.log('   ❌ Exception:', err.message);
    console.log('   Stack:', err.stack);
  }
}

await testSimplifiedSignup();

console.log('\n' + '='.repeat(70));
console.log('📊 PRODUCTION SIGNUP PATTERN (Current Schema)');
console.log('='.repeat(70));
console.log(`
✅ TWO-STEP SIGNUP FLOW:

async function signupNewOrganization({ email, password, businessName, industry, currency }) {
  // Step 1: Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        business_name: businessName,
        industry,
        currency
      }
    }
  })

  if (authError) throw authError
  const userId = authData.user.id

  // Step 2: Create organization
  const orgCode = 'ORG-' + Date.now().toString(36).toUpperCase()

  const { data: org, error: orgError } = await supabase
    .from('core_organizations')
    .insert({
      organization_name: businessName,
      organization_code: orgCode,
      organization_type: 'business_unit',
      industry_classification: industry,
      settings: {
        currency,
        selected_app: 'salon',
        created_via: 'signup'
      },
      status: 'active',
      created_by: userId,
      updated_by: userId
    })
    .select()
    .single()

  if (orgError) throw orgError

  // Step 3: Onboard user as owner
  const { data: membership, error: memberError } = await supabase.rpc('hera_onboard_user_v1', {
    p_supabase_user_id: userId,
    p_organization_id: org.id,
    p_actor_user_id: userId,
    p_role: 'owner'
  })

  if (memberError) throw memberError

  return {
    user: authData.user,
    organization: org,
    membership
  }
}

ROLE MAPPING:
- 'owner'       → ORG_OWNER (full control)
- 'admin'       → ORG_ADMIN (administrative access)
- 'manager'     → ORG_MANAGER (management access)
- 'employee'    → ORG_EMPLOYEE (employee access)
- 'staff'       → ORG_EMPLOYEE (same as employee)
- 'member'      → MEMBER (basic access)
- 'receptionist', 'accountant', etc → ORG_EMPLOYEE + label: 'receptionist'
`);
console.log('');
