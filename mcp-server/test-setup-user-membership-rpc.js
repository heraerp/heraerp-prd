#!/usr/bin/env node

/**
 * Discover and test setup_user_membership RPC
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const actorUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674';

async function discoverSetupUserMembership() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   Discovering setup_user_membership RPC                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Test 1: Empty call to discover signature
  console.log('═'.repeat(70));
  console.log('TEST 1: Discover Function Signature (empty call)');
  console.log('═'.repeat(70) + '\n');

  try {
    const { data, error } = await supabase.rpc('setup_user_membership', {});

    if (error) {
      console.log('Error:', error.message);
      console.log('Code:', error.code);
      console.log('Details:', error.details);
      console.log('Hint:', error.hint);
    } else {
      console.log('Success (unexpected):', data);
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }

  console.log('\n');

  // Test 2: Try with user_id only
  console.log('═'.repeat(70));
  console.log('TEST 2: With p_user_id only');
  console.log('═'.repeat(70) + '\n');

  try {
    const { data, error } = await supabase.rpc('setup_user_membership', {
      p_user_id: actorUserId
    });

    if (error) {
      console.log('Error:', error.message);
      console.log('Code:', error.code);
      console.log('Hint:', error.hint);
    } else {
      console.log('✅ Success!');
      console.log('Result:', data);
      console.log('Result type:', typeof data);
      console.log('Is array?', Array.isArray(data));
      if (data && typeof data === 'object') {
        console.log('Keys:', Object.keys(data));
      }
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }

  console.log('\n');

  // Test 3: Try with user_id and organization_id
  console.log('═'.repeat(70));
  console.log('TEST 3: With p_user_id and p_organization_id');
  console.log('═'.repeat(70) + '\n');

  try {
    const { data, error } = await supabase.rpc('setup_user_membership', {
      p_user_id: actorUserId,
      p_organization_id: orgId
    });

    if (error) {
      console.log('Error:', error.message);
      console.log('Code:', error.code);
    } else {
      console.log('✅ Success!');
      console.log('Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }

  console.log('\n');

  // Test 4: Try with all possible parameters
  console.log('═'.repeat(70));
  console.log('TEST 4: With p_user_id, p_organization_id, p_role');
  console.log('═'.repeat(70) + '\n');

  try {
    const { data, error } = await supabase.rpc('setup_user_membership', {
      p_user_id: actorUserId,
      p_organization_id: orgId,
      p_role: 'member'
    });

    if (error) {
      console.log('Error:', error.message);
      console.log('Code:', error.code);
    } else {
      console.log('✅ Success!');
      console.log('Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }

  console.log('\n');

  // Test 5: Check what tables might be involved
  console.log('═'.repeat(70));
  console.log('TEST 5: Check related tables (user_memberships, organization_members)');
  console.log('═'.repeat(70) + '\n');

  // Try to query user_memberships table
  try {
    const { data, error, count } = await supabase
      .from('user_memberships')
      .select('*', { count: 'exact', head: true })
      .limit(0);

    if (error) {
      console.log('user_memberships table:', error.message);
    } else {
      console.log('✅ user_memberships table exists');
      console.log('   Count:', count);
    }
  } catch (err) {
    console.log('user_memberships exception:', err.message);
  }

  // Try organization_members
  try {
    const { data, error, count } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .limit(0);

    if (error) {
      console.log('organization_members table:', error.message);
    } else {
      console.log('✅ organization_members table exists');
      console.log('   Count:', count);
    }
  } catch (err) {
    console.log('organization_members exception:', err.message);
  }

  // Try core_entity_relationships (might link user entity to org)
  try {
    const { data, error } = await supabase
      .from('core_entity_relationships')
      .select('*')
      .eq('source_entity_id', actorUserId)
      .eq('target_entity_id', orgId)
      .limit(5);

    if (error) {
      console.log('core_entity_relationships table:', error.message);
    } else {
      console.log('✅ core_entity_relationships table exists');
      console.log('   User-to-Org relationships:', data.length);
      if (data.length > 0) {
        console.log('   First relationship:');
        console.log('      Type:', data[0].relationship_type);
        console.log('      Smart Code:', data[0].smart_code);
        console.log('      Active:', data[0].is_active);
      }
    }
  } catch (err) {
    console.log('core_entity_relationships exception:', err.message);
  }

  console.log('\n');
  console.log('═'.repeat(70));
  console.log('Discovery Complete!');
  console.log('═'.repeat(70) + '\n');
}

discoverSetupUserMembership().catch(console.error);
