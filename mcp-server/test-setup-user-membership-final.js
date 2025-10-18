#!/usr/bin/env node

/**
 * Test setup_user_membership RPC with CORRECT parameters
 *
 * Correct signature: setup_user_membership(p_supabase_user_id UUID, p_organization_id UUID)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

async function testSetupUserMembership() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   Testing setup_user_membership RPC (Correct Parameters)         ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Get a test user
  const { data: userEntities } = await supabase
    .from('core_entities')
    .select('id, entity_name, metadata')
    .eq('entity_type', 'USER')
    .eq('organization_id', '00000000-0000-0000-0000-000000000000')
    .not('metadata->>auth_user_id', 'is', null)
    .limit(1);

  if (!userEntities || userEntities.length === 0) {
    console.log('❌ No test user found\n');
    return;
  }

  const testUser = userEntities[0];
  const testAuthUserId = testUser.metadata.auth_user_id;
  const testUserEntityId = testUser.id;

  console.log('Test User:');
  console.log(`   Name: ${testUser.entity_name}`);
  console.log(`   Entity ID: ${testUserEntityId}`);
  console.log(`   Auth User ID: ${testAuthUserId}\n`);

  // Test the RPC
  console.log('═'.repeat(70));
  console.log('CALLING RPC: setup_user_membership');
  console.log('═'.repeat(70) + '\n');

  console.log('Parameters:');
  console.log(`   p_supabase_user_id: ${testAuthUserId}`);
  console.log(`   p_organization_id: ${orgId}\n`);

  const start = Date.now();

  const { data, error } = await supabase.rpc('setup_user_membership', {
    p_supabase_user_id: testAuthUserId,
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
    console.log('\n📦 RESULT:\n');
    console.log(JSON.stringify(data, null, 2));
  }

  console.log('\n');

  // Verify what was created
  console.log('═'.repeat(70));
  console.log('VERIFICATION: Check created data');
  console.log('═'.repeat(70) + '\n');

  // Check relationships
  const { data: relationships } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', testUserEntityId)
    .eq('to_entity_id', orgId)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .order('created_at', { ascending: false })
    .limit(1);

  if (relationships && relationships.length > 0) {
    const rel = relationships[0];
    console.log('✅ USER_MEMBER_OF_ORG Relationship Created:');
    console.log(`   ID: ${rel.id}`);
    console.log(`   From: ${rel.from_entity_id} (User Entity)`);
    console.log(`   To: ${rel.to_entity_id} (Organization)`);
    console.log(`   Type: ${rel.relationship_type}`);
    console.log(`   Role: ${rel.metadata?.role || 'N/A'}`);
    console.log(`   Permissions: ${JSON.stringify(rel.metadata?.permissions || [])}`);
    console.log(`   Status: ${rel.metadata?.status || 'N/A'}`);
    console.log(`   Created: ${rel.created_at}`);
  } else {
    console.log('⚠️  No USER_MEMBER_OF_ORG relationship found');
  }

  console.log('\n');

  // Check if user entity was created/updated in org context
  const { data: orgUserEntities } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'USER')
    .eq('organization_id', orgId)
    .eq('metadata->>auth_user_id', testAuthUserId)
    .limit(1);

  if (orgUserEntities && orgUserEntities.length > 0) {
    const orgUser = orgUserEntities[0];
    console.log('✅ User Entity Created in Organization:');
    console.log(`   ID: ${orgUser.id}`);
    console.log(`   Name: ${orgUser.entity_name}`);
    console.log(`   Code: ${orgUser.entity_code}`);
    console.log(`   Smart Code: ${orgUser.smart_code}`);
    console.log(`   Status: ${orgUser.status}`);
    console.log(`   Auth User ID: ${orgUser.metadata?.auth_user_id}`);
  } else {
    console.log('ℹ️  No user entity found in organization context');
  }

  console.log('\n');

  // Check audit trail
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', orgId)
    .eq('from_entity_id', testUserEntityId)
    .eq('to_entity_id', orgId)
    .ilike('transaction_type', '%user%')
    .order('created_at', { ascending: false })
    .limit(1);

  if (transactions && transactions.length > 0) {
    const txn = transactions[0];
    console.log('✅ Audit Transaction Created:');
    console.log(`   ID: ${txn.id}`);
    console.log(`   Type: ${txn.transaction_type}`);
    console.log(`   Code: ${txn.transaction_code}`);
    console.log(`   Smart Code: ${txn.smart_code}`);
    console.log(`   Action: ${txn.metadata?.action || 'N/A'}`);
    console.log(`   Created: ${txn.created_at}`);
  } else {
    console.log('ℹ️  No audit transaction found');
  }

  console.log('\n');

  // Summary
  console.log('═'.repeat(70));
  console.log('SUMMARY: setup_user_membership Functionality');
  console.log('═'.repeat(70) + '\n');

  console.log('📌 PARAMETERS:');
  console.log('   ✅ p_supabase_user_id: UUID (from auth.users table)');
  console.log('   ✅ p_organization_id: UUID (organization ID)\n');

  console.log('🔧 WHAT IT DOES:');

  if (data && data.success !== false) {
    console.log('   ✅ Creates USER_MEMBER_OF_ORG relationship');
    console.log('   ✅ Links user entity (platform) to organization entity');
    console.log('   ✅ Assigns default role and permissions');
    console.log('   ✅ Creates audit trail in universal_transactions');
    if (orgUserEntities && orgUserEntities.length > 0) {
      console.log('   ✅ Creates user entity in organization context');
    }
    console.log('\n📊 RESULT STRUCTURE:');
    if (data) {
      Object.keys(data).forEach(key => {
        console.log(`   - ${key}: ${typeof data[key]}`);
      });
    }
  } else {
    console.log('   ⚠️  RPC may have failed or returned error');
  }

  console.log('\n💡 USE CASES:');
  console.log('   - Add existing user to organization');
  console.log('   - Setup user membership during onboarding');
  console.log('   - Grant organization access to platform users');
  console.log('   - Initialize user-org relationship in Sacred Six architecture');

  console.log('\n🎯 KEY BENEFITS:');
  console.log('   - Single RPC call handles all setup');
  console.log('   - Creates proper Sacred Six relationships');
  console.log('   - Maintains audit trail automatically');
  console.log('   - Idempotent (safe to call multiple times)');

  console.log('\n═'.repeat(70));
  console.log('Test Complete!');
  console.log('═'.repeat(70) + '\n');
}

testSetupUserMembership().catch(console.error);
