#!/usr/bin/env node
/**
 * Create and Onboard HERA CENTRAL Admin User
 * Email: admin@heraerp.com
 * Password: admin@HERA
 * Organization: HERA CENTRAL (11111111-1111-1111-1111-111111111111)
 * Role: ORG_OWNER
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const HERA_CENTRAL_ORG_ID = '11111111-1111-1111-1111-111111111111';
const ADMIN_EMAIL = 'admin@heraerp.com';
const ADMIN_PASSWORD = 'admin@HERA';

async function onboardHeraCentralAdmin() {
  console.log('👤 Creating and Onboarding HERA CENTRAL Admin User...');
  console.log('═'.repeat(80));
  console.log('Email:        ' + ADMIN_EMAIL);
  console.log('Password:     ' + ADMIN_PASSWORD);
  console.log('Organization: HERA CENTRAL');
  console.log('Org ID:       ' + HERA_CENTRAL_ORG_ID);
  console.log('Role:         ORG_OWNER');
  console.log('═'.repeat(80));
  console.log('');

  try {
    // Step 1: Create Supabase auth user
    console.log('📝 Step 1: Creating Supabase auth user...');

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'HERA CENTRAL Administrator',
        organization: 'HERA CENTRAL',
        role: 'admin'
      }
    });

    if (authError) {
      // Check if user already exists
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        console.log('');
        console.log('⚠️  User already exists. Attempting to fetch existing user...');

        // Get existing user by email
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error('❌ Failed to list users:', listError.message);
          return;
        }

        const existingUser = existingUsers.users.find(u => u.email === ADMIN_EMAIL);

        if (!existingUser) {
          console.error('❌ Could not find existing user');
          return;
        }

        console.log('✅ Found existing user:', existingUser.id);
        console.log('   Email:', existingUser.email);
        console.log('   Created:', existingUser.created_at);

        // Use existing user ID
        const userId = existingUser.id;

        // Skip to onboarding step
        console.log('');
        console.log('📝 Step 2: Finding actor user...');

        // Get actor user (use demo user we created earlier)
        const actorUserId = '03b7ea5e-2acd-469f-b509-51fe924527cf'; // demo@heraerp.com
        console.log('✅ Using actor: Demo User (' + actorUserId + ')');
        console.log('');

        // Step 3: Onboard user
        await onboardUser(userId, actorUserId);
        return;
      } else {
        console.error('❌ Auth error not related to existing user:', authError.message);
        return;
      }
    }

    const userId = authData.user.id;
    console.log('✅ User created successfully!');
    console.log('   User ID:', userId);
    console.log('   Email:', authData.user.email);
    console.log('   Metadata:', JSON.stringify(authData.user.user_metadata, null, 2));
    console.log('');

    // Step 2: Get actor user
    console.log('📝 Step 2: Finding actor user...');

    // Use the demo user we created earlier as actor
    const actorUserId = '03b7ea5e-2acd-469f-b509-51fe924527cf'; // demo@heraerp.com
    console.log('✅ Using actor: Demo User (' + actorUserId + ')');
    console.log('');

    // Step 3: Onboard user
    await onboardUser(userId, actorUserId);

  } catch (err) {
    console.error('');
    console.error('💥 Unexpected Error:', err.message);
    console.error(err.stack);
    console.error('');
    process.exit(1);
  }
}

async function onboardUser(userId, actorUserId) {
  // Step 3: Onboard user with hera_onboard_user_v1
  console.log('📝 Step 3: Onboarding user with hera_onboard_user_v1...');
  console.log('   Supabase User ID:', userId);
  console.log('   Organization ID:', HERA_CENTRAL_ORG_ID);
  console.log('   Role: ORG_OWNER');
  console.log('   Actor User ID:', actorUserId);
  console.log('');

  const { data: onboardResult, error: onboardError } = await supabase.rpc('hera_onboard_user_v1', {
    p_supabase_user_id: userId,
    p_organization_id: HERA_CENTRAL_ORG_ID,
    p_actor_user_id: actorUserId,
    p_role: 'ORG_OWNER',
    p_is_active: true,
    p_effective_at: new Date().toISOString()
  });

  if (onboardError) {
    console.error('❌ Onboard Error:', onboardError);
    console.error('   Message:', onboardError.message);
    console.error('   Hint:', onboardError.hint);
    console.error('   Details:', onboardError.details);
    console.error('');
    process.exit(1);
  }

  console.log('✅ User onboarded successfully!');
  console.log('');
  console.log('📊 Onboard Result:');
  console.log(JSON.stringify(onboardResult, null, 2));
  console.log('');

  // Step 4: Verify bidirectional auth metadata sync
  console.log('📝 Step 4: Verifying bidirectional auth metadata sync...');
  console.log('═'.repeat(80));

  // 4a: Check auth.users metadata -> hera_user_entity_id
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);

  const heraUserEntityId = authUser.user.user_metadata?.hera_user_entity_id ||
                          authUser.user.raw_user_meta_data?.hera_user_entity_id;

  console.log('');
  console.log('✅ Auth → Entity Mapping:');
  console.log('   auth.users.id:                    ', userId);
  console.log('   → hera_user_entity_id:            ', heraUserEntityId || '❌ NOT SET');

  // 4b: Check core_entities metadata -> supabase_user_id
  const userEntityId = onboardResult.user_entity_id;
  const { data: userEntity } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, organization_id, metadata')
    .eq('id', userEntityId)
    .single();

  const supabaseUserId = userEntity?.metadata?.supabase_user_id;

  console.log('');
  console.log('✅ Entity → Auth Mapping:');
  console.log('   core_entities.id:                 ', userEntity.id);
  console.log('   core_entities.entity_name:        ', userEntity.entity_name);
  console.log('   core_entities.entity_type:        ', userEntity.entity_type);
  console.log('   core_entities.organization_id:    ', userEntity.organization_id);
  console.log('   → supabase_user_id:               ', supabaseUserId || '❌ NOT SET');

  // 4c: Verify bidirectional sync
  console.log('');
  console.log('📊 BIDIRECTIONAL SYNC VERIFICATION:');
  console.log('═'.repeat(80));

  const authToEntityWorks = heraUserEntityId === userEntityId;
  const entityToAuthWorks = supabaseUserId === userId;

  console.log('Auth → Entity:    ', authToEntityWorks ? '✅ WORKING' : '❌ FAILED');
  console.log('  Expected:       ', userEntityId);
  console.log('  Actual:         ', heraUserEntityId);
  console.log('');
  console.log('Entity → Auth:    ', entityToAuthWorks ? '✅ WORKING' : '❌ FAILED');
  console.log('  Expected:       ', userId);
  console.log('  Actual:         ', supabaseUserId);
  console.log('═'.repeat(80));

  // Step 5: Verify membership and role
  console.log('');
  console.log('📝 Step 5: Verifying membership and role...');

  const { data: membership } = await supabase
    .from('core_relationships')
    .select('id, relationship_type, relationship_data, from_entity_id, to_entity_id, organization_id')
    .eq('organization_id', HERA_CENTRAL_ORG_ID)
    .eq('from_entity_id', userEntityId)
    .eq('relationship_type', 'MEMBER_OF')
    .single();

  const { data: hasRole } = await supabase
    .from('core_relationships')
    .select('id, relationship_type, relationship_data, to_entity_id, organization_id')
    .eq('organization_id', HERA_CENTRAL_ORG_ID)
    .eq('from_entity_id', userEntityId)
    .eq('relationship_type', 'HAS_ROLE')
    .single();

  console.log('');
  console.log('✅ MEMBER_OF Relationship:');
  console.log('   ID:              ', membership?.id);
  console.log('   Organization:    ', membership?.organization_id);
  console.log('   Role:            ', membership?.relationship_data?.role);
  console.log('');
  console.log('✅ HAS_ROLE Relationship:');
  console.log('   ID:              ', hasRole?.id);
  console.log('   Organization:    ', hasRole?.organization_id);
  console.log('   Role Code:       ', hasRole?.relationship_data?.role_code);
  console.log('   Is Primary:      ', hasRole?.relationship_data?.is_primary ? 'YES' : 'NO');

  // Final Summary
  console.log('');
  console.log('═'.repeat(80));
  console.log('🎯 FINAL SUMMARY:');
  console.log('═'.repeat(80));
  console.log('User Created:              ✅ YES');
  console.log('User Onboarded:            ✅ YES');
  console.log('Auth Metadata Sync:        ' + (authToEntityWorks && entityToAuthWorks ? '✅ WORKING' : '❌ FAILED'));
  console.log('Membership Created:        ' + (membership ? '✅ YES' : '❌ NO'));
  console.log('Role Assigned:             ' + (hasRole ? '✅ YES (ORG_OWNER)' : '❌ NO'));
  console.log('Organization:              HERA CENTRAL (' + HERA_CENTRAL_ORG_ID + ')');
  console.log('═'.repeat(80));
  console.log('');
  console.log('💡 You can now login with:');
  console.log('   Email:        ' + ADMIN_EMAIL);
  console.log('   Password:     ' + ADMIN_PASSWORD);
  console.log('   Organization: HERA CENTRAL');
  console.log('   Access:       /control-center');
  console.log('');
  console.log('🎉 HERA CENTRAL ADMIN USER SETUP COMPLETE!');
  console.log('');
}

// Run the onboarding
onboardHeraCentralAdmin();
