#!/usr/bin/env node
/**
 * Create Hairtalkz Salon Users and Onboard to Organization
 *
 * Creates:
 * 1. Owner: Hairtalkz2022@gmail.com (password: Hairtalkz2025!)
 * 2. Receptionist 1: hairtalkz01@gmail.com (password: Hairtalkz)
 * 3. Receptionist 2: hairtalkz02@gmail.com (password: Hairtalkz)
 *
 * Links them to Hairtalkz organization (378f24fb-d496-4ff7-8afa-ea34895a0eb8)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HAIRTALKZ_ORG_ID = process.env.HERA_SALON_ORG_ID || '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

// User definitions
const USERS = [
  {
    email: 'Hairtalkz2022@gmail.com',
    password: 'Hairtalkz2025!',
    role: 'owner',
    name: 'Hairtalkz Owner',
    metadata: {
      full_name: 'Hairtalkz Owner',
      display_name: 'Owner',
      organization: 'Hairtalkz'
    }
  },
  {
    email: 'hairtalkz01@gmail.com',
    password: 'Hairtalkz',
    role: 'employee',
    name: 'Receptionist 1',
    metadata: {
      full_name: 'Receptionist 1',
      display_name: 'Receptionist 1',
      organization: 'Hairtalkz'
    }
  },
  {
    email: 'hairtalkz02@gmail.com',
    password: 'Hairtalkz',
    role: 'employee',
    name: 'Receptionist 2',
    metadata: {
      full_name: 'Receptionist 2',
      display_name: 'Receptionist 2',
      organization: 'Hairtalkz'
    }
  }
];

console.log('🏢 HAIRTALKZ SALON - USER CREATION & ONBOARDING');
console.log('=' .repeat(60));
console.log(`Organization ID: ${HAIRTALKZ_ORG_ID}`);
console.log(`Supabase URL: ${process.env.SUPABASE_URL}\n`);

/**
 * Create or get existing Supabase auth user
 */
async function createAuthUser(userDef) {
  console.log(`\n👤 Processing: ${userDef.email} (${userDef.role})`);

  // Check if user already exists
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('   ❌ Error listing users:', listError.message);
    return null;
  }

  const existingUser = existingUsers.users.find(u => u.email === userDef.email);

  if (existingUser) {
    console.log(`   ⚠️  User already exists: ${existingUser.id}`);
    console.log(`   📧 Email: ${existingUser.email}`);
    return existingUser;
  }

  // Create new user
  console.log(`   🔨 Creating new auth user...`);
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: userDef.email,
    password: userDef.password,
    email_confirm: true, // Auto-confirm email
    user_metadata: userDef.metadata
  });

  if (createError) {
    console.error(`   ❌ Error creating user:`, createError.message);
    return null;
  }

  console.log(`   ✅ User created successfully!`);
  console.log(`   📧 Email: ${newUser.user.email}`);
  console.log(`   🆔 ID: ${newUser.user.id}`);

  return newUser.user;
}

/**
 * Onboard user to organization using hera_onboard_user_v1
 */
async function onboardUser(authUser, role, actorUserId) {
  console.log(`\n   🔗 Onboarding to organization...`);
  console.log(`   📋 Role: ${role}`);

  try {
    const { data, error } = await supabase.rpc('hera_onboard_user_v1', {
      p_supabase_user_id: authUser.id,
      p_organization_id: HAIRTALKZ_ORG_ID,
      p_actor_user_id: actorUserId || authUser.id, // Use first user as actor for subsequent users
      p_role: role
    });

    if (error) {
      console.error(`   ❌ Onboarding failed:`, error.message);
      if (error.hint) console.error(`   💡 Hint:`, error.hint);
      return null;
    }

    console.log(`   ✅ Onboarding successful!`);
    console.log(`   📊 Result:`, JSON.stringify(data, null, 2));

    return data;
  } catch (err) {
    console.error(`   ❌ Exception during onboarding:`, err.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  let firstUserId = null; // Owner will be the actor for other users
  const results = [];

  for (const userDef of USERS) {
    console.log('\n' + '─'.repeat(60));

    // Step 1: Create auth user
    const authUser = await createAuthUser(userDef);
    if (!authUser) {
      console.log(`   ⏭️  Skipping onboarding for ${userDef.email}`);
      results.push({ email: userDef.email, status: 'failed', reason: 'auth_creation_failed' });
      continue;
    }

    // Store first user (owner) as actor
    if (!firstUserId) {
      firstUserId = authUser.id;
      console.log(`   👑 Setting as primary actor for subsequent operations`);
    }

    // Step 2: Onboard to organization
    const onboardResult = await onboardUser(authUser, userDef.role, firstUserId);

    results.push({
      email: userDef.email,
      user_id: authUser.id,
      role: userDef.role,
      status: onboardResult ? 'success' : 'failed',
      onboarding: onboardResult
    });

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  console.log(`\n✅ Successful: ${successCount}/${USERS.length}`);
  console.log(`❌ Failed: ${failedCount}/${USERS.length}\n`);

  results.forEach((result, idx) => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`${icon} ${idx + 1}. ${result.email}`);
    console.log(`   User ID: ${result.user_id || 'N/A'}`);
    console.log(`   Role: ${result.role}`);
    console.log(`   Status: ${result.status}`);
    if (result.reason) {
      console.log(`   Reason: ${result.reason}`);
    }
    console.log();
  });

  console.log('='.repeat(60));
  console.log('🎉 User creation and onboarding complete!\n');

  // Verify users in organization
  console.log('🔍 Verifying users in organization...\n');

  for (const result of results.filter(r => r.status === 'success')) {
    const { data: membership, error } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', result.user_id)
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('relationship_type', 'MEMBER_OF');

    if (!error && membership && membership.length > 0) {
      console.log(`✅ ${result.email} - MEMBER_OF relationship confirmed`);
    } else {
      console.log(`⚠️  ${result.email} - MEMBER_OF relationship NOT found`);
    }
  }

  console.log('\n✨ All done!\n');
}

// Run the script
main().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error(error);
  process.exit(1);
});
