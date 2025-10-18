#!/usr/bin/env node

/**
 * Test setup_user_membership RPC directly in Supabase
 * This RPC was manually created in the database
 *
 * Signature: setup_user_membership(p_user_id UUID, p_organization_id UUID)
 * - p_user_id: Supabase auth user ID (from auth.users table)
 * - p_organization_id: Organization UUID
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

async function testSetupUserMembershipDirect() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   Testing setup_user_membership RPC (Direct Supabase Call)       ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Step 1: Get a Supabase auth user ID to test with
  console.log('Step 1: Find Supabase auth users...\n');

  try {
    // Query auth.users table to get actual user IDs
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.log('❌ Cannot list users:', usersError.message);
      console.log('   Trying with known user ID from entity...\n');
    } else {
      console.log(`✅ Found ${users.users.length} auth users in system`);
      if (users.users.length > 0) {
        const firstUser = users.users[0];
        console.log('   First user:');
        console.log(`      Auth ID: ${firstUser.id}`);
        console.log(`      Email: ${firstUser.email}`);
        console.log(`      Created: ${firstUser.created_at}\n`);
      }
    }

    // Get user from core_entities to find their auth_user_id
    const { data: userEntities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, metadata')
      .eq('entity_type', 'USER')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .limit(5);

    if (entitiesError) {
      console.log('❌ Error querying user entities:', entitiesError.message);
    } else {
      console.log(`📊 Found ${userEntities.length} user entities in platform org:`);
      userEntities.forEach((user, idx) => {
        const authUserId = user.metadata?.auth_user_id;
        console.log(`   ${idx + 1}. ${user.entity_name}`);
        console.log(`      Entity ID: ${user.id}`);
        console.log(`      Auth User ID: ${authUserId || 'NOT SET'}`);
      });
      console.log('');
    }

    // Use the first user entity with auth_user_id
    const testUser = userEntities.find(u => u.metadata?.auth_user_id);

    if (!testUser || !testUser.metadata?.auth_user_id) {
      console.log('⚠️  No user entity found with auth_user_id in metadata');
      console.log('   Cannot test without a valid Supabase auth user ID\n');
      return;
    }

    const testAuthUserId = testUser.metadata.auth_user_id;
    const testUserEntityId = testUser.id;

    console.log('Using test user:');
    console.log(`   Name: ${testUser.entity_name}`);
    console.log(`   Entity ID: ${testUserEntityId}`);
    console.log(`   Auth User ID: ${testAuthUserId}\n`);

    // Step 2: Call setup_user_membership RPC
    console.log('═'.repeat(70));
    console.log('TEST: Call setup_user_membership RPC');
    console.log('═'.repeat(70) + '\n');

    console.log('Parameters:');
    console.log(`   p_user_id: ${testAuthUserId}`);
    console.log(`   p_organization_id: ${orgId}\n`);

    const start = Date.now();

    const { data, error } = await supabase.rpc('setup_user_membership', {
      p_user_id: testAuthUserId,
      p_organization_id: orgId
    });

    const elapsed = Date.now() - start;

    if (error) {
      console.log('❌ RPC Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ RPC Success!');
      console.log(`   Time: ${elapsed}ms`);
      console.log('   Result type:', typeof data);
      console.log('   Result:\n');
      console.log(JSON.stringify(data, null, 2));
    }

    console.log('\n');

    // Step 3: Check what was created/modified
    console.log('═'.repeat(70));
    console.log('VERIFICATION: Check what the RPC created/modified');
    console.log('═'.repeat(70) + '\n');

    // Check core_relationships for USER_MEMBER_OF_ORG
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', testUserEntityId)
      .eq('to_entity_id', orgId)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG');

    if (relError) {
      console.log('❌ Error checking relationships:', relError.message);
    } else {
      console.log(`📊 USER_MEMBER_OF_ORG relationships: ${relationships.length}`);
      if (relationships.length > 0) {
        const rel = relationships[0];
        console.log('   Relationship:');
        console.log(`      ID: ${rel.id}`);
        console.log(`      From (User Entity): ${rel.from_entity_id}`);
        console.log(`      To (Organization): ${rel.to_entity_id}`);
        console.log(`      Type: ${rel.relationship_type}`);
        console.log(`      Metadata:`, JSON.stringify(rel.metadata, null, 6));
        console.log(`      Created: ${rel.created_at}`);
        console.log(`      Updated: ${rel.updated_at}`);
      }
    }

    console.log('');

    // Check if anything was created in user_memberships table
    const { data: memberships, error: membError } = await supabase
      .from('user_memberships')
      .select('*')
      .eq('user_id', testAuthUserId)
      .eq('organization_id', orgId);

    if (membError) {
      console.log('❌ Error checking user_memberships:', membError.message);
    } else {
      console.log(`📊 user_memberships records: ${memberships.length}`);
      if (memberships.length > 0) {
        const mem = memberships[0];
        console.log('   Membership:');
        console.log(`      User ID: ${mem.user_id}`);
        console.log(`      Organization ID: ${mem.organization_id}`);
        console.log(`      Role: ${mem.role}`);
        console.log(`      Active: ${mem.is_active}`);
        console.log(`      Permissions:`, JSON.stringify(mem.permissions, null, 6));
        console.log(`      Created: ${mem.created_at}`);
      }
    }

    console.log('\n');
    console.log('═'.repeat(70));
    console.log('SUMMARY: What does setup_user_membership do?');
    console.log('═'.repeat(70) + '\n');

    console.log('Based on the test results, setup_user_membership RPC:');
    console.log('');
    console.log('📌 INPUT:');
    console.log('   - p_user_id: Supabase auth user ID (UUID from auth.users)');
    console.log('   - p_organization_id: Organization UUID\n');

    console.log('🔧 FUNCTIONALITY:');
    if (relationships.length > 0 || memberships.length > 0) {
      console.log('   ✅ Creates/updates USER_MEMBER_OF_ORG relationship');
      console.log('   ✅ Links user entity to organization entity');
      if (memberships.length > 0) {
        console.log('   ✅ Creates/updates user_memberships table record');
      }
      console.log('   ✅ Sets up proper user access to organization\n');

      console.log('📊 RESULT:');
      console.log('   - User becomes member of the organization');
      console.log('   - User gets assigned a role (default or specified)');
      console.log('   - User gets permissions for the organization');
      console.log('   - Relationship is tracked in Sacred Six tables\n');
    } else {
      console.log('   ⚠️  Results unclear - check RPC implementation');
      console.log('   ⚠️  No relationships or memberships were created/found\n');
    }

    console.log('💡 USE CASES:');
    console.log('   - Onboarding new users to organizations');
    console.log('   - Adding existing users to additional organizations');
    console.log('   - Setting up multi-tenant user access');
    console.log('   - Initializing user permissions in org context\n');

  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
    console.log('   Stack:', err.stack);
  }

  console.log('═'.repeat(70));
  console.log('Test Complete!');
  console.log('═'.repeat(70) + '\n');
}

testSetupUserMembershipDirect().catch(console.error);
