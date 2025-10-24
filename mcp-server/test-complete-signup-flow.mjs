#!/usr/bin/env node
/**
 * Test COMPLETE signup flow with organization entity creation:
 * 1. Create auth user
 * 2. Create organization in core_organizations
 * 3. Create organization entity in core_entities (required for FK)
 * 4. Use hera_onboard_user_v1 to link user as owner
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing COMPLETE Signup Flow with Org Entity');
console.log('='.repeat(70));

async function testCompleteSignup() {
  try {
    // Step 1: Create auth user
    console.log('\n📋 Step 1: Creating auth user...');
    const testEmail = 'complete-signup-' + Date.now() + '@heratest.com';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Complete Test Owner',
        business_name: 'Complete Test Salon',
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

    // Step 2: Create organization in core_organizations
    console.log('\n📋 Step 2: Creating organization record...');
    const orgCode = 'ORG-' + Date.now().toString(36).toUpperCase();
    const orgId = crypto.randomUUID();

    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .insert({
        id: orgId,  // Explicit ID so we can use it for entity
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

    // Step 3: Create organization entity in core_entities (REQUIRED for FK)
    console.log('\n📋 Step 3: Creating organization entity...');

    // Create a normalized org name for smart code (alphanumeric only, uppercase)
    const normalizedOrgName = org.organization_name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 15);  // Max 15 chars

    const { data: orgEntity, error: orgEntityError } = await supabase
      .from('core_entities')
      .insert({
        id: orgId,  // Same ID as organization
        organization_id: orgId,  // Self-reference
        entity_type: 'ORG',
        entity_name: org.organization_name,
        entity_code: orgCode,
        smart_code: `HERA.SALON.ENTITY.ORG.${normalizedOrgName}.v1`,
        smart_code_status: 'LIVE',
        status: 'active',
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();

    if (orgEntityError) {
      console.log('   ❌ Error:', orgEntityError.message);

      // Cleanup
      await supabase
        .from('core_organizations')
        .delete()
        .eq('id', orgId);

      await supabase.auth.admin.deleteUser(userId);
      return;
    }

    console.log('   ✅ Organization entity created');
    console.log('   Entity Type:', orgEntity.entity_type);
    console.log('   Smart Code:', orgEntity.smart_code);

    // Step 4: Onboard user as owner using new RPC
    console.log('\n📋 Step 4: Onboarding user as owner...');
    const { data: onboardResult, error: onboardError } = await supabase.rpc('hera_onboard_user_v1', {
      p_supabase_user_id: userId,
      p_organization_id: orgId,
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

    // Step 5: Verify complete setup
    console.log('\n📋 Step 5: Verifying complete setup...');

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
      .eq('organization_id', orgId)
      .eq('relationship_type', 'MEMBER_OF')
      .single();

    console.log('\n   ✅ COMPLETE SETUP VERIFIED:');
    console.log('   ┌─ Auth User');
    console.log('   │  ID:', userId);
    console.log('   │  Email:', testEmail);
    console.log('   │');
    console.log('   ├─ Organization');
    console.log('   │  ID:', orgId);
    console.log('   │  Name:', org.organization_name);
    console.log('   │  Code:', org.organization_code);
    console.log('   │');
    console.log('   ├─ Organization Entity');
    console.log('   │  Type:', orgEntity.entity_type);
    console.log('   │  Smart Code:', orgEntity.smart_code);
    console.log('   │');
    console.log('   ├─ User Entity');
    if (userEntity) {
      console.log('   │  Name:', userEntity.entity_name);
      console.log('   │  Type:', userEntity.entity_type);
      console.log('   │  Smart Code:', userEntity.smart_code);
    } else {
      console.log('   │  ⚠️  NOT FOUND');
    }
    console.log('   │');
    console.log('   └─ Membership');
    if (membership) {
      console.log('      Role:', membership.relationship_data?.role);
      console.log('      Label:', membership.relationship_data?.label);
      console.log('      Smart Code:', membership.smart_code);
      console.log('      Active:', membership.is_active);
    } else {
      console.log('      ⚠️  NOT FOUND');
    }

    // Cleanup
    console.log('\n📋 Step 6: Cleanup...');

    await supabase
      .from('core_relationships')
      .delete()
      .eq('from_entity_id', userId);

    await supabase
      .from('core_entities')
      .delete()
      .eq('id', userId);

    await supabase
      .from('core_entities')
      .delete()
      .eq('id', orgId);

    await supabase
      .from('core_organizations')
      .delete()
      .eq('id', orgId);

    await supabase.auth.admin.deleteUser(userId);

    console.log('   ✅ Cleanup complete');

  } catch (err) {
    console.log('   ❌ Exception:', err.message);
    console.log('   Stack:', err.stack);
  }
}

await testCompleteSignup();

console.log('\n' + '='.repeat(70));
console.log('📊 PRODUCTION SIGNUP PATTERN (Complete Flow)');
console.log('='.repeat(70));
console.log(`
✅ COMPLETE SIGNUP FLOW (3 steps):

async function signupNewOrganization({
  email,
  password,
  name,
  businessName,
  industry,
  currency
}) {
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

  // Step 2a: Create organization record
  const orgCode = 'ORG-' + Date.now().toString(36).toUpperCase()
  const orgId = crypto.randomUUID()

  const { data: org, error: orgError } = await supabase
    .from('core_organizations')
    .insert({
      id: orgId,
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

  // Step 2b: Create organization entity (REQUIRED for relationships)
  const normalizedOrgName = businessName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 15)

  const { error: orgEntityError } = await supabase
    .from('core_entities')
    .insert({
      id: orgId,
      organization_id: orgId,
      entity_type: 'ORG',
      entity_name: businessName,
      entity_code: orgCode,
      smart_code: \`HERA.SALON.ENTITY.ORG.\${normalizedOrgName}.v1\`,
      smart_code_status: 'LIVE',
      status: 'active',
      created_by: userId,
      updated_by: userId
    })

  if (orgEntityError) throw orgEntityError

  // Step 3: Onboard user as owner (creates user entity + membership)
  const { data: membership, error: memberError } = await supabase.rpc('hera_onboard_user_v1', {
    p_supabase_user_id: userId,
    p_organization_id: orgId,
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

✨ WHAT THIS CREATES:
1. Auth user in Supabase (auth.users)
2. Organization record (core_organizations)
3. Organization entity (core_entities - required for FK)
4. User entity (core_entities - via RPC)
5. Membership (core_relationships - via RPC)

🎯 ROLE MAPPING (hera_onboard_user_v1):
- 'owner'       → role: ORG_OWNER, label: null
- 'admin'       → role: ORG_ADMIN, label: null
- 'manager'     → role: ORG_MANAGER, label: null
- 'employee'    → role: ORG_EMPLOYEE, label: null
- 'staff'       → role: ORG_EMPLOYEE, label: null
- 'member'      → role: MEMBER, label: null
- 'receptionist' → role: ORG_EMPLOYEE, label: 'receptionist'
- 'accountant'   → role: ORG_EMPLOYEE, label: 'accountant'
`);
console.log('');
