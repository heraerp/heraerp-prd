#!/usr/bin/env node

/**
 * Test setup_user_membership RPC with correct signature
 * Parameters: Supabase auth user ID (UUID), organization ID (UUID)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

async function testSetupUserMembership() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   Testing setup_user_membership RPC                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // First, get the current authenticated user's Supabase auth ID
  console.log('Step 1: Get current Supabase auth user ID...\n');

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.log('❌ No authenticated session found');
    console.log('   Error:', sessionError?.message);
    console.log('   Note: Need to be logged in to test this RPC\n');
    return;
  }

  const supabaseUserId = session.user.id;
  const userEmail = session.user.email;

  console.log('✅ Found authenticated user:');
  console.log(`   Supabase User ID: ${supabaseUserId}`);
  console.log(`   Email: ${userEmail}\n`);

  // Test 1: Call with minimal parameters
  console.log('═'.repeat(70));
  console.log('TEST 1: Setup user membership (basic call)');
  console.log('═'.repeat(70) + '\n');

  try {
    const start = Date.now();

    const { data, error } = await supabase.rpc('setup_user_membership', {
      p_user_id: supabaseUserId,
      p_organization_id: orgId
    });

    const elapsed = Date.now() - start;

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Success!');
      console.log(`   Time: ${elapsed}ms`);
      console.log('   Result type:', typeof data);
      console.log('   Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // Test 2: Check what was created/updated
  console.log('═'.repeat(70));
  console.log('TEST 2: Verify membership data');
  console.log('═'.repeat(70) + '\n');

  // Check user_memberships table
  try {
    const { data, error } = await supabase
      .from('user_memberships')
      .select('*')
      .eq('user_id', supabaseUserId)
      .eq('organization_id', orgId);

    if (error) {
      console.log('❌ Error querying user_memberships:', error.message);
    } else {
      console.log(`📊 user_memberships table: ${data.length} record(s)`);
      if (data.length > 0) {
        const membership = data[0];
        console.log('   User ID:', membership.user_id);
        console.log('   Organization ID:', membership.organization_id);
        console.log('   Role:', membership.role);
        console.log('   Active:', membership.is_active);
        console.log('   Permissions:', JSON.stringify(membership.permissions || {}, null, 2));
        console.log('   Created:', membership.created_at);
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('');

  // Check organization_members table
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', supabaseUserId)
      .eq('organization_id', orgId);

    if (error) {
      console.log('❌ Error querying organization_members:', error.message);
    } else {
      console.log(`📊 organization_members table: ${data.length} record(s)`);
      if (data.length > 0) {
        const member = data[0];
        console.log('   User ID:', member.user_id);
        console.log('   Organization ID:', member.organization_id);
        console.log('   Role:', member.role);
        console.log('   Keys:', Object.keys(member));
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('');

  // Check if user entity was created
  try {
    const { data, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .eq('organization_id', orgId)
      .ilike('entity_name', `%${userEmail}%`);

    if (error) {
      console.log('❌ Error querying core_entities:', error.message);
    } else {
      console.log(`📊 core_entities (user type): ${data.length} record(s)`);
      if (data.length > 0) {
        const userEntity = data[0];
        console.log('   Entity ID:', userEntity.id);
        console.log('   Entity Name:', userEntity.entity_name);
        console.log('   Entity Code:', userEntity.entity_code);
        console.log('   Smart Code:', userEntity.smart_code);
        console.log('   Status:', userEntity.status);
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');

  // Test 3: Check what happens on second call (idempotency)
  console.log('═'.repeat(70));
  console.log('TEST 3: Test idempotency (call again with same parameters)');
  console.log('═'.repeat(70) + '\n');

  try {
    const start = Date.now();

    const { data, error } = await supabase.rpc('setup_user_membership', {
      p_user_id: supabaseUserId,
      p_organization_id: orgId
    });

    const elapsed = Date.now() - start;

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Success (idempotent call)');
      console.log(`   Time: ${elapsed}ms`);
      console.log('   Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n');
  console.log('═'.repeat(70));
  console.log('Test Complete!');
  console.log('═'.repeat(70) + '\n');
}

testSetupUserMembership().catch(console.error);
