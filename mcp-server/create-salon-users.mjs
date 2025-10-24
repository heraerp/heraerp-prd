#!/usr/bin/env node
/**
 * Create Salon Users in Supabase Auth
 *
 * This script creates the following users:
 * 1. Owner: Hairtalkz2022@gmail.com
 * 2. Receptionist 1: hairtalkz01@gmail.com
 * 3. Receptionist 2: hairtalkz02@gmail.com
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client with service role key (admin privileges)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ ERROR: Missing Supabase credentials');
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY in mcp-server/.env');
  console.error('Get it from: https://supabase.com/dashboard/project/qqagokigwuujyeyrgdkq/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Salon organization ID
const SALON_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

// Users to create
const users = [
  {
    email: 'Hairtalkz2022@gmail.com',
    password: 'Hairtalkz2025!',
    role: 'owner',
    full_name: 'Michele Hair (Owner)',
    metadata: {
      role: 'owner',
      organization_id: SALON_ORG_ID,
      business_type: 'salon'
    }
  },
  {
    email: 'hairtalkz01@gmail.com',
    password: 'Hairtalkz',
    role: 'receptionist',
    full_name: 'Receptionist 1',
    metadata: {
      role: 'receptionist',
      organization_id: SALON_ORG_ID,
      business_type: 'salon'
    }
  },
  {
    email: 'hairtalkz02@gmail.com',
    password: 'Hairtalkz',
    role: 'receptionist',
    full_name: 'Receptionist 2',
    metadata: {
      role: 'receptionist',
      organization_id: SALON_ORG_ID,
      business_type: 'salon'
    }
  }
];

async function createSalonUsers() {
  console.log('🚀 Creating Salon Users in Supabase Auth...');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🏢 Organization ID: ${SALON_ORG_ID}\n`);

  const results = [];

  for (const user of users) {
    console.log(`\n👤 Creating user: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Name: ${user.full_name}`);

    try {
      let authUserId = null;
      let userStatus = 'unknown';

      // Create user in Supabase Auth using Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: user.metadata
      });

      if (error) {
        // Check if user already exists
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          console.log(`   ⚠️  User already exists: ${user.email}`);
          console.log(`   🔍 Fetching existing user...`);

          // Try to get the existing user by email using admin API
          try {
            const { data: { users: allUsers }, error: listError } = await supabase.auth.admin.listUsers();

            if (listError) {
              console.error(`   ❌ Error listing users: ${listError.message}`);
              results.push({
                email: user.email,
                role: user.role,
                status: 'error',
                error: `Failed to find existing user: ${listError.message}`
              });
              continue;
            }

            const existingUser = allUsers?.find(u => u.email?.toLowerCase() === user.email.toLowerCase());

            if (existingUser) {
              console.log(`   ✅ Found existing user ID: ${existingUser.id}`);
              authUserId = existingUser.id;
              userStatus = 'already_exists';
            } else {
              console.error(`   ❌ User exists but could not be found in user list`);
              results.push({
                email: user.email,
                role: user.role,
                status: 'error',
                error: 'User exists but could not be retrieved'
              });
              continue;
            }
          } catch (findError) {
            console.error(`   ❌ Error finding user: ${findError.message}`);
            results.push({
              email: user.email,
              role: user.role,
              status: 'error',
              error: findError.message
            });
            continue;
          }
        } else {
          console.error(`   ❌ Error creating user: ${error.message}`);
          results.push({
            email: user.email,
            role: user.role,
            status: 'error',
            error: error.message
          });
          continue; // Skip membership setup for failed users
        }
      } else {
        console.log(`   ✅ User created successfully!`);
        console.log(`   🆔 User ID: ${data.user.id}`);
        authUserId = data.user.id;
        userStatus = 'created';
      }

      // Setup user membership (for both new and existing users)
      if (authUserId) {
        console.log(`\n   🔗 Setting up organization membership...`);

        const { data: membershipData, error: membershipError } = await supabase.rpc('hera_onboard_user_v1', {
          p_actor_user_id: authUserId,
          p_organization_id: SALON_ORG_ID,
          p_supabase_user_id: authUserId
        });

        if (membershipError) {
          console.error(`   ❌ Membership setup failed: ${membershipError.message}`);
          results.push({
            email: user.email,
            role: user.role,
            status: userStatus,
            user_id: authUserId,
            membership_status: 'error',
            membership_error: membershipError.message
          });
        } else {
          console.log(`   ✅ Membership setup successful!`);
          if (membershipData) {
            console.log(`   📊 Membership ID: ${membershipData.membership_id || 'N/A'}`);
            console.log(`   👤 User Entity ID: ${membershipData.user_entity_id || 'N/A'}`);
          }
          results.push({
            email: user.email,
            role: user.role,
            status: userStatus,
            user_id: authUserId,
            membership_status: 'success',
            membership_data: membershipData
          });
        }
      }
    } catch (error) {
      console.error(`   ❌ Unexpected error: ${error.message}`);
      results.push({
        email: user.email,
        role: user.role,
        status: 'error',
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n\n📊 CREATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  const created = results.filter(r => r.status === 'created');
  const existing = results.filter(r => r.status === 'already_exists');
  const errors = results.filter(r => r.status === 'error');
  const membershipSuccess = results.filter(r => r.membership_status === 'success');
  const membershipErrors = results.filter(r => r.membership_status === 'error');

  console.log(`✅ Users Created: ${created.length}`);
  console.log(`⚠️  Users Already Exist: ${existing.length}`);
  console.log(`❌ User Creation Errors: ${errors.length}`);
  console.log(`🔗 Memberships Created: ${membershipSuccess.length}`);
  console.log(`❌ Membership Errors: ${membershipErrors.length}\n`);

  console.log('USER CREDENTIALS FOR LOGIN:');
  console.log('═══════════════════════════════════════════════════════\n');

  users.forEach((user, index) => {
    const result = results[index];
    const icon = user.role === 'owner' ? '👑' : '📋';
    console.log(`${icon} ${user.role.toUpperCase()}: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log(`   User Status: ${result.status}`);
    if (result.user_id) {
      console.log(`   Auth User ID: ${result.user_id}`);
    }
    if (result.membership_status) {
      console.log(`   Membership Status: ${result.membership_status}`);
    }
    if (result.membership_data?.user_entity_id) {
      console.log(`   User Entity ID: ${result.membership_data.user_entity_id}`);
    }
    if (result.membership_data?.membership_id) {
      console.log(`   Membership ID: ${result.membership_data.membership_id}`);
    }
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('🏢 Organization: HERA Salon');
  console.log(`🆔 Organization ID: ${SALON_ORG_ID}`);
  console.log('🔗 Login at: http://localhost:3000/salon-access');
  console.log('═══════════════════════════════════════════════════════\n');

  return results;
}

// Run the script
createSalonUsers()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
